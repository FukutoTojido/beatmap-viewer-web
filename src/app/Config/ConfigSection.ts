import { inject } from "@/Context";
import type Config from ".";

export default class ConfigSection {
	// biome-ignore lint/suspicious/noExplicitAny: I don't care
	private _callbacks: Map<string, Set<(newValue: any) => void>> = new Map();

	// biome-ignore lint/suspicious/noExplicitAny: I don't care
	onChange(key: string, callback: (newValue: any) => void) {
		if (!this._callbacks.get(key)) {
			this._callbacks.set(key, new Set());
		}

		this._callbacks.get(key)?.add(callback);
	}

	// biome-ignore lint/suspicious/noExplicitAny: I don't care
	async emitChange(key: string, newValue: any) {
		inject<Config>("config")?.saveSettings();
		
		const callbacks = this._callbacks.get(key);
		if (!callbacks) return;
		await Promise.all([...callbacks].map((callback) => {
			return new Promise((resolve) => {
				setTimeout(() => {
					callback(newValue);
					resolve(undefined)
				}, 10)
			})
		}))
	}

	jsonify() {}
}
