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

## Julia Paint (`juliapaint/` → juliapaint.netlify.app)
25 public-domain paintings (+ Tarsila's Abaporu, owner's choice), 5 rooms that open 5 by 5
(room 1 free, 2-3 ≥50%, 4 ≥60%, 5 ≥75%, Vermeer and Mona Lisa 100%). Dirty-brush mixing, water, mixing table, draggable answer key.
- Multiple nieces: everything personal is in `js/kid.js` (name, Chinese name, cover, jokes). `python3 tools/build_kids.py <kid>`
  creates `dist/<kid>/` (own icon/manifest/sw) to deploy as `<kid>paint`. Kids: julia, elisa, yasmin, valentina.
- v3 (current): artworks in `art2/<key>.jpg`; `python3 tools/build_v3.py [keys]` → `pages3/` (16-bit region png, painter lines, orig, json).
  Area targets per painting in JOBS; colour naming in tools/kidcolor.py; painting data/hidden words in js/art3.js. (v2 pipeline build_pages.py is legacy.)
- Painter portraits: painters/<key>.webp (HuggingFace Z-Image, same cartoon style); without an image it uses `cartoonSVG` from js/util.js.
  Missing: all except mondrian, kandinsky, afklint, klee, vangogh → generate when the quota allows and set `img:` in js/data.js.
- art/, pages/, kids/, painters/, dist/ do not go to git (public repo).

## Ateliê Brasil (`ateliebrasil/`, folclore em pt-BR)
Fork do Julia Paint: 5 salas = regiões do Brasil, personagens do folclore, tudo em português (exceção ao padrão de inglês/chinês).
Um site só com 4 perfis (Julia, Elisa, Yasmin, Valentina) no localStorage (`atelie_<prima>_`), teclado que fala as letras do nome.
Ilustrações "colorida | P&B" em `art/<k>.jpg` → `python3 tools/build_folk.py` → `pages/`; conteúdo em `js/lendas.js`;
`python3 tools/build_site.py` → `dist/` + `ateliebrasil.zip`. Detalhes e pendências em `ateliebrasil/README.md`.

### Estado (nov/2026) e próximos passos: TODAS as artes e vozes serão refeitas no Comfy Cloud
- Decisões do Gustavo: `ateliebrasil/mesa/respostas_1.json` (mesa de decisões = `mesa/mesa.html`, gerada por `tools/build_mesa.py`).
  Arte = UMA imagem colorida 1024×1536 (2:3), contorno preto grosso, cena padrão de céu (sol em cima à direita, nuvem à esquerda,
  montanha) para animar; o jogo vai tirar o contorno da própria colorida (falta adaptar `build_folk.py`). 9 avatares 1024×1024
  em grade 3×3. Capa nova. Festa = Curupira, Iara, Boi, Tuiuiú, Saci, Boitatá. Vozes em MP3 pré-gravadas com sotaque por região.
  Norte sem "Égua" (MANINHA!). Sem o "Encontre" depois do PRONTO. Textos devem ser curtos.
- Fontes únicas: `tools/arte_spec.py` (prompts), `tools/textos_v2.py` (textos curtos, ainda em revisão pelo Gustavo),
  `tools/comfy_spec.py` (elenco de vozes ElevenLabs v4 + Fish, animações). `tools/build_comfy.py` → `comfy/atelie_comfy.json`
  (639 falas, prompts, nomes de arquivo). `tools/comfy_run.py` roda em lote no Comfy Cloud (API, plano Standard+; `orcamento`
  calcula o custo sem chamar nada). Fluxo combinado: orçamento → ok do Gustavo → teste (âncora Curupira + 3 vozes) → lote →
  baixar → adaptar pipeline/coordenadas/animações → testar no Pixel 7 → um deploy no Netlify.
- Precisa no ambiente: secrets `COMFY_CLOUD_API_KEY` e `NETLIFY_AUTH_TOKEN`; rede liberada para cloud.comfy.org, api.comfy.org,
  api.netlify.com. Nunca pedir chave no chat.
- Fora do git (privado): `art/` (13 ilustrações novas + old/), `kids/` (capas e avatares das primas), `pages/`, `dist/`.
