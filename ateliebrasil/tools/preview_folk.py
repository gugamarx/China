"""prévia: original | áreas com a cor-alvo + traço original | página em branco com o número das áreas -> pages/_prev/<k>.jpg"""
import sys, os, json, numpy as np, cv2
sys.path.insert(0, os.path.dirname(__file__)); from palette import PALETTE
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); P = f"{ROOT}/pages"; os.makedirs(f"{P}/_prev", exist_ok=True)
for f in sorted(os.listdir(P)):
    if not f.endswith(".json") or (sys.argv[1:] and f[:-5] not in sys.argv[1:]): continue
    k = f[:-5]; m = json.load(open(f"{P}/{f}")); W, H = m["w"], m["h"]
    if "rle" not in m: continue
    r = np.array(m["rle"]).reshape(-1, 2); reg = np.repeat(r[:, 0], r[:, 1]).reshape(H, W)
    g = cv2.imread(f"{P}/{k}.lines.jpg", 0).astype(float) / 255; orig = cv2.imread(f"{P}/{k}.orig.jpg")
    lut = np.full((reg.max() + 1, 3), 250, np.uint8)
    for q in m["regions"]:
        if not q.get("lock"): h = PALETTE[q["c"]][0]; lut[q["id"]] = [int(h[i:i + 2], 16) for i in (5, 3, 1)]
    col = (lut[reg] * g[..., None]).astype(np.uint8); blank = (np.full((H, W, 3), 250.) * g[..., None]).astype(np.uint8)
    for q in m["regions"]:
        if not q.get("lock"): cv2.putText(blank, str(q["id"]), (q["x"] - 6, q["y"] + 4), 0, .3, (0, 0, 255), 1)
    cv2.imwrite(f"{P}/_prev/{k}.jpg", np.hstack([orig, col, blank]), [cv2.IMWRITE_JPEG_QUALITY, 80]); print(k, len(m["regions"]))
