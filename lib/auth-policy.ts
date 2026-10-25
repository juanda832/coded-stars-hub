import type { User } from './types.ts'

type Identity={
 externalId:string|null
 privateMetadata:Record<string,unknown>
 emailAddresses:Array<{emailAddress:string;verification:{status:string}|null}>
 banned?:boolean
 locked?:boolean
}
export function resolvePersonalUser(identity:Identity|null,directory:User[]):User|null{
 if(!identity||identity.banned||identity.locked)return null
 const externalId=identity.externalId
 if(!externalId?.startsWith('coded-stars-hub:'))return null
 const hubId=externalId.slice('coded-stars-hub:'.length)
 const account=directory.find(user=>user.id===hubId)
 if(!account)return null
 const metadata=identity.privateMetadata.codedHub
 if(!metadata||typeof metadata!=='object'||Array.isArray(metadata))return null
 const grant=metadata as Record<string,unknown>
 if(grant.userId!==account.id||grant.role!==account.role)return null
 const address=identity.emailAddresses.find(item=>item.verification?.status==='verified'&&item.emailAddress.toLowerCase()===account.email.toLowerCase())
 if(!address)return null
 return {...account,email:address.emailAddress,name:account.name.replace(/ · Demo$/,'')}
}
