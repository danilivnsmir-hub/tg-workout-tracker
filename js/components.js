
// Reusable UI Components
const Components = {
    // Modal Management
    Modal: {
        show(modalId) {
            const overlay = document.getElementById('modal-overlay');
            const modal = document.getElementById(modalId);
            
            if (!overlay || !modal) {
                console.error(`Modal ${modalId} not found`);
                return;
            }
            
            overlay.classList.add('active');
            modal.classList.add('active');
            
            // Prevent body scroll and handle mobile viewport
            document.body.style.overflow = 'hidden';
            document.body.style.position = 'fixed';
            document.body.style.width = '100%';
            document.body.style.height = '100%';
            
            // Prevent zoom on double tap for iOS
            modal.addEventListener('touchstart', this.preventZoom, { passive: false });
            
            Utils.hapticFeedback('light');
        },
        
        hide() {
            const overlay = document.getElementById('modal-overlay');
            if (!overlay) return;
            
            overlay.classList.remove('active');
            
            // Re-enable body scroll
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.width = '';
            document.body.style.height = '';
            
            // Remove active class from all modals
            const modals = overlay.querySelectorAll('.modal');
            modals.forEach(modal => {
                modal.classList.remove('active');
                modal.removeEventListener('touchstart', this.preventZoom);
            });
        },
        
        preventZoom(e) {
            const t2 = e.timeStamp;
            const t1 = e.currentTarget.dataset.lastTouch || t2;
            const dt = t2 - t1;
            const fingers = e.touches.length;
            e.currentTarget.dataset.lastTouch = t2;
            
            if (!dt || dt > 500 || fingers > 1) return; // not double tap
            
            e.preventDefault();
            e.target.click();
        },
        
        init() {
            const overlay = document.getElementById('modal-overlay');
            if (!overlay) return;
            
            // Enhanced touch handling for overlay
            let touchStarted = false;
            
            overlay.addEventListener('touchstart', (e) => {
                if (e.target === overlay) {
                    touchStarted = true;
                }
            }, { passive: true });
            
            overlay.addEventListener('touchend', (e) => {
                if (e.target === overlay && touchStarted) {
                    this.hide();
                }
                touchStarted = false;
            }, { passive: true });
            
            // Close modal when clicking overlay (mouse)
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    this.hide();
                }
            });
            
            // Close modal when clicking close buttons
            const closeButtons = overlay.querySelectorAll('.modal-close');
            closeButtons.forEach(button => {
                // Enhanced touch handling for close button
                button.addEventListener('touchstart', () => {
                    button.style.transform = 'scale(0.9)';
                }, { passive: true });
                
                button.addEventListener('touchend', () => {
                    button.style.transform = '';
                    this.hide();
                }, { passive: true });
                
                button.addEventListener('click', () => this.hide());
            });
            
            // Close modal on escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && overlay.classList.contains('active')) {
                    this.hide();
                }
            });
        }
    },
    
    // Exercise Selector Component
    ExerciseSelector: {
        show(callback, selectedExercises = []) {
            this.callback = callback;
            this.selectedExercises = selectedExercises;
            this.render();
            Components.Modal.show('exercise-modal');
        },
        
        render() {
            const exerciseList = document.getElementById('exercise-list');
            if (!exerciseList) return;
            
            exerciseList.innerHTML = '';
            
            // Filter out already selected exercises
            const availableExercises = EXERCISES.filter(exercise => 
                !this.selectedExercises.includes(exercise)
            );
            
            availableExercises.forEach(exercise => {
                const option = document.createElement('div');
                option.className = 'exercise-option';
                option.textContent = exercise;
                
                // Enhanced touch handling for exercise options
                this.addExerciseOptionTouchHandling(option, exercise);
                
                exerciseList.appendChild(option);
            });
        },
        
        addExerciseOptionTouchHandling(element, exercise) {
            let touchStarted = false;
            
            // Touch handling
            element.addEventListener('touchstart', (e) => {
                touchStarted = true;
                element.style.transform = 'scale(0.98)';
                element.style.transition = 'transform 0.1s ease';
            }, { passive: true });
            
            element.addEventListener('touchend', (e) => {
                element.style.transform = '';
                
                if (touchStarted) {
                    this.selectExercise(exercise);
                }
                
                touchStarted = false;
            }, { passive: true });
            
            element.addEventListener('touchcancel', (e) => {
                element.style.transform = '';
                touchStarted = false;
            }, { passive: true });
            
            // Click fallback for desktop
            element.addEventListener('click', () => this.selectExercise(exercise));
        },
        
        selectExercise(exercise) {
            Utils.hapticFeedback('selection');
            if (this.callback) {
                this.callback(exercise);
            }
            Components.Modal.hide();
        },
        
        init() {
            const searchInput = document.getElementById('exercise-search');
            if (!searchInput) return;
            
            // Input event for real-time filtering
            searchInput.addEventListener('input', (e) => {
                this.filterExercises(e.target.value);
            });
            
            // Enhanced touch handling for search input
            searchInput.addEventListener('touchstart', () => {
                // Ensure input is focused properly on mobile
                setTimeout(() => {
                    searchInput.focus();
                }, 100);
            }, { passive: true });
            
            // Handle virtual keyboard on mobile
            searchInput.addEventListener('focus', () => {
                // Scroll modal content to keep input visible when keyboard opens
                setTimeout(() => {
                    const modalContent = searchInput.closest('.modal-content');
                    if (modalContent) {
                        searchInput.scrollIntoView({ 
                            behavior: 'smooth', 
                            block: 'start' 
                        });
                    }
                }, 300); // Wait for keyboard animation
            });
            
            // Clear search on escape
            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    searchInput.value = '';
                    this.filterExercises('');
                    searchInput.blur();
                }
            });
        },
        
        filterExercises(query) {
            const exerciseList = document.getElementById('exercise-list');
            if (!exerciseList) return;
            
            const filteredExercises = Utils.searchExercises(query);
            const availableExercises = filteredExercises.filter(exercise => 
                !this.selectedExercises.includes(exercise)
            );
            
            exerciseList.innerHTML = '';
            
            if (availableExercises.length === 0 && query.length > 0) {
                // Show "no results" message
                const noResultsDiv = document.createElement('div');
                noResultsDiv.className = 'no-results-message';
                noResultsDiv.innerHTML = `
                    <div style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                        <div style="font-size: 2rem; margin-bottom: 1rem;">🔍</div>
                        <div>Упражнения не найдены</div>
                        <div style="font-size: var(--font-size-sm); margin-top: 0.5rem;">Попробуйте изменить запрос</div>
                    </div>
                `;
                exerciseList.appendChild(noResultsDiv);
            } else {
                availableExercises.forEach(exercise => {
                    const option = document.createElement('div');
                    option.className = 'exercise-option';
                    option.textContent = exercise;
                    
                    // Add enhanced touch handling
                    this.addExerciseOptionTouchHandling(option, exercise);
                    
                    exerciseList.appendChild(option);
                });
            }
        }
    },
    
    // Value Picker Component (Weight/Reps)
    ValuePicker: {
        show(title, currentValue, options, callback) {
            this.callback = callback;
            this.options = options;
            this.currentValue = currentValue;
            
            this.render(title);
            Components.Modal.show('picker-modal');
        },
        
        render(title) {
            const titleElement = document.getElementById('picker-title');
            const wheel = document.getElementById('picker-wheel');
            
            if (!titleElement || !wheel) return;
            
            titleElement.textContent = title;
            wheel.innerHTML = '';
            
            this.options.forEach(option => {
                const optionElement = document.createElement('div');
                optionElement.className = 'picker-option';
                optionElement.textContent = option;
                
                // Enhanced touch handling
                this.addTouchHandling(optionElement, option);
                
                if (option === this.currentValue) {
                    optionElement.classList.add('selected');
                    // Scroll to selected option
                    setTimeout(() => {
                        optionElement.scrollIntoView({ 
                            behavior: 'smooth', 
                            block: 'center' 
                        });
                    }, 100);
                }
                
                wheel.appendChild(optionElement);
            });
            
            // Add scroll wheel functionality for desktop
            this.addWheelScrolling(wheel);
        },
        
        addTouchHandling(element, value) {
            let touchStartTime = 0;
            let touchStartY = 0;
            let isTouching = false;
            
            // Touch start
            element.addEventListener('touchstart', (e) => {
                touchStartTime = Date.now();
                touchStartY = e.touches[0].clientY;
                isTouching = true;
                element.style.transform = 'scale(0.95)';
                element.style.transition = 'transform 0.1s ease';
            }, { passive: true });
            
            // Touch move - cancel selection if moved too much
            element.addEventListener('touchmove', (e) => {
                if (!isTouching) return;
                
                const touchY = e.touches[0].clientY;
                const deltaY = Math.abs(touchY - touchStartY);
                
                if (deltaY > 10) { // Moved too much, cancel
                    isTouching = false;
                    element.style.transform = '';
                }
            }, { passive: true });
            
            // Touch end
            element.addEventListener('touchend', (e) => {
                element.style.transform = '';
                
                if (isTouching) {
                    const touchEndTime = Date.now();
                    const touchDuration = touchEndTime - touchStartTime;
                    
                    // Only select if touch was quick and didn't move much
                    if (touchDuration < 300) {
                        this.selectValue(value);
                    }
                }
                
                isTouching = false;
            }, { passive: true });
            
            // Click fallback for desktop
            element.addEventListener('click', () => this.selectValue(value));
        },
        
        addWheelScrolling(wheel) {
            let isScrolling = false;
            
            wheel.addEventListener('wheel', (e) => {
                e.preventDefault();
                
                if (isScrolling) return;
                isScrolling = true;
                
                const delta = e.deltaY;
                const currentIndex = this.options.indexOf(this.currentValue);
                let newIndex;
                
                if (delta > 0) {
                    // Scroll down - next option
                    newIndex = Math.min(currentIndex + 1, this.options.length - 1);
                } else {
                    // Scroll up - previous option
                    newIndex = Math.max(currentIndex - 1, 0);
                }
                
                if (newIndex !== currentIndex) {
                    this.selectValue(this.options[newIndex]);
                }
                
                setTimeout(() => {
                    isScrolling = false;
                }, 100);
            }, { passive: false });
        },
        
        selectValue(value) {
            // Update selected option
            const options = document.querySelectorAll('.picker-option');
            options.forEach(option => option.classList.remove('selected'));
            
            const selectedOption = Array.from(options).find(option => 
                option.textContent == value
            );
            if (selectedOption) {
                selectedOption.classList.add('selected');
                
                // Smooth scroll to selected option
                selectedOption.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center' 
                });
            }
            
            this.currentValue = value;
            Utils.hapticFeedback('selection');
        },
        
        init() {
            const confirmButton = document.getElementById('picker-confirm');
            if (!confirmButton) return;
            
            confirmButton.addEventListener('click', () => {
                if (this.callback && this.currentValue !== null) {
                    this.callback(this.currentValue);
                }
                Components.Modal.hide();
            });
        }
    },
    
    // Exercise Block Component
    ExerciseBlock: {
        render(exercise, index) {
            const block = document.createElement('div');
            block.className = exercise.type === 'superset' ? 'exercise-block superset-block' : 'exercise-block';
            block.setAttribute('data-exercise-index', index);
            
            if (exercise.type === 'superset') {
                block.innerHTML = this.renderSuperset(exercise, index);
            } else {
                block.innerHTML = this.renderSingleExercise(exercise, index);
            }
            
            this.attachEvents(block, exercise, index);
            return block;
        },
        
        renderSingleExercise(exercise, index) {
            return `
                <div class="exercise-header">
                    <div class="exercise-name">${exercise.name || 'Без названия'}</div>
                    <div class="exercise-actions">
                        <button class="exercise-action-btn" data-action="duplicate">📋</button>
                        <button class="exercise-action-btn danger" data-action="delete">🗑️</button>
                    </div>
                </div>
                <div class="sets-list" data-exercise-index="${index}">
                    ${this.renderSets(exercise.sets || [], index)}
                </div>
                <button class="add-set-btn" data-exercise-index="${index}">
                    <span>➕ Добавить подход</span>
                </button>
            `;
        },
        
        renderSuperset(exercise, index) {
            const exercisesHtml = exercise.exercises.map((subExercise, subIndex) => `
                <div class="superset-exercise" data-sub-index="${subIndex}">
                    <div class="exercise-header">
                        <div class="exercise-name">${subExercise.name || 'Без названия'}</div>
                    </div>
                    <div class="sets-list" data-exercise-index="${index}" data-sub-index="${subIndex}">
                        ${this.renderSets(subExercise.sets || [], index, subIndex)}
                    </div>
                    <button class="add-set-btn" data-exercise-index="${index}" data-sub-index="${subIndex}">
                        <span>➕ Добавить подход</span>
                    </button>
                </div>
            `).join('');
            
            return `
                <div class="superset-header">
                    <div class="superset-title">
                        <span>🔗</span>
                        <span>Суперсет</span>
                    </div>
                    <div class="exercise-actions">
                        <button class="exercise-action-btn" data-action="duplicate">📋</button>
                        <button class="exercise-action-btn danger" data-action="delete">🗑️</button>
                    </div>
                </div>
                <div class="superset-exercises">
                    ${exercisesHtml}
                </div>
            `;
        },
        
        renderSets(sets, exerciseIndex, subIndex = null) {
            return sets.map((set, setIndex) => `
                <div class="set-row" data-set-index="${setIndex}">
                    <div class="set-number">${setIndex + 1}</div>
                    <div class="set-controls">
                        <div class="set-input-group">
                            <button class="set-control-btn" data-action="decrease-weight">−</button>
                            <button class="set-value" data-type="weight" data-exercise-index="${exerciseIndex}" ${subIndex !== null ? `data-sub-index="${subIndex}"` : ''} data-set-index="${setIndex}">
                                ${set.weight || 0}
                            </button>
                            <span class="set-unit">кг</span>
                            <button class="set-control-btn" data-action="increase-weight">+</button>
                        </div>
                        <div class="set-input-group">
                            <button class="set-control-btn" data-action="decrease-reps">−</button>
                            <button class="set-value" data-type="reps" data-exercise-index="${exerciseIndex}" ${subIndex !== null ? `data-sub-index="${subIndex}"` : ''} data-set-index="${setIndex}">
                                ${set.reps || 0}
                            </button>
                            <span class="set-unit">раз</span>
                            <button class="set-control-btn" data-action="increase-reps">+</button>
                        </div>
                        <button class="set-remove-btn" data-action="remove-set">✕</button>
                    </div>
                </div>
            `).join('');
        },
        
        attachEvents(block, exercise, index) {
            // Exercise actions
            block.addEventListener('click', (e) => {
                const action = e.target.getAttribute('data-action');
                if (!action) return;
                
                Utils.hapticFeedback('light');
                
                switch (action) {
                    case 'delete':
                        this.onDeleteExercise(index);
                        break;
                    case 'duplicate':
                        this.onDuplicateExercise(index);
                        break;
                }
            });
            
            // Set controls
            block.addEventListener('click', (e) => {
                if (e.target.classList.contains('set-control-btn')) {
                    this.handleSetControl(e.target);
                } else if (e.target.classList.contains('set-value')) {
                    this.handleSetValueClick(e.target);
                } else if (e.target.classList.contains('add-set-btn')) {
                    this.handleAddSet(e.target);
                }
            });
        },
        
        handleSetControl(button) {
            const action = button.getAttribute('data-action');
            const setRow = button.closest('.set-row');
            const exerciseIndex = parseInt(setRow.closest('[data-exercise-index]').getAttribute('data-exercise-index'));
            const subIndexElement = setRow.closest('[data-sub-index]');
            const subIndex = subIndexElement ? parseInt(subIndexElement.getAttribute('data-sub-index')) : null;
            const setIndex = parseInt(setRow.getAttribute('data-set-index'));
            
            Utils.hapticFeedback('light');
            
            switch (action) {
                case 'increase-weight':
                case 'decrease-weight':
                    this.handleWeightChange(action, exerciseIndex, subIndex, setIndex);
                    break;
                case 'increase-reps':
                case 'decrease-reps':
                    this.handleRepsChange(action, exerciseIndex, subIndex, setIndex);
                    break;
                case 'remove-set':
                    this.handleRemoveSet(exerciseIndex, subIndex, setIndex);
                    break;
            }
        },
        
        handleWeightChange(action, exerciseIndex, subIndex, setIndex) {
            const isIncrease = action === 'increase-weight';
            if (window.WorkoutModule) {
                window.WorkoutModule.adjustSetValue(exerciseIndex, subIndex, setIndex, 'weight', isIncrease);
            }
        },
        
        handleRepsChange(action, exerciseIndex, subIndex, setIndex) {
            const isIncrease = action === 'increase-reps';
            if (window.WorkoutModule) {
                window.WorkoutModule.adjustSetValue(exerciseIndex, subIndex, setIndex, 'reps', isIncrease);
            }
        },
        
        handleSetValueClick(valueElement) {
            const type = valueElement.getAttribute('data-type');
            const exerciseIndex = parseInt(valueElement.getAttribute('data-exercise-index'));
            const subIndex = valueElement.getAttribute('data-sub-index') ? parseInt(valueElement.getAttribute('data-sub-index')) : null;
            const setIndex = parseInt(valueElement.getAttribute('data-set-index'));
            
            const currentValue = type === 'weight' ? 
                parseFloat(valueElement.textContent) : 
                parseInt(valueElement.textContent);
            
            const title = type === 'weight' ? 'Выбери вес' : 'Выбери повторы';
            const options = type === 'weight' ? 
                Utils.generateWeightOptions() : 
                Utils.generateRepsOptions();
            
            Components.ValuePicker.show(title, currentValue, options, (newValue) => {
                if (window.WorkoutModule) {
                    window.WorkoutModule.updateSetValue(exerciseIndex, subIndex, setIndex, type, newValue);
                }
            });
        },
        
        handleAddSet(button) {
            const exerciseIndex = parseInt(button.getAttribute('data-exercise-index'));
            const subIndex = button.getAttribute('data-sub-index') ? parseInt(button.getAttribute('data-sub-index')) : null;
            
            if (window.WorkoutModule) {
                window.WorkoutModule.addSet(exerciseIndex, subIndex);
            }
        },
        
        handleRemoveSet(exerciseIndex, subIndex, setIndex) {
            if (window.WorkoutModule) {
                window.WorkoutModule.removeSet(exerciseIndex, subIndex, setIndex);
            }
        },
        
        onDeleteExercise(index) {
            if (window.WorkoutModule) {
                window.WorkoutModule.removeExercise(index);
            }
        },
        
        onDuplicateExercise(index) {
            if (window.WorkoutModule) {
                window.WorkoutModule.duplicateExercise(index);
            }
        }
    },
    
    // Loading Component
    Loading: {
        show(message = 'Загрузка...') {
            const overlay = document.getElementById('loading-overlay');
            if (!overlay) return;
            
            const textElement = overlay.querySelector('p');
            if (textElement) {
                textElement.textContent = message;
            }
            
            overlay.classList.remove('hidden');
        },
        
        hide() {
            const overlay = document.getElementById('loading-overlay');
            if (!overlay) return;
            
            overlay.classList.add('hidden');
        }
    },
    
    // Initialize all components
    init() {
        this.Modal.init();
        this.ExerciseSelector.init();
        this.ValuePicker.init();
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Components;
}
