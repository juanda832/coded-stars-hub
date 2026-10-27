import { createHmac, timingSafeEqual } from 'crypto'
import { cookies } from 'next/headers'
import { directoryUsers, recordAccountVisit } from './user-directory'
import { requirePersonalAccess } from './auth-mode'
import { resolvePersonalUser } from './auth-policy'
import { User } from './types'
import { reviewRole } from './review-policy'
import {users as examples} from './demo-users'
const secret = process.env.SESSION_SECRET || (process.env.NODE_ENV === 'production' ? '' : 'local-demo-secret-change-before-deploy')
function sign(value: string) { if (!secret) throw new Error('SESSION_SECRET is required'); return createHmac('sha256',secret).update(value).digest('hex') }
export function makeSession(id: string) { if(requirePersonalAccess())throw new Error('Demo sessions are disabled for personal access'); const expires = Date.now() + 7*24*60*60*1000; const payload = `${id}.${expires}`; return `${payload}.${sign(payload)}` }
async function reviewedUser(user:User|null,ignoreReview:boolean){
 if(ignoreReview||!user)return user
 const role=reviewRole(user,(await cookies()).get('coded_review')?.value,process.env.CODED_ALLOW_REAL_ACCOUNTS==='true')
 if(!role)return user
 if(role==='admin')return {...user,reviewer:{id:user.id,name:user.name}}
 const example=examples.find(item=>item.id===(role==='star'?'star-1':'host-1'))!
 return {...example,reviewer:{id:user.id,name:user.name}}
}
export async function currentUser(ignoreReview=false): Promise<User | null> {
 if(requirePersonalAccess()){
  const {auth,currentUser:clerkUser}=await import('@clerk/nextjs/server')
  const session=await auth()
  if(!session.isAuthenticated)return null
  const user=resolvePersonalUser(await clerkUser(),await directoryUsers())
  if(user)await recordAccountVisit(user.id)
  return reviewedUser(user,ignoreReview)
 }
 const raw=(await cookies()).get('coded_session')?.value; if (!raw) return null; const [id, expiry, sig]=raw.split('.'); if (!id || !expiry || !sig || Number(expiry)<Date.now()) return null; const expected=Buffer.from(sign(`${id}.${expiry}`),'hex'); const actual=Buffer.from(sig,'hex'); if (expected.length!==actual.length || !timingSafeEqual(expected,actual)) return null; return reviewedUser((await directoryUsers()).find(u=>u.id===id) ?? null,ignoreReview) }
