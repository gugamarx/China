"use strict";
/* =================================================================
   HUB: intro, island map, game launcher, end screen, Panda's house,
   talk-to-panda translator, options + parent corner
   ================================================================= */
addCSS(`#pandaHome{background:linear-gradient(180deg,#b8f0c8 0%,#7fdc9b 60%,#4fbf75 100%)}
.ph{position:relative;z-index:2;display:flex;flex-direction:column;align-items:center;width:100%;flex:1;overflow:auto}
.ph .bigpanda{margin-top:30px;transition:transform .6s cubic-bezier(.3,1.6,.5,1);transform-origin:50% 100%}
.ph .bigpanda .panda{width:210px;height:210px}
.phbtns{display:grid;grid-template-columns:1fr 1fr;gap:10px;width:min(92vw,420px);margin:12px 0}
.phbtns button{font-size:20px;padding:12px 8px;border-radius:20px;color:#fff;box-shadow:0 6px 0 rgba(0,0,0,.2)}
.hats{display:flex;gap:8px;overflow-x:auto;width:100%;padding:4px 14px 10px}
.hats button{min-width:64px;height:64px;border-radius:18px;background:rgba(255,255,255,.6);font-size:34px;position:relative}
.hats button.lock{filter:grayscale(1);opacity:.55}
.hats button small{position:absolute;bottom:-2px;left:0;right:0;font-size:10px;color:#1d5a32}
.hats button.on{background:#fff;box-shadow:0 0 0 4px #ffd23f}
.endbox .estars{font-size:46px;letter-spacing:6px}
.endbox .eface{width:120px;height:120px;border-radius:50%;border:5px solid #ff4fa0;margin:0 auto;display:block;animation:jel 1s infinite}`);

/* ---------------- islands ---------------- */
const ISLANDS = ["jump", "safari", "market", "colors", "says", "magic", "tones", "spell", "drums", "parrot", "story"];
function layoutMap() {
  const wi = $("#worldIn"); $$("#worldIn .isl,#worldIn .cloudbg").forEach(e => e.remove());
  const W = Math.min(innerWidth, 520), gap = 150, top = 110, pts = [];
  ISLANDS.forEach((id, i) => {
    const g = GAMES.find(x => x.id === id), x = W * (i % 2 ? .7 : .3) + Math.sin(i * 1.7) * W * .06, y = top + i * gap; pts.push([x, y]);
    const best = store.get("best", {})[id] || 0;
    const b = el("button", "isl", `<span class="em">${g.em}</span>${g.name}<small>${g.sub}</small><span class="stars">${"⭐".repeat(best)}</span>`);
    b.style.left = x + "px"; b.style.top = y + "px"; b.style.background = g.color; b.style.animationDelay = (i * .25) + "s";
    b.onclick = () => openGame(id, b); wi.appendChild(b);
    if (i % 3 === 1) { const c = el("div", "cloudbg", "☁️"); c.style.left = (i % 2 ? 4 : W - 90) + "px"; c.style.top = (y - 60) + "px"; wi.appendChild(c); }
  });
  const H = top + ISLANDS.length * gap; wi.style.height = H + "px";
  const d = pts.map((p, i) => i ? `C${pts[i - 1][0]} ${pts[i - 1][1] + 75},${p[0]} ${p[1] - 75},${p[0]} ${p[1]}` : `M${p[0]} ${p[1]}`).join(" ");
  $("#path").setAttribute("viewBox", `0 0 ${W} ${H}`); $("#path").style.width = W + "px"; $("#path").style.height = H + "px";
  $("#path").innerHTML = `<path d="${d}" stroke="#fff" stroke-width="10" fill="none" stroke-dasharray="4 22" stroke-linecap="round" opacity=".9"/>`;
  layoutMap.pts = pts;
  const cur = Math.max(0, ISLANDS.indexOf(store.get("lastIsland", "jump")));
  const av = $("#avatar"); av.querySelector("img").src = pick(HAPPY_FACES).face; av.style.left = pts[cur][0] + "px"; av.style.top = pts[cur][1] + "px";
  Bamboo.render();
}
async function openGame(id, btn) {
  if (UI.busy) return; Snd.unlock();
  const i = ISLANDS.indexOf(id), pts = layoutMap.pts, from = Math.max(0, ISLANDS.indexOf(store.get("lastIsland", "jump"))), av = $("#avatar");
  const [x0, y0] = pts[from], [x1, y1] = pts[i], g = GAMES.find(x => x.id === id);
  Snd.play("boing");
  const peak = Math.min(y0, y1) - 140, frames = [...Array(13)].map((_, k) => { const t = k / 12; return { left: (x0 + (x1 - x0) * t) + "px", top: ((1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * peak + t * t * y1) + "px" }; });
  av.animate(frames, { duration: 650, easing: "ease-in-out" }); av.style.left = x1 + "px"; av.style.top = y1 + "px";
  store.set("lastIsland", id); Voice.en(g.name);
  await sleep(660); btn.classList.add("jelly"); FX.burst(...centerOf(btn), ["⭐", "✨"], 12);
  const [cx, cy] = centerOf(btn); startGame(g, cx, cy);
}
function startGame(g, x, y) {
  $("#gttl").textContent = g.name.toUpperCase(); const S = session();
  UI.go("game", x, y, g.color, async () => {
    const stage = $("#stage"); stage.innerHTML = ""; Snd.music("game"); Bamboo.render();
    const c = await g.run(stage, S); cleanup = () => { S.end(); try { c && c(); } catch (e) { } };
  });
  startGame.last = g;
}
$("#back").onclick = () => { Snd.play("tap"); goMap(); };
/* surprise: tap Juju on the map */
const SILLY = [["Boing!", "boing"], ["Wheee!", "slide"], ["Hee hee!", "giggle"], ["Honk honk!", "honk"], ["Ta-daa!", "great"]];
document.addEventListener("click", e => { if (!e.target.closest("#avatar")) return; const av = $("#avatar"), s = pick(SILLY);
  av.animate([{ transform: "translateY(0) rotate(0)" }, { transform: "translateY(-90px) rotate(200deg) scale(1.2)" }, { transform: "translateY(0) rotate(360deg)" }], { duration: 700, easing: "ease-out" });
  Snd.play(s[1]); FX.burst(...centerOf(av), ["⭐", "💖", "✨"], 12); Voice.en(s[0], { pitch: 1.6 }); });
/* word of the day: Panda pops up on the map once per visit */
let wotdShown = false;
async function wordOfDay() {
  if (wotdShown) return; wotdShown = true; await sleep(900); if (UI.cur !== "map") return;
  const w = SRS.pick(pick(["animal", "food", "color", "talk", "family", "hanzi"]), 3)[0];
  const box = el("div", "", `${pandaSVG(store.get("hat", ""))}<div><small>Word of the day!</small><span class="we">${w.e}</span> <b style="font-size:20px">${w.en.replace(" (character)", "").replace(" color", "")}</b> · <b style="font-size:24px;color:#c41d6e">${w.zh}</b> ${pyHTML(w.py)}</div>`);
  box.id = "wotd"; document.body.appendChild(box); box.onclick = () => Voice.word(w); SRS.seenOnly(w.id);
  box.querySelector(".panda").classList.add("talk"); await Voice.word(w, "Word of the day!"); box.querySelector(".panda")?.classList.remove("talk");
  setTimeout(() => { box.style.transition = "opacity .5s"; box.style.opacity = 0; setTimeout(() => box.remove(), 500); }, 5000);
}
function goMap() { UI.go("map", null, null, "#6b4cff", () => { Snd.music("hub"); layoutMap(); }); }
const _wotdHook = () => wordOfDay();

/* ---------------- end of a game ---------------- */
async function endGame(id, stars, msg) {
  const best = store.get("best", {}); best[id] = Math.max(best[id] || 0, stars); store.set("best", best);
  const plays = store.get("plays", {}); plays[id] = (plays[id] || 0) + 1; store.set("plays", plays);
  Voice.cancel(); Snd.play("great"); FX.confetti(); setTimeout(() => FX.fireworks(), 600);
  const z = pick(PRAISE_ZH);
  openOv(`<div class="endbox"><h3>HOORAY, JUJU!</h3><img class="eface" src="${pick(HAPPY_FACES).face}">
    <div class="estars">${"⭐".repeat(stars)}</div><div style="font-size:20px">${msg}</div>
    <div style="font-size:22px;margin:6px 0">${z[0]} ${pyHTML(z[1])}</div><div style="font-size:20px">+5 🎋 for Panda!</div>
    <div class="obtns" style="margin-top:8px"><button id="eAgain" style="background:#2fd6a3;box-shadow:0 5px 0 #16a076;font-size:30px">🔄</button>
    <button id="eMap" style="background:#6b4cff;box-shadow:0 5px 0 #4127c4;font-size:30px">🗺️</button></div></div>`);
  Bamboo.add(5, innerWidth / 2, innerHeight / 2);
  await Voice.en(`Hooray! ${msg}`); await Voice.zh(z[0]);
  $("#eAgain").onclick = () => { closeOv(); const g = GAMES.find(x => x.id === id); startGame(g); };
  $("#eMap").onclick = () => { closeOv(); goMap(); };
}
function openOv(html) { $("#obox").innerHTML = html; $("#opts").classList.add("on"); }
function closeOv() { $("#opts").classList.remove("on"); }
$("#opts").addEventListener("click", e => { if (e.target.id === "opts" && !$("#eMap")) closeOv(); });

/* ---------------- Panda's house ---------------- */
const HATS = [["", 0, "none"], ["🎀", 3, "bow"], ["👑", 8, "crown"], ["🎩", 15, "top hat"], ["🌸", 25, "flower"], ["🧢", 40, "cap"], ["🎓", 60, "graduate"], ["🦄", 80, "unicorn"], ["🪐", 110, "space"]];
const PANDA_LINES = [
  ["I love bamboo! In Chinese, bamboo is...", "竹子"], ["Panda in Chinese is xióng māo. Bear cat! Ha ha!", "熊猫"], ["Juju, what did you eat today? Tell me!", ""],
  ["Hee hee! That tickles!", ""], ["Do you know how to say hello in Chinese?", "你好"], ["What is your favorite animal? Say it out loud!", ""],
  ["I love you, Juju!", "我爱你"], ["Let's count! One, two, three!", "一 二 三"], ["Can you roar like a tiger? Roooar!", ""], ["Tell me a story, Juju!", ""],
];
document.body.insertAdjacentHTML("beforeend", `<section id="pandaHome" class="screen"><div class="bar"><button class="ibtn" id="phBack">🗺️</button><div class="ttl" style="color:#1d5a32;text-shadow:none">PANDA'S HOUSE</div><div class="bcount">🎋 0</div></div>
  <div class="ph"><div class="bigpanda" id="bigpanda"></div><div class="prompt" id="phSay" style="color:#1d5a32;text-shadow:none;font-size:20px"></div>
  <div class="phbtns"><button id="phFeed" style="background:#2fb36b">🎋 Feed</button><button id="phTalk" style="background:#ff4fa0">🎤 Talk</button>
  <button id="phWords" style="background:#6b4cff">📚 My words</button><button id="phDict" style="background:#ff8a3d">🔎 Picture book</button></div>
  <div class="hats" id="hats"></div><div id="phOut" style="padding:0 12px 16px;display:flex;flex-direction:column;align-items:center"></div></div></section>`);
const fed = () => store.get("fed", 0);
function renderPanda() {
  const hat = store.get("hat", ""); $("#bigpanda").innerHTML = pandaSVG(hat); $("#bigpanda").style.transform = `scale(${Math.min(1.35, .9 + fed() * .006)})`;
  $("#hats").innerHTML = HATS.map(([h, need, n]) => `<button class="${fed() < need ? "lock" : ""} ${h === hat ? "on" : ""}" data-h="${h}" data-n="${need}">${h || "🚫"}<small>${fed() < need ? "🎋" + need : n}</small></button>`).join("");
  $$("#hats button").forEach(b => b.onclick = () => { if (fed() < +b.dataset.n) { Snd.play("oops"); pandaTalk(`Feed me ${b.dataset.n - fed()} more bamboo for this!`); return; } store.set("hat", b.dataset.h); Snd.play("sparkle"); renderPanda(); pandaTalk(pick(["Do I look pretty?", "I love it!", "So fancy!"])); });
  $("#bigpanda .panda").onclick = () => { const l = pick(PANDA_LINES); Snd.play("giggle"); $("#bigpanda .panda").classList.add("happy"); setTimeout(() => $("#bigpanda .panda")?.classList.remove("happy"), 600); pandaTalk(l[0], l[1]); };
  Bamboo.render();
}
async function pandaTalk(en, zh) { const p = $("#bigpanda .panda"); $("#phSay").textContent = en; p && p.classList.add("talk"); await Voice.en(en); if (zh) await Voice.zh(zh); p && p.classList.remove("talk"); }
$("#goPanda").onclick = () => { Snd.play("tap"); UI.go("pandaHome", innerWidth - 40, 40, "#2fb36b", () => { renderPanda(); $("#phOut").innerHTML = ""; Snd.music("hub"); setTimeout(() => pandaTalk(`Hi Juju! I'm so happy to see you!`, "你好"), 300); }); };
$("#phBack").onclick = () => { Snd.play("tap"); goMap(); };
$("#phFeed").onclick = async () => {
  if (Bamboo.n <= 0) { Snd.play("oops"); return pandaTalk("No bamboo! Play a game to get bamboo for me!"); }
  store.set("bamboo", Bamboo.n - 1); store.set("fed", fed() + 1); Bamboo.render();
  const b = el("div", "flybamboo", "🎋"), [x, y] = centerOf($("#phFeed")), [px, py] = centerOf($("#bigpanda")); b.style.left = x + "px"; b.style.top = y + "px"; document.body.appendChild(b);
  b.animate([{ transform: "translate(0,0)" }, { transform: `translate(${px - x}px,${py - y - 20}px) scale(1.5) rotate(40deg)` }], { duration: 500, easing: "ease-in", fill: "forwards" });
  await sleep(500); b.remove(); Snd.play("chomp"); FX.burst(px, py - 40, ["💖", "✨"], 10); renderPanda();
  const unlocked = HATS.find(h => h[1] === fed()); if (unlocked && unlocked[0]) { Snd.play("great"); FX.confetti(); pandaTalk(`Yummy! I got a new ${unlocked[2]}! Tap it to dress me!`); }
  else pandaTalk(pick(["Nom nom nom! Yummy!", "Mmm! Thank you, Juju!", "More bamboo please! Ha ha!", "谢谢!"]));
};
/* talk-to-panda: Julia says a word in Portuguese, Panda teaches it in English + Chinese */
const norm = s => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z ]/g, " ").replace(/\s+/g, " ").trim();
$("#phTalk").onclick = async () => {
  if (!Rec.ok) { pandaTalk("I can't hear on this phone. Let's look at the picture book!"); return showDict(); }
  $("#phOut").innerHTML = `<div style="font-size:60px;animation:bob .6s infinite">👂</div><div style="color:#1d5a32;font-size:20px">Say a word! Fala uma palavra! 🗣️</div>`;
  await pandaTalk("Say a word in Portuguese! An animal, a fruit, a color!");
  Snd.play("tick"); const heard = await Rec.listen("pt-BR", 6000);
  const txt = heard.map(norm).join(" | ");
  let found = null; for (const w of WORDS) { const p = norm(w.pt || ""), e = norm(w.en); if ((p && (" " + txt + " ").includes(" " + p + " ")) || (" " + txt + " ").includes(" " + e + " ")) { found = w; break; } }
  if (found) { SRS.seenOnly(found.id); $("#phOut").innerHTML = UI.card(found, true); FX.celebrate(); Bamboo.add(1);
    await pandaTalk(`${found.pt}! In English: ${found.en.replace(" (character)", "").replace(" color", "")}!`); await Voice.zh(found.zh); }
  else if (heard.length) { $("#phOut").innerHTML = `<div style="color:#1d5a32;font-size:22px">"${heard[0]}" 🤔</div>`; Snd.play("giggle"); pandaTalk(`Hee hee! "${heard[0]}"! I don't know that one yet. Try an animal or a fruit!`); }
  else { $("#phOut").innerHTML = ""; pandaTalk("I didn't hear you! Tap Talk and speak loud!"); }
};
function showDict() {
  const cats = [["animal", "🐾"], ["food", "🍎"], ["color", "🎨"], ["number", "🔢"], ["body", "👃"], ["family", "👪"], ["talk", "💬"], ["hanzi", "中"]];
  $("#phOut").innerHTML = `<div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center;margin-bottom:8px">${cats.map(([c, e]) => `<button class="ibtn" data-c="${c}" style="background:#fff;color:#000">${e}</button>`).join("")}</div><div id="dictGrid" class="wordlist" style="width:min(92vw,420px)"></div>`;
  const showCat = c => { $("#dictGrid").innerHTML = byCat(c).map(w => `<div data-id="${w.id}" style="color:#3b1550"><b>${w.e}</b>${w.en.replace(" (character)", "")}<br><span style="font-size:18px;color:#c41d6e">${w.zh}</span><br>${pyHTML(w.py)}</div>`).join("");
    $$("#dictGrid div").forEach(d => d.onclick = () => { const w = WBY[d.dataset.id]; SRS.seenOnly(w.id); Snd.play("pop"); Voice.word(w); }); };
  $$("#phOut [data-c]").forEach(b => b.onclick = () => { Snd.play("tap"); showCat(b.dataset.c); }); showCat("animal");
}
$("#phDict").onclick = () => { Snd.play("tap"); showDict(); };
$("#phWords").onclick = () => {
  Snd.play("tap"); const met = SRS.met();
  $("#phOut").innerHTML = met.length ? `<div style="color:#1d5a32;font-size:20px;margin-bottom:6px">You know ${SRS.known().length} words! You met ${met.length}! 🌟</div><div class="wordlist" style="width:min(92vw,420px)">${met.map(w => `<div data-id="${w.id}" style="color:#3b1550"><b>${w.e}</b>${w.zh}<br>${"⭐".repeat(Math.max(1, Math.min(3, Math.ceil(SRS.level(w.id) / 2))))}</div>`).join("")}</div>` : `<div style="color:#1d5a32;font-size:20px">Play games to collect words! 🎮</div>`;
  $$("#phOut [data-id]").forEach(d => d.onclick = () => { Snd.play("pop"); Voice.word(WBY[d.dataset.id]); });
};

/* ---------------- options + parent corner ---------------- */
const KEEP = ["music", "sfx"];
function renderOpts() {
  openOv(`<h3>⚙️ OPTIONS</h3>
   <button class="orow" id="oM">${Snd.musicOn ? "🎵 Music: ON" : "🎵 Music: OFF"}</button>
   <button class="orow" id="oS">${Snd.sfxOn ? "🔊 Sounds & voice: ON" : "🔇 Sounds & voice: OFF"}</button>
   <div class="small" style="text-align:left;background:#f7f2ff;border-radius:14px;padding:10px">
     <b>👨‍👩‍👧 Parent corner</b><br>Words met: <b>${SRS.met().length}</b> · well known: <b>${SRS.known().length}</b> of ${WORDS.length}<br>
     Games finished: <b>${Object.values(store.get("plays", {})).reduce((a, b) => a + b, 0)}</b> · bamboo fed to Panda: <b>${fed()}</b><br>
     Chinese voice on this phone: <b>${Voice.hasZh() ? "✅ found" : "⚠️ not found"}</b>${Voice.hasZh() ? "" : "<br>Android: Settings → Text-to-speech → Google → install Chinese (Mandarin)."}<br>
     Microphone games: <b>${Rec.ok ? "✅" : "—"}</b> talk · <b>${Recorder.ok ? "✅" : "—"}</b> parrot</div>
   <div id="oMain"><button class="orow danger" id="oR" style="width:100%">🗑️ Reset progress</button></div>
   <div id="oConf" hidden><p style="font-size:18px">Are you sure?<br>Words, stars, bamboo and Panda's hats will be erased.</p>
     <div class="obtns"><button id="oY" style="background:#e0262f">Yes, erase</button><button id="oN" style="background:#2bc46b">No</button></div></div>
   <button class="orow" id="oC">✖ Close</button>`);
  $("#oM").onclick = () => { Snd.toggleMusic(); renderOpts(); };
  $("#oS").onclick = () => { Snd.toggleSfx(); renderOpts(); };
  $("#oR").onclick = () => { $("#oMain").hidden = true; $("#oConf").hidden = false; Snd.play("oops"); };
  $("#oN").onclick = () => { $("#oMain").hidden = false; $("#oConf").hidden = true; };
  $("#oY").onclick = () => { try { Object.keys(localStorage).filter(k => k.startsWith("jj_") && !KEEP.includes(k.slice(3))).forEach(k => localStorage.removeItem(k)); } catch (e) { }
    $("#obox").innerHTML = `<h3>🧹 All new!</h3><p style="font-size:18px">Progress erased.</p>`; setTimeout(() => location.reload(), 1200); };
  $("#oC").onclick = closeOv;
}
$("#gear").onclick = () => { Snd.play("tap"); renderOpts(); };

/* ---------------- splash + intro ---------------- */
$("#splashPanda").innerHTML = pandaSVG("👑");
$("#logo .a").innerHTML = [..."JUJU"].map(c => `<span class="ch">${c}</span>`).join(""); $("#logo .b").innerHTML = [..."JUMP"].map(c => `<span class="ch">${c}</span>`).join("");
let introSkip = false;
$("#press").onclick = async () => {
  Snd.unlock(); Snd.music("hub"); Snd.play("great"); $("#press").style.display = "none"; FX.init();
  const f = $("#introFace"); f.querySelector("img").src = P(1).face; f.style.display = "block";
  $("#splash").onclick = () => { introSkip = true; };
  const W = innerWidth, H = innerHeight, pts = [[-120, H * .7], [W * .2, H * .62], [W * .5, H * .7], [W * .8, H * .6], [W / 2 - 55, H * .08]];
  for (let k = 1; k < pts.length && !introSkip; k++) {
    const [x0, y0] = pts[k - 1], [x1, y1] = pts[k], peak = Math.min(y0, y1) - 160;
    f.animate([...Array(11)].map((_, i) => { const t = i / 10; return { transform: `translate(${x0 + (x1 - x0) * t}px,${(1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * peak + t * t * y1}px) rotate(${t * 360}deg)` }; }), { duration: 520, fill: "forwards", easing: "ease-in-out" });
    Snd.play("boing"); await sleep(520); FX.burst(x1 + 55, y1 + 55, ["⭐", "✨", "💖"], 14);
    $$("#logo .ch")[k * 2 - 2]?.classList.add("jelly"); $$("#logo .ch")[k * 2 - 1]?.classList.add("jelly");
  }
  const pdl = $("#splashPanda .panda"); pdl && pdl.classList.add("wave", "talk");
  if (!introSkip) { await Voice.en("Hi Julia! I'm Panda! Let's jump into fun!"); }
  if (!introSkip) await Voice.zh("你好, 朱莉娅!");
  pdl && pdl.classList.remove("talk");
  UI.go("map", W / 2, H / 2, "#ffd23f", () => { layoutMap(); f.style.display = "none"; wordOfDay(); });
};
FX.init();
addEventListener("resize", () => { if (UI.cur === "map") layoutMap(); });
if ("serviceWorker" in navigator) addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => { }));
