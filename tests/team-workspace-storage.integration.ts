import assert from 'node:assert/strict'
import {withStore,snapshot,changeMeeting,savePublication} from '../lib/store'
import {withHubStore} from '../lib/review-session'
import {directoryUsers,users} from '../lib/user-directory'
import {hubDataFor} from '../lib/hub-data'
import {query,execute} from '../lib/database'
if(process.env.DATABASE_URL||!process.env.CODED_DEMO_DB?.includes('/team-workspace-qa'))throw new Error('Use a disposable team-workspace-qa SQLite database')
process.env.NEXT_PUBLIC_CODED_WORKSPACE_MODE='team'
const isa=users.find(user=>user.id==='admin-isa')!,ela=users.find(user=>user.id==='admin-ela')!
let checks=0;const check=(fn:()=>void)=>{fn();checks++}
async function main(){
 const first=await withStore(()=>hubDataFor(isa));check(()=>assert.equal(first.workspace,'team'));check(()=>assert.equal(first.meetings.length,0));check(()=>assert.equal(first.registrations.length,0));check(()=>assert.equal(first.candidates.length,0));check(()=>assert.equal(first.hosts.length,0));check(()=>assert.equal(first.team.some(user=>user.id==='admin-1'),false));check(()=>assert.equal(first.team.every(user=>['admin-isa','admin-ela','admin-owner'].includes(user.id)),true))
 const meeting=await changeMeeting(isa,{action:'create',schoolName:'Colegio autorizado de prueba',date:'2030-07-20',time:'18:00',joinUrl:'https://example.com/sala'})
 await savePublication(ela,{title:'Reuniones de esta semana',body:'El equipo puede empezar a preparar la agenda compartida.',audience:'all',status:'published'})
 const second=await withStore(()=>hubDataFor(ela));check(()=>assert.equal(second.meetings.length,1));check(()=>assert.equal(second.meetings[0].schoolName,meeting.schoolName));check(()=>assert.equal(second.meetings[0].program,''));check(()=>assert.equal(second.meetings[0].hostId,''));check(()=>assert.equal(second.meetings[0].duration,null));check(()=>assert.equal(second.publications.length,1));check(()=>assert.equal(second.registrations.length,0))
 const reviewer={...isa,reviewer:{id:isa.id,name:isa.name}},review=await withHubStore(reviewer,()=>hubDataFor(reviewer));check(()=>assert.equal(review.workspace,'review'));check(()=>assert.equal(review.meetings.length,5));check(()=>assert.ok(review.candidates.length));check(()=>assert.ok(review.hosts.length));check(()=>assert.equal(review.meetings.some(item=>item.id===meeting.id),false))
 await withHubStore(reviewer,()=>changeMeeting(reviewer,{action:'create',schoolName:'Solo recorrido de prueba',date:'2030-07-20',time:'18:00'}))
 const main=await withStore(snapshot);check(()=>assert.equal(main.meetings.length,1));check(()=>assert.equal(main.meetings.some(item=>item.schoolName==='Solo recorrido de prueba'),false))
 const directory=await directoryUsers();check(()=>assert.equal(directory.some(item=>item.role==='star'||item.role==='host'),false))
 const saved=await withStore(()=>query('SELECT value FROM metadata WHERE key=?','seed-v3'));check(()=>assert.equal(saved[0].value,'team-empty-v1'))
 await withStore(()=>execute('UPDATE metadata SET value=? WHERE key=?','1','seed-v3'));await assert.rejects(()=>withStore(snapshot),(error:any)=>error.status===503);checks++
 console.log(`${checks} team workspace checks passed: empty startup, no example accounts, shared JDP/content, separate role reviews, no automatic assignment and refusal to reuse a seeded workspace.`)
}
main().catch(error=>{console.error(error);process.exitCode=1})
