import { NextResponse } from 'next/server'
import { currentUser } from '@/lib/auth'
import { hubDataFor } from '@/lib/hub-data'
export const runtime='nodejs'
export async function GET(){
 const user=await currentUser();if(!user)return NextResponse.json({error:'Inicia sesión'},{status:401})
 return NextResponse.json(hubDataFor(user),{headers:{'Cache-Control':'no-store'}})
}
