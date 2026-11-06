"use strict";
/* ============ TINTAS (mesmas cores do tools/palette.py) ============
   [cor, nome, nome em sílabas] */
const PAINT = {
  red: ["#e3262e", "vermelho", "VER-ME-LHO"], yellow: ["#ffd23f", "amarelo", "A-MA-RE-LO"], blue: ["#2560d9", "azul", "A-ZUL"],
  white: ["#fbf8f0", "branco", "BRAN-CO"], black: ["#1e1b1e", "preto", "PRE-TO"],
  orange: ["#ff8a1f", "laranja", "LA-RAN-JA"], green: ["#2fa84f", "verde", "VER-DE"], purple: ["#8a3fc4", "roxo", "RO-XO"],
  pink: ["#ff8fbf", "rosa", "RO-SA"], lightblue: ["#8cc4f0", "azul-claro", "A-ZUL CLA-RO"], gray: ["#9a9a9a", "cinza", "CIN-ZA"],
  darkblue: ["#1d2f66", "azul-escuro", "A-ZUL ES-CU-RO"], darkred: ["#8f1d22", "vinho", "VI-NHO"], brown: ["#8a5a2b", "marrom", "MAR-ROM"],
  cream: ["#f5e6a8", "creme", "CRE-ME"], darkgreen: ["#1f4d2e", "verde-escuro", "VER-DE ES-CU-RO"], lightgreen: ["#9bd77a", "verde-claro", "VER-DE CLA-RO"],
  peach: ["#f6c39a", "pêssego", "PÊS-SE-GO"], beige: ["#cdb48c", "bege", "BE-GE"], gold: ["#c9a227", "dourado", "DOU-RA-DO"],
};
const BASE = ["red", "yellow", "blue", "white", "black"];
// receita: resultado <- a + b (a ordem não importa)
const RECIPES = { orange: ["red", "yellow"], green: ["blue", "yellow"], purple: ["red", "blue"], pink: ["red", "white"], lightblue: ["blue", "white"],
  gray: ["black", "white"], darkblue: ["blue", "black"], darkred: ["red", "black"], brown: ["orange", "blue"], cream: ["yellow", "white"],
  darkgreen: ["green", "black"], lightgreen: ["green", "white"], peach: ["orange", "white"], beige: ["brown", "white"], gold: ["yellow", "brown"] };
const MIXTAB = {}; for (const [r, [a, b]] of Object.entries(RECIPES)) MIXTAB[[a, b].sort().join("+")] = r;
function mix(a, b) {
  if (a === b) return a; const r = MIXTAB[[a, b].sort().join("+")]; if (r) return r;
  if (a === "white" || b === "white") { const o = a === "white" ? b : a; return { darkblue: "blue", darkred: "red", darkgreen: "green", brown: "beige", orange: "peach", green: "lightgreen", blue: "lightblue", red: "pink", black: "gray", purple: "pink", yellow: "cream" }[o] || o; }
  if (a === "black" || b === "black") { const o = a === "black" ? b : a; return { blue: "darkblue", red: "darkred", green: "darkgreen", white: "gray", lightblue: "blue", pink: "red", lightgreen: "green", orange: "brown", yellow: "gold" }[o] || "black"; }
  return "brown"; // o resto vira lama, como tinta de verdade!
}

/* ============ AS PRIMAS ============ */
const PERFIS = {
  julia: { nome: "JULIA", av: "kids/avatar-julia.jpg" },
  elisa: { nome: "ELISA", av: "kids/avatar-elisa.jpg" },
  yasmin: { nome: "YASMIN", av: "kids/avatar-yasmin.jpg" },
  valentina: { nome: "VALENTINA", av: "kids/avatar-valentina.jpg" },
};
/* piadinhas por prima (tela -> fala extra) */
const PIADAS = {
  yasmin: { iara: "YASMIN! Seu nome é nome de flor, e eu tenho uma flor no cabelo! Somos amigas!", caipora: "Yasmin, flor do mato! Eu cuido das flores pra você!" },
  valentina: { lobisomem: "Valentina, nome de menina valente! Você não tem medo de mim, né? Auuuu!" },
  elisa: { boto: "Elisa, Elisa, sua risada é igual à minha! Hihihi!" },
  julia: { saci: "Julia! Vou te contar um segredo: você é a pintora mais rápida do Brasil!" },
};
