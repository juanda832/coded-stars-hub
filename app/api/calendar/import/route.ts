import {NextRequest,NextResponse} from 'next/server'
import {currentUser} from '@/lib/auth'
import {withHubStore} from '@/lib/review-session'
import {assertAccountAccess} from '@/lib/user-directory'
import {checkAccountOrigin} from '@/lib/account-policy'
import {commitHostCalendar,previewHostCalendar} from '@/lib/calendar-import-store'
import {CALENDAR_IMPORT_LIMIT,googleCalendarSource} from '@/lib/calendar-import'
import {WorkflowError} from '@/lib/workflow-error'
export const runtime='nodejs'
const headers={'Cache-Control':'private, no-store','Referrer-Policy':'no-referrer'}
async function limited(response:Response|NextRequest,limit:number){
 const reader=response.body?.getReader();if(!reader)throw new WorkflowError('El calendario está vacío.')
 const chunks:Uint8Array[]=[];let size=0
 try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>limit)throw new WorkflowError('El archivo es demasiado grande. Usa un calendario de JDP de hasta 500 KB.',413);chunks.push(value)}}finally{await reader.cancel().catch(()=>{})}
 return Buffer.concat(chunks).toString('utf8')
}
export async function POST(req:NextRequest){try{
 const user=await currentUser();if(!user)return NextResponse.json({error:'Inicia sesión.'},{status:401,headers})
 if(user.role!=='admin')throw new WorkflowError('Solo administración puede importar reuniones.',403)
 checkAccountOrigin(req.headers.get('origin'),req.headers.get('host'),process.env.VERCEL==='1')
 await withHubStore(user,()=>assertAccountAccess(user))
 let body;try{body=JSON.parse(await limited(req,800_000))}catch(error){if(error instanceof WorkflowError)throw error;throw new WorkflowError('Solicitud inválida.')}
 if(!body||typeof body!=='object'||Array.isArray(body))throw new WorkflowError('Solicitud inválida.')
 if(body.action==='preview'){
  let text:string
  if(body.url){
   if(user.reviewer)throw new WorkflowError('En el recorrido de prueba usa un archivo ficticio. Los calendarios externos se revisan desde tu cuenta habitual.',403)
   const url=googleCalendarSource(body.url)
   try{const source=await fetch(url,{redirect:'error',cache:'no-store',signal:AbortSignal.timeout(10000),headers:{Accept:'text/calendar'}});if(!source.ok)throw new Error();text=await limited(source,CALENDAR_IMPORT_LIMIT)}catch(error){if(error instanceof WorkflowError)throw error;throw new WorkflowError('No pudimos leer ese calendario de Google. Comprueba el enlace o carga el archivo .ics.',503)}
  }else{if(typeof body.text!=='string')throw new WorkflowError('Elige un archivo .ics.');text=body.text}
  return NextResponse.json(await withHubStore(user,()=>previewHostCalendar(user,text)),{headers})
 }
 if(body.action==='commit')return NextResponse.json(await withHubStore(user,()=>commitHostCalendar(user,body.items,body.hostId)),{headers})
 throw new WorkflowError('Acción no reconocida.')
}catch(error){return NextResponse.json({error:error instanceof WorkflowError?error.message:'No pudimos completar la importación. Actualiza la vista previa antes de volver a intentar.'},{status:error instanceof WorkflowError?error.status:503,headers})}}
