const store = new Map();

export const cacheGet = (key) => store.get(key);
export const cacheSet = (key, data) => store.set(key, data);
export const cacheDel = (key) => store.delete(key);
