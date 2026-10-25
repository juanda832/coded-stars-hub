import test from 'node:test'
import assert from 'node:assert/strict'
import { createHubClient } from '../lib/hub-client.ts'

const snapshot = id => ({ user: { id, role: 'admin' }, meetings: [], notifications: [] })
const response = id => Response.json(snapshot(id))
function deferred() { let resolve; const promise = new Promise(r => { resolve = r }); return { promise, resolve } }

test('A successful refresh opens the loaded Hub', async () => {
  const client = createHubClient({ fetcher: async () => response('isa') })
  assert.equal(await client.refresh(), 'updated')
  assert.equal(client.getSnapshot().phase, 'ready')
  assert.equal(client.getSnapshot().data.user.id, 'isa')
  assert.equal(client.getSnapshot().refreshing, false)
})
test('A service failure at startup offers recovery without declaring a lost session', async () => {
  const client = createHubClient({ fetcher: async () => new Response('', { status: 503 }) })
  assert.equal(await client.refresh(), 'unavailable')
  assert.equal(client.getSnapshot().phase, 'unavailable')
  assert.equal(client.getSnapshot().issue, 'service')
})
test('A temporary failure keeps the last loaded view and a later success clears the notice', async () => {
  let fail = false
  const client = createHubClient({ fetcher: async () => { if (fail) throw new TypeError('network unavailable'); return response('isa') } })
  await client.refresh()
  fail = true
  await client.refresh()
  assert.equal(client.getSnapshot().data.user.id, 'isa')
  assert.equal(client.getSnapshot().issue, 'service')
  fail = false
  await client.refresh()
  assert.equal(client.getSnapshot().issue, null)
})
test('An expired or refused session clears private information immediately', async () => {
  let expired = false
  const client = createHubClient({ fetcher: async () => expired ? new Response('', { status: 401 }) : response('isa') })
  await client.refresh()
  expired = true
  assert.equal(await client.refresh(), 'signed_out')
  assert.equal(client.getSnapshot().data, null)
  assert.equal(client.getSnapshot().issue, null)
})
test('A slower older response cannot overwrite a newer snapshot even when transport ignores abort', async () => {
  const first = deferred(), second = deferred()
  let count = 0
  const client = createHubClient({ fetcher: () => ++count === 1 ? first.promise : second.promise })
  const old = client.refresh(), current = client.refresh()
  second.resolve(response('new'))
  assert.equal(await current, 'updated')
  first.resolve(response('old'))
  assert.equal(await old, 'superseded')
  assert.equal(client.getSnapshot().data.user.id, 'new')
})
test('A response still parsing JSON cannot restore an older view', async () => {
  const body = deferred(), began = deferred()
  let count = 0
  const client = createHubClient({ fetcher: async () => ++count === 1 ? { status: 200, ok: true, json: () => { began.resolve(); return body.promise } } : response('new') })
  const old = client.refresh()
  await began.promise
  await client.refresh()
  body.resolve(snapshot('old'))
  assert.equal(await old, 'superseded')
  assert.equal(client.getSnapshot().data.user.id, 'new')
})
test('Logging out invalidates requests that were already in flight', async () => {
  const pending = deferred()
  const client = createHubClient({ fetcher: () => pending.promise })
  const request = client.refresh()
  client.reset()
  pending.resolve(response('old-user'))
  assert.equal(await request, 'superseded')
  assert.equal(client.getSnapshot().data, null)
  assert.equal(client.getSnapshot().phase, 'signed_out')
})
test('Stopping and restarting a component never revives its previous request', async () => {
  const pending = deferred()
  let count = 0
  const client = createHubClient({ fetcher: () => ++count === 1 ? pending.promise : Promise.resolve(response('current')) })
  const old = client.refresh()
  client.stop()
  assert.equal(await client.refresh(), 'superseded')
  client.start()
  await client.refresh()
  pending.resolve(response('previous'))
  assert.equal(await old, 'superseded')
  assert.equal(client.getSnapshot().data.user.id, 'current')
})
test('Offline browsing retains the loaded snapshot without sending a request', async () => {
  let online = true, requests = 0
  const client = createHubClient({ fetcher: async () => { requests++; return response('isa') }, online: () => online })
  await client.refresh()
  online = false
  assert.equal(await client.refresh(), 'unavailable')
  assert.equal(requests, 1)
  assert.equal(client.getSnapshot().data.user.id, 'isa')
  assert.equal(client.getSnapshot().issue, 'offline')
})
test('A request timeout becomes a recoverable load error', async () => {
  const client = createHubClient({ timeout: 5, fetcher: (_url, { signal }) => new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')))) })
  assert.equal(await client.refresh(), 'unavailable')
  assert.equal(client.getSnapshot().phase, 'unavailable')
  assert.equal(client.getSnapshot().refreshing, false)
})
test('An unexpected HTML response cannot masquerade as a signed-out account', async () => {
  const client = createHubClient({ fetcher: async () => new Response('<html>unavailable</html>') })
  await client.refresh()
  assert.equal(client.getSnapshot().phase, 'unavailable')
  assert.equal(client.getSnapshot().data, null)
})
