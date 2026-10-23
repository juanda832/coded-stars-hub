import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@/lib/auth'
import { assistantSnapshot, sendAssistantMessage } from '@/lib/assistant-store'
import { WorkflowError } from '@/lib/store'
export const runtime='nodejs'
const headers={'Cache-Control':'no-store'}
function failure(error:unknown){
 if(error instanceof WorkflowError)return NextResponse.json({error:error.message},{status:error.status,headers})
 console.error('Local assistant failed',error instanceof Error?error.name:'UnknownError')
 return NextResponse.json({error:'No pudimos consultar el Hub. Tu mensaje sigue en el cuadro para que puedas reintentar.'},{status:500,headers})
}
export async function GET(req:NextRequest){
 const user=await currentUser();if(!user)return NextResponse.json({error:'Inicia sesión'},{status:401,headers})
 try{return NextResponse.json(assistantSnapshot(user,req.nextUrl.searchParams.get('conversation')||undefined),{headers})}catch(error){return failure(error)}
}
export async function POST(req:NextRequest){
 const user=await currentUser();if(!user)return NextResponse.json({error:'Inicia sesión'},{status:401,headers})
 try{
  const raw=await req.text();if(raw.length>6000)throw new WorkflowError('La consulta es demasiado larga.',413)
  let body:Record<string,unknown>;try{body=JSON.parse(raw)}catch{throw new WorkflowError('Consulta inválida.')}
  if(!body||typeof body!=='object'||Array.isArray(body))throw new WorkflowError('Consulta inválida.')
  return NextResponse.json(sendAssistantMessage(user,body),{headers})
 }catch(error){return failure(error)}
}
