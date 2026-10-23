'use client'
import { meetingMeta } from '@/lib/meeting-utils'
import { useState } from 'react'
import { Check, ChevronRight, Clock3, Globe2, MapPin, Search, ShieldCheck, Users, X } from 'lucide-react'
import type { ApplicationStatus, HubData, StarProfile } from '@/lib/types'
import type { HubAction } from './StarExperience'
import { applicationLabels } from '@/lib/application-labels'
import { candidateReview, reviewMeetingState } from '@/lib/candidate-review'
import { dateText, isActiveMeeting, languageText } from '@/lib/meeting-utils'
import { programName } from '@/lib/program-labels'
import Dialog from './Dialog'
import { ProgramArtwork } from './HubArtwork'
import MeetingSchedule from './MeetingSchedule'

function CriteriaEditor({meetingId,text,busy,action}:{meetingId:string;text:string;busy:boolean;action:HubAction}) {
  const [value,setValue]=useState(text)
  const changed=value.trim()!==text
  return <details className="criteria-block"><summary><ShieldCheck size={16}/> Criterios internos de esta reunión <ChevronRight size={16}/></summary>
    <form className="criteria-editor" onSubmit={async event=>{event.preventDefault();if(await action({action:'criteria',meetingId,text:value},'Criterios internos guardados.'))setValue(value.trim())}}>
      <label htmlFor="selection-criteria">Qué necesita considerar el equipo</label>
      <p>Solo visible para administración.</p>
      <textarea id="selection-criteria" value={value} maxLength={2000} placeholder="Idioma, disponibilidad u otros criterios del equipo." onChange={event=>setValue(event.target.value)}/>
      <div className="criteria-save-row"><span>{changed?'Cambios sin guardar':'Criterios guardados'} · {value.length}/2000</span><button className="secondary-button" disabled={busy||!changed}>{busy?'Guardando…':'Guardar criterios'} <Check size={16}/></button></div>
    </form>
  </details>
}

export default function ApplicationManager({data,busy,error,action,zone,initialMeetingId=''}:{initialMeetingId?:string;data:HubData;busy:boolean;error:string;action:HubAction;zone:string}) {
  const activeMeetings=data.meetings.filter(isActiveMeeting).sort((a,b)=>Date.parse(a.startsAt)-Date.parse(b.startsAt))
  const pendingMeetings=activeMeetings.filter(meeting=>data.registrations.some(item=>item.meetingId===meeting.id&&item.status==='pending')&&!data.registrations.some(item=>item.meetingId===meeting.id&&item.status==='confirmed'))
  const pendingIds=new Set(pendingMeetings.map(meeting=>meeting.id))
  const meetingGroups=[{label:'Solicitudes pendientes',meetings:pendingMeetings},{label:'Otras reuniones próximas',meetings:activeMeetings.filter(meeting=>!pendingIds.has(meeting.id))},{label:'Historial',meetings:data.meetings.filter(meeting=>!isActiveMeeting(meeting)).sort((a,b)=>Date.parse(b.startsAt)-Date.parse(a.startsAt))}]
  const [meetingId,setMeetingId]=useState(initialMeetingId||pendingMeetings[0]?.id||activeMeetings[0]?.id||data.meetings[0]?.id||'')
  const [language,setLanguage]=useState(''),[program,setProgram]=useState(''),[status,setStatus]=useState<ApplicationStatus|''>(''),[query,setQuery]=useState('')
  const [profileView,setProfileView]=useState<StarProfile|null>(null),[selectedUserId,setSelectedUserId]=useState('')
  const meeting=data.meetings.find(item=>item.id===meetingId)
  const applications=data.registrations.filter(item=>item.meetingId===meetingId)
  const state=meeting?reviewMeetingState(meeting,applications):null
  const assignedName=data.candidates.find(profile=>profile.userId===state?.confirmed?.userId)?.name||'El Star seleccionado'
  const {rows,counts}=candidateReview(applications,data.candidates,{language,program,status,query})
  const selectedProfile=data.candidates.find(profile=>profile.userId===selectedUserId)
  const selectedApplication=applications.find(application=>application.userId===selectedUserId)
  const validSelection=state?.canSelect&&selectedApplication?.status==='pending'
  const filtered=!!(query||language||program||status)
  const registrationLabel=(value:ApplicationStatus)=>value==='pending'&&state&&!state.active?'Sin confirmar':applicationLabels[value]
  function resetFilters(){setLanguage('');setProgram('');setStatus('');setQuery('')}
  function changeMeeting(id:string){setMeetingId(id);setSelectedUserId('');setProfileView(null);resetFilters()}
  function choose(profile:StarProfile){setProfileView(null);setSelectedUserId(profile.userId)}
  const profileApplication=applications.find(application=>application.userId===profileView?.userId)
  return <div className="application-manager review-refined">

    <label className="meeting-select-secondary">Reunión<select aria-label="Reunión que quieres revisar" value={meetingId} onChange={event=>changeMeeting(event.target.value)}>{meetingGroups.filter(group=>group.meetings.length).map(group=><optgroup key={group.label} label={group.label}>{group.meetings.map(item=>{const pending=data.registrations.filter(registration=>registration.meetingId===item.id&&registration.status==='pending').length;return <option value={item.id} key={item.id}>{dateText(item.startsAt,zone,{day:'numeric',month:'short'})} · {item.title.replace(/^JDP · /,'')}{pending&&isActiveMeeting(item)?` · ${pending} en revisión`:''}</option>})}</optgroup>)}</select></label>
    {meeting&&state?<>
      <section className="review-meeting-context" aria-label="Reunión seleccionada"><ProgramArtwork program={meeting.program} photoKey={meeting.id} className="review-context-photo"/><div>
        <span className="program-tag">{meetingMeta(meeting)}</span><h2>{meeting.title.replace(/^JDP · /,'')}</h2><p>Anfitrión: <b>{meeting.host||'Sin asignar'}</b></p><MeetingSchedule meeting={meeting} zone={zone}/>
      </div></section>
      {state.phase!=='review'&&<div className={'review-decision-note '+state.phase}><span>{state.confirmed?<Check size={20}/>:state.phase==='closed'?<Clock3 size={20}/>:<Users size={20}/>}</span><div>
        <b>{state.confirmed?`${assignedName} tiene la participación confirmada`:state.phase==='closed'?meeting.status==='cancelled'?'Esta reunión fue cancelada':'Esta reunión ya terminó':state.phase==='waiting'?'Todavía no hay solicitudes por revisar':`${state.pending} ${state.pending===1?'solicitud pendiente':'solicitudes pendientes'}`}</b>
        <p>{!state.active?'Puedes consultar los perfiles y el historial. Esta reunión ya no admite asignaciones.':state.confirmed?'Si cancela, el equipo podrá elegir manualmente a otro solicitante.':state.phase==='waiting'?'Las nuevas solicitudes aparecerán aquí.':'Revisa la disponibilidad antes de confirmar.'}</p>
      </div></div>}
      <CriteriaEditor key={meetingId} meetingId={meetingId} text={data.criteria[meetingId]||''} busy={busy} action={action}/>
      <section className="review-filter-panel" aria-label="Filtrar candidatos">
        <label className="review-name-search"><Search size={18}/><input aria-label="Buscar candidato por nombre" placeholder="Buscar un Star por nombre" value={query} onChange={event=>setQuery(event.target.value)}/>{query&&<button aria-label="Borrar búsqueda de candidatos" onClick={()=>setQuery('')}><X size={16}/></button>}</label>
        <div className="review-visible-filters"><label>Idioma declarado<select aria-label="Filtrar idioma del candidato" value={language} onChange={event=>setLanguage(event.target.value)}><option value="">Todos los idiomas</option>{['Español','English','Português'].map(value=><option value={value} key={value}>{languageText(value)}</option>)}</select></label>
          <label>Programa cursado<select aria-label="Filtrar programa del candidato" value={program} onChange={event=>setProgram(event.target.value)}><option value="">Todos los programas</option>{[...new Set(data.candidates.flatMap(profile=>profile.programs))].map(value=><option value={value} key={value}>{programName(value)}</option>)}</select></label>
        </div>
      </section>
      <div className="review-status-chips" role="group" aria-label="Estado de solicitudes">{([['','Todos'],['pending',state.active?'En revisión':'Sin confirmar'],['confirmed','Confirmado'],['not_selected','Otros solicitantes'],['withdrawn','Retirados']] as const).map(([value,label])=><button key={value} aria-pressed={status===value} onClick={()=>setStatus(value)}>{label}<span>{counts[value||'all']}</span></button>)}</div>
      <div className="candidate-count" role="status"><b>{rows.length} {rows.length===1?'candidato':'candidatos'}</b><span>Orden alfabético</span>{filtered&&<button className="text-link" onClick={resetFilters}>Limpiar filtros <X size={13}/></button>}</div>
      {error&&!selectedUserId&&<p className="error" role="alert">{error}</p>}
      <div className="candidate-grid compact-candidates">{rows.map(({application,profile})=><article className={'candidate-card '+application.status} key={application.id}>
        <div className="candidate-heading"><span className="avatar">{profile.initials}</span><div><h3>{profile.name}</h3><span className={'application-status '+application.status}>{registrationLabel(application.status)}</span></div></div>
        <div className="candidate-tags"><span><Globe2 size={14}/>{profile.languages.map(languageText).join(' · ')}</span><span><MapPin size={14}/>{profile.programs.map(programName).join(' · ')}</span></div>
        <p className="candidate-availability"><Clock3 size={15}/><span><b>Disponibilidad declarada</b>{profile.availability}</span></p><p className="candidate-experience">{profile.experience}</p>
        <div className="candidate-actions"><button className="secondary-button" onClick={()=>setProfileView(profile)}>Ver perfil <ChevronRight size={15}/></button>{application.status==='pending'&&state.canSelect?<button className="primary" disabled={busy} aria-label={'Elegir a '+profile.name} onClick={()=>choose(profile)}>Elegir <Check size={16}/></button>:<span className="candidate-status-note">{application.status==='confirmed'?'Asignación confirmada':application.status==='withdrawn'?'Solicitud retirada':!state.active?'Registro histórico':'Solicitud conservada'}</span>}</div>
      </article>)}</div>
      {!rows.length&&<div className="friendly-empty"><Users size={28}/><h2>{applications.length?'No hay candidatos con estos filtros':'Las solicitudes aparecerán aquí'}</h2><p>{applications.length?'Prueba otro idioma, programa o estado para seguir revisando.':state.active?'Cuando un Star solicite participar, podrás conocer su perfil y tomar la decisión.':'Esta reunión no tiene solicitudes registradas.'}</p>{filtered&&<button className="secondary-button" onClick={resetFilters}>Mostrar todos los candidatos</button>}</div>}
    </>:<div className="friendly-empty"><h2>No hay reuniones para revisar</h2><p>Crea una reunión desde la agenda para empezar a recibir solicitudes.</p></div>}
    {profileView&&<Dialog title={profileView.name} onClose={()=>setProfileView(null)} className="candidate-profile-dialog"><span className="dialog-program">PERFIL</span><div className="profile-status"><span className={'application-status '+profileApplication?.status}>{profileApplication?registrationLabel(profileApplication.status):''}</span></div>
      <dl className="profile-facts"><div><dt>Idiomas declarados</dt><dd>{profileView.languages.map(languageText).join(' · ')}</dd></div><div><dt>Programas en los que participó</dt><dd>{profileView.programs.map(programName).join(' · ')}</dd></div><div><dt>Disponibilidad declarada</dt><dd>{profileView.availability}</dd></div><div><dt>Experiencia previa</dt><dd>{profileView.experience}</dd></div></dl>
      <section className="profile-history"><h3>Historial de participaciones <span>{profileView.history.length}</span></h3>{profileView.history.length?profileView.history.map((item,index)=><div className="history-entry" key={index}><span/><div><b>{item.title}</b><p>{item.date} · {item.outcome}</p></div></div>):<p>Esta persona todavía no tiene participaciones registradas.</p>}</section>
      <section className="profile-notes"><h3><ShieldCheck size={16}/> Notas internas</h3><p>{profileView.internalNotes}</p></section>{profileApplication?.status==='pending'&&state?.canSelect&&<button className="primary full" disabled={busy} onClick={()=>choose(profileView)}>Elegir a {profileView.name.split(' ')[0]} <Check size={17}/></button>}
    </Dialog>}
    {selectedProfile&&meeting&&<Dialog title={`¿Confirmar a ${selectedProfile.name}?`} onClose={()=>setSelectedUserId('')} className="selection-review-dialog"><span className="dialog-program">CONFIRMAR PARTICIPACIÓN</span><p className="dialog-lead">Participará en <b>{meeting.title.replace(/^JDP · /,'')}</b>{meeting.host&&<> con {meeting.host}</>}.</p><MeetingSchedule meeting={meeting} zone={zone}/>
      <dl className="selection-facts"><div><dt>Idioma de la JDP</dt><dd>{meeting.language?languageText(meeting.language):'Sin configurar'}</dd></div><div><dt>Idiomas del candidato</dt><dd>{selectedProfile.languages.map(languageText).join(' · ')}</dd></div><div><dt>Disponibilidad declarada</dt><dd>{selectedProfile.availability}</dd></div></dl>
      <p className="selection-notice">Verifica que el horario le funcione. Al confirmar, esta persona y los demás solicitantes recibirán un aviso en el Hub.</p>
      {!validSelection&&<p className="error" role="alert">La solicitud o la reunión cambió. Vuelve a la lista para revisar su estado antes de elegir.</p>}{error&&<p className="error" role="alert">{error}</p>}
      <button className="primary full" disabled={busy||!validSelection} onClick={async()=>{if(await action({action:'select',meetingId:meeting.id,userId:selectedProfile.userId},'Participante confirmado. Los solicitantes y el anfitrión ya tienen sus avisos.'))setSelectedUserId('')}}>{busy?'Guardando decisión…':'Confirmar participante'} <Check size={17}/></button><button className="secondary-button full" disabled={busy} onClick={()=>setSelectedUserId('')}>Volver a los candidatos</button>
    </Dialog>}
  </div>
}
