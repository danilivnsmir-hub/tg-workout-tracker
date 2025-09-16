
// App Configuration
const CONFIG = {
    // App Info
    APP_NAME: 'Fitness Hub',
    VERSION: '1.0.0',
    
    // CloudStorage Configuration
    STORAGE_KEYS: {
        WORKOUTS: 'workouts',
        DRAFT_WORKOUT: 'draftWorkout',
        SETTINGS: 'settings',
        USER_DATA: 'userData'
    },
    
    // Storage Limits
    MAX_STORAGE_SIZE: 512 * 1024, // 512KB
    AUTO_SAVE_INTERVAL: 30000, // 30 seconds
    
    // Weight Configuration
    WEIGHT: {
        MIN: 0.5,
        MAX: 300,
        STEP_LIGHT: 0.5, // Up to 20kg
        STEP_HEAVY: 2.5, // Above 20kg
        THRESHOLD: 20
    },
    
    // Reps Configuration
    REPS: {
        MIN: 1,
        MAX: 50
    },
    
    // UI Configuration
    ANIMATION_DURATION: 300,
    HAPTIC_FEEDBACK: true,
    
    // Date Configuration
    DATE_FORMAT: {
        SHORT: 'dd.MM.yyyy',
        LONG: 'dd MMMM yyyy',
        DISPLAY: 'EEEE, dd MMMM'
    }
};

// Popular Exercises List
const EXERCISES = [
    'Жим лежа',
    'Приседания',
    'Становая тяга',
    'Жим стоя',
    'Подтягивания',
    'Отжимания',
    'Жим гантелей',
    'Тяга штанги в наклоне',
    'Французский жим',
    'Подъем на бицепс',
    'Жим ногами',
    'Разгибания ног',
    'Сгибания ног',
    'Подъемы на носки',
    'Жим в тренажере',
    'Тяга верхнего блока',
    'Тяга нижнего блока',
    'Разводка гантелей',
    'Шраги',
    'Планка',
    'Жим гантелей сидя',
    'Тяга гантелей в наклоне',
    'Выпады',
    'Болгарские приседания',
    'Румынская тяга',
    'Жим штанги узким хватом',
    'Подъем гантелей на бицепс',
    'Разгибания рук на трицепс',
    'Подъемы ног в висе',
    'Скручивания',
    'Гиперэкстензия',
    'Отжимания на брусьях',
    'Жим Арнольда',
    'Махи гантелями',
    'Тяга к подбородку',
    'Фронтальные приседания',
    'Сумо приседания',
    'Приседания в Смите',
    'Жим ногами под углом',
    'Разводка в тренажере'
];

// Exercise Categories
const EXERCISE_CATEGORIES = {
    CHEST: ['Жим лежа', 'Отжимания', 'Жим гантелей', 'Разводка гантелей', 'Жим в тренажере', 'Отжимания на брусьях', 'Разводка в тренажере'],
    BACK: ['Подтягивания', 'Тяга штанги в наклоне', 'Тяга верхнего блока', 'Тяга нижнего блока', 'Тяга гантелей в наклоне', 'Тяга к подбородку'],
    LEGS: ['Приседания', 'Жим ногами', 'Разгибания ног', 'Сгибания ног', 'Выпады', 'Болгарские приседания', 'Фронтальные приседания', 'Сумо приседания', 'Приседания в Смите', 'Жим ногами под углом'],
    SHOULDERS: ['Жим стоя', 'Жим гантелей сидя', 'Махи гантелями', 'Жим Арнольда', 'Тяга к подбородку', 'Шраги'],
    ARMS: ['Французский жим', 'Подъем на бицепс', 'Жим штанги узким хватом', 'Подъем гантелей на бицепс', 'Разгибания рук на трицепс'],
    DEADLIFT: ['Становая тяга', 'Румынская тяга'],
    CALVES: ['Подъемы на носки'],
    CORE: ['Планка', 'Подъемы ног в висе', 'Скручивания', 'Гиперэкстензия']
};

// Theme Configuration
const THEME = {
    COLORS: {
        PRIMARY: '#6366f1',
        SUCCESS: '#10b981',
        DANGER: '#ef4444',
        WARNING: '#f59e0b',
        INFO: '#3b82f6'
    },
    
    DARK_MODE: true,
    
    GRADIENTS: {
        PRIMARY: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
        SUCCESS: 'linear-gradient(135deg, #10b981, #34d399)',
        DANGER: 'linear-gradient(135deg, #ef4444, #f87171)'
    }
};

// Default Settings
const DEFAULT_SETTINGS = {
    theme: 'dark',
    hapticFeedback: true,
    autoSave: true,
    soundEffects: false,
    defaultWeightUnit: 'kg',
    firstDayOfWeek: 1, // Monday
    notifications: true
};

// Error Messages
const ERROR_MESSAGES = {
    STORAGE_FULL: 'Недостаточно места в хранилище',
    NETWORK_ERROR: 'Ошибка подключения',
    DATA_CORRUPTED: 'Данные повреждены',
    INVALID_INPUT: 'Неверные данные',
    EXERCISE_NOT_FOUND: 'Упражнение не найдено',
    WORKOUT_NOT_FOUND: 'Тренировка не найдена',
    PERMISSION_DENIED: 'Нет разрешения',
    UNKNOWN_ERROR: 'Неизвестная ошибка'
};

// Success Messages
const SUCCESS_MESSAGES = {
    WORKOUT_SAVED: 'Тренировка сохранена!',
    EXERCISE_ADDED: 'Упражнение добавлено!',
    SET_ADDED: 'Подход добавлен!',
    DATA_CLEARED: 'Данные очищены!',
    SETTINGS_SAVED: 'Настройки сохранены!'
};

// Validation Rules
const VALIDATION = {
    EXERCISE_NAME: {
        MIN_LENGTH: 2,
        MAX_LENGTH: 50
    },
    SET_COUNT: {
        MIN: 1,
        MAX: 20
    },
    WORKOUT_DURATION: {
        MAX_HOURS: 6
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        CONFIG,
        EXERCISES,
        EXERCISE_CATEGORIES,
        THEME,
        DEFAULT_SETTINGS,
        ERROR_MESSAGES,
        SUCCESS_MESSAGES,
        VALIDATION
    };
}
