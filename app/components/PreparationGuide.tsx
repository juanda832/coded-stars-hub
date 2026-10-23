'use client'
import { meetingMeta } from '@/lib/meeting-utils'

import { useEffect, useState } from 'react'
import { ArrowRight, BookOpen, Check, CheckCheck, ClipboardCheck, Headphones, MessageCircle } from 'lucide-react'
import type { HubData, Meeting } from '@/lib/types'
import { applicationGroups, preparationKey, restorePreparation } from '@/lib/application-journey'
import { dateText, isActiveMeeting, languageText } from '@/lib/meeting-utils'
import { participationState } from '@/lib/participation-state'
import { programName } from '@/lib/program-labels'
import { ProgramArtwork } from './HubArtwork'
import MeetingSchedule from './MeetingSchedule'
import StoryStudio from './StoryStudio'

const steps = [
  { title:'Elegí una historia real',text:'Tengo un recuerdo concreto y puedo contar qué viví y qué aprendí.' },
  { title:'Revisé el horario y el idioma',text:'Revisé la hora de inicio en mi zona y consulté al equipo si falta información.' },
  { title:'Sé cómo será mi turno',text:'Leí las indicaciones y consulté al anfitrión si todavía tengo una duda.' },
  { title:'Preparé mi conexión',text:'Probé cámara, micrófono e internet. Si estoy confirmado, revisaré el acceso antes de entrar.' },
]

function PreparationChecklist({storageKey,meetingTitle,onQuestion}:{storageKey:string;meetingTitle?:string;onQuestion:()=>void}) {
  const [checked,setChecked]=useState<number[]>([]),[ready,setReady]=useState(false),[saveStatus,setSaveStatus]=useState('Abriendo tu lista…')
  useEffect(()=>{
    try{setChecked(restorePreparation(localStorage.getItem(storageKey),steps.length));setSaveStatus('Se guarda solo en este dispositivo.')}
    catch{setSaveStatus('No pudimos recuperar esta lista. Puedes marcarla durante esta visita.')}
    setReady(true)
  },[storageKey])
  function save(next:number[]) {
    setChecked(next)
    try{localStorage.setItem(storageKey,JSON.stringify(next));setSaveStatus('Lista guardada en este dispositivo.')}
    catch{setSaveStatus('No se pudo guardar. Tus marcas se conservarán solo durante esta visita.')}
  }
  return <section className="prep-checklist preparation-checklist-scoped">
    <div className="section-heading"><h2>Antes de entrar</h2><span>{checked.length} de {steps.length}</span></div>
    <p className="subtle-copy">{meetingTitle?<>Tu lista para <b>{meetingTitle}</b>. </>:'Lista de preparación.'}</p>
    <progress className="preparation-progress" aria-label="Pasos de preparación completados" value={checked.length} max={steps.length}/>
    {steps.map((step,index)=><label className={'prep-step '+(checked.includes(index)?'complete':'')} key={step.title}><input type="checkbox" disabled={!ready} checked={checked.includes(index)} onChange={()=>save(checked.includes(index)?checked.filter(item=>item!==index):[...checked,index])}/><span className="prep-check" aria-hidden="true">{checked.includes(index)?<Check size={17}/>:index+1}</span><span><b>{step.title}</b><small>{step.text}</small></span></label>)}
    <p className="preparation-save-status" role="status">{saveStatus}</p>
    {checked.length===steps.length&&<p className="prep-ready"><CheckCheck size={19}/> Lista completada. Puedes volver a revisar lo que cambie.</p>}
    <div className="preparation-checklist-tools"><button className="secondary-button" onClick={onQuestion}><MessageCircle size={16}/> Tengo una duda</button>{checked.length>0&&<button className="text-link" onClick={()=>save([])}>Desmarcar esta lista</button>}</div>
    <small className="preparation-personal-note">Esta guía es para ti. Marcarla no envía información al anfitrión ni cambia tu solicitud.</small>
  </section>
}

export default function PreparationGuide({data,zone,initialProgram,initialMeetingId,onExplore,onMessages,onDetails,onQuestion}:{
  data:HubData;zone:string;initialProgram?:string;initialMeetingId?:string;onExplore:()=>void;onMessages:()=>void;onDetails:(meeting:Meeting)=>void;onQuestion:(meeting:Meeting)=>void;
}) {
  const groups=applicationGroups(data),preferred=[...groups.confirmed,...groups.pending]
  const [meetingId,setMeetingId]=useState(()=>{
    if(initialMeetingId&&groups.all.some(item=>item.meeting.id===initialMeetingId))return initialMeetingId
    return (initialProgram?preferred.find(item=>item.meeting.program===initialProgram):preferred[0])?.meeting.id||''
  })
  const [tab,setTab]=useState<'story'|'checklist'>('story')
  const selected=groups.all.find(item=>item.meeting.id===meetingId),meeting=selected?.meeting
  const options=selected&&!preferred.some(item=>item.meeting.id===meetingId)?[...preferred,selected]:preferred
  const state=selected?participationState(selected.meeting,selected.registration,!!data.confirmedCounts[selected.meeting.id]):undefined
  const storageKey=preparationKey(data.user.id,meeting?.id)
  const program=meeting?.program||initialProgram||data.profile?.programs[0]||'Orlando'
  function ask(){if(meeting&&isActiveMeeting(meeting))onQuestion(meeting);else onMessages()}
  return <section className="preparation-page preparation-refined">
    <div className="page-heading"><div><h1>Preparar mi participación</h1><p>Escribe tu testimonio y revisa lo necesario para la reunión.</p></div></div>
    <section className="preparation-context" aria-label="Reunión que estoy preparando">
      <label className="preparation-meeting-choice"><span>Preparación para</span><select value={meetingId} onChange={event=>setMeetingId(event.target.value)}><option value="">Practicar sin una reunión</option>{options.map(item=><option key={item.meeting.id} value={item.meeting.id}>{item.meeting.title.replace(/^JDP · /,'')} · {dateText(item.meeting.startsAt,zone,{day:'numeric',month:'short'})}</option>)}</select></label>
      {meeting&&state?<div className="preparation-context-body"><ProgramArtwork program={meeting.program} photoKey={meeting.id} className="preparation-context-photo"/><div className="preparation-context-copy"><span className={'participation-badge '+state.tone}>{state.label}</span><h2>{meeting.title.replace(/^JDP · /,'')}</h2><p>{meetingMeta(meeting)}{meeting.host&&<><br/>Con {meeting.host}</>}</p></div><MeetingSchedule meeting={meeting} zone={zone}/><div className="preparation-context-actions"><button className="secondary-button" onClick={()=>onDetails(meeting)}>Ver indicaciones <ArrowRight size={16}/></button>{isActiveMeeting(meeting)&&<button className="text-link" onClick={()=>onQuestion(meeting)}><MessageCircle size={16}/> Preguntar al anfitrión</button>}</div></div>:<div className="preparation-general"><Headphones size={25}/><p>Puedes practicar sin tener una reunión confirmada.</p><button className="text-link" onClick={onExplore}>Encontrar una JDP <ArrowRight size={16}/></button></div>}
      {state?.key==='pending'&&<p className="preparation-context-note">Prepararte no confirma tu participación. Coordinación te avisará cuando decida.</p>}
    </section>
    {meeting&&!meeting.program&&<p className="subtle-copy">Esta JDP no tiene un programa informado. Puedes elegir qué experiencia quieres preparar sin cambiar los datos de la reunión.</p>}<div className="preparation-section-tabs" aria-label="Sección de preparación"><button aria-pressed={tab==='story'} onClick={()=>setTab('story')}><BookOpen size={17}/> Mi historia</button><button aria-pressed={tab==='checklist'} onClick={()=>setTab('checklist')}><ClipboardCheck size={17}/> Antes de entrar</button></div>
    {tab==='story'?<StoryStudio key={data.user.id+':'+(meeting?.id||'general')+':'+program} userId={data.user.id} initialProgram={program} programLocked={!!meeting&&['Orlando','London','Tokyo'].includes(meeting.program)}/>:<><PreparationChecklist key={storageKey} storageKey={storageKey} meetingTitle={meeting?.title.replace(/^JDP · /,'')} onQuestion={ask}/><div className="prep-faq"><h2>Para tenerlo claro</h2>{[['¿Tengo que saber todas las respuestas?','Tu aporte es contar tu experiencia. El anfitrión acompaña la conversación y responde las preguntas del programa.'],['¿Enviar una solicitud confirma mi participación?','Tu solicitud queda en revisión. Administración elige manualmente a un único Star y comunica la decisión en el Hub.'],['¿Dónde veo el enlace?','Si estás confirmado, abre las indicaciones de la reunión. El botón para entrar se habilita 15 minutos antes cuando el anfitrión ha agregado el enlace.'],['¿Y si me conecté, pero no pude hablar?','Después de la reunión puedes contarlo en Mi experiencia. La conexión y el testimonio se registran por separado.'],['¿Qué hago si ya no puedo participar?','Abre tu participación y pulsa «Ya no puedo participar». Avisa con tiempo para que coordinación pueda elegir a otro solicitante.']].map(([question,answer])=><details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</div></>}
  </section>
}
