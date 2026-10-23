import type { Meeting, MeetingReport, ReportAnswer, ReportIssue, Role } from './types'
export const scenarioOptions={
 shared:{label:'Entré y compartí mi experiencia',hostLabel:'Se conectó y compartió su experiencia',starJoined:'yes',wasInvited:'yes',testimony:'yes'},
 no_turn:{label:'Entré, pero no tuve la palabra',hostLabel:'Se conectó, pero no tuvo la palabra',starJoined:'yes',wasInvited:'no',testimony:'no'},
 no_testimony:{label:'Entré y tuve la palabra, pero no pude compartir',hostLabel:'Se conectó y tuvo la palabra, pero no pudo compartir',starJoined:'yes',wasInvited:'yes',testimony:'no'},
 absent:{label:'No pude entrar a la reunión',hostLabel:'No se conectó',starJoined:'no',wasInvited:'not_applicable',testimony:'not_applicable'},
 unknown:{label:'No tengo información',hostLabel:'No tengo información sobre su participación',starJoined:'unknown',wasInvited:'unknown',testimony:'unknown'},
} as const
export type ReportScenario=keyof typeof scenarioOptions
export const issueLabels:Record<ReportIssue,string>={connection:'Problema de conexión',no_turn:'No hubo espacio para el testimonio',no_families:'No había familias',host_absent:'No encontré al anfitrión',cancelled:'La reunión no se realizó',other:'Otra situación'}
export const answerLabels:Record<ReportAnswer,string>={yes:'Sí',no:'No',unknown:'Sin información',not_applicable:'No corresponde'}
export const reportFields=[['starJoined','Se conectó'],['wasInvited','Tuvo la palabra'],['testimony','Compartió su experiencia'],['families','Había familias']] as const
export function reportAvailable(m:Meeting){return m.status==='completed'||Date.parse(m.startsAt)+(m.duration??Infinity)*60000<=Date.now()}
export function reportConflicts(reports:MeetingReport[]){const star=reports.find(r=>r.role==='star'),host=reports.find(r=>r.role==='host');if(!star||!host)return [];return reportFields.filter(([key])=>['yes','no'].includes(star[key])&&['yes','no'].includes(host[key])&&star[key]!==host[key]).map(([,label])=>label)}
export function needsReview(reports:MeetingReport[]){return reports.some(r=>r.issues.length>0||r.starJoined==='no'||(r.starJoined==='yes'&&r.testimony==='no')||r.families==='no'||r.meetingHeld==='no')||reportConflicts(reports).length>0}
export function reportSummary(r:MeetingReport){if(r.role==='host'&&r.meetingHeld==='no')return 'La reunión no se realizó';if(r.starJoined==='yes'&&r.testimony==='yes')return 'Se conectó y compartió su experiencia';if(r.starJoined==='yes'&&r.wasInvited==='no')return 'Se conectó, sin oportunidad de hablar';if(r.starJoined==='yes')return 'Se conectó, sin testimonio';if(r.starJoined==='no')return r.role==='star'?'No pudo entrar':'El anfitrión reporta que no se conectó';return 'Resultado sin información completa'}
export function normalizeReport(body:Record<string,unknown>,role:Role,hasAssignedStar:boolean):Pick<MeetingReport,'meetingHeld'|'starJoined'|'wasInvited'|'testimony'|'families'|'issues'|'comment'>{
 const held=role==='host'?body.meetingHeld:'unknown'
 if(!['yes','no','unknown'].includes(String(held)))throw new Error('Indica si la reunión se realizó.')
 let scenario:typeof scenarioOptions[ReportScenario]|undefined
 if(role==='star'||(held==='yes'&&hasAssignedStar)){
  if(typeof body.scenario!=='string'||!Object.hasOwn(scenarioOptions,body.scenario)||(role==='star'&&body.scenario==='unknown'))throw new Error('Elige cómo fue la participación.')
  scenario=scenarioOptions[body.scenario as ReportScenario]
 } else if(body.scenario)throw new Error('La participación del Star no corresponde a esta respuesta.')
 const families=role==='host'&&held==='no'?'not_applicable':body.families
 if(!['yes','no','unknown','not_applicable'].includes(String(families))||(families==='not_applicable'&&!(role==='host'&&held==='no')))throw new Error('Indica si había familias o si no tienes información.')
 if(!Array.isArray(body.issues)||body.issues.some(issue=>typeof issue!=='string'||!Object.hasOwn(issueLabels,issue)))throw new Error('Revisa las situaciones seleccionadas.')
 const issues=[...new Set(body.issues)] as ReportIssue[]
 if(issues.includes('no_turn')&&scenario?.wasInvited==='yes')throw new Error('Revisa si hubo oportunidad de hablar: tus respuestas son diferentes.')
 if(issues.includes('no_families')&&families==='yes')throw new Error('Revisa si había familias: tus respuestas son diferentes.')
 if(issues.includes('cancelled')&&held==='yes')throw new Error('Revisa si la reunión se realizó: tus respuestas son diferentes.')
 const comment=typeof body.comment==='string'?body.comment.trim():''
 if(comment.length>1000)throw new Error('El comentario puede tener hasta 1000 caracteres.')
 return {meetingHeld:held as ReportAnswer,starJoined:scenario?.starJoined||(held==='no'||!hasAssignedStar?'not_applicable':'unknown'),wasInvited:scenario?.wasInvited||(held==='no'||!hasAssignedStar?'not_applicable':'unknown'),testimony:scenario?.testimony||(held==='no'||!hasAssignedStar?'not_applicable':'unknown'),families:families as ReportAnswer,issues,comment}
}
