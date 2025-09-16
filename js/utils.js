
// Utility Functions
const Utils = {
    // Date Utilities
    formatDate(date, format = 'short') {
        if (!date) return '';
        
        const d = new Date(date);
        if (isNaN(d.getTime())) return '';
        
        const options = {
            short: { day: '2-digit', month: '2-digit', year: 'numeric' },
            long: { day: '2-digit', month: 'long', year: 'numeric' },
            display: { weekday: 'long', day: '2-digit', month: 'long' }
        };
        
        try {
            return d.toLocaleDateString('ru-RU', options[format] || options.short);
        } catch (error) {
            console.error('Date formatting error:', error);
            return d.toLocaleDateString();
        }
    },
    
    formatDateRelative(date) {
        if (!date) return '';
        
        const d = new Date(date);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        const isSameDay = (date1, date2) => {
            return date1.getDate() === date2.getDate() &&
                   date1.getMonth() === date2.getMonth() &&
                   date1.getFullYear() === date2.getFullYear();
        };
        
        if (isSameDay(d, today)) {
            return 'Сегодня';
        } else if (isSameDay(d, yesterday)) {
            return 'Вчера';
        } else {
            return this.formatDate(d, 'long');
        }
    },
    
    getDateString(date) {
        if (!date) return '';
        const d = new Date(date);
        return d.toISOString().split('T')[0];
    },
    
    // Number Utilities
    formatNumber(number, decimals = 0) {
        if (typeof number !== 'number' || isNaN(number)) return '0';
        
        return number.toLocaleString('ru-RU', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        });
    },
    
    formatWeight(weight) {
        if (!weight) return '0 кг';
        return `${this.formatNumber(weight, weight % 1 === 0 ? 0 : 1)} кг`;
    },
    
    formatReps(reps) {
        if (!reps) return '0';
        return this.formatNumber(reps);
    },
    
    // Weight Generation Utilities
    generateWeightOptions() {
        const options = [];
        
        // Light weights (0.5kg steps up to 20kg)
        for (let weight = CONFIG.WEIGHT.MIN; weight <= CONFIG.WEIGHT.THRESHOLD; weight += CONFIG.WEIGHT.STEP_LIGHT) {
            options.push(weight);
        }
        
        // Heavy weights (2.5kg steps from 20kg to 300kg)
        for (let weight = CONFIG.WEIGHT.THRESHOLD + CONFIG.WEIGHT.STEP_HEAVY; weight <= CONFIG.WEIGHT.MAX; weight += CONFIG.WEIGHT.STEP_HEAVY) {
            options.push(weight);
        }
        
        return options;
    },
    
    generateRepsOptions() {
        const options = [];
        for (let reps = CONFIG.REPS.MIN; reps <= CONFIG.REPS.MAX; reps++) {
            options.push(reps);
        }
        return options;
    },
    
    // Validation Utilities
    validateWeight(weight) {
        const num = parseFloat(weight);
        return !isNaN(num) && num >= CONFIG.WEIGHT.MIN && num <= CONFIG.WEIGHT.MAX;
    },
    
    validateReps(reps) {
        const num = parseInt(reps);
        return !isNaN(num) && num >= CONFIG.REPS.MIN && num <= CONFIG.REPS.MAX;
    },
    
    validateExerciseName(name) {
        return typeof name === 'string' && 
               name.trim().length >= VALIDATION.EXERCISE_NAME.MIN_LENGTH &&
               name.trim().length <= VALIDATION.EXERCISE_NAME.MAX_LENGTH;
    },
    
    // Calculation Utilities
    calculateTonnage(sets) {
        if (!Array.isArray(sets)) return 0;
        
        return sets.reduce((total, set) => {
            const weight = parseFloat(set.weight) || 0;
            const reps = parseInt(set.reps) || 0;
            return total + (weight * reps);
        }, 0);
    },
    
    calculateTotalReps(sets) {
        if (!Array.isArray(sets)) return 0;
        
        return sets.reduce((total, set) => {
            return total + (parseInt(set.reps) || 0);
        }, 0);
    },
    
    calculateMaxWeight(sets) {
        if (!Array.isArray(sets) || sets.length === 0) return 0;
        
        return Math.max(...sets.map(set => parseFloat(set.weight) || 0));
    },
    
    calculateWorkoutStats(workout) {
        if (!workout || !workout.exercises) {
            return { tonnage: 0, reps: 0, maxWeight: 0, duration: 0 };
        }
        
        let totalTonnage = 0;
        let totalReps = 0;
        let maxWeight = 0;
        
        workout.exercises.forEach(exercise => {
            if (exercise.type === 'superset') {
                exercise.exercises.forEach(subExercise => {
                    const tonnage = this.calculateTonnage(subExercise.sets);
                    const reps = this.calculateTotalReps(subExercise.sets);
                    const weight = this.calculateMaxWeight(subExercise.sets);
                    
                    totalTonnage += tonnage;
                    totalReps += reps;
                    maxWeight = Math.max(maxWeight, weight);
                });
            } else {
                const tonnage = this.calculateTonnage(exercise.sets);
                const reps = this.calculateTotalReps(exercise.sets);
                const weight = this.calculateMaxWeight(exercise.sets);
                
                totalTonnage += tonnage;
                totalReps += reps;
                maxWeight = Math.max(maxWeight, weight);
            }
        });
        
        return {
            tonnage: Math.round(totalTonnage * 100) / 100,
            reps: totalReps,
            maxWeight: Math.round(maxWeight * 100) / 100,
            duration: workout.duration || 0
        };
    },
    
    // Search Utilities
    searchExercises(query, exercises = EXERCISES) {
        if (!query || !query.trim()) return exercises;
        
        const searchTerm = query.toLowerCase().trim();
        return exercises.filter(exercise =>
            exercise.toLowerCase().includes(searchTerm)
        );
    },
    
    // UI Utilities
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },
    
    // Animation Utilities
    animate(element, property, from, to, duration = 300, easing = 'ease-out') {
        if (!element) return Promise.resolve();
        
        return new Promise((resolve) => {
            const start = performance.now();
            const change = to - from;
            
            const animate = (now) => {
                const elapsed = now - start;
                const progress = Math.min(elapsed / duration, 1);
                
                let easedProgress = progress;
                if (easing === 'ease-out') {
                    easedProgress = 1 - Math.pow(1 - progress, 2);
                } else if (easing === 'ease-in') {
                    easedProgress = Math.pow(progress, 2);
                }
                
                const currentValue = from + (change * easedProgress);
                element.style[property] = currentValue + (property.includes('opacity') ? '' : 'px');
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    resolve();
                }
            };
            
            requestAnimationFrame(animate);
        });
    },
    
    // Error Handling
    showError(message, duration = 3000) {
        this.showToast(message, 'error', duration);
    },
    
    showSuccess(message, duration = 3000) {
        this.showToast(message, 'success', duration);
    },
    
    showToast(message, type = 'info', duration = 3000) {
        // Remove existing toasts
        const existingToasts = document.querySelectorAll('.toast');
        existingToasts.forEach(toast => toast.remove());
        
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        const style = {
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '12px 20px',
            borderRadius: '8px',
            color: 'white',
            fontWeight: '500',
            fontSize: '14px',
            zIndex: '10000',
            opacity: '0',
            transition: 'opacity 0.3s ease',
            maxWidth: '90vw',
            textAlign: 'center'
        };
        
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6'
        };
        
        Object.assign(toast.style, style);
        toast.style.backgroundColor = colors[type] || colors.info;
        
        document.body.appendChild(toast);
        
        // Animate in
        requestAnimationFrame(() => {
            toast.style.opacity = '1';
        });
        
        // Auto remove
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, duration);
    },
    
    // Haptic Feedback
    hapticFeedback(type = 'light') {
        if (!CONFIG.HAPTIC_FEEDBACK) return;
        
        try {
            if (window.Telegram?.WebApp?.HapticFeedback) {
                const feedback = window.Telegram.WebApp.HapticFeedback;
                
                switch (type) {
                    case 'light':
                        feedback.impactOccurred('light');
                        break;
                    case 'medium':
                        feedback.impactOccurred('medium');
                        break;
                    case 'heavy':
                        feedback.impactOccurred('heavy');
                        break;
                    case 'success':
                        feedback.notificationOccurred('success');
                        break;
                    case 'error':
                        feedback.notificationOccurred('error');
                        break;
                    case 'warning':
                        feedback.notificationOccurred('warning');
                        break;
                    case 'selection':
                        feedback.selectionChanged();
                        break;
                    default:
                        feedback.impactOccurred('light');
                }
            }
        } catch (error) {
            console.warn('Haptic feedback not available:', error);
        }
    },
    
    // Storage Utilities
    formatStorageSize(bytes) {
        if (bytes === 0) return '0 байт';
        
        const k = 1024;
        const sizes = ['байт', 'КБ', 'МБ'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    },
    
    // Deep Clone
    deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj.getTime());
        if (obj instanceof Array) return obj.map(item => this.deepClone(item));
        if (obj instanceof Object) {
            const clone = {};
            for (let key in obj) {
                if (obj.hasOwnProperty(key)) {
                    clone[key] = this.deepClone(obj[key]);
                }
            }
            return clone;
        }
    },
    
    // UUID Generator
    generateId() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    },
    
    // URL Utilities
    createShareUrl(workout) {
        const baseUrl = window.location.origin;
        const data = {
            date: workout.date,
            tonnage: this.calculateWorkoutStats(workout).tonnage,
            exercises: workout.exercises.length
        };
        
        return `${baseUrl}?share=${btoa(JSON.stringify(data))}`;
    },
    
    // Export Utilities
    downloadJSON(data, filename) {
        const blob = new Blob([JSON.stringify(data, null, 2)], {
            type: 'application/json'
        });
        
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Utils;
}
