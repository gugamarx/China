"""Página de colorir do MAPA DO BRASIL (uma área por estado; o DF entra junto com Goiás).
Desenha o js/mapa.js no Chrome (Playwright) e gera pages/mapa.{lines.jpg,orig.jpg,json} no mesmo formato das outras.
Cada estado tem a cor da sua região; o json traz "words" (nome do estado em sílabas) para as palavras escondidas.
uso: python3 tools/build_mapa.py"""
import os, re, json, asyncio
import numpy as np, cv2
from playwright.async_api import async_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); OUT = f"{ROOT}/pages"
REGIAO = {"norte": ["am", "pa", "ac", "ro", "rr", "ap", "to"], "nordeste": ["ma", "pi", "ce", "rn", "pb", "pe", "al", "se", "ba"],
          "centro": ["mt", "ms", "go", "df"], "sudeste": ["sp", "rj", "mg", "es"], "sul": ["pr", "sc", "rs"]}
COR = {"norte": "green", "nordeste": "red", "centro": "yellow", "sudeste": "brown", "sul": "blue"}
HEX = {"green": "#2fa84f", "red": "#e3262e", "yellow": "#ffd23f", "brown": "#8a5a2b", "blue": "#2560d9"}
SIL = {"ac": "A-CRE", "al": "A-LA-GO-AS", "ap": "A-MA-PÁ", "am": "A-MA-ZO-NAS", "ba": "BA-HI-A", "ce": "CE-A-RÁ", "es": "ES-PÍ-RI-TO SAN-TO",
       "go": "GOI-ÁS", "ma": "MA-RA-NHÃO", "mt": "MA-TO GROS-SO", "ms": "MA-TO GROS-SO DO SUL", "mg": "MI-NAS GE-RAIS", "pa": "PA-RÁ",
       "pb": "PA-RA-Í-BA", "pr": "PA-RA-NÁ", "pe": "PER-NAM-BU-CO", "pi": "PI-AU-Í", "rj": "RI-O DE JA-NEI-RO", "rn": "RI-O GRAN-DE DO NOR-TE",
       "rs": "RI-O GRAN-DE DO SUL", "ro": "RON-DÔ-NIA", "rr": "RO-RAI-MA", "sc": "SAN-TA CA-TA-RI-NA", "sp": "SÃO PAU-LO", "se": "SER-GI-PE", "to": "TO-CAN-TINS"}
src = open(f"{ROOT}/js/mapa.js").read(); MAPA = json.loads(src[src.index("{"):src.rindex("}") + 1])
UFS = [u for u in MAPA["uf"] if u != "df"]; UID = {u: i + 1 for i, u in enumerate(UFS)}; UID["df"] = UID["go"]
REG_OF = {u: r for r, us in REGIAO.items() for u in us}
W = 860; vb = [float(v) for v in MAPA["vb"].split()]; H = round(W * vb[3] / vb[2])

def page(mode):
    paths = []
    for u, (_, d) in MAPA["uf"].items():
        if mode == "ids": i = UID[u]; paths.append(f'<path d="{d}" fill="rgb({i},{i},{i})" stroke="rgb({i},{i},{i})" stroke-width="1.2"/>')
        elif mode == "lines": paths.append(f'<path d="{d}" fill="none" stroke="#000" stroke-width="2.2" stroke-linejoin="round"/>')
        else: paths.append(f'<path d="{d}" fill="{HEX[COR[REG_OF[u]]]}" stroke="#1e1b1e" stroke-width="2.2" stroke-linejoin="round"/>')
    sr = ' shape-rendering="crispEdges"' if mode == "ids" else ""
    return f'<html><body style="margin:0;background:#fff"><svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="{MAPA["vb"]}"{sr}>{"".join(paths)}</svg></body></html>'

async def shots():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/usr/bin/google-chrome"); pg = await b.new_page(viewport={"width": W, "height": H})
        out = {}
        for m in ("ids", "lines", "orig"):
            await pg.set_content(page(m)); out[m] = await pg.screenshot(clip={"x": 0, "y": 0, "width": W, "height": H})
        await b.close(); return out

def main():
    s = asyncio.run(shots()); dec = lambda b: cv2.imdecode(np.frombuffer(b, np.uint8), cv2.IMREAD_COLOR)
    ids = dec(s["ids"])[..., 0].astype(np.int32); ids[ids > len(UFS)] = 0          # branco (255) = fora do Brasil
    lines = cv2.cvtColor(dec(s["lines"]), cv2.COLOR_BGR2GRAY); orig = dec(s["orig"])
    # margem: corta o branco em volta
    ys, xs = np.where(ids > 0); y0, y1, x0, x1 = max(0, ys.min() - 10), ys.max() + 11, max(0, xs.min() - 10), xs.max() + 11
    ids, lines, orig = ids[y0:y1, x0:x1], lines[y0:y1, x0:x1], orig[y0:y1, x0:x1]; h, w = ids.shape
    regions, words = [], []
    for u in UFS:
        i = UID[u]; m = ids == i
        if not m.any(): continue
        dd = cv2.distanceTransform(np.pad(m, 1).astype(np.uint8), cv2.DIST_L2, 5)[1:-1, 1:-1]; y, x = np.unravel_index(dd.argmax(), dd.shape)
        regions.append({"id": i, "c": COR[REG_OF[u]], "x": int(x), "y": int(y), "r": round(float(dd.max()), 1), "a": int(m.sum()), "uf": u})
        words.append([SIL[u], round(x / w, 3), round(y / h, 3), "📍"])
    f = ids.ravel().astype(np.int64); cut = np.flatnonzero(np.diff(f)) + 1; st = np.r_[0, cut]
    rle = np.stack([f[st], np.diff(np.r_[st, f.size])], 1).ravel().tolist()
    if os.path.exists(f"{OUT}/mapa.png"): os.remove(f"{OUT}/mapa.png")
    cv2.imwrite(f"{OUT}/mapa.lines.jpg", lines, [cv2.IMWRITE_JPEG_QUALITY, 85])
    cv2.imwrite(f"{OUT}/mapa.orig.jpg", orig, [cv2.IMWRITE_JPEG_QUALITY, 88])
    used = sorted({r["c"] for r in regions})
    json.dump({"w": w, "h": h, "cols": used, "regions": regions, "words": words, "rle": rle}, open(f"{OUT}/mapa.json", "w"), ensure_ascii=False, separators=(",", ":"))
    print("mapa", len(regions), "estados", w, "x", h)

if __name__ == "__main__":
    main()
