'use client'
import {useEffect,useRef,useState} from 'react'
import {ArrowRight,CalendarDays,Search,X} from 'lucide-react'
import type {Meeting} from '@/lib/types'
import {dateText,friendlyDay,isActiveMeeting,meetingMeta} from '@/lib/meeting-utils'
import Dialog from './Dialog'

type Destination={label:string;icon:typeof Search}
const normalize=(value:string)=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es')
const labels:Record<string,string>={Asistente:'Ayuda',Participante:'Participantes confirmados'}
const hints:Record<string,string>={Reuniones:'Agenda, colegios y horarios',Solicitudes:'Revisar candidatos y confirmar',Cuentas:'Stars, anfitriones y accesos',Seguimiento:'Resultados de las JDP',Estadísticas:'Participaciones y resultados',Mensajes:'Preguntas, indicaciones y novedades',Publicaciones:'Noticias y contenido del equipo','Mis solicitudes':'Confirmaciones y solicitudes en revisión',Preparación:'Preparar mi historia','Mi cuenta':'Perfil y Google Calendar','Revisión beta':'Guía y aportes del equipo',Asistente:'Resolver una duda',Participante:'Stars asignados a mis reuniones',Resultados:'Registrar cómo fue la reunión','Mi experiencia':'Contar cómo fue mi JDP'}

export default function QuickFind({destinations,meetings,zone,onNavigate,onMeeting}:{destinations:Destination[];meetings:Meeting[];zone:string;onNavigate:(section:string)=>void;onMeeting:(meeting:Meeting)=>void}){
 const [open,setOpen]=useState(false),[query,setQuery]=useState('')
 const resultsRef=useRef<HTMLDivElement>(null),inputRef=useRef<HTMLInputElement>(null)
 useEffect(()=>{if(open)inputRef.current?.focus()},[open])
 useEffect(()=>{
  function shortcut(event:KeyboardEvent){
   if((event.metaKey||event.ctrlKey)&&!event.altKey&&!event.repeat&&event.key.toLowerCase()==='k'&&!document.querySelector('dialog[open]')){event.preventDefault();setQuery('');setOpen(true)}
  }
  window.addEventListener('keydown',shortcut);return()=>window.removeEventListener('keydown',shortcut)
 },[])
 const terms=normalize(query.trim()).split(/\s+/).filter(Boolean)
 const matches=(value:string)=>terms.every(term=>normalize(value).includes(term))
 // Both lists come from the current role's already-authorized Hub snapshot.
 const shortcuts=destinations.filter(item=>item.label!=='Inicio'&&matches(item.label+' '+(labels[item.label]||'')+' '+(hints[item.label]||'')))
 const sections=terms.length?shortcuts:shortcuts.slice(0,5)
 const found=meetings.filter(meeting=>terms.length?matches([meeting.title,meeting.schoolName,meeting.program,meetingMeta(meeting),meeting.host].filter(Boolean).join(' ')):isActiveMeeting(meeting)).toSorted((a,b)=>Date.parse(a.startsAt)-Date.parse(b.startsAt))
 const visibleMeetings=terms.length?found:found.slice(0,3)
 const count=sections.length+visibleMeetings.length
 function navigate(section:string){setOpen(false);onNavigate(section)}
 function meeting(meeting:Meeting){setOpen(false);onMeeting(meeting)}
 function move(event:React.KeyboardEvent){
  if(event.key==='Escape'){event.preventDefault();event.stopPropagation();setOpen(false);return}
  if(!['ArrowDown','ArrowUp'].includes(event.key))return
  const buttons=Array.from(resultsRef.current?.querySelectorAll<HTMLButtonElement>('button')||[])
  if(!buttons.length)return
  event.preventDefault();const index=buttons.indexOf(document.activeElement as HTMLButtonElement)
  const next=index<0?(event.key==='ArrowDown'?0:buttons.length-1):(index+(event.key==='ArrowDown'?1:-1)+buttons.length)%buttons.length
  buttons[next]?.focus()
 }
 return <>
  <button className="hub-quick-find" aria-label="Buscar en el Hub" aria-haspopup="dialog" aria-keyshortcuts="Control+K Meta+K" title="Buscar en el Hub · Ctrl/⌘ K" onClick={()=>{setQuery('');setOpen(true)}}><Search size={17}/><span>Buscar en el Hub</span><kbd>⌘ / Ctrl K</kbd></button>
  {open&&<Dialog title="¿Qué estás buscando?" onClose={()=>setOpen(false)} className="quick-find-dialog">
   <form className="quick-find-form" onSubmit={event=>{event.preventDefault();if(sections[0])navigate(sections[0].label);else if(visibleMeetings[0])meeting(visibleMeetings[0])}} onKeyDown={move}>
    <label className="quick-find-input"><Search size={21}/><input ref={inputRef} autoFocus type="search" autoComplete="off" aria-label="Buscar una reunión o herramienta" placeholder="Colegio, programa o herramienta…" maxLength={120} value={query} onChange={event=>setQuery(event.target.value)}/>{query&&<button type="button" aria-label="Limpiar búsqueda" onClick={()=>{setQuery('');inputRef.current?.focus()}}><X size={17}/></button>}</label>
    <div className="quick-find-results" ref={resultsRef}>
     {!!sections.length&&<section aria-label="Herramientas"><h3>{terms.length?'Herramientas':'Accesos rápidos'}</h3>{sections.map(({label,icon:Icon})=><button type="button" key={label} onClick={()=>navigate(label)}><span className="quick-result-icon"><Icon size={19}/></span><span><b>{labels[label]||label}</b><small>{hints[label]}</small></span><ArrowRight size={17}/></button>)}</section>}
     {!!visibleMeetings.length&&<section aria-label="Reuniones encontradas"><h3>{terms.length?'Reuniones':'En la agenda'}</h3>{visibleMeetings.map(item=><button type="button" key={item.id} onClick={()=>meeting(item)}><span className="quick-result-icon meeting"><CalendarDays size={19}/></span><span><b>{item.title.replace(/^JDP · /,'')}</b><small>{friendlyDay(item.startsAt,zone)} · {dateText(item.startsAt,zone,{hour:'2-digit',minute:'2-digit'})} · {meetingMeta(item)}</small></span><ArrowRight size={17}/></button>)}</section>}
     {!count&&<div className="quick-find-empty"><Search size={27}/><b>No encontramos coincidencias</b><p>Prueba el nombre del colegio, un programa o «Mi cuenta».</p></div>}
    </div>
    <div className="quick-find-footer"><span role="status" aria-live="polite">{terms.length?`${count} ${count===1?'resultado':'resultados'}`:'Tus herramientas y reuniones'}</span><span><kbd>↑</kbd><kbd>↓</kbd> explorar <kbd>Esc</kbd> cerrar</span></div>
   </form>
  </Dialog>}
 </>
}
