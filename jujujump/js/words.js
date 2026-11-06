"use strict";
/* ================================================================
   WORD BANK — every game pulls from here.
   e = emoji picture, en = English, zh = Chinese, py = pinyin (tone marks),
   pt = Portuguese (for the Talk-to-Panda translator), s = sound (animals)
   ================================================================ */
const W = (cat, list) => list.map(([e, en, zh, py, pt, s]) => ({ id: cat + ":" + en, cat, e, en, zh, py, pt, s }));

const WORDS = [
  ...W("animal", [
    ["🐱", "cat", "猫", "māo", "gato", "Meow meow!"],
    ["🐶", "dog", "狗", "gǒu", "cachorro", "Woof woof!"],
    ["🐮", "cow", "牛", "niú", "vaca", "Moooo!"],
    ["🐷", "pig", "猪", "zhū", "porco", "Oink oink!"],
    ["🦆", "duck", "鸭子", "yā zi", "pato", "Quack quack!"],
    ["🐴", "horse", "马", "mǎ", "cavalo", "Neeeigh!"],
    ["🐑", "sheep", "羊", "yáng", "ovelha", "Baaaa!"],
    ["🐔", "chicken", "鸡", "jī", "galinha", "Cluck cluck!"],
    ["🐼", "panda", "熊猫", "xióng māo", "panda", "Nom nom bamboo!"],
    ["🐵", "monkey", "猴子", "hóu zi", "macaco", "Ooh ooh aah aah!"],
    ["🐯", "tiger", "老虎", "lǎo hǔ", "tigre", "Roooar!"],
    ["🐘", "elephant", "大象", "dà xiàng", "elefante", "Pawoooo!"],
    ["🐟", "fish", "鱼", "yú", "peixe", "Blub blub!"],
    ["🐦", "bird", "鸟", "niǎo", "passarinho", "Tweet tweet!"],
    ["🐸", "frog", "青蛙", "qīng wā", "sapo", "Ribbit ribbit!"],
    ["🦁", "lion", "狮子", "shī zi", "leão", "Roar!"],
    ["🐰", "rabbit", "兔子", "tù zi", "coelho", "Hop hop!"],
    ["🐝", "bee", "蜜蜂", "mì fēng", "abelha", "Bzzzzz!"],
    ["🦒", "giraffe", "长颈鹿", "cháng jǐng lù", "girafa", "Munch munch!"],
    ["🐻", "bear", "熊", "xióng", "urso", "Grrrr!"],
  ]),
  ...W("food", [
    ["🍎", "apple", "苹果", "píng guǒ", "maçã"],
    ["🍌", "banana", "香蕉", "xiāng jiāo", "banana"],
    ["🍓", "strawberry", "草莓", "cǎo méi", "morango"],
    ["🍇", "grapes", "葡萄", "pú tao", "uva"],
    ["🍊", "orange", "橙子", "chéng zi", "laranja"],
    ["🍉", "watermelon", "西瓜", "xī guā", "melancia"],
    ["🍒", "cherry", "樱桃", "yīng táo", "cereja"],
    ["🍑", "peach", "桃子", "táo zi", "pêssego"],
    ["🥕", "carrot", "胡萝卜", "hú luó bo", "cenoura"],
    ["🥚", "egg", "鸡蛋", "jī dàn", "ovo"],
    ["🍞", "bread", "面包", "miàn bāo", "pão"],
    ["🍦", "ice cream", "冰淇淋", "bīng qí lín", "sorvete"],
    ["🎂", "cake", "蛋糕", "dàn gāo", "bolo"],
    ["🥛", "milk", "牛奶", "niú nǎi", "leite"],
    ["🍕", "pizza", "披萨", "pī sà", "pizza"],
    ["🍪", "cookie", "饼干", "bǐng gān", "biscoito"],
  ]),
  ...W("color", [
    ["🟥", "red", "红色", "hóng sè", "vermelho"],
    ["🟨", "yellow", "黄色", "huáng sè", "amarelo"],
    ["🟦", "blue", "蓝色", "lán sè", "azul"],
    ["⬜", "white", "白色", "bái sè", "branco"],
    ["🟧", "orange color", "橙色", "chéng sè", "cor de laranja"],
    ["🟩", "green", "绿色", "lǜ sè", "verde"],
    ["🟪", "purple", "紫色", "zǐ sè", "roxo"],
    ["🩷", "pink", "粉红色", "fěn hóng sè", "rosa"],
    ["🩵", "light blue", "浅蓝色", "qiǎn lán sè", "azul claro"],
    ["⬛", "black", "黑色", "hēi sè", "preto"],
  ]),
  ...W("number", [
    ["1️⃣", "one", "一", "yī", "um"], ["2️⃣", "two", "二", "èr", "dois"], ["3️⃣", "three", "三", "sān", "três"],
    ["4️⃣", "four", "四", "sì", "quatro"], ["5️⃣", "five", "五", "wǔ", "cinco"], ["6️⃣", "six", "六", "liù", "seis"],
    ["7️⃣", "seven", "七", "qī", "sete"], ["8️⃣", "eight", "八", "bā", "oito"], ["9️⃣", "nine", "九", "jiǔ", "nove"],
    ["🔟", "ten", "十", "shí", "dez"],
  ]),
  ...W("body", [
    ["👃", "nose", "鼻子", "bí zi", "nariz"],
    ["👀", "eyes", "眼睛", "yǎn jing", "olhos"],
    ["👄", "mouth", "嘴巴", "zuǐ ba", "boca"],
    ["👂", "ears", "耳朵", "ěr duo", "orelha"],
    ["💇", "hair", "头发", "tóu fa", "cabelo"],
    ["😊", "cheeks", "脸蛋", "liǎn dàn", "bochecha"],
    ["🫦", "chin", "下巴", "xià ba", "queixo"],
    ["🖐️", "hand", "手", "shǒu", "mão"],
    ["🦶", "foot", "脚", "jiǎo", "pé"],
  ]),
  ...W("hanzi", [   // pictographs: the character grew out of a drawing
    ["☀️", "sun", "日", "rì", "sol"],
    ["🌙", "moon", "月", "yuè", "lua"],
    ["⛰️", "mountain", "山", "shān", "montanha"],
    ["💧", "water", "水", "shuǐ", "água"],
    ["🔥", "fire", "火", "huǒ", "fogo"],
    ["🌳", "tree", "木", "mù", "árvore"],
    ["🧍", "person", "人", "rén", "pessoa"],
    ["😮", "mouth (character)", "口", "kǒu", "boquinha"],
    ["🙆", "big", "大", "dà", "grande"],
    ["🤏", "small", "小", "xiǎo", "pequeno"],
    ["🌧️", "rain", "雨", "yǔ", "chuva"],
    ["🚪", "door", "门", "mén", "porta"],
    ["👧", "girl", "女", "nǚ", "menina"],
    ["❤️", "heart", "心", "xīn", "coração"],
    ["🌾", "field", "田", "tián", "campo"],
  ]),
  ...W("family", [
    ["👩", "mom", "妈妈", "mā ma", "mamãe"],
    ["👨", "dad", "爸爸", "bà ba", "papai"],
    ["👵", "grandma", "奶奶", "nǎi nai", "vovó"],
    ["👴", "grandpa", "爷爷", "yé ye", "vovô"],
    ["👦", "uncle", "叔叔", "shū shu", "tio"],
    ["🧒", "friend", "朋友", "péng you", "amigo"],
  ]),
  ...W("talk", [
    ["👋", "hello", "你好", "nǐ hǎo", "olá"],
    ["🙏", "thank you", "谢谢", "xiè xie", "obrigada"],
    ["😴", "good night", "晚安", "wǎn ān", "boa noite"],
    ["🌅", "good morning", "早上好", "zǎo shang hǎo", "bom dia"],
    ["👋", "bye-bye", "再见", "zài jiàn", "tchau"],
    ["💖", "I love you", "我爱你", "wǒ ài nǐ", "eu te amo"],
    ["😄", "happy", "开心", "kāi xīn", "feliz"],
    ["😠", "grumpy", "生气", "shēng qì", "brava"],
    ["💃", "dance", "跳舞", "tiào wǔ", "dançar"],
    ["🏊", "swim", "游泳", "yóu yǒng", "nadar"],
    ["⚽", "football", "足球", "zú qiú", "futebol"],
    ["🎒", "school", "学校", "xué xiào", "escola"],
    ["🎉", "party", "派对", "pài duì", "festa"],
    ["🪆", "doll", "娃娃", "wá wa", "boneca"],
  ]),
];
const WBY = Object.fromEntries(WORDS.map(w => [w.id, w]));
const byCat = c => WORDS.filter(w => w.cat === c);
const findWord = (cat, en) => WBY[cat + ":" + en];

/* ---- Pinyin coloured by tone (1 red, 2 orange, 3 green, 4 blue, neutral grey) ---- */
const TONES = { 1: "āēīōūǖĀĒĪŌŪǕ", 2: "áéíóúǘÁÉÍÓÚǗ", 3: "ǎěǐǒǔǚǍĚǏǑǓǙ", 4: "àèìòùǜÀÈÌÒÙǛ" };
function toneOf(syl) { for (const t of [1, 2, 3, 4]) if ([...syl].some(c => TONES[t].includes(c))) return t; return 5; }
function pyHTML(py) { return py.split(" ").map(s => `<span class="t${toneOf(s)}">${s}</span>`).join(" "); }

/* ---- Spaced repetition (Leitner boxes, invisible to Julia) ---- */
const SRS = {
  data: null,
  load() { if (!this.data) this.data = store.get("srs", {}); return this.data; },
  save() { store.set("srs", this.data); },
  rec(id) { const d = this.load(); return d[id] || (d[id] = { b: 0, due: 0, seen: 0, ok: 0 }); },
  // b = box 0..5 ; due = timestamp when it should come back
  mark(id, correct) {
    const r = this.rec(id), now = Date.now(); r.seen++;
    if (correct) { r.ok++; r.b = Math.min(5, r.b + 1); } else r.b = Math.max(0, r.b - 2);
    const mins = [1, 10, 60 * 8, 60 * 24, 60 * 24 * 3, 60 * 24 * 7][r.b];
    r.due = now + mins * 60000; this.save();
  },
  seenOnly(id) { const r = this.rec(id); r.seen++; if (!r.due) r.due = Date.now() + 60000; this.save(); },
  /* choose n words of a category: due/new/weak words first, then a few known ones (interleaving) */
  pick(cat, n, pool) {
    pool = pool || byCat(cat); const now = Date.now();
    const score = w => { const r = this.load()[w.id]; if (!r) return 1 + Math.random(); return (r.due <= now ? 2 : 0) + (5 - r.b) * .4 + Math.random(); };
    return [...pool].sort((a, b) => score(b) - score(a)).slice(0, n);
  },
  level(id) { const r = this.load()[id]; return r ? r.b : -1; },
  known() { return WORDS.filter(w => this.level(w.id) >= 2); },
  met() { return WORDS.filter(w => this.level(w.id) >= 0); },
};
