import type { Meeting } from './types'
import { programName } from './program-labels.ts'
export function dateText(date: string, zone: string, opts: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat('es', { ...opts, timeZone: zone }).format(new Date(date))
}
export function dayKey(date: Date, zone: string) {
  return new Intl.DateTimeFormat('en-CA', { year:'numeric', month:'2-digit', day:'2-digit', timeZone:zone }).format(date)
}
export function friendlyDay(date: string, zone: string) {
  if (dayKey(new Date(date), zone) === dayKey(new Date(), zone)) return 'Hoy'
  const today=dayKey(new Date(),zone),tomorrow=new Date(today+'T12:00:00Z');tomorrow.setUTCDate(tomorrow.getUTCDate()+1)
  if (dayKey(new Date(date), zone) === tomorrow.toISOString().slice(0,10)) return 'Mañana'
  return dateText(date, zone, { weekday:'long', day:'numeric', month:'short', ...(dayKey(new Date(date),zone).slice(0,4)!==today.slice(0,4)?{year:'numeric'}:{}) })
}
export function isActiveMeeting(meeting: Meeting) {
  return ['scheduled','live'].includes(meeting.status) && new Date(meeting.startsAt).getTime()+(meeting.duration??Infinity)*60000 > Date.now()
}
export function canRegister(meeting: Meeting) {
  return meeting.status === 'scheduled' && new Date(meeting.startsAt).getTime() > Date.now()
}
export function calendarText(meeting: Meeting) {
  const escape = (text: string) => text.replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;')
  const stamp = (date: Date) => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')
  const lines = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//CODED Stars Hub//ES','CALSCALE:GREGORIAN','BEGIN:VEVENT',`UID:${meeting.id}@coded-stars-hub.demo`,`DTSTAMP:${stamp(new Date())}`,`DTSTART:${stamp(new Date(meeting.startsAt))}`,...(meeting.duration===null?[]:[`DTEND:${stamp(new Date(new Date(meeting.startsAt).getTime()+meeting.duration*60000))}`]),`SUMMARY:${escape(meeting.title)}`,`DESCRIPTION:${escape([meeting.description,meeting.schoolName?'Colegio: '+meeting.schoolName:'',meeting.program?'Programa: '+programName(meeting.program):'',meeting.language?'Idioma: '+languageText(meeting.language):'',meeting.host?'Anfitrión: '+meeting.host:'','Revisa el Hub para ver el enlace y las novedades.'].filter(Boolean).join('\n'))}`,'BEGIN:VALARM','TRIGGER:-PT15M','ACTION:DISPLAY','DESCRIPTION:Tu encuentro empieza en 15 minutos','END:VALARM','END:VEVENT','END:VCALENDAR']
  // Fold at 75 UTF-8 octets, preserving multi-byte characters (RFC 5545).
  const folded = lines.map(line => { let result='', length=0; for(const char of line) { const size=new TextEncoder().encode(char).length; if(length+size>75) {result+='\r\n ';length=1} result+=char;length+=size } return result })
  return folded.join('\r\n')+'\r\n'
}
export function downloadCalendar(meeting: Meeting) {
  const url = URL.createObjectURL(new Blob([calendarText(meeting)], {type:'text/calendar;charset=utf-8'}))
  const anchor = document.createElement('a'); anchor.href=url; anchor.download=`coded-stars-${meeting.id}.ics`; anchor.click()
  setTimeout(()=>URL.revokeObjectURL(url),1000)
}

export function languageText(language:string) {
  return ({Español:'Español',English:'Inglés',Português:'Portugués'} as Record<string,string>)[language]||language
}

export function meetingMeta(meeting:Pick<Meeting,'program'|'language'>) {
 return [meeting.program?programName(meeting.program):'',meeting.language?languageText(meeting.language):''].filter(Boolean).join(' · ')||'Reunión JDP'
}
