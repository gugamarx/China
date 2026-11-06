const CACHE="julia-pink-v2";
const FILES=["./", "index.html", "manifest.json", "fonts/pressstart.woff2", "fonts/baloo700.woff2", "fonts/baloo800.woff2", "icons/icon-192.png", "icons/icon-512.png", "photos/j01.jpg", "thumbs/j01.jpg", "faces/f01.webp", "photos/j02.jpg", "thumbs/j02.jpg", "faces/f02.webp", "photos/j03.jpg", "thumbs/j03.jpg", "faces/f03.webp", "photos/j04.jpg", "thumbs/j04.jpg", "faces/f04.webp", "photos/j05.jpg", "thumbs/j05.jpg", "faces/f05.webp", "photos/j06.jpg", "thumbs/j06.jpg", "faces/f06.webp", "photos/j07.jpg", "thumbs/j07.jpg", "faces/f07.webp", "photos/j08.jpg", "thumbs/j08.jpg", "faces/f08.webp", "photos/j09.jpg", "thumbs/j09.jpg", "faces/f09.webp", "photos/j10.jpg", "thumbs/j10.jpg", "faces/f10.webp"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)));self.skipWaiting();});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim();});
self.addEventListener("fetch",e=>{if(e.request.method!=="GET")return;
  e.respondWith(caches.match(e.request,{ignoreSearch:true}).then(r=>r||fetch(e.request)));});
