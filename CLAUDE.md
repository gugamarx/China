# Notes for Claude: Julia's games (owner: Gustavo)

Julia is 6 years old and plays on an Android phone (Chrome, home-screen shortcut).
Already published: `julia/` → julia-china-trip.netlify.app, `pink/` → julia-pink.netlify.app,
`jujujump/` → jujujump.netlify.app (the main hub: island map, 11 games, Panda's house, shared word bank
`js/words.js` with en/zh/pinyin/pt + invisible spaced repetition `SRS`). New games go into Juju Jump as new islands
(GAMES.push in js/games*.js + id in ISLANDS in js/hub.js) and new words go into js/words.js.
Julia's Chinese name: 朱莉娅 (Zhū lì yà). Avoid swimwear photos on the open link.

## Standards for every new game/project
- **Language:** UI in simple English, big buttons with emoji; English voice (speechSynthesis en-US).
  Teach English and Chinese **a little at a time**: a Chinese word of the day (hanzi + pinyin + English, 🔈 button with zh-CN voice),
  object names read aloud in English. Gradually build up the vocabulary across projects (don't repeat only the same words).
- **Options menu ⚙️** on the main screen with **"Reset progress"** (confirm with a big button + "Are you sure?"),
  plus music/sound on/off.
- **Progress saved only on the phone** (localStorage with try/catch). No online database.
- **Bottom bar:** the free plan shows a "Built with Netlify" badge at the bottom of the screen and it won't be removed by paying.
  Keep the bottom ~64px clear (`padding-bottom: calc(64px + env(safe-area-inset-bottom))`) and never put buttons or game pieces there.
  Test with a fake 60px bar at the bottom.
- **Private photos:** never commit them (public repo). They stay in .gitignore and are uploaded directly to Netlify
  via API (zip deploy). Photos come from Google Drive (connector) or from uploads in the chat.
- **Netlify:** new sites come with "Team protection" (sso_login) on; ask Gustavo to switch it to Public
  (Site configuration → Access & security). The API token is a network secret of the "China" environment.
  Free plan: 300 credits/month, ~15 per production deploy → batch changes and deploy few times.
- **Style:** 90s arcade (Press Start 2P + Baloo 2 fonts, bundled locally), original 8-bit music in WebAudio,
  intro animation with photos, confetti/rewards on every win, offline PWA (service worker + manifest).
- **Test** in Playwright with Pixel 7 emulation before publishing.
