import { NextRequest, NextResponse } from 'next/server'
import { makeSession } from '@/lib/auth'
import { users } from '@/lib/store'
export async function POST(req: NextRequest) { const { email, password }=await req.json(); const user=users.find(u=>u.email===email); if (!user || password!== 'Demo2026!') return NextResponse.json({error:'Credenciales incorrectas'}, {status:401}); const res=NextResponse.json({user}); res.cookies.set('coded_session',makeSession(user.id),{httpOnly:true,sameSite:'lax',secure:req.nextUrl.protocol==='https:',path:'/',maxAge:604800}); return res }
export async function DELETE() { const res=NextResponse.json({ok:true}); res.cookies.delete('coded_session'); return res }
