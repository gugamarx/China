"""Preview of the v3 page style: thin borders + painter's own lines, and the 'comes alive' reveal.
python3 tools/v3_preview.py  -> scratchpad/v3_<name>.jpg"""
import sys, os, json
import numpy as np, cv2
sys.path.insert(0, os.path.dirname(__file__))
from segment import run, hex2rgb
from palette import PALETTE
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = "/tmp/claude-0/-workspace/0c108c4d-a38e-58cd-a86e-42615223487b/scratchpad"
JOBS = {  # name: (max regions, colours, smooth, minfrac, kwargs)
 "mondrian": (14, "white,red,blue,yellow,black", .5, .0006, dict(lw=1, lines=True, crop=.025)),
 "abaporu": (70, "lightblue,peach,orange,yellow,green,darkgreen,cream,gold,brown,white", .8, .00035, {}),
 "blue_horse": (120, "blue,darkblue,lightblue,red,yellow,orange,green,darkgreen,purple,pink,white,black", .7, .00018, {}),
}
def page(name, mx, cols, sm, mf, kw):
    n = run(f"{ROOT}/art2/{name}.jpg", f"{OUT}/v3_{name}", mx, cols.split(","), sm, W=900, minfrac=mf, **kw)
    meta = json.load(open(f"{OUT}/v3_{name}.json")); reg = cv2.imread(f"{OUT}/v3_{name}.png", 0).astype(np.int32)
    H, W = reg.shape; orig = cv2.cvtColor(cv2.resize(cv2.imread(f"{ROOT}/art2/{name}.jpg"), (W, H), interpolation=cv2.INTER_AREA), cv2.COLOR_BGR2RGB)
    if kw.get("crop"):
        c = kw["crop"]; o = cv2.cvtColor(cv2.imread(f"{ROOT}/art2/{name}.jpg"), cv2.COLOR_BGR2RGB); h, w = o.shape[:2]
        orig = cv2.resize(o[int(h * c):h - int(h * c), int(w * c):w - int(w * c)], (W, H), interpolation=cv2.INTER_AREA)
    # painter's own lines: soft edge map of the original
    g = cv2.cvtColor(orig, cv2.COLOR_RGB2GRAY).astype(np.float32)
    dog = cv2.GaussianBlur(g, (0, 0), 1.0) - cv2.GaussianBlur(g, (0, 0), 3.0)
    lines = np.clip(-dog * 9, 0, 255) / 255.0                       # dark strokes
    edge = ((reg != np.roll(reg, 1, 0)) | (reg != np.roll(reg, 1, 1))).astype(np.float32)
    edge = cv2.GaussianBlur(edge, (0, 0), .6)
    paper = np.full((H, W, 3), (252, 248, 240), np.float32)
    def compose(fill):  # fill: HxWx3 float or None
        base = paper.copy() if fill is None else fill
        base = base * (1 - .38 * lines[..., None])                  # the painter's lines at ~38%
        base = base * (1 - .55 * edge[..., None]) + np.array([90, 60, 80]) * .55 * edge[..., None] * 0  # thin borders
        return np.clip(base, 0, 255).astype(np.uint8)
    lut = np.zeros((256, 3), np.float32)
    for r in meta["regions"]: lut[r["id"]] = hex2rgb(PALETTE[r["c"]][0])
    flat = lut[reg]
    rng = np.random.default_rng(3); ids = [r["id"] for r in meta["regions"]]; half = set(rng.choice(ids, len(ids) // 2, replace=False))
    m_half = np.isin(reg, list(half))[..., None]
    wrong = np.isin(reg, list(half)[: len(half) // 4])[..., None]
    mid = np.where(m_half, np.where(wrong, flat * .8 + 40, orig), paper)  # half painted: correct ones show the REAL painting
    panels = [compose(None), compose(mid.astype(np.float32)), np.clip(orig, 0, 255).astype(np.uint8)]
    lab = ["1. what she sees", "2. painting: right colour = real masterpiece", "3. 100%: it comes alive"]
    sheet = np.full((H + 40, W * 3 + 20, 3), 255, np.uint8)
    for i, p in enumerate(panels):
        sheet[40:, i * (W + 10):i * (W + 10) + W] = p; cv2.putText(sheet, lab[i], (i * (W + 10) + 8, 28), cv2.FONT_HERSHEY_SIMPLEX, .8, (60, 30, 60), 2)
    cv2.putText(sheet, f"{name}: {n} areas", (W * 3 - 260, 28), cv2.FONT_HERSHEY_SIMPLEX, .8, (200, 30, 110), 2)
    s = 1500 / sheet.shape[1]; sheet = cv2.resize(sheet, None, fx=s, fy=s, interpolation=cv2.INTER_AREA)
    cv2.imwrite(f"{OUT}/v3_{name}.jpg", cv2.cvtColor(sheet, cv2.COLOR_RGB2BGR), [cv2.IMWRITE_JPEG_QUALITY, 80]); print(name, n)
for k, v in JOBS.items(): page(k, *v)
