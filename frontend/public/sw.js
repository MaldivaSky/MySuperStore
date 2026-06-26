// Ativa o SW imediatamente (sem esperar abas antigas fecharem).
self.addEventListener('install', function(event) {
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil(self.clients.claim());
});

// Handler de fetch (passthrough). É REQUISITO de instalabilidade no Chrome/Android:
// sem um listener de 'fetch', o navegador não considera o site um PWA instalável
// e o evento beforeinstallprompt nunca dispara.
self.addEventListener('fetch', function(event) {
  // Não intercepta nada — apenas deixa a rede responder. Mantém o app sempre
  // atualizado (sem cache agressivo) e ainda satisfaz o critério de instalação.
  return;
});

self.addEventListener('push', function(event) {
  if (event.data) {
    const data = event.data.json();
    
    const options = {
      body: data.body,
      icon: data.icon || '/icon-192x192.png',
      badge: data.badge || '/badge-72x72.png',
      vibrate: [100, 50, 100],
      data: {
        url: data.url || '/'
      }
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  if (event.notification.data && event.notification.data.url) {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  }
});
