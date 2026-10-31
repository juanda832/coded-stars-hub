import type {Role,User} from './types.ts'

// These assignments come from the private server directory, never request data.
export function assignedRoles(user:User):Role[]{return user.roles||[user.role]}
export function hasAssignedRole(user:User,role:Role){return assignedRoles(user).includes(role)}
export function accountRole(user:User,cookie:string|undefined):User{
 const [id,role,...extra]=(cookie||'').split(':')
 // This cookie selects a view; it is not a credential. Every request first
 // verifies the identity and then checks its current server-defined assignments.
 if(id!==user.id||extra.length||!hasAssignedRole(user,role as Role))return user
 return {...user,role:role as Role}
}
