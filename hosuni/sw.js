const CACHE_NAME='hosuni-pwa-v3';
const CORE=['./','./index.html','./styles.css','./app.js','./manifest.webmanifest','./icons/favicon-32.png','./icons/icon-192.png','./icons/icon-512.png','./assets/break-stretch/frame-01.png','./assets/focus-thinking/frame-01.png'];
const STATES=['idle','mouse-follow','typing-tired','greeting-wave','completion-jump','busy-work','smart-reminder','sleep-recovery'];
const FRAMES=STATES.flatMap(state=>[1,2,3,4].map(frame=>`./assets/${state}/frame-${String(frame).padStart(2,'0')}.png`));
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll([...CORE,...FRAMES])).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE_NAME).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{if(event.request.method!=='GET')return;event.respondWith(caches.match(event.request,{ignoreSearch:true}).then(cached=>cached||fetch(event.request).then(response=>{const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put(event.request,copy));return response;}).catch(()=>event.request.mode==='navigate'?caches.match('./index.html'):Response.error())));});
self.addEventListener('notificationclick',event=>{event.notification.close();event.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(windows=>windows[0]?windows[0].focus():clients.openWindow('./')));});
