import type { HubData, Meeting } from './types'

export type AgendaPreferences = { program:string; language:string; openOnly:boolean }
export type AgendaPeriod = 'Próximas'|'Hoy'|'7 días'|'Todas'
export function searchText(value:string) {
 return value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es').replace(/[^\p{L}\p{N}]+/gu,' ').trim()
}
export function matchesMeetingSearch(meeting:Meeting, query:string) {
 const language=meeting.language==='English'?'inglés ingles English':meeting.language==='Português'?'portugués portugues português':meeting.language==='Español'?'español espanol':''
 const program=meeting.program==='London'?'London Londres Europa Europe':meeting.program==='Tokyo'?'Tokyo Tokio':meeting.program
 const haystack=searchText(`${meeting.schoolName||''} ${meeting.title} ${program} ${meeting.description} ${meeting.host} ${language}`)
 return searchText(query).split(' ').filter(Boolean).every(word=>haystack.includes(word))
}
export function activeAt(meeting:Meeting,now:number) {
 return (meeting.status==='scheduled'||meeting.status==='live')&&Date.parse(meeting.startsAt)+(meeting.duration??Infinity)*60000>now
}
export function matchesAgendaFilters(meeting:Meeting,data:Pick<HubData,'user'|'registrations'|'confirmedCounts'>,filters:AgendaPreferences,now=Date.now()) {
 if(filters.program!=='Todos'&&meeting.program!==filters.program)return false
 if(filters.language!=='Todos'&&meeting.language!==filters.language)return false
 if(!filters.openOnly)return true
 if(data.confirmedCounts[meeting.id])return false
 if(data.user.role!=='star')return activeAt(meeting,now)
 const registration=data.registrations.find(r=>r.meetingId===meeting.id&&r.userId===data.user.id)
 return meeting.status==='scheduled'&&Date.parse(meeting.startsAt)>now&&(!registration||registration.status==='withdrawn')
}
function localDay(date:number,zone:string) {
 return new Intl.DateTimeFormat('en-CA',{year:'numeric',month:'2-digit',day:'2-digit',timeZone:zone}).format(new Date(date))
}
export function matchesAgendaPeriod(meeting:Meeting,period:AgendaPeriod,zone:string,now=Date.now()) {
 if(period==='Todas')return true
 const today=localDay(now,zone),day=localDay(Date.parse(meeting.startsAt),zone)
 if(period==='Hoy')return day===today
 if(period==='Próximas')return activeAt(meeting,now)
 const end=new Date(today+'T12:00:00Z');end.setUTCDate(end.getUTCDate()+7)
 return day>=today&&day<end.toISOString().slice(0,10)&&activeAt(meeting,now)
}
