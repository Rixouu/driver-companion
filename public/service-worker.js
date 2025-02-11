import { precacheAndRoute } from "workbox-precaching"
import { registerRoute } from "workbox-routing"
import { CacheFirst, StaleWhileRevalidate } from "workbox-strategies"
import { ExpirationPlugin } from "workbox-expiration"
import { openDB } from "idb"

precacheAndRoute(self.__WB_MANIFEST)

// Cache the Google Fonts stylesheets with a stale-while-revalidate strategy.
registerRoute(
  ({ url }) => url.origin === "https://fonts.googleapis.com",
  new StaleWhileRevalidate({
    cacheName: "google-fonts-stylesheets",
  }),
)

// Cache the underlying font files with a cache-first strategy for 1 year.
registerRoute(
  ({ url }) => url.origin === "https://fonts.gstatic.com",
  new CacheFirst({
    cacheName: "google-fonts-webfonts",
    plugins: [
      new ExpirationPlugin({
        maxAgeSeconds: 60 * 60 * 24 * 365,
        maxEntries: 30,
      }),
    ],
  }),
)

// Use a stale-while-revalidate strategy for all other requests.
registerRoute(
  ({ request }) => request.destination === "image",
  new StaleWhileRevalidate({
    cacheName: "images",
    plugins: [
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
      }),
    ],
  }),
)

// Open IndexedDB
const dbPromise = openDB("inspections-store", 1, {
  upgrade(db) {
    db.createObjectStore("inspections", { keyPath: "id" })
  },
})

// Listen for sync events
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-inspections") {
    event.waitUntil(syncInspections())
  }
})

async function syncInspections() {
  const db = await dbPromise
  const inspections = await db.getAll("inspections")

  for (const inspection of inspections) {
    try {
      const response = await fetch("/api/inspections", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(inspection),
      })

      if (response.ok) {
        await db.delete("inspections", inspection.id)
      }
    } catch (error) {
      console.error("Error syncing inspection:", error)
    }
  }
}

