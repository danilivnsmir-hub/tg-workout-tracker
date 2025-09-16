
// Логика тренировок с улучшенной системой сохранения данных
class WorkoutManager {
    constructor() {
        this.currentWorkout = {
            date: new Date().toISOString().split('T')[0],
            exercises: [],
            startTime: null,
            endTime: null
        };
        this.isDirty = false; // Флаг несохраненных изменений
        this.lastSaveTime = null;
        
        this.init();
    }

    async init() {
        await this.loadWorkoutData();
        this.setupEventListeners();
        this.setupUI();
        this.startWorkout();
    }

    startWorkout() {
        this.currentWorkout.startTime = new Date().toISOString();
        this.isDirty = true;
        console.log('Тренировка начата');
    }

    async loadWorkoutData() {
        try {
            // Загружаем существующие тренировки
            const workouts = await window.workoutStorage.getData('workouts') || [];
            console.log('Загружено тренировок:', workouts.length);
            
            // Проверяем, есть ли незавершенная тренировка
            const savedDraft = await window.workoutStorage.getData('workout_draft');
            if (savedDraft && savedDraft.date === new Date().toISOString().split('T')[0]) {
                this.currentWorkout = savedDraft;
                this.isDirty = true;
                this.renderExercises();
                window.ui.showToast('Восстановлена незавершенная тренировка', 'info');
            }
        } catch (error) {
            console.error('Ошибка загрузки данных тренировки:', error);
            window.ui.showToast('Ошибка загрузки данных', 'error');
        }
    }

    setupEventListeners() {
        // Кнопка добавления упражнения
        document.getElementById('addExerciseBtn').addEventListener('click', () => {
            this.showExerciseModal();
        });

        // Кнопка сохранения тренировки
        document.getElementById('saveWorkoutBtn').addEventListener('click', () => {
            this.saveWorkout();
        });

        // Кнопка очистки тренировки
        document.getElementById('clearWorkoutBtn').addEventListener('click', () => {
            this.clearWorkout();
        });

        // Изменение даты тренировки
        document.getElementById('workoutDate').addEventListener('change', (e) => {
            this.currentWorkout.date = e.target.value;
            this.isDirty = true;
            this.saveDraft();
        });

        // Модальное окно упражнения
        this.setupExerciseModal();

        // Автосохранение при изменениях
        document.addEventListener('input', () => {
            this.isDirty = true;
        });

        // Периодическое автосохранение
        setInterval(() => {
            if (this.isDirty) {
                this.saveDraft();
            }
        }, 10000); // Каждые 10 секунд
    }

    setupExerciseModal() {
        // Кнопка добавления подхода
        document.getElementById('addSetBtn').addEventListener('click', () => {
            this.addSetInput();
        });

        // Кнопка сохранения упражнения
        document.getElementById('saveExerciseBtn').addEventListener('click', () => {
            this.saveExercise();
        });

        // Кнопка отмены
        document.getElementById('cancelExerciseBtn').addEventListener('click', () => {
            this.closeExerciseModal();
        });
    }

    setupUI() {
        // Устанавливаем текущую дату
        document.getElementById('workoutDate').value = this.currentWorkout.date;
        
        // Рендерим упражнения, если есть
        this.renderExercises();
    }

    showExerciseModal() {
        // Очищаем модальное окно
        document.getElementById('exerciseName').value = '';
        document.getElementById('setsList').innerHTML = '';
        
        // Добавляем первый подход
        this.addSetInput();
        
        window.ui.showModal('exerciseModal');
    }

    closeExerciseModal() {
        window.ui.closeModal('exerciseModal');
    }

    addSetInput() {
        const setsList = document.getElementById('setsList');
        const setInput = window.ui.createSetInput();
        setsList.appendChild(setInput);
    }

    saveExercise() {
        if (!window.ui.validateExerciseForm()) {
            return;
        }

        const exerciseName = document.getElementById('exerciseName').value.trim();
        const sets = window.ui.getCurrentSets();

        // Создаем упражнение
        const exercise = {
            id: Date.now(),
            name: exerciseName,
            sets: sets,
            timestamp: new Date().toISOString()
        };

        // Добавляем в текущую тренировку
        this.currentWorkout.exercises.push(exercise);
        this.isDirty = true;

        // Сохраняем черновик и обновляем UI
        this.saveDraft();
        this.renderExercises();
        this.closeExerciseModal();

        window.ui.showToast(`Упражнение "${exerciseName}" добавлено`, 'success');
    }

    removeExercise(index) {
        if (confirm('Удалить упражнение?')) {
            this.currentWorkout.exercises.splice(index, 1);
            this.isDirty = true;
            this.saveDraft();
            this.renderExercises();
            
            window.ui.showToast('Упражнение удалено', 'info');
        }
    }

    renderExercises() {
        const exercisesList = document.getElementById('exercisesList');
        exercisesList.innerHTML = '';

        this.currentWorkout.exercises.forEach((exercise, index) => {
            const exerciseElement = window.ui.createExerciseItem(exercise, index);
            
            // Добавляем обработчик удаления
            const removeBtn = exerciseElement.querySelector('.remove-exercise');
            removeBtn.addEventListener('click', () => {
                this.removeExercise(index);
            });

            exercisesList.appendChild(exerciseElement);
        });
    }

    async saveDraft() {
        if (!this.isDirty) return;

        try {
            await window.workoutStorage.setData('workout_draft', this.currentWorkout);
            this.lastSaveTime = new Date();
            this.isDirty = false;
            console.log('Черновик тренировки сохранен');
        } catch (error) {
            console.error('Ошибка сохранения черновика:', error);
        }
    }

    async saveWorkout() {
        if (this.currentWorkout.exercises.length === 0) {
            window.ui.showToast('Добавьте хотя бы одно упражнение', 'warning');
            return;
        }

        try {
            window.ui.showLoading(true);

            // Завершаем тренировку
            this.currentWorkout.endTime = new Date().toISOString();
            this.currentWorkout.id = Date.now();

            // Загружаем существующие тренировки
            let workouts = await window.workoutStorage.getData('workouts') || [];

            // Добавляем новую тренировку
            workouts.push({...this.currentWorkout});

            // Сохраняем обновленный список
            await window.workoutStorage.setData('workouts', workouts);

            // Очищаем черновик
            await window.workoutStorage.clearData('workout_draft');

            // Сбрасываем текущую тренировку
            this.currentWorkout = {
                date: new Date().toISOString().split('T')[0],
                exercises: [],
                startTime: null,
                endTime: null
            };
            this.isDirty = false;

            this.renderExercises();
            window.ui.showLoading(false);
            window.ui.showToast('Тренировка сохранена!', 'success');

            // Перенаправляем на статистику через 2 секунды
            setTimeout(() => {
                window.location.href = 'stats.html';
            }, 2000);

        } catch (error) {
            console.error('Ошибка сохранения тренировки:', error);
            window.ui.showLoading(false);
            window.ui.showToast('Ошибка сохранения тренировки', 'error');
        }
    }

    clearWorkout() {
        if (confirm('Очистить все упражнения?')) {
            this.currentWorkout.exercises = [];
            this.isDirty = true;
            this.saveDraft();
            this.renderExercises();
            
            window.ui.showToast('Тренировка очищена', 'info');
        }
    }

    // Получение статистики текущей тренировки
    getCurrentWorkoutStats() {
        const totalExercises = this.currentWorkout.exercises.length;
        const totalSets = this.currentWorkout.exercises.reduce((total, ex) => total + ex.sets.length, 0);
        const totalReps = this.currentWorkout.exercises.reduce((total, ex) => 
            total + ex.sets.reduce((setTotal, set) => setTotal + set.reps, 0), 0
        );
        const totalWeight = this.currentWorkout.exercises.reduce((total, ex) => 
            total + ex.sets.reduce((setTotal, set) => setTotal + (set.weight * set.reps), 0), 0
        );

        return {
            totalExercises,
            totalSets,
            totalReps,
            totalWeight
        };
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    window.workoutManager = new WorkoutManager();
});
