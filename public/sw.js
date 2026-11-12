// Ένα απλό Service Worker για να επιτρέπει την εγκατάσταση (PWA) στο Android
self.addEventListener('install', (event) => {
  console.log('Service Worker Install');
});

self.addEventListener('fetch', (event) => {
  // Αφήνουμε την εφαρμογή να τρέχει κανονικά
});
