'use client'
import type { Meeting } from '@/lib/types'
import type { MeetingEditorValues } from '@/lib/meeting-editor-draft'
import { meetingMeta } from '@/lib/meeting-utils'
import { ProgramArtwork } from './HubArtwork'
import MeetingSchedule from './MeetingSchedule'

export default function MeetingEditorPreview({form,startsAt,hostName}:{form:MeetingEditorValues;startsAt?:string;hostName:string}) {
 const preview:Meeting|undefined=startsAt?{id:'preview',title:form.schoolName||form.title,schoolName:form.schoolName,description:form.description,program:form.program,language:form.language,startsAt,duration:form.duration,host:hostName,hostId:form.hostId,capacity:1,status:'scheduled',color:'purple'}:undefined
 return <aside className="meeting-editor-preview" aria-label="Vista previa de la reunión"><ProgramArtwork program={form.program} className="editor-preview-photo"/><div className="editor-preview-copy">{meetingMeta(form)&&<span className="program-tag">{meetingMeta(form)}</span>}<h3>{form.schoolName.trim()||form.title||'Nombre del colegio'}</h3>{form.description&&<p>{form.description}</p>}{preview?<MeetingSchedule meeting={preview} zone={form.timeZone}/>:<p>Completa la fecha y la hora de Orlando.</p>}{hostName&&<p>Anfitrión: {hostName}</p>}<small>La participación requiere confirmación de coordinación.</small></div></aside>
}
