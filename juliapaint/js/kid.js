"use strict";
/* ============ PER-CHILD CONFIG ============
   Everything personal lives here. tools/build_kids.py writes one of these into each child's site.
   jokes: painting number -> extra line said by the painter for this child. */
const KIDS = {
  julia: { name: "Julia", zh: "朱莉娅", py: "Zhū lì yà", cover: "kids/cover-julia.jpg", site: "juliapaint",
    jokes: { monalisa: "Julia, I think Mona Lisa is smiling at YOU!", nianhua: "In Chinese, your name is Zhū lì yà! 朱莉娅!" } },
  elisa: { name: "Elisa", zh: "埃莉莎", py: "Āi lì shā", cover: "kids/cover-elisa.jpg", site: "elisapaint",
    jokes: { monalisa: "Mona LISA... and E-LISA! You have the same name as my painting! Mamma mia!" } },
  yasmin: { name: "Yasmin", zh: "雅斯敏", py: "Yǎ sī mǐn", cover: "kids/cover-yasmin.jpg", site: "yasminpaint",
    jokes: { afklint: "Yasmin is a flower name! Jasmine! Like the flowers in my painting!", sunflowers: "Sunflowers for Yasmin, the flower girl!", nianhua: "Listen to the music! It is called Jasmine Flower, like your name, Yasmin!" } },
  valentina: { name: "Valentina", zh: "瓦伦蒂娜", py: "Wǎ lún dì nà", cover: "kids/cover-valentina.jpg", site: "valentinapaint",
    jokes: { monalisa: "Valentina! That is an Italian name! Like me! Bellissima!", vertumnus: "Valentina! An Italian name, like me! Bellissima!" } },
};
const KID = KIDS[window.KID_ID || "julia"];
