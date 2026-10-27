import 'server-only'
import { users as examples } from './demo-users'
import { requirePersonalAccess } from './auth-mode'
import { execute, query, queryOne, withDatabase } from './database'
import type { ManagedAccount, User } from './types'
import { WorkflowError } from './workflow-error'

// Real addresses are configured privately in the hosting environment.
const addresses:Record<string,string|undefined>={
 'admin-isa':process.env.CODED_ADMIN_ISA_EMAIL,
 'admin-ela':process.env.CODED_ADMIN_ELA_EMAIL,
}
export const users:User[]=requirePersonalAccess()?examples.map(user=>({
 ...user,name:user.name.replace(/ · Demo$/,''),email:addresses[user.id]?.trim()||user.email,
})).concat(process.env.CODED_OWNER_EMAIL?.trim()?[{id:'admin-owner',name:'Juan',email:process.env.CODED_OWNER_EMAIL.trim(),role:'admin',initials:'JM'}]:[]):examples

export type PrivateAccount = ManagedAccount & { requestId:string; createdBy:string; providerId?:string }
export async function managedAccounts():Promise<PrivateAccount[]> {
 return (await query('SELECT json FROM records WHERE collection=? ORDER BY rowid','accounts')).map(row=>JSON.parse(String(row.json)))
}
export function accountView(account:PrivateAccount):ManagedAccount {
 const {id,name,email,role,initials,access,provisioning,createdAt,lastSeenAt,version}=account
 return {id,name,email,role,initials,access,provisioning,createdAt,lastSeenAt,version}
}
export async function saveAccount(account:PrivateAccount) {
 await execute('INSERT INTO records(collection,id,json) VALUES(?,?,?) ON CONFLICT(collection,id) DO UPDATE SET json=excluded.json','accounts',account.id,JSON.stringify(account))
}
export async function directoryUsers(includeInactive=false):Promise<User[]> {
 return withDatabase(async()=>[...users,...(await managedAccounts()).filter(account=>account.provisioning==='ready'&&(includeInactive||account.access==='active')).map(({id,name,email,role,initials})=>({id,name,email,role,initials}))])
}
export async function assertAccountAccess(user:User) {
 if(user.reviewer&&(process.env.CODED_ALLOW_REAL_ACCOUNTS==='true'||!users.some(admin=>admin.id===user.reviewer!.id&&admin.role==='admin')))throw new WorkflowError('Este recorrido ya no está disponible.',401)
 const record=await queryOne('SELECT json FROM records WHERE collection=? AND id=?','accounts',user.id)
 if(!record){if(!users.some(known=>known.id===user.id&&known.role===user.role))throw new WorkflowError('Tu cuenta ya no tiene acceso. Consulta con coordinación.',401);return}
 const account=JSON.parse(String(record.json)) as PrivateAccount
 if(account.access!=='active'||account.provisioning!=='ready'||account.role!==user.role)throw new WorkflowError('Tu acceso está pausado. Consulta con coordinación.',401)
}
export async function recordAccountVisit(userId:string) {
 return withDatabase(async()=>{
  const row=await queryOne('SELECT json FROM records WHERE collection=? AND id=?','accounts',userId)
  if(!row)return
  const account=JSON.parse(String(row.json)) as PrivateAccount
  if(account.access==='active'&&account.provisioning==='ready'&&(!account.lastSeenAt||Date.now()-Date.parse(account.lastSeenAt)>3600000))await saveAccount({...account,lastSeenAt:new Date().toISOString()})
 })
}
