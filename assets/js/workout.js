// workout.js
const workoutDiv = document.getElementById("workout");
const addExerciseBtn = document.getElementById("addExercise");
const saveBtn = document.getElementById("saveWorkout");
const clearBtn = document.getElementById("clearWorkout");

let workout = [];

// ====== EXERCISES LIST ======
const exercisesList = [
  "Жим лежа",
  "Жим стоя",
  "Приседания со штангой",
  "Мертвая тяга",
  "Подтягивания",
  "Отжимания",
  "Тяга штанги в наклоне",
  "Жим гантелей на скамье",
  "Разведения гантелей",
  "Подъемы на бицепс",
  "Французский жим",
  "Планка",
  "Сведение рук в кроссовере",
  "Тяга верхнего блока",
  "Тяга горизонтального блока",
  "Лег-пресс",
  "Выпады",
  "Становая на прямых ногах",
  "Скручивания",
  "Гиперэкстензия",
  "Жим ногами",
  "Подъемы на носки",
  "Разгибания ног",
  "Сгибания ног",
  "Жим гантелей сидя",
  "Махи гантелями в стороны",
  "Обратные разведения",
  "Шраги",
  "Армейский жим",
  "Жим узким хватом"
];

// ====== WEIGHT & REPS OPTIONS ======
function generateWeights() {
  const weights = [];
  // до 20 кг шаг 0.5
  for (let w = 0; w <= 20; w += 0.5) {
    weights.push(w);
  }
  // от 22.5 до 300 шаг 2.5
  for (let w = 22.5; w <= 300; w += 2.5) {
    weights.push(w);
  }
  return weights;
}

function generateReps() {
  return Array.from({ length: 50 }, (_, i) => i + 1);
}

const weightOptions = generateWeights();
const repsOptions = generateReps();

// ====== STATS ======
function updateStats() {
  let volume = 0;
  let reps = 0;
  let max = 0;

  workout.forEach(ex => {
    ex.sets.forEach(s => {
      volume += s.weight * s.reps;
      reps += s.reps;
      if (s.weight > max) max = s.weight;
    });
  });

  document.getElementById("statVolume").textContent = volume;
  document.getElementById("statReps").textContent = reps;
  document.getElementById("statMax").textContent = max;
}

// ====== RENDER ======
function renderWorkout() {
  workoutDiv.innerHTML = "";
  workout.forEach((ex, exIdx) => {
    const exDiv = document.createElement("div");
    exDiv.className = "card";

    // Генерация выпадающего списка упражнений
    const exerciseOptions = exercisesList.map(name => {
      const selected = ex.name === name ? "selected" : "";
      return `<option value="${name}" ${selected}>${name}</option>`;
    }).join("");

    // Генерация подходов
    const setsHtml = ex.sets.map((s, sIdx) => `
      <div class="set-row">
        Вес: 
        <select onchange="updateSet(${exIdx}, ${sIdx}, 'weight', this.value)">
          ${weightOptions.map(w => `<option value="${w}" ${w === s.weight ? "selected" : ""}>${w}</option>`).join("")}
        </select> кг
        ×
        <select onchange="updateSet(${exIdx}, ${sIdx}, 'reps', this.value)">
          ${repsOptions.map(r => `<option value="${r}" ${r === s.reps ? "selected" : ""}>${r}</option>`).join("")}
        </select>
        <button onclick="removeSet(${exIdx}, ${sIdx})">✖</button>
      </div>
    `).join("");

    exDiv.innerHTML = `
      <h3>${ex.name || "Выберите упражнение"}</h3>
      <select onchange="updateExerciseName(${exIdx}, this.value)">
        <option value="">-- выбрать упражнение --</option>
        ${exerciseOptions}
      </select>
      <div>${setsHtml}</div>
      <button onclick="addSet(${exIdx})">+ Подход</button>
    `;
    workoutDiv.appendChild(exDiv);
  });

  updateStats();
}

// ====== ACTIONS ======
addExerciseBtn.onclick = () => {
  workout.push({ name: "", sets: [{ weight: 0, reps: 1 }] });
  renderWorkout();
  vibrate();
};

function addSet(exIdx) {
  const last = workout[exIdx].sets[workout[exIdx].sets.length - 1];
  workout[exIdx].sets.push({
    weight: last?.weight || 0,
    reps: last?.reps || 1,
  });
  renderWorkout();
  vibrate();
}

function removeSet(exIdx, sIdx) {
  workout[exIdx].sets.splice(sIdx, 1);
  renderWorkout();
  vibrate();
}

function updateExerciseName(exIdx, val) {
  workout[exIdx].name = val.replace(/ё/g, "е").replace(/Ё/g, "Е"); // замена "ё"
}

function updateSet(exIdx, sIdx, field, val) {
  workout[exIdx].sets[sIdx][field] = Number(val);
  updateStats();
}

// ====== SAVE & CLEAR ======
saveBtn.onclick = async () => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const key = "workout_" + today;

    await setData(key, workout);
    showToast("Тренировка сохранена ✅");
    vibrate();
  } catch (e) {
    showError(e);
  }
};

clearBtn.onclick = async () => {
  if (confirm("Очистить тренировку?")) {
    workout = [];
    renderWorkout();

    const today = new Date().toISOString().split("T")[0];
    const key = "workout_" + today;
    await removeData(key);
    showToast("Очищено 🗑");
    vibrate();
  }
};

// ====== RESTORE DRAFT ======
(async () => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const key = "workout_" + today;

    const data = await getData(key, []);
    workout = data;
    renderWorkout();
  } catch (e) {
    console.error("Ошибка загрузки тренировки:", e);
  }
})();
