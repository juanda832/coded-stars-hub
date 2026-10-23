'use client'
import { useId, useState } from 'react'
import { ArrowRight, BookOpen, CalendarPlus, CalendarDays, ClipboardCheck, MessageCircle, Megaphone, SlidersHorizontal, Users } from 'lucide-react'
import type { HubData } from '@/lib/types'

export default function GoalGuide({data,onNavigate,onCreate}:{data:HubData;onNavigate:(section:string,view?:string)=>void;onCreate?:()=>void}) {
 const id=useId(),[selected,setSelected]=useState(()=>data.user.role==='admin'&&data.registrations.some(r=>r.status==='pending'&&data.meetings.some(m=>m.id===r.meetingId&&m.status==='scheduled'&&Date.parse(m.startsAt)>Date.now()))?1:data.user.role==='host'&&data.questions.some(q=>!q.reply)?1:0)
 const goals=data.user.role==='admin'?[
  {label:'Organizar una JDP',icon:CalendarPlus,title:'Abre una oportunidad para una nueva historia.',text:'Elige programa, idioma, horario y anfitrión. Los Stars podrán enviar sus solicitudes.',button:'Crear reunión',section:'Reuniones',create:true},
  {label:'Elegir un Star',icon:Users,title:'Encuentra a la persona adecuada para esta JDP.',text:'Revisa idiomas, disponibilidad y experiencia. Tú decides a quién confirmar para el único lugar.',button:'Revisar solicitudes',section:'Solicitudes'},
  {label:'Compartir una novedad',icon:Megaphone,title:'Un mensaje claro puede acercar al equipo.',text:'Publica una invitación, una recomendación o una novedad para Stars, anfitriones o todo el Hub.',button:'Abrir publicaciones',section:'Publicaciones'},
  {label:'Cerrar el encuentro',icon:ClipboardCheck,title:'Escucha lo que pasó y mejora la próxima JDP.',text:'Revisa las respuestas del Star y del anfitrión, y registra el seguimiento cuando haga falta.',button:'Ver seguimiento',section:'Seguimiento'},
 ]:data.user.role==='host'?[
  {label:'Preparar mi JDP',icon:CalendarDays,title:'Que tu Star sepa qué esperar.',text:'Abre tu reunión, comparte las indicaciones y acuerda cuándo le darás la palabra.',button:'Ver mis reuniones',section:'Reuniones'},
  {label:'Responder una duda',icon:MessageCircle,title:'Una respuesta a tiempo da tranquilidad.',text:'Revisa las preguntas de tus reuniones. Quien preguntó recibirá un aviso con tu respuesta.',button:'Abrir preguntas',section:'Mensajes',view:'Preguntas'},
  {label:'Contar cómo fue',icon:ClipboardCheck,title:'Ayúdanos a cuidar la experiencia.',text:'Después de la reunión, registra lo que ocurrió y si el Star pudo compartir su testimonio.',button:'Registrar resultado',section:'Resultados'},
 ]:[
  {label:'Encontrar una JDP',icon:CalendarDays,title:'Elige un momento que funcione para ti.',text:'Filtra por programa e idioma y revisa la hora en tu zona. Enviar una solicitud toma un momento.',button:'Explorar reuniones',section:'Reuniones'},
  {label:'Preparar mi historia',icon:BookOpen,title:'Tu experiencia, con tus palabras.',text:'Usa las ideas y la lista de preparación para llegar con confianza. No necesitas memorizar un guion.',button:'Abrir mi guía',section:'Preparación'},
  {label:'Resolver una duda',icon:MessageCircle,title:'No tienes que resolverlo a solas.',text:'Pregunta por el idioma, tu turno o cómo será el encuentro. El anfitrión y coordinación pueden ayudarte.',button:'Hacer una pregunta',section:'Mensajes',view:'Preguntas'},
  {label:'Actualizar mi perfil',icon:SlidersHorizontal,title:'Ayuda al equipo a conocerte mejor.',text:'Cuenta tus idiomas, programas y disponibilidad. Coordinación los verá al revisar tu solicitud.',button:'Editar mi perfil',section:'Mi cuenta'},
 ]
 const current=goals[selected]||goals[0],Icon=current.icon
 return <section className="goal-guide" aria-labelledby={id}><div className="goal-guide-heading"><span className="eyebrow">UN PASO A LA VEZ</span><h2 id={id}>¿Qué te gustaría hacer?</h2></div><div className="goal-choices" aria-label="Elige tu objetivo">{goals.map((goal,i)=><button key={goal.label} aria-pressed={selected===i} aria-controls={id+'-answer'} onClick={()=>{setSelected(i);requestAnimationFrame(()=>document.getElementById(id+'-answer')?.scrollIntoView({block:'nearest',behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'}))}}>{goal.label}</button>)}</div><div className="goal-answer" id={id+'-answer'} aria-live="polite" key={current.label}><span className="goal-icon"><Icon size={25}/></span><div><h3>{current.title}</h3><p>{current.text}</p><button className="primary" onClick={()=>{'create' in current&&current.create?onCreate?.():onNavigate(current.section,'view' in current?current.view:undefined)}}>{current.button} <ArrowRight size={17}/></button></div></div><button className="goal-conversation" onClick={()=>onNavigate('Asistente')}><MessageCircle size={16}/><span>¿Prefieres conversarlo? <b>Abrir asistente</b></span><ArrowRight size={15}/></button></section>
}
