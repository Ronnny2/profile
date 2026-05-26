# Резерв+ PWA Clone Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a pixel-perfect visual clone of the Ukrainian Ministry of Defense "Резерв+" mobile app as an installable PWA, hosted on GitHub Pages.

**Architecture:** Single-page vanilla web app. `index.html` contains every screen as a `<section>`; `app.js` holds state and toggles section visibility via CSS classes; `style.css` holds all styles. `manifest.json` + `sw.js` make it installable and offline-capable. Deployed by `git push` to GitHub Pages, served from repo root.

**Tech Stack:** HTML, CSS, vanilla JavaScript. No frameworks, no build step, no dependencies. PWA via Web Manifest + Service Worker APIs. Hosting via GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-05-26-rezerv-plus-pwa-clone-design.md`

---

## Note on Verification (No TDD)

This is a visual clone — there is no unit-testable logic to TDD ("does the splash screen look right" is not a unit test). Verification is done by:

1. Running a local static server: `python3 -m http.server 8000` from project root
2. Opening Chrome → DevTools → toggle device toolbar → set viewport to iPhone 14 Pro (393×852) or similar
3. Comparing rendered output side-by-side with the reference screenshot
4. After all screens work in Chrome, final verification on real iPhone Safari

Each task ends with **manual verification + commit**. If the rendered output noticeably differs from the screenshot, fix before committing.

**Reference screenshots** live at: `/Users/Rostyslav_Yuriev/Downloads/Telegram Desktop/photo_2026-05-26_17-04-*.jpg`

| Image # | Screen | Filename suffix |
|---|---|---|
| 1 | Password keypad | `17-04-37` |
| 2 | Splash (Міністерство оборони) | `17-04-32` |
| 3 | Home / ID card (photo side) | `17-04-39` |
| 4 | Card mid-flip | `17-04-52` |
| 5 | Card QR side | `17-04-41` |
| 6 | Bottom sheet from "+" | `17-04-50` |
| 7 | Vacancies tab | `17-04-44` |
| 8 | Services tab | `17-04-46` |
| 9 | Menu tab | `17-04-48` |

---

## Task 0: Asset preparation

Cut the photo and the QR code out of the reference screenshots, hand-craft the trident SVG, and stage everything in `assets/`. Done once up front so later tasks can reference real files.

**Files:**
- Create: `assets/photo.jpg`
- Create: `assets/qr.png`
- Create: `assets/trident.svg`

- [ ] **Step 1: Make assets directory**

```bash
mkdir -p assets
```

- [ ] **Step 2: Crop ID photo from Image 3 (Home screen)**

Source: `/Users/Rostyslav_Yuriev/Downloads/Telegram Desktop/photo_2026-05-26_17-04-39.jpg`

The face photo on the ID card. Use macOS Preview: open the screenshot, Tools → Rectangular Selection, drag around just the photo (rectangular, no rounded corners), Tools → Crop, File → Export As → `assets/photo.jpg`, JPEG quality 90.

Target: roughly 320×400 pixels, JPEG, no rounded corners (CSS will round them).

- [ ] **Step 3: Crop QR code from Image 5**

Source: `/Users/Rostyslav_Yuriev/Downloads/Telegram Desktop/photo_2026-05-26_17-04-41.jpg`

Open in Preview, crop tightly to just the black-and-white QR matrix (do NOT include the "QR-код дійсний до..." text — that will be rendered as live text). Export as PNG (PNG keeps the sharp edges scannable). Save as `assets/qr.png`.

Target: roughly 600×600 pixels, PNG.

- [ ] **Step 4: Download the official trident SVG from Wikimedia Commons**

Don't hand-roll the trident — the real coat of arms has a distinctive shape that's hard to approximate. Download the canonical SVG and re-color it to cream.

```bash
curl -L 'https://upload.wikimedia.org/wikipedia/commons/8/8c/Lesser_Coat_of_Arms_of_Ukraine.svg' -o assets/trident-original.svg
```

The downloaded SVG is gold-on-blue with a shield outline. Two options:

**Option A (simpler, looks closer to screenshot):** Open the SVG in a text editor, find all `fill="#..."` attributes and stroke colors. Replace the gold (`#FFD500` or similar) with `#e3dfc7`. Replace any blue background with `none` or remove the background rect entirely. Save as `assets/trident.svg`.

**Option B (cleaner):** Create `assets/trident.svg` with a `<g>` wrapper that forces all children to inherit `fill="#e3dfc7"`:

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000" style="color:#e3dfc7">
  <g fill="currentColor" stroke="currentColor">
    <!-- paste the trident path elements from trident-original.svg here, stripped of their fill attributes -->
  </g>
</svg>
```

Either path works — A is faster. Once `assets/trident.svg` exists, delete the temp:

```bash
rm assets/trident-original.svg
```

- [ ] **Step 5: Verify assets exist and are reasonable**

```bash
ls -la assets/
file assets/photo.jpg assets/qr.png assets/trident.svg
```

Expected: three files, photo is JPEG, qr is PNG, trident is XML.

Open `assets/photo.jpg`, `assets/qr.png`, and `assets/trident.svg` in Preview to eyeball them.

- [ ] **Step 6: Initial commit**

Git was already initialized when the spec was committed.

```bash
git add assets/
git commit -m "Add ID card photo, QR PNG, and trident SVG assets"
```

---

## Task 1: Project skeleton

Bootstrap `index.html`, `style.css`, and `app.js` with empty placeholders, design tokens, and a dev-server smoke test. Goal: open `localhost:8000` and see a blank but valid page with correct viewport, font, and background color.

**Files:**
- Create: `index.html`
- Create: `style.css`
- Create: `app.js`

- [ ] **Step 1: Write `index.html` skeleton**

```html
<!doctype html>
<html lang="uk">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="Резерв+">
  <meta name="theme-color" content="#1f1c17">
  <title>Резерв+</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div id="app">
    <!-- screens will be added here -->
  </div>
  <script src="app.js" defer></script>
</body>
</html>
```

- [ ] **Step 2: Write `style.css` with design tokens**

```css
:root {
  --bg-cream: #e3dfc7;
  --bg-dark: #1f1c17;
  --cream-on-dark: #e3dfc7;
  --card-olive: #9b9676;
  --card-white: #fafaf6;
  --marquee-brown: #6e4a1a;
  --accent-orange: #f59427;
  --text-primary: #1f1c17;
  --text-secondary: #5d574a;
  --key-white: #ffffff;
  --divider: rgba(0, 0, 0, 0.1);

  --safe-top: env(safe-area-inset-top);
  --safe-bottom: env(safe-area-inset-bottom);
}

* { box-sizing: border-box; margin: 0; padding: 0; }

html, body {
  height: 100%;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif;
  background: var(--bg-cream);
  color: var(--text-primary);
  -webkit-font-smoothing: antialiased;
  overscroll-behavior: none;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

#app {
  min-height: 100%;
  position: relative;
  overflow: hidden;
}
```

- [ ] **Step 3: Write `app.js` with state object placeholder**

```js
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
```

- [ ] **Step 4: Start dev server and verify**

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000` in Chrome. DevTools → Console — should see "Резерв+ initialized". Page should be blank with the cream `#e3dfc7` background. Toggle device toolbar (Cmd+Shift+M), pick iPhone 14 Pro — viewport should fit.

Stop server with Ctrl+C when done.

- [ ] **Step 5: Commit**

```bash
git add index.html style.css app.js
git commit -m "Bootstrap project skeleton with design tokens and state placeholder"
```

---

## Task 2: Splash screen

Render the splash: dark background, centered trident SVG with three lines of text below. Initially this is just the static visual — the 1-second timeout and fade happen in Task 4.

**Files:**
- Modify: `index.html` (add splash section)
- Modify: `style.css` (add splash styles)

- [ ] **Step 1: Add splash section to `index.html`**

Inside `<div id="app">`, add:

```html
<section class="screen screen--splash" id="screen-splash">
  <div class="splash-inner">
    <img src="assets/trident.svg" alt="" class="splash-logo">
    <p class="splash-title">Міністерство<br>оборони<br>України</p>
  </div>
</section>
```

- [ ] **Step 2: Add splash styles to `style.css`**

Append:

```css
.screen {
  position: absolute;
  inset: 0;
  display: none;
  flex-direction: column;
}
.screen.is-active { display: flex; }

.screen--splash {
  background: var(--bg-dark);
  align-items: center;
  justify-content: center;
}

.splash-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  margin-top: 20px;
}

.splash-logo {
  width: 56px;
  height: 70px;
}

.splash-title {
  color: var(--cream-on-dark);
  font-size: 28px;
  font-weight: 700;
  line-height: 1.15;
  text-align: center;
}
```

- [ ] **Step 3: Activate splash for testing**

In `app.js`, change `init()`:

```js
function init() {
  document.getElementById("screen-splash").classList.add("is-active");
}
```

- [ ] **Step 4: Verify against Image 2**

```bash
python3 -m http.server 8000
```

Open in mobile-emulated Chrome (iPhone 14 Pro). Compare with `photo_2026-05-26_17-04-32.jpg`. The trident in the shield should be centered slightly above middle, three lines of text below, dark brown background, light cream text. If trident shape looks too rough, refine the SVG path data now.

- [ ] **Step 5: Commit**

```bash
git add index.html style.css app.js
git commit -m "Add splash screen with trident logo and ministry title"
```

---

## Task 3: Password screen (static layout)

Render the PIN entry screen: title, 4 dots, 12-key keypad (with empty cell in bottom-left), forgot-code link. Wiring up actual PIN logic comes in the next task.

**Files:**
- Modify: `index.html` (add password section)
- Modify: `style.css` (add password styles)

- [ ] **Step 1: Add password section to `index.html`**

After the splash section, add:

```html
<section class="screen screen--password" id="screen-password">
  <h1 class="pwd-title">Код для входу</h1>
  <div class="pwd-dots" id="pwd-dots">
    <span class="pwd-dot"></span>
    <span class="pwd-dot"></span>
    <span class="pwd-dot"></span>
    <span class="pwd-dot"></span>
  </div>
  <div class="pwd-keypad">
    <button class="pwd-key" data-digit="1">1</button>
    <button class="pwd-key" data-digit="2">2</button>
    <button class="pwd-key" data-digit="3">3</button>
    <button class="pwd-key" data-digit="4">4</button>
    <button class="pwd-key" data-digit="5">5</button>
    <button class="pwd-key" data-digit="6">6</button>
    <button class="pwd-key" data-digit="7">7</button>
    <button class="pwd-key" data-digit="8">8</button>
    <button class="pwd-key" data-digit="9">9</button>
    <span class="pwd-key pwd-key--empty"></span>
    <button class="pwd-key" data-digit="0">0</button>
    <button class="pwd-key pwd-key--backspace" data-action="backspace" aria-label="Видалити">
      <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 5H8L3 12L8 19H21A2 2 0 0 0 23 17V7A2 2 0 0 0 21 5Z"/>
        <line x1="18" y1="9" x2="12" y2="15"/>
        <line x1="12" y1="9" x2="18" y2="15"/>
      </svg>
    </button>
  </div>
  <p class="pwd-forgot">Не пам'ятаю код для входу</p>
</section>
```

- [ ] **Step 2: Add password styles**

```css
.screen--password {
  background: var(--bg-cream);
  align-items: center;
  padding: calc(80px + var(--safe-top)) 20px calc(40px + var(--safe-bottom));
}

.pwd-title {
  font-size: 28px;
  font-weight: 600;
  margin-bottom: 32px;
}

.pwd-dots {
  display: flex;
  gap: 16px;
  margin-bottom: 56px;
}

.pwd-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 1.5px solid var(--text-primary);
  background: transparent;
  transition: background 120ms ease;
}

.pwd-dot.is-filled {
  background: var(--text-primary);
}

.pwd-keypad {
  display: grid;
  grid-template-columns: repeat(3, 75px);
  gap: 24px;
  margin-bottom: auto;
}

.pwd-key {
  width: 75px;
  height: 75px;
  border-radius: 50%;
  background: var(--key-white);
  border: none;
  font-size: 32px;
  font-weight: 400;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: opacity 80ms ease;
}

.pwd-key:active { opacity: 0.5; }

.pwd-key--empty { background: transparent; cursor: default; }
.pwd-key--backspace { background: transparent; }

.pwd-forgot {
  font-size: 14px;
  color: var(--text-secondary);
  margin-top: 24px;
}

@keyframes pwd-shake {
  10%, 90% { transform: translateX(-2px); }
  20%, 80% { transform: translateX(4px); }
  30%, 50%, 70% { transform: translateX(-6px); }
  40%, 60% { transform: translateX(6px); }
}
.pwd-dots.is-shaking { animation: pwd-shake 400ms; }
```

- [ ] **Step 3: Temporarily activate password screen instead of splash**

In `app.js`:

```js
function init() {
  document.getElementById("screen-password").classList.add("is-active");
}
```

- [ ] **Step 4: Verify against Image 1**

Reload `localhost:8000`. Compare against `photo_2026-05-26_17-04-37.jpg`. Title size, dot indicators, white circular keys with grid spacing, empty bottom-left cell, backspace icon roughly matches. Tap keys does nothing yet — that's expected.

- [ ] **Step 5: Commit**

```bash
git add index.html style.css app.js
git commit -m "Add password screen layout with PIN keypad and forgot-code link"
```

---

## Task 4: Password input logic + splash→password transition

Wire up the keypad: typing digits fills indicator dots, ⌫ removes last, 4 digits = "1111" triggers unlock and fades to home (Home is still empty — that's Task 5). Wrong PIN shakes and clears. Also implement the splash 1-second display + fade.

**Files:**
- Modify: `app.js`

- [ ] **Step 1: Add screen navigation helper to `app.js`**

Replace the body of `app.js` with:

```js
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
```

- [ ] **Step 2: Add fade transition to `style.css`**

Append:

```css
.screen { transition: opacity 300ms ease; opacity: 1; }
.screen:not(.is-active) { opacity: 0; pointer-events: none; }
.screen.is-active { display: flex; opacity: 1; }
```

Note: the original `.screen.is-active { display: flex; }` already exists — replace it with the rules above (i.e., always `display: flex` but hidden via opacity + pointer-events). This makes the fade work because both screens stay in the DOM during transition.

Actually, simpler — replace the old `.screen` block entirely with:

```css
.screen {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  opacity: 0;
  pointer-events: none;
  transition: opacity 300ms ease;
}
.screen.is-active {
  opacity: 1;
  pointer-events: auto;
}
```

- [ ] **Step 3: Verify splash flow + splash still renders correctly**

The `.screen` rewrite changed both display and transition behavior — re-verify the splash from Task 2 hasn't regressed.

Clear session storage first (DevTools → Application → Session Storage → right-click → Clear). Hard-reload (Cmd+Shift+R). Should see:

1. Splash with trident + ministry text for ~1 second (compare to Image 2 — should still look centered and dark, same as Task 2 verification)
2. Fade to password screen (300 ms crossfade)
3. Type `1 1 1 1` — dots fill one by one, then attempts to switch to `screen-home`. Since that screen doesn't exist yet, you'll see nothing (blank cream) — that's fine, will be fixed in Task 5.
4. Reload, type `1 2 3 4` — dots fill, then indicators shake briefly, then clear.
5. DevTools → Application → Session Storage — after correct PIN, key `unlocked = "1"` should exist.

- [ ] **Step 4: Commit**

```bash
git add app.js style.css
git commit -m "Wire PIN input, shake-on-wrong, and splash→password fade transition"
```

---

## Task 5: Home (Резерв ID tab) — card photo side + bottom nav

Build the home screen: the "Сповіщення" pill, the large olive ID card with photo / DOB / brown stripe / ФИО / orange "+", and the 4-tab bottom navigation. Marquee animation is Task 6, card flip is Task 7, "+" sheet is Task 8.

**Files:**
- Modify: `index.html` (add home section)
- Modify: `style.css` (add home + card + bottom-nav styles)

- [ ] **Step 1: Add home section markup**

After the password section:

```html
<section class="screen screen--home" id="screen-home">
  <div class="tab-content" data-tab="id">
    <header class="home-header">
      <button class="pill-button" aria-label="Сповіщення">
        Сповіщення
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8C6 15 3 17 3 17H21S18 15 18 8Z"/>
          <path d="M13.7 21A2 2 0 0 1 10.3 21"/>
        </svg>
      </button>
    </header>

    <div class="card-wrap">
      <div class="card" id="id-card">
        <div class="card-face card-face--front">
          <div class="card-header">
            <span class="card-title">Резерв ID</span>
            <img src="assets/trident.svg" alt="" class="card-trident">
          </div>
          <div class="card-body">
            <img src="assets/photo.jpg" alt="" class="card-photo">
            <div class="card-meta">
              <span class="card-meta-label">Дата народження:</span>
              <span class="card-meta-value">05.06.2001</span>
            </div>
          </div>
          <div class="card-marquee">
            <div class="card-marquee-track">
              <span>Документ оновлено о 16:38 | 10.12.2025 &nbsp;•&nbsp; </span>
              <span>Документ оновлено о 16:38 | 10.12.2025 &nbsp;•&nbsp; </span>
            </div>
          </div>
          <div class="card-footer">
            <span class="card-status">Військовозобов'язаний</span>
            <span class="card-name">ЮР'ЄВ<br>РОСТИСЛАВ<br>РУСЛАНОВИЧ</span>
          </div>
          <button class="card-plus" id="card-plus" aria-label="Дії з документом">+</button>
        </div>
        <!-- card-face--back will be added in Task 7 -->
      </div>
    </div>
  </div>

  <!-- other tab-contents will be added in Tasks 9–11 -->

  <nav class="bottom-nav">
    <button class="nav-item is-active" data-tab="id">
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="6" width="16" height="12" rx="2"/><line x1="4" y1="11" x2="20" y2="11"/></svg>
      <span>Резерв ID</span>
    </button>
    <button class="nav-item" data-tab="services">
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="7" height="7"/><rect x="13" y="4" width="7" height="7"/><rect x="4" y="13" width="7" height="7"/><rect x="13" y="13" width="7" height="7"/></svg>
      <span>Сервіси</span>
    </button>
    <button class="nav-item" data-tab="vacancies">
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M12 3 L20 12 L12 21 L4 12 Z"/></svg>
      <span>Вакансії</span>
    </button>
    <button class="nav-item" data-tab="menu">
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/></svg>
      <span>Меню</span>
    </button>
  </nav>
</section>
```

- [ ] **Step 2: Add home / card / bottom-nav styles**

Append to `style.css`:

```css
.screen--home {
  background: var(--bg-cream);
  padding-top: calc(20px + var(--safe-top));
  /* no bottom padding here — .tab-content handles its own bottom space */
}

.tab-content {
  display: none;
  flex: 1;
  flex-direction: column;
  padding: 0 20px;
  /* Reserve space for bottom-nav so scrolled content doesn't slip under it */
  padding-bottom: calc(80px + var(--safe-bottom) + 16px);
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
.tab-content.is-active { display: flex; }

.home-header {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 32px;
}

.pill-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: white;
  color: var(--text-primary);
  border: none;
  border-radius: 24px;
  padding: 10px 16px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
}

/* Card wrapper provides 3D context (used in Task 7) */
.card-wrap {
  perspective: 1200px;
  display: flex;
  justify-content: center;
}

.card {
  position: relative;
  width: 100%;
  max-width: 360px;
  height: 520px;
  transform-style: preserve-3d;
  transition: transform 600ms cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
}

.card-face {
  position: absolute;
  inset: 0;
  border-radius: 12px;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  overflow: hidden;
  /* iOS Safari: force a compositor layer per face. Without this,
     overflow:hidden + backface-visibility:hidden flickers on flip. */
  -webkit-transform: translateZ(0);
  transform: translateZ(0);
}

.card-face--front {
  background: var(--card-olive);
  display: flex;
  flex-direction: column;
  padding: 20px 0 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 0 20px;
}
.card-title { font-size: 18px; font-weight: 700; color: var(--text-primary); }
.card-trident { width: 22px; height: 28px; }

.card-body {
  display: flex;
  gap: 20px;
  padding: 20px;
  align-items: flex-start;
}
.card-photo {
  width: 140px;
  height: 170px;
  object-fit: cover;
  border-radius: 4px;
  flex-shrink: 0;
}
.card-meta { display: flex; flex-direction: column; gap: 4px; padding-top: 8px; }
.card-meta-label { font-size: 13px; color: var(--text-secondary); }
.card-meta-value { font-size: 18px; color: var(--text-primary); font-weight: 500; }

.card-marquee {
  background: var(--marquee-brown);
  height: 30px;
  margin-top: auto;
  overflow: hidden;
  display: flex;
  align-items: center;
  /* keyframes animation added in Task 6 */
}
.card-marquee-track {
  display: inline-flex;
  white-space: nowrap;
  color: var(--cream-on-dark);
  font-size: 13px;
}

.card-footer {
  display: flex;
  flex-direction: column;
  padding: 16px 20px 20px;
  gap: 6px;
}
.card-status { font-size: 12px; color: var(--text-secondary); }
.card-name { font-size: 22px; font-weight: 700; line-height: 1.15; }

.card-plus {
  position: absolute;
  right: -8px;
  bottom: 32px;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--accent-orange);
  color: var(--text-primary);
  border: none;
  font-size: 28px;
  line-height: 1;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
}

.bottom-nav {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  background: var(--bg-cream);
  border-top: 1px solid var(--divider);
  padding-bottom: var(--safe-bottom);
  height: calc(64px + var(--safe-bottom));
}
.nav-item {
  flex: 1;
  background: none;
  border: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: var(--text-secondary);
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: color 150ms ease;
  padding-top: 8px;
}
.nav-item.is-active { color: var(--text-primary); }
```

- [ ] **Step 3: Wire tab switching in `app.js`**

After the existing `bindPasswordScreen` function, add:

```js
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
  // Ensure the "id" tab-content is active by default
  switchTab("id");
}
```

Update `init()` to call `bindHomeScreen()` after `bindPasswordScreen()`:

```js
function init() {
  bindPasswordScreen();
  bindHomeScreen();
  if (sessionStorage.getItem("unlocked") === "1") {
    state.passwordUnlocked = true;
    showScreen("screen-home");
  } else {
    startSplashFlow();
  }
}
```

- [ ] **Step 4: Verify against Image 3**

Reload. Enter PIN `1111`. Should land on home with: "Сповіщення" pill top-right, large olive card with photo / DOB / brown stripe (text inside, not animating yet) / ФИО / orange "+", and 4-tab nav at bottom with "Резерв ID" active.

Compare layout, spacing, colors against screenshot. Tap nav items — they should highlight but the other tabs are still empty (Tasks 9–11).

- [ ] **Step 5: Commit**

```bash
git add index.html style.css app.js
git commit -m "Add home tab with ID card (photo side) and 4-tab bottom navigation"
```

---

## Task 6: Marquee animation

Make the brown stripe text scroll continuously left.

**Files:**
- Modify: `style.css`

- [ ] **Step 1: Add marquee keyframes**

Append:

```css
@keyframes marquee-scroll {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
}
.card-marquee-track {
  animation: marquee-scroll 20s linear infinite;
  will-change: transform;
}
.card-marquee-track > span { padding-right: 0; }
```

The track contains two identical `<span>` elements (from Task 5), giving total content width of 200%. Animating `translateX(-50%)` shifts the track exactly one copy left, then loops — appears seamless.

- [ ] **Step 2: Verify**

Reload home. Watch the brown stripe — text should scroll smoothly right→left without visible seams. Speed should feel similar to the screenshot (not too fast). If too fast/slow, adjust `20s`.

- [ ] **Step 3: Commit**

```bash
git add style.css
git commit -m "Animate brown stripe marquee with seamless loop"
```

---

## Task 7: Card flip to QR side

Tapping the card flips it 180° to reveal the QR side. Tap QR card flips back. Orange "+" button must NOT trigger flip (uses `stopPropagation`).

**Files:**
- Modify: `index.html` (add card back face)
- Modify: `style.css` (add back-face + flipped state styles)
- Modify: `app.js` (add flip handler)

- [ ] **Step 1: Add the back face inside `#id-card`**

Inside the existing `.card`, after `.card-face--front` (but before the closing `</div>` of `.card`), add:

```html
<div class="card-face card-face--back">
  <p class="qr-validity">QR-код дійсний до 10 грудня 2026</p>
  <img src="assets/qr.png" alt="QR code" class="qr-image">
</div>
```

- [ ] **Step 2: Add back-face and flipped styles**

Append to `style.css`:

```css
.card-face--back {
  background: var(--card-white);
  /* Combine rotation with the iOS layer-forcing translate from .card-face */
  -webkit-transform: rotateY(180deg) translateZ(0);
  transform: rotateY(180deg) translateZ(0);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px 20px;
  gap: 24px;
}
.qr-validity {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-primary);
  text-align: center;
}
.qr-image {
  width: 80%;
  max-width: 280px;
  height: auto;
  display: block;
  /* Keep QR sharp on retina — pixelated edges scan more reliably */
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}

.card.is-flipped {
  transform: rotateY(180deg);
}
```

- [ ] **Step 3: Wire the flip handler**

In `app.js`, add inside `bindHomeScreen`:

```js
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
      // sheet open handled in Task 8
    });
  }

  switchTab("id");
}
```

- [ ] **Step 4: Verify against Images 4 and 5**

Reload, enter PIN, tap card. Should smoothly rotate ~600ms and reveal white card with "QR-код дійсний до 10 грудня 2026" text and the QR PNG. Tap again — flips back. Tap "+" — nothing happens (and card does NOT flip).

Switch to another tab and back to Резерв ID — card should be on the photo side fresh.

- [ ] **Step 5: Commit**

```bash
git add index.html style.css app.js
git commit -m "Add QR back face with 3D flip animation and stopPropagation on plus button"
```

---

## Task 8: Bottom sheet from "+"

Tap "+" opens a slide-up sheet with 3 menu items. Backdrop dims; tap backdrop closes; drag handle down closes.

**Files:**
- Modify: `index.html` (add sheet markup)
- Modify: `style.css` (sheet + backdrop styles + slide animation)
- Modify: `app.js` (open/close + drag handlers)

- [ ] **Step 1: Add sheet markup**

At the end of `<div id="app">` (after the home section, before closing `</div>`), add:

```html
<div class="sheet-backdrop" id="sheet-backdrop" hidden></div>
<div class="sheet" id="sheet" hidden>
  <div class="sheet-handle" id="sheet-handle"></div>
  <ul class="sheet-list">
    <li class="sheet-item">
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="8"/><line x1="11" y1="12" x2="12" y2="12"/><line x1="11" y1="12" x2="12" y2="16"/><line x1="10" y1="16" x2="14" y2="16"/></svg>
      <span>Переглянути документ</span>
    </li>
    <li class="sheet-item">
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H6A2 2 0 0 0 4 5V19A2 2 0 0 0 6 21H18A2 2 0 0 0 20 19V9Z"/><polyline points="14 3 14 9 20 9"/></svg>
      <span>Завантажити PDF</span>
    </li>
    <li class="sheet-item">
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.5 9A9 9 0 0 1 18.4 5.6L23 10M1 14L5.6 18.4A9 9 0 0 0 20.5 15"/></svg>
      <span>Оновити документ</span>
    </li>
  </ul>
</div>
```

- [ ] **Step 2: Add sheet styles**

Append:

```css
.sheet-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  opacity: 0;
  transition: opacity 200ms ease;
  z-index: 10;
}
.sheet-backdrop.is-open { opacity: 1; }
.sheet-backdrop[hidden] { display: none; }

.sheet {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  background: white;
  border-radius: 20px 20px 0 0;
  padding: 8px 0 calc(20px + var(--safe-bottom));
  transform: translateY(100%);
  transition: transform 300ms cubic-bezier(0.32, 0.72, 0, 1);
  z-index: 11;
  /* Prevent iOS pull-to-refresh when interacting with the sheet */
  overscroll-behavior: contain;
}
.sheet.is-open { transform: translateY(0); }
.sheet[hidden] { display: none; }

.sheet-handle {
  width: 36px;
  height: 4px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 2px;
  margin: 0 auto 16px;
  cursor: grab;
}

.sheet-list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.sheet-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 18px 20px;
  font-size: 16px;
  color: var(--text-primary);
  border-bottom: 1px solid var(--divider);
}
.sheet-item:last-child { border-bottom: none; }
.sheet-item svg { color: var(--text-secondary); flex-shrink: 0; }
```

- [ ] **Step 3: Wire open/close + drag in `app.js`**

After `bindHomeScreen`, add:

```js
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
```

Update the `card-plus` click handler inside `bindHomeScreen` to actually open the sheet:

```js
plus.addEventListener("click", (e) => {
  e.stopPropagation();
  openSheet();
});
```

Update `init()` to call `bindSheet()`:

```js
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
```

- [ ] **Step 4: Verify against Image 6**

Reload, enter PIN, tap orange "+". Sheet should slide up from bottom with backdrop dimming behind. Three items visible: Переглянути документ, Завантажити PDF, Оновити документ.

Tap backdrop — sheet slides down, backdrop fades out. Open again, in Chrome's mobile emulation drag the handle down with the mouse cursor — when released past ~80px it should close.

On real iPhone, touch-drag the handle (Task 15 will cover device verification).

- [ ] **Step 5: Commit**

```bash
git add index.html style.css app.js
git commit -m "Add bottom sheet from plus button with backdrop and drag-to-close"
```

---

## Task 9: Сервіси tab

List of 8 items with right-chevron, separated by hairlines.

**Files:**
- Modify: `index.html`
- Modify: `style.css`

- [ ] **Step 1: Add services tab markup**

Inside `#screen-home`, after the existing `.tab-content[data-tab="id"]` block:

```html
<div class="tab-content tab-content--list" data-tab="services">
  <h1 class="tab-title">Сервіси</h1>
  <ul class="link-list">
    <li class="link-list-item">Виправити дані онлайн <span class="chevron">›</span></li>
    <li class="link-list-item">Електронна черга в ТЦК та СП <span class="chevron">›</span></li>
    <li class="link-list-item">Запит на відстрочку <span class="chevron">›</span></li>
    <li class="link-list-item">Направлення на ВЛК <span class="chevron">›</span></li>
    <li class="link-list-item">Розширені дані з реєстру <span class="chevron">›</span></li>
    <li class="link-list-item">Стати на облік <span class="chevron">›</span></li>
    <li class="link-list-item">Уточнити контактні дані <span class="chevron">›</span></li>
    <li class="link-list-item">Штрафи <span class="chevron">›</span></li>
  </ul>
</div>
```

- [ ] **Step 2: Add styles**

```css
.tab-title {
  font-size: 32px;
  font-weight: 700;
  margin: 8px 0 24px;
}

.link-list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.link-list-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 0;
  font-size: 16px;
  color: var(--text-primary);
  border-bottom: 1px solid var(--divider);
}
.chevron {
  font-size: 24px;
  color: var(--text-secondary);
  font-weight: 300;
}
```

- [ ] **Step 3: Verify against Image 8**

Reload, tap "Сервіси" in bottom nav. Should see "Сервіси" heading + the 8 items, each with `›`, separated by thin lines. Title and bottom nav remain.

- [ ] **Step 4: Commit**

```bash
git add index.html style.css
git commit -m "Add Сервіси tab with 8-item link list"
```

---

## Task 10: Вакансії tab

Heading, two paragraphs, checkbox, big orange "Почати" button, "?" help icon top-right.

**Files:**
- Modify: `index.html`
- Modify: `style.css`

- [ ] **Step 1: Add vacancies markup**

After the services tab-content block:

```html
<div class="tab-content tab-content--vacancies" data-tab="vacancies">
  <header class="tab-header-row">
    <h1 class="tab-title">Вакансії</h1>
    <button class="help-button" aria-label="Допомога">?</button>
  </header>
  <p class="paragraph">Тут знаходяться актуальні посади для служби в українському війську, надані у співпраці з платформою Lobby X.</p>
  <p class="paragraph">Це найбільший перелік пропозицій, який допоможе знайти ту, що підходить саме вам. Обирайте варіанти, подавайте заявки у кілька кліків і очікуйте відповіді від бригади.</p>
  <div class="vacancy-actions">
    <label class="checkbox-row">
      <span class="checkbox-box"></span>
      <span>Більше не показувати</span>
    </label>
    <button class="primary-button">Почати</button>
  </div>
</div>
```

- [ ] **Step 2: Add styles**

```css
.tab-header-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}
.tab-header-row .tab-title { margin: 8px 0 16px; }

.help-button {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: white;
  border: 1px solid var(--divider);
  font-size: 16px;
  font-weight: 500;
  color: var(--text-primary);
  cursor: pointer;
  margin-top: 14px;
}

.paragraph {
  font-size: 15px;
  line-height: 1.5;
  color: var(--text-primary);
  margin-bottom: 16px;
}

.vacancy-actions {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding-bottom: 16px;
}

.checkbox-row {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 15px;
}
.checkbox-box {
  width: 22px;
  height: 22px;
  border: 2px solid var(--text-primary);
  border-radius: 4px;
}

.primary-button {
  width: 100%;
  height: 56px;
  background: var(--accent-orange);
  color: var(--text-primary);
  border: none;
  border-radius: 28px;
  font-size: 17px;
  font-weight: 500;
  cursor: pointer;
}
```

- [ ] **Step 3: Verify against Image 7**

Tap "Вакансії" tab. Compare to screenshot: title, "?" top-right, two text paragraphs, checkbox + "Почати" pinned near the bottom above the nav.

- [ ] **Step 4: Commit**

```bash
git add index.html style.css
git commit -m "Add Вакансії tab with intro text, checkbox and Почати button"
```

---

## Task 11: Меню tab + Вийти logic

Three white card groups, "Вийти" pill, footer link. "Вийти" clears sessionStorage and returns to password screen.

**Files:**
- Modify: `index.html`
- Modify: `style.css`
- Modify: `app.js` (logout handler)

- [ ] **Step 1: Add menu markup**

After the vacancies tab-content:

```html
<div class="tab-content tab-content--menu" data-tab="menu">
  <h1 class="tab-title">Меню</h1>
  <p class="tab-subtitle">Версія 2.2.1</p>

  <div class="menu-group">
    <div class="menu-row">
      <svg class="menu-icon" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="3" width="12" height="18" rx="2"/><line x1="11" y1="18" x2="13" y2="18"/></svg>
      <span class="menu-label">Активні сесії</span>
      <span class="chevron">›</span>
    </div>
    <div class="menu-row">
      <svg class="menu-icon" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15A1.65 1.65 0 0 0 19.7 16.8L19.8 16.9A2 2 0 1 1 17 19.7L16.9 19.6A1.65 1.65 0 0 0 15.1 19.3A1.65 1.65 0 0 0 14 20.8V21A2 2 0 1 1 10 21V20.9A1.65 1.65 0 0 0 8.9 19.4A1.65 1.65 0 0 0 7.1 19.7L7 19.8A2 2 0 1 1 4.2 17L4.3 16.9A1.65 1.65 0 0 0 4.6 15.1A1.65 1.65 0 0 0 3.1 14H3A2 2 0 1 1 3 10H3.1A1.65 1.65 0 0 0 4.6 8.9A1.65 1.65 0 0 0 4.3 7.1L4.2 7A2 2 0 1 1 7 4.2L7.1 4.3A1.65 1.65 0 0 0 8.9 4.6A1.65 1.65 0 0 0 10 3.1V3A2 2 0 1 1 14 3V3.1A1.65 1.65 0 0 0 15.1 4.6A1.65 1.65 0 0 0 16.9 4.3L17 4.2A2 2 0 1 1 19.8 7L19.7 7.1A1.65 1.65 0 0 0 19.4 8.9A1.65 1.65 0 0 0 20.9 10H21A2 2 0 1 1 21 14H20.9A1.65 1.65 0 0 0 19.4 15Z"/></svg>
      <span class="menu-label">Налаштування</span>
      <span class="chevron">›</span>
    </div>
  </div>

  <div class="menu-group">
    <div class="menu-row">
      <svg class="menu-icon" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9.5 9.5A2.5 2.5 0 0 1 14 11C14 12.5 12 13 12 14"/><line x1="12" y1="17" x2="12" y2="17"/></svg>
      <span class="menu-label">Питання та відповіді</span>
      <span class="chevron">›</span>
    </div>
    <div class="menu-row">
      <svg class="menu-icon" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8C4 6 5 5 7 5H17C19 5 20 6 20 8V14C20 16 19 17 17 17H13L9 20V17H7C5 17 4 16 4 14Z"/></svg>
      <span class="menu-label">Служба підтримки</span>
      <span class="chevron">›</span>
    </div>
    <div class="menu-row">
      <svg class="menu-icon" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="1"/><path d="M5 15H4A1 1 0 0 1 3 14V4A1 1 0 0 1 4 3H14A1 1 0 0 1 15 4V5"/></svg>
      <span class="menu-label">Копіювати номер пристрою</span>
    </div>
  </div>

  <div class="menu-group">
    <div class="menu-row">
      <svg class="menu-icon" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 8 4 4 8 4"/><polyline points="20 8 20 4 16 4"/><polyline points="4 16 4 20 8 20"/><polyline points="20 16 20 20 16 20"/></svg>
      <span class="menu-label">Сканувати документ</span>
    </div>
  </div>

  <button class="logout-button" id="logout-button">Вийти</button>
  <a class="footer-link" href="#" onclick="return false;">Повідомлення про обробку персональних даних</a>
</div>
```

- [ ] **Step 2: Add styles**

```css
.tab-subtitle {
  font-size: 12px;
  color: var(--text-secondary);
  margin: -16px 0 24px;
}

.menu-group {
  background: white;
  border-radius: 16px;
  padding: 4px 16px;
  margin-bottom: 16px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}
.menu-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 0;
  font-size: 16px;
  color: var(--text-primary);
  border-bottom: 1px solid var(--divider);
}
.menu-row:last-child { border-bottom: none; }
.menu-icon { color: var(--text-primary); flex-shrink: 0; }
.menu-label { flex: 1; }

.logout-button {
  display: block;
  margin: 24px auto 12px;
  padding: 14px 56px;
  background: var(--bg-dark);
  color: var(--cream-on-dark);
  border: none;
  border-radius: 28px;
  font-size: 17px;
  font-weight: 500;
  cursor: pointer;
}

.footer-link {
  display: block;
  text-align: center;
  font-size: 13px;
  color: var(--text-secondary);
  text-decoration: underline;
}
```

- [ ] **Step 3: Wire logout in `app.js`**

In `bindHomeScreen`, append:

```js
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
```

- [ ] **Step 4: Verify against Image 9**

Tap "Меню" tab. Compare to screenshot: title + version, three white card groups (2 + 3 + 1 rows), dark "Вийти" pill, footer link.

Tap "Вийти" — should return to password screen with empty dots. Enter `1111` again to verify session reset.

- [ ] **Step 5: Commit**

```bash
git add index.html style.css app.js
git commit -m "Add Меню tab with three card groups and Вийти logout flow"
```

---

## Task 12: PWA manifest + iOS meta + icons

Add web app manifest, generate icons from trident SVG, hook everything into `<head>`.

**Files:**
- Create: `manifest.json`
- Create: `assets/icon-192.png`, `assets/icon-512.png`, `assets/icon-512-maskable.png`, `assets/apple-touch-icon.png`, `assets/favicon.ico`
- Modify: `index.html` (add manifest link + apple-touch-icon)

- [ ] **Step 1: Write `manifest.json`**

```json
{
  "name": "Резерв+",
  "short_name": "Резерв+",
  "start_url": "./",
  "scope": "./",
  "display": "standalone",
  "background_color": "#1f1c17",
  "theme_color": "#1f1c17",
  "orientation": "portrait",
  "lang": "uk",
  "icons": [
    { "src": "assets/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "assets/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "assets/icon-512-maskable.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

- [ ] **Step 2: Generate icons via a one-off browser helper**

Use a tiny throwaway HTML page that renders the trident onto a dark canvas and offers each size as a download. Deterministic — no manual cropping, no extra tools.

Create `tools/generate-icons.html` (this file is a build helper, not part of the deployed app):

```bash
mkdir -p tools
```

```html
<!doctype html>
<html><head><meta charset="utf-8"><title>Icon generator</title></head>
<body style="font-family:sans-serif;padding:20px">
  <h2>Резерв+ icon generator</h2>
  <p>Click each button to download the icon at the right size.</p>
  <div id="buttons"></div>
  <canvas id="cv" width="1024" height="1024" style="border:1px solid #ccc;max-width:300px;display:block;margin-top:16px"></canvas>
  <script>
    const SIZES = [
      { name: 'icon-192.png',         size: 192, padding: 0.18 },
      { name: 'icon-512.png',         size: 512, padding: 0.18 },
      { name: 'icon-512-maskable.png', size: 512, padding: 0.30 }, // bigger safe area
      { name: 'apple-touch-icon.png', size: 180, padding: 0.16 }
    ];
    const trident = new Image();
    trident.src = '../assets/trident.svg';
    trident.onload = () => {
      // Draw preview at 1024
      drawIcon(document.getElementById('cv'), 1024, 0.18);
      // Build download buttons
      const wrap = document.getElementById('buttons');
      SIZES.forEach(spec => {
        const btn = document.createElement('button');
        btn.textContent = 'Download ' + spec.name;
        btn.style.margin = '4px';
        btn.onclick = () => download(spec);
        wrap.appendChild(btn);
      });
    };
    function drawIcon(canvas, size, padding) {
      canvas.width = canvas.height = size;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#1f1c17';
      ctx.fillRect(0, 0, size, size);
      const inner = size * (1 - padding * 2);
      const offset = size * padding;
      ctx.drawImage(trident, offset, offset, inner, inner);
    }
    function download(spec) {
      const c = document.createElement('canvas');
      drawIcon(c, spec.size, spec.padding);
      const a = document.createElement('a');
      a.download = spec.name;
      a.href = c.toDataURL('image/png');
      a.click();
    }
  </script>
</body></html>
```

Run the dev server, open `http://localhost:8000/tools/generate-icons.html`, click each of the 4 download buttons. Move the 4 PNGs from `~/Downloads/` to `assets/`:

```bash
mv ~/Downloads/icon-192.png ~/Downloads/icon-512.png ~/Downloads/icon-512-maskable.png ~/Downloads/apple-touch-icon.png assets/
```

For the favicon, reuse the 192 as a fallback (modern browsers accept PNG as `.ico`):

```bash
cp assets/icon-192.png assets/favicon.ico
```

Note: `tools/generate-icons.html` is committed too so the icons can be regenerated later if the trident SVG changes.

- [ ] **Step 3: Add manifest & icon links to `index.html` `<head>`**

After the existing meta tags:

```html
<link rel="manifest" href="manifest.json">
<link rel="apple-touch-icon" href="assets/apple-touch-icon.png">
<link rel="icon" href="assets/favicon.ico">
```

- [ ] **Step 4: Verify manifest loads cleanly**

Reload `localhost:8000`. DevTools → Application → Manifest. Should show name "Резерв+", icons (192/512/maskable), display = standalone, no errors.

Chrome should show an install banner on desktop, or "Install Резерв+" in the address bar.

- [ ] **Step 5: Commit**

```bash
git add manifest.json index.html tools/ assets/icon-*.png assets/apple-touch-icon.png assets/favicon.ico
git commit -m "Add PWA manifest, icons, generator helper, and iOS meta tags"
```

---

## Task 13: Service worker for offline support

Cache-first SW so the app works offline after first visit.

**Files:**
- Create: `sw.js`
- Modify: `app.js` (registration)

- [ ] **Step 1: Write `sw.js`**

```js
const CACHE = 'rezerv-plus-v1';
const ASSETS = [
  './',
  'index.html',
  'style.css',
  'app.js',
  'manifest.json',
  'assets/photo.jpg',
  'assets/qr.png',
  'assets/trident.svg',
  'assets/icon-192.png',
  'assets/icon-512.png',
  'assets/apple-touch-icon.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});
```

> ⚠️ **Deploy gotcha:** because this is cache-first, an installed PWA will *never* pick up new code from GitHub Pages until the `CACHE` constant is bumped. **Every deploy must bump `CACHE`** (`'rezerv-plus-v2'`, `'-v3'`, …) — the new SW installs, `activate` clears old caches, clients reload from the new bundle. If you forget, the user keeps seeing the old version forever.

- [ ] **Step 2: Register the SW in `app.js`**

At the top of `app.js`, before the `state` declaration, add:

```js
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js', { scope: './' });
  });
}
```

- [ ] **Step 3: Verify SW registers and caches**

Hard-reload `localhost:8000`. DevTools → Application → Service Workers — `sw.js` should be "activated and is running". → Cache Storage → `rezerv-plus-v1` should contain all listed assets.

Then check offline: in Network tab, throttle to "Offline" and reload. App should still render (all from cache).

- [ ] **Step 4: Commit**

```bash
git add sw.js app.js
git commit -m "Add service worker for offline-first asset caching"
```

---

## Task 14: Deploy to GitHub Pages

Push to public repo, enable Pages, get the live URL.

This task requires GitHub access. The user is expected to perform the GitHub UI step (creating the repo + enabling Pages) — explicit handoff below.

**Files:** None (configuration only)

- [ ] **Step 1: Prompt user to create the public repo on GitHub**

Stop and ask the user:

> "Please create a new **public** GitHub repository named `rezerv-plus` (or whatever name you prefer) at https://github.com/new — do NOT initialize it with README, .gitignore, or license. Then paste back the SSH or HTTPS clone URL."

Wait for response.

- [ ] **Step 2: Add remote and push**

Substitute `<URL>` with what the user provided.

```bash
git branch -M main
git remote add origin <URL>
git push -u origin main
```

If `main` already exists with commits (which it does — we've been committing all along), the push will upload everything.

- [ ] **Step 3: Prompt user to enable GitHub Pages**

> "In the GitHub repo: Settings → Pages → Source = 'Deploy from a branch' → Branch = `main` / `/` (root) → Save. Wait ~1 minute then refresh — the URL `https://<your-user>.github.io/rezerv-plus/` will appear at the top."

Wait for confirmation + URL.

- [ ] **Step 4: Smoke-test the live URL**

Open the live URL in desktop Chrome with mobile emulation. Walk through: splash → password (1111) → home → flip card → "+" sheet → switch tabs → "Вийти". Everything should work identically to local.

DevTools → Application → Service Workers: confirm `sw.js` activated on the live URL too. Check Manifest tab — icons should load.

If any 404s appear in Console, it's almost certainly an absolute path that needs to become relative.

- [ ] **Step 5: Commit (no code change, just a marker)**

No commit needed — deploy is now live.

---

## Task 15: Install and verify on iPhone

Final acceptance: install to Home Screen, open standalone, walk through every screen on the real device.

**Files:** None

- [ ] **Step 1: Open the live URL on iPhone Safari**

Navigate to `https://<your-user>.github.io/rezerv-plus/`.

- [ ] **Step 2: Add to Home Screen**

Tap the Share button (square with up arrow) → "На екран Домой" → confirm. The app icon should appear on the Home Screen.

- [ ] **Step 3: Launch from Home Screen and verify standalone mode**

Tap the new icon. The app should open fullscreen (no Safari address bar, no tab bar). Splash → password → home.

- [ ] **Step 4: Walk through every screen and compare to source screenshots**

For each: splash, password, home (photo side), card flip (mid + QR side), bottom sheet (open + drag-close), Сервіси, Вакансії, Меню (+ Вийти).

Note any visual deviations (color shifts, sizing, font rendering). Small touch-ups can be made and pushed; SW will pick them up on next launch IF the cache version is bumped — for live UI tweaks during this verification, bump `CACHE` in `sw.js` to `v2`, commit, push, wait for Pages rebuild, force-close the PWA, reopen.

- [ ] **Step 5: Test offline**

Turn iPhone to Airplane Mode, relaunch the app from Home Screen. Splash, password, home, all screens should still render fully from SW cache.

- [ ] **Step 6: Final commit (only if any visual touch-ups were needed)**

```bash
git add -A
git commit -m "Final touch-ups after on-device verification"
git push
```

---

## Done

The app is live, installed on the iPhone Home Screen, opens standalone, looks 1:1 with the reference screenshots, and works offline.
