// Simple UI Components - No Modals, Only Dropdowns
const Components = {
    // Simple Dropdown Exercise Builder
    SimpleExerciseBuilder: {
        selectedExercise: null,
        selectedWeight: null,
        selectedReps: null,
        exercises: [],
        
        init() {
            this.loadExercises();
            this.populateDropdowns();
            this.setupEventListeners();
            this.updateButtonStates();
        },
        
        loadExercises() {
            // Load exercises from config or use defaults
            this.exercises = EXERCISES || [
                'Жим лежа',
                'Приседания',
                'Становая тяга',
                'Жим стоя',
                'Подтягивания',
                'Отжимания',
                'Планка',
                'Сгибания на бицепс',
                'Тяга штанги в наклоне',
                'Французский жим',
                'Подъемы на бицепс',
                'Жим ногами',
                'Разведение гантелей',
                'Скручивания',
                'Выпады',
                'Подъем штанги на грудь',
                'Махи гирей',
                'Бёрпи',
                'Горный альпинист',
                'Прыжки со скакалкой'
            ];
        },
        
        populateDropdowns() {
            this.populateExerciseSelect();
            this.populateWeightSelect();
            this.populateRepsSelect();
        },
        
        populateExerciseSelect() {
            const exerciseSelect = document.getElementById('exercise-select');
            if (!exerciseSelect) return;
            
            // Clear existing options except first
            exerciseSelect.innerHTML = '<option value="">Выберите упражнение</option>';
            
            // Add exercise options
            this.exercises.forEach(exercise => {
                const option = document.createElement('option');
                option.value = exercise;
                option.textContent = exercise;
                exerciseSelect.appendChild(option);
            });
        },
        
        populateWeightSelect() {
            const weightSelect = document.getElementById('weight-select');
            if (!weightSelect) return;
            
            // Clear existing options
            weightSelect.innerHTML = '<option value="">Выберите вес</option>';
            
            // Add weight options from 0.5 to 300 kg
            const weights = [];
            
            // 0.5-10 kg with 0.5 step
            for (let w = 0.5; w <= 10; w += 0.5) {
                weights.push(w);
            }
            
            // 11-50 kg with 1 kg step  
            for (let w = 11; w <= 50; w += 1) {
                weights.push(w);
            }
            
            // 52.5-100 kg with 2.5 kg step
            for (let w = 52.5; w <= 100; w += 2.5) {
                weights.push(w);
            }
            
            // 105-300 kg with 5 kg step
            for (let w = 105; w <= 300; w += 5) {
                weights.push(w);
            }
            
            weights.forEach(weight => {
                const option = document.createElement('option');
                option.value = weight;
                option.textContent = `${weight} кг`;
                weightSelect.appendChild(option);
            });
        },
        
        populateRepsSelect() {
            const repsSelect = document.getElementById('reps-select');
            if (!repsSelect) return;
            
            // Clear existing options
            repsSelect.innerHTML = '<option value="">Выберите количество</option>';
            
            // Add reps options from 1 to 50
            for (let r = 1; r <= 50; r++) {
                const option = document.createElement('option');
                option.value = r;
                option.textContent = r === 1 ? '1 повтор' : `${r} повторов`;
                repsSelect.appendChild(option);
            }
        },
        
        setupEventListeners() {
            const exerciseSelect = document.getElementById('exercise-select');
            const weightSelect = document.getElementById('weight-select');
            const repsSelect = document.getElementById('reps-select');
            const addExerciseBtn = document.getElementById('add-exercise-btn');
            const addSupersetBtn = document.getElementById('add-superset-btn');
            
            // Dropdown change handlers
            if (exerciseSelect) {
                exerciseSelect.addEventListener('change', (e) => {
                    this.selectedExercise = e.target.value;
                    this.updateButtonStates();
                });
            }
            
            if (weightSelect) {
                weightSelect.addEventListener('change', (e) => {
                    this.selectedWeight = parseFloat(e.target.value) || null;
                    this.updateButtonStates();
                });
            }
            
            if (repsSelect) {
                repsSelect.addEventListener('change', (e) => {
                    this.selectedReps = parseFloat(e.target.value) || null;
                    this.updateButtonStates();
                });
            }
            
            // Action buttons
            if (addExerciseBtn) {
                addExerciseBtn.addEventListener('click', () => this.addExercise());
            }
            
            if (addSupersetBtn) {
                addSupersetBtn.addEventListener('click', () => this.addSuperset());
            }
        },
        
        updateButtonStates() {
            const addExerciseBtn = document.getElementById('add-exercise-btn');
            const addSupersetBtn = document.getElementById('add-superset-btn');
            
            // Check if form is valid  
            const hasExercise = this.selectedExercise;
            const hasWeight = this.selectedWeight && this.selectedWeight > 0;
            const hasReps = this.selectedReps && this.selectedReps > 0;
            const hasValidParams = hasWeight || hasReps;
            
            const isValid = hasExercise && hasValidParams;
            
            if (addExerciseBtn) {
                addExerciseBtn.disabled = !isValid;
                addExerciseBtn.classList.toggle('disabled', !isValid);
            }
            
            if (addSupersetBtn) {
                addSupersetBtn.disabled = !isValid;
                addSupersetBtn.classList.toggle('disabled', !isValid);
            }
        },
        
        addExercise() {
            if (!this.validateForm()) return;
            
            const exercise = {
                id: Utils?.generateId() || Math.random().toString(36).substr(2, 9),
                name: this.selectedExercise,
                sets: [{
                    weight: this.selectedWeight || 0,
                    reps: this.selectedReps || 0
                }]
            };
            
            // Call workout module to add exercise
            if (window.WorkoutModule) {
                window.WorkoutModule.addExerciseToWorkout(exercise);
            }
            
            this.resetForm();
            if (Utils?.hapticFeedback) Utils.hapticFeedback('success');
            if (Utils?.showSuccess) Utils.showSuccess('Упражнение добавлено!');
        },
        
        addSuperset() {
            if (!this.validateForm()) return;
            
            // Store first exercise data
            const firstExercise = {
                id: Utils?.generateId() || Math.random().toString(36).substr(2, 9),
                name: this.selectedExercise,
                sets: [{
                    weight: this.selectedWeight || 0,
                    reps: this.selectedReps || 0
                }]
            };
            
            // Reset form and ask for second exercise
            this.resetForm();
            
            // Update UI to show we're adding second exercise
            const title = document.querySelector('.add-exercise-title');
            if (title) {
                title.textContent = '🔗 Добавить второе упражнение для суперсета';
                title.style.color = 'var(--warning-color)';
            }
            
            // Change button behavior temporarily
            const addBtn = document.getElementById('add-exercise-btn');
            if (addBtn) {
                addBtn.innerHTML = '<span class="btn-icon">🔗</span>Завершить суперсет';
                addBtn.onclick = () => this.completeSuperset(firstExercise);
            }
        },
        
        completeSuperset(firstExercise) {
            if (!this.validateForm()) return;
            
            const secondExercise = {
                id: Utils?.generateId() || Math.random().toString(36).substr(2, 9),
                name: this.selectedExercise,
                sets: [{
                    weight: this.selectedWeight || 0,
                    reps: this.selectedReps || 0
                }]
            };
            
            const superset = {
                id: Utils?.generateId() || Math.random().toString(36).substr(2, 9),
                type: 'superset',
                exercises: [firstExercise, secondExercise]
            };
            
            // Call workout module to add superset
            if (window.WorkoutModule) {
                window.WorkoutModule.addExerciseToWorkout(superset);
            }
            
            // Reset UI
            this.resetSuperset();
            if (Utils?.hapticFeedback) Utils.hapticFeedback('success');
            if (Utils?.showSuccess) Utils.showSuccess('Суперсет добавлен!');
        },
        
        resetSuperset() {
            const title = document.querySelector('.add-exercise-title');
            const addBtn = document.getElementById('add-exercise-btn');
            
            if (title) {
                title.textContent = '➕ Добавить упражнение';
                title.style.color = '';
            }
            
            if (addBtn) {
                addBtn.innerHTML = '<span class="btn-icon">💪</span>Добавить упражнение';
                addBtn.onclick = () => this.addExercise();
            }
            
            this.resetForm();
        },
        
        validateForm() {
            if (!this.selectedExercise) {
                if (Utils?.showError) Utils.showError('Выберите упражнение');
                return false;
            }
            
            if (!this.selectedWeight && !this.selectedReps) {
                if (Utils?.showError) Utils.showError('Укажите вес или количество повторений');
                return false;
            }
            
            return true;
        },
        
        resetForm() {
            const exerciseSelect = document.getElementById('exercise-select');
            const weightSelect = document.getElementById('weight-select');
            const repsSelect = document.getElementById('reps-select');
            
            if (exerciseSelect) exerciseSelect.value = '';
            if (weightSelect) weightSelect.value = '';
            if (repsSelect) repsSelect.value = '';
            
            this.selectedExercise = null;
            this.selectedWeight = null;
            this.selectedReps = null;
            this.updateButtonStates();
        }
    },
    
    // Loading Component (Keep for app functionality)
    Loading: {
        show(message = 'Загрузка...') {
            const overlay = document.getElementById('loading-overlay');
            if (overlay) {
                overlay.classList.add('active');
                const messageEl = overlay.querySelector('p');
                if (messageEl) messageEl.textContent = message;
            }
        },
        
        hide() {
            const overlay = document.getElementById('loading-overlay');
            if (overlay) {
                overlay.classList.remove('active');
            }
        }
    },
    
    // Initialize all components
    init() {
        try {
            // Initialize simple exercise builder when workout screen is shown
            setTimeout(() => {
                if (document.getElementById('exercise-select')) {
                    this.SimpleExerciseBuilder.init();
                }
            }, 100);
        } catch (error) {
            console.error('Components initialization failed:', error);
        }
    }
};