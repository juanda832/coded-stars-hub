import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { withStore, changeMeeting, requestParticipation, selectParticipant, withdrawParticipation, registrations, savePublication, records, saveRecord, changeMeetingStatus, submitReport } from '../lib/store'
import { withDatabase, execute } from '../lib/database'
import { hubDataFor } from '../lib/hub-data'
import { users } from '../lib/user-directory'
import type { Meeting } from '../lib/types'

// This suite writes exclusively to a named, isolated QA schema, never the beta.
if (!/^coded_hub_qa_[a-z0-9_]+$/.test(process.env.CODED_DATABASE_SCHEMA || '') || !process.env.DATABASE_URL) throw new Error('Use an isolated coded_hub_qa_* schema and real DATABASE_URL')
const isa = users.find(u => u.id === 'admin-isa')!
const ela = users.find(u => u.id === 'admin-ela')!
const star1 = users.find(u => u.id === 'star-1')!
const star2 = users.find(u => u.id === 'star-2')!
const host = users.find(u => u.id === 'host-1')!

async function main() {
if (process.argv[2] === 'probe') {
  const meeting = await withStore(async () => (await records<Meeting>('meetings')).find(m => m.id === process.argv[3]))
  assert.ok(meeting, 'A fresh process reads the saved meeting')
  console.log('Independent process: persisted meeting verified')
} else {
  const schoolName = 'Colegio ficticio · QA ' + randomUUID().slice(0, 8)
  const meeting = await changeMeeting(isa, { action: 'create', schoolName, date: '2027-07-15', time: '18:00', sourceTimeZone: 'America/New_York', joinUrl: 'https://example.com/jdp-qa', hostId: host.id })
  const mid = meeting.id
  let checks = 0
  function check(fn: () => void) { fn(); checks++ }
  const elaData = await withStore(() => hubDataFor(ela))
  check(() => assert.equal(elaData.meetings.find(m => m.id === mid)?.schoolName, schoolName))
  check(() => assert.equal(meeting.startsAt, '2027-07-15T22:00:00.000Z'))
  check(() => assert.equal(meeting.program, ''))
  check(() => assert.equal(meeting.language, ''))
  check(() => assert.equal(meeting.duration, null))
  const before = await withStore(() => hubDataFor(star1))
  check(() => assert.equal(before.meetings.find(m => m.id === mid)?.joinUrl, undefined))
  await Promise.all([requestParticipation(mid, star1.id), requestParticipation(mid, star2.id)])
  const requests = await withStore(registrations)
  check(() => assert.equal(requests.filter(r => r.meetingId === mid).length, 2))
  check(() => assert.equal(requests.filter(r => r.meetingId === mid && r.status === 'confirmed').length, 0))

  const race = await Promise.allSettled([selectParticipant(mid, star1.id), selectParticipant(mid, star2.id)])
  check(() => assert.equal(race.filter(r => r.status === 'fulfilled').length, 1))
  check(() => assert.equal((race.find(r => r.status === 'rejected') as PromiseRejectedResult).reason.status, 409))
  const selected = (await withStore(registrations)).filter(r => r.meetingId === mid && r.status === 'confirmed')
  check(() => assert.equal(selected.length, 1))
  const winner = selected[0].userId === star1.id ? star1 : star2
  const waiting = winner.id === star1.id ? star2 : star1
  const assigned = await withStore(() => hubDataFor(host))
  check(() => assert.deepEqual(assigned.registrations.filter(r => r.meetingId === mid).map(r => r.userId), [winner.id]))
  check(() => assert.deepEqual(assigned.criteria, {}))
  await withdrawParticipation(mid, winner.id)
  const afterCancel = (await withStore(registrations)).filter(r => r.meetingId === mid)
  check(() => assert.equal(afterCancel.filter(r => r.status === 'confirmed').length, 0))
  check(() => assert.equal(afterCancel.find(r => r.userId === waiting.id)?.status, 'pending'))
  await selectParticipant(mid, waiting.id)

  // The database constraint protects the invariant even outside business helpers.
  await assert.rejects(withDatabase(() => execute("INSERT INTO applications(id,meeting_id,user_id,status,requested_at,updated_at) VALUES(?,?,?,'confirmed',?,?)", randomUUID(), mid, 'star-qa', new Date().toISOString(), new Date().toISOString())), (error: any) => error.code === '23505')
  checks++
  const post = await savePublication(isa, { title: 'Aviso de prueba QA', body: 'Contenido ficticio para comprobar el guardado compartido.', audience: 'all', status: 'published' })
  const visible = await withStore(() => hubDataFor(ela))
  check(() => assert.ok(visible.publications.some(p => p.id === post.id)))
  const edits = await Promise.allSettled([
    savePublication(isa, { ...post, publicationId: post.id, body: 'Primer cambio para comprobar las ediciones simultáneas.' }),
    savePublication(ela, { ...post, publicationId: post.id, body: 'Segundo cambio para comprobar las ediciones simultáneas.' }),
  ])
  check(() => assert.equal(edits.filter(r => r.status === 'fulfilled').length, 1))
  check(() => assert.equal((edits.find(r => r.status === 'rejected') as PromiseRejectedResult).reason.status, 409))
  const marker = randomUUID()
  await assert.rejects(withStore(async () => { await saveRecord('qa_rollback', marker, { id: marker }); throw new Error('intentional QA rollback') }))
  const rolledBack = await withStore(() => records<{ id: string }>('qa_rollback'))
  check(() => assert.equal(rolledBack.some(r => r.id === marker), false))
  await changeMeetingStatus(mid, host, 'completed')
  const report = await submitReport(mid, waiting, { scenario: 'no_turn', families: 'yes', issues: ['connection'], comment: 'Resultado ficticio para QA.' })
  check(() => assert.equal(report.wasInvited, 'no'))
  const reportView = await withStore(() => hubDataFor(ela))
  check(() => assert.ok(reportView.reports.some(r => r.id === report.id)))
  const hostReports = await withStore(() => hubDataFor(host))
  check(() => assert.equal(hostReports.reports.some(r => r.id === report.id), false))
  console.log(execFileSync(process.execPath, ['--conditions=react-server', '--import', 'tsx', 'tests/shared-storage.integration.ts', 'probe', mid], { encoding: 'utf8', env: process.env }).trim())
  checks++
  console.log(`${checks} checks passed against shared PostgreSQL: persistence, simultaneous selection, reassignment, permissions, reports and rollback.`)
}

}
main().catch(error => { console.error(error); process.exitCode = 1 })
