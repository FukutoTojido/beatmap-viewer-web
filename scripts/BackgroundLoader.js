/**
 * Allows starting a loading process in the background & await the load to finish before
 * using the object
 * @template T
 */
export class BackgroundLoader {
    /**
     * @param {() => Promise<T>} loadFn
     * @param {boolean} [loadImmediately=false] whether to start loading immediately
     */
    constructor(loadFn, loadImmediately = false) {
        this.loadFn = loadFn
        if (loadImmediately)
            this.load().then()
    }

    /**
     * @returns {Promise<T>}
     */
    async load() {
        this.loadPromise ??= this.loadFn()

        return this.loadPromise
    }

    loadInBackground() {
        this.load().then()
    }
}