'use client'
import { useEffect, useState, useSyncExternalStore } from 'react'
import { createHubClient } from '@/lib/hub-client'

export function useHubSnapshot() {
  const [client] = useState(() => createHubClient({ online: () => typeof navigator === 'undefined' || navigator.onLine }))
  const state = useSyncExternalStore(client.subscribe, client.getSnapshot, client.getServerSnapshot)
  useEffect(() => {
    client.start()
    void client.refresh()
    const visibleRefresh = () => { if (document.visibilityState === 'visible' && client.getSnapshot().phase !== 'signed_out') void client.refresh() }
    const connected = () => { if (client.getSnapshot().phase !== 'signed_out') void client.refresh() }
    const disconnected = () => client.offline()
    const timer = setInterval(() => {
      if (client.getSnapshot().data && navigator.onLine) visibleRefresh()
    }, 30000)
    window.addEventListener('focus', visibleRefresh)
    document.addEventListener('visibilitychange', visibleRefresh)
    window.addEventListener('online', connected)
    window.addEventListener('offline', disconnected)
    return () => {
      clearInterval(timer)
      window.removeEventListener('focus', visibleRefresh)
      document.removeEventListener('visibilitychange', visibleRefresh)
      window.removeEventListener('online', connected)
      window.removeEventListener('offline', disconnected)
      client.stop()
    }
  }, [client])
  return { ...state, refresh: client.refresh, reset: client.reset }
}
