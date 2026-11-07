"""Gera comfy/atelie_comfy.json: tudo o que o Comfy Cloud precisa produzir (imagens + falas), com o nome final de cada arquivo.
Fontes: tools/arte_spec.py (prompts), tools/textos_v2.py (textos), tools/comfy_spec.py (vozes, modelos, animações), js/*.js (cores, letras, falas do jogo).
uso: python3 tools/build_comfy.py      depois: python3 tools/comfy_run.py --help"""
import os, sys, re, json, subprocess, unicodedata
sys.path.insert(0, os.path.dirname(__file__))
from arte_spec import TAM, BASE, NEGATIVO, CENA, ART, AVATARES, BASE_AVATAR
from textos_v2 import T, REGIOES
from comfy_spec import MODELOS, VOZES, MODELO_VOZ, ANIM_CENA, ANIM_TELA, EFEITOS

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
js = r'''const fs=require("fs");const g=s=>s.replace(/^(const|let) /gm,"global.");const R=process.argv[1];
eval(g(fs.readFileSync(R+"/js/util.js","utf8").match(/^const LETRA = \{[\s\S]*?\};/m)[0]));
for(const f of ["data","mapa","lendas"])eval(g(fs.readFileSync(R+"/js/"+f+".js","utf8")));
console.log(JSON.stringify({telas:TELAS.map(t=>({k:t.k,nome:t.nome,sil:t.sil||"",e:t.e,reg:t.reg,uf:t.uf||""})),
 paint:PAINT,recipes:RECIPES,letra:LETRA,uf:Object.fromEntries(Object.entries(MAPA.uf).map(([k,v])=>[k,v[0]])),
 regnome:Object.fromEntries([...REGIOES,ESPECIAL].map(r=>[r.id,r.nome]))}));'''
J = json.loads(subprocess.check_output(["node", "-e", js, ROOT]))
UF_PREP = {u: "no" for u in "ac ap am pa to ma pi ce rn es rj pr rs df".split()} | {"ba": "na", "pb": "na"}
PRIMAS = ["Julia", "Elisa", "Yasmin", "Valentina"]
UF_RASCUNHO = {"caju": "rn", "maracatu": "pe", "ciranda": "pe", "tuiuiu": "mt", "cavalhadas": "go", "pequi": "go", "mula": "es", "junina": "sp", "gralha": "pr", "teiniagua": "rs", "ervamate": "sc"}

def slug(s):
    s = unicodedata.normalize("NFD", s.lower()); s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9]+", "_", s).strip("_")
def palavra(sil): return sil.replace("-", "")
def silabado(sil):  # "GOR-RO" -> "gor... ro... gorro!"
    p = [x.lower() for x in re.split(r"[- ]", sil) if x]; return "... ".join(p) + "... " + palavra(sil).lower().replace(" ", " ") + "!"

falas, banco = [], {}
def fala(id_, voz, texto, grupo, modelo=None, ritmo=None):
    v = VOZES[voz]; modelo = modelo or MODELO_VOZ.get(voz, "eleven_v4"); falas.append({"id": id_, "arquivo": f"audio/{id_}.mp3", "grupo": grupo, "voz": voz, "texto": texto,
        "eleven": {"modelo": modelo, "voz": v["preset"], "texto": f"{v['tag'] if not ritmo else v['tag'][:-1] + ', ' + ritmo + ']'} {texto}"},
        "fish": {"modelo": "s2.1-pro", "buscar_voz": v["fish"], "texto": texto}})
def palavra_banco(sil):
    k = slug(palavra(sil))
    if k not in banco: banco[k] = sil; fala(f"palavra/{k}", "narradora", silabado(sil), "palavras", ritmo="slowly, syllable by syllable, then the whole word happily")
    return k

telas = []
for t in J["telas"]:
    k = t["k"]; x = T[k]; uf = t["uf"] or UF_RASCUNHO.get(k, ""); reg = t["reg"]; v = x["voz"]
    ufn = J["uf"].get(uf, ""); moro = f"Eu moro {UF_PREP.get(uf, 'em')} {ufn}, na região {J['regnome'][reg].title().replace('-Oeste', '-Oeste')}!" if reg != "especial" else ""
    fala(f"{k}/adv", "narradora", x["adv"], "telas")
    fala(f"{k}/fala", v, x["fala"], "telas")
    if moro: fala(f"{k}/moro", v, moro, "telas")
    fala(f"{k}/lenda", v, x["lenda"], "telas")
    for i, l in enumerate(x["parlenda"], 1): fala(f"{k}/parlenda_{i}", "narradora", l, "telas", ritmo="rhythmic nursery-rhyme chant")
    fala(f"{k}/rima", "narradora", f"Agora me diga: o que rima com {x['rima']['w'].lower()}?", "telas")
    fala(f"{k}/rima_certa", "narradora", f"Isso! {x['rima']['w'].lower()} rima com {x['rima']['ok'][0].lower()}!", "telas")
    for i, f in enumerate(x["fig"], 1): fala(f"{k}/figurinha_{i}", "narradora", f"Figurinha nova! {f[1]}", "telas")
    pals = [palavra_banco(p[0]) for p in x["palavras"]] + [palavra_banco(f[0]) for f in x["fig"]] + ([palavra_banco(t["sil"])] if t["sil"] else [])
    for w in [x["rima"]["w"], x["rima"]["ok"][0], *[n[0] for n in x["rima"]["no"]]]:
        kw = "rima/" + slug(w)
        if not any(f["id"] == kw for f in falas): fala(kw, "narradora", w.lower() + "?", "palavras", modelo="eleven_v4_turbo")
    img = None
    if k in ART:
        an = ANIM_TELA.get(k)
        img = {"arquivo": f"art/{k}.jpg", "tamanho": TAM["tela"], "largura": 1024, "altura": 1536, "prompt": f"{BASE}\n\nSUBJECT: {ART[k]}", "negativo": NEGATIVO,
               "animar": {"cena": [a["elemento"] for a in ANIM_CENA], "item": {"objeto": an[0], "efeito": an[1], "como": EFEITOS[an[1]]} if an else None}}
    telas.append({"k": k, "nome": t["nome"], "emoji": t["e"], "regiao": reg, "uf": uf, "estado": ufn, "voz": v, "imagem": img,
                  "textos": {kk: x[kk] for kk in ("adv", "fala", "lenda", "palavras", "fig", "rima", "parlenda")} | ({"moro": moro} if moro else {}),
                  "falas": [f["id"] for f in falas if f["id"].startswith(k + "/")], "palavras_audio": pals})

# regiões, cores, misturas, letras
for r, d in REGIOES.items():
    fala(f"regiao/{r}", "narradora", d["oi"], "regioes"); fala(f"regiao/{r}_sotaque", "narradora", d["sotaque"].capitalize(), "regioes", modelo="eleven_v4_turbo", ritmo="very excited exclamation")
for c, p in J["paint"].items(): fala(f"cor/{c}", "narradora", p[1] + "!", "cores", modelo="eleven_v4_turbo")
for c, (a, b) in J["recipes"].items():
    pa, pb, pc = J["paint"][a][1], J["paint"][b][1], J["paint"][c][1]
    fala(f"mistura/{c}", "narradora", f"{pa} com {pb} faz {pc}!", "cores", modelo="eleven_v4_turbo")
for L, nome in J["letra"].items(): fala(f"letra/{slug(L)}", "narradora", nome + ".", "letras", modelo="eleven_v4_turbo")

# falas do jogo (js/app.js): fixas viram áudio; as que têm nome da criança são gravadas para as 4 primas; as outras dinâmicas ficam listadas
app = open(f"{ROOT}/js/app.js").read()
lits = set()
for m in re.finditer(r"(?:Voice\.(?:say|talk)\(\s*\[?\[?|\],\s*\[|\[\[)\s*(`[^`]*`|\"[^\"]*\")", app):
    s = m.group(1)[1:-1]
    if len(s) > 2 and re.search(r"[a-zà-ú]", s, re.I): lits.add(s)
fixas, dinam = [], []
for s in sorted(lits):
    if "${" not in s: fixas.append(s)
    elif re.fullmatch(r"[^$]*(\$\{Nome\(\)\}[^$]*)+", s):
        for n in PRIMAS: fixas.append(s.replace("${Nome()}", n))
    else: dinam.append(s)
for s in fixas: fala(f"jogo/{slug(s)[:48]}", "narradora", s, "jogo", modelo="eleven_v4_turbo")
for n in PRIMAS: fala(f"nome/{slug(n)}", "narradora", f"{n}!", "nomes", modelo="eleven_v4_turbo")

avatares = [{"k": a["k"], "arquivo": f"kids/avatar-{a['k']}.jpg", "tamanho": TAM["avatar"], "largura": 1024, "altura": 1024, "quem": a["quem"],
             "prompt": BASE_AVATAR.format(fundo=a["fundo"]) + "\n\nGIRL: " + a["p"], "negativo": NEGATIVO} for a in AVATARES]
capa = {"arquivo": "art/capa.jpg", "tamanho": TAM["capa"], "largura": 1024, "altura": 1536,
        "prompt": BASE.replace("Children's coloring-book illustration", "Children's game cover illustration").replace("SUBJECT", "") + "\n\nSUBJECT: " + ART["capa"], "negativo": NEGATIVO}

def custo(modelo, chars): return round(chars / 1000 * {"eleven_v4": 24.14, "eleven_v4_turbo": 12.07, "eleven_v3": 50.64}[modelo], 1)
cred_eleven = sum(custo(f["eleven"]["modelo"], len(f["eleven"]["texto"])) for f in falas)
cred_fish = round(sum(len(f["texto"].encode()) for f in falas) / 1000 * 4.53, 1)
out = {
 "projeto": "Ateliê Brasil", "versao": 1, "estado": "textos v2 em rascunho: revisar na mesa de decisões antes de gerar o lote de áudio",
 "como_usar": [
  "1. Imagens: abra no Comfy Cloud o template do GPT-Image-2 (ou Nano Banana Pro). Gere primeiro a tela 'curupira' (2 a 4 variações) e escolha a melhor: ela vira a ÂNCORA DE ESTILO.",
  "2. Para todas as outras telas, ligue a âncora como imagem de referência e comece o prompt com o 'prefixo_referencia'. Salve cada uma com o nome do campo 'arquivo'.",
  "3. Avatares: mesma coisa, com o avatar a1 como âncora dos outros 8.",
  "4. Voz: monte no Comfy o template 'ElevenLabs Text to Speech' (Voice Selector -> Text to Speech -> Save Audio MP3). Para cada fala, escolha a voz em eleven.voz, o modelo em eleven.modelo e cole eleven.texto (já com a direção de sotaque entre colchetes).",
  "5. Em lote: exporte esse workflow em formato API (menu Workflow > Export (API)), mande para mim, e rode tools/comfy_run.py, que preenche tudo sozinho e baixa com os nomes certos (precisa do plano Standard ou maior para usar a API do Comfy Cloud).",
  "6. Antes do lote, teste 3 falas (curupira/fala, boi/fala, gralha/fala) no ElevenLabs e no Fish e decida de ouvido."],
 "estilo": {"tamanho_tela": TAM["tela"], "tamanho_avatar": TAM["avatar"], "cena_padrao": CENA, "prompt_base": BASE, "negativo": NEGATIVO,
            "prefixo_referencia": "Use the attached image ONLY as a style reference: same outline thickness, same flat colors, same sky, sun (top-right), cloud (top-left) and mountain layout. Draw a NEW scene: ",
            "modelos": MODELOS["imagem"]},
 "voz": {"modelos": MODELOS["voz"], "regras": MODELOS["regras_voz"], "elenco": VOZES,
         "estimativa": {"falas": len(falas), "caracteres": sum(len(f["texto"]) for f in falas),
                        "eleven_creditos": round(cred_eleven), "eleven_usd": round(cred_eleven / 211, 2), "fish_creditos": round(cred_fish), "fish_usd": round(cred_fish / 211, 2),
                        "obs": "211 créditos Comfy = US$ 1. Conte mais uns 50% para refazer falas."}},
 "animacoes": {"cena": ANIM_CENA, "efeitos": EFEITOS},
 "telas": telas, "capa": capa, "avatares": avatares, "falas": falas,
 "falas_dinamicas_a_rever": dinam,
}
os.makedirs(f"{ROOT}/comfy", exist_ok=True)
json.dump(out, open(f"{ROOT}/comfy/atelie_comfy.json", "w"), ensure_ascii=False, indent=1)
e = out["voz"]["estimativa"]
print(f"comfy/atelie_comfy.json: {len(telas)} telas, {len(avatares)} avatares, {e['falas']} falas, {e['caracteres']} caracteres; "
      f"ElevenLabs ~{e['eleven_creditos']} créditos (US$ {e['eleven_usd']}), Fish ~{e['fish_creditos']} (US$ {e['fish_usd']}); {len(dinam)} falas dinâmicas a rever")
