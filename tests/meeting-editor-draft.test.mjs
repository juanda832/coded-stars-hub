import test from 'node:test'
import assert from 'node:assert/strict'
import { meetingEditorDraftKey, restoreMeetingEditorDraft } from '../lib/meeting-editor-draft.ts'
const hosts=['host-1','host-2'],zones=['America/La_Paz','America/New_York','UTC']
const form={schoolName:'Colegio de ejemplo',title:'',description:'',program:'',language:'',duration:null,timeZone:'America/New_York',date:'2027-01-15T18:30',hostId:'',hostNote:'',joinUrl:'https://'}
const read=changes=>restoreMeetingEditorDraft(JSON.stringify({version:2,...form,...changes}),hosts,zones)
test('A quick registration draft keeps missing data absent',()=>assert.deepEqual(read({}),form))
test('Accounts have separate draft keys',()=>assert.notEqual(meetingEditorDraftKey('admin-isa'),meetingEditorDraftKey('admin-ela')))
test('Date-only and time-only drafts survive closing the form',()=>{for(const date of ['', '2027-01-15T','T18:30'])assert.equal(read({date}).date,date)})
test('A previous draft is not reinterpreted as a school name',()=>{const result=read({version:1,title:'Título anterior'});assert.equal(result.schoolName,'');assert.equal(result.title,'Título anterior')})
test('A previous wall time is converted to Orlando without moving the instant',()=>{assert.equal(read({version:1,timeZone:'UTC',date:'2027-01-15T18:30'}).date,'2027-01-15T13:30')})
test('Unknown hosts and time zones cannot be restored',()=>{assert.equal(read({hostId:'admin-isa'}),null);assert.equal(read({timeZone:'Invalid/Zone'}),null)})
test('Stored privilege fields do not enter the form',()=>assert.deepEqual(Object.keys(read({role:'admin',capacity:99,userId:'other'})).sort(),Object.keys(form).sort()))
test('A programme name can be copied literally while language and duration stay validated',()=>{assert.equal(read({program:'Madison'}).program,'Madison');for(const changes of [{language:'Invalid'},{duration:0},{duration:181},{duration:45.5},{duration:'45'}])assert.equal(read(changes),null)})
test('Impossible dates, times and oversized fields are rejected',()=>{for(const changes of [{date:'2027-02-30T12:00'},{date:'T25:00'},{date:'2027-01-15'},{schoolName:'x'.repeat(161)},{hostNote:'x'.repeat(401)},{description:42}])assert.equal(read(changes),null)})
test('Malformed storage does not crash or import another schema',()=>{for(const raw of [null,'{bad','[]','"text"','{"version":3}'])assert.equal(restoreMeetingEditorDraft(raw,hosts,zones),null)})
