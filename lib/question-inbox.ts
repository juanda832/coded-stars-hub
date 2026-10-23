import type { HubNotification, Meeting, MeetingQuestion } from './types'

export type QuestionFilter = 'Todas'|'Pendientes'|'Resueltas'
export function messageDraftKey(userId:string,kind:'question'|'reply',scopeId:string) {
  return `coded-message-draft-v1:${encodeURIComponent(userId)}:${kind}:${encodeURIComponent(scopeId)}`
}
export function restoreMessageDraft(raw:string|null) {
  try {
    const value:unknown=JSON.parse(raw||'null')
    if(!value||typeof value!=='object')return ''
    const draft=value as {version?:unknown;text?:unknown}
    return draft.version===1&&typeof draft.text==='string'?draft.text.slice(0,500):''
  } catch {return ''}
}
function searchable(text:string) {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es').replace(/[^\p{L}\p{N}]+/gu,' ').trim()
}
export function questionInbox(questions:MeetingQuestion[],meetings:Meeting[],{meetingId='',query='',filter='Todas'}:{meetingId?:string;query?:string;filter?:QuestionFilter}={}) {
  const byId=new Map(meetings.map(meeting=>[meeting.id,meeting]))
  const words=searchable(query).split(' ').filter(Boolean)
  const matching=questions.filter(question=>{
    if(meetingId&&question.meetingId!==meetingId)return false
    const meeting=byId.get(question.meetingId)
    const program=meeting?.program==='London'?'London Londres Europa Europe':meeting?.program==='Tokyo'?'Tokyo Tokio':meeting?.program||''
    const language=meeting?.language==='English'?'English inglés':meeting?.language==='Português'?'Português portugués':meeting?.language||''
    const text=searchable(`${question.text} ${question.reply||''} ${question.replyAuthor||''} ${meeting?.title||''} ${program} ${language} ${meeting?.host||''}`)
    return words.every(word=>text.includes(word))
  })
  const pending=matching.filter(question=>!question.reply).length
  const shown=matching.filter(question=>filter==='Todas'||(filter==='Pendientes'?!question.reply:!!question.reply)).sort((a,b)=>{
    if(!!a.reply!==!!b.reply)return a.reply?1:-1
    return a.reply?Date.parse(b.repliedAt||b.createdAt)-Date.parse(a.repliedAt||a.createdAt):Date.parse(a.createdAt)-Date.parse(b.createdAt)
  })
  return {shown,counts:{Todas:matching.length,Pendientes:pending,Resueltas:matching.length-pending}}
}
export function isQuestionNotice(notification:Pick<HubNotification,'title'>) {
  return ['Un Star tiene una pregunta','Nueva pregunta para el host','Nueva pregunta para el anfitrión','Ya respondieron tu pregunta'].includes(notification.title)
}
