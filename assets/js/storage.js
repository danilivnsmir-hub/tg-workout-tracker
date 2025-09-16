// ====== BASIC STORAGE FUNCTIONS ======
async function setData(key, value) {
  try {
    const jsonValue = JSON.stringify(value);
    await window.Telegram.WebApp.CloudStorage.setItem(key, jsonValue);
  } catch (error) {
    console.error("Ошибка сохранения:", error);
    throw error;
  }
}

async function getData(key, defaultValue = null) {
  try {
    const result = await window.Telegram.WebApp.CloudStorage.getItem(key);
    return result ? JSON.parse(result) : defaultValue;
  } catch (error) {
    console.error("Ошибка загрузки:", error);
    return defaultValue;
  }
}

async function removeData(key) {
  try {
    await window.Telegram.WebApp.CloudStorage.removeItem(key);
  } catch (error) {
    console.error("Ошибка удаления:", error);
    throw error;
  }
}

// ====== GET ALL KEYS ======
async function getAllKeys() {
  try {
    if (window.Telegram?.WebApp?.CloudStorage?.getKeys) {
      const keys = await window.Telegram.WebApp.CloudStorage.getKeys();
      if (keys && keys.length > 0) return keys;
    }
    // fallback: список ключей
    return await getData("_keysList", []);
  } catch (error) {
    console.error("Ошибка получения ключей:", error);
    return await getData("_keysList", []);
  }
}

// ====== TRACKING (для статистики) ======
async function trackKey(key) {
  try {
    let keysList = await getData("_keysList", []);
    if (!Array.isArray(keysList)) keysList = [];
    if (!keysList.includes(key)) {
      keysList.push(key);
      await setData("_keysList", keysList);
    }
  } catch (error) {
    console.error("Ошибка отслеживания ключа:", error);
  }
}

async function untrackKey(key) {
  try {
    let keysList = await getData("_keysList", []);
    if (!Array.isArray(keysList)) keysList = [];
    const filtered = keysList.filter(k => k !== key);
    await setData("_keysList", filtered);
  } catch (error) {
    console.error("Ошибка удаления ключа из списка:", error);
  }
}

// ====== HELPERS (для тренировок) ======
async function setDataWithTracking(key, value) {
  await setData(key, value);
  await trackKey(key);
}

async function removeDataWithTracking(key) {
  await removeData(key);
  await untrackKey(key);
}
