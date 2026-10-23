'use client'
import { meetingMeta } from '@/lib/meeting-utils'
import { useState } from 'react'
import { ArrowRight, CalendarPlus, Check, ExternalLink, MessageCircle } from 'lucide-react'
import type { HubData, Meeting } from '@/lib/types'
import { downloadCalendar, isActiveMeeting, languageText } from '@/lib/meeting-utils'
import type { HubAction } from './StarExperience'
import Dialog from './Dialog'
import { reportAvailable } from '@/lib/reports'
import { participationState } from '@/lib/participation-state'
import ApplicationProgress from './ApplicationProgress'
import { ProgramArtwork } from './HubArtwork'
import { OrlandoMeetingIdeas } from './OrlandoSpotlight'
import { programName } from '@/lib/program-labels'
import MeetingSchedule from './MeetingSchedule'
export default function MeetingDetails({meeting,data,zone,busy,error,action,onClose,onRegister,onFeedback,onQuestion}:{meeting:Meeting;data:HubData;zone:string;busy:boolean;error:string;action:HubAction;onClose:()=>void;onRegister:(m:Meeting)=>void;onFeedback:(m:Meeting)=>void;onQuestion:(meeting:Meeting)=>void}){
 const [cancelOpen,setCancelOpen]=useState(false)
 const reg=data.registrations.find(r=>r.meetingId===meeting.id),questions=data.questions.filter(q=>q.meetingId===meeting.id)
 const confirmed=reg?.status==='confirmed',withdrawn=reg?.status==='withdrawn'
 const completed=reportAvailable(meeting),active=isActiveMeeting(meeting),hasFeedback=data.reports.some(r=>r.meetingId===meeting.id&&r.userId===data.user.id)
 const state=participationState(meeting,reg,!!data.confirmedCounts[meeting.id])
 const waiting=questions.filter(question=>!question.reply).length
 const openTime=Date.parse(meeting.startsAt)-15*60000,canJoin=confirmed&&!!meeting.joinUrl&&active&&Date.now()>=openTime
 return <Dialog title={meeting.title.replace(/^JDP · /,'')} onClose={onClose} className="meeting-dialog">{error&&<p className="error" role="alert">{error}</p>}<ProgramArtwork program={meeting.program} photoKey={meeting.id} className="detail-artwork"/><span className="dialog-program">{meetingMeta(meeting)} · 1 Star confirmado como máximo</span><p className="dialog-lead">{meeting.description}</p><MeetingSchedule meeting={meeting} zone={zone}/>
 <div className={'participation-status-panel '+state.tone}><span className={'participation-badge '+state.tone}>{state.label}</span>{state.step!=='none'&&<h3>{state.title}</h3>}<p>{state.message}</p>{(state.key==='pending'||state.key==='confirmed')&&<ApplicationProgress confirmed={confirmed}/>}</div>
 {confirmed&&active&&<section className="detail-section join-section"><h3>Prepara tu participación</h3>{canJoin?<a className="primary" href={meeting.joinUrl} target="_blank" rel="noopener noreferrer">Entrar a la reunión <ExternalLink size={17}/></a>:<p>{meeting.joinUrl?'El botón para entrar se habilita 15 minutos antes.':'El anfitrión todavía no agregó el enlace. Lo verás aquí cuando esté disponible.'}</p>}<button className="secondary-button" onClick={()=>downloadCalendar(meeting)}><CalendarPlus size={17}/> Añadir a mi calendario</button></section>}

 {meeting.program==='Orlando'&&<OrlandoMeetingIdeas/>}
 {(meeting.agenda||meeting.takeaway)&&<details className="detail-section detail-agenda"><summary>Así será la JDP</summary>{meeting.takeaway&&<p>{meeting.takeaway}</p>}{meeting.agenda&&<ol className="agenda-list">{meeting.agenda.map((item,i)=><li key={item}><span>{i+1}</span>{item}</li>)}</ol>}<p className="quiet-copy">El Star confirmado comparte su experiencia con sus propias palabras. El anfitrión le indicará cuándo intervenir.</p></details>}
 {meeting.hostNote&&<details className="detail-section detail-host-instructions" open={confirmed}><summary>Indicaciones {meeting.host?'de '+meeting.host.split(' ')[0]:'del equipo'}</summary><p>{meeting.hostNote}</p></details>}
 {completed&&confirmed&&!hasFeedback&&<button className="primary full" onClick={()=>{onClose();onFeedback(meeting)}}>Contar mi experiencia <ArrowRight size={18}/></button>}
 {completed&&hasFeedback&&<p className="meeting-info"><Check size={17}/> Gracias por compartir tu experiencia.</p>}
 {active&&<section className="meeting-question-shortcut" aria-labelledby="meeting-question-heading"><span className="meeting-question-icon"><MessageCircle size={21}/></span><div><h3 id="meeting-question-heading">{questions.length?'Tu conversación con el equipo':'¿Tienes una duda?'}</h3><p>{questions.length?waiting?`${waiting} ${waiting===1?'pregunta pendiente de respuesta':'preguntas pendientes de respuesta'}.`:'El equipo respondió tus preguntas.':meeting.host?`${meeting.host.split(' ')[0]} y coordinación pueden ayudarte antes de la JDP.`:'Coordinación puede ayudarte antes de la JDP.'}</p></div><button className="secondary-button" onClick={()=>onQuestion(meeting)}>{questions.length?'Ver conversación':'Preguntar al equipo'} <ArrowRight size={16}/></button></section>}
 {state.canRequest&&<div className="meeting-request-bar"><span>Solicitud abierta<br/><small>La confirmación la decide el equipo.</small></span><button className="primary" disabled={busy} onClick={()=>onRegister(meeting)}>Enviar solicitud <ArrowRight size={17}/></button></div>}
 {reg&&!withdrawn&&active&&<div className="cancel-section">{cancelOpen?<><p>{confirmed?'Si cancelas, el equipo podrá elegir manualmente a otro solicitante.':'Retirarás tu solicitud de la revisión administrativa.'}</p><div><button className="secondary-button" onClick={()=>setCancelOpen(false)}>Mantener mi solicitud</button><button className="cancel-confirm" disabled={busy} onClick={async()=>{if(await action({action:'cancel',meetingId:meeting.id},confirmed?'Participación cancelada. Avisamos al equipo para que pueda reasignarla.':'Solicitud retirada.'))setCancelOpen(false)}}>{confirmed?'Cancelar mi participación':'Retirar mi solicitud'}</button></div></>:<button className="text-link" onClick={()=>setCancelOpen(true)}>{confirmed?'Ya no puedo participar':'Retirar mi solicitud'}</button>}</div>}
 </Dialog>
}
