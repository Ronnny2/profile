# Резерв+ PWA Clone — Design Spec

**Date:** 2026-05-26
**Author:** Rostyslav Yuriev
**Status:** Draft for review

## Overview

A pixel-perfect visual clone of the Ukrainian Ministry of Defense "Резерв+" mobile app, built as a Progressive Web App (PWA) and hosted on GitHub Pages. The clone reproduces the splash, password lock, ID card with QR flip, services list, vacancies intro, menu, and the "yellow plus" bottom sheet exactly as they appear on the reference screenshots. No real backend or network calls — fully static.

**Intended use:** personal; user's own data appears on the card (name, photo, date of birth, QR). Repository will be public on GitHub.

## Goals

- Visual fidelity 1:1 with the provided screenshots on an iPhone (Safari, standalone PWA)
- Installable on iOS Home Screen; opens fullscreen without Safari chrome
- Smooth native-feeling animations: card flip, marquee, bottom sheet slide-up, splash fade
- Works offline after first load (service worker cache-first)
- Zero build step — push to GitHub, served as-is by Pages

## Non-Goals

- No real authentication, network requests, or backend integration
- No interactive deep navigation inside Services / Menu items (only visible screens are reachable)
- No multi-user support, no actual document fetch/refresh, no PDF generation
- Not a localization-ready app — Ukrainian only, strings hard-coded
- No automated tests (visual-clone scope, manual verification on device)

## Tech Stack

- **Vanilla HTML / CSS / JavaScript** — no framework, no build, no bundler
- **No dependencies** — all icons inlined as SVG (Lucide / Heroicons style), QR rendered from PNG asset
- **PWA** — `manifest.json` + `sw.js` service worker
- **Hosting** — GitHub Pages, public repository, served from `main` branch root

Rationale: app is small (~6 screens, fixed scope), pixel-perfect requires precise CSS control, and any framework would add overhead with no benefit for static content.

## File Structure

```
/
├── index.html              All screens as <section> elements
├── style.css               All styles, mobile-first, viewport ≤ 430px
├── app.js                  State, navigation, event handlers
├── manifest.json           PWA manifest
├── sw.js                   Service worker, cache-first strategy
├── README.md
└── assets/
    ├── photo.jpg           ID-card photo (cropped from screenshot)
    ├── qr.png              QR code (cropped from screenshot)
    ├── trident.svg         Coat of arms (splash + card header)
    ├── icon-192.png        PWA icon
    ├── icon-512.png        PWA icon
    ├── icon-512-maskable.png
    ├── apple-touch-icon.png  180×180 for iOS Home Screen
    └── favicon.ico
```

## State Model

Single in-memory object in `app.js`:

```js
const state = {
  passwordUnlocked: false,   // user passed the PIN screen
  pinBuffer: "",             // 0–4 typed digits
  activeTab: "id",           // "id" | "services" | "vacancies" | "menu"
  cardFlipped: false,        // false = photo side, true = QR side
  sheetOpen: false           // bottom sheet visible
};
```

**Persistence:** `sessionStorage.setItem('unlocked', '1')` after correct PIN. On page load, if key present, skip splash+password and render Home directly. Cleared on tab close OR on tapping "Вийти" in Menu (`sessionStorage.removeItem('unlocked')` + return to password screen).

## Flow

```
[page load]
   ├─ if sessionStorage.unlocked → render Home directly
   └─ else → splash (1000 ms) → fade to password

[password screen]
   ├─ tap digit → append to pinBuffer, fill next indicator dot
   ├─ tap ⌫    → pop last digit
   └─ on pinBuffer.length === 4:
        ├─ "1111" → set unlocked, fade to Home
        └─ else   → shake indicators 400 ms, clear buffer

[Home, tab = id]
   ├─ tap card body → flip to QR side (cardFlipped = true)
   │                  ("+" button calls e.stopPropagation() so it doesn't trigger flip)
   ├─ tap QR card  → flip back to photo (cardFlipped = false)
   ├─ tap orange + → open bottom sheet
   ├─ tap tab bar  → switch activeTab (id → services|vacancies|menu)
   │                 (leaving id resets cardFlipped = false; returning to id shows photo side fresh)
   └─ tap "Сповіщення" pill → no-op (visual only)

[bottom sheet]
   ├─ tap backdrop          → close
   ├─ drag handle ↓ > 80 px → close (drag-down ONLY on the handle, not the body —
   │                                 keeps item taps unambiguous)
   └─ tap any item          → no-op (visual only)

[Services tab]
   └─ all list items visual only, no navigation

[Vacancies tab]
   ├─ "?" help icon (top-right)      → no-op (visual only)
   ├─ checkbox "Більше не показувати" → no-op
   └─ "Почати" button                 → no-op

[Menu tab]
   ├─ all items visual only EXCEPT
   └─ "Вийти" → clear sessionStorage, reset state, fade to password screen
```

## Visual Spec

### Color palette

| Token | Value | Used for |
|---|---|---|
| `--bg-cream` | `#e3dfc7` | App background on all screens except splash |
| `--bg-dark` | `#1f1c17` | Splash background, "Вийти" button |
| `--cream-on-dark` | `#e3dfc7` | Text/icon on dark background |
| `--card-olive` | `#9b9676` | ID card (photo side) background |
| `--card-white` | `#fafaf6` | ID card (QR side) background, menu group cards |
| `--marquee-brown` | `#6e4a1a` | Horizontal stripe across card |
| `--accent-orange` | `#f59427` | "+" button, "Почати" button |
| `--text-primary` | `#1f1c17` | Main text |
| `--text-secondary` | `#5d574a` | Captions, subtitles, inactive tab labels |
| `--key-white` | `#ffffff` | PIN keypad keys |
| `--divider` | `rgba(0, 0, 0, 0.1)` | List dividers |

Exact values to be tuned pixel-by-pixel against screenshots during implementation.

### Typography

- **Font stack:** `-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif`
- **Weights:** 400 (body), 500 (medium), 600 (headings), 700 (bold, ФИО)
- Screen titles ("Сервіси", "Меню", "Вакансії"): 32 px / 700
- ФИО on card: 22 px / 700, uppercase
- Body text: 16 px / 400
- Captions: 12–13 px / 400 in `--text-secondary`

### Layout & spacing

- Mobile-first; designed for viewport ≤ 430 px (iPhone Pro Max width)
- Content side-padding: 20 px
- Safe-area insets respected (`env(safe-area-inset-top/bottom)`)
- Bottom tab bar fixed; content scroll independent

### Per-screen details

**1. Splash** (`#1f1c17` full-bleed)
- Vertically centered: trident-in-shield SVG (cream), 3 lines "Міністерство / оборони / України"
- Bottom: thin iOS-style home-indicator bar (visual only; iOS draws it in standalone mode)
- Visible exactly 1000 ms then fades out (300 ms)

**2. Password screen** (`--bg-cream`)
- "Код для входу" — 28 px / 600, centered, top ~25 % of viewport
- 4 indicator dots: 12 px diameter, 16 px gap, empty = stroke, filled = solid dark
- Keypad: 3 columns × 4 rows = 12 cells, 75 px circular keys, 32 px digits, key gap 24 px
  - Row 1: `1` `2` `3`
  - Row 2: `4` `5` `6`
  - Row 3: `7` `8` `9`
  - Row 4: ` ` (empty cell) `0` `⌫`
- Bottom: "Не пам'ятаю код для входу" — 14 px / 400, centered, `--text-secondary`

**3. Home — ID card (photo side)** (`--bg-cream`)
- Top right: "Сповіщення 🔔" pill — white bg, dark text, 24 px radius, 12 px / 8 px padding
- Card: 90 % width, centered, 12 px radius, `--card-olive`, ~520 px height
  - Header row: "Резерв ID" (18 px / 700 black, left) + trident SVG 24 px (right)
  - Body: two columns, photo 140 × 140 px (radius 6 px) left, "Дата народження:" caption + "05.06.2001" right
  - Brown stripe: full card width, 30 px tall, ~70 % down the card, marquee text inside.
    Marquee string (literal, looped): `Документ оновлено о 16:38 | 10.12.2025 •  ` (with trailing
    spaces and bullet so adjacent loops are visually separated)
  - Footer: "Військовозобов'язаний" (12 px) + 3-line ФИО (22 px / 700 uppercase)
  - Orange "+" button: 48 px circle, absolute, bottom-right, overlapping card edge by 8 px
- Bottom nav (shared): see below

**4. ID card (QR side)** (`--card-white` card on `--bg-cream`)
- Same footprint as photo card
- Top: "QR-код дійсний до 10 грудня 2026" — 16 px / 500, centered, 24 px top padding
- QR PNG: 80 % card width, square, centered, with 16 px white padding

**5. Bottom sheet (from "+")** (overlay)
- Backdrop: `rgba(0, 0, 0, 0.35)` full-screen
- Sheet: white, 20 px top corners, slides up from bottom, full width
- Drag handle: 36 × 4 px pill, `rgba(0,0,0,0.2)`, 8 px from top, centered
- 3 items in column, each: 24 px outlined icon + 16 px label, 56 px row height, 20 px side padding
  - ⓘ  Переглянути документ
  - 📄 Завантажити PDF
  - 🔄 Оновити документ
- Hairline dividers between items

**6. Services** (`--bg-cream`)
- "Сервіси" — 32 px / 700, top
- 8 list items, 56 px row height: label (16 px black, left) + chevron `>` (right, `--text-secondary`)
- Hairline `--divider` between items

**7. Vacancies** (`--bg-cream`)
- Top right: "?" in 28 px circle (white bg, dark glyph)
- "Вакансії" — 32 px / 700
- Two paragraphs, 15 px / 1.5 line-height, `--text-primary`
- Bottom area:
  - Checkbox "Більше не показувати" (22 × 22 empty square, 2 px stroke, 16 px gap to label)
  - "Почати" pill: full-width minus padding, 56 px height, `--accent-orange`, black text 17 px / 500, 28 px radius

**8. Menu** (`--bg-cream`)
- "Меню" — 32 px / 700; "Версія 2.2.1" — 12 px `--text-secondary` below
- Three white card groups (16 px radius, subtle shadow `0 1 px 2 px rgba(0,0,0,0.04)`):
  - Group 1: Активні сесії, Налаштування (each with icon + chevron)
  - Group 2: Питання та відповіді, Служба підтримки (chevrons), Копіювати номер пристрою (no chevron)
  - Group 3: Сканувати документ
- Dark pill "Вийти": 200 px wide, 48 px tall, `--bg-dark` background, cream text, centered
- Underlined link "Повідомлення про обробку персональних даних" — 13 px `--text-secondary` below

### Bottom nav (shared on tabs)

- Fixed bottom, blends into `--bg-cream`, height 64 px + safe-area-inset-bottom
- 4 items: Резерв ID, Сервіси, Вакансії, Меню
- Each: 22 px outlined SVG icon + 11 px label, centered
- Active item: icon and label in `--text-primary`, inactive in `--text-secondary`
- 150 ms color transition between states

## Animations

**Splash fade:** `setTimeout(1000)` → toggle classes; CSS `opacity 1→0` on splash, `0→1` on password, both 300 ms ease-out.

**Marquee (brown stripe):** Text rendered twice in a row inside `overflow:hidden` container; `@keyframes scroll-text { from translateX(0) to translateX(-50%) }`, 20 s linear infinite.

**Card flip (3D):**
- Parent: `perspective: 1000px`
- Card container: `transform-style: preserve-3d`, transitions `transform 600 ms cubic-bezier(0.4, 0, 0.2, 1)`
- `.front` and `.back`: `position:absolute; backface-visibility:hidden`
- `.back`: rotated 180° on Y
- Toggle `.flipped` class on container → `transform: rotateY(180deg)`

**Bottom sheet slide:**
- Backdrop: `opacity 0→1` over 200 ms
- Panel: `transform: translateY(100%) → 0` over 300 ms, `cubic-bezier(0.32, 0.72, 0, 1)` (iOS-feeling spring)
- Close: tap backdrop, OR drag handle down > 80 px (touch events on handle), OR swipe-down anywhere on sheet body
- Drag tracks `touchmove` deltaY, applies translateY in real time; on release decides open/close based on distance and velocity

**Tab switch:** Instant visibility swap; no slide. Only icon/label color transitions (150 ms).

**Wrong PIN shake:** Indicators dots wrap in container; `@keyframes shake` translates `-2px / +4px / -4px / +4px / -2px / 0` over 400 ms; buffer cleared after animation.

## PWA Setup

### `manifest.json`

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

All paths relative (`./`) so PWA works correctly under GitHub Pages subdirectory (`/rezerv-plus/`).

### `<head>` iOS-specific

```html
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Резерв+">
<link rel="manifest" href="manifest.json">
<link rel="apple-touch-icon" href="assets/apple-touch-icon.png">
<link rel="icon" href="assets/favicon.ico">
<meta name="theme-color" content="#1f1c17">
```

`viewport-fit=cover` + `env(safe-area-inset-*)` in CSS so the splash, bottom nav, and bottom sheet respect the iPhone notch and home-indicator area.

### Service worker (`sw.js`)

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

Cache-first strategy: app is fully static, content never changes. To ship updates, bump `CACHE` to `v2`, `v3`, etc., — old cache is cleared in `activate`.

**SW registration** in `app.js`:

```js
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js', { scope: './' });
  });
}
```

**GitHub Pages subpath notes:** all paths in `index.html`, `manifest.json`, and the SW `ASSETS` array MUST be relative (`./` prefix or bare). When served from `https://<user>.github.io/rezerv-plus/`, the browser resolves bare paths like `'index.html'` relative to the SW location (also at `/rezerv-plus/`), so caching works correctly. Do not use absolute paths starting with `/` — they would point to the GitHub Pages root, not the project subpath, and break.

### Icons

- `trident.svg` — coat of arms used in splash and card header; hand-crafted SVG (~32 lines)
- `icon-192.png`, `icon-512.png`, `icon-512-maskable.png`, `apple-touch-icon.png`, `favicon.ico` — trident on `#1f1c17` background, rendered from the SVG using `sips` (macOS built-in) or a tiny Canvas API script

## Hosting & Deploy

1. `git init` in `/Users/Rostyslav_Yuriev/rezerv`
2. Create public GitHub repo `rezerv-plus`
3. `git remote add origin git@github.com:<user>/rezerv-plus.git && git push -u origin main`
4. GitHub repo → Settings → Pages → Source = `main` branch, root folder = `/`
5. Live URL: `https://<user>.github.io/rezerv-plus/`

To install on iPhone: open URL in Safari → Share → "На екран Домой" → app appears as installed icon, opens fullscreen.

## Risks & Open Questions

- **Personal data in public repo:** photo, name, date of birth, QR code from a real Ukrainian state document will be checked into a public repo. Acknowledged by user; out of scope of this design.
- **Visual color exact match:** palette values are eyeballed from screenshots; will be tuned during implementation by comparing screen against rendered output on the same device.
- **QR PNG quality:** cropping QR from a phone screenshot may produce a slightly blurry image. If quality is unacceptable, fallback is to scan original document and embed sharper image — same QR content, better source.
- **iOS PWA splash on install:** iOS does not use `manifest.json` background_color for the installed-app splash; it shows a white screen instead unless we supply per-device `apple-touch-startup-image` `<link>` tags. Out of scope unless user wants the dark splash to also appear when launching the installed app (vs. only the in-app splash on every page load).
- **Service worker subdirectory scope:** SW scope is constrained to `./` (the repo subpath); confirmed acceptable for single-page app.

## Out of Scope (Explicit)

- Real authentication, biometrics, Face ID / Touch ID
- Real document refresh, PDF generation, server sync
- Notifications (the bell pill is decorative)
- Any interactive sub-screens for Services / Vacancies / Menu items
- Landscape orientation, tablet layout, desktop layout
- Localization (Russian / English versions)
- Analytics, telemetry
