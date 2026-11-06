"""Build all colouring pages + a preview contact sheet. python3 build_pages.py [ids...]"""
import sys, json, os
import numpy as np, cv2
from PIL import Image
sys.path.insert(0, os.path.dirname(__file__))
from segment import run, hex2rgb
from palette import PALETTE
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# id: (max regions, allowed colours, smoothing)
PAGES = {
 1: (12, "white,red,blue,yellow,black", .5, 1, True, .025),
 2: (40, "red,orange,yellow,blue,green,purple,pink,lightblue,black,cream", 1),
 3: (34, "orange,cream,yellow,lightblue,pink,white,black,darkblue,purple,green", 1),
 4: (46, "darkred,red,orange,yellow,green,blue,lightblue,brown,pink,darkgreen", 1),
 5: (34, "white,orange,yellow,darkgreen,gray,brown,beige,lightblue,darkblue", .8, 1.0),
 6: (32, "cream,yellow,gold,orange,green,lightgreen,blue", 1.1),
 7: (30, "red,darkred,darkblue,blue,green,darkgreen,white,yellow,orange,pink", 1),
 8: (26, "lightblue,green,darkgreen,white,peach,brown,black,red,blue", 1.1),
 9: (30, "lightblue,blue,gold,yellow,orange,red,green,purple,cream,gray", 1),
 10: (22, "lightblue,blue,darkblue,orange,red,peach,cream,beige", .8),
 11: (32, "darkblue,blue,lightblue,white,cream,beige,gray,brown", 1),
 12: (32, "darkblue,blue,lightblue,yellow,cream,white,darkgreen,black,green", 1),
 13: (24, "white,lightblue,gray,darkblue,pink,peach,brown,black", 1.1),
 14: (30, "orange,red,yellow,blue,darkblue,lightblue,beige,darkgreen,cream,brown", 1),
 15: (30, "green,lightgreen,darkgreen,cream,pink,lightblue,yellow,gold", 1.1),
 16: (34, "darkgreen,green,lightgreen,cream,gold,orange,red,gray,beige", 1),
 17: (36, "beige,gold,brown,cream,black,white,green,darkblue,red", 1),
 18: (30, "gray,beige,black,white,peach,pink,darkred,lightblue", 1.1),
 19: (16, "lightblue,peach,orange,yellow,green,darkgreen,cream", 1.2),
 20: (30, "beige,cream,brown,lightblue,gray,pink,gold,darkgreen,white", 1.1),
 21: (36, "white,gray,lightblue,black,brown,beige,darkred,darkgreen", 1),
 22: (40, "lightgreen,green,darkgreen,yellow,darkblue,purple,orange,pink,white,lightblue,black", 1),
 23: (30, "brown,beige,cream,white,red,darkred,darkblue,lightgreen,peach,gold", 1.1),
 24: (24, "black,blue,lightblue,cream,gold,peach,white,brown,red", 1.1),
 25: (28, "gold,brown,darkgreen,black,peach,beige,darkred,lightgreen", 1.1),
}

def preview(i):
    meta = json.load(open(f"{ROOT}/pages/{i:02d}.json")); lab = cv2.imread(f"{ROOT}/pages/{i:02d}.png", 0).astype(np.int32)
    lut = np.zeros((256, 3), np.uint8)
    for r in meta["regions"]: lut[r["id"]] = hex2rgb(PALETTE[r["c"]][0])
    raw = cv2.imread(f"{ROOT}/pages/{i:02d}.tex.jpg"); det = raw[..., 1].astype(np.int32) - 128
    flat = np.clip(lut[lab].astype(np.int32) + det[..., None], 0, 255).astype(np.uint8)
    edge = (lab != np.roll(lab, 1, 0)) | (lab != np.roll(lab, 1, 1))
    flat[edge] = (40, 30, 40)
    orig = Image.open(f"{ROOT}/art/{i:02d}.jpg").convert("RGB").resize((meta["w"], meta["h"]))
    out = Image.new("RGB", (meta["w"] * 2 + 10, meta["h"]), "white"); out.paste(orig, (0, 0)); out.paste(Image.fromarray(flat), (meta["w"] + 10, 0))
    return out

if __name__ == "__main__":
    ids = [int(x) for x in sys.argv[1:]] or list(PAGES)
    os.makedirs(f"{ROOT}/pages", exist_ok=True)
    for i in ids:
        mx, cols, sm, *rest = PAGES[i]
        lw = rest[0] if rest else .6; ln = rest[1] if len(rest) > 1 else False; cr = rest[2] if len(rest) > 2 else 0
        n = run(f"{ROOT}/art/{i:02d}.jpg", f"{ROOT}/pages/{i:02d}", mx, cols.split(","), sm, lw=lw, lines=ln, crop=cr)
        print(i, n, flush=True)
    ims = [preview(i) for i in ids]
    for k in range(0, len(ims), 6):
        part = ims[k:k + 6]; cw = 2 * 280 + 10
        sheet = Image.new("RGB", (cw * 2, 300 * 3), "white")
        for j, im in enumerate(part):
            im.thumbnail((cw, 290)); sheet.paste(im, ((j % 2) * cw, (j // 2) * 300))
        sheet.save(f"/tmp/claude-0/-workspace/0c108c4d-a38e-58cd-a86e-42615223487b/scratchpad/pages_{k // 6}.jpg", quality=80)
