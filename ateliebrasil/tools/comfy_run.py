"""Roda em lote no Comfy Cloud o que está em comfy/atelie_comfy.json, usando um workflow que você exportou em formato API.

  export COMFY_CLOUD_API_KEY=...            (platform.comfy.org; a API pede plano Standard ou maior)
  python3 tools/comfy_run.py audio  --workflow comfy/wf_voz_api.json --ids curupira/fala,boi/fala,gralha/fala   (teste)
  python3 tools/comfy_run.py audio  --workflow comfy/wf_voz_api.json --grupo telas
  python3 tools/comfy_run.py audio  --workflow comfy/wf_fish_api.json --motor fish --ids curupira/fala
  python3 tools/comfy_run.py imagem --workflow comfy/wf_img_api.json --ids curupira --variacoes 3
  python3 tools/comfy_run.py imagem --workflow comfy/wf_img_ref_api.json --ref comfy/out/art/curupira.jpg --todas
  python3 tools/comfy_run.py orcamento --variacoes 3 --img gpt2-alta      (só calcula; não chama nada)

O script acha sozinho os nós pelo tipo: Text to Speech (texto/modelo), Voice Selector (voz), o nó com "prompt" (imagem),
LoadImage (referência) e o nó de salvar (nome do arquivo). Já existe? Pula (dá para parar e continuar).
Saída em comfy/out/<arquivo>. Vozes do Fish: comfy/vozes_fish.json = {"curupira": "<id do fish.audio>", ...}.
Não foi testado contra a API real: comece sempre com --ids de 1 a 3 itens."""
import os, sys, json, time, argparse, copy, urllib.request, urllib.parse, uuid

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE_URL = "https://cloud.comfy.org"

def req(method, path, data=None, raw=False, files=None):
    key = os.environ.get("COMFY_CLOUD_API_KEY") or sys.exit("Falta COMFY_CLOUD_API_KEY.")
    h = {"X-API-Key": key}; body = None
    if files:
        b = uuid.uuid4().hex; parts = []
        for name, (fn, content) in files.items():
            parts.append(f'--{b}\r\nContent-Disposition: form-data; name="{name}"; filename="{fn}"\r\nContent-Type: application/octet-stream\r\n\r\n'.encode() + content + b"\r\n")
        body = b"".join(parts) + f"--{b}--\r\n".encode(); h["Content-Type"] = f"multipart/form-data; boundary={b}"
    elif data is not None:
        body = json.dumps(data).encode(); h["Content-Type"] = "application/json"
    r = urllib.request.urlopen(urllib.request.Request(BASE_URL + path, data=body, headers=h, method=method), timeout=120)
    c = r.read(); return c if raw else json.loads(c or b"{}")

def nodes(wf, pred): return [k for k, n in wf.items() if pred(n.get("class_type", ""), n.get("inputs", {}))]

def preparar_audio(wf, f, motor, fish_ids):
    wf = copy.deepcopy(wf)
    tts = nodes(wf, lambda c, i: "TextToSpeech" in c and "text" in i) or sys.exit("Não achei o nó Text to Speech no workflow.")
    for k in tts:
        inp = wf[k]["inputs"]
        if motor == "eleven":
            inp["text"] = f["eleven"]["texto"]
            if "model" in inp and isinstance(inp["model"], str): inp["model"] = f["eleven"]["modelo"]
        else:
            inp["text"] = f["fish"]["texto"]
    for k in nodes(wf, lambda c, i: "VoiceSelector" in c):
        inp = wf[k]["inputs"]
        if motor == "eleven": inp["voice"] = f["eleven"]["voz"]
        else:
            vid = fish_ids.get(f["voz"]) or sys.exit(f"Falta a voz do Fish para '{f['voz']}' em comfy/vozes_fish.json")
            inp["voice"] = "custom"; inp["voice_id"] = vid
    for k in nodes(wf, lambda c, i: c.startswith("SaveAudio")): wf[k]["inputs"]["filename_prefix"] = "atelie/" + f["id"].replace("/", "__")
    return wf

def preparar_imagem(wf, item, ref_nome, seed):
    wf = copy.deepcopy(wf); prefixo = DATA["estilo"]["prefixo_referencia"] if ref_nome else ""
    ps = nodes(wf, lambda c, i: isinstance(i.get("prompt"), str)) or sys.exit("Não achei nó com campo 'prompt' no workflow de imagem.")
    for k in ps:
        inp = wf[k]["inputs"]; inp["prompt"] = prefixo + item["prompt"]
        if "negative_prompt" in inp: inp["negative_prompt"] = item["negativo"]
        if "size" in inp and isinstance(inp["size"], str): inp["size"] = f"{item['largura']}x{item['altura']}"
        if "aspect_ratio" in inp and isinstance(inp["aspect_ratio"], str): inp["aspect_ratio"] = "1:1" if item["largura"] == item["altura"] else "2:3"
        if "width" in inp and isinstance(inp["width"], int): inp["width"], inp["height"] = item["largura"], item["altura"]
        if "seed" in inp and isinstance(inp["seed"], int): inp["seed"] = seed
    if ref_nome:
        for k in nodes(wf, lambda c, i: c == "LoadImage"): wf[k]["inputs"]["image"] = ref_nome
    for k in nodes(wf, lambda c, i: c == "SaveImage"): wf[k]["inputs"]["filename_prefix"] = "atelie/" + os.path.splitext(item["arquivo"])[0].replace("/", "__")
    return wf

def rodar(wf, destino):
    key = os.environ["COMFY_CLOUD_API_KEY"]
    r = req("POST", "/api/prompt", {"prompt": wf, "extra_data": {"api_key_comfy_org": key}})
    if r.get("node_errors"): print("  erro nos nós:", json.dumps(r["node_errors"])[:400]); return False
    pid = r["prompt_id"]; t0 = time.time()
    while True:
        time.sleep(3); st = req("GET", f"/api/job/{pid}/status").get("status", "")
        if st in ("completed", "success"): break
        if st in ("failed", "error", "cancelled"): print("  falhou:", st); return False
        if time.time() - t0 > 900: print("  demorou demais"); return False
    hist = None
    for p in (f"/api/history_v2/{pid}", f"/api/history/{pid}"):
        try: hist = req("GET", p); break
        except Exception: pass
    if not hist: print("  não consegui ler o resultado"); return False
    h = hist.get(pid, hist); arqs = []
    for out in (h.get("outputs") or {}).values():
        for kind in ("audio", "images", "gifs"): arqs += out.get(kind, [])
    if not arqs: print("  sem arquivo de saída"); return False
    for i, a in enumerate(arqs):
        q = urllib.parse.urlencode({"filename": a["filename"], "subfolder": a.get("subfolder", ""), "type": a.get("type", "output")})
        dest = os.path.splitext(destino)[0] + (f"_{i}" if i else "") + os.path.splitext(a["filename"])[1]
        os.makedirs(os.path.dirname(dest), exist_ok=True); open(dest, "wb").write(req("GET", "/api/view?" + q, raw=True))
        print("  ->", os.path.relpath(dest, ROOT))
    return True

# preços dos Partner Nodes (docs.comfy.org/tutorials/partner-nodes/pricing; 211 créditos = US$ 1). Imagem: créditos por imagem 1024x1536, estimados pelos tokens.
PRECO_IMG = {"gpt2-alta": 47.0, "gpt2-media": 12.0, "nano-pro": 34.0, "nano2": 17.0, "recraft4": 12.07, "recraft4-vetor": 24.14}
PRECO_VOZ = {"eleven_v4": 24.14, "eleven_v4_turbo": 12.07, "fish": 4.53}
REF_IMG = 2.47 * 1.5   # imagem de referência 1024x1536 na entrada

def orcamento(d, variacoes, img, motor, refazer):
    n_img = sum(1 for t in d["telas"] if t["imagem"]) + 1 + len(d["avatares"])
    c_img = n_img * variacoes * (PRECO_IMG[img] + REF_IMG)
    if motor == "fish": c_voz = sum(len(f["fish"]["texto"].encode()) for f in d["falas"]) / 1000 * PRECO_VOZ["fish"]
    else: c_voz = sum(len(f["eleven"]["texto"]) / 1000 * PRECO_VOZ[f["eleven"]["modelo"]] for f in d["falas"])
    c_voz *= 1 + refazer
    print(f"Imagens: {n_img} x {variacoes} variações com {img}: {c_img:,.0f} créditos = US$ {c_img / 211:,.2f}")
    print(f"Vozes:   {len(d['falas'])} falas com {motor} (+{int(refazer * 100)}% para refazer): {c_voz:,.0f} créditos = US$ {c_voz / 211:,.2f}")
    print(f"Total:   {c_img + c_voz:,.0f} créditos = US$ {(c_img + c_voz) / 211:,.2f}  (fora a mensalidade do plano do Comfy Cloud)")

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "orcamento":
        op = argparse.ArgumentParser(); op.add_argument("orcamento"); op.add_argument("--variacoes", type=int, default=3)
        op.add_argument("--img", choices=list(PRECO_IMG), default="gpt2-alta"); op.add_argument("--motor", choices=["eleven", "fish"], default="eleven")
        op.add_argument("--refazer", type=float, default=.5); o = op.parse_args()
        orcamento(json.load(open(f"{ROOT}/comfy/atelie_comfy.json")), o.variacoes, o.img, o.motor, o.refazer); sys.exit()
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("tipo", choices=["audio", "imagem"]); ap.add_argument("--workflow", required=True)
    ap.add_argument("--ids", default=""); ap.add_argument("--grupo", default=""); ap.add_argument("--todas", action="store_true")
    ap.add_argument("--motor", choices=["eleven", "fish"], default="eleven"); ap.add_argument("--ref", default="")
    ap.add_argument("--variacoes", type=int, default=1); ap.add_argument("--refazer", action="store_true")
    a = ap.parse_args()
    DATA = json.load(open(f"{ROOT}/comfy/atelie_comfy.json")); wf = json.load(open(a.workflow))
    if "nodes" in wf: sys.exit("Esse é o workflow normal. Exporte em formato API (Workflow > Export (API)).")
    OUT = f"{ROOT}/comfy/out"; ids = [x for x in a.ids.split(",") if x]
    if a.tipo == "audio":
        fish = json.load(open(f"{ROOT}/comfy/vozes_fish.json")) if a.motor == "fish" and os.path.exists(f"{ROOT}/comfy/vozes_fish.json") else {}
        lista = [f for f in DATA["falas"] if (f["id"] in ids) or (a.grupo and f["grupo"] == a.grupo) or a.todas]
        for n, f in enumerate(lista, 1):
            dest = f"{OUT}/{f['arquivo']}" if a.motor == "eleven" else f"{OUT}/fish/{f['arquivo']}"
            if os.path.exists(dest) and not a.refazer: continue
            print(f"[{n}/{len(lista)}] {f['id']}"); rodar(preparar_audio(wf, f, a.motor, fish), dest)
    else:
        itens = [t["imagem"] | {"k": t["k"]} for t in DATA["telas"] if t["imagem"]] + [DATA["capa"] | {"k": "capa"}] + [x | {"k": "avatar-" + x["k"]} for x in DATA["avatares"]]
        lista = [i for i in itens if i["k"] in ids or a.todas]
        ref_nome = ""
        if a.ref:
            up = req("POST", "/api/upload/image", files={"image": (os.path.basename(a.ref), open(a.ref, "rb").read())}); ref_nome = up.get("name", os.path.basename(a.ref))
        for n, it in enumerate(lista, 1):
            for v in range(a.variacoes):
                dest = f"{OUT}/{it['arquivo']}" if a.variacoes == 1 else f"{OUT}/{os.path.splitext(it['arquivo'])[0]}_v{v + 1}.jpg"
                if os.path.exists(dest) and not a.refazer: continue
                print(f"[{n}/{len(lista)}] {it['k']} v{v + 1}"); rodar(preparar_imagem(wf, it, ref_nome, 1000 + v * 7919), dest)
