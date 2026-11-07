"""Ateliê Brasil: gera as páginas de colorir a partir das ilustrações "colorida | P&B".
Para cada art/<k>.jpg usa SÓ a metade colorida (à esquerda):
  pages/<k>.png        mapa de áreas em 16 bits (id = R + 256*G)
  pages/<k>.lines.jpg  o contorno preto da própria ilustração (escuro = traço)
  pages/<k>.orig.jpg   a ilustração colorida no tamanho da página (aparece quando a cor está certa)
  pages/<k>.json       {w,h,cols,regions:[{id,c,ok?,x,y,r,a}]}
uso: python3 tools/build_folk.py [chaves...]      prévia: python3 tools/preview_folk.py
"""
import sys, os, json
import numpy as np, cv2
from scipy import ndimage as ndi
sys.path.insert(0, os.path.dirname(__file__))
from kidcolor import classify_rgb, NAMES

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = f"{ROOT}/pages"; os.makedirs(OUT, exist_ok=True)
# chave: alvo de áreas pintáveis (poucas = fácil)
JOBS = {"saci": 45, "curupira": 40, "iara": 40, "boto": 40, "lobisomem": 40, "boitata": 95, "caipora": 70, "cuca": 45, "boi": 50,
        "grupo": 110, "vitoria": 35, "caboclo": 40, "joaodebarro": 35, "matinta": 50, "paidomato": 40, "fulozinha": 40, "mapinguari": 35}


def colored_half(img):
    """devolve só a parte colorida. Aceita "colorida | traço" (lado a lado) ou "colorida em cima / traço embaixo".
    A parte colorida é a que tem cor (saturação); o corte é a primeira faixa sem cor depois dela."""
    hsv = cv2.cvtColor(img, cv2.COLOR_RGB2HSV)
    sat = (hsv[..., 1] > 60) & (hsv[..., 2] > 40)
    h, w = sat.shape
    lr = sat[:, :w // 2].sum() / max(1, sat[:, w // 2:].sum()); tb = sat[:h // 2].sum() / max(1, sat[h // 2:].sum())
    vert = tb > lr                       # cor concentrada em cima -> corte horizontal
    prof = sat.mean(1 if vert else 0); n = len(prof); run = max(6, int(n * .015))
    seam = n
    for x in range(int(n * .3), n - run):
        if prof[x:x + run].max() < .004 and prof[x + run:].sum() < prof[:x].sum() * .08: seam = x; break
    part = img[:seam] if vert else img[:, :seam]
    m = ~((part.min(2) > 232) | (part.max(2) < 25))   # tira margens brancas (e a linha divisória preta das antigas)
    ys, xs = np.where(m); y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    if not vert:   # imagens antigas: uma linha preta vertical colada no corte
        while x1 - x0 > 50 and (part[y0:y1, x1 - 1].max(1) < 70).mean() > .7: x1 -= 1
    pad = 12
    return part[max(0, y0 - pad):y1 + pad, max(0, x0 - pad):x1 + pad]


def comps(idx, n, barrier):
    reg = np.zeros(idx.shape, np.int32); t = 0
    for c in range(n):
        m = ((idx == c) & ~barrier).astype(np.uint8)
        cnt, l = cv2.connectedComponents(m, connectivity=4); k = l > 0; reg[k] = l[k] + t; t += cnt - 1
    return reg, t


def merge_small(reg, n, cls, line, target, tmin, thin=None):
    """junta a menor área com a vizinha de maior fronteira (de preferência da mesma cor) até ter <= target áreas"""
    import heapq
    K = len(NAMES); votes = np.bincount((reg[~line] * K + cls[~line]).ravel(), minlength=(n + 1) * K).reshape(n + 1, K).astype(np.int64)
    area = np.bincount(reg.ravel(), minlength=n + 1).astype(np.int64)
    edges = [dict() for _ in range(n + 1)]
    for A, B in ((reg[:, :-1], reg[:, 1:]), (reg[:-1], reg[1:])):
        d = A != B; pa, pb = A[d], B[d]; key = np.minimum(pa, pb) * (n + 1) + np.maximum(pa, pb)
        u, c = np.unique(key, return_counts=True)
        for k, w in zip(u.tolist(), c.tolist()):
            i, j = divmod(k, n + 1); edges[i][j] = edges[i].get(j, 0) + w; edges[j][i] = edges[j].get(i, 0) + w
    parent = list(range(n + 1)); alive = n; thin = np.zeros(n + 1, bool) if thin is None else thin
    key = lambda i: 0 if thin[i] else int(area[i])
    hp = [(key(i), i) for i in range(1, n + 1)]; heapq.heapify(hp)
    def find(x):
        while parent[x] != x: parent[x] = parent[parent[x]]; x = parent[x]
        return x
    while hp:
        ar, i = heapq.heappop(hp)
        if parent[i] != i or ar != key(i): continue
        if not thin[i] and ar >= tmin and alive <= target: break
        if not edges[i]: continue
        ci = votes[i].argmax()
        j = max(edges[i], key=lambda k: edges[i][k] * (2.5 if votes[k].argmax() == ci else 1))
        parent[i] = j; area[j] += area[i]; votes[j] += votes[i]; alive -= 1
        for k, w in edges[i].items():
            if k == j: continue
            edges[j][k] = edges[j].get(k, 0) + w; edges[k][j] = edges[k].get(j, 0) + w; edges[k].pop(i, None)
        edges[j].pop(i, None); edges[i] = {}
        heapq.heappush(hp, (key(j), j))
    roots = np.array([find(i) for i in range(n + 1)]); u = np.unique(roots[1:]); lut = np.zeros(n + 1, np.int32); lut[u] = np.arange(1, len(u) + 1)
    return lut[roots][reg], len(u)


def build(key, target, W=900):
    img = cv2.cvtColor(cv2.imread(f"{ROOT}/art/{key}.jpg"), cv2.COLOR_BGR2RGB)
    img = colored_half(img)
    h, w = img.shape[:2]; s = W / max(h, w)
    img = cv2.resize(img, (round(w * s), round(h * s)), interpolation=cv2.INTER_AREA); H, Wd = img.shape[:2]
    # 1) traço: pixels escuros e finos (áreas pretas grandes, como o tucano, continuam pintáveis)
    g = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)
    dark = (g < 85).astype(np.uint8)
    thick = cv2.morphologyEx(dark, cv2.MORPH_OPEN, np.ones((9, 9), np.uint8))
    line = (dark > 0) & ~(cv2.dilate(thick, np.ones((3, 3), np.uint8)) > 0)
    # 2) cores chapadas: agrupa as cores da ilustração (k-means em Lab) - a pele fica uma cor só
    sm = cv2.medianBlur(img, 5)
    L = cv2.cvtColor(sm, cv2.COLOR_RGB2LAB).reshape(-1, 3).astype(np.float32)
    samp = L[~line.ravel()][::7]
    _, _, cen = cv2.kmeans(samp, 18, None, (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 30, .5), 3, cv2.KMEANS_PP_CENTERS)
    idx = ((L[:, None, :] - cen[None]) ** 2).sum(-1).argmin(1).reshape(H, Wd).astype(np.int32)
    cols = list(range(len(cen)))
    cls = classify_rgb(sm)
    cen_rgb = cv2.cvtColor(np.clip(cen, 0, 255).astype(np.uint8)[None], cv2.COLOR_LAB2RGB)[0]
    cname = [NAMES[c] for c in classify_rgb(cen_rgb[None])[0]]
    # 3) áreas = componentes da mesma cor separadas pelo traço; o traço vai para a área mais próxima
    reg, n = comps(idx, len(cols), line)
    _, (iy, ix) = ndi.distance_transform_edt(reg == 0, return_indices=True); reg = reg[iy, ix]
    edge = np.zeros(reg.shape, np.uint8); edge[:, 1:] |= reg[:, 1:] != reg[:, :-1]; edge[1:] |= reg[1:] != reg[:-1]
    dt = cv2.distanceTransform(1 - edge, cv2.DIST_L2, 3)
    thick = np.zeros(n + 1); np.maximum.at(thick, reg.ravel(), dt.ravel())   # áreas finas (anéis, fiapos) são difíceis de pintar
    reg, n = merge_small(reg, n, cls, line, target, H * Wd * .0004, thick < 4.5)
    areas = np.bincount(reg.ravel(), minlength=n + 1); regions = []
    for i in range(1, n + 1):
        m = reg == i
        mm = m & ~line
        if mm.sum() < 5: mm = m
        v = np.bincount(idx[mm], minlength=len(cen)); o = np.argsort(-v)
        c = cname[o[0]]; ok = [cname[j] for j in o[1:3] if v[j] > v[o[0]] * .3 and cname[j] != c][:1]
        dd = cv2.distanceTransform(np.pad(m, 1).astype(np.uint8), cv2.DIST_L2, 5)[1:-1, 1:-1]; y, x = np.unravel_index(dd.argmax(), dd.shape)
        r = {"id": i, "c": c, "x": int(x), "y": int(y), "r": round(float(dd.max()), 1), "a": int(areas[i])}
        if ok: r["ok"] = ok
        if c == "white" and (m[0].any() or m[-1].any() or m[:, 0].any() or m[:, -1].any()) and areas[i] > H * Wd * .05: r["lock"] = 1   # fundo
        regions.append(r); continue
        regions.append(r)
    png = np.zeros((H, Wd, 3), np.uint8); png[..., 2] = reg & 255; png[..., 1] = reg >> 8
    cv2.imwrite(f"{OUT}/{key}.png", png, [cv2.IMWRITE_PNG_COMPRESSION, 9])
    ln = cv2.GaussianBlur((line * 255).astype(np.uint8), (3, 3), 0)
    cv2.imwrite(f"{OUT}/{key}.lines.jpg", 255 - ln, [cv2.IMWRITE_JPEG_QUALITY, 80])
    cv2.imwrite(f"{OUT}/{key}.orig.jpg", cv2.cvtColor(img, cv2.COLOR_RGB2BGR), [cv2.IMWRITE_JPEG_QUALITY, 84])
    used = sorted({r["c"] for r in regions if not r.get("lock")} | {o for r in regions if not r.get("lock") for o in r.get("ok", [])})
    json.dump({"w": Wd, "h": H, "cols": used, "regions": regions}, open(f"{OUT}/{key}.json", "w"), separators=(",", ":"))
    return n, used


if __name__ == "__main__":
    for k in (sys.argv[1:] or list(JOBS)):
        n, cols = build(k, JOBS[k]); print(k, n, ",".join(cols), flush=True)
    sizes = {f[:-5]: [json.load(open(f"{OUT}/{f}"))[d] for d in "wh"] for f in sorted(os.listdir(OUT)) if f.endswith(".json")}
    open(f"{ROOT}/js/paginas.js", "w").write("/* gerado por tools/build_folk.py: tamanho de cada página */\nconst PAGINAS = " + json.dumps(sizes, separators=(",", ":")) + ";\n")
