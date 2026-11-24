'use client'
import {ArrowRight,CalendarDays,ClipboardCheck,MessageCircle,Plus,Users} from 'lucide-react'
import type {HubData,Meeting} from '@/lib/types'
import {dateText,isActiveMeeting} from '@/lib/meeting-utils'
import {coordinationOverview} from '@/lib/coordination-overview'

export default function StaffWelcome({data,zone,onCreate,onNavigate,onMeeting}:{data:HubData;zone:string;onCreate:()=>void;onNavigate:(section:string,view?:string)=>void;onMeeting:(meeting:Meeting)=>void}){
 const admin=data.user.role==='admin'
 const upcoming=data.meetings.filter(isActiveMeeting).sort((a,b)=>Date.parse(a.startsAt)-Date.parse(b.startsAt))
 const overview=coordinationOverview(data)
 const urgent=overview.attention.find(item=>item.within24h)
 const questions=data.questions.filter(q=>!q.reply).length
 const next=upcoming[0]
 const task=admin&&urgent?{label:'Revisar reunión pendiente',description:urgent.meeting.title.replace(/^JDP · /,''),run:()=>onMeeting(urgent.meeting),icon:ClipboardCheck}:questions?{label:'Responder preguntas',description:questions===1?'1 pregunta pendiente':questions+' preguntas pendientes',run:()=>onNavigate('Mensajes','Preguntas'),icon:MessageCircle}:next?{label:'Preparar la próxima JDP',description:next.title.replace(/^JDP · /,''),run:()=>onMeeting(next),icon:CalendarDays}:{label:'Consultar agenda',description:'Revisa las reuniones y las próximas fechas.',run:()=>onNavigate('Reuniones'),icon:CalendarDays}
 const Icon=task.icon
 return <section className="staff-welcome-premium" aria-label="Inicio del equipo">
  <div className="staff-welcome-main"><span className="staff-welcome-kicker"><span className="staff-welcome-star" aria-hidden="true">✦</span> CODED STARS · {admin?'COORDINACIÓN':'ANFITRIÓN'}</span><h1>Hola, {data.user.name.split(' ')[0]}.</h1><p>{admin?'Cada reunión conecta una experiencia con una nueva oportunidad. Organiza las JDP y acompaña a los Stars.':'Prepara tus encuentros y acompaña a los Stars que compartirán su experiencia.'}</p><div className="staff-welcome-actions">{admin?<button className="welcome-primary" onClick={onCreate}><Plus size={18}/> Nueva reunión</button>:<button className="welcome-primary" onClick={()=>onNavigate('Reuniones')}><CalendarDays size={18}/> Mis reuniones</button>}<button className="welcome-secondary" onClick={()=>onNavigate(admin?'Solicitudes':'Participante')}><Users size={18}/>{admin?'Solicitudes':'Mi Star'}<ArrowRight size={15}/></button></div></div>
  <div className="staff-welcome-side"><span className="welcome-date"><CalendarDays size={15}/>{dateText(new Date().toISOString(),zone,{weekday:'long',day:'numeric',month:'long'})}</span><button className="welcome-next-action" onClick={task.run}><span className="welcome-next-icon"><Icon size={22}/></span><span><small>Tu siguiente paso</small><b>{task.label}</b><span>{task.description}</span></span><ArrowRight size={18}/></button></div>
 </section>
}
