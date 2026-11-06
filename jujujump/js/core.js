"use strict";
/* ================= helpers ================= */
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const rnd = n => Math.floor(Math.random() * n), pick = a => a[rnd(a.length)];
const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const store = {
  get(k, d) { try { const v = localStorage.getItem("jj_" + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem("jj_" + k, JSON.stringify(v)); } catch (e) { } },
};
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };

/* ================= photos of Julia ================= */
// face: [centerX, centerY, cropSize] as fractions of the photo (crop is square, size relative to width)
const PH_META = {"1":[0.562,0.183,0.414],"2":[0.542,0.259,0.355],"3":[0.511,0.27,0.349],"4":[0.432,0.269,0.351],"5":[0.527,0.334,0.572],"6":[0.465,0.191,0.458],"7":[0.484,0.258,0.578],"8":[0.48,0.425,0.619],"9":[0.767,0.349,0.542],"10":[0.555,0.218,0.299],"11":[0.406,0.38,0.469],"12":[0.381,0.41,0.431],"13":[0.62,0.177,0.379],"14":[0.456,0.48,0.431],"15":[0.54,0.456,0.844],"16":[0.557,0.19,0.384],"17":[0.531,0.245,0.482],"18":[0.492,0.228,0.444],"19":[0.553,0.169,0.38]};
const PH = Object.keys(PH_META).map(k => { const n = String(k).padStart(2, "0"); return { i: +k, full: `photos/p${n}.jpg`, thumb: `thumbs/t${n}.jpg`, face: `faces/f${n}.webp` }; });
const P = i => PH[i - 1];
const HAPPY_FACES = [1, 2, 4, 6, 8, 13, 14, 17, 18].map(P);
const imgCache = {};
function loadImg(src) { return imgCache[src] || (imgCache[src] = new Promise(r => { const i = new Image(); i.onload = () => r(i); i.onerror = () => r(i); i.src = src; })); }

/* ================= SOUND: 8-bit music + effects (all synthesised) ================= */
const Snd = (() => {
  let ctx = null, master, mus, sfx, noiseBuf, timer = null, nextT = 0, step = 0, song = null;
  let musicOn = store.get("music", true), sfxOn = store.get("sfx", true), duck = 1;
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12), _ = 0;
  const SONGS = {
    // original melodies (MIDI notes, 0 = rest), 8th-note steps
    hub: { bpm: 140, vol: .11,
      mel: [72,_,74,76, 79,_,76,_, 77,_,76,74, 72,_,67,_, 69,_,72,74, 76,_,74,72, 74,_,_,79, 76,_,_,_,
            72,_,74,76, 79,_,81,79, 84,_,81,79, 76,_,74,_, 77,_,76,74, 72,_,74,76, 72,_,67,69, 72,_,_,_],
      bass: [48,45,41,43, 48,41,43,48] },
    game: { bpm: 120, vol: .07,
      mel: [76,_,_,79, 81,_,79,_, 76,_,74,_, 72,_,_,_, 74,_,_,76, 79,_,76,_, 74,_,72,_, 74,_,_,_],
      bass: [48,45,41,43] },
    lull: { bpm: 70, vol: .09,
      mel: [79,_,76,_, 74,_,72,_, 74,_,76,_, 72,_,_,_, 79,_,81,_, 79,_,76,_, 74,_,72,_, 72,_,_,_],
      bass: [48,41,43,48] },
    dance: { bpm: 150, vol: .12,
      mel: [72,72,79,_, 77,76,74,_, 72,72,79,_, 81,79,77,76, 74,74,77,_, 76,74,72,_, 71,72,74,76, 77,76,74,_],
      bass: [48,48,41,43] },
  };
  function init() {
    if (ctx) return; const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    ctx = new AC(); master = ctx.createGain(); master.gain.value = .9; master.connect(ctx.destination);
    mus = ctx.createGain(); mus.gain.value = 0; mus.connect(master);
    sfx = ctx.createGain(); sfx.gain.value = sfxOn ? .3 : 0; sfx.connect(master);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * .6, ctx.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    document.addEventListener("visibilitychange", () => { if (ctx) document.hidden ? ctx.suspend() : ctx.resume(); });
  }
  function tone(out, type, f, t, dur, vol = 1, slide = null, attack = .005) {
    const o = ctx.createOscillator(), g = ctx.createGain(); o.type = type; o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + attack); g.gain.setValueAtTime(vol, t + dur * .6); g.gain.exponentialRampToValueAtTime(.001, t + dur);
    o.connect(g); g.connect(out); o.start(t); o.stop(t + dur + .03); return o;
  }
  function noise(out, t, dur, vol, type = "bandpass", f = 1800) {
    const s = ctx.createBufferSource(); s.buffer = noiseBuf; const fl = ctx.createBiquadFilter(); fl.type = type; fl.frequency.value = f;
    const g = ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.001, t + dur);
    s.connect(fl); fl.connect(g); g.connect(out); s.start(t); s.stop(t + dur + .03);
  }
  function mvol() { return musicOn && song ? song.vol * duck : 0; }
  function schedule() {
    if (!song) return; const STEP = 60 / song.bpm / 2;
    while (nextT < ctx.currentTime + .15) {
      const M = song.mel, i = step % M.length, bar = Math.floor(i / 8), ib = i % 8, n = M[i];
      if (n) { let len = 1; while (len < 4 && M[(i + len) % M.length] === 0) len++; tone(mus, "square", mtof(n), nextT, STEP * len * .9, .5); }
      const root = song.bass[bar % song.bass.length];
      tone(mus, "triangle", mtof(ib % 2 ? root + 12 : root), nextT, STEP * .85, .9);
      if (song !== SONGS.lull) {
        tone(mus, "square", mtof(root + 24 + [0, 4, 7, 12][step % 4]), nextT, STEP * .3, .05);
        if (ib === 0 || ib === 4) tone(mus, "sine", 150, nextT, .15, 1.1, 40);
        if (ib === 2 || ib === 6) noise(mus, nextT, .1, .4);
        noise(mus, nextT, .025, .14, "highpass", 7000);
      }
      nextT += STEP; step++;
    }
  }
  const api = {
    get ctx() { return ctx; }, get sfxNode() { return sfx; },
    unlock() { init(); if (ctx && ctx.state === "suspended") ctx.resume(); },
    music(name) {
      if (!ctx) return; const s = SONGS[name] || null; if (s === song) return;
      song = s; step = 0; nextT = ctx.currentTime + .08; mus.gain.setTargetAtTime(mvol(), ctx.currentTime, .1);
      if (!timer) timer = setInterval(schedule, 40);
    },
    duck(on) { duck = on ? .25 : 1; if (ctx) mus.gain.setTargetAtTime(mvol(), ctx.currentTime, .08); },
    get musicOn() { return musicOn; }, get sfxOn() { return sfxOn; },
    toggleMusic() { musicOn = !musicOn; store.set("music", musicOn); if (ctx) mus.gain.setTargetAtTime(mvol(), ctx.currentTime, .05); },
    toggleSfx() { sfxOn = !sfxOn; store.set("sfx", sfxOn); if (ctx) sfx.gain.setTargetAtTime(sfxOn ? .3 : 0, ctx.currentTime, .05); if (!sfxOn) Voice.cancel(); },
    play(name, arg) {
      if (!ctx) return; const t = ctx.currentTime + .01;
      const seq = (ns, gap, type = "square", dur = .12, v = .7) => ns.forEach((m, k) => { if (m) tone(sfx, type, mtof(m), t + k * gap, dur, v); });
      switch (name) {
        case "tap": tone(sfx, "square", 660, t, .05, .4, 990); break;
        case "pop": tone(sfx, "sine", 880, t, .09, .9, 260); break;
        case "boing": tone(sfx, "triangle", 180, t, .35, .9, 620); tone(sfx, "sine", 90, t, .3, .5, 300); break;
        case "jump": tone(sfx, "square", 300, t, .18, .5, 900); break;
        case "whoosh": noise(sfx, t, .35, .5, "bandpass", 900); noise(sfx, t + .05, .3, .3, "highpass", 3000); break;
        case "sparkle": seq([88, 91, 96, 100], .05, "sine", .15, .5); break;
        case "good": seq([72, 76, 79, 84], .07, "square", .12, .55); break;
        case "great": seq([72, 76, 79, 84, 0, 79, 84, 88], .08, "square", .15, .55); [48, 55, 60].forEach((m, k) => tone(sfx, "triangle", mtof(m), t + k * .18, .3, .8)); break;
        case "oops": tone(sfx, "triangle", 500, t, .25, .8, 180); break;
        case "giggle": for (let k = 0; k < 6; k++) tone(sfx, "sine", 700 + rnd(300), t + k * .09, .07, .6, 1100 + rnd(300)); break;
        case "honk": tone(sfx, "sawtooth", 220, t, .22, .5, 200); tone(sfx, "square", 330, t, .22, .25); break;
        case "chomp": noise(sfx, t, .08, .9, "lowpass", 900); noise(sfx, t + .16, .08, .9, "lowpass", 900); noise(sfx, t + .32, .08, .9, "lowpass", 900); break;
        case "splash": noise(sfx, t, .5, .9, "lowpass", 1800); for (let k = 0; k < 5; k++) tone(sfx, "sine", 600 + rnd(900), t + k * .06, .08, .4, 1500); break;
        case "drum": { const f = arg || 120; tone(sfx, "sine", f, t, .25, 1.3, f * .4); noise(sfx, t, .08, .5, "lowpass", 1500); break; }
        case "snare": noise(sfx, t, .18, .9, "bandpass", 2200); tone(sfx, "triangle", 220, t, .08, .5); break;
        case "cymbal": noise(sfx, t, .6, .5, "highpass", 6000); break;
        case "coin": seq([83, 88], .07, "square", .12, .5); break;
        case "tick": tone(sfx, "square", 1000, t, .04, .35); break;
        case "type": tone(sfx, "square", 1200 + rnd(300), t, .02, .12); break;
        case "magic": for (let k = 0; k < 10; k++) tone(sfx, "sine", mtof(72 + k * 2), t + k * .04, .2, .35); break;
        case "pour": noise(sfx, t, .8, .5, "lowpass", 700); break;
        case "slide": tone(sfx, "sine", 300, t, .5, .6, 1200); break;
        case "slideDown": tone(sfx, "sine", 1200, t, .5, .6, 250); break;
        case "alarm": for (let k = 0; k < 6; k++) tone(sfx, "square", k % 2 ? 880 : 1175, t + k * .12, .1, .35); break;
        case "gulp": [0, .25, .5].forEach(d => tone(sfx, "sine", 300, t + d, .12, .9, 120)); break;
        case "note": tone(sfx, "triangle", mtof(arg || 72), t, .3, .7); break;
      }
    },
  };
  return api;
})();

/* ================= VOICE: English / Chinese / Portuguese text-to-speech ================= */
const Voice = (() => {
  const S = window.speechSynthesis; let voices = [];
  const loadV = () => { try { voices = S.getVoices() || []; } catch (e) { } };
  if (S) { loadV(); S.onvoiceschanged = loadV; }
  const vFor = lang => voices.find(v => v.lang && v.lang.replace("_", "-").toLowerCase() === lang.toLowerCase()) ||
                       voices.find(v => v.lang && v.lang.toLowerCase().startsWith(lang.slice(0, 2)));
  function say(text, lang = "en-US", o = {}) {
    return new Promise(res => {
      if (!S || !Snd.sfxOn || !text) return res();
      try {
        const u = new SpeechSynthesisUtterance(text); u.lang = lang; const v = vFor(lang); if (v) u.voice = v;
        u.rate = o.rate || (lang.startsWith("zh") ? .75 : .95); u.pitch = o.pitch || 1.15; u.volume = 1;
        let done = false; const fin = () => { if (done) return; done = true; Snd.duck(false); res(); };
        u.onend = fin; u.onerror = fin; Snd.duck(true); S.speak(u);
        setTimeout(fin, 1800 + text.length * (lang.startsWith("zh") ? 450 : 110)); // safety net
      } catch (e) { res(); }
    });
  }
  return {
    en: (t, o) => say(t, "en-US", o), zh: (t, o) => say(t, "zh-CN", o), pt: (t, o) => say(t, "pt-BR", o),
    async word(w, intro) { if (intro) await say(intro, "en-US"); await say(w.en.replace(" (character)", "").replace(" color", ""), "en-US"); await sleep(120); await say(w.zh, "zh-CN"); },
    cancel() { try { S && S.cancel(); } catch (e) { } Snd.duck(false); },
    hasZh() { loadV(); return !!voices.find(v => v.lang && v.lang.toLowerCase().startsWith("zh")); },
    get supported() { return !!S; },
  };
})();

/* ================= MIC: speech recognition (talk to Panda) ================= */
const Rec = {
  get ok() { return !!(window.SpeechRecognition || window.webkitSpeechRecognition); },
  listen(lang = "pt-BR", ms = 6000) {
    return new Promise(res => {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition; if (!SR) return res([]);
      let out = [], done = false; const fin = () => { if (done) return; done = true; try { r.stop(); } catch (e) { } res(out); };
      const r = new SR(); r.lang = lang; r.interimResults = false; r.maxAlternatives = 5;
      r.onresult = e => { for (const res of e.results) for (const alt of res) out.push(alt.transcript.toLowerCase().trim()); fin(); };
      r.onerror = fin; r.onend = fin; Voice.cancel();
      try { r.start(); } catch (e) { fin(); } setTimeout(fin, ms);
    });
  },
};
/* ================= MIC: recorder for the Silly Parrot ================= */
const Recorder = {
  stream: null,
  get ok() { return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder); },
  async record(ms = 3000, onLevel) {
    if (!this.stream) this.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    const mr = new MediaRecorder(this.stream), chunks = [];
    mr.ondataavailable = e => e.data.size && chunks.push(e.data);
    const ctx = Snd.ctx, an = ctx.createAnalyser(), src = ctx.createMediaStreamSource(this.stream); src.connect(an); an.fftSize = 256;
    const buf = new Uint8Array(an.frequencyBinCount); let raf;
    const meter = () => { an.getByteTimeDomainData(buf); let m = 0; for (const v of buf) m = Math.max(m, Math.abs(v - 128)); onLevel && onLevel(m / 128); raf = requestAnimationFrame(meter); };
    meter(); mr.start();
    await sleep(ms); mr.stop(); await new Promise(r => mr.onstop = r); cancelAnimationFrame(raf); src.disconnect();
    const ab = await new Blob(chunks).arrayBuffer();
    return await ctx.decodeAudioData(ab);
  },
  play(buffer, mode) {
    const ctx = Snd.ctx; let b = buffer;
    if (mode === "back") { b = ctx.createBuffer(buffer.numberOfChannels, buffer.length, buffer.sampleRate);
      for (let c = 0; c < buffer.numberOfChannels; c++) { const s = buffer.getChannelData(c), d = b.getChannelData(c); for (let i = 0; i < s.length; i++) d[i] = s[s.length - 1 - i]; } }
    const src = ctx.createBufferSource(); src.buffer = b;
    src.playbackRate.value = { chip: 1.75, giant: .62, back: 1, robot: 1, normal: 1 }[mode] || 1;
    const g = ctx.createGain(); g.gain.value = 1.6;
    if (mode === "robot") { const ring = ctx.createGain(), osc = ctx.createOscillator(); osc.frequency.value = 55; osc.type = "square"; ring.gain.value = 0; osc.connect(ring.gain); src.connect(ring); ring.connect(g); osc.start(); osc.stop(ctx.currentTime + b.duration + .2); }
    else src.connect(g);
    g.connect(ctx.destination); src.start();
    return new Promise(r => src.onended = r);
  },
};

/* ================= UI: screens, iris transition, effects ================= */
let cleanup = null;
const UI = {
  cur: null,
  async go(id, x, y, color, onSwap) {
    if (UI.busy) return; UI.busy = true; Voice.cancel();
    const w = $("#wipe"); x = x ?? innerWidth / 2; y = y ?? innerHeight / 2;
    w.style.background = color || "#ff4fa0"; w.style.display = "flex"; Snd.play("whoosh");
    w.animate([{ clipPath: `circle(0px at ${x}px ${y}px)` }, { clipPath: `circle(150vmax at ${x}px ${y}px)` }], { duration: 380, easing: "ease-in", fill: "forwards" });
    await sleep(400);
    if (cleanup) { try { cleanup(); } catch (e) { } cleanup = null; }
    $$(".screen").forEach(s => s.classList.toggle("on", s.id === id)); UI.cur = id;
    if (onSwap) { try { await onSwap(); } catch (e) { console.error(e); } }
    await sleep(120);
    w.animate([{ clipPath: `circle(150vmax at 50% 50%)` }, { clipPath: `circle(0px at 50% 50%)` }], { duration: 420, easing: "ease-out", fill: "forwards" });
    await sleep(430); w.style.display = "none"; UI.busy = false;
  },
  bubble(target, text, ms = 2600) {
    const b = el("div", "bubble", text); document.body.appendChild(b);
    const r = target.getBoundingClientRect(); b.style.left = Math.max(8, Math.min(innerWidth - 228, r.left + r.width / 2 - 110)) + "px"; b.style.top = Math.max(60, r.top - 64) + "px";
    setTimeout(() => b.classList.add("out"), ms); setTimeout(() => b.remove(), ms + 400);
  },
  float(x, y, txt, cls = "") { const f = el("div", "floaty " + cls, txt); f.style.left = x + "px"; f.style.top = y + "px"; document.body.appendChild(f); setTimeout(() => f.remove(), 1100); },
  card(w, big) {
    return `<div class="wcard ${big ? "big" : ""}"><div class="we">${w.e}</div><div class="wen">${w.en.replace(" (character)", "").replace(" color", "")}</div>
      <div class="wzh">${w.zh}</div><div class="wpy">${pyHTML(w.py)}</div></div>`;
  },
};

/* ---------- bamboo 🎋 (the panda's food = reward currency) ---------- */
const Bamboo = {
  get n() { return store.get("bamboo", 0); },
  add(k, x, y) {
    store.set("bamboo", this.n + k); store.set("bambooTotal", store.get("bambooTotal", 0) + k);
    const tgt = $(".screen.on .bcount") || $("#mapBamboo"); const r = tgt ? tgt.getBoundingClientRect() : { left: innerWidth - 60, top: 20 };
    for (let i = 0; i < Math.min(k, 6); i++) {
      const b = el("div", "flybamboo", "🎋"); b.style.left = (x ?? innerWidth / 2) + "px"; b.style.top = (y ?? innerHeight / 2) + "px"; document.body.appendChild(b);
      b.animate([{ transform: "translate(0,0) scale(1.4)" }, { transform: `translate(${r.left - (x ?? innerWidth / 2)}px,${r.top - (y ?? innerHeight / 2)}px) scale(.6)` }],
        { duration: 700 + i * 90, easing: "cubic-bezier(.5,-0.4,.7,1)", fill: "forwards" });
      setTimeout(() => { b.remove(); Snd.play("coin"); }, 700 + i * 90);
    }
    setTimeout(Bamboo.render, 800);
  },
  render() { $$(".bcount").forEach(e => e.textContent = "🎋 " + Bamboo.n); },
};

/* ---------- celebrations: random each time for surprise ---------- */
const FX = {
  cv: null, g: null, parts: [], running: false,
  init() { if (this.cv) return; this.cv = $("#fx"); this.g = this.cv.getContext("2d"); addEventListener("resize", () => this.size()); this.size(); },
  size() { this.cv.width = innerWidth; this.cv.height = innerHeight; },
  loop() {
    const g = this.g; g.clearRect(0, 0, this.cv.width, this.cv.height);
    this.parts = this.parts.filter(p => p.life > 0);
    for (const p of this.parts) {
      p.x += p.vx; p.y += p.vy; p.vy += p.gr; p.vx *= p.dr; p.r += p.vr; p.life -= p.dl;
      g.save(); g.globalAlpha = Math.max(0, Math.min(1, p.life)); g.translate(p.x, p.y); g.rotate(p.r);
      if (p.e) { g.font = p.s + "px serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(p.e, 0, 0); }
      else { g.fillStyle = p.c; g.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); }
      g.restore();
    }
    if (this.parts.length) requestAnimationFrame(() => this.loop()); else this.running = false;
  },
  add(ps) { this.parts.push(...ps); if (!this.running) { this.running = true; this.loop(); } },
  confetti() { const C = ["#ff4fa0", "#ffd23f", "#8b5cff", "#3ddbb0", "#4fb6ff", "#fff"];
    this.add([...Array(130)].map(() => ({ x: Math.random() * innerWidth, y: -20 - Math.random() * 300, vx: (Math.random() - .5) * 3, vy: 2 + Math.random() * 3, gr: .03, dr: 1, r: Math.random() * 6, vr: (Math.random() - .5) * .3, s: 7 + Math.random() * 7, c: pick(C), life: 3, dl: .012 }))); },
  burst(x, y, emojis = ["⭐", "✨", "💖", "🌟"], n = 26) {
    this.add([...Array(n)].map(() => { const a = Math.random() * Math.PI * 2, s = 3 + Math.random() * 7; return { x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 2, gr: .16, dr: .99, r: 0, vr: (Math.random() - .5) * .2, s: 20 + rnd(20), e: pick(emojis), life: 1.4, dl: .018 }; }));
  },
  rain(emojis) { this.add([...Array(40)].map(() => ({ x: Math.random() * innerWidth, y: -40 - Math.random() * innerHeight * .7, vx: 0, vy: 3 + Math.random() * 4, gr: .02, dr: 1, r: 0, vr: (Math.random() - .5) * .1, s: 28 + rnd(22), e: pick(emojis), life: 3, dl: .01 }))); },
  fireworks() { for (let k = 0; k < 4; k++) setTimeout(() => { Snd.play("pop"); this.burst(innerWidth * (.2 + Math.random() * .6), innerHeight * (.2 + Math.random() * .3), ["✨", "🌟", "💥", "⭐"], 30); }, k * 260); },
  faceFly() { // Julia's face zooms across the screen wearing a crown
    const f = el("div", "faceflyer", `<img src="${pick(HAPPY_FACES).face}"><span>👑</span>`); document.body.appendChild(f);
    f.animate([{ transform: `translate(-150px, ${innerHeight * .6}px) rotate(-30deg)` }, { transform: `translate(${innerWidth / 2 - 70}px, ${innerHeight * .25}px) rotate(0) scale(1.3)` }, { transform: `translate(${innerWidth + 150}px, ${innerHeight * .5}px) rotate(30deg)` }], { duration: 1600, easing: "ease-in-out" });
    setTimeout(() => f.remove(), 1600); Snd.play("slide");
  },
  celebrate(x, y) {
    const r = rnd(5); x = x ?? innerWidth / 2; y = y ?? innerHeight / 2;
    if (r === 0) this.confetti(); else if (r === 1) this.burst(x, y); else if (r === 2) this.fireworks();
    else if (r === 3) this.rain(["💖", "🌸", "⭐", "🍭", "🦄"]); else { this.faceFly(); this.burst(x, y, ["👑", "✨"], 14); }
  },
};
const PRAISE = ["Great job!", "Wow!", "Amazing!", "Super!", "Yes!", "You got it!", "Fantastic!", "Hooray!", "Well done!", "Awesome, Juju!"];
const PRAISE_ZH = [["太棒了!", "tài bàng le"], ["很好!", "hěn hǎo"], ["真棒!", "zhēn bàng"]];
async function praise(x, y, speak = true) {
  Snd.play("good"); FX.celebrate(x, y);
  if (speak) { if (Math.random() < .3) { const z = pick(PRAISE_ZH); await Voice.zh(z[0]); } else await Voice.en(pick(PRAISE)); }
}
async function oops(elm) {
  Snd.play("oops"); if (elm) { elm.classList.remove("wobble"); void elm.offsetWidth; elm.classList.add("wobble"); }
}

/* ================= PANDA (SVG mascot) ================= */
function pandaSVG(hat = "") {
  return `<div class="panda"><svg viewBox="0 0 200 200">
   <ellipse cx="100" cy="150" rx="62" ry="48" fill="#fff" stroke="#222" stroke-width="4"/>
   <ellipse cx="55" cy="170" rx="20" ry="16" fill="#222"/><ellipse cx="145" cy="170" rx="20" ry="16" fill="#222"/>
   <g class="parm"><ellipse cx="44" cy="128" rx="16" ry="26" fill="#222" transform="rotate(25 44 128)"/></g>
   <g class="parm r"><ellipse cx="156" cy="128" rx="16" ry="26" fill="#222" transform="rotate(-25 156 128)"/></g>
   <g class="phead">
    <circle cx="52" cy="40" r="20" fill="#222"/><circle cx="148" cy="40" r="20" fill="#222"/>
    <circle cx="100" cy="80" r="56" fill="#fff" stroke="#222" stroke-width="4"/>
    <ellipse cx="76" cy="78" rx="15" ry="19" fill="#222" transform="rotate(-20 76 78)"/><ellipse cx="124" cy="78" rx="15" ry="19" fill="#222" transform="rotate(20 124 78)"/>
    <g class="peyes"><circle cx="78" cy="78" r="6" fill="#fff"/><circle cx="122" cy="78" r="6" fill="#fff"/><circle cx="80" cy="76" r="2.5" fill="#222"/><circle cx="124" cy="76" r="2.5" fill="#222"/></g>
    <ellipse cx="100" cy="98" rx="9" ry="6" fill="#222"/>
    <path class="pmouth" d="M88 108 Q100 120 112 108" stroke="#222" stroke-width="4" fill="none" stroke-linecap="round"/>
    <circle cx="66" cy="104" r="8" fill="#ffb3cf"/><circle cx="134" cy="104" r="8" fill="#ffb3cf"/>
   </g></svg><div class="phat">${hat}</div></div>`;
}
