/* ═══════════════════════════════════════
   TTDice — SVG Dice Library v2
   Unified die sets with color picker
═══════════════════════════════════════ */

// ─── Die Set Color Presets ───
const DIE_SETS = {
  forest:   { name: 'Forest',   face: '#0d1f10', body: '#1a3d1e', edge: '#c9a84c', pip: '#e8c56a', glow: 'rgba(201,168,76,0.7)'  },
  obsidian: { name: 'Obsidian', face: '#0a0a0f', body: '#1a1a2e', edge: '#a0a8d0', pip: '#c8d0f0', glow: 'rgba(160,168,208,0.7)' },
  blood:    { name: 'Blood',    face: '#1a0808', body: '#3a1010', edge: '#cc4444', pip: '#ff8888', glow: 'rgba(204,68,68,0.7)'    },
  ocean:    { name: 'Ocean',    face: '#081418', body: '#0e2a38', edge: '#4aa8c8', pip: '#88d8f0', glow: 'rgba(74,168,200,0.7)'   },
  amethyst: { name: 'Amethyst', face: '#120a18', body: '#2a1040', edge: '#9b5fd4', pip: '#c88ef0', glow: 'rgba(155,95,212,0.7)'  },
  bone:     { name: 'Bone',     face: '#1a1810', body: '#2e2a1e', edge: '#d4c890', pip: '#f0e8b8', glow: 'rgba(212,200,144,0.7)' },
  ember:    { name: 'Ember',    face: '#180e06', body: '#3a1e08', edge: '#e07830', pip: '#ffaa60', glow: 'rgba(224,120,48,0.7)'  },
};

// ─── Active set — loaded from localStorage or default ───
let activeSet = DIE_SETS[localStorage.getItem('ttdice_set') || 'forest'];

function setDieSet(key) {
  if (!DIE_SETS[key]) return;
  activeSet = DIE_SETS[key];
  localStorage.setItem('ttdice_set', key);
  // Re-render tray with new colors
  if (typeof renderTray === 'function') renderTray();
}

// ─── SVG shape builders ───
// Each returns an SVG string given colors + optional result value

function svgD4(c, val) {
  const txt = val
    ? `<text x="40" y="54" text-anchor="middle" dominant-baseline="central"
        font-family="'Cinzel',serif" font-size="18" font-weight="700"
        fill="${c.pip}">${val}</text>`
    : `<text x="40" y="53" text-anchor="middle" dominant-baseline="central"
        font-family="'Cinzel',serif" font-size="10" font-weight="600"
        fill="${c.edge}" opacity="0.85" letter-spacing="1">d4</text>`;
  return `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="g4" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${c.body}"/>
        <stop offset="100%" stop-color="${c.face}"/>
      </linearGradient>
      <filter id="f4"><feGaussianBlur stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    </defs>
    <polygon points="40,8 72,69 8,69" fill="rgba(0,0,0,0.5)" transform="translate(2,3)"/>
    <polygon points="40,8 72,69 8,69" fill="url(#g4)" stroke="${c.edge}" stroke-width="1.5"/>
    <polygon points="40,20 62,62 18,62" fill="none" stroke="${c.edge}" stroke-width="0.6" opacity="0.35"/>
    <line x1="40" y1="8" x2="40" y2="20" stroke="${c.edge}" stroke-width="0.5" opacity="0.3"/>
    <line x1="72" y1="69" x2="62" y2="62" stroke="${c.edge}" stroke-width="0.5" opacity="0.3"/>
    <line x1="8" y1="69" x2="18" y2="62" stroke="${c.edge}" stroke-width="0.5" opacity="0.3"/>
    <g filter="url(#f4)">${txt}</g>
  </svg>`;
}

function svgD6(c, val) {
  const pipPos = {
    1: [[40,40]],
    2: [[26,26],[54,54]],
    3: [[26,26],[40,40],[54,54]],
    4: [[26,26],[54,26],[26,54],[54,54]],
    5: [[26,26],[54,26],[40,40],[26,54],[54,54]],
    6: [[26,22],[54,22],[26,40],[54,40],[26,58],[54,58]],
  };
  const inner = val && pipPos[val]
    ? `<g filter="url(#f6)">${pipPos[val].map(([x,y]) =>
        `<circle cx="${x}" cy="${y}" r="4.5" fill="${c.pip}"/>`).join('')}</g>`
    : `<text x="40" y="42" text-anchor="middle" dominant-baseline="central"
        font-family="'Cinzel',serif" font-size="10" font-weight="600"
        fill="${c.edge}" opacity="0.85" letter-spacing="1">d6</text>`;
  return `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="g6" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${c.body}"/>
        <stop offset="100%" stop-color="${c.face}"/>
      </linearGradient>
      <filter id="f6"><feGaussianBlur stdDeviation="1.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    </defs>
    <rect x="9" y="9" width="62" height="62" rx="9" fill="rgba(0,0,0,0.5)" transform="translate(2,3)"/>
    <rect x="9" y="9" width="62" height="62" rx="9" fill="url(#g6)" stroke="${c.edge}" stroke-width="1.5"/>
    <rect x="14" y="14" width="52" height="52" rx="6" fill="none" stroke="${c.edge}" stroke-width="0.5" opacity="0.25"/>
    ${inner}
  </svg>`;
}

function svgD8(c, val) {
  const txt = val
    ? `<text x="40" y="44" text-anchor="middle" dominant-baseline="central"
        font-family="'Cinzel',serif" font-size="${val>9?'18':'22'}" font-weight="700"
        fill="${c.pip}">${val}</text>`
    : `<text x="40" y="44" text-anchor="middle" dominant-baseline="central"
        font-family="'Cinzel',serif" font-size="10" font-weight="600"
        fill="${c.edge}" opacity="0.85" letter-spacing="1">d8</text>`;
  return `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="g8" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${c.body}"/>
        <stop offset="100%" stop-color="${c.face}"/>
      </linearGradient>
      <filter id="f8"><feGaussianBlur stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    </defs>
    <polygon points="40,5 70,22 74,52 56,73 24,73 6,52 10,22" fill="rgba(0,0,0,0.5)" transform="translate(2,3)"/>
    <polygon points="40,5 70,22 74,52 56,73 24,73 6,52 10,22" fill="url(#g8)" stroke="${c.edge}" stroke-width="1.5"/>
    <polygon points="40,14 62,27 65,50 51,66 29,66 15,50 18,27" fill="none" stroke="${c.edge}" stroke-width="0.5" opacity="0.25"/>
    <line x1="6" y1="52" x2="74" y2="52" stroke="${c.edge}" stroke-width="0.4" opacity="0.2"/>
    <g filter="url(#f8)">${txt}</g>
  </svg>`;
}

function svgD10(c, val) {
  const txt = val
    ? `<text x="40" y="47" text-anchor="middle" dominant-baseline="central"
        font-family="'Cinzel',serif" font-size="${val>9?'18':'22'}" font-weight="700"
        fill="${c.pip}">${val}</text>`
    : `<text x="40" y="47" text-anchor="middle" dominant-baseline="central"
        font-family="'Cinzel',serif" font-size="10" font-weight="600"
        fill="${c.edge}" opacity="0.85" letter-spacing="1">d10</text>`;
  return `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="g10" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${c.body}"/>
        <stop offset="100%" stop-color="${c.face}"/>
      </linearGradient>
      <filter id="f10"><feGaussianBlur stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    </defs>
    <polygon points="40,4 74,34 62,74 18,74 6,34" fill="rgba(0,0,0,0.5)" transform="translate(2,3)"/>
    <polygon points="40,4 74,34 62,74 18,74 6,34" fill="url(#g10)" stroke="${c.edge}" stroke-width="1.5"/>
    <polygon points="40,14 66,36 56,67 24,67 14,36" fill="none" stroke="${c.edge}" stroke-width="0.5" opacity="0.25"/>
    <line x1="40" y1="4" x2="40" y2="14" stroke="${c.edge}" stroke-width="0.5" opacity="0.3"/>
    <g filter="url(#f10)">${txt}</g>
  </svg>`;
}

function svgD12(c, val) {
  const txt = val
    ? `<text x="40" y="42" text-anchor="middle" dominant-baseline="central"
        font-family="'Cinzel',serif" font-size="${val>9?'19':'23'}" font-weight="700"
        fill="${c.pip}">${val}</text>`
    : `<text x="40" y="42" text-anchor="middle" dominant-baseline="central"
        font-family="'Cinzel',serif" font-size="10" font-weight="600"
        fill="${c.edge}" opacity="0.85" letter-spacing="1">d12</text>`;
  return `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="g12" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${c.body}"/>
        <stop offset="100%" stop-color="${c.face}"/>
      </linearGradient>
      <filter id="f12"><feGaussianBlur stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    </defs>
    <polygon points="40,5 66,14 76,40 66,66 40,75 14,66 4,40 14,14" fill="rgba(0,0,0,0.5)" transform="translate(2,3)"/>
    <polygon points="40,5 66,14 76,40 66,66 40,75 14,66 4,40 14,14" fill="url(#g12)" stroke="${c.edge}" stroke-width="1.5"/>
    <polygon points="40,14 60,21 68,40 60,59 40,66 20,59 12,40 20,21" fill="none" stroke="${c.edge}" stroke-width="0.5" opacity="0.25"/>
    <g filter="url(#f12)">${txt}</g>
  </svg>`;
}

function svgD20(c, val) {
  const isNat20 = val === 20;
  const isNat1  = val === 1;
  const pipColor = isNat20 ? '#ffe060' : isNat1 ? '#ff6060' : c.pip;
  const txt = val
    ? `<text x="40" y="52" text-anchor="middle" dominant-baseline="central"
        font-family="'Cinzel',serif" font-size="${val>9?'19':'23'}" font-weight="700"
        fill="${pipColor}">${val}</text>`
    : `<text x="40" y="52" text-anchor="middle" dominant-baseline="central"
        font-family="'Cinzel',serif" font-size="10" font-weight="600"
        fill="${c.edge}" opacity="0.85" letter-spacing="1">d20</text>`;
  return `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="g20" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${c.body}"/>
        <stop offset="100%" stop-color="${c.face}"/>
      </linearGradient>
      <filter id="f20"><feGaussianBlur stdDeviation="${isNat20?'4':'2.5'}" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    </defs>
    <polygon points="40,5 76,68 4,68" fill="rgba(0,0,0,0.5)" transform="translate(2,3)"/>
    <polygon points="40,5 76,68 4,68" fill="url(#g20)" stroke="${c.edge}" stroke-width="1.8"/>
    <polygon points="40,26 60,62 20,62" fill="none" stroke="${c.edge}" stroke-width="0.8" opacity="0.4"/>
    <line x1="40" y1="5"  x2="40" y2="26" stroke="${c.edge}" stroke-width="0.5" opacity="0.3"/>
    <line x1="76" y1="68" x2="60" y2="62" stroke="${c.edge}" stroke-width="0.5" opacity="0.3"/>
    <line x1="4"  y1="68" x2="20" y2="62" stroke="${c.edge}" stroke-width="0.5" opacity="0.3"/>
    <g filter="url(#f20)">${txt}</g>
  </svg>`;
}

function svgD100(c, val) {
  const txt = val
    ? `<text x="40" y="41" text-anchor="middle" dominant-baseline="central"
        font-family="'Cinzel',serif" font-size="${val===100?'13':val>9?'18':'22'}" font-weight="700"
        fill="${c.pip}">${val}</text>`
    : `<text x="40" y="41" text-anchor="middle" dominant-baseline="central"
        font-family="'Cinzel',serif" font-size="10" font-weight="600"
        fill="${c.edge}" opacity="0.85" letter-spacing="1">d%</text>`;
  return `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="g100" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${c.body}"/>
        <stop offset="100%" stop-color="${c.face}"/>
      </linearGradient>
      <filter id="f100"><feGaussianBlur stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    </defs>
    <circle cx="42" cy="43" r="32" fill="rgba(0,0,0,0.5)"/>
    <circle cx="40" cy="40" r="32" fill="url(#g100)" stroke="${c.edge}" stroke-width="1.5"/>
    <circle cx="40" cy="40" r="25" fill="none" stroke="${c.edge}" stroke-width="0.6" opacity="0.3"/>
    <circle cx="40" cy="40" r="16" fill="none" stroke="${c.edge}" stroke-width="0.4" opacity="0.15"/>
    <g filter="url(#f100)">${txt}</g>
  </svg>`;
}

const SVG_FNS = { 4: svgD4, 6: svgD6, 8: svgD8, 10: svgD10, 12: svgD12, 20: svgD20, 100: svgD100 };

// ─── Build a tray die element ───
function buildDieElement(sides, index) {
  const el = document.createElement('div');
  el.className     = 'tray-die';
  el.dataset.sides = String(sides);
  el.dataset.index = String(index);
  el.title         = `Click to remove d${sides}`;
  el.innerHTML = `
    <div class="die-svg-wrap die-face">${(SVG_FNS[sides] || svgD6)(activeSet, null)}</div>
    <div class="die-svg-wrap die-result-face" style="display:none;"></div>
  `;
  return el;
}

// ─── Animate roll + reveal ───
function animateDieResult(el, result) {
  const sides   = Number(el.dataset.sides);
  const face    = el.querySelector('.die-face');
  const resFace = el.querySelector('.die-result-face');
  const svgFn   = SVG_FNS[sides] || svgD6;

  resFace.innerHTML = svgFn(activeSet, result);

  el.classList.remove('die-rolling', 'die-landed', 'die-nat20', 'die-nat1');
  void el.offsetWidth;
  el.classList.add('die-rolling');

  setTimeout(() => {
    face.style.display    = 'none';
    resFace.style.display = '';
    el.classList.remove('die-rolling');
    el.classList.add('die-landed');
    if (sides === 20 && result === 20) el.classList.add('die-nat20');
    if (sides === 20 && result === 1)  el.classList.add('die-nat1');
  }, 580);
}

// ─── Inject color picker into left panel ───
function injectSetPicker() {
  const rack = document.querySelector('.preset-rack');
  if (!rack) return;

  const savedKey = localStorage.getItem('ttdice_set') || 'forest';

  const picker = document.createElement('div');
  picker.className = 'set-picker';
  picker.innerHTML = `
    <h2 class="section-label">Dice Set</h2>
    <div class="set-swatches">
      ${Object.entries(DIE_SETS).map(([key, set]) => `
        <button
          class="set-swatch ${key === savedKey ? 'active' : ''}"
          data-set="${key}"
          title="${set.name}"
          style="--swatch-edge: ${set.edge}; --swatch-body: ${set.body};"
        >
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="22" height="22">
            <polygon points="12,2 22,20 2,20" fill="${set.body}" stroke="${set.edge}" stroke-width="1.5"/>
            <polygon points="12,8 18,17 6,17" fill="none" stroke="${set.edge}" stroke-width="0.6" opacity="0.5"/>
          </svg>
        </button>`).join('')}
    </div>
    <p class="set-name-label" id="setNameLabel">${DIE_SETS[savedKey].name}</p>
  `;

  rack.after(picker);

  picker.querySelectorAll('.set-swatch').forEach(btn => {
    btn.addEventListener('click', () => {
      picker.querySelectorAll('.set-swatch').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const key = btn.dataset.set;
      document.getElementById('setNameLabel').textContent = DIE_SETS[key].name;
      setDieSet(key);
    });
  });
}

// ─── Init picker on DOM ready ───
document.addEventListener('DOMContentLoaded', injectSetPicker);