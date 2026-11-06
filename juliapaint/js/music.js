"use strict";
/* =========================================================
   AUDIO: chip-tune themes (public-domain classics + originals),
   ambience (birds, waves, frogs, thunder, wind, crickets) and effects.
   Melody notation: "E5.2" = note E5 lasting 2 eighths, "r.2" = rest.
   ========================================================= */
const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
function midi(n) { const m = n.match(/^([A-G])(#|b)?(\d)$/); return 12 * (+m[3] + 1) + NOTE[m[1]] + (m[2] === "#" ? 1 : m[2] === "b" ? -1 : 0); }
function parse(s) { return s.trim().split(/\s+/).map(t => { const [n, d] = t.split("."); return [n === "r" ? 0 : midi(n), +(d || 1)]; }); }
const THEMES = {
  // bpm, beats per bar (in eighths), lead wave, bass roots per bar, style
  menu: { bpm: 132, bar: 8, wave: "square", bass: "C3 A2 F2 G2", style: "pop",
    mel: "E5.2 G5.2 C6.2 G5.2 A5.2 G5.1 E5.1 D5.2 r.2 F5.2 A5.2 D6.2 A5.2 B5.2 A5.1 G5.1 E5.4" },
  boogie: { bpm: 150, bar: 8, wave: "square", bass: "C3 C3 F2 C3 G2 F2 C3 G2", style: "boogie",
    mel: "C5.1 E5.1 G5.1 A5.1 Bb5.2 A5.1 G5.1 C5.1 E5.1 G5.1 A5.1 Bb5.2 A5.2 F5.1 A5.1 C6.1 D6.1 Eb6.2 D6.1 C6.1 C5.1 E5.1 G5.1 A5.1 G5.4 G5.1 B5.1 D6.1 B5.1 F5.1 A5.1 C6.1 A5.1 C5.2 E5.2 G5.4" },
  bubbles: { bpm: 140, bar: 8, wave: "triangle", bass: "F2 D3 G2 C3", style: "swing",
    mel: "A5.1 C6.1 r.1 A5.1 G5.2 F5.2 D5.1 F5.1 r.1 A5.1 G5.4 E5.1 G5.1 r.1 Bb5.1 A5.2 G5.2 F5.6 r.2" },
  bells: { bpm: 84, bar: 8, wave: "sine", bass: "D3 E3 F#3 E3", style: "pad",
    mel: "A5.2 D6.2 C#6.2 A5.2 B5.2 E6.2 D6.4 F#5.2 A5.2 G#5.2 E5.2 F#5.8" },
  march: { bpm: 120, bar: 8, wave: "square", bass: "G2 D3 G2 D3 C3 G2 D3 G2", style: "march",
    mel: "D5.2 G5.2 G5.1 A5.1 B5.2 B5.2 A5.2 G5.2 F#5.2 E5.2 D5.4 r.2 D5.2 C5.2 E5.2 D5.2 B4.2 A4.2 D5.2 G4.4 r.4" },
  calm: { bpm: 90, bar: 6, wave: "triangle", bass: "F2 C3 D3 Bb2", style: "waltz",
    mel: "A5.2 C6.2 F5.2 G5.4 E5.2 F5.2 A5.2 D5.2 E5.6 D5.2 F5.2 Bb4.2 C5.6" },
  waltz: { bpm: 160, bar: 6, wave: "square", bass: "G2 D3 D3 G2 C3 G2 D3 G2", style: "waltz",
    mel: "D5.2 G5.2 B5.2 B5.4 A5.2 G5.2 F#5.2 A5.2 A5.4 r.2 C6.2 B5.2 A5.2 G5.4 E5.2 D5.2 G5.2 F#5.2 G5.6" },
  musette: { bpm: 170, bar: 6, wave: "sawtooth", bass: "A2 E3 A2 E3 D3 A2 E3 A2", style: "waltz",
    mel: "E5.2 A5.2 C6.2 B5.2 A5.2 G#5.2 A5.4 E5.2 F5.2 E5.2 D5.2 C5.4 r.2 D5.2 F5.2 A5.2 G#5.2 B5.2 E5.2 A5.6" },
  ragtime: { bpm: 128, bar: 8, wave: "square", bass: "C3 C3 G2 C3 F2 C3 G2 C3", style: "stride",   // The Entertainer (Joplin, 1902)
    mel: "D5.1 D#5.1 E5.1 C6.2 E5.1 C6.2 E5.1 C6.5 r.1 C6.1 D6.1 D#6.1 E6.1 C6.1 D6.1 E6.2 B5.1 D6.2 C6.5 r.2 D5.1 D#5.1 E5.1 C6.2 E5.1 C6.2 E5.1 C6.5 r.1 A5.1 G5.1 F#5.1 A5.1 C6.1 E6.2 D6.1 C6.1 A5.1 D6.6 r.2" },
  musicbox: { bpm: 110, bar: 6, wave: "sine", bass: "C3 G2 A2 F2", style: "box",
    mel: "E6.1 G6.1 C7.2 B6.1 G6.1 A6.2 G6.2 r.2 F6.1 A6.1 D7.2 C7.1 A6.1 G6.4 r.2" },
  arabesque: { bpm: 100, bar: 8, wave: "triangle", bass: "E3 C#3 A2 B2", style: "arp",   // after Debussy, Arabesque No.1 (1891)
    mel: "B5.2 C#6.1 E6.1 G#6.4 F#6.2 E6.2 C#6.4 B5.2 A5.2 G#5.2 F#5.2 E5.8" },
  sakura: { bpm: 72, bar: 8, wave: "triangle", bass: "A2 A2 E2 A2", style: "koto",       // Sakura Sakura (traditional)
    mel: "A4.2 A4.2 B4.4 A4.2 A4.2 B4.4 A4.2 B4.2 C5.2 B4.2 A4.2 B4.1 A4.1 F4.4 E4.2 C4.2 E4.2 F4.2 E4.2 E4.1 C4.1 B3.4" },
  gymnopedie: { bpm: 66, bar: 6, wave: "triangle", bass: "G2 D3 G2 D3", style: "waltzslow",  // Satie, Gymnopédie No.1 (1888)
    mel: "r.6 r.2 F#5.2 A5.2 G5.2 F#5.2 C#5.2 B4.2 C#5.2 D5.2 A4.6 r.6" },
  lullaby: { bpm: 84, bar: 6, wave: "sine", bass: "C3 G2 G2 C3 F2 C3 G2 C3", style: "waltzslow",   // Brahms, Wiegenlied (1868)
    mel: "E5.1 E5.1 G5.4 E5.1 E5.1 G5.4 E5.1 G5.1 C6.2 B5.2 A5.2 A5.2 G5.4 D5.1 E5.1 F5.2 D5.2 D5.1 E5.1 F5.4 D5.1 F5.1 B5.1 A5.1 G5.2 B5.2 C6.6" },
  mountainking: { bpm: 120, bar: 8, wave: "square", bass: "A2 A2 A2 A2", style: "sneak", accel: 1, // Grieg, In the Hall of the Mountain King (1875)
    mel: "A4.1 B4.1 C5.1 D5.1 E5.1 C5.1 E5.2 D#5.1 B4.1 D#5.2 D5.1 Bb4.1 D5.2 A4.1 B4.1 C5.1 D5.1 E5.1 C5.1 E5.1 A5.1 G5.1 E5.1 C5.1 E5.1 G5.4" },
  clair: { bpm: 60, bar: 6, wave: "sine", bass: "Db3 Ab2 Bb2 F2", style: "pad",          // after Debussy, Clair de Lune (1905)
    mel: "r.2 F5.1 Ab5.1 F5.4 Eb5.1 F5.1 Eb5.4 Db5.1 Eb5.1 Db5.2 C5.2 Db5.2 Bb4.6" },
  jungle: { bpm: 112, bar: 8, wave: "triangle", bass: "D2 D2 F2 C2", style: "drums",
    mel: "D5.2 r.1 D5.1 F5.2 A5.2 G5.1 F5.1 D5.2 r.4 A4.2 r.1 C5.1 D5.2 F5.1 E5.1 D5.6 r.2" },
  danube: { bpm: 170, bar: 6, wave: "square", bass: "D3 D3 D3 A2 A2 A2 A2 D3", style: "waltz",   // J. Strauss II, Blue Danube (1866)
    mel: "D5.2 D5.2 F#5.2 A5.2 r.2 A5.2 r.2 A5.2 r.2 F#5.2 r.2 F#5.2 r.2 D5.2 D5.2 F#5.2 A5.2 r.2 A5.2 r.2 A5.2 r.2 G5.2 r.2 G5.2 r.2" },
  baroque: { bpm: 112, bar: 6, wave: "square", bass: "G2 D3 G2 C3 D3 G2", style: "waltz",
    mel: "G5.2 D5.1 E5.1 F#5.1 G5.1 A5.2 D5.2 D5.2 B5.2 G5.1 A5.1 B5.1 C6.1 D6.2 G5.2 G5.2" },
  samba: { bpm: 104, bar: 8, wave: "square", bass: "G2 G2 D3 D3 C3 G2 D3 G2", style: "samba",
    mel: "D5.1 E5.1 G5.1 r.1 G5.1 A5.1 B5.2 A5.1 G5.1 E5.1 G5.1 r.2 D5.2 C5.1 D5.1 E5.1 r.1 E5.1 F#5.1 G5.2 F#5.1 E5.1 D5.1 B4.1 D5.4" },
  pastoral: { bpm: 96, bar: 8, wave: "triangle", bass: "F2 F2 C3 F2", style: "pop",        // Beethoven, Pastoral Symphony (1808)
    mel: "C5.2 D5.1 F5.1 E5.2 D5.2 C5.4 r.2 C5.1 D5.1 E5.1 F5.1 G5.2 A5.2 G5.6 r.2" },
  winter: { bpm: 70, bar: 8, wave: "triangle", bass: "Eb3 Bb2 C3 Ab2", style: "pizz",       // after Vivaldi, Winter, Largo (1725)
    mel: "Bb5.3 G5.1 Ab5.2 Bb5.2 C6.3 Bb5.1 Ab5.2 G5.2 F5.3 G5.1 Ab5.2 F5.2 Eb5.8" },
  cancan: { bpm: 176, bar: 8, wave: "square", bass: "C3 C3 G2 C3 C3 C3 G2 C3", style: "pop",   // Offenbach, Galop infernal (1858)
    mel: "C5.2 D5.1 F5.1 E5.1 D5.1 G5.2 G5.2 G5.1 A5.1 E5.1 F5.1 D5.2 D5.2 D5.1 F5.1 E5.1 D5.1 C5.1 C6.1 B5.1 A5.1 G5.1 F5.1 E5.1 D5.1 C5.4" },
  twinkle: { bpm: 110, bar: 8, wave: "sine", bass: "C3 F2 C3 G2 C3 G2 C3 G2", style: "box", // Mozart, Ah vous dirai-je, Maman (1781)
    mel: "C5.2 C5.2 G5.2 G5.2 A5.2 A5.2 G5.4 F5.2 F5.2 E5.2 E5.2 D5.2 D5.2 C5.4" },
  minuet: { bpm: 120, bar: 6, wave: "square", bass: "G2 G2 C3 G2 C3 G2 D3 G2", style: "waltz",  // Petzold/Bach, Minuet in G (1725)
    mel: "D6.2 G5.1 A5.1 B5.1 C6.1 D6.2 G5.2 G5.2 E6.2 C6.1 D6.1 E6.1 F#6.1 G6.2 G5.2 G5.2 C6.2 D6.1 C6.1 B5.1 A5.1 B5.2 C6.1 B5.1 A5.1 G5.1 F#5.2 G5.1 A5.1 B5.1 G5.1 A5.6" },
  opera: { bpm: 132, bar: 6, wave: "sawtooth", bass: "C3 G2 G2 C3", style: "waltz",       // Verdi, La donna è mobile (1851)
    mel: "E5.2 E5.2 E5.2 G5.1 F5.1 D5.4 D5.2 D5.2 D5.2 F5.1 E5.1 C5.4 C5.2 C5.2 C5.2 E5.1 D5.1 B4.2 C5.1 D5.1 C5.4 r.2" },
  win: { bpm: 150, bar: 8, wave: "square", bass: "C3 F2 G2 C3", style: "pop",
    mel: "C5.1 E5.1 G5.1 C6.3 r.2 A5.1 C6.1 F6.3 r.2 B5.1 D6.1 G6.2 F6.1 E6.1 D6.1 C6.6" },
};
for (const t of Object.values(THEMES)) { t.notes = parse(t.mel); t.roots = t.bass.split(" ").map(midi); t.len = t.notes.reduce((s, n) => s + n[1], 0); }

const Audio8 = (() => {
  let ctx, master, mus, sfx, amb, noiseBuf, timer, theme = null, nextT = 0, step = 0, nIdx = 0, nLeft = 0, loops = 0, ambNodes = [], ambTimer;
  let musicOn = store.get("music", true), sfxOn = store.get("sfx", true), duck = 1;
  const f = m => 440 * Math.pow(2, (m - 69) / 12);
  function init() {
    if (ctx) return; const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return; ctx = new AC();
    master = ctx.createGain(); master.gain.value = .9; master.connect(ctx.destination);
    mus = ctx.createGain(); mus.gain.value = 0; mus.connect(master);
    amb = ctx.createGain(); amb.gain.value = musicOn ? .5 : 0; amb.connect(master);
    sfx = ctx.createGain(); sfx.gain.value = sfxOn ? .32 : 0; sfx.connect(master);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    document.addEventListener("visibilitychange", () => ctx && (document.hidden ? ctx.suspend() : ctx.resume()));
  }
  function tone(out, type, fr, t, dur, vol = 1, slide, att = .006) {
    const o = ctx.createOscillator(), g = ctx.createGain(); o.type = type; o.frequency.setValueAtTime(fr, t); if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + att); g.gain.setValueAtTime(vol, t + dur * .55); g.gain.exponentialRampToValueAtTime(.001, t + dur);
    o.connect(g); g.connect(out); o.start(t); o.stop(t + dur + .03);
  }
  function noise(out, t, dur, vol, type = "bandpass", fr = 1800, q = 1) {
    const s = ctx.createBufferSource(); s.buffer = noiseBuf; const fl = ctx.createBiquadFilter(); fl.type = type; fl.frequency.value = fr; fl.Q.value = q;
    const g = ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.001, t + dur); s.connect(fl); fl.connect(g); g.connect(out); s.start(t); s.stop(t + dur + .03);
  }
  const mv = () => musicOn && theme ? .11 * duck : 0;
  function schedule() {
    if (!theme) return; const T = theme, E = 60 / (T.bpm * (T.accel ? 1 + Math.min(.8, loops * .12) : 1)) / 2;
    while (nextT < ctx.currentTime + .15) {
      if (nLeft <= 0) { const [m, d] = T.notes[nIdx]; nLeft = d; if (m) tone(mus, T.wave, f(m), nextT, E * d * .92, T.wave === "sawtooth" ? .32 : .5); nIdx++; if (nIdx >= T.notes.length) { nIdx = 0; loops++; } }
      nLeft--;
      const bar = Math.floor(step / T.bar) % T.roots.length, ib = step % T.bar, root = T.roots[bar];
      switch (T.style) {
        case "waltz": case "waltzslow": if (ib === 0) tone(mus, "triangle", f(root), nextT, E * 1.8, 1); else if (ib % 2 === 0) { tone(mus, "triangle", f(root + 12), nextT, E * .8, .45); tone(mus, "triangle", f(root + 16), nextT, E * .8, .35); } break;
        case "boogie": case "stride": { const walk = [0, 4, 7, 9, 10, 9, 7, 4]; tone(mus, "triangle", f(root + walk[ib % 8]), nextT, E * .9, .9); if (ib % 2 === 1) noise(mus, nextT, .03, .12, "highpass", 7000); if (ib === 0 || ib === 4) tone(mus, "sine", 140, nextT, .12, .9, 50); break; }
        case "swing": if (ib % 2 === 0) tone(mus, "triangle", f(root + [0, 7, 12, 7][(ib / 2) % 4]), nextT, E * 1.6, .8); noise(mus, nextT, .02, .1, "highpass", 8000); break;
        case "march": tone(mus, "triangle", f(ib % 2 ? root + 7 : root), nextT, E * .8, .9); if (ib % 4 === 2) noise(mus, nextT, .09, .35); break;
        case "pad": if (ib === 0) { [0, 7, 12, 16].forEach(k => tone(mus, "sine", f(root + k), nextT, E * T.bar, .25, null, .4)); } break;
        case "arp": tone(mus, "sine", f(root + 12 + [0, 7, 12, 16, 19, 16, 12, 7][ib % 8]), nextT, E * 1.2, .3); if (ib === 0) tone(mus, "triangle", f(root), nextT, E * 8, .7); break;
        case "koto": if (ib % 2 === 0) tone(mus, "triangle", f(root + [0, 12, 7, 12][(ib / 2) % 4]), nextT, E * 1.2, .5, null, .002); break;
        case "box": tone(mus, "sine", f(root + 24 + [0, 4, 7, 12, 7, 4][ib % 6]), nextT, E * 1.4, .18); if (ib === 0) tone(mus, "triangle", f(root), nextT, E * 4, .6); break;
        case "sneak": if (ib % 2 === 0) tone(mus, "triangle", f(root), nextT, E * .6, .9); if (ib % 4 === 2) noise(mus, nextT, .05, .25, "bandpass", 3000); break;
        case "drums": if (ib === 0 || ib === 3 || ib === 6) tone(mus, "sine", 110, nextT, .25, 1.2, 45); if (ib % 2 === 1) tone(mus, "triangle", 330 + rnd(60), nextT, .06, .35); tone(mus, "triangle", f(root), nextT, E * .6, ib % 4 ? .3 : .8); break;
        case "samba": if ([0, 3, 4, 6].includes(ib)) tone(mus, "triangle", f(ib === 3 ? root + 7 : root), nextT, E * .9, .9); noise(mus, nextT, .025, ib % 2 ? .18 : .08, "highpass", 8000); if (ib === 2 || ib === 6) tone(mus, "square", 900, nextT, .03, .15); break;
        case "pizz": if (ib % 2 === 0) tone(mus, "triangle", f(root + [0, 7, 12, 7][(ib / 2) % 4]), nextT, E * .5, .6, null, .002); break;
        default: tone(mus, "triangle", f(ib % 2 ? root + 12 : root), nextT, E * .85, .9); if (ib === 0 || ib === 4) tone(mus, "sine", 150, nextT, .14, 1, 45); if (ib === 2 || ib === 6) noise(mus, nextT, .08, .35); noise(mus, nextT, .02, .1, "highpass", 7000);
      }
      nextT += E; step++;
    }
  }
  /* ---------- ambience ---------- */
  function stopAmb() { clearInterval(ambTimer); ambNodes.forEach(n => { try { n.stop(); } catch (e) { } }); ambNodes = []; }
  function loopNoise(type, fr, vol, lfo) {
    const s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true; const fl = ctx.createBiquadFilter(); fl.type = type; fl.frequency.value = fr;
    const g = ctx.createGain(); g.gain.value = vol; s.connect(fl); fl.connect(g); g.connect(amb); s.start(); ambNodes.push(s);
    if (lfo) { const o = ctx.createOscillator(), og = ctx.createGain(); o.frequency.value = lfo; og.gain.value = vol * .9; o.connect(og); og.connect(g.gain); o.start(); ambNodes.push(o); }
  }
  const AMB = {
    birds() { ambTimer = setInterval(() => { if (Math.random() < .5) { const t = ctx.currentTime, b = 2200 + rnd(1500); for (let k = 0; k < 2 + rnd(4); k++) tone(amb, "sine", b, t + k * .11, .08, .25, b * 1.4); } }, 900); },
    waves() { loopNoise("lowpass", 600, .18, .12); },
    frogs() { ambTimer = setInterval(() => { if (Math.random() < .45) { const t = ctx.currentTime; for (let k = 0; k < 2; k++) tone(amb, "square", 150 + rnd(40), t + k * .16, .1, .18, 110); } }, 1300); },
    thunder() { loopNoise("highpass", 4000, .05, 0); ambTimer = setInterval(() => { if (Math.random() < .12) { const t = ctx.currentTime; noise(amb, t, 2.5, .9, "lowpass", 180); if (UI.flash) UI.flash(); } }, 2000); },
    wind() { loopNoise("bandpass", 500, .16, .08); ambTimer = setInterval(() => { if (Math.random() < .3) tone(amb, "sine", 1760 + rnd(400), ctx.currentTime, .4, .07); }, 1500); },
    crickets() { ambTimer = setInterval(() => { if (Math.random() < .6) { const t = ctx.currentTime; for (let k = 0; k < 3; k++) tone(amb, "sine", 4200, t + k * .05, .03, .12); } }, 700); },
  };
  return {
    get ctx() { return ctx; },
    unlock() { init(); if (ctx && ctx.state === "suspended") ctx.resume(); },
    play(name, ambName) {
      if (!ctx) return; const t = THEMES[name] || null;
      if (t !== theme) { theme = t; nIdx = 0; nLeft = 0; step = 0; loops = 0; nextT = ctx.currentTime + .1; }
      mus.gain.setTargetAtTime(mv(), ctx.currentTime, .15); if (!timer) timer = setInterval(schedule, 40);
      stopAmb(); if (ambName && AMB[ambName]) AMB[ambName]();
    },
    duck(on) { duck = on ? .3 : 1; if (ctx) mus.gain.setTargetAtTime(mv(), ctx.currentTime, .08); },
    get musicOn() { return musicOn; }, get sfxOn() { return sfxOn; },
    toggleMusic() { musicOn = !musicOn; store.set("music", musicOn); if (ctx) { mus.gain.setTargetAtTime(mv(), ctx.currentTime, .05); amb.gain.setTargetAtTime(musicOn ? .5 : 0, ctx.currentTime, .05); } },
    toggleSfx() { sfxOn = !sfxOn; store.set("sfx", sfxOn); if (ctx) sfx.gain.setTargetAtTime(sfxOn ? .32 : 0, ctx.currentTime, .05); if (!sfxOn) Voice.cancel(); },
    fx(name) {
      if (!ctx) return; const t = ctx.currentTime + .01, seq = (ns, gap, type = "square", dur = .12, v = .6) => ns.forEach((m, k) => m && tone(sfx, type, f(m), t + k * gap, dur, v));
      switch (name) {
        case "tap": tone(sfx, "square", 700, t, .05, .35, 1000); break;
        case "dip": tone(sfx, "sine", 420, t, .14, .9, 900); noise(sfx, t, .08, .3, "lowpass", 1200); break;
        case "splash": noise(sfx, t, .35, .9, "bandpass", 900, .7); tone(sfx, "sine", 300, t, .2, .6, 120); break;
        case "brush": noise(sfx, t, .25, .45, "bandpass", 2600, .6); break;
        case "bloop": [0, .12, .24].forEach((d, k) => tone(sfx, "sine", 500 + k * 160, t + d, .12, .8, 900 + k * 200)); noise(sfx, t, .5, .3, "lowpass", 900); break;
        case "swirl": for (let k = 0; k < 10; k++) tone(sfx, "sine", f(64 + (k % 5) * 3), t + k * .07, .12, .35); break;
        case "magic": for (let k = 0; k < 12; k++) tone(sfx, "sine", f(72 + k * 2), t + k * .04, .2, .32); break;
        case "good": seq([72, 76, 79, 84], .07); break;
        case "oops": tone(sfx, "triangle", 500, t, .25, .8, 170); break;
        case "mud": tone(sfx, "sawtooth", 160, t, .4, .35, 90); noise(sfx, t, .3, .5, "lowpass", 400); break;
        case "pop": tone(sfx, "sine", 900, t, .09, .9, 260); break;
        case "unlock": seq([60, 64, 67, 72, 76, 79, 84, 88], .06, "square", .14, .5); break;
        case "applause": for (let k = 0; k < 40; k++) noise(sfx, t + Math.random() * 1.6, .05, .35 + Math.random() * .3, "bandpass", 1500 + rnd(2500)); break;
        case "tada": seq([67, 72, 76, 79, 0, 76, 79, 84], .09, "square", .18); break;
        case "whoosh": noise(sfx, t, .35, .5, "bandpass", 1000); break;
        case "giggle": for (let k = 0; k < 6; k++) tone(sfx, "sine", 700 + rnd(300), t + k * .09, .07, .55, 1100 + rnd(300)); break;
        case "scream": tone(sfx, "sawtooth", 500, t, .9, .25, 1400); break;
      }
    },
  };
})();

/* ============ VOICES: English with each painter's accent, plus Chinese ============ */
const Voice = (() => {
  const S = window.speechSynthesis; let voices = [];
  const load = () => { try { voices = S.getVoices() || []; } catch (e) { } }; if (S) { load(); S.onvoiceschanged = load; }
  const find = l => voices.find(v => v.lang && v.lang.replace("_", "-").toLowerCase() === l.toLowerCase()) || voices.find(v => v.lang && v.lang.toLowerCase().startsWith(l.slice(0, 2)));
  function say(text, lang = "en-US", o = {}) {
    return new Promise(res => {
      if (!S || !Audio8.sfxOn || !text) return res();
      try { const u = new SpeechSynthesisUtterance(text); const v = find(lang) || find("en-US"); u.lang = v ? v.lang : lang; if (v) u.voice = v;
        u.rate = o.rate || (lang.startsWith("zh") ? .75 : .95); u.pitch = o.pitch || 1.1;
        let done = false; const fin = () => { if (!done) { done = true; Audio8.duck(false); res(); } };
        u.onend = fin; u.onerror = fin; Audio8.duck(true); S.speak(u); setTimeout(fin, 2000 + text.length * (lang.startsWith("zh") ? 450 : 95));
      } catch (e) { res(); }
    });
  }
  return { say, en: (t, o) => say(t, "en-US", o), zh: (t, o) => say(t, "zh-CN", o),
    color: async c => { await say(PAINT[c][1], "en-US"); await say(PAINT[c][2], "zh-CN"); },
    cancel() { try { S && S.cancel(); } catch (e) { } Audio8.duck(false); },
    has: l => { load(); return !!voices.find(v => v.lang && v.lang.toLowerCase().startsWith(l.slice(0, 2))); } };
})();
