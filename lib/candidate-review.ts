import type { ApplicationStatus, Meeting, Registration, StarProfile } from './types'

type CandidateFilters = { query:string; language:string; program:string; status:ApplicationStatus|'' }
export function candidateReview(applications:Registration[], profiles:StarProfile[], filters:CandidateFilters) {
  const normalize=(value:string)=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es').trim()
  const words=normalize(filters.query).split(/\s+/).filter(Boolean)
  const byUser=new Map(profiles.map(profile=>[profile.userId,profile]))
  const matching=applications.flatMap(application=>{
    const profile=byUser.get(application.userId)
    if(!profile||filters.language&&!profile.languages.includes(filters.language)||filters.program&&!profile.programs.includes(filters.program))return []
    if(!words.every(word=>normalize(profile.name).includes(word)))return []
    return [{application,profile}]
  }).sort((a,b)=>a.profile.name.localeCompare(b.profile.name,'es',{sensitivity:'base'}))
  const counts={all:matching.length,pending:0,confirmed:0,not_selected:0,withdrawn:0}
  for(const {application} of matching)counts[application.status]++
  return {rows:matching.filter(({application})=>!filters.status||application.status===filters.status),counts}
}

export function reviewMeetingState(meeting:Meeting, applications:Registration[], now=Date.now()) {
  const own=applications.filter(application=>application.meetingId===meeting.id)
  const confirmed=own.find(application=>application.status==='confirmed')
  const pending=own.filter(application=>application.status==='pending').length
  const active=(meeting.status==='scheduled'||meeting.status==='live')&&Date.parse(meeting.startsAt)+(meeting.duration??Infinity)*60000>now
  const phase=confirmed?'assigned':!active?'closed':pending?'review':'waiting'
  return {confirmed,pending,active,phase,canSelect:active&&!confirmed} as const
}
