import crypto from 'node:crypto'

const CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

function randomBlock(length: number): string {
  const bytes = crypto.randomBytes(length)
  return Array.from(bytes)
    .map(b => CHARSET[b % CHARSET.length])
    .join('')
}

export function generateLicenseKey(): string {
  return `CS2I-${randomBlock(4)}-${randomBlock(4)}-${randomBlock(4)}`
}
