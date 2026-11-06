"use strict";
/* ============ PAINTS (keep in sync with tools/palette.py) ============ */
const PAINT = {
  red: ["#e3262e", "red", "红色", "hóng sè"], yellow: ["#ffd23f", "yellow", "黄色", "huáng sè"], blue: ["#2560d9", "blue", "蓝色", "lán sè"],
  white: ["#fbf8f0", "white", "白色", "bái sè"], black: ["#1e1b1e", "black", "黑色", "hēi sè"],
  orange: ["#ff8a1f", "orange", "橙色", "chéng sè"], green: ["#2fa84f", "green", "绿色", "lǜ sè"], purple: ["#8a3fc4", "purple", "紫色", "zǐ sè"],
  pink: ["#ff8fbf", "pink", "粉红色", "fěn hóng sè"], lightblue: ["#8cc4f0", "light blue", "浅蓝色", "qiǎn lán sè"], gray: ["#9a9a9a", "gray", "灰色", "huī sè"],
  darkblue: ["#1d2f66", "dark blue", "深蓝色", "shēn lán sè"], darkred: ["#8f1d22", "dark red", "深红色", "shēn hóng sè"], brown: ["#8a5a2b", "brown", "棕色", "zōng sè"],
  cream: ["#f5e6a8", "cream", "奶油色", "nǎi yóu sè"], darkgreen: ["#1f4d2e", "dark green", "深绿色", "shēn lǜ sè"], lightgreen: ["#9bd77a", "light green", "浅绿色", "qiǎn lǜ sè"],
  peach: ["#f6c39a", "peach", "桃色", "táo sè"], beige: ["#cdb48c", "beige", "米色", "mǐ sè"], gold: ["#c9a227", "gold", "金色", "jīn sè"],
};
const BASE = ["red", "yellow", "blue", "white", "black"];
// recipe: result <- a + b (order does not matter)
const RECIPES = { orange: ["red", "yellow"], green: ["blue", "yellow"], purple: ["red", "blue"], pink: ["red", "white"], lightblue: ["blue", "white"],
  gray: ["black", "white"], darkblue: ["blue", "black"], darkred: ["red", "black"], brown: ["orange", "blue"], cream: ["yellow", "white"],
  darkgreen: ["green", "black"], lightgreen: ["green", "white"], peach: ["orange", "white"], beige: ["brown", "white"], gold: ["yellow", "brown"] };
const MIXTAB = {}; for (const [r, [a, b]] of Object.entries(RECIPES)) MIXTAB[[a, b].sort().join("+")] = r;
function mix(a, b) {
  if (a === b) return a; const r = MIXTAB[[a, b].sort().join("+")]; if (r) return r;
  // a few friendly extras so random mixing still teaches something
  if (a === "white" || b === "white") { const o = a === "white" ? b : a; return { darkblue: "blue", darkred: "red", darkgreen: "green", brown: "beige", orange: "peach", green: "lightgreen", blue: "lightblue", red: "pink", black: "gray", purple: "pink", yellow: "cream" }[o] || o; }
  if (a === "black" || b === "black") { const o = a === "black" ? b : a; return { blue: "darkblue", red: "darkred", green: "darkgreen", white: "gray", lightblue: "blue", pink: "red", lightgreen: "green", orange: "brown", yellow: "gold" }[o] || "black"; }
  return "brown"; // everything else turns muddy, like real paint!
}

/* ============ PAINTERS ============
   v = voice language used to read their English (gives a real accent), hi = greeting in their language,
   look = cartoon fallback parameters (if no generated portrait yet) */
const PAINTERS = {
  mondrian: { n: "Piet Mondrian", flag: "🇳🇱", v: "nl-NL", hi: "Hallo", bye: "Fantastisch!", img: "painters/mondrian.webp" },
  kandinsky: { n: "Wassily Kandinsky", flag: "🇷🇺", v: "ru-RU", hi: "Privet", bye: "Molodets!", img: "painters/kandinsky.webp" },
  afklint: { n: "Hilma af Klint", flag: "🇸🇪", v: "sv-SE", hi: "Hej hej", bye: "Underbart!", img: "painters/afklint.webp", she: 1 },
  klee: { n: "Paul Klee", flag: "🇨🇭", v: "de-DE", hi: "Grüezi", bye: "Wunderbar!", img: "painters/klee.webp" },
  cezanne: { n: "Paul Cézanne", flag: "🇫🇷", v: "fr-FR", hi: "Bonjour", bye: "Magnifique!", look: { hair: "bald", beard: "grey", hat: "cap", coat: "#5a3b22", item: "🍎" } },
  vangogh: { n: "Vincent van Gogh", flag: "🇳🇱", v: "nl-NL", hi: "Hallo", bye: "Prachtig!", img: "painters/vangogh.webp" },
  matisse: { n: "Henri Matisse", flag: "🇫🇷", v: "fr-FR", hi: "Bonjour", bye: "Ooh là là!", look: { hair: "bald", beard: "white", glasses: 1, coat: "#ffffff", scarf: "#e3262e", item: "✂️" } },
  cassatt: { n: "Mary Cassatt", flag: "🇺🇸", v: "en-US", hi: "Howdy", bye: "Wonderful!", she: 1, look: { hair: "bun", hairc: "#6b3d1f", hat: "flowerhat", coat: "#2f6fd6", item: "🎨" } },
  monet: { n: "Claude Monet", flag: "🇫🇷", v: "fr-FR", hi: "Bonjour", bye: "Magnifique!", look: { hair: "short", hairc: "#eee", beard: "white", hat: "straw", coat: "#f4f1e8", item: "🪷" } },
  hokusai: { n: "Katsushika Hokusai", flag: "🇯🇵", v: "ja-JP", hi: "Konnichiwa", bye: "Sugoi!", look: { hair: "bald", beard: "goatee", coat: "#2560d9", item: "🌊" } },
  munch: { n: "Edvard Munch", flag: "🇳🇴", v: "nb-NO", hi: "Hei", bye: "Fantastisk!", look: { hair: "short", hairc: "#c9a24a", coat: "#3a3a55", item: "😱" } },
  morisot: { n: "Berthe Morisot", flag: "🇫🇷", v: "fr-FR", hi: "Bonjour", bye: "Très bien!", she: 1, look: { hair: "bun", hairc: "#3a2412", coat: "#1d2f66", scarf: "#111", item: "👶" } },
  rousseau: { n: "Henri Rousseau", flag: "🇫🇷", v: "fr-FR", hi: "Bonjour", bye: "Rrrrr! Bravo!", look: { hair: "short", hairc: "#ddd", beard: "white", hat: "beret", coat: "#1f4d2e", item: "🐯" } },
  klimt: { n: "Gustav Klimt", flag: "🇦🇹", v: "de-DE", hi: "Servus", bye: "Wunderbar!", look: { hair: "curly", hairc: "#5a3b22", beard: "full", beardc: "#5a3b22", coat: "#3b6fd1", item: "✨" } },
  leyster: { n: "Judith Leyster", flag: "🇳🇱", v: "nl-NL", hi: "Hallo", bye: "Heel mooi!", she: 1, look: { hair: "bun", hairc: "#3a2412", hat: "bonnet", coat: "#1e1b1e", collar: 1, item: "🎻" } },
  tarsila: { n: "Tarsila do Amaral", flag: "🇧🇷", v: "pt-BR", hi: "Oi", bye: "Que lindo!", she: 1, look: { hair: "long", hairc: "#1e1b1e", coat: "#ff8a1f", earrings: 1, item: "🌵" } },
  millet: { n: "Jean-François Millet", flag: "🇫🇷", v: "fr-FR", hi: "Bonjour", bye: "Bravo!", look: { hair: "short", hairc: "#6b4a2a", beard: "full", beardc: "#6b4a2a", hat: "straw", coat: "#8a5a2b", item: "🌾" } },
  bruegel: { n: "Pieter Bruegel", flag: "🇧🇪", v: "nl-NL", hi: "Goeiedag", bye: "Schitterend!", look: { hair: "short", hairc: "#8a5a2b", beard: "full", beardc: "#a0702f", hat: "beret", coat: "#8f1d22", item: "❄️" } },
  seurat: { n: "Georges Seurat", flag: "🇫🇷", v: "fr-FR", hi: "Bonjour", bye: "Parfait!", look: { hair: "short", hairc: "#2a1a10", beard: "full", beardc: "#2a1a10", hat: "top", coat: "#222", item: "🔵" } },
  vigee: { n: "Élisabeth Vigée Le Brun", flag: "🇫🇷", v: "fr-FR", hi: "Bonjour", bye: "Merveilleux!", she: 1, look: { hair: "curly", hairc: "#6b3d1f", scarf: "#e3262e", coat: "#f5e6a8", item: "👩‍👧" } },
  vermeer: { n: "Johannes Vermeer", flag: "🇳🇱", v: "nl-NL", hi: "Hallo", bye: "Prachtig!", look: { hair: "long", hairc: "#5a3b22", hat: "beret", coat: "#1e1b1e", collar: 1, item: "💎" } },
  leonardo: { n: "Leonardo da Vinci", flag: "🇮🇹", v: "it-IT", hi: "Ciao", bye: "Bravissima!", look: { hair: "long", hairc: "#ddd", beard: "long", hat: "beret", coat: "#8f1d22", item: "🖌️" } },
};

/* ============ PAINTINGS ============
   lvl, need = % match to pass (0 = free), music theme, amb = ambient sound, say = painter line, zh = word of the painting */
let ART = [
  { t: "Composition with Red, Blue and Yellow", p: "mondrian", y: 1930, music: "boogie", amb: "", say: "I only use straight lines and red, blue and yellow! Simple, ja?", zh: ["方块", "fāng kuài", "squares"] },
  { t: "Squares with Circles", p: "kandinsky", y: 1913, music: "bubbles", amb: "", say: "For me, colors make music! Red sings loud, blue sings soft!", zh: ["圆圈", "yuán quān", "circles"] },
  { t: "The Ten Largest, Youth", p: "afklint", y: 1907, music: "bells", amb: "", say: "I painted giant pictures, bigger than a door! Spirals and flowers!", zh: ["花", "huā", "flower"] },
  { t: "Castle and Sun", p: "klee", y: 1928, music: "march", amb: "", say: "I play the violin, and I paint with little squares, like a puzzle!", zh: ["城堡", "chéng bǎo", "castle"] },
  { t: "Still Life with Apples", p: "cezanne", y: 1895, music: "calm", amb: "", say: "I painted apples so many times! I want to surprise Paris with an apple!", zh: ["苹果", "píng guǒ", "apple"] },
  { t: "Sunflowers", p: "vangogh", y: 1888, music: "waltz", amb: "birds", say: "Yellow is my favorite color! The color of the sun!", zh: ["向日葵", "xiàng rì kuí", "sunflower"] },
  { t: "Harmony in Red", p: "matisse", y: 1908, music: "musette", amb: "", say: "I painted a red room... red table, red wall, everything red! Ooh là là!", zh: ["红色", "hóng sè", "red"] },
  { t: "Little Girl in a Blue Armchair", p: "cassatt", y: 1878, music: "ragtime", amb: "", say: "I loved painting children! This little girl is tired... and the puppy too!", zh: ["小狗", "xiǎo gǒu", "puppy"] },
  { t: "Bedroom in Arles", p: "vangogh", y: 1888, music: "musicbox", amb: "", say: "This is my bedroom! Can you find my bed and my two chairs?", zh: ["床", "chuáng", "bed"] },
  { t: "Impression, Sunrise", p: "monet", y: 1872, music: "arabesque", amb: "waves", say: "The sun is waking up over the water! Look at the little orange sun!", zh: ["太阳", "tài yáng", "sun"] },
  { t: "The Great Wave", p: "hokusai", y: 1831, music: "sakura", amb: "waves", say: "A giant wave! And look, the little mountain Fuji is hiding!", zh: ["海浪", "hǎi làng", "wave"] },
  { t: "The Starry Night", p: "vangogh", y: 1889, music: "gymnopedie", amb: "crickets", say: "I looked out my window at night and the stars were dancing!", zh: ["星星", "xīng xing", "stars"] },
  { t: "The Cradle", p: "morisot", y: 1872, music: "lullaby", amb: "", say: "Shhh... the baby is sleeping. This is my sister and her baby.", zh: ["宝宝", "bǎo bao", "baby"] },
  { t: "The Scream", p: "munch", y: 1895, music: "mountainking", amb: "", say: "Aaaaah! The sky is orange and I am screaming! Can you scream too?", zh: ["害怕", "hài pà", "scared"] },
  { t: "The Water Lily Pond", p: "monet", y: 1899, music: "clair", amb: "frogs", say: "This is my garden! I built a little bridge over the water lilies!", zh: ["桥", "qiáo", "bridge"] },
  { t: "Tiger in a Storm", p: "rousseau", y: 1891, music: "jungle", amb: "thunder", say: "Rrroar! A tiger in the jungle, and a big storm! I never went to a jungle... I imagined it!", zh: ["老虎", "lǎo hǔ", "tiger"] },
  { t: "The Tree of Life", p: "klimt", y: 1909, music: "danube", amb: "", say: "I love gold! Real gold in my paintings! Look at all the spirals!", zh: ["树", "shù", "tree"] },
  { t: "Self-Portrait", p: "leyster", y: 1630, music: "baroque", amb: "", say: "Hello! This is me painting a happy man with a violin! I was a famous painter 400 years ago!", zh: ["小提琴", "xiǎo tí qín", "violin"] },
  { t: "Abaporu", p: "tarsila", y: 1928, music: "samba", amb: "birds", say: "Oi! Abaporu means 'the man who eats people' in Tupi! Look at his giant foot! Ha ha!", zh: ["仙人掌", "xiān rén zhǎng", "cactus"] },
  { t: "The Gleaners", p: "millet", y: 1857, music: "pastoral", amb: "birds", say: "Three ladies pick up wheat in the field. Can you hear the birds?", zh: ["田野", "tián yě", "field"] },
  { t: "Hunters in the Snow", p: "bruegel", y: 1565, music: "winter", amb: "wind", say: "Brrr! It is winter! Look, people skating on the ice!", zh: ["雪", "xuě", "snow"] },
  { t: "A Sunday on La Grande Jatte", p: "seurat", y: 1884, music: "cancan", amb: "birds", say: "I painted this with millions of tiny dots! Dot, dot, dot!", zh: ["公园", "gōng yuán", "park"] },
  { t: "Self-portrait with her Daughter Julie", p: "vigee", y: 1786, music: "twinkle", amb: "", say: "This is me hugging my daughter Julie! A big hug!", zh: ["拥抱", "yōng bào", "hug"] },
  { t: "Girl with a Pearl Earring", p: "vermeer", y: 1665, music: "minuet", amb: "", say: "Look at her shiny pearl earring! She is looking at you!", zh: ["珍珠", "zhēn zhū", "pearl"] },
  { t: "Mona Lisa", p: "leonardo", y: 1503, music: "opera", amb: "", say: "Mamma mia! The most famous painting in the world! Is she smiling? Look closely!", zh: ["微笑", "wēi xiào", "smile"] },
].map((a, i) => ({ ...a, i: i + 1, n: String(i + 1).padStart(2, "0") }));
/* play order = easiest first (fewest areas to paint); the last two must be copied perfectly */
const ORDER = [1, 19, 10, 6, 13,   8, 20, 21, 2, 14,   18, 16, 11, 12, 15,   3, 5, 7, 9, 23,   17, 22, 4, 24, 25];
const ART_BY_FILE = ART; ART = ORDER.map((f, k) => ({ ...ART_BY_FILE[f - 1], pos: k, lvl: Math.floor(k / 5) + 1, need: k >= 23 ? 100 : 0 }));
const COUNTRY = { "🇳🇱": ["the Netherlands", "荷兰", "hé lán"], "🇷🇺": ["Russia", "俄罗斯", "é luó sī"], "🇸🇪": ["Sweden", "瑞典", "ruì diǎn"], "🇨🇭": ["Switzerland", "瑞士", "ruì shì"],
  "🇫🇷": ["France", "法国", "fǎ guó"], "🇺🇸": ["the USA", "美国", "měi guó"], "🇯🇵": ["Japan", "日本", "rì běn"], "🇳🇴": ["Norway", "挪威", "nuó wēi"], "🇦🇹": ["Austria", "奥地利", "ào dì lì"],
  "🇧🇷": ["Brazil", "巴西", "bā xī"], "🇧🇪": ["Belgium", "比利时", "bǐ lì shí"], "🇮🇹": ["Italy", "意大利", "yì dà lì"] };
