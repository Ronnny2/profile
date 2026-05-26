const state = {
  passwordUnlocked: false,
  pinBuffer: "",
  activeTab: "id",
  cardFlipped: false,
  sheetOpen: false
};

function init() {
  console.log("Резерв+ initialized");
}

document.addEventListener("DOMContentLoaded", init);
