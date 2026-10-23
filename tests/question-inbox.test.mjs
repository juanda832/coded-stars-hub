import test from 'node:test'
import assert from 'node:assert/strict'
import { isQuestionNotice, messageDraftKey, questionInbox, restoreMessageDraft } from '../lib/question-inbox.ts'

const meetings=[{id:'london',title:'JDP · Discover London',program:'London',language:'English',host:'Sofía Méndez'},{id:'tokyo',title:'JDP · La experiencia Tokyo',program:'Tokyo',language:'Español',host:'Diego Santos'}]
const questions=[
 {id:'new',meetingId:'london',text:'¿Cómo preparo mi historia?',createdAt:'2026-10-21T14:00:00Z'},
 {id:'old',meetingId:'tokyo',text:'¿Cuándo tendré la palabra?',createdAt:'2026-10-20T14:00:00Z'},
 {id:'answered',meetingId:'london',text:'¿Cuál será el idioma?',createdAt:'2026-10-19T14:00:00Z',reply:'Será en inglés.',replyAuthor:'Sofía Méndez',repliedAt:'2026-10-21T16:00:00Z'},
]
test('Pending questions put the oldest first, followed by answers',()=>assert.deepEqual(questionInbox(questions,meetings).shown.map(q=>q.id),['old','new','answered']))
test('Answered conversations use the reply date for recency',()=>{
 const earlier={...questions[2],id:'earlier',createdAt:'2026-10-21T17:00:00Z',repliedAt:'2026-10-21T15:00:00Z'}
 assert.deepEqual(questionInbox([earlier,questions[2]],meetings,{filter:'Resueltas'}).shown.map(q=>q.id),['answered','earlier'])
})
test('Filtering status preserves counts for the other status tabs',()=>{
 const result=questionInbox(questions,meetings,{filter:'Pendientes'})
 assert.equal(result.shown.length,2);assert.deepEqual(result.counts,{Todas:3,Pendientes:2,Resueltas:1})
})
test('Meeting filter and counts use the same conversations',()=>{
 const result=questionInbox(questions,meetings,{meetingId:'london'})
 assert.deepEqual(result.counts,{Todas:2,Pendientes:1,Resueltas:1});assert.ok(result.shown.every(q=>q.meetingId==='london'))
})
test('Language and host names work without accents',()=>assert.equal(questionInbox(questions,meetings,{query:'ingles sofia'}).shown.length,2))
test('Europe and London aliases find the same program',()=>{
 for(const query of ['Europa','Londres','London'])assert.equal(questionInbox(questions,meetings,{query}).shown.length,2)
})
test('All search terms must match the same conversation',()=>assert.equal(questionInbox(questions,meetings,{query:'Tokyo ingles'}).shown.length,0))
test('Answer text is searchable',()=>assert.deepEqual(questionInbox(questions,meetings,{query:'será en inglés'}).shown.map(q=>q.id),['answered']))
test('Orphaned question text remains searchable without inventing meeting information',()=>assert.equal(questionInbox([{id:'x',meetingId:'missing',text:'Una pregunta sin reunión',createdAt:questions[0].createdAt}],[],{query:'pregunta'}).shown.length,1))
test('Draft keys separate accounts, meetings and reply forms',()=>{
 assert.notEqual(messageDraftKey('star-1','question','m1'),messageDraftKey('star-2','question','m1'))
 assert.notEqual(messageDraftKey('star-1','question','m1'),messageDraftKey('star-1','question','m2'))
 assert.notEqual(messageDraftKey('host-1','reply','q1'),messageDraftKey('host-1','reply','q2'))
 assert.notEqual(messageDraftKey('a:b','reply','c'),messageDraftKey('a','reply','b:c'))
})
test('A saved draft restores its actual text',()=>assert.equal(restoreMessageDraft(JSON.stringify({version:1,text:'Una pregunta real.'})),'Una pregunta real.'))
test('Restored drafts obey the form length limit',()=>assert.equal(restoreMessageDraft(JSON.stringify({version:1,text:'a'.repeat(510)})).length,500))
test('Unknown or malformed storage cannot become draft text',()=>{
 for(const raw of [null,'{bad','"text"','[]','{"version":2,"text":"old"}','{"version":1,"text":42}'])assert.equal(restoreMessageDraft(raw),'')
})
test('Question and reply notices open conversations',()=>{
 for(const title of ['Un Star tiene una pregunta','Nueva pregunta para el host','Ya respondieron tu pregunta'])assert.equal(isQuestionNotice({title}),true)
})
test('Other notices retain their meeting or publication destination',()=>assert.equal(isQuestionNotice({title:'¡Tu participación está confirmada!'}),false))
