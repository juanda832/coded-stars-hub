import { createHmac, timingSafeEqual } from 'crypto'
import { cookies } from 'next/headers'
import { users } from './store'
import { User } from './types'
const secret = process.env.SESSION_SECRET || (process.env.NODE_ENV === 'production' ? '' : 'local-demo-secret-change-before-deploy')
function sign(value: string) { if (!secret) throw new Error('SESSION_SECRET is required'); return createHmac('sha256',secret).update(value).digest('hex') }
export function makeSession(id: string) { const expires = Date.now() + 7*24*60*60*1000; const payload = `${id}.${expires}`; return `${payload}.${sign(payload)}` }
export async function currentUser(): Promise<User | null> { const raw=(await cookies()).get('coded_session')?.value; if (!raw) return null; const [id, expiry, sig]=raw.split('.'); if (!id || !expiry || !sig || Number(expiry)<Date.now()) return null; const expected=Buffer.from(sign(`${id}.${expiry}`),'hex'); const actual=Buffer.from(sig,'hex'); if (expected.length!==actual.length || !timingSafeEqual(expected,actual)) return null; return users.find(u=>u.id===id) ?? null }
