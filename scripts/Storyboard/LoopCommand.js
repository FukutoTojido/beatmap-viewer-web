import { Storyboard, StoryboardSprite } from "./Storyboard";

export class LoopCommand {
    startTime;
    loopCount;
    commands;

    constructor({ startTime, loopCount, rawCommands }) {
        this.startTime = startTime;
        this.loopCount = loopCount;
        this.commands = this.parse(rawCommands);

        this.oneIterationStart = Math.min(
            ...Object.values(this.commands)
                .reduce((accm, curr) => [...accm, ...curr], [])
                .map((command) => command.startTime)
        );

        this.oneIterationEnd = Math.max(
            ...Object.values(this.commands)
                .reduce((accm, curr) => [...accm, ...curr], [])
                .map((command) => command.startTime + command.duration)
        );

        // console.log(this.commands, rawCommands, this.oneIterationStart, this.oneIterationEnd)

        this.duration = (this.oneIterationEnd - this.oneIterationStart) * this.loopCount;
        this.endTime = this.startTime + this.duration;
    }

    parse(raw) {
        const fade = (raw.match(new RegExp(`${Storyboard.REGEX.FADE.source}`, "gm")) ?? []).map((command) => StoryboardSprite.fadeParse(command));
        const move = (raw.match(new RegExp(`${Storyboard.REGEX.MOVE.source}`, "gm")) ?? []).map((command) => StoryboardSprite.moveParse(command));
        const moveX = (raw.match(new RegExp(`${Storyboard.REGEX.MOVE_X.source}`, "gm")) ?? []).map((command) =>
            StoryboardSprite.moveXParse(command)
        );
        const moveY = (raw.match(new RegExp(`${Storyboard.REGEX.MOVE_Y.source}`, "gm")) ?? []).map((command) =>
            StoryboardSprite.moveYParse(command)
        );
        const scale = (raw.match(new RegExp(`${Storyboard.REGEX.SCALE.source}`, "gm")) ?? []).map((command) => StoryboardSprite.scaleParse(command));
        const vector = (raw.match(new RegExp(`${Storyboard.REGEX.VECTOR.source}`, "gm")) ?? []).map((command) =>
            StoryboardSprite.vectorParse(command)
        );
        const rotate = (raw.match(new RegExp(`${Storyboard.REGEX.ROTATE.source}`, "gm")) ?? []).map((command) =>
            StoryboardSprite.rotateParse(command)
        );
        const colour = (raw.match(new RegExp(`${Storyboard.REGEX.COLOUR.source}`, "gm")) ?? []).map((command) =>
            StoryboardSprite.colourParse(command)
        );
        const parameter = (raw.match(new RegExp(`${Storyboard.REGEX.PARAMETER.source}`, "gm")) ?? []).map((command) =>
            StoryboardSprite.parameterParse(command)
        );

        return {
            fade,
            move,
            moveX,
            moveY,
            scale,
            vector,
            rotate,
            colour,
            parameter,
        };
    }

    execute(object, timestamp) {
        if (timestamp < this.startTime || timestamp > this.endTime) return;
        const loopTimestamp = (timestamp - this.startTime) % (this.oneIterationEnd - this.oneIterationStart);

        Object.values(this.commands).forEach((commandGroup) => {
            commandGroup.forEach((command, idx, arr) => {
                if (loopTimestamp < command.startTime && idx !== 0) return;
                if (idx !== 0 && arr[idx - 1].startTime === command.startTime && arr[idx - 1].duration === command.duration) return;
                command.execute(object, loopTimestamp);
            });
        });
    }
}