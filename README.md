# TTDice: Digital Dice Tray

A free, dark-aesthetic digital dice tray for tabletop RPGs.

## What it does

A dice roller for tabletop RPG sessions, built as a ChanceITstudio portfolio piece and community tool. Supports d4 through d100, has attack and spell presets, a clear-tray and copy-result button, session stats (dice rolled, roll count, best, average), animated roll history, and a keyboard shortcut to roll. Rolls use crypto.getRandomValues (CSPRNG) instead of Math.random, so results are as fair as the browser can make them. Optional Supabase logging can track rolls across sessions.

## Tech stack

- Vanilla HTML, CSS, JavaScript (no framework, no build step)
- Supabase (optional roll logging and stats, degrades gracefully if not configured)
- Netlify (hosting and deploys)

## Live demo

https://ttdice.chanceitstudio.com/

## Screenshot

No screenshot yet. Add one here once available (the dice tray mid-roll would show it off well).
