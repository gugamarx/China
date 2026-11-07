"""Letras do teclado: o v4 e o v2 erram letra solta (dobram ou somem). Grava as letras em leituras de 8 e corta pelas pausas.
  COMFY_CLOUD_API_KEY=... python3 tools/letras_uma_leitura.py"""
import os, sys, json, re, subprocess
sys.path.insert(0, os.path.dirname(__file__))
import comfy_teste as ct
ROOT = ct.ROOT; OUT = f"{ROOT}/comfy/out"; ct.OUT = OUT
D = json.load(open(f"{ROOT}/comfy/atelie_comfy.json"))
L = [f for f in D["falas"] if f["grupo"] == "letras"]
sons = []
for f in L:
    if f["texto"] not in sons: sons.append(f["texto"])
grupos = [sons[i:i + 8] for i in range(0, len(sons), 8)]

def pausas(p, n):
    for db in (-35, -30, -40, -28, -45):
        for d in (0.35, 0.25, 0.45):
            r = subprocess.run(["ffmpeg", "-i", p, "-af", f"silencedetect=noise={db}dB:d={d}", "-f", "null", "-"], capture_output=True, text=True).stderr
            ini = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", r)]; fim = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", r)]
            tot = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", p], capture_output=True, text=True).stdout)
            sil = [(a, b) for a, b in zip(ini, fim + [tot]) if a > 0.05 and b < tot - 0.05]
            if len(sil) == n - 1:
                cortes = [0.0] + [(a + b) / 2 for a, b in sil] + [tot]
                return list(zip(cortes, cortes[1:]))
    return None

for gi, g in enumerate(grupos):
    texto = " ".join(s[:-1].capitalize() + "." for s in g)
    j = dict(id=f".letras/leitura_{gi}", ext=".mp3", wf=ct.wf_eleven("eleven_v4", "Matilda (female, american)", "[warm, clear storyteller, slow, a pause after each letter] " + texto, f"atelie/letras_{gi}"))
    j["wf"]["2"]["inputs"]["stability"] = 0.65
    for tent in range(3):
        p = f"{OUT}/.letras/leitura_{gi}.mp3"
        if not os.path.exists(p): print(ct.rodar_um(j))
        seg = pausas(p, len(g))
        if seg: break
        print("leitura", gi, "não separou em", len(g), "- refazendo"); os.remove(p)
    if not seg: print("FALHOU grupo", g); continue
    for som, (a, b) in zip(g, seg):
        for f in L:
            if f["texto"] == som:
                dst = f"{OUT}/{f['arquivo']}"; os.makedirs(os.path.dirname(dst), exist_ok=True)
                subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", p, "-ss", f"{max(0, a - .02):.3f}", "-to", f"{b + .02:.3f}", "-af", "silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse", "-b:a", "192k", dst], check=True)
    print("grupo", gi, "ok:", texto)
