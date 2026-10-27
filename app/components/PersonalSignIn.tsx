'use client'
import {useEffect} from 'react'
import {useUser} from '@clerk/nextjs'
import PersonalAccess from './PersonalAccess'
import {HubLoading} from './HubConnection'

export default function PersonalSignIn(){
 const {isLoaded,isSignedIn}=useUser()
 useEffect(()=>{if(isLoaded&&isSignedIn)window.location.replace('/')},[isLoaded,isSignedIn])
 if(!isLoaded||isSignedIn)return <HubLoading/>
 return <PersonalAccess signInPage onRetry={()=>window.location.reload()}/>
}
