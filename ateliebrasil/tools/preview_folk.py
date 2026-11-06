"""prévia: original | áreas com a cor-alvo + traço | página em branco -> pages/_prev/<k>.jpg"""
import sys, os, json, numpy as np, cv2
sys.path.insert(0, os.path.dirname(__file__)); from palette import PALETTE
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); P = f"{ROOT}/pages"; os.makedirs(f"{P}/_prev", exist_ok=True)
for f in sorted(os.listdir(P)):
    if not f.endswith(".json") or (sys.argv[1:] and f[:-5] not in sys.argv[1:]): continue
    k = f[:-5]; m = json.load(open(f"{P}/{f}")); png = cv2.imread(f"{P}/{k}.png"); reg = png[..., 2].astype(int) + 256 * png[..., 1].astype(int)
    ln = 255 - cv2.imread(f"{P}/{k}.lines.jpg", 0); orig = cv2.imread(f"{P}/{k}.orig.jpg")
    lut = np.zeros((len(m["regions"]) + 1, 3), np.uint8)
    for r in m["regions"]: h = PALETTE[r["c"]][0]; lut[r["id"]] = [int(h[i:i + 2], 16) for i in (5, 3, 1)]
    col = lut[reg].astype(float); edge = np.zeros(reg.shape, bool); edge[:, 1:] |= reg[:, 1:] != reg[:, :-1]; edge[1:] |= reg[1:] != reg[:-1]
    col[edge] *= .55; col *= (1 - .85 * ln[..., None] / 255)
    blank = np.full_like(col, 250); blank[edge] = 160; blank *= (1 - .85 * ln[..., None] / 255)
    blank = blank.astype(np.uint8)
    for r in m["regions"]: cv2.putText(blank, str(r["id"]), (r["x"] - 6, r["y"] + 4), 0, .3, (0, 0, 255), 1)
    cv2.imwrite(f"{P}/_prev/{k}.jpg", np.hstack([orig, col.astype(np.uint8), blank.astype(np.uint8)]), [cv2.IMWRITE_JPEG_QUALITY, 80])
    print(k, len(m["regions"]))
