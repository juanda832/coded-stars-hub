'use client'
import { useEffect, useId, useRef } from 'react'
import { X } from 'lucide-react'
export default function Dialog({title,onClose,children,className=''}:{title:string;onClose:()=>void;children:React.ReactNode;className?:string}) {
  const ref=useRef<HTMLDialogElement>(null), titleId=useId()
  useEffect(()=>{const dialog=ref.current,previousFocus=document.activeElement instanceof HTMLElement?document.activeElement:null;dialog?.showModal();const previous=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{document.body.style.overflow=previous;dialog?.close();if(previousFocus?.isConnected&&!document.querySelector('dialog[open]'))previousFocus.focus({preventScroll:true})}},[])
  useEffect(()=>{ref.current?.querySelector('h2')?.focus({preventScroll:true})},[title])
  return <dialog ref={ref} className={'friendly-dialog '+className} aria-labelledby={titleId} onCancel={event=>{event.preventDefault();onClose()}} onClick={e=>{if(e.target===e.currentTarget)onClose()}}><div className="dialog-inner"><div className="dialog-tools"><button className="dialog-close" onClick={onClose} aria-label="Cerrar"><X size={21}/></button></div><h2 id={titleId} tabIndex={-1}>{title}</h2>{children}</div></dialog>
}
