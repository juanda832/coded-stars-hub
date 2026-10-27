import type {Meeting,Registration,User} from './types.ts'
import {programName} from './program-labels.ts'

export function calendarMeetings(user:User,meetings:Meeting[],registrations:Registration[]) {
 const confirmed=new Set(registrations.filter(item=>item.userId===user.id&&item.status==='confirmed').map(item=>item.meetingId))
 return meetings.filter(meeting=>user.role==='admin'||user.role==='host'&&meeting.hostId===user.id||user.role==='star'&&confirmed.has(meeting.id)).sort((a,b)=>Date.parse(a.startsAt)-Date.parse(b.startsAt))
}
export function calendarEscape(text:string) {return text.replace(/\\/g,'\\\\').replace(/\r\n|\r|\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;').replace(/\u0000/g,'')}
export function foldCalendarLine(line:string) {
 const encoder=new TextEncoder(),lines:string[]=[];let chunk='',size=0
 for(const character of line){const width=encoder.encode(character).length;if(size+width>75){lines.push(chunk);chunk=' ';size=1}chunk+=character;size+=width}
 lines.push(chunk);return lines.join('\r\n')
}
function stamp(date:Date) {return date.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z')}
export function calendarFeed(meetings:Meeting[],origin:string,now=new Date()) {
 const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//CODED Stars Hub//Agenda personal//ES','CALSCALE:GREGORIAN','METHOD:PUBLISH','X-WR-CALNAME:CODED Stars Hub · Mis JDP','X-WR-TIMEZONE:America/New_York']
 for(const meeting of meetings){
  const start=new Date(meeting.startsAt);if(!Number.isFinite(start.getTime()))continue
  const detail=[meeting.schoolName?'Colegio: '+meeting.schoolName:'',meeting.program?'Programa: '+programName(meeting.program):'',meeting.language?'Idioma: '+({Español:'Español',English:'Inglés',Português:'Portugués'}[meeting.language]):'',meeting.duration===null?'Hora de finalización pendiente de confirmar.':'','Consulta el Hub para ver el estado, las indicaciones y el enlace de acceso.',origin+'/#/reuniones'].filter(Boolean).join('\n')
  lines.push('BEGIN:VEVENT',`UID:${calendarEscape(meeting.id)}@coded-stars-hub`,`DTSTAMP:${stamp(now)}`,`SEQUENCE:${Number.isSafeInteger(meeting.calendarRevision)&&meeting.calendarRevision!>=0?meeting.calendarRevision:0}`,`DTSTART:${stamp(start)}`)
  if(meeting.updatedAt&&Number.isFinite(Date.parse(meeting.updatedAt)))lines.push(`LAST-MODIFIED:${stamp(new Date(meeting.updatedAt))}`)
  if(meeting.duration!==null&&Number.isFinite(meeting.duration)&&meeting.duration>0)lines.push(`DTEND:${stamp(new Date(start.getTime()+meeting.duration*60000))}`)
  lines.push(`SUMMARY:${calendarEscape(meeting.title)}`,`DESCRIPTION:${calendarEscape(detail)}`,`URL:${origin}/#/reuniones`,`STATUS:${meeting.status==='cancelled'?'CANCELLED':'CONFIRMED'}`,'CLASS:PRIVATE','TRANSP:OPAQUE')
  if(meeting.status!=='cancelled')lines.push('BEGIN:VALARM','TRIGGER:-PT15M','ACTION:DISPLAY','DESCRIPTION:Tu JDP comienza en 15 minutos','END:VALARM')
  lines.push('END:VEVENT')
 }
 lines.push('END:VCALENDAR');return lines.map(foldCalendarLine).join('\r\n')+'\r\n'
}
