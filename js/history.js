
// History Module
const HistoryModule = {
    workouts: [],
    
    init() {
        this.loadHistory();
        this.setupEventListeners();
    },
    
    setupEventListeners() {
        // History list click events will be handled dynamically
    },
    
    async loadHistory() {
        try {
            Components.Loading.show('Загрузка истории...');
            
            this.workouts = await storage.get(CONFIG.STORAGE_KEYS.WORKOUTS) || [];
            this.renderHistory();
            
            Components.Loading.hide();
        } catch (error) {
            console.error('Failed to load history:', error);
            Components.Loading.hide();
            Utils.showError('Не удалось загрузить историю');
        }
    },
    
    renderHistory() {
        const historyList = document.getElementById('history-list');
        const emptyHistory = document.getElementById('empty-history');
        
        if (!historyList) return;
        
        // Clear existing content
        historyList.innerHTML = '';
        
        if (!this.workouts || this.workouts.length === 0) {
            // Show empty state
            if (emptyHistory) {
                historyList.appendChild(emptyHistory);
                emptyHistory.style.display = 'flex';
            }
            return;
        }
        
        // Hide empty state
        if (emptyHistory) {
            emptyHistory.style.display = 'none';
        }
        
        // Sort workouts by date (newest first)
        const sortedWorkouts = [...this.workouts].sort((a, b) => 
            new Date(b.date) - new Date(a.date)
        );
        
        // Render workout items
        sortedWorkouts.forEach((workout, index) => {
            const historyItem = this.createHistoryItem(workout, index);
            historyList.appendChild(historyItem);
        });
    },
    
    createHistoryItem(workout, index) {
        const stats = Utils.calculateWorkoutStats(workout);
        const exerciseNames = this.getExerciseNames(workout);
        
        const item = document.createElement('div');
        item.className = 'history-item';
        item.setAttribute('data-workout-index', index);
        
        item.innerHTML = `
            <div class="history-header">
                <div class="history-date">
                    ${Utils.formatDateRelative(workout.date)}
                </div>
                <div class="history-stats">
                    <span>${Utils.formatWeight(stats.tonnage)}</span>
                    <span>${stats.reps} повторов</span>
                    <span>${workout.exercises?.length || 0} упражнений</span>
                </div>
            </div>
            <div class="history-exercises">
                ${exerciseNames.slice(0, 3).join(', ')}${exerciseNames.length > 3 ? ` и ещё ${exerciseNames.length - 3}` : ''}
            </div>
        `;
        
        // Add click event
        item.addEventListener('click', () => this.showWorkoutDetail(workout));
        
        // Add animation
        item.classList.add('fade-in');
        
        return item;
    },
    
    getExerciseNames(workout) {
        if (!workout.exercises) return [];
        
        const names = [];
        workout.exercises.forEach(exercise => {
            if (exercise.type === 'superset') {
                const supersetNames = exercise.exercises
                    ?.map(e => e.name)
                    .filter(name => name)
                    .join(' + ');
                if (supersetNames) {
                    names.push(`${supersetNames} (суперсет)`);
                }
            } else if (exercise.name) {
                names.push(exercise.name);
            }
        });
        
        return names;
    },
    
    showWorkoutDetail(workout) {
        const modal = document.getElementById('workout-detail-modal');
        const titleElement = document.getElementById('workout-detail-title');
        const contentElement = document.getElementById('workout-detail-content');
        
        if (!modal || !titleElement || !contentElement) return;
        
        // Set title
        titleElement.textContent = `Тренировка ${Utils.formatDateRelative(workout.date)}`;
        
        // Render content
        contentElement.innerHTML = this.renderWorkoutDetail(workout);
        
        // Show modal
        Components.Modal.show('workout-detail-modal');
        
        Utils.hapticFeedback('light');
    },
    
    renderWorkoutDetail(workout) {
        const stats = Utils.calculateWorkoutStats(workout);
        
        let html = `
            <div class="workout-detail-stats">
                <div class="stat-card">
                    <div class="stat-value">${Utils.formatNumber(stats.tonnage, 1)}</div>
                    <div class="stat-label">Тоннаж (кг)</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.reps}</div>
                    <div class="stat-label">Повторов</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${Utils.formatNumber(stats.maxWeight, 1)}</div>
                    <div class="stat-label">Макс вес (кг)</div>
                </div>
            </div>
        `;
        
        if (workout.exercises && workout.exercises.length > 0) {
            workout.exercises.forEach((exercise, index) => {
                html += this.renderExerciseDetail(exercise, index + 1);
            });
        } else {
            html += '<p class="text-center text-muted">Упражнений не найдено</p>';
        }
        
        return html;
    },
    
    renderExerciseDetail(exercise, number) {
        let html = '';
        
        if (exercise.type === 'superset') {
            html += `
                <div class="workout-detail-exercise">
                    <h4>🔗 Суперсет ${number}</h4>
                    <div class="superset-detail">
            `;
            
            if (exercise.exercises) {
                exercise.exercises.forEach((subExercise, subIndex) => {
                    html += `
                        <div class="superset-sub-exercise">
                            <h5>${subExercise.name || 'Без названия'}</h5>
                            ${this.renderSetsDetail(subExercise.sets)}
                        </div>
                    `;
                });
            }
            
            html += `
                    </div>
                </div>
            `;
        } else {
            html += `
                <div class="workout-detail-exercise">
                    <h4>${exercise.name || 'Без названия'}</h4>
                    ${this.renderSetsDetail(exercise.sets)}
                </div>
            `;
        }
        
        return html;
    },
    
    renderSetsDetail(sets) {
        if (!sets || sets.length === 0) {
            return '<p class="text-muted">Подходов не найдено</p>';
        }
        
        let html = '<div class="workout-detail-sets">';
        
        sets.forEach((set, index) => {
            const weight = parseFloat(set.weight) || 0;
            const reps = parseInt(set.reps) || 0;
            
            html += `
                <div class="workout-detail-set">
                    <span>Подход ${index + 1}</span>
                    <span>${Utils.formatWeight(weight)} × ${reps}</span>
                </div>
            `;
        });
        
        html += '</div>';
        return html;
    },
    
    // Refresh history when returning to screen
    refresh() {
        this.loadHistory();
    },
    
    // Get workout by date
    getWorkoutByDate(date) {
        const dateString = Utils.getDateString(date);
        return this.workouts.find(workout => workout.date === dateString);
    },
    
    // Get workouts in date range
    getWorkoutsInRange(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        return this.workouts.filter(workout => {
            const workoutDate = new Date(workout.date);
            return workoutDate >= start && workoutDate <= end;
        });
    },
    
    // Search workouts
    searchWorkouts(query) {
        if (!query || !query.trim()) return this.workouts;
        
        const searchTerm = query.toLowerCase().trim();
        
        return this.workouts.filter(workout => {
            // Search in exercise names
            const exerciseNames = this.getExerciseNames(workout);
            const hasMatchingExercise = exerciseNames.some(name => 
                name.toLowerCase().includes(searchTerm)
            );
            
            // Search in date
            const dateMatch = Utils.formatDateRelative(workout.date)
                .toLowerCase()
                .includes(searchTerm);
            
            return hasMatchingExercise || dateMatch;
        });
    },
    
    // Export workout data
    exportWorkout(workout) {
        const stats = Utils.calculateWorkoutStats(workout);
        const exerciseNames = this.getExerciseNames(workout);
        
        const exportData = {
            date: workout.date,
            formattedDate: Utils.formatDateRelative(workout.date),
            stats: {
                tonnage: stats.tonnage,
                reps: stats.reps,
                maxWeight: stats.maxWeight,
                exercises: workout.exercises?.length || 0
            },
            exercises: exerciseNames,
            raw: workout
        };
        
        const filename = `workout_${workout.date}.json`;
        Utils.downloadJSON(exportData, filename);
    },
    
    // Share workout
    async shareWorkout(workout) {
        const stats = Utils.calculateWorkoutStats(workout);
        const exerciseNames = this.getExerciseNames(workout);
        
        const shareText = `🏋️ Тренировка ${Utils.formatDateRelative(workout.date)}
        
📊 Статистика:
• Тоннаж: ${Utils.formatWeight(stats.tonnage)}
• Повторов: ${stats.reps}
• Макс вес: ${Utils.formatWeight(stats.maxWeight)}
• Упражнений: ${workout.exercises?.length || 0}

💪 Упражнения:
${exerciseNames.slice(0, 5).join('\n')}
${exerciseNames.length > 5 ? `\n... и ещё ${exerciseNames.length - 5}` : ''}

#FitnessHub #Тренировка`;
        
        try {
            if (navigator.share) {
                await navigator.share({
                    title: 'Моя тренировка',
                    text: shareText
                });
            } else {
                // Fallback - copy to clipboard
                await navigator.clipboard.writeText(shareText);
                Utils.showSuccess('Скопировано в буфер обмена!');
            }
            
            Utils.hapticFeedback('success');
        } catch (error) {
            console.error('Failed to share workout:', error);
            Utils.showError('Не удалось поделиться тренировкой');
        }
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HistoryModule;
}
