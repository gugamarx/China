"""Gera os recortes redondos (rostos, palavras escondidas e figurinhas) como imagens prontas: pages/c/<k>_<x>_<y>_<z>.jpg.
Lê as coordenadas do js/lendas.js (pelo node). uso: python3 tools/build_crops.py"""
import os, json, subprocess
from PIL import Image
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); OUT = f"{ROOT}/pages/c"; os.makedirs(OUT, exist_ok=True)
js = r'''const fs=require("fs");const src=fs.readFileSync(process.argv[1]+"/js/lendas.js","utf8").replace(/^(const|let) /gm,"global.");eval(src);
const out=[];for(const t of TELAS){if(t.breve)continue;out.push([t.k,...t.rosto]);(t.fig||[]).forEach(f=>out.push([t.k,f[1],f[2],f[3]]));(t.crops||[]).forEach(f=>out.push([t.k,...f]));
if(!t.semCrop)(t.palavras||[]).forEach(o=>out.push([t.k,o[1],o[2],.28]));}console.log(JSON.stringify(out));'''
tuples = json.loads(subprocess.check_output(["node", "-e", js, ROOT]))
key = lambda k, x, y, z: k + "_" + "_".join(str(round(v * 1000)) for v in (x, y, z))
done = set()
for k, x, y, z in tuples:
    n = key(k, x, y, z)
    if n in done: continue
    done.add(n); im = Image.open(f"{ROOT}/pages/{k}.orig.jpg").convert("RGB"); W, H = im.size
    s = min(z * W, W, H); cx = min(max(x * W, s / 2), W - s / 2); cy = min(max(y * H, s / 2), H - s / 2)
    im.crop((round(cx - s / 2), round(cy - s / 2), round(cx + s / 2), round(cy + s / 2))).resize((256, 256), Image.LANCZOS).save(f"{OUT}/{n}.jpg", quality=86)
print(len(done), "recortes")
