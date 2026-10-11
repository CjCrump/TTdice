/* ═══════════════════════════════════════
   TTDice — 3D SVG Dice Engine
   Real polyhedra, rotated by quaternion,
   projected to SVG every frame.
═══════════════════════════════════════ */
(function (root) {
  'use strict';

  const PHI = (1 + Math.sqrt(5)) / 2;
  let uid = 0;
  const D2R = Math.PI / 180;

  // ─── vec3 ───
  const sub   = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const add   = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  const scl   = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
  const dot   = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const len   = a => Math.hypot(a[0], a[1], a[2]);
  const norm  = a => scl(a, 1 / len(a));

  // ─── quaternion [w, x, y, z] ───
  const qMul = (a, b) => [
    a[0] * b[0] - a[1] * b[1] - a[2] * b[2] - a[3] * b[3],
    a[0] * b[1] + a[1] * b[0] + a[2] * b[3] - a[3] * b[2],
    a[0] * b[2] - a[1] * b[3] + a[2] * b[0] + a[3] * b[1],
    a[0] * b[3] + a[1] * b[2] - a[2] * b[1] + a[3] * b[0],
  ];
  const qNorm = q => { const l = Math.hypot(q[0], q[1], q[2], q[3]); return q.map(x => x / l); };
  const qAxis = (axis, deg) => {
    const h = deg * D2R / 2, s = Math.sin(h), n = norm(axis);
    return [Math.cos(h), n[0] * s, n[1] * s, n[2] * s];
  };
  function qToMat(q) {
    const [w, x, y, z] = q;
    return [
      [1 - 2 * (y * y + z * z), 2 * (x * y - w * z),     2 * (x * z + w * y)],
      [2 * (x * y + w * z),     1 - 2 * (x * x + z * z), 2 * (y * z - w * x)],
      [2 * (x * z - w * y),     2 * (y * z + w * x),     1 - 2 * (x * x + y * y)],
    ];
  }
  function qFromMat(m) {
    const tr = m[0][0] + m[1][1] + m[2][2];
    let w, x, y, z, s;
    if (tr > 0) {
      s = Math.sqrt(tr + 1) * 2;
      w = s / 4; x = (m[2][1] - m[1][2]) / s; y = (m[0][2] - m[2][0]) / s; z = (m[1][0] - m[0][1]) / s;
    } else if (m[0][0] > m[1][1] && m[0][0] > m[2][2]) {
      s = Math.sqrt(1 + m[0][0] - m[1][1] - m[2][2]) * 2;
      w = (m[2][1] - m[1][2]) / s; x = s / 4; y = (m[0][1] + m[1][0]) / s; z = (m[0][2] + m[2][0]) / s;
    } else if (m[1][1] > m[2][2]) {
      s = Math.sqrt(1 + m[1][1] - m[0][0] - m[2][2]) * 2;
      w = (m[0][2] - m[2][0]) / s; x = (m[0][1] + m[1][0]) / s; y = s / 4; z = (m[1][2] + m[2][1]) / s;
    } else {
      s = Math.sqrt(1 + m[2][2] - m[0][0] - m[1][1]) * 2;
      w = (m[1][0] - m[0][1]) / s; x = (m[0][2] + m[2][0]) / s; y = (m[1][2] + m[2][1]) / s; z = s / 4;
    }
    return qNorm([w, x, y, z]);
  }
  function qSlerp(a, b, t) {
    let d = a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
    if (d < 0) { b = b.map(x => -x); d = -d; }
    if (d > 0.9995) return qNorm(a.map((x, i) => x + (b[i] - x) * t));
    const th = Math.acos(d), sn = Math.sin(th);
    const wa = Math.sin((1 - t) * th) / sn, wb = Math.sin(t * th) / sn;
    return a.map((x, i) => x * wa + b[i] * wb);
  }
  function qRandom() {
    const u1 = Math.random(), u2 = Math.random() * 2 * Math.PI, u3 = Math.random() * 2 * Math.PI;
    const a = Math.sqrt(1 - u1), b = Math.sqrt(u1);
    return [a * Math.sin(u2), a * Math.cos(u2), b * Math.sin(u3), b * Math.cos(u3)];
  }
  const mApply = (m, v) => [dot(m[0], v), dot(m[1], v), dot(m[2], v)];

  // ─── color ───
  const hexRgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const mixHex = (a, b, t) => {
    const A = hexRgb(a), B = hexRgb(b);
    return '#' + A.map((x, i) => Math.round(x + (B[i] - x) * t).toString(16).padStart(2, '0')).join('');
  };

  // ─── convex hull faces from vertices (exact planes, no hand-placed faces) ───
  function hull(verts) {
    const faces = [], seen = new Set(), n = verts.length;
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) for (let k = j + 1; k < n; k++) {
      let N = cross(sub(verts[j], verts[i]), sub(verts[k], verts[i]));
      if (len(N) < 1e-9) continue;
      N = norm(N);
      const d = dot(N, verts[i]);
      let pos = 0, neg = 0;
      const on = [];
      verts.forEach((p, m) => {
        const s = dot(N, p) - d;
        if (s > 1e-6) pos++; else if (s < -1e-6) neg++; else on.push(m);
      });
      if (pos && neg) continue;
      if (pos) N = scl(N, -1);
      const key = on.join(',');
      if (seen.has(key)) continue;
      seen.add(key);
      const c = scl(on.reduce((a, m) => add(a, verts[m]), [0, 0, 0]), 1 / on.length);
      const e1 = norm(sub(verts[on[0]], c)), e2 = cross(N, e1);
      const ang = m => { const r = sub(verts[m], c); return Math.atan2(dot(r, e2), dot(r, e1)); };
      on.sort((a, b) => ang(a) - ang(b));
      faces.push({ idx: on, n: N, c });
    }
    return faces;
  }

  function segDist(p, a, b) {
    const ab = sub(b, a), t = Math.max(0, Math.min(1, dot(sub(p, a), ab) / dot(ab, ab)));
    return len(sub(p, add(a, scl(ab, t))));
  }

  // ─── solids (circumradius normalized to 1) ───
  function d10Verts() {
    const h = 1.15;
    const z0 = h * (1 - Math.cos(36 * D2R)) / (1 + Math.cos(36 * D2R)); // keeps each kite planar
    const v = [[0, 0, h], [0, 0, -h]];
    for (let k = 0; k < 5; k++) {
      const a = k * 72 * D2R, b = (k * 72 + 36) * D2R;
      v.push([Math.cos(a), Math.sin(a), z0], [Math.cos(b), Math.sin(b), -z0]);
    }
    return v;
  }
  function signs(base) {
    const out = [];
    const rec = (i, cur) => {
      if (i === 3) { out.push(cur); return; }
      if (base[i] === 0) rec(i + 1, [...cur, 0]);
      else { rec(i + 1, [...cur, base[i]]); rec(i + 1, [...cur, -base[i]]); }
    };
    rec(0, []);
    return out;
  }
  const cyc = p => [p, [p[1], p[2], p[0]], [p[2], p[0], p[1]]];

  const SOLIDS = {
    4:  { verts: [[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]], scale: 56, tilt: [0, 0], font: 1.25, vertexUp: true },
    6:  { verts: signs([1, 1, 1]),                                         scale: 60, tilt: [0, 0], font: 1.0 },
    8:  { verts: [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]], scale: 52, tilt: [0, 0], font: 1.2 },
    10: { verts: d10Verts(),                                               scale: 52, tilt: [0, 0],   font: 1.35 },
    12: { verts: [...signs([1, 1, 1]), ...cyc([0, 1 / PHI, PHI]).flatMap(signs)], scale: 50, tilt: [0, 0], font: 1.0 },
    20: { verts: cyc([0, 1, PHI]).flatMap(signs),                         scale: 50, tilt: [0, 0],  font: 1.25 },
  };

  const GEO = {};
  for (const sides of Object.keys(SOLIDS)) {
    const s = SOLIDS[sides];
    const R = Math.max(...s.verts.map(len));
    const verts = s.verts.map(p => scl(p, 1 / R));
    const faces = hull(verts);
    const F = faces.length;

    faces.forEach(f => {
      const pts = f.idx.map(i => verts[i]);
      const ds = pts.map(p => len(sub(p, f.c)));
      const regular = Math.max(...ds) - Math.min(...ds) < 1e-6;
      let up = regular && pts.length === 4
        ? sub(scl(add(pts[0], pts[1]), 0.5), f.c)
        : sub(pts[ds.indexOf(Math.max(...ds))], f.c);
      up = norm(sub(up, scl(f.n, dot(up, f.n))));
      f.up = up;
      f.right = cross(up, f.n);
      f.inr = Math.min(...pts.map((p, i) => segDist(f.c, p, pts[(i + 1) % pts.length])));
    });

    // numbers: opposite faces sum to F+1 where opposites exist
    const num = new Array(F).fill(0);
    let k = 1;
    faces.forEach((f, i) => {
      if (num[i]) return;
      num[i] = k;
      const j = faces.findIndex((g, jj) => !num[jj] && dot(g.n, f.n) < -0.999);
      if (j >= 0) num[j] = F + 1 - k;
      k++;
    });
    const byNum = {};
    faces.forEach((f, i) => { f.num = num[i]; byNum[num[i]] = i; });

    const qT = qMul(qAxis([0, 1, 0], s.tilt[1]), qAxis([1, 0, 0], s.tilt[0]));
    const light = norm([-0.3, 0.35, 1]);

    // d4 reads from the tip that points up: number the vertices 1..4 instead of faces
    const vertexUp = !!s.vertexUp;
    const vNum = verts.map((_, i) => i + 1);
    if (vertexUp) { for (const k in byNum) delete byNum[k]; vNum.forEach((n, i) => { byNum[n] = i; }); }
    GEO[sides] = { verts, faces, byNum, F, scale: s.scale, font: s.font, qT, light, vertexUp, vNum };
  }

  // ─── orientation helpers ───
  function restQuat(sides, value, twist = 0) {
    const g = GEO[sides];
    let qR;
    if (g.vertexUp) {
      // rest on the opposite face: winning tip points straight at the camera
      const vi = g.byNum[value] ?? 0, n = norm(g.verts[vi]);
      const o = g.verts[(vi + 1) % g.verts.length];
      const up = norm(sub(o, scl(n, dot(o, n))));
      qR = qFromMat([cross(up, n), up, n]);
    } else {
      const f = g.faces[g.byNum[value] ?? 0];
      qR = qFromMat([f.right, f.up, f.n]);
    }
    return qNorm(qMul(g.qT, qMul(qAxis([0, 0, 1], twist), qR)));
  }
  const idleQuat = sides => restQuat(sides, GEO[sides].vertexUp ? GEO[sides].verts.length : GEO[sides].F);

  // ─── render one die body (no <svg> wrapper) ───
  // o: { q, face (index, optional), text, pip, scale (optional) }
  function renderBody(sides, c, o) {
    const g = GEO[sides];
    const M = qToMat(o.q);
    const h = Math.max(0, o.h || 0);            // 0 = resting on felt, 1 = top of a bounce
    const S0 = o.scale || g.scale;
    const S = S0 * (1 + 0.22 * h);               // closer to camera = bigger
    const V = g.verts.map(p => mApply(M, p));
    const id = 'ttd' + (++uid);
    const P = p => `${(p[0] * S).toFixed(2)},${(-p[1] * S).toFixed(2)}`;
    const lit = mixHex(c.body, c.pip, 0.1);

    const vis = [];
    g.faces.forEach((f, i) => {
      const n = mApply(M, f.n);
      if (n[2] > 1e-4) vis.push({ f, i, n });
    });

    let focal = o.face;
    if (focal == null) focal = vis.reduce((b, v) => (v.n[2] > b.n[2] ? v : b), vis[0]).i;

    const edges = new Map();
    vis.forEach(({ f }) => f.idx.forEach((a, k) => {
      const b = f.idx[(k + 1) % f.idx.length];
      const key = a < b ? `${a}-${b}` : `${b}-${a}`;
      const e = edges.get(key);
      if (e) e.cnt++; else edges.set(key, { a, b, cnt: 1 });
    }));

    // shadow is the die's own outline, drawn at felt height: drifts away and softens as the die rises
    const Ps = p => `${(p[0] * S0).toFixed(2)},${(-p[1] * S0).toFixed(2)}`;
    const half = norm(add(g.light, [0, 0, 1]));
    let shadow = '', polys = '', gloss = '', inner = '', rim = '';
    vis.forEach(({ f, n }) => {
      const pts = f.idx.map(i => P(V[i])).join(' ');
      const t = Math.pow(Math.max(0, dot(n, g.light)), 3);
      shadow += `<polygon points="${f.idx.map(i => Ps(V[i])).join(' ')}"/>`;
      polys += `<polygon points="${pts}" fill="${mixHex(c.face, lit, 0.04 + 0.96 * t)}"/>`;
      // soft falloff across each face so it reads slightly rounded, plus a glint on the face nearest the light
      gloss += `<polygon points="${pts}" fill="url(#${id}g)"/>`;
      const sp = Math.pow(Math.max(0, dot(n, half)), 60);
      if (sp > 0.04) gloss += `<polygon points="${pts}" fill="url(#${id}s)" opacity="${Math.min(1, sp).toFixed(2)}"/>`;
    });
    edges.forEach(({ a, b, cnt }) => {
      const seg = `M${P(V[a])}L${P(V[b])}`;
      if (cnt === 1) { rim += seg; return; }
      // inner edges catch light on the lit side: brightness from the two faces that meet there
      const fs2 = vis.filter(({ f }) => f.idx.includes(a) && f.idx.includes(b));
      const en = norm(fs2.reduce((acc, { n }) => add(acc, n), [0, 0, 0]));
      const e = Math.max(0, dot(en, g.light));
      inner += `<path d="${seg}" stroke="${mixHex(c.inner, c.pip, Math.pow(e, 4) * 0.55)}"/>`;
    });
    const L2 = [g.light[0], -g.light[1]], Ll = Math.hypot(L2[0], L2[1]) || 1, ux = L2[0] / Ll, uy = L2[1] / Ll;
    const R = S * 1.05;
    const defs = `<defs>
      <filter id="${id}b" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${(1.8 + h * 5).toFixed(2)}"/></filter>
      <linearGradient id="${id}g" x1="${(0.5 + ux * 0.5).toFixed(3)}" y1="${(0.5 + uy * 0.5).toFixed(3)}" x2="${(0.5 - ux * 0.5).toFixed(3)}" y2="${(0.5 - uy * 0.5).toFixed(3)}">
        <stop offset="0" stop-color="#fff" stop-opacity="0.07"/><stop offset="0.6" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.14"/></linearGradient>
      <radialGradient id="${id}s" cx="${(0.5 + ux * 0.18).toFixed(3)}" cy="${(0.5 + uy * 0.18).toFixed(3)}" r="0.55">
        <stop offset="0" stop-color="#fff" stop-opacity="0.32"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
      <linearGradient id="${id}r" gradientUnits="userSpaceOnUse" x1="${(ux * R).toFixed(1)}" y1="${(uy * R).toFixed(1)}" x2="${(-ux * R).toFixed(1)}" y2="${(-uy * R).toFixed(1)}">
        <stop offset="0" stop-color="${mixHex(c.edge, '#ffffff', 0.45)}"/><stop offset="0.45" stop-color="${c.edge}"/><stop offset="1" stop-color="${mixHex(c.edge, '#000000', 0.35)}"/></linearGradient>
    </defs>`;
    const sl = Math.hypot(g.light[0], g.light[1]) || 1;
    const sdx = -g.light[0] / sl, sdy = g.light[1] / sl;   // shadow falls away from the light
    const off = 4 + h * 34;

    let text = '';
    if (g.vertexUp) {
      // d4: each face carries its three corner numbers, upright toward their corner.
      // The corner nearest the camera is the result and gets the bright pip color.
      const top = V.reduce((b, v, i) => (v[2] > V[b][2] ? i : b), 0);
      const dim = mixHex(c.pip, c.face, 0.5);
      vis.forEach(({ f }) => f.idx.forEach(vi => {
        const P0 = g.verts[vi], C0 = add(scl(f.c, 0.45), scl(P0, 0.55));
        const U0 = norm(sub(P0, f.c));
        const Ur = mApply(M, U0), Cc = mApply(M, C0);
        // screen-flat glyph, rotated so its top points at its corner (stays legible when the face is steep)
        const ang = Math.atan2(Ur[0], Ur[1]) * 180 / Math.PI;
        const hot = vi === top && (o.text !== '' && o.text != null);
        const fs = S * (hot ? 0.26 : 0.2);
        text += `<text transform="translate(${(S * Cc[0]).toFixed(2)},${(-S * Cc[1]).toFixed(2)}) rotate(${ang.toFixed(1)})" text-anchor="middle" dominant-baseline="central" font-family="Georgia,serif" font-size="${fs.toFixed(2)}" font-weight="900" fill="${hot ? (o.pip || c.pip) : dim}">${g.vNum[vi]}</text>`;
      }));
    } else if (o.text !== '' && o.text != null) {
      const f = g.faces[focal];
      const R = mApply(M, f.right), U = mApply(M, f.up), C = mApply(M, f.c);
      const str = String(o.text);
      const k = str.length === 1 ? 1 : str.length === 2 ? 0.78 : 0.56;
      const fs = (f.inr * g.font * k).toFixed(3);
      const mtx = [S * R[0], -S * R[1], -S * U[0], S * U[1], S * C[0], -S * C[1]].map(x => x.toFixed(3)).join(' ');
      const ul = str === '6' || str === '9' ? ' text-decoration="underline"' : '';
      text = `<text transform="matrix(${mtx})" text-anchor="middle" dominant-baseline="central" font-family="Georgia,serif" font-size="${fs}" font-weight="900" fill="${o.pip || c.pip}"${ul}>${str}</text>`;
    }

    return defs +
      `<g opacity="${(0.62 - h * 0.27).toFixed(2)}" fill="#000" filter="url(#${id}b)" transform="translate(${(sdx * off).toFixed(2)},${(sdy * off).toFixed(2)}) scale(${(1 + h * 0.06).toFixed(3)})">${shadow}</g>` +
      polys + gloss +
      `<g fill="none" stroke-width="1.5" stroke-linecap="round">${inner}</g>` +
      text +
      `<path d="${rim}" fill="none" stroke="url(#${id}r)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`;
  }

  const wrap = (vb, body) =>
    `<svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" overflow="visible" style="overflow:visible">${body}</svg>`;

  // ─── public: single die SVG ───
  // val: null = idle label, number = result. q optional (tumbling). label overrides idle text.
  function svgDie(sides, c, val, q, label, h) {
    if (sides === 100) return svgD100(c, val, q, h);
    const g = GEO[sides];
    const has = val !== null && val !== undefined;
    const pip = sides === 20 && has ? (val === 20 ? '#ffe060' : val === 1 ? '#ff6060' : null) : null;
    const o = q
      ? { q, text: has ? val : `d${sides}`, pip }
      : has
        ? { q: restQuat(sides, val), face: g.byNum[val], text: val, pip }
        : { q: idleQuat(sides), face: g.vertexUp ? null : g.byNum[g.F], text: g.vertexUp ? '' : (label || `d${sides}`) };
    o.h = h;
    return wrap('-58 -58 116 116', renderBody(sides, c, o));
  }

  // d100: two d10s, tens die shows 00-90, ones die shows 0-9, result between
  const d100Split = val => {
    const tens = Math.floor((val % 100) / 10), ones = val % 10;
    return { tens, ones, tLbl: String(tens * 10).padStart(2, '0'), oLbl: String(ones) };
  };
  function svgD100(c, val, qs, h) {
    const has = val !== null && val !== undefined;
    const sc = 38;
    let a, b, mid = '';
    if (qs) {
      a = { q: qs[0], text: has ? d100Split(val).tLbl : '', scale: sc };
      b = { q: qs[1], text: has ? d100Split(val).oLbl : '', scale: sc };
      mid = has ? val : '';
    } else if (has) {
      const s = d100Split(val);
      const ft = s.tens || 10, fo = s.ones || 10;
      a = { q: restQuat(10, ft), face: GEO[10].byNum[ft], text: s.tLbl, scale: sc };
      b = { q: restQuat(10, fo), face: GEO[10].byNum[fo], text: s.oLbl, scale: sc };
      mid = val;
    } else {
      a = { q: idleQuat(10), face: GEO[10].byNum[10], text: 'd%', scale: sc };
      b = { q: idleQuat(10), face: GEO[10].byNum[10], text: '', scale: sc };
    }
    return wrap('-92 -46 184 92',
      `<g transform="translate(-48,0)">${renderBody(10, c, { ...a, h })}</g>` +
      `<g transform="translate(48,0)">${renderBody(10, c, { ...b, h })}</g>` +
      `<text x="0" y="0" text-anchor="middle" dominant-baseline="central" font-family="Georgia,serif" font-size="16" font-weight="900" fill="${c.pip}">${mid}</text>`);
  }

  // ─── tumble state for animation ───
  // step(dtMs, speed) spins freely; settle(t) eases into the result pose.
  function makeTumble(sides, result) {
    const axis = () => norm([Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5]);
    const twist = (Math.random() - 0.5) * 24;
    const st = {
      q: qRandom(),
      w: axis(), rate: 0.9 + Math.random() * 0.8, // deg per ms at full speed
      q2: qRandom(), w2: axis(), rate2: 0.9 + Math.random() * 0.8,
      from: null, from2: null,
    };
    if (sides === 100) {
      const s = d100Split(result);
      st.target = restQuat(10, s.tens || 10, twist);
      st.target2 = restQuat(10, s.ones || 10, -twist);
    } else {
      st.target = restQuat(sides, result, twist);
    }
    st.step = (dt, speed) => {
      st.q = qNorm(qMul(qAxis(st.w, st.rate * dt * speed), st.q));
      st.q2 = qNorm(qMul(qAxis(st.w2, st.rate2 * dt * speed), st.q2));
    };
    st.settle = t => {
      if (!st.from) { st.from = st.q; st.from2 = st.q2; }
      const e = 1 - Math.pow(1 - t, 3);
      st.q = qSlerp(st.from, st.target, e);
      if (st.target2) st.q2 = qSlerp(st.from2, st.target2, e);
    };
    st.quat = () => (sides === 100 ? [st.q, st.q2] : st.q);
    return st;
  }

  // bounce height for a roll at progress p (0..1): three shrinking hops, flat on the felt from 85%
  const heightAt = p => {
    const k = Math.min(1, p / 0.85);
    return k >= 1 ? 0 : Math.abs(Math.sin(Math.PI * 3 * k)) * Math.pow(1 - k, 1.4);
  };

  root.TTDice3D = { heightAt, GEO, svgDie, svgD100, renderBody, restQuat, idleQuat, makeTumble, qSlerp, qRandom };
})(typeof window !== 'undefined' ? window : globalThis);