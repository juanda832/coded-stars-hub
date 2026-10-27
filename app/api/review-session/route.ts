import {NextRequest,NextResponse} from 'next/server'
import {currentUser} from '@/lib/auth'
import {checkAccountOrigin} from '@/lib/account-policy'
import {WorkflowError} from '@/lib/workflow-error'
export const runtime='nodejs'
const headers={'Cache-Control':'no-store'}
export async function POST(req:NextRequest){
 try{
  const user=await currentUser(true)
  if(!user)return NextResponse.json({error:'Inicia sesión.'},{status:401,headers})
  if(user.role!=='admin')throw new WorkflowError('Solo administración puede abrir un recorrido de prueba.',403)
  checkAccountOrigin(req.headers.get('origin'),req.headers.get('host'),process.env.VERCEL==='1')
  const raw=await req.text();if(raw.length>200)throw new WorkflowError('Solicitud inválida.')
  let body:Record<string,unknown>;try{body=JSON.parse(raw)}catch{throw new WorkflowError('Solicitud inválida.')}
  if(!body||!['star','host','admin','exit'].includes(String(body.role)))throw new WorkflowError('Elige un recorrido válido.')
  if(body.role!=='exit'&&process.env.CODED_ALLOW_REAL_ACCOUNTS==='true')throw new WorkflowError('Los recorridos ficticios están deshabilitados al usar datos reales.',403)
  const response=NextResponse.json({ok:true},{headers})
  response.cookies.set('coded_review',body.role==='exit'?'':`${user.id}:${body.role}`,{httpOnly:true,sameSite:'strict',secure:process.env.VERCEL==='1',path:'/',maxAge:body.role==='exit'?0:8*3600})
  return response
 }catch(error){return NextResponse.json({error:error instanceof WorkflowError?error.message:'No pudimos abrir el recorrido. Intenta de nuevo.'},{status:error instanceof WorkflowError?error.status:503,headers})}
}
