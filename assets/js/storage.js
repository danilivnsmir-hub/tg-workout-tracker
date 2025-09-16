// storage.js
async function setData(key, value) {
  try {
    await Telegram.WebApp.CloudStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.error("Ошибка сохранения", e);
    localStorage.setItem(key, JSON.stringify(value)); // fallback
    return false;
  }
}

async function getData(key, fallback = null) {
  try {
    return new Promise((resolve) => {
      Telegram.WebApp.CloudStorage.getItem(key, (err, data) => {
        if (err || !data) {
          const local = localStorage.getItem(key);
          return resolve(local ? JSON.parse(local) : fallback);
        }
        resolve(JSON.parse(data));
      });
    });
  } catch (e) {
    console.error("Ошибка загрузки", e);
    const local = localStorage.getItem(key);
    return local ? JSON.parse(local) : fallback;
  }
}

async function removeData(key) {
  try {
    await Telegram.WebApp.CloudStorage.removeItem(key);
    localStorage.removeItem(key);
  } catch (e) {
    console.error("Ошибка удаления", e);
  }
}