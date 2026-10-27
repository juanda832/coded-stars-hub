import assert from 'node:assert/strict'
import {users} from '../lib/user-directory'
import {previewHostCalendar,commitHostCalendar} from '../lib/calendar-import-store'
import {withStore,snapshot} from '../lib/store'
import {query} from '../lib/database'
import {withHubStore} from '../lib/review-session'
import {hubDataFor} from '../lib/hub-data'
if(process.env.DATABASE_URL||!process.env.CODED_DEMO_DB?.includes('/calendar-import-qa'))throw new Error('Use a disposable calendar-import-qa SQLite database')
process.env.CODED_CALENDAR_SECRET='calendar-import-qa-only-key-not-for-hosting'
const isa=users.find(user=>user.id==='admin-isa')!,ela=users.find(user=>user.id==='admin-ela')!,star=users.find(user=>user.id==='star-1')!,host=users.find(user=>user.id==='host-1')!
const text=(uid='import-qa@example.com',title='Colegio ficticio',time='20300720T220000Z')=>`BEGIN:VCALENDAR\r\nVERSION:2.0\r\nBEGIN:VEVENT\r\nUID:${uid}\r\nSUMMARY:${title}\r\nDTSTART:${time}\r\nEND:VEVENT\r\nEND:VCALENDAR\r\n`
let checks=0;const check=(fn:()=>void)=>{fn();checks++}
async function rejects(fn:()=>Promise<unknown>,status:number){await assert.rejects(fn,(error:any)=>error.status===status);checks++}
const item=(candidate:any,extra={})=>({token:candidate.token,schoolName:candidate.schoolName,program:'',date:candidate.date,time:candidate.time,joinUrl:candidate.joinUrl,...extra})
async function main(){
 for(const actor of [star,host]){await rejects(()=>previewHostCalendar(actor,text()),403);await rejects(()=>commitHostCalendar(actor,[],''),403)}
 const before=await withStore(snapshot),preview=await previewHostCalendar(isa,text()),candidate=preview.candidates[0]
 check(()=>assert.equal(preview.candidates.length,1))
 check(()=>assert.equal(candidate.existingMeetingId,undefined));check(()=>assert.equal(candidate.duration,null))
 const afterPreview=await withStore(snapshot);check(()=>assert.equal(afterPreview.meetings.length,before.meetings.length))
 await rejects(()=>commitHostCalendar(ela,[item(candidate)],''),409)
 await rejects(()=>commitHostCalendar(isa,[item(candidate,{token:candidate.token.slice(0,-1)+(candidate.token.endsWith('0')?'1':'0')})],''),409)
 const second=(await previewHostCalendar(isa,text('other-qa@example.com','Otro colegio'))).candidates[0]
 await rejects(()=>commitHostCalendar(isa,[item(candidate),item(second,{schoolName:''})],''),400)
 const rolledBack=await withStore(snapshot);check(()=>assert.equal(rolledBack.meetings.length,before.meetings.length))
 const saved=await commitHostCalendar(isa,[item(candidate,{schoolName:'Colegio revisado'})],'');check(()=>assert.equal(saved.created,1))
 const state=await withStore(snapshot),meeting=state.meetings.find(meeting=>meeting.schoolName==='Colegio revisado')!
 check(()=>assert.ok(meeting));check(()=>assert.equal(meeting.hostId,''));check(()=>assert.equal(meeting.program,''));check(()=>assert.equal(meeting.language,''));check(()=>assert.equal(meeting.duration,null));check(()=>assert.equal(meeting.capacity,1));check(()=>assert.equal(meeting.startsAt,'2030-07-20T22:00:00.000Z'));check(()=>assert.equal(state.registrations.some(item=>item.meetingId===meeting.id),false))
 const retry=await commitHostCalendar(isa,[item(candidate)],'');check(()=>assert.equal(retry.created,0));check(()=>assert.equal(retry.duplicates,1))
 const moved=await previewHostCalendar(ela,text('import-qa@example.com','Cambio en Google','20300722T220000Z'));check(()=>assert.equal(moved.candidates[0].existingMeetingId,meeting.id))
 await commitHostCalendar(ela,[item(moved.candidates[0])],'');const unchanged=await withStore(snapshot);check(()=>assert.equal(unchanged.meetings.find(item=>item.id===meeting.id)?.startsAt,meeting.startsAt))
 const newText=text('concurrent-qa@example.com','Colegio concurrente'),a=(await previewHostCalendar(isa,newText)).candidates[0],b=(await previewHostCalendar(ela,newText)).candidates[0]
 const concurrent=await Promise.all([commitHostCalendar(isa,[item(a)],host.id),commitHostCalendar(ela,[item(b)],host.id)]);check(()=>assert.equal(concurrent.reduce((sum,item)=>sum+item.created,0),1));check(()=>assert.equal(concurrent.reduce((sum,item)=>sum+item.duplicates,0),1))
 const reviewer={...isa,reviewer:{id:ela.id,name:ela.name}};await rejects(()=>withHubStore(reviewer,()=>commitHostCalendar(reviewer,[item(second)],'')),409)
 const reviewText=text('review-qa@example.com','Colegio aislado'),review=await withHubStore(reviewer,()=>previewHostCalendar(reviewer,reviewText));await withHubStore(reviewer,()=>commitHostCalendar(reviewer,[item(review.candidates[0])],''));const main=await withStore(snapshot);check(()=>assert.equal(main.meetings.some(item=>item.schoolName==='Colegio aislado'),false))
 const records=await withStore(()=>query('SELECT json FROM records WHERE collection=?','calendar_imports'));check(()=>assert.equal(JSON.stringify(records).includes('import-qa@example.com'),false))
 const data=await withStore(()=>hubDataFor(star));check(()=>assert.equal(JSON.stringify(data).includes(candidate.token),false))
 console.log(`${checks} calendar import storage checks passed: administrator-only preview, atomic selection, signed ownership, no duplicates or automatic assignment, concurrent imports, manual updates and isolated reviews.`)
}
main().catch(error=>{console.error(error);process.exitCode=1})
