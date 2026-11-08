"""Monta o site pronto para o Netlify: python3 tools/build_site.py  ->  dist/ e ateliebrasil.zip
Gera ícones (rosto do Saci), avatares das primas, manifest e service worker (funciona offline)."""
import os, json, shutil, zipfile, time
from PIL import Image, ImageOps
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); D = f"{ROOT}/dist"
shutil.rmtree(D, ignore_errors=True); os.makedirs(f"{D}/icons"); os.makedirs(f"{D}/kids"); os.makedirs(f"{D}/pages")
for s in ["index.html", "js", "fonts", "netlify.toml", "audio"]:
    (shutil.copytree if os.path.isdir(f"{ROOT}/{s}") else shutil.copy)(f"{ROOT}/{s}", f"{D}/{s}")
import subprocess; subprocess.run(["python3", f"{ROOT}/tools/build_crops.py"], check=True)   # recortes redondos sempre em dia
for f in os.listdir(f"{ROOT}/pages"):
    if f.endswith((".png", ".jpg", ".json")): shutil.copy(f"{ROOT}/pages/{f}", f"{D}/pages/{f}")
shutil.copytree(f"{ROOT}/pages/c", f"{D}/pages/c")
# avatares: kids/avatar-<chave>.jpg (qualquer quadrado serve; é reduzido para 320px). As capas do Julia Paint viram avatar se faltar.
for f in sorted(os.listdir(f"{ROOT}/kids")):
    if f.startswith("cover-") and not os.path.exists(f"{ROOT}/kids/avatar-{f[6:]}"):
        Image.open(f"{ROOT}/kids/{f}").crop((110, 720, 850, 1460)).save(f"{ROOT}/kids/avatar-{f[6:]}", quality=90)
for f in sorted(os.listdir(f"{ROOT}/kids")):
    if f.startswith("avatar-"):
        im = Image.open(f"{ROOT}/kids/{f}").convert("RGB"); W_, H_ = im.size
        if os.path.exists(f"{ROOT}/kids/cover-{f[7:]}"):      # avatar tirado da capa: o rosto fica à direita e um pouco abaixo -> centraliza no círculo
            s_ = int(W_ * .74); cx, cy = int(W_ * .61), int(H_ * .56); im = im.crop((cx - s_ // 2, cy - s_ // 2, cx - s_ // 2 + s_, cy - s_ // 2 + s_))
        ImageOps.fit(im, (320, 320), Image.LANCZOS).save(f"{D}/kids/{f[:-4]}.jpg", quality=86)
festa = Image.open(f"{ROOT}/pages/grupo.orig.jpg").convert("RGB"); W, H = festa.size  # ícone: o Saci da Festa do Folclore
sz_ = int(W * .3); cx, cy = int(W * .55), int(H * .7)
face = festa.crop((max(0, cx - sz_ // 2), max(0, cy - sz_ // 2), max(0, cx - sz_ // 2) + sz_, max(0, cy - sz_ // 2) + sz_))
for sz in (192, 512): ImageOps.fit(face, (sz, sz)).save(f"{D}/icons/icon-{sz}.png")
json.dump({"name": "Ateliê Brasil", "short_name": "Ateliê Brasil", "start_url": "./index.html", "scope": "./", "display": "fullscreen",
           "orientation": "portrait", "background_color": "#21a050", "theme_color": "#21a050", "lang": "pt-BR",
           "icons": [{"src": f"icons/icon-{s}.png", "sizes": f"{s}x{s}", "type": "image/png", "purpose": "any maskable"} for s in (192, 512)]},
          open(f"{D}/manifest.json", "w"), ensure_ascii=False, indent=1)
files = []
for dp, _, fs in os.walk(D):
    for f in fs: files.append(os.path.relpath(os.path.join(dp, f), D))
files = ["./"] + sorted(f for f in files if f not in ("sw.js", "netlify.toml"))
open(f"{D}/sw.js", "w").write(f"""const CACHE="ateliebrasil-{int(time.time())}";
const FILES={json.dumps(files)};
self.addEventListener("install",e=>{{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)));self.skipWaiting();}});
self.addEventListener("activate",e=>{{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim();}});
self.addEventListener("fetch",e=>{{if(e.request.method!=="GET")return;e.respondWith(caches.match(e.request,{{ignoreSearch:true}}).then(r=>r||fetch(e.request)));}});
""")
with zipfile.ZipFile(f"{ROOT}/ateliebrasil.zip", "w", zipfile.ZIP_DEFLATED) as z:
    for dp, _, fs in os.walk(D):
        for f in fs: z.write(os.path.join(dp, f), os.path.relpath(os.path.join(dp, f), D))
print(len(files), "arquivos;", round(os.path.getsize(f"{ROOT}/ateliebrasil.zip") / 1e6, 1), "MB")
