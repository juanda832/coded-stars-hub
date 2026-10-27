import 'server-only'
import {query,execute} from './database'
import {WorkflowError} from './workflow-error'
import type {BetaContribution,User} from './types'

export async function betaContributions(user:User):Promise<BetaContribution[]> {
 if(user.reviewer)return []
 const rows=await query('SELECT json FROM records WHERE collection=? ORDER BY rowid DESC','beta_contributions')
 return rows.map(row=>JSON.parse(String(row.json)) as BetaContribution).filter(item=>user.role==='admin'||item.authorId===user.id)
}
export async function saveBetaContribution(user:User,body:Record<string,unknown>) {
 const title=typeof body.title==='string'?body.title.trim():'',detail=typeof body.detail==='string'?body.detail.trim():'',section=typeof body.section==='string'?body.section.trim():''
 if(!['error','suggestion','idea'].includes(String(body.kind)))throw new WorkflowError('Elige qué quieres compartir.')
 if(title.length<4||title.length>100||detail.length<10||detail.length>1500||section.length>80)throw new WorkflowError('Agrega un título de 4 a 100 caracteres y una descripción de 10 a 1500. La sección puede tener hasta 80 caracteres.')
 if(typeof body.requestId!=='string'||!/^[a-f0-9-]{36}$/i.test(body.requestId))throw new WorkflowError('Vuelve a abrir el formulario.')
 const id=user.id+':'+body.requestId
 const previous=(await betaContributions(user)).find(item=>item.id===id)
 if(previous)return previous
 const item:BetaContribution={id,kind:body.kind as BetaContribution['kind'],title,detail,section,authorId:user.id,authorName:user.name.replace(/ · Demo$/,''),authorRole:user.role,status:'new',createdAt:new Date().toISOString(),version:1}
 await execute('INSERT INTO records(collection,id,json) VALUES(?,?,?)','beta_contributions',id,JSON.stringify(item))
 return item
}
export async function reviewBetaContribution(user:User,body:Record<string,unknown>) {
 if(user.role!=='admin')throw new WorkflowError('Solo administración puede organizar los aportes.',403)
 if(!['new','reviewing','resolved'].includes(String(body.status)))throw new WorkflowError('Elige un estado válido.')
 const item=(await betaContributions(user)).find(item=>item.id===body.contributionId)
 if(!item)throw new WorkflowError('Aporte no encontrado.',404)
 if(item.version!==body.version)throw new WorkflowError('Otra persona actualizó este aporte. Actualiza antes de continuar.',409)
 const next={...item,status:body.status as BetaContribution['status'],version:item.version+1}
 await execute('UPDATE records SET json=? WHERE collection=? AND id=?',JSON.stringify(next),'beta_contributions',item.id)
 return next
}
