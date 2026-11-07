"""Página de revisão do lote do Comfy: aprovar ou mandar refazer cada imagem e cada fala, com comentário,
e um botão que gera o Markdown da avaliação para colar no chat.
  python3 tools/build_revisao.py      -> comfy/revisao/ (index.html, img/*.jpg, som/<seção>.json)
Lê comfy/atelie_comfy.json e os arquivos gerados em comfy/out/."""
import os, sys, json, base64, subprocess, html
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
D = json.load(open(f"{ROOT}/comfy/atelie_comfy.json"))
OUT, REV = f"{ROOT}/comfy/out", f"{ROOT}/comfy/revisao"
os.makedirs(f"{REV}/img", exist_ok=True); os.makedirs(f"{REV}/som", exist_ok=True)
MOD = {"eleven_v4": "v4", "eleven_v4_turbo": "v4 Turbo", "eleven_v3": "v3", "eleven_multilingual_v2": "v2"}
REG = {"norte": "Norte", "nordeste": "Nordeste", "centro": "Centro-Oeste", "sudeste": "Sudeste", "sul": "Sul", "especial": "Especiais"}
TIPO = {"adv": "Adivinha", "fala": "Fala", "moro": "Onde eu moro", "lenda": "Lenda", "rima": "Rima (pergunta)", "rima_certa": "Rima (acerto)",
        "parlenda_1": "Parlenda 1", "parlenda_2": "Parlenda 2", "parlenda_3": "Parlenda 3", "parlenda_4": "Parlenda 4",
        "figurinha_1": "Figurinha", "parlenda": "Parlenda inteira"}

def img(item, nome):
    src = os.path.splitext(f"{OUT}/{item['arquivo']}")[0] + ".png"
    if not os.path.exists(src): return None
    dst = f"img/{nome}.jpg"
    im = Image.open(src).convert("RGB"); im.thumbnail((900, 1350)); im.save(f"{REV}/{dst}", quality=84)
    return dst

def som(f):
    src = f"{OUT}/{f['arquivo']}"
    if not os.path.exists(src): return None
    mp3 = subprocess.run(["ffmpeg", "-v", "error", "-i", src, "-ac", "1", "-b:a", "48k", "-f", "mp3", "-"], capture_output=True, check=True).stdout
    return "data:audio/mpeg;base64," + base64.b64encode(mp3).decode()

secoes, packs = [], {}
def _j(p, d):
    try: return json.load(open(p))
    except Exception: return d
REFEITO = set(_j(f"{OUT}/refazer_motivo.json", {})) | {f["id"] for f in D["falas"] if f["grupo"] == "letras" or f["id"].startswith("palavra/")}
V4OK = set(_j(f"{OUT}/palavras_escolha.json", {}).get("v4ok", []))
CONF = _j(f"{OUT}/conferencia.json", {})
PEND1, SEC1 = set(), set()
try:
    for t in open(f"{OUT}/revisao1_pendentes.txt").read().split():
        (SEC1.add(t[4:]) if t.startswith("SEC:") else PEND1.add(t))
except Exception: pass
USER1 = set("curupira/adv iara/moro iara/parlenda_2 boto/adv boto/parlenda_3 boto/rima_certa caipora/adv caipora/parlenda_3 caipora/parlenda_4 vitoria/adv mapinguari/adv mapinguari/parlenda_4 matinta/adv matinta/parlenda_1 matinta/parlenda_2 matinta/parlenda_4 boi/adv boi/parlenda_1 boi/parlenda_2 boi/parlenda_4 boi/rima_certa fulozinha/adv fulozinha/parlenda_1 fulozinha/parlenda_2 fulozinha/parlenda_3 fulozinha/parlenda_4 caboclo/adv maracatu/parlenda_4 palavra/cabelo palavra/arvore jogo/errou_hihihi_tenta_de_novo jogo/escolha_o_seu_retrato_toque_na_menina_que_parece jogo/hihihi_ate_eu_o_saci_estou_batendo_palma jogo/hihihi_te_enganei_meus_pes_sao_virados_pra_tras_ cor/darkgreen cor/lightgreen cor/beige cor/gold mistura/orange letra/a letra/a_agudo letra/a_til letra/a_circunflexo regiao/norte_sotaque nome/elisa nome/yasmin".split())
def pre(fid, sec):
    """pendente: o que você mandou refazer (para confirmar a correção), o que a conferência automática ainda acusa,
    e o que ficou sem ouvir na 1ª rodada. O resto vem aprovado (passou na transcrição)."""
    if fid in USER1 or "monte_o_seu_nome" in fid: return ""
    if CONF.get(fid, {}).get("tipo", "ok") != "ok": return ""
    if sec in SEC1 or ("audio/" + fid) in PEND1: return ""
    return "ok"
def secao(sid, titulo, sub=""):
    s = {"id": sid, "titulo": titulo, "sub": sub, "itens": []}; secoes.append(s); return s
def add_fala(s, f, rotulo):
    e = f["eleven"]; d = som(f)
    if d: packs.setdefault(s["id"], {})[f["id"]] = d
    c = CONF.get(f["id"], {})
    if f["id"] in V4OK: e = dict(e, modelo="eleven_v4")   # palavra que ficou com a versão v4 (passou na conferência)
    if f["grupo"] == "letras": e = dict(e, modelo="eleven_v4")  # letras: leitura única em v4, cortada pelas pausas
    s["itens"].append({"id": os.path.splitext(f["arquivo"])[0], "tipo": "voz", "rotulo": rotulo, "texto": f["texto"],
                       "meta": f"{MOD[e['modelo']]} · {e['voz'].split(' (')[0]}", "ok": bool(d), "pre": pre(f["id"], s["id"]),
                       "novo": f["id"] in REFEITO or "parlenda" in f["id"], "conf": c.get("tipo", ""), "ouvido": c.get("ouvido", "") if c.get("tipo") not in ("", "ok") else ""})

falas = {}
for f in D["falas"]: falas.setdefault(f["id"].split("/")[0] if f["grupo"] == "telas" else f["grupo"], []).append(f)
ordem = ["norte", "nordeste", "centro", "sudeste", "sul", "especial"]
for t in sorted(D["telas"], key=lambda t: ordem.index(t["regiao"])):
    s = secao(t["k"], t["nome"].title() if t["k"] != "boi" else "Bumba meu Boi", REG[t["regiao"]] + (f" · {t['estado']}" if t.get("estado") else ""))
    if t["imagem"]:
        src = img(t["imagem"], t["k"])
        s["itens"].append({"id": os.path.splitext(t["imagem"]["arquivo"])[0], "tipo": "imagem", "rotulo": "Ilustração", "src": src, "ok": bool(src), "pre": "ok"})
    for f in falas.get(t["k"], []):
        add_fala(s, f, TIPO.get(f["id"].split("/", 1)[1], f["id"].split("/", 1)[1]))
s = secao("capa", "Capa e avatares", "Imagens do menu")
src = img(D["capa"], "capa"); s["itens"].append({"id": "art/capa", "tipo": "imagem", "rotulo": "Capa", "src": src, "ok": bool(src), "pre": "ok"})
for a in D["avatares"]:
    src = img(a, "avatar-" + a["k"])
    s["itens"].append({"id": os.path.splitext(a["arquivo"])[0], "tipo": "imagem", "rotulo": f"Avatar {a['k'][1:]}", "texto": a["quem"], "src": src, "ok": bool(src), "pre": "ok"})
for g, tit, sub in [("palavras", "Palavras", "Sílaba por sílaba"), ("jogo", "Falas do jogo", "Avisos e incentivos"), ("cores", "Cores e misturas", ""),
                    ("letras", "Letras", "Teclado do nome"), ("regioes", "Regiões", "Abertura de cada sala"), ("nomes", "Nomes das primas", "")]:
    s = secao(g, tit, sub)
    for f in falas.get(g, []): add_fala(s, f, f["id"].split("/", 1)[1].replace("_", " "))

for sid, p in packs.items(): json.dump(p, open(f"{REV}/som/{sid}.json", "w"))
n = sum(len(s["itens"]) for s in secoes); faltam = sum(1 for s in secoes for i in s["itens"] if not i["ok"])
dados = json.dumps(secoes, ensure_ascii=False).replace("</", "<\\/")
tpl = open(f"{ROOT}/tools/revisao_tpl.html").read()
open(f"{REV}/index.html", "w").write(tpl.replace("/*DADOS*/[]", dados))
print(f"{REV}/index.html: {len(secoes)} seções, {n} itens ({faltam} sem arquivo), {len(packs)} pacotes de som")
