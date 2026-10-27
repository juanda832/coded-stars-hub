import type {User} from './types.ts'

export type ReviewActor={id:string;name:string}
export function reviewRole(user:User|null,cookie:string|undefined,realDataEnabled:boolean):'star'|'host'|'admin'|null {
 if(!user||user.role!=='admin'||realDataEnabled)return null
 const [owner,role,...extra]=(cookie||'').split(':')
 if(owner!==user.id||extra.length||!['star','host','admin'].includes(role))return null
 return role as 'star'|'host'|'admin'
}
