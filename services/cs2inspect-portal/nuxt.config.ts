export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  future: { compatibilityVersion: 4 },
  devServer: { port: 3220 },
  ssr: true,

  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
  ],

  routeRules: {
    '/dashboard': { ssr: false },
    '/buy': { ssr: false },
    '/settings': { ssr: false },
  },

  runtimeConfig: {
    jwtSecret: process.env.JWT_SECRET || '',
    jwtExpiry: process.env.JWT_EXPIRY || '7d',
    steamApiKey: process.env.STEAM_API_KEY || '',
    stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    paypalClientId: process.env.PAYPAL_CLIENT_ID || '',
    paypalClientSecret: process.env.PAYPAL_CLIENT_SECRET || '',
    paypalWebhookId: process.env.PAYPAL_WEBHOOK_ID || '',
    portalBaseUrl: process.env.PORTAL_BASE_URL || 'http://localhost:3220',
    public: {
      portalBaseUrl: process.env.PORTAL_BASE_URL || 'http://localhost:3220',
    },
  },
})
