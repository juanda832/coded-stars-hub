'use client'

import { useRef, useState } from 'react'
import { ArrowRight, MessageCircle } from 'lucide-react'

export default function DraftSuggestions({suggestions,text,onUse,disabled=false}:{suggestions:{label:string;text:string}[];text:string;onUse:(text:string)=>void;disabled?:boolean}) {
  const [proposed,setProposed]=useState<{label:string;text:string}|null>(null)
  const opener=useRef<HTMLButtonElement|null>(null)
  const preview=useRef<HTMLElement|null>(null)
  function close(){setProposed(null);requestAnimationFrame(()=>opener.current?.focus())}
  return <div className="draft-suggestions"><span>Usa una idea y adáptala</span><div>{suggestions.map(suggestion=><button type="button" key={suggestion.label} disabled={disabled} onClick={event=>{if(text.trim()&&text!==suggestion.text){opener.current=event.currentTarget;setProposed(suggestion);requestAnimationFrame(()=>preview.current?.focus())}else onUse(suggestion.text)}}><MessageCircle size={14}/>{suggestion.label}</button>)}</div>{proposed&&<section ref={preview} tabIndex={-1} className="draft-replacement" aria-label="Revisar idea antes de reemplazar el borrador"><b>Ya tienes un borrador. Revisa esta idea antes de reemplazarlo.</b><p>{proposed.text}</p><div><button type="button" className="secondary-button" onClick={close}>Conservar mi texto</button><button type="button" className="primary" onClick={()=>{onUse(proposed.text);setProposed(null)}}>Usar esta idea <ArrowRight size={15}/></button></div></section>}</div>
}
