import { imageToBase64 } from "./Utils";
import { Game } from "./Game";
import axios from 'axios';

export class Database {
    static db = null;

    static initDatabase() {
        return new Promise((resolve, reject) => {
            const request = window.indexedDB.open("settingsDB", 2);

            request.onupgradeneeded = (event) => {
                Database.db = event.target.result;
                console.log("DB updgrade success");

                if (event.oldVersion < 1) Database.db.createObjectStore("skins", { autoIncrement: true });
                if (event.oldVersion < 2) Database.db.createObjectStore("defaultSkins");
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
        });
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

    static setupSkins(skin) {
        return new Promise((resolve, reject) => {
            const transaction = Database.db.transaction("defaultSkins", "readwrite");
            const objStore = transaction.objectStore("defaultSkins");

            let request = objStore.add(
                {
                    base64s: {},
                    samples: {},
                },
                skin
            );

            request.onsuccess = () => {
                console.log(`Initialized ${skin} to IDB`, request.result);
                resolve();
            };

            request.onerror = () => {
                console.error(`Cannot add ${skin} to IDB`, request.error);
                reject(request.error);
            };
        })
    }

    static async getDefaults(type, value, skin) {
        return new Promise(async (resolve, reject) => {
            let transaction = Database.db.transaction("defaultSkins", "readwrite");
            let objStore = transaction.objectStore("defaultSkins");
            const allKeys = await this.getAllDefaultKeys();

            if (!allKeys.includes(skin)) {
                await Database.setupSkins(skin);
            }

            transaction = Database.db.transaction("defaultSkins", "readwrite");
            objStore = transaction.objectStore("defaultSkins");

            const request = objStore.get(skin);

            request.onsuccess = async (event) => {
                const skinJson = event.target.result;
                // console.log(`Asking for ${skin}/${value}`)
                if (skinJson[type][value]) {
                    resolve(skinJson[type][value]);
                    return;
                }

                if (type === "base64s") {
                    const base64 = await imageToBase64(`/static/${skin}/${value}.png`);
                    skinJson[type][value] = base64;

                    console.log(skinJson);

                    transaction = Database.db.transaction("defaultSkins", "readwrite");
                    objStore = transaction.objectStore("defaultSkins");
                    const request = objStore.put(skinJson, skin);

                    request.onsuccess = () => {
                        console.log(`Initialized ${skin}/${value} to IDB`, request.result);
                        resolve(base64);
                    };

                    request.onerror = () => {
                        console.error(`Cannot add ${skin} to IDB`, request.error);
                        reject(request.error);
                    };

                    return;
                }

                const res = (
                    await axios.get(`/static/${skin}/${value}.wav`, {
                        responseType: "arraybuffer",
                    })
                ).data;
                skinJson[type][value] = res;

                transaction = Database.db.transaction("defaultSkins", "readwrite");
                objStore = transaction.objectStore("defaultSkins");
                const request = objStore.put(skinJson, skin);

                request.onsuccess = () => {
                    console.log(`Initialized ${skin}/${value} to IDB`, request.result);
                    resolve(res);
                };

                request.onerror = () => {
                    console.error(`Cannot add ${skin} to IDB`, request.error);
                    reject(request.error);
                };
            };

            request.onerror = (event) => {
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

    static getAllDefaultKeys() {
        return new Promise((resolve, reject) => {
            const transaction = Database.db.transaction("defaultSkins", "readonly");

            const objStore = transaction.objectStore("defaultSkins");

            objStore.getAllKeys().onsuccess = (event) => {
                resolve(event.target.result);
            };

            objStore.getAllKeys().onerror = (event) => {
                reject(event);
            };
        });
    }
}
