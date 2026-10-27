import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { createManagedAccount, completeManagedAccount, changeAccountAccess } from '../lib/accounts-store'
import { withDatabase, query } from '../lib/database'
import { users, directoryUsers, managedAccounts, assertAccountAccess } from '../lib/user-directory'
import { withStore, changeMeeting, requestParticipation, selectParticipant, updateOwnProfile, savePublication, notifications } from '../lib/store'
import { hubDataFor } from '../lib/hub-data'

// Works on a disposable SQLite file OR an explicitly named PostgreSQL QA schema.
if(process.env.DATABASE_URL?!/^coded_hub_qa_[a-z0-9_]+$/.test(process.env.CODED_DATABASE_SCHEMA||''):!process.env.CODED_DEMO_DB?.includes('/accounts-qa-'))throw new Error('Use an isolated accounts QA database')
const isa=users.find(user=>user.id==='admin-isa')!,ela=users.find(user=>user.id==='admin-ela')!
const exampleStar=users.find(user=>user.id==='star-1')!,exampleHost=users.find(user=>user.id==='host-1')!
const draft=(role:'star'|'host')=>({name:role==='star'?'Star de Prueba':'Anfitrión de Prueba',email:`accounts-qa-${randomUUID()}@example.com`,role,requestId:randomUUID()})
let checks=0
const check=(fn:()=>void)=>{fn();checks++}
async function rejects(fn:()=>Promise<unknown>,status:number){await assert.rejects(fn,(error:any)=>error.status===status);checks++}

async function main(){
 if(process.argv[2]==='probe'){
  const account=(await directoryUsers()).find(user=>user.id===process.argv[3]);assert.ok(account);console.log('Independent process: private account persisted');return
 }
 const fakeProvider=async()=> 'provider-qa-only'
 const input=draft('star')
 const star=await createManagedAccount(isa,input,fakeProvider)
 check(()=>assert.equal(star.provisioning,'ready'))
 check(()=>assert.equal(star.role,'star'))
 check(()=>assert.equal('providerId' in star,false))
 check(()=>assert.equal('requestId' in star,false))
 const repeated=await createManagedAccount(ela,input,async()=>{throw new Error('must not provision twice')})
 check(()=>assert.equal(repeated.id,star.id))
 await rejects(()=>createManagedAccount(isa,{...input,name:'Another person'},fakeProvider),409)
 await rejects(()=>createManagedAccount(isa,{...input,requestId:randomUUID()},fakeProvider),409)
 await rejects(()=>createManagedAccount(isa,{...draft('host'),email:isa.email},fakeProvider),409)
 for(const actor of [exampleStar,exampleHost])await rejects(()=>createManagedAccount(actor,draft('host'),fakeProvider),403)
 await rejects(()=>createManagedAccount(isa,{...draft('host'),role:'admin'},fakeProvider),400)
 await rejects(()=>createManagedAccount(isa,{...draft('star'),email:'minor@real-school.edu'},fakeProvider),400)
 const raceInput=draft('host')
 const race=await Promise.allSettled([createManagedAccount(isa,raceInput,fakeProvider),createManagedAccount(ela,{...raceInput,requestId:randomUUID()},fakeProvider)])
 check(()=>assert.equal(race.filter(result=>result.status==='fulfilled').length,1))
 check(()=>assert.equal((race.find(result=>result.status==='rejected') as PromiseRejectedResult).reason.status,409))
 const recovery=draft('host')
 await assert.rejects(()=>createManagedAccount(isa,recovery,async()=>{throw new Error('simulated provider interruption')}));checks++
 const pending=await withDatabase(async()=>(await managedAccounts()).find(account=>account.email===recovery.email)!)
 check(()=>assert.equal(pending.provisioning,'pending'))
 const pendingDirectory=await directoryUsers();check(()=>assert.equal(pendingDirectory.some(user=>user.id===pending.id),false))
 const host=await completeManagedAccount(ela,pending.id,fakeProvider)
 check(()=>assert.equal(host.provisioning,'ready'))
 const own=await withStore(()=>hubDataFor(star))
 check(()=>assert.deepEqual(own.profile,{languages:[],programs:[],availability:'',experience:''}))
 check(()=>assert.equal(own.accounts,undefined))
 check(()=>assert.equal(own.accountPolicy,undefined))
 check(()=>assert.deepEqual(own.team,[]))
 await updateOwnProfile(star,{languages:['Español'],programs:['Orlando'],availability:'Lunes por la tarde, hora de La Paz.',experience:'Mi primera JDP.'})
 const meeting=await changeMeeting(isa,{action:'create',schoolName:'Colegio ficticio · Alta privada QA',date:'2027-08-15',time:'18:00',hostId:host.id,joinUrl:'https://example.com/jdp-private-account'})
 check(()=>assert.equal(meeting.host,host.name))
 await requestParticipation(meeting.id,star.id)
 await withStore(()=>assertAccountAccess(star))
 await selectParticipant(meeting.id,star.id)
 const hostData=await withStore(()=>hubDataFor(host))
 check(()=>assert.ok(hostData.assignedStars.some(person=>person.userId===star.id)))
 check(()=>assert.equal(hostData.accounts,undefined))
 check(()=>assert.deepEqual(hostData.candidates,[]))
 check(()=>assert.equal(JSON.stringify(hostData).includes(star.email),false))
 const adminData=await withStore(()=>hubDataFor(ela))
 check(()=>assert.ok(adminData.candidates.some(person=>person.userId===star.id&&person.availability.includes('La Paz'))))
 check(()=>assert.ok(adminData.hosts.some(person=>person.id===host.id)))
 check(()=>assert.ok(adminData.accounts?.some(person=>person.id===star.id)))
 check(()=>assert.equal(JSON.stringify(adminData.accounts).includes('provider-qa-only'),false))
 const post=await savePublication(isa,{title:'Publicación para Stars QA',body:'Un aviso ficticio que debe llegar también a los nuevos accesos.',audience:'star',status:'published'})
 const notices=await withStore(()=>notifications(star.id));check(()=>assert.ok(notices.some(item=>item.meetingId==='post:'+post.id)))
 const changes=await Promise.allSettled([changeAccountAccess(isa,{accountId:star.id,version:star.version,access:'paused'}),changeAccountAccess(ela,{accountId:star.id,version:star.version,access:'paused'})])
 check(()=>assert.equal(changes.filter(result=>result.status==='fulfilled').length,1))
 check(()=>assert.equal((changes.find(result=>result.status==='rejected') as PromiseRejectedResult).reason.status,409))
 const paused=(changes.find(result=>result.status==='fulfilled') as PromiseFulfilledResult<typeof star>).value
 const activeDirectory=await directoryUsers();check(()=>assert.equal(activeDirectory.some(user=>user.id===star.id),false))
 const historyDirectory=await directoryUsers(true);check(()=>assert.equal(historyDirectory.some(user=>user.id===star.id),true))
 await rejects(()=>withStore(()=>hubDataFor(star)),401)
 await rejects(()=>withStore(()=>assertAccountAccess(star)),401)
 const preserved=await withStore(()=>hubDataFor(ela))
 check(()=>assert.ok(preserved.registrations.some(item=>item.meetingId===meeting.id&&item.userId===star.id&&item.status==='confirmed')))
 check(()=>assert.ok(preserved.candidates.some(person=>person.userId===star.id)))
 await rejects(()=>changeAccountAccess(exampleStar,{accountId:star.id,access:'active',version:paused.version}),403)
 await rejects(()=>changeAccountAccess(isa,{accountId:isa.id,access:'paused',version:1}),404)
 const resumed=await changeAccountAccess(ela,{accountId:star.id,access:'active',version:paused.version})
 check(()=>assert.equal(resumed.access,'active'))
 await withStore(()=>assertAccountAccess(star));checks++
 const after=await withStore(()=>hubDataFor(star))
 check(()=>assert.ok(after.registrations.some(item=>item.status==='confirmed'&&item.meetingId===meeting.id)))
 const audits=await withDatabase(()=>query('SELECT json FROM records WHERE collection=?','account_events'))
 check(()=>assert.ok(audits.some(row=>JSON.parse(String(row.json)).action==='paused')))
 check(()=>assert.equal(JSON.stringify(audits).includes(star.email),false))
 console.log(execFileSync(process.execPath,['--conditions=react-server','--import','tsx','tests/accounts-storage.integration.ts','probe',star.id],{env:process.env,encoding:'utf8'}).trim());checks++
 console.log(`${checks} checks passed: private directory, retries, concurrency, role boundaries, profiles, notifications, pausing and persistence.`)
}
main().catch(error=>{console.error(error);process.exitCode=1})
