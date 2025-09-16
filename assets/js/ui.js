// ui.js
function showToast(msg) {
  if (Telegram?.WebApp?.showToast) {
    Telegram.WebApp.showToast(msg);
  } else {
    alert(msg);
  }
}

function showError(err) {
  console.error(err);
  if (Telegram?.WebApp?.showPopup) {
    Telegram.WebApp.showPopup({
      title: "Ошибка",
      message: "Произошла ошибка, попробуйте ещё раз"
    });
  } else {
    alert("Ошибка: " + err);
  }
}

function vibrate() {
  if (Telegram?.WebApp?.HapticFeedback) {
    Telegram.WebApp.HapticFeedback.impactOccurred("light");
  }
}