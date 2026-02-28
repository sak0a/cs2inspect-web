// Test environment setup - runs before any test file imports
// This must be a preload file so env vars are set before config.ts is evaluated
process.env.API_KEYS = 'test-api-key'
process.env.NODE_ENV = 'test'
