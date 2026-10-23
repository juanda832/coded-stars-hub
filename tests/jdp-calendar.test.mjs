import test from 'node:test'
import assert from 'node:assert/strict'
import { meetingDraft } from '../lib/meeting-draft.ts'
import { localDateTime, ORLANDO_ZONE } from '../lib/time-zones.ts'
import { calendarText, friendlyDay, isActiveMeeting } from '../lib/meeting-utils.ts'
import { reportAvailable } from '../lib/reports.ts'
import { meetingSchedule } from '../lib/meeting-schedule.ts'
import { matchesMeetingSearch } from '../lib/agenda.ts'
const base={schoolName:'Colegio de ejemplo',date:'2027-01-15',time:'18:00',sourceTimeZone:ORLANDO_ZONE,joinUrl:'https://example.com/sala'}
const meeting=changes=>({id:'jdp',host:'',hostId:'',status:'scheduled',...meetingDraft(base),...changes})
test('Five calendar fields preserve school, optional programme and source zone without defaults',()=>{
 const result=meetingDraft(base)
 assert.equal(result.schoolName,base.schoolName);assert.equal(result.title,base.schoolName)
 assert.equal(result.program,'');assert.equal(result.language,'');assert.equal(result.duration,null)
 assert.equal(result.description,'');assert.equal(result.sourceTimeZone,ORLANDO_ZONE)
 assert.equal(result.joinUrl,base.joinUrl)
})
test('Orlando winter and summer use different offsets automatically',()=>{
 const winter=meetingDraft(base),summer=meetingDraft({...base,date:'2027-07-15'})
 assert.equal(winter.startsAt,'2027-01-15T23:00:00.000Z');assert.equal(summer.startsAt,'2027-07-15T22:00:00.000Z')
 assert.equal(localDateTime(winter.startsAt,'America/La_Paz'),'2027-01-15T19:00')
 assert.equal(localDateTime(summer.startsAt,'America/La_Paz'),'2027-07-15T18:00')
})
test('Converting Orlando may change the UTC calendar day',()=>assert.equal(meetingDraft({...base,time:'23:30'}).startsAt,'2027-01-16T04:30:00.000Z'))
test('No fixed offset or caller supplied UTC instant can replace the Orlando wall time',()=>{
 assert.equal(meetingDraft({...base,startsAt:'2027-01-15T18:00Z'}).startsAt,'2027-01-15T23:00:00.000Z')
 assert.throws(()=>meetingDraft({...base,sourceTimeZone:'UTC'}),/Orlando/)
})
test('Nonexistent and repeated Orlando hours require clarification instead of silently choosing',()=>{
 assert.throws(()=>meetingDraft({...base,date:'2027-03-14',time:'02:30'}),/no existe/)
 assert.throws(()=>meetingDraft({...base,date:'2027-11-07',time:'01:30'}),/se repite/)
})
test('Unknown duration creates no end time in the display or calendar export',()=>{
 const m=meeting(),slot=meetingSchedule(m,'America/La_Paz'),ics=calendarText(m)
 assert.equal(slot.startTime,'19:00');assert.equal(slot.endAt,'');assert.equal(slot.endTime,'')
 assert.doesNotMatch(ics,/DTEND|DURATION|Anfitrión:|Programa:|Idioma:/)
 assert.match(ics,/Colegio: Colegio de ejemplo/)
})
test('No report becomes available from an invented duration; explicit completion enables it',()=>{
 const m=meeting({startsAt:'2020-01-01T12:00:00Z'})
 assert.equal(isActiveMeeting(m),true);assert.equal(reportAvailable(m),false)
 assert.equal(reportAvailable({...m,status:'completed'}),true)
})
test('An absent language is not indexed as Spanish',()=>assert.equal(matchesMeetingSearch(meeting(),'español'),false))
test('School can be found by name',()=>assert.equal(matchesMeetingSearch(meeting(),'colegio ejemplo'),true))
test('Supplied programme aliases and other programme names are preserved',()=>{
 assert.equal(meetingDraft({...base,program:'Europa'}).program,'London')
 assert.equal(meetingDraft({...base,program:'Tokyo'}).program,'Tokyo')
 assert.equal(meetingDraft({...base,program:'Madison'}).program,'Madison')
})
test('Existing records keep their name without inventing a school',()=>{
 const previous={...meeting(),title:'Título anterior',schoolName:undefined}
 const saved=meetingDraft({...base,schoolName:'',title:previous.title},previous)
 assert.equal(saved.title,previous.title);assert.equal(saved.schoolName,undefined)
})
test('Invalid school, programme, duration and unsafe access links are rejected',()=>{
 for(const changes of [{schoolName:''},{schoolName:[]},{schoolName:'x'},{program:[]},{duration:0},{duration:181},{joinUrl:'javascript:alert(1)'},{joinUrl:'https://u:p@example.com/'}])assert.throws(()=>meetingDraft({...base,...changes}))
})

test('A known school cannot be cleared while editing',()=>assert.throws(()=>meetingDraft({...base,schoolName:''},meeting()),/colegio/))
test('Dates in another year include their year in the agenda',()=>{const year=new Date().getFullYear()+1;assert.match(friendlyDay(`${year}-07-15T22:00:00Z`,'America/La_Paz'),new RegExp(String(year)))})
