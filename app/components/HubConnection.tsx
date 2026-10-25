'use client'
import { RefreshCw, WifiOff } from 'lucide-react'
import Brand from './Brand'
import type { HubSnapshot } from '@/lib/hub-client'

export function HubLoading() {
  return <div className="loading" role="status"><Brand/><span className="loading-orbit" aria-hidden="true"/><p>Cargando tu espacio…</p></div>
}
export function HubLoadFailure({issue,onRetry,onLogout}:{issue:HubSnapshot['issue'];onRetry:()=>void;onLogout:()=>void}) {
  return <main className="hub-load-failure"><Brand/><section><span className="connection-icon" aria-hidden="true">{issue==='offline'?<WifiOff/>:<RefreshCw/>}</span><h1>{issue==='offline'?'Necesitas conexión para entrar':'No pudimos cargar tu espacio'}</h1><p>{issue==='offline'?'Conéctate a internet y vuelve a intentarlo.':'Hay un problema para cargar la información. Vuelve a intentarlo en unos momentos.'}</p><button className="primary" onClick={onRetry}><RefreshCw size={17}/>Volver a intentar</button><button className="text-link" onClick={onLogout}>Cerrar sesión</button></section></main>
}
export function ConnectionNotice({issue,refreshing,onRetry}:{issue:HubSnapshot['issue'];refreshing:boolean;onRetry:()=>void}) {
  if(!issue)return null
  return <div className="connection-notice" role="status"><span aria-hidden="true">{issue==='offline'?<WifiOff size={20}/>:<RefreshCw size={20}/>}</span><div><b>{issue==='offline'?'Sin conexión':'La información necesita actualizarse'}</b><p>{issue==='offline'?'Puedes revisar lo que ya cargó. Para guardar cambios necesitas conexión.':'Seguimos mostrando la última información disponible. Vuelve a actualizar antes de hacer cambios.'}</p></div><button className="secondary-button" disabled={refreshing} onClick={onRetry}>{refreshing?'Actualizando…':'Actualizar'}</button></div>
}
