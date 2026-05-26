const state = {
  passwordUnlocked: false,
  pinBuffer: "",
  activeTab: "id",
  cardFlipped: false,
  sheetOpen: false
};

function init() {
  document.getElementById("screen-splash").classList.add("is-active");
}

document.addEventListener("DOMContentLoaded", init);
