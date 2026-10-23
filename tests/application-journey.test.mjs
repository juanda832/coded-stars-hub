import test from 'node:test'
import assert from 'node:assert/strict'
import { applicationGroups, preparationKey, restorePreparation } from '../lib/application-journey.ts'

const now=Date.parse('2026-10-21T12:00:00Z')
const meeting=(id,changes={})=>({id,startsAt:'2026-10-23T18:00:00Z',duration:45,status:'scheduled',...changes})
const registration=(meetingId,status='pending',userId='star-1')=>({id:'r-'+meetingId,meetingId,status,userId})
const data=(meetings,registrations)=>({user:{id:'star-1'},meetings,registrations})

test('Applications from another account never enter the groups',()=>{
 const groups=applicationGroups(data([meeting('a'),meeting('b')],[registration('a'),registration('b','confirmed','star-2')]),now)
 assert.deepEqual(groups.all.map(item=>item.meeting.id),['a'])
})
test('In-progress counts include only active pending and confirmed requests',()=>{
 const groups=applicationGroups(data(['a','b','c','d'].map(id=>meeting(id)),[registration('a'),registration('b','confirmed'),registration('c','withdrawn'),registration('d','not_selected')]),now)
 assert.equal(groups.active.length,2);assert.equal(groups.pending.length,1);assert.equal(groups.confirmed.length,1);assert.equal(groups.history.length,2)
})
test('An elapsed pending request goes into history at the exact end instant',()=>{
 const groups=applicationGroups(data([meeting('a',{startsAt:'2026-10-21T11:15:00Z'})],[registration('a')]),now)
 assert.equal(groups.pending.length,0);assert.equal(groups.history.length,1)
})
test('A live meeting that has not ended remains active',()=>{
 assert.equal(applicationGroups(data([meeting('a',{startsAt:'2026-10-21T11:45:00Z',status:'live'})],[registration('a','confirmed')]),now).confirmed.length,1)
})
for(const status of ['cancelled','completed'])test(`A future ${status} meeting belongs to history`,()=>{
 const groups=applicationGroups(data([meeting('a',{status})],[registration('a','confirmed')]),now)
 assert.equal(groups.active.length,0);assert.equal(groups.history.length,1)
})
test('Active applications are ordered by start time',()=>{
 const groups=applicationGroups(data([meeting('later'),meeting('earlier',{startsAt:'2026-10-22T18:00:00Z'})],[registration('later'),registration('earlier')]),now)
 assert.deepEqual(groups.active.map(item=>item.meeting.id),['earlier','later'])
})
test('History is ordered with the most recent meeting first',()=>{
 const groups=applicationGroups(data([meeting('old',{startsAt:'2026-10-18T18:00:00Z'}),meeting('recent',{startsAt:'2026-10-20T18:00:00Z'})],[registration('old'),registration('recent')]),now)
 assert.deepEqual(groups.history.map(item=>item.meeting.id),['recent','old'])
})
test('Missing meetings and unsent opportunities do not create applications',()=>{
 assert.equal(applicationGroups(data([meeting('a')],[registration('missing')]),now).all.length,0)
})
test('The general checklist keeps its existing storage key',()=>assert.equal(preparationKey('star-1'),'coded-prep-star-1'))
test('Each meeting gets a separate checklist',()=>assert.notEqual(preparationKey('star-1','m1'),preparationKey('star-1','m2')))
test('Each account gets a separate meeting checklist',()=>assert.notEqual(preparationKey('star-1','m1'),preparationKey('star-2','m1')))
test('Key delimiters cannot collide with identifier text',()=>assert.notEqual(preparationKey('a:b','c'),preparationKey('a','b:c')))
test('Restoring a checklist removes duplicate, invalid and out-of-range steps',()=>assert.deepEqual(restorePreparation('[3,0,0,-1,4,1.5,"1",null,true]',4),[0,3]))
test('Malformed or missing saved content starts an empty checklist',()=>{
 for(const raw of [null,'{broken','{}','null','true'])assert.deepEqual(restorePreparation(raw,4),[])
})
