
// Главная страница - логика домашнего экрана
class MainApp {
    constructor() {
        this.recentWorkouts = [];
        this.init();
    }

    async init() {
        await this.loadRecentWorkouts();
        this.renderRecentWorkouts();
    }

    async loadRecentWorkouts() {
        try {
            const allWorkouts = await window.workoutStorage.getData('workouts') || [];
            
            // Сортируем по дате и берем последние 5 тренировок
            this.recentWorkouts = allWorkouts
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .slice(0, 5);
                
        } catch (error) {
            console.error('Ошибка загрузки последних тренировок:', error);
            window.ui.showToast('Ошибка загрузки данных', 'error');
        }
    }

    renderRecentWorkouts() {
        const workoutsList = document.getElementById('workoutsList');
        
        if (this.recentWorkouts.length === 0) {
            workoutsList.innerHTML = `
                <div class="empty-state">
                    <p>Пока нет тренировок</p>
                    <a href="workout.html" class="btn primary">Начать тренировку</a>
                </div>
            `;
            return;
        }

        workoutsList.innerHTML = '';
        
        this.recentWorkouts.forEach(workout => {
            const workoutElement = this.createWorkoutPreview(workout);
            workoutsList.appendChild(workoutElement);
        });
    }

    createWorkoutPreview(workout) {
        const preview = document.createElement('div');
        preview.className = 'workout-preview';
        
        const date = new Date(workout.date);
        const exercisesCount = workout.exercises.length;
        const totalSets = workout.exercises.reduce((total, ex) => total + ex.sets.length, 0);
        
        preview.innerHTML = `
            <div class="workout-preview-header">
                <div class="workout-preview-date">${window.ui.formatDate(date)}</div>
                <div class="workout-preview-stats">
                    ${exercisesCount} упр. • ${totalSets} подх.
                </div>
            </div>
            <div class="workout-preview-exercises">
                ${workout.exercises.slice(0, 3).map(ex => ex.name).join(' • ')}
                ${workout.exercises.length > 3 ? '...' : ''}
            </div>
        `;
        
        return preview;
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    window.mainApp = new MainApp();
});
