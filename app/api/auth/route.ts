import { NextRequest, NextResponse } from 'next/server'
import { makeSession } from '@/lib/auth'
import { users } from '@/lib/user-directory'
import { requirePersonalAccess } from '@/lib/auth-mode'
export async function POST(req:NextRequest){
 if(requirePersonalAccess())return NextResponse.json({error:'Usa tu acceso personal para entrar.'},{status:403})
 let input:unknown
 try{input=await req.json()}catch{return NextResponse.json({error:'Solicitud inválida'},{status:400})}
 if(!input||typeof input!=='object'||Array.isArray(input))return NextResponse.json({error:'Solicitud inválida'},{status:400})
 const {email,password}=input as Record<string,unknown>
 const user=users.find(u=>u.email===email)
 if(!user||password!=='Demo2026!')return NextResponse.json({error:'Credenciales incorrectas'},{status:401})
 const res=NextResponse.json({user})
 res.cookies.set('coded_session',makeSession(user.id),{httpOnly:true,sameSite:'lax',secure:req.nextUrl.protocol==='https:',path:'/',maxAge:604800})
 return res
}
export async function DELETE(){
 if(requirePersonalAccess())return NextResponse.json({error:'Cierra sesión desde tu cuenta personal.'},{status:405})
 const res=NextResponse.json({ok:true});res.cookies.delete('coded_session');return res
}
