import {clerkMiddleware} from '@clerk/nextjs/server'
import {NextResponse,type NextRequest,type NextFetchEvent} from 'next/server'
import {requirePersonalAccess} from './lib/auth-mode'

export default function proxy(request:NextRequest,event:NextFetchEvent){
 if(!requirePersonalAccess())return NextResponse.next()
 return clerkMiddleware()(request,event)
}
export const config={matcher:[
 '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
 '/(api|trpc)(.*)',
]}
