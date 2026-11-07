"""Gera PROMPTS.md (um prompt pronto por tela e por avatar) e mesa/mesa.html (mesa de decisões: textos para editar/aprovar,
espaço para as imagens, decisões de arte e de voz; exporta um JSON para colar no chat).
uso: python3 tools/build_mesa.py"""
import os, sys, json, subprocess
sys.path.insert(0, os.path.dirname(__file__))
from arte_spec import TAM, BASE, BASE_LADO, BASE_AVATAR, ART, AVATARES, ORDEM_REG, NOME_REG
from textos_v2 import T as TX
from comfy_spec import VOZES
UF_RASCUNHO = {"caju": "rn", "maracatu": "pe", "ciranda": "pe", "tuiuiu": "mt", "cavalhadas": "go", "pequi": "go", "mula": "es", "junina": "sp", "gralha": "pr", "teiniagua": "rs", "ervamate": "sc"}

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
js = r'''const fs=require("fs");const g=s=>s.replace(/^(const|let) /gm,"global.");const R=process.argv[1];
eval(g(fs.readFileSync(R+"/js/data.js","utf8")));eval(g(fs.readFileSync(R+"/js/mapa.js","utf8")));eval(g(fs.readFileSync(R+"/js/lendas.js","utf8")));
console.log(JSON.stringify({telas:TELAS.map(t=>({k:t.k,nome:t.nome,sil:t.sil||"",e:t.e,reg:t.reg,uf:t.uf||"",breve:!!t.breve,adv:t.adv||"",fala:t.fala||"",lenda:t.lenda||"",
 palavras:(t.palavras||[]).map(p=>[p[0],p[3]]),fig:(t.fig||[]).map(f=>[f[0],f[4]]),rima:t.rima||null,parlenda:t.parlenda||[]})),
 regioes:[...REGIOES,ESPECIAL].map(r=>({id:r.id,nome:r.nome,sotaque:r.sotaque,oi:r.oi,fantasia:r.fantasia?r.fantasia.nome:""})),
 uf:Object.fromEntries(Object.entries(MAPA.uf).map(([k,v])=>[k,v[0]]))}));'''
D = json.loads(subprocess.check_output(["node", "-e", js, ROOT]))
UF_PREP = {u: "no" for u in "ac ap am pa to ma pi ce rn es rj pr rs df".split()} | {"ba": "na", "pb": "na"}

def prompt_tela(k):
    return f"{BASE}\n\nSUBJECT: {ART[k]}"

telas = []
for t in D["telas"]:
    k = t["k"]; txt = TX[k]
    uf = t["uf"] or UF_RASCUNHO.get(k, "")
    rima = txt["rima"] or {"w": "", "ok": ["", ""], "no": [["", ""], ["", ""]]}
    telas.append({"k": k, "nome": t["nome"], "e": t["e"], "reg": t["reg"], "regNome": NOME_REG[t["reg"]],
                  "uf": uf, "ufNome": D["uf"].get(uf, ""), "prep": UF_PREP.get(uf, "em"),
                  "estado": "texto novo" if t["breve"] else "texto encurtado", "voz": f"{VOZES[txt['voz']]['preset']}, sotaque {VOZES[txt['voz']]['sotaque']}",
                  "arte": k in ART, "prompt": prompt_tela(k) if k in ART else "", "tam": TAM["tela"] if k in ART else "gerado pelo jogo (mapa)",
                  "textos": {"nome": t["nome"], "adv": txt["adv"], "fala": txt["fala"], "lenda": txt["lenda"],
                             "palavras": "\n".join(f"{a} {b}" for a, b in txt["palavras"]),
                             "fig": "\n".join(f"{a} — {b}" for a, b in txt["fig"]),
                             "rima": rima["w"], "rimaOk": " ".join(rima["ok"]), "rimaNo": "\n".join(" ".join(x) for x in rima["no"]),
                             "parlenda": "\n".join(txt["parlenda"])}})
telas.sort(key=lambda x: ORDEM_REG.index(x["reg"]))
extra = {"k": "capa", "nome": "CAPA (abertura)", "e": "🖼️", "reg": "especial", "regNome": "Capa", "uf": "", "ufNome": "", "prep": "",
         "estado": "", "arte": True, "prompt": prompt_tela("capa").replace("Children's coloring-book illustration, ONE single image", "Children's game cover illustration, ONE single image"),
         "tam": TAM["capa"], "textos": None}
telas.append(extra)
avs = [{"k": a["k"], "quem": a["quem"], "tam": TAM["avatar"], "prompt": BASE_AVATAR.format(fundo=a["fundo"]) + "\n\nGIRL: " + a["p"]} for a in AVATARES]

# ---------- decisões ----------
DEC = [
 {"id": "formato", "q": "Como gerar cada tela", "ops": [
   ["so_colorida", "Só a colorida, contorno preto grosso (recomendado)", "O jogo tira o contorno da própria imagem: traço e cores ficam exatamente no mesmo lugar. Acaba o problema da metade P&B que sai diferente da colorida (Pai do Mato, Lobisomem)."],
   ["lado_a_lado", "Colorida + só traço lado a lado (como hoje)", "Dá o traço limpo pronto, mas o gerador quase nunca repete o desenho igualzinho nas duas metades."]]},
 {"id": "tamanho", "q": "Tamanho das telas", "ops": [
   ["1024x1536", "1024 × 1536 retrato 2:3 (recomendado)", "É o formato da área de pintura no celular em pé: o desenho ocupa a tela toda, sem ficar 'flutuando' (o problema da Iara). Todos do mesmo tamanho."],
   ["1536x1536", "1536 × 1536 quadrado", "Sobra espaço em cima e embaixo no celular."]]},
 {"id": "fundo", "q": "Fundo", "ops": [["branco", "Branco, sem paisagem (recomendado)", "Menos áreas minúsculas, cores mais fáceis."], ["paisagem", "Paisagem simples", "Mais bonito, mais difícil de pintar."]]},
 {"id": "festa", "q": "Festa do Folclore", "ops": [["refazer", "Refazer no estilo novo", "Fica coeso com as outras."], ["manter", "Manter o desenho antigo", "Você gostou dele na capa."]]},
 {"id": "capa", "q": "Capa (tela de abertura)", "ops": [["capa_nova", "Capa própria nova (prompt CAPA)", ""], ["festa_nova", "Usar a Festa nova", ""], ["festa_antiga", "Manter a Festa antiga", ""]]},
 {"id": "avatares", "q": "Avatares", "ops": [["grade9", "9 avatares, escolha em grade 3×3 de quadrados (recomendado)", "Cada menina escolhe qualquer uma."], ["carrossel", "9 avatares em carrossel", ""]]},
 {"id": "encontre", "q": "\"Encontre\" no desenho depois de terminar", "ops": [["fora", "Fora (já tirei)", "Depois do PRONTO vem só o 'Monte o nome'."], ["volta", "Voltar com ele", ""]]},
 {"id": "rima", "q": "Pergunta da rima", "ops": [["lida", "Sem botão 🔈: a pergunta é lida sozinha e tocar nela lê de novo (já fiz)", ""], ["botao", "Voltar o botão", ""]]},
 {"id": "voz", "q": "Motor de voz (no Comfy Cloud)", "ops": [
   ["eleven_v4", "ElevenLabs eleven_v4 nos personagens e lendas + v4 turbo nas falas curtas (recomendado)", "O mais expressivo, segue a direção de sotaque e emoção entre colchetes. O jogo inteiro (639 falas) sai por volta de US$ 9 em créditos do Comfy."],
   ["fish", "Fish Audio s2.1-pro com vozes da biblioteca fish.audio", "Mais vozes diferentes (diversidade) e bem mais barato (~US$ 0,50), mas qualidade varia de voz para voz."],
   ["misto", "Misto: ElevenLabs na narradora, Fish nos personagens", "Narradora sempre igual e bonita; personagens com vozes regionais variadas."]]},
 {"id": "norte_oi", "q": "Saudação do Norte (no lugar de \"Égua!\")", "ops": [["maninha", "MANINHA!", "Bem paraense e carinhoso."], ["oi_mana", "OI, MANA!", ""], ["vixe", "VIXE!", "Mais nordestino."]]},
 {"id": "voz_modo", "q": "Como a voz entra no jogo", "ops": [
   ["mp3", "Gravar tudo uma vez em MP3 dentro do jogo (recomendado)", "Funciona offline, igual em todo celular, sem chave nem custo depois. O jogo tem cerca de 30 mil caracteres de fala (~35 minutos)."],
   ["ao_vivo", "Gerar na hora pela internet", "Precisa de chave de API no jogo e internet; custo a cada uso."]]},
 {"id": "sotaque", "q": "Sotaque por região", "ops": [["sim", "Sim: cada região com o seu (Norte paraense, Nordeste, Centro-Oeste/caipira, Sudeste mineiro, Sul gaúcho)", ""], ["neutro", "Não: um narrador só, personagens com vozes diferentes", ""]]},
 {"id": "nomes", "q": "Nome da criança nas falas", "ops": [["gravar", "Gravar os nomes das 4 primas (e os que vierem); outros nomes ouvem a fala sem nome", ""], ["sem", "Falas sem nome", ""]]},
]

VOZ = [
 ["ElevenLabs", "US$ 6 a 22 (um mês de plano)", "A mais expressiva; biblioteca com vozes brasileiras; Voice Design."],
 ["Gemini TTS", "~US$ 0,50", "Sotaque e emoção dirigidos por texto; várias vozes na mesma fala."],
 ["OpenAI gpt-4o-mini-tts", "~US$ 0,50", "Instruções de tom; pode puxar sotaque estrangeiro."],
 ["Google Chirp 3 HD", "grátis (1 mi caracteres/mês)", "Natural, pouco controle."],
 ["Azure Neural", "grátis (500 mil caracteres/mês)", "Muitas vozes pt-BR, SSML."],
 ["Voz do celular", "grátis", "Robótica, falha em alguns navegadores."],
]

REGRAS = [
 "Uma imagem por tela, 1024 × 1536 (retrato 2:3), fundo branco puro.",
 "Cada área é UMA cor chapada: sem degradê, sombra, brilho, textura ou estampa miúda. Sombra vira uma área a mais que a criança não entende.",
 "Contorno preto grosso e contínuo fechando cada área. Fresta no contorno faz duas áreas virarem uma (o corpo do Pai do Mato vazava para a árvore).",
 "Áreas grandes: nada menor que uma unha no celular (sem sardas, fio de cabelo, pintinhas, grama fina). Até ~40 áreas por tela; a Festa pode ter até 80.",
 "Os objetos das palavras escondidas aparecem separados e inteiros (o chapéu, o rabo, a flor...).",
 "Personagem ocupando ~80% da altura, centralizado; companheiro pequeno ao lado.",
 "Sem texto, letras ou marca d'água.",
 "No ChatGPT: peça 'formato retrato 1024x1536'. No Gemini/Midjourney/Ideogram: proporção 2:3 (Midjourney: --ar 2:3). Se vier maior, tudo bem, desde que seja 2:3.",
 "Para os blocos saírem contíguos: se uma área sair com duas cores ou com sombra, peça de novo com 'flat colors, no shading, closed outlines'. Depois eu confiro cada uma na prévia de áreas antes de entrar no jogo.",
]

PRESET = json.load(open(f"{ROOT}/mesa/respostas_1.json"))
data = {"preset": PRESET, "decisoes": DEC, "telas": telas, "avatares": avs, "voz": VOZ, "regras": REGRAS, "base": BASE, "baseLado": BASE_LADO, "tam": TAM}

# ---------- PROMPTS.md ----------
L = ["# Ateliê Brasil: prompts das artes", "",
     f"Telas: **{TAM['tela']}**, uma imagem só, fundo branco. Avatares: **{TAM['avatar']}**. Capa: **{TAM['capa']}**.",
     "Cada prompt já vem completo (base + personagem): é só copiar e colar. O nome do arquivo é a chave entre crases.", "",
     "## Regras para as áreas saírem certas", ""] + [f"- {r}" for r in REGRAS] + ["",
     "Se preferir o formato antigo (colorida | traço lado a lado, 1536 × 1024), troque o primeiro parágrafo de cada prompt por:", "", "```", BASE_LADO, "```", ""]
for reg in ORDEM_REG + ["capa"]:
    ts = [t for t in telas if t["arte"] and (t["reg"] == reg if reg != "capa" else t["k"] == "capa")]
    if reg == "especial": ts = [t for t in ts if t["k"] != "capa"]
    if not ts: continue
    L += [f"## {NOME_REG.get(reg, 'Capa')}", ""]
    for t in ts:
        L += [f"### {t['e']} {t['nome']}: `{t['k']}.jpg` ({t['tam']})", "", "```", t["prompt"], "```", ""]
L += ["## Avatares (9)", "", "Quadrados, rosto no centro, cada um com um fundo de cor diferente. Arquivos `avatar-a1.jpg` a `avatar-a9.jpg`.", ""]
for a in avs:
    L += [f"### `avatar-{a['k']}.jpg`: {a['quem']} ({a['tam']})", "", "```", a["prompt"], "```", ""]
open(f"{ROOT}/PROMPTS.md", "w").write("\n".join(L))

# ---------- mesa.html ----------
os.makedirs(f"{ROOT}/mesa", exist_ok=True)
tpl = open(f"{ROOT}/tools/mesa_tpl.html").read()
open(f"{ROOT}/mesa/mesa.html", "w").write(tpl.replace("/*DATA*/null", json.dumps(data, ensure_ascii=False)))
print("PROMPTS.md e mesa/mesa.html:", sum(1 for t in telas if t["arte"]), "artes,", len(avs), "avatares,", sum(1 for t in telas if t["textos"]), "telas com texto")
