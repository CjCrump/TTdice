// =========================
// DOM
// =========================
const diceTray = document.getElementById("diceTray");
const rollBtn = document.getElementById("rollBtn");
const results = document.getElementById("results");

const bonusValueEl = document.getElementById("bonusValue");
const bonusPlus = document.getElementById("bonusPlus");
const bonusMinus = document.getElementById("bonusMinus");

const historyList = document.getElementById("historyList");

// Optional (we’ll guard in code so it never crashes if missing)
const trayError = document.getElementById("trayError");

// Advantage / Disadvantage
const advControl = document.getElementById("advControl");
const advEnable = document.getElementById("advEnable");
const advMode = document.getElementById("advMode");
const advState = document.getElementById("advState");

// =========================
// STATE
// =========================
const MAX_DICE = 10;
const MAX_HISTORY = 10;

let selectedDice = []; // array of sides: [6,6,20,...]
let bonus = 0;
let rollHistory = [];

// =========================
// RNG (trustworthy)
// =========================
function secureRoll(sides) {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return (buf[0] % sides) + 1;
}

// =========================
// UX helpers
// =========================
function shakeTray() {
  diceTray.classList.remove("shake"); // reset if spam-clicked
  void diceTray.offsetWidth;          // force reflow to restart animation
  diceTray.classList.add("shake");
  setTimeout(() => diceTray.classList.remove("shake"), 280);
}

function showTrayError() {
  // If you haven’t added #trayError yet, do nothing (no crashes)
  if (!trayError) return;

  trayError.classList.add("show");
  setTimeout(() => trayError.classList.remove("show"), 1500);
}

// =========================
// UI sync
// =========================
function updateBonusUI() {
  bonusValueEl.textContent = `Bonus: ${bonus}`;
}

function updateRollBtnUI() {
  rollBtn.disabled = selectedDice.length === 0;
}

function updatePlusDisabledUI() {
  const isFull = selectedDice.length >= MAX_DICE;
  document.querySelectorAll(".dice-control .plus").forEach(btn => {
    btn.disabled = isFull;
  });
  diceTray.classList.toggle("full", isFull);
}

function updateDiceSelectorCountsUI() {
  const counts = {};
  selectedDice.forEach(sides => {
    counts[sides] = (counts[sides] || 0) + 1;
  });

  document.querySelectorAll(".dice-control").forEach(control => {
    const sides = Number(control.dataset.die);
    const label = control.querySelector("span");
    const count = counts[sides] || 0;

    // Keep your existing label style, just add count when >0
    label.textContent = count > 0 ? `d${sides} (${count})` : `d${sides}`;
  });
}

function updateAdvUI() {
  // Only usable when there are EXACTLY 2 dice, and they are the SAME type
  const canUse =
    selectedDice.length === 2 &&
    selectedDice[0] === selectedDice[1];

  // whole row muted unless eligible
  advControl.classList.toggle("muted", !canUse);
  advControl.setAttribute("aria-disabled", String(!canUse));

  // enable checkbox only when eligible
  advEnable.disabled = !canUse;

  // switch only enabled if checkbox checked AND eligible
  advMode.disabled = !canUse || !advEnable.checked;

  // label reflects switch state (adv default ON)
  advState.textContent = advMode.checked ? "Advantage" : "Disadvantage";

  // If not eligible, force reset to defaults (no surprises)
  if (!canUse) {
    advEnable.checked = false;
    advMode.checked = true; // advantage default
    advState.textContent = "Advantage";
  }
}

function syncAllUI() {
  updateBonusUI();
  updateRollBtnUI();
  updatePlusDisabledUI();
  updateDiceSelectorCountsUI();
  updateAdvUI();
}

// =========================
// Render tray (dice DOM)
// =========================
function renderTray() {
  diceTray.innerHTML = "";

  if (selectedDice.length === 0) {
    diceTray.innerHTML = `<p class="tray-placeholder">Select dice to add them here</p>`;
    syncAllUI();
    return;
  }

  // Create a die element for each selected die
  selectedDice.forEach(sides => {
    const el = document.createElement("div");
    el.className = "die";
    el.dataset.sides = String(sides); // store sides on element (robust)

    el.innerHTML = `
      <span class="die-type">d${sides}</span>
      <span class="die-value"></span>
    `;

    diceTray.appendChild(el);
  });

  syncAllUI();
}

// =========================
// History
// =========================
function renderHistory() {
  historyList.innerHTML = "";

  rollHistory.forEach(entry => {
    const li = document.createElement("li");
    li.textContent = entry;
    historyList.appendChild(li);
  });
}

// =========================
// Wiring: Dice controls (+ / -)
// =========================
document.querySelectorAll(".dice-control").forEach(control => {
  const sides = Number(control.dataset.die);
  const plus = control.querySelector(".plus");
  const minus = control.querySelector(".minus");

  plus.addEventListener("click", () => {
    if (selectedDice.length >= MAX_DICE) {
      showTrayError();
      return;
    }
    selectedDice.push(sides);
    renderTray();
  });

  minus.addEventListener("click", () => {
    const index = selectedDice.indexOf(sides);
    if (index === -1) return;

    selectedDice.splice(index, 1);
    renderTray();
  });
});

// =========================
// Bonus controls
// =========================
bonusPlus.addEventListener("click", () => {
  bonus++;
  updateBonusUI();
});

bonusMinus.addEventListener("click", () => {
  bonus--;
  updateBonusUI();
});

// =========================
// Advantage controls
// =========================
advEnable.addEventListener("change", () => {
  // If turning off, reset to advantage default
  if (!advEnable.checked) advMode.checked = true;
  updateAdvUI();
});

advMode.addEventListener("change", () => {
  updateAdvUI();
});

// =========================
// Roll handler (fixed + complete)
// =========================
function rollDice() {
  if (selectedDice.length === 0) return;

  shakeTray();

  results.innerHTML = "";

  const diceEls = [...diceTray.querySelectorAll(".die")];

  // Determine if we are in Adv/Dis mode (and eligible)
  const advEligible =
    selectedDice.length === 2 &&
    selectedDice[0] === selectedDice[1];

  const advActive = advEligible && advEnable.checked;
  const isAdvantage = advMode.checked; // true=adv, false=dis

  // -------------------------
  // ADV / DIS MODE (special math)
  // -------------------------
  if (advActive) {
    const sides = selectedDice[0];

    // roll each of the two dice (show both values)
    const r1 = secureRoll(sides);
    const r2 = secureRoll(sides);

    const chosen = isAdvantage ? Math.max(r1, r2) : Math.min(r1, r2);
    const total = chosen + bonus;

    // Animate both dice and reveal their individual rolls
    diceEls.forEach((dieEl, index) => {
      const valueEl = dieEl.querySelector(".die-value");
      const rollVal = index === 0 ? r1 : r2;

      dieEl.classList.remove("show-result");
      dieEl.classList.add("rolling");
      valueEl.textContent = "";

      setTimeout(() => {
        dieEl.classList.remove("rolling");
        dieEl.classList.add("show-result");
        valueEl.textContent = rollVal;
      }, 600 + index * 80);
    });

    // Results panel (clear + explicit)
    const modeLine = document.createElement("p");
    modeLine.textContent = isAdvantage
      ? `Advantage: max(${r1}, ${r2}) = ${chosen}`
      : `Disadvantage: min(${r1}, ${r2}) = ${chosen}`;
    results.appendChild(modeLine);

    if (bonus !== 0) {
      const bonusLine = document.createElement("p");
      bonusLine.textContent = `Bonus → ${bonus}`;
      results.appendChild(bonusLine);
    }

    const totalLine = document.createElement("strong");
    totalLine.textContent = `Total: ${total}`;
    results.appendChild(totalLine);

    // History entry (cap at 10)
    const diceText = `2×d${sides}`;
    const modeText = isAdvantage ? "Adv" : "Dis";
    const bonusText = bonus !== 0 ? ` | Bonus ${bonus > 0 ? "+" : ""}${bonus}` : "";
    const historyEntry = `${diceText} | ${modeText} (${r1},${r2}) → ${chosen}${bonusText} → ${total}`;

    rollHistory.unshift(historyEntry);
    if (rollHistory.length > MAX_HISTORY) rollHistory.pop();
    renderHistory();

    return; // IMPORTANT: do not run normal tray math
  }

  // -------------------------
  // NORMAL MODE (sum of all dice)
  // -------------------------
  let total = 0;
  const diceSummary = {};

  diceEls.forEach((dieEl, index) => {
    const sides = Number(dieEl.dataset.sides);

    diceSummary[sides] = (diceSummary[sides] || 0) + 1;

    const roll = secureRoll(sides);
    total += roll;

    const valueEl = dieEl.querySelector(".die-value");

    dieEl.classList.remove("show-result");
    dieEl.classList.add("rolling");
    valueEl.textContent = "";

    setTimeout(() => {
      dieEl.classList.remove("rolling");
      dieEl.classList.add("show-result");
      valueEl.textContent = roll;
    }, 600 + index * 80);

    const line = document.createElement("p");
    line.textContent = `d${sides} → ${roll}`;
    results.appendChild(line);
  });

  if (bonus !== 0) {
    const bonusLine = document.createElement("p");
    bonusLine.textContent = `Bonus → ${bonus}`;
    results.appendChild(bonusLine);
    total += bonus;
  }

  const totalLine = document.createElement("strong");
  totalLine.textContent = `Total: ${total}`;
  results.appendChild(totalLine);

  const diceText = Object.entries(diceSummary)
    .map(([sides, count]) => `${count}×d${sides}`)
    .join(", ");

  let historyEntry = diceText;

  if (bonus !== 0) {
    historyEntry += ` | Bonus ${bonus > 0 ? "+" : ""}${bonus}`;
  }

  historyEntry += ` → ${total}`;

  rollHistory.unshift(historyEntry);
  if (rollHistory.length > MAX_HISTORY) rollHistory.pop();
  renderHistory();
}

// wire roll button
rollBtn.addEventListener("click", rollDice);

// =========================
// Init
// =========================
renderTray();
syncAllUI();
renderHistory();
