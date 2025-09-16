// workout.js
const workoutDiv = document.getElementById("workout");
const addExerciseBtn = document.getElementById("addExercise");
const saveBtn = document.getElementById("saveWorkout");
const clearBtn = document.getElementById("clearWorkout");

let workout = [];

// ====== RENDER ======
function renderWorkout() {
  workoutDiv.innerHTML = "";
  workout.forEach((ex, exIdx) => {
    const exDiv = document.createElement("div");
    exDiv.className = "card";
    exDiv.innerHTML = `
      <h3>${ex.name || "Без названия"}</h3>
      <input type="text" placeholder="Название упражнения" value="${ex.name || ""}" 
             oninput="updateExerciseName(${exIdx}, this.value)">
      <div>
        ${ex.sets.map(
          (s, sIdx) => `
          <div class="set-row">
            Вес: <input type="number" min="0" max="300" step="2.5" value="${s.weight}" 
                        onchange="updateSet(${exIdx}, ${sIdx}, 'weight', this.value)"> кг
            ×
            Повторы: <input type="number" min="1" max="50" value="${s.reps}" 
                        onchange="updateSet(${exIdx}, ${sIdx}, 'reps', this.value)">
            <button onclick="removeSet(${exIdx}, ${sIdx})">✖</button>
          </div>
        `
        ).join("")}
      </div>
      <button onclick="addSet(${exIdx})">+ Подход</button>
    `;
    workoutDiv.appendChild(exDiv);
  });
}

// ====== ACTIONS ======
addExerciseBtn.onclick = () => {
  workout.push({ name: "", sets: [{ weight: 0, reps: 0 }] });
  renderWorkout();
};

function addSet(exIdx) {
  const last = workout[exIdx].sets[workout[exIdx].sets.length - 1];
  workout[exIdx].sets.push({
    weight: last?.weight || 0,
    reps: last?.reps || 0,
  });
  renderWorkout();
}

function removeSet(exIdx, sIdx) {
  workout[exIdx].sets.splice(sIdx, 1);
  renderWorkout();
}

function updateExerciseName(exIdx, val) {
  workout[exIdx].name = val;
}

function updateSet(exIdx, sIdx, field, val) {
  workout[exIdx].sets[sIdx][field] = Number(val);
}

// ====== SAVE & CLEAR ======
saveBtn.onclick = async () => {
  const today = new Date().toISOString().split("T")[0];
  const key = "workout_" + today;

  await setData(key, workout);
  showToast("Тренировка сохранена ✅");
};

clearBtn.onclick = async () => {
  if (confirm("Очистить тренировку?")) {
    workout = [];
    renderWorkout();

    const today = new Date().toISOString().split("T")[0];
    const key = "workout_" + today;
    await removeData(key);
    showToast("Очищено 🗑");
  }
};

// ====== RESTORE DRAFT ======
(async () => {
  const today = new Date().toISOString().split("T")[0];
  const key = "workout_" + today;

  const data = await getData(key, []);
  workout = data;
  renderWorkout();
})();
