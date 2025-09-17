
// Main App Controller
const App = {
    currentScreen: 'main',
    modules: {},
    isInitialized: false,
    
    async init() {
        try {
            // Show loading
            Components.Loading.show('Инициализация приложения...');
            
            // Initialize Telegram WebApp
            this.initTelegramWebApp();
            
            // Wait for storage initialization
            await storage.waitForInit();
            
            // Initialize components (no modals, only simple dropdowns)
            Components.init();
            
            // Initialize modules
            this.initModules();
            
            // Setup navigation
            this.setupNavigation();
            
            // Update main screen stats
            await this.updateMainScreenStats();
            
            // Set initial screen
            this.showScreen('main');
            
            this.isInitialized = true;
            Components.Loading.hide();
            
            // Show welcome message for first-time users
            this.checkFirstTimeUser();
            
        } catch (error) {
            console.error('App initialization failed:', error);
            Components.Loading.hide();
            Utils.showError('Ошибка инициализации приложения');
        }
    },
    
    initTelegramWebApp() {
        if (window.Telegram?.WebApp) {
            const tg = window.Telegram.WebApp;
            
            // Configure WebApp
            tg.ready();
            tg.expand();
            
            // Set theme
            if (tg.colorScheme === 'dark') {
                document.documentElement.setAttribute('data-theme', 'dark');
            }
            
            // Handle back button
            tg.BackButton.onClick(() => {
                this.handleBackButton();
            });
            
            // Handle main button
            tg.MainButton.onClick(() => {
                this.handleMainButton();
            });
            
            console.log('Telegram WebApp initialized');
        } else {
            console.warn('Telegram WebApp not available - running in web mode');
        }
    },
    
    initModules() {
        // Initialize all modules but don't load data yet
        this.modules = {
            workout: WorkoutModule,
            history: HistoryModule,
            statistics: StatisticsModule
        };
        
        console.log('Modules initialized');
    },
    
    setupNavigation() {
        // Module card clicks
        const moduleCards = document.querySelectorAll('.module-card');
        moduleCards.forEach(card => {
            card.addEventListener('click', () => {
                const module = card.getAttribute('data-module');
                this.navigateToModule(module);
            });
        });
        
        // Back button clicks
        const backButtons = document.querySelectorAll('.back-btn');
        backButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.showScreen('main');
            });
        });
        
        // Handle browser back/forward
        window.addEventListener('popstate', (event) => {
            if (event.state && event.state.screen) {
                this.showScreen(event.state.screen, false);
            } else {
                this.showScreen('main', false);
            }
        });
    },
    
    async updateMainScreenStats() {
        try {
            const workouts = await storage.get(CONFIG.STORAGE_KEYS.WORKOUTS) || [];
            const draft = await storage.get(CONFIG.STORAGE_KEYS.DRAFT_WORKOUT);
            
            // Update total workouts
            const totalWorkoutsElement = document.getElementById('total-workouts');
            if (totalWorkoutsElement) {
                const count = workouts.length;
                totalWorkoutsElement.textContent = `${count} ${this.getWorkoutDeclension(count)}`;
            }
            
            // Update total tonnage
            const totalTonnageElement = document.getElementById('total-tonnage');
            if (totalTonnageElement) {
                let totalTonnage = 0;
                workouts.forEach(workout => {
                    const stats = Utils.calculateWorkoutStats(workout);
                    totalTonnage += stats.tonnage;
                });
                totalTonnageElement.textContent = Utils.formatWeight(totalTonnage);
            }
            
            // Update draft indicator
            const draftIndicator = document.getElementById('draft-indicator');
            if (draftIndicator) {
                draftIndicator.style.display = draft ? 'inline-block' : 'none';
            }
            
        } catch (error) {
            console.error('Failed to update main screen stats:', error);
        }
    },
    
    getWorkoutDeclension(count) {
        const cases = ['тренировка', 'тренировки', 'тренировок'];
        
        if (count % 10 === 1 && count % 100 !== 11) return cases[0];
        if (count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 10 || count % 100 >= 20)) return cases[1];
        return cases[2];
    },
    
    navigateToModule(moduleName) {
        Utils.hapticFeedback('medium');
        
        switch (moduleName) {
            case 'workout':
                this.showScreen('workout');
                break;
            case 'history':
                this.showScreen('history');
                break;
            case 'stats':
                this.showScreen('stats');
                break;
            case 'alpha':
                window.open('workout-alpha.html', '_blank');
                break;
            default:
                console.error(`Unknown module: ${moduleName}`);
        }
    },
    
    showScreen(screenName, updateHistory = true) {
        // Hide all screens
        const screens = document.querySelectorAll('.screen');
        screens.forEach(screen => {
            screen.classList.remove('active');
        });
        
        // Show target screen
        const targetScreen = document.getElementById(`${screenName}-screen`);
        if (targetScreen) {
            targetScreen.classList.add('active');
        }
        
        // Update current screen
        this.currentScreen = screenName;
        
        // Update browser history
        if (updateHistory) {
            const url = screenName === 'main' ? '/' : `#${screenName}`;
            history.pushState({ screen: screenName }, '', url);
        }
        
        // Initialize module if needed
        this.initializeScreenModule(screenName);
        
        // Update Telegram WebApp UI
        this.updateTelegramUI(screenName);
    },
    
    initializeScreenModule(screenName) {
        switch (screenName) {
            case 'workout':
                if (!this.modules.workout.isInitialized) {
                    this.modules.workout.init();
                    this.modules.workout.isInitialized = true;
                }
                // Initialize inline exercise builder for workout screen
                setTimeout(() => {
                    if (Components.InlineExerciseBuilder && document.getElementById('exercise-search')) {
                        Components.InlineExerciseBuilder.init();
                    }
                }, 200);
                break;
                
            case 'history':
                if (!this.modules.history.isInitialized) {
                    this.modules.history.init();
                    this.modules.history.isInitialized = true;
                } else {
                    this.modules.history.refresh();
                }
                break;
                
            case 'stats':
                if (!this.modules.statistics.isInitialized) {
                    this.modules.statistics.init();
                    this.modules.statistics.isInitialized = true;
                } else {
                    this.modules.statistics.refresh();
                }
                break;
                
            case 'main':
                this.updateMainScreenStats();
                break;
        }
    },
    
    updateTelegramUI(screenName) {
        if (!window.Telegram?.WebApp) return;
        
        const tg = window.Telegram.WebApp;
        
        // Update back button
        if (screenName === 'main') {
            tg.BackButton.hide();
        } else {
            tg.BackButton.show();
        }
        
        // Update main button based on context
        this.updateMainButton(screenName);
    },
    
    updateMainButton(screenName) {
        if (!window.Telegram?.WebApp) return;
        
        const tg = window.Telegram.WebApp;
        
        switch (screenName) {
            case 'workout':
                if (this.modules.workout.isDirty) {
                    tg.MainButton.setText('💾 Сохранить тренировку');
                    tg.MainButton.show();
                } else {
                    tg.MainButton.hide();
                }
                break;
                
            default:
                tg.MainButton.hide();
        }
    },
    
    handleBackButton() {
        Utils.hapticFeedback('light');
        this.showScreen('main');
    },
    
    handleMainButton() {
        Utils.hapticFeedback('medium');
        
        switch (this.currentScreen) {
            case 'workout':
                if (this.modules.workout.saveWorkout) {
                    this.modules.workout.saveWorkout();
                }
                break;
        }
    },
    
    async checkFirstTimeUser() {
        try {
            const userData = await storage.get(CONFIG.STORAGE_KEYS.USER_DATA);
            
            if (!userData.hasSeenWelcome) {
                this.showWelcomeMessage();
                userData.hasSeenWelcome = true;
                await storage.set(CONFIG.STORAGE_KEYS.USER_DATA, userData);
            }
        } catch (error) {
            console.error('Failed to check first time user:', error);
        }
    },
    
    showWelcomeMessage() {
        setTimeout(() => {
            Utils.showSuccess('Добро пожаловать в Fitness Hub! 🏋️', 5000);
        }, 1000);
    },
    
    // Handle app errors
    handleError(error, context = '') {
        console.error(`App Error ${context}:`, error);
        
        const errorMessage = error.message || ERROR_MESSAGES.UNKNOWN_ERROR;
        Utils.showError(errorMessage);
        
        // Report error to Telegram WebApp if available
        if (window.Telegram?.WebApp) {
            try {
                window.Telegram.WebApp.sendData(JSON.stringify({
                    type: 'error',
                    context,
                    error: errorMessage,
                    timestamp: new Date().toISOString()
                }));
            } catch (sendError) {
                console.error('Failed to send error to Telegram:', sendError);
            }
        }
    },
    
    // Handle app lifecycle
    onVisibilityChange() {
        if (document.hidden) {
            // App is hidden - save any pending data
            if (this.modules.workout && this.modules.workout.isDirty) {
                this.modules.workout.saveDraft();
            }
        } else {
            // App is visible - refresh data if needed
            if (this.currentScreen !== 'main') {
                this.initializeScreenModule(this.currentScreen);
            }
        }
    },
    
    onBeforeUnload(event) {
        // Save any pending data before app closes
        if (this.modules.workout && this.modules.workout.isDirty) {
            this.modules.workout.saveDraft();
            
            // Show confirmation for unsaved changes
            event.preventDefault();
            event.returnValue = 'У вас есть несохраненные изменения. Уверены, что хотите выйти?';
            return event.returnValue;
        }
    },
    
    // Development helpers
    debug() {
        return {
            currentScreen: this.currentScreen,
            modules: this.modules,
            storage: storage.getStorageInfo(),
            workouts: storage.cache.get(CONFIG.STORAGE_KEYS.WORKOUTS),
            draft: storage.cache.get(CONFIG.STORAGE_KEYS.DRAFT_WORKOUT)
        };
    }
};

// Global error handler
window.addEventListener('error', (event) => {
    App.handleError(event.error, 'Global Error');
});

window.addEventListener('unhandledrejection', (event) => {
    App.handleError(event.reason, 'Unhandled Promise Rejection');
});

// App lifecycle events
document.addEventListener('visibilitychange', () => {
    App.onVisibilityChange();
});

window.addEventListener('beforeunload', (event) => {
    App.onBeforeUnload(event);
});

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// Make App globally accessible for debugging
window.FitnessHubApp = App;

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = App;
}
