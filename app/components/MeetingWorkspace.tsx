'use client'
import { meetingMeta } from '@/lib/meeting-utils'
import { useState } from 'react'
import { ArrowRight, Check, ChevronRight, ClipboardCheck, ExternalLink, Link2, Megaphone, MessageCircle, Pencil, Users } from 'lucide-react'
import type { HubData, Meeting } from '@/lib/types'
import { isActiveMeeting, languageText } from '@/lib/meeting-utils'
import { programName } from '@/lib/program-labels'
import { reportAvailable } from '@/lib/reports'
import type { HubAction } from './StarExperience'
import Dialog from './Dialog'
import { HostUpdate } from './Messages'
import { ProgramArtwork } from './HubArtwork'
import MeetingSchedule from './MeetingSchedule'

export default function MeetingWorkspace({meeting,data,zone,busy,error,action,onClose,onEdit,onReview,onReport,onResults,onQuestions}:{meeting:Meeting;data:HubData;zone:string;busy:boolean;error:string;action:HubAction;onClose:()=>void;onEdit:()=>void;onReview:()=>void;onReport:()=>void;onResults:()=>void;onQuestions:()=>void}) {
  const [nextStatus,setNextStatus]=useState(meeting.status)
  const admin=data.user.role==='admin'
  const assigned=data.registrations.find(item=>item.meetingId===meeting.id&&item.status==='confirmed')
  const profile=data.assignedStars.find(item=>item.userId===assigned?.userId)
  const active=isActiveMeeting(meeting),reportable=reportAvailable(meeting)
  const submitted=data.reports.some(item=>item.meetingId===meeting.id&&item.userId===data.user.id)
  const pending=data.registrations.filter(item=>item.meetingId===meeting.id&&item.status==='pending').length
  const questions=data.questions.filter(item=>item.meetingId===meeting.id&&!item.reply).length
  const questionCount=data.questions.filter(item=>item.meetingId===meeting.id).length
  const preparation=[
    {icon:Users,label:'Participante',done:!!assigned,detail:profile?.name||(admin?pending?`${pending} ${pending===1?'solicitud por revisar':'solicitudes por revisar'}`:'Esperando solicitudes':'Coordinación debe confirmar'),button:admin?'Revisar':undefined,run:onReview},
    {icon:Link2,label:'Enlace de acceso',done:!!meeting.joinUrl,detail:meeting.joinUrl?'Guardado para el Star confirmado':'Falta agregar el enlace',button:meeting.joinUrl?'Editar':'Agregar',run:()=>document.getElementById('link-'+meeting.id)?.focus()},
    {icon:Megaphone,label:'Indicaciones',done:!!meeting.hostNote?.trim(),detail:meeting.hostNote?.trim()?'Compartidas con los Stars':'Explica cómo será su participación',button:meeting.hostNote?.trim()?'Editar':'Agregar',run:()=>document.getElementById('note-'+meeting.id)?.focus()},
    {icon:MessageCircle,label:'Preguntas',done:questions===0,detail:questions?`${questions} ${questions===1?'pregunta sin responder':'preguntas sin responder'}`:questionCount?'Todas respondidas':'Sin preguntas pendientes',button:questions?'Responder':'Abrir',run:onQuestions},
  ]
  return <Dialog title={meeting.title.replace(/^JDP · /,'')} onClose={onClose} className="meeting-workspace workspace-refined">
    <span className="dialog-program">{meetingMeta(meeting)}</span>
    <ProgramArtwork program={meeting.program} photoKey={meeting.id} className="workspace-meeting-photo"/>
    <p className="dialog-lead">{meeting.description}</p><p className="workspace-host">Anfitrión: <b>{meeting.host||'Sin asignar'}</b></p><MeetingSchedule meeting={meeting} zone={zone}/>
    {active&&<section className="workspace-preparation" aria-label="Preparación de la reunión"><h3>Preparación</h3><div>{preparation.map(({icon:Icon,label,done,detail,button,run})=><div className={'workspace-preparation-row '+(done?'ready':'pending')} key={label}><span className="workspace-preparation-icon">{done?<Check size={17}/>:<Icon size={17}/>}</span><div><b>{label}</b><small>{detail}</small></div>{button&&<button aria-label={`${button} ${label.toLocaleLowerCase('es')}`} onClick={run}>{button} <ChevronRight size={14}/></button>}</div>)}</div></section>}
    <section className="workspace-star" aria-label="Participante confirmado"><Users size={22}/><div><b>{profile?.name||'Todavía sin Star asignado'}</b><p>{profile?`${profile.languages.map(languageText).join(' · ')} · ${profile.programs.map(programName).join(' · ')}`:!active?'No quedó una participación confirmada en esta reunión.':admin?'Revisa las solicitudes y elige manualmente al participante.':'Coordinación te avisará cuando confirme al participante.'}</p></div>{profile&&<span className="application-status confirmed">Confirmado</span>}</section>
    {active&&<><h3 className="workspace-section-title">Indicaciones y acceso</h3><HostUpdate meeting={meeting} busy={busy} action={action}/>{meeting.joinUrl&&<a className="secondary-button full" href={meeting.joinUrl} target="_blank" rel="noopener noreferrer">Abrir enlace de la reunión <ExternalLink size={17}/></a>}</>}
    {!active&&questionCount>0&&<button className="secondary-button full" onClick={onQuestions}>Ver conversaciones de esta reunión <ArrowRight size={17}/></button>}
    {reportable&&<button className="primary full" onClick={admin||submitted?onResults:onReport}>{admin?'Revisar resultados':submitted?'Ver mi resultado':'Registrar cómo fue'} <ClipboardCheck size={17}/></button>}
    <details open={meeting.duration===null} className="workspace-controls workspace-state-details"><summary>Estado y detalles de la reunión <ChevronRight size={16}/></summary>{meeting.duration===null&&!reportable&&<p className="subtle-copy">No se informó la duración. Al terminar, marca la JDP como Finalizada para habilitar el seguimiento.</p>}<label className="field-label">Estado de la reunión<select className="input" value={nextStatus} disabled={busy} onChange={event=>setNextStatus(event.target.value as Meeting['status'])}><option value="scheduled">Programada</option><option value="live">En vivo</option><option value="completed">Finalizada</option><option value="cancelled">Cancelada</option></select></label>{nextStatus!==meeting.status&&<><p className="subtle-copy">{nextStatus==='cancelled'?'La reunión se mostrará como cancelada y avisaremos a las personas vinculadas.':'Avisaremos a las personas vinculadas del nuevo estado.'}</p><button className="primary" disabled={busy} onClick={()=>action({action:'status',meetingId:meeting.id,status:nextStatus},'Estado actualizado. Avisamos a las personas vinculadas.')}>Actualizar estado</button></>}{admin&&meeting.status==='scheduled'&&<button className="secondary-button" onClick={onEdit}><Pencil size={16}/> Editar detalles y horario</button>}</details>
    {error&&<p className="error" role="alert">{error}</p>}
  </Dialog>
}
