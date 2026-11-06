# Jogos da Julia: o que foi feito e o plano do jogo de Folclore

> Documento de passagem para a próxima sessão. Ele cobre o que existe no repositório `gugamarx/China`
> (branch `claude/kids-puzzle-memory-app-n7rzyl`), como funciona, o que aprendemos e o **plano do novo jogo
> "Folclore Paint"**, todo em português brasileiro.
> Leia também o `CLAUDE.md` na raiz, com os padrões gerais (rodapé de 64px, fotos fora do git, Netlify etc.).

---

## 1. Visão geral dos sites publicados

| Pasta | Site | O que é |
|---|---|---|
| `julia/` | julia-china-trip.netlify.app | memória e quebra-cabeça com fotos da viagem à China |
| `pink/` | julia-pink.netlify.app | 6 minijogos rosa com fotos da Julia |
| `jujujump/` | jujujump.netlify.app | mundo de ilhas com 11 jogos (inglês e chinês) e casa do Panda |
| `juliapaint/` | juliapaint · elisapaint · yasminpaint · valentinapaint .netlify.app | **jogo de pintar obras famosas** (a base do novo jogo) |

Público: Julia, 6 anos, Android com Chrome e atalho na tela inicial. As sobrinhas Elisa, Yasmin e Valentina têm cada uma o seu site.

---

## 2. Julia Paint v3: como funciona (o molde a reaproveitar)

### 2.1 Arquivos
```
juliapaint/
  index.html          telas (splash, museu, pintor, pintura, overlays) + todo o CSS
  js/util.js          $, store (localStorage com prefixo por criança), pyHTML, cartoonSVG (pintor desenhado em SVG)
  js/data.js          PAINT (20 tintas), BASE (5 primárias), RECIPES/mix() (misturas), PAINTERS, COUNTRY
  js/art3.js          as 25 obras: chave, título, pintor, música, ambiente, fala, palavras escondidas, efeito "ganhar vida"
  js/kid.js           CONFIG POR CRIANÇA: nome, nome em chinês, capa, piadas por obra
  js/music.js         músicas chiptune (temas em notação "E5.2"), ambientes, efeitos e Voice (TTS)
  js/app.js           museu, pintor, motor de pintura, mesa de misturar, gabarito, final, cerimônia, opções
  tools/build_v3.py   gera as páginas de colorir a partir das obras (art2/<chave>.jpg -> pages3/)
  tools/kidcolor.py   nomeia as cores "como criança" (por matiz, com variação clara e escura)
  tools/build_kids.py gera dist/<criança>/ (capa, ícone, manifest e service worker próprios)
  art2/ pages3/ kids/ painters/ dist/   fora do git (repo público; imagens só vão para o Netlify)
```

### 2.2 Gerar as páginas de colorir (`tools/build_v3.py`)
Para cada obra, ele gera:
- `pages3/<k>.png`: mapa de regiões em 16 bits (id = R + 256·G). Até cerca de 200 áreas.
- `pages3/<k>.lines.jpg`: **o traço do próprio artista** (diferença de gaussianas), desenhado por cima a ~40%.
- `pages3/<k>.orig.jpg`: a obra no tamanho da página. Aparece quando a criança acerta a cor.
- `pages3/<k>.json`: `{w,h,cols,regions:[{id,c,ok?,x,y,r,a,lock?}]}`, onde `c` é a cor-alvo e `ok` a cor alternativa aceita.

O tamanho de cada página fica em `JOBS` (alvo de áreas por obra: de 9 no Mondrian a 198 no Arcimboldo). O algoritmo:
1. mean-shift, para suavizar;
2. classificação de cor "infantil" (`kidcolor.py`);
3. filtro de moda;
4. absorve as áreas pequenas até atingir o alvo.

Lições:
- Distância Lab pura gera cores "lamacentas" (o cavalo azul virava cinza). Classificar **por matiz** resolveu.
- Moldura ou parede na foto da obra precisa ser recortada antes (aconteceu com Senecio e Malevich).

### 2.3 Mecânicas que funcionaram (reaproveitar todas)
- **Museu em 5 salas**, que abrem de 5 em 5. Só concluir já libera a próxima. Só as 2 últimas exigem 100% de cópia, com mensagem em português e medalha e troféu no final.
- **O artista chega** (retrato cartoon gerado ou SVG de reserva), cumprimenta, diz o país em 3 línguas e conta uma curiosidade. Mostra "as minhas cores", com a receita das que ela ainda não descobriu.
- **Dois modos:** 🎯 copiar as cores e 🌈 do meu jeito.
- **A cor certa revela a obra verdadeira** (pincelada real e ✨). A errada fica tinta lisa. **Aos 100%, a obra ganha vida** (hop, sway, zoom, wink, twinkle, swim).
- **Pintar arrastando o dedo.** Com dois dedos, zoom e mover. Desfazer volta o traço inteiro.
- **Pincel sujo realista:** cor sobre cor mistura no pincel. O 💧 copo d'água limpa e vai ficando turvo. A 🥣 mesa de misturar tem duas gotas que giram e o **livro de receitas**. Cada cor nova vira uma descoberta com festa.
- **Palavras escondidas:** ao pintar um objeto, ele aparece com emoji, nome e voz. No final, a missão **"Encontre!"** pede para ela achar 2 objetos.
- **💡 Ajuda:** pisca uma área que falta pintar e diz a cor. O **gabarito** é arrastável, com ✕, e fecha tocando fora.
- **"I'm done!"** termina quando ela quiser. A tela final sugere a **próxima obra**.
- **Cerimônia:** 🏅 medalha e 🏆 troféu com ovação. Tem cantinho dos pais e reset de progresso nas ⚙️ opções.

### 2.4 Lições de UX e áudio (pedidos do Gustavo)
- **Uma voz e um efeito de cada vez:** `Voice.talk([[texto, lang], ...])` cancela o que estava falando. `Audio8.fx` faz o efeito novo cortar o anterior. A sobreposição era "chatíssima".
- **Música calma:** seno/triângulo, sem bateria, 22% mais lenta, eco leve e volume baixo (0.05). A primeira versão, alta e monótona, foi reprovada.
- **Interface simples:** botões grandes, poucos por linha, setinhas ◀ ▶ piscando na paleta que rola, e o nome da cor sempre visível ao lado do pincel.
- **Rodapé de 64px livre** para o selo "Powered by Netlify". Nada clicável fica ali.
- **Toque durante a transição** já quebrou a tela. Hoje `UI.go` retorna `false` quando está ocupado e as telas checam isso.
- Testar sempre no Playwright com Pixel 7. Em `page.evaluate`, não retornar promessas que esperam toque, senão o teste trava.

### 2.5 Infraestrutura
- **Netlify:** o token do Gustavo está como segredo de rede do ambiente "China" (o proxy injeta, não aparece aqui). O deploy é por zip pela API:
  `POST /api/v1/sites` com `{"name":...}` e depois `POST /api/v1/sites/<id>/deploys` com o zip.
  - **Todo site novo vem com "Team protection" ligada** (`sso_login`). O Gustavo precisa desligar à mão em Site configuration → Access & security → Public. Não tenho permissão para desligar.
  - Plano grátis: 300 créditos por mês, cerca de 15 por deploy. Juntar mudanças antes de publicar.
- **Wikimedia:** os hosts `commons`, `upload` e `thumb.wikimedia.org` estão liberados no ambiente. Usar só tamanhos padrão de miniatura (`1280px-`). A API limita muito (erro 429), então fazer pausas de 6 a 8 segundos e tentar de novo. Quando falha, pedir ao Gustavo que mande os arquivos pelo chat.
- **Retratos cartoon:** `mcp__HuggingFace__gr1_z_image_turbo_generate`. A cota grátis acaba depois de uns 6 retratos por dia.
  Estilo que funcionou: *"Cute cartoon caricature of ... big head small body, thick outlines, bright colors, sticker style, plain white background, full body"* (mais "fully clothed", para não sair sem roupa).
- **Várias crianças:** tudo que é pessoal fica em `js/kid.js`. `python3 tools/build_kids.py <kid>` gera a pasta pronta, com o progresso separado por prefixo (`paint_<kid>_`).

---

## 3. NOVO JOGO: Folclore Paint (só em português brasileiro)

### 3.1 Ideia
O mesmo molde do Julia Paint, mas o museu vira uma **viagem pelo Brasil**. Cada **sala é uma região**, e cada "obra" é a **ilustração de um personagem ou lenda do folclore**. O personagem chega, se apresenta, propõe uma **adivinha** e conta a lenda em 20 segundos. A criança pinta, e ao acertar as cores o personagem **ganha vida** (o Saci pula num pé só, a Iara canta, o Boitatá brilha).

**Nomes possíveis:**
- **Julia e o Saci Pintor**
- **Pinta Brasil!**
- **Folclorinho**
- **Ateliê do Saci**
- **Juju no Folclore**

Sugiro "**Ateliê do Saci**", com o Saci como mascote travesso no lugar do Panda. Para as sobrinhas, segue o padrão de antes: "Elisa no Folclore" etc., usando o mesmo `kid.js`.

### 3.2 Salas = regiões do Brasil (5 × 5 = 25 telas)
Cada sala tem um mapa do Brasil acendendo a região, uma música regional calma em chiptune e um som ambiente:

| Sala | Região | Personagens e lendas | Música | Ambiente |
|---|---|---|---|---|
| 1 | **Sudeste** (começo, mais fácil) | Saci · Mula sem Cabeça · Cuca (versão fofa) · Lobisomem (fofo) · Festa Junina | moda de viola, ciranda | grilos, fogueira |
| 2 | **Sul** | Negrinho do Pastoreio · Boitatá · Salamanca do Jarau · Gralha-azul e o pinhão · Chimarrão | vaneira, chula | vento dos pampas, gralhas |
| 3 | **Nordeste** | Comadre Fulozinha · Bumba meu Boi · Lampião e Maria Bonita (cordel) · Lenda do Cajueiro · Papa-figo (fofo) | baião, forró, xote | sanfona, chocalho |
| 4 | **Centro-Oeste** | Lenda do Pantanal (tuiuiú) · Pé de Garrafa · Cavalhadas · Lenda do Pequi · Mãe do Ouro | cururu, siriri | araras, água do Pantanal |
| 5 | **Norte** (final) | Curupira · Iara · Boto Cor-de-Rosa · Vitória-régia · **Lenda do Guaraná** e **Boitatá da Amazônia** (os dois "chefões", que pedem 100%) | carimbó, boi de Parintins | chuva da Amazônia, sapos |

Ajustar a lista à vontade: há mais de 30 opções. Evitar o tom assustador: Cuca, Lobisomem e Mula aparecem **fofos e engraçados**. Lendas religiosas, como as de orixás, só entram se o Gustavo quiser.

### 3.3 Imagens (o desafio principal)
Não existem "quadros famosos" de domínio público para cada lenda, e mesmo as ilustrações históricas ainda têm direitos. Opções:
1. **Gerar ilustrações próprias** num estilo único de livro infantil brasileiro, com cores chapadas, contorno preto e fundo com a paisagem da região. Pode ser pelo HuggingFace Z-Image (cota de cerca de 6 por dia) ou pelo gerador que o Gustavo usou nas capas. É o mais recomendado: estilo coerente, ótimo para colorir e sem problema de direitos.
   Prompt base: *"Children's book illustration of the Brazilian folklore character SACI-PERERÊ, cute, one-legged boy with red cap and pipe-less (no smoking), jumping in a coffee farm, flat bold colors, thick clean black outlines, simple large shapes, no text"*.
   Dica: pedir **contornos grossos e áreas grandes**, porque o `build_v3.py` aproveita isso muito melhor do que pintura com textura.
2. Complementar com **obras de domínio público** com tema brasileiro, como Debret, Rugendas e Almeida Júnior (*Caipira picando fumo*), como "obras bônus" no museu.
3. O Gustavo pode mandar as imagens pelo chat, como fez com as obras.

**Atenção:** o Saci tradicional fuma cachimbo. Na versão infantil, trocar por **assobio** ou **flauta**.

### 3.4 Aprender sem perceber (foco: alfabetização em português)
Para 6 anos, em fase de alfabetização:
- **LETRA BASTÃO (CAIXA ALTA)** em todos os textos curtos, como as escolas usam no início.
- **Palavras escondidas com sílabas:** ao pintar o gorro, aparece **🧢 GOR-RO** com as sílabas coloridas, e a voz lê devagar: "gor... ro... GORRO!". No "Encontre!", ela também pode montar a palavra arrastando as sílabas (molde do Word Builder do Juju Jump).
- **Adivinhas na chegada do personagem:** *"O que é, o que é? Tenho uma perna só, gorro vermelho e adoro fazer redemoinho!"* Aparecem 3 personagens para ela tocar, e só depois o personagem se revela.
- **Parlendas, quadrinhas e trava-línguas** como prêmio no final, lidos com ritmo. Por exemplo, *"O Saci não sabe assobiar / sem o seu gorrinho pra ajudar"* (melhor criar parlendas próprias).
- **Rimas:** "IARA rima com ARARA!". Um minijogo opcional de rimas durante a missão "Encontre!".
- **Bichos e plantas do Brasil:** tuiuiú, onça, boto, vitória-régia, pequi, caju, guaraná, açaí, pinhão. Cada um entra num **álbum de figurinhas**.
- **Geografia leve:** o mapa acende a região e o estado ("O Boto mora no AMAZONAS!").
- **Valores:** o Curupira protege a floresta. Por exemplo, a criança "apaga queimadas" pintando de verde.
- **Jeitos de falar:** "Bah!" (Sul), "Oxente!" (Nordeste), "Uai!" (Minas), "Égua!" (Pará). Cada personagem fala o seu.

### 3.5 Vozes divertidas, todas em pt-BR
- `speechSynthesis` com `pt-BR`, variando `pitch` e `rate` por personagem:
  - Saci: agudo e rápido (pitch 1.8, rate 1.15).
  - Boto: grave e charmoso (0.7).
  - Cuca: rouquinha e engraçada (0.6, rate 0.9).
  - Iara: suave e cantada (1.3, rate 0.85).
  - Curupira: animado e "de trás pra frente". Uma piada: ele fala uma palavra invertida e a criança descobre ("ÍCAS... SACI!").
- **Narrador/mascote:** o Saci, que aparece de surpresa no canto, ri e faz travessuras.
- Opcional, de melhor qualidade: gerar **áudios prontos** (mp3) com um TTS infantil e fazer o cache offline no service worker. Isso pede ferramenta externa, então combinar com o Gustavo.
- Manter a regra: **uma fala por vez**, sempre usando `Voice.talk`.

### 3.6 Surpresas e risadas (mecânicas novas)
- **Travessura do Saci:** de vez em quando um redemoinho 🌪️ passa e **esconde um pote de tinta**. Ela toca no Saci para pegar de volta, e ele ri "Hihihi!". No máximo uma vez por quadro, para não irritar.
- **Pegadas do Curupira ao contrário:** no quadro dele, a ajuda 💡 aponta para o lado errado e depois vira, com a voz: "Te enganei!".
- **O Boitatá acende:** no quadro dele, a parte pintada certa ganha brilho de fogo.
- **A Iara canta** uma notinha a cada área certa no rio.
- **Ganhar vida aos 100%:** o Saci pula num pé só e some num redemoinho, o Boto vira moço de chapéu e volta a ser boto, a vitória-régia abre, o Boi dança.
- **Fantasias:** no final de cada sala, ela ganha um acessório para vestir a própria foto ou avatar (gorro do Saci, chapéu de cangaceiro, cocar de penas de papel).
- **Troféu final:** 🏆 "**GUARDIÃ DO FOLCLORE**", com fogos, aplausos e a voz "Parabéns! Você conhece o Brasil inteirinho!". **22 de agosto, Dia do Folclore**, pode ter uma surpresa especial.

### 3.7 O que reaproveitar do código
1. Copiar `juliapaint/` para `folclore/`. Trocar `art3.js` por `lendas.js`: personagem, região, adivinha, lenda curta, palavras com sílabas, parlenda, voz e efeito de ganhar vida.
2. `PAINTERS` vira `PERSONAGENS` (voz pt-BR com pitch e rate próprios). `COUNTRY` vira **estado e região**.
3. Remover o chinês e o inglês, e criar `silabasHTML("GOR-RO")` no lugar de `pyHTML`.
4. Músicas novas em `music.js` (baião, xote, carimbó, ciranda, vaneira, moda de viola), todas calmas e em seno/triângulo.
5. Ambientes: `rain`, `birds`, `crickets` e `wind` já existem. Criar `sanfona`, `fogueira`, `araras` e `sapos`.
6. `build_v3.py` funciona igual: colocar as ilustrações em `art2/<chave>.jpg` e ajustar os `JOBS`.
7. `build_kids.py` para gerar Julia, Elisa, Yasmin e Valentina.
8. Publicar em um site, por exemplo `ateliedosaci.netlify.app`, ou um por criança. Lembrar o Gustavo de desligar a proteção.

### 3.8 Ordem de trabalho sugerida
1. Fechar com o Gustavo **o nome, a lista de 25 personagens e o estilo das imagens** (gerar 3 de teste).
2. Gerar ou receber as 25 ilustrações. Rodar o `build_v3.py` e revisar a prévia (`tools/preview_v3.py`).
3. Montar `lendas.js` com adivinhas, sílabas, parlendas e vozes.
4. Adaptar o `app.js`: adivinha na chegada, sílabas, travessura do Saci, mapa das regiões e troféu.
5. Testar no Pixel 7 com o Playwright, publicar e pedir ao Gustavo que desligue a proteção do Netlify.
