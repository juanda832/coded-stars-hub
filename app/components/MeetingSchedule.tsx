import { ArrowRight, CalendarDays, Globe2 } from 'lucide-react'
import type { Meeting } from '@/lib/types'
import { dateText, friendlyDay } from '@/lib/meeting-utils'
import { meetingSchedule } from '@/lib/meeting-schedule'

export default function MeetingSchedule({meeting,zone}:{meeting:Meeting;zone:string}) {
  const slot=meetingSchedule(meeting,zone),zoneName=zone.split('/').pop()?.replace(/_/g,' ')
  return <div className="meeting-schedule"><span className="schedule-day"><CalendarDays size={15}/>{friendlyDay(meeting.startsAt,zone)}</span><div className={'schedule-hours '+(slot.offsetChanged?'offset-changed':'')}><time dateTime={meeting.startsAt}>{slot.startTime}</time>{meeting.duration!==null&&<><ArrowRight size={16} aria-label="hasta"/><time dateTime={slot.endAt}>{slot.endTime}</time><span>{meeting.duration} min</span></>}</div><small><Globe2 size={13}/> Tu horario en {zoneName}{slot.crossesDay&&<> · Termina el {dateText(slot.endAt,zone,{day:'numeric',month:'short'})}</>}</small></div>
}
