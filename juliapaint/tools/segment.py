"""Turn a painting into a kid-friendly colour-by-region page.
Usage: python3 segment.py <art.jpg> <out_prefix> <maxRegions> <color,color,...> [smooth]
Outputs <out_prefix>.png (region id in R channel, id 0 unused) and <out_prefix>.json.
"""
import sys, json
import numpy as np, cv2
from scipy import ndimage as ndi
sys.path.insert(0, __file__.rsplit("/", 1)[0])
from palette import PALETTE

def hex2rgb(h): return [int(h[i:i + 2], 16) for i in (1, 3, 5)]

def to_lab(rgb_arr):
    a = np.asarray(rgb_arr, np.uint8).reshape(-1, 1, 3)
    return cv2.cvtColor(a, cv2.COLOR_RGB2LAB).reshape(-1, 3).astype(np.float32)

def mode_filter(lab_idx, ncol, k):
    best, bestv = None, None
    for c in range(ncol):
        v = cv2.blur((lab_idx == c).astype(np.float32), (k, k))
        if best is None: best, bestv = np.zeros_like(lab_idx), v
        else: m = v > bestv; best[m] = c; bestv = np.maximum(bestv, v)
    return best

def components(cidx, ncol):
    reg = np.zeros(cidx.shape, np.int32); n = 0
    for c in range(ncol):
        cnt, lab = cv2.connectedComponents((cidx == c).astype(np.uint8), connectivity=4)
        m = lab > 0; reg[m] = lab[m] + n; n += cnt - 1
    return reg, n

def fill_small(cidx, ncol, thr):
    reg, n = components(cidx, ncol)
    areas = np.bincount(reg.ravel(), minlength=n + 1)
    small = areas[reg] < thr
    if not small.any(): return cidx, n, False
    _, (iy, ix) = ndi.distance_transform_edt(small, return_indices=True)
    out = cidx[iy, ix]
    return out, n, True

def run(src, out, maxN, cols, smooth=1.0, W=560, lw=.6, lines=False, crop=0, vivid=True, minfrac=.0012):
    img = cv2.cvtColor(cv2.imread(src), cv2.COLOR_BGR2RGB)
    if crop:
        ch, cw = img.shape[:2]; dy, dx = int(ch * crop), int(cw * crop); img = img[dy:ch - dy, dx:cw - dx]
    h, w = img.shape[:2]; s = W / max(h, w); img = cv2.resize(img, (round(w * s), round(h * s)), interpolation=cv2.INTER_AREA)
    H, Wd = img.shape[:2]
    sm = cv2.pyrMeanShiftFiltering(cv2.cvtColor(img, cv2.COLOR_RGB2BGR), int(12 * smooth), int(28 * smooth))
    sm = cv2.medianBlur(sm, 7); sm = cv2.cvtColor(sm, cv2.COLOR_BGR2RGB)
    pal = [hex2rgb(PALETTE[c][0]) for c in cols]; plab = to_lab(pal)
    lab = to_lab(sm.reshape(-1, 3))
    if vivid:  # stretch lightness and boost chroma so muted paintings map to the right paint
        L = lab[:, 0]; lo, hi = np.percentile(L, 3), np.percentile(L, 97)
        plo, phi = plab[:, 0].min(), plab[:, 0].max()
        lab[:, 0] = np.clip((L - lo) / max(1, hi - lo) * (phi - plo) + plo, 0, 255)
        ab = lab[:, 1:] - 128; chroma = np.sqrt((ab ** 2).sum(1)); c90 = np.percentile(chroma, 90)
        pch = np.sqrt(((plab[:, 1:] - 128) ** 2).sum(1)); target = np.percentile(pch, 60)
        f = np.clip(target / max(c90, 1), 1, 3.0); lab[:, 1:] = ab * f + 128
    d = ((lab[:, None, :] - plab[None, :, :]) ** 2 * np.array([lw, 1, 1], np.float32)).sum(-1)
    cidx = d.argmin(1).reshape(H, Wd).astype(np.int32)
    lock = None
    if lines:
        g = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY); lock = cv2.morphologyEx((g < 70).astype(np.uint8), cv2.MORPH_OPEN, np.ones((3, 3), np.uint8)) > 0
        cidx[lock] = cols.index("black")
    k = max(5, int(9 * smooth)) | 1
    for _ in range(3): cidx = mode_filter(cidx, len(cols), k)
    if lock is not None: cidx[lock] = cols.index('black')
    area = H * Wd
    thr = area * minfrac
    for t in [20, 80, 250, thr]:
        for _ in range(4):
            cidx, n, ch = fill_small(cidx, len(cols), t)
            if not ch: break
    cidx = mode_filter(cidx, len(cols), 7)
    while True:
        cidx, n, ch = fill_small(cidx, len(cols), thr)
        reg, n = components(cidx, len(cols))
        if n <= maxN and not ch: break
        if n > maxN: thr *= 1.18
    reg, n = components(cidx, len(cols))
    areas = np.bincount(reg.ravel(), minlength=n + 1)
    # remove remaining slivers (very thin regions are hard to tap)
    regions = []
    for i in range(1, n + 1):
        m = reg == i
        dist = cv2.distanceTransform(np.pad(m, 1).astype(np.uint8), cv2.DIST_L2, 5)[1:-1, 1:-1]
        y, x = np.unravel_index(dist.argmax(), dist.shape)
        c = int(np.bincount(cidx[m]).argmax())
        rr = {"id": i, "c": cols[c], "x": int(x), "y": int(y), "r": round(float(dist.max()), 1), "a": int(areas[i])}
        if lines and cols[c] == "black": rr["lock"] = 1
        regions.append(rr)
    g = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY).astype(np.float32)
    detail = np.clip((g - cv2.GaussianBlur(g, (0, 0), 6)) * 1.6 + 128, 0, 255).astype(np.uint8)
    inv = 255 - cv2.GaussianBlur(g, (0, 0), 2.2); sketch = np.clip(g * 255 / np.maximum(1, 255 - inv + 1), 0, 255)
    sketch = np.clip(255 - (255 - sketch) * 1.4, 0, 255).astype(np.uint8)
    cv2.imwrite(out + ".png", reg.astype(np.uint8), [cv2.IMWRITE_PNG_COMPRESSION, 9])
    tex = np.zeros((H, Wd, 3), np.uint8); tex[..., 2] = sketch; tex[..., 1] = detail  # JPEG: R=sketch G=detail
    cv2.imwrite(out + ".tex.jpg", tex, [cv2.IMWRITE_JPEG_QUALITY, 72])
    json.dump({"w": Wd, "h": H, "regions": regions}, open(out + ".json", "w"), separators=(",", ":"))
    return n

if __name__ == "__main__":
    a = sys.argv
    print(run(a[1], a[2], int(a[3]), a[4].split(','), float(a[5]) if len(a) > 5 else 1.0))
