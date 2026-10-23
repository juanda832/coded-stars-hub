import test from 'node:test'
import assert from 'node:assert/strict'
import { participationState } from '../lib/participation-state.ts'
import { readRoute, routeHash } from '../lib/navigation.ts'
const now=Date.parse('2026-10-19T12:00:00Z')
const meeting={id:'example',title:'JDP de ejemplo',startsAt:'2026-10-21T15:00:00Z',status:'scheduled',duration:60}
const registration=status=>({id:'application',meetingId:'example',userId:'star-1',status})
test('A future meeting can receive an unregistered request',()=>assert.equal(participationState(meeting,undefined,false,now).canRequest,true))
test('A pending application cannot be sent twice',()=>assert.equal(participationState(meeting,registration('pending'),false,now).canRequest,false))
test('A confirmed participant cannot reserve again',()=>assert.equal(participationState(meeting,registration('confirmed'),true,now).canRequest,false))
test('An elapsed pending application is not shown as still awaiting selection',()=>{const state=participationState({...meeting,startsAt:'2026-10-18T15:00:00Z'},registration('pending'),false,now);assert.equal(state.key,'ended');assert.match(state.message,/No se registra como una asistencia/);assert.equal(state.canRequest,false)})
test('A cancelled meeting takes precedence over an assignment',()=>{const state=participationState({...meeting,status:'cancelled'},registration('confirmed'),true,now);assert.equal(state.key,'cancelled');assert.equal(state.canRequest,false)})
test('A live meeting does not accept new requests',()=>assert.equal(participationState({...meeting,status:'live'},undefined,false,now).canRequest,false))
test('A started scheduled meeting does not accept new requests',()=>assert.equal(participationState({...meeting,startsAt:'2026-10-19T11:30:00Z'},undefined,false,now).canRequest,false))
test('A closed meeting cannot reopen through the presentation state',()=>assert.equal(participationState({...meeting,status:'completed'},undefined,false,now).canRequest,false))
test('A withdrawn applicant can request again when the meeting is open',()=>assert.equal(participationState(meeting,registration('withdrawn'),false,now).canRequest,true))
test('A confirmed place prevents other requests',()=>assert.equal(participationState(meeting,undefined,true,now).canRequest,false))
test('Not selected does not become confirmed or automatically pending',()=>{const state=participationState(meeting,registration('not_selected'),true,now);assert.equal(state.key,'not_selected');assert.equal(state.confirmed,false);assert.equal(state.canRequest,false)})
test('A past confirmed assignment never claims attendance',()=>{const state=participationState({...meeting,startsAt:'2026-10-18T15:00:00Z'},registration('confirmed'),true,now);assert.equal(state.key,'ended');assert.match(state.message,/registran por separado/)})
for(const role of ['star','host'])test(`${role} cannot open admin navigation`,()=>assert.equal(readRoute('#/estadisticas',role).section,'Inicio'))
test('Admin cannot open a private student section through navigation',()=>assert.equal(readRoute('#/mis-solicitudes','admin').section,'Inicio'))
test('A host can restore the results screen',()=>assert.equal(readRoute('#/resultados','host').section,'Resultados'))
test('A student can restore preparation',()=>assert.equal(readRoute('#/preparacion','star').section,'Preparación'))
for(const view of ['Novedades','Preguntas','Indicaciones'])test(`Message subview ${view} survives a route round trip`,()=>assert.deepEqual(readRoute(routeHash('Mensajes',view),'star'),{section:'Mensajes',view}))
for(const view of ['En revisión','Confirmadas','Historial'])test(`Application subview ${view} survives a route round trip`,()=>assert.deepEqual(readRoute(routeHash('Mis solicitudes',view),'star'),{section:'Mis solicitudes',view}))
test('Unknown routes use a defined start page',()=>assert.equal(readRoute('#/unknown','star').section,'Inicio'))
test('Unknown message views are ignored',()=>assert.equal(readRoute('#/mensajes?vista=unknown','host').view,''))
test('Prototype-like names cannot select routes',()=>assert.equal(routeHash('__proto__'),'#/inicio'))
