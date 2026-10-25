import { NextResponse } from 'next/server'
import { currentUser } from '@/lib/auth'
import { hubDataFor } from '@/lib/hub-data'
import { withStore } from '@/lib/store'
export const runtime='nodejs'
export async function GET(){
 const user=await currentUser();if(!user)return NextResponse.json({error:'Inicia sesión'},{status:401})
 try{return NextResponse.json(await withStore(()=>hubDataFor(user)),{headers:{'Cache-Control':'no-store'}})}
 catch{console.error('Hub data unavailable');return NextResponse.json({error:'No pudimos cargar el Hub. Intenta de nuevo en unos momentos.'},{status:503,headers:{'Cache-Control':'no-store'}})}
}
