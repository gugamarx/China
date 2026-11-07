"""Elenco de vozes, modelos recomendados no Comfy Cloud e animações da cena (fonte do comfy/atelie_comfy.json).
Vozes: o nó ElevenLabs Voice Selector do Comfy só traz 9 vozes prontas (Adam, Antoni, Arnold, Bella, Domi, Elli, Josh, Rachel, Sam);
o sotaque vem da direção entre colchetes no começo do texto (Eleven v4/v3 seguem essas tags). Para mais vozes diferentes,
o Fish Audio Voice Selector aceita "custom" + o ID de qualquer voz do fish.audio (busque pelos termos indicados)."""

MODELOS = {
 "imagem": [
  {"modelo": "GPT-Image-2 (OpenAI, Partner Node)", "uso": "principal", "por que": "segue prompt longo com fidelidade e aceita imagem de referência: dá para travar o estilo usando a primeira tela aprovada como referência de todas as outras."},
  {"modelo": "Nano Banana Pro (Google, Partner Node)", "uso": "alternativa", "por que": "muito bom com imagens de referência e proporção 2:3; ótimo para refazer só um detalhe (\"feche o contorno do braço\")."},
  {"modelo": "Recraft V4 (Partner Node) + Recraft Vectorize", "uso": "plano B para áreas", "por que": "estilo de design chapado; o Vectorize transforma em SVG, com áreas perfeitamente fechadas e cores lisas."},
 ],
 "voz": [
  {"modelo": "ElevenLabs Text to Speech, eleven_v4", "uso": "personagens, lendas, adivinhas, parlendas", "por que": "o mais expressivo; segue tags de emoção e sotaque; maior salto de qualidade em português do Brasil.", "creditos_1k": 24.14},
  {"modelo": "ElevenLabs Text to Speech, eleven_v4_turbo", "uso": "falas curtas do jogo (acertos, avisos, cores, letras)", "por que": "metade do preço, mesma voz.", "creditos_1k": 12.07},
  {"modelo": "Fish Audio Text to Speech, s2.1-pro", "uso": "mais diversidade de vozes", "por que": "Voice Selector \"custom\" aceita qualquer voz da biblioteca fish.audio (há vozes brasileiras de várias regiões); bem mais barato.", "creditos_1k": 4.53},
 ],
 "regras_voz": [
  "Mesma voz (preset + tag) para tudo de um mesmo personagem: consistência.",
  "Sílabas: gere a palavra inteira de uma vez no formato 'gor... ro... gorro!' (sílaba solta isolada sai ruim em qualquer modelo).",
  "Vozes de criança: a ElevenLabs restringe criar/clonar voz infantil; use os timbres jovens (Elli, Josh) com a tag de energia.",
  "Não use vozes clonadas de pessoas famosas da biblioteca do Fish; prefira vozes originais ou a sua família, com permissão.",
  "Teste antes 3 falas (Curupira, Boi, Gralha) no ElevenLabs e no Fish e escolha de ouvido; só depois rode o lote todo.",
 ],
}

# preset = nome exato no ElevenLabs Voice Selector do Comfy (Rachel/Josh/Elli/Domi/Antoni/Arnold/Sam não existem lá: trocadas em nov/2026); tag = direção em inglês no começo do texto (eleven_v4/v3; tire no multilingual_v2)
VOZES = {
 "narradora": {"quem": "Narradora do jogo (adivinhas, parlendas, palavras, avisos)", "sotaque": "brasileiro neutro, de professora",
   "preset": "Matilda (female, american)", "tag": "[warm cheerful storyteller for small children, clear and unhurried, Brazilian Portuguese]", "fish": "narradora infantil português brasileiro"},
 "curupira": {"quem": "Curupira, menino travesso", "sotaque": "amazonense", "preset": "Liam (male, american)",
   "tag": "[playful young boy energy, quick and cheeky, Brazilian Portuguese with a northern Amazonas accent]", "fish": "amazonense / manauara jovem"},
 "iara": {"quem": "Iara, moça melodiosa", "sotaque": "paraense", "preset": "Bella (female, american)",
   "tag": "[sweet and melodic, almost singing, Brazilian Portuguese with a Pará accent]", "fish": "paraense feminina suave"},
 "boto": {"quem": "Boto, moço galante", "sotaque": "paraense", "preset": "Eric (male, american)",
   "tag": "[charming smooth gentleman, gentle, Brazilian Portuguese with a Pará accent]", "fish": "paraense masculina"},
 "caipora": {"quem": "Caipora, menina valente", "sotaque": "amapaense/paraense", "preset": "Jessica (female, american)",
   "tag": "[energetic brave little girl, whistles, Brazilian Portuguese with a northern Brazilian accent]", "fish": "nortista feminina jovem"},
 "vitoria": {"quem": "Vitória-régia, voz sonhadora", "sotaque": "amazonense", "preset": "Bella (female, american)",
   "tag": "[dreamy, soft and slow, Brazilian Portuguese with a northern Amazonas accent]", "fish": "amazonense feminina calma"},
 "mapinguari": {"quem": "Mapinguari, gigante bonzinho", "sotaque": "acreano", "preset": "Adam (male, american)",
   "tag": "[very deep, slow, big friendly giant, Brazilian Portuguese with a northern Brazilian accent]", "fish": "voz grave gigante nortista"},
 "matinta": {"quem": "Matinta Perera, vovó misteriosa", "sotaque": "paraense", "preset": "Laura (female, american)",
   "tag": "[old grandmother, a little crackly, warm and mysterious, Brazilian Portuguese with a Pará accent]", "fish": "vovó paraense"},
 "boi": {"quem": "Bumba meu Boi, alegre e grandão", "sotaque": "maranhense", "preset": "Brian (male, american)",
   "tag": "[jolly, booming and festive, Brazilian Portuguese with a Maranhão accent]", "fish": "maranhense masculina"},
 "fulozinha": {"quem": "Comadre Fulozinha, menina sapeca", "sotaque": "pernambucano", "preset": "Jessica (female, american)",
   "tag": "[mischievous giggly girl, Brazilian Portuguese with a Pernambuco accent]", "fish": "pernambucana jovem"},
 "caboclo": {"quem": "Caboclo d'Água, homem do rio", "sotaque": "baiano do sertão", "preset": "Callum (male, american)",
   "tag": "[calm, slightly raspy river man, Brazilian Portuguese with a Bahia sertão accent]", "fish": "baiano sertanejo"},
 "caju": {"quem": "Menino do Caju", "sotaque": "potiguar", "preset": "Liam (male, american)",
   "tag": "[cheerful boy, Brazilian Portuguese with a Rio Grande do Norte accent]", "fish": "potiguar nordestino jovem"},
 "maracatu": {"quem": "Rainha do Maracatu", "sotaque": "recifense", "preset": "Laura (female, american)",
   "tag": "[proud regal queen, rhythmic, Brazilian Portuguese with a Recife accent]", "fish": "recifense feminina"},
 "ciranda": {"quem": "Cirandeira", "sotaque": "pernambucano", "preset": "Bella (female, american)",
   "tag": "[joyful woman inviting everyone to dance, Brazilian Portuguese with a Pernambuco accent]", "fish": "pernambucana alegre"},
 "joaodebarro": {"quem": "João-de-barro, trabalhador animado", "sotaque": "sul-mato-grossense (r caipira)", "preset": "Eric (male, american)",
   "tag": "[cheerful hard-working man, Brazilian Portuguese with a Mato Grosso do Sul countryside accent and rolled caipira r]", "fish": "sul-mato-grossense caipira"},
 "paidomato": {"quem": "Pai do Mato, velho sábio", "sotaque": "mato-grossense", "preset": "Adam (male, american)",
   "tag": "[old wise man, slow and calm, Brazilian Portuguese with a Mato Grosso accent]", "fish": "cuiabano idoso"},
 "tuiuiu": {"quem": "Tuiuiú, ave orgulhosa", "sotaque": "pantaneiro", "preset": "Brian (male, american)",
   "tag": "[tall proud bird, calm, Brazilian Portuguese with a Pantanal Mato Grosso accent]", "fish": "pantaneiro"},
 "cavalhadas": {"quem": "Cavaleiro das Cavalhadas", "sotaque": "goiano", "preset": "Liam (male, american)",
   "tag": "[brave young knight, Brazilian Portuguese with a Goiás countryside accent and caipira r]", "fish": "goiano jovem"},
 "pequi": {"quem": "Menina do Pequi", "sotaque": "goiano", "preset": "Jessica (female, american)",
   "tag": "[sweet girl, Brazilian Portuguese with a Goiás accent and caipira r]", "fish": "goiana jovem"},
 "saci": {"quem": "Saci, o mais travesso", "sotaque": "mineiro", "preset": "Liam (male, american)",
   "tag": "[giggly mischievous boy, fast, laughs hihihi, Brazilian Portuguese with a Minas Gerais accent]", "fish": "mineiro jovem"},
 "cuca": {"quem": "Cuca, bruxa engraçada", "sotaque": "caipira paulista", "preset": "Laura (female, american)",
   "tag": "[raspy, funny and theatrical witch, Brazilian Portuguese with a São Paulo countryside caipira accent]", "fish": "caipira paulista feminina"},
 "lobisomem": {"quem": "Lobisomem, tímido e fofo", "sotaque": "mineiro", "preset": "Callum (male, american)",
   "tag": "[shy, a little gruff but sweet, Brazilian Portuguese with a Minas Gerais accent]", "fish": "mineiro grave"},
 "mula": {"quem": "Mula sem Cabeça, brincalhona", "sotaque": "capixaba", "preset": "Bella (female, american)",
   "tag": "[playful, laughing like a neigh, Brazilian Portuguese with an Espírito Santo accent]", "fish": "capixaba feminina"},
 "junina": {"quem": "Puxador da quadrilha", "sotaque": "caipira paulista", "preset": "Eric (male, american)",
   "tag": "[festive square-dance caller, Brazilian Portuguese with a São Paulo caipira accent]", "fish": "caipira quadrilha"},
 "boitata": {"quem": "Boitatá, protetor", "sotaque": "gaúcho", "preset": "Adam (male, american)",
   "tag": "[deep, warm and protective, Brazilian Portuguese with a gaúcho Rio Grande do Sul accent]", "fish": "gaúcho"},
 "gralha": {"quem": "Gralha-azul, falante", "sotaque": "paranaense", "preset": "Bella (female, american)",
   "tag": "[bright and chatty, Brazilian Portuguese with a Paraná accent]", "fish": "paranaense / curitibana"},
 "teiniagua": {"quem": "Teiniaguá, princesa encantada", "sotaque": "gaúcho", "preset": "Laura (female, american)",
   "tag": "[mysterious enchanted princess, gentle, Brazilian Portuguese with a gaúcho accent]", "fish": "gaúcha feminina"},
 "ervamate": {"quem": "Yari, menina guarani", "sotaque": "catarinense", "preset": "Jessica (female, american)",
   "tag": "[sweet calm girl, Brazilian Portuguese with a Santa Catarina accent]", "fish": "catarinense jovem"},
}

# animações: elementos da cena padrão (sempre no mesmo lugar) e um item grande por tela
ANIM_CENA = [
 {"elemento": "sol", "onde": "canto superior direito, amarelo", "ao_pintar": "amarelo", "efeito": "os raios giram devagar e o sol pulsa; som de brilho"},
 {"elemento": "nuvem", "onde": "canto superior esquerdo, branca", "ao_pintar": "qualquer cor", "efeito": "flutua de lado bem devagar; sopro de vento"},
 {"elemento": "montanha", "onde": "horizonte, atrás do personagem", "ao_pintar": "verde", "efeito": "um passarinho cruza o céu; eco"},
 {"elemento": "céu", "onde": "fundo", "ao_pintar": "azul-claro", "efeito": "brilhinhos rápidos"},
]
ANIM_TELA = {
 "curupira": ["cabelo de fogo", "tremula"], "iara": ["cauda", "balança"], "boto": ["onda", "balança"], "caipora": ["pena", "balança"],
 "vitoria": ["sapo", "pula"], "mapinguari": ["olho", "pisca"], "matinta": ["pássaro", "bate asas"], "boi": ["fita", "balança"],
 "fulozinha": ["cabelo", "balança"], "caboclo": ["água", "balança"], "caju": ["caju", "pula"], "maracatu": ["tambor", "treme no ritmo"],
 "ciranda": ["saia", "gira"], "joaodebarro": ["porta da casinha", "pisca"], "paidomato": ["árvore", "balança"], "tuiuiu": ["peixe", "pula"],
 "cavalhadas": ["fita", "balança"], "pequi": ["arara", "bate asas"], "saci": ["redemoinho", "gira"], "cuca": ["caldeirão", "borbulha"],
 "lobisomem": ["rabo", "abana"], "mula": ["fogo", "tremula"], "junina": ["fogueira", "tremula"], "boitata": ["fogo", "tremula"],
 "gralha": ["pinhão", "pula"], "teiniagua": ["rubi", "pisca"], "ervamate": ["folha", "balança"], "grupo": ["bandeirinhas", "balançam"],
}
EFEITOS = {"tremula": "treme de leve, como chama", "balança": "balança 3 a 5 graus", "pula": "pulinho de 6 px", "pisca": "brilha e apaga",
           "gira": "gira devagar", "borbulha": "bolhinhas sobem", "bate asas": "sobe e desce de leve", "abana": "balança rápido",
           "treme no ritmo": "treme no compasso da música", "balançam": "balançam em onda"}

# Modelo ElevenLabs de cada personagem (decisão de nov/2026, depois do teste com as 28 vozes):
#  v3     = o mais expressivo: risada, canto, teatro, rosnado, voz de vovó.     ~51 créditos / 1 mil letras
#  v4     = o mais estável e claro: sotaque marcado em falas calmas e lendas.    ~24
#  v4 turbo = mesma voz, metade do preço: personagens jovens de fala simples e falas curtas do jogo.  ~12
MODELO_VOZ = {
 "narradora": "eleven_v4",
 # Norte
 "curupira": "eleven_v3", "iara": "eleven_v3", "caipora": "eleven_v3", "matinta": "eleven_v3",
 "boto": "eleven_v4", "vitoria": "eleven_v4", "mapinguari": "eleven_v4",
 # Nordeste
 "boi": "eleven_v3", "fulozinha": "eleven_v3", "maracatu": "eleven_v3",
 "caboclo": "eleven_v4", "ciranda": "eleven_v4", "caju": "eleven_v4_turbo",
 # Centro-Oeste
 "joaodebarro": "eleven_v4", "paidomato": "eleven_v4", "tuiuiu": "eleven_v4",
 "cavalhadas": "eleven_v4_turbo", "pequi": "eleven_v4_turbo",
 # Sudeste
 "saci": "eleven_v3", "cuca": "eleven_v3", "lobisomem": "eleven_v3", "mula": "eleven_v3", "junina": "eleven_v4_turbo",
 # Sul
 "boitata": "eleven_v4", "teiniagua": "eleven_v4", "ervamate": "eleven_v4", "gralha": "eleven_v4_turbo",
}
