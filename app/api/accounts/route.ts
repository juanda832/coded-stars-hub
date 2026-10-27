import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@/lib/auth'
import { createManagedAccount, completeManagedAccount, changeAccountAccess } from '@/lib/accounts-store'
import { requireAccountAdmin, checkAccountOrigin } from '@/lib/account-policy'
import { WorkflowError } from '@/lib/workflow-error'

export const runtime='nodejs'
const headers={'Cache-Control':'no-store'}
export async function POST(req:NextRequest) {
 try{
  const user=await currentUser()
  if(!user)return NextResponse.json({error:'Inicia sesión.'},{status:401,headers})
  requireAccountAdmin(user)
  if(user.reviewer)throw new WorkflowError('Sal del recorrido para gestionar cuentas reales.',403)
  // No cross-origin account mutations, including authenticated requests.
  // Next normalizes 127.0.0.1 to localhost in nextUrl; compare the actual Host.
  checkAccountOrigin(req.headers.get('origin'),req.headers.get('host'),process.env.VERCEL==='1')
  const raw=await req.text()
  if(raw.length>3000)throw new WorkflowError('El formulario es demasiado largo.',413)
  let body:Record<string,unknown>
  try{body=JSON.parse(raw)}catch{throw new WorkflowError('Formulario inválido.')}
  if(!body||typeof body!=='object'||Array.isArray(body))throw new WorkflowError('Formulario inválido.')
  const account=body.action==='create'?await createManagedAccount(user,body)
   :body.action==='complete'&&typeof body.accountId==='string'?await completeManagedAccount(user,body.accountId)
   :body.action==='access'?await changeAccountAccess(user,body)
   :null
  if(!account)throw new WorkflowError('Acción no reconocida.')
  return NextResponse.json({ok:true,account},{headers})
 }catch(error){
  if(error instanceof WorkflowError)return NextResponse.json({error:error.message},{status:error.status,headers})
  console.error('Account management unavailable',error instanceof Error?error.name:'unknown')
  return NextResponse.json({error:'No pudimos confirmar el cambio. Actualiza la lista antes de reintentarlo.'},{status:503,headers})
 }
}
