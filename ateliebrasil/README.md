# Ateliê Brasil

Jogo de pintar o folclore brasileiro, todo em português (pt-BR), para Julia e as primas Elisa, Yasmin e Valentina.
Mesmo motor do Julia Paint (`juliapaint/`), mas o museu virou uma **viagem pelo Brasil**: cada sala é uma região
(Norte → Nordeste → Centro-Oeste → Sudeste → Sul) e cada pintura é um personagem do folclore.

## Como funciona
- **Quem vai pintar?** Cada menina cria a sua pintora (até 8): toca em ＋, escreve o nome num teclado grande em CAIXA ALTA
  (sem sugestão; cada letra é falada: "jota", "u", "éle"...) e escolhe qualquer retrato da lista `AVATARES` (js/data.js).
  Ao entrar, o nome é soletrado com as letras acendendo. Para mais avatares: `kids/avatar-<chave>.jpg` + uma linha em `AVATARES`.
- **Perfis sem banco de dados:** tudo fica no `localStorage` do celular, com prefixo `atelie_<prima>_`
  (coisas do aparelho, como música e nomes, em `atelie_g_`). O jogo pede ao Chrome para não apagar os dados (`navigator.storage.persist`).
  No cantinho dos pais (⚙️) dá para guardar uma cópia em arquivo .json e restaurar em outro celular.
- **Chegada de cada região:** mapa do Brasil acendendo a região + jeito de falar (ÉGUA!, OXENTE!, TREM BÃO!, UAI!, BAH!).
- **Adivinha:** "O que é, o que é?" com 3 personagens para escolher. Só depois o personagem se apresenta,
  mostra no mapa o estado onde mora, conta a lenda curta e faz uma piada (algumas são próprias de cada prima, em `PIADAS`).
- **Pintar:** dois modos (copiar as cores / do meu jeito), pincel que mistura, copo d'água, mesa de misturar, gabarito.
  Cor certa revela a ilustração de verdade. Os nomes das cores aparecem em sílabas coloridas (VER-ME-LHO).
- **Palavras escondidas:** ao pintar um objeto aparece a palavra em sílabas e a voz lê devagar ("gor... ro... gorro!").
- **Cada personagem comemora do seu jeito:** a Iara toca uma nota a cada acerto, o Boitatá solta fogo, o Boi bate tambor,
  a Caipora assobia. O Curupira engana na primeira ajuda (as pegadas viradas para trás!).
- **Travessura do Saci:** um redemoinho rouba um pote de tinta (o lugar dele vira 🌪️ "sumiu!") e o Saci aparece com um balão;
  ela precisa pegar o Saci (ele foge uma vez). Se ela não pegar em 30 s, ele devolve sozinho.
  Sempre acontece no Sudeste e às vezes nas outras regiões, no máximo uma vez por pintura.
- **No final:** a 100% o personagem ganha vida → "Encontre!" (1 palavra) → "Monte o nome" com as sílabas →
  parlenda original lida com ritmo → "O que rima com...?" → figurinha nova para o **álbum** (bichos e plantas do Brasil).
- **Fantasias:** completar uma região dá um acessório para o avatar (flor da Iara, chapéu de vaqueiro, coroa das Cavalhadas,
  gorro do Saci, lenço gaúcho). Toque no retrato no topo do mapa para trocar.
- **Troféu:** "Guardiã do Folclore" na Festa do Folclore (última pintura, pede 100%). No dia 22 de agosto a abertura faz festa.

- **Janelas com moldura e barra de rolagem** (▲ ▼ e seta "TEM MAIS AQUI EMBAIXO") no final, no álbum, nas opções e na mesa de misturar.

- **Todas as regiões abertas.** O **Grande Desafio** fica numa sala especial: o **Mapa do Brasil** (uma área por estado, cor de cada região,
  palavras escondidas com o nome do estado) sempre aberto, e a **Festa do Folclore** (100%) só abre depois de pintar todos os outros.
- **Narração:** todo texto é lido em voz alta e tem um botão 🔈 pequeno para ouvir de novo.
- **Pintura livre de botões:** 💡 🔍 ✔️ ficam na barra de cima; "Encontre!" e "Monte o nome" aparecem no lugar da paleta, nunca sobre o desenho.

## Arquivos
```
index.html        telas e CSS
js/util.js        $, store/gstore (perfis no celular), silabasHTML, LETRA (nome falado de cada letra), cropHTML
js/data.js        PAINT (20 tintas com nome em sílabas), receitas de mistura, PERFIS (as primas), PIADAS
js/lendas.js      REGIOES e TELAS: adivinha, lenda, palavras escondidas, figurinhas, rima, parlenda, voz, efeitos
js/mapa.js        mapa do Brasil por estado (@svg-maps/brazil, CC BY 4.0)
js/music.js       músicas calmas (carimbó, ciranda, baião, toada, moda de viola, vaneira...), ambientes e voz pt-BR
js/app.js         o jogo
js/paginas.js     gerado: tamanho de cada página
tools/build_folk.py   gera as páginas de colorir
tools/preview_folk.py prévia em pages/_prev/
tools/build_mapa.py   gera a página do mapa do Brasil (desenha js/mapa.js no Chrome)
tools/build_crops.py  gera os recortes redondos (pages/c/) a partir das coordenadas de js/lendas.js
tools/build_site.py   monta dist/ e ateliebrasil.zip (ícones, avatares, manifest, service worker)
art/ kids/ pages/ dist/   fora do git
```

## Ilustrações novas
1. A imagem vem como "colorida | preto e branco" lado a lado (ou colorida em cima e traço embaixo); fundo branco vira papel. Salve em `art/<chave>.jpg` (só a metade colorida é usada;
   o corte entre as metades é achado sozinho).
2. Ponha a chave e o alvo de áreas em `JOBS` no `tools/build_folk.py` (40 a 70 para começar; a final tem 140).
3. `python3 tools/build_folk.py <chave>` e confira `python3 tools/preview_folk.py <chave>`.
4. Em `js/lendas.js`, troque o item `breve: 1` pelos dados do personagem (as coordenadas x,y vão de 0 a 1 na ilustração).
5. `python3 tools/build_site.py` e publique o `ateliebrasil.zip`.

Como funciona o `build_folk.py`: traço = pixels escuros e finos; cores chapadas agrupadas por k-means em Lab
(a pele fica uma cor só); áreas = mesma cor separadas pelo traço; as áreas pequenas e finas são juntadas à vizinha
de maior fronteira até chegar ao alvo; o nome da cor vem do grupo de cor que mais aparece na área (`kidcolor.py`).

## Pendências
- Refazer o **Saci** (está com duas pernas) e o **Curupira** (pés para a frente; precisam ser virados para trás).
- Ilustrações que faltam: Vitória-régia; Comadre Fulozinha, Lenda do Caju, Maracatu, Ciranda; Tuiuiú, Pé de Garrafa,
  Cavalhadas, Lenda do Pequi, Mãe do Ouro; Mula sem Cabeça, Festa Junina; Gralha-azul, Teiniaguá, Lenda da Erva-mate.
- Publicar no Netlify (ex.: `ateliebrasil.netlify.app`) e desligar a "Team protection".
