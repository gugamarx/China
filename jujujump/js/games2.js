"use strict";
/* =================================================================
   6) MAGIC CHARACTERS — a picture turns into its Chinese character,
      then Julia traces it with a rainbow finger; later: which one is "fire"?
   ================================================================= */
addCSS(`.magic{position:relative;z-index:2;display:flex;flex-direction:column;align-items:center;width:100%}
.mbox{position:relative;width:min(78vw,300px);aspect-ratio:1;background:#fff;border-radius:26px;box-shadow:0 8px 0 rgba(40,10,80,.25);overflow:hidden}
.mbox .pic,.mbox .chr{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;transition:all 1.1s cubic-bezier(.5,0,.3,1)}
.mbox .pic{font-size:170px}
.mbox .chr{font-size:210px;color:#c41d6e;opacity:0;transform:scale(.3) rotate(-90deg);font-family:"Noto Sans SC","Noto Sans CJK SC",sans-serif;font-weight:700}
.mbox.morph .pic{opacity:.18;transform:scale(1.3);filter:blur(2px)}
.mbox.morph .chr{opacity:1;transform:none}
.mbox canvas{position:absolute;inset:0;width:100%;height:100%;touch-action:none}
.wand{font-size:60px;margin-top:8px;animation:bob 1s ease-in-out infinite}
.choices{display:flex;gap:12px;margin-top:14px}
.choices button{width:min(26vw,104px);aspect-ratio:1;background:#fff;color:#3b1550;border-radius:22px;font-size:min(14vw,60px);box-shadow:0 6px 0 rgba(40,10,80,.25)}`);
GAMES.push({ id: "magic", name: "Magic Characters", sub: "pictures → 中文", em: "🪄", color: "#8b5cff",
  async run(stage, S) {
    stage.innerHTML = `<div class="magic"><div id="gdots"></div><div class="prompt" id="gp"></div><div class="mbox" id="mb"><div class="pic" id="mpic"></div><div class="chr" id="mchr"></div></div>
      <div id="mact"></div></div>`;
    const ROUNDS = 6; let round = 0;
    const mb = $("#mb");
    async function next() {
      if (!S.live) return; if (round >= ROUNDS) return endGame("magic", 3, "You can read Chinese characters!");
      $("#gdots").innerHTML = dotsHTML(ROUNDS, round); mb.classList.remove("morph"); mb.querySelector("canvas")?.remove(); $("#mchr").style.opacity = "";
      const known = byCat("hanzi").filter(w => SRS.level(w.id) >= 1);
      if (round % 3 === 2 && known.length >= 3) return quiz(known);
      const w = SRS.pick("hanzi", 4)[0]; $("#mpic").textContent = w.e; $("#mchr").textContent = w.zh;
      $("#gp").innerHTML = `This is <b>${w.en}</b>! ${w.e}<br>Tap the magic wand! 🪄`;
      $("#mact").innerHTML = `<button class="wand" id="wand">🪄</button>`;
      Voice.en(`This is the ${w.en.replace(" (character)", "")}. Tap the magic wand!`);
      $("#wand").onclick = async () => { Voice.cancel(); $("#wand").remove(); Snd.play("magic"); mb.classList.add("morph"); const [x, y] = centerOf(mb); FX.burst(x, y, ["✨", "🌟", "💫"], 24);
        await sleep(1200); if (!S.live) return;
        $("#gp").innerHTML = `${w.e} ➜ <span style="font-size:1.6em;color:#ffd23f">${w.zh}</span> ${pyHTML(w.py)} = ${w.en.replace(" (character)", "")}`;
        await Voice.en("Abracadabra!", { pitch: 1.6 }); await Voice.zh(w.zh); if (!S.live) return;
        await Voice.en(`Now draw it with your finger!`); trace(w); };
    }
    function trace(w) {
      const cv = el("canvas"); mb.appendChild(cv); const D = mb.clientWidth, dpr = Math.min(devicePixelRatio || 1, 2); cv.width = D * dpr; cv.height = D * dpr;
      const g = cv.getContext("2d"); g.scale(dpr, dpr);
      // mask of the character to measure coverage
      const m = document.createElement("canvas"); m.width = m.height = 100; const mg = m.getContext("2d");
      mg.font = `bold 72px "Noto Sans SC","Noto Sans CJK SC",sans-serif`; mg.textAlign = "center"; mg.textBaseline = "middle"; mg.fillText(w.zh, 50, 54);
      const md = mg.getImageData(0, 0, 100, 100).data, pts = []; for (let i = 0; i < 10000; i++) if (md[i * 4 + 3] > 128) pts.push(i);
      const hit = new Set(); let hue = 0, drawing = false, lastP = null, done = false;
      $("#mchr").style.opacity = ".35";
      const at = e => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
      cv.onpointerdown = e => { drawing = true; lastP = at(e); cv.setPointerCapture(e.pointerId); };
      cv.onpointermove = e => { if (!drawing || done) return; const p = at(e); g.lineCap = "round"; g.lineWidth = D * .08; g.strokeStyle = `hsl(${hue = (hue + 6) % 360} 90% 60%)`;
        g.beginPath(); g.moveTo(...lastP); g.lineTo(...p); g.stroke(); lastP = p; if (Math.random() < .3) Snd.play("type");
        // mark covered mask pixels around the finger (mask scaled 100 → D; char drawn at 72/100 of mask vs 210/300 of box ≈ same)
        const mx = Math.round(p[0] / D * 100), my = Math.round(p[1] / D * 100);
        for (let dy = -5; dy <= 5; dy++) for (let dx = -5; dx <= 5; dx++) { const q = (my + dy) * 100 + mx + dx; if (q >= 0 && q < 10000 && md[q * 4 + 3] > 128) hit.add(q); }
        if (hit.size > pts.length * .5) finish(); };
      cv.onpointerup = () => drawing = false;
      const finish = async () => { if (done) return; done = true; $("#mchr").style.opacity = "1"; Snd.play("great"); const [x, y] = centerOf(mb); FX.celebrate(x, y); Bamboo.add(2, x, y); SRS.mark(w.id, true);
        await Voice.en(pick(["Beautiful!", "You wrote Chinese!", "Wow! Like a teacher!"])); if (!S.live) return; await Voice.zh(w.zh); await sleep(400); round++; next(); };
      S.t(() => { if (!done) { $("#gp").innerHTML += `<br><button class="bigbtn" id="mdone" style="font-size:18px;padding:8px 14px">✅ Done!</button>`; $("#mdone").onclick = finish; } }, 12000);
    }
    async function quiz(known) {
      const w = pick(known), opts = shuffle([w, ...shuffle(byCat("hanzi").filter(x => x !== w)).slice(0, 2)]);
      $("#mpic").textContent = "❓"; $("#mchr").textContent = ""; mb.classList.remove("morph");
      $("#gp").innerHTML = `Which one is <b>${w.en}</b>? ${w.e}`;
      $("#mact").innerHTML = `<div class="choices">${opts.map((o, i) => `<button data-i="${i}">${o.zh}</button>`).join("")}</div>`;
      Voice.en(`Which one is ${w.en.replace(" (character)", "")}?`);
      $$("#mact button").forEach(b => b.onclick = async () => { const o = opts[+b.dataset.i];
        if (o === w) { SRS.mark(w.id, true); $("#mpic").textContent = w.e; $("#mchr").textContent = w.zh; mb.classList.add("morph"); await praise(...centerOf(b)); Bamboo.add(1, ...centerOf(b)); await Voice.zh(w.zh); round++; next(); }
        else { SRS.mark(w.id, false); oops(b); Voice.en(`That one is ${o.en.replace(" (character)", "")}! ${o.e}`); b.textContent = o.e; } });
    }
    S.t(next, 200);
  } });

/* =================================================================
   7) TONE COASTER — the 4 Mandarin tones are 4 roller-coaster tracks
   ================================================================= */
addCSS(`.tones{position:relative;z-index:2;width:100%;display:flex;flex-direction:column;align-items:center}
.tracks{display:grid;grid-template-columns:1fr 1fr;gap:10px;width:min(94vw,440px)}
.track{position:relative;background:rgba(255,255,255,.95);border-radius:20px;aspect-ratio:1.3;box-shadow:0 6px 0 rgba(40,10,80,.25);overflow:hidden}
.track svg{position:absolute;inset:0;width:100%;height:100%}
.track .lbl{position:absolute;left:8px;top:4px;font-size:22px;font-weight:800}
.track .car{position:absolute;font-size:34px;left:0;top:0;transform:translate(-50%,-80%);pointer-events:none}
.syl{font-size:48px;line-height:1;margin:6px 0;text-shadow:0 3px 0 rgba(40,10,80,.4)}`);
const TONESETS = [
  [["妈", "mā", "mom", "👩"], ["麻", "má", "sesame", "🌿"], ["马", "mǎ", "horse", "🐴"], ["骂", "mà", "scold", "😠"]],
  [["八", "bā", "eight", "8️⃣"], ["拔", "bá", "pull", "💪"], ["把", "bǎ", "hold", "✋"], ["爸", "bà", "dad", "👨"]],
  [["一", "yī", "one", "1️⃣"], ["姨", "yí", "auntie", "👩‍🦰"], ["椅", "yǐ", "chair", "🪑"], ["意", "yì", "idea", "💡"]],
  [["屋", "wū", "house", "🏠"], ["无", "wú", "nothing", "🫥"], ["五", "wǔ", "five", "5️⃣"], ["雾", "wù", "fog", "🌫️"]],
];
const TPATH = ["M10 30 L190 30", "M10 120 C80 115 140 60 190 18", "M10 40 C60 130 130 135 190 30", "M10 18 C80 30 130 80 190 130"];
const TCOL = ["#ff3b3b", "#ff9a1f", "#21b35a", "#2f7dff"];
GAMES.push({ id: "tones", name: "Tone Coaster", sub: "ride the 4 tones!", em: "🎢", color: "#ffb02e",
  async run(stage, S) {
    stage.innerHTML = `<div class="tones"><div id="tdots"></div><div class="prompt" id="tp"></div><div class="syl" id="tsyl"></div><div class="tracks" id="tracks"></div>
      <button class="ibtn" id="trep" style="margin-top:10px;background:#fff;color:#000;font-size:26px;width:70px">🔊</button></div>`;
    const QUIZ = 6; let phase = "learn", round = 0, set = pick(TONESETS), target = null, learned = new Set(), lock = false;
    $("#tracks").innerHTML = [0, 1, 2, 3].map(i => `<button class="track" data-i="${i}"><svg viewBox="0 0 200 150"><path d="${TPATH[i]}" stroke="${TCOL[i]}" stroke-width="12" fill="none" stroke-linecap="round" stroke-dasharray="2 18"/><path id="tp${i}" d="${TPATH[i]}" stroke="${TCOL[i]}" stroke-width="5" fill="none" stroke-linecap="round"/></svg><span class="lbl" style="color:${TCOL[i]}">${i + 1}</span><span class="car">🛒</span></button>`).join("");
    const ride = async i => { const path = $("#tp" + i), car = $$(".track .car")[i], box = path.ownerSVGElement.getBoundingClientRect(), L = path.getTotalLength(), t0 = performance.now(), dur = 900;
      Snd.play(["note", "slide", "boing", "slideDown"][i], 79);
      await new Promise(res => { const f = ts => { const k = Math.min(1, (ts - t0) / dur), p = path.getPointAtLength(k * L);
        car.style.left = (p.x / 200 * box.width) + "px"; car.style.top = (p.y / 150 * box.height) + "px"; k < 1 ? requestAnimationFrame(f) : res(); }; requestAnimationFrame(f); }); };
    const sayT = i => Voice.zh(set[i][0], { rate: .6 });
    async function learnIntro() {
      $("#tp").innerHTML = "Tap each coaster to hear the <b>4 tones</b>! 🎢"; $("#tsyl").innerHTML = "";
      await Voice.en("Chinese has four tones, like four roller coasters! Tap each one!");
    }
    $("#trep").onclick = () => { if (target != null) sayT(target); };
    $$("#tracks .track").forEach(b => b.onclick = async () => {
      if (lock) return; const i = +b.dataset.i; lock = true;
      if (phase === "learn") { const [c, py, en, e] = set[i]; $("#tsyl").innerHTML = `${e} <span class="t${i + 1}">${py}</span> ${c}`; sayT(i); await ride(i); learned.add(i);
        Voice.en(en); if (learned.size === 4) { await sleep(900); phase = "quiz"; lock = false; return quiz(); } lock = false; return; }
      sayT(i); await ride(i);
      if (i === target) { await praise(...centerOf(b)); Bamboo.add(1, ...centerOf(b)); round++; lock = false; quiz(); }
      else { oops(b); await Voice.en(`That was tone ${i + 1}. Listen again!`); await sleep(200); sayT(target); lock = false; }
    });
    async function quiz() {
      if (!S.live) return; if (round >= QUIZ) return endGame("tones", 3, "You can hear Chinese tones!");
      if (round === 3) set = pick(TONESETS.filter(s => s !== set));
      $("#tdots").innerHTML = dotsHTML(QUIZ, round); target = rnd(4);
      $("#tp").innerHTML = "Listen! Which coaster? 👂"; $("#tsyl").innerHTML = `${set[target][3]} ❓`;
      await Voice.en("Listen! Which coaster?"); await sleep(250); if (S.live) sayT(target);
    }
    S.t(learnIntro, 200);
  } });

/* =================================================================
   8) WORD BUILDER — spell CAT under the cat
   ================================================================= */
addCSS(`.wb{position:relative;z-index:2;display:flex;flex-direction:column;align-items:center;width:100%}
.wbpic{font-size:110px;line-height:1.1;margin:4px 0;animation:bob 2s ease-in-out infinite}
.slots{display:flex;gap:8px;margin:10px 0}
.slot{width:min(18vw,70px);height:min(20vw,80px);border-radius:16px;background:rgba(255,255,255,.25);border:4px dashed rgba(255,255,255,.8);display:flex;align-items:center;justify-content:center;font-family:Arcade;font-size:min(8vw,32px);color:rgba(255,255,255,.35)}
.slot.full{background:#fff;color:#6b4cff;border-style:solid;animation:jel .4s}
.tiles{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;max-width:380px;margin-top:10px}
.tile{width:min(17vw,66px);height:min(17vw,66px);border-radius:16px;background:#ffd23f;color:#5a3a00;font-family:Arcade;font-size:min(7vw,28px);box-shadow:0 6px 0 #d99a00}
.tile:active{transform:translateY(4px);box-shadow:0 2px 0 #d99a00}
.tile.used{visibility:hidden}`);
const SPELL3 = [["CAT", "animal:cat"], ["DOG", "animal:dog"], ["PIG", "animal:pig"], ["COW", "animal:cow"], ["BEE", "animal:bee"], ["EGG", "food:egg"],
  ["SUN", "hanzi:sun"], ["RED", "color:red"], ["FOX", null, "🦊", "狐狸", "hú li"], ["BUS", null, "🚌", "公共汽车", "gōng gòng qì chē"], ["HAT", null, "🎩", "帽子", "mào zi"], ["CUP", null, "🥤", "杯子", "bēi zi"], ["BED", null, "🛏️", "床", "chuáng"], ["OWL", null, "🦉", "猫头鹰", "māo tóu yīng"]];
const SPELL4 = [["FISH", "animal:fish"], ["FROG", "animal:frog"], ["DUCK", "animal:duck"], ["BEAR", "animal:bear"], ["CAKE", "food:cake"], ["MILK", "food:milk"], ["MOON", "hanzi:moon"], ["LION", "animal:lion"], ["TREE", "hanzi:tree"], ["PINK", "color:pink"]];
GAMES.push({ id: "spell", name: "Word Builder", sub: "C-A-T = cat!", em: "🔤", color: "#ffd23f",
  async run(stage, S) {
    stage.innerHTML = `<div class="wb"><div id="wdots"></div><div class="wbpic" id="wpic"></div><div class="prompt" id="wp" style="min-height:1.3em"></div><div class="slots" id="slots"></div><div class="tiles" id="tiles"></div></div>`;
    const ROUNDS = 6, lvl = store.get("spellWins", 0); let round = 0, word = "", k = 0, info = null;
    async function next() {
      if (!S.live) return; if (round >= ROUNDS) { store.set("spellWins", lvl + 1); return endGame("spell", 3, "You can spell in English!"); }
      $("#wdots").innerHTML = dotsHTML(ROUNDS, round);
      const list = lvl >= 2 && round >= 3 ? SPELL4 : SPELL3, it = pick(list); word = it[0]; k = 0;
      info = it[1] ? WBY[it[1]] : { e: it[2], en: word.toLowerCase(), zh: it[3], py: it[4] };
      $("#wpic").textContent = info.e; $("#wp").innerHTML = "";
      $("#slots").innerHTML = [...word].map(c => `<div class="slot">${lvl < 3 ? c : ""}</div>`).join("");
      const extra = shuffle("ABCDEFGHIKLMNOPRSTUW".split("").filter(c => !word.includes(c))).slice(0, 2);
      $("#tiles").innerHTML = shuffle([...word, ...extra]).map(c => `<button class="tile">${c}</button>`).join("");
      $$("#tiles .tile").forEach(t => t.onclick = () => tap(t));
      await Voice.en(`Let's spell ${info.en}!`);
    }
    async function tap(t) {
      const c = t.textContent;
      if (c === word[k]) { t.classList.add("used"); const s = $$("#slots .slot")[k]; s.textContent = c; s.classList.add("full"); Snd.play("pop"); Voice.en(c.toLowerCase() === "a" ? "ay" : c);
        k++; if (k === word.length) { await sleep(500); const [x, y] = centerOf($("#slots")); FX.celebrate(x, y); Snd.play("great"); Bamboo.add(1, x, y); if (it2()) SRS.mark(info.id, true);
          $("#wp").innerHTML = `${info.en} · ${info.zh} ${pyHTML(info.py)}`;
          await Voice.en([...word].join(", ") + `... ${info.en}!`, { rate: .85 }); if (!S.live) return; await Voice.zh(info.zh); await sleep(400); round++; next(); } }
      else { oops(t); Snd.play("boing"); Voice.en(`That's ${c}! We need ${word[k]}!`); }
    }
    const it2 = () => !!info.id;
    S.t(next, 200);
  } });

/* =================================================================
   9) PANDA DRUMS — tap N times (counting in EN/ZH) and "copy me" rhythm memory
   ================================================================= */
addCSS(`.drums{position:relative;z-index:2;display:flex;flex-direction:column;align-items:center;width:100%}
.dset{display:flex;gap:10px;flex-wrap:wrap;justify-content:center;margin-top:10px}
.drum{width:min(28vw,120px);aspect-ratio:1;border-radius:50%;border:8px solid #fff;box-shadow:0 10px 0 rgba(40,10,80,.3),inset 0 -14px 0 rgba(0,0,0,.15);font-size:44px}
.drum.hit{animation:dhit .18s}
@keyframes dhit{50%{transform:scale(.9) translateY(6px);filter:brightness(1.3)}}
.drums .panda{width:130px;height:130px}
.bignum{font-family:Arcade;font-size:56px;color:#ffd23f;text-shadow:4px 4px 0 #4127c4;min-height:64px}`);
GAMES.push({ id: "drums", name: "Panda Drums", sub: "count & copy!", em: "🥁", color: "#ff5f5f",
  async run(stage, S) {
    stage.innerHTML = `<div class="drums"><div id="ddots"></div><div id="dpanda">${pandaSVG("🎩")}</div><div class="prompt" id="dp"></div><div class="bignum" id="dnum"></div>
      <div class="dset" id="dset"></div></div>`;
    const DR = [["#ff4fa0", 140, "🌸"], ["#46b4ff", 200, "⭐"], ["#2fd6a3", 260, "🐸"]], NUM = byCat("number");
    $("#dset").innerHTML = DR.map((d, i) => `<button class="drum" data-i="${i}" style="background:${d[0]}">${d[2]}</button>`).join("");
    const ROUNDS = 6; let round = 0, mode = "", want = 0, taps = 0, seq = [], pos = 0, lock = true, tapT = 0;
    const hit = i => { const d = $$(".drum")[i]; d.classList.remove("hit"); void d.offsetWidth; d.classList.add("hit"); Snd.play("drum", DR[i][1]); };
    const pd = () => $("#dpanda .panda");
    async function next() {
      if (!S.live) return; if (round >= ROUNDS) return endGame("drums", 3, "You are a super drummer!");
      $("#ddots").innerHTML = dotsHTML(ROUNDS, round); $("#dnum").textContent = ""; taps = 0; pos = 0;
      mode = round % 2 === 0 ? "count" : "copy"; lock = true;
      if (mode === "count") { want = 2 + rnd(Math.min(8, 3 + round)); const N = NUM[want - 1];
        $("#dp").innerHTML = `Hit the drums <b>${want}</b> times! ${N.zh} ${pyHTML(N.py)}`; $("#dnum").textContent = want;
        lock = false; pd().classList.add("talk"); await Voice.en(`Hit the drums ${N.en} times!`); await Voice.zh(N.zh); pd() && pd().classList.remove("talk"); }
      else { const len = Math.min(6, 2 + Math.floor(round / 2)); seq = [...Array(len)].map(() => rnd(3));
        $("#dp").innerHTML = "Copy me! 👀"; await Voice.en("Watch and copy me!"); await sleep(300);
        pd().classList.add("wave"); for (const i of seq) { if (!S.live) return; hit(i); await sleep(520); } pd() && pd().classList.remove("wave");
        $("#dp").innerHTML = "Your turn! 🥁"; lock = false; }
    }
    $$(".drum").forEach(d => d.onpointerdown = async () => {
      const i = +d.dataset.i; hit(i); if (lock) return;
      if (mode === "count") { taps++; const N = NUM[Math.min(9, taps - 1)]; $("#dnum").textContent = taps; (taps % 2 ? Voice.en(N.en) : Voice.zh(N.zh));
        clearTimeout(tapT); tapT = S.t(async () => { lock = true;
          if (taps === want) { SRS.mark(NUM[want - 1].id, true); await praise(...centerOf(d)); Bamboo.add(1, ...centerOf(d)); round++; next(); }
          else { SRS.mark(NUM[want - 1].id, false); Snd.play("oops"); await Voice.en(`That was ${NUM[Math.min(9, taps - 1)].en}! Let's try ${NUM[want - 1].en} again!`); taps = 0; $("#dnum").textContent = want; lock = false; } }, 1300); }
      else { if (i === seq[pos]) { pos++; if (pos === seq.length) { lock = true; await sleep(300); await praise(...centerOf(d)); Bamboo.add(1, ...centerOf(d)); round++; next(); } }
        else { lock = true; Snd.play("oops"); await Voice.en("Oopsie! Watch again!"); pos = 0; for (const j of seq) { if (!S.live) return; hit(j); await sleep(520); } lock = false; } }
    });
    S.t(next, 300);
    return () => clearTimeout(tapT);
  } });

/* =================================================================
   10) SILLY PARROT — Julia speaks, the parrot repeats in funny voices
   ================================================================= */
addCSS(`.parrot{position:relative;z-index:2;display:flex;flex-direction:column;align-items:center;width:100%}
.bird{font-size:130px;line-height:1;transition:transform .1s;filter:drop-shadow(0 8px 0 rgba(40,10,80,.25))}
.mic{width:120px;height:120px;border-radius:50%;background:#ff4fa0;font-size:56px;box-shadow:0 8px 0 #c41d6e;margin-top:10px}
.mic.rec{animation:recp .6s infinite;background:#ff3b3b}
@keyframes recp{50%{box-shadow:0 0 0 18px rgba(255,59,59,.35),0 8px 0 #c41d6e}}
.voices{display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;justify-content:center}
.voices button{font-size:34px;width:74px;height:74px;border-radius:20px;background:#fff;box-shadow:0 5px 0 rgba(40,10,80,.25)}
.voices small{display:block;font-size:11px;color:#3b1550}`);
const PARROT_WORDS = () => [...SRS.pick("talk", 3), ...SRS.pick("animal", 2), ...SRS.pick("food", 2)];
GAMES.push({ id: "parrot", name: "Silly Parrot", sub: "say it, hear it silly!", em: "🦜", color: "#2fd6a3",
  async run(stage, S) {
    stage.innerHTML = `<div class="parrot"><div class="bird" id="bird">🦜</div><div class="prompt" id="pp"></div><div id="pcard"></div>
      <button class="mic" id="mic">🎤</button><div class="voices" id="voices"></div></div>`;
    let words = PARROT_WORDS(), idx = 0, buf = null, count = 0, step = "en";
    const bird = $("#bird");
    async function prompt() {
      if (!S.live) return; const w = words[idx % words.length];
      $("#pcard").innerHTML = UI.card(w); $("#voices").innerHTML = "";
      if (step === "en") { $("#pp").innerHTML = `Say: <b>${w.en}</b>!`; await Voice.en(`Squawk! Say: ${w.en}!`, { pitch: 1.7 }); }
      else { $("#pp").innerHTML = `Now in Chinese: <b>${w.zh}</b> ${pyHTML(w.py)}`; await Voice.en("Now in Chinese!", { pitch: 1.7 }); await Voice.zh(w.zh); }
    }
    if (!Recorder.ok) { $("#mic").style.display = "none"; $("#pp").innerHTML = "Say the words out loud! 🗣️<br>Tap the parrot for the next word."; bird.onclick = () => { idx++; prompt(); }; S.t(prompt, 200); return; }
    $("#mic").onclick = async () => {
      if ($("#mic").classList.contains("rec")) return;
      try {
        $("#mic").classList.add("rec"); $("#pp").innerHTML = "I'm listening... 👂"; Snd.play("tick");
        buf = await Recorder.record(2600, lv => { bird.style.transform = `scale(${1 + lv * .5})`; });
      } catch (e) { $("#mic").classList.remove("rec"); $("#pp").innerHTML = "Ask a grown-up to allow the microphone 🎤"; Voice.en("Please allow the microphone!"); return; }
      $("#mic").classList.remove("rec"); bird.style.transform = ""; if (!S.live) return;
      const w = words[idx % words.length]; SRS.mark(w.id, true); count++;
      bird.classList.add("jelly"); await Recorder.play(buf, "chip"); bird.classList.remove("jelly");
      Snd.play("giggle"); Bamboo.add(1, ...centerOf(bird));
      $("#pp").innerHTML = "Ha ha! Try a silly voice! 👇";
      $("#voices").innerHTML = [["🐿️", "chip", "tiny"], ["🐻", "giant", "giant"], ["🔁", "back", "backwards"], ["🤖", "robot", "robot"], ["➡️", "next", "next"]].map(([e, m, l]) => `<button data-m="${m}">${e}<small>${l}</small></button>`).join("");
      $$("#voices button").forEach(b => b.onclick = async () => { const m = b.dataset.m;
        if (m === "next") { if (step === "en") step = "zh"; else { step = "en"; idx++; } if (count >= 8) return endGame("parrot", 3, "The parrot loves your voice!"); return prompt(); }
        bird.classList.add("jelly"); await Recorder.play(buf, m); bird.classList.remove("jelly"); Snd.play("giggle"); });
    };
    S.t(prompt, 200);
  } });

/* =================================================================
   11) JUJU'S DAY — a talking picture book starring Julia
   ================================================================= */
addCSS(`.story{position:relative;z-index:2;display:flex;flex-direction:column;align-items:center;width:100%;height:100%}
.spage{position:relative;width:min(92vw,420px);flex:1;max-height:56vh;border-radius:24px;overflow:hidden;border:6px solid #fff;box-shadow:0 10px 0 rgba(40,10,80,.25);margin-top:4px}
.spage img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .3s}
.stext{font-size:min(6vw,24px);text-align:center;padding:6px 10px 0;line-height:1.2;min-height:2.6em}
.stext .w{color:#ffd23f;text-decoration:underline dotted}
.szh{font-size:20px;text-align:center}
.snav{display:flex;gap:14px;margin:6px 0}
.sact{position:absolute;left:0;right:0;bottom:8px;display:flex;justify-content:center;gap:10px}
.sact button{font-size:40px;background:rgba(255,255,255,.9);border-radius:20px;width:76px;height:76px;box-shadow:0 5px 0 rgba(40,10,80,.25)}
.shake{animation:shk .5s 2}
@keyframes shk{25%{transform:translateX(-10px) rotate(-2deg)}75%{transform:translateX(10px) rotate(2deg)}}
.dance img{animation:dnc .5s ease-in-out infinite alternate}
@keyframes dnc{from{transform:rotate(-6deg) scale(1.02)}to{transform:rotate(6deg) scale(1.08)}}`);
const STORY = [
  { p: 8, t: "Good morning, Juju! Wake up!", zh: ["早上好", "zǎo shang hǎo"], act: "wake", ask: "Did you sleep well?" },
  { p: 1, t: "Juju wears a <span class='w'>pink</span> coat.", zh: ["粉红色", "fěn hóng sè"], act: "color", ask: "What color do YOU like?" },
  { p: 9, t: "Juju goes to <span class='w'>school</span> with her backpack.", zh: ["学校", "xué xiào"], act: "pick:🎒", ask: "What do you like at school?" },
  { p: 16, t: "Juju drinks <span class='w'>water</span>. Gulp gulp!", zh: ["水", "shuǐ"], act: "gulp", ask: "Do you drink water too?" },
  { p: 3, t: "Juju plays with her <span class='w'>doll</span>.", zh: ["娃娃", "wá wa"], act: "hug", ask: "What is your doll's name?" },
  { p: 10, t: "Juju loves to <span class='w'>dance</span>! Dance with her!", zh: ["跳舞", "tiào wǔ"], act: "dance", ask: "Can you dance like Juju?" },
  { p: 11, t: "Juju makes a <span class='w'>silly</span> face!", zh: ["好玩", "hǎo wán"], act: "silly", ask: "Make a silly face! 3, 2, 1!" },
  { p: 7, t: "Oh no! Juju is <span class='w'>grumpy</span>! Tickle her!", zh: ["生气", "shēng qì"], act: "tickle", ask: "" },
  { p: 6, t: "Juju goes to a <span class='w'>party</span>!", zh: ["派对", "pài duì"], act: "party", ask: "What do you eat at a party?" },
  { p: 14, t: "Juju <span class='w'>swims</span> in the pool. Splash!", zh: ["游泳", "yóu yǒng"], act: "splash", ask: "Do you like to swim?" },
  { p: 5, t: "Juju watches <span class='w'>football</span> and eats a snack.", zh: ["足球", "zú qiú"], act: "goal", ask: "Who is your favorite team?" },
  { p: 12, t: "Good night, Juju. I love you!", zh: ["晚安", "wǎn ān"], act: "night", ask: "" },
];
GAMES.push({ id: "story", name: "Juju's Day", sub: "a story about YOU!", em: "📖", color: "#ff8a3d",
  async run(stage, S) {
    stage.innerHTML = `<div class="story"><div id="sdots2"></div><div class="spage" id="spage"><img id="simg" alt=""><div class="sact" id="sact"></div></div>
      <div class="stext" id="stext"></div><div class="szh" id="szh"></div>
      <div class="snav"><button class="ibtn" id="sprev" style="font-size:28px">⬅️</button><button class="ibtn" id="sread" style="font-size:28px">🔊</button><button class="ibtn" id="snext" style="font-size:28px">➡️</button></div></div>`;
    let pg = 0, tickles = 0;
    const img = $("#simg"), page = $("#spage");
    async function read() { const s = STORY[pg]; const plain = s.t.replace(/<[^>]+>/g, "");
      await Voice.en(plain); if (!S.live) return; await sleep(150); await Voice.zh(s.zh[0]); if (!S.live) return;
      if (s.ask) { await sleep(400); await Voice.en(s.ask); } }
    function show() {
      const s = STORY[pg]; Music.page(s.act);
      $("#sdots2").innerHTML = dotsHTML(STORY.length, pg + 1); page.className = "spage"; img.style.transform = ""; img.src = P(s.p).full; tickles = 0;
      $("#stext").innerHTML = s.t; $("#szh").innerHTML = `${s.zh[0]} ${pyHTML(s.zh[1])}`;
      const A = $("#sact"); A.innerHTML = "";
      const btn = (e, f) => { const b = el("button", "", e); b.onclick = f; A.appendChild(b); return b; };
      switch (s.act) {
        case "wake": btn("⏰", () => { Snd.play("alarm"); page.classList.add("shake"); setTimeout(() => page.classList.remove("shake"), 1000); Voice.en("Wake up, sleepy head!"); }); break;
        case "color": ["#ff7ac2", "#2f7dff", "#2bc46b"].forEach((c, i) => { const b = btn("", async () => { if (i === 0) { await praise(...centerOf(b)); Voice.zh("粉红色"); } else { oops(b); Voice.en("Hmm, look at the coat!"); } }); b.style.background = c; }); break;
        case "pick:🎒": ["🎒", "🚲", "🍕"].forEach(e => btn(e, async ev => { if (e === "🎒") { praise(ev.clientX, ev.clientY); } else { Snd.play("giggle"); Voice.en(e === "🚲" ? "A bike? No! A backpack!" : "Pizza at school? Ha ha!"); } })); break;
        case "gulp": btn("💧", () => { Snd.play("gulp"); FX.burst(innerWidth / 2, innerHeight * .4, ["💧", "💦"], 14); }); break;
        case "hug": btn("🤗", () => { Snd.play("giggle"); FX.burst(innerWidth / 2, innerHeight * .4, ["💖", "🪆"], 14); Voice.en("Big hug!"); }); break;
        case "dance": btn("💃", () => { page.classList.toggle("dance"); if (page.classList.contains("dance")) { Snd.music("dance"); Voice.en("Dance, dance, dance! Everybody dance!"); } else Snd.music("game"); }); break;
        case "silly": btn("🤪", async () => { for (const n of ["3", "2", "1"]) { UI.float(innerWidth / 2, innerHeight * .45, n); Snd.play("tick"); await sleep(700); } Snd.play("honk"); Snd.play("giggle"); FX.rain(["🤪", "😜", "😝"]); Voice.en("Ha ha ha! So silly!"); }); break;
        case "tickle": page.onclick = () => { tickles++; Snd.play("giggle"); img.classList.remove("wobble"); void img.offsetWidth; img.classList.add("wobble");
            if (tickles === 5) { img.src = P(4).full; FX.celebrate(); Voice.en("Hee hee hee! Juju is happy now!").then(() => Voice.zh("开心")); $("#stext").innerHTML = "Hee hee! Now Juju is <span class='w'>happy</span>!"; $("#szh").innerHTML = `开心 ${pyHTML("kāi xīn")}`; } };
          A.innerHTML = `<div style="font-size:40px;animation:bob 1s infinite">👆👆👆</div>`; break;
        case "party": btn("🎉", e => { Snd.play("pop"); FX.confetti(); }); btn("🎈", e => { Snd.play("pop"); FX.burst(e.clientX, e.clientY, ["🎈", "🎊"], 14); }); break;
        case "splash": btn("🌊", () => { Snd.play("splash"); FX.rain(["💦", "💧", "🫧"]); }); break;
        case "goal": btn("⚽", async e => { Snd.play("whoosh"); await sleep(300); Snd.play("great"); FX.fireworks(); Voice.en("Goooooal!"); }); break;
        case "night": btn("🌙", () => { FX.rain(["⭐", "🌙", "✨"]); Voice.en("Sweet dreams.", { rate: .7, pitch: 1 }); }); break;
      }
      read();
    }
    const Music = { page(act) { Snd.music(act === "night" ? "lull" : act === "dance" ? "game" : "game"); } };
    $("#sread").onclick = () => read();
    $("#sprev").onclick = () => { if (pg > 0) { pg--; Snd.play("whoosh"); show(); } };
    $("#snext").onclick = () => { Snd.play("whoosh"); if (pg < STORY.length - 1) { pg++; show(); } else endGame("story", 3, "The end! What a fun day!"); };
    S.t(show, 200);
    return () => Snd.music("game");
  } });
