
// Workout Module
const WorkoutModule = {
    currentWorkout: null,
    currentDate: new Date(),
    autoSaveTimer: null,
    isDirty: false,
    
    init() {
        this.setupEventListeners();
        this.loadWorkoutForDate(this.currentDate);
        this.setupAutoSave();
        this.updateDateDisplay();
    },
    
    setupEventListeners() {
        // Date navigation
        const datePrev = document.getElementById('date-prev');
        const dateNext = document.getElementById('date-next');
        
        if (datePrev) {
            datePrev.addEventListener('click', () => this.navigateDate(-1));
        }
        
        if (dateNext) {
            dateNext.addEventListener('click', () => this.navigateDate(1));
        }
        
        // Action buttons
        const addExerciseBtn = document.getElementById('add-exercise-btn');
        const addSupersetBtn = document.getElementById('add-superset-btn');
        const saveWorkoutBtn = document.getElementById('save-workout-btn');
        const clearWorkoutBtn = document.getElementById('clear-workout-btn');
        
        if (addExerciseBtn) {
            addExerciseBtn.addEventListener('click', () => this.addExercise());
        }
        
        if (addSupersetBtn) {
            addSupersetBtn.addEventListener('click', () => this.addSuperset());
        }
        
        if (saveWorkoutBtn) {
            saveWorkoutBtn.addEventListener('click', () => this.saveWorkout());
        }
        
        if (clearWorkoutBtn) {
            clearWorkoutBtn.addEventListener('click', () => this.clearWorkout());
        }
        
        // Make this module globally accessible for Components
        window.WorkoutModule = this;
    },
    
    setupAutoSave() {
        // Auto-save every 30 seconds if there are changes
        this.autoSaveTimer = setInterval(() => {
            if (this.isDirty && this.currentWorkout) {
                this.saveDraft();
            }
        }, CONFIG.AUTO_SAVE_INTERVAL);
    },
    
    navigateDate(direction) {
        const newDate = new Date(this.currentDate);
        newDate.setDate(newDate.getDate() + direction);
        
        this.currentDate = newDate;
        this.updateDateDisplay();
        this.loadWorkoutForDate(this.currentDate);
        
        Utils.hapticFeedback('selection');
    },
    
    updateDateDisplay() {
        const dateElement = document.getElementById('workout-date');
        const dateFullElement = document.getElementById('workout-date-full');
        
        if (dateElement) {
            dateElement.textContent = Utils.formatDateRelative(this.currentDate);
        }
        
        if (dateFullElement) {
            dateFullElement.textContent = Utils.formatDate(this.currentDate, 'display');
        }
    },
    
    async loadWorkoutForDate(date) {
        try {
            Components.Loading.show('Загрузка тренировки...');
            
            const dateString = Utils.getDateString(date);
            const workouts = await storage.get(CONFIG.STORAGE_KEYS.WORKOUTS);
            const existingWorkout = workouts.find(w => w.date === dateString);
            
            if (existingWorkout) {
                this.currentWorkout = Utils.deepClone(existingWorkout);
                this.isDirty = false;
            } else {
                // Try to load draft
                const draft = await storage.get(CONFIG.STORAGE_KEYS.DRAFT_WORKOUT);
                if (draft && draft.date === dateString) {
                    this.currentWorkout = Utils.deepClone(draft);
                    this.isDirty = true;
                } else {
                    this.currentWorkout = this.createEmptyWorkout(dateString);
                    this.isDirty = false;
                }
            }
            
            this.renderWorkout();
            this.updateWorkoutStats();
            
            Components.Loading.hide();
        } catch (error) {
            console.error('Failed to load workout:', error);
            Utils.showError('Не удалось загрузить тренировку');
            Components.Loading.hide();
        }
    },
    
    createEmptyWorkout(date) {
        return {
            id: Utils.generateId(),
            date: date,
            exercises: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
    },
    
    renderWorkout() {
        const exercisesList = document.getElementById('exercises-list');
        const emptyState = document.getElementById('empty-workout');
        
        if (!exercisesList) return;
        
        // Clear existing content
        exercisesList.innerHTML = '';
        
        if (!this.currentWorkout.exercises || this.currentWorkout.exercises.length === 0) {
            // Show empty state
            if (emptyState) {
                exercisesList.appendChild(emptyState);
                emptyState.style.display = 'flex';
            }
        } else {
            // Hide empty state
            if (emptyState) {
                emptyState.style.display = 'none';
            }
            
            // Render exercises
            this.currentWorkout.exercises.forEach((exercise, index) => {
                const exerciseBlock = Components.ExerciseBlock.render(exercise, index);
                exercisesList.appendChild(exerciseBlock);
            });
        }
    },
    
    updateWorkoutStats() {
        if (!this.currentWorkout) return;
        
        const stats = Utils.calculateWorkoutStats(this.currentWorkout);
        
        // Update stat displays
        const tonnageElement = document.getElementById('workout-tonnage');
        const repsElement = document.getElementById('workout-reps');
        const maxWeightElement = document.getElementById('workout-max-weight');
        
        if (tonnageElement) {
            this.animateNumber(tonnageElement, stats.tonnage);
        }
        
        if (repsElement) {
            this.animateNumber(repsElement, stats.reps);
        }
        
        if (maxWeightElement) {
            this.animateNumber(maxWeightElement, stats.maxWeight);
        }
    },
    
    animateNumber(element, targetValue) {
        const currentValue = parseFloat(element.textContent) || 0;
        const duration = 600;
        const steps = 30;
        const increment = (targetValue - currentValue) / steps;
        let step = 0;
        
        const animate = () => {
            if (step < steps) {
                const value = currentValue + (increment * step);
                element.textContent = Math.round(value * 100) / 100;
                step++;
                setTimeout(animate, duration / steps);
            } else {
                element.textContent = targetValue;
            }
        };
        
        animate();
    },
    
    addExercise() {
        const selectedExercises = this.getSelectedExerciseNames();
        
        // Use new stepper interface
        Components.ExerciseStepper.show((exercise) => {
            // Exercise already comes with proper parameters from stepper
            this.currentWorkout.exercises.push(exercise);
            this.markDirty();
            this.renderWorkout();
            this.updateWorkoutStats();
            
            Utils.hapticFeedback('success');
            Utils.showSuccess('Упражнение добавлено в тренировку!');
        }, selectedExercises);
    },
    
    addSuperset() {
        const selectedExercises = this.getSelectedExerciseNames();
        
        // Show first exercise selector
        Components.ExerciseSelector.show((firstExercise) => {
            const updatedSelected = [...selectedExercises, firstExercise];
            
            // Show second exercise selector
            Components.ExerciseSelector.show((secondExercise) => {
                const superset = {
                    id: Utils.generateId(),
                    type: 'superset',
                    exercises: [
                        {
                            id: Utils.generateId(),
                            name: firstExercise,
                            sets: [{ weight: 0, reps: 0 }]
                        },
                        {
                            id: Utils.generateId(),
                            name: secondExercise,
                            sets: [{ weight: 0, reps: 0 }]
                        }
                    ]
                };
                
                this.currentWorkout.exercises.push(superset);
                this.markDirty();
                this.renderWorkout();
                this.updateWorkoutStats();
                
                Utils.hapticFeedback('success');
                Utils.showSuccess('Суперсет добавлен!');
            }, updatedSelected);
        }, selectedExercises);
    },
    
    getSelectedExerciseNames() {
        if (!this.currentWorkout.exercises) return [];
        
        const names = [];
        this.currentWorkout.exercises.forEach(exercise => {
            if (exercise.type === 'superset') {
                exercise.exercises.forEach(subExercise => {
                    if (subExercise.name) {
                        names.push(subExercise.name);
                    }
                });
            } else if (exercise.name) {
                names.push(exercise.name);
            }
        });
        
        return names;
    },
    
    addSet(exerciseIndex, subIndex = null) {
        if (!this.currentWorkout.exercises[exerciseIndex]) return;
        
        const exercise = this.currentWorkout.exercises[exerciseIndex];
        const newSet = { weight: 0, reps: 0 };
        
        if (subIndex !== null && exercise.type === 'superset') {
            if (!exercise.exercises[subIndex]) return;
            exercise.exercises[subIndex].sets.push(newSet);
        } else {
            if (!exercise.sets) exercise.sets = [];
            exercise.sets.push(newSet);
        }
        
        this.markDirty();
        this.renderWorkout();
        this.updateWorkoutStats();
        
        Utils.hapticFeedback('light');
        Utils.showSuccess(SUCCESS_MESSAGES.SET_ADDED);
    },
    
    removeSet(exerciseIndex, subIndex, setIndex) {
        if (!this.currentWorkout.exercises[exerciseIndex]) return;
        
        const exercise = this.currentWorkout.exercises[exerciseIndex];
        
        if (subIndex !== null && exercise.type === 'superset') {
            if (!exercise.exercises[subIndex] || !exercise.exercises[subIndex].sets) return;
            exercise.exercises[subIndex].sets.splice(setIndex, 1);
        } else {
            if (!exercise.sets) return;
            exercise.sets.splice(setIndex, 1);
        }
        
        this.markDirty();
        this.renderWorkout();
        this.updateWorkoutStats();
        
        Utils.hapticFeedback('medium');
    },
    
    updateSetValue(exerciseIndex, subIndex, setIndex, type, value) {
        if (!this.currentWorkout.exercises[exerciseIndex]) return;
        
        const exercise = this.currentWorkout.exercises[exerciseIndex];
        let targetSet;
        
        if (subIndex !== null && exercise.type === 'superset') {
            if (!exercise.exercises[subIndex] || !exercise.exercises[subIndex].sets) return;
            targetSet = exercise.exercises[subIndex].sets[setIndex];
        } else {
            if (!exercise.sets) return;
            targetSet = exercise.sets[setIndex];
        }
        
        if (!targetSet) return;
        
        if (type === 'weight') {
            targetSet.weight = parseFloat(value) || 0;
        } else if (type === 'reps') {
            targetSet.reps = parseInt(value) || 0;
        }
        
        this.markDirty();
        this.renderWorkout();
        this.updateWorkoutStats();
        
        Utils.hapticFeedback('light');
    },
    
    adjustSetValue(exerciseIndex, subIndex, setIndex, type, isIncrease) {
        if (!this.currentWorkout.exercises[exerciseIndex]) return;
        
        const exercise = this.currentWorkout.exercises[exerciseIndex];
        let targetSet;
        
        if (subIndex !== null && exercise.type === 'superset') {
            if (!exercise.exercises[subIndex] || !exercise.exercises[subIndex].sets) return;
            targetSet = exercise.exercises[subIndex].sets[setIndex];
        } else {
            if (!exercise.sets) return;
            targetSet = exercise.sets[setIndex];
        }
        
        if (!targetSet) return;
        
        if (type === 'weight') {
            const currentWeight = parseFloat(targetSet.weight) || 0;
            const step = currentWeight < CONFIG.WEIGHT.THRESHOLD ? CONFIG.WEIGHT.STEP_LIGHT : CONFIG.WEIGHT.STEP_HEAVY;
            const newWeight = isIncrease ? currentWeight + step : Math.max(0, currentWeight - step);
            targetSet.weight = Math.min(newWeight, CONFIG.WEIGHT.MAX);
        } else if (type === 'reps') {
            const currentReps = parseInt(targetSet.reps) || 0;
            const newReps = isIncrease ? currentReps + 1 : Math.max(0, currentReps - 1);
            targetSet.reps = Math.min(newReps, CONFIG.REPS.MAX);
        }
        
        this.markDirty();
        this.renderWorkout();
        this.updateWorkoutStats();
        
        Utils.hapticFeedback('light');
    },
    
    removeExercise(exerciseIndex) {
        if (!this.currentWorkout.exercises[exerciseIndex]) return;
        
        if (confirm('Удалить упражнение?')) {
            this.currentWorkout.exercises.splice(exerciseIndex, 1);
            this.markDirty();
            this.renderWorkout();
            this.updateWorkoutStats();
            
            Utils.hapticFeedback('medium');
            Utils.showSuccess('Упражнение удалено');
        }
    },
    
    duplicateExercise(exerciseIndex) {
        if (!this.currentWorkout.exercises[exerciseIndex]) return;
        
        const originalExercise = this.currentWorkout.exercises[exerciseIndex];
        const duplicatedExercise = Utils.deepClone(originalExercise);
        duplicatedExercise.id = Utils.generateId();
        
        // Generate new IDs for superset sub-exercises
        if (duplicatedExercise.type === 'superset') {
            duplicatedExercise.exercises.forEach(subExercise => {
                subExercise.id = Utils.generateId();
            });
        }
        
        this.currentWorkout.exercises.splice(exerciseIndex + 1, 0, duplicatedExercise);
        this.markDirty();
        this.renderWorkout();
        this.updateWorkoutStats();
        
        Utils.hapticFeedback('success');
        Utils.showSuccess('Упражнение скопировано');
    },
    
    async saveWorkout() {
        if (!this.currentWorkout || !this.isDirty) {
            Utils.showSuccess(SUCCESS_MESSAGES.WORKOUT_SAVED);
            return;
        }
        
        try {
            Components.Loading.show('Сохранение тренировки...');
            
            // Update timestamps
            this.currentWorkout.updatedAt = new Date().toISOString();
            if (!this.currentWorkout.createdAt) {
                this.currentWorkout.createdAt = new Date().toISOString();
            }
            
            // Get all workouts
            const workouts = await storage.get(CONFIG.STORAGE_KEYS.WORKOUTS);
            
            // Find and update or add workout
            const existingIndex = workouts.findIndex(w => w.date === this.currentWorkout.date);
            if (existingIndex !== -1) {
                workouts[existingIndex] = this.currentWorkout;
            } else {
                workouts.push(this.currentWorkout);
            }
            
            // Sort workouts by date (newest first)
            workouts.sort((a, b) => new Date(b.date) - new Date(a.date));
            
            // Save to storage
            await storage.set(CONFIG.STORAGE_KEYS.WORKOUTS, workouts);
            
            // Clear draft
            await storage.set(CONFIG.STORAGE_KEYS.DRAFT_WORKOUT, null);
            
            // Update user stats
            await this.updateUserStats();
            
            this.isDirty = false;
            
            Components.Loading.hide();
            Utils.hapticFeedback('success');
            Utils.showSuccess(SUCCESS_MESSAGES.WORKOUT_SAVED);
            
        } catch (error) {
            console.error('Failed to save workout:', error);
            Components.Loading.hide();
            Utils.showError('Не удалось сохранить тренировку');
        }
    },
    
    async saveDraft() {
        if (!this.currentWorkout) return;
        
        try {
            await storage.set(CONFIG.STORAGE_KEYS.DRAFT_WORKOUT, this.currentWorkout);
        } catch (error) {
            console.error('Failed to save draft:', error);
        }
    },
    
    async updateUserStats() {
        try {
            const userData = await storage.get(CONFIG.STORAGE_KEYS.USER_DATA);
            const workouts = await storage.get(CONFIG.STORAGE_KEYS.WORKOUTS);
            
            // Recalculate all stats
            let totalSets = 0;
            let totalReps = 0;
            let totalWeight = 0;
            
            workouts.forEach(workout => {
                workout.exercises.forEach(exercise => {
                    if (exercise.type === 'superset') {
                        exercise.exercises.forEach(subExercise => {
                            if (subExercise.sets) {
                                totalSets += subExercise.sets.length;
                                subExercise.sets.forEach(set => {
                                    totalReps += parseInt(set.reps) || 0;
                                    totalWeight += (parseFloat(set.weight) || 0) * (parseInt(set.reps) || 0);
                                });
                            }
                        });
                    } else if (exercise.sets) {
                        totalSets += exercise.sets.length;
                        exercise.sets.forEach(set => {
                            totalReps += parseInt(set.reps) || 0;
                            totalWeight += (parseFloat(set.weight) || 0) * (parseInt(set.reps) || 0);
                        });
                    }
                });
            });
            
            userData.totalWorkouts = workouts.length;
            userData.totalSets = totalSets;
            userData.totalReps = totalReps;
            userData.totalWeight = Math.round(totalWeight * 100) / 100;
            userData.updatedAt = new Date().toISOString();
            
            await storage.set(CONFIG.STORAGE_KEYS.USER_DATA, userData);
        } catch (error) {
            console.error('Failed to update user stats:', error);
        }
    },
    
    async clearWorkout() {
        if (!confirm('Очистить тренировку? Все данные будут потеряны.')) return;
        
        try {
            this.currentWorkout = this.createEmptyWorkout(Utils.getDateString(this.currentDate));
            this.isDirty = false;
            
            // Clear draft
            await storage.set(CONFIG.STORAGE_KEYS.DRAFT_WORKOUT, null);
            
            this.renderWorkout();
            this.updateWorkoutStats();
            
            Utils.hapticFeedback('medium');
            Utils.showSuccess(SUCCESS_MESSAGES.DATA_CLEARED);
            
        } catch (error) {
            console.error('Failed to clear workout:', error);
            Utils.showError('Не удалось очистить тренировку');
        }
    },
    
    markDirty() {
        this.isDirty = true;
        this.currentWorkout.updatedAt = new Date().toISOString();
        
        // Update draft badge
        this.updateDraftIndicator();
    },
    
    updateDraftIndicator() {
        const indicator = document.getElementById('draft-indicator');
        if (indicator) {
            indicator.style.display = this.isDirty ? 'inline-block' : 'none';
        }
    },
    
    destroy() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
        }
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WorkoutModule;
}
