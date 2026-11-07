"""Ateliê Brasil: páginas de colorir a partir das ilustrações "colorida | só traço" (lado a lado ou em cima/embaixo).
O CONTORNO é o do próprio desenho (a metade só com traço), sem redesenhar nada:
  pages/<k>.lines.jpg  a metade de traço, como veio (escuro = linha)
  pages/<k>.orig.jpg   a metade colorida, alinhada à de traço (gabarito, figurinhas, miniaturas)
  pages/<k>.json       {w,h,cols,regions:[{id,c,ok?,x,y,r,a,lock?}],rle:[id,n,id,n,...]}
As áreas são os espaços fechados pelo traço (o toque enche a área inteira); a cor de cada área vem da metade colorida.
O mapa de áreas vai em "rle" (números puros), sem PNG: imagem recomprimida não estraga o mapa.
uso: python3 tools/build_folk.py [chaves...]      prévia: python3 tools/preview_folk.py
"""
import sys, os, json
import numpy as np, cv2
from scipy import ndimage as ndi
sys.path.insert(0, os.path.dirname(__file__))
from kidcolor import classify_rgb, NAMES

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = f"{ROOT}/pages"; os.makedirs(OUT, exist_ok=True)
FORTE = {"grupo": 3}     # desenhos com muito detalhe: junta mais as áreas pequenas da mesma cor
KEYS = ["curupira", "iara", "boto", "lobisomem", "cuca", "boi", "grupo", "vitoria", "caboclo", "joaodebarro", "matinta", "paidomato", "fulozinha", "mapinguari"]


def halves(img):
    """separa a parte colorida e a parte só de traço; cada uma recortada no conteúdo"""
    hsv = cv2.cvtColor(img, cv2.COLOR_RGB2HSV)
    sat = (hsv[..., 1] > 60) & (hsv[..., 2] > 40)
    h, w = sat.shape
    lr = sat[:, :w // 2].sum() / max(1, sat[:, w // 2:].sum()); tb = sat[:h // 2].sum() / max(1, sat[h // 2:].sum())
    vert = tb > lr
    ink = (img.min(2) < 200)
    sp = sat.mean(1 if vert else 0); ip = ink.mean(1 if vert else 0); n = len(sp); run = max(6, int(n * .012))
    seam = n // 2
    for x in range(int(n * .3), n - run):          # primeira faixa vazia depois da parte colorida
        if sp[x:x + run].max() < .004 and sp[x + run:].sum() < sp[:x].sum() * .08:
            seam = x + int(np.argmin(ip[x:x + run * 3])) if ip[x:x + run * 3].size else x; break
    a, b = (img[:seam], img[seam:]) if vert else (img[:, :seam], img[:, seam:])
    def crop(p):
        m = p.min(2) < 225; ys, xs = np.where(m)
        return p[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    return crop(a), crop(b)


def align(col, g):
    """encaixa a colorida sobre o traço: tenta "sem mexer" e o ajuste ECC (grosso e depois fino) e fica com o que casa melhor"""
    lin = ((g < 150) * 255).astype(np.float32); cl = ((col.max(2) < 90) * 255).astype(np.float32)
    H, W = g.shape; sm = .5
    def blur(x, s_): return cv2.resize(cv2.GaussianBlur(x, (0, 0), s_), None, fx=sm, fy=sm)
    def warped(wp, x): w2 = wp.copy(); w2[:, 2] *= 1 / sm; return cv2.warpAffine(x, w2, (W, H), flags=cv2.INTER_LINEAR + cv2.WARP_INVERSE_MAP, borderValue=0)
    def score(wp):
        a_ = cv2.GaussianBlur(lin, (0, 0), 2); b_ = cv2.GaussianBlur(warped(wp, cl), (0, 0), 2)
        return float((a_ * b_).sum() / (np.sqrt((a_ ** 2).sum() * (b_ ** 2).sum()) + 1e-6))
    best, bs = np.eye(2, 3, dtype=np.float32), None; bs = score(best)
    wp = np.eye(2, 3, dtype=np.float32)
    for s_ in (8, 4, 2):
        try:
            _, wp = cv2.findTransformECC(blur(lin, s_), blur(cl, s_), wp.copy(), cv2.MOTION_AFFINE, (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 300, 1e-6), None, 1)
        except cv2.error:
            break
        if abs(wp[0, 0] - 1) < .2 and abs(wp[1, 1] - 1) < .2:
            sc = score(wp)
            if sc > bs: best, bs = wp.copy(), sc
    w2 = best.copy(); w2[:, 2] *= 1 / sm
    return cv2.warpAffine(col, w2, (W, H), flags=cv2.INTER_LINEAR + cv2.WARP_INVERSE_MAP, borderMode=cv2.BORDER_CONSTANT, borderValue=(255, 255, 255))


def comps(mask):
    n, lab = cv2.connectedComponents(mask.astype(np.uint8), connectivity=4); return lab, n - 1


def merge(reg, n, color_of, rules):
    """junta áreas pequenas na vizinha (de preferência da mesma cor). rules: [(limite_area, só_mesma_cor), ...]"""
    import heapq
    area = np.bincount(reg.ravel(), minlength=n + 1).astype(np.int64)
    edges = [dict() for _ in range(n + 1)]
    for A, B in ((reg[:, :-1], reg[:, 1:]), (reg[:-1], reg[1:])):
        d = (A != B) & (A > 0) & (B > 0); pa, pb = A[d], B[d]; key = np.minimum(pa, pb).astype(np.int64) * (n + 1) + np.maximum(pa, pb)
        u, c = np.unique(key, return_counts=True)
        for k, wgt in zip(u.tolist(), c.tolist()):
            i, j = divmod(k, n + 1); edges[i][j] = edges[i].get(j, 0) + wgt; edges[j][i] = edges[j].get(i, 0) + wgt
    parent = list(range(n + 1)); col = list(color_of)
    def find(x):
        while parent[x] != x: parent[x] = parent[parent[x]]; x = parent[x]
        return x
    for lim, same in rules:
        hp = [(int(area[i]), i) for i in range(1, n + 1) if parent[i] == i and area[i] < lim]; heapq.heapify(hp)
        while hp:
            ar, i = heapq.heappop(hp)
            if parent[i] != i or ar != area[i] or not edges[i]: continue
            cand = {k: w for k, w in edges[i].items() if col[k] == col[i]} if same else edges[i]
            if not cand: continue
            j = max(cand, key=lambda k: cand[k] * (3 if col[k] == col[i] else 1))
            parent[i] = j; area[j] += area[i]
            for k, w in edges[i].items():
                if k == j: continue
                edges[j][k] = edges[j].get(k, 0) + w; edges[k][j] = edges[k].get(j, 0) + w; edges[k].pop(i, None)
            edges[j].pop(i, None); edges[i] = {}
            if area[j] < lim: heapq.heappush(hp, (int(area[j]), j))
    roots = np.array([find(i) for i in range(n + 1)]); roots[0] = 0
    u = np.unique(roots[1:]); lut = np.zeros(n + 1, np.int32); lut[u] = np.arange(1, len(u) + 1)
    return lut[roots][reg], len(u)


_F = {"warm": "yellow gold orange peach beige cream brown", "red": "red darkred pink", "green": "green darkgreen lightgreen",
      "blue": "blue lightblue darkblue purple", "white": "white", "gray": "gray black"}
FAM = np.array([next(i for i, v in enumerate(_F.values()) if n_ in v.split()) for n_ in NAMES])   # famílias: sombra não separa área


def unleak(reg, n, cls, dark, A):
    """traço com fresta faz duas partes vazarem uma na outra (corpo+árvore, corpo+fundo):
    numa área grande, cada pedaço grande de uma cor só (na colorida) vira área própria; o resto vai para o pedaço mais perto"""
    from skimage.measure import label
    nid = n
    for i in range(1, n + 1):
        m = reg == i; ar = int(m.sum())
        if ar < A * .01: continue
        ys, xs = np.where(m); y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
        mm = m[y0:y1, x0:x1]; c = np.where(mm & ~dark[y0:y1, x0:x1], FAM[cls[y0:y1, x0:x1]], -1)
        lab = label(c + 1, background=0, connectivity=1); cnt = np.bincount(lab.ravel()); cnt[0] = 0
        big = [j for j in np.argsort(-cnt) if cnt[j] >= max(A * .004, ar * .1)]
        if len(big) < 2: continue
        keep = np.zeros_like(lab)
        for t, j in enumerate(big): keep[lab == j] = t + 1
        _, (iy, ix) = ndi.distance_transform_edt(keep == 0, return_indices=True); near = keep[iy, ix]
        sub = reg[y0:y1, x0:x1]
        for t in range(2, len(big) + 1): nid += 1; sub[mm & (near == t)] = nid
    return reg, nid


def build(key, W=900):
    img = cv2.cvtColor(cv2.imread(f"{ROOT}/art/{key}.jpg"), cv2.COLOR_BGR2RGB)
    col, lin = halves(img)
    h, w = lin.shape[:2]; s = W / max(h, w); H, Wd = round(h * s), round(w * s)
    lin = cv2.resize(lin, (Wd, H), interpolation=cv2.INTER_AREA)
    col = cv2.resize(col, (Wd, H), interpolation=cv2.INTER_AREA)
    g = cv2.cvtColor(lin, cv2.COLOR_RGB2GRAY)
    col = align(col, g)                                                      # encaixa a colorida exatamente sobre o traço
    line = g < 170                                                           # o traço do desenho (é o que aparece)
    bar = line | cv2.morphologyEx(line.astype(np.uint8), cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))).astype(bool)  # barreira: fecha frestas do traço
    reg, n = comps(~bar)
    # cor de cada área pela metade colorida (ignora o contorno preto da colorida)
    cls = classify_rgb(cv2.medianBlur(col, 3)); dark = col.max(2) < 70
    reg, n = unleak(reg, n, cls, dark, H * Wd)
    color_of = ["white"] * (n + 1); votes = {}
    K = len(NAMES); flat = reg.ravel(); ok = (~dark).ravel() & (flat > 0)
    tab = np.bincount(flat[ok] * K + cls.ravel()[ok], minlength=(n + 1) * K).reshape(n + 1, K)
    tab_all = np.bincount(flat[flat > 0] * K + cls.ravel()[flat > 0], minlength=(n + 1) * K).reshape(n + 1, K)
    for i in range(1, n + 1):
        t = tab[i] if tab[i].sum() >= 3 else tab_all[i]
        color_of[i] = NAMES[int(t.argmax())] if t.sum() else "white"; votes[i] = t
    A = H * Wd
    f_ = FORTE.get(key, 1)
    # o traço pertence à área mais próxima (o toque no traço também pinta; e assim as vizinhas se "encostam" para juntar)
    _, (iy, ix) = ndi.distance_transform_edt(reg == 0, return_indices=True); full = reg[iy, ix]
    full, n2 = merge(full, n, color_of, [(A * .00006 * f_, False), (A * .0025 * f_, True), (A * .00035 * f_, False)])
    areas = np.bincount(full.ravel(), minlength=n2 + 1); regions = []
    for i in range(1, n2 + 1):
        m = full == i; mm = m & ~line & ~dark
        t = np.bincount(cls[mm] if mm.sum() >= 3 else cls[m], minlength=K); o = np.argsort(-t)
        c = NAMES[o[0]]; alt = [NAMES[j] for j in o[1:2] if t[j] > t[o[0]] * .35]
        dd = cv2.distanceTransform(np.pad(m & ~line, 1).astype(np.uint8), cv2.DIST_L2, 5)[1:-1, 1:-1]
        if dd.max() == 0: dd = cv2.distanceTransform(np.pad(m, 1).astype(np.uint8), cv2.DIST_L2, 5)[1:-1, 1:-1]
        y, x = np.unravel_index(dd.argmax(), dd.shape)
        r = {"id": i, "c": c, "x": int(x), "y": int(y), "r": round(float(dd.max()), 1), "a": int(areas[i])}
        if alt: r["ok"] = alt
        if c == "white" and (m[0].any() or m[-1].any() or m[:, 0].any() or m[:, -1].any()) and areas[i] > A * .03: r["lock"] = 1   # fundo = papel
        regions.append(r)
    # rle do mapa de áreas
    f = full.ravel(); cut = np.flatnonzero(np.diff(f)) + 1; starts = np.r_[0, cut]; lens = np.diff(np.r_[starts, f.size])
    rle = np.stack([f[starts], lens], 1).ravel().tolist()
    cv2.imwrite(f"{OUT}/{key}.lines.jpg", g, [cv2.IMWRITE_JPEG_QUALITY, 90])
    cv2.imwrite(f"{OUT}/{key}.orig.jpg", cv2.cvtColor(col, cv2.COLOR_RGB2BGR), [cv2.IMWRITE_JPEG_QUALITY, 86])
    for old in (f"{OUT}/{key}.png",):
        if os.path.exists(old): os.remove(old)
    used = sorted({r["c"] for r in regions if not r.get("lock")} | {o for r in regions if not r.get("lock") for o in r.get("ok", [])})
    json.dump({"w": Wd, "h": H, "cols": used, "regions": regions, "rle": rle}, open(f"{OUT}/{key}.json", "w"), separators=(",", ":"))
    return sum(1 for r in regions if not r.get("lock")), used


def sizes():
    s = {f[:-5]: [json.load(open(f"{OUT}/{f}"))[d] for d in "wh"] for f in sorted(os.listdir(OUT)) if f.endswith(".json")}
    open(f"{ROOT}/js/paginas.js", "w").write("/* gerado por tools/build_folk.py: tamanho de cada página */\nconst PAGINAS = " + json.dumps(s, separators=(",", ":")) + ";\n")


if __name__ == "__main__":
    for k in (sys.argv[1:] or KEYS):
        n, cols = build(k); print(k, n, "áreas", ",".join(cols), flush=True)
    sizes()
