/**
 * Stub route for dev-sw.js requests.
 * Browsers may retain a service worker registration from a previous session
 * and keep requesting this file even though PWA is not enabled.
 * Returns an empty uninstall script to deregister the stale worker.
 */
export default defineEventHandler((event) => {
    setResponseHeader(event, 'Content-Type', 'application/javascript')
    return 'self.addEventListener("install", () => self.skipWaiting()); self.addEventListener("activate", () => self.clients.claim());'
})
