import 'server-only'
import { randomUUID } from 'node:crypto'
import { withDatabase, execute } from './database'
import { requirePersonalAccess } from './auth-mode'
import { normalizeAccountDraft, accountInitials, requireAccountAdmin } from './account-policy'
import { managedAccounts, saveAccount, directoryUsers, assertAccountAccess, accountView, type PrivateAccount } from './user-directory'
import { prepareAccountIdentity } from './account-provider'
import { WorkflowError } from './workflow-error'
import type { User } from './types'

export function accountPolicy() { return { personal:requirePersonalAccess(),allowReal:process.env.CODED_ALLOW_REAL_ACCOUNTS==='true' } }
async function audit(actor:User,accountId:string,action:string) {
 const id=randomUUID()
 await execute('INSERT INTO records(collection,id,json) VALUES(?,?,?)','account_events',id,JSON.stringify({id,actorId:actor.id,accountId,action,at:new Date().toISOString()}))
}
export async function createManagedAccount(actor:User,body:Record<string,unknown>,prepare=prepareAccountIdentity) {
 requireAccountAdmin(actor)
 const draft=normalizeAccountDraft(body,accountPolicy().allowReal)
 const reserved=await withDatabase(async()=>{
  await assertAccountAccess(actor)
  const all=await managedAccounts(),previous=all.find(account=>account.requestId===draft.requestId)
  if(previous){
   if(previous.name!==draft.name||previous.email!==draft.email||previous.role!==draft.role)throw new WorkflowError('Esta alta ya tiene otros datos. Cierra el formulario y revisa la cuenta existente.',409)
   return previous
  }
  if((await directoryUsers(true)).some(user=>user.email.toLowerCase()===draft.email)||all.some(account=>account.email===draft.email))throw new WorkflowError('Ese correo ya está registrado. Búscalo en Cuentas.',409)
  const account:PrivateAccount={id:'member-'+randomUUID(),...draft,initials:accountInitials(draft.name),access:'active',provisioning:'pending',createdAt:new Date().toISOString(),createdBy:actor.id,version:1}
  await saveAccount(account);await audit(actor,account.id,'reserved')
  return account
 })
 return completeManagedAccount(actor,reserved.id,prepare)
}
export async function completeManagedAccount(actor:User,id:string,prepare=prepareAccountIdentity) {
 requireAccountAdmin(actor)
 const reserved=await withDatabase(async()=>{await assertAccountAccess(actor);return (await managedAccounts()).find(account=>account.id===id)})
 if(!reserved)throw new WorkflowError('Cuenta no encontrada.',404)
 if(reserved.provisioning==='ready')return accountView(reserved)
 // Provider I/O stays outside the database lock. The durable reservation makes
 // retries safe even if either service fails after creating the identity.
 const providerId=await prepare(reserved)
 return withDatabase(async()=>{
  await assertAccountAccess(actor)
  const latest=(await managedAccounts()).find(account=>account.id===id)!
  if(latest.provisioning==='ready')return accountView(latest)
  const ready:PrivateAccount={...latest,providerId,provisioning:'ready',version:latest.version+1}
  await saveAccount(ready);await audit(actor,id,'prepared')
  return accountView(ready)
 })
}
export async function changeAccountAccess(actor:User,body:Record<string,unknown>) {
 requireAccountAdmin(actor)
 if(body.access!=='active'&&body.access!=='paused')throw new WorkflowError('Elige un estado válido.')
 return withDatabase(async()=>{
  await assertAccountAccess(actor)
  const account=(await managedAccounts()).find(item=>item.id===body.accountId)
  if(!account)throw new WorkflowError('Esta cuenta no se puede modificar desde aquí.',404)
  if(account.id===actor.id||account.role==='admin')throw new WorkflowError('Los accesos de administración se gestionan por separado.',403)
  if(account.version!==body.version)throw new WorkflowError('Otra persona actualizó esta cuenta. Actualiza la lista antes de continuar.',409)
  if(account.access===body.access)return accountView(account)
  const next:PrivateAccount={...account,access:body.access as 'active'|'paused',version:account.version+1}
  await saveAccount(next);await audit(actor,account.id,next.access==='paused'?'paused':'resumed')
  return accountView(next)
 })
}
