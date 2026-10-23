'use client'
import { useEffect, useRef, useState } from 'react'
import { ArrowRight, Bell, Check, ChevronRight, MessageCircle, Megaphone } from 'lucide-react'
import type { HubData, Meeting } from '@/lib/types'
import { isActiveMeeting } from '@/lib/meeting-utils'
import type { HubAction } from './StarExperience'
import Notifications from './Notifications'
import type { AssistantDraft } from '@/lib/assistant-types'
import { programName } from '@/lib/program-labels'
import QuestionComposer from './QuestionComposer'
import QuestionInbox from './QuestionInbox'

export function HostUpdate({meeting,busy,action}:{meeting:Meeting;busy:boolean;action:HubAction}) {
 const [hostNote,setHostNote]=useState(meeting.hostNote||''),[joinUrl,setJoinUrl]=useState(meeting.joinUrl||'')
 const changed=hostNote!==(meeting.hostNote||'')||joinUrl!==(meeting.joinUrl||'')
 return <form className="host-update-form" onSubmit={event=>{event.preventDefault();void action({action:'meeting_update',meetingId:meeting.id,hostNote,joinUrl},'Indicaciones guardadas. Avisamos a las personas correspondientes.')}}><label htmlFor={'note-'+meeting.id}>Qué necesitan saber los Stars</label><textarea id={'note-'+meeting.id} maxLength={400} value={hostNote} onChange={event=>setHostNote(event.target.value)} placeholder="Cómo prepararse, cuándo tendrán la palabra o qué cambió…"/><label htmlFor={'link-'+meeting.id}>Enlace para entrar</label><input id={'link-'+meeting.id} type="url" placeholder="https://…" value={joinUrl} onChange={event=>setJoinUrl(event.target.value)}/><p>El enlace solo es visible para el Star confirmado y el equipo.</p><button className="secondary-button" disabled={busy||!changed}>{busy?'Guardando…':'Guardar indicaciones'} <Check size={17}/></button></form>
}

export default function Messages({data,zone,busy,action,onDetails,onExplore,initialTab='',onViewChange,onPublications,initialQuestion,onQuestionSent,initialMeetingId=''}:{initialMeetingId?:string;zone:string;initialQuestion?:AssistantDraft;onQuestionSent:(meetingId:string)=>void;onPublications:()=>void;initialTab?:string;onViewChange?:(view:string)=>void;data:HubData;busy:boolean;action:HubAction;onDetails:(meeting:Meeting)=>void;onExplore:()=>void}) {
 const star=data.user.role==='star',unread=data.notifications.filter(notification=>!notification.readAt).length,pending=data.questions.filter(question=>!question.reply).length
 const defaultTab=useRef(unread?'Novedades':'Preguntas')
 const [tab,setTab]=useState(initialTab||defaultTab.current),[questionMeetingId,setQuestionMeetingId]=useState(initialMeetingId)
 useEffect(()=>{setTab(initialTab||defaultTab.current)},[initialTab])
 useEffect(()=>{setQuestionMeetingId(initialMeetingId)},[initialMeetingId])
 const updates=data.meetings.filter(meeting=>isActiveMeeting(meeting)&&(!star||data.registrations.some(registration=>registration.meetingId===meeting.id&&registration.status!=='withdrawn')))
 function changeTab(next:string){setTab(next);onViewChange?.(next)}
 function openQuestions(meetingId:string){setQuestionMeetingId(meetingId);changeTab('Preguntas')}
 return <section className="message-center-refined">
  <div className="page-heading"><div><h1>Mensajes</h1><p>{star?'Preguntas e indicaciones de tus reuniones.':'Preguntas e indicaciones de las JDP.'}</p></div></div>
  <div className="communication-tabs" aria-label="Tipo de mensajes">{[{name:'Novedades',icon:Bell,count:unread},{name:'Preguntas',icon:MessageCircle,count:pending},{name:'Indicaciones',icon:Megaphone,count:0}].map(({name,icon:Icon,count})=><button key={name} aria-pressed={tab===name} onClick={()=>changeTab(name)}><Icon size={18}/>{name}{count>0&&<span>{count}</span>}</button>)}</div>
  {tab==='Novedades'?<Notifications zone={zone} onQuestions={openQuestions} onPublications={onPublications} data={data} busy={busy} action={action} onDetails={onDetails}/>:tab==='Preguntas'?<>
   {star&&<QuestionComposer initialMeetingId={initialMeetingId} zone={zone} initialQuestion={initialQuestion} onQuestionSent={onQuestionSent} data={data} busy={busy} action={action}/>}
   <QuestionInbox data={data} zone={zone} busy={busy} action={action} onDetails={onDetails} meetingId={questionMeetingId} onMeetingChange={setQuestionMeetingId}/>
  </>:<div className="message-list">{updates.map(meeting=><article className="message-card" key={meeting.id}><div className="message-heading"><span className="program-tag">{programName(meeting.program)}</span><Megaphone size={19}/></div><h3>{meeting.title.replace(/^JDP · /,'')}</h3>{star?<><p className="message-question">{meeting.hostNote||'El anfitrión todavía no agregó indicaciones.'}</p><span className="notice-author">De {meeting.host||'coordinación'}</span><button className="secondary-button" onClick={()=>onDetails(meeting)}>Ver mi reunión <ChevronRight size={17}/></button></>:<details className="host-edit-details"><summary>Revisar indicaciones y enlace <ChevronRight size={16}/></summary><HostUpdate key={meeting.id} meeting={meeting} busy={busy} action={action}/></details>}</article>)}{!updates.length&&<div className="friendly-empty"><h2>Tus indicaciones aparecerán aquí</h2><p>{star?'Cuando envíes una solicitud, tendrás sus novedades en este espacio.':'Las indicaciones de tus próximas reuniones aparecerán en este espacio.'}</p><button className="primary" onClick={onExplore}>Explorar reuniones <ArrowRight size={17}/></button></div>}</div>}
 </section>
}
