"""Julia Paint v3 page builder.
For each painting in art2/<key>.jpg produce, in pages3/:
  <key>.png        region ids, 16-bit packed: id = R + 256*G
  <key>.lines.jpg  the painter's own lines (dark = line), drawn over the page at low opacity
  <key>.orig.jpg   the original resized to the page size (revealed when a colour is right)
  <key>.json       {w,h,regions:[{id,c,ok,x,y,r,a}]}
usage: python3 tools/build_v3.py [keys...]
"""
import sys, os, json
import numpy as np, cv2
from scipy import ndimage as ndi
sys.path.insert(0, os.path.dirname(__file__))
from palette import PALETTE
from kidcolor import classify_rgb, norm_of
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = f"{ROOT}/pages3"; os.makedirs(OUT, exist_ok=True)
# key: (target areas, smoothing, extra) - extra: lines=True for Mondrian-like black bars
JOBS = {
 "mondrian": (12, .5, dict(lines=True, crop=.025)), "snail": (16, .6, {}), "red_fuji": (45, .8, {}), "abaporu": (66, .8, {}),
 "kandinsky": (70, .8, {}), "sportsmen": (70, .7, {}), "senecio": (60, .7, {}), "bruant": (70, .7, {}),
 "blue_horse": (110, .7, {}), "yellow_cow": (110, .7, {}), "sunflowers": (100, .8, {}), "scream": (100, .8, {}),
 "nianhua": (120, .6, {}), "afklint": (90, .7, {}), "castle": (130, .6, {}), "hiroshige": (110, .7, {}),
 "nebamun": (140, .7, {}), "wave": (140, .7, {}), "starry": (160, .8, {}), "bedroom": (130, .7, {}),
 "tiger": (170, .8, {}), "treeoflife": (160, .7, {}), "vertumnus": (200, .7, {}), "pearl": (70, .9, {}), "monalisa": (90, .9, {}),
}
NAMES = list(PALETTE); PRGB = np.array([[int(PALETTE[c][0][i:i + 2], 16) for i in (1, 3, 5)] for c in NAMES], np.uint8)
def lab(a): return cv2.cvtColor(np.asarray(a, np.uint8).reshape(-1, 1, 3), cv2.COLOR_RGB2LAB).reshape(-1, 3).astype(np.float32)
PLAB = lab(PRGB)
MUD = np.array([12 if c in ("gray", "beige", "brown") else 0 for c in PALETTE], np.float32) ** 2
def dist(l, pl, w=.55, mud=None): return (((l[:, None, :] - pl[None, :, :]) ** 2) * np.array([w, 1.5, 1.5], np.float32)).sum(-1) + (0 if mud is None else mud[None, :])
def vivid(L):
    L = L.copy(); lo, hi = np.percentile(L[:, 0], 2), np.percentile(L[:, 0], 98)
    L[:, 0] = np.clip((L[:, 0] - lo) / max(1, hi - lo) * 230 + 15, 0, 255)
    ab = L[:, 1:] - 128; ch = np.sqrt((ab ** 2).sum(1)); c90 = np.percentile(ch, 90)
    L[:, 1:] = ab * np.clip(42 / max(c90, 1), 1, 2.6) + 128; return L

def mode_filter(idx, n, k):
    best = np.zeros_like(idx); bv = None
    for c in range(n):
        v = cv2.blur((idx == c).astype(np.float32), (k, k))
        if bv is None: bv = v
        else: m = v > bv; best[m] = c; bv = np.maximum(bv, v)
    return best
def comps(idx, n):
    reg = np.zeros(idx.shape, np.int32); t = 0
    for c in range(n):
        cnt, l = cv2.connectedComponents((idx == c).astype(np.uint8), connectivity=4); m = l > 0; reg[m] = l[m] + t; t += cnt - 1
    return reg, t
def fill_small(idx, n, thr):
    reg, t = comps(idx, n); a = np.bincount(reg.ravel(), minlength=t + 1); small = a[reg] < thr
    if not small.any(): return idx, False
    _, (iy, ix) = ndi.distance_transform_edt(small, return_indices=True); return idx[iy, ix], True

def build(key, target, smooth, lines=False, crop=0, W=900):
    img = cv2.cvtColor(cv2.imread(f"{ROOT}/art2/{key}.jpg"), cv2.COLOR_BGR2RGB)
    if crop: h, w = img.shape[:2]; img = img[int(h * crop):h - int(h * crop), int(w * crop):w - int(w * crop)]
    h, w = img.shape[:2]; s = W / max(h, w); img = cv2.resize(img, (round(w * s), round(h * s)), interpolation=cv2.INTER_AREA); H, Wd = img.shape[:2]
    sm = cv2.pyrMeanShiftFiltering(cv2.cvtColor(img, cv2.COLOR_RGB2BGR), int(10 * smooth), int(26 * smooth)); sm = cv2.cvtColor(cv2.medianBlur(sm, 5), cv2.COLOR_BGR2RGB)
    nm = norm_of(img); cls = classify_rgb(sm, nm)
    share = np.bincount(cls.ravel(), minlength=len(NAMES)) / cls.size
    keep = [c for c in np.argsort(-share) if share[c] >= .004][:12]
    if lines and NAMES.index("black") not in keep: keep.append(NAMES.index("black"))
    cols = [NAMES[c] for c in keep]; remap = np.full(len(NAMES), -1); remap[keep] = np.arange(len(keep))
    idx = remap[cls]
    if (idx < 0).any():  # rare colours -> nearest kept colour in Lab
        pl = PLAB[keep]; bad = idx < 0; idx[bad] = dist(lab(sm[bad]), pl).argmin(1)
    idx = idx.astype(np.int32)
    lock = None
    if lines:
        g = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY); lock = cv2.morphologyEx((g < 70).astype(np.uint8), cv2.MORPH_OPEN, np.ones((3, 3), np.uint8)) > 0
        idx[lock] = cols.index("black")
    k = max(3, int(7 * smooth)) | 1
    for _ in range(2): idx = mode_filter(idx, len(cols), k)
    if lock is not None: idx[lock] = cols.index("black")
    area = H * Wd; thr = area * .00008
    for t in (12, 40, 120):
        for _ in range(3):
            idx, ch = fill_small(idx, len(cols), t)
            if not ch: break
    while True:
        idx, ch = fill_small(idx, len(cols), thr); reg, n = comps(idx, len(cols))
        if n <= target and not ch: break
        if n > target: thr *= 1.15
    reg, n = comps(idx, len(cols)); areas = np.bincount(reg.ravel(), minlength=n + 1); regions = []
    # 2) per region: target colour = nearest paint to the ORIGINAL mean colour; ok = close alternatives
    flat = reg.ravel(); sums = np.stack([np.bincount(flat, img[..., j].ravel().astype(np.float64), minlength=n + 1) for j in range(3)], 1)
    for i in range(1, n + 1):
        m = reg == i; votes = np.bincount(idx[m], minlength=len(cols)); order = np.argsort(-votes); c = int(order[0])
        ok = [cols[j] for j in order[1:2] if votes[j] > votes[c] * .45]
        dd = cv2.distanceTransform(np.pad(m, 1).astype(np.uint8), cv2.DIST_L2, 5)[1:-1, 1:-1]; y, x = np.unravel_index(dd.argmax(), dd.shape)
        r = {"id": i, "c": cols[c], "x": int(x), "y": int(y), "r": round(float(dd.max()), 1), "a": int(areas[i])}
        if ok and not lines: r["ok"] = ok
        if lines and cols[c] == "black": r["lock"] = 1
        regions.append(r)
    png = np.zeros((H, Wd, 3), np.uint8); png[..., 2] = reg & 255; png[..., 1] = reg >> 8   # BGR file: R=low byte, G=high byte
    cv2.imwrite(f"{OUT}/{key}.png", png, [cv2.IMWRITE_PNG_COMPRESSION, 9])
    g = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY).astype(np.float32)
    dog = cv2.GaussianBlur(g, (0, 0), 1.0) - cv2.GaussianBlur(g, (0, 0), 3.2)
    ln = np.clip(-dog * 8, 0, 255).astype(np.uint8)
    cv2.imwrite(f"{OUT}/{key}.lines.jpg", 255 - ln, [cv2.IMWRITE_JPEG_QUALITY, 70])
    cv2.imwrite(f"{OUT}/{key}.orig.jpg", cv2.cvtColor(img, cv2.COLOR_RGB2BGR), [cv2.IMWRITE_JPEG_QUALITY, 84])
    json.dump({"w": Wd, "h": H, "cols": cols, "regions": regions}, open(f"{OUT}/{key}.json", "w"), separators=(",", ":"))
    return n, cols

if __name__ == "__main__":
    for k in (sys.argv[1:] or list(JOBS)):
        t, sm, ex = JOBS[k]; n, cols = build(k, t, sm, **ex); print(k, n, ",".join(cols), flush=True)
