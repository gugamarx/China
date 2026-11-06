"""(Ateliê Brasil: marrom/bege mais largos que no Julia Paint, pele e bichos ficam certos)
Name colours the way a child would: by hue family, then light/dark variant."""
import numpy as np, cv2
NAMES = ["red","yellow","blue","white","black","orange","green","purple","pink","lightblue","gray","darkblue","darkred","brown","cream","darkgreen","lightgreen","peach","beige","gold"]
def classify_rgb(rgb, norm=None):
    """rgb: (...,3) uint8. returns array of indices into NAMES"""
    sh = rgb.shape[:-1]; hsv = cv2.cvtColor(rgb.reshape(-1, 1, 3).astype(np.uint8), cv2.COLOR_RGB2HSV).reshape(-1, 3).astype(np.float32)
    h = hsv[:, 0] * 2; s = hsv[:, 1] / 255; v = hsv[:, 2] / 255
    if norm is not None: vlo, vhi, sf = norm; v = np.clip((v - vlo) / max(.05, vhi - vlo), 0, 1); s = np.clip(s * sf, 0, 1)
    out = np.full(h.shape, NAMES.index("gray"))
    N = NAMES.index
    grey = s < .2
    warm = (h >= 15) & (h < 70)
    out[grey & (v >= .86)] = N("white")
    out[grey & (v < .86) & (v >= .62) & warm & (s > .08)] = N("cream")
    out[grey & (v < .62) & (v >= .38) & warm & (s > .1)] = N("beige")
    out[grey & (v < .28)] = N("black")
    c = ~grey
    out[c & (v < .2)] = N("black")
    c = c & (v >= .2)
    def put(mask, name): out[c & mask] = N(name)
    red = (h < 12) | (h >= 340); ora = (h >= 12) & (h < 34); yel = (h >= 34) & (h < 68); gre = (h >= 68) & (h < 175)
    blu = (h >= 175) & (h < 255); pur = (h >= 255) & (h < 305); pin = (h >= 305) & (h < 340)
    put(red, "red"); put(red & (v < .5), "darkred"); put(red & (s < .5) & (v > .7), "pink")
    put(ora, "orange"); put(ora & (v < .72), "brown"); put(ora & (s < .5) & (v >= .76), "peach"); put(ora & (s < .5) & (v >= .55) & (v < .76), "beige")
    put(yel, "yellow"); put(yel & (v < .72), "gold"); put(yel & (v < .45), "brown"); put(yel & (s < .42) & (v >= .72), "cream")
    put(gre, "green"); put(gre & (v < .45), "darkgreen"); put(gre & (s < .45) & (v > .62), "lightgreen")
    put(blu, "blue"); put(blu & (v < .48), "darkblue"); put(blu & (s < .45) & (v > .6), "lightblue")
    put(pur, "purple"); put(pur & (v < .4), "darkblue")
    put(pin, "pink"); put(pin & (v < .5) | pin & (s > .6) & (v < .75), "purple")
    return out.reshape(sh)
def norm_of(rgb):
    hsv = cv2.cvtColor(rgb.reshape(-1, 1, 3).astype(np.uint8), cv2.COLOR_RGB2HSV).reshape(-1, 3).astype(np.float32)
    v = hsv[:, 2] / 255; s = hsv[:, 1] / 255
    return (np.percentile(v, 1), np.percentile(v, 99), float(np.clip(.6 / max(np.percentile(s, 90), .05), 1, 1.8)))
