"""Corta cada parlenda gravada inteira (audio/<k>/parlenda.mp3) nas 4 linhas (parlenda_1..4), usando os tempos
de cada palavra do ElevenLabs Scribe. Gravar inteira evita a repetição que o v4 faz em frases curtas soltas.
  COMFY_CLOUD_API_KEY=... python3 tools/corta_parlendas.py [filtro]"""
import os, sys, json, re, unicodedata, difflib, subprocess
sys.path.insert(0, os.path.dirname(__file__))
import comfy_teste as ct, comfy_transcreve as tr

ROOT = ct.ROOT; OUT = f"{ROOT}/comfy/out"
D = json.load(open(f"{ROOT}/comfy/atelie_comfy.json"))

def toks(s):
    s = unicodedata.normalize("NFD", s.lower()); s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9 ]+", " ", s).split()

def corta(src, ini, fim, dst):
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", src, "-ss", f"{ini:.3f}", "-to", f"{fim:.3f}", "-c:a", "libmp3lame", "-b:a", "192k", dst], check=True)

if __name__ == "__main__":
    filtro = sys.argv[1] if len(sys.argv) > 1 else ""
    inteiras = {f["id"]: f for f in D["falas"] if f["id"].endswith("/parlenda") and filtro in f["id"]}
    linhas = {}
    for f in D["falas"]:
        if f.get("corte") and f["corte"]["de"] in inteiras: linhas.setdefault(f["corte"]["de"], []).append(f)
    clips = [f for k, f in inteiras.items() if os.path.exists(f"{OUT}/{f['arquivo']}")]
    tr.TMP = f"{OUT}/.stt_parlenda"; os.makedirs(tr.TMP, exist_ok=True)
    if os.path.exists(f"{OUT}/.stt/res_p.json"): os.remove(f"{OUT}/.stt/res_p.json")
    ct.OUT = OUT
    _, mapa, r = tr.bloco("p", clips)
    raw = open(f"{OUT}/.stt/res_p.json").read(); words = json.loads(raw)
    if isinstance(words, str): words = json.loads(words)
    for cid, t0, t1 in mapa:
        f = inteiras[cid]; src = f"{OUT}/{f['arquivo']}"
        ws = [w for w in words if w.get("type", "word") == "word" and t0 - .05 <= (w["start"] + w["end"]) / 2 <= t1 + .05]
        tt = []  # (token, start, end) relativo ao clipe
        for w in ws:
            for x in toks(w["text"]): tt.append((x, w["start"] - t0, w["end"] - t0))
        lin = sorted(linhas[cid], key=lambda x: x["corte"]["linha"])
        et, fim_linha = [], []
        for l in lin: et += toks(l["texto"]); fim_linha.append(len(et) - 1)
        sm = difflib.SequenceMatcher(None, et, [x[0] for x in tt], autojunk=False)
        m = {}
        for a, b, n in sm.get_matching_blocks():
            for i in range(n): m[a + i] = b + i
        cortes, ok = [0.0], True
        for fl in fim_linha[:-1]:
            i = fl
            while i >= 0 and i not in m: i -= 1
            if i < 0 or m[i] + 1 >= len(tt): ok = False; break
            j = m[i]; cortes.append((tt[j][2] + tt[j + 1][1]) / 2)
        cortes.append(t1 - t0)
        if not ok or sorted(cortes) != cortes:
            print("NÃO CORTOU", cid, [x[0] for x in tt]); continue
        for l, a, b in zip(lin, cortes, cortes[1:]):
            dst = f"{OUT}/{l['arquivo']}"; os.makedirs(os.path.dirname(dst), exist_ok=True)
            corta(src, max(0, a - .03), b + .03, dst)
        print("cortou", cid, [round(c, 2) for c in cortes])
