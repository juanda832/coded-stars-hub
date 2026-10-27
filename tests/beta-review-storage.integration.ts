import assert from 'node:assert/strict'
import {randomUUID} from 'node:crypto'
import {users} from '../lib/user-directory'
import {withStore,changeMeeting,requestParticipation,selectParticipant} from '../lib/store'
import {withHubStore,reviewSchema} from '../lib/review-session'
import {hubDataFor} from '../lib/hub-data'
import {saveBetaContribution,reviewBetaContribution,betaContributions} from '../lib/beta-review'
import {withDatabase} from '../lib/database'

if(!process.env.CODED_DEMO_DB?.includes('/beta-review-qa-')||process.env.DATABASE_URL)throw new Error('Run this story with a disposable beta-review-qa SQLite database')
const isa=users.find(user=>user.id==='admin-isa')!,ela=users.find(user=>user.id==='admin-ela')!,star=users.find(user=>user.id==='star-1')!,host=users.find(user=>user.id==='host-1')!
const reviewAdmin={...isa,reviewer:{id:isa.id,name:isa.name}},reviewStar={...star,reviewer:reviewAdmin.reviewer},reviewHost={...host,reviewer:reviewAdmin.reviewer}
let count=0;const check=(fn:()=>void)=>{fn();count++}
async function rejects(fn:()=>Promise<unknown>,status:number){await assert.rejects(fn,(error:any)=>error.status===status);count++}
async function main(){
 const draft={action:'create',schoolName:'Colegio ficticio · Aislamiento '+randomUUID(),date:'2027-08-20',time:'18:00',hostId:host.id,joinUrl:'https://example.com/jdp-review'}
 const main=await changeMeeting(isa,draft)
 const initial=await withHubStore(reviewStar,()=>hubDataFor(reviewStar))
 check(()=>assert.equal(initial.meetings.some(meeting=>meeting.id===main.id),false))
 const meeting=await withHubStore(reviewAdmin,()=>changeMeeting(reviewAdmin,{...draft,schoolName:'Colegio del recorrido '+randomUUID()}))
 await withHubStore(reviewStar,()=>requestParticipation(meeting.id,reviewStar.id))
 await withHubStore(reviewAdmin,()=>selectParticipant(meeting.id,reviewStar.id))
 const assigned=await withHubStore(reviewHost,()=>hubDataFor(reviewHost))
 check(()=>assert.ok(assigned.assignedStars.some(person=>person.userId===star.id)))
 check(()=>assert.equal(assigned.meetings.some(item=>item.id===main.id),false))
 const original=await withStore(()=>hubDataFor(isa))
 check(()=>assert.equal(original.meetings.some(item=>item.id===meeting.id),false))
 const otherAdmin={...ela,reviewer:{id:ela.id,name:ela.name}}
 const other=await withHubStore(otherAdmin,()=>hubDataFor(otherAdmin))
 check(()=>assert.equal(other.meetings.some(item=>item.id===meeting.id),false))
 check(()=>assert.notEqual(reviewSchema(isa.id),reviewSchema(ela.id)))
 await assert.rejects(()=>withHubStore(reviewStar,()=>withDatabase(async()=>undefined,reviewSchema(ela.id))),/Cross-scope/);count++
 const body={kind:'error',title:'Prueba ficticia del reporte',detail:'Abrí la reunión de ejemplo y revisé la pantalla del celular.',section:'Reuniones',requestId:randomUUID()}
 const report=await withStore(()=>saveBetaContribution(star,body))
 const again=await withStore(()=>saveBetaContribution(star,body))
 check(()=>assert.equal(report.id,again.id))
 const all=await withStore(()=>betaContributions(ela))
 check(()=>assert.ok(all.some(item=>item.id===report.id)))
 const own=await withStore(()=>betaContributions(host))
 check(()=>assert.equal(own.some(item=>item.id===report.id),false))
 await rejects(()=>withStore(()=>reviewBetaContribution(star,{contributionId:report.id,status:'resolved',version:1})),403)
 const changes=await Promise.allSettled([withStore(()=>reviewBetaContribution(isa,{contributionId:report.id,status:'reviewing',version:1})),withStore(()=>reviewBetaContribution(ela,{contributionId:report.id,status:'resolved',version:1}))])
 check(()=>assert.equal(changes.filter(result=>result.status==='fulfilled').length,1))
 check(()=>assert.equal((changes.find(result=>result.status==='rejected') as PromiseRejectedResult).reason.status,409))
 await rejects(()=>withStore(()=>saveBetaContribution(star,{...body,requestId:randomUUID(),detail:'short'})),400)
 await rejects(()=>withStore(()=>saveBetaContribution(star,{...body,requestId:randomUUID(),kind:'admin'})),400)
 const sandboxReports=await withHubStore(reviewAdmin,()=>betaContributions(reviewAdmin))
 check(()=>assert.deepEqual(sandboxReports,[]))
 console.log(`${count} checks passed: review isolation across roles and people, feedback privacy, validation, retries and concurrent triage.`)
}
main().catch(error=>{console.error(error);process.exitCode=1})
