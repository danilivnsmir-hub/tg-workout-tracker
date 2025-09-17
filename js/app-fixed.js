
// Fixed App Controller - Stable Initialization
const App = {
    currentScreen: 'main',
    modules: {},
    isInitialized: false,
    
    async init() {
        try {
            console.log('🚀 Starting Fitness Hub initialization...');
            
            // Show loading with error handling
            this.showLoading('Инициализация приложения...');
            
            // Initialize Telegram WebApp (optional, with fallbacks)
            this.initTelegramWebApp();
            
            // Initialize storage with timeout protection
            await this.initStorageWithTimeout();
            
            // Initialize components with error protection
            this.initComponents();
            
            // Initialize modules with error handling
            this.initModules();
            
            // Setup navigation
            this.setupNavigation();
            
            // Update main screen stats (with fallback)
            await this.updateMainScreenStats();
            
            // Set initial screen
            this.showScreen('main');
            
            this.isInitialized = true;
            this.hideLoading();
            
            // Show welcome message for first-time users
            this.checkFirstTimeUser();
            
            console.log('✅ Fitness Hub initialized successfully!');
            
        } catch (error) {
            console.error('App initialization failed:', error);
            this.hideLoading();
            this.showErrorFallback('Ошибка инициализации приложения');
        }
    },
    
    async initStorageWithTimeout() {
        try {
            // Add timeout protection
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Storage initialization timeout')), 5000);
            });
            
            const storagePromise = storage?.waitForInit?.() || Promise.resolve();
            
            await Promise.race([storagePromise, timeoutPromise]);
            console.log('✅ Storage initialized');
            
        } catch (error) {
            console.warn('Storage initialization failed, using fallback:', error);
            // Continue with localStorage fallback
            this.initLocalStorageFallback();
        }
    },
    
    initLocalStorageFallback() {
        // Simple localStorage fallback
        window.simpleFitnessStorage = {
            get: (key) => {
                try {
                    const value = localStorage.getItem(key);
                    return value ? JSON.parse(value) : null;
                } catch {
                    return null;
                }
            },
            set: (key, value) => {
                try {
                    localStorage.setItem(key, JSON.stringify(value));
                    return true;
                } catch {
                    return false;
                }
            }
        };
        console.log('✅ Fallback storage initialized');
    },
    
    initTelegramWebApp() {
        try {
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
                
                console.log('✅ Telegram WebApp initialized');
            } else {
                console.log('ℹ️  Running in web mode (no Telegram WebApp)');
            }
        } catch (error) {
            console.warn('Telegram WebApp initialization failed:', error);
        }
    },
    
    initComponents() {
        try {
            // Initialize components with error protection
            if (typeof Components !== 'undefined' && Components.init) {
                Components.init();
                console.log('✅ Components initialized');
            } else {
                console.warn('Components not available, using fallback');
                this.initComponentsFallback();
            }
        } catch (error) {
            console.error('Components initialization failed:', error);
            this.initComponentsFallback();
        }
    },
    
    initComponentsFallback() {
        // Simple fallback for essential components
        window.ComponentsFallback = {
            SimpleExerciseBuilder: {
                init: () => {
                    console.log('Using fallback exercise builder');
                    this.setupSimpleExerciseForm();
                }
            }
        };
    },
    
    setupSimpleExerciseForm() {
        // Add simple exercise form functionality
        const exerciseForm = document.getElementById('exercise-form');
        const addBtn = document.getElementById('add-exercise-btn');
        
        if (exerciseForm && addBtn) {
            exerciseForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleAddExercise(e);
            });
        }
    },
    
    handleAddExercise(e) {
        const formData = new FormData(e.target);
        const exercise = formData.get('exercise') || document.getElementById('exercise-select')?.value;
        const weight = formData.get('weight') || document.getElementById('weight-input')?.value;
        const reps = formData.get('reps') || document.getElementById('reps-input')?.value;
        
        if (!exercise) {
            this.showError('Выберите упражнение');
            return;
        }
        
        if (!weight && !reps) {
            this.showError('Укажите вес или количество повторений');
            return;
        }
        
        // Add exercise logic
        this.addExerciseToWorkout({
            name: exercise,
            weight: parseFloat(weight) || 0,
            reps: parseInt(reps) || 0,
            timestamp: new Date().toISOString()
        });
        
        // Reset form
        e.target.reset();
        this.showSuccess('Упражнение добавлено!');
    },
    
    addExerciseToWorkout(exercise) {
        // Simple exercise adding logic
        const exercisesList = document.getElementById('exercises-list');
        if (exercisesList) {
            // Remove empty state if it exists
            const emptyState = exercisesList.querySelector('.empty-state');
            if (emptyState) {
                emptyState.style.display = 'none';
            }
            
            // Add exercise to list
            const exerciseElement = this.createExerciseElement(exercise);
            exercisesList.appendChild(exerciseElement);
        }
    },
    
    createExerciseElement(exercise) {
        const div = document.createElement('div');
        div.className = 'exercise-item';
        div.innerHTML = `
            <div class="exercise-info">
                <h4>${exercise.name}</h4>
                <div class="exercise-details">
                    ${exercise.weight > 0 ? `${exercise.weight} кг` : ''} 
                    ${exercise.weight > 0 && exercise.reps > 0 ? ' × ' : ''}
                    ${exercise.reps > 0 ? `${exercise.reps} повторов` : ''}
                </div>
            </div>
            <button class="delete-btn" onclick="this.parentElement.remove()">🗑️</button>
        `;
        return div;
    },
    
    initModules() {
        try {
            // Initialize modules with fallbacks
            this.modules = {
                workout: typeof WorkoutModule !== 'undefined' ? WorkoutModule : this.createFallbackModule('workout'),
                history: typeof HistoryModule !== 'undefined' ? HistoryModule : this.createFallbackModule('history'),
                statistics: typeof StatisticsModule !== 'undefined' ? StatisticsModule : this.createFallbackModule('statistics')
            };
            console.log('✅ Modules initialized');
        } catch (error) {
            console.error('Module initialization failed:', error);
        }
    },
    
    createFallbackModule(name) {
        return {
            init: () => console.log(`Fallback ${name} module initialized`),
            render: () => console.log(`Rendering ${name} module`)
        };
    },
    
    setupNavigation() {
        try {
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
            
            console.log('✅ Navigation setup complete');
        } catch (error) {
            console.error('Navigation setup failed:', error);
        }
    },
    
    async updateMainScreenStats() {
        try {
            // Get storage instance (with fallback)
            const storageInstance = window.storage || window.simpleFitnessStorage || {
                get: () => null
            };
            
            const workouts = await storageInstance.get('workouts') || [];
            const draft = await storageInstance.get('draftWorkout');
            
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
                    if (workout.exercises) {
                        workout.exercises.forEach(exercise => {
                            if (exercise.weight && exercise.reps) {
                                totalTonnage += exercise.weight * exercise.reps;
                            }
                        });
                    }
                });
                totalTonnageElement.textContent = `${totalTonnage.toFixed(1)} кг`;
            }
            
            // Update draft indicator
            const draftIndicator = document.getElementById('draft-indicator');
            if (draftIndicator) {
                draftIndicator.style.display = draft ? 'inline-block' : 'none';
            }
            
        } catch (error) {
            console.error('Failed to update main screen stats:', error);
            // Continue without stats update
        }
    },
    
    getWorkoutDeclension(count) {
        const cases = ['тренировка', 'тренировки', 'тренировок'];
        
        if (count % 10 === 1 && count % 100 !== 11) return cases[0];
        if (count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 10 || count % 100 >= 20)) return cases[1];
        return cases[2];
    },
    
    navigateToModule(moduleName) {
        try {
            // Haptic feedback if available
            if (window.Utils?.hapticFeedback) {
                Utils.hapticFeedback('medium');
            }
            
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
        } catch (error) {
            console.error('Navigation failed:', error);
        }
    },
    
    showScreen(screenName, updateHistory = true) {
        try {
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
            
            // Update browser history (with error protection)
            if (updateHistory && window.history?.pushState) {
                try {
                    const url = screenName === 'main' ? '/' : `#${screenName}`;
                    history.pushState({ screen: screenName }, '', url);
                } catch (e) {
                    console.warn('History API not available:', e);
                }
            }
            
            // Initialize module if needed
            if (this.modules[screenName]?.init) {
                this.modules[screenName].init();
            }
            
        } catch (error) {
            console.error('Screen transition failed:', error);
        }
    },
    
    // Utility methods with error protection
    showLoading(message = 'Загрузка...') {
        try {
            if (Components?.Loading?.show) {
                Components.Loading.show(message);
            } else {
                // Fallback loading display
                const overlay = document.getElementById('loading-overlay');
                if (overlay) {
                    overlay.classList.add('active');
                    const messageEl = overlay.querySelector('p');
                    if (messageEl) messageEl.textContent = message;
                }
            }
        } catch (error) {
            console.error('Show loading failed:', error);
        }
    },
    
    hideLoading() {
        try {
            if (Components?.Loading?.hide) {
                Components.Loading.hide();
            } else {
                // Fallback loading hide
                const overlay = document.getElementById('loading-overlay');
                if (overlay) {
                    overlay.classList.remove('active');
                }
            }
        } catch (error) {
            console.error('Hide loading failed:', error);
        }
    },
    
    showError(message) {
        try {
            if (window.Utils?.showError) {
                Utils.showError(message);
            } else {
                alert(`Ошибка: ${message}`);
            }
        } catch (error) {
            console.error('Show error failed:', error);
        }
    },
    
    showSuccess(message) {
        try {
            if (window.Utils?.showSuccess) {
                Utils.showSuccess(message);
            } else {
                // Simple success feedback
                console.log(`✅ ${message}`);
            }
        } catch (error) {
            console.error('Show success failed:', error);
        }
    },
    
    showErrorFallback(message) {
        // Last resort error display
        const appElement = document.getElementById('app');
        if (appElement) {
            appElement.innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; padding: 2rem; text-align: center;">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">⚠️</div>
                    <h2 style="color: #ef4444; margin-bottom: 1rem;">${message}</h2>
                    <p style="color: rgba(255, 255, 255, 0.8); margin-bottom: 2rem;">Приложение не может быть инициализировано.</p>
                    <button onclick="window.location.reload()" style="padding: 0.75rem 1.5rem; background: #6366f1; color: white; border: none; border-radius: 8px; cursor: pointer;">
                        Перезагрузить страницу
                    </button>
                </div>
            `;
        }
    },
    
    checkFirstTimeUser() {
        try {
            const hasSeenWelcome = localStorage.getItem('fitness-hub-welcome');
            if (!hasSeenWelcome) {
                setTimeout(() => {
                    this.showSuccess('Добро пожаловать в Fitness Hub! 🎉');
                    localStorage.setItem('fitness-hub-welcome', 'true');
                }, 1000);
            }
        } catch (error) {
            console.error('First time user check failed:', error);
        }
    },
    
    handleBackButton() {
        if (this.currentScreen !== 'main') {
            this.showScreen('main');
        } else if (window.Telegram?.WebApp?.close) {
            window.Telegram.WebApp.close();
        }
    },
    
    handleMainButton() {
        // Handle Telegram main button if needed
        console.log('Main button pressed');
    }
};

// Safe initialization
document.addEventListener('DOMContentLoaded', () => {
    try {
        App.init();
    } catch (error) {
        console.error('Critical initialization error:', error);
        // Show basic fallback interface
        document.body.innerHTML = `
            <div style="text-align: center; padding: 2rem;">
                <h1>🏋️ Fitness Hub</h1>
                <p style="color: #ef4444;">Не удалось инициализировать приложение</p>
                <button onclick="window.location.href='/minimal-fitness.html'" 
                        style="padding: 1rem 2rem; background: #6366f1; color: white; border: none; border-radius: 8px; margin-top: 1rem;">
                    Открыть упрощенную версию
                </button>
            </div>
        `;
    }
});

// Export for use
if (typeof window !== 'undefined') {
    window.App = App;
}
