# A Little Question 💌 — Romantic Date Invitation

A complete, dependency-free interactive website: asks someone on a date, lets them
pick food, choose a date & time, and ends with a personalized romantic surprise
with floating hearts.

## Files
- `index.html` — structure & the four screens
- `style.css`  — romantic pastel design, animations, responsive layout
- `script.js`  — all interactions (playful "No" button, selections, validation, hearts)

## Run it locally
No server, database, account or API key needed.

1. Download/unzip this folder.
2. Double-click `index.html` (or right-click → Open with → your browser).
   Alternatively: `python3 -m http.server 8000` in this folder, then visit
   `http://localhost:8000`.
3. Works on desktop, tablet and mobile. Web fonts load from Google Fonts when
   online; offline the site falls back to elegant system fonts automatically.

## The flow
1. **Invitation** — "Hey, you! 💗" with a Yes button and a shy "No" button that
   runs from the cursor/finger while Yes grows. Keyboard users can focus "No"
   safely; activation teases and hands focus to "Yes".
2. **Food** — Pizza 🍕 or Shawarma 🌯 cards with hover + selected states;
   Continue stays disabled until a choice is made.
3. **Date & time** — real `<input type="date">` (past dates blocked, min set to
   the visitor's local today) and `<input type="time">`, with friendly validation.
4. **Surprise** — "It's a Date! 💖✨" with the actual chosen food/date/time,
   a romantic message, glowing hearts and a self-cleaning heart burst.
   "Start Over ↻" resets everything.

Accessibility: semantic buttons, labelled inputs, focus-visible outlines,
`aria-live` status messages, and a full `prefers-reduced-motion` fallback.
