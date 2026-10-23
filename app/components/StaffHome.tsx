'use client'
import { meetingMeta } from '@/lib/meeting-utils'
import { ArrowRight, CalendarDays, Check, ClipboardCheck, MessageCircle, Plus, Users } from 'lucide-react'
import type { HubData, Meeting } from '@/lib/types'
import { dateText, friendlyDay, isActiveMeeting, languageText } from '@/lib/meeting-utils'
import { LatestPublication } from './Publications'
import { ProgramArtwork } from './HubArtwork'
import { needsReview, reportAvailable } from '@/lib/reports'
import { programName } from '@/lib/program-labels'
import MeetingSchedule from './MeetingSchedule'
import { meetingSchedule } from '@/lib/meeting-schedule'
import ProgramPhotoShelf from './ProgramPhotoShelf'

export default function StaffHome({data,zone,onNavigate,onMeeting,onCreate,onReview}:{data:HubData;zone:string;onNavigate:(section:string,messageTab?:string)=>void;onMeeting:(meeting:Meeting)=>void;onCreate:()=>void;onReview:(meeting:Meeting)=>void}) {
 const admin=data.user.role==='admin'
 const upcoming=data.meetings.filter(isActiveMeeting).sort((a,b)=>Date.parse(a.startsAt)-Date.parse(b.startsAt))
 const unassigned=upcoming.filter(meeting=>!data.confirmedCounts[meeting.id])
 const waiting=unassigned.filter(meeting=>data.registrations.some(registration=>registration.meetingId===meeting.id&&registration.status==='pending'))
 const pending=data.registrations.filter(registration=>registration.status==='pending'&&upcoming.some(meeting=>meeting.id===registration.meetingId)).length
 const questions=data.questions.filter(question=>!question.reply).length
 const results=data.meetings.filter(meeting=>{
  if(!reportAvailable(meeting))return false
  const reports=data.reports.filter(report=>report.meetingId===meeting.id)
  if(!admin)return !reports.some(report=>report.userId===data.user.id)
  const review=data.reportReviews.find(item=>item.meetingId===meeting.id)
  return !reports.length||!reports.some(report=>report.role==='host')||(!!data.confirmedCounts[meeting.id]&&!reports.some(report=>report.role==='star'))||(needsReview(reports)&&!reports.every(report=>review?.reportIds?.includes(report.id)))
 })
 const tasks=admin?[
  {icon:Users,count:pending,title:'Solicitudes pendientes',detail:`En ${waiting.length} ${waiting.length===1?'reunión':'reuniones'}`,run:()=>waiting[0]?onReview(waiting[0]):onNavigate('Solicitudes')},
  {icon:MessageCircle,count:questions,title:'Preguntas sin responder',detail:'Ver conversaciones',run:()=>onNavigate('Mensajes','Preguntas')},
  {icon:ClipboardCheck,count:results.length,title:'Resultados por revisar',detail:'Ver seguimiento',run:()=>onNavigate('Seguimiento')},
 ]:[
  {icon:Users,count:upcoming.filter(meeting=>data.confirmedCounts[meeting.id]).length,title:'Participaciones confirmadas',detail:'Ver participantes',run:()=>onNavigate('Participante')},
  {icon:MessageCircle,count:questions,title:'Preguntas sin responder',detail:'Ver conversaciones',run:()=>onNavigate('Mensajes','Preguntas')},
  {icon:ClipboardCheck,count:results.length,title:'Resultados pendientes',detail:'Registrar resultados',run:()=>onNavigate('Resultados')},
 ]
 const next=upcoming[0]
 const assigned=next&&data.registrations.find(registration=>registration.meetingId===next.id&&registration.status==='confirmed')
 const profile=data.assignedStars.find(item=>item.userId===assigned?.userId)
 return <section className="staff-home staff-home-focused staff-review-home">
  <div className="page-heading"><div><h1>Hola, {data.user.name.split(' ')[0]}.</h1><p>{admin?'Resumen del equipo':'Tus reuniones y pendientes'}</p></div>{admin&&<button className="primary" onClick={onCreate}><Plus size={18}/> Nueva reunión</button>}</div>
  <div className="staff-task-grid" aria-label="Pendientes">{tasks.map(({icon:Icon,count,title,detail,run})=><button key={title} className="staff-task" onClick={run}><span className="task-top"><span className="task-icon"><Icon size={21}/></span><strong>{count}</strong></span><b>{title}</b><small>{detail}</small><span className="task-go"><ArrowRight size={16}/></span></button>)}</div>
  {next?<section className="staff-next-card" aria-label="Próxima reunión"><ProgramArtwork program={next.program} photoKey={next.id} className="staff-next-photo"/><div className="staff-next-copy"><span className="section-label">Próxima reunión</span><span className="program-tag">{meetingMeta(next)}</span><h2>{next.title.replace(/^JDP · /,'')}</h2><p>{next.host?'Anfitrión: '+next.host:'Anfitrión sin asignar'}</p><MeetingSchedule meeting={next} zone={zone}/><div className="staff-next-status">{assigned?<Check size={17}/>:<Users size={17}/>}<span>{profile?.name||'Sin participante confirmado'}</span></div><div className="staff-next-actions"><button className="secondary-button" onClick={()=>onMeeting(next)}>Ver reunión <ArrowRight size={17}/></button>{admin&&!assigned&&<button className="text-link" onClick={()=>onReview(next)}>Revisar solicitudes <ArrowRight size={16}/></button>}</div></div></section>:<div className="friendly-empty"><CalendarDays size={28}/><h2>No hay reuniones próximas</h2>{admin&&<button className="primary" onClick={onCreate}>Crear reunión <Plus size={17}/></button>}</div>}
  <LatestPublication data={data} onOpen={()=>onNavigate('Publicaciones')}/>
  {upcoming.length>1&&<section className="staff-agenda"><div className="section-heading"><h2>Después en la agenda</h2><button className="text-link" onClick={()=>onNavigate('Reuniones')}>Ver todas <ArrowRight size={16}/></button></div>{upcoming.slice(1,5).map(meeting=>{
   const slot=meetingSchedule(meeting,zone)
   const registration=data.registrations.find(item=>item.meetingId===meeting.id&&item.status==='confirmed')
   const star=data.assignedStars.find(item=>item.userId===registration?.userId)
   return <button className="staff-agenda-row" key={meeting.id} onClick={()=>onMeeting(meeting)}><span className="agenda-date"><b>{dateText(meeting.startsAt,zone,{day:'2-digit'})}</b><small>{dateText(meeting.startsAt,zone,{month:'short'})}</small></span><span className="agenda-main"><span className="program-tag">{meetingMeta(meeting)}</span><b>{meeting.title.replace(/^JDP · /,'')}</b><small>{friendlyDay(meeting.startsAt,zone)} · {slot.startTime}{slot.endAt&&<>–{slot.endTime}</>}{slot.crossesDay&&<> · Termina el {dateText(slot.endAt,zone,{day:'numeric',month:'short'})}</>}</small></span><span className="agenda-assignment"><b>{star?.name||'Sin participante'}</b></span><ArrowRight size={18}/></button>
  })}</section>}
  <ProgramPhotoShelf/>
 </section>
}
