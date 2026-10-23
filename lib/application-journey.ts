import type { HubData, Meeting, Registration } from './types'

export type ApplicationEntry = { meeting:Meeting; registration:Registration }
type ApplicationData = Pick<HubData,'user'|'meetings'|'registrations'>

export function applicationGroups(data:ApplicationData,now=Date.now()) {
  const registrations=new Map(data.registrations.filter(item=>item.userId===data.user.id).map(item=>[item.meetingId,item]))
  const all:ApplicationEntry[]=data.meetings.flatMap(meeting=>{
    const registration=registrations.get(meeting.id)
    return registration?[{meeting,registration}]:[]
  })
  const active=all.filter(({meeting,registration})=>
    ['scheduled','live'].includes(meeting.status)&&Date.parse(meeting.startsAt)+(meeting.duration??Infinity)*60_000>now&&
    ['pending','confirmed'].includes(registration.status)
  ).sort((a,b)=>Date.parse(a.meeting.startsAt)-Date.parse(b.meeting.startsAt))
  const activeIds=new Set(active.map(item=>item.meeting.id))
  const history=all.filter(item=>!activeIds.has(item.meeting.id)).sort((a,b)=>Date.parse(b.meeting.startsAt)-Date.parse(a.meeting.startsAt))
  return {all,active,history,pending:active.filter(item=>item.registration.status==='pending'),confirmed:active.filter(item=>item.registration.status==='confirmed')}
}

export function preparationKey(userId:string,meetingId?:string) {
  // Keep the existing general checklist. Each actual JDP starts with its own list.
  return meetingId?`coded-prep-v2:${encodeURIComponent(userId)}:${encodeURIComponent(meetingId)}`:`coded-prep-${userId}`
}

export function restorePreparation(raw:string|null,stepCount:number):number[] {
  try {
    const parsed:unknown=JSON.parse(raw||'[]')
    if(!Array.isArray(parsed))return []
    return [...new Set(parsed.filter((value):value is number=>typeof value==='number'&&Number.isInteger(value)&&value>=0&&value<stepCount))].sort((a,b)=>a-b)
  } catch {return []}
}
