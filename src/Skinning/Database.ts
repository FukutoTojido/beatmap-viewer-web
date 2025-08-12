export default class Database {
	db!: IDBDatabase;

	init() {
		return new Promise((resolve, reject) => {
			const request = window.indexedDB.open("josuDB", 1);

			request.onupgradeneeded = (event) => {
				this.db = (event.target as IDBOpenDBRequest).result;
				this.db.createObjectStore("skins", { autoIncrement: true });
			};

			request.onerror = () => {
				console.error("Request open database error!");
				reject(request.error);
			};

			request.onsuccess = (event) => {
				this.db = (event.target as IDBOpenDBRequest).result;
				resolve(undefined);
			};
		});
	}

	getAll() {
		return new Promise((resolve, reject) => {
			const transaction = this.db.transaction("skins", "readonly");
			const store = transaction.objectStore("skins");

			store.getAll().onsuccess = (event) => {
				resolve((event.target as IDBOpenDBRequest).result);
			};

			store.getAll().onerror = (event) => {
				console.error("Get all skins from database error!");
				reject(event);
			};
		});
	}

	get(key: string) {
		return new Promise((resolve, reject) => {
			const transaction = this.db.transaction("skins", "readonly");
			const store = transaction.objectStore("skins");

			store.get(key).onsuccess = (event) => {
				resolve((event.target as IDBOpenDBRequest).result);
			};

			store.get(key).onerror = (event) => {
				console.error("Get all from database error!");
				reject(event);
			};
		});
	}

	add(value: unknown, key?: string) {
		return new Promise((resolve, reject) => {
			const transaction = this.db.transaction("skins", "readwrite");
			const store = transaction.objectStore("skins");
			const request = store.put(value, key);

			request.onsuccess = (event) => {
				resolve((event.target as IDBOpenDBRequest).result);
			};

			request.onerror = (event) => {
				console.error("Add to database error!");
				reject(event);
			};
		});
	}

	remove(key: string) {
		return new Promise((resolve, reject) => {
			const transaction = this.db.transaction("skins", "readwrite");
			const store = transaction.objectStore("skins");
			const request = store.delete(key);

			request.onsuccess = (event) => {
				resolve((event.target as IDBOpenDBRequest).result);
			};

			request.onerror = (event) => {
				console.error("Remove from database error!");
				reject(event);
			};
		});
	}

	getAllKeys() {
		return new Promise((resolve, reject) => {
			const transaction = this.db.transaction("skins", "readonly");
			const store = transaction.objectStore("skins");

			store.getAllKeys().onsuccess = (event) => {
				resolve((event.target as IDBOpenDBRequest).result);
			};

			store.getAllKeys().onerror = (event) => {
				console.error("Get all skins from database error!");
				reject(event);
			};
		});
	}
}
