'use client'
import { meetingMeta } from '@/lib/meeting-utils'
import { ArrowRight, Users } from 'lucide-react'
import type { HubData, Meeting } from '@/lib/types'
import { ProgramArtwork } from './HubArtwork'
import MeetingSchedule from './MeetingSchedule'
import { programName } from '@/lib/program-labels'
import { languageText } from '@/lib/meeting-utils'
const statusLabels={scheduled:'Programada',live:'En vivo',completed:'Finalizada',cancelled:'Cancelada'}
export default function StaffMeetingCard({meeting,data,zone,onOpen}:{meeting:Meeting;data:HubData;zone:string;onOpen:(m:Meeting)=>void}) {
 const assigned=data.registrations.find(r=>r.meetingId===meeting.id&&r.status==='confirmed'),profile=data.assignedStars.find(p=>p.userId===assigned?.userId)
 return <article className="meeting-card"><ProgramArtwork program={meeting.program} photoKey={meeting.id}/><div className="meeting-head"><span className="program-tag">{meetingMeta(meeting)}</span><span className={'status '+meeting.status}>{statusLabels[meeting.status]}</span></div><h3>{meeting.title.replace(/^JDP · /,'')}</h3><p className="meeting-desc">{meeting.description}</p><MeetingSchedule meeting={meeting} zone={zone}/><div className="staff-card-assigned"><Users size={17}/><span>{profile?.name||'Sin Star confirmado'}</span>{data.user.role==='admin'&&<small>{data.registrationCounts[meeting.id]||0} solicitudes</small>}</div><button className="secondary-button full" onClick={()=>onOpen(meeting)}>Gestionar reunión <ArrowRight size={17}/></button></article>
}
