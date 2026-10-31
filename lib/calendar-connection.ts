import 'server-only'
import {createHmac,randomUUID,timingSafeEqual} from 'node:crypto'
import {execute,query,queryOne,withDatabase} from './database'
import {directoryUsers,assertAccountAccess} from './user-directory'
import {resolvePersonalUser} from './auth-policy'
import {requirePersonalAccess} from './auth-mode'
import {hasAssignedRole} from './account-roles'
import {snapshot,withStore} from './store'
import {WorkflowError} from './workflow-error'
import {calendarFeed,calendarMeetings} from './calendar-feed'
import type {User} from './types'

type Connection={id:string;userId:string;role:User['role'];createdAt:string;version:number}
function secret(){const key=process.env.CODED_CALENDAR_SECRET;if(!key||key.length<32)throw new WorkflowError('La conexión de calendario todavía no está configurada.',503);return key}
export function calendarOrigin(){
 const url=new URL(process.env.CODED_PUBLIC_SITE_URL||'https://coded-stars-beta.vercel.app')
 if(url.username||url.password||url.protocol!=='https:'&&(process.env.VERCEL==='1'||url.protocol!=='http:'||!['localhost','127.0.0.1'].includes(url.hostname)))throw new Error('Invalid public calendar origin')
 return url.origin
}
function signature(connection:Pick<Connection,'id'>){return createHmac('sha256',secret()).update('coded-calendar-v1:'+connection.id).digest('hex')}
function matches(connection:Pick<Connection,'id'>,value:string){if(!/^[a-f0-9]{64}$/.test(value))return false;return timingSafeEqual(Buffer.from(signature(connection),'hex'),Buffer.from(value,'hex'))}
function urlFor(connection:Connection){return calendarOrigin()+`/api/calendar/feed/${connection.id}/${signature(connection)}`}
function eligible(user:User){
 if(user.reviewer)throw new WorkflowError('Vuelve a tu cuenta para conectar un calendario. El recorrido de prueba permanece separado.',403)
 if(process.env.VERCEL==='1'&&process.env.VERCEL_ENV!=='production')throw new WorkflowError('Conecta tu agenda desde la beta principal: coded-stars-beta.vercel.app.',403)
}
async function owned(user:User):Promise<Connection|undefined>{return (await query('SELECT json FROM records WHERE collection=?','calendar_connections')).map(row=>JSON.parse(String(row.json)) as Connection).find(item=>item.userId===user.id&&item.role===user.role)}
async function lookup(id:string):Promise<Connection|undefined>{const row=await queryOne('SELECT json FROM records WHERE collection=? AND id=?','calendar_connections',id);return row?JSON.parse(String(row.json)):undefined}
function view(connection?:Connection){return connection?{connected:true,id:connection.id,version:connection.version,createdAt:connection.createdAt,url:urlFor(connection)}:{connected:false}}
export async function calendarConnection(user:User){eligible(user);secret();return withDatabase(async()=>{await assertAccountAccess(user);return view(await owned(user))})}
export async function changeCalendarConnection(user:User,body:Record<string,unknown>){
 eligible(user);secret()
 if(!['create','rotate','revoke'].includes(String(body.action)))throw new WorkflowError('Acción de calendario no reconocida.')
 return withDatabase(async()=>{
  await assertAccountAccess(user);const previous=await owned(user)
  if(body.action==='create'&&previous)return view(previous)
  if(body.action!=='create'&&(!previous||body.id!==previous.id||body.version!==previous.version))throw new WorkflowError('La conexión cambió. Actualiza la información antes de continuar.',409)
  if(previous)await execute('DELETE FROM records WHERE collection=? AND id=?','calendar_connections',previous.id)
  if(body.action==='revoke')return view()
  const next:Connection={id:randomUUID(),userId:user.id,role:user.role,createdAt:new Date().toISOString(),version:(previous?.version||0)+1}
  await execute('INSERT INTO records(collection,id,json) VALUES(?,?,?)','calendar_connections',next.id,JSON.stringify(next))
  return view(next)
 })
}
async function feedUser(connection:Connection):Promise<User|null>{
 const directory=await directoryUsers(),user=directory.find(item=>item.id===connection.userId&&hasAssignedRole(item,connection.role))
 if(!user)return null
 if(!requirePersonalAccess())return {...user,role:connection.role}
 const {clerkClient}=await import('@clerk/nextjs/server'),client=await clerkClient()
 const identities=await client.users.getUserList({externalId:['coded-stars-hub:'+user.id],limit:2})
 const verified=identities.totalCount===1?resolvePersonalUser(identities.data[0],directory):null
 return verified&&hasAssignedRole(verified,connection.role)?{...verified,role:connection.role}:null
}
export async function readCalendarFeed(id:string,token:string){
 secret()
 if(!/^[a-f0-9-]{36}$/.test(id)||!/^[a-f0-9]{64}$/.test(token)||!matches({id},token))throw new WorkflowError('Calendario no disponible.',404)
 const initial=await withDatabase(()=>lookup(id))
 if(!initial||!matches(initial,token))throw new WorkflowError('Calendario no disponible.',404)
 const user=await feedUser(initial)
 if(!user)throw new WorkflowError('Calendario no disponible.',404)
 return withStore(async()=>{
  // Check revocation and pausing again after provider I/O, inside the data lock.
  const latest=await lookup(id)
  if(!latest||!matches(latest,token)||latest.userId!==user.id||latest.role!==user.role)throw new WorkflowError('Calendario no disponible.',404)
  try{await assertAccountAccess(user)}catch{throw new WorkflowError('Calendario no disponible.',404)}
  const store=await snapshot()
  return calendarFeed(calendarMeetings(user,store.meetings,store.registrations),calendarOrigin())
 })
}
