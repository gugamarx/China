"""Lote de TESTE no Comfy Cloud: Curupira em vários modelos de imagem + uma fala de cada voz do elenco
em 3 modelos ElevenLabs (v4, v4 turbo, v3) + Fish / HeyGen / Seed Audio como referência.

Monta os workflows em formato API sozinho, a partir do catálogo de nós do Comfy Cloud (/api/object_info),
sem precisar exportar nada. A chave é injetada pelo proxy do ambiente (cabeçalho X-API-Key).

  python3 tools/comfy_teste.py listar             # mostra o que vai rodar e o custo
  python3 tools/comfy_teste.py rodar [filtro]     # roda (pula o que já existe em comfy/teste/)
  python3 tools/comfy_teste.py pagina             # gera comfy/teste/index.html para comparar
Saída: comfy/teste/ (fora do git)."""
import os, sys, json, time, urllib.request, urllib.parse, concurrent.futures as cf

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = f"{ROOT}/comfy/teste"
BASE = "https://cloud.comfy.org"
KEY = os.environ.get("COMFY_CLOUD_API_KEY", "proxy-injected")
DATA = json.load(open(f"{ROOT}/comfy/atelie_comfy.json"))
CRED = 211  # créditos por US$ 1

def req(method, path, data=None, raw=False):
    h = {"X-API-Key": KEY}; body = None
    if data is not None: body = json.dumps(data).encode(); h["Content-Type"] = "application/json"
    try:
        r = urllib.request.urlopen(urllib.request.Request(BASE + path, data=body, headers=h, method=method), timeout=180)
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"HTTP {e.code} {path}: {e.read()[:600].decode(errors='replace')}")
    c = r.read(); return c if raw else json.loads(c or b"{}")

_OI = None
def object_info():
    global _OI
    if _OI is None:
        p = f"{OUT}/.object_info.json"
        if not os.path.exists(p):
            os.makedirs(OUT, exist_ok=True); open(p, "wb").write(req("GET", "/api/object_info", raw=True))
        _OI = json.load(open(p))
    return _OI

def defaults(cls, escolhas):
    """Preenche os campos obrigatórios do nó com o padrão; escolhas = {"model": "x", "model.size": ...}."""
    out = {}
    def walk(spec, pre):
        for n, v in (spec.get("required") or {}).items():
            t, m = v[0], (v[1] if len(v) > 1 else {})
            k = pre + n
            if t == "COMFY_DYNAMICCOMBO_V3":
                key = escolhas.get(k, m["options"][0]["key"]); out[k] = key
                walk(next(o for o in m["options"] if o["key"] == key)["inputs"], k + ".")
            elif t == "COMBO" or isinstance(t, list):
                opts = t if isinstance(t, list) else m.get("options", [])
                out[k] = m.get("default", opts[0] if opts else None)
            elif t in ("INT", "FLOAT", "BOOLEAN", "STRING"):
                out[k] = m.get("default", "" if t == "STRING" else 0)
    walk(object_info()[cls]["input"], "")
    out.update(escolhas)
    return out

# ---------------- imagens ----------------
CUR = next(t for t in DATA["telas"] if t["k"] == "curupira")["imagem"]
PROMPT, NEG = CUR["prompt"], CUR["negativo"]

IMAGENS = [  # (id, nome, nó, escolhas, US$)
    ("gpt2", "GPT Image 2 (high)", "OpenAIGPTImageNodeV2", {"model": "gpt-image-2", "model.size": "1024x1536", "model.quality": "high", "model.background": "opaque"}, 0.1976),
    ("nanopro", "Nano Banana Pro (2K)", "GeminiImage2Node", {"model": "gemini-3-pro-image-preview", "aspect_ratio": "2:3", "resolution": "2K", "response_modalities": "IMAGE"}, 0.1608),
    ("ideogram4", "Ideogram V4 (quality)", "IdeogramV4", {"resolution": "1664x2496 (2:3)", "rendering_speed": "QUALITY"}, 0.143),
    ("recraftvetor", "Recraft V4.1 Vetor (SVG)", "RecraftV4TextToVectorNode", {"model": "recraftv4_1_vector", "model.size": "832x1280"}, 0.1144),
    ("krea3", "Krea 3 (high, 2K)", "Krea3ImageNode", {"model": "Krea 3", "model.aspect_ratio": "2:3", "model.resolution": "2K", "model.thinking_mode": "high"}, 0.1144),
    ("flux3", "FLUX 3 (1.5K)", "Flux3ImageNode", {"aspect_ratio": "2:3", "resolution": "1.5K"}, 0.1001),
    ("seedream5", "Seedream 5.0 Pro (2K)", "ByteDanceSeedreamNodeV3", {"model": "seedream 5.0 pro", "model.size_preset": "(2K) 1664x2496 (2:3)"}, 0.09),
    ("nano21", "Nano Banana 2.1 (2K)", "GeminiNanoBanana2V2", {"model": "Gemini Nano Banana 2.1", "model.aspect_ratio": "2:3", "model.resolution": "2K", "model.thinking_level": "MEDIUM", "response_modalities": "IMAGE"}, 0.0828),
    ("gpt26", "GPT Image 2.6 (high)", "OpenAIGPTImageNodeV2", {"model": "gpt-image-2.6-flare", "model.size": "1024x1536", "model.quality": "high", "model.background": "opaque"}, 0.0589),
    ("qwen3pro", "Qwen Image 3 Pro", "QwenImageTextToImageApi", {"model": "qwen-image-3.0-pro", "model.width": 1024, "model.height": 1536, "model.negative_prompt": NEG, "prompt_extend": False}, 0.0572),
    ("recraft41", "Recraft V4.1", "RecraftV4TextToImageNode", {"model": "recraftv4_1", "model.size": "832x1280"}, 0.05005),
    ("luma", "Luma UNI-1", "LumaImageNode2", {"model": "uni-1", "model.aspect_ratio": "2:3"}, 0.0404),
    ("hunyuan", "Hunyuan Image 3.5", "HunyuanImageTextToImageApi", {"model": "hy-image-3.5-preview", "model.aspect_ratio": "2:3", "model.resolution": "2K"}, 0.03432),
    ("reve", "Reve", "ReveImageCreateNode", {"model": "reve-create@20250915", "model.aspect_ratio": "2:3", "upscale": "disabled"}, 0.03432),
    ("kling", "Kling 3.0 Omni (1K)", "KlingOmniProImageNode", {"model_name": "kling-v3-omni", "resolution": "1K", "aspect_ratio": "2:3", "series_amount": "disabled"}, 0.028),
]

def wf_imagem(cls, esc, prefixo):
    inp = defaults(cls, esc)
    pk = next((k for k in inp if k.split(".")[-1] == "prompt"), "prompt")
    inp[pk] = PROMPT
    for k in list(inp):
        if k.split(".")[-1] == "negative_prompt" and not inp[k]: inp[k] = NEG
    svg = object_info()[cls]["output"][0] == "SVG"
    save = {"class_type": "SaveSVGNode", "inputs": {"svg": ["1", 0], "filename_prefix": prefixo}} if svg else \
           {"class_type": "SaveImage", "inputs": {"images": ["1", 0], "filename_prefix": prefixo}}
    return {"1": {"class_type": cls, "inputs": inp}, "2": save}

# ---------------- vozes ----------------
# Os presets do elenco (Rachel, Josh, Elli...) não existem no seletor do Comfy; equivalentes mais próximos:
PRESET = {"Rachel": "Matilda (female, american)", "Josh": "Liam (male, american)", "Bella": "Bella (female, american)",
          "Antoni": "Eric (male, american)", "Elli": "Jessica (female, american)", "Adam": "Adam (male, american)",
          "Domi": "Laura (female, american)", "Arnold": "Brian (male, american)", "Sam": "Callum (male, american)"}
ELEVEN = [("v4", "eleven_v4", 0.1144), ("v4turbo", "eleven_v4_turbo", 0.0572), ("v3", "eleven_v3", 0.24)]
FALAS = {f["id"]: f for f in DATA["falas"]}
ELENCO = DATA["voz"]["elenco"]

def fala_de(k):
    return (FALAS.get(f"{k}/fala") or FALAS["curupira/adv"])["texto"]

def wf_eleven(modelo, voz, texto, prefixo):
    tts = defaults("ElevenLabsTextToSpeech", {"model": modelo, "language_code": "pt", "output_format": "mp3_44100_192"})
    tts.update({"text": texto, "voice": ["1", 0]})
    return {"1": {"class_type": "ElevenLabsVoiceSelector", "inputs": {"voice": voz}},
            "2": {"class_type": "ElevenLabsTextToSpeech", "inputs": tts},
            "3": {"class_type": "SaveAudioMP3", "inputs": {"audio": ["2", 0], "filename_prefix": prefixo, "quality": "V0"}}}

def wf_simples(cls, esc, prefixo):
    return {"1": {"class_type": cls, "inputs": defaults(cls, esc)},
            "2": {"class_type": "SaveAudioMP3", "inputs": {"audio": ["1", 0], "filename_prefix": prefixo, "quality": "V0"}}}

LINHA = fala_de("curupira")
def jobs():
    J = []
    for i, nome, cls, esc, usd in IMAGENS:
        ext = ".svg" if object_info()[cls]["output"][0] == "SVG" else ".png"
        J.append(dict(id=f"img/{i}", nome=nome, tipo="imagem", ext=ext, usd=usd, wf=wf_imagem(cls, esc, f"teste/img_{i}")))
    for mid, modelo, preco in ELEVEN:
        for k, v in ELENCO.items():
            texto = v["tag"] + " " + fala_de(k)
            J.append(dict(id=f"voz/{mid}/{k}", nome=f"{v['quem']} ({v['sotaque']})", tipo="voz", ext=".mp3",
                          usd=len(texto) / 1000 * preco, modelo=modelo, voz=PRESET[v["preset"]], texto=texto,
                          wf=wf_eleven(modelo, PRESET[v["preset"]], texto, f"teste/{mid}_{k}")))
    nb = len(LINHA.encode())
    for fm, rate in (("drama-3", 14.3), ("s2.1-pro", 21.45), ("s1", 21.45)):
        J.append(dict(id=f"outros/fish_{fm}", nome=f"Fish {fm} (voz aleatória)", tipo="voz", ext=".mp3", usd=nb * rate / 1e6, texto=LINHA,
                      wf=wf_simples("FishAudioTextToSpeech", {"text": LINHA, "model": fm}, f"teste/fish_{fm}")))
    J.append(dict(id="outros/heygen", nome="HeyGen (Pedro Lima, português)", tipo="voz", ext=".mp3", usd=0.004, texto=LINHA,
                  wf=wf_simples("HeyGenTextToSpeechNode", {"text": LINHA, "voice": "Pedro Lima - Serious 😐 (Portuguese, male)"}, "teste/heygen")))
    sp = ("Voz de menino travesso e brincalhão, rápido e esperto, português do Brasil com sotaque amazonense do Norte. "
          f'Ele diz: "{LINHA}"')
    J.append(dict(id="outros/seed", nome="ByteDance Seed Audio (voz descrita)", tipo="voz", ext=".mp3", usd=0.015, texto=sp,
                  wf=wf_simples("ByteDanceSeedAudio", {"text_prompt": sp, "reference_mode": "text only", "model": "seed-audio-1.0-multilingual"}, "teste/seed")))
    return J

def destino(j): return f"{OUT}/{j['id']}{j['ext']}"

def rodar_um(j):
    d = destino(j)
    if os.path.exists(d): return j["id"], "já existe"
    r = req("POST", "/api/prompt", ({"prompt": j["wf"]} if KEY == "proxy-injected" else {"prompt": j["wf"], "extra_data": {"api_key_comfy_org": KEY}}))
    if r.get("node_errors"): return j["id"], "ERRO nós: " + json.dumps(r["node_errors"], ensure_ascii=False)[:500]
    pid = r["prompt_id"]; t0 = time.time()
    while True:
        time.sleep(4)
        try: st = req("GET", f"/api/jobs/{pid}").get("status", "")
        except Exception: st = req("GET", f"/api/job/{pid}/status").get("status", "")
        if st in ("completed", "success"): break
        if st in ("failed", "error", "cancelled"):
            det = ""
            try: det = json.dumps(req("GET", f"/api/jobs/{pid}"), ensure_ascii=False)[:600]
            except Exception as e: det = str(e)[:300]
            return j["id"], f"FALHOU ({st}) {det}"
        if time.time() - t0 > 900: return j["id"], "demorou demais"
    h = None
    for p in (f"/api/history_v2/{pid}", f"/api/history/{pid}"):
        try: h = req("GET", p); break
        except Exception: pass
    h = (h or {}).get(pid, h or {}); arqs = []
    for out in (h.get("outputs") or {}).values():
        for kind in ("audio", "images", "svg", "gifs", "files", "text"):
            for a in out.get(kind, []) or []:
                if isinstance(a, dict) and a.get("filename"): arqs.append(a)
    if not arqs: return j["id"], "sem arquivo de saída: " + json.dumps(h, ensure_ascii=False)[:400]
    a = arqs[0]
    q = urllib.parse.urlencode({"filename": a["filename"], "subfolder": a.get("subfolder", ""), "type": a.get("type", "output")})
    d = os.path.splitext(d)[0] + os.path.splitext(a["filename"])[1]
    os.makedirs(os.path.dirname(d), exist_ok=True); open(d, "wb").write(req("GET", "/api/view?" + q, raw=True))
    return j["id"], "ok " + os.path.relpath(d, ROOT)

def ja_tem(j):
    base = os.path.splitext(destino(j))[0]
    return any(os.path.exists(base + e) for e in (".png", ".jpg", ".jpeg", ".webp", ".svg", ".mp3", ".flac", ".wav", ".opus"))

def pagina():
    J = jobs(); import html
    def arq(j):
        base = os.path.splitext(destino(j))[0]
        for e in (".png", ".jpg", ".jpeg", ".webp", ".svg", ".mp3", ".flac", ".wav", ".opus"):
            if os.path.exists(base + e): return os.path.relpath(base + e, OUT)
    L = ["<!doctype html><meta charset=utf-8><meta name=viewport content='width=device-width,initial-scale=1'><title>Teste Comfy</title>",
         "<style>body{font-family:system-ui;margin:16px;background:#fafafa}.g{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px}"
         ".c{background:#fff;border-radius:10px;padding:8px;box-shadow:0 1px 3px #0002}.c img{width:100%;border-radius:6px}audio{width:100%}small{color:#666}"
         "table{border-collapse:collapse;width:100%}td{border-bottom:1px solid #ddd;padding:4px;vertical-align:middle}</style>"]
    tot = sum(j["usd"] for j in J)
    L.append(f"<h1>Ateliê Brasil: teste do Comfy Cloud</h1><p>Custo estimado: {tot*CRED:.0f} créditos (US$ {tot:.2f})</p><h2>Curupira</h2><div class=g>")
    for j in [j for j in J if j["tipo"] == "imagem"]:
        a = arq(j); L.append(f"<div class=c><b>{html.escape(j['nome'])}</b><br><small>{j['usd']*CRED:.0f} créditos</small><br>" +
                             (f"<a href='{a}'><img src='{a}' loading=lazy></a>" if a else "<i>sem imagem</i>") + "</div>")
    L.append("</div><h2>Vozes ElevenLabs</h2><table><tr><td><b>Personagem</b></td>" + "".join(f"<td><b>{m}</b></td>" for _, m, _ in ELEVEN) + "</tr>")
    for k, v in ELENCO.items():
        L.append(f"<tr><td><b>{html.escape(v['quem'])}</b><br><small>{html.escape(v['sotaque'])} · {PRESET[v['preset']].split(' (')[0]}<br>{html.escape(fala_de(k))}</small></td>")
        for mid, _, _ in ELEVEN:
            a = arq(next(j for j in J if j["id"] == f"voz/{mid}/{k}"))
            L.append(f"<td>{f'<audio controls preload=none src={a!r}></audio>' if a else '<i>—</i>'}</td>")
        L.append("</tr>")
    L.append(f"</table><h2>Outros motores (mesma frase: {html.escape(LINHA)})</h2><table>")
    for j in [j for j in J if j["id"].startswith("outros/")]:
        a = arq(j); L.append(f"<tr><td>{html.escape(j['nome'])}</td><td>{f'<audio controls preload=none src={a!r}></audio>' if a else '<i>—</i>'}</td></tr>")
    L.append("</table>")
    open(f"{OUT}/index.html", "w").write("\n".join(L)); print(f"{OUT}/index.html")

if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "listar"
    if cmd == "listar":
        J = jobs()
        for t in ("imagem", "voz"):
            s = sum(j["usd"] for j in J if j["tipo"] == t); print(f"{t}: {sum(1 for j in J if j['tipo']==t)} itens, {s*CRED:.0f} créditos")
        print(f"total: {sum(j['usd'] for j in J)*CRED:.0f} créditos")
    elif cmd == "wf":
        j = next(j for j in jobs() if j["id"] == sys.argv[2]); print(json.dumps(j["wf"], ensure_ascii=False, indent=1))
    elif cmd == "rodar":
        filtro = sys.argv[2] if len(sys.argv) > 2 else ""
        J = [j for j in jobs() if filtro in j["id"] and not ja_tem(j)]
        par = int(os.environ.get("PARALELO", "4"))
        print(f"{len(J)} jobs, {par} em paralelo", flush=True)
        with cf.ThreadPoolExecutor(par) as ex:
            for fut in cf.as_completed([ex.submit(rodar_um, j) for j in J]):
                try: i, s = fut.result()
                except Exception as e: i, s = "?", f"EXCEÇÃO {e}"
                print(i, s, flush=True)
    elif cmd == "pagina":
        pagina()
