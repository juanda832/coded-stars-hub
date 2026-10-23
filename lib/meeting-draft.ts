import type { Meeting } from './types'
import { programValue } from './program-labels.ts'
import { ORLANDO_ZONE, zonedDateTime } from './time-zones.ts'

export function secureMeetingLink(value: unknown) {
  if (typeof value !== 'string') throw new Error('Revisa el enlace de acceso.')
  const link = value.trim()
  if (link.length > 1000) throw new Error('El enlace es demasiado largo.')
  if (!link) return ''
  let url: URL
  try { url = new URL(link) } catch { throw new Error('Revisa el enlace de acceso.') }
  if (url.protocol !== 'https:' || url.username || url.password) throw new Error('Usa un enlace seguro que empiece con https:// y no incluya credenciales.')
  return link
}

export function meetingDraft(body: Record<string, unknown>,previous?:Meeting) {
  if(body.schoolName!==undefined&&typeof body.schoolName!=='string')throw new Error('Revisa el nombre del colegio.')
  const schoolName = typeof body.schoolName === 'string' ? body.schoolName.trim() : body.schoolName===undefined?previous?.schoolName||'':''
  const title = schoolName || (typeof body.title==='string'?body.title.trim():previous?.title||'')
  const description = body.description === undefined ? previous?.description||'' : typeof body.description === 'string' ? body.description.trim() : ''
  if(body.sourceTimeZone!==undefined&&body.sourceTimeZone!==ORLANDO_ZONE)throw new Error('La hora original debe estar en horario de Orlando.')
  const startsAt=body.date!==undefined||body.time!==undefined?zonedDateTime(`${body.date}T${body.time}`,ORLANDO_ZONE):body.startsAt
  const date = typeof startsAt === 'string' ? new Date(startsAt) : new Date(NaN)
  const duration = body.duration===undefined?previous?.duration??null:body.duration===null||body.duration===''?null:Number(body.duration)
  const hostNote = body.hostNote === undefined ? previous?.hostNote||'' : typeof body.hostNote === 'string' ? body.hostNote.trim() : ''
  if (schoolName&&(schoolName.length<2||schoolName.length>160))throw new Error('El nombre del colegio debe tener entre 2 y 160 caracteres.')
  if (!title || title.length > 160 || (body.schoolName!==undefined&&!schoolName&&(!previous||previous.schoolName))) throw new Error('Escribe el nombre del colegio.')
  if (description.length > 600 || (description.length>0&&description.length<10)) throw new Error('La descripción opcional debe tener entre 10 y 600 caracteres.')
  if (!Number.isFinite(date.getTime()) || date.getTime() <= Date.now()) throw new Error('Elige una fecha futura para la reunión.')
  if (duration!==null&&(!Number.isInteger(duration) || duration < 15 || duration > 180)) throw new Error('La duración debe estar entre 15 y 180 minutos.')
  const program=body.program===undefined?previous?.program||'':typeof body.program==='string'?body.program.trim():null
  const language=body.language===undefined?previous?.language||'':body.language
  if (program===null||program.length>80) throw new Error('Revisa el programa; puedes dejarlo sin indicar.')
  if (!['','Español', 'English', 'Português'].includes(String(language))) throw new Error('Elige un idioma válido o déjalo sin configurar.')
  if (hostNote.length > 400) throw new Error('El aviso puede tener hasta 400 caracteres.')
  return { title,schoolName:schoolName||undefined,sourceTimeZone:ORLANDO_ZONE,description, startsAt: date.toISOString(), duration, program:programValue(program), language: language as Meeting['language'], hostNote, joinUrl: secureMeetingLink(body.joinUrl ?? previous?.joinUrl ?? '') }
}
