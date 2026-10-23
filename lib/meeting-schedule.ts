import type { Meeting } from './types'

// Duration is elapsed time. Format both instants separately, including DST transitions.
export function meetingSchedule(meeting:Pick<Meeting,'startsAt'|'duration'>,zone:string) {
  const start=new Date(meeting.startsAt),end=meeting.duration===null?null:new Date(start.getTime()+meeting.duration*60_000)
  const clock=new Intl.DateTimeFormat('es',{timeZone:zone,hour:'2-digit',minute:'2-digit',hourCycle:'h23'})
  const day=new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'})
  const offset=new Intl.DateTimeFormat('en',{timeZone:zone,timeZoneName:'shortOffset'})
  const startOffset=offset.formatToParts(start).find(part=>part.type==='timeZoneName')?.value||''
  if(!end)return {endAt:'',startDay:day.format(start),endDay:'',startTime:clock.format(start),endTime:'',crossesDay:false,offsetChanged:false}
  const endOffset=offset.formatToParts(end).find(part=>part.type==='timeZoneName')?.value||''
  const offsetChanged=startOffset!==endOffset
  return {
    endAt:end.toISOString(),startDay:day.format(start),endDay:day.format(end),
    startTime:clock.format(start)+(offsetChanged?` (${startOffset})`:''),
    endTime:clock.format(end)+(offsetChanged?` (${endOffset})`:''),
    crossesDay:day.format(start)!==day.format(end),offsetChanged,
  }
}
