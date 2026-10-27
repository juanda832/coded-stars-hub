import 'server-only'
import { requirePersonalAccess } from './auth-mode'
import type { PrivateAccount } from './user-directory'
import { WorkflowError } from './workflow-error'

// Creation reserves an identity; it never sends an invitation or verifies ownership.
// A retry only adopts the exact namespace + private grant + email we reserved.
export async function prepareAccountIdentity(account:PrivateAccount):Promise<string|undefined> {
 if(!requirePersonalAccess())return undefined
 const {clerkClient}=await import('@clerk/nextjs/server')
 const client=await clerkClient(),externalId=`coded-stars-hub:${account.id}`
 const existing=async()=> (await client.users.getUserList({externalId:[externalId],limit:2})).data
 const matches=(identity:Awaited<ReturnType<typeof existing>>[number])=>{
  const grant=identity.privateMetadata.codedHub as Record<string,unknown>|undefined
  return identity.externalId===externalId&&grant?.userId===account.id&&grant?.role===account.role&&identity.emailAddresses.some(address=>address.emailAddress.toLowerCase()===account.email)
 }
 const adopt=(identities:Awaited<ReturnType<typeof existing>>)=>{
  if(identities.length!==1||!matches(identities[0]))throw new WorkflowError('El acceso necesita una revisión de coordinación. No se modificó ninguna identidad existente.',409)
  return identities[0].id
 }
 const found=await existing()
 if(found.length)return adopt(found)
 try{
  const identity=await client.users.createUser({externalId,emailAddress:[account.email],emailAddressIdentificationStatus:['reserved'],firstName:account.name,skipPasswordRequirement:true,privateMetadata:{codedHub:{userId:account.id,role:account.role}}})
  return adopt([identity])
 }catch(error){
  // Handles a concurrent retry or a successful creation whose response was lost.
  const recovered=await existing()
  if(recovered.length)return adopt(recovered)
  const codes=(error as {errors?:{code:string}[]}).errors?.map(item=>item.code)||[]
  if(codes.some(code=>['form_identifier_exists','form_external_id_exists'].includes(code)))throw new WorkflowError('Ese correo ya tiene otro acceso. Coordinación debe revisarlo; no se reasignó la cuenta.',409)
  throw new WorkflowError('El alta quedó guardada, pero falta preparar el acceso. Usa «Completar alta» para reintentarlo.',503)
 }
}
