# TTDice — Digital Dice Tray (Standard + Founder)

TTDice is a fast, mobile-first digital dice tray for tabletop RPGs (D&D, Pathfinder, etc.).
It’s built to be simple, readable, and “table-visible” (good for screen share / streaming).

## What it does (v1)
- Select dice: d4, d6, d8, d10, d12, d20
- Add/remove dice to a tray (max 10)
- Roll with animated dice
- Bonus modifier (+/-)
- Roll history (last 10 rolls)
- Optional Advantage / Disadvantage mode (roll twice, take best/worst)
  - Visible at all times
  - Disabled until 2 dice of the same type are in the tray
  - Switch is disabled until the checkbox is enabled

## Trust & randomness
TTDice uses the browser’s cryptographic random generator (`crypto.getRandomValues`)
instead of `Math.random()` to improve fairness perception and reduce bias concerns.

## Editions
### ttdice-standard
- Core dice tray features
- Local-only (no accounts, no multiplayer)

### ttdice-founder
- Includes everything in Standard
- Founder entitlement for future Pro upgrades (when Pro ships)

> Founder buyers are early supporters. When Pro features are released,
> Founder licenses will be eligible for Pro access / redemption.

## Roadmap (transparent)
### v1.x (polish + quality)
- Stream-friendly layout toggle (tray-only mode)
- Presets (common dice sets)
- Optional sound + haptics (mobile)
- Export/copy roll history

### v2.0 (Pro)
- “Stream Mode” (high contrast + tray focus)
- Saved presets
- Quality-of-life pack (quick clear, roll grouping)

### v3.0 (Multiplayer / Shared Tables — research stage)
- Real-time shared tray / rooms (likely WebRTC + lightweight signaling)
- Roll visibility for remote tables

## Dev notes
This is a static app (HTML/CSS/JS). No backend is required for v1.

## License
"product": "ttdice",
"edition": "standard",
"issued": "2026-02-01",
"entitlement": "standard_public_only"
