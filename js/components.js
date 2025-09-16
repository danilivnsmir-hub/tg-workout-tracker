
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
    
    // NEW: Exercise Addition Stepper Component
    ExerciseStepper: {
        currentStep: 1,
        selectedExercise: null,
        exerciseParams: {
            weight: 20,
            reps: 8
        },
        callback: null,
        selectedExercises: [],
        
        show(callback, selectedExercises = []) {
            this.callback = callback;
            this.selectedExercises = selectedExercises;
            this.reset();
            this.showStepper();
            this.renderStep();
        },
        
        reset() {
            this.currentStep = 1;
            this.selectedExercise = null;
            this.exerciseParams = { weight: 20, reps: 8 };
        },
        
        showStepper() {
            const stepper = document.getElementById('exercise-stepper');
            const overlay = document.getElementById('stepper-overlay');
            
            if (!stepper || !overlay) return;
            
            // Prevent body scroll
            document.body.style.overflow = 'hidden';
            document.body.style.position = 'fixed';
            document.body.style.width = '100%';
            document.body.style.height = '100%';
            
            overlay.classList.add('active');
            stepper.classList.add('active');
            
            Utils.hapticFeedback('light');
        },
        
        hideStepper() {
            const stepper = document.getElementById('exercise-stepper');
            const overlay = document.getElementById('stepper-overlay');
            
            if (!stepper || !overlay) return;
            
            // Re-enable body scroll
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.width = '';
            document.body.style.height = '';
            
            overlay.classList.remove('active');
            stepper.classList.remove('active');
        },
        
        renderStep() {
            this.updateProgress();
            
            if (this.currentStep === 1) {
                this.renderExerciseSelection();
            } else if (this.currentStep === 2) {
                this.renderParameterSetup();
            }
            
            this.updateButtons();
        },
        
        updateProgress() {
            const step1Dot = document.getElementById('step-1-dot');
            const step2Dot = document.getElementById('step-2-dot');
            const stepperTitle = document.getElementById('stepper-title');
            
            if (!step1Dot || !step2Dot || !stepperTitle) return;
            
            // Update step indicators
            step1Dot.classList.toggle('active', this.currentStep >= 1);
            step2Dot.classList.toggle('active', this.currentStep >= 2);
            
            // Update title
            if (this.currentStep === 1) {
                stepperTitle.textContent = 'Выбери упражнение';
            } else if (this.currentStep === 2) {
                stepperTitle.textContent = 'Настрой параметры';
            }
        },
        
        renderExerciseSelection() {
            const content = document.getElementById('stepper-content');
            if (!content) return;
            
            // Filter out already selected exercises
            const availableExercises = EXERCISES.filter(exercise => 
                !this.selectedExercises.includes(exercise)
            );
            
            content.innerHTML = `
                <div class="search-box" style="margin-bottom: 1rem;">
                    <input type="text" id="step-exercise-search" placeholder="Поиск упражнений..." class="form-input">
                </div>
                <div id="step-exercise-list" class="step-exercise-list">
                    ${availableExercises.map(exercise => `
                        <div class="step-exercise-option" data-exercise="${exercise}">
                            ${exercise}
                        </div>
                    `).join('')}
                </div>
            `;
            
            this.attachExerciseSelectionHandlers();
        },
        
        attachExerciseSelectionHandlers() {
            const searchInput = document.getElementById('step-exercise-search');
            const exerciseOptions = document.querySelectorAll('.step-exercise-option');
            
            // Search functionality
            if (searchInput) {
                searchInput.addEventListener('input', (e) => {
                    this.filterExercises(e.target.value);
                });
                
                // Enhanced mobile handling
                searchInput.addEventListener('touchstart', () => {
                    setTimeout(() => searchInput.focus(), 100);
                }, { passive: true });
            }
            
            // Exercise selection handling
            exerciseOptions.forEach(option => {
                this.addExerciseOptionHandling(option);
            });
        },
        
        addExerciseOptionHandling(element) {
            const exercise = element.dataset.exercise;
            let touchStarted = false;
            
            // Touch handling
            element.addEventListener('touchstart', () => {
                touchStarted = true;
                element.style.transform = 'scale(0.98)';
                element.style.transition = 'transform 0.1s ease';
            }, { passive: true });
            
            element.addEventListener('touchend', () => {
                element.style.transform = '';
                if (touchStarted) {
                    this.selectExercise(exercise);
                }
                touchStarted = false;
            }, { passive: true });
            
            element.addEventListener('touchcancel', () => {
                element.style.transform = '';
                touchStarted = false;
            }, { passive: true });
            
            // Click handling
            element.addEventListener('click', () => this.selectExercise(exercise));
        },
        
        selectExercise(exercise) {
            this.selectedExercise = exercise;
            
            // Update UI to show selection
            const options = document.querySelectorAll('.step-exercise-option');
            options.forEach(option => {
                option.classList.toggle('selected', option.dataset.exercise === exercise);
            });
            
            Utils.hapticFeedback('selection');
            this.updateButtons();
        },
        
        filterExercises(query) {
            const exerciseList = document.getElementById('step-exercise-list');
            if (!exerciseList) return;
            
            const filteredExercises = Utils.searchExercises(query);
            const availableExercises = filteredExercises.filter(exercise => 
                !this.selectedExercises.includes(exercise)
            );
            
            if (availableExercises.length === 0 && query.length > 0) {
                exerciseList.innerHTML = `
                    <div style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                        <div style="font-size: 2rem; margin-bottom: 1rem;">🔍</div>
                        <div>Упражнения не найдены</div>
                        <div style="font-size: var(--font-size-sm); margin-top: 0.5rem;">Попробуйте изменить запрос</div>
                    </div>
                `;
            } else {
                exerciseList.innerHTML = availableExercises.map(exercise => `
                    <div class="step-exercise-option" data-exercise="${exercise}">
                        ${exercise}
                    </div>
                `).join('');
                
                // Re-attach handlers
                const options = document.querySelectorAll('.step-exercise-option');
                options.forEach(option => this.addExerciseOptionHandling(option));
            }
        },
        
        renderParameterSetup() {
            const content = document.getElementById('stepper-content');
            if (!content) return;
            
            content.innerHTML = `
                <!-- Selected Exercise Preview -->
                <div class="selected-exercise-preview">
                    <div class="exercise-icon">${this.selectedExercise?.charAt(0).toUpperCase() || '💪'}</div>
                    <div>
                        <div class="exercise-name">${this.selectedExercise || 'Упражнение'}</div>
                        <div style="font-size: var(--font-size-sm); color: var(--text-secondary);">
                            Настрой параметры для первого подхода
                        </div>
                    </div>
                </div>
                
                <!-- Parameter Setup -->
                <div class="parameter-setup">
                    <!-- Weight Parameter -->
                    <div class="parameter-group">
                        <div class="parameter-label">Вес (кг)</div>
                        <div class="parameter-picker">
                            <div class="parameter-controls">
                                <button class="parameter-btn" data-action="weight-inc">+</button>
                                <button class="parameter-btn" data-action="weight-dec">-</button>
                            </div>
                            <div class="parameter-value-display" id="weight-display">${this.exerciseParams.weight}</div>
                            <div class="parameter-controls">
                                <button class="parameter-btn" data-action="weight-inc-5">+5</button>
                                <button class="parameter-btn" data-action="weight-dec-5">-5</button>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Reps Parameter -->
                    <div class="parameter-group">
                        <div class="parameter-label">Повторения</div>
                        <div class="parameter-picker">
                            <div class="parameter-controls">
                                <button class="parameter-btn" data-action="reps-inc">+</button>
                                <button class="parameter-btn" data-action="reps-dec">-</button>
                            </div>
                            <div class="parameter-value-display" id="reps-display">${this.exerciseParams.reps}</div>
                            <div class="parameter-controls">
                                <button class="parameter-btn" data-action="reps-inc-5">+5</button>
                                <button class="parameter-btn" data-action="reps-dec-5">-5</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            this.attachParameterHandlers();
        },
        
        attachParameterHandlers() {
            const parameterButtons = document.querySelectorAll('.parameter-btn');
            
            parameterButtons.forEach(button => {
                const action = button.dataset.action;
                
                // Touch and click handling
                let touchStarted = false;
                
                button.addEventListener('touchstart', () => {
                    touchStarted = true;
                    button.style.transform = 'scale(0.95)';
                }, { passive: true });
                
                button.addEventListener('touchend', () => {
                    button.style.transform = '';
                    if (touchStarted) {
                        this.handleParameterAction(action);
                    }
                    touchStarted = false;
                }, { passive: true });
                
                button.addEventListener('touchcancel', () => {
                    button.style.transform = '';
                    touchStarted = false;
                }, { passive: true });
                
                button.addEventListener('click', () => this.handleParameterAction(action));
            });
        },
        
        handleParameterAction(action) {
            const weightDisplay = document.getElementById('weight-display');
            const repsDisplay = document.getElementById('reps-display');
            
            switch (action) {
                case 'weight-inc':
                    this.exerciseParams.weight = Math.min(this.exerciseParams.weight + 2.5, 200);
                    break;
                case 'weight-dec':
                    this.exerciseParams.weight = Math.max(this.exerciseParams.weight - 2.5, 0);
                    break;
                case 'weight-inc-5':
                    this.exerciseParams.weight = Math.min(this.exerciseParams.weight + 5, 200);
                    break;
                case 'weight-dec-5':
                    this.exerciseParams.weight = Math.max(this.exerciseParams.weight - 5, 0);
                    break;
                case 'reps-inc':
                    this.exerciseParams.reps = Math.min(this.exerciseParams.reps + 1, 50);
                    break;
                case 'reps-dec':
                    this.exerciseParams.reps = Math.max(this.exerciseParams.reps - 1, 1);
                    break;
                case 'reps-inc-5':
                    this.exerciseParams.reps = Math.min(this.exerciseParams.reps + 5, 50);
                    break;
                case 'reps-dec-5':
                    this.exerciseParams.reps = Math.max(this.exerciseParams.reps - 5, 1);
                    break;
            }
            
            // Update displays with animation
            if (weightDisplay) {
                weightDisplay.style.transform = 'scale(1.1)';
                weightDisplay.textContent = this.exerciseParams.weight;
                setTimeout(() => {
                    weightDisplay.style.transform = '';
                }, 150);
            }
            
            if (repsDisplay) {
                repsDisplay.style.transform = 'scale(1.1)';
                repsDisplay.textContent = this.exerciseParams.reps;
                setTimeout(() => {
                    repsDisplay.style.transform = '';
                }, 150);
            }
            
            Utils.hapticFeedback('light');
        },
        
        updateButtons() {
            const backBtn = document.getElementById('stepper-back');
            const nextBtn = document.getElementById('stepper-next');
            const cancelBtn = document.getElementById('stepper-cancel');
            
            if (!backBtn || !nextBtn || !cancelBtn) return;
            
            // Back button visibility
            backBtn.style.display = this.currentStep > 1 ? 'flex' : 'none';
            
            // Next button state and text
            if (this.currentStep === 1) {
                nextBtn.textContent = 'Далее →';
                nextBtn.disabled = !this.selectedExercise;
            } else if (this.currentStep === 2) {
                nextBtn.textContent = 'Добавить';
                nextBtn.disabled = false;
            }
        },
        
        nextStep() {
            if (this.currentStep === 1 && this.selectedExercise) {
                this.currentStep = 2;
                this.renderStep();
            } else if (this.currentStep === 2) {
                this.completeAddition();
            }
        },
        
        prevStep() {
            if (this.currentStep > 1) {
                this.currentStep--;
                this.renderStep();
            }
        },
        
        completeAddition() {
            if (!this.selectedExercise || !this.callback) return;
            
            // Create exercise object with parameters
            const exercise = {
                id: Utils.generateId(),
                name: this.selectedExercise,
                type: 'single',
                sets: [{
                    weight: this.exerciseParams.weight,
                    reps: this.exerciseParams.reps
                }]
            };
            
            // Call the callback with the complete exercise
            this.callback(exercise);
            
            // Hide stepper
            this.hideStepper();
            
            Utils.hapticFeedback('success');
            Utils.showSuccess('Упражнение добавлено!');
        },
        
        init() {
            const stepperClose = document.getElementById('stepper-close');
            const stepperBack = document.getElementById('stepper-back');
            const stepperNext = document.getElementById('stepper-next');
            const stepperCancel = document.getElementById('stepper-cancel');
            const stepperOverlay = document.getElementById('stepper-overlay');
            
            // Close button
            if (stepperClose) {
                stepperClose.addEventListener('click', () => this.hideStepper());
                stepperClose.addEventListener('touchend', () => this.hideStepper(), { passive: true });
            }
            
            // Back button
            if (stepperBack) {
                stepperBack.addEventListener('click', () => this.prevStep());
                stepperBack.addEventListener('touchend', () => this.prevStep(), { passive: true });
            }
            
            // Next button
            if (stepperNext) {
                stepperNext.addEventListener('click', () => this.nextStep());
                stepperNext.addEventListener('touchend', () => this.nextStep(), { passive: true });
            }
            
            // Cancel button
            if (stepperCancel) {
                stepperCancel.addEventListener('click', () => this.hideStepper());
                stepperCancel.addEventListener('touchend', () => this.hideStepper(), { passive: true });
            }
            
            // Overlay click to close
            if (stepperOverlay) {
                stepperOverlay.addEventListener('click', (e) => {
                    if (e.target === stepperOverlay) {
                        this.hideStepper();
                    }
                });
            }
            
            // Escape key to close
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    const stepper = document.getElementById('exercise-stepper');
                    if (stepper?.classList.contains('active')) {
                        this.hideStepper();
                    }
                }
            });
        }
    },
    
    // Legacy Exercise Selector Component (kept for compatibility)
    ExerciseSelector: {
        show(callback, selectedExercises = []) {
            // Redirect to new stepper interface
            Components.ExerciseStepper.show((exercise) => {
                // Legacy callback expects just the exercise name
                callback(exercise.name);
            }, selectedExercises);
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
        this.ExerciseStepper.init();
        this.ExerciseSelector.init();
        this.ValuePicker.init();
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Components;
}
