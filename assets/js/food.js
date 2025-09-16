
// Трекер питания
class FoodTracker {
    constructor() {
        this.currentDate = new Date().toISOString().split('T')[0];
        this.dailyCalorieGoal = 2000;
        this.currentMeal = null;
        this.foodLog = {};
        
        this.init();
    }

    async init() {
        await this.loadFoodData();
        this.setupEventListeners();
        this.setupUI();
        this.renderFoodLog();
        this.updateCalorieSummary();
    }

    async loadFoodData() {
        try {
            this.foodLog = await window.workoutStorage.getData('food_log') || {};
            console.log('Загружен дневник питания');
        } catch (error) {
            console.error('Ошибка загрузки дневника питания:', error);
            window.ui.showToast('Ошибка загрузки данных питания', 'error');
        }
    }

    setupEventListeners() {
        // Изменение даты
        document.getElementById('foodDate').addEventListener('change', (e) => {
            this.currentDate = e.target.value;
            this.renderFoodLog();
            this.updateCalorieSummary();
        });

        // Модальное окно еды
        document.getElementById('saveFoodBtn').addEventListener('click', () => {
            this.saveFood();
        });

        document.getElementById('cancelFoodBtn').addEventListener('click', () => {
            this.closeFoodModal();
        });
    }

    setupUI() {
        document.getElementById('foodDate').value = this.currentDate;
    }

    addFoodItem(mealType) {
        this.currentMeal = mealType;
        this.showFoodModal();
    }

    showFoodModal() {
        // Очищаем форму
        document.getElementById('foodName').value = '';
        document.getElementById('foodWeight').value = '';
        document.getElementById('foodCalories').value = '';
        
        window.ui.showModal('foodModal');
    }

    closeFoodModal() {
        this.currentMeal = null;
        window.ui.closeModal('foodModal');
    }

    async saveFood() {
        const name = document.getElementById('foodName').value.trim();
        const weight = parseFloat(document.getElementById('foodWeight').value) || 0;
        const caloriesPer100g = parseFloat(document.getElementById('foodCalories').value) || 0;

        if (!name || weight <= 0 || caloriesPer100g <= 0) {
            window.ui.showToast('Заполните все поля корректно', 'warning');
            return;
        }

        const totalCalories = Math.round((caloriesPer100g * weight) / 100);

        const foodItem = {
            id: Date.now(),
            name: name,
            weight: weight,
            caloriesPer100g: caloriesPer100g,
            totalCalories: totalCalories,
            timestamp: new Date().toISOString()
        };

        // Добавляем в дневник питания
        if (!this.foodLog[this.currentDate]) {
            this.foodLog[this.currentDate] = {
                breakfast: [],
                lunch: [],
                dinner: [],
                snack: []
            };
        }

        this.foodLog[this.currentDate][this.currentMeal].push(foodItem);

        try {
            await window.workoutStorage.setData('food_log', this.foodLog);
            this.renderFoodLog();
            this.updateCalorieSummary();
            this.closeFoodModal();
            
            window.ui.showToast(`Добавлено: ${name}`, 'success');
        } catch (error) {
            console.error('Ошибка сохранения еды:', error);
            window.ui.showToast('Ошибка сохранения', 'error');
        }
    }

    async removeFoodItem(mealType, itemId) {
        if (!this.foodLog[this.currentDate] || !this.foodLog[this.currentDate][mealType]) {
            return;
        }

        this.foodLog[this.currentDate][mealType] = this.foodLog[this.currentDate][mealType]
            .filter(item => item.id !== itemId);

        try {
            await window.workoutStorage.setData('food_log', this.foodLog);
            this.renderFoodLog();
            this.updateCalorieSummary();
            
            window.ui.showToast('Продукт удален', 'info');
        } catch (error) {
            console.error('Ошибка удаления продукта:', error);
            window.ui.showToast('Ошибка удаления', 'error');
        }
    }

    renderFoodLog() {
        const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
        const mealNames = {
            breakfast: 'Завтрак',
            lunch: 'Обед',
            dinner: 'Ужин',
            snack: 'Перекусы'
        };

        mealTypes.forEach(mealType => {
            const container = document.getElementById(`${mealType}Items`);
            container.innerHTML = '';

            const dayLog = this.foodLog[this.currentDate];
            if (!dayLog || !dayLog[mealType] || dayLog[mealType].length === 0) {
                container.innerHTML = '<p class="empty-meal">Ничего не добавлено</p>';
                return;
            }

            dayLog[mealType].forEach(item => {
                const itemElement = document.createElement('div');
                itemElement.className = 'food-item';
                itemElement.innerHTML = `
                    <div class="food-item-info">
                        <div class="food-item-name">${item.name}</div>
                        <div class="food-item-details">${item.weight}г • ${item.totalCalories} ккал</div>
                    </div>
                    <button class="btn-icon remove-food" onclick="window.foodTracker.removeFoodItem('${mealType}', ${item.id})">×</button>
                `;
                
                container.appendChild(itemElement);
            });
        });
    }

    updateCalorieSummary() {
        const dayLog = this.foodLog[this.currentDate];
        let totalCalories = 0;

        if (dayLog) {
            Object.values(dayLog).forEach(meal => {
                if (Array.isArray(meal)) {
                    totalCalories += meal.reduce((sum, item) => sum + item.totalCalories, 0);
                }
            });
        }

        const remainingCalories = Math.max(0, this.dailyCalorieGoal - totalCalories);

        document.getElementById('totalCalories').textContent = totalCalories;
        document.getElementById('remainingCalories').textContent = remainingCalories;

        // Обновляем цвет в зависимости от прогресса
        const totalElement = document.getElementById('totalCalories');
        const remainingElement = document.getElementById('remainingCalories');

        if (totalCalories > this.dailyCalorieGoal) {
            totalElement.style.color = '#dc3545';
            remainingElement.style.color = '#dc3545';
        } else if (totalCalories > this.dailyCalorieGoal * 0.8) {
            totalElement.style.color = '#ffc107';
            remainingElement.style.color = '#ffc107';
        } else {
            totalElement.style.color = '#28a745';
            remainingElement.style.color = '#28a745';
        }
    }

    // Получение статистики питания
    getFoodStats() {
        const stats = {
            totalDays: 0,
            averageCalories: 0,
            totalCalories: 0,
            favoriteFood: null
        };

        const foodCounts = {};
        let totalDaysCalories = 0;
        let daysWithData = 0;

        Object.entries(this.foodLog).forEach(([date, dayLog]) => {
            let dayCalories = 0;
            let hasFoodData = false;

            Object.values(dayLog).forEach(meal => {
                if (Array.isArray(meal) && meal.length > 0) {
                    hasFoodData = true;
                    meal.forEach(item => {
                        dayCalories += item.totalCalories;
                        stats.totalCalories += item.totalCalories;
                        
                        const foodKey = item.name.toLowerCase();
                        foodCounts[foodKey] = (foodCounts[foodKey] || 0) + 1;
                    });
                }
            });

            if (hasFoodData) {
                daysWithData++;
                totalDaysCalories += dayCalories;
            }
        });

        stats.totalDays = daysWithData;
        stats.averageCalories = daysWithData > 0 ? Math.round(totalDaysCalories / daysWithData) : 0;

        // Находим самый частый продукт
        if (Object.keys(foodCounts).length > 0) {
            const mostFrequent = Object.entries(foodCounts)
                .sort(([,a], [,b]) => b - a)[0];
            stats.favoriteFood = {
                name: mostFrequent[0],
                count: mostFrequent[1]
            };
        }

        return stats;
    }
}

// Глобальная функция для кнопок в HTML
window.addFoodItem = function(mealType) {
    window.foodTracker.addFoodItem(mealType);
};

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    window.foodTracker = new FoodTracker();
});
