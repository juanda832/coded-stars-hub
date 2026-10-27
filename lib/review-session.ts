import 'server-only'
import {createHash} from 'node:crypto'
import {withStore} from './store'
import type {User} from './types'

export function reviewSchema(adminId:string) {return 'coded_hub_review_'+createHash('sha256').update(adminId).digest('hex').slice(0,16)}
export function withHubStore<T>(user:User,fn:()=>Promise<T>):Promise<T> {
 return withStore(fn,user.reviewer?reviewSchema(user.reviewer.id):undefined)
}
