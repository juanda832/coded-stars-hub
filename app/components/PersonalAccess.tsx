'use client'
import {Suspense} from 'react'
import {SignIn,useClerk,useUser} from '@clerk/nextjs'
import Brand from './Brand'
import {CommunityArtwork} from './HubArtwork'

export default function PersonalAccess({onRetry}:{onRetry:()=>void}){
 const {isLoaded,isSignedIn}=useUser()
 const {signOut}=useClerk()
 return <div className="access-page access-review">
  <section className="access-story"><Brand/><div className="access-story-copy"><h1>Tu espacio<br/>en CODED.</h1><p>Reuniones, solicitudes y mensajes del equipo.</p><CommunityArtwork className="access-community-art" eager/></div><p className="access-footnote">CODED Stars Hub · Beta con datos de prueba</p></section>
  <section className="access-form-side"><div className="access-card personal-access-card"><div className="access-mobile-brand"><Brand/></div>
   {!isLoaded?<p role="status">Preparando tu acceso…</p>:isSignedIn?<>
    <h2>Revisa tu acceso</h2><p>Tu sesión está iniciada, pero todavía no pudimos habilitar tu espacio. Verifica que estés usando el correo de tu cuenta.</p>
    <button className="primary full" onClick={onRetry}>Volver a comprobar</button>
    <button className="secondary full" onClick={()=>void signOut({redirectUrl:'/'})}>Usar otra cuenta</button>
   </>:<><h2>Entrar al Hub</h2><p>Usa el correo habilitado para tu cuenta.</p><Suspense fallback={<p role="status">Cargando acceso…</p>}><SignIn routing="hash" withSignUp={false} fallbackRedirectUrl="/" appearance={{variables:{colorPrimary:'#6200c7',borderRadius:'14px'},elements:{rootBox:'personal-access-root',cardBox:'personal-access-box',footerAction:{display:'none'}}}}/></Suspense></>}
   <p className="access-privacy">Las reuniones y los perfiles de estudiantes siguen usando datos de prueba.</p>
  </div></section>
 </div>
}
