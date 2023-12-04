export class Database {
    static db = null;

    static initDatabase() {
        return new Promise((resolve, reject) => {
            const request = window.indexedDB.open("settingsDB", 1);

            request.onupgradeneeded = (event) => {
                Database.db = event.target.result;
                console.log("DB updgrade success");

                Database.db.createObjectStore("skins", { autoIncrement: true });
            };

            request.onerror = () => {
                console.error("The");
                reject(request.error);
            };

            request.onsuccess = () => {
                Database.db = request.result;
                console.log("DB request success");
                resolve();
            };
        });
    }

    static readObjStore() {
        return new Promise((resolve, reject) => {
            const transaction = Database.db.transaction("skins", "readonly");

            const objStore = transaction.objectStore("skins");

            objStore.getAll().onsuccess = (event) => {
                resolve(event.target.result);
            };

            objStore.getAll().onerror = (event) => {
                reject(event);
            };
        });
    }

    static readObjStoreAtKey(key) {
        return new Promise((resolve, reject) => {
            const transaction = Database.db.transaction("skins", "readonly");
            const objStore = transaction.objectStore("skins");

            const request = objStore.get(key);

            request.onsuccess = (event) => {
                resolve(request.result);
            };

            request.onerror = (event) => {
                reject(request.error);
            };
        });
    }

    static removeFromObjStore(key) {
        return new Promise((resolve, reject) => {
            const transaction = Database.db.transaction("skins", "readwrite");
            const objStore = transaction.objectStore("skins");

            let request = objStore.delete(+key);

            request.onsuccess = (event) => {
                console.log("Deleted skin from IDB", event.target.result);
                resolve();
            };

            request.onerror = () => {
                console.error("Cannot delete skin from IDB. Please delete skin manually from DevTools.", request.error);
                reject(request.error);
            };
        })
    }

    static addToObjStore(value) {
        return new Promise((resolve, reject) => {
            const transaction = Database.db.transaction("skins", "readwrite");
            const objStore = transaction.objectStore("skins");

            let request = objStore.add(value);

            request.onsuccess = () => {
                console.log("Skin added to IDB", request.result);
                resolve();
            };

            request.onerror = () => {
                console.error("Cannot add skin to IDB", request.error);
                reject(request.error);
            };
        });
    }

    static getAllKeys() {
        return new Promise((resolve, reject) => {
            const transaction = Database.db.transaction("skins", "readonly");

            const objStore = transaction.objectStore("skins");

            objStore.getAllKeys().onsuccess = (event) => {
                resolve(event.target.result);
            };

            objStore.getAllKeys().onerror = (event) => {
                reject(event);
            };
        });
    }
}
