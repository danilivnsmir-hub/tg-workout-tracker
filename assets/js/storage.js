// ====== BASIC STORAGE ======
async function setData(key, value) {
  try {
    const jsonValue = JSON.stringify(value);
    await window.Telegram.WebApp.CloudStorage.setItem(key, jsonValue);
  } catch (e) {
    console.error("Ошибка setData:", e);
    throw e;
  }
}

async function getData(key, defaultValue = null) {
  try {
    const value = await window.Telegram.WebApp.CloudStorage.getItem(key);
    return value ? JSON.parse(value) : defaultValue;
  } catch (e) {
    console.error("Ошибка getData:", e);
    return defaultValue;
  }
}

async function removeData(key) {
  try {
    await window.Telegram.WebApp.CloudStorage.removeItem(key);
  } catch (e) {
    console.error("Ошибка removeData:", e);
  }
}

// ====== TRACKING SUPPORT ======
async function getAllKeys() {
  try {
    if (window.Telegram?.WebApp?.CloudStorage?.getKeys) {
      const keys = await window.Telegram.WebApp.CloudStorage.getKeys();
      if (keys && keys.length > 0) return keys;
    }
    return await getData("_keysList", []);
  } catch (e) {
    return await getData("_keysList", []);
  }
}

async function trackKey(key) {
  let keysList = await getData("_keysList", []);
  if (!Array.isArray(keysList)) keysList = [];
  if (!keysList.includes(key)) {
    keysList.push(key);
    await setData("_keysList", keysList);
  }
}

async function untrackKey(key) {
  let keysList = await getData("_keysList", []);
  if (!Array.isArray(keysList)) keysList = [];
  const updated = keysList.filter(k => k !== key);
  await setData("_keysList", updated);
}

// ====== WRAPPERS FOR TRAININGS ======
async function setDataWithTracking(key, value) {
  await setData(key, value);
  await trackKey(key);
}

async function removeDataWithTracking(key) {
  await removeData(key);
  await untrackKey(key);
}
