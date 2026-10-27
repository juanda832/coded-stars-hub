import test from 'node:test'
import assert from 'node:assert/strict'
import {parseHostCalendar,googleCalendarSource} from '../lib/calendar-import.ts'
const event=extra=>'BEGIN:VEVENT\r\nUID:private-event@example.com\r\nSUMMARY:Colegio ficticio\r\nDTSTART:20270720T220000Z\r\n'+extra+'\r\nEND:VEVENT'
const calendar=events=>'BEGIN:VCALENDAR\r\nVERSION:2.0\r\n'+events+'\r\nEND:VCALENDAR\r\n'
const now=Date.parse('2026-10-27T12:00:00Z')
test('Google imports keep UTC and display the Orlando summer and winter times',()=>{
 const summer=parseHostCalendar(calendar(event('')),now).candidates[0]
 assert.equal(summer.startsAt,'2027-07-20T22:00:00.000Z');assert.equal(summer.time,'18:00')
 const winter=parseHostCalendar(calendar(event('').replace('20270720T220000Z','20270120T230000Z')),now).candidates[0]
 assert.equal(winter.time,'18:00');assert.equal(winter.date,'2027-01-20')
})
test('TZID without a timezone component uses IANA rather than the host machine zone',()=>{
 const result=parseHostCalendar(calendar(event('').replace('DTSTART:20270720T220000Z','DTSTART;TZID=America/New_York:20270720T180000')),now)
 assert.equal(result.candidates[0].startsAt,'2027-07-20T22:00:00.000Z')
})
test('Missing timezones, all-day events and nonexistent DST hours are skipped explicitly',()=>{
 for(const start of ['DTSTART:20270720T180000','DTSTART;VALUE=DATE:20270720','DTSTART;TZID=America/New_York:20270314T023000']){
  const result=parseHostCalendar(calendar(event('').replace('DTSTART:20270720T220000Z',start)),now)
  assert.equal(result.candidates.length,0);assert.equal(result.skipped.invalid,1)
 }
})
test('Recurring series and exceptions are never silently turned into one-off meetings',()=>{
 for(const prop of ['RRULE:FREQ=WEEKLY','RDATE:20270721T220000Z','RECURRENCE-ID:20270720T220000Z'])assert.equal(parseHostCalendar(calendar(event(prop)),now).skipped.recurring,1)
})
test('Cancelled and past events are not offered as new JDP',()=>{
 assert.equal(parseHostCalendar(calendar(event('STATUS:CANCELLED')),now).skipped.cancelled,1)
 assert.equal(parseHostCalendar(calendar(event('').replace('20270720','20250720')),now).skipped.past,1)
})
test('Unknown duration stays null and only explicitly usable durations are retained',()=>{
 assert.equal(parseHostCalendar(calendar(event('')),now).candidates[0].duration,null)
 assert.equal(parseHostCalendar(calendar(event('DTEND:20270720T230000Z')),now).candidates[0].duration,60)
 const invalid=parseHostCalendar(calendar(event('DURATION:PT3M')),now).candidates[0]
 assert.equal(invalid.duration,null);assert.ok(invalid.warnings.length)
})
test('Preview extracts a conference link but never copies attendees or private notes',()=>{
 const result=parseHostCalendar(calendar(event('DESCRIPTION:Nota interna privada https://example.zoom.us/j/123?pwd=abc&amp;lang=es\r\nATTENDEE:mailto:person@example.com')),now).candidates[0]
 assert.equal(result.joinUrl,'https://example.zoom.us/j/123?pwd=abc&lang=es')
 assert.equal(JSON.stringify(result).includes('Nota interna privada'),false);assert.equal(JSON.stringify(result).includes('person@example.com'),false)
})
test('Links outside recognized conference domains are left for manual completion',()=>{
 const result=parseHostCalendar(calendar(event('LOCATION:https://zoom.us.attacker.example/j/123')),now).candidates[0]
 assert.equal(result.joinUrl,'');assert.ok(result.warnings.some(text=>text.includes('Falta el enlace')))
})
test('Duplicate UID is stable across exports and counted once',()=>{
 const one=parseHostCalendar(calendar(event('')),now),two=parseHostCalendar(calendar(event('')+'\r\n'+event('')),now)
 assert.equal(two.candidates.length,1);assert.equal(two.skipped.duplicate,1);assert.equal(one.candidates[0].key,two.candidates[0].key)
})
test('Native Hub calendar event identities can be recognized without exposing their source',()=>{
 assert.equal(parseHostCalendar(calendar(event('').replace('private-event@example.com','meeting-1@coded-stars-hub')),now).candidates[0].nativeId,'meeting-1')
})
test('Malformed or oversized imports produce a clear bounded error',()=>{
 assert.throws(()=>parseHostCalendar('not a calendar',now),/archivo .ics/)
 assert.throws(()=>parseHostCalendar('x'.repeat(500001),now),/500 KB/)
})
test('Remote sources are restricted to direct Google iCalendar URLs',()=>{
 assert.equal(googleCalendarSource('https://calendar.google.com/calendar/ical/team%40example.com/public/basic.ics'),'https://calendar.google.com/calendar/ical/team%40example.com/public/basic.ics')
 for(const url of ['http://calendar.google.com/calendar/ical/a/public/basic.ics','https://calendar.google.com.attacker.example/calendar/ical/a/public/basic.ics','https://127.0.0.1/calendar/ical/a/public/basic.ics','https://calendar.google.com:8443/calendar/ical/a/public/basic.ics','https://calendar.google.com/calendar/ical/a/public/basic.ics?redirect=private','https://calendar.google.com/calendar/ical/a/public/basic.ics#secret','https://user:password@calendar.google.com/calendar/ical/a/public/basic.ics'])assert.throws(()=>googleCalendarSource(url))
})
