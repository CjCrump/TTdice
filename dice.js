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

// ─── SVG builders — new mathematically correct shapes ───
// Each returns full SVG string. val=null shows die label, val=number shows result.

function svgD4(c, val) {
  const label = val !== null && val !== undefined ? val : 'd4';
  return `<svg viewBox="-58 -58 116 116" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
    <g transform="rotate(-8)">
      <polygon points="10,-48 50,10 5,52 -50,8" fill="rgba(0,0,0,0.45)" transform="translate(3,4)"/>
      <polygon points="10,-48 5,52 -50,8" fill="${c.face}" stroke="none"/>
      <polygon points="10,-48 50,10 5,52" fill="${c.body}" stroke="none"/>
      <line x1="10" y1="-48" x2="5" y2="52" stroke="${c.inner}" stroke-width="1.8"/>
      <polygon points="10,-48 50,10 5,52 -50,8" fill="none" stroke="${c.edge}" stroke-width="3" stroke-linejoin="round"/>
      <text x="22" y="6" text-anchor="middle" dominant-baseline="central"
        font-family="Georgia,serif" font-size="26" font-weight="900" fill="${c.pip}">${label}</text>
    </g>
  </svg>`;
}

function svgD6(c, val) {
  const label = val !== null && val !== undefined ? val : 'd6';
  return `<svg viewBox="-55 -55 110 110" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
    <polygon points="0,-46 40,-23 40,23 0,46 -40,23 -40,-23" fill="rgba(0,0,0,0.45)" transform="translate(3,4)"/>
    <polygon points="0,-46 40,-23 0,0 -40,-23" fill="${c.face}" stroke="none"/>
    <polygon points="40,-23 0,0 0,46 40,23"    fill="${c.face}" stroke="none"/>
    <polygon points="-40,-23 0,0 0,46 -40,23"  fill="${c.body}" stroke="none"/>
    <line x1="0" y1="0" x2="40"  y2="-23" stroke="${c.inner}" stroke-width="1.8"/>
    <line x1="0" y1="0" x2="-40" y2="-23" stroke="${c.inner}" stroke-width="1.8"/>
    <line x1="0" y1="0" x2="0"   y2="46"  stroke="${c.inner}" stroke-width="1.8"/>
    <polygon points="0,-46 40,-23 40,23 0,46 -40,23 -40,-23" fill="none" stroke="${c.edge}" stroke-width="3" stroke-linejoin="round"/>
    <text x="-20" y="11" text-anchor="middle" dominant-baseline="central"
      font-family="Georgia,serif" font-size="26" font-weight="900" fill="${c.pip}">${label}</text>
  </svg>`;
}

function svgD8(c, val) {
  const label = val !== null && val !== undefined ? val : 'd8';
  return `<svg viewBox="-52 -58 104 116" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
    <polygon points="0,-52 40,-18 40,18 0,52 -40,18 -40,-18" fill="rgba(0,0,0,0.45)" transform="translate(3,4)"/>
    <polygon points="0,-52 -40,-18 40,-18"  fill="${c.face}" stroke="none"/>
    <polygon points="-40,-18 -40,18 0,52"   fill="${c.face}" stroke="none"/>
    <polygon points="40,-18 40,18 0,52"     fill="${c.face}" stroke="none"/>
    <polygon points="-40,-18 40,-18 0,52"   fill="${c.body}" stroke="none"/>
    <polygon points="-40,-18 -40,18 0,52"   fill="${c.face}" stroke="none"/>
    <polygon points="40,-18 40,18 0,52"     fill="${c.face}" stroke="none"/>
    <line x1="-40" y1="-18" x2="40"  y2="-18" stroke="${c.inner}" stroke-width="1.8"/>
    <line x1="-40" y1="-18" x2="0"   y2="52"  stroke="${c.inner}" stroke-width="1.8"/>
    <line x1="40"  y1="-18" x2="0"   y2="52"  stroke="${c.inner}" stroke-width="1.8"/>
    <polygon points="0,-52 40,-18 40,18 0,52 -40,18 -40,-18" fill="none" stroke="${c.edge}" stroke-width="3" stroke-linejoin="round"/>
    <text x="0" y="8" text-anchor="middle" dominant-baseline="central"
      font-family="Georgia,serif" font-size="26" font-weight="900" fill="${c.pip}">${label}</text>
  </svg>`;
}

function svgD10(c, val) {
  const label = val !== null && val !== undefined ? val : 'd10';
  return `<svg viewBox="-52 -58 104 116" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
    <polygon points="0,-54 44,0 0,54 -44,0" fill="rgba(0,0,0,0.45)" transform="translate(3,4)"/>
    <polygon points="0,-54 -24,0 0,10 24,0"  fill="${c.body}" stroke="none"/>
    <polygon points="0,-54 -44,0 -24,0"      fill="${c.face}" stroke="none"/>
    <polygon points="0,-54 44,0 24,0"        fill="${c.face}" stroke="none"/>
    <polygon points="-44,0 0,54 0,10 -24,0" fill="${c.face}" stroke="none"/>
    <polygon points="44,0 0,54 0,10 24,0"   fill="${c.face}" stroke="none"/>
    <line x1="0"   y1="-54" x2="-24" y2="0"  stroke="${c.inner}" stroke-width="1.8"/>
    <line x1="0"   y1="-54" x2="24"  y2="0"  stroke="${c.inner}" stroke-width="1.8"/>
    <line x1="-24" y1="0"   x2="0"   y2="10" stroke="${c.inner}" stroke-width="1.8"/>
    <line x1="24"  y1="0"   x2="0"   y2="10" stroke="${c.inner}" stroke-width="1.8"/>
    <line x1="-44" y1="0"   x2="-24" y2="0"  stroke="${c.inner}" stroke-width="1.8"/>
    <line x1="44"  y1="0"   x2="24"  y2="0"  stroke="${c.inner}" stroke-width="1.8"/>
    <line x1="0"   y1="10"  x2="0"   y2="54" stroke="${c.inner}" stroke-width="1.8"/>
    <polygon points="0,-54 44,0 0,54 -44,0" fill="none" stroke="${c.edge}" stroke-width="3" stroke-linejoin="round"/>
    <text x="0" y="-16" text-anchor="middle" dominant-baseline="central"
      font-family="Georgia,serif" font-size="22" font-weight="900" fill="${c.pip}">${label}</text>
  </svg>`;
}

function svgD12(c, val) {
  const label = val !== null && val !== undefined ? val : 'd12';
  return `<svg viewBox="-55 -55 110 110" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
    <polygon points="0,-48 45.6,-14.8 28.2,38.8 -28.2,38.8 -45.6,-14.8" fill="rgba(0,0,0,0.45)" transform="translate(3,4)"/>
    <polygon points="0,-48 45.6,-14.8 22.8,-7.4 0,-24 -22.8,-7.4 -45.6,-14.8" fill="${c.face}" stroke="none"/>
    <polygon points="45.6,-14.8 28.2,38.8 14.1,19.4 22.8,-7.4"  fill="${c.face}" stroke="none"/>
    <polygon points="28.2,38.8 -28.2,38.8 -14.1,19.4 0,6 14.1,19.4" fill="${c.face}" stroke="none"/>
    <polygon points="-28.2,38.8 -45.6,-14.8 -22.8,-7.4 -14.1,19.4" fill="${c.face}" stroke="none"/>
    <polygon points="0,-24 22.8,-7.4 14.1,19.4 -14.1,19.4 -22.8,-7.4" fill="${c.body}" stroke="none"/>
    <line x1="0"     y1="-48"   x2="0"     y2="-24"   stroke="${c.inner}" stroke-width="1.8"/>
    <line x1="45.6"  y1="-14.8" x2="22.8"  y2="-7.4"  stroke="${c.inner}" stroke-width="1.8"/>
    <line x1="28.2"  y1="38.8"  x2="14.1"  y2="19.4"  stroke="${c.inner}" stroke-width="1.8"/>
    <line x1="-28.2" y1="38.8"  x2="-14.1" y2="19.4"  stroke="${c.inner}" stroke-width="1.8"/>
    <line x1="-45.6" y1="-14.8" x2="-22.8" y2="-7.4"  stroke="${c.inner}" stroke-width="1.8"/>
    <polygon points="0,-24 22.8,-7.4 14.1,19.4 -14.1,19.4 -22.8,-7.4"
      fill="none" stroke="${c.inner}" stroke-width="1.8" stroke-linejoin="round"/>
    <polygon points="0,-48 45.6,-14.8 28.2,38.8 -28.2,38.8 -45.6,-14.8"
      fill="none" stroke="${c.edge}" stroke-width="3" stroke-linejoin="round"/>
    <text x="0" y="4" text-anchor="middle" dominant-baseline="central"
      font-family="Georgia,serif" font-size="20" font-weight="900" fill="${c.pip}">${label}</text>
  </svg>`;
}

function svgD20(c, val) {
  const label = val !== null && val !== undefined ? val : 'd20';
  const pipColor = val === 20 ? '#ffe060' : val === 1 ? '#ff6060' : c.pip;
  return `<svg viewBox="-55 -55 110 110" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
    <polygon points="0,-48 41.6,-24 41.6,24 0,48 -41.6,24 -41.6,-24" fill="rgba(0,0,0,0.45)" transform="translate(3,4)"/>
    <polygon points="0,-48 -41.6,-24 0,-20"  fill="${c.face}" stroke="none"/>
    <polygon points="0,-48 41.6,-24 0,-20"   fill="${c.face}" stroke="none"/>
    <polygon points="41.6,-24 41.6,24 22,14" fill="${c.face}" stroke="none"/>
    <polygon points="41.6,-24 0,-20 22,14"   fill="${c.face}" stroke="none"/>
    <polygon points="-41.6,-24 0,-20 -22,14" fill="${c.face}" stroke="none"/>
    <polygon points="-41.6,-24 -41.6,24 -22,14" fill="${c.face}" stroke="none"/>
    <polygon points="41.6,24 0,48 22,14"     fill="${c.face}" stroke="none"/>
    <polygon points="-41.6,24 0,48 -22,14"  fill="${c.face}" stroke="none"/>
    <polygon points="0,48 22,14 -22,14"      fill="${c.face}" stroke="none"/>
    <polygon points="0,-20 22,14 -22,14"     fill="${c.body}" stroke="none"/>
    <line x1="0"     y1="-48" x2="0"     y2="-20" stroke="${c.inner}" stroke-width="1.5"/>
    <line x1="41.6"  y1="-24" x2="0"     y2="-20" stroke="${c.inner}" stroke-width="1.5"/>
    <line x1="-41.6" y1="-24" x2="0"     y2="-20" stroke="${c.inner}" stroke-width="1.5"/>
    <line x1="41.6"  y1="-24" x2="22"    y2="14"  stroke="${c.inner}" stroke-width="1.5"/>
    <line x1="41.6"  y1="24"  x2="22"    y2="14"  stroke="${c.inner}" stroke-width="1.5"/>
    <line x1="-41.6" y1="-24" x2="-22"   y2="14"  stroke="${c.inner}" stroke-width="1.5"/>
    <line x1="-41.6" y1="24"  x2="-22"   y2="14"  stroke="${c.inner}" stroke-width="1.5"/>
    <line x1="0"     y1="48"  x2="22"    y2="14"  stroke="${c.inner}" stroke-width="1.5"/>
    <line x1="0"     y1="48"  x2="-22"   y2="14"  stroke="${c.inner}" stroke-width="1.5"/>
    <line x1="0"     y1="-20" x2="22"    y2="14"  stroke="${c.inner}" stroke-width="1.5"/>
    <line x1="0"     y1="-20" x2="-22"   y2="14"  stroke="${c.inner}" stroke-width="1.5"/>
    <line x1="22"    y1="14"  x2="-22"   y2="14"  stroke="${c.inner}" stroke-width="1.5"/>
    <polygon points="0,-48 41.6,-24 41.6,24 0,48 -41.6,24 -41.6,-24"
      fill="none" stroke="${c.edge}" stroke-width="3" stroke-linejoin="round"/>
    <text x="0" y="0" text-anchor="middle" dominant-baseline="central"
      font-family="Georgia,serif" font-size="18" font-weight="900" fill="${pipColor}">${label}</text>
  </svg>`;
}

function svgD100(c, val) {
  // Two d10 shapes side by side
  const tens = val !== null && val !== undefined ? (val === 100 ? '00' : String(Math.floor((val-1)/10)*10+10).padStart(2,'0')) : 'd%';
  const ones = val !== null && val !== undefined ? (val === 100 ? '00' : String(val % 10 === 0 ? 10 : val % 10)) : '';
  const result = val !== null && val !== undefined ? val : '';

  const d10shape = (label) => `
    <polygon points="0,-38 31,0 0,38 -31,0" fill="rgba(0,0,0,0.45)" transform="translate(2,3)"/>
    <polygon points="0,-38 -17,0 0,7 17,0"  fill="${c.body}" stroke="none"/>
    <polygon points="0,-38 -31,0 -17,0"     fill="${c.face}" stroke="none"/>
    <polygon points="0,-38 31,0 17,0"       fill="${c.face}" stroke="none"/>
    <polygon points="-31,0 0,38 0,7 -17,0" fill="${c.face}" stroke="none"/>
    <polygon points="31,0 0,38 0,7 17,0"   fill="${c.face}" stroke="none"/>
    <line x1="0"   y1="-38" x2="-17" y2="0"  stroke="${c.inner}" stroke-width="1.4"/>
    <line x1="0"   y1="-38" x2="17"  y2="0"  stroke="${c.inner}" stroke-width="1.4"/>
    <line x1="-17" y1="0"   x2="0"   y2="7"  stroke="${c.inner}" stroke-width="1.4"/>
    <line x1="17"  y1="0"   x2="0"   y2="7"  stroke="${c.inner}" stroke-width="1.4"/>
    <line x1="-31" y1="0"   x2="-17" y2="0"  stroke="${c.inner}" stroke-width="1.4"/>
    <line x1="31"  y1="0"   x2="17"  y2="0"  stroke="${c.inner}" stroke-width="1.4"/>
    <line x1="0"   y1="7"   x2="0"   y2="38" stroke="${c.inner}" stroke-width="1.4"/>
    <polygon points="0,-38 31,0 0,38 -31,0" fill="none" stroke="${c.edge}" stroke-width="2.5" stroke-linejoin="round"/>
    <text x="0" y="-11" text-anchor="middle" dominant-baseline="central"
      font-family="Georgia,serif" font-size="12" font-weight="900" fill="${c.pip}">${label}</text>`;

  return `<svg viewBox="-90 -45 180 90" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
    <g transform="translate(-44,0)">${d10shape(tens)}</g>
    <text x="0" y="0" text-anchor="middle" dominant-baseline="central"
      font-family="Georgia,serif" font-size="16" font-weight="900" fill="${c.pip}">${result}</text>
    <g transform="translate(44,0)">${d10shape(ones)}</g>
  </svg>`;
}

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
      angle: Math.random() * 360,
      spin: (Math.random() - 0.5) * 20,
    };
  });

  // Switch tray to relative positioning for absolute die placement
  diceEls.forEach((el, i) => {
    el.style.position = 'absolute';
    el.style.width    = dieSize + 'px';
    el.style.height   = dieSize + 'px';
    el.style.left     = dice[i].x + 'px';
    el.style.top      = dice[i].y + 'px';
    el.style.transform = `rotate(${dice[i].angle}deg)`;
    el.style.transition = 'none';
  });

  const startTime = performance.now();
  const duration  = 1600;
  let flickerInterval = null;
  const flickerSides = [4,6,8,10,12,20];

  // Flicker numbers during roll
  flickerInterval = setInterval(() => {
    diceEls.forEach((el, i) => {
      const sides = dice[i].sides;
      const fakeVal = Math.floor(Math.random() * sides) + 1;
      el.querySelector('.die-svg-wrap').innerHTML =
        (SVG_FNS[sides] || svgD20)(activeSet, fakeVal);
    });
  }, 80);

  function frame(now) {
    const elapsed  = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // Ease out — slow down over time
    const speed = 1 - Math.pow(progress, 2);

    dice.forEach((d, i) => {
      d.x += d.vx * speed;
      d.y += d.vy * speed;
      d.angle += d.spin * speed;

      // Bounce off walls
      if (d.x < padding)           { d.x = padding;           d.vx = Math.abs(d.vx); }
      if (d.x > W - dieSize - padding) { d.x = W - dieSize - padding; d.vx = -Math.abs(d.vx); }
      if (d.y < padding)           { d.y = padding;           d.vy = Math.abs(d.vy); }
      if (d.y > H - dieSize - padding) { d.y = H - dieSize - padding; d.vy = -Math.abs(d.vy); }

      d.el.style.left      = d.x + 'px';
      d.el.style.top       = d.y + 'px';
      d.el.style.transform = `rotate(${d.angle}deg)`;
    });

    // Slow flicker as settling
    if (progress > 0.7 && flickerInterval) {
      clearInterval(flickerInterval);
      flickerInterval = null;
      flickerInterval = setInterval(() => {
        diceEls.forEach((el, i) => {
          const sides = dice[i].sides;
          const fakeVal = Math.floor(Math.random() * sides) + 1;
          el.querySelector('.die-svg-wrap').innerHTML =
            (SVG_FNS[sides] || svgD20)(activeSet, fakeVal);
        });
      }, 180);
    }

    if (progress < 1) {
      requestAnimationFrame(frame);
    } else {
      // Settle — show results, reset to centered layout
      clearInterval(flickerInterval);

      // Animate to final centered positions
      diceEls.forEach((el, i) => {
        el.style.transition = 'all 0.3s ease-out';
        el.style.transform  = 'rotate(0deg)';
      });

      setTimeout(() => {
        // Show results
        diceEls.forEach((el, i) => {
          const sides = dice[i].sides;
          el.querySelector('.die-svg-wrap').innerHTML =
            (SVG_FNS[sides] || svgD20)(activeSet, dice[i].result);
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