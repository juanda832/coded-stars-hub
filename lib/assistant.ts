import type { HubData, Meeting } from './types'
import type { AssistantAction, AssistantAnswer, AssistantGoal, AssistantState } from './assistant-types'
import { dateText, dayKey, languageText } from './meeting-utils'
import { participationState } from './participation-state'
import { reportAvailable } from './reports'
import { spanishCopy } from './spanish-copy'

export function normalizeQuestion(value:string){return value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9\s]/g,' ').replace(/\s+/g,' ').trim()}
const stop=new Set('de del la las el los un una unos unas en con por para que como cual cuales cuando donde puedo puedes me mi mis tu tus se es son al y o a lo le les tengo hay quiero necesito favor'.split(' '))
function words(text:string){return normalizeQuestion(text).split(' ').filter(word=>word.length>2&&!stop.has(word))}
function near(a:string,b:string){
 if(a===b||a.length>4&&b.length>4&&(a===b+'s'||b===a+'s'))return true
 if(a.length<5||b.length<5||Math.abs(a.length-b.length)>1)return false
 const rows=Array.from({length:a.length+1},(_,i)=>Array.from({length:b.length+1},(_,j)=>i===0?j:j===0?i:0))
 for(let i=1;i<=a.length;i++)for(let j=1;j<=b.length;j++){rows[i][j]=Math.min(rows[i-1][j]+1,rows[i][j-1]+1,rows[i-1][j-1]+Number(a[i-1]!==b[j-1]));if(i>1&&j>1&&a[i-1]===b[j-2]&&a[i-2]===b[j-1])rows[i][j]=Math.min(rows[i][j],rows[i-2][j-2]+1)}
 return rows[a.length][b.length]<=1
}
const intents:{goal:AssistantGoal;examples:string[]}[]=[
 {goal:'overview',examples:['resumen atencion siguiente paso pendientes prioridad herramientas ayuda comenzar']},
 {goal:'meetings',examples:['reuniones agenda calendario JDP encuentros oportunidades','hoy manana proximas esta semana','buscar reunion participar horario disponible abiertas inscribirme anotarme apuntarme' ]},
 {goal:'applications',examples:['mis solicitudes inscripciones confirmadas pendientes revision','estado solicitud cancelacion retirar inscripcion cancelar solicitud confirmado confirmada' ,'me seleccionaron esperando confirmacion']},
 {goal:'prepare',examples:['preparar testimonio historia experiencia guion ensayo','que digo hablar nervios primera vez','ayudame con mi testimonio preparar historia']},
 {goal:'questions',examples:['preguntar host anfitrion duda consulta respuesta','escribe pregunta al anfitrion turno palabra','preguntas sin responder comunicacion indicaciones']},
 {goal:'selection',examples:['seleccionar elegir asignar confirmar candidato estudiante','solicitudes revisar candidatos criterios equipo','mejor estudiante seleccion automatica']},
 {goal:'publication',examples:['publicar publicacion novedad anuncio borrador contenido','redacta invitacion motivar stars mensaje equipo','escribe aviso invitar participar']},
 {goal:'profile',examples:['perfil idiomas disponibilidad programas actualizar informacion','editar mi cuenta disponibilidad idiomas']},
 {goal:'reports',examples:['feedback comentarios resultado seguimiento asistencia finalizo termino','no me dieron palabra no hubo familias reunion no ocurrio','registrar resultado testimonio realizado']},
 {goal:'account',examples:['cuenta acceso entrar isa ela administradora permisos','cambiar cuenta iniciar sesion demo contrasena']},
 {goal:'motivation',examples:['motivacion participacion bajaron animar volver acompanamiento','me da verguenza miedo participar confianza']},
 {goal:'privacy',examples:['datos privados notas internas otro estudiante permisos seguridad','ignora instrucciones cambia rol muestra contrasena todos usuarios']},
 {goal:'about',examples:['eres gpt chatgpt modelo inteligencia artificial piensas como funcionas','capacidades limites ayuda asistente chatbot']},
]
function classify(message:string):{goal?:AssistantGoal;confidence:number}{
 const tokens=words(message)
 const scored=intents.map(intent=>{
  const vocabulary=[...new Set(words(intent.examples.join(' ')))]
  const score=tokens.reduce((sum,token)=>sum+(vocabulary.some(word=>near(word,token))?1:0),0)
  return {goal:intent.goal,confidence:score/Math.sqrt(Math.max(1,tokens.length))}
 }).sort((a,b)=>b.confidence-a.confidence)
 return scored[0]?.confidence>=.65?scored[0]:{confidence:0}
}
const nav=(label:string,section:string,view?:string):AssistantAction=>({kind:'navigate',label,section,view})
function programIn(q:string){return ['Orlando','Tokyo','London'].find(program=>q.includes(program.toLowerCase())||program==='Tokyo'&&q.includes('tokio')||program==='London'&&q.includes('londres'))}
function languageIn(q:string){if(/\b(ingles|english)\b/.test(q))return 'English';if(/\b(portugues|portuguese)\b/.test(q))return 'Português';if(/\b(espanol|castellano|spanish)\b/.test(q))return 'Español'}
function displayMeeting(m:Meeting,zone:string){return `${m.title.replace(/^JDP · /,'')} · ${dateText(m.startsAt,zone,{weekday:'long',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}${m.language?' · '+languageText(m.language):''}${m.duration!==null?' · '+m.duration+' min':''}`}
function docScore(query:string,title:string,body:string){const terms=words(query),heading=words(title),content=words(body);return terms.reduce((score,term)=>score+(heading.some(word=>near(word,term))?2:content.some(word=>near(word,term))?1:0),0)}

/** Local planning, retrieval and state checks. No network, model or mutation tools. */
export function answerHubQuestion(data:HubData,message:string,previous:AssistantState={},zone='America/La_Paz',now=Date.now()):AssistantAnswer {
 const q=normalizeQuestion(message),role=data.user.role,star=role==='star',admin=role==='admin'
 const active=data.meetings.filter(m=>['scheduled','live'].includes(m.status)&&Date.parse(m.startsAt)+(m.duration??Infinity)*60000>now).sort((a,b)=>Date.parse(a.startsAt)-Date.parse(b.startsAt))
 const reset=/nuevo tema|empecemos de nuevo|empezar de cero|olvida el contexto/.test(q)
 if(reset)previous={}
 const program=programIn(q),language=languageIn(q),clearAll=/quita (todos )?los filtros|sin filtros/.test(q)
 const allPrograms=clearAll||/todos los programas|cualquier programa|sin programa/.test(q),allLanguages=clearAll||/todos los idiomas|cualquier idioma|sin idioma/.test(q),allDates=clearAll||/todas las fechas|sin fecha|cualquier fecha|ver todas/.test(q)
 const period=/\bhoy\b/.test(q)?'today':/\bmanana\b/.test(q)?'tomorrow':/semana|7 dias|siete dias/.test(q)?'week':undefined
 const shorter=/mas cort|mas breve|resumelo|resumirlo|(?:de|en) (?:un|1) minuto/.test(q),longer=/mas detall|mas largo|amplialo/.test(q),rewrite=(shorter||longer)&&!!previous.draft
 const personal=/personaliz|con mis recuerdos|con mis palabras/.test(q),template=/prefiero usar una plantilla/.test(q)
 const cancelRequest=/cancel[a-z]*|retir[a-z]*/.test(q)&&/solicitud|participacion|inscripcion/.test(q)
 let directed:AssistantGoal|undefined
 if(/no me dieron|no pude.*(hablar|testimonio)|no tuve.*palabra|no hubo familias|no ocurrio|registr.*(resultado|feedback)|como.*(feedback|resultado)/.test(q))directed='reports'
 else if(/\b(confirma|confirmame|confirmas|selecciona|elige|asigname|asigna)\b/.test(q)||/quien.*(decide|confirma)|criterios|seleccion manual|revis.*candidat/.test(q))directed='selection'
 else if(/mi solicitud|mis solicitudes|mi inscripcion|mis inscripciones|tengo confirmad|mis confirmad|mientras espero/.test(q)||cancelRequest)directed='applications'
 else if(/publica|publicacion|borrador|invitacion|redacta.*aviso/.test(q))directed='publication'
 else if(/pregunt.*(host|anfitrion|equipo|idioma|turno|enlace)|(host|anfitrion).*pregunt|preguntas pendientes|preguntas sin responder/.test(q))directed='questions'
 else if(/nervio|verguenza|miedo/.test(q))directed='motivation'
 else if(/prepar|testimonio|guion/.test(q)||personal||template)directed='prepare'
 else if(/perfil|mi disponibilidad/.test(q))directed='profile'
 else if(/\b(ver|buscar|busca|encontrar|inscribirme|anotarme|apuntarme)\b.*(reunion|jdp|agenda)|que reuniones/.test(q))directed='meetings'
 else if(/atencion|siguiente paso|como empiezo|resumen/.test(q))directed='overview'
 let goal=directed||classify(message).goal
 if(rewrite)goal=previous.draft?.kind==='story'?'prepare':previous.draft?.kind==='question'?'questions':'publication'
 const entityFollowup=!!(program||language||period||allPrograms||allLanguages||allDates||/solo abiertas|donde pueda solicitar/.test(q))
 const correction=/^(no |mejor |y |las |los |en |de )/.test(q)&&entityFollowup&&words(q).length<5
 // A specific task wins over a short program/language filter. This keeps "mis solicitudes de Tokyo" in applications.
 if(!directed&&!rewrite&&entityFollowup&&(correction||words(q).length<4))goal=previous.awaiting==='program'?'prepare':previous.goal||'meetings'
 if(previous.awaiting==='program'&&program&&!directed)goal='prepare'
 const reference=/\b(?:la|el|opcion|reunion|numero) (primera|primero|segunda|segundo|tercera|tercero|ultima|ultimo|[123])\b/.exec(q)?.[1]||/^(primera|primero|segunda|segundo|tercera|tercero|ultima|ultimo|[123])$/.exec(q)?.[1]
 const ordinal=/primera vez|primero que/.test(q)?undefined:reference==='primera'||reference==='primero'||reference==='1'?0:reference==='segunda'||reference==='segundo'||reference==='2'?1:reference==='tercera'||reference==='tercero'||reference==='3'?2:(reference==='ultima'||reference==='ultimo')&&previous.offeredIds?.length?previous.offeredIds.length-1:undefined
 const explicitMeeting=data.meetings.find(m=>q.includes(normalizeQuestion(m.title.replace(/^JDP · /,'')))&&normalizeQuestion(m.title.replace(/^JDP · /,'')).length>8)
 let meetingId=explicitMeeting?.id||(ordinal!==undefined?previous.offeredIds?.[ordinal]:undefined)
 if(explicitMeeting||ordinal!==undefined){if(!directed&&!rewrite)goal=previous.awaiting==='meeting'?(previous.goal||'details'):'details'}
 if(/detalle|esa reunion|ese encuentro|a que hora|cuando es|ver enlace|cuanto dura|duracion/.test(q)&&!directed&&!meetingId){goal='details';meetingId=previous.meetingId||(previous.offeredIds?.length===1?previous.offeredIds[0]:undefined)}
 const storyReply=(previous.awaiting==='memory'||previous.awaiting==='learning')&&!directed&&!rewrite&&!correction&&!/[?¿]/.test(message)&&q.length>=8
 if(storyReply)goal='prepare'
 const keep=goal===previous.goal||goal==='details'||!directed&&entityFollowup
 const contextual=!!previous.meetingId&&['questions','prepare','details'].includes(goal||'')
 const changedProgram=!!program&&!!previous.program&&program!==previous.program
 const priorMeeting=data.meetings.find(m=>m.id===previous.meetingId)
 const compatibleMeeting=priorMeeting&&(!program||priorMeeting.program===program)&&(!language||priorMeeting.language===language)
 const applicationStatus=/todas (mis )?solicitudes|todos los estados/.test(q)?undefined:/confirmad[oa]s?/.test(q)&&goal==='applications'?'confirmed':/pendientes|en revision/.test(q)&&goal==='applications'?'pending':keep?previous.applicationStatus:undefined
 const state:AssistantState={goal,program:allPrograms?undefined:program||(keep||contextual?previous.program:undefined),language:allLanguages?undefined:language||(keep?previous.language:undefined),period:allDates?undefined:period||(keep?previous.period:undefined),availableOnly:clearAll?undefined:/solo abiertas|donde pueda solicitar/.test(q)?true:/incluir todas|tambien las cerradas/.test(q)?false:keep?previous.availableOnly:undefined,meetingId:meetingId||((keep||contextual)&&compatibleMeeting?previous.meetingId:undefined),offeredIds:keep||contextual?previous.offeredIds:undefined,applicationStatus,responseStyle:shorter?'short':longer?'full':keep?previous.responseStyle:undefined,story:goal==='prepare'&&!changedProgram?previous.story:undefined,draft:rewrite?previous.draft:undefined}
 const answer:AssistantAnswer={text:'',actions:[],suggestions:[],sources:['Guía del Hub'],checks:[],state}
 const protectedNames=[...new Set(data.meetings.map(m=>m.schoolName).filter((name):name is string=>!!name))].sort((a,b)=>b.length-a.length)
 const copy=(text:string)=>{let result=text;protectedNames.forEach((name,index)=>{result=result.replaceAll(name,`\u0000school${index}\u0000`)});result=spanishCopy(result);protectedNames.forEach((name,index)=>{result=result.replaceAll(`\u0000school${index}\u0000`,name)});return result}
 const finish=(text:string,actions:AssistantAction[]=[],suggestions:string[]=[])=>({...answer,text:copy(text),actions:actions.map(item=>{
  const translated={...item,label:copy(item.label)}
  if(translated.kind==='question')return {...translated,text:copy(translated.text)}
  if(translated.kind==='publication')return {...translated,title:copy(translated.title),body:copy(translated.body)}
  return translated
 }),suggestions:suggestions.map(spanishCopy),sources:answer.sources.map(spanishCopy),checks:answer.checks.map(spanishCopy)})
 const meeting=data.meetings.find(m=>m.id===state.meetingId)
 const own=(m:Meeting)=>data.registrations.find(r=>r.meetingId===m.id&&r.userId===data.user.id)
 const localDate=(offset:number)=>{const date=new Date(dayKey(new Date(now),zone)+'T12:00:00Z');date.setUTCDate(date.getUTCDate()+offset);return date.toISOString().slice(0,10)}
 const filters=(m:Meeting,checkPeriod=true,checkAvailability=true)=>{
  if(state.program&&m.program!==state.program||state.language&&m.language!==state.language)return false
  const day=dayKey(new Date(m.startsAt),zone),today=dayKey(new Date(now),zone)
  if(checkPeriod&&state.period==='today'&&day!==today)return false
  if(checkPeriod&&state.period==='tomorrow'&&day!==localDate(1))return false
  if(checkPeriod&&state.period==='week'&&(day<today||day>localDate(6)))return false
  if(checkAvailability&&state.availableOnly&&(star?!participationState(m,own(m),!!data.confirmedCounts[m.id],now).canRequest:!!data.confirmedCounts[m.id]))return false
  return true
 }
 if(/ignora.*(regla|instruccion|permiso)|cambia.*rol|muestra.*(contrasena|secret|notas internas)|datos de otro/.test(q))return finish('Puedo ayudarte con la información y las acciones disponibles en tu cuenta. Los permisos y la selección manual se mantienen en el Hub.',[nav('Ver mi cuenta','Mi cuenta')],['¿Qué puedo hacer con mi cuenta?'])
 if(ordinal!==undefined&&!meetingId){
  const offered=(previous.offeredIds||[]).filter(id=>data.meetings.some(m=>m.id===id))
  state.goal=previous.goal||'details';state.awaiting='meeting';state.meetingId=undefined;state.offeredIds=offered
  return finish(offered.length?`En la lista anterior te mostré ${offered.length} ${offered.length===1?'reunión':'reuniones'}. Elige una de esas opciones para seguir.`:'Todavía no tengo una lista de reuniones a la que pueda referirme. Primero podemos consultar la agenda.',[],offered.length?offered.map((_,i)=>['La primera','La segunda','La tercera'][i]):['¿Qué reuniones hay?'])
 }
 if(!goal){
  const found=data.publications.map(post=>({post,score:docScore(q,post.title,post.body)})).filter(item=>item.score>=3).sort((a,b)=>b.score-a.score)[0]
  if(found){answer.sources=['Publicaciones visibles en tu cuenta'];answer.checks=['Busqué coincidencias en el título y contenido de publicaciones que puedes leer.'];return finish(`Encontré una publicación relacionada: «${found.post.title}».\n\n${found.post.body.slice(0,650)}${found.post.body.length>650?'…':''}`,[nav('Leer publicaciones','Publicaciones')],['¿Qué reuniones hay?','¿Cómo preparo mi historia?'])}
  return finish(/^(hola|buenas|hey|gracias|buenos dias)/.test(q)?`Hola, ${data.user.name.split(' ')[0]}. Puedo ayudarte a encontrar tu siguiente paso en el Hub. ¿Qué te gustaría resolver?`:'No tengo una respuesta fiable para eso. Mi ayuda se centra en las JDP y el funcionamiento del Hub. Puedes preguntarme por la agenda, las solicitudes, la preparación o los mensajes del equipo.',[],admin?['¿Qué necesita mi atención?','Ayúdame a escribir una invitación','¿Cómo reviso candidatos?']:['¿Qué reuniones hay?','¿Cómo va mi solicitud?','Ayúdame con mi testimonio'])
 }
 if(goal==='overview'){
  answer.sources=['Agenda y tareas visibles en tu cuenta'];answer.checks=['Comprobé reuniones activas, preguntas sin respuesta y el rol de tu cuenta.']
  const pending=data.questions.filter(q=>!q.reply).length
  if(admin){const requests=data.registrations.filter(r=>r.status==='pending'&&active.some(m=>m.id===r.meetingId)).length;return finish(`Puedes empezar por las tareas abiertas: ${requests} solicitudes en revisión y ${pending} preguntas sin respuesta.\n\nRevisa candidatos con tus propios criterios, resuelve las dudas y prepara las próximas JDP.`,[nav('Revisar solicitudes','Solicitudes'),nav('Responder preguntas','Mensajes','Preguntas'),nav('Agregar una novedad','Publicaciones')])}
  if(!star)return finish(`Tienes ${active.length} reuniones próximas o en curso y ${pending} preguntas pendientes. Prepara las indicaciones, reserva el turno del Star y completa el resultado después del encuentro.`,[nav('Ver mis reuniones','Reuniones'),nav('Responder preguntas','Mensajes','Preguntas'),nav('Registrar resultados','Resultados')])
  const confirmed=active.filter(m=>own(m)?.status==='confirmed'),waiting=active.filter(m=>own(m)?.status==='pending');return finish(`Tienes ${confirmed.length} participaciones confirmadas y ${waiting.length} solicitudes en revisión. ${confirmed.length?'Puedes preparar tu próxima historia y acordar tu turno con el anfitrión.':'Puedes explorar nuevas JDP y preparar una historia mientras coordinación revisa tus solicitudes.'}`,[nav('Ver mis solicitudes','Mis solicitudes'),nav('Preparar mi historia','Preparación'),nav('Explorar reuniones','Reuniones')])
 }
 if(goal==='meetings'){
  const matches=active.filter(m=>filters(m)),label=[state.program,state.language&&languageText(state.language),state.period==='today'?'hoy':state.period==='tomorrow'?'mañana':state.period==='week'?'en los próximos 7 días':null,state.availableOnly?(star?'con solicitud abierta para ti':'sin Star confirmado'):null].filter(Boolean).join(' · ')
  answer.sources=['Agenda visible en tu cuenta','Estado actual de solicitudes'];answer.checks=[`Revisé ${active.length} reuniones próximas o en curso de tu cuenta.`,label?`Apliqué estos filtros: ${label}.`:'Ordené los encuentros por fecha.',`Convertí las horas a ${zone}.`]
  state.offeredIds=matches.slice(0,3).map(m=>m.id);state.meetingId=matches.length===1?matches[0].id:undefined
  if(!matches.length){const next=active.find(m=>filters(m,false));return finish(`No encontré reuniones ${label?'con estos filtros: '+label:'próximas en tu cuenta'}.${next&&state.period?'\n\nLa siguiente fuera de ese periodo es: '+displayMeeting(next,zone)+'.':''}\n\nPuedes ampliar los filtros en la agenda.`,[nav('Revisar agenda','Reuniones')],['Ver todas las fechas','Ver todos los idiomas','Todos los programas'])}
  const lines=matches.slice(0,3).map((m,i)=>{const status=star?participationState(m,own(m),!!data.confirmedCounts[m.id],now).label:data.confirmedCounts[m.id]?'Star confirmado':'Sin Star confirmado';return `${i+1}. ${displayMeeting(m,zone)}\n${status}.`})
  return finish(`Encontré ${matches.length} ${matches.length===1?'encuentro':'encuentros'}${label?' · '+label:''}. Horario en ${zone.split('/').pop()?.replace(/_/g,' ')}.\n\n${lines.join('\n\n')}${star?'\n\nEnviar una solicitud no confirma el lugar. Coordinación elige manualmente a un único Star.':''}`,[...matches.slice(0,3).map(m=>({kind:'meeting' as const,meetingId:m.id,label:'Ver '+m.title.replace(/^JDP · /,'')})),nav('Abrir agenda completa','Reuniones')],matches.length>1?['Cuéntame sobre la primera','Solo abiertas','¿Y en inglés?']:['¿Cómo me preparo?','Quiero preguntar al anfitrión'])
 }
 if(goal==='details'){
  answer.sources=['Detalle de la JDP visible en tu cuenta']
  if(!meeting){state.awaiting='meeting';state.offeredIds=active.slice(0,3).map(m=>m.id);return finish('¿Sobre qué reunión? Elige una para revisar el horario y sus indicaciones.',active.slice(0,3).map(m=>({kind:'meeting',meetingId:m.id,label:m.title.replace(/^JDP · /,'')})),active.slice(0,3).map((_,i)=>['La primera','La segunda','La tercera'][i]))}
  const status=star?participationState(meeting,own(meeting),!!data.confirmedCounts[meeting.id],now):undefined
  answer.checks=['Usé el estado de la reunión y la solicitud actual; no inferí asistencia ni confirmación.']
  return finish(`${displayMeeting(meeting,zone)}.\n\n${meeting.description}\n\n${status?status.title+'. '+status.message:'Anfitrión: '+meeting.host+'. '+(data.confirmedCounts[meeting.id]?'Tiene un Star confirmado.':'El lugar todavía no tiene un Star confirmado.')}${meeting.hostNote?'\n\nIndicaciones: '+meeting.hostNote:''}`,[{kind:'meeting',meetingId:meeting.id,label:'Abrir detalle de la JDP'}],['Ayúdame a preparar mi historia','Quiero preguntar al anfitrión'])
 }
 if(goal==='applications'){
  if(!star)return finish('Puedes revisar las solicitudes y asignaciones desde tu espacio. La confirmación corresponde a administración y admite un único Star por JDP.',[nav(admin?'Revisar solicitudes':'Ver mi Star',admin?'Solicitudes':'Participante')])
  const mine=data.registrations.filter(r=>r.userId===data.user.id&&r.status!=='withdrawn').map(r=>({r,m:data.meetings.find(m=>m.id===r.meetingId)})).filter((item):item is {r:typeof item.r;m:Meeting}=>!!item.m).filter(({m})=>!state.program||m.program===state.program)
  if(cancelRequest)return finish('Abre la reunión desde Mis solicitudes y elige retirar tu solicitud o cancelar tu participación. Revisa la acción antes de guardarla. Si tenías el lugar confirmado, coordinación recibirá un aviso para elegir un reemplazo.',[nav('Revisar mi solicitud','Mis solicitudes')])
 const current=mine.filter(({r,m})=>(!state.applicationStatus||r.status===state.applicationStatus)&&filters(m,true,false)).filter(({m})=>['scheduled','live'].includes(m.status)&&Date.parse(m.startsAt)+(m.duration??Infinity)*60000>now).sort((a,b)=>Date.parse(a.m.startsAt)-Date.parse(b.m.startsAt))
  answer.sources=['Tus solicitudes','Estados de las reuniones'];answer.checks=['Separé solicitudes activas del historial. Una reunión finalizada no cuenta por sí misma como asistencia.']
  state.offeredIds=current.slice(0,3).map(({m})=>m.id);state.meetingId=current.length===1?current[0].m.id:undefined
  if(!current.length)return finish(`No tienes solicitudes activas que coincidan${state.program?' con '+state.program:''}${state.applicationStatus==='confirmed'?' en estado confirmado':state.applicationStatus==='pending'?' en revisión':''}.${mine.length?' Las anteriores están en Historial; no se convierten en asistencias automáticamente.':''}`,[nav('Ver mis solicitudes','Mis solicitudes'),nav('Buscar una JDP','Reuniones')],['¿Qué reuniones hay?'])
  return finish(current.map(({m,r})=>{const status=participationState(m,r,!!data.confirmedCounts[m.id],now);return `${displayMeeting(m,zone)}: ${status.label}.\n${status.message}`}).join('\n\n'),[nav('Abrir mis solicitudes','Mis solicitudes')],['¿Quién decide la confirmación?','¿Qué hago mientras espero?'])
 }
 if(goal==='selection'){
  answer.sources=['Reglas de selección manual','Solicitudes visibles en tu cuenta'];answer.checks=['No seleccioné, confirmé ni ordené estudiantes por mérito.']
  if(!admin)return finish('Isa, Ela y las personas administradoras revisan los perfiles y confirman manualmente a un único Star. El Hub organiza las candidaturas según los criterios de cada JDP. Puedes consultar tu estado en Solicitudes y la decisión llegará a Novedades.',[nav(star?'Ver mis solicitudes':'Ver participante',star?'Mis solicitudes':'Participante')],['¿Cómo va mi solicitud?'])
  const unassigned=active.filter(m=>!data.confirmedCounts[m.id]&&filters(m)),count=unassigned.reduce((sum,m)=>sum+data.registrations.filter(r=>r.meetingId===m.id&&r.status==='pending').length,0)
  return finish(`Hay ${unassigned.length} JDP próximas sin Star confirmado y ${count} solicitudes pendientes asociadas${state.program?' en '+state.program:''}.\n\nPuedes contrastar idiomas, programa, disponibilidad, experiencia e historial con tus propios criterios. La decisión final es del equipo; yo no elijo ni confirmo a un estudiante.`,[nav('Revisar candidatos','Solicitudes')],['Ayúdame a escribir una invitación','¿Qué reuniones hay?'])
 }
 if(goal==='prepare'){
  const chosenProgram=state.program||meeting?.program||(star&&data.profile?.programs.length===1?data.profile.programs[0]:undefined)
  if(!chosenProgram){state.awaiting='program';return finish('Vamos a darle forma a tu historia. ¿De qué programa quieres hablar: Orlando, Tokio o Londres?',[],['Orlando','Tokyo','London'])}
  state.program=chosenProgram
  if(personal&&!rewrite){state.awaiting='memory';return finish(`Hagamos que la historia de ${chosenProgram} suene a ti. Cuéntame un momento concreto que hayas vivido: ${chosenProgram==='Orlando'?'una visita a los parques, algo que te sorprendió de la NASA o un recuerdo con tu grupo':'una actividad, una conversación o algo que te sorprendió'}.

Voy a usar lo que tú cuentes para armar un borrador, sin inventar experiencias.`,[],['No sé qué recuerdo elegir'])}
  if(previous.awaiting==='memory'&&!changedProgram&&!directed&&!rewrite){
   state.awaiting='memory'
   if(/no se|no recuerdo|no tengo/.test(q))return finish('Piensa en una actividad que disfrutaste, algo que intentaste por primera vez o una persona con la que aprendiste. Elige solo un momento y cuéntalo con tus palabras.',[],['Prefiero usar una plantilla'])
   if(storyReply){state.story={memory:message.trim().slice(0,600)};state.awaiting='learning';return finish(`Me quedo con este recuerdo tuyo:

«${state.story.memory}»

¿Qué aprendiste o qué cambió para ti con esa experiencia?`,[],['Prefiero terminar con mi recuerdo'])}
  }
  if(previous.awaiting==='learning'&&!changedProgram&&!directed&&!rewrite&&/no se|no recuerdo|no tengo/.test(q)){state.awaiting='learning';return finish('Puedes pensar en algo que ahora te resulte más fácil, una habilidad que practicaste o algo que descubriste sobre ti. También puedes terminar el borrador con tu recuerdo y completar el aprendizaje después.',[],['Prefiero terminar con mi recuerdo'])}
  if(previous.awaiting==='learning'&&!changedProgram&&!directed&&!rewrite&&storyReply&&!/prefiero terminar/.test(q))state.story={...previous.story,learning:message.trim().slice(0,600)}
  state.awaiting=undefined
  const short=state.responseStyle==='short',memory=state.story?.memory,learning=state.story?.learning
  const lines=[`Hola, soy ${star?data.user.name.split(' ')[0]:'[tu nombre]'} y participé en ${chosenProgram}.`,memory?`Un recuerdo que quiero compartir: «${memory}».`:'Un momento que recuerdo es [tu recuerdo].',learning?`Lo que me dejó esa experiencia: «${learning}».`:'Me ayudó a aprender [tu aprendizaje].',...(!short?['A una familia que esté pensando en el programa le contaría [tu consejo personal].']:[])]
  const text=lines.join('\n')
  state.draft={kind:'story',text}
  answer.sources=['Guía de preparación',...(memory?['Recuerdo compartido en esta conversación']:[])]
  answer.checks=[memory?'Usé tus propias palabras para el recuerdo; las partes que faltan siguen entre corchetes.':'Los recuerdos y aprendizajes quedan como espacios para que los completes; no inventé vivencias.']
  return finish(`${short?'Una versión más breve':'Un borrador para contar tu historia'} de ${chosenProgram}:

${text}

${short?'Revísalo y ajústalo a tu forma de hablar.':'Completa lo que está entre corchetes, practica con tus palabras y acuerda tu turno con el anfitrión.'}${state.language?' El idioma que veníamos revisando es '+languageText(state.language)+'.':''}`,star?[nav('Abrir mi guía de preparación','Preparación'),nav('Preguntar por mi turno','Mensajes','Preguntas')]:[nav('Preparar indicaciones','Mensajes','Indicaciones')],memory?['Hazlo más corto','Quiero preguntar al anfitrión']:['Quiero personalizar mi historia','Hazlo más corto','Me da nervios participar'])
 }
 if(goal==='questions'){
  answer.sources=['Preguntas y reuniones visibles en tu cuenta']
  if(!star){const pending=data.questions.filter(question=>!question.reply);return finish(`Tienes ${pending.length} ${pending.length===1?'pregunta pendiente':'preguntas pendientes'} en tus reuniones. Responde con una indicación concreta sobre el turno, idioma o preparación. El Star recibirá un aviso.`,[nav('Responder preguntas','Mensajes','Preguntas'),nav('Editar indicaciones','Mensajes','Indicaciones')])}
  const matching=active.filter(m=>filters(m)),confirmed=matching.filter(m=>own(m)?.status==='confirmed'),waiting=matching.filter(m=>own(m)?.status==='pending')
  const candidates=confirmed.length?confirmed:waiting.length?waiting:matching
  const target=meeting||(candidates.length===1?candidates[0]:undefined)
  const short=state.responseStyle==='short'
  const subject=previous.draft?.kind==='question'&&(rewrite||!directed&&previous.goal==='questions')?normalizeQuestion(previous.draft.text):q
  const text=/idioma/.test(subject)?short?'Hola, ¿en qué idioma compartiré mi experiencia?':'Hola, ¿en qué idioma compartiré mi experiencia? ¿Habrá apoyo si lo necesito?':/enlace|acceso|entrar/.test(subject)?short?'Hola, ¿dónde reviso el enlace de la JDP?':'Hola, ¿dónde puedo revisar el enlace de acceso y con cuánto tiempo debo conectarme?':/prepar/.test(subject)?'Hola, ¿qué me recomiendas preparar antes de esta JDP?':short?'Hola, ¿cuándo será mi turno?':'Hola, ¿en qué momento compartiré mi experiencia y cuánto tiempo tendré?'
  if(!target&&candidates.length>1){state.awaiting='meeting';state.offeredIds=candidates.slice(0,3).map(m=>m.id);state.draft={kind:'question',text};return finish(`¿Para qué reunión quieres preparar la pregunta?

${candidates.slice(0,3).map((m,i)=>`${i+1}. ${displayMeeting(m,zone)}`).join('\n\n')}`,[],candidates.slice(0,3).map((_,i)=>['La primera','La segunda','La tercera'][i]))}
  state.awaiting=undefined;state.meetingId=target?.id
  state.draft={kind:'question',text,meetingId:target?.id}
  return finish(`Puedes enviarle esta pregunta ${target?'al equipo de '+target.title.replace(/^JDP · /,''):'al anfitrión de la reunión que elijas'}:

«${text}»

Ábrela en el formulario, revisa la reunión y edítala antes de tocar Enviar pregunta. Todavía no he enviado nada.`,[{kind:'question',label:'Revisar y enviar esta pregunta',text,meetingId:target?.id}],['¿Cómo va mi solicitud?','Ayúdame con mi testimonio'])
 }
 if(goal==='publication'){
  if(!admin)return finish('Las novedades las publica coordinación. Puedes leer sus invitaciones y recomendaciones desde Publicaciones, o preguntar al equipo desde Mensajes.',[nav('Ver publicaciones','Publicaciones'),nav('Abrir mensajes','Mensajes','Preguntas')])
  const short=state.responseStyle==='short',title=state.program?`Tu experiencia en ${state.program} puede inspirar`:'Tu historia puede inspirar a una familia'
  const body=short?`Tu experiencia en ${state.program||'CODED'} puede inspirar a una familia. Busca una JDP en tu horario e idioma y envía tu solicitud desde el Hub. Coordinación revisará las candidaturas y confirmará a un único Star. Si tienes dudas, el anfitrión te acompaña.`:`¿Qué momento de ${state.program||'tu experiencia CODED'} te gustaría compartir? Tu mirada puede ayudar a nuevas familias a conocer el programa.

Revisa las próximas JDP y elige un horario e idioma que te funcionen. Envía tu solicitud; coordinación revisará los perfiles y confirmará a un único Star por reunión.

Si tienes dudas sobre tu turno o la preparación, escríbele al anfitrión desde el Hub. Te acompañamos en cada paso.`
  state.draft={kind:'publication',text:body,title}
  return finish(`${short?'Una invitación más breve':'Aquí tienes una invitación para revisar con el equipo'}:

${title}

${body}

Puedes abrirla en el editor, ajustar el texto y elegir su público. La publicación se guarda solo cuando tú lo decidas.`,[{kind:'publication',label:'Abrir este borrador en el editor',title,body}],['Hazlo más corto','¿Cómo reviso candidatos?','¿Qué preguntas están pendientes?'])
 }
 if(goal==='profile')return finish(star?'Puedes actualizar tus idiomas, programas, disponibilidad y experiencia desde Mi cuenta. Indica el país o la zona horaria al describir tus horarios para ayudar al equipo. Los cambios no confirman una solicitud.':'Mi cuenta reúne tus herramientas. Los Stars actualizan sus propios idiomas, programas y disponibilidad; coordinación los ve al revisar candidatos.',[nav('Abrir mi cuenta','Mi cuenta')],['¿Cómo va mi solicitud?'])
 if(goal==='reports'){
  answer.sources=['Reglas de resultados','Resultados visibles en tu cuenta']
  const pending=data.meetings.filter(m=>reportAvailable(m)&&m.status!=='cancelled'&&(admin||role==='host'||own(m)?.status==='confirmed')&&!data.reports.some(r=>r.meetingId===m.id&&r.userId===data.user.id))
  return finish(`${/no me dieron|no tuve.*palabra|no hubo familias|no ocurrio/.test(q)?'Puedes registrar lo que pasó, también si estuviste conectado y no pudiste dar tu testimonio.\n\n':''}El resultado distingue conexión, oportunidad de hablar, testimonio y presencia de familias. Finalizar la reunión no registra automáticamente asistencia. ${admin?'Puedes revisar ambas versiones y guardar una nota de seguimiento.':`Hay ${pending.length} encuentros disponibles para revisar desde tu espacio. Las respuestas se completan cuando termina el horario o el equipo finaliza la reunión.`}`,[nav(admin?'Abrir seguimiento':'Contar cómo fue',admin?'Seguimiento':star?'Mi experiencia':'Resultados')])
 }
 if(goal==='account')return finish(`Tu perfil actual es ${admin?'Administración':star?'Coded Star':'Anfitrión'}. ${admin?'Puedes organizar reuniones, revisar solicitudes y publicar novedades. Isa y Ela tienen perfiles independientes de administración en la demo.':star?'Puedes completar tu perfil, solicitar una JDP, preguntar al anfitrión y registrar tu propio resultado.':'Puedes preparar tus reuniones asignadas, responder dudas y registrar lo ocurrido.'}\n\nPara cambiar de perfil de prueba: abre el menú, cierra sesión y elige el rol y la persona. Las cuentas actuales funcionan en esta demo local.`,[nav('Ver mis herramientas','Mi cuenta')])
 if(goal==='motivation')return finish(star?'Empieza por un recuerdo pequeño que quieras compartir. Puedes preparar tres ideas, practicarlas con calma y preguntar al anfitrión cómo será tu turno. Tu experiencia tiene valor y puedes pedir acompañamiento.':[ 'Para facilitar la participación, prueba este recorrido:', '1. Publica oportunidades con horario, idioma y expectativas claras.', '2. Responde dudas antes del encuentro y confirma el turno del Star.', '3. Al terminar, revisa lo que ambos reportaron y escucha qué ayudaría a volver.', '', 'La mejora de participación se podrá medir en un piloto; los datos de esta demo son ficticios.' ].join('\n'),star?[nav('Preparar mi historia','Preparación'),nav('Hablar con el equipo','Mensajes','Preguntas')]:[nav('Compartir una invitación','Publicaciones'),nav('Revisar preguntas','Mensajes','Preguntas')],star?['Ayúdame con mi testimonio']:['Escribe una invitación para Stars'])
 if(goal==='privacy')return finish('Uso los datos que puede ver tu cuenta. Las conversaciones del asistente quedan asociadas a ese perfil dentro de la demo. Un anfitrión solo consulta sus reuniones y un Star no recibe candidaturas ni notas internas de otras personas. La demo utiliza información ficticia.',[nav('Ver mi cuenta','Mi cuenta')])
 return finish('Soy el asistente local de CODED Stars Hub. Relaciono tu consulta con la agenda, los estados y las guías del proyecto, y conservo el contexto de esta conversación. Funciono sin API ni servicios de pago.\n\nMi ayuda está centrada en el Hub. No soy GPT ni un modelo de lenguaje general. Si falta información, te pediré que la aclares.',[],['¿Qué reuniones hay?','Ayúdame con mi testimonio',admin?'Escribe una invitación para Stars':'¿Cómo va mi solicitud?'])
}
