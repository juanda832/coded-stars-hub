import {NextResponse} from 'next/server'
import {currentUser} from '@/lib/auth'
import {withHubStore} from '@/lib/review-session'
import {hubDataFor} from '@/lib/hub-data'
import {operationalExport,exportPeriods,type ExportPeriod} from '@/lib/operational-export'
import {zoneChoices} from '@/lib/time-zones'
import {writeWorkbook} from '@/lib/export-workbook'
export const runtime='nodejs'
const headers={'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}
export async function GET(request:Request){
 try{
  const user=await currentUser()
  if(!user)return NextResponse.json({error:'Inicia sesión.'},{status:401,headers})
  if(user.role!=='admin')return NextResponse.json({error:'Solo coordinación puede descargar este informe.'},{status:403,headers})
  const params=new URL(request.url).searchParams
  const period=params.get('period')||'7',zone=params.get('zone')||'America/La_Paz'
  if(!exportPeriods.some(([key])=>key===period)||!zoneChoices.some(([key])=>key===zone))return NextResponse.json({error:'Revisa el periodo y la zona horaria.'},{status:400,headers})
  const data=await withHubStore(user,()=>hubDataFor(user))
  const now=Date.now(),sheets=operationalExport(data,period as ExportPeriod,zone,now)
  const workbook=await writeWorkbook(sheets)
  const date=new Date(now).toISOString().slice(0,10)
  return new Response(new Uint8Array(workbook),{headers:{...headers,'Content-Type':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','Content-Disposition':'attachment; filename="coded-coordinacion-'+date+'.xlsx"'}})
 }catch{console.error('Hub export unavailable');return NextResponse.json({error:'No pudimos preparar el archivo. Intenta de nuevo.'},{status:503,headers})}
}
