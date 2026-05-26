const state = {
  passwordUnlocked: false,
  pinBuffer: "",
  activeTab: "id",
  cardFlipped: false,
  sheetOpen: false
};

function init() {
  document.getElementById("screen-password").classList.add("is-active");
}

document.addEventListener("DOMContentLoaded", init);
