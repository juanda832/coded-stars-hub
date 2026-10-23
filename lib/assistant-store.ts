import { randomUUID } from 'node:crypto'
import type { User } from './types'
import type { AssistantConversation, AssistantSnapshot } from './assistant-types'
import { records, saveRecord, transaction, WorkflowError } from './store'
import { hubDataFor } from './hub-data'
import { answerHubQuestion } from './assistant'
import { zoneChoices } from './time-zones'

export function assistantSnapshot(user:User,conversationId?:string):AssistantSnapshot {
 const conversations=records<AssistantConversation>('assistant_chats').filter(c=>c.userId===user.id).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt))
 const conversation=conversationId?conversations.find(c=>c.id===conversationId):conversations[0]
 if(conversationId&&!conversation)throw new WorkflowError('Conversación no encontrada.',404)
 return {mode:'local',threads:conversations.map(({id,title,updatedAt,version})=>({id,title,updatedAt,version})),conversation:conversation||null}
}
export function sendAssistantMessage(user:User,body:Record<string,unknown>){return transaction(()=>{
 const message=typeof body.message==='string'?body.message.trim():''
 if(message.length<1||message.length>1200)throw new WorkflowError('Escribe una consulta de hasta 1200 caracteres.')
 if(typeof body.requestId!=='string'||!/^[a-zA-Z0-9-]{12,80}$/.test(body.requestId))throw new WorkflowError('Reintenta el envío desde el asistente.')
 const all=records<AssistantConversation>('assistant_chats').filter(c=>c.userId===user.id)
 const duplicate=all.find(c=>c.messages.some(m=>m.role==='user'&&m.requestId===body.requestId))
 if(duplicate)return assistantSnapshot(user,duplicate.id)
 const recent=all.flatMap(c=>c.messages).filter(m=>m.role==='user'&&Date.parse(m.createdAt)>Date.now()-300000).length
 if(recent>=30)throw new WorkflowError('Hemos recibido muchas consultas seguidas. Espera unos minutos antes de continuar.',429)
 const previous=body.conversationId?all.find(c=>c.id===body.conversationId):undefined
 if(body.conversationId&&!previous)throw new WorkflowError('Conversación no encontrada.',404)
 if(previous&&body.version!==previous.version)throw new WorkflowError('Esta conversación cambió en otra ventana. Vuelve a abrirla antes de enviar tu consulta.',409)
 if(previous&&previous.messages.length>=80)throw new WorkflowError('Esta conversación está completa. Abre una nueva para seguir.')
 if(!previous&&all.length>=30)throw new WorkflowError('Ya tienes 30 conversaciones. Puedes seguir en una conversación anterior.')
 const zone=zoneChoices.some(([value])=>value===body.zone)?String(body.zone):'America/La_Paz'
 const answer=answerHubQuestion(hubDataFor(user),message,previous?.state,zone)
 const time=new Date().toISOString()
 const conversation:AssistantConversation={id:previous?.id||randomUUID(),userId:user.id,title:previous?.title||message.slice(0,60),createdAt:previous?.createdAt||time,updatedAt:time,version:(previous?.version||0)+1,state:answer.state,messages:[...(previous?.messages||[]),{id:randomUUID(),role:'user',text:message,createdAt:time,requestId:body.requestId},{id:randomUUID(),role:'assistant',text:answer.text,createdAt:time,answer}]}
 saveRecord('assistant_chats',conversation.id,conversation)
 return assistantSnapshot(user,conversation.id)
})}
