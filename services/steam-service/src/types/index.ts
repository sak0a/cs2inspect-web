export interface CreateUrlRequest {
  itemType: 'weapon' | 'knife' | 'glove' | 'agent' | 'music-kit'
  defindex?: number
  paintindex?: number
  paintseed?: number
  paintwear?: number
  rarity?: number | string
  statTrak?: boolean
  statTrakCount?: number
  nameTag?: string
  stickers?: Array<{
    slot: number
    sticker_id: number
    wear?: number
    offset_x?: number
    offset_y?: number
  }>
  keychain?: {
    defindex: number
    paintindex?: number
  }
  customization?: unknown
}

export interface InspectItemRequest {
  inspectUrl: string
  itemType?: 'weapon' | 'knife' | 'glove' | 'agent' | 'music-kit'
}

export interface DecodeHexRequest {
  hexData: string
}

export interface ValidateUrlRequest {
  inspectUrl: string
}

export interface AnalyzeUrlRequest {
  inspectUrl: string
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: unknown
  }
}

export interface ServiceStatus {
  steamClient: {
    available: boolean
    status: string
    uptime?: number
  }
  queue: {
    pending: number
    processing: number
    maxSize: number
  }
  server: {
    uptime: number
    version: string
  }
}

export interface HealthCheck {
  status: 'ok' | 'degraded' | 'fail'
  ready: boolean
  checks: Record<
    string,
    {
      status: 'ok' | 'degraded' | 'fail'
      message?: string
    }
  >
}
