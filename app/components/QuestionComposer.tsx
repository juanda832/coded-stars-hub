'use client'

import { useRef, useState } from 'react'
import { Check, ChevronRight, MessageCircle, Send } from 'lucide-react'
import type { HubData, Meeting } from '@/lib/types'
import type { AssistantDraft } from '@/lib/assistant-types'
import { dateText, isActiveMeeting } from '@/lib/meeting-utils'
import { messageDraftKey } from '@/lib/question-inbox'
import type { HubAction } from './StarExperience'
import DraftSuggestions from './DraftSuggestions'
import useMessageDraft from './useMessageDraft'

const prompts=[
  {label:'Mi turno para hablar',text:'¿En qué momento podré compartir mi experiencia y cuánto tiempo tendré?'},
  {label:'Cómo prepararme',text:'¿Qué me recomiendas preparar antes de esta JDP?'},
  {label:'Idioma del encuentro',text:'¿En qué idioma compartiré mi experiencia? ¿Habrá apoyo si lo necesito?'},
]
function QuestionDraftForm({meeting,userId,busy,action,initialText,onQuestionSent}:{meeting:Meeting;userId:string;busy:boolean;action:HubAction;initialText:string;onQuestionSent:()=>void}) {
  const draft=useMessageDraft(messageDraftKey(userId,'question',meeting.id),initialText),input=useRef<HTMLTextAreaElement>(null)
  const [sent,setSent]=useState(false)
  function useIdea(text:string){draft.update(text);setSent(false);requestAnimationFrame(()=>input.current?.focus())}
  return <form className="question-draft-form" onSubmit={async event=>{
    event.preventDefault()
    if(await action({action:'ask',meetingId:meeting.id,text:draft.text},'Pregunta enviada. El anfitrión recibió tu aviso.')){draft.clear();setSent(true);onQuestionSent()}
  }}>
    <DraftSuggestions suggestions={prompts} text={draft.text} disabled={!draft.ready||busy} onUse={useIdea}/>
    <label className="field-label" htmlFor="quick-question">Tu pregunta</label>
    <textarea ref={input} id="quick-question" value={draft.text} onChange={event=>{draft.update(event.target.value);setSent(false)}} disabled={!draft.ready||busy} required minLength={5} maxLength={500} placeholder="Escribe con tus palabras lo que necesitas saber…" aria-describedby="quick-question-save"/>
    <div className="message-draft-meta"><span id="quick-question-save" role="status">{draft.status}</span><span>{draft.text.length}/500</span></div>
    <div className="question-send-row"><p className="subtle-copy">Solo la verán el anfitrión y coordinación.</p><button className="primary" disabled={busy||!draft.ready||draft.text.trim().length<5}>Enviar pregunta <Send size={16}/></button></div>
    {sent&&<p className="inline-success" role="status"><Check size={17}/> Tu pregunta ya llegó al equipo.</p>}
  </form>
}
export default function QuestionComposer({data,zone,busy,action,initialQuestion,onQuestionSent,initialMeetingId=''}:{initialMeetingId?:string;data:HubData;zone:string;busy:boolean;action:HubAction;initialQuestion?:AssistantDraft;onQuestionSent:(meetingId:string)=>void}) {
  const meetings=data.meetings.filter(isActiveMeeting).sort((a,b)=>Date.parse(a.startsAt)-Date.parse(b.startsAt))
  const [meetingId,setMeetingId]=useState(()=>meetings.find(meeting=>meeting.id===(initialQuestion?.meetingId||initialMeetingId))?.id||meetings.find(meeting=>data.registrations.some(registration=>registration.meetingId===meeting.id&&['pending','confirmed'].includes(registration.status)))?.id||meetings[0]?.id||'')
  const selected=meetings.find(meeting=>meeting.id===meetingId)
  return <details className="quick-question question-composer question-composer-refined" open={initialQuestion?true:undefined}>
    <summary><MessageCircle size={18}/><span>Hacer una pregunta al equipo<small>El anfitrión y coordinación pueden ayudarte.</small></span><ChevronRight size={17}/></summary>
    {meetings.length?<div className="question-composer-inner"><label className="field-label">Sobre qué reunión<select className="input" value={meetingId} disabled={busy} onChange={event=>setMeetingId(event.target.value)}>{!selected&&<option value="">Elige una reunión activa</option>}{meetings.map(meeting=><option key={meeting.id} value={meeting.id}>{meeting.title.replace(/^JDP · /,'')} · {dateText(meeting.startsAt,zone,{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</option>)}</select></label>{selected?<><p className="question-recipient">{selected.host?<>La recibirá <b>{selected.host}</b> y coordinación.</>:<>La recibirá coordinación.</>} Horario en {zone.split('/').pop()?.replace(/_/g,' ')}.</p><QuestionDraftForm key={data.user.id+':'+selected.id+':'+(initialQuestion?.meetingId===selected.id?initialQuestion.key:'')} meeting={selected} userId={data.user.id} busy={busy} action={action} initialText={initialQuestion?.meetingId===selected.id?initialQuestion.text:''} onQuestionSent={()=>onQuestionSent(selected.id)}/></>:<p className="question-no-meetings">La reunión que estabas viendo ya no recibe preguntas. Elige otra para escribir al equipo.</p>}</div>:<div className="question-no-meetings"><p>Cuando haya una próxima JDP, podrás elegirla y hacer tu pregunta aquí.</p></div>}
  </details>
}
