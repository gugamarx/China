"""Especificação das artes novas do Ateliê Brasil (fonte única para PROMPTS.md e a mesa de decisões).
TAM = tamanho de cada tela; BASE = prompt base; ART = o que vai em cada desenho; RASCUNHOS = textos das telas que ainda não existem;
AVATARES = as 9 pintoras. Os textos das telas que já existem vêm do js/lendas.js."""

TAM = {"tela": "1024 × 1536 px (retrato 2:3)", "avatar": "1024 × 1024 px (quadrado)", "capa": "1024 × 1536 px (retrato 2:3)"}

# cena padrão (decisão: paisagem simples de céu, SEMPRE no mesmo lugar, para o jogo achar e animar sol, nuvem e montanha)
CENA = ("BACKGROUND, always the same simple layout: a flat light-blue sky; a round yellow SUN in the TOP-RIGHT corner with 8 separate "
        "triangular rays around it (each ray its own closed shape); ONE simple white puffy CLOUD in the TOP-LEFT corner; ONE low rounded "
        "green MOUNTAIN on the horizon behind the character; flat ground at the bottom. Nothing else in the background.")
BASE = ("Children's coloring-book illustration, ONE single image, portrait 2:3 (1024x1536), no frame, no border. " + CENA + " "
        "FOREGROUND: one cute Brazilian folklore character for 6-year-olds, friendly and smiling, never scary, full body, centered, "
        "filling about 70% of the image height, with one small companion next to it. "
        "STYLE: flat solid colors only (every area is ONE flat color: no gradients, no shading, no highlights, no texture, no patterns), "
        "thick uniform black outlines that fully close every shape with no gaps, large simple shapes, at most about 45 color areas, "
        "no tiny details (no freckles, no single hair strands, no small dots, no thin grass blades). "
        "Every color area must be completely enclosed by black outline. No text, no letters, no numbers, no watermark.")
NEGATIVO = ("gradient, shading, shadow, highlight, glow, texture, halftone, pattern, tiny details, thin lines, sketch, broken outline, gaps in outline, "
            "realistic, photo, 3d, text, letters, words, watermark, signature, frame, border, two suns, many clouds, scary, horror, blood")

BASE_LADO = ("Side-by-side children's coloring book page, landscape 3:2 (1536x1024), pure white background: LEFT half is the full-color version, "
             "RIGHT half is the EXACT same drawing as black line art only (same pose, same size, same position, same outlines). "
             "Cute friendly Brazilian folklore character for 6-year-olds, full body, one small companion, no scenery. Flat solid colors, no gradients or shading, "
             "thick black outlines that fully close every shape with no gaps, large simple shapes, few tiny details. No text, no letters, no watermark.")

BASE_AVATAR = ("Square avatar portrait 1:1 (1024x1024) of a cute 6-year-old Brazilian girl for a kids painting game: head and shoulders, face exactly in the center, "
               "looking at the viewer with a big friendly smile, wearing a painter's apron with a few paint spots, holding a paintbrush near her shoulder. "
               "Same cartoon style as a children's coloring book: flat solid colors, no gradients or shading, thick black outlines, simple shapes, big expressive eyes. "
               "Solid flat {fundo} background. No text, no letters, no watermark.")

# objs = o que tem que aparecer separado no desenho (vira palavra escondida); comp = companheiro (vira figurinha)
ART = {
 "curupira": "Curupira: a friendly boy guardian of the Amazon forest with bright orange flame-shaped hair and a leaf skirt. MOST IMPORTANT DETAIL: his FEET ARE ON BACKWARDS. Show him in SIDE VIEW (profile), walking and smiling toward the RIGHT side of the image, but BOTH of his feet point to the LEFT: toes on the left, heels on the right, the opposite direction of where he walks. Behind him on the ground, a few simple footprints also point the wrong way. Companion: a small squirrel monkey (macaco-de-cheiro). Clearly separate shapes: flame hair, a small tree, one big leaf, both backwards feet, one open hand.",
 "iara": "Iara: a sweet mermaid girl with very long brown hair and a pink flower in her hair, green fish tail, sitting on a smooth gray rock at the edge of a little blue water. Companion: a small yellow tucunare fish with a round spot on its tail. Clearly separate shapes: the flower, the tail, the rock, a big seashell, the long hair.",
 "boto": "Boto cor-de-rosa: a smiling pink Amazon river dolphin wearing a white hat with a black band, jumping out of a big blue wave. Companion: a pink water lily on a round leaf. Clearly separate shapes: the hat, the wave, the flower, three big water drops.",
 "caipora": "Caipora: a small friendly Indigenous forest guardian girl with spiky red hair, a leaf skirt and a feather in her hair, riding a cute wild boar (caititu). Companion: a blue macaw. Clearly separate shapes: the boar, the macaw, a big feather, the red hair, one big leaf.",
 "vitoria": "Vitoria-regia: a giant round Amazon water lily leaf with a raised rim, holding one big flower with pink and white petals and a yellow center. Companion: a smiling little green frog sitting on the leaf. Clearly separate shapes: the flower, five big petals, the frog, the leaf, two water drops.",
 "mapinguari": "Mapinguari: a big fluffy friendly brown forest giant with ONE big round eye, a wide smiling mouth with two small teeth, long simple fur shapes, big hands and feet. Companion: a little sloth. Clearly separate shapes: the eye, the mouth, one foot, one hand, the fur.",
 "matinta": "Matinta Perera: a sweet old lady with long wavy gray hair, a wide purple hat, a purple dress with big yellow moons and stars, a red cape and a wooden walking cane. Companion: a small black anu bird on her shoulder. Clearly separate shapes: the hat, the bird, the cane, one big star, one big moon.",
 "boi": "Bumba meu Boi: a smiling brown ox (folk costume) with small white horns, a big colorful embroidered blanket decorated with big stars and triangles, and colorful ribbons hanging from the head. Companion: a small cazumba mask. Clearly separate shapes: a big star, one ribbon, the blanket, a horn, the snout.",
 "fulozinha": "Comadre Fulozinha: a small forest girl with VERY long black hair down to her feet, a green leaf dress and a crown of small flowers, whistling. Companion: a sabia thrush bird. Clearly separate shapes: the long hair, the dress, one foot, one big flower, the bird.",
 "caboclo": "Caboclo d'Agua: a friendly river spirit boy with brown skin, a leaf crown and a shell necklace, half inside a big blue wave of the Sao Francisco river. Companion: a spotted surubim fish jumping. Clearly separate shapes: the leaf crown, the water, the necklace, one open hand, a big water drop.",
 "caju": "Lenda do Caju: a smiling boy holding a big red-and-yellow cashew fruit with the gray nut hanging under it, next to a small cashew branch with leaves and a basket of cashews. Companion: a tiny common marmoset monkey. Clearly separate shapes: the cashew fruit, the nut, a leaf, the branch, the basket.",
 "maracatu": "Maracatu: a cheerful little Maracatu queen with a big golden crown and a wide purple cape decorated with big stars, holding a small doll (calunga). Companion: a big wooden drum (alfaia) with ropes. Clearly separate shapes: the crown, the drum, the cape, the doll, one big star.",
 "ciranda": "Ciranda: three happy children of different skin tones holding hands and dancing in a circle on a little sand patch, the girls with wide colorful skirts. Companion: a small red crab and a small coconut tree. Clearly separate shapes: the joined hands, one wide skirt, the coconut tree, the crab, a starfish.",
 "joaodebarro": "Joao-de-barro: a cute rufous hornero bird standing on a thick branch next to its round clay oven-shaped nest with a dark round doorway. Clearly separate shapes: the beak, the clay nest, the doorway, the branch, two big leaves.",
 "paidomato": "Pai do Mato: a tall thin friendly tree-man with brown bark skin and twig hair with small leaves, hugging a big jequitiba tree. Clearly separate shapes: the twig hair, the tree, one hand, one foot, a tuft of grass.",
 "tuiuiu": "Tuiuiu: a tall friendly jabiru stork with a white body, black head and neck, a red band at the base of the neck and a long black beak holding a small fish, standing next to its big nest of sticks. Companion: a small capybara. Clearly separate shapes: the beak, the red neck band, one wing, the fish, the nest.",
 "cavalhadas": "Cavalhadas: a smiling knight in a blue costume with a small golden crown riding a white horse decorated with colorful ribbons and flowers. Companion: a colorful festive ox-face mask (mascarado). Clearly separate shapes: the horse, one ribbon, the mask, the crown, one big flower.",
 "pequi": "Lenda do Pequi: a smiling Indigenous girl of the cerrado holding a round green pequi fruit cut open showing the bright yellow inside, next to a small basket of pequis and a twisted cerrado branch. Companion: a blue-and-yellow macaw (arara-caninde). Clearly separate shapes: the fruit, one leaf, the macaw, the branch, the basket.",
 "saci": "Saci-Perere: a cheerful Black Brazilian boy with ONLY ONE LEG (a single leg, no second leg anywhere), hopping, red pointed cap, red shorts, no pipe, next to a small whirlwind. Companion: a cute armadillo (tatu-bola) rolled into a ball. Clearly separate shapes: the red cap, the armadillo, the one foot, the shorts, the whirlwind.",
 "cuca": "Cuca: a funny green alligator lady (not scary) with a purple witch hat with a gold buckle, a purple dress, an orange belt, stirring a small bubbling cauldron. Clearly separate shapes: the hat, the cauldron, the belt, the tail, the open mouth.",
 "lobisomem": "Lobisomem: a cute fluffy orange-brown wolf puppy with huge ears and a big bushy tail, smiling with the tongue out, sitting under a small round full moon. Clearly separate shapes: one ear, the tail, the nose, one paw, the tongue.",
 "mula": "Mula sem Cabeca: a funny cute brown mule galloping, with soft cartoon orange flames where the head would be (no gore, very cute and funny), a saddle and a swishing tail, under a small crescent moon. Companion: three fireflies. Clearly separate shapes: the flames, one hoof, the tail, the saddle, a firefly.",
 "junina": "Festa Junina: a boy and a girl in checkered festa junina clothes and straw hats with patches, dancing, next to a small campfire, under a short string of colorful paper flags, with a corn cob and a bowl of popcorn. Clearly separate shapes: a straw hat, the corn cob, one paper flag, the campfire, the popcorn.",
 "boitata": "Boitata: a big friendly fire snake with ONE head and huge glowing yellow eyes, the body made of big orange and yellow flame shapes, coiled. Companion: a jaguar cub watching. Clearly separate shapes: the snake head, one eye, one flame, the jaguar, the tail.",
 "gralha": "Gralha-azul: an azure jay bird (bright blue body, black head and black crest) burying a pine nut (pinhao) in a small mound of brown earth, with a young araucaria pine seedling growing beside it. Clearly separate shapes: the pine nut, one wing, the beak, the little araucaria, the earth mound.",
 "teiniagua": "Teiniagua: a magical friendly green lizard princess with a shining red ruby on her head, at the entrance of a small sparkly cave. Companion: a gaucho boy with a hat and a red scarf looking amazed. Clearly separate shapes: the ruby, the cave, the boy's hat, the lizard tail, one sparkle star.",
 "ervamate": "Lenda da Erva-mate: a smiling Guarani girl (Yari) holding a branch of yerba mate with shiny green leaves, beside a kind old grandfather holding a gourd (cuia) with a metal straw (bomba). Clearly separate shapes: one big leaf, the gourd, the grandfather, a small tree, one white flower.",
 "grupo": "Festa do Folclore (final challenge, may have up to 70 color areas): six famous characters dancing together in ONE simple circle, holding hands or wings, nothing else: Curupira (boy with orange flame hair, his feet turned BACKWARDS: heels toward the viewer, toes pointing behind him), Iara (mermaid sitting on a small rock), Bumba meu Boi (smiling ox with a colorful star blanket), Tuiuiu (tall jabiru stork with a red neck band), Saci (Black boy with ONE leg and a red cap) and Boitata (friendly fire snake with one head). A short string of 5 big colorful paper flags above them. Each character clearly separate, no overlapping crowd.",
 "capa": "Game cover (NOT a coloring page: fully colored, same flat cartoon style and thick outlines): Saci, Curupira, Iara, Bumba meu Boi and a little girl painter with a big brush painting a giant map of Brazil together, colorful paint splashes, an empty light sky area in the upper third for the title. No text.",
}

# textos das telas que ainda não existem (rascunho para aprovar/editar na mesa)
RASCUNHOS = {
 "caju": {"uf": "rn", "adv": "O que é, o que é? Sou uma fruta amarela ou vermelha, e a minha castanha fica pendurada do lado de fora!",
   "fala": "Oxente! Eu sou o menino do Caju! A minha castanha mora do lado de fora, visse?",
   "lenda": "No Rio Grande do Norte tem o maior cajueiro do mundo: ele é tão grande que parece uma floresta inteira! Do caju a gente faz suco, doce e ainda come a castanha torradinha.",
   "palavras": [["CA-JU", "🍎"], ["CAS-TA-NHA", "🌰"], ["FO-LHA", "🍃"], ["GA-LHO", "🪵"], ["CES-TA", "🧺"]],
   "fig": [["SA-GUI", "O sagui é um macaquinho do tamanho de uma mão! Ele adora comer frutas e pular de galho em galho."]],
   "rima": {"w": "CAJU", "ok": ["CANGURU", "🦘"], "no": [["BOLA", "⚽"], ["CASA", "🏠"]]},
   "parlenda": ["Caju, cajuzinho, castanha pra fora,", "quem toma um suquinho sorri toda hora!", "Sagui pula, sagui come,", "debaixo do cajueiro ninguém passa fome!"]},
 "maracatu": {"uf": "pe", "adv": "O que é, o que é? Tenho rei, rainha, coroa dourada e um tambor que faz tum, tum, tum!",
   "fala": "Visse? Eu sou a Rainha do Maracatu! Escuta o batuque do meu tambor!",
   "lenda": "Em Recife, o Maracatu desfila no Carnaval com rei, rainha e uma bonequinha chamada calunga. Os tambores grandes, as alfaias, fazem o chão tremer de alegria!",
   "palavras": [["CO-RO-A", "👑"], ["TAM-BOR", "🥁"], ["CA-PA", "🟪"], ["BO-NE-CA", "🪆"], ["ES-TRE-LA", "⭐"]],
   "fig": [["AL-FAI-A", "A alfaia é um tambor grandão de madeira e couro. No Maracatu, muitas alfaias tocam juntas!"]],
   "rima": {"w": "TAMBOR", "ok": ["FLOR", "🌸"], "no": [["PEIXE", "🐟"], ["BOLA", "⚽"]]},
   "parlenda": ["Tum, tum, tum, bate o tambor,", "a rainha dança com o seu amor!", "Coroa dourada, capa de cetim,", "o Maracatu não tem fim!"]},
 "ciranda": {"uf": "pe", "adv": "O que é, o que é? É uma roda de mãos dadas que dança na beira do mar!",
   "fala": "Oxente! Vem pra Ciranda! Dá a mão e entra na roda!",
   "lenda": "Na Ilha de Itamaracá, as pessoas dançam a Ciranda na beira da praia: todo mundo de mãos dadas, numa roda bem grande, ao som da música e das ondas do mar.",
   "palavras": [["MÃO", "✋"], ["SAI-A", "👗"], ["CO-QUEI-RO", "🌴"], ["CA-RAN-GUE-JO", "🦀"], ["ES-TRE-LA", "⭐"]],
   "fig": [["CA-RAN-GUE-JO", "O caranguejo anda de lado! Ele mora no mangue e na areia da praia."]],
   "rima": {"w": "RODA", "ok": ["MODA", "👗"], "no": [["SAPO", "🐸"], ["LUA", "🌙"]]},
   "parlenda": ["Mão na mão, pé na areia,", "a ciranda roda e volteia!", "Onda vai, onda vem,", "na roda cabe mais alguém!"]},
 "tuiuiu": {"uf": "mt", "adv": "O que é, o que é? Sou uma ave bem alta, de pescoço vermelho e cabeça preta, e sou o símbolo do Pantanal!",
   "fala": "Trem bão! Eu sou o Tuiuiú, a ave do Pantanal!",
   "lenda": "Eu faço o meu ninho bem no alto das árvores, e ele é tão grande que caberia uma criança dentro! Quando a água do Pantanal sobe, eu pesco peixinhos com o meu bico comprido.",
   "palavras": [["BI-CO", "🐦"], ["PES-CO-ÇO", "🔴"], ["A-SA", "🪽"], ["PEI-XE", "🐟"], ["NI-NHO", "🪺"]],
   "fig": [["CA-PI-VA-RA", "A capivara é o maior roedor do mundo e adora nadar no Pantanal!"]],
   "rima": {"w": "TUIUIÚ", "ok": ["BAÚ", "🧰"], "no": [["CASA", "🏠"], ["FLOR", "🌸"]]},
   "parlenda": ["Tuiuiú, pescoço vermelho,", "se olha na água como num espelho!", "Bico comprido, asa de algodão,", "o Pantanal cabe no meu coração!"]},
 "cavalhadas": {"uf": "go", "adv": "O que é, o que é? Uma festa de cavaleiros de azul e de vermelho, com cavalos cheios de fitas!",
   "fala": "Trem bão! Eu sou o Cavaleiro das Cavalhadas! O meu cavalo é o mais enfeitado!",
   "lenda": "Em Pirenópolis, em Goiás, tem uma festa em que cavaleiros de azul e de vermelho fazem uma corrida de faz de conta. E tem os mascarados, com máscaras engraçadas de boi e de onça!",
   "palavras": [["CA-VA-LO", "🐎"], ["FI-TA", "🎀"], ["MÁS-CA-RA", "🎭"], ["CO-RO-A", "👑"], ["FLOR", "🌸"]],
   "fig": [["CA-VA-LO", "O cavalo consegue dormir em pé! E o potrinho já fica de pé logo depois de nascer."]],
   "rima": {"w": "CAVALO", "ok": ["GALO", "🐓"], "no": [["BOLA", "⚽"], ["SOL", "☀️"]]},
   "parlenda": ["Cavalinho enfeitado, fita de toda cor,", "azul de um lado, vermelho do outro, que amor!", "Galopa, galopa, pela praça a correr,", "na festa de Goiás todo mundo quer ver!"]},
 "pequi": {"uf": "go", "adv": "O que é, o que é? Sou uma fruta do Cerrado, amarelinha por dentro, e tenho espinhos escondidos no caroço!",
   "fala": "Trem bão! Eu sou a menina do Pequi! Cuidado: o meu caroço não pode morder!",
   "lenda": "No Cerrado tem uma árvore chamada pequizeiro. A fruta dela é verde por fora e amarelinha por dentro. Mas atenção: no caroço tem espinhos! Por isso a gente rói devagarinho, sem morder.",
   "palavras": [["FRU-TA", "🟡"], ["FO-LHA", "🍃"], ["A-RA-RA", "🦜"], ["GA-LHO", "🪵"], ["CES-TO", "🧺"]],
   "fig": [["A-RA-RA-CA-NIN-DÉ", "A arara-canindé é azul e amarela e fala bem alto! Ela pode viver mais de cinquenta anos."]],
   "rima": {"w": "PEQUI", "ok": ["JABUTI", "🐢"], "no": [["PEIXE", "🐟"], ["MESA", "🪑"]]},
   "parlenda": ["Pequi, pequi, amarelo e cheiroso,", "no arroz da vovó fica tão gostoso!", "Rói devagar, não pode morder,", "que o caroço tem espinho, viu, você?"]},
 "mula": {"uf": "es", "adv": "O que é, o que é? Sou uma mula que galopa à noite e, no lugar da cabeça, tenho uma chama de fogo!",
   "fala": "Hiiiin! Eu sou a Mula sem Cabeça! Não se assusta: o meu fogo é só de brincadeira!",
   "lenda": "Nas noites de lua, eu saio galopando pelos campos com uma chama no lugar da cabeça. Os meus cascos fazem toc, toc, toc! E os vaga-lumes adoram correr comigo.",
   "palavras": [["FO-GO", "🔥"], ["CAS-CO", "🐴"], ["RA-BO", "🐴"], ["SE-LA", "🟫"], ["VA-GA-LU-ME", "✨"]],
   "fig": [["VA-GA-LU-ME", "O vaga-lume acende uma luzinha na barriga para conversar com os amigos no escuro!"]],
   "rima": {"w": "MULA", "ok": ["PULA", "🦘"], "no": [["CASA", "🏠"], ["SOL", "☀️"]]},
   "parlenda": ["Toc, toc, toc, lá vem a Mula,", "sem cabeça ela corre e pula!", "Fogo de brincadeira, vaga-lume a brilhar,", "a Mula só quer galopar!"]},
 "junina": {"uf": "sp", "adv": "O que é, o que é? Uma festa com fogueira, bandeirinhas, quadrilha e muito milho!",
   "fala": "Uai, sô! Chegou a Festa Junina! Pega o chapéu de palha e vem dançar quadrilha!",
   "lenda": "Em junho tem Festa Junina! A gente se veste de caipira, dança quadrilha, enfeita tudo com bandeirinhas e come pamonha, pipoca e milho cozido perto da fogueira.",
   "palavras": [["CHA-PÉU", "👒"], ["MI-LHO", "🌽"], ["BAN-DEI-RI-NHA", "🚩"], ["FO-GUEI-RA", "🔥"], ["PI-PO-CA", "🍿"]],
   "fig": [["MI-LHO", "Cada espiga de milho tem centenas de grãos! Com milho a gente faz pipoca, pamonha e canjica."]],
   "rima": {"w": "MILHO", "ok": ["BRILHO", "✨"], "no": [["PATO", "🦆"], ["BOLA", "⚽"]]},
   "parlenda": ["Olha a chuva! É mentira!", "Quadrilha animada, todo mundo gira!", "Milho na brasa, bandeira no ar,", "na Festa Junina é bom de dançar!"]},
 "gralha": {"uf": "pr", "adv": "O que é, o que é? Sou um pássaro azul que planta pinheiros enterrando pinhões!",
   "fala": "Bah! Eu sou a Gralha-Azul! Já plantei uma floresta inteira!",
   "lenda": "Eu escondo pinhões na terra para comer depois... mas às vezes eu esqueço onde guardei! Aí o pinhão vira um pinheiro novo. Foi assim que eu ajudei a plantar as araucárias do Paraná.",
   "palavras": [["PI-NHÃO", "🌰"], ["A-SA", "🪽"], ["BI-CO", "🐦"], ["PI-NHEI-RO", "🌲"], ["TER-RA", "🟫"]],
   "fig": [["A-RAU-CÁ-RIA", "A araucária é um pinheiro que parece um guarda-chuva aberto. Ela pode viver mais de quinhentos anos!"]],
   "rima": {"w": "GRALHA", "ok": ["TOALHA", "🧻"], "no": [["SAPO", "🐸"], ["LUA", "🌙"]]},
   "parlenda": ["Gralha-azul, gralha-azul,", "planta pinheiro de norte a sul!", "Enterra um pinhão, esquece onde está,", "e uma araucária nasce lá!"]},
 "teiniagua": {"uf": "rs", "adv": "O que é, o que é? Sou uma lagartixa encantada com uma pedra vermelha brilhando na cabeça!",
   "fala": "Bah, tchê! Eu sou a Teiniaguá, a princesa encantada da Salamanca do Jarau!",
   "lenda": "Eu moro numa caverna cheia de brilhos no cerro do Jarau, no Rio Grande do Sul. Na minha cabeça tem um rubi mágico que brilha como fogo. Quem é corajoso e gentil pode ver a minha luz!",
   "palavras": [["PE-DRA", "💎"], ["CA-VER-NA", "🕳️"], ["CHA-PÉU", "🤠"], ["RA-BO", "🦎"], ["ES-TRE-LA", "⭐"]],
   "fig": [["LA-GAR-TI-XA", "A lagartixa anda na parede e até no teto! E se ela perder o rabo, nasce outro."]],
   "rima": {"w": "CAVERNA", "ok": ["LANTERNA", "🔦"], "no": [["SAPO", "🐸"], ["BOLA", "⚽"]]},
   "parlenda": ["Teiniaguá, rubi de fogo,", "brilha na caverna, brilha de novo!", "Lagartixa encantada, princesa do sul,", "seu brilho vermelho clareia o céu azul!"]},
 "ervamate": {"uf": "sc", "adv": "O que é, o que é? Sou uma folha verdinha que vira chimarrão na cuia dos gaúchos!",
   "fala": "Bah! Eu sou a Yari, a menina da erva-mate!",
   "lenda": "Conta uma lenda guarani que a menina Yari cuidava do avô com muito carinho. De presente, os dois ganharam uma planta mágica: a erva-mate, que reúne a família em volta da cuia.",
   "palavras": [["FO-LHA", "🍃"], ["CUI-A", "🧉"], ["VO-VÔ", "👴"], ["ÁR-VO-RE", "🌳"], ["FLOR", "🌼"]],
   "fig": [["ER-VA-MA-TE", "Com as folhas da erva-mate se faz o chimarrão do Sul, que é quentinho, e o tereré do Mato Grosso do Sul, que é geladinho!"]],
   "rima": {"w": "CUIA", "ok": ["MELANCIA", "🍉"], "no": [["PATO", "🦆"], ["SOL", "☀️"]]},
   "parlenda": ["Erva-mate, folhinha verde,", "na cuia quente ninguém se perde!", "Roda a cuia, passa pra mão,", "chimarrão é amizade e união!"]},
}

# palavras escondidas novas onde o desenho antigo tinha paisagem (sol, árvore, vento...) que não existe mais
PALAVRAS_NOVAS = {
 "saci": [["GOR-RO", "🧢"], ["TA-TU", "🛡️"], ["PÉ", "🦶"], ["CAL-ÇÃO", "🩳"], ["RE-DE-MOI-NHO", "🌪️"]],
 "caipora": [["POR-CO", "🐗"], ["A-RA-RA", "🦜"], ["PE-NA", "🪶"], ["CA-BE-LO", "💇"], ["FO-LHA", "🍃"]],
 "boitata": [["CO-BRA", "🐍"], ["O-LHO", "👁️"], ["FO-GO", "🔥"], ["ON-ÇA", "🐆"], ["RA-BO", "🔥"]],
 "fulozinha": [["CA-BE-LO", "💇"], ["VES-TI-DO", "👗"], ["PÉ", "🦶"], ["FLOR", "🌸"], ["PÁS-SA-RO", "🐦"]],
 "boi": [["ES-TRE-LA", "⭐"], ["FI-TA", "🎀"], ["MAN-TA", "🟥"], ["CHI-FRE", "🐂"], ["FO-CI-NHO", "🐮"]],
 "vitoria": [["FLOR", "🌸"], ["SA-PO", "🐸"], ["FO-LHA", "🍃"], ["GO-TA", "💧"], ["PÉ-TA-LA", "🌸"]],
}

# 9 pintoras: o Brasil é sobretudo pardo e branco, com muita gente preta, e também indígenas e descendentes de asiáticos
AVATARES = [
 {"k": "a1", "quem": "Parda, cabelo castanho cacheado e comprido, olhos castanhos", "fundo": "soft yellow",
  "p": "light brown (parda) skin, long voluminous curly brown hair, brown eyes"},
 {"k": "a2", "quem": "Negra, cabelo crespo black power volumoso, pele marrom escura", "fundo": "soft orange",
  "p": "dark brown skin, a big round afro (black power) hairstyle with a yellow headband, dark eyes"},
 {"k": "a3", "quem": "Branca, cabelo loiro liso curto (chanel com franja), olhos azuis", "fundo": "soft blue",
  "p": "fair skin, short straight blond bob haircut with bangs, blue eyes"},
 {"k": "a4", "quem": "Indígena, cabelo preto liso comprido com franja reta, colar de sementes", "fundo": "soft green",
  "p": "Indigenous Brazilian girl, warm brown skin, long straight black hair with straight bangs, a simple necklace of red and black seeds"},
 {"k": "a5", "quem": "Descendente de japoneses, cabelo preto liso curto com presilhas", "fundo": "soft pink",
  "p": "Japanese-Brazilian girl, light skin, short straight black hair with two colorful hair clips, dark eyes"},
 {"k": "a6", "quem": "Parda, cabelo escuro ondulado em duas tranças compridas", "fundo": "soft red",
  "p": "medium brown (parda) skin, dark wavy hair in two long braids with red ribbons, brown eyes"},
 {"k": "a7", "quem": "Negra, tranças box braids compridas com miçangas coloridas", "fundo": "soft purple",
  "p": "dark brown skin, long box braids with colorful beads at the ends, dark eyes"},
 {"k": "a8", "quem": "Branca, cabelo ruivo cacheado e curto", "fundo": "soft teal",
  "p": "fair skin, short curly red hair, green eyes, no freckles"},
 {"k": "a9", "quem": "Morena, cabelo castanho liso comprido em rabo de cavalo alto, óculos redondos", "fundo": "soft lilac",
  "p": "light brown skin, long straight brown hair in a high ponytail, round glasses, brown eyes"},
]

ORDEM_REG = ["norte", "nordeste", "centro", "sudeste", "sul", "especial"]
NOME_REG = {"norte": "Norte", "nordeste": "Nordeste", "centro": "Centro-Oeste", "sudeste": "Sudeste", "sul": "Sul", "especial": "Grande Desafio"}
