// ====== STATS PAGE ======
(async () => {
  try {
    const allKeys = await getAllKeys(); // функция нужна в storage.js
    const workoutKeys = allKeys.filter(k => k.startsWith("workout_"));

    let totalWorkouts = 0;
    let totalVolume = 0;
    let totalReps = 0;
    let totalSets = 0;

    const workoutsList = document.getElementById("workoutsList");

    for (const key of workoutKeys) {
      const data = await getData(key, []);
      if (!data || data.length === 0) continue;

      totalWorkouts++;

      let volume = 0;
      let reps = 0;
      let sets = 0;
      let exercises = 0;

      data.forEach(block => {
        if (block.type === "single") {
          exercises++;
          block.sets.forEach(s => {
            volume += s.weight * s.reps;
            reps += s.reps;
            sets++;
          });
        } else if (block.type === "superset") {
          exercises += block.exercises.length;
          block.exercises.forEach(ex => {
            ex.sets.forEach(s => {
              volume += s.weight * s.reps;
              reps += s.reps;
              sets++;
            });
          });
        }
      });

      totalVolume += volume;
      totalReps += reps;
      totalSets += sets;

      // добавляем в список
      const li = document.createElement("li");
      const date = key.replace("workout_", "");
      li.textContent = `${date}: ${exercises} упр. | ${sets} подходов | ${volume} кг`;
      workoutsList.appendChild(li);
    }

    document.getElementById("totalWorkouts").textContent = totalWorkouts;
    document.getElementById("totalVolume").textContent = totalVolume;
    document.getElementById("totalReps").textContent = totalReps;
    document.getElementById("totalSets").textContent = totalSets;
    document.getElementById("avgVolume").textContent = 
      totalWorkouts > 0 ? Math.round(totalVolume / totalWorkouts) : 0;

  } catch (e) {
    console.error("Ошибка статистики:", e);
  }
})();
