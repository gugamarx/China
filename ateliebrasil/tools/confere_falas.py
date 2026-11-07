"""Compara comfy/out/transcricao.json com o texto esperado de cada fala e aponta repetições e trocas.
  python3 tools/confere_falas.py   -> comfy/out/conferencia.json + resumo"""
import os, json, re, unicodedata, difflib, collections
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
D = json.load(open(f"{ROOT}/comfy/atelie_comfy.json")); T = json.load(open(f"{ROOT}/comfy/out/transcricao.json"))
def norm(s):
    s = unicodedata.normalize("NFD", s.lower()); s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    s = re.sub(r"(.)\1{2,}", r"\1\1", s)          # muuuu -> muu
    return re.sub(r"[^a-z0-9 ]+", " ", s).split()
R = {}
for f in D["falas"]:
    if f["id"] in R or f["id"] not in T: continue
    e, t = norm(f["texto"]), norm(T[f["id"]])
    if f["grupo"] == "palavras": e = [w for w in e]  # sílabas soltas: compara só o tamanho
    sm = difflib.SequenceMatcher(None, e, t); sim = sm.ratio()
    extra = len(t) - len(e)
    # repetição: um trecho de 2+ palavras do esperado aparece mais vezes na transcrição
    rep = False
    for n in (3, 2):
        ce = collections.Counter(tuple(e[i:i+n]) for i in range(len(e)-n+1))
        ctt = collections.Counter(tuple(t[i:i+n]) for i in range(len(t)-n+1))
        if any(ctt[g] > c for g, c in ce.items()): rep = True; break
    if len(e) <= 2 and len(t) >= 2 * max(1, len(e)) and len(t) > len(e): rep = True
    tipo = "repete" if rep or extra >= max(2, len(e) * 0.4) else ("troca" if sim < 0.75 else "ok")
    if f["grupo"] == "letras":  # o Scribe escreve a letra ("B"), não o nome ("bê"): basta uma letra, sem repetir
        tipo = "ok" if 1 <= len(t) <= len(e) + 1 and len(set(t)) == len(t) else "repete"
    if f["grupo"] == "palavras" and f["id"].startswith("palavra/") and t and t[-1] == e[-1] and sim >= 0.5: tipo = "ok" if tipo == "troca" else tipo
    R[f["id"]] = {"tipo": tipo, "sim": round(sim, 2), "esperado": f["texto"], "ouvido": T[f["id"]], "modelo": f["eleven"]["modelo"], "voz": f["voz"], "grupo": f["grupo"]}
json.dump(R, open(f"{ROOT}/comfy/out/conferencia.json", "w"), ensure_ascii=False, indent=1)
c = collections.Counter(r["tipo"] for r in R.values()); print(c)
for tp in ("repete", "troca"):
    print("=====", tp)
    for k, r in R.items():
        if r["tipo"] == tp: print(f"{k} [{r['modelo'][7:]}/{r['voz']}] ESP: {r['esperado']} | OUV: {r['ouvido']}")
