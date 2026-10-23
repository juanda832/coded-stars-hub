'use client'
import { useEffect, useState } from 'react'

export type ReplyPace='natural'|'fast'|'instant'
/** Presentation only: the server has already returned and saved the whole answer. */
export default function AssistantReply({text,animate,pace,onProgress,onComplete}:{text:string;animate:boolean;pace:ReplyPace;onProgress:()=>void;onComplete:()=>void}) {
 const [visible,setVisible]=useState(animate?0:text.length)
 useEffect(()=>{
  if(!animate||pace==='instant'||window.matchMedia('(prefers-reduced-motion: reduce)').matches){setVisible(text.length);if(animate)onComplete();return}
  const characters=Array.from(text),start=performance.now(),pause=pace==='fast'?80:220
  const duration=pace==='fast'?Math.min(3200,characters.length/220*1000):Math.min(8000,characters.length/105*1000)
  setVisible(0)
  const timer=window.setInterval(()=>{
   const elapsed=Math.max(0,performance.now()-start-pause)
   const count=Math.min(characters.length,Math.floor(characters.length*elapsed/Math.max(1,duration)))
   setVisible(characters.slice(0,count).join('').length)
   onProgress()
   if(count===characters.length){window.clearInterval(timer);onComplete()}
  },32)
  return()=>window.clearInterval(timer)
 },[text,animate,pace,onProgress,onComplete])
 // A completed, restored or skipped answer is always immediately readable.
 const writing=animate&&visible<text.length,shown=writing?text.slice(0,visible):text
 return <div className={'assistant-text '+(writing?'is-revealing':'')} aria-live="off"><span className="sr-only">{writing?text:''}</span><div aria-hidden={writing||undefined}>{shown.split('\n\n').map((paragraph,i)=><p key={i}>{paragraph}{writing&&i===shown.split('\n\n').length-1&&<span className="assistant-text-cursor" aria-hidden="true"/>}</p>)}</div></div>
}
