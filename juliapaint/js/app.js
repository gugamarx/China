"use strict";
const NAME = KID.name, UPNAME = KID.name.toUpperCase();
document.title = `${NAME} Paint`;

/* ================= UI helpers ================= */
const UI = {
  busy: false,
  async go(id, color, onSwap) {
    if (UI.busy) return; UI.busy = true; Voice.cancel();
    const w = $("#wipe"); w.style.background = color || pick(Object.values(PAINT).map(p => p[0]).slice(0, 10)); w.style.display = "block"; Audio8.fx("splash");
    w.animate([{ clipPath: "circle(0% at 50% 50%)" }, { clipPath: "circle(75% at 50% 50%)" }], { duration: 380, easing: "ease-in", fill: "forwards" });
    await sleep(390); $$(".screen").forEach(s => s.classList.toggle("on", s.id === id)); UI.cur = id;
    if (onSwap) try { await onSwap(); } catch (e) { console.error(e); }
    await sleep(80); w.animate([{ clipPath: "circle(75% at 50% 50%)" }, { clipPath: "circle(0% at 50% 50%)" }], { duration: 420, easing: "ease-out", fill: "forwards" });
    await sleep(430); w.style.display = "none"; UI.busy = false;
  },
  bubble(target, html, ms = 2800) {
    $$(".bubble").forEach(b => b.remove()); const b = el("div", "bubble", html); document.body.appendChild(b);
    const r = target.getBoundingClientRect(); b.style.left = Math.max(8, Math.min(innerWidth - 248, r.left + r.width / 2 - 120)) + "px";
    b.style.top = Math.max(56, r.top - b.offsetHeight - 12) + "px"; setTimeout(() => b.classList.add("out"), ms); setTimeout(() => b.remove(), ms + 400);
  },
  float(x, y, t) { const f = el("div", "floaty", t); f.style.left = x + "px"; f.style.top = y + "px"; document.body.appendChild(f); setTimeout(() => f.remove(), 1100); },
  flash() { const f = $("#flash"); f.animate([{ opacity: .85 }, { opacity: 0 }], { duration: 500 }); },
};
const FX = {
  parts: [], run: false,
  loop() { const cv = $("#fx"), g = cv.getContext("2d"); g.clearRect(0, 0, cv.width, cv.height); this.parts = this.parts.filter(p => p.l > 0);
    for (const p of this.parts) { p.x += p.vx; p.y += p.vy; p.vy += p.g; p.r += p.vr; p.l -= p.dl; g.save(); g.globalAlpha = Math.max(0, Math.min(1, p.l)); g.translate(p.x, p.y); g.rotate(p.r);
      if (p.e) { g.font = p.s + "px serif"; g.textAlign = "center"; g.fillText(p.e, 0, 0); } else { g.fillStyle = p.c; g.beginPath(); g.ellipse(0, 0, p.s, p.s * .6, 0, 0, 7); g.fill(); } g.restore(); }
    if (this.parts.length) requestAnimationFrame(() => this.loop()); else this.run = false; },
  add(ps) { const cv = $("#fx"); cv.width = innerWidth; cv.height = innerHeight; this.parts.push(...ps); if (!this.run) { this.run = true; this.loop(); } },
  splat(x, y, c, n = 16) { this.add([...Array(n)].map(() => { const a = Math.random() * 7, s = 2 + Math.random() * 6; return { x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 2, g: .25, r: a, vr: 0, s: 3 + Math.random() * 6, c, l: 1, dl: .03 }; })); },
  confetti() { const C = Object.values(PAINT).map(p => p[0]); this.add([...Array(140)].map(() => ({ x: Math.random() * innerWidth, y: -20 - Math.random() * 300, vx: (Math.random() - .5) * 3, vy: 2 + Math.random() * 3, g: .03, r: Math.random() * 6, vr: (Math.random() - .5) * .3, s: 5 + Math.random() * 5, c: pick(C), l: 3, dl: .012 }))); },
  burst(x, y, em = ["⭐", "✨", "🎨", "💖"], n = 24) { this.add([...Array(n)].map(() => { const a = Math.random() * 7, s = 3 + Math.random() * 7; return { x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 2, g: .16, r: 0, vr: (Math.random() - .5) * .2, s: 20 + rnd(18), e: pick(em), l: 1.4, dl: .018 }; })); },
};
const centerOf = e => { const r = e.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; };

/* ================= progress ================= */
const found = () => store.get("found", [...BASE]);
const saveFound = f => store.set("found", f);
const prog = i => store.get("art" + i, null);
const passed = a => !!(prog(a.i) || {}).passed;
const roomOpen = l => l === 1 || ART.filter(a => a.lvl === l - 1).every(passed);
const awards = () => store.get("awards", {});
const STARS = (pct, need) => pct >= 100 ? 3 : pct >= 75 ? 2 : pct >= Math.max(need, 1) ? 1 : 0;

/* ================= SPLASH ================= */
$("#cover").src = KID.cover;
$("#press").onclick = async () => {
  Audio8.unlock(); Audio8.play("menu"); Audio8.fx("tada");
  $("#press").style.display = "none"; FX.confetti();
  await Voice.talk([[`Welcome to ${NAME} Paint!`], [KID.zh, "zh-CN"]]);
  goMuseum();
};

/* ================= MUSEUM ================= */
const ROOMNAME = ["Room of Shapes", "Room of Sunshine", "Room of Dreams", "Room of Nature", "Room of Masters"];
function goMuseum() { UI.go("museum", "#ff4fa0", () => { renderMuseum(); Audio8.play("menu"); }); }
function renderMuseum() {
  const aw = awards(); $("#mtitle").textContent = `${UPNAME}'S MUSEUM`; $("#mcolors").textContent = `${aw.trophy ? "🏆" : ""}${aw.medal ? "🏅" : ""} 🎨 ${found().length}/${Object.keys(PAINT).length}`;
  const box = $("#rooms"); box.innerHTML = "";
  for (let l = 1; l <= 5; l++) {
    const open = roomOpen(l), arts = ART.filter(a => a.lvl === l), done = arts.filter(passed).length;
    const need = l === 5 ? "The last two: copy the colors perfectly! 💯" : "Paint all 5 to open the next room!";
    const r = el("div", "room" + (open ? "" : " locked"), `<div class="rhead"><b>${open ? "🚪" : "🔒"} ${l}. ${ROOMNAME[l - 1]}</b><span>${done}/5 ⭐</span></div><div class="rsub">${open ? need : "Finish the room before to open!"}</div><div class="frames"></div>`);
    arts.forEach(a => {
      const p = prog(a.i), f = el("button", "frame" + (p && p.passed ? " done" : ""));
      const img = p && p.thumb ? p.thumb : `art/${a.n}.jpg`;
      f.innerHTML = `<div class="pic"><img src="${img}" alt="" class="${p && p.thumb ? "" : "orig"}">${open ? "" : "<i>🔒</i>"}</div><div class="plate">${a.t}<small>${PAINTERS[a.p].flag} ${PAINTERS[a.p].n}${a.need === 100 ? " · 💯" : ""}</small></div>
        <div class="fstars">${p && p.passed ? (a.need === 100 ? (a.pos === 24 ? "🏆" : "🏅") : p.mode === "free" ? "🌈" : "⭐") : ""}</div>`;
      f.onclick = () => { if (!open) { Audio8.fx("oops"); UI.bubble(f, `🔒 Finish room ${l - 1} first!`); Voice.en(`Finish room ${l - 1} first!`); return; } Audio8.fx("tap"); meet(a); };
      r.querySelector(".frames").appendChild(f);
    });
    box.appendChild(r);
  }
}

/* ================= MEET THE PAINTER ================= */
let cur = null, mode = "exact";
async function meet(a) {
  cur = a; const P = PAINTERS[a.p], C = COUNTRY[P.flag], perfect = a.need === 100;
  await UI.go("meet", null, async () => {
    Audio8.play(a.music, a.amb);
    const meta = await getMeta(a); const cols = colorsOf(meta);
    $("#meetBox").innerHTML = `<div class="mtop"><div class="painter jump">${painterHTML(a.p)}</div>
        <div class="minfo"><div class="pname">${P.n}</div><div class="pcountry">${P.flag} ${C[0]}<br><b>${C[1]}</b> ${pyHTML(C[2])}</div><div class="ptitle">“${a.t}” · ${a.y}</div></div></div>
      <div class="msay" id="msay"></div>
      ${perfect ? `<div class="perfect">💯 Nesta obra você precisa copiar <b>perfeitamente</b> as cores do original! Você consegue, ${NAME}! 💪</div>` : ""}
      <div class="mycolors"><div class="small">My colors:</div><div class="chips">${cols.map(c => chipHTML(c)).join("")}</div></div>
      <div class="zhword">🇨🇳 <b>${a.zh[0]}</b> ${pyHTML(a.zh[1])} = ${a.zh[2]}</div>
      <div class="modes"><button class="mbtn exact" id="goExact">🎯 <span>Copy the colors</span></button>
      ${perfect ? "" : `<button class="mbtn free" id="goFree">🌈 <span>My way!</span></button>`}</div>`;
    $$("#meetBox .chip").forEach(ch => ch.onclick = () => { Audio8.fx("pop"); Voice.color(ch.dataset.c); });
    $("#goExact").onclick = () => { mode = "exact"; startPaint(a); };
    if (!perfect) $("#goFree").onclick = () => { mode = "free"; startPaint(a); };
  });
  const lines = [`${P.hi}, ${NAME}! I am ${P.n}!`, `I am from ${C[0]}!`, a.say]; if (KID.jokes[a.i]) lines.push(KID.jokes[a.i]);
  $(".painter").classList.add("talk"); const items = [];
  for (const l of lines) { items.push([l, P.v, { rate: .92 }]); if (l.startsWith("I am from")) items.push([C[1], "zh-CN"]); }
  if (perfect) items.push([`Nesta obra você precisa copiar perfeitamente as cores do original! Você consegue, ${NAME}!`, "pt-BR"]);
  items.push([`In Chinese, ${a.zh[2]} is...`], [a.zh[0], "zh-CN"]);
  // show each line while it is spoken
  let k = 0; const show = () => { const t = lines[Math.min(k, lines.length - 1)]; $("#msay") && ($("#msay").textContent = t); };
  show(); const tick = setInterval(() => { if (UI.cur !== "meet") return clearInterval(tick); }, 500);
  for (const it of items) { if (UI.cur !== "meet") break; if (lines.includes(it[0])) { k = lines.indexOf(it[0]); show(); } const ok = await Voice.talk([it]); if (!ok) break; }
  clearInterval(tick); $(".painter")?.classList.remove("talk");
}
function chipHTML(c) {
  const have = found().includes(c), r = RECIPES[c];
  return `<button class="chip" data-c="${c}"><i style="background:${PAINT[c][0]}"></i><span>${PAINT[c][1]}<br><b>${PAINT[c][2]}</b> ${pyHTML(PAINT[c][3])}</span>${!have && r ? `<em>${dot(r[0])}+${dot(r[1])}</em>` : ""}</button>`;
}
const dot = c => `<i class="d" style="background:${PAINT[c][0]}"></i>`;
const metaCache = {};
async function getMeta(a) { return metaCache[a.i] || (metaCache[a.i] = await (await fetch(`pages/${a.n}.json`)).json()); }
function colorsOf(meta) { const area = {}; meta.regions.forEach(r => { if (!r.lock) area[r.c] = (area[r.c] || 0) + r.a; }); return Object.keys(area).sort((x, y) => area[y] - area[x]); }

/* ================= PAINT ================= */
const P8 = { cv: null, g: null, W: 0, H: 0, reg: null, sketch: null, detail: null, edge: null, img: null, pix: [], box: [], fills: [], meta: null, brush: null, water: 0, zoom: 1, panX: 0, panY: 0, hist: [] };
function loadPix(src) { return new Promise((res, rej) => { const i = new Image(); i.onerror = () => rej(new Error("image " + src)); i.onload = () => { const c = document.createElement("canvas"); c.width = i.width; c.height = i.height; const g = c.getContext("2d"); g.drawImage(i, 0, 0); res(g.getImageData(0, 0, i.width, i.height).data); }; i.src = src; }); }
async function startPaint(a) {
  await UI.go("paint", null, async () => {
    const meta = await getMeta(a); P8.meta = meta; const W = meta.w, H = meta.h; P8.W = W; P8.H = H;
    const [rp, tp] = await Promise.all([loadPix(`pages/${a.n}.png`), loadPix(`pages/${a.n}.tex.jpg`)]);
    const N = W * H, reg = new Uint8Array(N), sk = new Uint8Array(N), dt = new Int16Array(N), edge = new Uint8Array(N);
    for (let p = 0; p < N; p++) { reg[p] = rp[p * 4]; sk[p] = tp[p * 4]; dt[p] = tp[p * 4 + 1] - 128; }
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const p = y * W + x, r = reg[p]; if ((x < W - 1 && reg[p + 1] !== r) || (y < H - 1 && reg[p + W] !== r)) { edge[p] = 1; if (x < W - 1) edge[p + 1] = 1; } }
    const nR = meta.regions.length + 1, cnt = new Int32Array(nR); for (let p = 0; p < N; p++) cnt[reg[p]]++;
    P8.pix = [...cnt].map(c => new Int32Array(c)); const k = new Int32Array(nR); P8.box = [...Array(nR)].map(() => [W, H, 0, 0]);
    for (let p = 0; p < N; p++) { const r = reg[p]; P8.pix[r][k[r]++] = p; const b = P8.box[r], x = p % W, y = (p / W) | 0; if (x < b[0]) b[0] = x; if (y < b[1]) b[1] = y; if (x > b[2]) b[2] = x; if (y > b[3]) b[3] = y; }
    Object.assign(P8, { reg, sketch: sk, detail: dt, edge, brush: null, hist: [], zoom: 1, panX: 0, panY: 0 });
    const saved = prog(a.i); P8.fills = Array(nR).fill(null);
    meta.regions.forEach(r => { if (r.lock) P8.fills[r.id] = r.c; });
    if (saved && saved.fills && saved.mode === mode && !saved.passed) saved.fills.forEach((c, i) => { if (c) P8.fills[i] = c; });
    const cv = $("#pcv"); cv.width = W; cv.height = H; P8.cv = cv; P8.g = cv.getContext("2d"); P8.img = P8.g.createImageData(W, H);
    $("#ov").width = W * 2; $("#ov").height = H * 2;
    fitCanvas(); renderAll(); renderPots(); renderBrush(); renderScore(); drawHints();
    $("#gthumb").src = `art/${a.n}.jpg`; $("#gbig img").src = `art/${a.n}.jpg`; $("#ptitle").textContent = a.t;
    $("#gwrap").classList.toggle("hide", false); closeGab();
    $("#paint").classList.toggle("exact", mode === "exact");
  });
  const P = PAINTERS[a.p], first = !store.get("tutorial", false);
  $("#finishBtn").style.display = ""; 
  if (first) { store.set("tutorial", true); Voice.en("Tap a paint pot to dip your brush. Then tap the picture!"); }
  else Voice.say(mode === "exact" ? `Look at my painting up there, ${NAME}!` : `Paint it your way, ${NAME}!`, P.v);
}
function fitCanvas() {
  const area = $("#parea"), aw = area.clientWidth - 12, ah = area.clientHeight - 12, s = Math.min(aw / P8.W, ah / P8.H);
  P8.base = s; applyZoom();
}
function applyZoom() {
  const s = P8.base * P8.zoom, w = P8.W * s, h = P8.H * s, area = $("#parea"), aw = area.clientWidth, ah = area.clientHeight;
  const mx = Math.max(0, (w - aw) / 2 + 20), my = Math.max(0, (h - ah) / 2 + 20); P8.panX = Math.max(-mx, Math.min(mx, P8.panX)); P8.panY = Math.max(-my, Math.min(my, P8.panY));
  const st = `width:${w}px;height:${h}px;left:${(aw - w) / 2 + P8.panX}px;top:${(ah - h) / 2 + P8.panY}px`;
  $("#pcv").style.cssText = st; $("#ov").style.cssText = st;
}
const PAPER = [252, 248, 240];
function shade(p, c) { // c = rgb or null
  const d = P8.detail[p], s = P8.sketch[p];
  if (P8.edge[p]) return c ? [c[0] * .45, c[1] * .45, c[2] * .45] : [70, 50, 70];
  if (!c) { const v = .55 + .45 * (s / 255); return [PAPER[0] * v, PAPER[1] * v, PAPER[2] * v]; }
  const k = .55; return [c[0] + d * k, c[1] + d * k, c[2] + d * k];
}
function paintPix(list, c, D, cond) {
  const rgb = c ? hex2rgb(PAINT[c][0]) : null;
  for (let i = 0; i < list.length; i++) { const p = list[i]; if (cond && !cond(p)) continue; const v = shade(p, rgb), o = p * 4; D[o] = v[0]; D[o + 1] = v[1]; D[o + 2] = v[2]; D[o + 3] = 255; }
}
function renderAll() { const D = P8.img.data; for (let r = 0; r < P8.pix.length; r++) paintPix(P8.pix[r], P8.fills[r], D); P8.g.putImageData(P8.img, 0, 0); }
function fillRegion(r, c, x0, y0) {
  const list = P8.pix[r], D = P8.img.data, b = P8.box[r], W = P8.W; let maxd = 0;
  for (const [cx, cy] of [[b[0], b[1]], [b[2], b[1]], [b[0], b[3]], [b[2], b[3]]]) maxd = Math.max(maxd, Math.hypot(cx - x0, cy - y0));
  const t0 = performance.now(), dur = Math.min(520, 160 + maxd * 1.6), rgb = hex2rgb(PAINT[c][0]);
  const dist = new Float32Array(list.length); for (let i = 0; i < list.length; i++) { const p = list[i], x = p % W, y = (p / W) | 0; dist[i] = Math.hypot(x - x0, y - y0) * (1 + .25 * Math.sin(Math.atan2(y - y0, x - x0) * 7)); }
  const step = ts => { const R = (ts - t0) / dur * maxd * 1.3;
    for (let i = 0; i < list.length; i++) if (dist[i] <= R && dist[i] >= 0) { const p = list[i], v = shade(p, rgb), o = p * 4; D[o] = v[0]; D[o + 1] = v[1]; D[o + 2] = v[2]; dist[i] = -1; }
    P8.g.putImageData(P8.img, 0, 0, b[0], b[1], b[2] - b[0] + 1, b[3] - b[1] + 1);
    if (R < maxd * 1.3) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}
function drawHints() {
  const ov = $("#ov"), g = ov.getContext("2d"); g.clearRect(0, 0, ov.width, ov.height); if (mode !== "exact") return;
  for (const r of P8.meta.regions) { if (r.lock || P8.fills[r.id] === r.c) continue;
    const rad = Math.max(5, Math.min(r.r * .55, 11)) * 2 / Math.max(1, P8.zoom * .8), x = r.x * 2, y = r.y * 2;
    g.beginPath(); g.arc(x, y, rad + 3, 0, 7); g.fillStyle = "#fff"; g.fill(); g.beginPath(); g.arc(x, y, rad, 0, 7); g.fillStyle = PAINT[r.c][0]; g.fill();
    if (P8.fills[r.id]) { g.lineWidth = 3; g.strokeStyle = "#e3262e"; g.beginPath(); g.arc(x, y, rad + 6, 0, 7); g.stroke(); } }
}
function score() { const rs = P8.meta.regions.filter(r => !r.lock); const ok = rs.filter(r => P8.fills[r.id] === r.c).length, filled = rs.filter(r => P8.fills[r.id]).length; return { pct: Math.round(ok / rs.length * 100), filled, total: rs.length }; }
function renderScore() {
  const s = score(); $("#pfill").style.width = (s.filled / s.total * 100) + "%";
  $("#pscore").innerHTML = cur.need === 100 ? `💯 ${s.pct}%` : `${mode === "exact" ? "🎯" : "🌈"} ${s.filled}/${s.total}`;
}
/* ---- pots, brush, water ---- */
function renderPots() {
  const f = found(), need = new Set(colorsOf(P8.meta)); const order = [...BASE, ...f.filter(c => !BASE.includes(c))];
  $("#pots").innerHTML = order.map(c => `<button class="pot${need.has(c) && mode === "exact" ? " want" : ""}" data-c="${c}"><i style="background:${PAINT[c][0]}"></i><small>${PAINT[c][1]}</small></button>`).join("");
  $$("#pots .pot").forEach(b => b.onclick = () => dip(b.dataset.c, b));
}
function renderBrush() {
  const c = P8.brush; $("#btip").style.background = c ? PAINT[c][0] : "#f2ece0";
  $("#bname").innerHTML = c ? `${PAINT[c][1]}<br><b>${PAINT[c][2]}</b> ${pyHTML(PAINT[c][3])}` : "clean";
  $("#water i").style.opacity = Math.min(.85, P8.water * .14); $("#water i").style.background = P8.lastWash ? PAINT[P8.lastWash][0] : "transparent";
}
let dirtyWarned = false;
async function dip(c, btn) {
  const [x, y] = centerOf(btn); Audio8.fx("dip");
  if (!P8.brush) { P8.brush = c; renderBrush(); FX.splat(x, y, PAINT[c][0], 8); Voice.color(c); return; }
  if (P8.brush === c) { Voice.color(c); return; }
  const was = P8.brush, res = mix(was, c); P8.brush = res; renderBrush(); FX.splat(x, y, PAINT[res][0], 12);
  const f = found();
  if (!f.includes(res)) { f.push(res); saveFound(f); renderPots(); discover(was, c, res); return; }
  if (res === "brown" && !(RECIPES.brown.includes(was) && RECIPES.brown.includes(c))) { Audio8.fx("mud"); UI.bubble($("#water"), "💧 Muddy! Wash your brush!"); Voice.en("Oops! Muddy brown! Wash your brush in the water!"); return; }
  if (!dirtyWarned) { dirtyWarned = true; UI.bubble($("#water"), `Your brush had ${PAINT[was][1]}! 💧 Wash it first!`); Voice.en(`Oh! Your brush still had ${PAINT[was][1]}! ${PAINT[was][1]} and ${PAINT[c][1]} make ${PAINT[res][1]}! Wash your brush to get a clean color!`); return; }
  Voice.talk([[`${PAINT[was][1]} and ${PAINT[c][1]} make ${PAINT[res][1]}!`], [PAINT[res][2], "zh-CN"]]);
}
async function discover(a, b, c) {
  Audio8.fx("magic"); FX.burst(innerWidth / 2, innerHeight * .5, ["✨", "🌟", "🎨"], 26);
  const d = el("div", "discover", `<div class="dmix">${dot(a)} + ${dot(b)} = <i class="big" style="background:${PAINT[c][0]}"></i></div><div class="dname">NEW COLOR!<br><b>${PAINT[c][1].toUpperCase()}</b></div><div class="dzh">${PAINT[c][2]} ${pyHTML(PAINT[c][3])}</div>`);
  document.body.appendChild(d); setTimeout(() => d.classList.add("out"), 3600); setTimeout(() => d.remove(), 4000);
  await Voice.talk([[`Wow! ${PAINT[a][1]} and ${PAINT[b][1]} make... ${PAINT[c][1]}! A new color!`], [PAINT[c][2], "zh-CN"]]);
}
$("#water").onclick = () => { if (P8.brush) { P8.lastWash = P8.brush; P8.water++; } P8.brush = null; Audio8.fx("bloop"); renderBrush();
  const [x, y] = centerOf($("#water")); FX.burst(x, y - 20, ["💧", "🫧"], 8);
  if (P8.water >= 7) { UI.bubble($("#water"), "The water is so dirty! 🤢 Tap again to change it!"); P8.water = 7.5; }
  else if (P8.water === 7.5) { P8.water = 0; P8.lastWash = null; renderBrush(); Voice.en("Fresh clean water!"); }
};
$("#bwrap").onclick = () => { if (P8.brush) Voice.color(P8.brush); else Voice.en("Your brush is clean! Dip it in a paint pot!"); };
$("#undo").onclick = () => { const h = P8.hist.pop(); if (!h) return; P8.fills[h[0]] = h[1]; Audio8.fx("whoosh"); paintPix(P8.pix[h[0]], h[1], P8.img.data); P8.g.putImageData(P8.img, 0, 0); drawHints(); renderScore(); autosave(); };
$("#zin").onclick = () => { P8.zoom = P8.zoom >= 2.9 ? 1 : P8.zoom < 1.9 ? 2 : 3; if (P8.zoom === 1) P8.panX = P8.panY = 0; $("#zin").textContent = P8.zoom === 1 ? "🔍" : "🔎×" + P8.zoom; applyZoom(); drawHints(); Audio8.fx("tap"); };
$("#finishBtn").onclick = () => { Audio8.fx("tap"); finish(true); };
/* ---- tapping & panning the canvas ---- */
(() => {
  const area = $("#parea"); let down = null, pinch = null; const pts = new Map();
  area.addEventListener("pointerdown", e => { pts.set(e.pointerId, [e.clientX, e.clientY]); if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), z: P8.zoom }; down = null; return; }
    down = { x: e.clientX, y: e.clientY, px: P8.panX, py: P8.panY, moved: false }; });
  area.addEventListener("pointermove", e => { if (!pts.has(e.pointerId)) return; pts.set(e.pointerId, [e.clientX, e.clientY]);
    if (pinch && pts.size === 2) { const [a, b] = [...pts.values()]; P8.zoom = Math.max(1, Math.min(4, pinch.z * Math.hypot(a[0] - b[0], a[1] - b[1]) / pinch.d)); applyZoom(); return; }
    if (!down) return; const dx = e.clientX - down.x, dy = e.clientY - down.y; if (Math.hypot(dx, dy) > 10 && P8.zoom > 1) { down.moved = true; P8.panX = down.px + dx; P8.panY = down.py + dy; applyZoom(); } });
  const up = e => { pts.delete(e.pointerId); if (pinch) { if (pts.size < 2) { pinch = null; drawHints(); } return; } if (!down) return; const d = down; down = null; if (!d.moved) tapAt(e.clientX, e.clientY); };
  area.addEventListener("pointerup", up); area.addEventListener("pointercancel", e => { pts.delete(e.pointerId); down = null; pinch = null; });
})();
let lastHint = 0;
async function tapAt(cx, cy) {
  const r = $("#pcv").getBoundingClientRect(); const x = Math.floor((cx - r.left) / r.width * P8.W), y = Math.floor((cy - r.top) / r.height * P8.H);
  if (x < 0 || y < 0 || x >= P8.W || y >= P8.H) return; const id = P8.reg[y * P8.W + x], R = P8.meta.regions[id - 1]; if (!R || R.lock) return;
  if (!P8.brush) { Audio8.fx("oops"); UI.bubble($("#pots"), "🖌️ Dip your brush in a paint first!"); if (Date.now() - lastHint > 4000) { lastHint = Date.now(); Voice.en("Dip your brush in a paint pot first!"); } return; }
  if (P8.fills[id] === P8.brush) return;
  P8.hist.push([id, P8.fills[id]]); if (P8.hist.length > 40) P8.hist.shift();
  P8.fills[id] = P8.brush; fillRegion(id, P8.brush, x, y); Audio8.fx(Math.random() < .5 ? "splash" : "brush"); FX.splat(cx, cy, PAINT[P8.brush][0], 10);
  if (mode === "exact") { if (P8.brush === R.c) { if (Math.random() < .25) UI.float(cx, cy, pick(["✨", "⭐", "Yes!", "💖"])); }
    else if (Math.random() < .35 && Date.now() - lastHint > 5000) { lastHint = Date.now(); const P = PAINTERS[cur.p]; Voice.say(`Hmm... look at my painting, ${NAME}! I used ${PAINT[R.c][1]} there!`, P.v); $("#gwrap").classList.add("blink"); setTimeout(() => $("#gwrap").classList.remove("blink"), 1600); } }
  drawHints(); renderScore(); autosave();
  const s = score(); if (s.filled === s.total) setTimeout(() => finish(false), 700);
}
let saveT = 0;
function autosave() { clearTimeout(saveT); saveT = setTimeout(() => { const old = prog(cur.i) || {}; store.set("art" + cur.i, { ...old, fills: P8.fills, mode: old.passed ? old.mode : mode, wip: 1 }); }, 400); }
/* ---- answer key (gabarito) ---- */
function openGab() { $("#gbig").classList.add("on"); $("#gback").classList.add("on"); Audio8.fx("whoosh"); }
function closeGab() { $("#gbig").classList.remove("on"); $("#gback").classList.remove("on"); }
$("#gwrap").onclick = openGab; $("#gx").onclick = e => { e.stopPropagation(); closeGab(); }; $("#gback").onclick = closeGab;
(() => { const g = $("#gbig"); let d = null;
  g.addEventListener("pointerdown", e => { if (e.target.id === "gx") return; d = { x: e.clientX, y: e.clientY, l: g.offsetLeft, t: g.offsetTop }; g.setPointerCapture(e.pointerId); });
  g.addEventListener("pointermove", e => { if (!d) return; g.style.left = Math.max(0, Math.min(innerWidth - 80, d.l + e.clientX - d.x)) + "px"; g.style.top = Math.max(0, Math.min(innerHeight - 80, d.t + e.clientY - d.y)) + "px"; g.style.right = "auto"; });
  g.addEventListener("pointerup", () => d = null); })();
/* ---- mixing table ---- */
let mixA = null, mixB = null;
$("#mixbtn").onclick = () => { mixA = mixB = null; renderMixer(); $("#mixer").classList.add("on"); Audio8.fx("whoosh"); Voice.en("Mixing table! Pick two colors!"); };
$("#mclose").onclick = () => { $("#mixer").classList.remove("on"); Audio8.fx("tap"); };
function renderMixer() {
  const f = found(); $("#mwells").innerHTML = `<div class="well" id="wa">${mixA ? `<i style="background:${PAINT[mixA][0]}"></i>` : "1"}</div><b>+</b><div class="well" id="wb">${mixB ? `<i style="background:${PAINT[mixB][0]}"></i>` : "2"}</div><b>=</b><div class="well res" id="wr">?</div>`;
  $("#mpots").innerHTML = [...BASE, ...f.filter(c => !BASE.includes(c))].map(c => `<button class="pot" data-c="${c}"><i style="background:${PAINT[c][0]}"></i><small>${PAINT[c][1]}</small></button>`).join("");
  $$("#mpots .pot").forEach(b => b.onclick = () => mixPick(b.dataset.c));
  const need = P8.meta ? colorsOf(P8.meta) : [];
  $("#mbook").innerHTML = Object.entries(RECIPES).map(([r, [a, b]]) => { const has = f.includes(r), w = need.includes(r);
    return `<div class="rec${has ? "" : " no"}${w ? " w" : ""}">${dot(a)}+${dot(b)}=${has ? dot(r) : "<i class='d q'>?</i>"}<span>${has ? PAINT[r][1] : w ? "I need this!" : "???"}</span></div>`; }).join("");
}
async function mixPick(c) {
  Audio8.fx("dip"); Voice.color(c);
  if (!mixA) { mixA = c; renderMixer(); return; } if (mixB) { mixA = c; mixB = null; renderMixer(); return; }
  mixB = c; renderMixer(); const res = mix(mixA, mixB); await sleep(500);
  $("#wr").classList.add("swirl"); $("#wr").style.background = `conic-gradient(${PAINT[mixA][0]},${PAINT[mixB][0]},${PAINT[mixA][0]})`; Audio8.fx("swirl"); await sleep(1100);
  $("#wr").classList.remove("swirl"); $("#wr").style.background = PAINT[res][0]; $("#wr").innerHTML = "🖌️";
  const f = found(), isNew = !f.includes(res); if (isNew) { f.push(res); saveFound(f); }
  if (isNew) discover(mixA, mixB, res); else Voice.talk([[`${PAINT[mixA][1]} and ${PAINT[mixB][1]} make ${PAINT[res][1]}!`], [PAINT[res][2], "zh-CN"]]);
  renderMixer(); $("#wr").style.background = PAINT[res][0]; $("#wr").innerHTML = "🖌️<small>use it!</small>"; $("#wr").classList.add("ready");
  $("#wr").onclick = () => { P8.brush = res; renderBrush(); renderPots(); $("#mixer").classList.remove("on"); Audio8.fx("dip"); Voice.en(`Your brush has ${PAINT[res][1]}!`); };
}
$("#pback").onclick = () => { Audio8.fx("tap"); goMuseum(); };

/* ================= FINISH ================= */
function thumbData(w = 320) { const c = document.createElement("canvas"); const s = w / P8.W; c.width = w; c.height = Math.round(P8.H * s); c.getContext("2d").drawImage(P8.cv, 0, 0, c.width, c.height); return c.toDataURL("image/jpeg", .72); }
const nextArt = () => ART.find(x => x.pos > cur.pos && roomOpen(x.lvl) && !passed(x)) || ART.find(x => x.pos > cur.pos && roomOpen(x.lvl));
async function finish(byButton) {
  if (UI.cur !== "paint" || $("#done").classList.contains("on")) return; const s = score(), a = cur, P = PAINTERS[a.p];
  const perfect = a.need === 100;
  if (perfect && s.pct < 100) {
    Audio8.fx("oops"); $("#gwrap").classList.add("blink"); setTimeout(() => $("#gwrap").classList.remove("blink"), 1600);
    UI.bubble($("#parea"), `Quase lá! ${s.pct}% 💪<br>Copie <b>perfeitamente</b> as cores do original. Olhe as bolinhas!`, 4200);
    Voice.talk([[`Quase lá, ${NAME}! Você precisa copiar perfeitamente as cores do original. Olhe as bolinhas coloridas e o quadro lá em cima. Você consegue!`, "pt-BR"]]); return;
  }
  const old = prog(a.i) || {};
  const rec = { fills: P8.fills, mode, pct: s.pct, thumb: thumbData(), passed: true, stars: 1 };
  if (!store.set("art" + a.i, rec)) store.set("art" + a.i, { ...rec, thumb: thumbData(160) });
  const wasOpen = [1, 2, 3, 4, 5].map(l => l === 1 || ART.filter(x => x.lvl === l - 1).every(x => x === a ? !!old.passed : passed(x)));
  $("#dmine").src = rec.thumb; $("#dorig").src = `art/${a.n}.jpg`; $("#dpainter").innerHTML = painterHTML(a.p);
  $("#dtitle").innerHTML = `BRAVO, ${UPNAME}!`; $("#dstars").textContent = perfect ? "💯" : mode === "free" ? "🌈" : "⭐";
  $("#dmsg").innerHTML = perfect ? `Perfect! Just like ${P.n.split(" ").pop()}!` : byButton && s.filled < s.total ? `A beautiful ${a.t}! 💖` : `Your own ${a.t}! 💖`;
  const nx = nextArt(); $("#dnext").style.display = nx ? "" : "none"; if (nx) $("#dnext").innerHTML = `➡️ Next: <small>${nx.t}</small>`;
  Audio8.play("win"); Audio8.fx("applause"); FX.confetti(); setTimeout(() => FX.burst(innerWidth / 2, innerHeight * .3), 500);
  $("#done").classList.add("on");
  await Voice.talk([[`${P.bye} Bravo, ${NAME}!`, P.v]]);
  const nowOpen = [1, 2, 3, 4, 5].map(roomOpen); const newRoom = nowOpen.findIndex((o, i) => o && !wasOpen[i]);
  if (newRoom >= 0) { Audio8.fx("unlock"); FX.burst(innerWidth / 2, innerHeight / 2, ["🔓", "🚪", "⭐"], 30); $("#dmsg").innerHTML += `<div class="newroom">🔓 Room ${newRoom + 1} is open!</div>`; await Voice.en(`Wow! Room ${newRoom + 1} is open! New painters are waiting for you!`); }
  if (perfect) ceremony(a.pos === 24 ? "trophy" : "medal");
}
async function ceremony(kind) {
  const aw = awards(); aw[kind] = 1; store.set("awards", aw);
  const T = kind === "trophy";
  $("#cbox").innerHTML = `<div class="cicon">${T ? "🏆" : "🏅"}</div><h3>${T ? "GREAT PAINTER!" : "GOLD MEDAL!"}</h3>
    <div class="cname">${UPNAME}</div><div class="cpt">${T ? "Grande Pintora! 🎨" : "Medalha de ouro! ✨"}</div>
    <div class="czh"><b>${T ? "伟大的画家" : "金牌"}</b> ${pyHTML(T ? "wěi dà de huà jiā" : "jīn pái")} = ${T ? "great painter" : "gold medal"}</div>
    <div class="cfaces">👏👏👏🎉👏👏👏</div><button class="orow" id="cok">💖 Thank you!</button>`;
  $("#done").classList.remove("on"); $("#ceremony").classList.add("on");
  Audio8.play("win"); Audio8.fx("ovation"); FX.confetti(); [0, 700, 1400, 2100].forEach(d => setTimeout(() => { FX.burst(innerWidth * (.2 + Math.random() * .6), innerHeight * .3, ["🌟", "✨", T ? "🏆" : "🏅", "🎉"], 26); FX.confetti(); }, d));
  $("#cok").onclick = () => { $("#ceremony").classList.remove("on"); goMuseum(); };
  await Voice.talk([[T ? `${NAME}! You are a great painter! Everybody is clapping for you!` : `${NAME}! A gold medal for you!`],
    [T ? `Parabéns, ${NAME}! Você é uma grande pintora! Todo mundo está aplaudindo você!` : `Parabéns, ${NAME}! Você ganhou uma medalha de ouro!`, "pt-BR"],
    [T ? "伟大的画家" : "金牌", "zh-CN"]]);
}
$("#dmuseum").onclick = () => { $("#done").classList.remove("on"); goMuseum(); };
$("#dnext").onclick = () => { $("#done").classList.remove("on"); const nx = nextArt(); nx ? meet(nx) : goMuseum(); };
$("#dsave").onclick = () => { const a = document.createElement("a"); a.download = `${NAME}-${cur.t.replace(/\W+/g, "-")}.jpg`; a.href = thumbData(P8.W * 2 > 1000 ? 1000 : P8.W * 2); document.body.appendChild(a); a.click(); a.remove(); Audio8.fx("tada"); };

/* ================= OPTIONS ================= */
$("#gear").onclick = () => { Audio8.fx("tap"); renderOpts(); $("#opts").classList.add("on"); };
function renderOpts() {
  const done = ART.filter(passed).length;
  $("#obox").innerHTML = `<h3>⚙️ OPTIONS</h3>
   <button class="orow" id="oM">${Audio8.musicOn ? "🎵 Music: ON" : "🎵 Music: OFF"}</button><button class="orow" id="oS">${Audio8.sfxOn ? "🔊 Sounds & voices: ON" : "🔇 Sounds & voices: OFF"}</button>
   <button class="orow" id="oB">📖 My color book</button>
   <div class="small parent"><b>👨‍👩‍👧 Parent corner</b><br>Paintings finished: <b>${done}/25</b> · colors found: <b>${found().length}/${Object.keys(PAINT).length}</b><br>
   Chinese voice: <b>${Voice.has("zh") ? "✅" : "⚠️ install Chinese in Settings → Text-to-speech"}</b><br>Accent voices: ${["fr", "it", "nl", "de", "ja", "pt"].map(l => l + (Voice.has(l) ? "✅" : "—")).join(" ")}</div>
   <div id="oMain"><button class="orow danger" id="oR" style="width:100%">🗑️ Reset progress</button></div>
   <div id="oConf" hidden><p>Are you sure? All paintings and colors will be erased.</p><div class="obtns"><button id="oY" style="background:#e0262f">Yes, erase</button><button id="oN" style="background:#2bc46b">No</button></div></div>
   <button class="orow" id="oC">✖ Close</button>`;
  $("#oM").onclick = () => { Audio8.toggleMusic(); renderOpts(); }; $("#oS").onclick = () => { Audio8.toggleSfx(); renderOpts(); };
  $("#oB").onclick = () => { P8.meta = null; $("#opts").classList.remove("on"); mixA = mixB = null; renderMixer(); $("#mixer").classList.add("on"); };
  $("#oR").onclick = () => { $("#oMain").hidden = true; $("#oConf").hidden = false; Audio8.fx("oops"); };
  $("#oN").onclick = () => { $("#oMain").hidden = false; $("#oConf").hidden = true; };
  $("#oY").onclick = () => { store.clear(); $("#obox").innerHTML = "<h3>🧹 All new!</h3>"; setTimeout(() => location.reload(), 1000); };
  $("#oC").onclick = () => $("#opts").classList.remove("on");
}
$("#opts").onclick = e => { if (e.target.id === "opts") $("#opts").classList.remove("on"); };
addEventListener("resize", () => { if (UI.cur === "paint") { fitCanvas(); } });
if ("serviceWorker" in navigator) addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => { }));
