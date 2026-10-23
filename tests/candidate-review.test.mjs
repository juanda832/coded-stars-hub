import test from 'node:test'
import assert from 'node:assert/strict'
import { candidateReview, reviewMeetingState } from '../lib/candidate-review.ts'

const now=Date.parse('2026-10-21T12:00:00Z')
const meeting={id:'m1',startsAt:'2026-10-23T18:00:00Z',duration:45,status:'scheduled'}
const profiles=[
 {userId:'a',name:'Nicolás Prado',languages:['Español','English'],programs:['London']},
 {userId:'b',name:'Camila Luna',languages:['Español'],programs:['Tokyo']},
 {userId:'c',name:'Álex Rivera',languages:['Português'],programs:['London']},
]
const applications=[{id:'ra',meetingId:'m1',userId:'a',status:'pending'},{id:'rb',meetingId:'m1',userId:'b',status:'withdrawn'},{id:'rc',meetingId:'m1',userId:'c',status:'not_selected'}]
const filters={query:'',language:'',program:'',status:''}
const review=extra=>candidateReview(applications,profiles,{...filters,...extra})

test('Name search ignores accents, case, repeated spaces and word order',()=>assert.deepEqual(review({query:' PRADO nicolas '}).rows.map(row=>row.profile.userId),['a']))
test('The default order is alphabetical, independent of application status',()=>assert.deepEqual(review({}).rows.map(row=>row.profile.userId),['c','b','a']))
test('Language and programme filters intersect',()=>assert.deepEqual(review({language:'English',program:'London'}).rows.map(row=>row.profile.userId),['a']))
test('A programme mismatch does not recommend another candidate',()=>assert.equal(review({language:'English',program:'Tokyo'}).rows.length,0))
test('Status counts reflect name, language and programme filters',()=>assert.deepEqual(review({query:'nicolas'}).counts,{all:1,pending:1,confirmed:0,not_selected:0,withdrawn:0}))
test('Changing the status view preserves the other status counts',()=>{const result=review({program:'London',status:'pending'});assert.equal(result.rows.length,1);assert.equal(result.counts.not_selected,1);assert.equal(result.counts.all,2)})
test('Missing profiles are excluded from both visible rows and counters',()=>{const result=candidateReview([...applications,{userId:'missing',status:'pending'}],profiles,filters);assert.equal(result.counts.all,3)})
test('Filtering does not mutate the source applications or profiles',()=>{const before=JSON.stringify([applications,profiles]);review({status:'pending'});assert.equal(JSON.stringify([applications,profiles]),before)})
test('Multiple pending applicants require a manual decision',()=>{const result=reviewMeetingState(meeting,[...applications,{meetingId:'m1',userId:'d',status:'pending'}],now);assert.equal(result.phase,'review');assert.equal(result.pending,2);assert.equal(result.confirmed,undefined)})
test('An active meeting with no pending applicants is waiting',()=>assert.equal(reviewMeetingState(meeting,[],now).phase,'waiting'))
test('A confirmed participant blocks a second selection',()=>{const result=reviewMeetingState(meeting,[...applications,{meetingId:'m1',userId:'d',status:'confirmed'}],now);assert.equal(result.phase,'assigned');assert.equal(result.canSelect,false)})
test('Applications for a different meeting do not affect selection',()=>assert.equal(reviewMeetingState(meeting,[{meetingId:'other',status:'confirmed'}],now).phase,'waiting'))
for(const status of ['cancelled','completed'])test(`A ${status} meeting blocks selection even when its start is in the future`,()=>{const result=reviewMeetingState({...meeting,status},applications,now);assert.equal(result.phase,'closed');assert.equal(result.canSelect,false)})
test('Selection closes exactly at the scheduled end',()=>{const result=reviewMeetingState({...meeting,startsAt:'2026-10-21T11:15:00Z'},applications,now);assert.equal(result.phase,'closed');assert.equal(result.canSelect,false)})
test('A live meeting before its end uses the same eligibility as the server',()=>assert.equal(reviewMeetingState({...meeting,status:'live',startsAt:'2026-10-21T11:45:00Z'},applications,now).canSelect,true))
