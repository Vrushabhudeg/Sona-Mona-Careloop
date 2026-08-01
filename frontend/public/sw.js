self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let data = { title: 'CareLoop Nudge ❤️', body: "Time for a sweet check-off!" };
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'CareLoop Nudge', body: event.data.text() };
    }
  }

  const options = {
    body: data.body,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    vibrate: [120, 80, 120],
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});
