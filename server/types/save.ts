export type ItemType = 'weapon' | 'knife' | 'glove'

export interface SaveQueryParams {
    steamId: string
    loadoutId: number
    type?: string
}

export interface SaveRequestConfig {
    validateFields: (body: Record<string, unknown>) => void
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    saveFunction: (...args: any[]) => Promise<{ success: boolean; message: string }>
    requiresType: boolean
    getSaveParams: (body: Record<string, unknown>, query: SaveQueryParams) => unknown[]
}
