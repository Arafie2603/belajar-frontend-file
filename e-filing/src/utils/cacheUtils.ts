import { storage } from "./storage";

// cacheUtils.ts
export const invalidateSpecificCache = (cacheKey: string) => {
    storage.remove(cacheKey);
};
