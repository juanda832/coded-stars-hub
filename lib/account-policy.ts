import type { User } from './types.ts'
import { WorkflowError } from './workflow-error.ts'

export type AccountDraft = { name: string; email: string; role: 'star' | 'host'; requestId: string }
export function normalizeAccountDraft(body: Record<string, unknown>, allowReal: boolean): AccountDraft {
  const name = typeof body.name === 'string' ? body.name.trim().replace(/\s+/g, ' ') : ''
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  if (name.length < 2 || name.length > 80 || /[\u0000-\u001f<>]/.test(name)) throw new WorkflowError('Escribe un nombre de entre 2 y 80 caracteres.')
  if (email.length > 254 || !/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/.test(email)) throw new WorkflowError('Revisa el correo electrónico.')
  if (!allowReal && !/^[^@]+@example\.com$/.test(email)) throw new WorkflowError('Esta beta admite correos ficticios @example.com. Los datos reales deben habilitarse previamente con coordinación.')
  if (body.role !== 'star' && body.role !== 'host') throw new WorkflowError('Elige Coded Star o anfitrión. Los permisos de administración se gestionan por separado.')
  if (typeof body.requestId !== 'string' || !/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(body.requestId)) throw new WorkflowError('Vuelve a abrir el formulario para preparar el alta.')
  return { name, email, role: body.role, requestId: body.requestId }
}
export function accountInitials(name: string) { return name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => Array.from(part)[0]).join('').toUpperCase() }
export function requireAccountAdmin(user: User) { if (user.role !== 'admin') throw new WorkflowError('Solo administración puede gestionar cuentas.', 403) }
export function checkAccountOrigin(origin:string|null,host:string|null,hosted:boolean) {
  if(!origin)return // Authenticated API clients can use a bearer token without Origin.
  let parsed:URL
  try{parsed=new URL(origin)}catch{throw new WorkflowError('Abre el formulario desde el Hub.',403)}
  if(parsed.host!==host||parsed.origin!==origin||!['http:','https:'].includes(parsed.protocol)||(hosted&&parsed.protocol!=='https:'))throw new WorkflowError('Abre el formulario desde el Hub.',403)
}
