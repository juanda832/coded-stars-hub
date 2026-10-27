import assert from 'node:assert/strict'
import {randomUUID} from 'node:crypto'
import {users,managedAccounts} from '../lib/user-directory'
import {calendarConnection,changeCalendarConnection,readCalendarFeed} from '../lib/calendar-connection'
import {withDatabase,query} from '../lib/database'
import {withStore,changeMeeting,requestParticipation,selectParticipant,withdrawParticipation,changeMeetingStatus} from '../lib/store'
import {hubDataFor} from '../lib/hub-data'
import {createManagedAccount,changeAccountAccess} from '../lib/accounts-store'
if(process.env.DATABASE_URL||!process.env.CODED_DEMO_DB?.includes('/calendar-qa-'))throw new Error('Use a disposable calendar-qa SQLite database')
process.env.CODED_CALENDAR_SECRET='calendar-qa-only-signing-key-not-for-hosting'
process.env.CODED_PUBLIC_SITE_URL='http://localhost:3001'
const isa=users.find(user=>user.id==='admin-isa')!,ela=users.find(user=>user.id==='admin-ela')!,star=users.find(user=>user.id==='star-1')!,other=users.find(user=>user.id==='star-2')!,host=users.find(user=>user.id==='host-1')!
let count=0;const check=(fn:()=>void)=>{fn();count++}
async function rejects(fn:()=>Promise<unknown>,status:number){await assert.rejects(fn,(error:any)=>error.status===status);count++}
async function read(connection:any){const url=new URL(connection.url),parts=url.pathname.split('/');return readCalendarFeed(parts.at(-2)!,parts.at(-1)!)}
async function main(){
 const empty=await calendarConnection(isa);check(()=>assert.equal(empty.connected,false))
 const admin=await changeCalendarConnection(isa,{action:'create'}),starConnection=await changeCalendarConnection(star,{action:'create',userId:isa.id,role:'admin'}),hostConnection=await changeCalendarConnection(host,{action:'create'})
 check(()=>assert.equal(admin.connected,true));check(()=>assert.notEqual((admin as any).id,(starConnection as any).id))
 const repeated=await changeCalendarConnection(isa,{action:'create'});check(()=>assert.equal((repeated as any).id,(admin as any).id))
 const saved=await withDatabase(()=>query('SELECT json FROM records WHERE collection=?','calendar_connections'))
 check(()=>assert.equal(JSON.stringify(saved).includes(process.env.CODED_CALENDAR_SECRET!),false))
 check(()=>assert.equal(JSON.stringify(saved).includes(new URL((admin as any).url).pathname.split('/').at(-1)!),false))
 const school='Colegio ficticio · Calendario '+randomUUID()
 const meeting=await changeMeeting(isa,{action:'create',schoolName:school,date:'2027-07-20',time:'18:00',hostId:host.id,joinUrl:'https://example.com/zoom-privado'})
 const second=await changeMeeting(isa,{action:'create',schoolName:'Solo otro anfitrión '+randomUUID(),date:'2027-07-21',time:'18:00',hostId:'host-2'})
 const notConfirmed=await read(starConnection);check(()=>assert.equal(notConfirmed.includes(school),false))
 await requestParticipation(meeting.id,star.id);const pending=await read(starConnection);check(()=>assert.equal(pending.includes(school),false))
 await selectParticipant(meeting.id,star.id)
 const confirmed=await read(starConnection),hostFeed=await read(hostConnection),adminFeed=await read(admin)
 check(()=>assert.ok(confirmed.includes(school)));check(()=>assert.match(confirmed,/DTSTART:20270720T220000Z/))
 check(()=>assert.equal(confirmed.includes('zoom-privado'),false));check(()=>assert.equal(confirmed.includes(second.title),false))
 check(()=>assert.ok(hostFeed.includes(school)));check(()=>assert.equal(hostFeed.includes(second.title),false));check(()=>assert.ok(adminFeed.includes(second.title)))
 const data=await withStore(()=>hubDataFor(isa));check(()=>assert.equal(JSON.stringify(data).includes((admin as any).url),false))
 await changeMeeting(isa,{action:'meeting_edit',meetingId:meeting.id,schoolName:school,date:'2027-07-22',time:'18:00',hostId:host.id})
 const changed=await read(starConnection);check(()=>assert.match(changed,/DTSTART:20270722T220000Z/));check(()=>assert.match(changed,/SEQUENCE:2/));check(()=>assert.ok(changed.includes('UID:'+meeting.id+'@coded-stars-hub')))
 await changeMeetingStatus(meeting.id,isa,'cancelled');const cancelled=await read(starConnection)
 const event=cancelled.split('BEGIN:VEVENT').find(text=>text.includes('UID:'+meeting.id))!
 check(()=>assert.match(event,/STATUS:CANCELLED/));check(()=>assert.match(event,/SEQUENCE:3/));check(()=>assert.equal(event.includes('VALARM'),false))
 await changeMeetingStatus(meeting.id,isa,'scheduled');await withdrawParticipation(meeting.id,star.id)
 const withdrawn=await read(starConnection);check(()=>assert.equal(withdrawn.includes(school),false))
 await rejects(()=>changeCalendarConnection(star,{action:'revoke',id:(admin as any).id,version:(admin as any).version}),409)
 const retained=await calendarConnection(isa);check(()=>assert.equal((retained as any).id,(admin as any).id))
 const rotated=await changeCalendarConnection(isa,{action:'rotate',id:(admin as any).id,version:(admin as any).version});check(()=>assert.notEqual((rotated as any).id,(admin as any).id))
 await rejects(()=>read(admin),404)
 await rejects(()=>changeCalendarConnection(isa,{action:'revoke',id:(admin as any).id,version:(admin as any).version}),409)
 const newFeed=await read(rotated);check(()=>assert.match(newFeed,/BEGIN:VCALENDAR/))
 await changeCalendarConnection(isa,{action:'revoke',id:(rotated as any).id,version:(rotated as any).version});await rejects(()=>read(rotated),404)
 const noConnection=await calendarConnection(isa);check(()=>assert.equal(noConnection.connected,false))
 for(const role of ['star','host','admin'] as const){const actor={...isa,role,reviewer:{id:isa.id,name:isa.name}};await rejects(()=>calendarConnection(actor),403);await rejects(()=>changeCalendarConnection(actor,{action:'create'}),403)}
 const hosted=process.env.VERCEL,environment=process.env.VERCEL_ENV;process.env.VERCEL='1';process.env.VERCEL_ENV='preview'
 await rejects(()=>calendarConnection(star),403);await rejects(()=>changeCalendarConnection(star,{action:'create'}),403)
 if(hosted===undefined)delete process.env.VERCEL;else process.env.VERCEL=hosted
 if(environment===undefined)delete process.env.VERCEL_ENV;else process.env.VERCEL_ENV=environment
 const dynamic=await createManagedAccount(isa,{name:'Star ficticio de calendario',email:'calendar-'+randomUUID()+'@example.com',role:'star',requestId:randomUUID()},async()=>undefined)
 const dynamicConnection=await changeCalendarConnection(dynamic,{action:'create'});await read(dynamicConnection);count++
 const paused=await changeAccountAccess(isa,{accountId:dynamic.id,version:dynamic.version,access:'paused'});await rejects(()=>read(dynamicConnection),404)
 await changeAccountAccess(ela,{accountId:dynamic.id,version:paused.version,access:'active'});await read(dynamicConnection);count++
 const url=new URL((starConnection as any).url),parts=url.pathname.split('/');await rejects(()=>readCalendarFeed(parts.at(-2)!, '0'.repeat(64)),404)
 await rejects(()=>readCalendarFeed('invalid','0'.repeat(64)),404)
 const previous=process.env.CODED_CALENDAR_SECRET;delete process.env.CODED_CALENDAR_SECRET;await rejects(()=>calendarConnection(other),503);process.env.CODED_CALENDAR_SECRET=previous
 const records=await withDatabase(managedAccounts);check(()=>assert.ok(records.some(account=>account.id===dynamic.id)))
 console.log(`${count} private calendar checks passed: ownership, role visibility, UTC, changes, cancellation, withdrawal, revocation, rotation, pausing, isolated previews and no secret persistence.`)
}
main().catch(error=>{console.error(error);process.exitCode=1})
