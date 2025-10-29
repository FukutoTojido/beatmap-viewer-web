import type SkinningConfig from "@/Config/SkinningConfig";
import type { Resource } from "@/ZipHandler";
import { inject } from "../Context";
import { getArgon, getDefaultLegacy, getYugen } from "../Initiator";
import Database from "./Database";
import Skin from "./Skin";

export type SkinEventCallback = (skin: Skin) => void;

export type SkinMetadata = {
	type: "DEFAULT" | "CUSTOM" | "ARGON";
	name: string;
	resources: Map<string, Resource>;
};

export default class SkinManager {
	skins: SkinMetadata[] = [];
	currentSkin!: Skin;
	defaultSkin!: Skin;
	indexed = new Database();

	private callbacks = new Set<SkinEventCallback>();

	constructor() {
		document.querySelector<HTMLButtonElement>("#reloadDefaultSkins")?.addEventListener("click", async () => {
			await this.indexed.remove("default");
			await this.indexed.remove("yugen");
			await this.indexed.remove("argon");

			await this.loadDefaultSkins();
			await this.refreshSkinList();

			const currentSkin = this.getCurrentSkin();
			if (currentSkin?.metadata?.type === "CUSTOM") return;

			const idx = this.skins.findIndex(skin => skin.name === currentSkin?.metadata?.name);
			if (idx === -1 || this.skins[idx].type === "CUSTOM") return;

			await this.loadSkin(idx);
		})
	}

	addSkinChangeListener(callback: SkinEventCallback) {
		this.callbacks.add(callback);
		return callback;
	}

	removeSkinChangeListener(callback: SkinEventCallback) {
		this.callbacks.delete(callback);
	}

	private emitSkinChange() {
		for (const callback of this.callbacks) {
			callback(this.getCurrentSkin());
		}
	}

	async loadSkins() {
		await this.indexed.init();
		await this.loadDefaultSkins();

		const skins = await this.indexed.getAll();
		this.skins.push(...(skins as SkinMetadata[]));

		await this.loadDefaultSkin();

		await Promise.all([
			this.refreshSkinList(),
			this.loadSkin(
				inject<SkinningConfig>("config/skinning")?.skinningIdx ?? 0,
			),
		]);

		inject<SkinningConfig>("config/skinning")?.onChange("skin", async (val) => {
			await this.loadSkin(val);
		});

		inject<SkinningConfig>("config/skinning")?.onChange(
			"disableBeatmapSkin",
			async () => {
				this.emitSkinChange();
			},
		);
	}

	getCurrentSkin(): Skin {
		return this.currentSkin;
	}

	async loadDefaultSkin() {
		const defaultSkin = this.skins.find(
			(skin) => skin.type === "DEFAULT" && skin.name === "Default",
		);
		this.defaultSkin = new Skin(defaultSkin?.resources);
		await this.defaultSkin.init();
	}

	async loadSkin(idx: number) {
		const selectedSkin = this.skins[idx];
		if (!selectedSkin) {
			// biome-ignore lint/style/noNonNullAssertion: Must have!
			inject<SkinningConfig>("config/skinning")!.skinningIdx = 0;
			return;
		}

		if (selectedSkin.type === "DEFAULT" && selectedSkin.name === "Default") {
			this.currentSkin = this.defaultSkin;
		} else {
			this.currentSkin = new Skin(selectedSkin?.resources, selectedSkin);
			await this.currentSkin.init();
		}

		const el = document.querySelector<HTMLSpanElement>("#currentSkin");
		if (el) el.innerHTML = selectedSkin.name;

		this.emitSkinChange();
	}

	async addSkin(resources: Map<string, Resource>) {
		const skin = new Skin(resources);
		await skin.init();

		const metadata: SkinMetadata = { type: "CUSTOM", name: skin.config.General.Name, resources }

		await this.indexed.add(
			metadata,
			`${skin.config.General.Name}-${Date.now()}`,
		);

		skin.metadata = metadata;

		this.currentSkin = skin;

		const el = document.querySelector<HTMLSpanElement>("#currentSkin");
		if (el) el.innerHTML = skin.config.General.Name;

		await this.refreshSkinList();
		this.emitSkinChange();
	}

	async removeSkin(key: string) {
		await this.indexed.remove(key);
		await this.refreshSkinList();
		await this.loadSkin(0);
	}

	async refreshSkinList() {
		const [skins, key] = await Promise.all([
			this.indexed.getAll(),
			this.indexed.getAllKeys(),
		]);

		this.skins = [...(skins as SkinMetadata[])];

		// console.log(this.skins);

		const el = document.querySelector<HTMLDivElement>("#skinsContainer");
		if (el) el.innerHTML = "";

		for (let i = 0; i < this.skins.length; i++) {
			const skin = this.skins[i];
			const div = document.createElement("div");
			div.className = "flex gap-2.5 items-center";

			const button = document.createElement("button");
			button.className =
				"flex w-full items-center gap-2.5 p-2.5 hover:bg-white/10 cursor-pointer transition-colors rounded-[10px] text-white";
			button.innerHTML = skin.name;
			button.addEventListener("click", () => {
				// biome-ignore lint/style/noNonNullAssertion: This is ensured to be loaded
				inject<SkinningConfig>("config/skinning")!.skinningIdx = i;
				document
					.querySelector<HTMLDivElement>("#skinsContainer")
					?.classList.add("hidden");
				document
					.querySelector<HTMLDivElement>("#skinsContainer")
					?.classList.remove("flex");
			});

			const button2 = document.createElement("button");
			button2.innerHTML = `<i class="ri-delete-bin-6-fill"></i>`;
			button2.className =
				"h-full hover:bg-white/10 p-2.5 flex items-center justify-center rounded-[10px] cursor-pointer transition-colors text-white";
			button2.style.aspectRatio = "1 / 1";
			button2.addEventListener("click", () => {
				this.removeSkin((key as string[])[i]);

				document
					.querySelector<HTMLDivElement>("#skinsContainer")
					?.classList.add("hidden");
				document
					.querySelector<HTMLDivElement>("#skinsContainer")
					?.classList.remove("flex");
			});

			div?.append(button);
			if (skin.type === "CUSTOM") div?.append(button2);
			el?.append(div);
		}
	}

	async loadDefaultSkins() {
		const allKeys = await this.indexed.getAllKeys();

		if (!(allKeys as unknown[]).includes("default")) {
			await this.indexed.add(
				{
					type: "DEFAULT",
					name: "Default",
					resources: await getDefaultLegacy(),
				},
				"default",
			);
		}

		if (!(allKeys as unknown[]).includes("yugen")) {
			await this.indexed.add(
				{ type: "DEFAULT", name: "YUGEN", resources: await getYugen() },
				"yugen",
			);
		}

		if (!(allKeys as unknown[]).includes("argon")) {
			await this.indexed.add(
				{
					type: "ARGON",
					name: "Argon",
					resources: await getArgon(),
				},
				"argon",
			);
		}
	}
}
