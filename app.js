const state = {
  passwordUnlocked: false,
  pinBuffer: "",
  activeTab: "id",
  cardFlipped: false,
  sheetOpen: false
};

function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("is-active"));
  document.getElementById(id).classList.add("is-active");
}

function updatePinDots() {
  const dots = document.querySelectorAll("#pwd-dots .pwd-dot");
  dots.forEach((dot, i) => {
    dot.classList.toggle("is-filled", i < state.pinBuffer.length);
  });
}

function handlePinDigit(digit) {
  if (state.pinBuffer.length >= 4) return;
  state.pinBuffer += digit;
  updatePinDots();
  if (state.pinBuffer.length === 4) {
    setTimeout(checkPin, 120);
  }
}

function handlePinBackspace() {
  state.pinBuffer = state.pinBuffer.slice(0, -1);
  updatePinDots();
}

function checkPin() {
  if (state.pinBuffer === "1111") {
    state.passwordUnlocked = true;
    sessionStorage.setItem("unlocked", "1");
    state.pinBuffer = "";
    updatePinDots();
    showScreen("screen-home"); // will exist after Task 5
  } else {
    const dots = document.getElementById("pwd-dots");
    dots.classList.add("is-shaking");
    setTimeout(() => {
      dots.classList.remove("is-shaking");
      state.pinBuffer = "";
      updatePinDots();
    }, 400);
  }
}

function bindPasswordScreen() {
  document.querySelectorAll(".pwd-key[data-digit]").forEach(btn => {
    btn.addEventListener("click", () => handlePinDigit(btn.dataset.digit));
  });
  const back = document.querySelector(".pwd-key[data-action='backspace']");
  if (back) back.addEventListener("click", handlePinBackspace);
}

function startSplashFlow() {
  showScreen("screen-splash");
  setTimeout(() => showScreen("screen-password"), 1000);
}

function init() {
  bindPasswordScreen();
  if (sessionStorage.getItem("unlocked") === "1") {
    state.passwordUnlocked = true;
    showScreen("screen-home"); // exists after Task 5; until then we'll see nothing
  } else {
    startSplashFlow();
  }
}

document.addEventListener("DOMContentLoaded", init);
