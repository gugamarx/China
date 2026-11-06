"use strict";
/* ================= game registry + helpers ================= */
const GAMES = [];
function addCSS(css) { const s = document.createElement("style"); s.textContent = css; document.head.appendChild(s); }
function dotsHTML(n, done) { return `<div class="dots">${[...Array(n)].map((_, i) => `<i class="${i < done ? "on" : ""}"></i>`).join("")}</div>`; }
function centerOf(e) { const r = e.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }
/* every game gets a "live" flag so async voice chains stop when she leaves */
function session() { const s = { live: true, timers: [] }; s.t = (f, ms) => { const id = setTimeout(() => s.live && f(), ms); s.timers.push(id); return id; }; s.end = () => { s.live = false; s.timers.forEach(clearTimeout); Voice.cancel(); }; return s; }

/* =================================================================
   1) JUJU JUMP — doodle-jump style: Julia's face bounces up the clouds,
      catching fruits & animals that say their names in English + Chinese
   ================================================================= */
GAMES.push({ id: "jump", name: "Juju Jump", sub: "jump to the stars!", em: "🌈", color: "#ff4fa0",
  async run(stage, S) {
    stage.innerHTML = `<canvas id="jcv" style="position:absolute;inset:0;width:100%;height:100%;touch-action:none"></canvas>
      <div style="position:absolute;top:6px;left:0;right:0;text-align:center;z-index:3;font-family:Arcade;font-size:13px;text-shadow:2px 2px 0 #4127c4" id="jhud"></div>
      <div id="jtime" style="position:absolute;top:30px;left:10%;right:10%;height:10px;border-radius:6px;background:rgba(255,255,255,.3);z-index:3"><b style="display:block;height:100%;width:100%;border-radius:6px;background:#ffd23f"></b></div>`;
    const cv = $("#jcv"), g = cv.getContext("2d"), dpr = Math.min(devicePixelRatio || 1, 2);
    const W = cv.clientWidth, H = cv.clientHeight; cv.width = W * dpr; cv.height = H * dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const face = await loadImg(pick(HAPPY_FACES).face);
    const R = Math.min(34, W * .085), DUR = 60000;
    const pool = [...SRS.pick("food", 6), ...SRS.pick("animal", 6)];
    let plats = [], items = [], camY = 0, best = 0, got = 0, t0 = 0, last = 0, raf = 0, said = new Set(), sparkles = [];
    const pl = { x: W / 2, y: H - 120, vx: 0, vy: -14, tx: W / 2, squash: 1 };
    function addPlat(y) {
      const w = 80 + rnd(50), x = 10 + Math.random() * (W - w - 20), kind = Math.random() < .1 ? "spring" : Math.random() < .12 ? "move" : "cloud";
      const p = { x, y, w, kind, dx: kind === "move" ? (Math.random() < .5 ? 1.2 : -1.2) : 0 }; plats.push(p);
      if (Math.random() < .45) items.push({ x: x + w / 2, y: y - 34, w: pick(pool), got: false, bob: Math.random() * 6 });
      else if (Math.random() < .35) items.push({ x: x + w / 2, y: y - 30, star: true, got: false, bob: Math.random() * 6 });
    }
    plats.push({ x: W / 2 - 70, y: H - 40, w: 140, kind: "cloud", dx: 0 });
    for (let y = H - 130; y > -H * 2; y -= 85 + rnd(35)) addPlat(y);
    const move = e => { pl.tx = e.clientX - cv.getBoundingClientRect().left; };
    cv.addEventListener("pointerdown", move); cv.addEventListener("pointermove", move);
    const sky = h => { // sky colour changes with height: day → sunset → night → space
      const k = Math.min(1, h / 9000);
      const lerp = (a, b, t) => Math.round(a + (b - a) * t);
      const c1 = k < .5 ? [110, 208, 255].map((v, i) => lerp(v, [255, 140, 190][i], k * 2)) : [255, 140, 190].map((v, i) => lerp(v, [20, 10, 60][i], (k - .5) * 2));
      return `rgb(${c1})`;
    };
    let spaceSaid = false, sunsetSaid = false;
    function step(ts) {
      if (!S.live) return; const dt = Math.min(2.2, (ts - (last || ts)) / 16.7); last = ts; const left = DUR - (ts - t0);
      $("#jtime b").style.width = Math.max(0, left / DUR * 100) + "%";
      pl.x += (pl.tx - pl.x) * Math.min(1, .16 * dt); pl.vy += .55 * dt; pl.y += pl.vy * dt; pl.squash += (1 - pl.squash) * .2;
      for (const p of plats) { if (p.dx) { p.x += p.dx * dt; if (p.x < 4 || p.x + p.w > W - 4) p.dx *= -1; }
        if (pl.vy > 0 && pl.x > p.x - 8 && pl.x < p.x + p.w + 8 && pl.y + R > p.y - 6 && pl.y + R < p.y + 14) {
          pl.y = p.y - R; pl.vy = p.kind === "spring" ? -24 : -15.5; pl.squash = .7; Snd.play(p.kind === "spring" ? "slide" : "jump");
          if (p.kind === "spring") FX.burst(pl.x, H * .6, ["✨", "⭐"], 10);
        } }
      for (const it of items) if (!it.got && Math.hypot(it.x - pl.x, it.y - pl.y) < R + 22) {
        it.got = true; got++; const sx = it.x, sy = it.y - camY;
        if (it.star) { Snd.play("coin"); UI.float(sx, sy + 60, "+1 ⭐"); }
        else { Snd.play("sparkle"); UI.float(sx, sy + 60, it.w.e + " " + it.w.zh);
          if (!said.has(it.w.id) || Math.random() < .3) { said.add(it.w.id); Voice.en(it.w.en).then(() => S.live && Voice.zh(it.w.zh)); }
          SRS.seenOnly(it.w.id); }
      }
      if (pl.y - camY < H * .42) camY = pl.y - H * .42;
      best = Math.max(best, Math.round((H - pl.y) / 10));
      if (pl.y - camY > H + 60) { pl.y = camY + H - 10; pl.vy = -26; Snd.play("boing"); UI.float(W / 2, H * .7, "WHEEE!"); }
      while (plats.length && plats[0].y - camY > H + 100) plats.shift();
      let top = Math.min(...plats.map(p => p.y)); while (top > camY - H) { top -= 85 + rnd(40) + Math.min(40, best / 60); addPlat(top); }
      items = items.filter(i => i.y - camY < H + 100);
      if (!sunsetSaid && best > 3000) { sunsetSaid = true; Voice.en("Look! Sunset!"); }
      if (!spaceSaid && best > 7000) { spaceSaid = true; FX.burst(W / 2, H / 2, ["🪐", "⭐", "🌙", "🚀"], 20); Voice.en("Wow! Outer space!").then(() => S.live && Voice.zh("太空")); }
      // draw
      g.fillStyle = sky(best); g.fillRect(0, 0, W, H);
      if (best > 5000) { g.fillStyle = "#fff"; for (let i = 0; i < 40; i++) { const sx = (i * 97) % W, sy = ((i * 53 - camY * .2) % H + H) % H; g.globalAlpha = .6; g.fillRect(sx, sy, 2, 2); } g.globalAlpha = 1; }
      if (best > 6500) { g.font = "60px serif"; g.fillText("🪐", W * .75, 120 + (-camY * .05) % 400); g.fillText("🌙", W * .15, 220); }
      g.textAlign = "center"; g.textBaseline = "middle";
      for (const p of plats) { const y = p.y - camY;
        g.fillStyle = p.kind === "spring" ? "#ffd23f" : p.kind === "move" ? "#ffd1ec" : "#fff";
        g.beginPath(); g.ellipse(p.x + p.w / 2, y + 4, p.w / 2, 12, 0, 0, Math.PI * 2); g.fill();
        for (const k of [.25, .55, .8]) { g.beginPath(); g.arc(p.x + p.w * k, y - 2, 12, 0, Math.PI * 2); g.fill(); }
        if (p.kind === "spring") { g.font = "24px serif"; g.fillText("🍄", p.x + p.w / 2, y - 16); } }
      for (const it of items) { if (it.got) continue; const y = it.y - camY + Math.sin(ts / 300 + it.bob) * 4;
        g.font = it.star ? "28px serif" : "36px serif"; g.fillText(it.star ? "⭐" : it.w.e, it.x, y); }
      const py = pl.y - camY; g.save(); g.translate(pl.x, py); g.scale(2 - pl.squash, pl.squash);
      g.beginPath(); g.arc(0, 0, R + 4, 0, Math.PI * 2); g.fillStyle = "#fff"; g.fill();
      g.beginPath(); g.arc(0, 0, R, 0, Math.PI * 2); g.clip(); g.drawImage(face, -R, -R, R * 2, R * 2); g.restore();
      $("#jhud").textContent = `⬆ ${best}m   🍎 ${got}`;
      if (left <= 0) { const stars = got >= 25 ? 3 : got >= 12 ? 2 : 1; endGame("jump", stars, `You jumped ${best} meters and caught ${got} things!`); return; }
      raf = requestAnimationFrame(step);
    }
    S.t(() => { Voice.en("Move your finger to jump on the clouds!"); }, 300);
    t0 = performance.now(); raf = requestAnimationFrame(step);
    return () => { cancelAnimationFrame(raf); };
  } });

/* =================================================================
   2) ANIMAL SAFARI — listening: "Where is the cat? 猫 māo!"
   ================================================================= */
addCSS(`.safari{position:absolute;inset:0;background:linear-gradient(#bdf0ff 0 45%,#8fe07a 45% 100%)}
.safari .tree{position:absolute;font-size:80px;opacity:.9}
.ani{position:absolute;font-size:min(22vw,100px);line-height:1;transform:translate(-50%,-50%);animation:aniBob 2s ease-in-out infinite;filter:drop-shadow(0 6px 3px rgba(0,0,0,.25))}
.ani.glow{filter:drop-shadow(0 0 18px #fff) drop-shadow(0 0 10px #ffd23f);animation:aniHint .6s ease-in-out infinite}
.ani.yes{animation:aniYes .9s ease-out}
@keyframes aniBob{50%{margin-top:-8px}}
@keyframes aniHint{50%{transform:translate(-50%,-50%) scale(1.15) rotate(6deg)}}
@keyframes aniYes{30%{transform:translate(-50%,-110%) scale(1.3)}60%{transform:translate(-50%,-50%) scale(1.1)}}`);
GAMES.push({ id: "safari", name: "Animal Safari", sub: "find the animal!", em: "🐾", color: "#2fd6a3",
  async run(stage, S) {
    stage.innerHTML = `<div class="safari"><span class="tree" style="left:2%;top:18%">🌳</span><span class="tree" style="right:4%;top:12%">🌴</span></div>
      <div class="prompt" id="sp" style="position:relative;z-index:3;margin-top:4px"></div><div id="sdots" style="position:relative;z-index:3"></div>
      <button class="ibtn" id="srep" style="position:absolute;right:10px;top:8px;z-index:4;background:#fff;color:#000">🔊</button>
      <div id="sfield" style="position:absolute;left:0;right:0;top:110px;bottom:0;z-index:2"></div>`;
    const ROUNDS = 8; let round = 0, target = null, hintT = 0;
    const field = $("#sfield");
    $("#srep").onclick = () => target && askAgain();
    async function askAgain() { await Voice.en(`Where is the ${target.en}?`); if (S.live) await Voice.zh(target.zh); }
    async function next() {
      if (!S.live) return; if (round >= ROUNDS) return endGame("safari", 3, "You found all the animals!");
      $("#sdots").innerHTML = dotsHTML(ROUNDS, round);
      const n = round < 3 ? 3 : 4, choices = SRS.pick("animal", n + 2).slice(0, n); target = pick(choices);
      field.innerHTML = ""; const FW = field.clientWidth, FH = field.clientHeight;
      const spots = shuffle([[.25, .25], [.72, .3], [.3, .65], [.75, .7], [.5, .45]]).slice(0, n);
      choices.forEach((w, i) => { const a = el("button", "ani", w.e); a.style.left = spots[i][0] * FW + "px"; a.style.top = spots[i][1] * FH + "px"; a.style.animationDelay = (i * .3) + "s";
        a.onclick = () => tapAnimal(a, w); field.appendChild(a); });
      $("#sp").innerHTML = `Where is the <b>${target.en}</b>? <span style="font-size:1.1em">${target.zh}</span> ${pyHTML(target.py)}`;
      await askAgain();
      clearTimeout(hintT); hintT = S.t(() => { const a = [...field.children].find(x => x.textContent === target.e); a && a.classList.add("glow"); Voice.en(`Here! The ${target.en}!`); }, 7000);
    }
    let lock = false, missed = false;
    async function tapAnimal(a, w) {
      if (lock) return;
      if (w === target) { lock = true; clearTimeout(hintT); a.classList.remove("glow"); a.classList.add("yes"); SRS.mark(w.id, !missed); missed = false;
        const [x, y] = centerOf(a); Bamboo.add(1, x, y); FX.burst(x, y, [w.e, "✨", "⭐"], 16); Snd.play("good");
        await Voice.en(w.s || pick(PRAISE), { pitch: 1.5 }); if (!S.live) return;
        $("#sp").innerHTML = UI.card(w); await Voice.word(w, pick(PRAISE)); await sleep(500);
        round++; lock = false; next();
      } else { missed = true; oops(a); Snd.play("giggle"); Voice.en(`Hee hee! I'm the ${w.en}! ${w.s || ""}`).then(() => S.live && Voice.zh(w.zh)); }
    }
    S.t(next, 200);
    return () => clearTimeout(hintT);
  } });

/* =================================================================
   3) JUJU'S MARKET — counting: "I want 3 apples! 三个苹果!"
   ================================================================= */
addCSS(`.mkt{position:absolute;inset:0;background:linear-gradient(#ffe8b0,#ffd27a)}
.awning{height:34px;background:repeating-linear-gradient(90deg,#ff4fa0 0 30px,#fff 30px 60px);border-radius:0 0 18px 18px;box-shadow:0 4px 0 rgba(0,0,0,.15)}
.shop{position:relative;z-index:2;width:100%;display:flex;flex-direction:column;align-items:center;flex:1}
.counter{display:flex;align-items:flex-end;gap:8px;width:100%;justify-content:center;margin-top:4px}
.counter .panda{width:120px;height:120px}
.order{background:#fff;color:#3b1550;border-radius:18px;padding:8px 12px;font-size:22px;text-align:center;box-shadow:0 5px 0 rgba(0,0,0,.15);max-width:62%}
.order .big{font-size:40px;line-height:1}
.basket{position:relative;width:min(80vw,330px);min-height:110px;margin:8px 0;border-radius:10px 10px 40px 40px;background:repeating-linear-gradient(45deg,#c98a3d 0 10px,#b07330 10px 20px);display:flex;flex-wrap:wrap;align-content:flex-end;justify-content:center;padding:8px;gap:2px;box-shadow:inset 0 -8px 0 rgba(0,0,0,.18)}
.basket span{font-size:34px;animation:bIn .3s}
.basket .cnt{position:absolute;top:-22px;right:-10px;background:#ff4fa0;color:#fff;font-family:Arcade;font-size:16px;border-radius:50%;width:48px;height:48px;display:flex;align-items:center;justify-content:center;border:3px solid #fff}
.shelf{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;width:min(92vw,400px);margin-top:auto;margin-bottom:10px}
.shelf button{font-size:44px;background:#fff;border-radius:18px;aspect-ratio:1;box-shadow:0 6px 0 #d69a3f}
.shelf button:active{transform:translateY(4px);box-shadow:0 2px 0 #d69a3f}
.flyitem{position:fixed;z-index:60;font-size:40px;pointer-events:none;margin:-20px 0 0 -20px}`);
GAMES.push({ id: "market", name: "Juju's Market", sub: "count for Panda!", em: "🛒", color: "#ff8a3d",
  async run(stage, S) {
    stage.innerHTML = `<div class="mkt"><div class="awning"></div></div><div class="shop">
      <div id="mdots"></div><div class="counter"><div id="mp">${pandaSVG("")}</div><div class="order" id="order"></div></div>
      <div class="basket" id="basket"><div class="cnt" id="bcnt">0</div></div>
      <div class="prompt" id="mhint" style="font-size:18px;min-height:1.2em"></div><div class="shelf" id="shelf"></div></div>`;
    const NUM = byCat("number"), ROUNDS = 6; let round = 0, want = 0, fruit = null, inBasket = [], lock = false;
    const plan = [1, 2, 3, 3, 4, 5, 2, 6, 7, 8, 9, 10];
    const maxN = Math.min(10, 3 + Math.floor(store.get("marketWins", 0) * 1.5) + 2);
    const pd = () => $("#mp .panda");
    async function talk(text, lang = "en") { pd().classList.add("talk"); await (lang === "zh" ? Voice.zh(text) : Voice.en(text)); pd() && pd().classList.remove("talk"); }
    async function next() {
      if (!S.live) return; if (round >= ROUNDS) { store.set("marketWins", store.get("marketWins", 0) + 1); return endGame("market", 3, "Panda is full and happy!"); }
      $("#mdots").innerHTML = dotsHTML(ROUNDS, round);
      want = Math.min(maxN, round < 2 ? round + 1 : 2 + rnd(maxN - 1));
      const fruits = SRS.pick("food", 6).slice(0, 4); fruit = pick(fruits); inBasket = []; renderBasket();
      $("#shelf").innerHTML = fruits.map((f, i) => `<button data-i="${i}">${f.e}</button>`).join("");
      $$("#shelf button").forEach(b => b.onclick = () => tapFruit(b, fruits[+b.dataset.i]));
      const N = NUM[want - 1], plural = want > 1 && !fruit.en.endsWith("s") && fruit.en !== "ice cream" && fruit.en !== "bread" && fruit.en !== "milk" ? (fruit.en.endsWith("y") ? fruit.en.slice(0, -1) + "ies" : fruit.en + (fruit.en.endsWith("ch") ? "es" : "s")) : fruit.en;
      $("#order").innerHTML = `<div class="big">${fruit.e.repeat(Math.min(want, 5))}${want > 5 ? "…" : ""}</div>I want <b>${want}</b> ${plural}!<br><span style="font-size:26px;color:#c41d6e">${N.zh}个${fruit.zh}</span>`;
      $("#mhint").textContent = "";
      await talk(`I want ${N.en} ${plural}, please!`); if (S.live) await talk(`${N.zh}个${fruit.zh}`, "zh");
    }
    function renderBasket() { $("#basket").innerHTML = `<div class="cnt" id="bcnt">${inBasket.length}</div>` + inBasket.map((f, i) => `<span data-i="${i}">${f.e}</span>`).join("");
      $$("#basket span").forEach(s => s.onclick = () => { if (lock) return; inBasket.splice(+s.dataset.i, 1); Snd.play("pop"); renderBasket(); Voice.en(String(inBasket.length || "zero")); check(); }); }
    async function tapFruit(b, f) {
      if (lock) return; const [x, y] = centerOf(b), [bx, by] = centerOf($("#basket"));
      const fl = el("div", "flyitem", f.e); fl.style.left = x + "px"; fl.style.top = y + "px"; document.body.appendChild(fl);
      fl.animate([{ transform: "translate(0,0)" }, { transform: `translate(${(bx - x) / 2}px,${(by - y) / 2 - 90}px) rotate(180deg)` }, { transform: `translate(${bx - x}px,${by - y}px) rotate(360deg)` }], { duration: 450, easing: "ease-in" });
      Snd.play("tap"); await sleep(450); fl.remove(); if (!S.live) return;
      if (f !== fruit) { Snd.play("boing"); UI.float(bx, by - 40, "Oops!"); Voice.en(`That's ${/^[aeiou]/.test(f.en) ? "an" : "a"} ${f.en}!`).then(() => S.live && Voice.zh(f.zh)); SRS.seenOnly(f.id); return; }
      inBasket.push(f); renderBasket(); Snd.play("pop");
      const k = inBasket.length, N = NUM[Math.min(9, k - 1)];
      if (k <= 10) { round % 2 ? Voice.zh(N.zh) : Voice.en(N.en); }
      check();
    }
    let checkT = 0;
    function check() { clearTimeout(checkT); checkT = S.t(async () => {
      if (inBasket.length === want) { lock = true; SRS.mark(fruit.id, true); SRS.mark(NUM[want - 1].id, true);
        pd().classList.add("happy"); Snd.play("chomp"); const [x, y] = centerOf($("#basket")); FX.celebrate(x, y); Bamboo.add(1, x, y);
        await talk(pick(["Yummy! Thank you!", "Nom nom nom! Thank you, Juju!", "Delicious! Thank you!"])); if (S.live) await talk("谢谢!", "zh");
        pd() && pd().classList.remove("happy"); round++; lock = false; next();
      } else if (inBasket.length > want) { $("#mhint").textContent = "Too many! Tap the basket to take one out 👆"; Voice.en("Oh! Too many! Take one out!"); }
    }, 900); }
    S.t(next, 200);
    return () => clearTimeout(checkT);
  } });

/* =================================================================
   4) COLOR LAB — mix paints, learn colour names, paint a picture
   ================================================================= */
addCSS(`.lab{position:absolute;inset:0;background:linear-gradient(#e9f7ff,#d8ecff)}
.paints{display:flex;gap:10px;justify-content:center;margin:6px 0;position:relative;z-index:2}
.paint{width:70px;height:84px;border-radius:12px 12px 22px 22px;box-shadow:inset 0 -10px 0 rgba(0,0,0,.18),0 6px 0 rgba(0,0,0,.15);position:relative;border:4px solid #fff}
.paint.sel{transform:translateY(-10px) scale(1.08);box-shadow:0 0 0 5px #ffd23f,0 10px 0 rgba(0,0,0,.15)}
.pot{position:relative;z-index:2;width:150px;height:130px;margin:8px auto;border-radius:20px 20px 60px 60px;background:#fff;border:6px solid #8a6bd1;overflow:hidden;box-shadow:0 8px 0 rgba(0,0,0,.15)}
.pot .liquid{position:absolute;left:0;right:0;bottom:0;height:0;transition:height .8s,background .8s}
.pot.swirl .liquid{animation:swirl .9s linear 2}
@keyframes swirl{50%{filter:hue-rotate(40deg) brightness(1.2)}}
.picture{position:relative;z-index:2;width:min(70vw,260px);height:min(40vh,230px)}
.picture svg{width:100%;height:100%}
.picture .part{cursor:pointer;transition:fill .4s;stroke:#3b1550;stroke-width:4}`);
const MIX = { "red+yellow": "orange color", "blue+yellow": "green", "blue+red": "purple", "red+white": "pink", "blue+white": "light blue", "white+yellow": "yellow", "red+red": "red", "blue+blue": "blue", "yellow+yellow": "yellow", "white+white": "white" };
const CHEX = { red: "#ff3b3b", yellow: "#ffd23f", blue: "#2f7dff", white: "#ffffff", "orange color": "#ff8a1f", green: "#2bc46b", purple: "#9b4cff", pink: "#ff7ac2", "light blue": "#8fd3ff", black: "#222" };
const PICS = [
  `<svg viewBox="0 0 200 200"><path class="part" d="M100 20 C150 20 160 80 130 110 L110 130 L90 130 L70 110 C40 80 50 20 100 20Z" fill="#fff"/><path d="M100 130 Q95 160 105 195" stroke="#3b1550" stroke-width="3" fill="none"/></svg>`, // balloon
  `<svg viewBox="0 0 200 200">${[0, 72, 144, 216, 288].map(a => `<ellipse class="part" cx="100" cy="55" rx="26" ry="40" fill="#fff" transform="rotate(${a} 100 100)"/>`).join("")}<circle cx="100" cy="100" r="22" fill="#ffd23f" stroke="#3b1550" stroke-width="4"/></svg>`, // flower
  `<svg viewBox="0 0 200 200"><path class="part" d="M30 100 Q90 40 150 100 Q90 160 30 100Z" fill="#fff"/><path class="part" d="M150 100 L190 70 L190 130Z" fill="#fff"/><circle cx="60" cy="92" r="7" fill="#3b1550"/></svg>`, // fish
  `<svg viewBox="0 0 200 200"><path class="part" d="M100 100 C60 20 10 60 40 100 C10 140 60 180 100 100Z" fill="#fff"/><path class="part" d="M100 100 C140 20 190 60 160 100 C190 140 140 180 100 100Z" fill="#fff"/><rect x="94" y="60" width="12" height="80" rx="6" fill="#3b1550"/></svg>`, // butterfly
  `<svg viewBox="0 0 200 200"><path class="part" d="M30 100 L100 35 L170 100Z" fill="#fff"/><rect class="part" x="45" y="100" width="110" height="85" fill="#fff"/><rect x="85" y="135" width="30" height="50" fill="#3b1550"/></svg>`, // house
];
GAMES.push({ id: "colors", name: "Color Lab", sub: "mix the paints!", em: "🎨", color: "#46b4ff",
  async run(stage, S) {
    stage.innerHTML = `<div class="lab"></div><div class="prompt" id="cp" style="position:relative;z-index:2"></div><div id="cdots" style="position:relative;z-index:2"></div>
      <div class="paints" id="paints"></div><div class="pot" id="pot"><div class="liquid" id="liq"></div></div>
      <div id="cres" style="position:relative;z-index:2;min-height:10px"></div><div class="picture" id="pic"></div>`;
    const base = ["red", "yellow", "blue", "white"], CW = en => findWord("color", en);
    let sel = [], round = 0, ROUNDS = 6, mission = null, current = null, lock = false;
    $("#paints").innerHTML = base.map(c => `<button class="paint" data-c="${c}" style="background:${CHEX[c]}"></button>`).join("");
    $$("#paints .paint").forEach(b => b.onclick = () => tapPaint(b));
    async function next() {
      if (!S.live) return; if (round >= ROUNDS) return endGame("colors", 3, "You are a color scientist!");
      $("#cdots").innerHTML = dotsHTML(ROUNDS, round); sel = []; $$(".paint").forEach(p => p.classList.remove("sel")); $("#liq").style.height = "0"; $("#cres").innerHTML = "";
      $("#pic").innerHTML = PICS[round % PICS.length];
      $$("#pic .part").forEach(p => p.onclick = () => { if (!current) return; p.setAttribute("fill", CHEX[current.en]); Snd.play("pop"); const r = p.getBoundingClientRect(); FX.burst(r.left + r.width / 2, r.top + r.height / 2, ["✨"], 6); checkPainted(p); });
      mission = round % 2 === 1 ? CW(pick(["orange color", "green", "purple", "pink", "light blue"])) : null; current = null;
      if (mission) { $("#cp").innerHTML = `Can you make <b>${mission.en.replace(" color", "")}</b>? ${mission.zh}`; await Voice.en(`Can you make ${mission.en.replace(" color", "")}?`); S.live && Voice.zh(mission.zh); }
      else { $("#cp").innerHTML = "Pick <b>two</b> paints! 🎨"; Voice.en("Pick two paints and mix them!"); }
    }
    async function tapPaint(b) {
      if (lock || sel.length >= 2) return; const c = b.dataset.c; sel.push(c); b.classList.add("sel"); Snd.play("tap");
      const w = CW(c); Voice.en(c).then(() => S.live && Voice.zh(w.zh));
      if (sel.length === 2) { lock = true; await sleep(900); if (!S.live) return;
        const res = CW(MIX[[...sel].sort().join("+")]), liq = $("#liq"); Snd.play("pour");
        liq.style.background = `linear-gradient(90deg,${CHEX[sel[0]]},${CHEX[sel[1]]})`; liq.style.height = "75%"; await sleep(900);
        $("#pot").classList.add("swirl"); Snd.play("magic"); await sleep(1000); $("#pot").classList.remove("swirl"); liq.style.background = CHEX[res.en];
        const [x, y] = centerOf($("#pot")); current = res;
        const n1 = sel[0], n2 = sel[1];
        $("#cres").innerHTML = `<div style="font-size:22px;text-align:center">${n1} + ${n2} = <b style="color:${CHEX[res.en] === "#ffffff" ? "#999" : CHEX[res.en]};text-shadow:0 1px 0 #fff">${res.en.replace(" color", "").toUpperCase()}</b> ${res.zh} ${pyHTML(res.py)}</div>`;
        await Voice.en(`${n1} and ${n2} make... ${res.en.replace(" color", "")}!`); if (!S.live) return; await Voice.zh(res.zh);
        if (mission && res !== mission) { SRS.mark(mission.id, false); Snd.play("oops"); await Voice.en(`Oh, that's ${res.en.replace(" color", "")}! Try again for ${mission.en.replace(" color", "")}!`);
          sel = []; $$(".paint").forEach(p => p.classList.remove("sel")); liq.style.height = "0"; lock = false; return; }
        FX.celebrate(x, y); Snd.play("good"); SRS.mark(res.id, true); Bamboo.add(1, x, y);
        $("#cp").innerHTML = `Now <b>paint</b> the picture! 👆`; Voice.en("Now paint the picture!"); lock = false;
      }
    }
    const painted = new Set();
    async function checkPainted(p) { painted.add(p); if (painted.size >= $$("#pic .part").length && current) { painted.clear(); const cur = current; current = null; await sleep(500); await praise(innerWidth / 2, innerHeight / 2); if (!S.live) return; round++; next(); } }
    S.t(next, 200);
  } });

/* =================================================================
   5) JUJU SAYS — body parts on her own photo, then "touch YOUR nose!"
   ================================================================= */
addCSS(`.says{position:relative;z-index:2;display:flex;flex-direction:column;align-items:center;width:100%}
.facebox{position:relative;width:min(80vw,320px);aspect-ratio:1;margin-top:8px}
.facebox img{width:100%;height:100%;border-radius:50%;border:6px solid #fff;box-shadow:0 10px 0 rgba(40,10,80,.25);transition:transform .25s}
.facebox .blush{position:absolute;width:22%;height:14%;border-radius:50%;background:rgba(255,80,150,.55);filter:blur(6px);opacity:0;transition:opacity .4s}
.countdown{font-family:Arcade;font-size:60px;text-shadow:4px 4px 0 #c41d6e;height:70px}`);
// target points inside the face crop (fractions), derived from the detected face box
const BOX = (bx, by) => [(bx + .25) / 1.5, (by + .23) / 1.5];
const PARTS = { nose: [BOX(.5, .62)], eyes: [BOX(.3, .42), BOX(.7, .42)], mouth: [BOX(.5, .82)], ears: [BOX(-.04, .55), BOX(1.04, .55)],
  hair: [BOX(.5, -.12), BOX(.1, .02), BOX(.9, .02)], cheeks: [BOX(.2, .7), BOX(.8, .7)], chin: [BOX(.5, 1.02)] };
const SAYS_PHOTOS = [1, 2, 3, 4, 7, 13, 16, 17, 18];
GAMES.push({ id: "says", name: "Juju Says", sub: "touch the nose!", em: "👃", color: "#ff6fb5",
  async run(stage, S) {
    stage.innerHTML = `<div class="says"><div id="ydots"></div><div class="prompt" id="yp"></div><div class="facebox" id="fb"><img id="fimg" alt="">
      <div class="blush" style="left:14%;top:56%"></div><div class="blush" style="right:14%;top:56%"></div></div><div class="countdown" id="cd"></div></div>`;
    const ROUNDS = 7; let round = 0, part = null, lock = false;
    const fb = $("#fb"), img = $("#fimg");
    async function next() {
      if (!S.live) return; if (round >= ROUNDS) return endGame("says", 3, "You know your face in English and Chinese!");
      $("#ydots").innerHTML = dotsHTML(ROUNDS, round); $("#cd").textContent = "";
      img.src = P(pick(SAYS_PHOTOS)).face; img.style.transform = "";
      const w = SRS.pick("body", 7, byCat("body").filter(b => PARTS[b.en]))[0]; part = w;
      $("#yp").innerHTML = `Touch the <b>${w.en}</b>! ${w.e}<br>${w.zh} ${pyHTML(w.py)}`;
      lock = false; await Voice.en(`Touch the ${w.en}!`); if (S.live) await Voice.zh(w.zh);
    }
    fb.onpointerdown = async e => {
      if (lock || !part) return; const r = fb.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      let best = null, bd = 9; for (const [k, pts] of Object.entries(PARTS)) for (const [px, py] of pts) { const d = Math.hypot(px - x, py - y); if (d < bd) { bd = d; best = k; } }
      if (best === part.en && bd < .22) { lock = true; SRS.mark(part.id, true); funny(part.en); Bamboo.add(1, e.clientX, e.clientY); FX.burst(e.clientX, e.clientY, ["✨", "💖"], 12);
        await Voice.en(pick(["Yes!", "That's it!", "Ha ha! Yes!"])); if (!S.live) return;
        await Voice.en(`Now touch YOUR ${part.en}!`); if (!S.live) return;
        for (const n of ["3", "2", "1"]) { $("#cd").textContent = n; Snd.play("tick"); await sleep(700); if (!S.live) return; }
        $("#cd").textContent = "👏"; Snd.play("giggle"); await Voice.en(pick(["Ha ha ha! Silly Juju!", "Great!", "I saw you! Ha ha!"]));
        round++; next();
      } else { Snd.play("giggle"); SRS.mark(part.id, false); img.classList.remove("wobble"); void img.offsetWidth; img.classList.add("wobble");
        Voice.en(best && bd < .25 ? `Hee hee! That's the ${best}! Find the ${part.en}!` : `Hee hee, that tickles! Find the ${part.en}!`); }
    };
    function funny(k) {
      const a = { nose: () => { Snd.play("honk"); img.animate([{ transform: "scale(1)" }, { transform: "scale(1.15,.85)" }, { transform: "scale(.95,1.08)" }, { transform: "scale(1)" }], { duration: 500 }); },
        eyes: () => { Snd.play("pop"); img.animate([{ transform: "scaleY(1)" }, { transform: "scaleY(.9)" }, { transform: "scaleY(1)" }], { duration: 300, iterations: 2 }); },
        mouth: () => { Snd.play("chomp"); img.animate([{ transform: "rotate(0)" }, { transform: "rotate(-6deg) scale(1.05)" }, { transform: "rotate(6deg)" }, { transform: "rotate(0)" }], { duration: 600 }); },
        ears: () => { Snd.play("boing"); img.animate([{ transform: "rotate(0)" }, { transform: "rotate(15deg)" }, { transform: "rotate(-15deg)" }, { transform: "rotate(0)" }], { duration: 700 }); },
        hair: () => { Snd.play("slide"); img.animate([{ transform: "scale(1)" }, { transform: "scale(.9,1.25) translateY(-8%)" }, { transform: "scale(1)" }], { duration: 600, easing: "ease-out" }); },
        cheeks: () => { Snd.play("giggle"); $$(".blush").forEach(b => { b.style.opacity = 1; setTimeout(() => b.style.opacity = 0, 1500); }); },
        chin: () => { Snd.play("jump"); img.animate([{ transform: "translateY(0)" }, { transform: "translateY(-12%)" }, { transform: "translateY(0)" }], { duration: 500, easing: "ease-out" }); } };
      (a[k] || a.nose)();
    }
    S.t(next, 200);
  } });
