'use client'

import { ArrowRight, BookOpen, CalendarPlus, CheckCheck, ClipboardCheck, MessageCircle } from 'lucide-react'
import type { HubData, Meeting, Registration } from '@/lib/types'
import { dateText, downloadCalendar, isActiveMeeting, languageText } from '@/lib/meeting-utils'
import { participationState } from '@/lib/participation-state'
import { programName } from '@/lib/program-labels'
import ApplicationProgress from './ApplicationProgress'
import { ProgramArtwork } from './HubArtwork'
import MeetingSchedule from './MeetingSchedule'

export default function ApplicationCard({meeting,registration,data,zone,onDetails,onPreparation,onQuestion,onReport}:{
  meeting:Meeting;registration:Registration;data:HubData;zone:string;
  onDetails:(meeting:Meeting)=>void;onPreparation:(meeting:Meeting)=>void;onQuestion:(meeting:Meeting)=>void;onReport:(meeting:Meeting)=>void;
}) {
  const state=participationState(meeting,registration,!!data.confirmedCounts[meeting.id])
  const active=isActiveMeeting(meeting),hasReport=data.reports.some(report=>report.meetingId===meeting.id&&report.userId===data.user.id)
  const prepare=active&&(state.key==='pending'||state.key==='confirmed')
  const report=state.key==='ended'&&state.confirmed&&!hasReport
  const detailLabel=state.key==='confirmed'?'Ver acceso e indicaciones':state.ended?'Ver resumen':'Ver solicitud'
  return <article className={'application-card application-'+state.key}>
    <ProgramArtwork program={meeting.program} photoKey={meeting.id} className="application-cover"/>
    <div className="application-card-body">
      <div className="application-card-status"><span className="program-tag">{meeting.program?programName(meeting.program):'JDP'}</span><span className={'participation-badge '+state.tone}>{state.label}</span></div>
      <h2><button onClick={()=>onDetails(meeting)}>{meeting.title.replace(/^JDP · /,'')}</button></h2>
      <p className="application-host">{meeting.host?'Con '+meeting.host:'Coordina el equipo CODED'}{meeting.language&&<span> · {languageText(meeting.language)}</span>}</p>
      <MeetingSchedule meeting={meeting} zone={zone}/>
      {prepare&&<ApplicationProgress confirmed={state.confirmed}/>}
      <p className="application-next-copy">{hasReport&&state.ended?'Ya compartiste tu versión de lo que pasó. Puedes consultarla en «Mi experiencia».':state.message}</p>
      <div className="application-card-actions">
        {prepare&&<button className={state.confirmed?'secondary-button':'primary'} onClick={()=>onPreparation(meeting)}><BookOpen size={16}/> Preparar mi historia</button>}
        {report&&<button className="primary" onClick={()=>onReport(meeting)}><ClipboardCheck size={16}/> Contar cómo me fue</button>}
        <button className={state.key==='confirmed'?'primary':'secondary-button'} onClick={()=>onDetails(meeting)}>{detailLabel}<ArrowRight size={16}/></button>
      </div>
      {hasReport&&state.ended&&<span className="application-report-sent"><CheckCheck size={15}/> Resultado enviado</span>}
      {active&&<div className="application-card-tools">
        {active&&<button onClick={()=>onQuestion(meeting)}><MessageCircle size={15}/> Preguntar al anfitrión</button>}
        {state.key==='confirmed'&&<button onClick={()=>downloadCalendar(meeting)}><CalendarPlus size={15}/> Añadir al calendario</button>}
      </div>}
      <small className="application-request-date">Solicitud enviada el <time dateTime={registration.requestedAt}>{dateText(registration.requestedAt,zone,{day:'numeric',month:'short'})}</time></small>
    </div>
  </article>
}
