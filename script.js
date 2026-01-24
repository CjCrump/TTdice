const diceTray = document.getElementById("diceTray");
const rollBtn = document.getElementById("rollBtn");
const results = document.getElementById("results");
const bonusValueEl = document.getElementById("bonusValue");
const bonusPlus = document.getElementById("bonusPlus");
const bonusMinus = document.getElementById("bonusMinus");
const historyList = document.getElementById("historyList");

let rollHistory = [];
const MAX_HISTORY = 5;

const MAX_DICE = 10;
let selectedDice = [];
let bonus = 0;

document.querySelectorAll(".dice-control").forEach(control => {
  const die = Number(control.dataset.die);
  const plus = control.querySelector(".plus");
  const minus = control.querySelector(".minus");

  plus.addEventListener("click", () => {
    if (selectedDice.length >= MAX_DICE) return;
    selectedDice.push(die);
    renderTray();
  });

  minus.addEventListener("click", () => {
    const index = selectedDice.indexOf(die);
    if (index !== -1) {
      selectedDice.splice(index, 1);
      renderTray();
    }
  });
});

bonusPlus.addEventListener("click", () => {
  bonus++;
  updateBonus();
});

bonusMinus.addEventListener("click", () => {
  bonus--;
  updateBonus();
});

rollBtn.addEventListener("click", rollDice);

function renderTray() {
  diceTray.innerHTML = "";

  if (selectedDice.length >= MAX_DICE) {
    diceTray.classList.add("full");
  } else {
    diceTray.classList.remove("full");
  }

  if (selectedDice.length === 0) {
    diceTray.innerHTML = `<p class="tray-placeholder">Select dice to add them here</p>`;
    return;
  }

  selectedDice.forEach(die => {
    const el = document.createElement("div");
    el.className = "die";
    el.innerHTML = `
      <span class="die-type">d${die}</span>
      <span class="die-value"></span>
    `;

    diceTray.appendChild(el);
  });
}

function updateBonus() {
  bonusValueEl.textContent = `Bonus: ${bonus}`;
}

function renderHistory() {
  historyList.innerHTML = "";

  rollHistory.forEach(entry => {
    const li = document.createElement("li");
    li.textContent = entry;
    historyList.appendChild(li);
  });
}

function rollDice() {
  if (!selectedDice.length) return;

  results.innerHTML = "";
  let total = 0;

  const diceEls = diceTray.querySelectorAll(".die");
  const diceSummary = {};

  diceEls.forEach((dieEl, index) => {
    const die = selectedDice[index];
    const roll = Math.floor(Math.random() * die) + 1;
    total += roll;

    diceSummary[die] = (diceSummary[die] || 0) + 1;

    const valueEl = dieEl.querySelector(".die-value");

    // reset + animate
    dieEl.classList.remove("show-result");
    dieEl.classList.add("rolling");
    valueEl.textContent = "";

    setTimeout(() => {
      dieEl.classList.remove("rolling");
      dieEl.classList.add("show-result");
      valueEl.textContent = roll;
    }, 600 + index * 80);

    const line = document.createElement("p");
    line.textContent = `d${die} → ${roll}`;
    results.appendChild(line);
  });

  // bonus
  if (bonus !== 0) {
    const bonusLine = document.createElement("p");
    bonusLine.textContent = `Bonus → ${bonus}`;
    results.appendChild(bonusLine);
    total += bonus;
  }

  const totalLine = document.createElement("strong");
  totalLine.textContent = `Total: ${total}`;
  results.appendChild(totalLine);

  // ---- HISTORY (THIS WAS MISSING) ----
  const diceText = Object.entries(diceSummary)
    .map(([die, count]) => `${count}×d${die}`)
    .join(", ");

  let historyEntry = diceText;
  if (bonus !== 0) {
    historyEntry += ` | Bonus ${bonus > 0 ? "+" : ""}${bonus}`;
  }
  historyEntry += ` → ${total}`;

  rollHistory.unshift(historyEntry);

  if (rollHistory.length > MAX_HISTORY) {
    rollHistory.pop();
  }

  renderHistory();
}
