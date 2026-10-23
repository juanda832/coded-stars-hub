'use client'
import { useState } from 'react'
import { ArrowRight, Check, Heart } from 'lucide-react'
import { participationOptions } from '@/lib/types'
import type { HubAction } from './StarExperience'
export default function ParticipationPoll({currentAnswer,busy,action}:{currentAnswer?:string;busy:boolean;action:HubAction}) {
 const [answer,setAnswer]=useState(''),[editing,setEditing]=useState(false)
 return <aside className="listen-card"><span className="listen-heart"><Heart size={21}/></span><h2>Hagamos que sea más fácil encontrarnos.</h2><p>¿Qué te ayudaría más a venir a una reunión?</p>{currentAnswer&&!editing?<div className="poll-thanks"><Check size={21}/><b>Gracias por contarnos.</b><span>Elegiste: {currentAnswer}</span><p>El equipo podrá usar tu respuesta para organizar los próximos encuentros.</p><button className="text-link" onClick={()=>{setAnswer(currentAnswer||'');setEditing(true)}}>Cambiar mi respuesta</button></div>:<form onSubmit={async e=>{e.preventDefault();if(await action({action:'participation',answer},'Gracias. Tu respuesta ya está disponible para el equipo.'))setEditing(false)}}><fieldset disabled={busy}><legend className="sr-only">Qué te ayudaría a asistir</legend>{participationOptions.map(option=><label className={'poll-option '+(answer===option?'chosen':'')} key={option}><input type="radio" name="participation" value={option} checked={answer===option} onChange={()=>setAnswer(option)}/><span>{option}</span></label>)}</fieldset><button className="secondary-button poll-submit" disabled={!answer||busy} type="submit">Compartir mi respuesta <ArrowRight size={16}/></button><small>Solo el equipo ve tu respuesta. Puedes cambiarla.</small></form>}</aside>
}
