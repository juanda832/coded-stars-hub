'use client'
import {useEffect,useRef,useState} from 'react'
import {CalendarDays,Check,Copy,ExternalLink,Link2,RefreshCw,ShieldCheck,Unplug} from 'lucide-react'
import {personalAccessEnabled} from '@/lib/auth-mode'
import type {User} from '@/lib/types'
import Dialog from './Dialog'

type Connection={connected:boolean;id?:string;version?:number;createdAt?:string;url?:string}
export default function CalendarConnection({user}:{user:User}){
 const [connection,setConnection]=useState<Connection|null>(null),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(''),[copied,setCopied]=useState(false),[confirm,setConfirm]=useState<'rotate'|'revoke'|null>(null)
 const personal=personalAccessEnabled(),alive=useRef(true)
 useEffect(()=>{alive.current=true;return()=>{alive.current=false}},[])
 async function load(signal?:AbortSignal){
  setLoading(true);setError('')
  try{const response=await fetch('/api/calendar/connection',{cache:'no-store',signal:signal?AbortSignal.any([signal,AbortSignal.timeout(20000)]):AbortSignal.timeout(20000)});const result=await response.json();if(!response.ok)throw new Error(result.error);if(alive.current)setConnection(result)}catch(error){if(alive.current&&!(error instanceof DOMException&&error.name==='AbortError'))setError(error instanceof TypeError||error instanceof DOMException?'No pudimos cargar tu calendario. Revisa la conexión e intenta de nuevo.':error instanceof Error?error.message:'No pudimos cargar tu calendario.')}finally{if(alive.current&&!signal?.aborted)setLoading(false)}
 }
 useEffect(()=>{if(user.reviewer||!personal){setLoading(false);return}const controller=new AbortController();void load(controller.signal);return()=>controller.abort()},[user.id,user.role,user.reviewer,personal])
 async function change(action:'create'|'rotate'|'revoke'){
  setBusy(true);setError('');setCopied(false)
  try{const response=await fetch('/api/calendar/connection',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,id:connection?.id,version:connection?.version}),signal:AbortSignal.timeout(20000)});const result=await response.json();if(!response.ok){if(response.status===409){await load();if(alive.current)setConfirm(null);}throw new Error(result.error)}if(alive.current){setConnection(result);setConfirm(null)}}catch(error){if(alive.current)setError(error instanceof TypeError||error instanceof DOMException?'No pudimos confirmar el cambio. Actualiza antes de volver a intentarlo.':(error as Error).message)}finally{if(alive.current)setBusy(false)}
 }
 async function copy(){try{await navigator.clipboard.writeText(connection?.url||'');setCopied(true);setError('')}catch{setError('No pudimos copiarlo. Selecciona el enlace privado y cópialo manualmente.')}}
 const scope=user.role==='star'?'Solo aparecerán las reuniones para las que coordinación te haya confirmado.':user.role==='host'?'Aparecerán únicamente las reuniones que coordinación te haya asignado.':'Aparecerán las reuniones de la agenda de coordinación.'
 return <section className="calendar-connect" id="calendar-connection" aria-busy={busy||loading} aria-labelledby="calendar-connection-heading"><div className="calendar-connect-heading"><span><CalendarDays size={24}/></span><div><h2 id="calendar-connection-heading">Tu agenda en Google Calendar</h2><p>{scope}</p></div>{connection?.connected&&<b><Check size={14}/> Enlace activo</b>}</div>
  {user.reviewer?<p className="calendar-connect-note">Vuelve a tu cuenta habitual para conectar tu agenda. Los recorridos de prueba permanecen separados.</p>:!personal?<p className="calendar-connect-note">Conecta la agenda desde tu cuenta personal en la <a href="https://coded-stars-beta.vercel.app/" target="_blank" rel="noopener noreferrer">beta del Hub</a>.</p>:<>
   {loading?<p className="calendar-connect-note" role="status">Consultando tu conexión…</p>:connection?.connected?<>
    <ol className="calendar-connect-steps"><li><b>1. Copia tu enlace privado</b><p>Google usará este enlace para consultar tus reuniones.</p><div className="calendar-private-link"><input type="password" autoComplete="off" spellCheck={false} readOnly value={connection.url} aria-label="Enlace privado del calendario" onFocus={event=>event.target.select()}/><button className="secondary-button" disabled={busy} onClick={()=>void copy()}>{copied?<Check size={16}/>:<Copy size={16}/>} {copied?'Copiado':'Copiar enlace'}</button></div>{copied&&<small role="status">Enlace copiado. Pégalo en Google Calendar.</small>}</li><li><b>2. Agrégalo en Google Calendar</b><p>Desde una computadora: Configuración → Agregar calendario → Desde URL. Pega el enlace y pulsa «Agregar calendario».</p><a className="primary" href="https://calendar.google.com/calendar/r/settings" target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer">Abrir Google Calendar <ExternalLink size={16}/></a></li></ol>
    <p className="calendar-connect-note"><RefreshCw size={17}/> Google consulta las novedades a su propio ritmo; los cambios pueden tardar en aparecer. Revisa el Hub antes de una JDP.</p>
    <div className="calendar-connect-controls"><button className="text-link" disabled={busy} onClick={()=>{setError('');setConfirm('rotate')}}><RefreshCw size={15}/> Renovar enlace</button><button className="text-link" disabled={busy} onClick={()=>{setError('');setConfirm('revoke')}}><Unplug size={15}/> Desconectar agenda</button></div>
   </>:connection?<div className="calendar-connect-start"><p>Prepara una agenda del Hub que puedes agregar a Google Calendar. No necesitamos leer tus otros calendarios ni tu contraseña de Google.</p><button className="primary" disabled={busy} onClick={()=>void change('create')}><Link2 size={17}/>{busy?'Preparando…':'Preparar mi agenda'}</button><small>Tú decides cuándo agregarla a tu cuenta de Google.</small></div>:null}
   {error&&!confirm&&<div className="calendar-connect-error"><p role="alert">{error}</p><button className="secondary-button" disabled={busy||loading} onClick={()=>void load()}>Volver a comprobar</button></div>}
   <p className="calendar-connect-privacy"><ShieldCheck size={17}/> Tu enlace da acceso a la agenda. Compártelo solo con tu calendario. Los enlaces de Zoom, las solicitudes y los datos de otros participantes se consultan dentro del Hub.</p>
  </>}
  {confirm&&<Dialog title={confirm==='revoke'?'¿Desconectar esta agenda?':'¿Renovar el enlace privado?'} onClose={()=>{if(!busy)setConfirm(null)}} className="calendar-confirm-dialog"><p>{confirm==='revoke'?'El Hub dejará de compartir esta agenda. Para quitar las reuniones que Google ya guardó, elimina también el calendario desde Google Calendar.':'El enlace anterior dejará de funcionar. Tendrás que quitar la agenda anterior en Google y agregarla otra vez con el nuevo enlace.'}</p>{error&&<p className="error" role="alert">{error}</p>}<div><button className="secondary-button" disabled={busy} onClick={()=>setConfirm(null)}>Cancelar</button><button className="primary" disabled={busy} onClick={()=>void change(confirm)}>{busy?'Guardando…':confirm==='revoke'?'Desconectar':'Renovar enlace'}</button></div></Dialog>}
 </section>
}
