# TTDice v2 — Digital Dice Tray

> A free, dark-aesthetic digital dice tray for tabletop RPGs.
> Built by ChanceITstudio as a portfolio piece and community tool.

---

## What's new in v2

| Feature | v1 | v2 |
|---|---|---|
| Visual design | Red/yellow gradient | Dark moody tabletop (Cinzel + Crimson Pro) |
| Dice types | d4–d20 | d4, d6, d8, d10, d12, d20, **d100** |
| Presets | ✗ | ✅ Attack, Fireball, Stat, Sneak Attack |
| Clear tray | ✗ | ✅ One-click |
| Copy result | ✗ | ✅ Clipboard |
| Session stats | ✗ | ✅ Dice rolled, roll count, best, average |
| History | 10 entries | 20 entries, animated |
| Keyboard shortcut | ✗ | ✅ Space / Enter to roll |
| Supabase sync | ✗ | ✅ Optional roll logging |
| Natural 20/1 callout | ✗ | ✅ Gold flash / red |
| Ambient effects | ✗ | ✅ Floating embers |
| Mobile layout | Single column | ✅ Fully responsive grid |

---

## Quick Start

```
1. Clone or download
2. Open index.html in a browser
3. No build step. No backend required for local use.
```

---

## Supabase Setup (optional, for roll logging)

### 1. Create a project at supabase.com

### 2. Run the schema
Open `supabase-schema.sql` and run it in your Supabase SQL editor.

This creates:
- `sessions` — anonymous browser sessions
- `rolls` — every roll logged with full detail
- `presets` — saved dice combos (future feature)
- `global_stats` view — aggregate stats for a future /stats page

### 3. Configure credentials
```js
// config.js
window.SUPABASE_URL      = 'https://YOUR_PROJECT.supabase.co';
window.SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';
```

Add the Supabase JS client to your `index.html` before `script.js`:
```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"
        id="supabase-cdn"></script>
```

Then in `script.js`, replace the `initSupabase` body with:
```js
supabase = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
```

> The app gracefully degrades if Supabase isn't configured.
> `config.js` is loaded with `onerror` — missing file = silent skip.

---

## Roadmap

### v2.x (now)
- [x] Full visual redesign
- [x] d100 support
- [x] Presets
- [x] Session stats
- [x] Supabase schema + logging
- [ ] Shareable roll links (`/roll/:id`)
- [ ] Roll streaks ("3 crits in a row")
- [ ] Sound effects (toggle)
- [ ] Export history as CSV

### v3.0 — Community
- Public stats page ("TTDice users have rolled X million dice")
- Saved presets synced to Supabase
- Campaign/character context (optional)

### v4.0 — Multiplayer (research)
- Shared table rooms (WebRTC + lightweight signaling)
- Visible rolls for remote tables

---

## Trust & Randomness

TTDice uses `crypto.getRandomValues` (CSPRNG) — the same API browsers use for
TLS key generation. This eliminates the bias and predictability issues in
`Math.random()`. Your dice are as fair as your browser can make them.

---

## License

TTDice Standard License — Copyright © 2026 ChanceITstudio  
Free to use. Not for redistribution. See `LICENSE.txt`.