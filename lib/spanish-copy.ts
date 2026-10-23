import type { Meeting, StarProfile } from './types'

// Compatibility for demo records created before the Spanish interface.
// Display fields are copied; IDs, roles, programme and language values stay stable.
export function spanishCopy(text:string):string {
 return text.split(/(«[^»]*»)/g).map(part=>part.startsWith('«')?part:part.replace(/\bDiscover London\b/g,'Descubre Londres')
  .replace(/\bOrlando em português\b/g,'Orlando en portugués')
  .replace(/\bTokyo\b(?! DisneySea)/g,'Tokio').replace(/\bLondon\b/g,'Londres')
  .replace(/\bHosts\b/g,'Anfitriones').replace(/\bhosts\b/g,'anfitriones')
  .replace(/\bHost\b/g,'Anfitrión').replace(/\bhost\b/g,'anfitrión')).join('')
}
export function spanishMeeting(meeting:Meeting):Meeting {
 if(!/^m[1-5]$/.test(meeting.id))return meeting
 return {...meeting,title:spanishCopy(meeting.title),description:spanishCopy(meeting.description),
  takeaway:meeting.takeaway===undefined?undefined:spanishCopy(meeting.takeaway),
  hostNote:meeting.hostNote===undefined?undefined:spanishCopy(meeting.hostNote),
  agenda:meeting.agenda?.map(spanishCopy)}
}
export function spanishCandidate(profile:StarProfile):StarProfile {
 return {...profile,experience:spanishCopy(profile.experience),
  internalNotes:spanishCopy(profile.internalNotes),
  history:profile.history.map(item=>({...item,title:spanishCopy(item.title),outcome:spanishCopy(item.outcome)}))}
}
