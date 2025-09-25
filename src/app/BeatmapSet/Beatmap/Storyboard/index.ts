import IntervalTree from "@flatten-js/interval-tree";
import type { Storyboard as StoryboardData } from "@rian8337/osu-base";
import {
	StoryboardAnimation as StoryboardAnimationData,
	StoryboardDecoder,
	StoryboardLayerType,
	StoryboardSprite as StoryboardSpriteData,
} from "@rian8337/osu-base";
import {
	Assets,
	Container,
	Graphics,
	GraphicsContext,
	Rectangle,
	type Texture,
} from "pixi.js";
import type BeatmapSet from "@/BeatmapSet";
import type BackgroundConfig from "@/Config/BackgroundConfig";
import { inject, ScopedClass } from "@/Context";
import type { Resource } from "@/ZipHandler";
import { StoryboardAnimation } from "./StoryboardAnimation";
import StoryboardSprite from "./StoryboardSprite";

export default class Storyboard extends ScopedClass {
	private data!: StoryboardData;
	private sprites!: StoryboardSprite[];
	private masterData!: StoryboardData;
	private masterSprites!: StoryboardSprite[];
	container: Container = new Container({
		label: "storyboard",
		isRenderGroup: true,
		visible: inject<BackgroundConfig>("config/background")?.storyboard
	});

	backgroundLayer = new Container({
		label: "backgroundLayer",
		interactive: false,
		interactiveChildren: false,
		isRenderGroup: true,
		sortableChildren: true,
	});
	foregroundLayer = new Container({
		label: "foregroundLayer",
		interactive: false,
		interactiveChildren: false,
		isRenderGroup: true,
		sortableChildren: false,
	});
	overlayLayer = new Container({
		label: "overlayLayer",
		interactive: false,
		interactiveChildren: false,
		isRenderGroup: true,
		sortableChildren: false,
	});

	fill: Graphics;

	constructor(private blob: Blob) {
		super();

		const mask = new Graphics()
			.rect(-106.666666667, 0, 853.333333333, 480)
			.fill({
				color: 0x0,
				alpha: 0.01,
			});

		this.fill = new Graphics()
			.rect(-106.666666667, 0, 853.333333333, 480)
			.fill({
				color: 0x0,
				alpha: 0,
			});

		this.container.addChild(
			mask,
			this.fill,
			this.backgroundLayer,
			this.foregroundLayer,
			this.overlayLayer,
		);

		this.container.boundsArea = new Rectangle(
			-106.666666667,
			0,
			853.333333333,
			480,
		);
		this.container.mask = mask;

		inject<BackgroundConfig>("config/background")?.onChange("storyboard", (val) => {
			this.container.visible = val;
		})
	}

	async loadTextures() {
		const textureMap = new Map<string, Texture>();
		const promises = [
			// biome-ignore lint/style/noNonNullAssertion: Hooked
			...this.context.consume<Map<string, Resource>>("resources")!,
		].map(async ([key, resource]) => {
			// biome-ignore lint/style/noNonNullAssertion: Always have extension
			if (!["png", "jpg", "jpeg"].includes(key.split(".").at(-1)!.toLowerCase())) return;

			const texture = await Assets.load<Texture>({
				// biome-ignore lint/style/noNonNullAssertion: Should be able to be found
				src: URL.createObjectURL(resource!),
				parser: "texture",
			});

			textureMap.set(key.toLowerCase(), texture);
		});

		await Promise.all(promises);
		this.context.provide("textures", textureMap);
	}

	private async load(raw: string) {
		const decoder = new StoryboardDecoder();
		const data = decoder.decode(raw).result;

		const sprites = await Promise.all([
			...[...(data.layers.Background?.elements ?? [])]
				.filter((element) => element instanceof StoryboardSpriteData)
				.map((element) => {
					const ele = (
						element instanceof StoryboardAnimationData
							? new StoryboardAnimation(element, StoryboardLayerType.background)
							: new StoryboardSprite(element, StoryboardLayerType.background)
					).hook(this.context);
					ele.loadTexture();

					return ele;
				}),
			...[...(data.layers.Foreground?.elements ?? [])]
				.filter((element) => element instanceof StoryboardSpriteData)
				.map((element) => {
					const ele = (
						element instanceof StoryboardAnimationData
							? new StoryboardAnimation(element, StoryboardLayerType.foreground)
							: new StoryboardSprite(element, StoryboardLayerType.foreground)
					).hook(this.context);
					ele.loadTexture();

					return ele;
				}),
			...[...(data.layers.Overlay?.elements ?? [])]
				.filter((element) => element instanceof StoryboardSpriteData)
				.map((element) => {
					const ele = (
						element instanceof StoryboardAnimationData
							? new StoryboardAnimation(element, StoryboardLayerType.overlay)
							: new StoryboardSprite(element, StoryboardLayerType.overlay)
					).hook(this.context);
					ele.loadTexture();

					return ele;
				}),
		]);

		const s = sprites.map((sprite, idx) => {
			sprite.order = idx;
			return sprite;
		});

		const tree = new IntervalTree<number>();
		for (let i = 0; i < sprites.length; i++) {
			const { startTime, endTime } = sprites[i];
			tree.insert([startTime, endTime], i);
		}

		return {
			data,
			sprites: s,
			tree,
		};
	}

	private _masterTree?: IntervalTree;
	async loadMaster(raw: string) {
		const { data, sprites, tree } = await this.load(raw);

		if (this._masterTree) {
			this._masterTree.clear();
			this._masterTree = undefined;
		}

		if (this.masterSprites) {
			for (const sprite of this.masterSprites) {
				// Destroy
				switch (sprite.layerType) {
					case StoryboardLayerType.background: {
						this.backgroundLayer.removeChild(sprite.container);
						break;
					}
					case StoryboardLayerType.foreground: {
						this.foregroundLayer.removeChild(sprite.container);
						break;
					}
					case StoryboardLayerType.overlay: {
						this.overlayLayer.removeChild(sprite.container);
						break;
					}
				}

				sprite.destroy();
			}

			this.masterSprites = [];
		}

		this.masterData = data;
		this.masterSprites = sprites;
		this._masterTree = tree;
	}

	private _tree?: IntervalTree;
	async loadCurrent() {
		const raw = await this.blob.text();
		const { data, sprites, tree } = await this.load(raw);

		this.data = data;
		this.sprites = sprites;
		this._tree = tree;
	}

	private _previous = new Set<number>();
	private _previousMaster = new Set<number>();

	update(timestamp: number) {
		if (!inject<BackgroundConfig>("config/background")?.storyboard) return;
		
		const set = new Set<number>(
			this._tree?.search([timestamp - 1, timestamp + 1]) as Array<number>,
		);
		const setMaster = new Set<number>(
			this._masterTree?.search([timestamp - 1, timestamp + 1]) as Array<number>,
		);

		const disposed = this._previous.difference(set);
		const disposedMaster = this._previousMaster.difference(setMaster);

		for (const idx of disposed) {
			const sprite = this.sprites[idx];
			sprite.off();

			switch (sprite.layerType) {
				case StoryboardLayerType.background: {
					this.backgroundLayer.removeChild(sprite.container);
					break;
				}
				case StoryboardLayerType.foreground: {
					this.foregroundLayer.removeChild(sprite.container);
					break;
				}
				case StoryboardLayerType.overlay: {
					this.overlayLayer.removeChild(sprite.container);
					break;
				}
			}
		}

		for (const idx of disposedMaster) {
			const sprite = this.masterSprites[idx];
			sprite?.off();

			if (!sprite) continue;
			switch (sprite.layerType) {
				case StoryboardLayerType.background: {
					this.backgroundLayer.removeChild(sprite.container);
					break;
				}
				case StoryboardLayerType.foreground: {
					this.foregroundLayer.removeChild(sprite.container);
					break;
				}
				case StoryboardLayerType.overlay: {
					this.overlayLayer.removeChild(sprite.container);
					break;
				}
			}
		}

		const added = set.difference(this._previous);
		const addedMaster = setMaster.difference(this._previousMaster);

		this._previous = set;
		this._previousMaster = setMaster;

		const bgs = [];
		const fgs = [];
		const ovs = [];

		for (const idx of addedMaster) {
			const sprite = this.masterSprites[idx];
			if (!sprite) continue;

			switch (sprite.layerType) {
				case StoryboardLayerType.background: {
					bgs.push(sprite.container);
					break;
				}
				case StoryboardLayerType.foreground: {
					fgs.push(sprite.container);
					break;
				}
				case StoryboardLayerType.overlay: {
					ovs.push(sprite.container);
					break;
				}
			}
		}

		for (const idx of added) {
			const sprite = this.sprites[idx];

			switch (sprite.layerType) {
				case StoryboardLayerType.background: {
					bgs.push(sprite.container);
					break;
				}
				case StoryboardLayerType.foreground: {
					fgs.push(sprite.container);
					break;
				}
				case StoryboardLayerType.overlay: {
					ovs.push(sprite.container);
					break;
				}
			}
		}

		for (const idx of setMaster) {
			const sprite = this.masterSprites[idx];
			sprite?.update(timestamp);
		}

		for (const idx of set) {
			const sprite = this.sprites[idx];
			sprite.update(timestamp);
		}

		if (bgs.length > 0) this.backgroundLayer.addChild(...bgs);
		if (fgs.length > 0) this.foregroundLayer.addChild(...fgs);
		if (ovs.length > 0) this.overlayLayer.addChild(...ovs);
	}

	sortChildren() {
		const arr = [...this.masterSprites, ...this.sprites];
		for (let i = 0; i < arr.length; i++) {
			arr[i].container.zIndex = i;
		}
	}

	checkRemoveBG() {
		const hasBG = this.sprites.some(
			(sprite) =>
				sprite.data.path.replaceAll("\\", "/") ===
				this.context.consume<BeatmapSet>("beatmapset")?.backgroundKey,
		);

		const context = new GraphicsContext()
			.rect(-106.666666667, 0, 853.333333333, 480)
			.fill({
				color: 0x0,
				alpha: hasBG ? 1 : 0,
			});

		this.fill.context.destroy();
		this.fill.context = context;
	}

	destroy() {
		for (const sprite of this.masterSprites) {
			sprite.destroy()
		}

		for (const sprite of this.sprites) {
			sprite.destroy();
		}

		this.foregroundLayer.destroy();
		this.backgroundLayer.destroy();
		this.overlayLayer.destroy();
		this.container.destroy();
	}
}
