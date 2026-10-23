import test from 'node:test'
import assert from 'node:assert/strict'
import {meetingSchedule} from '../lib/meeting-schedule.ts'

test('Local start and end retain the elapsed duration',()=>{
 const slot=meetingSchedule({startsAt:'2026-10-21T19:00:00Z',duration:45},'America/La_Paz')
 assert.equal(slot.startTime,'15:00');assert.equal(slot.endTime,'15:45');assert.equal(slot.endAt,'2026-10-21T19:45:00.000Z');assert.equal(slot.crossesDay,false)
})
test('A meeting ending after local midnight identifies the correct end date',()=>{
 const slot=meetingSchedule({startsAt:'2026-10-22T03:45:00Z',duration:45},'America/La_Paz')
 assert.equal(slot.startDay,'2026-10-21');assert.equal(slot.endDay,'2026-10-22');assert.equal(slot.endTime,'00:30');assert.equal(slot.crossesDay,true)
})
test('A different time zone can keep that same meeting on one calendar day',()=>{
 const slot=meetingSchedule({startsAt:'2026-10-22T03:45:00Z',duration:45},'Asia/Tokyo')
 assert.equal(slot.startTime,'12:45');assert.equal(slot.endTime,'13:30');assert.equal(slot.crossesDay,false)
})
test('Repeated clocks during a DST fallback show both UTC offsets',()=>{
 const slot=meetingSchedule({startsAt:'2026-11-01T05:45:00Z',duration:30},'America/New_York')
 assert.equal(slot.startTime,'01:45 (GMT-4)');assert.equal(slot.endTime,'01:15 (GMT-5)');assert.equal(slot.offsetChanged,true);assert.equal(slot.crossesDay,false)
})
test('A DST spring transition uses elapsed minutes rather than invented local minutes',()=>{
 const slot=meetingSchedule({startsAt:'2027-03-14T06:45:00Z',duration:30},'America/New_York')
 assert.equal(slot.startTime,'01:45 (GMT-5)');assert.equal(slot.endTime,'03:15 (GMT-4)');assert.equal(slot.offsetChanged,true)
})
