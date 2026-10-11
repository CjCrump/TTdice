/* ═══════════════════════════════════════
   TTDice — SVG Dice Library v3
   New mathematically correct dice shapes
═══════════════════════════════════════ */

// ─── Die Set Color Presets ───
const DIE_SETS = {
  forest:   { name: 'Forest',   face: '#0d1f10', body: '#1a3d1e', edge: '#c9a84c', pip: '#e8c56a', inner: '#3d7a42', glow: 'rgba(201,168,76,0.7)'  },
  obsidian: { name: 'Obsidian', face: '#0a0a0f', body: '#1a1a2e', edge: '#a0a8d0', pip: '#c8d0f0', inner: '#5060a0', glow: 'rgba(160,168,208,0.7)' },
  blood:    { name: 'Blood',    face: '#1a0808', body: '#3a1010', edge: '#cc4444', pip: '#ff8888', inner: '#7a2828', glow: 'rgba(204,68,68,0.7)'    },
  ocean:    { name: 'Ocean',    face: '#081418', body: '#0e2a38', edge: '#4aa8c8', pip: '#88d8f0', inner: '#2a6880', glow: 'rgba(74,168,200,0.7)'   },
  amethyst: { name: 'Amethyst', face: '#120a18', body: '#2a1040', edge: '#9b5fd4', pip: '#c88ef0', inner: '#5a3080', glow: 'rgba(155,95,212,0.7)'  },
  bone:     { name: 'Bone',     face: '#1a1810', body: '#2e2a1e', edge: '#d4c890', pip: '#f0e8b8', inner: '#7a7050', glow: 'rgba(212,200,144,0.7)' },
  ember:    { name: 'Ember',    face: '#180e06', body: '#3a1e08', edge: '#e07830', pip: '#ffaa60', inner: '#8a4818', glow: 'rgba(224,120,48,0.7)'  },
};

let activeSet = DIE_SETS[localStorage.getItem('ttdice_set') || 'forest'];

function setDieSet(key) {
  if (!DIE_SETS[key]) return;
  activeSet = DIE_SETS[key];
  localStorage.setItem('ttdice_set', key);
  renderLeftPanelPips();
  if (typeof renderTray === 'function') renderTray();
}

// ─── SVG builders — rendered from real 3D solids by dice3d.js ───
// val=null shows die label, val=number shows result, q (quaternion) = mid-tumble pose.
const svgD4   = (c, val, q, h) => TTDice3D.svgDie(4,   c, val, q, null, h);
const svgD6   = (c, val, q, h) => TTDice3D.svgDie(6,   c, val, q, null, h);
const svgD8   = (c, val, q, h) => TTDice3D.svgDie(8,   c, val, q, null, h);
const svgD10  = (c, val, q, h) => TTDice3D.svgDie(10,  c, val, q, null, h);
const svgD12  = (c, val, q, h) => TTDice3D.svgDie(12,  c, val, q, null, h);
const svgD20  = (c, val, q, h) => TTDice3D.svgDie(20,  c, val, q, null, h);
const svgD100 = (c, val, q, h) => TTDice3D.svgDie(100, c, val, q, null, h);

const SVG_FNS = { 4: svgD4, 6: svgD6, 8: svgD8, 10: svgD10, 12: svgD12, 20: svgD20, 100: svgD100 };

// ─── Build tray die element ───
function buildDieElement(sides, index) {
  const el = document.createElement('div');
  el.className     = 'tray-die';
  el.dataset.sides = String(sides);
  el.dataset.index = String(index);
  el.title         = `Click to remove d${sides}`;
  el.innerHTML = `<div class="die-svg-wrap">${(SVG_FNS[sides] || svgD20)(activeSet, null)}</div>`;
  return el;
}

// ─── Tray physics animation ───
let animationState = null;

function animateTray(diceEls, results, onComplete) {
  const tray = document.getElementById('diceTray');
  if (!tray || !diceEls.length) { onComplete && onComplete(); return; }

  const trayRect = tray.getBoundingClientRect();
  const dieSize  = 72;
  const padding  = 8;
  const W = tray.clientWidth;
  const H = tray.clientHeight;

  // Build physics state for each die
  const dice = diceEls.map((el, i) => {
    const sides = Number(el.dataset.sides);
    return {
      el, sides,
      result: results[i],
      x: padding + Math.random() * (W - dieSize - padding*2),
      y: padding + Math.random() * (H - dieSize - padding*2),
      vx: (Math.random() - 0.5) * 12,
      vy: (Math.random() - 0.5) * 12,
      tumble: TTDice3D.makeTumble(sides, results[i]),
      shown: results[i],
    };
  });

  // Switch tray to relative positioning for absolute die placement
  diceEls.forEach((el, i) => {
    el.style.position = 'absolute';
    el.style.width    = dieSize + 'px';
    el.style.height   = dieSize + 'px';
    el.style.left     = dice[i].x + 'px';
    el.style.top      = dice[i].y + 'px';
    el.style.transition = 'none';
  });

  const startTime = performance.now();
  const duration  = 1600;
  const settleAt  = 0.62; // free tumble until here, then ease into the result face
  let lastTime = startTime, lastFlick = 0;

  function frame(now) {
    const elapsed  = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const dt = now - lastTime; lastTime = now;
    // Ease out — slow down over time
    const speed = 1 - Math.pow(progress, 2);
    // Flicker fast, then slower while settling
    const flick = now - lastFlick > (progress < 0.7 ? 80 : 180);
    if (flick) lastFlick = now;

    dice.forEach((d, i) => {
      d.x += d.vx * speed;
      d.y += d.vy * speed;

      // Bounce off walls
      if (d.x < padding)           { d.x = padding;           d.vx = Math.abs(d.vx); }
      if (d.x > W - dieSize - padding) { d.x = W - dieSize - padding; d.vx = -Math.abs(d.vx); }
      if (d.y < padding)           { d.y = padding;           d.vy = Math.abs(d.vy); }
      if (d.y > H - dieSize - padding) { d.y = H - dieSize - padding; d.vy = -Math.abs(d.vy); }

      // 3D tumble
      if (progress < settleAt) d.tumble.step(dt, 1 - Math.pow(progress / settleAt, 2) * 0.85);
      else d.tumble.settle((progress - settleAt) / (1 - settleAt));
      if (flick) d.shown = Math.floor(Math.random() * d.sides) + 1;

      d.el.style.left = d.x + 'px';
      d.el.style.top  = d.y + 'px';
      d.el.querySelector('.die-svg-wrap').innerHTML =
        (SVG_FNS[d.sides] || svgD20)(activeSet, d.shown, d.tumble.quat(), TTDice3D.heightAt(progress));
    });

    if (progress < 1) {
      requestAnimationFrame(frame);
    } else {
      setTimeout(() => {
        // Show results
        diceEls.forEach((el, i) => {
          const sides = dice[i].sides;
          el.querySelector('.die-svg-wrap').innerHTML =
            (SVG_FNS[sides] || svgD20)(activeSet, dice[i].result, dice[i].tumble.quat());
          el.classList.add('die-landed');
          if (sides === 20 && dice[i].result === 20) el.classList.add('die-nat20');
          if (sides === 20 && dice[i].result === 1)  el.classList.add('die-nat1');
        });

        // Reset to flow layout
        setTimeout(() => {
          diceEls.forEach(el => {
            el.style.position  = '';
            el.style.left      = '';
            el.style.top       = '';
            el.style.width     = '';
            el.style.height    = '';
            el.style.transition = '';
            el.style.transform = '';
          });
          onComplete && onComplete();
        }, 350);
      }, 100);
    }
  }

  requestAnimationFrame(frame);
}

// ─── Render left panel pips ───
function renderLeftPanelPips() {
  [4, 6, 8, 10, 12, 20, 100].forEach(sides => {
    const el = document.getElementById(`pip-${sides}`);
    if (!el) return;
    el.innerHTML = (SVG_FNS[sides] || svgD20)(activeSet, null);
  });
}

// ─── Set picker ───
function initSetPicker() {
  const swatchContainer = document.getElementById('setSwatches');
  const nameLabel       = document.getElementById('setNameLabel');
  if (!swatchContainer) return;

  const savedKey = localStorage.getItem('ttdice_set') || 'forest';

  swatchContainer.innerHTML = Object.entries(DIE_SETS).map(([key, set]) => `
    <button
      class="set-swatch ${key === savedKey ? 'active' : ''}"
      data-set="${key}"
      title="${set.name}"
      style="--swatch-edge:${set.edge};--swatch-body:${set.body};"
    >
      <svg viewBox="-55 -55 110 110" xmlns="http://www.w3.org/2000/svg" width="22" height="22">
        <polygon points="0,-48 41.6,-24 41.6,24 0,48 -41.6,24 -41.6,-24" fill="${set.body}" stroke="${set.edge}" stroke-width="4"/>
        <polygon points="0,-20 22,14 -22,14" fill="${set.body}" stroke="${set.inner}" stroke-width="2"/>
      </svg>
    </button>`).join('');

  if (nameLabel) nameLabel.textContent = DIE_SETS[savedKey].name;

  swatchContainer.querySelectorAll('.set-swatch').forEach(btn => {
    btn.addEventListener('click', () => {
      swatchContainer.querySelectorAll('.set-swatch').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const key = btn.dataset.set;
      if (nameLabel) nameLabel.textContent = DIE_SETS[key].name;
      setDieSet(key);
    });
  });

  renderLeftPanelPips();
}

document.addEventListener('DOMContentLoaded', initSetPicker);