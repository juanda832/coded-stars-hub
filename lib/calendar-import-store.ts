import 'server-only'
import {createHmac,timingSafeEqual} from 'node:crypto'
import {queryOne,execute} from './database'
import {changeMeeting,snapshot,withStore} from './store'
import {assertAccountAccess} from './user-directory'
import {parseHostCalendar,type ImportCandidate} from './calendar-import'
import {localDateTime,ORLANDO_ZONE} from './time-zones'
import {WorkflowError} from './workflow-error'
import type {User} from './types'

function admin(user:User){if(user.role!=='admin')throw new WorkflowError('Solo administración puede importar reuniones.',403)}
function key(){const secret=process.env.CODED_CALENDAR_SECRET||(process.env.VERCEL!=='1'?process.env.SESSION_SECRET:'');if(!secret||secret.length<32)throw new WorkflowError('La importación todavía no está configurada.',503);return secret}
function audience(user:User){return user.reviewer?'review:'+user.reviewer.id+':'+user.id:'account:'+user.id}
function sign(value:string){return createHmac('sha256',key()).update('coded-calendar-import-v1:'+value).digest('hex')}
function seal(user:User,candidate:ImportCandidate){const value=Buffer.from(JSON.stringify({owner:audience(user),expires:Date.now()+15*60000,candidate})).toString('base64url');return value+'.'+sign(value)}
function open(user:User,token:unknown):ImportCandidate{
 if(typeof token!=='string'||token.length>10000)throw new WorkflowError('Vuelve a cargar el calendario antes de importar.')
 const [value,signature,...extra]=token.split('.')
 if(extra.length||!/^[a-f0-9]{64}$/.test(signature||'')||!timingSafeEqual(Buffer.from(sign(value),'hex'),Buffer.from(signature,'hex')))throw new WorkflowError('La vista previa cambió. Vuelve a cargar el calendario.',409)
 let data;try{data=JSON.parse(Buffer.from(value,'base64url').toString())}catch{throw new WorkflowError('Vista previa inválida.')}
 if(data.owner!==audience(user)||!Number.isFinite(data.expires)||data.expires<Date.now()||!/^[a-f0-9]{64}$/.test(data.candidate?.key||''))throw new WorkflowError('La vista previa venció o pertenece a otra cuenta. Carga de nuevo el calendario.',409)
 return data.candidate
}
export async function previewHostCalendar(user:User,text:string){
 admin(user);key();const parsed=parseHostCalendar(text)
 return withStore(async()=>{
  await assertAccountAccess(user);const state=await snapshot()
  const candidates=[]
  for(const candidate of parsed.candidates){
   const record=await queryOne('SELECT json FROM records WHERE collection=? AND id=?','calendar_imports',candidate.key)
   const previous=record?JSON.parse(String(record.json)):undefined
   const meetingId=previous?.meetingId||(candidate.nativeId&&state.meetings.some(meeting=>meeting.id===candidate.nativeId)?candidate.nativeId:undefined)
   candidates.push({...candidate,token:seal(user,candidate),existingMeetingId:meetingId})
  }
  return {candidates,skipped:parsed.skipped}
 })
}
export async function commitHostCalendar(user:User,items:unknown,hostId:unknown){
 admin(user)
 if(!Array.isArray(items)||!items.length||items.length>20)throw new WorkflowError('Elige entre 1 y 20 reuniones para importar.')
 if(typeof hostId!=='string')throw new WorkflowError('Revisa el anfitrión; puedes dejarlo sin asignar.')
 const prepared=items.map(item=>{if(!item||typeof item!=='object')throw new WorkflowError('Revisa las reuniones elegidas.');return {candidate:open(user,item.token),edits:item}})
 return withStore(async()=>{
  await assertAccountAccess(user);let created=0,duplicates=0
  for(const {candidate,edits} of prepared){
   const existing=await queryOne('SELECT id FROM records WHERE collection=? AND id=?','calendar_imports',candidate.key)
   if(existing||(candidate.nativeId&&(await snapshot()).meetings.some(meeting=>meeting.id===candidate.nativeId))){duplicates++;continue}
   const wall=localDateTime(candidate.startsAt,ORLANDO_ZONE)
   // Retain an explicit UTC source instant, including a repeated DST hour, unless coordination edits it.
   const unchanged=edits.date===wall.slice(0,10)&&edits.time===wall.slice(11)
   const meeting=await changeMeeting(user,{action:'create',schoolName:edits.schoolName,program:edits.program,joinUrl:edits.joinUrl,hostId,duration:candidate.duration,...(unchanged?{startsAt:candidate.startsAt}:{date:edits.date,time:edits.time})})
   await execute('INSERT INTO records(collection,id,json) VALUES(?,?,?)','calendar_imports',candidate.key,JSON.stringify({meetingId:meeting.id,importedBy:user.id,importedAt:new Date().toISOString()}));created++
  }
  return {created,duplicates}
 })
}
