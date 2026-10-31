'use client'
import {useState} from 'react'
import {ArrowLeftRight} from 'lucide-react'
import type {User} from '@/lib/types'
export default function AccountRoleSwitch({user,disabled}:{user:User;disabled:boolean}){
 const [changing,setChanging]=useState(false),[error,setError]=useState('')
 if(user.reviewer||!user.roles?.includes('admin')||!user.roles.includes('star'))return null
 const star=user.role==='star',next=star?'admin':'star'
 async function change(){
  if(changing||disabled)return
  setChanging(true);setError('')
  try{
   const response=await fetch('/api/account-role',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({role:next})})
   const result=await response.json();if(!response.ok)throw new Error(result.error||'No pudimos cambiar de perfil.')
   window.location.assign('/?perfil='+next+'#/inicio')
  }catch(error){setError(error instanceof Error?error.message:'No pudimos cambiar de perfil. Intenta de nuevo.');setChanging(false)}
 }
 return <section className="account-role-switch" aria-label="Tu perfil en el Hub"><div><b>Tu cuenta · {star?'Coded Star':'Administración'}</b>{error&&<p role="alert">{error}</p>}</div><button className="secondary-button" disabled={disabled||changing} onClick={()=>void change()}><ArrowLeftRight size={17}/>{changing?'Cambiando…':star?'Ir a Administración':'Usar como Coded Star'}</button></section>
}
