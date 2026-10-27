'use client'
import {useId,useState} from 'react'
import {ArrowRight,Check,CheckCircle2,ClipboardList,MessageSquarePlus,ShieldCheck} from 'lucide-react'
import type {HubData,Role} from '@/lib/types'
import type {HubAction} from './StarExperience'

const labels={admin:'Administración',host:'Anfitrión',star:'Coded Star'}
const checklists:Record<Role,string[]>={
 admin:['Crear una JDP con colegio, fecha, hora de Orlando y enlace. Dejar el programa vacío.','Revisar varios solicitantes y confirmar manualmente a uno.','Comprobar que no se puede confirmar a un segundo Star.','Revisar el seguimiento y publicar una novedad para el equipo.'],
 host:['Abrir una reunión propia y revisar la fecha, el horario y las indicaciones.','Ver el Star confirmado, sin acceso a los demás candidatos.','Responder una pregunta y actualizar las indicaciones.','Completar el seguimiento cuando termine la reunión.'],
 star:['Cambiar la zona horaria y encontrar una reunión.','Enviar una solicitud y comprobar que queda en revisión.','Revisar una confirmación y encontrar el enlace de acceso.','Hacer una pregunta y completar el seguimiento después de la reunión.'],
}
export async function openReview(role:Role|'exit',onError:(message:string)=>void) {
 try{
  const response=await fetch('/api/review-session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({role})})
  const result=await response.json();if(!response.ok)throw new Error(result.error)
  window.location.href='/?recorrido='+role+(role==='exit'?'#/revision-beta':'#/inicio')
 }catch(error){onError(error instanceof Error?error.message:'No pudimos cambiar de recorrido.')}
}
export function ReviewBanner({data}:{data:HubData}) {
 const [busy,setBusy]=useState(false),[error,setError]=useState('')
 if(!data.user.reviewer)return null
 async function change(role:Role|'exit'){setBusy(true);setError('');await openReview(role,setError);setBusy(false)}
 return <aside className="review-session-banner" aria-label="Recorrido de prueba"><div><b>Recorrido de prueba · {labels[data.user.role]}</b><p>Datos ficticios separados del Hub. Tu cuenta conserva sus permisos.</p>{error&&<p role="alert">{error}</p>}</div><label><span className="sr-only">Cambiar perfil de prueba</span><select aria-label="Cambiar perfil de prueba" value={data.user.role} disabled={busy} onChange={e=>void change(e.target.value as Role)}>{(['admin','host','star'] as const).map(role=><option value={role} key={role}>{labels[role]}</option>)}</select></label><button className="secondary-button" disabled={busy} onClick={()=>void change('exit')}>Volver a mi cuenta</button></aside>
}
export default function BetaReview({data,busy,error,action,onNavigate}:{data:HubData;busy:boolean;error:string;action:HubAction;onNavigate:(section:string)=>void}) {
 const [tab,setTab]=useState<'guide'|'tests'|'contributions'>('guide'),[role,setRole]=useState<Role>(data.user.role)
 const [checked,setChecked]=useState<string[]>([]),[starting,setStarting]=useState(false),[reviewError,setReviewError]=useState('')
 const [filter,setFilter]=useState('all'),[form,setForm]=useState(()=>({kind:'error',title:'',detail:'',section:'',requestId:crypto.randomUUID()}))
 const id=useId(),contributions=data.betaContributions||[],admin=data.user.role==='admin'
 async function start(profile:Role){setStarting(true);await openReview(profile,setReviewError);setStarting(false)}
 const visible=contributions.filter(item=>filter==='all'||item.status===filter)
 return <>
  <div className="page-heading"><div><h1>Revisión de la beta</h1><p>Probemos el Hub y reunamos los cambios en un solo lugar.</p></div></div>
  <div className="beta-tabs" role="tablist" aria-label="Revisión de la beta">{([['guide','Cómo empezar'],['tests','Qué probar'],['contributions','Errores e ideas']] as const).map(([key,label])=><button role="tab" aria-selected={tab===key} aria-controls={id+'-'+key} id={id+'-tab-'+key} key={key} onClick={()=>setTab(key)}>{label}{key==='contributions'&&contributions.length>0&&<span>{contributions.length}</span>}</button>)}</div>
  <section className="beta-panel" role="tabpanel" id={id+'-'+tab} aria-labelledby={id+'-tab-'+tab}>
   {tab==='guide'&&<>
    <div className="beta-welcome"><span><ClipboardList size={26}/></span><div><h2>Una primera vuelta, sin complicaciones</h2><p>{data.workspace==='team'?'Los recorridos de prueba usan datos ficticios separados del espacio compartido.':'Todos los programas, colegios y estudiantes de esta revisión usan datos ficticios.'}</p></div></div>
    <ol className="beta-guide-steps"><li><b>Entra con tu propio correo.</b><p>Tu acceso es personal. Si el sistema lo pide, verifica tu correo tú misma.</p></li><li><b>Revisa reuniones, solicitudes y mensajes.</b><p>Las fechas se muestran en la zona horaria elegida arriba. Coordinación siempre decide quién participa.</p></li><li><b>Prueba otro perfil en el recorrido.</b><p>Administración puede recorrer los tres roles con ejemplos separados. Puedes cambiar de perfil y volver a tu cuenta en cualquier momento.</p></li><li><b>Deja lo que encuentres en «Errores e ideas».</b><p>Cuenta qué hiciste, qué esperabas y qué ocurrió. No agregues información real de estudiantes.</p></li></ol>
    {admin&&!data.user.reviewer&&!data.accountPolicy?.allowReal&&<div className="beta-review-launch"><h3>Probar los tres perfiles</h3><p>Los cambios de este recorrido se guardan en un espacio de prueba propio. Al cambiar de rol podrás continuar el mismo caso.</p><div>{(['admin','host','star'] as const).map(profile=><button className="secondary-button" disabled={starting||busy} key={profile} onClick={()=>void start(profile)}>{labels[profile]} <ArrowRight size={16}/></button>)}</div>{reviewError&&<p className="error" role="alert">{reviewError}</p>}</div>}
    <div className="beta-mail-note"><ShieldCheck size={20}/><p><b>Avisos dentro del Hub.</b> Las solicitudes, confirmaciones y cambios generan novedades en «Mensajes». Los correos externos están pendientes de configuración y no se envían desde esta beta.</p><button className="text-link" onClick={()=>onNavigate('Mensajes')}>Ver mis avisos <ArrowRight size={15}/></button></div>
    <p className="beta-team-note">Isa puede empezar por reuniones y anfitriones; Ela, por la experiencia Star y los textos. Son sugerencias: ambas pueden elegir qué revisar.</p>
   </>}
   {tab==='tests'&&<>
    <div className="beta-test-heading"><div><h2>Una prueba de principio a fin</h2><p>Prueba en computadora y celular. Estas marcas sirven como lista personal durante esta sesión.</p></div><label>Perfil<select aria-label="Lista de pruebas por perfil" value={role} onChange={e=>setRole(e.target.value as Role)}>{(['admin','host','star'] as const).map(item=><option value={item} key={item}>{labels[item]}</option>)}</select></label></div>
    <div className="beta-checklist">{checklists[role].map((text,index)=>{const key=role+index;return <label key={key} className={checked.includes(key)?'complete':''}><input type="checkbox" checked={checked.includes(key)} onChange={()=>setChecked(items=>items.includes(key)?items.filter(item=>item!==key):[...items,key])}/><span>{text}</span>{checked.includes(key)&&<Check size={18}/>}</label>})}</div>
    <div className="beta-test-footer"><CheckCircle2 size={20}/><p>Si algo falla, anota la sección y los pasos. Vuelve a tu cuenta antes de registrar el aporte.</p><button className="secondary-button" onClick={()=>setTab('contributions')}>Registrar un aporte</button></div>
   </>}
   {tab==='contributions'&&(data.user.reviewer?<div className="beta-return-note"><MessageSquarePlus size={28}/><h2>Guarda tu aporte desde tu cuenta</h2><p>Sal del recorrido con «Volver a mi cuenta». Así el equipo recibirá el reporte con tu nombre y los datos de prueba seguirán separados.</p></div>:<>
    <div className="beta-contribution-layout"><form className="beta-contribution-form" onSubmit={async event=>{event.preventDefault();if(await action({action:'beta_contribution',...form},'Aporte guardado. El equipo podrá revisarlo.'))setForm({kind:'error',title:'',detail:'',section:'',requestId:crypto.randomUUID()})}}><fieldset disabled={busy}><legend>¿Qué encontraste?</legend><label htmlFor={id+'-kind'}>Tipo de aporte</label><select id={id+'-kind'} value={form.kind} onChange={e=>setForm({...form,kind:e.target.value})}><option value="error">Un error</option><option value="suggestion">Una mejora</option><option value="idea">Una idea</option></select><label htmlFor={id+'-title'}>Título</label><input id={id+'-title'} required minLength={4} maxLength={100} value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="Por ejemplo: no encuentro el enlace de mi reunión"/><label htmlFor={id+'-section'}>¿En qué sección? <span>Opcional</span></label><input id={id+'-section'} maxLength={80} value={form.section} onChange={e=>setForm({...form,section:e.target.value})} placeholder="Reuniones, solicitudes, cuenta…"/><label htmlFor={id+'-detail'}>Cuéntanos qué pasó</label><textarea id={id+'-detail'} required minLength={10} maxLength={1500} rows={5} value={form.detail} onChange={e=>setForm({...form,detail:e.target.value})} placeholder="Qué hiciste, qué esperabas y qué apareció. Puedes indicar si usabas celular o computadora."/>{error&&<p className="error" role="alert">{error}</p>}<button className="primary">{busy?'Guardando…':'Guardar aporte'} <MessageSquarePlus size={17}/></button></fieldset></form>
    <div className="beta-contributions"><div className="beta-contributions-heading"><h2>{admin?'Aportes del equipo':'Mis aportes'}</h2><select aria-label="Filtrar aportes" value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">Todos</option><option value="new">Nuevos</option><option value="reviewing">En revisión</option><option value="resolved">Resueltos</option></select></div>{visible.length?visible.map(item=><article key={item.id}><div className="beta-contribution-meta"><span>{{error:'Error',suggestion:'Mejora',idea:'Idea'}[item.kind]}</span><small>{item.authorName} · {labels[item.authorRole]}</small></div><h3>{item.title}</h3>{item.section&&<small>Sección: {item.section}</small>}<p>{item.detail}</p>{admin?<label className="beta-contribution-status">Estado<select aria-label={'Estado de '+item.title} disabled={busy} value={item.status} onChange={e=>void action({action:'beta_review',contributionId:item.id,version:item.version,status:e.target.value},'Estado del aporte actualizado.')}><option value="new">Nuevo</option><option value="reviewing">En revisión</option><option value="resolved">Resuelto</option></select></label>:<span className="beta-own-status">{{new:'Nuevo',reviewing:'En revisión',resolved:'Resuelto'}[item.status]}</span>}</article>):<div className="beta-contributions-empty"><MessageSquarePlus size={26}/><h3>{contributions.length?'Sin aportes con ese estado':'El primer aporte puede ser el tuyo'}</h3><p>Los errores, sugerencias e ideas quedarán aquí para que el equipo los revise.</p></div>}</div></div>
   </>)}
  </section>
 </>
}
