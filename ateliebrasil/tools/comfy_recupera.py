"""Baixa saídas que o Comfy gerou mas o lote não conseguiu baixar ("sem arquivo de saída"), sem gerar de novo.
Procura nos jobs recentes pelo prefixo atelie/<id com __> e salva em comfy/out/<id>.<ext>.
  COMFY_CLOUD_API_KEY=... python3 tools/comfy_recupera.py"""
import os, sys, json, urllib.parse
sys.path.insert(0, os.path.dirname(__file__))
import comfy_teste as ct, comfy_lote as cl
ct.OUT = f"{ct.ROOT}/comfy/out"
falta = {j["id"].replace("/", "__"): j for j in cl.jobs() if not ct.ja_tem(j)}
print(len(falta), "faltando")
off, achou = 0, 0
while falta and off < 3000:
    r = ct.req("GET", f"/api/jobs?limit=100&offset={off}&sort_order=desc"); js = r.get("jobs", [])
    if not js: break
    for j in js:
        po = j.get("preview_output") or {}; nome = po.get("display_name", "")
        if j.get("status") != "completed" or not nome.startswith("atelie/"): continue
        k = nome[len("atelie/"):].rsplit("_", 1)[0]
        if k in falta:
            q = urllib.parse.urlencode({"filename": po["filename"], "subfolder": po.get("subfolder", ""), "type": po.get("type", "output")})
            d = os.path.splitext(ct.destino(falta[k]))[0] + os.path.splitext(po["filename"])[1]
            os.makedirs(os.path.dirname(d), exist_ok=True); open(d, "wb").write(ct.req("GET", "/api/view?" + q, raw=True))
            print("recuperado", falta.pop(k)["id"]); achou += 1
    off += 100
print(achou, "recuperados;", len(falta), "ainda faltam:", ", ".join(j["id"] for j in falta.values())[:2000])
