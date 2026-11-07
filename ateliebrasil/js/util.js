"use strict";
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const rnd = n => Math.floor(Math.random() * n), pick = a => a[rnd(a.length)];
const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const el = (t, c, h) => { const e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; };
const hex2rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));

/* ---------- guardar no celular (sem banco de dados) ----------
   gstore: coisas do aparelho (música, som, perfis)   store: progresso da pintora escolhida */
const mkStore = pfx => ({
  pfx,
  get(k, d) { try { const v = localStorage.getItem(this.pfx + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(this.pfx + k, JSON.stringify(v)); return true; } catch (e) { return false; } },
  clear() { try { Object.keys(localStorage).filter(k => k.startsWith(this.pfx)).forEach(k => localStorage.removeItem(k)); } catch (e) { } },
});
const gstore = mkStore("atelie_g_");
const store = mkStore("atelie_julia_");
const useProfile = id => { store.pfx = `atelie_${id}_`; gstore.set("ultima", id); };
function backupAll() { const o = {}; try { Object.keys(localStorage).filter(k => k.startsWith("atelie_")).forEach(k => o[k] = localStorage.getItem(k)); } catch (e) { } return o; }
function restoreAll(o) { let n = 0; for (const [k, v] of Object.entries(o || {})) if (k.startsWith("atelie_") && typeof v === "string") { try { localStorage.setItem(k, v); n++; } catch (e) { } } return n; }

/* ---------- letras e sílabas (alfabetização) ---------- */
const SYLC = ["#e3262e", "#2560d9", "#21a050", "#d27800", "#8a3fc4"];
/* "GOR-RO" -> sílabas coloridas; "SA-CI PE-RE-RÊ" também funciona */
const silabasHTML = (s, cls = "sy") => s.split(" ").map(w => `<span style="white-space:nowrap">${w.split("-").map((p, i) => `<span class="${cls}" style="color:${SYLC[i % SYLC.length]}">${p}</span>`).join(`<i class="hif">-</i>`)}</span>`).join(" ");
const palavra = s => s.replace(/-/g, "");
const silabas = s => s.split(/[-\s]/).filter(Boolean);
const LETRA = { A: "á", B: "bê", C: "cê", D: "dê", E: "é", F: "éfe", G: "gê", H: "agá", I: "i", J: "jota", K: "cá", L: "éle", M: "ême", N: "êne", O: "ó", P: "pê", Q: "quê", R: "érre", S: "ésse", T: "tê",
  U: "u", V: "vê", W: "dáblio", X: "xis", Y: "ípsilon", Z: "zê", "Ç": "cê cedilha", "Á": "á", "É": "é", "Í": "i", "Ó": "ó", "Ú": "u", "Ã": "ã", "Õ": "õ", "Â": "â", "Ê": "ê", "Ô": "ô" };

/* recorte redondo de um ponto da ilustração (rostos, bichos, figurinhas): vem pronto como imagem (tools/build_crops.py),
   assim o enquadramento é exato em qualquer celular. z = largura do recorte (fração da largura da página). */
const cropKey = (k, x, y, z) => k + "_" + [x, y, z].map(v => Math.round(v * 1000)).join("_");
function cropHTML(k, x, y, z = .3, cls = "crop") { return `<img class="${cls}" src="pages/c/${cropKey(k, x, y, z)}.jpg" alt="">`; }
const META_AR = typeof PAGINAS !== "undefined" ? Object.fromEntries(Object.entries(PAGINAS).map(([k, [w, h]]) => [k, w / h])) : {};   // largura/altura de cada página
