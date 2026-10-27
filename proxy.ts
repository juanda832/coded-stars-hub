import {clerkMiddleware} from '@clerk/nextjs/server'
import {NextResponse,type NextRequest,type NextFetchEvent} from 'next/server'
import {requirePersonalAccess} from './lib/auth-mode'
import {teamWorkspaceEnabled} from './lib/workspace-mode'
import {assertTeamConfiguration,teamRequestDestination} from './lib/workspace-policy'

export default async function proxy(request:NextRequest,event:NextFetchEvent){
 if(!requirePersonalAccess())return NextResponse.next()
 if(teamWorkspaceEnabled()){
  try{
   assertTeamConfiguration(process.env)
   const canonical=new URL(process.env.CODED_PUBLIC_SITE_URL||'')
   if(request.nextUrl.host!==canonical.host){
    if(!['GET','HEAD'].includes(request.method))return NextResponse.json({error:'Abre el enlace principal del Hub antes de guardar.'},{status:403,headers:{'Cache-Control':'no-store'}})
    return NextResponse.redirect(teamRequestDestination(canonical.origin,request.nextUrl.pathname,request.nextUrl.search),308)
   }
   return await clerkMiddleware({signInUrl:'/sign-in',authorizedParties:[canonical.origin]})(request,event)
  }catch{return NextResponse.json({error:'El espacio del equipo todavía no está activado.'},{status:503,headers:{'Cache-Control':'no-store'}})}
 }
 return clerkMiddleware({signInUrl:'/sign-in'})(request,event)
}
export const config={matcher:[
 '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
 '/(api|trpc)(.*)',
]}
