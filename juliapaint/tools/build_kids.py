"""Build one ready-to-deploy folder per child:  python3 tools/build_kids.py [julia elisa ...]
dist/<kid>/ gets the shared game + only that child's cover, icon, kid-id.js and manifest."""
import os, sys, shutil, json, re
from PIL import Image, ImageOps
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
kids_js = open(f"{ROOT}/js/kid.js").read()
ALL = re.findall(r"^\s+(\w+): \{ name:", kids_js, re.M)
NAMES = dict(re.findall(r"^\s+(\w+): \{ name: \"(\w+)\"", kids_js, re.M))
SHARED = ["index.html", "js", "fonts", "pages3", "painters", "netlify.toml"]
for kid in (sys.argv[1:] or ALL):
    D = f"{ROOT}/dist/{kid}"; shutil.rmtree(D, ignore_errors=True); os.makedirs(D + "/kids"); os.makedirs(D + "/icons")
    for s in SHARED:
        (shutil.copytree if os.path.isdir(f"{ROOT}/{s}") else shutil.copy)(f"{ROOT}/{s}", f"{D}/{s}")
    shutil.copy(f"{ROOT}/kids/cover-{kid}.jpg", f"{D}/kids/cover-{kid}.jpg")
    open(f"{D}/kid-id.js", "w").write(f'window.KID_ID = "{kid}";\n')
    cov = Image.open(f"{ROOT}/kids/cover-{kid}.jpg").convert("RGB"); W, H = cov.size
    face = cov.crop((int(W * .1), int(H * .33), int(W * .6), int(H * .33) + int(W * .5)))  # the girl's face in the cover art
    for sz in (192, 512): ImageOps.fit(face, (sz, sz)).save(f"{D}/icons/icon-{sz}.png")
    name = NAMES[kid]
    json.dump({"name": f"{name} Paint", "short_name": f"{name} Paint", "start_url": "./index.html", "scope": "./", "display": "fullscreen",
               "orientation": "portrait", "background_color": "#ffe9c9", "theme_color": "#ff4fa0", "lang": "en",
               "icons": [{"src": f"icons/icon-{s}.png", "sizes": f"{s}x{s}", "type": "image/png", "purpose": "any maskable"} for s in (192, 512)]},
              open(f"{D}/manifest.json", "w"), indent=1)
    files = []
    for dp, _, fs in os.walk(D):
        for f in fs: files.append(os.path.relpath(os.path.join(dp, f), D))
    files = ["./"] + sorted(f for f in files if f not in ("sw.js", "netlify.toml"))
    open(f"{D}/sw.js", "w").write(f"""const CACHE="{kid}paint-v{len(files)}-{int(os.path.getmtime(ROOT + '/js/app.js'))}";
const FILES={json.dumps(files)};
self.addEventListener("install",e=>{{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)));self.skipWaiting();}});
self.addEventListener("activate",e=>{{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim();}});
self.addEventListener("fetch",e=>{{if(e.request.method!=="GET")return;e.respondWith(caches.match(e.request,{{ignoreSearch:true}}).then(r=>r||fetch(e.request)));}});
""")
    print(kid, len(files), "files")
