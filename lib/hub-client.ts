import type { HubData } from './types.ts'

export type HubSnapshot = {
  data: HubData | null
  phase: 'loading' | 'ready' | 'signed_out' | 'unavailable'
  issue: 'offline' | 'service' | null
  refreshing: boolean
}
export type RefreshResult = 'updated' | 'signed_out' | 'unavailable' | 'superseded'
const initial: HubSnapshot = { data: null, phase: 'loading', issue: null, refreshing: false }

// Each mounted account owns its client. A late response cannot restore an old session.
export function createHubClient({ fetcher = fetch, online = () => true, timeout = 20000 }: {
  fetcher?: typeof fetch; online?: () => boolean; timeout?: number
} = {}) {
  let state = initial
  let active = true
  let sequence = 0
  let controller: AbortController | undefined
  const listeners = new Set<() => void>()
  function update(next: HubSnapshot) { state = next; listeners.forEach(listener => listener()) }
  function cancel() { sequence++; controller?.abort(); controller = undefined }
  function offline() {
    cancel()
    update({ ...state, phase: state.data ? 'ready' : 'unavailable', issue: 'offline', refreshing: false })
  }
  async function refresh(): Promise<RefreshResult> {
    if (!active) return 'superseded'
    if (!online()) { offline(); return 'unavailable' }
    cancel()
    const request = sequence
    const pending = new AbortController()
    controller = pending
    update({ ...state, phase: state.data ? 'ready' : 'loading', refreshing: true })
    const timer = setTimeout(() => pending.abort(), timeout)
    try {
      const response = await fetcher('/api/data', { cache: 'no-store', signal: pending.signal })
      if (!active || request !== sequence) return 'superseded'
      if (response.status === 401) {
        update({ data: null, phase: 'signed_out', issue: null, refreshing: false })
        return 'signed_out'
      }
      if (!response.ok) throw new Error('Hub unavailable')
      const data = await response.json() as HubData
      if (!active || request !== sequence) return 'superseded'
      if (!data?.user?.id || !Array.isArray(data.meetings) || !Array.isArray(data.notifications)) throw new Error('Invalid Hub response')
      update({ data, phase: 'ready', issue: null, refreshing: false })
      return 'updated'
    } catch {
      if (!active || request !== sequence) return 'superseded'
      update({ ...state, phase: state.data ? 'ready' : 'unavailable', issue: online() ? 'service' : 'offline', refreshing: false })
      return 'unavailable'
    } finally {
      clearTimeout(timer)
      if (controller === pending) controller = undefined
    }
  }
  return {
    getSnapshot: () => state,
    getServerSnapshot: () => initial,
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener) } },
    refresh,
    offline,
    reset() { cancel(); update({ data: null, phase: 'signed_out', issue: null, refreshing: false }) },
    start() { active = true },
    stop() { active = false; cancel() },
  }
}
