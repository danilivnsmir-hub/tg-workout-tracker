
// Statistics Module
const StatisticsModule = {
    workouts: [],
    stats: null,
    records: [],
    
    init() {
        this.loadStatistics();
        this.setupEventListeners();
    },
    
    setupEventListeners() {
        const exerciseSelect = document.getElementById('exercise-select');
        if (exerciseSelect) {
            exerciseSelect.addEventListener('change', (e) => {
                this.showProgressChart(e.target.value);
            });
        }
    },
    
    async loadStatistics() {
        try {
            Components.Loading.show('Загрузка статистики...');
            
            this.workouts = await storage.get(CONFIG.STORAGE_KEYS.WORKOUTS) || [];
            this.calculateStatistics();
            this.calculateRecords();
            this.renderStatistics();
            this.populateExerciseSelector();
            
            Components.Loading.hide();
        } catch (error) {
            console.error('Failed to load statistics:', error);
            Components.Loading.hide();
            Utils.showError('Не удалось загрузить статистику');
        }
    },
    
    calculateStatistics() {
        if (!this.workouts.length) {
            this.stats = {
                totalWorkouts: 0,
                totalTonnage: 0,
                averageTonnage: 0,
                totalReps: 0,
                totalSets: 0,
                bestDay: null,
                mostActiveDay: null,
                averageWorkoutDuration: 0,
                uniqueExercises: 0,
                currentStreak: 0,
                longestStreak: 0
            };
            return;
        }
        
        let totalTonnage = 0;
        let totalReps = 0;
        let totalSets = 0;
        let bestDayTonnage = 0;
        let bestDay = null;
        const uniqueExercises = new Set();
        const workoutsByDay = {};
        
        this.workouts.forEach(workout => {
            const workoutStats = Utils.calculateWorkoutStats(workout);
            
            totalTonnage += workoutStats.tonnage;
            totalReps += workoutStats.reps;
            
            // Track best day
            if (workoutStats.tonnage > bestDayTonnage) {
                bestDayTonnage = workoutStats.tonnage;
                bestDay = workout.date;
            }
            
            // Count exercises and sets
            if (workout.exercises) {
                workout.exercises.forEach(exercise => {
                    if (exercise.type === 'superset') {
                        exercise.exercises.forEach(subExercise => {
                            if (subExercise.name) {
                                uniqueExercises.add(subExercise.name);
                            }
                            totalSets += (subExercise.sets?.length || 0);
                        });
                    } else {
                        if (exercise.name) {
                            uniqueExercises.add(exercise.name);
                        }
                        totalSets += (exercise.sets?.length || 0);
                    }
                });
            }
            
            // Track workouts by day of week
            const date = new Date(workout.date);
            const dayName = date.toLocaleDateString('ru-RU', { weekday: 'long' });
            workoutsByDay[dayName] = (workoutsByDay[dayName] || 0) + 1;
        });
        
        // Find most active day
        let mostActiveDay = null;
        let maxWorkouts = 0;
        Object.entries(workoutsByDay).forEach(([day, count]) => {
            if (count > maxWorkouts) {
                maxWorkouts = count;
                mostActiveDay = day;
            }
        });
        
        // Calculate streaks
        const streaks = this.calculateStreaks();
        
        this.stats = {
            totalWorkouts: this.workouts.length,
            totalTonnage: Math.round(totalTonnage * 100) / 100,
            averageTonnage: Math.round((totalTonnage / this.workouts.length) * 100) / 100,
            totalReps,
            totalSets,
            bestDay: bestDay ? Utils.formatDateRelative(bestDay) : null,
            mostActiveDay,
            uniqueExercises: uniqueExercises.size,
            currentStreak: streaks.current,
            longestStreak: streaks.longest
        };
    },
    
    calculateStreaks() {
        if (!this.workouts.length) {
            return { current: 0, longest: 0 };
        }
        
        // Sort workouts by date
        const sortedWorkouts = [...this.workouts].sort((a, b) => 
            new Date(a.date) - new Date(b.date)
        );
        
        let currentStreak = 0;
        let longestStreak = 0;
        let tempStreak = 1;
        
        for (let i = 1; i < sortedWorkouts.length; i++) {
            const currentDate = new Date(sortedWorkouts[i].date);
            const previousDate = new Date(sortedWorkouts[i - 1].date);
            const daysDiff = (currentDate - previousDate) / (1000 * 60 * 60 * 24);
            
            if (daysDiff === 1) {
                // Consecutive days
                tempStreak++;
            } else if (daysDiff > 1) {
                // Gap in workouts
                longestStreak = Math.max(longestStreak, tempStreak);
                tempStreak = 1;
            }
            // If daysDiff === 0, it's the same day, continue streak
        }
        
        longestStreak = Math.max(longestStreak, tempStreak);
        
        // Calculate current streak from today
        const today = new Date();
        const lastWorkoutDate = new Date(sortedWorkouts[sortedWorkouts.length - 1].date);
        const daysSinceLastWorkout = (today - lastWorkoutDate) / (1000 * 60 * 60 * 24);
        
        if (daysSinceLastWorkout <= 1) {
            currentStreak = tempStreak;
        }
        
        return { current: currentStreak, longest: longestStreak };
    },
    
    calculateRecords() {
        this.records = [];
        
        if (!this.workouts.length) return;
        
        const exerciseStats = {};
        
        // Collect all exercise data
        this.workouts.forEach(workout => {
            if (!workout.exercises) return;
            
            workout.exercises.forEach(exercise => {
                if (exercise.type === 'superset') {
                    exercise.exercises.forEach(subExercise => {
                        this.processExerciseForRecords(subExercise, workout.date, exerciseStats);
                    });
                } else {
                    this.processExerciseForRecords(exercise, workout.date, exerciseStats);
                }
            });
        });
        
        // Generate records
        Object.entries(exerciseStats).forEach(([exerciseName, data]) => {
            // Max weight record
            if (data.maxWeight > 0) {
                this.records.push({
                    type: 'maxWeight',
                    exercise: exerciseName,
                    value: data.maxWeight,
                    date: data.maxWeightDate,
                    label: `Макс вес: ${Utils.formatWeight(data.maxWeight)}`
                });
            }
            
            // Max tonnage record
            if (data.maxTonnage > 0) {
                this.records.push({
                    type: 'maxTonnage',
                    exercise: exerciseName,
                    value: data.maxTonnage,
                    date: data.maxTonnageDate,
                    label: `Макс тоннаж: ${Utils.formatWeight(data.maxTonnage)}`
                });
            }
            
            // Max reps in single set
            if (data.maxReps > 0) {
                this.records.push({
                    type: 'maxReps',
                    exercise: exerciseName,
                    value: data.maxReps,
                    date: data.maxRepsDate,
                    label: `Макс повторы: ${data.maxReps}`
                });
            }
        });
        
        // Sort records by value (descending)
        this.records.sort((a, b) => b.value - a.value);
        
        // Limit to top records
        this.records = this.records.slice(0, 10);
    },
    
    processExerciseForRecords(exercise, date, exerciseStats) {
        if (!exercise.name || !exercise.sets) return;
        
        const exerciseName = exercise.name;
        
        if (!exerciseStats[exerciseName]) {
            exerciseStats[exerciseName] = {
                maxWeight: 0,
                maxWeightDate: null,
                maxTonnage: 0,
                maxTonnageDate: null,
                maxReps: 0,
                maxRepsDate: null,
                totalTonnage: 0
            };
        }
        
        const stats = exerciseStats[exerciseName];
        const exerciseTonnage = Utils.calculateTonnage(exercise.sets);
        
        // Update max tonnage for this exercise in this workout
        if (exerciseTonnage > stats.maxTonnage) {
            stats.maxTonnage = exerciseTonnage;
            stats.maxTonnageDate = date;
        }
        
        // Check each set for records
        exercise.sets.forEach(set => {
            const weight = parseFloat(set.weight) || 0;
            const reps = parseInt(set.reps) || 0;
            
            // Max weight
            if (weight > stats.maxWeight) {
                stats.maxWeight = weight;
                stats.maxWeightDate = date;
            }
            
            // Max reps
            if (reps > stats.maxReps) {
                stats.maxReps = reps;
                stats.maxRepsDate = date;
            }
        });
    },
    
    renderStatistics() {
        this.renderOverviewStats();
        this.renderRecords();
    },
    
    renderOverviewStats() {
        const elements = {
            'stats-total-workouts': this.stats?.totalWorkouts || 0,
            'stats-total-tonnage': Utils.formatNumber(this.stats?.totalTonnage || 0, 0),
            'stats-avg-tonnage': Utils.formatNumber(this.stats?.averageTonnage || 0, 0),
            'stats-best-day': this.stats?.bestDay || '-'
        };
        
        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                this.animateStatValue(element, value);
            }
        });
    },
    
    animateStatValue(element, targetValue) {
        if (typeof targetValue === 'number') {
            const duration = 1000;
            const steps = 30;
            const increment = targetValue / steps;
            let step = 0;
            
            const animate = () => {
                if (step < steps) {
                    const value = Math.round(increment * step);
                    element.textContent = Utils.formatNumber(value);
                    step++;
                    setTimeout(animate, duration / steps);
                } else {
                    element.textContent = Utils.formatNumber(targetValue);
                }
            };
            
            animate();
        } else {
            element.textContent = targetValue;
        }
    },
    
    renderRecords() {
        const recordsList = document.getElementById('records-list');
        if (!recordsList) return;
        
        recordsList.innerHTML = '';
        
        if (!this.records.length) {
            recordsList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🏆</div>
                    <p>Пока нет рекордов</p>
                    <p class="empty-hint">Создай несколько тренировок</p>
                </div>
            `;
            return;
        }
        
        this.records.forEach(record => {
            const recordItem = document.createElement('div');
            recordItem.className = 'record-item fade-in';
            
            recordItem.innerHTML = `
                <div class="record-info">
                    <div class="record-exercise">${record.exercise}</div>
                    <div class="record-date">${Utils.formatDateRelative(record.date)}</div>
                </div>
                <div class="record-value">${record.label}</div>
            `;
            
            recordsList.appendChild(recordItem);
        });
    },
    
    populateExerciseSelector() {
        const select = document.getElementById('exercise-select');
        if (!select) return;
        
        // Clear existing options except the first one
        select.innerHTML = '<option value="">Выбери упражнение</option>';
        
        if (!this.workouts.length) return;
        
        // Get all unique exercises
        const uniqueExercises = new Set();
        
        this.workouts.forEach(workout => {
            if (!workout.exercises) return;
            
            workout.exercises.forEach(exercise => {
                if (exercise.type === 'superset') {
                    exercise.exercises.forEach(subExercise => {
                        if (subExercise.name) {
                            uniqueExercises.add(subExercise.name);
                        }
                    });
                } else if (exercise.name) {
                    uniqueExercises.add(exercise.name);
                }
            });
        });
        
        // Sort exercises alphabetically
        const sortedExercises = Array.from(uniqueExercises).sort();
        
        // Add options
        sortedExercises.forEach(exercise => {
            const option = document.createElement('option');
            option.value = exercise;
            option.textContent = exercise;
            select.appendChild(option);
        });
    },
    
    showProgressChart(exerciseName) {
        const chartContainer = document.getElementById('progress-chart');
        if (!chartContainer || !exerciseName) {
            this.showEmptyChart();
            return;
        }
        
        const exerciseData = this.getExerciseProgressData(exerciseName);
        
        if (!exerciseData.length) {
            this.showEmptyChart();
            return;
        }
        
        this.renderProgressChart(exerciseData, exerciseName);
    },
    
    getExerciseProgressData(exerciseName) {
        const data = [];
        
        this.workouts.forEach(workout => {
            if (!workout.exercises) return;
            
            const workoutDate = new Date(workout.date);
            let maxWeightInWorkout = 0;
            let totalTonnageInWorkout = 0;
            
            workout.exercises.forEach(exercise => {
                if (exercise.type === 'superset') {
                    exercise.exercises.forEach(subExercise => {
                        if (subExercise.name === exerciseName && subExercise.sets) {
                            const maxWeight = Utils.calculateMaxWeight(subExercise.sets);
                            const tonnage = Utils.calculateTonnage(subExercise.sets);
                            
                            maxWeightInWorkout = Math.max(maxWeightInWorkout, maxWeight);
                            totalTonnageInWorkout += tonnage;
                        }
                    });
                } else if (exercise.name === exerciseName && exercise.sets) {
                    const maxWeight = Utils.calculateMaxWeight(exercise.sets);
                    const tonnage = Utils.calculateTonnage(exercise.sets);
                    
                    maxWeightInWorkout = Math.max(maxWeightInWorkout, maxWeight);
                    totalTonnageInWorkout += tonnage;
                }
            });
            
            if (maxWeightInWorkout > 0 || totalTonnageInWorkout > 0) {
                data.push({
                    date: workoutDate,
                    maxWeight: maxWeightInWorkout,
                    tonnage: totalTonnageInWorkout
                });
            }
        });
        
        // Sort by date
        data.sort((a, b) => a.date - b.date);
        
        return data;
    },
    
    renderProgressChart(data, exerciseName) {
        const chartContainer = document.getElementById('progress-chart');
        if (!chartContainer) return;
        
        const width = chartContainer.clientWidth - 40;
        const height = 250;
        const padding = { top: 20, right: 20, bottom: 40, left: 60 };
        
        const chartWidth = width - padding.left - padding.right;
        const chartHeight = height - padding.top - padding.bottom;
        
        // Create SVG
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('class', 'chart-svg');
        svg.setAttribute('width', width);
        svg.setAttribute('height', height);
        
        // Calculate scales
        const maxWeight = Math.max(...data.map(d => d.maxWeight));
        const minDate = data[0].date;
        const maxDate = data[data.length - 1].date;
        
        // Create scales
        const xScale = (date) => {
            const timeRange = maxDate - minDate;
            const timeOffset = date - minDate;
            return padding.left + (timeOffset / timeRange) * chartWidth;
        };
        
        const yScale = (weight) => {
            return padding.top + (1 - weight / maxWeight) * chartHeight;
        };
        
        // Draw grid lines
        const gridGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        
        // Horizontal grid lines
        for (let i = 0; i <= 4; i++) {
            const y = padding.top + (i / 4) * chartHeight;
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('class', 'chart-grid');
            line.setAttribute('x1', padding.left);
            line.setAttribute('y1', y);
            line.setAttribute('x2', padding.left + chartWidth);
            line.setAttribute('y2', y);
            gridGroup.appendChild(line);
        }
        
        svg.appendChild(gridGroup);
        
        // Draw line
        if (data.length > 1) {
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('class', 'chart-line');
            
            let pathData = `M ${xScale(data[0].date)} ${yScale(data[0].maxWeight)}`;
            
            for (let i = 1; i < data.length; i++) {
                pathData += ` L ${xScale(data[i].date)} ${yScale(data[i].maxWeight)}`;
            }
            
            path.setAttribute('d', pathData);
            svg.appendChild(path);
        }
        
        // Draw points
        data.forEach((point, index) => {
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('class', 'chart-point');
            circle.setAttribute('cx', xScale(point.date));
            circle.setAttribute('cy', yScale(point.maxWeight));
            circle.setAttribute('r', 4);
            
            // Add tooltip
            circle.addEventListener('mouseenter', (e) => {
                this.showChartTooltip(e, point);
            });
            
            circle.addEventListener('mouseleave', () => {
                this.hideChartTooltip();
            });
            
            svg.appendChild(circle);
        });
        
        // Draw axes
        const axesGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        
        // Y-axis
        const yAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        yAxis.setAttribute('class', 'chart-axis');
        yAxis.setAttribute('x1', padding.left);
        yAxis.setAttribute('y1', padding.top);
        yAxis.setAttribute('x2', padding.left);
        yAxis.setAttribute('y2', padding.top + chartHeight);
        axesGroup.appendChild(yAxis);
        
        // X-axis
        const xAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        xAxis.setAttribute('class', 'chart-axis');
        xAxis.setAttribute('x1', padding.left);
        xAxis.setAttribute('y1', padding.top + chartHeight);
        xAxis.setAttribute('x2', padding.left + chartWidth);
        xAxis.setAttribute('y2', padding.top + chartHeight);
        axesGroup.appendChild(xAxis);
        
        svg.appendChild(axesGroup);
        
        // Add labels
        const labelsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        
        // Y-axis labels
        for (let i = 0; i <= 4; i++) {
            const value = (maxWeight / 4) * (4 - i);
            const y = padding.top + (i / 4) * chartHeight;
            
            const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            label.setAttribute('class', 'chart-label');
            label.setAttribute('x', padding.left - 10);
            label.setAttribute('y', y + 5);
            label.setAttribute('text-anchor', 'end');
            label.textContent = Math.round(value) + ' кг';
            labelsGroup.appendChild(label);
        }
        
        // X-axis labels (first and last date)
        const firstLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        firstLabel.setAttribute('class', 'chart-label');
        firstLabel.setAttribute('x', xScale(data[0].date));
        firstLabel.setAttribute('y', padding.top + chartHeight + 20);
        firstLabel.setAttribute('text-anchor', 'start');
        firstLabel.textContent = Utils.formatDate(data[0].date);
        labelsGroup.appendChild(firstLabel);
        
        if (data.length > 1) {
            const lastLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            lastLabel.setAttribute('class', 'chart-label');
            lastLabel.setAttribute('x', xScale(data[data.length - 1].date));
            lastLabel.setAttribute('y', padding.top + chartHeight + 20);
            lastLabel.setAttribute('text-anchor', 'end');
            lastLabel.textContent = Utils.formatDate(data[data.length - 1].date);
            labelsGroup.appendChild(lastLabel);
        }
        
        svg.appendChild(labelsGroup);
        
        // Clear container and add SVG
        chartContainer.innerHTML = '';
        chartContainer.appendChild(svg);
    },
    
    showEmptyChart() {
        const chartContainer = document.getElementById('progress-chart');
        if (!chartContainer) return;
        
        chartContainer.innerHTML = `
            <div class="empty-chart">
                <div class="empty-icon">📊</div>
                <p>Выбери упражнение для просмотра прогресса</p>
            </div>
        `;
    },
    
    showChartTooltip(event, point) {
        // Remove existing tooltip
        this.hideChartTooltip();
        
        const tooltip = document.createElement('div');
        tooltip.className = 'chart-tooltip';
        tooltip.style.cssText = `
            position: absolute;
            background: var(--bg-elevated);
            border: 1px solid var(--border-color);
            border-radius: 8px;
            padding: 8px 12px;
            font-size: 12px;
            color: var(--text-primary);
            z-index: 1000;
            pointer-events: none;
            box-shadow: var(--shadow-md);
        `;
        
        tooltip.innerHTML = `
            <div><strong>${Utils.formatDate(point.date)}</strong></div>
            <div>Макс вес: ${Utils.formatWeight(point.maxWeight)}</div>
            <div>Тоннаж: ${Utils.formatWeight(point.tonnage)}</div>
        `;
        
        document.body.appendChild(tooltip);
        
        // Position tooltip
        const rect = event.target.getBoundingClientRect();
        tooltip.style.left = `${rect.left + window.scrollX - tooltip.offsetWidth / 2}px`;
        tooltip.style.top = `${rect.top + window.scrollY - tooltip.offsetHeight - 10}px`;
    },
    
    hideChartTooltip() {
        const tooltip = document.querySelector('.chart-tooltip');
        if (tooltip) {
            tooltip.remove();
        }
    },
    
    // Refresh statistics when returning to screen
    refresh() {
        this.loadStatistics();
    },
    
    // Export statistics
    exportStatistics() {
        const exportData = {
            overview: this.stats,
            records: this.records,
            workoutCount: this.workouts.length,
            generatedAt: new Date().toISOString()
        };
        
        const filename = `fitness_stats_${Utils.getDateString(new Date())}.json`;
        Utils.downloadJSON(exportData, filename);
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StatisticsModule;
}
