import { ref, onBeforeUnmount } from 'vue'
import type { SyncItemType } from '#shared/types/sync'

interface SyncEvent {
    type: 'connected' | 'item_changed'
    itemType?: SyncItemType
    itemCategory?: string
    loadoutId?: number
    id?: number
}

type SyncEventHandler = (event: SyncEvent) => void

export function useSyncEvents() {
    const isConnected = ref(false)
    let eventSource: EventSource | null = null
    const handlers = new Set<SyncEventHandler>()

    function connect() {
        if (eventSource) return
        if (import.meta.server) return

        const es = new EventSource('/api/sync/events', { withCredentials: true })

        es.onmessage = (event) => {
            try {
                const data: SyncEvent = JSON.parse(event.data)
                if (data.type === 'connected') {
                    isConnected.value = true
                    return
                }
                for (const handler of handlers) {
                    handler(data)
                }
            } catch (e) {
                console.error('Failed to parse sync event:', e)
            }
        }

        es.onerror = () => {
            isConnected.value = false
        }

        eventSource = es
    }

    function disconnect() {
        eventSource?.close()
        eventSource = null
        isConnected.value = false
    }

    function onSyncEvent(handler: SyncEventHandler) {
        handlers.add(handler)
        return () => {
            handlers.delete(handler)
        }
    }

    onBeforeUnmount(() => {
        disconnect()
    })

    return {
        isConnected,
        connect,
        disconnect,
        onSyncEvent,
    }
}
