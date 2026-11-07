"""Lote final no Comfy Cloud (decisões de nov/2026): imagens com GPT Image 2.6 (high, 1 por item) e falas no ElevenLabs
com o modelo de cada personagem (MODELO_VOZ em comfy_spec.py). Lê comfy/atelie_comfy.json; salva em comfy/out/<arquivo>.
  COMFY_CLOUD_API_KEY=... python3 tools/comfy_lote.py listar | rodar [filtro]
Já existe? Pula. Refazer um item: apague o arquivo e rode de novo (ou use a página de revisão)."""
import os, sys, json, concurrent.futures as cf
sys.path.insert(0, os.path.dirname(__file__))
import comfy_teste as ct

ct.OUT = f"{ct.ROOT}/comfy/out"
D = ct.DATA
IMG = {"model": "gpt-image-2.6-flare", "model.quality": "high", "model.background": "opaque"}
USD_IMG = {"1024x1536": 0.0589, "1024x1024": 0.0753}
USD_VOZ = {"eleven_v4": 0.1144, "eleven_v4_turbo": 0.0572, "eleven_v3": 0.24}
EXTRA = {}  # id -> texto extra no prompt (comentários de refação)
try: EXTRA = json.load(open(f"{ct.ROOT}/comfy/refazer.json"))
except Exception: pass

def wf_img(item, prefixo, extra=""):
    size = f"{item['largura']}x{item['altura']}"
    inp = ct.defaults("OpenAIGPTImageNodeV2", dict(IMG, **{"model.size": size}))
    inp["prompt"] = item["prompt"] + (f"\n\nFIX FROM REVIEW: {extra}" if extra else "")
    return {"1": {"class_type": "OpenAIGPTImageNodeV2", "inputs": inp},
            "2": {"class_type": "SaveImage", "inputs": {"images": ["1", 0], "filename_prefix": prefixo}}}, USD_IMG[size]

def jobs():
    J = []
    itens = [t["imagem"] for t in D["telas"] if t["imagem"]] + [D["capa"]] + D["avatares"]
    for it in itens:
        i = os.path.splitext(it["arquivo"])[0]
        wf, usd = wf_img(it, "atelie/" + i.replace("/", "__"), EXTRA.get(i, ""))
        J.append(dict(id=i, tipo="imagem", ext=".png", usd=usd, wf=wf))
    for f in D["falas"]:
        e = f["eleven"]; i = os.path.splitext(f["arquivo"])[0]
        J.append(dict(id=i, tipo="voz", ext=".mp3", usd=len(e["texto"]) / 1000 * USD_VOZ[e["modelo"]],
                      wf=ct.wf_eleven(e["modelo"], e["voz"], e["texto"], "atelie/" + i.replace("/", "__"))))
    return J

if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "listar"
    filtro = sys.argv[2] if len(sys.argv) > 2 else ""
    J = [j for j in jobs() if filtro in j["id"]]
    falta = [j for j in J if not ct.ja_tem(j)]
    for t in ("imagem", "voz"):
        a = [j for j in J if j["tipo"] == t]; b = [j for j in falta if j["tipo"] == t]
        print(f"{t}: {len(a)} itens, faltam {len(b)} = {sum(j['usd'] for j in b) * ct.CRED:.0f} créditos")
    if cmd == "rodar":
        par = int(os.environ.get("PARALELO", "6"))
        with cf.ThreadPoolExecutor(par) as ex:
            for fut in cf.as_completed([ex.submit(ct.rodar_um, j) for j in falta]):
                try: i, s = fut.result()
                except Exception as e: i, s = "?", f"EXCEÇÃO {e}"
                print(i, s, flush=True)
