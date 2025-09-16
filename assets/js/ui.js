
// UI утилиты и общие функции интерфейса
class UIManager {
    constructor() {
        this.currentModal = null;
        this.init();
    }

    init() {
        this.setupTelegramWebApp();
        this.setupModals();
    }

    setupTelegramWebApp() {
        // Инициализация Telegram WebApp
        if (window.Telegram && window.Telegram.WebApp) {
            const webApp = window.Telegram.WebApp;
            webApp.ready();
            webApp.expand();
            
            // Настройка темы
            document.body.style.backgroundColor = webApp.backgroundColor || '#ffffff';
            document.body.style.color = webApp.textColor || '#000000';
        }
    }

    setupModals() {
        // Закрытие модальных окон по клику на фон
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal(e.target);
            }
        });

        // Закрытие по ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.currentModal) {
                this.closeModal(this.currentModal);
            }
        });
    }

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'flex';
            this.currentModal = modal;
            document.body.classList.add('modal-open');
        }
    }

    closeModal(modal) {
        if (typeof modal === 'string') {
            modal = document.getElementById(modal);
        }
        
        if (modal) {
            modal.style.display = 'none';
            this.currentModal = null;
            document.body.classList.remove('modal-open');
        }
    }

    showToast(message, type = 'info', duration = 3000) {
        // Создаем toast уведомление
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        // Добавляем стили, если их нет
        if (!document.getElementById('toast-styles')) {
            const styles = document.createElement('style');
            styles.id = 'toast-styles';
            styles.textContent = `
                .toast {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    padding: 12px 24px;
                    border-radius: 8px;
                    color: white;
                    font-weight: 500;
                    z-index: 1000;
                    opacity: 0;
                    transform: translateX(100%);
                    transition: all 0.3s ease;
                }
                .toast.show {
                    opacity: 1;
                    transform: translateX(0);
                }
                .toast-info { background-color: #007bff; }
                .toast-success { background-color: #28a745; }
                .toast-warning { background-color: #ffc107; color: #000; }
                .toast-error { background-color: #dc3545; }
            `;
            document.head.appendChild(styles);
        }

        document.body.appendChild(toast);

        // Показываем toast
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);

        // Удаляем toast
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, duration);
    }

    formatDate(date) {
        if (!(date instanceof Date)) {
            date = new Date(date);
        }
        
        return date.toLocaleDateString('ru-RU', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    formatTime(date) {
        if (!(date instanceof Date)) {
            date = new Date(date);
        }
        
        return date.toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    formatDateTime(date) {
        return `${this.formatDate(date)} в ${this.formatTime(date)}`;
    }

    // Создание элементов списка
    createExerciseItem(exercise, index) {
        const item = document.createElement('div');
        item.className = 'exercise-item';
        item.innerHTML = `
            <div class="exercise-header">
                <h4>${exercise.name}</h4>
                <button class="btn-icon remove-exercise" data-index="${index}">×</button>
            </div>
            <div class="sets-list">
                ${exercise.sets.map((set, setIndex) => `
                    <div class="set-item">
                        <span>Подход ${setIndex + 1}:</span>
                        <span>${set.reps} повторений</span>
                        ${set.weight ? `<span>${set.weight} кг</span>` : ''}
                    </div>
                `).join('')}
            </div>
        `;
        
        return item;
    }

    createWorkoutSummary(workout) {
        const summary = document.createElement('div');
        summary.className = 'workout-summary';
        
        const date = new Date(workout.date);
        const exercisesCount = workout.exercises.length;
        const totalSets = workout.exercises.reduce((total, ex) => total + ex.sets.length, 0);
        
        summary.innerHTML = `
            <div class="workout-date">${this.formatDate(date)}</div>
            <div class="workout-stats">
                <span>${exercisesCount} упражнений</span>
                <span>${totalSets} подходов</span>
            </div>
            <div class="workout-exercises">
                ${workout.exercises.map(ex => ex.name).join(', ')}
            </div>
        `;
        
        return summary;
    }

    // Валидация формы
    validateExerciseForm() {
        const exerciseSelect = document.getElementById('exerciseSelect').value;
        const exerciseNameInput = document.getElementById('exerciseName').value.trim();
        
        // Проверяем, что упражнение выбрано или введено
        if (!exerciseSelect || (exerciseSelect === 'Другое' && !exerciseNameInput)) {
            this.showToast('Выберите или введите название упражнения', 'warning');
            return false;
        }

        const sets = this.getCurrentSets();
        if (sets.length === 0) {
            this.showToast('Добавьте хотя бы один подход', 'warning');
            return false;
        }

        return true;
    }

    getCurrentSets() {
        const setElements = document.querySelectorAll('#setsList .set-input');
        const sets = [];

        setElements.forEach(setElement => {
            const repsSelect = setElement.querySelector('.reps-input');
            const weightSelect = setElement.querySelector('.weight-input');
            
            const reps = parseInt(repsSelect.value) || 0;
            const weight = parseFloat(weightSelect.value) || 0;
            
            if (reps > 0) {
                sets.push({ reps, weight });
            }
        });

        return sets;
    }

    // Создание элемента подхода
    createSetInput() {
        const setDiv = document.createElement('div');
        setDiv.className = 'set-input';
        
        // Создаем опции для повторений (1-50)
        let repsOptions = '<option value="">Выберите...</option>';
        for (let i = 1; i <= 50; i++) {
            const selected = i === 10 ? 'selected' : '';
            repsOptions += `<option value="${i}" ${selected}>${i}</option>`;
        }
        
        // Создаем опции для весов (0-200кг с шагом 2.5кг)
        let weightOptions = '<option value="0" selected>Без веса</option>';
        for (let i = 2.5; i <= 200; i += 2.5) {
            weightOptions += `<option value="${i}">${i} кг</option>`;
        }
        
        setDiv.innerHTML = `
            <div class="form-row">
                <div class="form-group">
                    <label>Повторения:</label>
                    <select class="reps-input">${repsOptions}</select>
                </div>
                <div class="form-group">
                    <label>Вес:</label>
                    <select class="weight-input">${weightOptions}</select>
                </div>
                <button type="button" class="btn-icon remove-set">×</button>
            </div>
        `;
        
        // Добавляем обработчик удаления
        const removeBtn = setDiv.querySelector('.remove-set');
        removeBtn.addEventListener('click', () => {
            setDiv.remove();
        });
        
        return setDiv;
    }

    // Обновление счетчиков
    updateWorkoutCounter(count) {
        const counter = document.getElementById('totalWorkouts');
        if (counter) {
            counter.textContent = count;
        }
    }

    updateWeeklyCounter(count) {
        const counter = document.getElementById('thisWeekWorkouts');
        if (counter) {
            counter.textContent = count;
        }
    }

    updateExerciseCounter(count) {
        const counter = document.getElementById('totalExercises');
        if (counter) {
            counter.textContent = count;
        }
    }

    // Показать/скрыть индикатор загрузки
    showLoading(show = true) {
        let loader = document.getElementById('loading-indicator');
        
        if (show && !loader) {
            loader = document.createElement('div');
            loader.id = 'loading-indicator';
            loader.innerHTML = `
                <div class="loading-spinner">
                    <div class="spinner"></div>
                    <p>Загрузка...</p>
                </div>
            `;
            document.body.appendChild(loader);
        } else if (!show && loader) {
            loader.remove();
        }
    }
}

// Глобальная инициализация UI менеджера
const ui = new UIManager();
window.ui = ui;
