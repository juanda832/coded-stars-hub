import { withHubStore } from '@/lib/review-session'
import { NextResponse } from 'next/server'
import { currentUser } from '@/lib/auth'
import { hubDataFor } from '@/lib/hub-data'
import { WorkflowError } from '@/lib/store'
export const runtime='nodejs'
export async function GET(){
 try{const user=await currentUser();if(!user)return NextResponse.json({error:'Inicia sesión'},{status:401})
 return NextResponse.json(await withHubStore(user,()=>hubDataFor(user)),{headers:{'Cache-Control':'no-store'}})}
 catch(error){if(error instanceof WorkflowError)return NextResponse.json({error:error.message},{status:error.status,headers:{'Cache-Control':'no-store'}});console.error('Hub data unavailable');return NextResponse.json({error:'No pudimos cargar el Hub. Intenta de nuevo en unos momentos.'},{status:503,headers:{'Cache-Control':'no-store'}})}
}
