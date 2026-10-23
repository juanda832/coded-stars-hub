'use client'
import { Check, Clock3, Sparkles } from 'lucide-react'
export default function ApplicationProgress({confirmed}:{confirmed:boolean}) {
 const steps=[{label:'Solicitud enviada',done:true,icon:Check},{label:confirmed?'Participación confirmada':'Revisión del equipo',done:confirmed,icon:confirmed?Check:Clock3},{label:'Compartir tu historia',done:false,icon:Sparkles}]
 return <ol className="application-progress" aria-label="Pasos de tu participación">{steps.map(({label,done,icon:Icon},index)=><li key={index} className={done?'done':index===(confirmed?2:1)?'current':''}><span><Icon size={14}/></span><b>{label}</b></li>)}</ol>
}
