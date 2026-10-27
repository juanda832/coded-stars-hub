import {NextRequest,NextResponse} from 'next/server'
import {currentUser} from '@/lib/auth'
import {calendarConnection,changeCalendarConnection} from '@/lib/calendar-connection'
import {checkAccountOrigin} from '@/lib/account-policy'
import {WorkflowError} from '@/lib/workflow-error'
export const runtime='nodejs'
const headers={'Cache-Control':'private, no-store','Referrer-Policy':'no-referrer'}
function failure(error:unknown){return NextResponse.json({error:error instanceof WorkflowError?error.message:'No pudimos consultar tu conexión. Intenta de nuevo.'},{status:error instanceof WorkflowError?error.status:503,headers})}
export async function GET(){try{const user=await currentUser();if(!user)return NextResponse.json({error:'Inicia sesión.'},{status:401,headers});return NextResponse.json(await calendarConnection(user),{headers})}catch(error){return failure(error)}}
export async function POST(req:NextRequest){try{
 const user=await currentUser();if(!user)return NextResponse.json({error:'Inicia sesión.'},{status:401,headers})
 checkAccountOrigin(req.headers.get('origin'),req.headers.get('host'),process.env.VERCEL==='1')
 const raw=await req.text();if(raw.length>500)throw new WorkflowError('Solicitud demasiado larga.',413)
 let body:Record<string,unknown>;try{body=JSON.parse(raw)}catch{throw new WorkflowError('Solicitud inválida.')}
 if(!body||typeof body!=='object'||Array.isArray(body))throw new WorkflowError('Solicitud inválida.')
 return NextResponse.json(await changeCalendarConnection(user,body),{headers})
}catch(error){return failure(error)}}
