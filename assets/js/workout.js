const workoutDiv = document.getElementById("workout");
const addExerciseBtn = document.getElementById("addExercise");
const addSupersetBtn = document.getElementById("addSuperset");
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
  for (let w = 0; w <= 20; w += 0.5) weights.push(w);
  for (let w = 22.5; w <= 300; w += 2.5) weights.push(w);
  return weights;
}
function generateReps() {
  return Array.from({ length: 50 }, (_, i) => i + 1);
}
const weightOptions = generateWeights();
const repsOptions = generateReps();

// ====== AUTOSAVE DRAFT ======
const draftKey = "draftWorkout";

function saveDraft() {
  setData(draftKey, workout).catch(console.error);
}
function triggerSave() {
  saveDraft();
}
window.addEventListener("beforeunload", saveDraft);

// ====== STATS ======
function updateStats() {
  let volume = 0;
  let reps = 0;
  let max = 0;

  workout.forEach(block => {
    if (block.type === "single") {
      block.sets.forEach(s => {
        volume += s.weight * s.reps;
        reps += s.reps;
        if (s.weight > max) max = s.weight;
      });
    } else if (block.type === "superset") {
      block.exercises.forEach(ex => {
        ex.sets.forEach(s => {
          volume += s.weight * s.reps;
          reps += s.reps;
          if (s.weight > max) max = s.weight;
        });
      });
    }
  });

  document.getElementById("statVolume").textContent = volume;
  document.getElementById("statReps").textContent = reps;
  document.getElementById("statMax").textContent = max;
}

// ====== RENDER ======
function renderWorkout() {
  workoutDiv.innerHTML = "";
  workout.forEach((block, blockIdx) => {
    const blockDiv = document.createElement("div");
    blockDiv.className = "card";

    if (block.type === "single") {
      const exerciseOptions = exercisesList.map(name => {
        const selected = block.name === name ? "selected" : "";
        return `<option value="${name}" ${selected}>${name}</option>`;
      }).join("");

      const setsHtml = block.sets.map((s, sIdx) => `
        <div class="set-row">
          Вес: 
          <select onchange="updateSet(${blockIdx}, null, ${sIdx}, 'weight', this.value)">
            ${weightOptions.map(w => `<option value="${w}" ${w===s.weight?"selected":""}>${w}</option>`).join("")}
          </select> кг
          ×
          <select onchange="updateSet(${blockIdx}, null, ${sIdx}, 'reps', this.value)">
            ${repsOptions.map(r => `<option value="${r}" ${r===s.reps?"selected":""}>${r}</option>`).join("")}
          </select>
          <button onclick="removeSet(${blockIdx}, null, ${sIdx})">✖</button>
        </div>
      `).join("");

      blockDiv.innerHTML = `
        <h3>Одиночное упражнение 
          <button onclick="removeBlock(${blockIdx})" class="remove-btn">✖</button>
        </h3>
        <select onchange="updateExerciseName(${blockIdx}, null, this.value)">
          <option value="">-- выбрать упражнение --</option>
          ${exerciseOptions}
        </select>
        <div>${setsHtml}</div>
        <button onclick="addSet(${blockIdx}, null)">+ Подход</button>
      `;

    } else if (block.type === "superset") {
      blockDiv.innerHTML = `<h3>🔥 Суперсет 
        <button onclick="removeBlock(${blockIdx})" class="remove-btn">✖</button>
      </h3>`;
      block.exercises.forEach((ex, exIdx) => {
        const exerciseOptions = exercisesList.map(name => {
          const selected = ex.name === name ? "selected" : "";
          return `<option value="${name}" ${selected}>${name}</option>`;
        }).join("");

        const setsHtml = ex.sets.map((s, sIdx) => `
          <div class="set-row">
            Вес: 
            <select onchange="updateSet(${blockIdx}, ${exIdx}, ${sIdx}, 'weight', this.value)">
              ${weightOptions.map(w => `<option value="${w}" ${w===s.weight?"selected":""}>${w}</option>`).join("")}
            </select> кг
            ×
            <select onchange="updateSet(${blockIdx}, ${exIdx}, ${sIdx}, 'reps', this.value)">
              ${repsOptions.map(r => `<option value="${r}" ${r===s.reps?"selected":""}>${r}</option>`).join("")}
            </select>
            <button onclick="removeSet(${blockIdx}, ${exIdx}, ${sIdx})">✖</button>
          </div>
        `).join("");

        blockDiv.innerHTML += `
          <div class="superset-ex">
            <h4>Упражнение ${exIdx + 1}</h4>
            <select onchange="updateExerciseName(${blockIdx}, ${exIdx}, this.value)">
              <option value="">-- выбрать упражнение --</option>
              ${exerciseOptions}
            </select>
            <div>${setsHtml}</div>
            <button onclick="addSet(${blockIdx}, ${exIdx})">+ Подход</button>
          </div>
        `;
      });
    }
    workoutDiv.appendChild(blockDiv);
  });

  updateStats();
}

// ====== ACTIONS ======
addExerciseBtn.onclick = () => {
  workout.push({ type: "single", name: "", sets: [{ weight: 0, reps: 1 }] });
  renderWorkout();
  vibrate();
  triggerSave();
};

addSupersetBtn.onclick = () => {
  workout.push({
    type: "superset",
    exercises: [
      { name: "", sets: [{ weight: 0, reps: 1 }] },
      { name: "", sets: [{ weight: 0, reps: 1 }] }
    ]
  });
  renderWorkout();
  vibrate();
  triggerSave();
};

function addSet(blockIdx, exIdx) {
  if (workout[blockIdx].type === "single") {
    const last = workout[blockIdx].sets.slice(-1)[0];
    workout[blockIdx].sets.push({ weight: last?.weight || 0, reps: last?.reps || 1 });
  } else {
    const last = workout[blockIdx].exercises[exIdx].sets.slice(-1)[0];
    workout[blockIdx].exercises[exIdx].sets.push({ weight: last?.weight || 0, reps: last?.reps || 1 });
  }
  renderWorkout();
  vibrate();
  triggerSave();
}

function removeSet(blockIdx, exIdx, sIdx) {
  if (workout[blockIdx].type === "single") {
    workout[blockIdx].sets.splice(sIdx, 1);
  } else {
    workout[blockIdx].exercises[exIdx].sets.splice(sIdx, 1);
  }
  renderWorkout();
  vibrate();
  triggerSave();
}

function removeBlock(blockIdx) {
  workout.splice(blockIdx, 1);
  renderWorkout();
  vibrate();
  triggerSave();
}

function updateExerciseName(blockIdx, exIdx, val) {
  const cleanVal = val.replace(/ё/g, "е").replace(/Ё/g, "Е");
  if (workout[blockIdx].type === "single") {
    workout[blockIdx].name = cleanVal;
  } else {
    workout[blockIdx].exercises[exIdx].name = cleanVal;
  }
  triggerSave();
}

function updateSet(blockIdx, exIdx, sIdx, field, val) {
  if (workout[blockIdx].type === "single") {
    workout[blockIdx].sets[sIdx][field] = Number(val);
  } else {
    workout[blockIdx].exercises[exIdx].sets[sIdx][field] = Number(val);
  }
  updateStats();
  triggerSave();
}

// ====== SAVE & CLEAR ======
saveBtn.onclick = async () => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const key = "workout_" + today;

    await setDataWithTracking(key, workout);
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
    await removeDataWithTracking(key);
    await removeData(draftKey);
    showToast("Очищено 🗑");
    vibrate();
  }
};

// ====== RESTORE WORKOUT OR DRAFT ======
(async () => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const workoutKey = "workout_" + today;

    let data = await getData(workoutKey, null);
    if (!data) {
      data = await getData(draftKey, []);
    }

    workout = data || [];
    renderWorkout();
  } catch (e) {
    console.error("Ошибка загрузки тренировки:", e);
  }
})();
