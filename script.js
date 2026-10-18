/* ==========================================================================
   A Little Question 💌 — interaction logic
   Four-screen flow: invitation → food → date & time → final surprise.
   Vanilla JS only. No backend, no libraries.
   ========================================================================== */
'use strict';

/* ---------------------------------------------------------------- helpers */
const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const motionQuery = window.matchMedia
  ? window.matchMedia('(prefers-reduced-motion: reduce)')
  : { matches: false };
const prefersReducedMotion = () => motionQuery.matches;

/* ------------------------------------------------------------------ state */
const state = {
  food:    null,   // 'Pizza' | 'Shawarma'
  dateISO: '',     // 'YYYY-MM-DD'
  time:    '',     // 'HH:MM'
};

/* --------------------------------------------------------------- elements */
const card        = $('#card');
const yesBtn      = $('#yesBtn');
const noBtn       = $('#noBtn');
const tease       = $('#tease');
const playZone    = $('#playZone');
const foodCards   = $$('.food-card');
const foodHint    = $('#foodHint');
const continueBtn = $('#continueBtn');
const whenForm    = $('#whenForm');
const dateInput   = $('#dateInput');
const timeInput   = $('#timeInput');
const whenError   = $('#whenError');
const planFood    = $('#planFood');
const planDate    = $('#planDate');
const planTime    = $('#planTime');
const restartBtn  = $('#restartBtn');
const ambientLayer = $('#ambientHearts');
const burstLayer   = $('#burstHearts');
const screens      = $$('.screen');

/* =============================================================== NAVIGATION */
let currentScreen = 1;
let transitioning = false;

function showScreen(n) {
  screens.forEach((s) => {
    const active = Number(s.dataset.screen) === n;
    s.classList.toggle('active', active);
    s.hidden = !active;
  });
  currentScreen = n;
  const heading = $(`.screen[data-screen="${n}"] h1`);
  if (heading) heading.focus({ preventScroll: true });
  if (n === 3) syncMinDate();
  if (n === 4) { fillPlan(); celebrate(); }
}

function go(n) {
  if (transitioning || n === currentScreen) return;
  transitioning = true;
  const from = $(`.screen[data-screen="${currentScreen}"]`);
  from.classList.add('leaving');
  window.setTimeout(() => {
    from.classList.remove('leaving');
    showScreen(n);
    transitioning = false;
  }, prefersReducedMotion() ? 0 : 220);
}

/* ============================================== SCREEN 1 : PLAYFUL "NO" === */
const TEASES = [
  'Are you sure? 🥺',
  'Give love a chance! 💕',
  'Nice try! 😏',
  'That button is shy! 🙈',
];
const FIRST_TEASE = 'Oops! Too slow! 😜';

let escapes   = 0;
let lastTease = '';
let teaseTimer = null;

function showTease(msg) {
  tease.textContent = msg;
  tease.classList.add('show');
  window.clearTimeout(teaseTimer);
  teaseTimer = window.setTimeout(() => tease.classList.remove('show'), 1600);
}

function nextTease() {
  let msg = lastTease;
  while (msg === lastTease) msg = TEASES[Math.floor(Math.random() * TEASES.length)];
  lastTease = msg;
  return msg;
}

/* Yes grows a little with every escape, capped so it never breaks layout. */
function growYes() {
  const scale = Math.min(1.7, 1 + escapes * 0.09);
  yesBtn.style.setProperty('--yes-scale', scale.toFixed(2));
}

/* Move "No" to a random spot inside the play zone, never on top of "Yes". */
function repositionNo() {
  noBtn.classList.add('free');           // position:absolute inside #playZone
  const zone = playZone.getBoundingClientRect();
  const btn  = noBtn.getBoundingClientRect();
  const yes  = yesBtn.getBoundingClientRect();
  const pad  = 6;
  const maxX = Math.max(0, zone.width  - btn.width  - pad * 2);
  const maxY = Math.max(0, zone.height - btn.height - pad * 2);

  let x = 0, y = 0, placed = false;
  for (let i = 0; i < 24 && !placed; i++) {
    x = pad + Math.random() * maxX;
    y = pad + Math.random() * maxY;
    const left = zone.left + x, top = zone.top + y;
    const overlapsYes =
      left < yes.right + 12 && left + btn.width  > yes.left - 12 &&
      top  < yes.bottom + 12 && top  + btn.height > yes.top  - 12;
    if (!overlapsYes) placed = true;
  }
  if (!placed) { // deterministic fallback: the corner farthest from "Yes"
    const cx = yes.left + yes.width / 2;
    const cy = yes.top + yes.height / 2;
    x = cx < zone.left + zone.width / 2  ? maxX + pad : pad;
    y = cy < zone.top  + zone.height / 2 ? maxY + pad : pad;
  }
  noBtn.style.left = `${Math.round(x)}px`;
  noBtn.style.top  = `${Math.round(y)}px`;
}

function dodgeNo() {
  escapes += 1;
  growYes();
  showTease(escapes === 1 ? FIRST_TEASE : nextTease());
  repositionNo();
}

/* Mouse users: it runs when approached. */
noBtn.addEventListener('pointerenter', (e) => {
  if (e.pointerType === 'mouse' || e.pointerType === undefined) dodgeNo();
});

/* Touch / pen users: it slips away before the tap can land. */
noBtn.addEventListener('pointerdown', (e) => {
  if (e.pointerType !== 'mouse') {
    e.preventDefault();
    dodgeNo();
  }
});

/* Any click that still lands (or keyboard activation) never advances. */
noBtn.addEventListener('click', (e) => {
  e.preventDefault();
  if (e.detail === 0) {
    // Keyboard activation: stay put, tease gently, hand focus to "Yes"
    // so keyboard users always have a clear way forward.
    escapes += 1;
    growYes();
    showTease(escapes === 1 ? FIRST_TEASE : nextTease());
    yesBtn.focus();
  } else {
    dodgeNo();
  }
});

yesBtn.addEventListener('click', () => go(2));

/* ============================================== SCREEN 2 : FOOD SELECTION = */
foodCards.forEach((cardBtn) => {
  cardBtn.addEventListener('click', () => {
    state.food = cardBtn.dataset.food;
    foodCards.forEach((b) => {
      const selected = b === cardBtn;
      b.classList.toggle('selected', selected);
      b.setAttribute('aria-pressed', String(selected));
    });
    continueBtn.disabled = false;
    foodHint.hidden = false;
    foodHint.textContent =
      state.food === 'Pizza' ? 'Yum — a cheesy little date! 🍕'
                             : 'Yay — our delicious adventure! 🌯';
  });
});

continueBtn.addEventListener('click', () => {
  if (state.food) go(3);
});

/* ============================================ SCREEN 3 : DATE & TIME PICK = */
function todayISO() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString().slice(0, 10);
}

function syncMinDate() {
  const min = todayISO();
  dateInput.min = min;
  if (state.dateISO && state.dateISO < min) {
    state.dateISO = '';
    dateInput.value = '';
  }
}

whenForm.addEventListener('submit', (e) => {
  e.preventDefault();
  syncMinDate();
  const date = dateInput.value;
  const time = timeInput.value;

  let message = '';
  if (!date && !time)      message = 'Please pick both a day and a time for our date 💌';
  else if (!date)          message = 'Please pick a day for our date 📅';
  else if (date < dateInput.min) message = 'That day already passed — let’s pick one still coming up 💫';
  else if (!time)          message = 'Almost there — please pick a time too ⏰';

  if (message) {
    whenError.textContent = message;
    whenError.hidden = false;
    (!date ? dateInput : timeInput).focus();
    return;
  }

  whenError.hidden = true;
  state.dateISO = date;
  state.time = time;
  go(4);
});

/* =============================================== SCREEN 4 : THE SURPRISE == */
function formatDateLong(iso) {
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

function formatTime12h(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  const suffix = h < 12 ? 'AM' : 'PM';
  const hour = ((h + 11) % 12) + 1;
  return `${hour}:${String(m).padStart(2, '0')} ${suffix}`;
}

function fillPlan() {
  planFood.textContent = state.food || '—';
  planDate.textContent = state.dateISO ? formatDateLong(state.dateISO) : '—';
  planTime.textContent = state.time ? formatTime12h(state.time) : '—';
}

/* ---------------------------------------------------------- floating hearts */
const HEART_EMOJI = ['💗', '💕', '💖', '💘', '❤️', '🩷'];

function spawnHeart(layer, fast) {
  const heart = document.createElement('span');
  heart.className = 'heart';
  heart.textContent = HEART_EMOJI[Math.floor(Math.random() * HEART_EMOJI.length)];
  heart.style.left = `${Math.random() * 100}%`;
  heart.style.fontSize = `${fast ? 16 + Math.random() * 26 : 12 + Math.random() * 16}px`;
  heart.style.setProperty('--drift', `${Math.round(Math.random() * 140 - 70)}px`);
  heart.style.animationDuration = `${fast ? 3.2 + Math.random() * 2.6 : 9 + Math.random() * 7}s`;
  heart.addEventListener('animationend', () => heart.remove()); // no buildup
  layer.appendChild(heart);
}

/* Gentle ambient hearts all the time (capped, self-removing). */
if (!prefersReducedMotion()) {
  window.setInterval(() => {
    if (!document.hidden && ambientLayer.childElementCount < 12) {
      spawnHeart(ambientLayer, false);
    }
  }, 1600);
}

/* Celebratory burst when the final screen appears. */
function celebrate() {
  if (prefersReducedMotion()) return;
  let spawned = 0;
  const burst = window.setInterval(() => {
    spawnHeart(burstLayer, true);
    spawned += 1;
    if (spawned >= 26) window.clearInterval(burst);
  }, 90);
}

/* ------------------------------------------------------- back & start over */
$$('.back-btn').forEach((btn) => {
  btn.addEventListener('click', () => go(Number(btn.dataset.go)));
});

restartBtn.addEventListener('click', resetAll);

function resetAll() {
  // state
  state.food = null;
  state.dateISO = '';
  state.time = '';

  // screen 2
  foodCards.forEach((b) => {
    b.classList.remove('selected');
    b.setAttribute('aria-pressed', 'false');
  });
  continueBtn.disabled = true;
  foodHint.hidden = true;
  foodHint.textContent = '';

  // screen 3
  dateInput.value = '';
  timeInput.value = '';
  whenError.hidden = true;
  syncMinDate();

  // screen 1
  escapes = 0;
  lastTease = '';
  yesBtn.style.setProperty('--yes-scale', '1');
  noBtn.classList.remove('free');
  noBtn.style.left = '';
  noBtn.style.top = '';
  tease.classList.remove('show');
  tease.textContent = '';
  window.clearTimeout(teaseTimer);

  // hearts
  burstLayer.innerHTML = '';

  go(1);
}

/* ------------------------------------------------------------------- init */
syncMinDate();
