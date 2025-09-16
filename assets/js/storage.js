// storage.js - работа с Telegram CloudStorage

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
    const result = await window.Telegram.WebApp.CloudStorage.getKeys();
    return result || [];
  } catch (error) {
    console.error("Ошибка получения ключей:", error);
    // Fallback: если getKeys() не поддерживается, используем список ключей
    return await getData("_keysList", []);
  }
}

// ====== KEY TRACKING (fallback) ======
async function trackKey(key) {
  try {
    const keysList = await getData("_keysList", []);
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
    const keysList = await getData("_keysList", []);
    const filtered = keysList.filter(k => k !== key);
    await setData("_keysList", filtered);
  } catch (error) {
    console.error("Ошибка удаления ключа из списка:", error);
  }
}

// ====== ENHANCED STORAGE WITH KEY TRACKING ======
async function setDataWithTracking(key, value) {
  await setData(key, value);
  await trackKey(key);
}

async function removeDataWithTracking(key) {
  await removeData(key);
  await untrackKey(key);
}
