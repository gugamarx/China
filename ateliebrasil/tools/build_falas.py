"""Liga as falas gravadas (Comfy/ElevenLabs) ao jogo: copia comfy/out/audio/*.mp3 para audio/ (64 kbps mono, leve para o celular)
e gera js/falas.js = {texto normalizado: "audio/....mp3"} + chaves "palavra/<slug>" (Voice.syl) e "cor/<cor>" (Voice.color).
A Voice toca o MP3 quando acha o texto; se não achar, usa a voz do navegador.  uso: python3 tools/build_falas.py"""
import os, json, re, subprocess, unicodedata, concurrent.futures as cf
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
D = json.load(open(f"{ROOT}/comfy/atelie_comfy.json"))
def norm(s):
    s = unicodedata.normalize("NFC", s.lower())
    return re.sub(r"\s+", " ", re.sub(r"[^\w ]+|_", " ", s)).strip()
M, jobs = {}, []
for f in D["falas"]:
    src = f"{ROOT}/comfy/out/{f['arquivo']}"
    if not os.path.exists(src): continue
    dst = f"audio/{f['id']}.mp3"; jobs.append((src, f"{ROOT}/{dst}"))
    i = f["id"]
    if i.startswith(("palavra/", "cor/", "letra/")): M[i] = dst
    if i.startswith("palavra/"): continue                 # "ca... be... lo..." só pela chave palavra/<slug>
    k = norm(f["texto"])
    if k and (k not in M or f["voz"] != "narradora"): M[k] = dst   # mesmo texto em duas vozes: fica a do personagem
def enc(a):
    s, d = a; os.makedirs(os.path.dirname(d), exist_ok=True)
    if not os.path.exists(d) or os.path.getmtime(d) < os.path.getmtime(s):
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", s, "-ac", "1", "-b:a", "64k", d], check=True)
with cf.ThreadPoolExecutor(8) as ex: list(ex.map(enc, jobs))
open(f"{ROOT}/js/falas.js", "w").write("/* gerado por tools/build_falas.py: texto -> áudio gravado */\nconst FALAS = " + json.dumps(M, ensure_ascii=False, separators=(",", ":")) + ";\n")
tam = sum(os.path.getsize(f"{ROOT}/{p}") for p in set(M.values()))
print(len(M), "chaves,", len(set(M.values())), "áudios,", round(tam / 1e6, 1), "MB")
