'use client'
import { useState } from 'react'
import { ArrowRight, CalendarDays, Check, MessageCircle, Users } from 'lucide-react'
import { users } from '@/lib/demo-users'
import Brand from './Brand'
import { CommunityArtwork } from './HubArtwork'

export default function AccessScreen({busy,error,onLogin}:{busy:boolean;error:string;onLogin:(email:string,password:string)=>void}) {
 const [email,setEmail]=useState('star@example.com'),[password,setPassword]=useState('Demo2026!')
 const role=users.find(user=>user.email===email)?.role
 return <div className="access-page access-review">
  <section className="access-story"><Brand/><div className="access-story-copy"><h1>Nos vemos<br/>en la próxima JDP.</h1><p>Reuniones, solicitudes y mensajes del equipo CODED.</p><CommunityArtwork className="access-community-art" eager/></div><p className="access-footnote">CODED Stars Hub · Versión para revisión</p></section>
  <section className="access-form-side"><div className="access-card"><div className="access-mobile-brand"><Brand/></div><h2>Entrar al Hub</h2><p>Elige un perfil para revisar la plataforma.</p>
   <div className="access-roles" aria-label="Perfil de demostración">{[
    {mail:'star@example.com',role:'star',label:'Coded Star',text:'Reuniones y solicitudes',icon:CalendarDays},
    {mail:'host@example.com',role:'host',label:'Anfitrión',text:'Participantes e indicaciones',icon:MessageCircle},
    {mail:'isa@example.com',role:'admin',label:'Administración',text:'Reuniones, solicitudes y contenido',icon:Users},
   ].map(({mail,role:optionRole,label,text,icon:Icon})=><button key={mail} aria-pressed={role===optionRole} onClick={()=>setEmail(mail)}><span className="access-role-icon"><Icon size={21}/></span><span><b>{label}</b><small>{text}</small></span>{role===optionRole?<Check size={18}/>:<ArrowRight size={17}/>}</button>)}</div>
   <form onSubmit={event=>{event.preventDefault();onLogin(email,password)}}>{role&&<label className="field-label">Perfil de prueba<select className="input" value={email} onChange={event=>setEmail(event.target.value)}>{users.filter(user=>user.role===role).map(user=><option key={user.id} value={user.email}>{user.name.replace(/ · Demo$/,'')}</option>)}</select></label>}
    <details className="demo-access-details"><summary>Acceso de prueba</summary><label className="field-label">Contraseña<input className="input" type="password" value={password} onChange={event=>setPassword(event.target.value)} autoComplete="off"/></label></details>
    {error&&<p className="error" role="alert">{error}</p>}<button className="primary full" disabled={busy}>{busy?'Entrando…':'Entrar'} <ArrowRight size={18}/></button>
   </form><p className="access-privacy">Versión de revisión con cuentas y datos de ejemplo.</p>
  </div></section>
 </div>
}
