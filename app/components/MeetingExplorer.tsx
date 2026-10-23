'use client'
import { useEffect, useState } from 'react'
import { ArrowRight, CalendarDays, ChevronLeft, ChevronRight, Globe2, List, Plus, Search, X } from 'lucide-react'
import type { HubData, Meeting } from '@/lib/types'
import { dayKey, friendlyDay, isActiveMeeting, languageText } from '@/lib/meeting-utils'
import { matchesAgendaFilters, matchesAgendaPeriod, matchesMeetingSearch } from '@/lib/agenda'
import type { AgendaPeriod } from '@/lib/agenda'
import { programName } from '@/lib/program-labels'
import ProgramFilter from './ProgramFilter'

function weekDays(offset:number,zone:string) {
 const today=new Date(dayKey(new Date(),zone)+'T12:00:00Z')
 today.setUTCDate(today.getUTCDate()-((today.getUTCDay()+6)%7)+offset*7)
 return Array.from({length:7},(_,i)=>{const date=new Date(today);date.setUTCDate(date.getUTCDate()+i);return {key:date.toISOString().slice(0,10),short:new Intl.DateTimeFormat('es',{weekday:'short',timeZone:'UTC'}).format(date).replace('.',''),day:date.getUTCDate(),date}})
}
export default function MeetingExplorer({data,zone,renderMeeting,onCreate}:{data:HubData;zone:string;renderMeeting:(m:Meeting)=>React.ReactNode;onCreate:()=>void}) {
 const [view,setView]=useState<'list'|'week'>('list'),[period,setPeriod]=useState<AgendaPeriod>('Próximas')
 const [query,setQuery]=useState(''),[program,setProgram]=useState('Todos'),[language,setLanguage]=useState('Todos'),[openOnly,setOpenOnly]=useState(false)
 const [offset,setOffset]=useState(0),[selectedDay,setSelectedDay]=useState(''),[savedFor,setSavedFor]=useState('')
 const programs=[...new Set(data.meetings.map(m=>m.program))].sort((a,b)=>['Orlando','London','Tokyo'].indexOf(a)-['Orlando','London','Tokyo'].indexOf(b)),preferenceKey='coded-agenda-v1-'+data.user.id,star=data.user.role==='star'
 // Restore once per account. Background data refreshes must never reset an active search.
 useEffect(()=>{
  setProgram('Todos');setLanguage('Todos');setView('list');setOpenOnly(false)
  try {
   const saved=JSON.parse(localStorage.getItem(preferenceKey)||'null')
   if(saved){if(typeof saved.program==='string')setProgram(saved.program);if(['Todos','Español','English','Português'].includes(saved.language))setLanguage(saved.language);if(['list','week'].includes(saved.view))setView(saved.view);if(typeof saved.openOnly==='boolean')setOpenOnly(saved.openOnly)}
  }catch{}
  setSavedFor(preferenceKey)
 },[preferenceKey])
 useEffect(()=>{if(savedFor===preferenceKey)try{localStorage.setItem(preferenceKey,JSON.stringify({program,language,view,openOnly}))}catch{}},[preferenceKey,program,language,view,openOnly,savedFor])
 const days=weekDays(offset,zone),today=dayKey(new Date(),zone),now=Date.now()
 const matchesView=(m:Meeting)=>view==='week'?days.some(d=>d.key===dayKey(new Date(m.startsAt),zone))&&(!selectedDay||dayKey(new Date(m.startsAt),zone)===selectedDay):matchesAgendaPeriod(m,period,zone,now)
 const candidates=data.meetings.filter(m=>matchesAgendaFilters(m,data,{program:'Todos',language,openOnly},now)&&matchesMeetingSearch(m,query)).sort((a,b)=>Date.parse(a.startsAt)-Date.parse(b.startsAt))
 const base=candidates.filter(m=>program==='Todos'||m.program===program),visible=candidates.filter(matchesView),results=base.filter(matchesView)
 const programCounts:Record<string,number>={};for(const meeting of visible)programCounts[meeting.program]=(programCounts[meeting.program]||0)+1
 const grouped=new Map<string,Meeting[]>()
 for(const meeting of results){const key=dayKey(new Date(meeting.startsAt),zone);grouped.set(key,[...(grouped.get(key)||[]),meeting])}
 const activeFilters=program!=='Todos'||language!=='Todos'||openOnly||!!query.trim(),next=base.find(isActiveMeeting)
 const availabilityLabel=star?'Puedo enviar solicitud':'Activas sin Star confirmado'
 function clearFilters(){setProgram('Todos');setLanguage('Todos');setOpenOnly(false);setQuery('')}
 function nextMeetings(){setView('list');setPeriod('Próximas');setSelectedDay('')}
 return <section className="meeting-explorer agenda-v2 agenda-simplified" data-view={view}>
  <div className="page-heading"><div><h1>Reuniones</h1><p>{star?'Busca un colegio o una reunión y solicita participar.':'Agenda y gestión de las JDP.'}</p></div>{data.user.role==='admin'&&<button className="primary" onClick={onCreate}><Plus size={18}/> Crear reunión</button>}</div>
  <ProgramFilter programs={[...programs,...(program!=='Todos'&&!programs.includes(program)?[program]:[])]} selected={program} counts={programCounts} total={visible.length} onSelect={setProgram}/>
  <div className="agenda-controls agenda-controls-visible">
   <div className="agenda-search-row"><label className="explorer-search"><Search size={19}/><input aria-label="Buscar reuniones" placeholder="Busca un colegio, tema o anfitrión…" value={query} onChange={e=>setQuery(e.target.value)}/>{query&&<button aria-label="Limpiar búsqueda" onClick={()=>setQuery('')}><X size={16}/></button>}</label><label className="agenda-language"><Globe2 size={16}/><span className="sr-only">Idioma de la reunión</span><select aria-label="Idioma de la reunión" value={language} onChange={e=>setLanguage(e.target.value)}><option value="Todos">Cualquier idioma</option><option value="Español">Español</option><option value="English">Inglés</option><option value="Português">Portugués</option></select></label><div className="view-switch" aria-label="Vista de reuniones"><button aria-label="Vista de lista" aria-pressed={view==='list'} onClick={()=>setView('list')}><List size={17}/><span>Lista</span></button><button aria-label="Vista semanal" aria-pressed={view==='week'} onClick={()=>setView('week')}><CalendarDays size={17}/><span>Semana</span></button></div></div>
   <div className="agenda-control-bottom"><label className="agenda-open"><input type="checkbox" checked={openOnly} onChange={e=>setOpenOnly(e.target.checked)}/><span>{availabilityLabel}</span></label><span>Las horas se muestran en {zone.split('/').pop()?.replace(/_/g,' ')}</span></div>
  </div>
  {view==='week'?<div className="week-picker"><div className="week-heading"><button className="square-button" aria-label="Semana anterior" onClick={()=>{setOffset(offset-1);setSelectedDay('')}}><ChevronLeft size={18}/></button><h2>{new Intl.DateTimeFormat('es',{day:'numeric',month:'short',timeZone:'UTC'}).format(days[0].date)} — {new Intl.DateTimeFormat('es',{day:'numeric',month:'short',timeZone:'UTC'}).format(days[6].date)}</h2><button className="square-button" aria-label="Semana siguiente" onClick={()=>{setOffset(offset+1);setSelectedDay('')}}><ChevronRight size={18}/></button><button className="text-link" onClick={()=>{setOffset(0);setSelectedDay('')}}>Esta semana</button></div><div className="week-days">{days.map(d=>{const count=base.filter(m=>dayKey(new Date(m.startsAt),zone)===d.key).length;return <button key={d.key} aria-label={`${d.short} ${d.day}, ${count} ${count===1?'reunión':'reuniones'}`} aria-pressed={selectedDay===d.key} aria-current={today===d.key?'date':undefined} className={(today===d.key?'today ':'')+(selectedDay===d.key?'selected':'')} onClick={()=>setSelectedDay(selectedDay===d.key?'':d.key)}><span>{d.short}</span><b>{d.day}</b><small>{count?`${count} JDP`:'—'}</small></button>})}</div></div>:<div className="agenda-periods" aria-label="Periodo de reuniones">{(['Próximas','Hoy','7 días','Todas'] as const).map(value=><button key={value} aria-pressed={period===value} onClick={()=>setPeriod(value)}>{value}</button>)}</div>}
  {activeFilters&&<div className="agenda-selected-filters" aria-label="Filtros activos">{program!=='Todos'&&<button onClick={()=>setProgram('Todos')}>{programName(program)}<X size={12}/><span className="sr-only">Quitar filtro de programa</span></button>}{language!=='Todos'&&<button onClick={()=>setLanguage('Todos')}>{languageText(language)}<X size={12}/><span className="sr-only">Quitar filtro de idioma</span></button>}{openOnly&&<button onClick={()=>setOpenOnly(false)}>{availabilityLabel}<X size={12}/><span className="sr-only">Quitar filtro de disponibilidad</span></button>}{query&&<button onClick={()=>setQuery('')}>“{query}”<X size={12}/><span className="sr-only">Quitar búsqueda</span></button>}<button className="clear-agenda-filters" onClick={clearFilters}>Limpiar filtros</button></div>}
  <div className="results-heading"><span role="status"><b>{results.length}</b> {results.length===1?'encuentro':'encuentros'}{view==='week'&&selectedDay?' en el día seleccionado':''}</span><small><Globe2 size={13}/> Horario en {zone.split('/').pop()?.replace(/_/g,' ')}</small></div>
  {[...grouped].map(([key,meetings])=><section key={key} className="agenda-day-group"><h2><span/>{friendlyDay(meetings[0].startsAt,zone)}<small>{meetings.length} JDP</small></h2><div className="meeting-grid">{meetings.map(renderMeeting)}</div></section>)}
  {!results.length&&<div className="agenda-empty"><span><Search size={29}/></span><h2>{period==='Hoy'&&view==='list'?'Hoy no hay reuniones en esta vista.':'No hay reuniones con estos filtros.'}</h2><p>{next?`La próxima opción con tus filtros es ${friendlyDay(next.startsAt,zone).toLowerCase()}.`:'Cambia el programa, el idioma o las palabras para encontrar otras oportunidades.'}</p><div>{next?<button className="primary" onClick={nextMeetings}>Ver próximas reuniones <ArrowRight size={17}/></button>:<button className="primary" onClick={()=>{clearFilters();nextMeetings()}}>Ver todas las oportunidades <ArrowRight size={17}/></button>}{activeFilters&&next&&<button className="text-link" onClick={clearFilters}>Quitar filtros</button>}</div></div>}
 </section>
}
