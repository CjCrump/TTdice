/* ═══════════════════════════════════════
   TTDice v2 — script.js
   Supabase-ready, full session stats
═══════════════════════════════════════ */

// ─── DOM ───
const diceTray      = document.getElementById('diceTray');
const rollBtn       = document.getElementById('rollBtn');
const resultsEl     = document.getElementById('results');
const bonusValueEl  = document.getElementById('bonusValue');
const bonusPlus     = document.getElementById('bonusPlus');
const bonusMinus    = document.getElementById('bonusMinus');
const historyList   = document.getElementById('historyList');
const trayError     = document.getElementById('trayError');
const clearBtn      = document.getElementById('clearBtn');
const copyResultBtn = document.getElementById('copyResultBtn');
const clearHistBtn  = document.getElementById('clearHistoryBtn');
const advControl    = document.getElementById('advControl');
const advEnable     = document.getElementById('advEnable');
const advMode       = document.getElementById('advMode');
const advState      = document.getElementById('advState');
const trayHint      = document.getElementById('trayHint');

// Stats
const statTotalEl = document.getElementById('statTotal');
const statRollsEl = document.getElementById('statRolls');
const statBestEl  = document.getElementById('statBest');
const statAvgEl   = document.getElementById('statAvg');

// Sync
const syncDot   = document.getElementById('syncDot');
const syncLabel = document.getElementById('syncLabel');
const syncSub   = document.querySelector('.sync-sub');

// ─── Constants ───
const MAX_DICE    = 10;
const MAX_HISTORY = 20;

// ─── State ───
let selectedDice = [];
let bonus        = 0;
let rollHistory  = [];
let lastResult   = null;

// Session stats
let sessionStats = {
  totalDice : 0,
  rollCount : 0,
  bestRoll  : null,
  totals    : [],
};

// ─── Supabase Setup ───
let supabase = null;

function initSupabase() {
  if (typeof window.SUPABASE_URL === 'undefined' || typeof window.SUPABASE_ANON_KEY === 'undefined') return;
  if (typeof window.supabaseJs === 'undefined') return;

  try {
    supabase = window.supabaseJs.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
    syncDot.classList.add('connected');
    syncLabel.textContent = 'Supabase connected';
    if (syncSub) syncSub.textContent = 'Rolls are being synced to your database.';
    console.info('[TTDice] Supabase connected');
  } catch (e) {
    syncDot.classList.add('error');
    syncLabel.textContent = 'Connection error';
    console.warn('[TTDice] Supabase init failed:', e);
  }
}

async function logRollToSupabase(payload) {
  if (!supabase) return;
  try {
    const { error } = await supabase.from('rolls').insert([payload]);
    if (error) console.warn('[TTDice] Supabase insert error:', error.message);
  } catch (e) {
    console.warn('[TTDice] Supabase log error:', e);
  }
}

// ─── RNG ───
function secureRoll(sides) {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return (buf[0] % sides) + 1;
}

// ─── UX Helpers ───
function shakeTray() {
  diceTray.classList.remove('shake');
  void diceTray.offsetWidth;
  diceTray.classList.add('shake');
  setTimeout(() => diceTray.classList.remove('shake'), 320);
}

function showTrayError() {
  trayError.classList.add('visible');
  shakeTray();
  setTimeout(() => trayError.classList.remove('visible'), 2000);
}

function copyText(text) {
  navigator.clipboard?.writeText(text).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  });
}

// ─── Bonus UI ───
function updateBonusUI() {
  const sign = bonus >= 0 ? '+' : '';
  bonusValueEl.textContent = `${sign}${bonus}`;
}

// ─── Roll Button ───
function updateRollBtn() {
  rollBtn.disabled = selectedDice.length === 0;
  clearBtn.disabled = selectedDice.length === 0;
}

// ─── Plus buttons ───
function updatePlusButtons() {
  const full = selectedDice.length >= MAX_DICE;
  diceTray.classList.toggle('full', full);
  document.querySelectorAll('.die-row .plus').forEach(btn => {
    btn.disabled = full;
  });
}

// ─── Die count labels in left panel ───
function updateCountLabels() {
  const counts = {};
  selectedDice.forEach(s => { counts[s] = (counts[s] || 0) + 1; });

  document.querySelectorAll('.die-row').forEach(row => {
    const sides = Number(row.dataset.die);
    const el = document.getElementById(`count-${sides}`);
    if (!el) return;

    if (counts[sides]) {
      el.textContent = `×${counts[sides]}`;
      el.classList.add('active');
    } else {
      el.textContent = '—';
      el.classList.remove('active');
    }
  });
}

// ─── Advantage UI ───
function updateAdvUI() {
  const canUse = selectedDice.length === 2 && selectedDice[0] === selectedDice[1];

  advControl.setAttribute('aria-disabled', String(!canUse));
  advEnable.disabled = !canUse;
  advMode.disabled   = !canUse || !advEnable.checked;
  advState.textContent = advMode.checked ? 'Advantage' : 'Disadvantage';

  if (!canUse) {
    advEnable.checked = false;
    advMode.checked   = true;
    advState.textContent = 'Advantage';
  }
}

// ─── Sync all UI ───
function syncUI() {
  updateBonusUI();
  updateRollBtn();
  updatePlusButtons();
  updateCountLabels();
  updateAdvUI();
}

// ─── Session Stats ───
function updateStats(total, diceCount) {
  sessionStats.totalDice += diceCount;
  sessionStats.rollCount += 1;
  sessionStats.totals.push(total);
  if (sessionStats.bestRoll === null || total > sessionStats.bestRoll) {
    sessionStats.bestRoll = total;
  }

  statTotalEl.textContent = sessionStats.totalDice;
  statRollsEl.textContent = sessionStats.rollCount;
  statBestEl.textContent  = sessionStats.bestRoll;

  const avg = sessionStats.totals.reduce((a,b) => a+b, 0) / sessionStats.totals.length;
  statAvgEl.textContent = avg.toFixed(1);
}

// ─── Render Tray ───
function renderTray() {
  // Remove existing dice elements (not the hint)
  diceTray.querySelectorAll('.tray-die').forEach(el => el.remove());

  if (selectedDice.length === 0) {
    trayHint.style.display = '';
  } else {
    trayHint.style.display = 'none';

    selectedDice.forEach((sides, i) => {
      const el = document.createElement('div');
      el.className  = 'tray-die';
      el.dataset.sides = String(sides);
      el.dataset.index = String(i);
      el.title = `Click to remove d${sides}`;
      el.innerHTML = `
        <span class="die-label">d${sides}</span>
        <span class="die-result"></span>
      `;
      // Click to remove
      el.addEventListener('click', () => {
        const idx = selectedDice.indexOf(sides);
        if (idx !== -1) {
          selectedDice.splice(idx, 1);
          renderTray();
          syncUI();
        }
      });
      diceTray.appendChild(el);
    });
  }

  syncUI();
}

// ─── History ───
function renderHistory() {
  historyList.innerHTML = '';

  if (rollHistory.length === 0) {
    historyList.innerHTML = '<li class="history-empty">No rolls yet</li>';
    return;
  }

  rollHistory.forEach((entry, i) => {
    const li = document.createElement('li');
    li.textContent = entry;
    historyList.appendChild(li);
  });
}

// ─── Presets ───
const PRESETS = {
  attack:   { dice: [20], bonus: 0, label: 'Attack Roll' },
  fireball: { dice: [6,6,6,6,6,6,6,6], bonus: 0, label: 'Fireball (8d6)' },
  stat:     { dice: [6,6,6,6], bonus: 0, label: 'Stat Roll (4d6)' },
  sneak:    { dice: [6,6,6], bonus: 0, label: 'Sneak Attack (3d6)' },
};

document.querySelectorAll('.preset-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const preset = PRESETS[btn.dataset.preset];
    if (!preset) return;

    if (preset.dice.length > MAX_DICE) {
      showTrayError();
      return;
    }

    selectedDice = [...preset.dice];
    bonus = preset.bonus;
    renderTray();
    syncUI();
  });
});

// ─── Dice Controls (left panel +/-) ───
document.querySelectorAll('.die-row').forEach(row => {
  const sides = Number(row.dataset.die);
  const plusBtn  = row.querySelector('.plus');
  const minusBtn = row.querySelector('.minus');

  plusBtn.addEventListener('click', () => {
    if (selectedDice.length >= MAX_DICE) { showTrayError(); return; }
    selectedDice.push(sides);
    renderTray();
  });

  minusBtn.addEventListener('click', () => {
    const idx = selectedDice.lastIndexOf(sides);
    if (idx === -1) return;
    selectedDice.splice(idx, 1);
    renderTray();
  });
});

// ─── Bonus Controls ───
bonusPlus.addEventListener('click', () => { bonus++; updateBonusUI(); });
bonusMinus.addEventListener('click', () => { bonus--; updateBonusUI(); });

// ─── Clear Tray ───
clearBtn.addEventListener('click', () => {
  selectedDice = [];
  renderTray();
  resultsEl.innerHTML = '';
  lastResult = null;
  copyResultBtn.disabled = true;
  syncUI();
});

// ─── Clear History ───
clearHistBtn.addEventListener('click', () => {
  rollHistory = [];
  renderHistory();
  sessionStats = { totalDice: 0, rollCount: 0, bestRoll: null, totals: [] };
  statTotalEl.textContent = '0';
  statRollsEl.textContent = '0';
  statBestEl.textContent  = '—';
  statAvgEl.textContent   = '—';
});

// ─── Copy Result ───
copyResultBtn.addEventListener('click', () => {
  if (lastResult) {
    copyText(lastResult);
    copyResultBtn.textContent = '✓ Copied';
    setTimeout(() => { copyResultBtn.textContent = '⎘ Copy'; }, 1500);
  }
});

// ─── Advantage Controls ───
advEnable.addEventListener('change', () => {
  if (!advEnable.checked) advMode.checked = true;
  updateAdvUI();
});
advMode.addEventListener('change', updateAdvUI);

// ─── Roll Handler ───
function rollDice() {
  if (selectedDice.length === 0) return;

  shakeTray();
  resultsEl.innerHTML = '';

  const diceEls = [...diceTray.querySelectorAll('.tray-die')];

  const advEligible = selectedDice.length === 2 && selectedDice[0] === selectedDice[1];
  const advActive   = advEligible && advEnable.checked;
  const isAdv       = advMode.checked;

  // ── Advantage / Disadvantage Mode ──
  if (advActive) {
    const sides = selectedDice[0];
    const r1 = secureRoll(sides);
    const r2 = secureRoll(sides);
    const chosen = isAdv ? Math.max(r1, r2) : Math.min(r1, r2);
    const total  = chosen + bonus;

    animateDice(diceEls, [r1, r2]);

    const modeText = isAdv ? `Advantage — max(${r1}, ${r2}) = ${chosen}` : `Disadvantage — min(${r1}, ${r2}) = ${chosen}`;
    appendResult(modeText, 'mode-line');
    if (bonus !== 0) appendResult(`Modifier: ${bonus >= 0 ? '+' : ''}${bonus}`, 'bonus-line');
    appendTotal(total, sides);

    const histEntry = buildHistoryEntry(`2×d${sides} ${isAdv?'Adv':'Dis'} (${r1},${r2})→${chosen}`, bonus, total);
    pushHistory(histEntry);
    updateStats(total, 2);

    lastResult = `${modeText} | Total: ${total}`;
    copyResultBtn.disabled = false;

    logRollToSupabase({
      dice_notation: `2×d${sides}`,
      individual_rolls: [r1, r2],
      bonus,
      total,
      mode: isAdv ? 'advantage' : 'disadvantage',
      rolled_at: new Date().toISOString(),
    });

    return;
  }

  // ── Normal Mode ──
  let total = bonus;
  const rolls = [];
  const diceSummary = {};

  diceEls.forEach((dieEl, i) => {
    const sides = Number(dieEl.dataset.sides);
    const roll  = secureRoll(sides);
    rolls.push(roll);
    total += roll;
    diceSummary[sides] = (diceSummary[sides] || 0) + 1;

    const line = document.createElement('p');
    line.className   = 'result-line';
    line.textContent = `d${sides} → ${roll}`;
    resultsEl.appendChild(line);
  });

  animateDice(diceEls, rolls);

  if (bonus !== 0) appendResult(`Modifier: ${bonus >= 0 ? '+' : ''}${bonus}`, 'bonus-line');
  appendTotal(total, selectedDice.length === 1 ? selectedDice[0] : null);

  const diceText = Object.entries(diceSummary).map(([s,c]) => `${c}×d${s}`).join(', ');
  const histEntry = buildHistoryEntry(diceText, bonus, total);
  pushHistory(histEntry);
  updateStats(total, selectedDice.length);

  lastResult = `${diceText} ${bonus !== 0 ? `+${bonus} ` : ''}→ ${total}`;
  copyResultBtn.disabled = false;

  logRollToSupabase({
    dice_notation: diceText,
    individual_rolls: rolls,
    bonus,
    total,
    mode: 'normal',
    rolled_at: new Date().toISOString(),
  });
}

// ─── Dice Animation ───
function animateDice(els, rolls) {
  els.forEach((el, i) => {
    const resultEl = el.querySelector('.die-result');
    el.classList.remove('show-result', 'rolling');
    resultEl.textContent = '';

    void el.offsetWidth;
    el.classList.add('rolling');

    setTimeout(() => {
      el.classList.remove('rolling');
      el.classList.add('show-result');
      resultEl.textContent = rolls[i] ?? '';
    }, 600 + i * 80);
  });
}

// ─── Result Helpers ───
function appendResult(text, cls = '') {
  const p = document.createElement('p');
  p.className   = `result-line ${cls}`.trim();
  p.textContent = text;
  resultsEl.appendChild(p);
}

function appendTotal(total, sides) {
  const el = document.createElement('div');
  el.className = 'result-total';
  el.textContent = `Total: ${total}`;

  // Natural 20 / Natural 1 (only for single d20)
  if (sides === 20) {
    if (total === 20) el.classList.add('nat20');
    if (total === 1)  el.classList.add('nat1');
  }

  resultsEl.appendChild(el);
}

// ─── History Helpers ───
function buildHistoryEntry(diceText, bon, total) {
  let s = diceText;
  if (bon !== 0) s += ` | ${bon >= 0 ? '+' : ''}${bon}`;
  s += ` → ${total}`;
  return s;
}

function pushHistory(entry) {
  rollHistory.unshift(entry);
  if (rollHistory.length > MAX_HISTORY) rollHistory.pop();
  renderHistory();
}

// ─── Wire Roll Button ───
rollBtn.addEventListener('click', rollDice);

// ─── Keyboard shortcut (Space / Enter when not in input) ───
document.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return;
  if (e.code === 'Space' || e.code === 'Enter') {
    e.preventDefault();
    if (!rollBtn.disabled) rollDice();
  }
});

// ─── Init ───
initSupabase();
renderTray();
renderHistory();
syncUI();
