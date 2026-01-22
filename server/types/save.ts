export type ItemType = 'weapon' | 'knife' | 'glove'

export interface SaveRequestConfig {
    validateFields: (body: Record<string, unknown>) => void
    saveFunction: (...args: any[]) => Promise<any>
    requiresType: boolean
    getSaveParams: (body: Record<string, unknown>, query: Record<string, unknown>) => any[]
}
