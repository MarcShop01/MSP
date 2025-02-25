const CACHE_NAME = 'marcshop-v1'; // Nom du cache

// Fichiers à mettre en cache dès l'installation
const PRE_CACHED_ASSETS = [
  '/', // La page d'accueil
  '/index.html', // Votre fichier HTML principal
  '/styles.css', // Votre fichier CSS
  '/script.js', // Votre fichier JavaScript
  'https://i.imgur.com/mhVd2g9.jpeg', // Votre icône
  // Ajoutez ici les fichiers critiques (ceux nécessaires au démarrage de l'application)
];

// Étape 1 : Installer le service worker et mettre en cache les ressources critiques
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRE_CACHED_ASSETS); // Mettre en cache les ressources critiques
    })
  );
});

// Étape 2 : Intercepter les requêtes et mettre en cache dynamiquement
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Si la ressource est dans le cache, la servir depuis le cache
      if (response) {
        return response;
      }
      // Sinon, faire une requête réseau et mettre en cache la réponse
      return fetch(event.request).then((networkResponse) => {
        // Vérifier si la réponse est valide
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        // Mettre en cache la réponse
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      });
    })
  );
});

// Étape 3 : Nettoyer les anciens caches (optionnel)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName); // Supprimer les anciens caches
          }
        })
      );
    })
  );
});