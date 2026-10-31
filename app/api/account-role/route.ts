import {NextRequest,NextResponse} from 'next/server'
import {currentUser} from '@/lib/auth'
import {assignedRoles,hasAssignedRole} from '@/lib/account-roles'
import {checkAccountOrigin} from '@/lib/account-policy'
import {assertAccountAccess} from '@/lib/user-directory'
import {withDatabase} from '@/lib/database'
import {WorkflowError} from '@/lib/workflow-error'
import type {Role} from '@/lib/types'
export const runtime='nodejs'
const headers={'Cache-Control':'no-store'}
export async function POST(req:NextRequest){
 try{
  const user=await currentUser(true)
  if(!user)return NextResponse.json({error:'Inicia sesión.'},{status:401,headers})
  checkAccountOrigin(req.headers.get('origin'),req.headers.get('host'),process.env.VERCEL==='1')
  const raw=await req.text();if(raw.length>200)throw new WorkflowError('Solicitud inválida.')
  let body:Record<string,unknown>;try{body=JSON.parse(raw)}catch{throw new WorkflowError('Solicitud inválida.')}
  if(!body||Array.isArray(body)||typeof body.role!=='string')throw new WorkflowError('Elige un perfil válido.')
  if(assignedRoles(user).length<2||!hasAssignedRole(user,body.role as Role))throw new WorkflowError('Ese perfil no está habilitado para tu cuenta.',403)
  await withDatabase(()=>assertAccountAccess(user))
  const response=NextResponse.json({ok:true},{headers})
  const options={httpOnly:true,sameSite:'strict' as const,secure:process.env.VERCEL==='1',path:'/'}
  response.cookies.set('coded_account_role',`${user.id}:${body.role}`,{...options,maxAge:8*3600})
  response.cookies.set('coded_review','',{...options,maxAge:0})
  return response
 }catch(error){return NextResponse.json({error:error instanceof WorkflowError?error.message:'No pudimos cambiar de perfil. Intenta de nuevo.'},{status:error instanceof WorkflowError?error.status:503,headers})}
}
