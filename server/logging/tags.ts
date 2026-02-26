const TAG_MAP: Record<string, string> = {
  healthcheck: 'Health',
  auth: 'Auth',
  migrations: 'DB',
  db: 'DB',
  database: 'DB',
  startup: 'Boot',
  sync: 'Sync',
  'sync-cleanup': 'Sync',
  'csgo-api': 'Data',
  stickers: 'Img',
  'skin-match': 'Skin',
  'gloves-api': 'Gloves',
  inspect: 'Inspect',
  req: 'Req',
  request: 'Req',
}

function toWords(value: string): string[] {
  return value
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
}

function toTitleCase(value: string): string {
  return toWords(value)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('')
}

function normalizeTagInput(value?: string | null): string {
  if (!value) {
    return 'App'
  }

  const normalized = value.trim().toLowerCase()
  if (!normalized) {
    return 'App'
  }

  return TAG_MAP[normalized] || toTitleCase(value)
}

export function resolveCanonicalTag(input?: {
  tag?: string | null
  context?: string | null
  event?: string | null
}): string {
  if (!input) {
    return 'App'
  }

  if (input.tag && input.tag.trim().length > 0) {
    return normalizeTagInput(input.tag)
  }

  if (input.context && input.context.trim().length > 0) {
    return normalizeTagInput(input.context)
  }

  if (input.event && input.event.trim().length > 0) {
    return normalizeTagInput(input.event)
  }

  return 'App'
}

export function stripManualPrefix(message: string): string {
  return message.replace(/^\[[A-Za-z0-9 _-]+\]\s*/, '')
}

export function formatTaggedMessage(tag: string, message: string): string {
  const compactMessage = stripManualPrefix(message).trim()
  const resolved = resolveCanonicalTag({ tag })
  return compactMessage.length > 0 ? `[${resolved}] ${compactMessage}` : `[${resolved}]`
}
