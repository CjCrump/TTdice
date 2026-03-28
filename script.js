/* ═══════════════════════════════════════
   TTDice v3 — script.js
   Solo + Shared Table via Firestore
═══════════════════════════════════════ */

// ─── DOM: Core ───
const diceTray      = document.getElementById('diceTray');
const rollBtn       = document.getElementById('rollBtn');
const resultsEl     = document.getElementById('results');
const bonusValueEl  = document.getElementById('bonusValue');
const bonusPlus     = document.getElementById('bonusPlus');
const bonusMinus    = document.getElementById('bonusMinus');
const trayError     = document.getElementById('trayError');
const clearBtn      = document.getElementById('clearBtn');
const copyResultBtn = document.getElementById('copyResultBtn');
const advControl    = document.getElementById('advControl');
const advEnable     = document.getElementById('advEnable');
const advMode       = document.getElementById('advMode');
const advState      = document.getElementById('advState');
const trayHint      = document.getElementById('trayHint');
const trayTitle     = document.getElementById('trayTitle');

// ─── DOM: Solo ───
const historyList   = document.getElementById('historyList');
const clearHistBtn  = document.getElementById('clearHistoryBtn');
const statTotalEl   = document.getElementById('statTotal');
const statRollsEl   = document.getElementById('statRolls');
const statBestEl    = document.getElementById('statBest');
const statAvgEl     = document.getElementById('statAvg');
const syncDot       = document.getElementById('syncDot');
const syncLabel     = document.getElementById('syncLabel');
const syncSub       = document.getElementById('syncSub');

// ─── DOM: Mode toggle ───
const soloModeBtn   = document.getElementById('soloModeBtn');
const tableModeBtn  = document.getElementById('tableModeBtn');
const soloView      = document.getElementById('soloView');
const tableView     = document.getElementById('tableView');

// ─── DOM: Table lobby ───
const tableLobby        = document.getElementById('tableLobby');
const playerNameInput   = document.getElementById('playerNameInput');
const createTableBtn    = document.getElementById('createTableBtn');
const tableCodeInput    = document.getElementById('tableCodeInput');
const joinTableBtn      = document.getElementById('joinTableBtn');
const lobbyError        = document.getElementById('lobbyError');

// ─── DOM: Table session ───
const tableSession      = document.getElementById('tableSession');
const tableCodeDisplay  = document.getElementById('tableCodeDisplay');
const copyCodeBtn       = document.getElementById('copyCodeBtn');
const leaveTableBtn     = document.getElementById('leaveTableBtn');
const playersList       = document.getElementById('playersList');
const feedList          = document.getElementById('feedList');

// ─── Constants ───
const MAX_DICE    = 10;
const MAX_HISTORY = 20;

// ─── Persistence ───
function saveLocal(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch(e) {}
}
function loadLocal(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v !== null ? JSON.parse(v) : fallback;
  } catch(e) { return fallback; }
}

// ─── State (persisted) ───
let selectedDice = [];
let bonus        = loadLocal('ttdice_bonus', 0);
let rollHistory  = loadLocal('ttdice_history', []);
let lastResult   = null;
let appMode      = 'solo';

let sessionStats = loadLocal('ttdice_stats', {
  totalDice : 0,
  rollCount : 0,
  bestRoll  : null,
  totals    : [],
});

// ─── Table state ───
let tableState = {
  active      : false,
  code        : null,
  playerName  : null,
  playerId    : null,
  unsubRolls  : null,
  unsubPlayers: null,
};

// ─── Firebase ───
let db = null;

function initFirebase() {
  if (typeof window.FIREBASE_CONFIG === 'undefined') return;
  if (typeof firebase === 'undefined') return;
  try {
    firebase.initializeApp(window.FIREBASE_CONFIG);
    db = firebase.firestore();
    syncDot.classList.add('connected');
    syncLabel.textContent = 'Firebase connected';
    if (syncSub) syncSub.textContent = 'Rolls are syncing to Firestore.';
    console.info('[TTDice] Firebase connected');
  } catch (e) {
    syncDot.classList.add('error');
    syncLabel.textContent = 'Connection error';
    console.warn('[TTDice] Firebase init failed:', e);
  }
}

// ─── RNG ───
function secureRoll(sides) {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return (buf[0] % sides) + 1;
}

// ─── Table code generator ───
function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  const buf = new Uint32Array(6);
  crypto.getRandomValues(buf);
  buf.forEach(n => { code += chars[n % chars.length]; });
  return code;
}

// ─── Browser ID (persists across refreshes) ───
function getPlayerId() {
  let id = localStorage.getItem('ttdice_player_id');
  if (!id) {
    const buf = new Uint32Array(4);
    crypto.getRandomValues(buf);
    id = Array.from(buf).map(n => n.toString(36)).join('-');
    localStorage.setItem('ttdice_player_id', id);
  }
  return id;
}

// ═══════════════════════════════════════
// MODE TOGGLE
// ═══════════════════════════════════════

function setMode(mode) {
  appMode = mode;
  soloModeBtn.classList.toggle('active', mode === 'solo');
  tableModeBtn.classList.toggle('active', mode === 'table');
  soloView.style.display  = mode === 'solo'  ? '' : 'none';
  tableView.style.display = mode === 'table' ? '' : 'none';
  trayTitle.textContent   = mode === 'table' && tableState.active
    ? `Table: ${tableState.code}`
    : 'Dice Tray';
}

soloModeBtn.addEventListener('click',  () => setMode('solo'));
tableModeBtn.addEventListener('click', () => setMode('table'));

// ═══════════════════════════════════════
// TABLE: CREATE
// ═══════════════════════════════════════

createTableBtn.addEventListener('click', async () => {
  const name = playerNameInput.value.trim();
  if (!name) { showLobbyError('Enter your name first'); return; }
  if (!db)   { showLobbyError('Firebase not connected'); return; }

  createTableBtn.disabled = true;
  createTableBtn.textContent = 'Creating…';

  const code     = generateCode();
  const playerId = getPlayerId();

  try {
    const tableRef = db.collection('ttdice_tables').doc(code);
    await tableRef.set({
      createdAt : firebase.firestore.FieldValue.serverTimestamp(),
      hostId    : playerId,
      active    : true,
    });

    await tableRef.collection('players').doc(playerId).set({
      name     : name,
      joinedAt : firebase.firestore.FieldValue.serverTimestamp(),
      active   : true,
    });

    joinSession(code, name, playerId);
  } catch (e) {
    showLobbyError('Failed to create table. Try again.');
    console.warn('[TTDice] Create table error:', e);
    createTableBtn.disabled = false;
    createTableBtn.textContent = '✦ Create Table';
  }
});

// ═══════════════════════════════════════
// TABLE: JOIN
// ═══════════════════════════════════════

joinTableBtn.addEventListener('click', async () => {
  const name = playerNameInput.value.trim();
  const code = tableCodeInput.value.trim().toUpperCase();

  if (!name) { showLobbyError('Enter your name first'); return; }
  if (!code) { showLobbyError('Enter a table code'); return; }
  if (!db)   { showLobbyError('Firebase not connected'); return; }

  joinTableBtn.disabled = true;
  joinTableBtn.textContent = 'Joining…';

  const playerId = getPlayerId();

  try {
    const tableRef  = db.collection('ttdice_tables').doc(code);
    const tableSnap = await tableRef.get();

    if (!tableSnap.exists || !tableSnap.data().active) {
      showLobbyError('Table not found. Check the code.');
      joinTableBtn.disabled = false;
      joinTableBtn.textContent = 'Join';
      return;
    }

    await tableRef.collection('players').doc(playerId).set({
      name     : name,
      joinedAt : firebase.firestore.FieldValue.serverTimestamp(),
      active   : true,
    });

    joinSession(code, name, playerId);
  } catch (e) {
    showLobbyError('Failed to join. Try again.');
    console.warn('[TTDice] Join table error:', e);
    joinTableBtn.disabled = false;
    joinTableBtn.textContent = 'Join';
  }
});

// ═══════════════════════════════════════
// TABLE: SESSION (shared listeners)
// ═══════════════════════════════════════

function joinSession(code, name, playerId) {
  tableState.active     = true;
  tableState.code       = code;
  tableState.playerName = name;
  tableState.playerId   = playerId;

  // show session UI
  tableLobby.style.display    = 'none';
  tableSession.style.display  = '';
  tableCodeDisplay.textContent = code;
  trayTitle.textContent        = `Table: ${code}`;

  // reset lobby buttons
  createTableBtn.disabled = false;
  createTableBtn.textContent = '✦ Create Table';
  joinTableBtn.disabled = false;
  joinTableBtn.textContent = 'Join';
  lobbyError.textContent = '';

  // Subscribe to players
  const tableRef = db.collection('ttdice_tables').doc(code);

  tableState.unsubPlayers = tableRef
    .collection('players')
    .where('active', '==', true)
    .onSnapshot(snap => {
      playersList.innerHTML = '';
      snap.forEach(doc => {
        const p  = doc.data();
        const li = document.createElement('li');
        li.className = 'player-entry';
        const isMe = doc.id === playerId;
        li.innerHTML = `
          <span class="player-dot"></span>
          <span class="player-name">${escapeHtml(p.name)}${isMe ? ' <em>(you)</em>' : ''}</span>
        `;
        playersList.appendChild(li);
      });
    });

  // Subscribe to roll feed — last 50, ordered by time
  tableState.unsubRolls = tableRef
    .collection('rolls')
    .orderBy('rolled_at', 'desc')
    .limit(50)
    .onSnapshot(snap => {
      feedList.innerHTML = '';
      if (snap.empty) {
        feedList.innerHTML = '<li class="history-empty">Waiting for rolls…</li>';
        return;
      }
      snap.forEach(doc => {
        const r  = doc.data();
        const li = document.createElement('li');
        li.className = 'feed-entry';

        const isNat20 = r.is_nat20 ? ' feed-nat20' : '';
        const isNat1  = r.is_nat1  ? ' feed-nat1'  : '';
        const modeTag = r.mode !== 'normal'
          ? `<span class="feed-mode">${r.mode === 'advantage' ? 'Adv' : 'Dis'}</span>`
          : '';

        li.innerHTML = `
          <div class="feed-player${isNat20}${isNat1}">${escapeHtml(r.player_name)} ${modeTag}</div>
          <div class="feed-detail">${escapeHtml(r.dice_notation)} → <strong>${r.total}</strong></div>
        `;
        feedList.appendChild(li);
      });
    });
}

// ═══════════════════════════════════════
// TABLE: LEAVE
// ═══════════════════════════════════════

leaveTableBtn.addEventListener('click', leaveTable);

async function leaveTable() {
  if (!tableState.active || !db) return;

  // Unsubscribe listeners
  if (tableState.unsubRolls)   tableState.unsubRolls();
  if (tableState.unsubPlayers) tableState.unsubPlayers();

  try {
    await db
      .collection('ttdice_tables')
      .doc(tableState.code)
      .collection('players')
      .doc(tableState.playerId)
      .update({ active: false });
  } catch (e) {
    console.warn('[TTDice] Leave table error:', e);
  }

  // Reset state
  tableState = { active: false, code: null, playerName: null, playerId: null, unsubRolls: null, unsubPlayers: null };

  // Reset UI
  tableLobby.style.display   = '';
  tableSession.style.display = 'none';
  playersList.innerHTML      = '';
  feedList.innerHTML         = '<li class="history-empty">Waiting for rolls…</li>';
  trayTitle.textContent      = 'Dice Tray';
  tableCodeInput.value       = '';
}

// ─── Copy table code ───
copyCodeBtn.addEventListener('click', () => {
  if (!tableState.code) return;
  copyText(tableState.code);
  copyCodeBtn.textContent = '✓';
  setTimeout(() => { copyCodeBtn.textContent = '⎘'; }, 1500);
});

// ═══════════════════════════════════════
// ROLL LOGGING: solo + table
// ═══════════════════════════════════════

async function logRoll(payload) {
  if (!db) return;
  try {
    // Always log to global solo collection
    await db.collection('ttdice_rolls').add({
      ...payload,
      rolled_at: firebase.firestore.FieldValue.serverTimestamp(),
    });
    // Also log to table feed if in a session
    if (tableState.active) {
      await db
        .collection('ttdice_tables')
        .doc(tableState.code)
        .collection('rolls')
        .add({
          ...payload,
          player_name : tableState.playerName,
          player_id   : tableState.playerId,
          rolled_at   : firebase.firestore.FieldValue.serverTimestamp(),
        });
    }
  } catch (e) {
    console.warn('[TTDice] Firestore log error:', e);
  }
}

// ═══════════════════════════════════════
// UI HELPERS
// ═══════════════════════════════════════

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

function showLobbyError(msg) {
  lobbyError.textContent = msg;
  setTimeout(() => { lobbyError.textContent = ''; }, 3000);
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

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ─── Bonus UI ───
function updateBonusUI() {
  bonusValueEl.textContent = `${bonus >= 0 ? '+' : ''}${bonus}`;
}

function updateRollBtn() {
  rollBtn.disabled  = selectedDice.length === 0;
  clearBtn.disabled = selectedDice.length === 0;
}

function updatePlusButtons() {
  const full = selectedDice.length >= MAX_DICE;
  diceTray.classList.toggle('full', full);
  document.querySelectorAll('.die-row .plus').forEach(btn => { btn.disabled = full; });
}

function updateCountLabels() {
  const counts = {};
  selectedDice.forEach(s => { counts[s] = (counts[s] || 0) + 1; });
  document.querySelectorAll('.die-row').forEach(row => {
    const sides = Number(row.dataset.die);
    const el    = document.getElementById(`count-${sides}`);
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

function updateAdvUI() {
  const canUse = selectedDice.length === 2 && selectedDice[0] === selectedDice[1];
  advControl.setAttribute('aria-disabled', String(!canUse));
  advEnable.disabled = !canUse;
  advMode.disabled   = !canUse || !advEnable.checked;
  advState.textContent = advMode.checked ? 'Advantage' : 'Disadvantage';
  if (!canUse) {
    advEnable.checked    = false;
    advMode.checked      = true;
    advState.textContent = 'Advantage';
  }
}

function syncUI() {
  updateBonusUI();
  updateRollBtn();
  updatePlusButtons();
  updateCountLabels();
  updateAdvUI();
}

// ─── Stats ───
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
  statAvgEl.textContent   = (sessionStats.totals.reduce((a, b) => a + b, 0) / sessionStats.totals.length).toFixed(1);
  saveLocal('ttdice_stats', sessionStats);
}

// ─── Render Tray ───
function renderTray() {
  diceTray.querySelectorAll('.tray-die').forEach(el => el.remove());
  if (selectedDice.length === 0) {
    trayHint.style.display = '';
  } else {
    trayHint.style.display = 'none';
    selectedDice.forEach((sides, i) => {
      const el         = document.createElement('div');
      el.className     = 'tray-die';
      el.dataset.sides = String(sides);
      el.dataset.index = String(i);
      el.title         = `Click to remove d${sides}`;
      el.innerHTML     = `<span class="die-label">d${sides}</span><span class="die-result"></span>`;
      el.addEventListener('click', () => {
        const idx = selectedDice.indexOf(sides);
        if (idx !== -1) { selectedDice.splice(idx, 1); renderTray(); syncUI(); }
      });
      diceTray.appendChild(el);
    });
  }
  syncUI();
}

// ─── History (solo) ───
function renderHistory() {
  historyList.innerHTML = '';
  if (rollHistory.length === 0) {
    historyList.innerHTML = '<li class="history-empty">No rolls yet</li>';
    return;
  }
  rollHistory.forEach(entry => {
    const li = document.createElement('li');
    li.textContent = entry;
    historyList.appendChild(li);
  });
}

// ─── Presets ───
const PRESETS = {
  attack:   { dice: [20],               bonus: 0 },
  fireball: { dice: [6,6,6,6,6,6,6,6], bonus: 0 },
  stat:     { dice: [6,6,6,6],          bonus: 0 },
  sneak:    { dice: [6,6,6],            bonus: 0 },
};

document.querySelectorAll('.preset-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const preset = PRESETS[btn.dataset.preset];
    if (!preset) return;
    if (preset.dice.length > MAX_DICE) { showTrayError(); return; }
    selectedDice = [...preset.dice];
    bonus        = preset.bonus;
    renderTray();
    syncUI();
  });
});

// ─── Dice Controls ───
document.querySelectorAll('.die-row').forEach(row => {
  const sides = Number(row.dataset.die);
  row.querySelector('.plus').addEventListener('click', () => {
    if (selectedDice.length >= MAX_DICE) { showTrayError(); return; }
    selectedDice.push(sides);
    renderTray();
  });
  row.querySelector('.minus').addEventListener('click', () => {
    const idx = selectedDice.lastIndexOf(sides);
    if (idx === -1) return;
    selectedDice.splice(idx, 1);
    renderTray();
  });
});

// ─── Bonus ───
bonusPlus.addEventListener('click',  () => { bonus++; updateBonusUI(); saveLocal('ttdice_bonus', bonus); });
bonusMinus.addEventListener('click', () => { bonus--; updateBonusUI(); saveLocal('ttdice_bonus', bonus); });

// ─── Clear Tray ───
clearBtn.addEventListener('click', () => {
  selectedDice = []; lastResult = null;
  copyResultBtn.disabled = true;
  resultsEl.innerHTML = '';
  renderTray(); syncUI();
});

// ─── Clear History ───
clearHistBtn.addEventListener('click', () => {
  rollHistory  = [];
  sessionStats = { totalDice: 0, rollCount: 0, bestRoll: null, totals: [] };
  saveLocal('ttdice_history', []);
  saveLocal('ttdice_stats', sessionStats);
  saveLocal('ttdice_bonus', 0);
  bonus = 0;
  renderHistory();
  updateBonusUI();
  statTotalEl.textContent = '0';
  statRollsEl.textContent = '0';
  statBestEl.textContent  = '—';
  statAvgEl.textContent   = '—';
});

// ─── Copy Result ───
copyResultBtn.addEventListener('click', () => {
  if (!lastResult) return;
  copyText(lastResult);
  copyResultBtn.textContent = '✓ Copied';
  setTimeout(() => { copyResultBtn.textContent = '⎘ Copy'; }, 1500);
});

// ─── Advantage ───
advEnable.addEventListener('change', () => { if (!advEnable.checked) advMode.checked = true; updateAdvUI(); });
advMode.addEventListener('change', updateAdvUI);

// ═══════════════════════════════════════
// ROLL
// ═══════════════════════════════════════

function rollDice() {
  if (selectedDice.length === 0) return;

  shakeTray();
  resultsEl.innerHTML = '';

  const diceEls     = [...diceTray.querySelectorAll('.tray-die')];
  const advEligible = selectedDice.length === 2 && selectedDice[0] === selectedDice[1];
  const advActive   = advEligible && advEnable.checked;
  const isAdv       = advMode.checked;

  // ── Advantage / Disadvantage ──
  if (advActive) {
    const sides  = selectedDice[0];
    const r1     = secureRoll(sides);
    const r2     = secureRoll(sides);
    const chosen = isAdv ? Math.max(r1, r2) : Math.min(r1, r2);
    const total  = chosen + bonus;

    animateDice(diceEls, [r1, r2]);

    const modeText = isAdv
      ? `Advantage — max(${r1}, ${r2}) = ${chosen}`
      : `Disadvantage — min(${r1}, ${r2}) = ${chosen}`;

    appendResult(modeText, 'mode-line');
    if (bonus !== 0) appendResult(`Modifier: ${bonus >= 0 ? '+' : ''}${bonus}`, 'bonus-line');
    appendTotal(total, sides);
    pushHistory(buildHistoryEntry(`2×d${sides} ${isAdv ? 'Adv' : 'Dis'} (${r1},${r2})→${chosen}`, bonus, total));
    updateStats(total, 2);

    lastResult             = `${modeText} | Total: ${total}`;
    copyResultBtn.disabled = false;

    logRoll({
      dice_notation    : `2×d${sides}`,
      individual_rolls : [r1, r2],
      bonus, total,
      mode    : isAdv ? 'advantage' : 'disadvantage',
      is_nat20: false,
      is_nat1 : false,
    });
    return;
  }

  // ── Normal ──
  let total         = bonus;
  const rolls       = [];
  const diceSummary = {};

  diceEls.forEach(dieEl => {
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

  const singleSides = selectedDice.length === 1 ? selectedDice[0] : null;
  const isNat20 = singleSides === 20 && total === 20;
  const isNat1  = singleSides === 20 && total === 1;

  appendTotal(total, singleSides);

  const diceText = Object.entries(diceSummary).map(([s, c]) => `${c}×d${s}`).join(', ');
  pushHistory(buildHistoryEntry(diceText, bonus, total));
  updateStats(total, selectedDice.length);

  lastResult             = `${diceText}${bonus !== 0 ? ` +${bonus}` : ''} → ${total}`;
  copyResultBtn.disabled = false;

  logRoll({
    dice_notation    : diceText,
    individual_rolls : rolls,
    bonus, total,
    mode    : 'normal',
    is_nat20: isNat20,
    is_nat1 : isNat1,
  });
}

// ─── Animation ───
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

// ─── Result helpers ───
function appendResult(text, cls = '') {
  const p = document.createElement('p');
  p.className   = `result-line ${cls}`.trim();
  p.textContent = text;
  resultsEl.appendChild(p);
}

function appendTotal(total, sides) {
  const el       = document.createElement('div');
  el.className   = 'result-total';
  el.textContent = `Total: ${total}`;
  if (sides === 20) {
    if (total === 20) el.classList.add('nat20');
    if (total === 1)  el.classList.add('nat1');
  }
  resultsEl.appendChild(el);
}

function buildHistoryEntry(diceText, bon, total) {
  let s = diceText;
  if (bon !== 0) s += ` | ${bon >= 0 ? '+' : ''}${bon}`;
  return s + ` → ${total}`;
}

function pushHistory(entry) {
  rollHistory.unshift(entry);
  if (rollHistory.length > MAX_HISTORY) rollHistory.pop();
  saveLocal('ttdice_history', rollHistory);
  renderHistory();
}

// ─── Wire ───
rollBtn.addEventListener('click', rollDice);

document.addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return;
  if (e.code === 'Space' || e.code === 'Enter') {
    e.preventDefault();
    if (!rollBtn.disabled) rollDice();
  }
});

// uppercase table code input as you type
tableCodeInput.addEventListener('input', () => {
  tableCodeInput.value = tableCodeInput.value.toUpperCase();
});

// ─── Init ───
initFirebase();
renderTray();
renderHistory();
syncUI();
setMode('solo');

// Restore persisted stats UI
if (sessionStats.rollCount > 0) {
  statTotalEl.textContent = sessionStats.totalDice;
  statRollsEl.textContent = sessionStats.rollCount;
  statBestEl.textContent  = sessionStats.bestRoll;
  const avg = sessionStats.totals.reduce((a, b) => a + b, 0) / sessionStats.totals.length;
  statAvgEl.textContent   = avg.toFixed(1);
}