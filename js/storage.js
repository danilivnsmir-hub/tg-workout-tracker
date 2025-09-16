
// CloudStorage Wrapper with Fallback to LocalStorage
class StorageManager {
    constructor() {
        this.isCloudStorageAvailable = this.checkCloudStorageAvailability();
        this.cache = new Map();
        this.listeners = new Map();
        this.isInitialized = false;
        
        this.init();
    }
    
    checkCloudStorageAvailability() {
        try {
            return (
                typeof window !== 'undefined' &&
                window.Telegram &&
                window.Telegram.WebApp &&
                window.Telegram.WebApp.CloudStorage
            );
        } catch (error) {
            console.warn('CloudStorage not available:', error);
            return false;
        }
    }
    
    async init() {
        try {
            if (this.isCloudStorageAvailable) {
                await this.loadAllFromCloud();
            } else {
                this.loadAllFromLocal();
            }
            this.isInitialized = true;
            this.notifyListeners('init', { success: true });
        } catch (error) {
            console.error('Storage initialization failed:', error);
            this.notifyListeners('init', { success: false, error });
        }
    }
    
    async loadAllFromCloud() {
        const keys = Object.values(CONFIG.STORAGE_KEYS);
        const promises = keys.map(key => this.getFromCloud(key));
        
        try {
            const results = await Promise.allSettled(promises);
            results.forEach((result, index) => {
                const key = keys[index];
                if (result.status === 'fulfilled' && result.value) {
                    this.cache.set(key, result.value);
                } else {
                    this.cache.set(key, this.getDefaultValue(key));
                }
            });
        } catch (error) {
            console.error('Failed to load from cloud:', error);
            // Fallback to local storage
            this.loadAllFromLocal();
        }
    }
    
    loadAllFromLocal() {
        const keys = Object.values(CONFIG.STORAGE_KEYS);
        keys.forEach(key => {
            try {
                const value = localStorage.getItem(key);
                if (value) {
                    this.cache.set(key, JSON.parse(value));
                } else {
                    this.cache.set(key, this.getDefaultValue(key));
                }
            } catch (error) {
                console.error(`Failed to load ${key} from local storage:`, error);
                this.cache.set(key, this.getDefaultValue(key));
            }
        });
    }
    
    getDefaultValue(key) {
        switch (key) {
            case CONFIG.STORAGE_KEYS.WORKOUTS:
                return [];
            case CONFIG.STORAGE_KEYS.DRAFT_WORKOUT:
                return null;
            case CONFIG.STORAGE_KEYS.SETTINGS:
                return { ...DEFAULT_SETTINGS };
            case CONFIG.STORAGE_KEYS.USER_DATA:
                return {
                    createdAt: new Date().toISOString(),
                    totalWorkouts: 0,
                    totalSets: 0,
                    totalReps: 0,
                    totalWeight: 0
                };
            default:
                return null;
        }
    }
    
    async get(key) {
        if (!this.isInitialized) {
            await this.waitForInit();
        }
        
        return this.cache.get(key) || this.getDefaultValue(key);
    }
    
    async set(key, value) {
        if (!this.isInitialized) {
            await this.waitForInit();
        }
        
        try {
            // Validate storage size
            const serialized = JSON.stringify(value);
            if (this.getStorageSize() + serialized.length > CONFIG.MAX_STORAGE_SIZE) {
                throw new Error(ERROR_MESSAGES.STORAGE_FULL);
            }
            
            // Update cache
            this.cache.set(key, value);
            
            // Persist to storage
            if (this.isCloudStorageAvailable) {
                await this.saveToCloud(key, value);
            } else {
                this.saveToLocal(key, value);
            }
            
            // Notify listeners
            this.notifyListeners(key, value);
            
            return true;
        } catch (error) {
            console.error(`Failed to save ${key}:`, error);
            throw error;
        }
    }
    
    async getFromCloud(key) {
        return new Promise((resolve, reject) => {
            if (!this.isCloudStorageAvailable) {
                reject(new Error('CloudStorage not available'));
                return;
            }
            
            window.Telegram.WebApp.CloudStorage.getItem(key, (error, value) => {
                if (error) {
                    reject(new Error(error));
                } else {
                    try {
                        resolve(value ? JSON.parse(value) : null);
                    } catch (parseError) {
                        console.error(`Failed to parse ${key}:`, parseError);
                        resolve(null);
                    }
                }
            });
        });
    }
    
    async saveToCloud(key, value) {
        return new Promise((resolve, reject) => {
            if (!this.isCloudStorageAvailable) {
                reject(new Error('CloudStorage not available'));
                return;
            }
            
            const serialized = JSON.stringify(value);
            window.Telegram.WebApp.CloudStorage.setItem(key, serialized, (error, success) => {
                if (error) {
                    reject(new Error(error));
                } else {
                    resolve(success);
                }
            });
        });
    }
    
    saveToLocal(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error(`Failed to save ${key} to local storage:`, error);
            throw error;
        }
    }
    
    async delete(key) {
        try {
            this.cache.delete(key);
            
            if (this.isCloudStorageAvailable) {
                await this.deleteFromCloud(key);
            } else {
                localStorage.removeItem(key);
            }
            
            this.notifyListeners(key, null);
        } catch (error) {
            console.error(`Failed to delete ${key}:`, error);
            throw error;
        }
    }
    
    async deleteFromCloud(key) {
        return new Promise((resolve, reject) => {
            window.Telegram.WebApp.CloudStorage.removeItem(key, (error, success) => {
                if (error) {
                    reject(new Error(error));
                } else {
                    resolve(success);
                }
            });
        });
    }
    
    async clear() {
        try {
            this.cache.clear();
            
            if (this.isCloudStorageAvailable) {
                const keys = Object.values(CONFIG.STORAGE_KEYS);
                await Promise.all(keys.map(key => this.deleteFromCloud(key)));
            } else {
                Object.values(CONFIG.STORAGE_KEYS).forEach(key => {
                    localStorage.removeItem(key);
                });
            }
            
            this.notifyListeners('clear', true);
        } catch (error) {
            console.error('Failed to clear storage:', error);
            throw error;
        }
    }
    
    getStorageSize() {
        let size = 0;
        this.cache.forEach((value) => {
            size += JSON.stringify(value).length;
        });
        return size;
    }
    
    getStorageInfo() {
        const size = this.getStorageSize();
        const limit = CONFIG.MAX_STORAGE_SIZE;
        const usage = (size / limit) * 100;
        
        return {
            size,
            limit,
            usage: Math.round(usage * 100) / 100,
            available: limit - size,
            isCloudStorage: this.isCloudStorageAvailable
        };
    }
    
    addEventListener(key, callback) {
        if (!this.listeners.has(key)) {
            this.listeners.set(key, new Set());
        }
        this.listeners.get(key).add(callback);
    }
    
    removeEventListener(key, callback) {
        if (this.listeners.has(key)) {
            this.listeners.get(key).delete(callback);
        }
    }
    
    notifyListeners(key, value) {
        if (this.listeners.has(key)) {
            this.listeners.get(key).forEach(callback => {
                try {
                    callback(value, key);
                } catch (error) {
                    console.error('Listener callback error:', error);
                }
            });
        }
    }
    
    waitForInit() {
        return new Promise((resolve) => {
            if (this.isInitialized) {
                resolve();
                return;
            }
            
            const checkInit = () => {
                if (this.isInitialized) {
                    resolve();
                } else {
                    setTimeout(checkInit, 100);
                }
            };
            
            checkInit();
        });
    }
    
    // Backup and Restore
    async exportData() {
        const data = {};
        this.cache.forEach((value, key) => {
            data[key] = value;
        });
        
        return {
            version: CONFIG.VERSION,
            timestamp: new Date().toISOString(),
            data,
            metadata: this.getStorageInfo()
        };
    }
    
    async importData(exportedData) {
        try {
            if (!exportedData.data || typeof exportedData.data !== 'object') {
                throw new Error('Invalid data format');
            }
            
            // Validate data size
            const serialized = JSON.stringify(exportedData.data);
            if (serialized.length > CONFIG.MAX_STORAGE_SIZE) {
                throw new Error(ERROR_MESSAGES.STORAGE_FULL);
            }
            
            // Clear current data
            await this.clear();
            
            // Import new data
            for (const [key, value] of Object.entries(exportedData.data)) {
                await this.set(key, value);
            }
            
            return true;
        } catch (error) {
            console.error('Failed to import data:', error);
            throw error;
        }
    }
}

// Create global storage instance
const storage = new StorageManager();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { StorageManager, storage };
}
