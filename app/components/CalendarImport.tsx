'use client'
import {useEffect,useRef,useState} from 'react'
import {ArrowLeft,ArrowRight,CalendarDays,Check,FileUp,Globe2,Link2,ShieldCheck} from 'lucide-react'
import type {User} from '@/lib/types'
import type {ImportCandidate} from '@/lib/calendar-import'
import Dialog from './Dialog'

type Row=ImportCandidate&{token:string;existingMeetingId?:string;selected:boolean;program:string}
type Preview={candidates:Row[];skipped:Record<string,number>}
export default function CalendarImport({hosts,reviewing,onClose,onImported,onMeeting}:{hosts:Pick<User,'id'|'name'>[];reviewing:boolean;onClose:()=>void;onImported:(message:string)=>Promise<void>;onMeeting:(id:string)=>void}){
 const [mode,setMode]=useState<'file'|'url'>('file'),[file,setFile]=useState<File|null>(null),[url,setUrl]=useState(''),[preview,setPreview]=useState<Preview|null>(null),[hostId,setHostId]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('')
 const request=useRef<AbortController|null>(null),alive=useRef(true)
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;request.current?.abort()}},[])
 // Cancel a read when closing; writes remain idempotent by the source event ID.
 function close(){if(busy)return;alive.current=false;request.current?.abort();onClose()}
 async function send(body:Record<string,unknown>){
  const controller=new AbortController();request.current=controller
  const response=await fetch('/api/calendar/import',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.any([controller.signal,AbortSignal.timeout(30000)])})
  const result=await response.json();if(!response.ok)throw new Error(result.error);return result
 }
 async function load(){
  setBusy(true);setError('')
  try{
   if(mode==='file'&&(!file||file.size>500000))throw new Error('Elige un archivo .ics de hasta 500 KB.')
   const result=await send({action:'preview',...(mode==='url'?{url}:{text:await file!.text()})})
   if(alive.current){setPreview({...result,candidates:result.candidates.map((item:ImportCandidate)=>({...item,selected:false,program:''}))});setUrl('');setFile(null)}
  }catch(error){if(alive.current)setError(error instanceof TypeError||error instanceof DOMException?'No pudimos cargar el calendario. Revisa la conexión e intenta de nuevo.':(error as Error).message)}finally{if(alive.current)setBusy(false)}
 }
 function update(key:string,values:Partial<Row>){setPreview(previous=>previous?{...previous,candidates:previous.candidates.map(item=>item.key===key?{...item,...values}:item)}:null)}
 const selected=preview?.candidates.filter(item=>item.selected)||[]
 async function save(){
  setBusy(true);setError('')
  try{const result=await send({action:'commit',hostId,items:selected.map(({token,schoolName,program,date,time,joinUrl})=>({token,schoolName,program,date,time,joinUrl}))});if(alive.current){await onImported(`${result.created} ${result.created===1?'reunión importada':'reuniones importadas'}.${result.duplicates?` ${result.duplicates} ya estaban en el Hub.`:''}`);if(alive.current)onClose()}}
  catch(error){if(alive.current)setError(error instanceof TypeError||error instanceof DOMException?'No pudimos confirmar el resultado. Carga otra vez el calendario antes de volver a importar; las reuniones guardadas no se duplicarán.':(error as Error).message)}finally{if(alive.current)setBusy(false)}
 }
 const skipped=preview?.skipped||{},omitted=Object.values(skipped).reduce((sum,count)=>sum+count,0)
 return <Dialog title={preview?'Revisa las reuniones':'Importar calendario del host'} onClose={close} className="calendar-import-dialog">
  {preview?<form onSubmit={event=>{event.preventDefault();void save()}}>
   <p className="calendar-import-lead">Elige solo las JDP y confirma el nombre del colegio. Todas las fechas y horas de este formulario están en horario de Orlando.</p>
   <p className="calendar-import-zone"><Globe2 size={16}/> Orlando · America/New_York</p>
   {!!omitted&&<details className="calendar-import-omitted"><summary>{omitted} {omitted===1?'evento no incluido':'eventos no incluidos'}</summary><p>{[skipped.past&&`${skipped.past} pasados`,skipped.cancelled&&`${skipped.cancelled} cancelados`,skipped.recurring&&`${skipped.recurring} recurrentes o excepciones`,skipped.invalid&&`${skipped.invalid} sin fecha, hora o zona verificables`,skipped.duplicate&&`${skipped.duplicate} repetidos en el archivo`].filter(Boolean).join(' · ')}.</p>{!!skipped.recurring&&<p>Las series recurrentes necesitan registrarse como reuniones individuales. No se generan fechas automáticamente.</p>}</details>}
   <label className="calendar-import-host">Anfitrión para estas reuniones <span>Opcional</span><select value={hostId} onChange={event=>setHostId(event.target.value)} disabled={busy}><option value="">Sin asignar</option>{hosts.map(host=><option value={host.id} key={host.id}>{host.name.replace(/ · Demo$/,'')}</option>)}</select></label>
   <div className="calendar-import-list">{preview.candidates.map(item=><article key={item.key} className={item.selected?'selected':''}>
    <label className="calendar-import-choice"><input type="checkbox" checked={item.selected} disabled={busy||!!item.existingMeetingId||!item.selected&&selected.length>=20} onChange={event=>update(item.key,{selected:event.target.checked})}/><span><b>{item.schoolName||'Completa el nombre del colegio'}</b><small>{item.date} · {item.time} · Orlando{item.duration!==null?` · ${item.duration} min`:''}</small></span>{item.existingMeetingId&&<span className="calendar-import-existing"><Check size={14}/> Ya está en el Hub</span>}</label>
    {item.existingMeetingId?<button className="text-link" type="button" onClick={()=>{onMeeting(item.existingMeetingId!);close()}}>Revisar reunión existente <ArrowRight size={15}/></button>:item.selected&&<fieldset disabled={busy}>
     <label>Colegio<input required minLength={2} maxLength={160} value={item.schoolName} onChange={event=>update(item.key,{schoolName:event.target.value})}/></label>
     <label>Programa <span>Opcional</span><input maxLength={80} placeholder="Sin indicar" value={item.program} onChange={event=>update(item.key,{program:event.target.value})}/></label>
     <label>Fecha en Orlando<input type="date" required value={item.date} onChange={event=>update(item.key,{date:event.target.value})}/></label>
     <label>Hora en Orlando<input type="time" required value={item.time} onChange={event=>update(item.key,{time:event.target.value})}/></label>
     <label className="calendar-import-link">Enlace de acceso <span>Si fue informado</span><input type="url" maxLength={1000} placeholder="https://…" value={item.joinUrl} onChange={event=>update(item.key,{joinUrl:event.target.value})}/></label>
     {!!item.warnings.length&&<p>{item.warnings.join(' ')}</p>}
    </fieldset>}
   </article>)}{!preview.candidates.length&&<div className="calendar-import-empty"><CalendarDays size={28}/><h3>No hay reuniones futuras para importar</h3><p>Comprueba las fechas o revisa los eventos no incluidos.</p></div>}</div>
   <p className="calendar-import-privacy"><ShieldCheck size={16}/> No se copiarán asistentes, correos ni notas personales. Cada JDP seguirá abierta a solicitudes y coordinación elegirá al Star.</p>
   {error&&<p className="error" role="alert">{error}</p>}
   <div className="calendar-import-actions"><button className="secondary-button" type="button" disabled={busy} onClick={()=>{setPreview(null);setError('')}}><ArrowLeft size={16}/> Otro calendario</button><button className="primary" disabled={busy||!selected.length}>{busy?'Importando…':`Importar ${selected.length} ${selected.length===1?'reunión':'reuniones'}`}<ArrowRight size={16}/></button></div>
  </form>:<>
   <p className="calendar-import-lead">Trae las fechas de Google y revisa los cinco datos de cada JDP antes de guardarla.</p>
   <div className="calendar-import-method" aria-label="Origen del calendario"><button aria-pressed={mode==='file'} onClick={()=>{setMode('file');setError('')}} disabled={busy}><FileUp size={18}/> Archivo .ics</button>{!reviewing&&<button aria-pressed={mode==='url'} onClick={()=>{setMode('url');setError('')}} disabled={busy}><Link2 size={18}/> Enlace de Google</button>}</div>
   <form onSubmit={event=>{event.preventDefault();void load()}}>
    {mode==='file'?<label className="calendar-import-upload"><FileUp size={30}/><b>{file?.name||'Elige el archivo del calendario'}</b><span>Google Calendar → Configuración → Importar y exportar → Exportar. Descomprime el archivo y elige el .ics de JDP.</span><input type="file" accept=".ics,text/calendar" required disabled={busy} onChange={event=>{setError('');setFile(event.target.files?.[0]||null)}}/><small>Hasta 500 KB · Solo datos ficticios durante la beta</small></label>:<label className="calendar-import-url">Dirección iCal de Google Calendar<input type="url" autoComplete="off" required maxLength={2000} placeholder="https://calendar.google.com/calendar/ical/…" disabled={busy} value={url} onChange={event=>setUrl(event.target.value)}/><small>Usa un calendario dedicado a JDP que tengas autorización para consultar. El enlace se usa para esta lectura y no se guarda. No lo pegues en mensajes ni reportes.</small></label>}
    <p className="calendar-import-privacy"><ShieldCheck size={16}/> Primero verás una vista previa. Nada se registra hasta que elijas las reuniones y pulses Importar. Esta importación no modifica Google ni sincroniza cambios automáticamente.</p>
    {error&&<p className="error" role="alert">{error}</p>}
    <div className="calendar-import-actions"><button className="secondary-button" type="button" disabled={busy} onClick={close}>Cancelar</button><button className="primary" disabled={busy}>{busy?'Leyendo calendario…':'Revisar reuniones'}<ArrowRight size={16}/></button></div>
   </form>
  </>}
 </Dialog>
}
