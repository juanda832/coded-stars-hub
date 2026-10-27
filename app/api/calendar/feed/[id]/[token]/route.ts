import {readCalendarFeed} from '@/lib/calendar-connection'
import {WorkflowError} from '@/lib/workflow-error'
export const runtime='nodejs'
const headers={'Cache-Control':'private, no-store','Referrer-Policy':'no-referrer','X-Robots-Tag':'noindex, nofollow, noarchive','X-Content-Type-Options':'nosniff'}
export async function GET(_request:Request,{params}:{params:Promise<{id:string;token:string}>}){
 try{const {id,token}=await params;return new Response(await readCalendarFeed(id,token),{headers:{...headers,'Content-Type':'text/calendar; charset=utf-8','Content-Disposition':'inline; filename="coded-stars-jdp.ics"'}})}
 catch(error){return new Response(error instanceof WorkflowError&&error.status===404?'Calendario no disponible.':'No pudimos cargar el calendario.',{status:error instanceof WorkflowError?error.status:503,headers:{...headers,'Content-Type':'text/plain; charset=utf-8'}})}
}
