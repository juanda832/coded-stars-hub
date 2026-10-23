'use client'

import { useEffect, useState } from 'react'
import { restoreMessageDraft } from '@/lib/question-inbox'

export default function useMessageDraft(storageKey:string,initialText='') {
  const [text,setText]=useState(''),[ready,setReady]=useState(false),[status,setStatus]=useState('Abriendo tu borrador…')
  useEffect(()=>{
    try{setText(initialText||restoreMessageDraft(localStorage.getItem(storageKey)));setStatus('Borrador privado en este navegador.')}
    catch{setText(initialText);setStatus('No pudimos recuperar el borrador. Puedes escribir y copiar tu texto.')}
    setReady(true)
  },[storageKey,initialText])
  function update(value:string) {
    const next=value.slice(0,500)
    setText(next)
    try{if(next)localStorage.setItem(storageKey,JSON.stringify({version:1,text:next}));else localStorage.removeItem(storageKey);setStatus(next?'Borrador guardado en este navegador.':'Borrador privado en este navegador.')}
    catch{setStatus('No se pudo guardar. Copia el texto antes de salir de esta pantalla.')}
  }
  function clear(){update('')}
  return {text,ready,status,update,clear}
}
