"use strict";
/* ================= Ateliê Brasil: motor do jogo ================= */
let WHO = null, NAME = "";
const perfis = () => gstore.get("perfis", {});
const perfil = id => perfis()[id] || {};
const setPerfil = (id, o) => { const p = perfis(); p[id] = { ...(p[id] || {}), ...o }; gstore.set("perfis", p); };
const Nome = () => NAME.charAt(0) + NAME.slice(1).toLowerCase();   // para a voz: "Julia"

/* ================= UI ================= */
const UI = {
  busy: false,
  async go(id, color, onSwap) {
    if (UI.busy) return false; UI.busy = true; Voice.cancel(); Saci.stop(); Missao.abort();
    const w = $("#wipe"); w.style.background = color || pick(["#21a050", "#ffd23f", "#2560d9", "#e3262e", "#ff8a1f"]); w.style.display = "block"; Audio8.fx("splash");
    w.animate([{ clipPath: "circle(0% at 50% 50%)" }, { clipPath: "circle(75% at 50% 50%)" }], { duration: 380, easing: "ease-in", fill: "forwards" });
    await sleep(390); $$(".screen").forEach(s => s.classList.toggle("on", s.id === id)); UI.cur = id;
    if (onSwap) try { await onSwap(); } catch (e) { console.error(e); }
    await sleep(80); w.animate([{ clipPath: "circle(75% at 50% 50%)" }, { clipPath: "circle(0% at 50% 50%)" }], { duration: 420, easing: "ease-out", fill: "forwards" });
    await sleep(430); w.style.display = "none"; UI.busy = false; return true;
  },
  bubble(target, html, ms = 2800) {
    $$(".bubble").forEach(b => b.remove()); const b = el("div", "bubble", html); document.body.appendChild(b);
    const r = target.getBoundingClientRect(); b.style.left = Math.max(8, Math.min(innerWidth - 248, r.left + r.width / 2 - 120)) + "px";
    b.style.top = Math.max(56, r.top - b.offsetHeight - 12) + "px"; setTimeout(() => b.classList.add("out"), ms); setTimeout(() => b.remove(), ms + 400);
  },
  float(x, y, t) { const f = el("div", "floaty", t); f.style.left = x + "px"; f.style.top = y + "px"; document.body.appendChild(f); setTimeout(() => f.remove(), 1100); },
  flash() { const f = $("#flash"); f.animate([{ opacity: .85 }, { opacity: 0 }], { duration: 500 }); },
};
/* 🔈 botão pequeno de "ouvir de novo" ao lado de cada texto */
const REPS = [];
const SPK = `<svg viewBox="0 0 24 24" width="19" height="19" aria-hidden="true"><path d="M3 9h4l5-4v14l-5-4H3z" fill="#2a1a10"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" fill="none" stroke="#2a1a10" stroke-width="2.2" stroke-linecap="round"/></svg>`;
const rep = items => { REPS.push(items); return `<button class="rep" data-i="${REPS.length - 1}" aria-label="ouvir de novo">${SPK}</button>`; };
const limpa = t => t.replace(/<[^>]+>/g, " ").replace(/[^\p{L}\p{N} ,.!?'()-]/gu, " ").replace(/\s+/g, " ").trim();
document.addEventListener("click", e => {
  const b = e.target.closest && e.target.closest(".rep"); if (!b) return;
  e.stopPropagation(); e.preventDefault(); Audio8.unlock(); Audio8.fx("tap"); const it = REPS[+b.dataset.i];
  b.animate([{ transform: "scale(1)" }, { transform: "scale(1.35)" }, { transform: "scale(1)" }], { duration: 400 });
  if (Voice.failed && Array.isArray(it)) UI.bubble(b, it.map(x => x[0]).join(" "), 2600 + it.reduce((n, x) => n + x[0].length, 0) * 45);   // sem voz: mostra o texto
  typeof it === "function" ? it() : Voice.talk(it);
}, true);
/* voz: destrava no primeiro toque; se o navegador não tiver voz, avisa uma vez */
document.addEventListener("pointerdown", () => { Audio8.unlock(); Voice.unlock(); }, { once: true, capture: true });
Voice.onFail = () => {
  if ($("#semvoz")) return;
  const d = el("div", "", `<span>🔇 Este navegador está sem voz. Abra o jogo no <b>Chrome</b> para ouvir as histórias! Até lá, o ${SPK} mostra o texto.</span><button aria-label="fechar">✖</button>`);
  d.id = "semvoz"; document.body.appendChild(d); d.querySelector("button").onclick = () => d.remove(); setTimeout(() => d.remove(), 12000);
};
const FX = {
  parts: [], run: false,
  loop() { const cv = $("#fx"), g = cv.getContext("2d"); g.clearRect(0, 0, cv.width, cv.height); this.parts = this.parts.filter(p => p.l > 0);
    for (const p of this.parts) { p.x += p.vx; p.y += p.vy; p.vy += p.g; p.r += p.vr; p.l -= p.dl; g.save(); g.globalAlpha = Math.max(0, Math.min(1, p.l)); g.translate(p.x, p.y); g.rotate(p.r);
      if (p.e) { g.font = p.s + "px serif"; g.textAlign = "center"; g.fillText(p.e, 0, 0); } else { g.fillStyle = p.c; g.beginPath(); g.ellipse(0, 0, p.s, p.s * .6, 0, 0, 7); g.fill(); } g.restore(); }
    if (this.parts.length) requestAnimationFrame(() => this.loop()); else this.run = false; },
  add(ps) { const cv = $("#fx"); cv.width = innerWidth; cv.height = innerHeight; this.parts.push(...ps); if (!this.run) { this.run = true; this.loop(); } },
  splat(x, y, c, n = 16) { this.add([...Array(n)].map(() => { const a = Math.random() * 7, s = 2 + Math.random() * 6; return { x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 2, g: .25, r: a, vr: 0, s: 3 + Math.random() * 6, c, l: 1, dl: .03 }; })); },
  confetti() { const C = ["#21a050", "#ffd23f", "#2560d9", "#e3262e", "#ff8a1f", "#ff8fbf", "#fff"]; this.add([...Array(140)].map(() => ({ x: Math.random() * innerWidth, y: -20 - Math.random() * 300, vx: (Math.random() - .5) * 3, vy: 2 + Math.random() * 3, g: .03, r: Math.random() * 6, vr: (Math.random() - .5) * .3, s: 5 + Math.random() * 5, c: pick(C), l: 3, dl: .012 }))); },
  burst(x, y, em = ["⭐", "✨", "🎨", "💚"], n = 24) { this.add([...Array(n)].map(() => { const a = Math.random() * 7, s = 3 + Math.random() * 7; return { x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 2, g: .16, r: 0, vr: (Math.random() - .5) * .2, s: 20 + rnd(18), e: pick(em), l: 1.4, dl: .018 }; })); },
};
/* janela com moldura e barra de rolagem "tipo Windows" (▲ ▼ e polegar) + seta que pisca quando tem mais embaixo */
function scrollify(box) {
  if (!box.querySelector(":scope > .sbody")) {
    const body = el("div", "sbody"); while (box.firstChild) body.appendChild(box.firstChild);
    const bar = el("div", "sbar", `<button class="sup">▲</button><div class="strack"><div class="sthumb"></div></div><button class="sdn">▼</button>`);
    const more = el("button", "smore", "⬇️ TEM MAIS AQUI EMBAIXO ⬇️");
    box.append(body, bar, more); box.classList.add("swin");
    const tr = bar.querySelector(".strack"), th = bar.querySelector(".sthumb");
    const upd = () => { const h = body.scrollHeight, c = body.clientHeight, can = h > c + 4; bar.style.display = can ? "flex" : "none";
      box.classList.toggle("mais", can && body.scrollTop + c < h - 24);
      const hh = Math.max(36, tr.clientHeight * c / Math.max(1, h)); th.style.height = hh + "px"; th.style.top = (tr.clientHeight - hh) * body.scrollTop / Math.max(1, h - c) + "px"; };
    const step = d => { Audio8.fx("tap"); body.scrollBy({ top: d * body.clientHeight * .7, behavior: "smooth" }); };
    body.addEventListener("scroll", upd); bar.querySelector(".sup").onclick = () => step(-1); bar.querySelector(".sdn").onclick = () => step(1); more.onclick = () => step(1);
    const drag = e => { const r = tr.getBoundingClientRect(); body.scrollTop = (e.clientY - r.top) / r.height * (body.scrollHeight - body.clientHeight) * 1.1; };
    tr.addEventListener("pointerdown", e => { tr.setPointerCapture(e.pointerId); drag(e); tr.onpointermove = drag; });
    tr.addEventListener("pointerup", () => tr.onpointermove = null);
    if (window.ResizeObserver) new ResizeObserver(upd).observe(body);
    new MutationObserver(() => setTimeout(upd, 30)).observe(body, { childList: true, subtree: true });
    box._upd = upd; box._body = body;
  }
  box._body.scrollTop = 0; setTimeout(box._upd, 60); setTimeout(box._upd, 600);
}
const centerOf = e => { const r = e.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; };

/* ================= mapa do Brasil (um <symbol> por estado, reaproveitado em todos os mapinhas) ================= */
(() => { const d = el("div", "", `<svg width="0" height="0" style="position:absolute"><defs>${Object.entries(MAPA.uf).map(([k, [, p]]) => `<path id="uf_${k}" d="${p}"/>`).join("")}</defs></svg>`); document.body.appendChild(d.firstChild); })();
/* cores: {uf: cor}; o resto fica cinza */
const mapSVG = (cores, cls = "") => `<svg class="${cls}" viewBox="${MAPA.vb}">${Object.keys(MAPA.uf).map(k => `<use href="#uf_${k}" fill="${cores[k] || "#d6dccf"}"/>`).join("")}</svg>`;
const brMap = cls => mapSVG(Object.fromEntries(REGIOES.flatMap(r => r.uf.map(u => [u, r.cor]))), cls);   // Brasil inteiro, cada região com a sua cor
const regMap = (rid, cls) => rid === "especial" ? brMap(cls) : mapSVG(Object.fromEntries(REG[rid].uf.map(u => [u, REG[rid].cor])), cls);
const ufMap = (uf, cls) => { const r = REG[UF_REG[uf]]; return mapSVG({ ...Object.fromEntries(r.uf.map(u => [u, r.cor + "66"])), [uf]: r.cor }, cls); };
const ufNome = uf => MAPA.uf[uf][0].toUpperCase();
/* "moro NO Amazonas", "NA Bahia", "EM Minas Gerais": como se diz em cada estado */
const UF_PREP = { ac: "no", ap: "no", am: "no", pa: "no", to: "no", ma: "no", pi: "no", ce: "no", rn: "no", es: "no", rj: "no", pr: "no", rs: "no", df: "no", ba: "na", pb: "na" };
const ufEm = uf => UF_PREP[uf] || "em";

/* ================= avatar com fantasia ================= */
const GORRO = `<svg viewBox="0 0 100 70"><path d="M10 58 Q18 12 58 6 Q92 2 97 42 Q82 22 66 28 Q50 34 48 58Z" fill="#e3262e" stroke="#7a1010" stroke-width="4"/><path d="M4 54 Q48 42 54 58 Q30 70 6 66Z" fill="#c41d1d" stroke="#7a1010" stroke-width="3"/></svg>`;
function accHTML(f) { if (!f) return ""; const r = REGIOES.find(x => x.fantasia.id === f); if (!r) return ""; return `<div class="acc">${f === "gorro" ? GORRO : `<span>${r.fantasia.e}</span>`}</div>`; }
const avSrc = k => (AVATARES.find(a => a.k === k) || AVATARES[0]).src;
function avImg(k, size, veste) { return `<div class="av" ${size ? `style="width:${size}px;height:${size}px;font-size:${size}px"` : `style="font-size:118px"`}><img src="${avSrc(k)}" alt="">${accHTML(veste)}</div>`; }
function avHTML(id, size) { const p = perfil(id); return avImg(p.av || id, size, p.veste); }

/* ================= progresso ================= */
const found = () => store.get("found", [...BASE]);
const saveFound = f => store.set("found", f);
const prog = k => store.get("art_" + k, null);
const passed = t => !t.breve && !!(prog(t.k) || {}).passed;
const avail = l => TELAS.filter(t => t.lvl === l && !t.breve);
const roomOpen = l => true;   // todas as regiões abertas desde o começo
/* a Festa do Folclore (final) só abre quando todo o resto estiver pintado */
const faltamFesta = () => TELAS.filter(x => !x.breve && !x.final && !passed(x));
const telaOpen = t => !t.final || faltamFesta().length === 0;
const regDone = rid => { const l = REGIOES.findIndex(r => r.id === rid) + 1; const a = avail(l); return a.length > 0 && a.every(passed); };
const figs = () => store.get("figs", []);
const fantasias = () => store.get("fantasias", []);

/* ================= ABERTURA ================= */
$("#splashArt").src = "pages/grupo.orig.jpg";
const hoje = new Date(), DIA_FOLCLORE = hoje.getMonth() === 7 && hoje.getDate() === 22;
if (DIA_FOLCLORE) $("#folkday").style.display = "block";
$("#press").onclick = async () => {
  Audio8.unlock(); Audio8.play("menu", "birds"); Audio8.fx("tada");
  try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch (e) { }
  $("#press").style.display = "none"; FX.confetti();
  await Voice.talk([["Bem-vinda ao Ateliê Brasil!"], ...(DIA_FOLCLORE ? [["Hoje é dia 22 de agosto, o Dia do Folclore! Hihihi! Vamos fazer festa!", VOZ.saci]] : [])]);
  goPerfis();
};

/* ================= QUEM VAI PINTAR? (qualquer menina cria a sua pintora) ================= */
const listaPintoras = () => Object.entries(perfis()).filter(([, p]) => p && p.nome).sort((a, b) => (a[1].criada || 0) - (b[1].criada || 0)).map(([id]) => id);
function goPerfis() { UI.go("perfis", "#21a050", () => {
  $("#perfis h2").innerHTML = `QUEM VAI PINTAR? ${rep([["Quem vai pintar hoje? Toque no seu retrato, ou no mais para criar uma pintora nova!"]])}`;
  const ids = listaPintoras();
  $("#plist").innerHTML = ids.map(id => `<button class="pcard" data-id="${id}">${avHTML(id)}<div class="pn">${silabasHTML(perfil(id).nome)}</div><div class="pp">toque para pintar!</div></button>`).join("")
    + (ids.length < MAX_PINTORAS ? `<button class="pcard novo" id="novaP"><div class="mais">＋</div><div class="pn" style="font-size:18px">NOVA PINTORA</div></button>` : "");
  $$(".pcard[data-id]").forEach(b => b.onclick = () => escolher(b.dataset.id, b));
  if ($("#novaP")) $("#novaP").onclick = () => { Audio8.fx("pop"); goNome(null); };
  Audio8.play("menu", "birds"); Voice.say(ids.length ? "Quem vai pintar hoje? Toque no seu retrato!" : "Vamos começar! Toque no mais para criar a sua pintora!");
}); }
async function escolher(id, card) {
  if (UI.busy) return; Audio8.fx("pop");
  entrar(id); FX.burst(...centerOf(card), ["⭐", "✨", "💖"], 20);
  const pn = card.querySelector(".pn"); pn.innerHTML = [...NAME].map(c => `<span class="sy">${c}</span>`).join("");
  await soletrar(NAME, [...pn.children]); goMuseum();
}
function entrar(id) { WHO = id; useProfile(id); NAME = perfil(id).nome || "PINTORA"; }
/* soletra o nome letra por letra (acende a letra) e depois fala o nome inteiro */
async function soletrar(nome, cells) {
  for (let i = 0; i < nome.length; i++) {
    cells && cells.forEach((c, j) => c.classList.toggle("hl", j === i)); if (cells && cells[i]) cells[i].style.color = SYLC[i % SYLC.length];
    Audio8.fx("letra"); const ok = await Voice.talk([[LETRA[nome[i]] || nome[i], { rate: .9 }]]); if (!ok) return;
  }
  cells && cells.forEach(c => c.classList.add("hl")); FX.confetti(); Audio8.fx("tada");
  await Voice.talk([[`${nome.charAt(0) + nome.slice(1).toLowerCase()}! Vamos pintar o Brasil!`]]);
  cells && cells.forEach(c => c.classList.remove("hl"));
}

/* ================= ESCREVER O NOME (teclado grande, sem sugestão; cada letra é falada) ================= */
let nomeId = null, typed = "", avEsc = null;
function goNome(id) { nomeId = id; typed = id ? perfil(id).nome || "" : ""; UI.go("nome", "#ffd23f", renderNome);
  $("#nome h2").innerHTML = `ESCREVA O SEU NOME! ${rep(() => Voice.talk([["Escreva o seu nome! Toque nas letras."], ...(typed ? [["Até agora você escreveu:"], ...[...typed].map(c => [LETRA[c] || c, { rate: .9 }])] : [])]))}`;
  setTimeout(() => Voice.say(id ? "Escreva o seu nome de novo!" : "Escreva o seu nome! Toque nas letras!"), 900); }
const TECLAS = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZÇ"];
function renderNome() {
  $("#slots").innerHTML = [...typed].map(c => `<div class="slot">${c}</div>`).join("") + (typed.length < 12 ? `<div class="slot cur"></div>` : "");
  $("#teclas").innerHTML = TECLAS.map(c => `<button class="tk" data-c="${c}">${c}</button>`).join("") + `<button class="tk wide" data-c="⌫">⌫ APAGAR</button>`;
  $$("#teclas .tk").forEach(b => b.onclick = () => tecla(b.dataset.c, b));
}
function tecla(c, b) {
  if (c === "⌫") { if (!typed) return; typed = typed.slice(0, -1); Audio8.fx("whoosh"); renderNome(); return; }
  if (typed.length >= 12) return; typed += c; Audio8.fx("letra"); FX.burst(...centerOf(b), ["✨"], 6);
  renderNome(); Voice.say(LETRA[c] || c);
}
$("#nomeOk").onclick = async () => {
  if (UI.busy) return;
  if (typed.length < 2) { Audio8.fx("oops"); Voice.say(typed ? "Só uma letra? Escreva o nome inteiro!" : "Escreva o seu nome primeiro!"); return; }
  Audio8.fx("tada"); avEsc = nomeId ? perfil(nomeId).av || null : null; goAvatar();
};

/* ================= ESCOLHER O RETRATO (qualquer avatar) ================= */
function goAvatar() { UI.go("avatar", "#ff8fbf", renderAvatar); $("#avatar h2").innerHTML = `ESCOLHA O SEU RETRATO! ${rep([["Escolha o seu retrato! Toque na menina que parece com você, e depois em: essa sou eu!"]])}`; setTimeout(() => Voice.say(`${typed.charAt(0) + typed.slice(1).toLowerCase()}, agora escolha o seu retrato!`), 900); }
function renderAvatar() {
  $("#avNome").innerHTML = [...typed].map(c => `<div class="slot">${c}</div>`).join("");
  $("#avGrid").innerHTML = AVATARES.map(a => `<button class="avpick${a.k === avEsc ? " sel" : ""}" data-k="${a.k}">${avImg(a.k)}</button>`).join("");
  $$(".avpick").forEach(b => b.onclick = () => { avEsc = b.dataset.k; Audio8.fx("pop"); FX.burst(...centerOf(b), ["💖", "✨"], 10); renderAvatar(); Voice.say(pick(["Que lindo!", "Gostei!", "Que retrato bonito!"])); });
  $("#avOk").disabled = !avEsc;
}
$("#avOk").onclick = async () => {
  if (UI.busy || !avEsc) return;
  const id = nomeId || "p" + Date.now().toString(36);
  setPerfil(id, { nome: typed, av: avEsc, ...(nomeId ? {} : { criada: Date.now() }) }); entrar(id);
  await soletrar(typed, $$("#avNome .slot")); goMuseum();
};

/* ================= MAPA DA VIAGEM (museu) ================= */
function goMuseum() { UI.go("museum", "#21a050", () => { renderMuseum(); Audio8.play("menu", "birds"); }); }
function renderMuseum() {
  $("#meAv").innerHTML = avHTML(WHO, 52); $("#mtitle").innerHTML = `ATELIÊ DA<br>${NAME}`;
  const aw = store.get("awards", {});
  $("#mcolors").textContent = `${aw.trophy ? "🏆" : ""}🎨${found().length} 📒${figs().length}`;
  const box = $("#rooms"); box.innerHTML = "";
  [...REGIOES, ESPECIAL].forEach((R, i) => {
    const l = i + 1, esp = R === ESPECIAL, ts = TELAS.filter(t => t.lvl === l), done = ts.filter(passed).length, falta = faltamFesta().length;
    const sub = esp ? (falta ? `Pinte o mapa! A Festa do Folclore abre quando você pintar todos os personagens (faltam ${falta}).` : "A FESTA DO FOLCLORE ESTÁ ABERTA! 🎉")
      : regDone(R.id) ? `REGIÃO COMPLETA! Você ganhou ${R.fantasia.nome} ${R.fantasia.e}` : avail(l).length ? "Pinte todos e ganhe uma fantasia!" : "Os personagens daqui estão chegando! ✈️";
    const r = el("div", "room" + (esp ? " esp" : ""), `<div class="rhead"><b>${regMap(R.id, "rmap")} ${esp ? "🏆 " : ""}${silabasHTML(R.sil)}<span class="rsot">${R.sotaque}</span></b><span>${done}/${avail(l).length} ⭐</span></div><div class="rsub">${sub} ${rep([[`${R.nome.toLowerCase()}! ${sub.replace(/[^\p{L}\p{N} ,.!?()-]/gu, "")}`]])}</div><div class="frames"></div>`);
    r.style.setProperty("--rc", R.cor);
    ts.forEach(t => {
      const open = telaOpen(t), f = el("button", "frame" + (passed(t) ? " done" : "") + (t.breve ? " breve" : "") + (open ? "" : " fechada"));
      if (t.breve) f.innerHTML = `<div class="pic"><i>${t.e}<small>EM BREVE</small></i></div><div class="plate">${t.nome}</div>`;
      else { const p = prog(t.k), img = p && p.thumb ? p.thumb : `pages/${t.k}.orig.jpg`;
        f.innerHTML = `<div class="pic"><img src="${img}" alt="" class="${p && p.thumb ? "" : "orig"}">${open ? "" : "<i>🔒</i>"}</div><div class="plate">${t.nome}<small>${t.e} ${esp ? "BRASIL" : ufNome(t.uf)}${t.need === 100 ? " · 💯" : ""}</small></div>
          <div class="fstars">${passed(t) ? (t.need === 100 ? "🏆" : p.mode === "free" ? "🌈" : "⭐") : ""}</div>`; }
      f.onclick = () => {
        if (t.breve) { Audio8.fx("pop"); UI.bubble(f, `${t.e} ${t.nome}<br>está chegando! ✈️`); Voice.say(`${t.nome.toLowerCase()} está chegando! Em breve!`); return; }
        if (!open) { const n = faltamFesta().length; Audio8.fx("oops"); UI.bubble(f, `🔒 Pinte todos os outros primeiro!<br>Faltam ${n}.`); Voice.say(`A Festa do Folclore é o grande desafio! Pinte todos os outros primeiro. Faltam ${n}!`); return; }
        Audio8.fx("tap"); meet(t);
      };
      r.querySelector(".frames").appendChild(f);
    });
    box.appendChild(r);
  });
}
$("#meAv").onclick = () => { Audio8.fx("tap"); abrirRoupa(); };

/* ================= CHEGADA: boas-vindas da região, adivinha e o personagem ================= */
let cur = null, mode = "exact";
async function meet(t) {
  cur = t; if (UI.busy) return; const R = REG[t.reg];
  const went = await UI.go("meet", R.cor, async () => {
    Audio8.play(t.musica || R.musica, t.amb || R.amb); await getMeta(t);
    $("#meetTtl").innerHTML = `${R.nome} ${R.sotaque}`;
    if (!store.get("adv_" + t.k)) renderAdivinha(t); else renderIntro(t);
  });
  if (!went) return;
  if (!store.get("reg_" + R.id)) await boasVindas(R);
  if (UI.cur !== "meet" || cur !== t) return;
  if (!store.get("adv_" + t.k)) { await Voice.talk([["O que é, o que é?", { rate: .95 }], [t.adv.replace(/^O que é, o que é\? ?/, ""), { rate: .95 }]]); }
  else falarIntro(t);
}
function boasVindas(R) {
  return new Promise(res => {
    store.set("reg_" + R.id, 1);
    $("#regBox").innerHTML = `<h3>${R === ESPECIAL ? "BEM-VINDA AO" : "BEM-VINDA AO"}</h3><div class="rn">${silabasHTML(R.sil)}</div><div class="bigmap">${regMap(R.id)}</div><div class="sot">${R.sotaque}</div><div class="small">${R.oi} ${rep([[R.oi]])}</div><button class="nextbtn" id="regGo">VAMOS! ➡️</button>`;
    $("#regiao").classList.add("on"); Audio8.fx("unlock"); FX.burst(innerWidth / 2, innerHeight * .4, ["🗺️", "⭐", "✨"], 20);
    Voice.talk([[R.sotaque.toLowerCase().replace("!", "") + "!", { pitch: 1.3 }], [R.oi], ...(R === ESPECIAL ? [] : [[`Esta é a região ${R.nome.toLowerCase()}! Olha ela no mapa!`]])]);
    $("#regGo").onclick = () => { Audio8.fx("tap"); Voice.cancel(); $("#regiao").classList.remove("on"); res(); };
  });
}
function renderAdivinha(t) {
  // as opções mostram o retrato de verdade de cada personagem (só os que já têm ilustração)
  const outros = shuffle(TELAS.filter(x => x !== t && !x.breve && x.reg !== "especial")).slice(0, 2), ops = shuffle([t, ...outros]);
  const advTxt = t.adv.replace(/^O que é, o que é\? ?/, "");
  $("#meetBox").innerHTML = `<div class="adv"><b>O QUE É, O QUE É? ${rep([["O que é, o que é?", { rate: .95 }], [advTxt, { rate: .95 }], ["Toque em quem você acha que é!"]])}</b>${advTxt}</div><div class="opts">${ops.map(o => `<button class="opt" data-k="${o.k}">${cropHTML(o.k, ...o.rosto)}${o.nome}</button>`).join("")}</div><div class="small" style="margin-top:10px">🔈 Toque em quem você acha que é!</div>`;
  $$("#meetBox .opt").forEach(b => b.onclick = async () => {
    if (b.classList.contains("no")) return;
    const o = TELAS.find(x => x.k === b.dataset.k);
    if (o === t) {
      b.classList.add("yes"); Audio8.fx("good"); FX.burst(...centerOf(b), [t.e, "⭐", "✨"], 26); store.set("adv_" + t.k, 1);
      await Voice.talk([[`Acertou! É ${t.nome.toLowerCase()}!`]]); if (UI.cur !== "meet" || cur !== t) return;
      renderIntro(t); falarIntro(t);
    } else { b.classList.add("no"); Audio8.fx("oops"); Voice.talk([[`${o.nome.toLowerCase()}? Hmm... não sou eu! Escute de novo:`], [t.adv.replace(/^O que é, o que é\? ?/, ""), { rate: .95 }]]); }
  });
}
function renderIntro(t) {
  const perfect = t.need === 100;
  $("#meetBox").innerHTML = `<div class="mtop">${cropHTML(t.k, ...t.rosto, "crop retrato jump")}
      <div class="minfo"><div class="pname">${silabasHTML(t.sil)}</div><div class="pmap">${t.reg === "especial" ? `${brMap()}<div>O BRASIL<br><b>INTEIRINHO!</b></div>` : `${ufMap(t.uf)}<div>MORO ${ufEm(t.uf).toUpperCase()}<br><b>${ufNome(t.uf)}</b></div>`}</div></div></div>
    <div class="msay"><span id="msay"></span> ${rep(() => falarIntro(t))}</div>
    ${perfect ? `<div class="perfect">💯 Nesta pintura você precisa copiar <b>todas</b> as cores! Você consegue, ${NAME}! 💪</div>` : ""}
    <div class="mycolors"><div class="small">MINHAS CORES:</div><div class="chips">${colorsOf(metaCache[t.k]).map(c => chipHTML(c)).join("")}</div></div>
    <div class="modes"><button class="mbtn exact" id="goExact">🎯 <span>COPIAR AS CORES</span></button>
    ${perfect ? "" : `<button class="mbtn free" id="goFree">🌈 <span>DO MEU JEITO</span></button>`}</div>`;
  $$("#meetBox .chip").forEach(ch => ch.onclick = () => { Audio8.fx("pop"); Voice.color(ch.dataset.c); });
  $("#goExact").onclick = () => { mode = "exact"; startPaint(t); };
  if (!perfect) $("#goFree").onclick = () => { mode = "free"; startPaint(t); };
  $(".retrato").onclick = () => falarIntro(t);
}
async function falarIntro(t) {
  const R = REG[t.reg], lines = [t.fala, ...(t.reg === "especial" ? [] : [`Eu moro ${ufEm(t.uf)} ${MAPA.uf[t.uf][0]}, na região ${R.nome.toLowerCase()}!`]), t.lenda];
  if (t.extra) lines.push(t.extra); if ((PIADAS[NAME] || {})[t.k]) lines.push(PIADAS[NAME][t.k]);
  if (t.need === 100) lines.push(`Nesta pintura você precisa copiar todas as cores! Você consegue, ${Nome()}!`);
  $(".retrato")?.classList.add("talk");
  for (const l of lines) { if (UI.cur !== "meet" || cur !== t) break; $("#msay") && ($("#msay").textContent = l); const ok = await Voice.talk([[l, t.voz]]); if (!ok) break; }
  $(".retrato")?.classList.remove("talk");
}
$("#mback").onclick = () => { Audio8.fx("tap"); goMuseum(); };
function chipHTML(c) {
  const have = found().includes(c), r = RECIPES[c];
  return `<button class="chip" data-c="${c}"><i style="background:${PAINT[c][0]}"></i><span>${silabasHTML(PAINT[c][2])}</span>${!have && r ? `<em>${dot(r[0])}+${dot(r[1])}</em>` : ""}</button>`;
}
const dot = c => `<i class="d" style="background:${PAINT[c][0]}"></i>`;
const metaCache = {};
async function getMeta(t) { return metaCache[t.k] || (metaCache[t.k] = await (await fetch(`pages/${t.k}.json`)).json()); }
function colorsOf(meta) { const area = {}; meta.regions.forEach(r => { if (!r.lock) area[r.c] = (area[r.c] || 0) + r.a; }); return Object.keys(area).sort((x, y) => area[y] - area[x]); }

/* ================= PINTAR ================= */
const P8 = { cv: null, g: null, W: 0, H: 0, reg: null, lines: null, orig: null, img: null, pix: [], box: [], fills: [], meta: null, brush: null, water: 0, zoom: 1, panX: 0, panY: 0, hist: [], objs: [], seen: new Set() };
function loadPix(src) { return new Promise((res, rej) => { const i = new Image(); i.onerror = () => rej(new Error("imagem " + src)); i.onload = () => { const c = document.createElement("canvas"); c.width = i.width; c.height = i.height; const g = c.getContext("2d"); g.drawImage(i, 0, 0); res(g.getImageData(0, 0, i.width, i.height).data); }; i.src = src; }); }
const okFor = r => r.ok ? [r.c, ...r.ok] : [r.c];
const isRight = (r, c) => !!c && okFor(r).includes(c);
async function startPaint(t) {
  await UI.go("paint", null, async () => {
    $("#ploading").style.display = "flex";
    const meta = await getMeta(t); P8.meta = meta; const W = meta.w, H = meta.h; P8.W = W; P8.H = H;
    const [lp, op] = await Promise.all([loadPix(`pages/${t.k}.lines.jpg`), loadPix(`pages/${t.k}.orig.jpg`)]);
    const N = W * H, reg = new Uint16Array(N), lines = new Uint8Array(N);
    // mapa de áreas em números puros (rle: id, quantos, id, quantos...): nada de PNG que o navegador possa recomprimir
    for (let i = 0, p = 0, R = meta.rle; i < R.length; i += 2) { reg.fill(R[i], p, p + R[i + 1]); p += R[i + 1]; }
    for (let p = 0; p < N; p++) lines[p] = lp[p * 4];          // o traço exatamente como no desenho (0 = preto, 255 = papel)
    const nR = meta.regions.length + 1, cnt = new Int32Array(nR); for (let p = 0; p < N; p++) cnt[reg[p]]++;
    P8.pix = [...cnt].map(c => new Int32Array(c)); const k = new Int32Array(nR); P8.box = [...Array(nR)].map(() => [W, H, 0, 0]);
    for (let p = 0; p < N; p++) { const r = reg[p]; P8.pix[r][k[r]++] = p; const b = P8.box[r], x = p % W, y = (p / W) | 0; if (x < b[0]) b[0] = x; if (y < b[1]) b[1] = y; if (x > b[2]) b[2] = x; if (y > b[3]) b[3] = y; }
    window.resetPointers && resetPointers();
    Object.assign(P8, { reg, lines, orig: op, brush: null, hist: [], zoom: 1, panX: 0, panY: 0, seen: new Set(), tricked: false, stolen: null });
    P8.objs = (t.palavras || meta.words || []).map(o => ({ o, id: reg[Math.min(H - 1, Math.round(o[2] * (H - 1))) * W + Math.min(W - 1, Math.round(o[1] * (W - 1)))] }));
    const saved = prog(t.k); P8.fills = Array(nR).fill(null);
    if (saved && saved.fills && saved.mode === mode && !saved.passed && saved.fills.length === nR) saved.fills.forEach((c, i) => { if (c) P8.fills[i] = c; });
    P8.objs.forEach(ob => { if (P8.fills[ob.id]) P8.seen.add(ob.o[0]); });
    const cv = $("#pcv"); cv.width = W; cv.height = H; P8.cv = cv; P8.g = cv.getContext("2d"); P8.img = P8.g.createImageData(W, H);
    $("#ov").width = W; $("#ov").height = H;
    fitCanvas(); renderAll(); renderPots(); renderBrush(); renderScore(); clearOv();
    $("#gthumb").src = `pages/${t.k}.orig.jpg`; $("#gbig img").src = `pages/${t.k}.orig.jpg`; $("#ptitle").textContent = t.nome;
    closeGab(); $("#paint").classList.toggle("exact", mode === "exact"); $("#zin").textContent = "🔍"; $("#ploading").style.display = "none";
  });
  const first = !store.get("tutorial", false);
  if (first) { store.set("tutorial", true); Voice.say("Molhe o pincel num potinho de tinta. Depois passe o dedo no desenho para pintar!"); }
  else Voice.say(mode === "exact" ? `Use as minhas cores, ${Nome()}, e a pintura de verdade vai aparecer!` : `Pinte do seu jeito, ${Nome()}!`, t.voz);
  // travessura do Saci: no máximo uma vez por pintura (sempre no Sudeste, às vezes nas outras)
  if (t.k !== "grupo" && (t.reg === "sudeste" || Math.random() < .45)) Saci.agendar(22000 + rnd(20000));
}
function fitCanvas() { const area = $("#parea"), aw = area.clientWidth - 12, ah = area.clientHeight - 12; P8.base = Math.min(aw / P8.W, ah / P8.H); applyZoom(); }
function applyZoom() {
  const s = P8.base * P8.zoom, w = P8.W * s, h = P8.H * s, area = $("#parea"), aw = area.clientWidth, ah = area.clientHeight;
  const mx = Math.max(0, (w - aw) / 2 + 20), my = Math.max(0, (h - ah) / 2 + 20); P8.panX = Math.max(-mx, Math.min(mx, P8.panX)); P8.panY = Math.max(-my, Math.min(my, P8.panY));
  const st = `width:${w}px;height:${h}px;left:${(aw - w) / 2 + P8.panX}px;top:${(ah - h) / 2 + P8.panY}px`; $("#pcv").style.cssText = st; $("#ov").style.cssText = st;
}
const PAPER = [252, 250, 244];
/* um pixel: papel / tinta lisa (cor errada ou do meu jeito) / a cor da ILUSTRAÇÃO (cor certa no modo copiar).
   O traço é sempre o do desenho original, por cima (multiplica): nem mais forte, nem mais fraco. */
function shadeInto(D, p, c, reveal) {
  const o = p * 4, k = P8.lines[p] / 255, O = P8.orig;
  let r, g, b;
  if (reveal && Math.max(O[o], O[o + 1], O[o + 2]) > 80) { r = O[o]; g = O[o + 1]; b = O[o + 2]; }   // a sombra/luz da colorida (sem o contorno dela)
  else if (c) [r, g, b] = c; else [r, g, b] = PAPER;
  D[o] = r * k; D[o + 1] = g * k; D[o + 2] = b * k; D[o + 3] = 255;
}
const revealOf = id => mode === "exact" && isRight(P8.meta.regions[id - 1] || {}, P8.fills[id]);
function paintRegion(id, D) { const c = P8.fills[id], rgb = c ? hex2rgb(PAINT[c][0]) : null, rv = id > 0 && revealOf(id), list = P8.pix[id]; for (let i = 0; i < list.length; i++) shadeInto(D, list[i], rgb, rv); }
function renderAll() { const D = P8.img.data; for (let r = 0; r < P8.pix.length; r++) paintRegion(r, D); P8.g.putImageData(P8.img, 0, 0); }
function putBox(r) { const b = P8.box[r]; P8.g.putImageData(P8.img, 0, 0, b[0], b[1], b[2] - b[0] + 1, b[3] - b[1] + 1); }
function fillRegion(r, x0, y0, fast) {
  const list = P8.pix[r], D = P8.img.data, b = P8.box[r], W = P8.W, c = P8.fills[r], rgb = c ? hex2rgb(PAINT[c][0]) : null, rv = revealOf(r);
  if (fast || list.length < 400) { paintRegion(r, D); putBox(r); return; }
  let maxd = 0; for (const [cx, cy] of [[b[0], b[1]], [b[2], b[1]], [b[0], b[3]], [b[2], b[3]]]) maxd = Math.max(maxd, Math.hypot(cx - x0, cy - y0));
  const t0 = performance.now(), dur = Math.min(420, 140 + maxd * 1.1), dist = new Float32Array(list.length);
  for (let i = 0; i < list.length; i++) { const p = list[i], x = p % W, y = (p / W) | 0; dist[i] = Math.hypot(x - x0, y - y0) * (1 + .22 * Math.sin(Math.atan2(y - y0, x - x0) * 7)); }
  const step = ts => { if (P8.fills[r] !== c) return; const R = (ts - t0) / dur * maxd * 1.3;
    for (let i = 0; i < list.length; i++) if (dist[i] >= 0 && dist[i] <= R) { shadeInto(D, list[i], rgb, rv); dist[i] = -1; }
    putBox(r); if (R < maxd * 1.3) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}
function clearOv() { const g = $("#ov").getContext("2d"); g.clearRect(0, 0, P8.W, P8.H); }
function score() { const rs = P8.meta.regions.filter(r => !r.lock); const ok = rs.filter(r => isRight(r, P8.fills[r.id])).length, filled = rs.filter(r => P8.fills[r.id]).length; return { pct: Math.floor(ok / rs.length * 100), ok, filled, total: rs.length }; }
function renderScore() {
  const s = score(); $("#pfill").style.width = (s.filled / s.total * 100) + "%";
  $("#pscore").innerHTML = mode === "exact" ? `✨ ${s.pct}%` : `🌈 ${s.filled}/${s.total}`;
}
/* ---- potes, pincel e água ---- */
function renderPots() {
  const f = found(), need = new Set(colorsOf(P8.meta)); const order = [...BASE, ...f.filter(c => !BASE.includes(c))];
  $("#pots").innerHTML = order.map(c => P8.stolen === c ? `<button class="pot roubado" data-c="${c}"><i>🌪️</i><small>sumiu!</small></button>`
    : `<button class="pot${need.has(c) && mode === "exact" ? " want" : ""}" data-c="${c}"><i style="background:${PAINT[c][0]}"></i><small>${PAINT[c][1]}</small></button>`).join("");
  $$("#pots .pot").forEach(b => b.onclick = () => b.classList.contains("roubado") ? Saci.avisar() : dip(b.dataset.c, b)); setTimeout(potArrows, 50);
}
function renderBrush() {
  const c = P8.brush; $("#btip").style.background = c ? PAINT[c][0] : "#f2ece0";
  $("#bname").innerHTML = c ? silabasHTML(PAINT[c][2]) : "LIMPO";
  $("#water i").style.opacity = Math.min(.85, P8.water * .14); $("#water i").style.background = P8.lastWash ? PAINT[P8.lastWash][0] : "transparent";
}
function potArrows() { const p = $("#pots"); $("#parrL").classList.toggle("on", p.scrollLeft > 6); $("#parrR").classList.toggle("on", p.scrollLeft + p.clientWidth < p.scrollWidth - 6); }
$("#pots").addEventListener("scroll", potArrows); addEventListener("resize", potArrows);
$("#parrL").onclick = () => { $("#pots").scrollBy({ left: -200, behavior: "smooth" }); Audio8.fx("tap"); };
$("#parrR").onclick = () => { $("#pots").scrollBy({ left: 200, behavior: "smooth" }); Audio8.fx("tap"); };
let dirtyWarned = false;
const N = c => PAINT[c][1];
async function dip(c, btn) {
  const [x, y] = centerOf(btn); Audio8.fx("dip");
  if (!P8.brush) { P8.brush = c; renderBrush(); FX.splat(x, y, PAINT[c][0], 8); Voice.color(c); return; }
  if (P8.brush === c) { Voice.color(c); return; }
  const was = P8.brush, res = mix(was, c); P8.brush = res; renderBrush(); FX.splat(x, y, PAINT[res][0], 12);
  const f = found();
  if (!f.includes(res)) { f.push(res); saveFound(f); renderPots(); discover(was, c, res); return; }
  if (res === "brown" && !(RECIPES.brown.includes(was) && RECIPES.brown.includes(c))) { Audio8.fx("mud"); UI.bubble($("#water"), "💧 Virou lama! Lave o pincel!"); Voice.say("Ops! Virou marrom de lama! Lave o pincel na água!"); return; }
  if (!dirtyWarned) { dirtyWarned = true; UI.bubble($("#water"), `O pincel tinha ${N(was)}! 💧 Lave primeiro!`); Voice.say(`Opa! O pincel ainda tinha ${N(was)}! ${N(was)} com ${N(c)} faz ${N(res)}! Lave o pincel para pegar uma cor limpinha!`); return; }
  Voice.say(`${N(was)} com ${N(c)} faz ${N(res)}!`);
}
async function discover(a, b, c) {
  Audio8.fx("magic"); FX.burst(innerWidth / 2, innerHeight * .5, ["✨", "🌟", "🎨"], 26);
  const d = el("div", "discover", `<div class="dmix">${dot(a)} + ${dot(b)} = <i class="big" style="background:${PAINT[c][0]}"></i></div><div class="dname">COR NOVA!</div><div class="dzh">${silabasHTML(PAINT[c][2])}</div>`);
  document.body.appendChild(d); setTimeout(() => d.classList.add("out"), 3600); setTimeout(() => d.remove(), 4000);
  await Voice.talk([[`Uau! ${N(a)} com ${N(b)} faz...`], ...silabas(PAINT[c][2]).map(s => [s.toLowerCase(), { rate: .7 }]), [`${N(c)}! Uma cor nova!`]]);
}
$("#water").onclick = () => { if (P8.brush) { P8.lastWash = P8.brush; P8.water++; } P8.brush = null; Audio8.fx("bloop"); renderBrush();
  const [x, y] = centerOf($("#water")); FX.burst(x, y - 20, ["💧", "🫧"], 8);
  if (P8.water >= 7 && P8.water < 7.5) { UI.bubble($("#water"), "A água está muito suja! 🤢 Toque de novo para trocar!"); P8.water = 7.5; }
  else if (P8.water >= 7.5) { P8.water = 0; P8.lastWash = null; renderBrush(); Voice.say("Água limpinha!"); }
};
$("#bwrap").onclick = () => { if (P8.brush) Voice.color(P8.brush); else Voice.say("O pincel está limpo! Molhe num potinho de tinta!"); };
$("#undo").onclick = () => { const h = P8.hist.pop(); if (!h) return; Audio8.fx("whoosh"); for (const [id, c] of h.reverse()) { P8.fills[id] = c; paintRegion(id, P8.img.data); } P8.g.putImageData(P8.img, 0, 0); renderScore(); autosave(); };
$("#zin").onclick = () => { P8.zoom = P8.zoom >= 2.9 ? 1 : P8.zoom < 1.9 ? 2 : 3; if (P8.zoom === 1) P8.panX = P8.panY = 0; $("#zin").textContent = P8.zoom === 1 ? "🔍" : "🔎×" + P8.zoom; applyZoom(); Audio8.fx("tap");
  if (P8.zoom > 1 && !store.get("zoomtip")) { store.set("zoomtip", 1); Voice.say("Use dois dedos para mexer o desenho!"); } };
$("#finishBtn").onclick = () => { Audio8.fx("tap"); finish(true); };
/* ajuda: pisca uma área que falta (o Curupira engana na primeira vez!) */
function blinkRegion(id, color, times = 7) {
  const g = $("#ov").getContext("2d"); let n = 0; clearOv();
  const blink = () => { clearOv(); if (n++ > times) return; if (n % 2) { const list = P8.pix[id], img = g.createImageData(P8.W, P8.H), D = img.data, rgb = hex2rgb(color);
      for (let i = 0; i < list.length; i++) { const o = list[i] * 4; D[o] = rgb[0]; D[o + 1] = rgb[1]; D[o + 2] = rgb[2]; D[o + 3] = 200; } g.putImageData(img, 0, 0); } setTimeout(blink, 260); };
  blink();
}
const regPt = r => { const c = $("#pcv").getBoundingClientRect(); return [c.left + r.x / P8.W * c.width, c.top + r.y / P8.H * c.height]; };
$("#helpBtn").onclick = async () => {
  Audio8.fx("sparkle"); const rs = P8.meta.regions.filter(r => !r.lock && !(mode === "exact" ? isRight(r, P8.fills[r.id]) : P8.fills[r.id]));
  if (!rs.length) return; const r = rs.sort((a, b) => b.a - a.a)[Math.min(rs.length - 1, rnd(3))];
  const t = cur, say = mode === "exact" ? `Aqui! Use ${N(r.c)}!` : `Pinte esta aqui!`;
  if (t.especial === "curupira" && !P8.tricked) {   // pegadas ao contrário
    P8.tricked = true; const far = P8.meta.regions.filter(x => !x.lock).sort((a, b) => Math.hypot(b.x - r.x, b.y - r.y) - Math.hypot(a.x - r.x, a.y - r.y))[0];
    blinkRegion(far.id, "#ff8a1f", 5); UI.float(...regPt(far), "👣"); await Voice.talk([["Por aqui! Por aqui!", t.voz]]);
    Audio8.fx("giggle"); await Voice.talk([["Hihihi! Te enganei! Meus pés são virados pra trás! A certa é esta aqui!", t.voz]]);
  }
  blinkRegion(r.id, PAINT[r.c][0]); Voice.say(say, t.voz);
};
/* ---- pintar com o dedo: tocar ou arrastar; dois dedos = zoom e mover ---- */
(() => {
  const area = $("#parea"); let stroke = null, pinch = null; const pts = new Map();
  const startPinch = () => { const [a, b] = [...pts.values()]; pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), z: P8.zoom, mx: (a[0] + b[0]) / 2, my: (a[1] + b[1]) / 2, px: P8.panX, py: P8.panY }; };
  window.resetPointers = () => { pts.clear(); pinch = null; stroke = null; };
  area.addEventListener("pointerdown", e => {
    if (e.isPrimary || !pts.size) { pts.clear(); pinch = null; stroke = null; }   // um toque novo nunca herda dedo "preso" de antes
    try { area.setPointerCapture(e.pointerId); } catch (err) { } pts.set(e.pointerId, [e.clientX, e.clientY]);
    if (pts.size === 2) { if (stroke) { endStroke(); } startPinch(); return; }
    stroke = { list: [], last: null }; paintAt(e.clientX, e.clientY, true); });
  area.addEventListener("pointermove", e => { if (!pts.has(e.pointerId)) return; pts.set(e.pointerId, [e.clientX, e.clientY]);
    if (pinch && pts.size === 2) { const [a, b] = [...pts.values()]; P8.zoom = Math.max(1, Math.min(4, pinch.z * Math.hypot(a[0] - b[0], a[1] - b[1]) / pinch.d));
      P8.panX = pinch.px + (a[0] + b[0]) / 2 - pinch.mx; P8.panY = pinch.py + (a[1] + b[1]) / 2 - pinch.my; applyZoom(); $("#zin").textContent = P8.zoom > 1.05 ? "🔎" : "🔍"; return; }
    if (stroke) { const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e]; for (const ev of evs) paintAt(ev.clientX, ev.clientY, false); } });
  const up = e => { pts.delete(e.pointerId); if (pinch) { if (pts.size < 2) pinch = null; return; } if (stroke && !pts.size) endStroke(); };
  area.addEventListener("pointerup", up); area.addEventListener("pointercancel", up);
  function endStroke() { const s = stroke; stroke = null; if (!s || !s.list.length) return; P8.hist.push(s.list); if (P8.hist.length > 30) P8.hist.shift(); afterPaint(s.list); }
  window.paintAt = function (cx, cy, first) {
    const r = $("#pcv").getBoundingClientRect(); const x = Math.floor((cx - r.left) / r.width * P8.W), y = Math.floor((cy - r.top) / r.height * P8.H);
    if (x < 0 || y < 0 || x >= P8.W || y >= P8.H) return; const id = P8.reg[y * P8.W + x], R = P8.meta.regions[id - 1]; if (!R || R.lock) return;
    if (!P8.brush) { if (first) { Audio8.fx("oops"); UI.bubble($("#pots"), "🖌️ Molhe o pincel na tinta primeiro!"); if (Date.now() - lastHint > 4000) { lastHint = Date.now(); Voice.say("Molhe o pincel num potinho de tinta primeiro!"); } } return; }
    if (P8.fills[id] === P8.brush) return;
    const before = P8.fills[id], wasRight = revealOf(id); stroke && stroke.list.push([id, before]);
    P8.fills[id] = P8.brush; const nowRight = revealOf(id);
    fillRegion(id, x, y, !first); FX.splat(cx, cy, PAINT[P8.brush][0], first ? 10 : 3);
    if (nowRight && !wasRight) {   // cada personagem comemora do seu jeito
      const t = cur; if (Math.random() < .6) UI.float(cx, cy, pick(t.brilho || ["✨", "⭐"]));
      if (t.especial === "boitata") FX.burst(cx, cy, ["🔥", "✨"], 8);
      Audio8.fx(t.som || "sparkle");
    } else if (first || Math.random() < .35) Audio8.fx(Math.random() < .5 ? "splash" : "brush");
    renderScore();
  };
})();
let lastHint = 0;
async function afterPaint(list) {
  autosave();
  for (const ob of P8.objs) if (!P8.seen.has(ob.o[0]) && list.some(([id]) => id === ob.id)) { P8.seen.add(ob.o[0]); wordPop(ob.o); break; }
  if (mode === "exact") { const wrong = list.filter(([id]) => P8.fills[id] && !isRight(P8.meta.regions[id - 1], P8.fills[id]));
    if (wrong.length && wrong.length === list.length && Math.random() < .35 && Date.now() - lastHint > 6000) { lastHint = Date.now(); const R = P8.meta.regions[wrong[0][0] - 1];
      Voice.say(`Hmm... olhe a minha pintura, ${Nome()}! Ali eu usei ${N(R.c)}!`, cur.voz); $("#gwrap").classList.add("blink"); setTimeout(() => $("#gwrap").classList.remove("blink"), 1600); } }
  const s = score(); if (s.filled === s.total) setTimeout(() => finish(false), 600);
}
/* palavra escondida: aparece com sílabas coloridas e a voz lê devagar */
async function wordPop(o) {
  const d = el("div", "wordpop", `${cur.semCrop ? `<span class="we">${o[3]}</span>` : cropHTML(cur.k, o[1], o[2], .28, "crop we")}<div>${cur.semCrop ? "" : `<span style="font-size:30px">${o[3]}</span><br>`}<b style="font-size:${o[0].length > 12 ? 24 : 30}px">${silabasHTML(o[0])}</b></div>`);
  if (!cur.semCrop) d.querySelector(".we").style.cssText += ";width:70px;height:70px"; document.body.appendChild(d);
  Audio8.fx("pop"); setTimeout(() => d.classList.add("out"), 4200); setTimeout(() => d.remove(), 4600);
  await Voice.syl(o[0]);
}
let saveT = 0;
function autosave() { clearTimeout(saveT); saveT = setTimeout(() => { const old = prog(cur.k) || {}; store.set("art_" + cur.k, { ...old, fills: P8.fills, mode: old.passed ? old.mode : mode, wip: 1 }); }, 400); }
/* ---- gabarito ---- */
function openGab() { $("#gbig").classList.add("on"); $("#gback").classList.add("on"); Audio8.fx("whoosh"); }
function closeGab() { $("#gbig").classList.remove("on"); $("#gback").classList.remove("on"); }
$("#gwrap").onclick = openGab; $("#gx").onclick = e => { e.stopPropagation(); closeGab(); }; $("#gback").onclick = closeGab;
(() => { const g = $("#gbig"); let d = null;
  g.addEventListener("pointerdown", e => { if (e.target.id === "gx") return; d = { x: e.clientX, y: e.clientY, l: g.offsetLeft, t: g.offsetTop }; g.setPointerCapture(e.pointerId); });
  g.addEventListener("pointermove", e => { if (!d) return; g.style.left = Math.max(0, Math.min(innerWidth - 80, d.l + e.clientX - d.x)) + "px"; g.style.top = Math.max(0, Math.min(innerHeight - 80, d.t + e.clientY - d.y)) + "px"; g.style.right = "auto"; });
  g.addEventListener("pointerup", () => d = null); })();
/* ---- mesa de misturar ---- */
let mixA = null, mixB = null;
$("#mixbtn").onclick = () => { mixA = mixB = null; renderMixer(); $("#mixer").classList.add("on"); scrollify($("#mixer .obox")); Audio8.fx("whoosh"); Voice.say("Mesa de misturar! Escolha duas cores!"); };
$("#mclose").onclick = () => { $("#mixer").classList.remove("on"); Audio8.fx("tap"); };
function renderMixer() {
  const f = found(); $("#mwells").innerHTML = `<div class="well" id="wa">${mixA ? `<i style="background:${PAINT[mixA][0]}"></i>` : "1"}</div><b>+</b><div class="well" id="wb">${mixB ? `<i style="background:${PAINT[mixB][0]}"></i>` : "2"}</div><b>=</b><div class="well res" id="wr">?</div>`;
  $("#mpots").innerHTML = [...BASE, ...f.filter(c => !BASE.includes(c))].map(c => `<button class="pot" data-c="${c}"><i style="background:${PAINT[c][0]}"></i><small>${PAINT[c][1]}</small></button>`).join("");
  $$("#mpots .pot").forEach(b => b.onclick = () => mixPick(b.dataset.c));
  const need = P8.meta ? colorsOf(P8.meta) : [];
  $("#mbook").innerHTML = Object.entries(RECIPES).map(([r, [a, b]]) => { const has = f.includes(r), w = need.includes(r);
    return `<div class="rec${has ? "" : " no"}${w ? " w" : ""}">${dot(a)}+${dot(b)}=${has ? dot(r) : "<i class='d q'>?</i>"}<span>${has ? PAINT[r][1] : w ? "preciso!" : "???"}</span></div>`; }).join("");
}
async function mixPick(c) {
  Audio8.fx("dip"); Voice.color(c);
  if (!mixA) { mixA = c; renderMixer(); return; } if (mixB) { mixA = c; mixB = null; renderMixer(); return; }
  mixB = c; renderMixer(); const res = mix(mixA, mixB); await sleep(500);
  $("#wr").classList.add("swirl"); $("#wr").style.background = `conic-gradient(${PAINT[mixA][0]},${PAINT[mixB][0]},${PAINT[mixA][0]})`; Audio8.fx("swirl"); await sleep(1100);
  $("#wr").classList.remove("swirl"); $("#wr").style.background = PAINT[res][0]; $("#wr").innerHTML = "🖌️";
  const f = found(), isNew = !f.includes(res); if (isNew) { f.push(res); saveFound(f); if (UI.cur === "paint" && P8.meta) renderPots(); }   // a cor nova já aparece nos potes de fora
  if (isNew) discover(mixA, mixB, res); else Voice.say(`${N(mixA)} com ${N(mixB)} faz ${N(res)}!`);
  renderMixer(); $("#wr").style.background = PAINT[res][0]; $("#wr").innerHTML = "🖌️<small>usar!</small>"; $("#wr").classList.add("ready");
  $("#wr").onclick = () => { P8.brush = res; renderBrush(); renderPots(); $("#mixer").classList.remove("on"); Audio8.fx("dip"); Voice.say(`O pincel está com ${N(res)}!`); };
}
$("#pback").onclick = () => { Audio8.fx("tap"); goMuseum(); };

/* ================= TRAVESSURA DO SACI: um redemoinho rouba um pote de tinta ================= */
const Saci = {
  timer: 0, volta: 0, tries: 0,
  agendar(ms) { clearTimeout(this.timer); this.timer = setTimeout(() => this.roubar(), ms); },
  stop() { clearTimeout(this.timer); clearTimeout(this.volta); $("#saci").classList.remove("on"); $("#vento").style.display = "none"; P8.stolen = null; },
  async roubar() {
    if (UI.cur !== "paint" || finishing || $("#quest").classList.contains("on") || $("#monte").classList.contains("on") || $(".ov.on")) return this.agendar(8000);
    const cs = [...BASE, ...found().filter(c => !BASE.includes(c))].filter(c => c !== P8.brush); if (cs.length < 3) return; const c = pick(cs);
    const a = $("#parea").getBoundingClientRect(), v = $("#vento"); v.style.display = "block"; Audio8.fx("redemoinho");
    await v.animate([{ left: "-80px", top: a.top + a.height * .7 + "px", transform: "rotate(0)" }, { left: innerWidth + "px", top: a.top + a.height * .3 + "px", transform: "rotate(720deg)" }], { duration: 1600, easing: "ease-in-out" }).finished;
    v.style.display = "none"; if (UI.cur !== "paint" || finishing) return;
    P8.stolen = c; renderPots(); this.tries = 0;
    const s = $("#saci"); s.innerHTML = `${cropHTML("grupo", .315, .26, .25, "crop cara")}<i class="pote" style="background:${PAINT[c][0]}"></i><div class="sfala">PEGUEI O<br>${silabasHTML(PAINT[c][2])}!<br>ME PEGA! 😜</div>`;
    this.mover(); s.classList.add("on"); Audio8.fx("giggle");
    Voice.say(`Hihihi! Eu sou o Saci! Peguei a sua tinta ${N(c)}! Toque em mim pra pegar de volta!`, VOZ.saci);
    clearTimeout(this.volta); this.volta = setTimeout(() => { if (P8.stolen) { this.tries = 9; this.pegar(true); } }, 30000);   // não deixa ela sem a cor
  },
  avisar() { const s = $("#saci"); Audio8.fx("giggle"); s.animate([{ transform: "scale(1)" }, { transform: "scale(1.3) rotate(-10deg)" }, { transform: "scale(1)" }], { duration: 500, iterations: 2 });
    Voice.say(`O Saci pegou o ${N(P8.stolen)}! Toque no Saci pra pegar de volta!`); },
  mover() { const a = $("#parea").getBoundingClientRect(), s = $("#saci"); s.style.left = a.left + 10 + Math.random() * (a.width - 104) + "px"; s.style.top = a.top + 70 + Math.random() * (a.height - 180) + "px"; },
  async pegar(sozinho) {
    const s = $("#saci"); if (!P8.stolen) return;
    if (this.tries++ < 1) { Audio8.fx("giggle"); this.mover(); Voice.say("Errou! Hihihi! Tenta de novo!", VOZ.saci); return; }
    const c = P8.stolen; FX.burst(...centerOf(s), ["🧢", "✨", "⭐"], 22); Audio8.fx("good"); s.classList.remove("on"); P8.stolen = null; clearTimeout(this.volta);
    renderPots(); const pot = $(`#pots .pot[data-c="${c}"]`); if (pot) { pot.scrollIntoView({ inline: "center", behavior: "smooth" }); FX.burst(...centerOf(pot), ["✨", "🎨"], 12); }
    Voice.say(sozinho ? `Tá bom, eu devolvo a sua tinta ${N(c)}! Hihihi!` : `Tá bom, tá bom! Você me pegou! Toma a sua tinta ${N(c)} de volta!`, VOZ.saci);
  },
};
$("#saci").onclick = () => Saci.pegar();

/* ================= FIM: ganhar vida, encontre, monte a palavra, parlenda e rima ================= */
function thumbData(w = 320) { const c = document.createElement("canvas"); const s = w / P8.W; c.width = w; c.height = Math.round(P8.H * s); c.getContext("2d").drawImage(P8.cv, 0, 0, c.width, c.height); return c.toDataURL("image/jpeg", .72); }
let finishing = false;
async function alive(t) {
  renderAll(); const wrap = $("#parea"), cv = $("#pcv"), kind = t.vida || "zoom"; Audio8.fx("magic"); Audio8.play("win");
  const r = cv.getBoundingClientRect(), at = o => [r.left + o[1] * r.width, r.top + o[2] * r.height];
  const anim = { hop: [{ transform: "translateY(0)" }, { transform: "translateY(-30px) scale(1.03)" }, { transform: "translateY(0)" }, { transform: "translateY(-14px)" }, { transform: "translateY(0)" }],
    sway: [{ transform: "rotate(0)" }, { transform: "rotate(-2.5deg) scale(1.02)" }, { transform: "rotate(2.5deg) scale(1.02)" }, { transform: "rotate(0)" }],
    zoom: [{ transform: "scale(1)" }, { transform: "scale(1.12)" }, { transform: "scale(1)" }], swim: [{ transform: "translateX(0)" }, { transform: "translateX(-12px) rotate(-1deg)" }, { transform: "translateX(12px) rotate(1deg)" }, { transform: "translateX(0)" }],
    twinkle: [{ filter: "brightness(1)" }, { filter: "brightness(1.3) saturate(1.4)" }, { filter: "brightness(1)" }], wink: [{ transform: "scale(1)" }, { transform: "scale(1.06)" }, { transform: "scale(1)" }],
    spin: [{ transform: "rotate(0) scale(1)" }, { transform: "rotate(8deg) scale(.92)" }, { transform: "rotate(-8deg) scale(1.05)" }, { transform: "rotate(0) scale(1)" }] }[kind];
  cv.animate(anim, { duration: 1800, easing: "ease-in-out", iterations: 2 });
  const pts = (t.palavras || []).map(at);
  for (let k = 0; k < 6; k++) setTimeout(() => { const p = pts.length ? pick(pts) : [r.left + Math.random() * r.width, r.top + Math.random() * r.height]; FX.burst(p[0], p[1], t.vidaE || ["✨", "🌟"], 10); }, k * 450);
  UI.bubble(wrap, `✨ PERFEITO! ${t.nome} ganhou vida! ✨`, 3200);
  await Voice.talk([[`Uau, ${Nome()}! Você copiou todas as cores! Eu ganhei vida!`, t.voz]]); await sleep(500);
}
/* missões do final (Encontre e Monte): se ela sair da pintura no meio, tudo é desfeito, senão o toque fica preso */
const setMissao = on => { $("#paint").classList.toggle("missao", on); if (UI.cur === "paint") fitCanvas(); };
const Missao = { id: 0, h: null, res: null,
  abort() { this.id++; setMissao(false); if (this.h) $("#parea").removeEventListener("pointerdown", this.h, true); this.h = null;
    $("#quest").classList.remove("on"); $("#monte").classList.remove("on"); const r = this.res; this.res = null; r && r(); } };
/* encontre: 1 palavra escondida */
async function quest(t) {
  const objs = shuffle(P8.objs.filter(o => P8.pix[o.id] && P8.pix[o.id].length)).slice(0, 1); if (!objs.length) return;
  for (const ob of objs) {
    const o = ob.o; $("#quest").innerHTML = `<b>ENCONTRE: ${silabasHTML(o[0])}</b> ${o[3]} 👆 ${rep([[`Encontre: ${palavra(o[0]).toLowerCase()}! Toque no desenho onde está.`]])}`; $("#quest").classList.add("on"); setMissao(true);
    Voice.talk([[`Encontre: ${palavra(o[0]).toLowerCase()}! Onde está?`]]);
    await new Promise(res => {
      let tries = 0; const area = $("#parea"); Missao.res = res;
      const h = e => { const r = $("#pcv").getBoundingClientRect(); const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height; if (x < 0 || y < 0 || x > 1 || y > 1) return;
        const id = P8.reg[Math.floor(y * P8.H) * P8.W + Math.floor(x * P8.W)]; e.stopImmediatePropagation(); e.stopPropagation(); e.preventDefault();
        if (id === ob.id || Math.hypot(x - o[1], y - o[2]) < .09) { area.removeEventListener("pointerdown", h, true); Missao.h = null; FX.burst(e.clientX, e.clientY, [o[3], "✨", "⭐"], 16); Audio8.fx("good"); Voice.talk([[`Isso! Achou!`]]).then(() => setTimeout(res, 300)); }
        else { tries++; Audio8.fx("oops"); if (tries >= 2) { const px = r.left + o[1] * r.width, py = r.top + o[2] * r.height; UI.float(px, py, "👇" + o[3]); Voice.say(`Aqui! Olhe!`); } } };
      area.addEventListener("pointerdown", h, true); Missao.h = h;
    });
  }
  $("#quest").classList.remove("on"); setMissao(false);
}
/* monte a palavra: toque nas sílabas na ordem certa */
function montar(t) {
  const sy = silabas(t.sil); if (sy.length < 2) return Promise.resolve();
  return new Promise(res => {
    let k = 0; const m = $("#monte"); Missao.res = res;
    m.innerHTML = `<b>MONTE O NOME! 🧩 ${rep([["Monte o nome! Toque nas sílabas na ordem certa:"], ...sy.map(x => [x.toLowerCase(), { rate: .7 }]), [palavra(t.sil).toLowerCase() + "!"]])}</b><div class="mw">${sy.map(() => `<div class="ms"></div>`).join("")}</div><div class="tiles">${shuffle(sy.map((s, i) => [s, i])).map(([s, i]) => `<button data-s="${s}" style="color:${SYLC[i % SYLC.length]}">${s}</button>`).join("")}</div>`;
    m.classList.add("on"); setMissao(true); Voice.talk([["Agora monte o meu nome! Toque nas sílabas na ordem certa!"], ...sy.map(s => [s.toLowerCase(), { rate: .7 }])]);
    m.querySelectorAll(".tiles button").forEach(b => b.onclick = async () => {
      if (b.dataset.s === sy[k]) {
        const slot = m.querySelectorAll(".ms")[k]; slot.textContent = sy[k]; slot.style.color = SYLC[k % SYLC.length]; b.classList.add("used"); k++;
        Audio8.fx("pop"); FX.burst(...centerOf(slot), ["✨"], 6);
        if (k === sy.length) { Audio8.fx("good"); FX.burst(...centerOf(m), [t.e, "⭐", "✨"], 26); await Voice.syl(t.sil); m.classList.remove("on"); setMissao(false); res(); }
        else Voice.say(b.dataset.s.toLowerCase(), { rate: .7 });
      } else { b.classList.add("bad"); setTimeout(() => b.classList.remove("bad"), 450); Audio8.fx("oops"); Voice.say(`${b.dataset.s.toLowerCase()} vem depois! Qual vem agora?`); }
    });
  });
}
const nextArt = () => TELAS.find(x => !x.breve && x.pos > cur.pos && telaOpen(x) && !passed(x)) || TELAS.find(x => !x.breve && telaOpen(x) && !passed(x));
async function finish(byButton) {
  if (UI.cur !== "paint" || $("#done").classList.contains("on") || finishing) return; finishing = true; Saci.stop(); try { const s = score(), t = cur;
  const perfect = t.need === 100;
  if (perfect && s.pct < 100) {
    Audio8.fx("oops"); $("#gwrap").classList.add("blink"); setTimeout(() => $("#gwrap").classList.remove("blink"), 1600);
    UI.bubble($("#parea"), `Quase lá! ${s.pct}% 💪<br>Copie <b>todas</b> as cores. Toque em 💡 para ajuda!`, 4200);
    Voice.say(`Quase lá, ${Nome()}! Nesta pintura você precisa copiar todas as cores. Use a lâmpada de ajuda e olhe a pintura lá em cima. Você consegue!`); finishing = false; return;
  }
  if (mode === "exact" && s.pct >= 100) await alive(t); else if (mode === "exact" && s.pct >= 80) renderAll();
  const mid = Missao.id; await montar(t); if (mid !== Missao.id) return;   // (o "Encontre" no desenho saiu: depois de terminar não precisa tocar na pintura)
  const old = prog(t.k) || {}, wasDone = REGIOES.map(R => regDone(R.id)), festaAntes = TELAS.filter(x => x.final).every(telaOpen);
  const rec = { fills: P8.fills, mode, pct: s.pct, thumb: thumbData(), passed: true };
  if (!store.set("art_" + t.k, rec)) store.set("art_" + t.k, { ...rec, thumb: thumbData(160) });
  // figurinhas novas
  const fg = figs(), novas = (t.fig || []).filter(f => !fg.includes(f[0])); novas.forEach(f => fg.push(f[0])); store.set("figs", fg);
  $("#dmine").src = rec.thumb; $("#dorig").src = `pages/${t.k}.orig.jpg`; $("#dpainter").innerHTML = cropHTML(t.k, ...t.rosto, "crop retrato");
  const msg = mode === "exact" && s.pct >= 100 && !perfect ? `100%! ${t.nome} ganhou vida!` : perfect ? `Perfeito! Igualzinho!` : `Que lindo!`;
  const msgFala = msg.replace("100%!", "Cem por cento!").replace(t.nome, t.nome.toLowerCase());
  $("#dtitle").innerHTML = `MUITO BEM, ${NAME}! ${rep([[`Muito bem, ${Nome()}! ${msgFala}`, t.voz]])}`; $("#dstars").textContent = perfect ? "💯" : mode === "free" ? "🌈" : "⭐";
  $("#dmsg").innerHTML = `${msg} ${mode === "exact" && s.pct >= 100 ? "✨" : "💖"}`;
  $("#dfig").innerHTML = novas.map(f => `<div class="newfig">${cropHTML(t.k, f[1], f[2], f[3])}<div>📒 FIGURINHA NOVA!<br><b>${silabasHTML(f[0])}</b></div>${rep([...silabas(f[0]).map(x => [x.toLowerCase(), { rate: .7 }]), [palavra(f[0]).toLowerCase() + "!"], [f[4]]])}</div>`).join("");
  $("#dparl").innerHTML = `<div class="parl">${t.parlenda.map(l => `<div>${l}</div>`).join("")}${rep(() => lerParlenda(t))}</div>`;
  renderRima(t);
  const nx = nextArt(); $("#dnext").style.display = nx ? "" : "none"; if (nx) $("#dnext").innerHTML = `➡️ PRÓXIMA: <small>${nx.e} ${nx.nome}</small>`;
  Audio8.play("win"); Audio8.fx("applause"); FX.confetti(); setTimeout(() => FX.burst(innerWidth / 2, innerHeight * .3), 500);
  $("#done").classList.add("on"); scrollify($("#done .obox"));
  await Voice.talk([[`Muito bem, ${Nome()}! ${msgFala}`, t.voz]]);
  for (const f of novas) { if (!$("#done").classList.contains("on")) break; await Voice.talk([["Figurinha nova!"], [palavra(f[0]).toLowerCase() + "!"]]); }
  if ($("#done").classList.contains("on")) await lerParlenda(t);
  if ($("#done").classList.contains("on")) { const q = $("#drima .rima"); q && q.scrollIntoView({ behavior: "smooth", block: "center" }); await Voice.talk([["Agora me diga:"]]); if ($("#done").classList.contains("on")) t._lerRima(); }
  // região completa = fantasia nova; viagem completa = troféu
  const reg = REGIOES.findIndex((R, i) => regDone(R.id) && !wasDone[i]);
  const festaAbriu = !festaAntes && TELAS.filter(x => x.final).every(telaOpen);
  if (festaAbriu) { $("#dmsg").innerHTML += `<div class="newroom">🎉 A FESTA DO FOLCLORE ABRIU!</div>`; Audio8.fx("unlock"); await Voice.talk([["Uau! Você pintou todos os personagens! A Festa do Folclore abriu! Vamos pra festa?", VOZ.saci]]); }
  if (perfect) setTimeout(() => ceremony("trophy"), 400);
  else if (reg >= 0) setTimeout(() => ceremony("fantasia", REGIOES[reg]), 400);
  } finally { finishing = false; }
}
/* parlenda com ritmo, acendendo cada verso */
async function lerParlenda(t) {
  const vs = $$("#dparl .parl div"); if ($("#done").classList.contains("on")) await Voice.talk([["Agora, uma parlenda!"]]);
  for (let i = 0; i < vs.length; i++) { if (!$("#done").classList.contains("on")) break; vs.forEach((v, j) => v.classList.toggle("on", j === i)); const ok = await Voice.talk([[t.parlenda[i], { rate: .95, pitch: 1.2 }]]); if (!ok) break; }
  vs.forEach(v => v.classList.remove("on"));
}
function renderRima(t) {
  const R = t.rima, ops = shuffle([R.ok, ...R.no]);
  const lerRima = () => Voice.talk([[`O que rima com ${R.w.toLowerCase()}?`], ...ops.map(([w]) => [w.toLowerCase() + "?", { rate: .9 }])]); t._lerRima = lerRima;
  $("#drima").innerHTML = `<div class="rima"><div class="q">🎵 O QUE RIMA COM <b>${R.w}</b>?</div><div class="opts">${ops.map(([w, e]) => `<button class="opt" data-w="${w}"><span>${e}</span>${w}</button>`).join("")}</div></div>`;
  $("#drima .q").onclick = () => { Audio8.fx("tap"); lerRima(); };
  $$("#drima .opt").forEach(b => b.onclick = () => {
    if (b.dataset.w === R.ok[0]) { b.classList.add("yes"); Audio8.fx("good"); FX.burst(...centerOf(b), ["🎵", "⭐", R.ok[1]], 20); Voice.say(`Isso! ${R.w.toLowerCase()} rima com ${R.ok[0].toLowerCase()}! ${R.w.toLowerCase()}... ${R.ok[0].toLowerCase()}!`); }
    else { b.classList.add("no"); Audio8.fx("oops"); Voice.say(`${b.dataset.w.toLowerCase()}? Hmm, ${b.dataset.w.toLowerCase()} não rima com ${R.w.toLowerCase()}. Tente outra!`); }
  });
}
async function ceremony(kind, R) {
  const T = kind === "trophy";
  if (T) { const aw = store.get("awards", {}); aw.trophy = 1; store.set("awards", aw); }
  else { const f = fantasias(); if (!f.includes(R.fantasia.id)) f.push(R.fantasia.id); store.set("fantasias", f); setPerfil(WHO, { veste: R.fantasia.id }); }
  $("#cbox").innerHTML = T ? `<div class="cicon">🏆</div><h3>GUARDIÃ DO FOLCLORE!</h3><div class="cname">${NAME}</div><div class="cpt">Você conhece o Brasil inteirinho! 🇧🇷</div><div class="cfaces">👏🧢🧜‍♀️🐬🐺🐍👏</div>${rep([[`Parabéns, ${Nome()}! Você é a Guardiã do Folclore!`]])}<button class="orow" id="cok">💚 OBRIGADA!</button>`
    : `<h3>REGIÃO ${R.nome} COMPLETA!</h3><div style="margin:auto">${avHTML(WHO, 150)}</div><div class="cpt">Você ganhou: <b>${R.fantasia.nome}</b> ${R.fantasia.e}</div><div class="small">Toque no seu retrato lá no mapa para trocar de fantasia! ${rep([[`Você ganhou ${R.fantasia.nome.toLowerCase()}! Toque no seu retrato lá no mapa para trocar de fantasia.`]])}</div><div class="cfaces">👏👏🎉👏👏</div><button class="orow" id="cok">💚 OBA!</button>`;
  $("#done").classList.remove("on"); $("#ceremony").classList.add("on");
  Audio8.play("win"); Audio8.fx("ovation"); FX.confetti(); [0, 700, 1400, 2100].forEach(d => setTimeout(() => { FX.burst(innerWidth * (.2 + Math.random() * .6), innerHeight * .3, ["🌟", "✨", T ? "🏆" : R.fantasia.e, "🎉"], 26); FX.confetti(); }, d));
  $("#cok").onclick = () => { $("#ceremony").classList.remove("on"); goMuseum(); };
  await Voice.talk(T ? [[`Parabéns, ${Nome()}! Você é a Guardiã do Folclore! Você conhece o Brasil inteirinho! Todo mundo está aplaudindo você!`], ["Hihihi! Até eu, o Saci, estou batendo palma!", VOZ.saci]]
    : [[`Parabéns, ${Nome()}! Você completou a região ${R.nome.toLowerCase()}! Ganhou ${R.fantasia.nome.toLowerCase()} para vestir!`]]);
}
$("#dmuseum").onclick = () => { $("#done").classList.remove("on"); goMuseum(); };
$("#dnext").onclick = () => { $("#done").classList.remove("on"); const nx = nextArt(); nx ? meet(nx) : goMuseum(); };
$("#dsave").onclick = () => { const a = document.createElement("a"); a.download = `${NAME}-${cur.k}.jpg`; a.href = thumbData(P8.W * 2 > 1000 ? 1000 : P8.W * 2); document.body.appendChild(a); a.click(); a.remove(); Audio8.fx("tada"); };

/* ================= ÁLBUM DE FIGURINHAS ================= */
$("#bAlbum").onclick = () => {
  Audio8.fx("whoosh"); const fg = figs();
  $("#albBox").innerHTML = `<h3>📒 FIGURINHAS ${fg.length}/${FIGS.length}</h3><div class="small">Bichos e plantas do Brasil! Toque para ouvir. ${rep([[`Você tem ${fg.length} figurinhas de ${FIGS.length}. Toque numa figurinha para ouvir!`]])}</div><div class="figs">${FIGS.map((f, i) => { const tem = fg.includes(f.s);
    return `<button class="fig${tem ? "" : " no"}" data-i="${i}">${cropHTML(f.t.k, f.x, f.y, f.z)}<b>${tem ? silabasHTML(f.s) : "???"}</b></button>`; }).join("")}</div><button class="orow" id="albX">✖ FECHAR</button>`;
  $("#album").classList.add("on"); scrollify($("#albBox")); Voice.say("O seu álbum de figurinhas!");
  $$("#albBox .fig").forEach(b => b.onclick = () => { const f = FIGS[b.dataset.i]; Audio8.fx("pop");
    if (fg.includes(f.s)) Voice.talk([...silabas(f.s).map(s => [s.toLowerCase(), { rate: .7 }]), [palavra(f.s).toLowerCase() + "!"], [f.fato]]); else Voice.say(`Pinte ${f.t.nome.toLowerCase()} para ganhar esta figurinha!`); });
  $("#albX").onclick = () => { Voice.cancel(); $("#album").classList.remove("on"); };
};
$("#album").onclick = e => { if (e.target.id === "album") { Voice.cancel(); $("#album").classList.remove("on"); } };
/* ================= FANTASIAS ================= */
function abrirRoupa() {
  const f = fantasias(), veste = perfil(WHO).veste;
  $("#roupaBox").innerHTML = `<h3>👒 FANTASIAS</h3><div style="margin:auto">${avHTML(WHO, 140)}</div><div class="small">Complete uma região para ganhar uma fantasia! ${rep([["Toque numa fantasia para vestir. Complete uma região para ganhar uma fantasia nova!"]])}</div>
    <div class="wardrobe"><button data-f="" class="${!veste ? "on" : ""}">🚫</button>${REGIOES.map(R => `<button data-f="${R.fantasia.id}" class="${f.includes(R.fantasia.id) ? "" : "no"}${veste === R.fantasia.id ? " on" : ""}">${R.fantasia.id === "gorro" ? `<span style="display:block;width:46px;margin:auto">${GORRO}</span>` : R.fantasia.e}</button>`).join("")}</div>
    <button class="orow" id="roupaX">✖ FECHAR</button>`;
  $("#roupa").classList.add("on");
  $$("#roupaBox .wardrobe button").forEach(b => b.onclick = () => { const id = b.dataset.f;
    if (id && !f.includes(id)) { Audio8.fx("oops"); const R = REGIOES.find(r => r.fantasia.id === id); Voice.say(`Complete a região ${R.nome.toLowerCase()} para ganhar ${R.fantasia.nome.toLowerCase()}!`); return; }
    setPerfil(WHO, { veste: id || null }); Audio8.fx("magic"); abrirRoupa(); renderMuseum(); });
  $("#roupaX").onclick = () => $("#roupa").classList.remove("on");
}
$("#bRoupa").onclick = () => { Audio8.fx("tap"); abrirRoupa(); };
$("#roupa").onclick = e => { if (e.target.id === "roupa") $("#roupa").classList.remove("on"); };

/* ================= OPÇÕES (cantinho dos pais) ================= */
$("#gear").onclick = () => { Audio8.fx("tap"); renderOpts(); $("#opts").classList.add("on"); };
function renderOpts() {
  const done = TELAS.filter(passed).length, tot = TELAS.filter(t => !t.breve).length;
  $("#obox").innerHTML = `<h3>⚙️ OPÇÕES</h3>
   <button class="orow" id="oM">${Audio8.musicOn ? "🎵 Música: LIGADA" : "🎵 Música: DESLIGADA"}</button><button class="orow" id="oS">${Audio8.sfxOn ? "🔊 Sons e vozes: LIGADOS" : "🔇 Sons e vozes: DESLIGADOS"}</button>
   <button class="orow" id="oB">📖 Meu livro de cores</button><button class="orow" id="oP">👧 Trocar de pintora</button><button class="orow" id="oN">✏️ Mudar nome e retrato</button>
   <div class="small parent"><b>👨‍👩‍👧 Cantinho dos pais</b><br>${NAME}: <b>${done}/${tot}</b> pinturas · <b>${found().length}/${Object.keys(PAINT).length}</b> cores · <b>${figs().length}/${FIGS.length}</b> figurinhas<br>
   Voz em português: <b>${Voice.has("pt") ? "✅" : "⚠️ instale em Configurações → Conversão de texto em voz"}</b><br>
   O progresso fica só neste celular. Para não perder, guarde uma cópia:
   <div class="obtns" style="margin-top:6px"><button id="oExp" style="background:#2f7dff;font-size:16px">💾 Guardar cópia</button><button id="oImp" style="background:#8a3fc4;font-size:16px">📂 Restaurar</button></div></div>
   <div id="oMain" style="display:flex;gap:8px"><button class="orow danger" id="oR" style="flex:1;font-size:16px">🗑️ Apagar progresso</button><button class="orow danger" id="oD" style="flex:1;font-size:16px">❌ Apagar ${NAME}</button></div>
   <div id="oConf" hidden><p id="oQ"></p><div class="obtns"><button id="oY" style="background:#e0262f">Sim, apagar</button><button id="oNo" style="background:#2bc46b">Não</button></div></div>
   <button class="orow" id="oC">✖ Fechar</button>`;
  scrollify($("#obox"));
  $("#oM").onclick = () => { Audio8.toggleMusic(); renderOpts(); }; $("#oS").onclick = () => { Audio8.toggleSfx(); renderOpts(); };
  $("#oB").onclick = () => { P8.meta = null; $("#opts").classList.remove("on"); mixA = mixB = null; renderMixer(); $("#mixer").classList.add("on"); scrollify($("#mixer .obox")); };
  $("#oP").onclick = () => { $("#opts").classList.remove("on"); goPerfis(); };
  $("#oN").onclick = () => { $("#opts").classList.remove("on"); goNome(WHO); };
  $("#oExp").onclick = () => { const b = new Blob([JSON.stringify(backupAll())], { type: "application/json" }), a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = `atelie-brasil-${new Date().toISOString().slice(0, 10)}.json`; document.body.appendChild(a); a.click(); a.remove(); Audio8.fx("tada"); };
  $("#oImp").onclick = () => $("#fileIn").click();
  let apagaTudo = false;
  const conf = tudo => { apagaTudo = tudo; $("#oQ").textContent = tudo ? `Tem certeza? A pintora ${NAME} e tudo o que ela pintou vão sumir.` : `Tem certeza? As pinturas, cores e figurinhas de ${NAME} serão apagadas.`; $("#oMain").style.display = "none"; $("#oConf").hidden = false; Audio8.fx("oops"); };
  $("#oR").onclick = () => conf(false); $("#oD").onclick = () => conf(true);
  $("#oNo").onclick = () => { $("#oMain").style.display = "flex"; $("#oConf").hidden = true; };
  $("#oY").onclick = () => { store.clear(); if (apagaTudo) { const p = perfis(); delete p[WHO]; gstore.set("perfis", p); gstore.set("ultima", null); }
    $("#obox").innerHTML = "<h3>🧹 Tudo novo!</h3>"; setTimeout(() => location.reload(), 1000); };
  $("#oC").onclick = () => $("#opts").classList.remove("on");
}
$("#fileIn").onchange = async e => { const f = e.target.files[0]; if (!f) return; try { const n = restoreAll(JSON.parse(await f.text())); $("#obox").innerHTML = `<h3>📂 Restaurado!</h3><p>${n} itens</p>`; setTimeout(() => location.reload(), 1200); } catch (err) { alert("Arquivo inválido"); } };
$("#opts").onclick = e => { if (e.target.id === "opts") $("#opts").classList.remove("on"); };
addEventListener("resize", () => { if (UI.cur === "paint") fitCanvas(); });
if ("serviceWorker" in navigator) addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => { }));
