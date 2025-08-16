import { Context, ScopedClass } from "@/Context";
import type { Resource } from "@/ZipHandler";
import {
	type ICommandTimeline,
	type StoryboardSprite as StoryboardSpriteData,
	Anchor,
	type CommandTimeline,
	BlendingEquation,
	type CommandLoop,
	type Command,
	type Vector2,
	type RGBColor,
	type BlendingParameters,
	type CommandTimelineGroup,
	type StoryboardLayerType,
} from "@rian8337/osu-base";

import { Assets, Sprite, type Texture } from "pixi.js";
import { EasingsMap } from "@/UI/Easings";

export default class StoryboardSprite extends ScopedClass {
	container: Sprite = new Sprite({
		visible: false,
	});
	order = 0;
	startTime = 0;
	endTime = 0;

	constructor(
		public data: StoryboardSpriteData,
		public layerType: StoryboardLayerType,
	) {
		super();
		this.container.interactive = false;
		this.container.interactiveChildren = false;

		switch (data.origin) {
			case Anchor.topLeft: {
				this.container.anchor.set(0);
				break;
			}
			case Anchor.center: {
				this.container.anchor.set(0.5);
				break;
			}
			case Anchor.centerLeft: {
				this.container.anchor.set(0, 0.5);
				break;
			}
			case Anchor.topRight: {
				this.container.anchor.set(1, 0);
				break;
			}
			case Anchor.bottomCenter: {
				this.container.anchor.set(0.5, 1);
				break;
			}
			case Anchor.topCenter: {
				this.container.anchor.set(0.5, 0);
				break;
			}
			case Anchor.centerRight: {
				this.container.anchor.set(1, 0.5);
				break;
			}
			case Anchor.bottomLeft: {
				this.container.anchor.set(0, 1);
				break;
			}
			case Anchor.bottomRight: {
				this.container.anchor.set(1);
			}
		}

		this.container.position.set(data.initialPosition.x, data.initialPosition.y);
		this.container.label = data.path.replaceAll("\\", "/");

		const { startTime, endTime } = this.timeRange();
		this.startTime = startTime;
		this.endTime = endTime;
	}

	timeRange() {
		const allCommands = [
			...this.data.timelineGroup.alpha.commands,
			...this.data.timelineGroup.blendingParameters.commands,
			...this.data.timelineGroup.color.commands,
			...this.data.timelineGroup.flipHorizontal.commands,
			...this.data.timelineGroup.flipVertical.commands,
			...this.data.timelineGroup.move.commands,
			...this.data.timelineGroup.rotation.commands,
			...this.data.timelineGroup.scale.commands,
			...this.data.timelineGroup.vectorScale.commands,
			...this.data.timelineGroup.x.commands,
			...this.data.timelineGroup.y.commands,
			...this.data.loops,
		];

		const startTime =
			Math.min(...allCommands.map((command) => command.startTime)) - 50;
		const endTime = Math.max(...allCommands.map((command) => command.endTime));

		return {
			startTime,
			endTime,
		};
	}

	loadTexture() {
		const textures = this.context.consume<Map<string, Texture>>("textures");
		if (!textures) return;

		const texture = textures.get(
			this.data.path.replaceAll("\\", "/").toLowerCase(),
		);
		if (!texture) return;

		this.container.texture = texture;
	}

	update(timestamp: number) {
		if (timestamp > this.startTime + 50 && this.container.visible === false) {
			this.container.visible = true;
		}

		if (timestamp < this.startTime) {
			return;
		}

		const groups = this.data.timelineGroup;
		this.processGroups(groups, timestamp);

		for (const command of this.data.loops) {
			this.processLoop(command, timestamp);
		}
	}

	processGroups(groups: CommandTimelineGroup, timestamp: number) {
		if (groups.alpha.hasCommands) {
			const nearestCommand = this.getNearestCommand(timestamp, groups.alpha);
			this.processAlpha(timestamp, nearestCommand);
		}

		if (groups.move.hasCommands) {
			const nearestCommand = this.getNearestCommand(timestamp, groups.move);
			this.processMove(timestamp, nearestCommand);
		}

		if (groups.scale.hasCommands) {
			const nearestCommand = this.getNearestCommand(timestamp, groups.scale);
			this.processScale(timestamp, nearestCommand);
		}

		if (groups.vectorScale.hasCommands) {
			const nearestCommand = this.getNearestCommand(
				timestamp,
				groups.vectorScale,
			);
			this.processVectorScale(timestamp, nearestCommand);
		}

		if (groups.rotation.hasCommands) {
			const nearestCommand = this.getNearestCommand(timestamp, groups.rotation);
			this.processRotate(timestamp, nearestCommand);
		}

		if (groups.color.hasCommands) {
			const nearestCommand = this.getNearestCommand(timestamp, groups.color);
			this.processColor(timestamp, nearestCommand);
		}

		if (groups.x.hasCommands) {
			const nearestCommand = this.getNearestCommand(timestamp, groups.x);
			this.processMoveX(timestamp, nearestCommand);
		}

		if (groups.y.hasCommands) {
			const nearestCommand = this.getNearestCommand(timestamp, groups.y);
			this.processMoveY(timestamp, nearestCommand);
		}

		if (groups.blendingParameters.hasCommands) {
			const nearestCommand = this.getNearestCommand(
				timestamp,
				groups.blendingParameters,
			);
			this.processBlending(timestamp, nearestCommand);
		}

		if (groups.flipHorizontal.hasCommands) {
			const nearestCommand = this.getNearestCommand(
				timestamp,
				groups.flipHorizontal,
			);
			this.processFlipHorizontal(timestamp, nearestCommand);
		}

		if (groups.flipVertical.hasCommands) {
			const nearestCommand = this.getNearestCommand(
				timestamp,
				groups.flipVertical,
			);
			this.processFlipVerticle(timestamp, nearestCommand);
		}
	}

	processAlpha(timestamp: number, command: Command<number>) {
		const nearestCommand = command;
		const { startValue, endValue, startTime, endTime, duration, easing } =
			nearestCommand;
		const easingFunction = EasingsMap[easing];

		if (timestamp < startTime) {
			this.container.alpha = startValue;
			return;
		}

		if (startTime <= timestamp && timestamp <= endTime) {
			const progress = easingFunction(
				duration !== 0 ? (timestamp - startTime) / duration : 0,
			);
			this.container.alpha = this.lerp(progress, startValue, endValue);

			return;
		}

		if (endTime < timestamp) {
			this.container.alpha = endValue;
			return;
		}
	}

	processMove(timestamp: number, command: Command<Vector2>) {
		const nearestCommand = command;
		const { startValue, endValue, startTime, endTime, duration, easing } =
			nearestCommand;
		const easingFunction = EasingsMap[easing];

		if (timestamp < startTime) {
			this.container.position.set(startValue.x, endValue.x);
			return;
		}

		if (startTime <= timestamp && timestamp <= endTime) {
			const progress = easingFunction(
				duration !== 0 ? (timestamp - startTime) / duration : 0,
			);

			const { x: _x, y: x } = startValue;
			const { x: _y, y } = endValue;

			this.container.position.set(
				this.lerp(progress, _x, x),
				this.lerp(progress, _y, y),
			);

			return;
		}

		if (endTime < timestamp) {
			this.container.position.set(startValue.y, endValue.y);
			return;
		}
	}

	processScale(timestamp: number, command: Command<number>) {
		const nearestCommand = command;
		const { startValue, endValue, startTime, endTime, duration, easing } =
			nearestCommand;
		const easingFunction = EasingsMap[easing];

		if (timestamp < startTime) {
			this.container.scale.set(startValue);
			return;
		}

		if (startTime <= timestamp && timestamp <= endTime) {
			const progress = easingFunction(
				duration !== 0 ? (timestamp - startTime) / duration : 0,
			);
			this.container.scale.set(this.lerp(progress, startValue, endValue));

			return;
		}

		if (endTime < timestamp) {
			this.container.scale.set(endValue);
			return;
		}
	}

	processVectorScale(timestamp: number, command: Command<Vector2>) {
		const nearestCommand = command;
		const { startValue, endValue, startTime, endTime, duration, easing } =
			nearestCommand;
		const easingFunction = EasingsMap[easing];

		if (timestamp < startTime) {
			this.container.scale.set(startValue.x, startValue.y);
			return;
		}

		if (startTime <= timestamp && timestamp <= endTime) {
			const progress = easingFunction(
				duration !== 0 ? (timestamp - startTime) / duration : 0,
			);
			const { x: _x, y: _y } = startValue;
			const { x, y } = endValue;

			this.container.scale.set(
				this.lerp(progress, _x, x),
				this.lerp(progress, _y, y),
			);

			return;
		}

		if (endTime < timestamp) {
			this.container.scale.set(endValue.x, endValue.y);
			return;
		}
	}

	processRotate(timestamp: number, command: Command<number>) {
		const nearestCommand = command;
		const { startValue, endValue, startTime, endTime, duration, easing } =
			nearestCommand;
		const easingFunction = EasingsMap[easing];

		if (timestamp < startTime) {
			this.container.angle = startValue;
			return;
		}

		if (startTime <= timestamp && timestamp <= endTime) {
			const progress = easingFunction(
				duration !== 0 ? (timestamp - startTime) / duration : 0,
			);
			this.container.angle = this.lerp(progress, startValue, endValue);

			return;
		}

		if (endTime < timestamp) {
			this.container.angle = endValue;
			return;
		}
	}

	processColor(timestamp: number, command: Command<RGBColor>) {
		const nearestCommand = command;
		const { startValue, endValue, startTime, endTime, duration, easing } =
			nearestCommand;
		const easingFunction = EasingsMap[easing];

		if (timestamp < startTime) {
			const { r, g, b } = startValue;
			this.container.tint = {
				r,
				g,
				b,
			};
			return;
		}

		if (startTime <= timestamp && timestamp <= endTime) {
			const progress = easingFunction(
				duration !== 0 ? (timestamp - startTime) / duration : 0,
			);
			const { r: _r, g: _g, b: _b } = startValue;
			const { r, g, b } = endValue;

			this.container.tint = {
				r: this.lerp(progress, _r, r),
				g: this.lerp(progress, _g, g),
				b: this.lerp(progress, _b, b),
			};

			return;
		}

		if (endTime < timestamp) {
			const { r, g, b } = endValue;
			this.container.tint = {
				r,
				g,
				b,
			};
			return;
		}
	}

	processMoveX(timestamp: number, command: Command<number>) {
		const nearestCommand = command;
		const { startValue, endValue, startTime, endTime, duration, easing } =
			nearestCommand;
		const easingFunction = EasingsMap[easing];

		if (timestamp < startTime) {
			this.container.x = startValue;
			return;
		}

		if (startTime <= timestamp && timestamp <= endTime) {
			const progress = easingFunction(
				duration !== 0 ? (timestamp - startTime) / duration : 0,
			);
			this.container.x = this.lerp(progress, startValue, endValue);

			return;
		}

		if (endTime < timestamp) {
			this.container.x = endValue;
			return;
		}
	}

	processMoveY(timestamp: number, command: Command<number>) {
		const nearestCommand = command;
		const { startValue, endValue, startTime, endTime, duration, easing } =
			nearestCommand;
		const easingFunction = EasingsMap[easing];

		if (timestamp < startTime) {
			this.container.y = startValue;
			return;
		}

		if (startTime <= timestamp && timestamp <= endTime) {
			const progress = easingFunction(
				duration !== 0 ? (timestamp - startTime) / duration : 0,
			);
			this.container.y = this.lerp(progress, startValue, endValue);

			return;
		}

		if (endTime < timestamp) {
			this.container.y = endValue;
			return;
		}
	}

	processBlending(timestamp: number, command: Command<BlendingParameters>) {
		const nearestCommand = command;
		const { startTime } = nearestCommand;

		if (timestamp < startTime) {
			this.container.blendMode = "normal";
			return;
		}

		this.container.blendMode = "add";
	}

	processFlipHorizontal(timestamp: number, command: Command<boolean>) {
		const { startValue, endValue, startTime, endTime, duration } = command;

		if (timestamp <= endTime) {
			this.container.scale.x *= startValue ? -1 : 1;
			return;
		}

		if (timestamp > endTime) {
			this.container.scale.x *= endValue ? -1 : 1;
			return;
		}
	}

	processFlipVerticle(timestamp: number, command: Command<boolean>) {
		const { startValue, endValue, startTime, endTime, duration } = command;

		if (timestamp <= endTime) {
			this.container.scale.y *= startValue ? -1 : 1;
			return;
		}

		if (timestamp > endTime) {
			this.container.scale.y *= endValue ? -1 : 1;
			return;
		}
	}

	processLoop(command: CommandLoop, timestamp: number) {
		const { startTime, endTime, totalIterations } = command;
		const duration = (endTime - startTime) / totalIterations;

		const t =
			(Math.max(0, Math.min(timestamp, endTime - 1)) - startTime) % duration;
		this.processGroups(command, t);
	}

	private getNearestCommand<T>(
		timestamp: number,
		commandGroup: CommandTimeline<T>,
	) {
		let idx = 0;
		let holdIdx = 0;
		for (let i = 0; i < commandGroup.commands.length; i++) {
			if (commandGroup.commands[i].startTime >= timestamp) break;
			if (
				commandGroup.commands[i].startTime !==
					commandGroup.commands[holdIdx].startTime ||
				commandGroup.commands[i].endTime !==
					commandGroup.commands[holdIdx].endTime
			) {
				holdIdx = i;
			}
			idx = i;
		}

		return commandGroup.commands[holdIdx];
	}

	private lerp(progress: number, start: number, end: number) {
		return start + (end - start) * Math.min(1, Math.max(0, progress));
	}

	destroy() {
		this.container.destroy();
	}

	off() {
		this.container.visible = false;
	}
}
