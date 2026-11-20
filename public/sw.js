// Ένα Service Worker για PWA στο Android + Push Ειδοποιήσεις για το κινητό του μαγαζιού
self.addEventListener('install', (event) => {
  self.skipWaiting();
  console.log('Service Worker Install');
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Αφήνουμε την εφαρμογή να τρέχει κανονικά
});

self.addEventListener('push', (event) => {
  let data = {
    title: '🔔 ΝΕΑ ΠΑΡΑΓΓΕΛΙΑ - Hellas Aalborg',
    body: 'Έφτασε νέα παραγγελία στο ταμείο!',
    url: '/admin',
  };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: '/logo.png',
    badge: '/logo.png',
    vibrate: [500, 200, 500, 200, 800],
    tag: 'hellas-new-order',
    renotify: true,
    requireInteraction: true,
    data: { url: data.url || '/admin' },
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/admin';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('/admin') && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
