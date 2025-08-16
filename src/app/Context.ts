// biome-ignore lint/suspicious/noExplicitAny: Literally any
const _map: Map<string, any> = new Map();

export const provide = <T>(key: string, value: T): T => {
	_map.set(key, value);
	return value;
};

// biome-ignore lint/suspicious/noExplicitAny: Literally any
export const inject = <T = any>(key: string): T | undefined => {
	return _map.get(key);
};

export class Context {
	// biome-ignore lint/suspicious/noExplicitAny: Literally any
	private _map: Map<string, any> = new Map();
	private parent?: Context

	provide<T>(key: string, value: T): T {
		// if (this._map.has(key)) {
		// 	throw new Error(
		// 		"You cannot re-provide an already provided key-value pair!!!",
		// 	);
		// }

		this._map.set(key, value);
		return value;
	}

	// biome-ignore lint/suspicious/noExplicitAny: Literally any
	consume<T = any>(key: string): T | undefined {	
		return this._map.get(key) ?? this.parent?.consume(key);
	}

	hook(context: Context) {
		this.parent = context;
	}
}

export const createContext = () => {
	// biome-ignore lint/suspicious/noExplicitAny: Literally any
	const _map: Map<string, any> = new Map();

	const provide = <T>(key: string, value: T): T => {
		if (_map.has(key)) {
			throw new Error(
				"You cannot re-provide an already provided key-value pair!!!",
			);
		}

		_map.set(key, value);
		return value;
	};

	// biome-ignore lint/suspicious/noExplicitAny: Literally any
	const consume = <T = any>(key: string): T | undefined => {
		return _map.get(key);
	};

    return {
        provide,
        consume,
    }
};

export class ScopedClass {
	context = new Context();

	hook(context: Context) {
		this.context.hook(context);
		return this;
	}
}