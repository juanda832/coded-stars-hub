'use client'
import {ArrowRight,CalendarDays,CheckCircle2,Clock3} from 'lucide-react'
import {coordinationOverview} from '@/lib/coordination-overview'
import {dateText} from '@/lib/meeting-utils'
import type {HubData,Meeting} from '@/lib/types'

export default function CoordinationQueue({data,zone,onMeeting,onAgenda}:{data:HubData;zone:string;onMeeting:(meeting:Meeting)=>void;onAgenda:()=>void}){
 const {scheduled,confirmed,attention}=coordinationOverview(data)
 return <section className="coordination-queue" aria-labelledby="coordination-queue-heading">
  <header className="coordination-queue-heading"><div><span className="section-label">Coordinación</span><h2 id="coordination-queue-heading">Próximos 7 días</h2><p>Reuniones programadas a partir de ahora.</p></div><button className="text-link" onClick={onAgenda}>Ver agenda <ArrowRight size={16}/></button></header>
  <div className="coordination-queue-metrics">
   <div><span>Reuniones</span><strong>{scheduled}</strong></div>
   <div><span>Con Star confirmado</span><strong>{confirmed}<small> / {scheduled}</small></strong></div>
   <div><span>Con pendientes</span><strong>{attention.length}</strong></div>
  </div>
  {attention.length?<div className="coordination-queue-list"><h3>Reuniones que necesitan atención</h3>{attention.slice(0,5).map(({meeting,missing,within24h})=><button className="coordination-queue-row" key={meeting.id} onClick={()=>onMeeting(meeting)}><span className={'queue-date'+(within24h?' queue-soon':'')}><Clock3 size={17}/><small>{within24h?'Próximas 24 h':dateText(meeting.startsAt,zone,{day:'numeric',month:'short'})}</small></span><span className="queue-details"><strong>{meeting.title.replace(/^JDP · /,'')}</strong><small>{missing.join(' · ')}</small></span><ArrowRight size={17}/></button>)}{attention.length>5&&<button className="text-link" onClick={onAgenda}>Ver las {attention.length} reuniones en la agenda <ArrowRight size={16}/></button>}</div>:<div className="queue-empty">{scheduled?<CheckCircle2 size={22}/>:<CalendarDays size={22}/>}<p>{scheduled?'Las reuniones de los próximos 7 días tienen anfitrión, Star y enlace.':'Todavía no hay reuniones programadas para los próximos 7 días.'}</p></div>}
 </section>
}
