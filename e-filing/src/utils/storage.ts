    // utils/storage.ts
    export const storage = {
        get: (key: string) => {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : null;
            } catch (error) {
                console.error(`Error reading ${key} from localStorage:`, error);
                return null;
            }
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        set: (key: string, value: any) => {
            try {
                localStorage.setItem(key, JSON.stringify(value));
            } catch (error) {
                console.error(`Error writing ${key} to localStorage:`, error);
            }
        },
        remove: (key: string) => {
            try {
                localStorage.removeItem(key);
            } catch (error) {
                console.error(`Error removing ${key} from localStorage:`, error);
            }
        }
    };

