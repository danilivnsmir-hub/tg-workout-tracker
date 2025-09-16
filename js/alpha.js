
// Alpha Version Functionality
const AlphaModule = {
    features: {},
    
    init() {
        this.setupEventListeners();
        this.initFeatures();
        this.updateDebugInfo();
        
        // Initialize storage size monitoring
        setInterval(() => {
            this.updateDebugInfo();
        }, 5000);
    },
    
    setupEventListeners() {
        // AI Chat
        const chatSend = document.getElementById('chat-send');
        const chatInput = document.getElementById('chat-input');
        
        if (chatSend) {
            chatSend.addEventListener('click', () => this.sendChatMessage());
        }
        
        if (chatInput) {
            chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.sendChatMessage();
                }
            });
        }
        
        // Templates
        const templateCards = document.querySelectorAll('.template-card');
        templateCards.forEach(card => {
            card.addEventListener('click', () => {
                const template = card.getAttribute('data-template');
                this.applyTemplate(template);
            });
        });
        
        // Social features
        const socialButtons = document.querySelectorAll('.social-btn');
        socialButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const action = e.target.textContent.trim();
                this.handleSocialAction(action);
            });
        });
        
        // 1RM Calculator
        const ormInputs = document.querySelectorAll('.calc-inputs input');
        const calculateBtn = document.querySelector('.calc-inputs .btn');
        
        if (calculateBtn) {
            calculateBtn.addEventListener('click', () => {
                this.calculate1RM();
            });
        }
        
        ormInputs.forEach(input => {
            input.addEventListener('input', () => {
                this.calculate1RM();
            });
        });
        
        // Debug panel
        const clearStorageBtn = document.getElementById('clear-storage');
        const generateTestDataBtn = document.getElementById('generate-test-data');
        const exportDataBtn = document.getElementById('export-data');
        
        if (clearStorageBtn) {
            clearStorageBtn.addEventListener('click', () => this.clearAllData());
        }
        
        if (generateTestDataBtn) {
            generateTestDataBtn.addEventListener('click', () => this.generateTestData());
        }
        
        if (exportDataBtn) {
            exportDataBtn.addEventListener('click', () => this.exportAllData());
        }
    },
    
    initFeatures() {
        this.features = {
            aiChat: new AIChat(),
            templates: new WorkoutTemplates(),
            analytics: new AdvancedAnalytics(),
            social: new SocialFeatures()
        };
    },
    
    // AI Chat Feature
    sendChatMessage() {
        const input = document.getElementById('chat-input');
        const messagesContainer = document.getElementById('chat-messages');
        
        if (!input || !messagesContainer) return;
        
        const message = input.value.trim();
        if (!message) return;
        
        // Add user message
        this.addChatMessage(message, 'user');
        input.value = '';
        
        // Add typing indicator
        this.addTypingIndicator();
        
        // Generate AI response (simulated)
        setTimeout(() => {
            this.removeTypingIndicator();
            const response = this.generateAIResponse(message);
            this.addChatMessage(response, 'bot');
        }, 1500 + Math.random() * 1000);
        
        Utils.hapticFeedback('light');
    },
    
    addChatMessage(message, sender) {
        const messagesContainer = document.getElementById('chat-messages');
        if (!messagesContainer) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `${sender}-message`;
        messageDiv.innerHTML = `
            <div class="message-content">${message}</div>
        `;
        
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    },
    
    addTypingIndicator() {
        const messagesContainer = document.getElementById('chat-messages');
        if (!messagesContainer) return;
        
        const indicator = document.createElement('div');
        indicator.className = 'bot-message typing-indicator';
        indicator.innerHTML = `
            <div class="message-content">
                <div class="typing-dots">
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                </div>
            </div>
        `;
        
        messagesContainer.appendChild(indicator);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    },
    
    removeTypingIndicator() {
        const indicator = document.querySelector('.typing-indicator');
        if (indicator) {
            indicator.remove();
        }
    },
    
    generateAIResponse(userMessage) {
        const message = userMessage.toLowerCase();
        
        const responses = {
            грeetings: [
                'Привет! Я твой фитнес-помощник. Чем могу помочь?',
                'Здравствуй! Готов обсудить твои тренировки?',
                'Привет! Расскажи о своих фитнес-целях.'
            ],
            workout: [
                'Отличная идея! Для начала определись с основными группами мышц.',
                'Рекомендую начать с базовых упражнений: приседания, жим лежа, становая тяга.',
                'Сколько дней в неделю планируешь тренироваться?'
            ],
            weight: [
                'Для похудения важен дефицит калорий и регулярные тренировки.',
                'Рекомендую сочетать силовые тренировки с кардио.',
                'Следи за питанием - это 70% успеха!'
            ],
            muscle: [
                'Для набора массы нужен профицит калорий и прогрессивная перегрузка.',
                'Увеличивай вес постепенно, 2.5-5 кг каждые 2-3 недели.',
                'Не забывай про отдых - мышцы растут во время восстановления.'
            ],
            default: [
                'Интересный вопрос! Можешь рассказать больше?',
                'Хм, давай разберем это подробнее.',
                'Я думаю, тебе стоит попробовать разные подходы.',
                'Отличная тема для обсуждения!'
            ]
        };
        
        let responseType = 'default';
        
        if (message.includes('привет') || message.includes('здравствуй')) {
            responseType = 'greetings';
        } else if (message.includes('тренировк') || message.includes('упражнен')) {
            responseType = 'workout';
        } else if (message.includes('похуд') || message.includes('вес') && message.includes('сброс')) {
            responseType = 'weight';
        } else if (message.includes('масс') || message.includes('мышц')) {
            responseType = 'muscle';
        }
        
        const responseArray = responses[responseType];
        return responseArray[Math.floor(Math.random() * responseArray.length)];
    },
    
    // Template System
    applyTemplate(templateType) {
        const templates = {
            beginner: {
                name: 'Программа для новичков',
                description: '3 дня в неделю, базовые упражнения',
                workouts: [
                    {
                        name: 'День 1 - Верх тела',
                        exercises: ['Жим лежа', 'Тяга штанги в наклоне', 'Жим стоя', 'Подъем на бицепс']
                    },
                    {
                        name: 'День 2 - Низ тела',
                        exercises: ['Приседания', 'Становая тяга', 'Жим ногами', 'Подъемы на носки']
                    },
                    {
                        name: 'День 3 - Все тело',
                        exercises: ['Отжимания', 'Подтягивания', 'Выпады', 'Планка']
                    }
                ]
            },
            strength: {
                name: 'Программа 5/3/1',
                description: 'Силовая программа',
                workouts: [
                    {
                        name: 'День 1 - Жим лежа',
                        exercises: ['Жим лежа', 'Жим гантелей', 'Отжимания на брусьях', 'Французский жим']
                    },
                    {
                        name: 'День 2 - Приседания',
                        exercises: ['Приседания', 'Фронтальные приседания', 'Выпады', 'Разгибания ног']
                    },
                    {
                        name: 'День 3 - Жим стоя',
                        exercises: ['Жим стоя', 'Жим гантелей сидя', 'Махи гантелями', 'Шраги']
                    },
                    {
                        name: 'День 4 - Становая тяга',
                        exercises: ['Становая тяга', 'Румынская тяга', 'Тяга штанги в наклоне', 'Гиперэкстензия']
                    }
                ]
            },
            hypertrophy: {
                name: 'Программа на массу',
                description: 'Высокий объем',
                workouts: [
                    {
                        name: 'Грудь + Трицепс',
                        exercises: ['Жим лежа', 'Жим гантелей', 'Разводка гантелей', 'Французский жим', 'Разгибания рук на трицепс']
                    },
                    {
                        name: 'Спина + Бицепс',
                        exercises: ['Подтягивания', 'Тяга штанги в наклоне', 'Тяга верхнего блока', 'Подъем на бицепс', 'Подъем гантелей на бицепс']
                    },
                    {
                        name: 'Ноги',
                        exercises: ['Приседания', 'Жим ногами', 'Разгибания ног', 'Сгибания ног', 'Подъемы на носки']
                    },
                    {
                        name: 'Плечи + Пресс',
                        exercises: ['Жим стоя', 'Махи гантелями', 'Шраги', 'Скручивания', 'Планка']
                    }
                ]
            }
        };
        
        const template = templates[templateType];
        if (!template) return;
        
        Utils.showSuccess(`Применен шаблон: ${template.name}`);
        Utils.hapticFeedback('success');
        
        // Show template details
        this.showTemplateModal(template);
    },
    
    showTemplateModal(template) {
        const modalHTML = `
            <div class="template-modal">
                <h3>${template.name}</h3>
                <p>${template.description}</p>
                <div class="template-workouts">
                    ${template.workouts.map(workout => `
                        <div class="template-workout">
                            <h4>${workout.name}</h4>
                            <ul>
                                ${workout.exercises.map(exercise => `<li>${exercise}</li>`).join('')}
                            </ul>
                        </div>
                    `).join('')}
                </div>
                <button onclick="this.parentElement.remove()" class="btn btn-primary">Закрыть</button>
            </div>
        `;
        
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.8); display: flex; align-items: center;
            justify-content: center; z-index: 10000; padding: 20px;
        `;
        
        overlay.innerHTML = modalHTML;
        document.body.appendChild(overlay);
        
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.remove();
            }
        });
    },
    
    // Social Features
    handleSocialAction(action) {
        Utils.hapticFeedback('medium');
        
        switch (true) {
            case action.includes('Поделиться тренировкой'):
                this.shareWorkout();
                break;
            case action.includes('Отправить достижение'):
                this.shareAchievement();
                break;
            case action.includes('Найти тренировочного партнера'):
                this.findWorkoutPartner();
                break;
        }
    },
    
    async shareWorkout() {
        // Get latest workout
        try {
            const workouts = await storage.get(CONFIG.STORAGE_KEYS.WORKOUTS) || [];
            if (!workouts.length) {
                Utils.showError('Нет тренировок для отправки');
                return;
            }
            
            const latestWorkout = workouts[0];
            const stats = Utils.calculateWorkoutStats(latestWorkout);
            
            const shareText = `🏋️ Только что закончил тренировку!
            
📊 Статистика:
• Тоннаж: ${Utils.formatWeight(stats.tonnage)}
• Повторов: ${stats.reps}
• Упражнений: ${latestWorkout.exercises?.length || 0}

💪 Сделано в @FitnessHubBot`;
            
            if (window.Telegram?.WebApp) {
                window.Telegram.WebApp.sendData(JSON.stringify({
                    type: 'share_workout',
                    text: shareText
                }));
            } else if (navigator.share) {
                await navigator.share({
                    title: 'Моя тренировка',
                    text: shareText
                });
            } else {
                await navigator.clipboard.writeText(shareText);
                Utils.showSuccess('Скопировано в буфер обмена!');
            }
            
        } catch (error) {
            console.error('Failed to share workout:', error);
            Utils.showError('Не удалось поделиться тренировкой');
        }
    },
    
    async shareAchievement() {
        try {
            const userData = await storage.get(CONFIG.STORAGE_KEYS.USER_DATA);
            const workouts = await storage.get(CONFIG.STORAGE_KEYS.WORKOUTS) || [];
            
            const achievements = [
                `🎉 Выполнил ${userData.totalWorkouts} тренировок!`,
                `💪 Поднял ${Utils.formatWeight(userData.totalWeight)} суммарно!`,
                `🔥 ${userData.totalReps} повторений за все время!`,
                `📈 Мой прогресс растет каждый день!`
            ];
            
            const randomAchievement = achievements[Math.floor(Math.random() * achievements.length)];
            
            const shareText = `${randomAchievement}
            
#FitnessGoals #Тренировки
            
Отслеживаю прогресс в @FitnessHubBot`;
            
            if (navigator.share) {
                await navigator.share({
                    title: 'Мое достижение',
                    text: shareText
                });
            } else {
                await navigator.clipboard.writeText(shareText);
                Utils.showSuccess('Достижение скопировано!');
            }
            
        } catch (error) {
            console.error('Failed to share achievement:', error);
            Utils.showError('Не удалось поделиться достижением');
        }
    },
    
    findWorkoutPartner() {
        Utils.showSuccess('Функция в разработке! Скоро появится поиск партнеров.');
        
        // Simulate finding partners
        setTimeout(() => {
            const partners = [
                'Александр К. - ищет партнера для силовых тренировок',
                'Мария В. - тренируется по программе для новичков',
                'Дмитрий С. - занимается бодибилдингом'
            ];
            
            const randomPartner = partners[Math.floor(Math.random() * partners.length)];
            Utils.showSuccess(`Найден партнер: ${randomPartner}`);
        }, 2000);
    },
    
    // 1RM Calculator
    calculate1RM() {
        const weightInput = document.querySelector('.calc-inputs input[placeholder="Вес"]');
        const repsInput = document.querySelector('.calc-inputs input[placeholder="Повторы"]');
        const resultElement = document.getElementById('orm-result');
        
        if (!weightInput || !repsInput || !resultElement) return;
        
        const weight = parseFloat(weightInput.value) || 0;
        const reps = parseInt(repsInput.value) || 0;
        
        if (weight <= 0 || reps <= 0) {
            resultElement.textContent = '-';
            return;
        }
        
        // Brzycki formula: 1RM = weight * (36 / (37 - reps))
        const oneRM = weight * (36 / (37 - reps));
        
        resultElement.textContent = Math.round(oneRM * 10) / 10;
    },
    
    // Debug Functions
    async clearAllData() {
        if (!confirm('Удалить все данные? Это действие нельзя отменить!')) return;
        
        try {
            Components.Loading.show('Очистка данных...');
            await storage.clear();
            Components.Loading.hide();
            
            Utils.showSuccess('Все данные удалены!');
            Utils.hapticFeedback('medium');
            
            this.updateDebugInfo();
        } catch (error) {
            console.error('Failed to clear data:', error);
            Components.Loading.hide();
            Utils.showError('Не удалось очистить данные');
        }
    },
    
    async generateTestData() {
        try {
            Components.Loading.show('Генерация тестовых данных...');
            
            const testWorkouts = [];
            const exercises = ['Жим лежа', 'Приседания', 'Становая тяга', 'Подтягивания', 'Отжимания'];
            
            // Generate workouts for the last 30 days
            for (let i = 0; i < 15; i++) {
                const date = new Date();
                date.setDate(date.getDate() - i * 2);
                
                const workout = {
                    id: Utils.generateId(),
                    date: Utils.getDateString(date),
                    exercises: [],
                    createdAt: date.toISOString(),
                    updatedAt: date.toISOString()
                };
                
                // Add random exercises
                const numExercises = 3 + Math.floor(Math.random() * 3);
                for (let j = 0; j < numExercises; j++) {
                    const exercise = {
                        id: Utils.generateId(),
                        name: exercises[Math.floor(Math.random() * exercises.length)],
                        type: 'single',
                        sets: []
                    };
                    
                    // Add random sets
                    const numSets = 3 + Math.floor(Math.random() * 2);
                    for (let k = 0; k < numSets; k++) {
                        exercise.sets.push({
                            weight: 20 + Math.random() * 80,
                            reps: 5 + Math.floor(Math.random() * 10)
                        });
                    }
                    
                    workout.exercises.push(exercise);
                }
                
                testWorkouts.push(workout);
            }
            
            await storage.set(CONFIG.STORAGE_KEYS.WORKOUTS, testWorkouts);
            
            Components.Loading.hide();
            Utils.showSuccess('Тестовые данные сгенерированы!');
            Utils.hapticFeedback('success');
            
            this.updateDebugInfo();
        } catch (error) {
            console.error('Failed to generate test data:', error);
            Components.Loading.hide();
            Utils.showError('Не удалось сгенерировать данные');
        }
    },
    
    async exportAllData() {
        try {
            const exportData = await storage.exportData();
            
            const filename = `fitness_hub_export_${Utils.getDateString(new Date())}.json`;
            Utils.downloadJSON(exportData, filename);
            
            Utils.showSuccess('Данные экспортированы!');
            Utils.hapticFeedback('light');
        } catch (error) {
            console.error('Failed to export data:', error);
            Utils.showError('Не удалось экспортировать данные');
        }
    },
    
    updateDebugInfo() {
        const storageInfo = storage.getStorageInfo();
        const sizeElement = document.getElementById('storage-size');
        
        if (sizeElement) {
            sizeElement.textContent = Utils.formatStorageSize(storageInfo.size);
        }
    }
};

// Placeholder classes for advanced features
class AIChat {
    constructor() {
        this.context = [];
        this.responses = new Map();
    }
}

class WorkoutTemplates {
    constructor() {
        this.templates = new Map();
    }
}

class AdvancedAnalytics {
    constructor() {
        this.metrics = {};
    }
}

class SocialFeatures {
    constructor() {
        this.connections = [];
    }
}

// Initialize alpha module when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    AlphaModule.init();
});

// Make module globally accessible
window.AlphaModule = AlphaModule;

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AlphaModule;
}
