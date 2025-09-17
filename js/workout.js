// workout.js — упрощённый интерфейс без модалок

// ====== Конфигурация ======
const exerciseList = [
    // 🏋️‍♂️ Ноги
    { id: 'squat', name: 'Приседания со штангой' },
    { id: 'front_squat', name: 'Фронтальные приседания' },
    { id: 'leg_press', name: 'Жим ногами в тренажёре' },
    { id: 'lunge', name: 'Выпады' },
    { id: 'step_up', name: 'Подъёмы на платформу' },
    { id: 'leg_extension', name: 'Разгибания ног в тренажёре' },
    { id: 'leg_curl', name: 'Сгибания ног в тренажёре' },
    { id: 'calf_raise', name: 'Подъёмы на носки стоя' },
    { id: 'seated_calf_raise', name: 'Подъёмы на носки сидя' },

    // 🏋️‍♂️ Спина
    { id: 'deadlift', name: 'Становая тяга' },
    { id: 'sumo_deadlift', name: 'Становая тяга сумо' },
    { id: 'romanian_deadlift', name: 'Румынская тяга' },
    { id: 'pullup', name: 'Подтягивания' },
    { id: 'chinup', name: 'Подтягивания обратным хватом' },
    { id: 'lat_pulldown', name: 'Тяга верхнего блока' },
    { id: 'seated_row', name: 'Тяга горизонтального блока' },
    { id: 'barbell_row', name: 'Тяга штанги в наклоне' },
    { id: 'dumbbell_row', name: 'Тяга гантели в наклоне' },
    { id: 'face_pull', name: 'Тяга каната к лицу' },

    // 🏋️‍♂️ Грудь
    { id: 'bench_press', name: 'Жим лёжа со штангой' },
    { id: 'incline_bench_press', name: 'Жим на наклонной скамье' },
    { id: 'decline_bench_press', name: 'Жим на скамье с отрицательным наклоном' },
    { id: 'dumbbell_press', name: 'Жим гантелей лёжа' },
    { id: 'dumbbell_fly', name: 'Разводка гантелей лёжа' },
    { id: 'pushup', name: 'Отжимания' },
    { id: 'chest_dips', name: 'Отжимания на брусьях' },
    { id: 'pec_deck', name: 'Сведение рук в тренажёре' },

    // 🏋️‍♂️ Плечи
    { id: 'overhead_press', name: 'Жим штанги стоя' },
    { id: 'seated_overhead_press', name: 'Жим штанги сидя' },
    { id: 'arnold_press', name: 'Жим Арнольда' },
    { id: 'lateral_raise', name: 'Подъём гантелей в стороны' },
    { id: 'front_raise', name: 'Подъём гантелей вперёд' },
    { id: 'rear_delt_fly', name: 'Разводка гантелей в наклоне' },
    { id: 'upright_row', name: 'Тяга штанги к подбородку' },
    
    // 🏋️‍♂️ Руки — бицепс
    { id: 'barbell_curl', name: 'Подъём штанги на бицепс' },
    { id: 'dumbbell_curl', name: 'Подъём гантелей на бицепс' },
    { id: 'hammer_curl', name: 'Подъём гантелей молотком' },
    { id: 'preacher_curl', name: 'Сгибания на скамье Скотта' },
    { id: 'cable_curl', name: 'Сгибания на блоке' },

    // 🏋️‍♂️ Руки — трицепс
    { id: 'triceps_pushdown', name: 'Разгибания на блоке' },
    { id: 'overhead_triceps_extension', name: 'Разгибания из-за головы' },
    { id: 'close_grip_bench_press', name: 'Жим узким хватом' },
    { id: 'bench_dips', name: 'Отжимания от скамьи' },
    { id: 'skullcrusher', name: 'Французский жим' },

    // 🏋️‍♂️ Пресс
    { id: 'crunch', name: 'Скручивания' },
    { id: 'reverse_crunch', name: 'Обратные скручивания' },
    { id: 'leg_raise', name: 'Подъём ног в висе' },
    { id: 'plank', name: 'Планка' },
    { id: 'side_plank', name: 'Боковая планка' },
    { id: 'ab_rollout', name: 'Выкаты с колёсиком' }
];

let workoutData = []; // текущая тренировка

// ====== Инициализация ======
document.addEventListener('DOMContentLoaded', () => {
    initSelectors();
    initEvents();
    loadDraft();
});

// ====== Рендер селекторов ======
function initSelectors() {
    const exerciseSelect = document.getElementById('exerciseSelect');
    const weightSelect = document.getElementById('weightSelect');
    const repsSelect = document.getElementById('repsSelect');

    // Упражнения
    exerciseList.forEach(ex => {
        const opt = document.createElement('option');
        opt.value = ex.id;
        opt.textContent = ex.name;
        exerciseSelect.appendChild(opt);
    });

    // Веса
    for (let w = 0.5; w <= 200; w += (w < 20 ? 0.5 : 2.5)) {
        const opt = document.createElement('option');
        opt.value = w;
        opt.textContent = `${w} кг`;
        weightSelect.appendChild(opt);
    }

    // Повторы
    [5, 8, 10, 12, 15, 20].forEach(r => {
        const opt = document.createElement('option');
        opt.value = r;
        opt.textContent = `${r}`;
        repsSelect.appendChild(opt);
    });
}

// ====== События ======
function initEvents() {
    document.getElementById('addSetBtn').addEventListener('click', () => {
        const exercise = document.getElementById('exerciseSelect').value;
        const weight = document.getElementById('weightSelect').value;
        const reps = document.getElementById('repsSelect').value;

        if (!exercise || !weight || !reps) {
            alert('Заполни все поля');
            return;
        }

        addSet(exercise, weight, reps);
        saveDraft();
        renderWorkout();
    });

    document.getElementById('saveWorkoutBtn')?.addEventListener('click', () => {
        saveWorkout();
    });
}

// ====== Логика ======
function addSet(exerciseId, weight, reps) {
    const exerciseName = exerciseList.find(e => e.id === exerciseId)?.name || exerciseId;
    workoutData.push({
        exercise: exerciseName,
        weight: parseFloat(weight),
        reps: parseInt(reps),
        time: Date.now()
    });
}

function renderWorkout() {
    const container = document.getElementById('workoutList');
    container.innerHTML = '';

    workoutData.forEach((set, index) => {
        const div = document.createElement('div');
        div.className = 'workout-set';
        div.textContent = `${set.exercise} — ${set.weight} кг × ${set.reps} повторов`;
        
        const delBtn = document.createElement('button');
        delBtn.textContent = '✕';
        delBtn.addEventListener('click', () => {
            workoutData.splice(index, 1);
            saveDraft();
            renderWorkout();
        });

        div.appendChild(delBtn);
        container.appendChild(div);
    });
}

// ====== Сохранение / Загрузка ======
function saveDraft() {
    try {
        localStorage.setItem('workoutDraft', JSON.stringify(workoutData));
    } catch (e) {
        console.error('Ошибка сохранения черновика', e);
    }
}

function loadDraft() {
    try {
        const draft = localStorage.getItem('workoutDraft');
        if (draft) {
            workoutData = JSON.parse(draft);
            renderWorkout();
        }
    } catch (e) {
        console.error('Ошибка загрузки черновика', e);
    }
}

function saveWorkout() {
    // Если есть Telegram WebApp API
    if (window.Telegram?.WebApp?.CloudStorage) {
        Telegram.WebApp.CloudStorage.setItem('workoutHistory', JSON.stringify(workoutData), (err, ok) => {
            if (ok) {
                alert('Тренировка сохранена в облаке!');
                workoutData = [];
                saveDraft();
                renderWorkout();
            } else {
                alert('Ошибка сохранения в облако');
            }
        });
    } else {
        alert('Облако недоступно, сохранено локально');
        localStorage.setItem('workoutHistory', JSON.stringify(workoutData));
        workoutData = [];
        saveDraft();
        renderWorkout();
    }
}
