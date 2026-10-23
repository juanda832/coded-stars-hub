'use client'
import { meetingMeta } from '@/lib/meeting-utils'
import { ArrowRight, CalendarDays, Users } from 'lucide-react'
import type { HubData, Meeting } from '@/lib/types'
import { isActiveMeeting, languageText } from '@/lib/meeting-utils'
import { programName } from '@/lib/program-labels'
import { ProgramArtwork } from './HubArtwork'
import MeetingSchedule from './MeetingSchedule'

export default function AssignedStars({data,zone,onMeeting}:{data:HubData;zone:string;onMeeting:(meeting:Meeting)=>void}) {
  const upcoming=data.meetings.filter(isActiveMeeting).sort((a,b)=>Date.parse(a.startsAt)-Date.parse(b.startsAt))
  return <div className="assigned-meetings assigned-refined">{upcoming.map(meeting=>{
    const registration=data.registrations.find(item=>item.meetingId===meeting.id&&item.status==='confirmed')
    const profile=data.assignedStars.find(item=>item.userId===registration?.userId)
    return <article className="assigned-star-card" key={meeting.id}><ProgramArtwork program={meeting.program} photoKey={meeting.id} className="assigned-meeting-photo"/><div className="assigned-card-body"><span className="program-tag">{meetingMeta(meeting)}</span><h2>{meeting.title.replace(/^JDP · /,'')}</h2><MeetingSchedule meeting={meeting} zone={zone}/>
      {profile?<><div className="candidate-heading"><span className="avatar">{profile.initials}</span><div><b>{profile.name}</b><span className="application-status confirmed">Confirmado por administración</span></div></div><p className="assigned-star-languages">{profile.languages.map(languageText).join(' · ')}<br/>{profile.programs.map(programName).join(' · ')}</p><div className="host-reminder"><Users size={20}/><p>Acuerda con {profile.name.split(' ')[0]} el turno de su testimonio.</p></div></>:<p className="assigned-wait-note">Pendiente de asignación por coordinación.</p>}
      <button className="secondary-button full" onClick={()=>onMeeting(meeting)}>Preparar esta reunión <ArrowRight size={17}/></button>
    </div></article>
  })}{!upcoming.length&&<div className="friendly-empty"><CalendarDays size={28}/><h2>No tienes reuniones próximas</h2><p>Cuando coordinación te asigne una JDP, podrás conocer aquí a su Star y preparar el encuentro.</p></div>}</div>
}
