import test from 'node:test'
import assert from 'node:assert/strict'
import {calendarMeetings,calendarFeed,calendarEscape,foldCalendarLine} from '../lib/calendar-feed.ts'
const meeting=changes=>({id:'meeting-1',title:'Colegio de prueba',program:'',language:'',startsAt:'2027-01-15T23:00:00.000Z',duration:null,host:'Anfitrión privado',hostId:'host-1',capacity:1,status:'scheduled',description:'Nota interna que no debe exportarse',hostNote:'Indicación privada',joinUrl:'https://example.com/zoom-secreto',...changes})
const user=role=>({id:role==='host'?'host-1':'star-1',role,name:'Persona privada',email:'persona@example.com'})
const registration=status=>({id:'r1',userId:'star-1',meetingId:'meeting-1',status})
test('A Star calendar includes only their confirmed participations',()=>{
 for(const status of ['pending','not_selected','withdrawn'])assert.deepEqual(calendarMeetings(user('star'),[meeting()],[registration(status)]),[])
 assert.equal(calendarMeetings(user('star'),[meeting()],[registration('confirmed')]).length,1)
 assert.equal(calendarMeetings({...user('star'),id:'star-2'},[meeting()],[registration('confirmed')]).length,0)
})
test('Host calendars contain only assigned meetings while coordination sees its agenda',()=>{
 const all=[meeting(),meeting({id:'m2',hostId:'host-2'})]
 assert.deepEqual(calendarMeetings(user('host'),all,[]).map(item=>item.id),['meeting-1'])
 assert.equal(calendarMeetings(user('admin'),all,[]).length,2)
})
test('Unknown duration is preserved without inventing an end time',()=>{
 const ics=calendarFeed([meeting()],'https://hub.example.com')
 assert.match(ics,/DTSTART:20270115T230000Z/);assert.doesNotMatch(ics,/DTEND|DURATION:/)
 assert.match(ics,/Hora de finalización pendiente/)
})
test('Calendar times remain UTC across Orlando winter, summer and day boundaries',()=>{
 const ics=calendarFeed([meeting(),meeting({id:'summer',startsAt:'2027-07-15T22:00:00.000Z',duration:45}),meeting({id:'late',startsAt:'2027-07-16T03:30:00.000Z'})],'https://hub.example.com')
 assert.match(ics,/DTSTART:20270115T230000Z/);assert.match(ics,/DTSTART:20270715T220000Z/);assert.match(ics,/DTEND:20270715T224500Z/);assert.match(ics,/DTSTART:20270716T033000Z/)
})
test('Exports omit Zoom, private notes, student contacts and attendee invitations',()=>{
 const ics=calendarFeed([meeting()],'https://hub.example.com')
 for(const forbidden of ['zoom-secreto','Nota interna','Indicación privada','Anfitrión privado','persona@example.com','ATTENDEE','ORGANIZER'])assert.equal(ics.includes(forbidden),false)
 assert.match(ics,/https:\/\/hub.example.com\/#\/reuniones/)
})
test('Cancelled meetings update their stable UID and have no reminder',()=>{
 const active=calendarFeed([meeting()],'https://hub.example.com'),cancelled=calendarFeed([meeting({status:'cancelled'})],'https://hub.example.com')
 assert.equal(active.match(/UID:.+/)[0],cancelled.match(/UID:.+/)[0]);assert.match(cancelled,/STATUS:CANCELLED/);assert.doesNotMatch(cancelled,/VALARM/)
})
test('Rescheduling keeps the event identity and changes its instant',()=>{
 const first=calendarFeed([meeting()],'https://hub.example.com'),second=calendarFeed([meeting({startsAt:'2027-01-16T23:00:00.000Z'})],'https://hub.example.com')
 assert.equal(first.match(/UID:.+/)[0],second.match(/UID:.+/)[0]);assert.match(second,/DTSTART:20270116T230000Z/)
})
test('Calendar text cannot inject a new event through CRLF, commas or semicolons',()=>{
 assert.equal(calendarEscape('A\r\nBEGIN:VEVENT;X,\\Y'),'A\\nBEGIN:VEVENT\\;X\\,\\\\Y')
 const ics=calendarFeed([meeting({title:'Nombre\r\nBEGIN:VEVENT\r\nATTENDEE:attacker@example.com'})],'https://hub.example.com')
 assert.equal(ics.split('\r\n').filter(line=>line==='BEGIN:VEVENT').length,1)
 assert.equal(ics.split('\r\n').some(line=>line.startsWith('ATTENDEE:')),false)
})
test('Unicode calendar lines fold at 75 UTF-8 bytes without breaking characters',()=>{
 const value='SUMMARY:'+('Órbita 🚀, Tokio y São Paulo '.repeat(20)),folded=foldCalendarLine(value)
 for(const line of folded.split('\r\n'))assert.ok(Buffer.byteLength(line,'utf8')<=75)
 assert.equal(folded.replace(/\r\n /g,''),value);assert.equal(folded.includes('�'),false)
})
test('Feeds use CRLF, retain history and do not mutate the meeting input',()=>{
 const all=[meeting({startsAt:'2020-01-15T23:00:00.000Z'}),meeting({id:'new'})],before=structuredClone(all)
 const ics=calendarFeed(all,'https://hub.example.com',new Date('2026-10-27T04:00:00Z'))
 assert.equal(ics.replace(/\r\n/g,'').includes('\n'),false);assert.match(ics,/20200115T230000Z/);assert.deepEqual(all,before)
})
