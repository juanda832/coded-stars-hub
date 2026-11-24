import test from 'node:test'
import assert from 'node:assert/strict'
import {coordinationOverview} from '../lib/coordination-overview.ts'
const now=Date.parse('2026-11-23T12:00:00Z'),day=86400000
const meeting=(id,offset,extra={})=>({id,startsAt:new Date(now+offset*day).toISOString(),duration:60,status:'scheduled',hostId:'host',joinUrl:'https://example.com/meeting',...extra})
const base={meetings:[],confirmedCounts:{},registrations:[],reports:[]}
test('Seven-day queue excludes past, cancelled and beyond horizon',()=>{
 const result=coordinationOverview({...base,meetings:[meeting('late',8),meeting('past',-1),meeting('cancelled',1,{status:'cancelled'}),meeting('b',7),meeting('a',0)]},now)
 assert.equal(result.scheduled,2)
 assert.deepEqual(result.attention.map(a=>a.meeting.id),['a','b'])
 assert.equal(result.attention[0].within24h,true)
})
test('Counts meetings once even with multiple missing requirements',()=>{
 const result=coordinationOverview({...base,meetings:[meeting('m',1,{hostId:'',joinUrl:''})],registrations:[{meetingId:'m',status:'pending'}]},now)
 assert.equal(result.attention.length,1)
 assert.deepEqual(result.attention[0].missing,['Falta anfitrión','Solicitudes por revisar','Falta enlace'])
})
test('Ready meetings have no pending requirements',()=>{
 const result=coordinationOverview({...base,meetings:[meeting('m',2)],confirmedCounts:{m:1}},now)
 assert.equal(result.confirmed,1)
 assert.equal(result.attention.length,0)
})
test('Report coverage uses eligible unique meetings and excludes cancelled and future',()=>{
 const result=coordinationOverview({...base,meetings:[meeting('a',-1),meeting('b',-2),meeting('c',-1,{status:'cancelled'}),meeting('d',2)],confirmedCounts:{a:1,c:1,d:1},reports:[{meetingId:'a',role:'star'},{meetingId:'a',role:'star'},{meetingId:'b',role:'star'},{meetingId:'c',role:'star'},{meetingId:'d',role:'host'},{meetingId:'a',role:'host'}]},now)
 assert.deepEqual(result.coverage,{stars:1,expectedStars:1,hosts:1,expectedHosts:2})
})
test('Empty agenda has zero coverage without division by zero',()=>assert.deepEqual(coordinationOverview(base,now).coverage,{stars:0,expectedStars:0,hosts:0,expectedHosts:0}))
