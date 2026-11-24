import type {HubData,Meeting} from './types'
import {programName} from './program-labels.ts'
import {localDateTime} from './time-zones.ts'
import {answerLabels,issueLabels,reportConflicts,needsReview} from './reports.ts'
export const exportPeriods=[['7','Próximos 7 días'],['30','Próximos 30 días'],['history','Historial'],['all','Todas las reuniones']] as const
export type ExportPeriod=typeof exportPeriods[number][0]
export type ExportCell=string|number
export type ExportSheet={name:string;headers:string[];rows:ExportCell[][];widths:number[]}
const statuses={scheduled:'Programada',live:'En vivo',completed:'Finalizada',cancelled:'Cancelada'}
const languages={'':'Sin indicar',Español:'Español',English:'Inglés',Português:'Portugués'}
export function exportMeetings(meetings:Meeting[],period:ExportPeriod,now=Date.now()){
 return meetings.filter(m=>{
  const date=Date.parse(m.startsAt)
  if(!Number.isFinite(date))return false
  if(period==='all')return true
  if(period==='history')return m.status==='completed'||m.status==='cancelled'||(m.duration!==null&&date+m.duration*60000<=now)
  return m.status==='scheduled'&&date>=now&&date-now<=Number(period)*86400000
 }).sort((a,b)=>Date.parse(a.startsAt)-Date.parse(b.startsAt))
}
export function operationalExport(data:HubData,period:ExportPeriod,zone:string,now=Date.now()):ExportSheet[]{
 if(data.user.role!=='admin')throw Error('Solo coordinación puede exportar este informe.')
 const meetings=exportMeetings(data.meetings,period,now)
 const selected=new Set(meetings.map(m=>m.id))
 const regs=data.registrations.filter(r=>selected.has(r.meetingId))
 const reports=data.reports.filter(r=>selected.has(r.meetingId))
 const stars=new Map(data.assignedStars.map(s=>[s.userId,s.name]))
 const rows=meetings.map(m=>{
  const own=regs.filter(r=>r.meetingId===m.id)
  const confirmed=own.find(r=>r.status==='confirmed')
  const mReports=reports.filter(r=>r.meetingId===m.id)
  const ended=m.status!=='cancelled'&&(m.status==='completed'||(m.duration!==null&&Date.parse(m.startsAt)+m.duration*60000<=now))
  const pending=own.filter(r=>r.status==='pending').length
  const review=data.reportReviews.find(r=>r.meetingId===m.id)
  const reviewed=!!review&&mReports.length>0&&mReports.every(r=>review.reportIds.includes(r.id))
  const missing=[!m.hostId?'Anfitrión':'',!confirmed?'Star':'',!m.joinUrl?.trim()?'Enlace':''].filter(Boolean)
  return [m.id,m.schoolName||m.title,programName(m.program),languages[m.language]||m.language,localDateTime(m.startsAt,zone).replace('T',' '),m.startsAt,statuses[m.status],m.host||'Sin asignar',confirmed?stars.get(confirmed.userId)||'Confirmado':'Sin confirmar',pending,own.filter(r=>r.status!=='withdrawn').length,m.status==='scheduled'&&Date.parse(m.startsAt)>=now?(missing.join(', ')||'Completa'):'No corresponde',ended?(mReports.some(r=>r.role==='host')?'Recibido':'Pendiente'):'No corresponde',ended&&confirmed?(mReports.some(r=>r.role==='star')?'Recibido':'Pendiente'):'No corresponde',reviewed?'Revisado':needsReview(mReports)?'Por revisar':'Sin incidencia registrada']
 })
 const summary:ExportCell[][]=[
  ['Espacio',data.workspace==='team'?'Equipo CODED':data.workspace==='review'?'Recorrido con datos ficticios':'Beta'],
  ['Periodo',exportPeriods.find(([key])=>key===period)![1]],['Zona horaria',zone],['Generado (UTC)',new Date(now).toISOString()],
  ['Reuniones',meetings.length],['Reuniones con Star confirmado',meetings.filter(m=>regs.some(r=>r.meetingId===m.id&&r.status==='confirmed')).length],
  ['Solicitudes en revisión',regs.filter(r=>r.status==='pending').length],['Reportes Star',reports.filter(r=>r.role==='star').length],['Reportes anfitrión',reports.filter(r=>r.role==='host').length],
  ['Stars que reportan conexión',reports.filter(r=>r.role==='star'&&r.starJoined==='yes').length],
  ['Stars que reportan testimonio',reports.filter(r=>r.role==='star'&&r.testimony==='yes').length],
  ['Criterio','El periodo se aplica a la fecha de la reunión, no a la fecha de solicitud o reporte. Las ventanas de 7/30 días son intervalos desde la exportación.'],
  ['Interpretación','Confirmar participación no equivale a asistir. Los reportes representan la versión de cada persona.'],
  ['Privacidad','Uso interno de coordinación. No incluye correos, enlaces privados, preguntas, comentarios ni notas internas.']
 ]
 return [
 {name:'Resumen',headers:['Indicador','Valor'],rows:summary,widths:[42,100]},
 {name:'Agenda',headers:['ID reunión','Colegio / JDP','Programa','Idioma','Fecha y hora local','Inicio UTC','Estado','Anfitrión','Star confirmado','En revisión','Solicitudes activas','Pendientes de preparación','Reporte anfitrión','Reporte Star','Seguimiento'],rows,widths:[20,40,25,17,23,28,16,26,26,15,18,29,23,20,24]},
 {name:'Resultados',headers:['ID reunión','Colegio / JDP','Fuente','Reunión realizada','Conexión Star','Tuvo la palabra','Testimonio','Había familias','Situaciones','Diferencias entre versiones','Fecha reporte UTC'],rows:reports.map(r=>[r.meetingId,meetings.find(m=>m.id===r.meetingId)?.schoolName||meetings.find(m=>m.id===r.meetingId)?.title||'',r.role==='star'?'Star':'Anfitrión',answerLabels[r.meetingHeld],answerLabels[r.starJoined],answerLabels[r.wasInvited],answerLabels[r.testimony],answerLabels[r.families],r.issues.map(i=>issueLabels[i]).join(', '),reportConflicts(reports.filter(other=>other.meetingId===r.meetingId)).join(', '),r.createdAt]),widths:[20,40,16,23,20,20,20,20,38,38,28]}
 ]
}
