'use client'
import { useState } from 'react'
import { ArrowRight, ClipboardList } from 'lucide-react'
import type { HubData, Meeting } from '@/lib/types'
import { applicationGroups } from '@/lib/application-journey'
import ApplicationCard from './ApplicationCard'
export default function MyApplications({data,zone,onDetails,onPreparation,onQuestion,onReport,onExplore,initialTab='Todas',onViewChange}:{data:HubData;zone:string;onDetails:(m:Meeting)=>void;onPreparation:(m:Meeting)=>void;onQuestion:(m:Meeting)=>void;onReport:(m:Meeting)=>void;onExplore:()=>void;initialTab?:string;onViewChange?:(view:string)=>void}) {
 const [tab,setTab]=useState(initialTab)
 const {active,history,pending,confirmed}=applicationGroups(data)
 const matches=(t:string)=>t==='Todas'?active:t==='En revisión'?pending:t==='Confirmadas'?confirmed:history
 const filtered=matches(tab)
 return <section className="my-applications-v2 applications-refined"><div className="page-heading"><div><h1>Mis solicitudes</h1></div><button className="secondary-button" onClick={onExplore}>Encontrar otra JDP <ArrowRight size={17}/></button></div><div className="application-tabs" aria-label="Estado de mis solicitudes">{['Todas','En revisión','Confirmadas','Historial'].map(t=><button key={t} aria-pressed={tab===t} onClick={()=>{setTab(t);onViewChange?.(t)}}>{t==='Todas'?'En curso':t}<span>{matches(t).length}</span></button>)}</div>
 <p className="applications-view-hint">{tab==='Historial'?'Reuniones finalizadas y solicitudes cerradas.':tab==='Confirmadas'?'Revisa las indicaciones del anfitrión antes de entrar.':'Coordinación te avisará cuando confirme tu participación.'}</p>
 <div className="application-cards">{filtered.map(({meeting,registration})=><ApplicationCard key={meeting.id} meeting={meeting} registration={registration} data={data} zone={zone} onDetails={onDetails} onPreparation={onPreparation} onQuestion={onQuestion} onReport={onReport}/>)}</div>{!filtered.length&&<div className="friendly-empty"><ClipboardList size={27}/><h2>{tab==='Confirmadas'?'No tienes participaciones confirmadas':tab==='En revisión'?'No tienes solicitudes pendientes':tab==='Historial'?'Aún no tienes historial':'No tienes solicitudes en curso'}</h2><p>{tab==='Confirmadas'?'Mientras el equipo revisa las solicitudes, puedes explorar otras reuniones.':'Busca un programa y un horario que te funcionen.'}</p><button className="primary" onClick={onExplore}>Explorar reuniones <ArrowRight size={17}/></button>{tab==='Todas'&&history.length>0&&<button className="text-link" onClick={()=>{setTab('Historial');onViewChange?.('Historial')}}>Ver mi historial <ArrowRight size={16}/></button>}</div>}
 </section>
}
