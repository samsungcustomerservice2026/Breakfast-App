self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("message", (event) => {
  const data = event.data || {};
  if (data.type !== "PING") return;
  event.waitUntil(showPing(data));
});

self.addEventListener("push", (event) => {
  event.waitUntil(handlePush(event));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(openApp(url));
});

async function handlePush(event) {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    try { data = { body: event.data ? await event.data.text() : "" }; }
    catch { data = {}; }
  }
  const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
  if (windows.some((client) => client.visibilityState === "visible")) return;
  await showPing(data);
}

async function showPing(data) {
  await self.registration.showNotification(data.title || "هيئة مكافحة الجوع المش رسمية", {
    body: data.body || "الأكل وصل وان خلص الفول انا مش مسؤول 😂",
    icon: "/logo.png",
    badge: "/logo.png",
    vibrate: [220, 80, 220, 80, 420],
    tag: "hayat-delivered",
    renotify: true,
    requireInteraction: true,
    silent: false,
    lang: "ar",
    dir: "rtl",
    data: { url: data.url || "/" },
  });
}

async function openApp(url) {
  const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
  for (const client of windows) {
    if ("focus" in client) {
      await client.focus();
      return;
    }
  }
  if (self.clients.openWindow) await self.clients.openWindow(url);
}
