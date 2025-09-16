// ====== STATS PAGE ======
(async () => {
  try {
    console.log("🔍 Начинаем загрузку статистики...");
    
    const allKeys = await getAllKeys();
    console.log("📋 Все ключи из getAllKeys():", allKeys);
    
    const workoutKeys = allKeys.filter(k => k.startsWith("workout_"));
    console.log("🏋️ Ключи тренировок (workout_*):", workoutKeys);

    let totalWorkouts = 0;
    let totalVolume = 0;
    let totalReps = 0;
    let totalSets = 0;

    const workoutsList = document.getElementById("workoutsList");

    for (const key of workoutKeys) {
      console.log(`📖 Загружаем тренировку: ${key}`);
      const data = await getData(key, []);
      console.log(`📊 Данные для ${key}:`, data);
      
      if (!data || data.length === 0) {
        console.log(`⚠️ Пустая тренировка: ${key}`);
        continue;
      }

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

      console.log(`✅ ${key}: ${exercises} упр., ${sets} подходов, ${volume} кг`);

      // добавляем в список
      const li = document.createElement("li");
      const date = key.replace("workout_", "");
      li.textContent = `${date}: ${exercises} упр. | ${sets} подходов | ${volume} кг`;
      workoutsList.appendChild(li);
    }

    console.log("📈 Итоговая статистика:", {
      totalWorkouts,
      totalVolume,
      totalReps,
      totalSets
    });

    document.getElementById("totalWorkouts").textContent = totalWorkouts;
    document.getElementById("totalVolume").textContent = totalVolume;
    document.getElementById("totalReps").textContent = totalReps;
    document.getElementById("totalSets").textContent = totalSets;
    document.getElementById("avgVolume").textContent = 
      totalWorkouts > 0 ? Math.round(totalVolume / totalWorkouts) : 0;

  } catch (e) {
    console.error("❌ Ошибка статистики:", e);
  }
})();
