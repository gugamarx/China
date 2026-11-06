"use strict";
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const rnd = n => Math.floor(Math.random() * n), pick = a => a[rnd(a.length)];
const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const el = (t, c, h) => { const e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; };
const PFX = "paint_" + (window.KID_ID || "julia") + "_";
const store = {
  get(k, d) { try { const v = localStorage.getItem(PFX + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(PFX + k, JSON.stringify(v)); return true; } catch (e) { return false; } },
  clear() { try { Object.keys(localStorage).filter(k => k.startsWith(PFX) && !/_(music|sfx)$/.test(k)).forEach(k => localStorage.removeItem(k)); } catch (e) { } },
};
const TONEC = { 1: "#ff3b3b", 2: "#ff9a1f", 3: "#21b35a", 4: "#2f7dff" };
function toneOf(s) { const T = { 1: "āēīōūǖ", 2: "áéíóúǘ", 3: "ǎěǐǒǔǚ", 4: "àèìòùǜ" }; for (const k in T) if ([...s].some(c => T[k].includes(c))) return k; return 5; }
const pyHTML = py => py.split(" ").map(s => `<span style="color:${TONEC[toneOf(s)] || "#888"}">${s}</span>`).join(" ");
const hex2rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));

/* ---------- cartoon painter (used until a generated portrait exists) ---------- */
function cartoonSVG(lk = {}, she) {
  const skin = lk.skin || "#f6d2b3", hc = lk.hairc || "#3a2412", coat = lk.coat || "#2560d9", bc = lk.beardc || (lk.beard === "grey" ? "#a9a9a9" : lk.beard === "white" || lk.beard === "long" ? "#f2f2f2" : hc);
  const hair = { bald: `<path d="M48 60 q-6 -30 10 -36" stroke="${hc}" stroke-width="6" fill="none"/><path d="M152 60 q6 -30 -10 -36" stroke="${hc}" stroke-width="6" fill="none"/>`,
    short: `<path d="M44 66 Q40 18 100 16 Q160 18 156 66 Q150 40 100 38 Q50 40 44 66Z" fill="${hc}"/>`,
    bun: `<circle cx="100" cy="12" r="18" fill="${hc}"/><path d="M42 74 Q38 16 100 16 Q162 16 158 74 Q150 38 100 36 Q50 38 42 74Z" fill="${hc}"/>`,
    long: `<path d="M38 140 Q30 16 100 14 Q170 16 162 140 L148 140 Q150 50 100 40 Q50 50 52 140Z" fill="${hc}"/>`,
    curly: [40, 60, 80, 100, 120, 140, 160].map((x, i) => `<circle cx="${x}" cy="${30 + (i % 2) * 8}" r="18" fill="${hc}"/>`).join("") + `<circle cx="36" cy="64" r="15" fill="${hc}"/><circle cx="164" cy="64" r="15" fill="${hc}"/>` }[lk.hair || "short"];
  const beard = { full: `<path d="M50 92 Q52 150 100 154 Q148 150 150 92 Q140 118 100 120 Q60 118 50 92Z" fill="${bc}"/>`,
    grey: `<path d="M48 90 Q50 158 100 162 Q150 158 152 90 Q140 120 100 122 Q60 120 48 90Z" fill="${bc}"/>`,
    white: `<path d="M48 90 Q50 160 100 166 Q150 160 152 90 Q140 120 100 122 Q60 120 48 90Z" fill="${bc}"/>`,
    long: `<path d="M50 92 Q50 190 100 200 Q150 190 150 92 Q140 120 100 122 Q60 120 50 92Z" fill="${bc}"/>`,
    goatee: `<path d="M84 122 Q100 160 116 122Z" fill="${bc}"/>` }[lk.beard] || "";
  const hat = { cap: `<path d="M50 44 Q100 0 150 44Z" fill="#222"/>`, straw: `<ellipse cx="100" cy="34" rx="78" ry="16" fill="#e9c46a"/><path d="M60 34 Q64 0 100 0 Q136 0 140 34Z" fill="#e9c46a"/><rect x="62" y="24" width="76" height="8" fill="#c0392b"/>`,
    beret: `<ellipse cx="96" cy="24" rx="58" ry="20" fill="#8f1d22"/><circle cx="96" cy="6" r="5" fill="#8f1d22"/>`, top: `<rect x="62" y="-30" width="76" height="56" rx="6" fill="#222"/><ellipse cx="100" cy="26" rx="62" ry="10" fill="#222"/><rect x="62" y="12" width="76" height="8" fill="#8f1d22"/>`,
    bonnet: `<path d="M36 80 Q30 6 100 4 Q170 6 164 80 Q150 30 100 28 Q50 30 36 80Z" fill="#fff" stroke="#ddd" stroke-width="3"/>`,
    flowerhat: `<ellipse cx="100" cy="26" rx="74" ry="16" fill="#f5e6a8"/><path d="M62 26 Q66 -6 100 -6 Q134 -6 138 26Z" fill="#f5e6a8"/><text x="70" y="22" font-size="24">🌸</text><text x="104" y="16" font-size="22">🌼</text>` }[lk.hat] || "";
  return `<svg viewBox="-10 -40 220 300" class="cartoon">
   <rect x="86" y="130" width="28" height="30" fill="${skin}"/><path d="M36 260 Q36 150 100 142 Q164 150 164 260Z" fill="${coat}" stroke="#2a1a2a" stroke-width="5"/>
   ${lk.collar ? `<ellipse cx="100" cy="150" rx="66" ry="18" fill="#fff" stroke="#ccc" stroke-width="3"/>` : ""}${lk.scarf ? `<path d="M64 146 Q100 166 136 146 L132 162 Q100 178 68 162Z" fill="${lk.scarf}"/>` : ""}
   ${lk.hair === "long" ? hair : ""}
   <circle cx="100" cy="86" r="58" fill="${skin}" stroke="#2a1a2a" stroke-width="5"/>
   <circle cx="42" cy="92" r="12" fill="${skin}" stroke="#2a1a2a" stroke-width="4"/><circle cx="158" cy="92" r="12" fill="${skin}" stroke="#2a1a2a" stroke-width="4"/>
   ${lk.earrings ? `<circle cx="42" cy="110" r="6" fill="#ffd23f"/><circle cx="158" cy="110" r="6" fill="#ffd23f"/>` : ""}
   ${lk.hair !== "long" ? hair : ""}${beard}
   <g class="eyes"><ellipse cx="78" cy="86" rx="8" ry="10" fill="#2a1a2a"/><ellipse cx="122" cy="86" rx="8" ry="10" fill="#2a1a2a"/><circle cx="81" cy="82" r="3" fill="#fff"/><circle cx="125" cy="82" r="3" fill="#fff"/></g>
   ${lk.glasses ? `<circle cx="78" cy="86" r="17" fill="none" stroke="#222" stroke-width="4"/><circle cx="122" cy="86" r="17" fill="none" stroke="#222" stroke-width="4"/><path d="M95 86 h10" stroke="#222" stroke-width="4"/>` : ""}
   <circle cx="66" cy="108" r="9" fill="#ff9fb8" opacity=".7"/><circle cx="134" cy="108" r="9" fill="#ff9fb8" opacity=".7"/>
   <path class="mouth" d="M86 ${lk.beard ? 124 : 116} Q100 ${lk.beard ? 136 : 130} 114 ${lk.beard ? 124 : 116}" stroke="#7a2030" stroke-width="5" fill="${she ? "#ff8fa8" : "none"}" stroke-linecap="round"/>
   ${hat}<text x="136" y="248" font-size="54">${lk.item || "🎨"}</text></svg>`;
}
function painterHTML(key) { const P = PAINTERS[key]; return P.img ? `<img class="pimg" src="${P.img}" alt="">` : cartoonSVG(P.look, P.she); }
