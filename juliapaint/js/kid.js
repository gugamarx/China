"use strict";
/* ============ PER-CHILD CONFIG ============
   Everything personal lives here. tools/build_kids.py writes one of these into each child's site.
   jokes: painting number -> extra line said by the painter for this child. */
const KIDS = {
  julia: { name: "Julia", zh: "朱莉娅", py: "Zhū lì yà", cover: "kids/cover-julia.jpg", site: "juliapaint",
    jokes: { 23: "Her name is Julie... and your name is Julia! Almost the same! Are you my daughter too? Ha ha ha!",
             25: "Julia, I think Mona Lisa is smiling at YOU!" } },
  elisa: { name: "Elisa", zh: "埃莉莎", py: "Āi lì shā", cover: "kids/cover-elisa.jpg", site: "elisapaint",
    jokes: { 25: "Mona LISA... and E-LISA! You have the same name as my painting! Mamma mia!",
             23: "Elisa, my name is Élisabeth... Elisa is a little piece of my name! Ha ha!" } },
  yasmin: { name: "Yasmin", zh: "雅斯敏", py: "Yǎ sī mǐn", cover: "kids/cover-yasmin.jpg", site: "yasminpaint",
    jokes: { 3: "Yasmin is a flower name! Jasmine! Like the flowers in my painting!",
             6: "Sunflowers for Yasmin, the flower girl!" } },
  valentina: { name: "Valentina", zh: "瓦伦蒂娜", py: "Wǎ lún dì nà", cover: "kids/cover-valentina.jpg", site: "valentinapaint",
    jokes: { 25: "Valentina! That is an Italian name! Like me! Bellissima!",
             17: "Valentina, your name has a heart in it! Valentine! Like the hearts of gold in my tree!" } },
};
const KID = KIDS[window.KID_ID || "julia"];
