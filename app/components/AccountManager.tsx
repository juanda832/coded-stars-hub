'use client'
import { useId, useState } from 'react'
import { ArrowRight, Check, Copy, LockKeyhole, Pause, Play, Plus, Search, ShieldCheck, Users } from 'lucide-react'
import type { AccountPolicy, HubData, ManagedAccount } from '@/lib/types'
import type { HubAction } from './StarExperience'
import Dialog from './Dialog'

const roleLabel={star:'Coded Star',host:'Anfitrión',admin:'Administración'}
function AccountForm({policy,busy,error,action,onClose}:{policy:AccountPolicy;busy:boolean;error:string;action:HubAction;onClose:()=>void}) {
 const id=useId()
 const [form,setForm]=useState(()=>({name:'',email:'',role:'star',requestId:crypto.randomUUID()}))
 const [review,setReview]=useState(false)
 return <Dialog title={review?'Revisar acceso':'Nuevo acceso'} onClose={()=>{if(!busy)onClose()}} className="account-editor">
  <p className="account-editor-intro">{review?'Comprueba los datos antes de guardar.':'Tres datos para preparar su espacio en el Hub.'}</p>
  <form onSubmit={async event=>{event.preventDefault();if(!review){setReview(true);return}if(await action({action:'account_create',...form},policy.personal?'Acceso preparado. La persona deberá verificar su correo al entrar.':'Perfil de prueba creado.'))onClose()}}>
   <fieldset disabled={busy}>
    {review?<div className="account-review"><span className="avatar">{form.name.trim().split(/\s+/).slice(0,2).map(part=>Array.from(part)[0]).join('').toUpperCase()}</span><h3>{form.name}</h3><p>{form.email}</p><span>{roleLabel[form.role as 'star'|'host']}</span></div>:<>
     <label htmlFor={id+'-name'}>Nombre</label><input id={id+'-name'} autoComplete="off" required minLength={2} maxLength={80} value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Nombre y apellido"/>
     <label htmlFor={id+'-email'}>Correo electrónico</label><input id={id+'-email'} type="email" autoComplete="off" required maxLength={254} value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder={policy.allowReal?'nombre@correo.com':'nombre@example.com'} aria-describedby={id+'-privacy'}/>
     <fieldset className="account-role-choices"><legend>Tipo de cuenta</legend>{(['star','host'] as const).map(role=><label key={role} className={form.role===role?'selected':''}><input type="radio" name={id+'-role'} value={role} checked={form.role===role} onChange={()=>setForm({...form,role})}/><span><b>{roleLabel[role]}</b><small>{role==='star'?'Solicita participar y comparte su experiencia.':'Consulta sus reuniones y el Star asignado.'}</small></span></label>)}</fieldset>
    </>}
    <p className="account-form-note" id={id+'-privacy'}><ShieldCheck size={18}/><span>{!policy.allowReal?'Para esta revisión, usa nombres ficticios y correos @example.com. El uso de datos reales se habilitará con coordinación.':policy.personal?'Registra únicamente personas autorizadas. El correo queda visible solo para administración.':'Este perfil se guardará en la demostración local.'}</span></p>
    {review&&<p className="account-form-detail">{policy.personal?policy.allowReal?'No se enviará ningún correo ni se creará una contraseña compartida. Entrará con este correo y deberá verificar que le pertenece.':'Este acceso es ficticio. Los buzones @example.com no reciben códigos; usa los recorridos de «Revisión beta» para probar los perfiles.':'Podrás entrar desde la demostración con este correo y la contraseña de prueba.'}</p>}
    {error&&<p className="error" role="alert">{error}</p>}
    <div className="account-editor-actions"><button type="button" className="secondary-button" onClick={()=>review?setReview(false):onClose()}>{review?'Corregir datos':'Cancelar'}</button><button className="primary">{busy?'Preparando…':review?'Preparar acceso':<>Revisar <ArrowRight size={17}/></>}</button></div>
   </fieldset>
  </form>
 </Dialog>
}

function accountStatus(account:ManagedAccount,personal:boolean) {
 if(account.access==='paused')return {label:'Pausado',className:'paused'}
 if(account.provisioning==='pending')return {label:'Falta completar',className:'pending'}
 if(!personal)return {label:'Perfil de prueba',className:'ready'}
 return account.lastSeenAt?{label:'Ya ingresó',className:'ready'}:{label:'Pendiente de primer acceso',className:'waiting'}
}
export default function AccountManager({data,busy,error,action,onClearError}:{data:HubData;busy:boolean;error:string;action:HubAction;onClearError:()=>void}) {
 const [search,setSearch]=useState(''),[filter,setFilter]=useState('all'),[creating,setCreating]=useState(false)
 const [changing,setChanging]=useState<ManagedAccount|null>(null),[copied,setCopied]=useState(''),[copyError,setCopyError]=useState('')
 const policy=data.accountPolicy||{personal:false,allowReal:false},accounts=data.accounts||[]
 const normalized=search.trim().toLocaleLowerCase('es')
 const visible=accounts.filter(account=>(filter==='all'||filter==='paused'?filter!=='paused'||account.access==='paused':account.role===filter)&&(!normalized||(account.name+' '+account.email).toLocaleLowerCase('es').includes(normalized)))
 const administrators=data.team.filter(user=>user.role==='admin'&&(!policy.personal||['admin-isa','admin-ela','admin-owner'].includes(user.id)))
 const startCreate=()=>{onClearError();setCreating(true)}
 async function copyAccess(id:string){setCopyError('');try{await navigator.clipboard.writeText(window.location.origin+'/');setCopied(id)}catch{setCopyError('No pudimos copiar el enlace. Puedes copiar la dirección de esta página desde el navegador.')}}
 return <>
  <div className="page-heading"><div><h1>Cuentas</h1><p>Un acceso propio para cada persona.</p></div><button className="primary" onClick={startCreate} disabled={busy}><Plus size={18}/> Nuevo acceso</button></div>
  <section className="account-management-intro"><div className="account-intro-icon"><Users size={25}/></div><div><h2>Tu equipo, en un mismo lugar</h2><p>Prepara cuentas de Stars y anfitriones. Cada persona verá las herramientas que le corresponden.</p></div><span><LockKeyhole size={15}/> Solo administración</span></section>
  {error&&!creating&&!changing&&<p className="error" role="alert">{error}</p>}
  <section className="managed-directory" aria-label="Accesos de Stars y anfitriones">
   <div className="directory-heading"><h2>Stars y anfitriones <span>{accounts.length}</span></h2><p>{policy.allowReal?'Los correos de este directorio son privados.':'La beta admite altas con datos ficticios @example.com.'}</p></div>
   <div className="directory-tools"><label className="directory-search"><Search size={18}/><input aria-label="Buscar una cuenta" placeholder="Buscar por nombre o correo" value={search} onChange={e=>setSearch(e.target.value)}/></label><label className="directory-filter"><span>Mostrar</span><select aria-label="Filtrar cuentas" value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">Todas las cuentas</option><option value="star">Coded Stars</option><option value="host">Anfitriones</option><option value="paused">Accesos pausados</option></select></label></div>
   {visible.length?<div className="managed-account-list">{visible.map(account=>{const status=accountStatus(account,policy.personal);return <article className="managed-account" key={account.id}><span className="avatar">{account.initials}</span><div className="managed-account-person"><h3>{account.name}</h3><p>{account.email}</p><span>{roleLabel[account.role]}</span></div><div className="managed-account-state"><span className={'account-state '+status.className}>{status.label}</span><small>{account.access==='paused'?'Su historial se conserva.':account.provisioning==='pending'?'El alta está guardada.':policy.personal?'Acceso individual, sin contraseña compartida.':'Disponible en la demostración local.'}</small></div><div className="managed-account-actions">{account.provisioning==='pending'?<button className="secondary-button" disabled={busy} onClick={()=>void action({action:'account_complete',accountId:account.id},'Acceso preparado.')}>Completar alta</button>:account.access==='active'?<button className="secondary-button" onClick={()=>void copyAccess(account.id)}>{copied===account.id?<Check size={15}/>:<Copy size={15}/>} {copied===account.id?'Enlace copiado':'Copiar acceso'}</button>:null}<button className="account-pause-button" disabled={busy} onClick={()=>{onClearError();setChanging(account)}} aria-label={`${account.access==='active'?'Pausar':'Reactivar'} acceso de ${account.name}`}>{account.access==='active'?<Pause size={16}/>:<Play size={16}/>} {account.access==='active'?'Pausar':'Reactivar'}</button></div></article>})}</div>:<div className="directory-empty"><Users size={30}/><h3>{accounts.length?'No encontramos esa cuenta':'Prepara el primer acceso'}</h3><p>{accounts.length?'Prueba otro nombre o cambia el filtro.':'Agrega un Star o anfitrión para revisar su espacio en el Hub.'}</p><button className="secondary-button" onClick={()=>{if(accounts.length){setSearch('');setFilter('all')}else startCreate()}}>{accounts.length?'Limpiar búsqueda':'Agregar una cuenta de prueba'}</button></div>}
   {copyError&&<p className="error" role="alert">{copyError}</p>}
   {copied&&<p className="directory-copy-note" role="status">Enlace copiado. No se ha enviado ningún mensaje.</p>}
  </section>
  <section className="directory-admins"><div><h2>Administración</h2><p>Los permisos de administración se gestionan por separado.</p></div>{administrators.map(user=><article key={user.id}><span className="avatar">{user.initials}</span><div><b>{user.name.replace(/ · Demo$/,'')}</b><small>{user.email}</small></div><ShieldCheck size={19}/></article>)}</section>
  <p className="directory-footnote">Pausar un acceso impide entrar al Hub y conserva sus reuniones y solicitudes. No cancela ni reasigna participaciones.</p>
  {creating&&<AccountForm policy={policy} busy={busy} error={error} action={action} onClose={()=>{setCreating(false);onClearError()}}/>}
  {changing&&<Dialog title={changing.access==='active'?'¿Pausar este acceso?':'¿Reactivar este acceso?'} onClose={()=>{if(!busy)setChanging(null)}} className="account-editor"><div className="account-change-person"><span className="avatar">{changing.initials}</span><div><b>{changing.name}</b><p>{changing.email}</p></div></div><p className="account-form-detail">{changing.access==='active'?'No podrá consultar ni modificar el Hub. Sus solicitudes y asignaciones se conservarán para que coordinación las revise.':'Podrá volver a entrar con los mismos permisos. Las participaciones seguirán como estaban.'}</p>{error&&<p className="error" role="alert">{error}</p>}<div className="account-editor-actions"><button className="secondary-button" disabled={busy} onClick={()=>setChanging(null)}>Cancelar</button><button className="primary" disabled={busy} onClick={async()=>{if(await action({action:'account_access',accountId:changing.id,version:changing.version,access:changing.access==='active'?'paused':'active'},changing.access==='active'?'Acceso pausado. Su historial se conserva.':'Acceso reactivado.'))setChanging(null)}}>{busy?'Guardando…':changing.access==='active'?'Pausar acceso':'Reactivar acceso'}</button></div></Dialog>}
 </>
}
