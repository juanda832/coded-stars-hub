import type {HubData,Meeting} from './types'

type OverviewData=Pick<HubData,'meetings'|'registrations'|'confirmedCounts'|'reports'>
export function meetingReadiness(meeting:Meeting,data:Pick<OverviewData,'registrations'|'confirmedCounts'>){
 const pending=data.registrations.filter(r=>r.meetingId===meeting.id&&r.status==='pending').length
 const missing:string[]=[]
 if(!meeting.hostId)missing.push('Falta anfitrión')
 if(!data.confirmedCounts[meeting.id])missing.push(pending?'Solicitudes por revisar':'Falta Star')
 if(!meeting.joinUrl?.trim())missing.push('Falta enlace')
 return {pending,missing}
}
export function coordinationOverview(data:OverviewData,now=Date.now()){
 const upcoming=data.meetings.filter(m=>{
  const start=Date.parse(m.startsAt)
  return Number.isFinite(start)&&m.status==='scheduled'&&start>=now
 }).sort((a,b)=>Date.parse(a.startsAt)-Date.parse(b.startsAt))
 const scheduled=upcoming.filter(m=>Date.parse(m.startsAt)-now<=7*86400000)
 const confirmed=scheduled.filter(m=>!!data.confirmedCounts[m.id])
 const attention=scheduled.flatMap(meeting=>{
  const {pending,missing}=meetingReadiness(meeting,data)
  return missing.length?[{meeting,missing,pending,within24h:Date.parse(meeting.startsAt)-now<=86400000}]:[]
 })
 // Coverage is calculated by unique eligible meeting, not raw response count.
 const ended=data.meetings.filter(m=>m.status==='completed'||(['scheduled','live'].includes(m.status)&&m.duration!==null&&Date.parse(m.startsAt)+m.duration*60000<=now))
 const expectedStars=ended.filter(m=>!!data.confirmedCounts[m.id])
 const starIds=new Set(expectedStars.map(m=>m.id))
 const hostIds=new Set(ended.map(m=>m.id))
 const starReports=new Set(data.reports.filter(r=>r.role==='star'&&starIds.has(r.meetingId)).map(r=>r.meetingId))
 const hostReports=new Set(data.reports.filter(r=>r.role==='host'&&hostIds.has(r.meetingId)).map(r=>r.meetingId))
 return {scheduled:scheduled.length,confirmed:confirmed.length,attention,coverage:{stars:starReports.size,expectedStars:starIds.size,hosts:hostReports.size,expectedHosts:hostIds.size}}
}
