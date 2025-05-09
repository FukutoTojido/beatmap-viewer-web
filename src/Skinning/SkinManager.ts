import { provide } from "../Context";
import { getDefaultLegacy, getYugen } from "../Initiator";
import Skin from "./Skin";

export type SkinEventCallback = (skin: Skin) => void

export default class SkinManager {
	skins: Skin[] = [];
    currentSkinIdx = 0;

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
		const defaultResources = await getDefaultLegacy();
		const yugenResources = await getYugen();
		this.skins.push(new Skin(defaultResources), new Skin(yugenResources));

        await Promise.all(this.skins.map(async (skin) => await skin.init()));
		console.log(this.skins);

		document.querySelector<HTMLButtonElement>("#toggleSkin")?.addEventListener("click", () => this.switchSkin())
	}

	getCurrentSkin(): Skin {
		return this.skins[this.currentSkinIdx];
	}

    switchSkin() {
        this.currentSkinIdx = +!this.currentSkinIdx;
		this.emitSkinChange();
    }
}
