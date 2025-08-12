import type { Resource } from "@/ZipHandler";
import { inject, provide } from "../Context";
import { getDefaultLegacy, getYugen } from "../Initiator";
import Database from "./Database";
import Skin from "./Skin";
import type SkinningConfig from "@/Config/SkinningConfig";

export type SkinEventCallback = (skin: Skin) => void;

type SkinMetadata = {
	type: "DEFAULT" | "CUSTOM" | "ARGON";
	name: string;
	resources: Map<string, Resource>;
};

export default class SkinManager {
	skins: SkinMetadata[] = [];
	currentSkin!: Skin;
	indexed = new Database();

	private callbacks = new Set<SkinEventCallback>();

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

		const skins = await this.indexed.getAll();
		this.skins.push(...(skins as SkinMetadata[]));

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

	async loadSkin(idx: number) {
		this.currentSkin = new Skin(this.skins[idx].resources);
		await this.currentSkin.init();

		const el = document.querySelector<HTMLSpanElement>("#currentSkin");
		if (el) el.innerHTML = this.skins[idx].name;

		this.emitSkinChange();
	}

	async addSkin(resources: Map<string, Resource>) {
		const skin = new Skin(resources);
		await this.indexed.add(
			{ type: "CUSTOM", name: skin.config.General.Name, resources },
			"default",
		);

		this.currentSkin = skin;
		await this.refreshSkinList();
		this.emitSkinChange();
	}

	async removeSkin(key: string) {
		await this.loadSkin(0);
		await this.indexed.remove(key);
		await this.refreshSkinList();
	}

	async refreshSkinList() {
		const [skins, key] = await Promise.all([
			this.indexed.getAll(),
			this.indexed.getAllKeys(),
		]);

		const el = document.querySelector<HTMLDivElement>("#skinsContainer");
		if (el) el.innerHTML = "";

		for (let i = 0; i < (skins as SkinMetadata[]).length; i++) {
			const skin = (skins as SkinMetadata[])[i];
			const div = document.createElement("div");
			div.className = "flex gap-2.5 items-center";

			const button = document.createElement("button");
			button.className =
				"flex w-full items-center gap-2.5 p-2.5 hover:bg-white/10 cursor-pointer transition-colors rounded-[10px] text-white";
			button.innerHTML = skin.name;
			button.addEventListener("click", () => {
				this.loadSkin(i);
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
}
