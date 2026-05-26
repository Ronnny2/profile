if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js', { scope: './' });
  });
}

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

function switchTab(tabId) {
  state.activeTab = tabId;
  // Leaving id tab resets card flip
  if (tabId !== "id") {
    state.cardFlipped = false;
    const card = document.getElementById("id-card");
    if (card) card.classList.remove("is-flipped");
  }
  document.querySelectorAll(".tab-content").forEach(t => {
    t.classList.toggle("is-active", t.dataset.tab === tabId);
  });
  document.querySelectorAll(".nav-item").forEach(n => {
    n.classList.toggle("is-active", n.dataset.tab === tabId);
  });
}

function bindHomeScreen() {
  document.querySelectorAll(".nav-item").forEach(btn => {
    btn.addEventListener("click", () => switchTab(btn.dataset.tab));
  });

  const card = document.getElementById("id-card");
  if (card) {
    card.addEventListener("click", () => {
      state.cardFlipped = !state.cardFlipped;
      card.classList.toggle("is-flipped", state.cardFlipped);
    });
  }

  const plus = document.getElementById("card-plus");
  if (plus) {
    plus.addEventListener("click", (e) => {
      e.stopPropagation();
      openSheet();
    });
  }

  const logout = document.getElementById("logout-button");
  if (logout) {
    logout.addEventListener("click", () => {
      sessionStorage.removeItem("unlocked");
      state.passwordUnlocked = false;
      state.pinBuffer = "";
      state.cardFlipped = false;
      state.activeTab = "id";
      const card = document.getElementById("id-card");
      if (card) card.classList.remove("is-flipped");
      updatePinDots();
      switchTab("id");
      showScreen("screen-password");
    });
  }

  switchTab("id");
}

let sheetHideTimer = null;

function openSheet() {
  state.sheetOpen = true;
  const sheet = document.getElementById("sheet");
  const backdrop = document.getElementById("sheet-backdrop");
  // Cancel a pending hide from a previous close — prevents the race
  // where rapid close→open hides the now-open sheet 300 ms later.
  if (sheetHideTimer) { clearTimeout(sheetHideTimer); sheetHideTimer = null; }
  sheet.hidden = false;
  backdrop.hidden = false;
  // Force reflow so the transition fires
  void sheet.offsetWidth;
  sheet.classList.add("is-open");
  backdrop.classList.add("is-open");
}

function closeSheet() {
  state.sheetOpen = false;
  const sheet = document.getElementById("sheet");
  const backdrop = document.getElementById("sheet-backdrop");
  sheet.classList.remove("is-open");
  backdrop.classList.remove("is-open");
  if (sheetHideTimer) clearTimeout(sheetHideTimer);
  sheetHideTimer = setTimeout(() => {
    // Guard against re-opening during the transition: only hide if still closed.
    if (!state.sheetOpen) {
      sheet.hidden = true;
      backdrop.hidden = true;
      sheet.style.transform = "";
    }
    sheetHideTimer = null;
  }, 300);
}

function bindSheet() {
  document.getElementById("sheet-backdrop").addEventListener("click", closeSheet);

  const handle = document.getElementById("sheet-handle");
  const sheet = document.getElementById("sheet");
  let startY = null;
  let currentDelta = 0;

  handle.addEventListener("touchstart", (e) => {
    startY = e.touches[0].clientY;
    sheet.style.transition = "none";
  }, { passive: true });

  handle.addEventListener("touchmove", (e) => {
    if (startY === null) return;
    currentDelta = Math.max(0, e.touches[0].clientY - startY);
    sheet.style.transform = `translateY(${currentDelta}px)`;
  }, { passive: true });

  handle.addEventListener("touchend", () => {
    sheet.style.transition = "";
    if (currentDelta > 80) {
      closeSheet();
    } else {
      sheet.style.transform = "";
    }
    startY = null;
    currentDelta = 0;
  });
}

function startSplashFlow() {
  showScreen("screen-splash");
  setTimeout(() => showScreen("screen-password"), 1000);
}

function init() {
  bindPasswordScreen();
  bindHomeScreen();
  bindSheet();
  if (sessionStorage.getItem("unlocked") === "1") {
    state.passwordUnlocked = true;
    showScreen("screen-home");
  } else {
    startSplashFlow();
  }
}

document.addEventListener("DOMContentLoaded", init);
