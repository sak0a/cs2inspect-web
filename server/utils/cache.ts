import NodeCache from "node-cache";

const cache = new NodeCache({
    stdTTL: process.env.CACHE_MAX_AGE, // 1 hour
    checkperiod: process.env.CACHE_CHECK_PERIOD, // 5 minutes
    useClones: process.env.CACHE_USE_CLONES,
    deleteOnExpire: process.env.CACHE_DELETE_ON_EXPIRE,
    maxKeys: parseInt(process.env.CACHE_MAX_KEYS, 10) || 100,
});

export function getCache(key: string) {
    return cache.get(key);
}

export function setCache(key: string, value: any) {
    cache.set(key, value);
}

export function deleteFromCache(key: string) {
    cache.del(key);
}