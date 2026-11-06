import json, sys, os, numpy as np, cv2
sys.path.insert(0, os.path.dirname(__file__)); from palette import PALETTE
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); OUT = "/tmp/claude-0/-workspace/0c108c4d-a38e-58cd-a86e-42615223487b/scratchpad"
keys = sys.argv[1:] or sorted(k[:-5] for k in os.listdir(f"{R}/pages3") if k.endswith(".json"))
tiles = []
for k in keys:
    m = json.load(open(f"{R}/pages3/{k}.json")); p = cv2.imread(f"{R}/pages3/{k}.png"); reg = p[..., 2].astype(np.int32) + 256 * p[..., 1].astype(np.int32)
    lut = np.zeros((reg.max() + 1, 3), np.uint8)
    for r in m["regions"]: h = PALETTE[r["c"]][0]; lut[r["id"]] = [int(h[i:i + 2], 16) for i in (5, 3, 1)]
    flat = lut[reg].astype(np.float32); ln = cv2.imread(f"{R}/pages3/{k}.lines.jpg", 0).astype(np.float32) / 255
    flat *= (1 - .38 * (1 - ln))[..., None]; e = (reg != np.roll(reg, 1, 0)) | (reg != np.roll(reg, 1, 1)); flat[e] *= .55
    o = cv2.imread(f"{R}/pages3/{k}.orig.jpg"); t = np.hstack([o, flat.astype(np.uint8)]); s = 520 / t.shape[1]; t = cv2.resize(t, None, fx=s, fy=s)
    t = cv2.copyMakeBorder(t, 22, 6, 4, 4, cv2.BORDER_CONSTANT, value=(255, 255, 255)); cv2.putText(t, f"{k} {len(m['regions'])}", (6, 17), 0, .55, (40, 20, 90), 2)
    tiles.append(t)
for g in range(0, len(tiles), 6):
    part = tiles[g:g + 6]; W = max(t.shape[1] for t in part); rows = []
    for i in range(0, len(part), 2):
        pr = part[i:i + 2]; H = max(t.shape[0] for t in pr); rows.append(np.hstack([cv2.copyMakeBorder(t, 0, H - t.shape[0], 0, W - t.shape[1], cv2.BORDER_CONSTANT, value=(255, 255, 255)) for t in pr] + ([np.full((H, W, 3), 255, np.uint8)] if len(pr) == 1 else [])))
    cv2.imwrite(f"{OUT}/p3_{g // 6}.jpg", np.vstack(rows), [cv2.IMWRITE_JPEG_QUALITY, 78])
print("ok", len(tiles))
