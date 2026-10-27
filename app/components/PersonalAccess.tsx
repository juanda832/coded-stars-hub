'use client'
import {Suspense} from 'react'
import {SignIn,useClerk,useUser} from '@clerk/nextjs'
import Brand from './Brand'
import {teamWorkspaceEnabled} from '@/lib/workspace-mode'
import {CommunityArtwork} from './HubArtwork'

export default function PersonalAccess({onRetry,signInPage=false}:{onRetry:()=>void;signInPage?:boolean}){
 const {isLoaded,isSignedIn}=useUser()
 const {signOut}=useClerk()
 return <div className="access-page access-review">
  <section className="access-story"><Brand/><div className="access-story-copy"><h1>Tu espacio<br/>en CODED.</h1><p>Reuniones, solicitudes y mensajes del equipo.</p><CommunityArtwork className="access-community-art" eager/></div><p className="access-footnote">{teamWorkspaceEnabled()?'CODED Stars Hub · Equipo':'CODED Stars Hub · Beta con datos de prueba'}</p></section>
  <section className="access-form-side"><div className="access-card personal-access-card"><div className="access-mobile-brand"><Brand/></div>
   {!isLoaded?<p role="status">Preparando tu acceso…</p>:isSignedIn?<>
    <h2>Revisa tu acceso</h2><p>Tu sesión está iniciada, pero todavía no pudimos habilitar tu espacio. Verifica que estés usando el correo de tu cuenta.</p>
    <button className="primary full" onClick={onRetry}>Volver a comprobar</button>
    <button className="secondary full" onClick={()=>void signOut({redirectUrl:'/'})}>Usar otra cuenta</button>
   </>:<><h2>Entrar al Hub</h2><p>Usa el correo habilitado para tu cuenta.</p>{signInPage?<Suspense fallback={<p role="status">Cargando acceso…</p>}><SignIn routing="path" path="/sign-in" withSignUp={false} transferable={false} fallbackRedirectUrl="/" appearance={{variables:{colorPrimary:'#6200c7',borderRadius:'14px'},options:{socialButtonsPlacement:'top'},elements:{rootBox:'personal-access-root',cardBox:'personal-access-box',dividerText:{fontSize:'13px',fontWeight:600,color:'#654479'},socialButtonsBlockButton:{minHeight:'46px'},formFieldInput:{minHeight:'46px',fontSize:'16px'},formButtonPrimary:{minHeight:'46px'},footerAction:{display:'none'}}}}/></Suspense>:<a className="primary full" href="/sign-in">Continuar al acceso</a>}</>}
   {signInPage&&isLoaded&&!isSignedIn&&<details className="sign-in-help"><summary>¿Es tu primer ingreso?</summary><p>Usa el correo habilitado por coordinación y completa la verificación que aparezca. Si no reconoce tu cuenta, consulta al equipo.</p></details>}
   <p className="access-privacy">{teamWorkspaceEnabled()?'Acceso personal del equipo CODED. Usa solo información autorizada.':'Las reuniones y los perfiles de estudiantes siguen usando datos de prueba.'}</p>
  </div></section>
 </div>
}
