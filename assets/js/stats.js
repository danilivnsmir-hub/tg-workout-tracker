
// Статистика тренировок
class StatsManager {
    constructor() {
        this.workouts = [];
        this.chart = null;
        this.init();
    }

    async init() {
        await this.loadWorkouts();
        this.renderStats();
        this.renderChart();
        this.renderExercisesStats();
        this.renderWorkoutHistory();
    }

    async loadWorkouts() {
        try {
            this.workouts = await window.workoutStorage.getData('workouts') || [];
            console.log('Загружено тренировок для статистики:', this.workouts.length);
        } catch (error) {
            console.error('Ошибка загрузки данных для статистики:', error);
            window.ui.showToast('Ошибка загрузки статистики', 'error');
        }
    }

    renderStats() {
        const totalWorkouts = this.workouts.length;
        const thisWeekWorkouts = this.getThisWeekWorkouts();
        const totalExercises = this.getUniqueExercisesCount();

        window.ui.updateWorkoutCounter(totalWorkouts);
        window.ui.updateWeeklyCounter(thisWeekWorkouts);
        window.ui.updateExerciseCounter(totalExercises);
    }

    getThisWeekWorkouts() {
        const now = new Date();
        const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
        weekStart.setHours(0, 0, 0, 0);

        return this.workouts.filter(workout => {
            const workoutDate = new Date(workout.date);
            return workoutDate >= weekStart;
        }).length;
    }

    getUniqueExercisesCount() {
        const exerciseNames = new Set();
        
        this.workouts.forEach(workout => {
            workout.exercises.forEach(exercise => {
                exerciseNames.add(exercise.name.toLowerCase());
            });
        });

        return exerciseNames.size;
    }

    renderChart() {
        const ctx = document.getElementById('workoutsChart').getContext('2d');
        
        // Подготавливаем данные для графика (последние 7 дней)
        const last7Days = this.getLast7DaysData();
        
        // Уничтожаем предыдущий график
        if (this.chart) {
            this.chart.destroy();
        }

        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: last7Days.labels,
                datasets: [{
                    label: 'Тренировки',
                    data: last7Days.data,
                    borderColor: '#007bff',
                    backgroundColor: 'rgba(0, 123, 255, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }

    getLast7DaysData() {
        const labels = [];
        const data = [];
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            
            const dateString = date.toISOString().split('T')[0];
            const workoutsCount = this.workouts.filter(w => w.date === dateString).length;
            
            labels.push(date.toLocaleDateString('ru-RU', { weekday: 'short' }));
            data.push(workoutsCount);
        }
        
        return { labels, data };
    }

    renderExercisesStats() {
        const exercisesStatsList = document.getElementById('exercisesStatsList');
        const exercisesStats = this.getExercisesStats();
        
        if (exercisesStats.length === 0) {
            exercisesStatsList.innerHTML = '<p>Нет данных для отображения</p>';
            return;
        }

        exercisesStatsList.innerHTML = '';
        
        exercisesStats.slice(0, 10).forEach(stat => {
            const statElement = document.createElement('div');
            statElement.className = 'exercise-stat';
            statElement.innerHTML = `
                <div class="exercise-stat-header">
                    <h4>${stat.name}</h4>
                    <span class="exercise-stat-count">${stat.count} раз</span>
                </div>
                <div class="exercise-stat-details">
                    <span>Подходов: ${stat.totalSets}</span>
                    <span>Повторений: ${stat.totalReps}</span>
                    ${stat.maxWeight > 0 ? `<span>Макс. вес: ${stat.maxWeight} кг</span>` : ''}
                </div>
            `;
            
            exercisesStatsList.appendChild(statElement);
        });
    }

    getExercisesStats() {
        const stats = {};

        this.workouts.forEach(workout => {
            workout.exercises.forEach(exercise => {
                const name = exercise.name;
                
                if (!stats[name]) {
                    stats[name] = {
                        name: name,
                        count: 0,
                        totalSets: 0,
                        totalReps: 0,
                        maxWeight: 0,
                        totalWeight: 0
                    };
                }

                stats[name].count++;
                stats[name].totalSets += exercise.sets.length;
                
                exercise.sets.forEach(set => {
                    stats[name].totalReps += set.reps;
                    stats[name].totalWeight += set.weight * set.reps;
                    stats[name].maxWeight = Math.max(stats[name].maxWeight, set.weight);
                });
            });
        });

        return Object.values(stats).sort((a, b) => b.count - a.count);
    }

    renderWorkoutHistory() {
        const workoutHistory = document.getElementById('workoutHistory');
        
        if (this.workouts.length === 0) {
            workoutHistory.innerHTML = '<p>История тренировок пуста</p>';
            return;
        }

        workoutHistory.innerHTML = '';
        
        // Сортируем по дате (новые сначала) и показываем последние 10
        const sortedWorkouts = [...this.workouts]
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 10);

        sortedWorkouts.forEach(workout => {
            const historyElement = document.createElement('div');
            historyElement.className = 'workout-history-item';
            
            const date = new Date(workout.date);
            const duration = this.calculateWorkoutDuration(workout);
            
            historyElement.innerHTML = `
                <div class="workout-history-header">
                    <div class="workout-history-date">${window.ui.formatDate(date)}</div>
                    <div class="workout-history-duration">${duration}</div>
                </div>
                <div class="workout-history-exercises">
                    ${workout.exercises.map(ex => `
                        <div class="exercise-summary">
                            <span class="exercise-name">${ex.name}</span>
                            <span class="exercise-sets">${ex.sets.length} × ${ex.sets.map(s => s.reps).join('-')}</span>
                        </div>
                    `).join('')}
                </div>
            `;
            
            workoutHistory.appendChild(historyElement);
        });
    }

    calculateWorkoutDuration(workout) {
        if (workout.startTime && workout.endTime) {
            const start = new Date(workout.startTime);
            const end = new Date(workout.endTime);
            const duration = Math.round((end - start) / (1000 * 60)); // в минутах
            
            if (duration > 60) {
                const hours = Math.floor(duration / 60);
                const minutes = duration % 60;
                return `${hours}ч ${minutes}м`;
            } else {
                return `${duration}м`;
            }
        }
        
        return 'Неизвестно';
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    window.statsManager = new StatsManager();
});
