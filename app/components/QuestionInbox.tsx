'use client'

import { useRef, useState } from 'react'
import { ArrowRight, CheckCheck, ChevronRight, Clock3, Copy, MessageCircle, Search, Send, X } from 'lucide-react'
import type { HubData, Meeting, MeetingQuestion } from '@/lib/types'
import { dateText, isActiveMeeting, languageText } from '@/lib/meeting-utils'
import { programName } from '@/lib/program-labels'
import { messageDraftKey, questionInbox, type QuestionFilter } from '@/lib/question-inbox'
import type { HubAction } from './StarExperience'
import DraftSuggestions from './DraftSuggestions'
import { ProgramArtwork } from './HubArtwork'
import useMessageDraft from './useMessageDraft'

function ReplyComposer({question,meeting,userId,zone,busy,action,autoOpen}:{question:MeetingQuestion;meeting?:Meeting;userId:string;zone:string;busy:boolean;action:HubAction;autoOpen:boolean}) {
  const draft=useMessageDraft(messageDraftKey(userId,'reply',question.id)),input=useRef<HTMLTextAreaElement>(null)
  const [copyStatus,setCopyStatus]=useState('')
  const suggestions=[{label:'Ayuda para prepararse',text:'Puedes preparar un recuerdo real: qué viviste, qué aprendiste y qué te llevas. No hace falta memorizar un discurso. Si tienes otra duda, puedes escribirnos aquí.'}]
  if(meeting&&isActiveMeeting(meeting))suggestions.unshift({label:'Horario e idioma',text:`La JDP está programada para el ${dateText(meeting.startsAt,zone,{day:'numeric',month:'long',hour:'2-digit',minute:'2-digit'})} en ${zone.split('/').pop()?.replace(/_/g,' ')}${meeting.language?', en '+languageText(meeting.language):''}. Puedes revisar el horario actualizado en el Hub.`})
  if(meeting?.hostNote)suggestions.push({label:'Indicaciones actuales',text:meeting.hostNote})
  function useIdea(text:string){draft.update(text);requestAnimationFrame(()=>input.current?.focus())}
  if(question.reply)return draft.ready&&draft.text?<details className="retained-reply-draft"><summary>Hay un borrador local conservado</summary><p>La conversación ya tiene una respuesta. Puedes recuperar este texto guardado en tu navegador.</p><textarea aria-label="Mi borrador de respuesta conservado" readOnly value={draft.text}/><div><button type="button" className="secondary-button" onClick={async()=>{try{await navigator.clipboard.writeText(draft.text);setCopyStatus('Borrador copiado.')}catch{setCopyStatus('Selecciona el texto para copiarlo.')}}}><Copy size={15}/> Copiar borrador</button><button type="button" className="text-link" onClick={draft.clear}>Descartar este borrador</button></div><p role="status">{copyStatus}</p></details>:null
  return <details className="conversation-reply" open={autoOpen?true:undefined}><summary><MessageCircle size={17}/> Responder al Star <ChevronRight size={16}/></summary><form onSubmit={async event=>{
    event.preventDefault()
    if(await action({action:'reply',questionId:question.id,reply:draft.text},'Respuesta enviada. El Star recibió un aviso.'))draft.clear()
  }}>
    <DraftSuggestions suggestions={suggestions} text={draft.text} disabled={!draft.ready||busy} onUse={useIdea}/>
    <label htmlFor={'reply-'+question.id}>Tu respuesta</label>
    <textarea ref={input} id={'reply-'+question.id} required minLength={2} maxLength={500} placeholder="Responde con un mensaje breve y claro…" value={draft.text} disabled={!draft.ready||busy} onChange={event=>draft.update(event.target.value)} aria-describedby={'reply-save-'+question.id}/>
    <div className="message-draft-meta"><span id={'reply-save-'+question.id} role="status">{draft.status}</span><span>{draft.text.length}/500</span></div>
    <div className="conversation-send-row"><p>La respuesta la verán este Star, el anfitrión y coordinación. Revisa las ideas antes de enviarlas.</p><button className="primary" disabled={busy||!draft.ready||draft.text.trim().length<2}>Enviar respuesta <Send size={16}/></button></div>
  </form></details>
}

export default function QuestionInbox({data,zone,busy,action,onDetails,meetingId,onMeetingChange}:{data:HubData;zone:string;busy:boolean;action:HubAction;onDetails:(meeting:Meeting)=>void;meetingId:string;onMeetingChange:(meetingId:string)=>void}) {
  const star=data.user.role==='star'
  const [filter,setFilter]=useState<QuestionFilter>(star||meetingId?'Todas':'Pendientes'),[query,setQuery]=useState('')
  const {shown,counts}=questionInbox(data.questions,data.meetings,{meetingId,query,filter})
  const questionMeetingIds=new Set(data.questions.map(question=>question.meetingId))
  const options=data.meetings.filter(meeting=>questionMeetingIds.has(meeting.id)||meeting.id===meetingId).sort((a,b)=>Date.parse(b.startsAt)-Date.parse(a.startsAt))
  const byId=new Map(data.meetings.map(meeting=>[meeting.id,meeting]))
  const firstPending=shown.find(question=>!question.reply)?.id
  const emptyMeeting=!!meetingId&&!query.trim()&&!data.questions.some(question=>question.meetingId===meetingId)
  function clear(){setQuery('');onMeetingChange('');setFilter('Todas')}
  return <section className="question-inbox-refined" aria-label="Conversaciones sobre tus reuniones">
    <div className="conversation-toolbar"><label className="conversation-search"><Search size={18}/><input aria-label="Buscar preguntas y respuestas" placeholder="Busca una duda, un programa o un anfitrión…" value={query} onChange={event=>setQuery(event.target.value)}/>{query&&<button aria-label="Limpiar búsqueda de preguntas" onClick={()=>setQuery('')}><X size={16}/></button>}</label><label className="conversation-meeting-filter"><span>Reunión</span><select aria-label="Filtrar conversaciones por reunión" value={meetingId} onChange={event=>onMeetingChange(event.target.value)}><option value="">Todas las reuniones</option>{options.map(meeting=><option key={meeting.id} value={meeting.id}>{meeting.title.replace(/^JDP · /,'')}</option>)}</select></label></div>
    <div className="conversation-filter-row"><div className="conversation-status-filters" aria-label="Estado de las preguntas">{(['Todas','Pendientes','Resueltas'] as const).map(value=><button key={value} aria-pressed={filter===value} onClick={()=>setFilter(value)}>{value}<span>{counts[value]}</span></button>)}</div>{(query||meetingId)&&<button className="text-link" onClick={clear}>Limpiar filtros <X size={14}/></button>}</div>
    <div className="conversation-results"><span role="status">{shown.length} {shown.length===1?'conversación':'conversaciones'}{filter==='Pendientes'?' por responder':filter==='Resueltas'?(shown.length===1?' resuelta':' resueltas'):''}</span><small><Clock3 size={13}/> {filter==='Resueltas'?'Respuestas: las más recientes primero':'Pendientes: las más antiguas primero'} · Horario en {zone.split('/').pop()?.replace(/_/g,' ')}</small></div>
    {shown.length?<div className="conversation-list">{shown.map(question=>{const meeting=byId.get(question.meetingId);return <article key={question.id} className={'conversation-card '+(question.reply?'is-answered':'is-waiting')}>
      <header className="conversation-card-heading">{meeting&&<ProgramArtwork program={meeting.program} photoKey={meeting.id} className="conversation-program-photo"/>}<div><span className="conversation-program-name">{programName(meeting?.program||'JDP')}</span><h2>{meeting?.title.replace(/^JDP · /,'')||'Tu conversación'}</h2>{meeting&&<small>{dateText(meeting.startsAt,zone,{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}{meeting.host&&<> · Con {meeting.host}</>}</small>}</div><span className={'conversation-state '+(question.reply?'answered':'waiting')}>{question.reply?<CheckCheck size={14}/>:<Clock3 size={14}/>} {question.reply?'Respondida':star?'Esperando al equipo':'Por responder'}</span></header>
      <div className="conversation-content"><div className="conversation-byline"><b>{star?'Tu pregunta':'Pregunta de un Coded Star'}</b><time dateTime={question.createdAt}>{dateText(question.createdAt,zone,{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</time></div><p className="conversation-question">{question.text}</p>
        {question.reply?<section className="conversation-answer" aria-label="Respuesta del equipo"><div><span><CheckCheck size={16}/>{question.replyAuthor||meeting?.host||'El equipo'} respondió</span>{question.repliedAt&&<time dateTime={question.repliedAt}>{dateText(question.repliedAt,zone,{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</time>}</div><p>{question.reply}</p></section>:star?<p className="conversation-wait-note">El equipo recibió tu pregunta. La respuesta aparecerá aquí y recibirás un aviso en Novedades.</p>:null}
        {!star&&<ReplyComposer question={question} meeting={meeting} userId={data.user.id} zone={zone} busy={busy} action={action} autoOpen={question.id===firstPending}/>}
        {meeting&&<button className="conversation-meeting-link" onClick={()=>onDetails(meeting)}>Ver reunión e indicaciones <ArrowRight size={16}/></button>}
      </div>
    </article>})}</div>:<div className="friendly-empty"><MessageCircle size={28}/><h2>{emptyMeeting?'Aún no hay preguntas para esta reunión.':query||meetingId?'No hay conversaciones con estos filtros.':filter==='Pendientes'?'No hay preguntas pendientes.':filter==='Resueltas'?'Las respuestas aparecerán aquí.':star?'No hay preguntas todavía.':'No hay conversaciones.'}</h2><p>{emptyMeeting?(star?'Escribe arriba lo que necesitas saber. Aquí aparecerán tus preguntas y las respuestas del equipo.':'Las preguntas de los estudiantes aparecerán aquí.'):query||meetingId?'Cambia la reunión o las palabras para encontrar otras preguntas.':filter!=='Todas'?'Puedes cambiar el filtro para ver las demás conversaciones.':star?'Abre el formulario de arriba y escribe lo que necesitas saber.':'Las preguntas de tus reuniones aparecerán aquí.'}</p>{!emptyMeeting&&(query||meetingId||filter!=='Todas')&&<button className="secondary-button" onClick={clear}>Ver todas las preguntas</button>}</div>}
  </section>
}
