
// Улучшенная система хранения данных с исправлениями проблем персистентности
class WorkoutStorage {
    constructor() {
        this.cloudStorage = null;
        this.syncInProgress = false;
        this.syncQueue = [];
        this.autoSaveInterval = null;
        this.lastSyncTime = null;
        
        this.init();
        this.setupEventListeners();
        this.startAutoSave();
    }

    init() {
        // Инициализация Telegram CloudStorage
        try {
            if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.CloudStorage) {
                this.cloudStorage = window.Telegram.WebApp.CloudStorage;
                console.log('Telegram CloudStorage инициализирован');
            } else {
                console.warn('Telegram CloudStorage недоступен, используется только localStorage');
            }
        } catch (error) {
            console.error('Ошибка инициализации CloudStorage:', error);
        }

        // Восстановление данных при загрузке
        this.restoreData();
    }

    setupEventListeners() {
        // Надежные события для сохранения данных
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.saveAllData();
            }
        });

        window.addEventListener('pagehide', () => {
            this.saveAllData();
        });

        // Резервное событие beforeunload (может не сработать в мобильных браузерах)
        window.addEventListener('beforeunload', () => {
            this.saveAllData();
        });

        // Сохранение при потере фокуса
        window.addEventListener('blur', () => {
            this.saveAllData();
        });
    }

    startAutoSave() {
        // Автосохранение каждые 30 секунд
        this.autoSaveInterval = setInterval(() => {
            this.saveAllData();
        }, 30000);
    }

    stopAutoSave() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
        }
    }

    // Получение данных с fallback на localStorage
    async getData(key) {
        try {
            // Сначала пробуем localStorage (быстрее и надежнее)
            const localData = localStorage.getItem(key);
            if (localData) {
                const parsedData = JSON.parse(localData);
                
                // Если есть CloudStorage, проверяем синхронизацию
                if (this.cloudStorage) {
                    this.syncFromCloud(key);
                }
                
                return parsedData;
            }

            // Если нет локальных данных, пробуем CloudStorage
            if (this.cloudStorage) {
                return new Promise((resolve) => {
                    this.cloudStorage.getItem(key, (error, value) => {
                        if (!error && value) {
                            try {
                                const parsedData = JSON.parse(value);
                                // Сохраняем в localStorage для быстрого доступа
                                localStorage.setItem(key, value);
                                resolve(parsedData);
                            } catch (parseError) {
                                console.error('Ошибка парсинга данных из CloudStorage:', parseError);
                                resolve(null);
                            }
                        } else {
                            resolve(null);
                        }
                    });
                });
            }

            return null;
        } catch (error) {
            console.error('Ошибка получения данных:', error);
            this.updateSyncStatus('error', 'Ошибка загрузки данных');
            return null;
        }
    }

    // Сохранение данных с дублированием
    async setData(key, value) {
        try {
            const jsonValue = JSON.stringify(value);
            
            // Сразу сохраняем в localStorage (надежно и быстро)
            localStorage.setItem(key, jsonValue);
            
            // Добавляем в очередь для синхронизации с CloudStorage
            if (this.cloudStorage) {
                this.syncQueue.push({ key, value: jsonValue });
                this.processSyncQueue();
            }

            this.updateSyncStatus('saved', 'Сохранено');
            return true;
        } catch (error) {
            console.error('Ошибка сохранения данных:', error);
            this.updateSyncStatus('error', 'Ошибка сохранения');
            return false;
        }
    }

    // Обработка очереди синхронизации
    async processSyncQueue() {
        if (this.syncInProgress || this.syncQueue.length === 0) {
            return;
        }

        this.syncInProgress = true;
        this.updateSyncStatus('syncing', 'Синхронизация...');

        while (this.syncQueue.length > 0) {
            const item = this.syncQueue.shift();
            
            try {
                await new Promise((resolve, reject) => {
                    this.cloudStorage.setItem(item.key, item.value, (error) => {
                        if (error) {
                            console.error('Ошибка синхронизации с CloudStorage:', error);
                            // Возвращаем элемент в очередь для повторной попытки
                            this.syncQueue.unshift(item);
                            reject(error);
                        } else {
                            resolve();
                        }
                    });
                });
            } catch (error) {
                // Прерываем синхронизацию при ошибке
                break;
            }
        }

        this.syncInProgress = false;
        this.lastSyncTime = new Date();

        if (this.syncQueue.length === 0) {
            this.updateSyncStatus('synced', 'Синхронизировано');
        } else {
            this.updateSyncStatus('error', 'Ошибка синхронизации');
        }
    }

    // Синхронизация с облаком
    async syncFromCloud(key) {
        if (!this.cloudStorage || this.syncInProgress) {
            return;
        }

        try {
            this.cloudStorage.getItem(key, (error, cloudValue) => {
                if (!error && cloudValue) {
                    const localValue = localStorage.getItem(key);
                    
                    // Простая проверка, отличаются ли данные
                    if (localValue !== cloudValue) {
                        console.log('Обнаружены различия с облачными данными');
                        // Можно добавить логику разрешения конфликтов
                        // Пока приоритет у локальных данных
                    }
                }
            });
        } catch (error) {
            console.error('Ошибка синхронизации с облаком:', error);
        }
    }

    // Сохранение всех данных
    saveAllData() {
        try {
            // Находим все данные тренировок в localStorage
            const workoutKeys = Object.keys(localStorage).filter(key => 
                key.startsWith('workout_') || key === 'workouts' || key === 'exercises'
            );

            // Принудительно синхронизируем важные данные
            workoutKeys.forEach(key => {
                const value = localStorage.getItem(key);
                if (value && this.cloudStorage) {
                    this.syncQueue.push({ key, value });
                }
            });

            this.processSyncQueue();
        } catch (error) {
            console.error('Ошибка при сохранении всех данных:', error);
        }
    }

    // Восстановление данных при загрузке
    async restoreData() {
        try {
            this.updateSyncStatus('loading', 'Загрузка...');
            
            // Проверяем основные ключи данных
            const mainKeys = ['workouts', 'exercises', 'food_log'];
            
            for (const key of mainKeys) {
                await this.getData(key);
            }

            this.updateSyncStatus('ready', 'Готов');
        } catch (error) {
            console.error('Ошибка восстановления данных:', error);
            this.updateSyncStatus('error', 'Ошибка загрузки');
        }
    }

    // Обновление статуса синхронизации в UI
    updateSyncStatus(status, message) {
        const statusIndicator = document.getElementById('statusIndicator');
        const statusText = document.getElementById('statusText');

        if (statusIndicator && statusText) {
            statusText.textContent = message;

            // Удаляем все классы статуса
            statusIndicator.classList.remove('status-ready', 'status-syncing', 'status-saved', 'status-error', 'status-loading');
            
            // Добавляем нужный класс
            statusIndicator.classList.add(`status-${status}`);
        }

        console.log(`Storage status: ${status} - ${message}`);
    }

    // Очистка данных
    async clearData(key) {
        try {
            localStorage.removeItem(key);
            
            if (this.cloudStorage) {
                this.cloudStorage.removeItem(key, (error) => {
                    if (error) {
                        console.error('Ошибка удаления из CloudStorage:', error);
                    }
                });
            }
            
            return true;
        } catch (error) {
            console.error('Ошибка очистки данных:', error);
            return false;
        }
    }

    // Получение статистики хранилища
    getStorageStats() {
        const localStorageSize = new Blob(Object.values(localStorage)).size;
        return {
            localStorageSize: localStorageSize,
            cloudStorageAvailable: !!this.cloudStorage,
            lastSyncTime: this.lastSyncTime,
            syncQueueLength: this.syncQueue.length
        };
    }
}

// Глобальная инициализация
const storage = new WorkoutStorage();

// Экспорт для использования в других скриптах
window.workoutStorage = storage;
