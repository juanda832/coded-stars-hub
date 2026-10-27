'use client'
import { useEffect, useState } from 'react'
import { Check, Info, Save } from 'lucide-react'
import type { Meeting, HubData } from '@/lib/types'
import { localDateTime, ORLANDO_ZONE, zoneChoices, zonedDateTime } from '@/lib/time-zones'
import { programValue } from '@/lib/program-labels'
import { meetingEditorDraftKey, restoreMeetingEditorDraft, type MeetingEditorValues } from '@/lib/meeting-editor-draft'
import type { HubAction } from './StarExperience'
import Dialog from './Dialog'
import MeetingEditorPreview from './MeetingEditorPreview'

export default function MeetingEditor({meeting,hosts,userId,zone,busy,error,action,onClose}:{meeting?:Meeting;hosts:HubData['hosts'];userId:string;zone:string;busy:boolean;error:string;action:HubAction;onClose:()=>void}) {
 const [initial]=useState<MeetingEditorValues>(()=>({schoolName:meeting?.schoolName||'',title:meeting?.title||'',description:meeting?.description||'',program:meeting?.program||'',language:meeting?.language||'',duration:meeting?.duration??null,timeZone:ORLANDO_ZONE,date:meeting?localDateTime(meeting.startsAt,ORLANDO_ZONE):'',hostId:meeting?.hostId||'',hostNote:meeting?.hostNote||'',joinUrl:meeting?.joinUrl||''}))
 const [hostIds]=useState(()=>hosts.map(host=>host.id))
 const [form,setForm]=useState(initial),[validation,setValidation]=useState(''),[ready,setReady]=useState(!!meeting),[draftStatus,setDraftStatus]=useState('Abriendo el borrador…')
 const storageKey=meeting?null:meetingEditorDraftKey(userId)
 useEffect(()=>{
  if(!storageKey)return
  try {
   const restored=restoreMeetingEditorDraft(localStorage.getItem(storageKey),hostIds,zoneChoices.map(([value])=>value))
   setForm(restored||initial)
   setDraftStatus(restored?'Borrador recuperado. Revisa los datos del calendario.':'El borrador se guarda en este navegador.')
  }catch{setDraftStatus('No se pudo recuperar el borrador. Puedes completar el formulario.')}
  setReady(true)
 },[storageKey,hostIds,initial])
 function update(patch:Partial<MeetingEditorValues>) {
  const next={...form,...patch};setForm(next);setValidation('')
  if(storageKey&&ready)try{localStorage.setItem(storageKey,JSON.stringify({version:2,...next}));setDraftStatus('Borrador guardado en este navegador.')}catch{setDraftStatus('No se pudo guardar el borrador. Copia los datos antes de cerrar.')}
 }
 let startsAt:string|undefined,dateError=''
 try{if(form.date.length===16)startsAt=zonedDateTime(form.date,ORLANDO_ZONE)}catch(error){dateError=(error as Error).message}
 const [date='',time='']=form.date.split('T')
 async function submit(event:React.FormEvent) {
  event.preventDefault();setValidation('')
  try {
   zonedDateTime(form.date,ORLANDO_ZONE)
   if(await action({action:meeting?'meeting_edit':'create',meetingId:meeting?.id,schoolName:form.schoolName,...(meeting?{title:meeting.title}:{}),description:form.description,program:form.program,language:form.language,duration:form.duration,date,time,sourceTimeZone:ORLANDO_ZONE,joinUrl:form.joinUrl,hostNote:form.hostNote,hostId:form.hostId},meeting?'JDP actualizada. Avisamos a las personas vinculadas.':'JDP registrada. Ya aparece en la agenda.')){
    if(storageKey)try{localStorage.removeItem(storageKey)}catch{}
    onClose()
   }
  }catch(error){setValidation((error as Error).message)}
 }
 return <Dialog title={meeting?'Editar JDP':'Registrar JDP'} onClose={onClose} className="meeting-editor quick-meeting-editor">
  <p className="dialog-lead">Copia los datos que compartió el anfitrión en su calendario.</p>
  <form onSubmit={submit}><fieldset disabled={busy||!ready}>
   <label className="field-label" htmlFor="edit-school">Nombre del colegio</label><input id="edit-school" className="input" required={!meeting||!!meeting.schoolName} minLength={2} maxLength={160} value={form.schoolName} onChange={e=>update({schoolName:e.target.value})} placeholder="Tal como aparece en el calendario"/>
   {meeting&&!meeting.schoolName&&<p className="subtle-copy">Este registro anterior se llama «{meeting.title}» y no tiene colegio informado. Complétalo solo si conoces el dato.</p>}
   <label className="field-label" htmlFor="edit-program">Programa <span>Opcional</span></label><input id="edit-program" className="input" list="jdp-program-options" maxLength={80} value={form.program==='London'?'Europa':form.program==='Tokyo'?'Tokio':form.program} onChange={e=>update({program:programValue(e.target.value)})} placeholder="Sin indicar"/><datalist id="jdp-program-options"><option value="Orlando"/><option value="Europa"/><option value="Tokio"/></datalist>
   <div className="editor-columns quick-date-fields"><label className="field-label" htmlFor="edit-date">Fecha<input id="edit-date" className="input" type="date" required value={date} onChange={e=>update({date:e.target.value+'T'+time})}/></label><label className="field-label" htmlFor="edit-time">Hora de Orlando<input id="edit-time" className="input" type="time" required value={time} onChange={e=>update({date:date+'T'+e.target.value})} aria-invalid={!!dateError} aria-describedby="original-zone"/></label></div>
   <p id="original-zone" className="quick-zone-note">Horario original de Orlando · America/New_York. El cambio de horario de verano se aplica automáticamente.</p>
   {dateError&&<p className="error" role="alert">{dateError}</p>}
   <label className="field-label" htmlFor="edit-link">Enlace de acceso</label><input id="edit-link" className="input" type="url" value={form.joinUrl} onChange={e=>update({joinUrl:e.target.value})} placeholder="https://…"/><p className="subtle-copy">Zoom u otro enlace HTTPS. Puedes añadirlo después. Visible solo para el Star confirmado y el equipo autorizado.</p>
   <details className="quick-coordination-options"><summary>Opciones de coordinación <span>Opcional</span></summary>
    <label className="field-label">Idioma requerido<select className="input" value={form.language} onChange={e=>update({language:e.target.value as Meeting['language']})}><option value="">Sin configurar</option><option value="Español">Español</option><option value="English">Inglés</option><option value="Português">Portugués</option></select></label>
    <label className="field-label">Anfitrión responsable<select className="input" value={form.hostId} onChange={e=>update({hostId:e.target.value})}><option value="">Sin asignar</option>{hosts.map(host=><option key={host.id} value={host.id}>{host.name}</option>)}</select></label><p className="subtle-copy">Asígnalo cuando sepas quién es. Solo esa cuenta de anfitrión podrá ver y gestionar esta JDP.</p>
    <label className="field-label">Duración, si está informada<select className="input" value={form.duration??''} onChange={e=>update({duration:e.target.value?Number(e.target.value):null})}><option value="">Sin informar</option>{[...new Set([15,30,45,60,90,120,180,...(form.duration?[form.duration]:[])])].sort((a,b)=>a-b).map(value=><option key={value} value={value}>{value} minutos</option>)}</select></label>
    <label className="field-label" htmlFor="edit-description">Descripción</label><textarea id="edit-description" minLength={10} maxLength={600} value={form.description} onChange={e=>update({description:e.target.value})} placeholder="Solo si hay información adicional."/>
    <label className="field-label" htmlFor="edit-note">Indicaciones para el Star</label><textarea id="edit-note" maxLength={400} value={form.hostNote} onChange={e=>update({hostNote:e.target.value})}/>
    <details className="quick-preview"><summary>Ver cómo se mostrará</summary><MeetingEditorPreview form={form} startsAt={startsAt} hostName={hosts.find(host=>host.id===form.hostId)?.name||''}/></details>
   </details>
   <div className="meeting-editor-footer"><p className="editor-selection-note"><Info size={16}/>Varias solicitudes, un único Star elegido manualmente por coordinación.</p>{(validation||error)&&<p className="error" role="alert">{validation||error}</p>}<div className="editor-submit-row">{!meeting&&<span className="editor-draft-status" role="status"><Save size={15}/>{draftStatus}</span>}<button className="primary" disabled={busy||!ready||!!dateError}>{busy?'Guardando…':meeting?'Guardar cambios':'Registrar JDP'} <Check size={17}/></button></div></div>
  </fieldset></form>
 </Dialog>
}
