import test from 'node:test'
import assert from 'node:assert/strict'
import { spanishMeeting, spanishCandidate, spanishCopy } from '../lib/spanish-copy.ts'

test('Spanish display preserves meeting identifiers, permission fields and language values',()=>{
 const meeting={id:'m3',title:'JDP · Discover London',program:'London',language:'English',host:'Sofía Méndez',hostId:'host-1',capacity:1,status:'scheduled',startsAt:'2026-10-25T18:00:00Z',duration:45,description:'El host presenta London.',color:'blue',joinUrl:undefined}
 const result=spanishMeeting(meeting)
 assert.equal(result.title,'JDP · Descubre Londres')
 for(const key of ['id','program','language','host','hostId','capacity','status','startsAt','joinUrl'])assert.equal(result[key],meeting[key])
 assert.equal(result.joinUrl,undefined)
})
test('Translating display fields does not mutate stored records or share agenda arrays',()=>{
 const meeting={id:'m2',title:'JDP · La experiencia Tokyo',description:'Indicaciones del host',agenda:['El host presenta Tokyo'],hostNote:'El host confirma el turno'}
 const before=JSON.stringify(meeting),result=spanishMeeting(meeting)
 assert.equal(JSON.stringify(meeting),before)
 assert.notEqual(result.agenda,meeting.agenda)
 assert.ok(result.agenda.every(item=>!item.includes('host')))
})
test('Candidate translation preserves programme and language filters and historical IDs',()=>{
 const profile={userId:'star-3',name:'Nicolás Prado',initials:'NP',languages:['Español','English'],programs:['Tokyo'],availability:'Lunes',experience:'Dos testimonios sobre Tokyo.',internalNotes:'Acordar el turno con el host.',history:[{meetingId:'m2',title:'JDP · Vida académica en Tokyo',date:'2026-10-10',outcome:'Según el host'}]}
 const before=JSON.stringify(profile),result=spanishCandidate(profile)
 assert.equal(JSON.stringify(profile),before)
 assert.deepEqual(result.programs,['Tokyo'])
 assert.deepEqual(result.languages,['Español','English'])
 assert.equal(result.history[0].meetingId,'m2')
 assert.notEqual(result.history[0],profile.history[0])
})
test('Display normalization is idempotent and retains official place names',()=>{
 const text='Tokyo DisneySea · El host presenta Tokyo y Discover London'
 const translated=spanishCopy(text)
 assert.ok(translated.startsWith('Tokyo DisneySea'))
 assert.equal(spanishCopy(translated),translated)
})
test('Authored meeting titles and quoted personal memories are preserved',()=>{
 const meeting={id:'custom-123',title:'Conversación sobre Tokyo',description:'Texto escrito por el equipo'}
 assert.equal(spanishMeeting(meeting),meeting)
 const quote='«En Tokyo construí un robot con mi host»'
 assert.ok(spanishCopy('Mi recuerdo: '+quote).includes(quote))
})
