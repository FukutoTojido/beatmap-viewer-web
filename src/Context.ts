// biome-ignore lint/suspicious/noExplicitAny: Literally any
const _map: Map<string, any> = new Map();

export const provide = <T>(key: string, value: T): T => {
    if (_map.has(key)) {
        throw new Error("You cannot re-provide an already provided key-value pair!!!");
    }

    _map.set(key, value);
    return value;
}

// biome-ignore lint/suspicious/noExplicitAny: Literally any
export const inject = <T = any>(key: string): T | undefined => {
    return _map.get(key);
}