import {WorkflowError} from './workflow-error.ts'

// An opt-in team workspace must never silently run on development credentials.
export function assertTeamConfiguration(env:Record<string,string|undefined>){
 if(env.VERCEL==='1'&&env.CODED_DATABASE_SCHEMA==='coded_hub_team'&&env.NEXT_PUBLIC_CODED_WORKSPACE_MODE!=='team')throw new WorkflowError('Activa el modo del equipo antes de seleccionar su base.',503)
 if(env.NEXT_PUBLIC_CODED_WORKSPACE_MODE!=='team'||env.VERCEL!=='1')return
 if(env.VERCEL_ENV!=='production')throw new WorkflowError('El espacio del equipo solo se activa en el despliegue de producción.',503)
 if(env.NEXT_PUBLIC_CODED_AUTH_MODE!=='clerk'||!env.CLERK_SECRET_KEY?.startsWith('sk_live_')||!env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.startsWith('pk_live_'))throw new WorkflowError('Falta activar el acceso de producción antes de usar el espacio del equipo.',503)
 let origin:URL;try{origin=new URL(env.CODED_PUBLIC_SITE_URL||'')}catch{throw new WorkflowError('Falta configurar el dominio del espacio del equipo.',503)}
 if(origin.protocol!=='https:'||origin.username||origin.password||origin.pathname!=='/'||origin.search||origin.hash||origin.hostname==='localhost'||origin.hostname==='vercel.app'||origin.hostname.endsWith('.vercel.app')||!origin.hostname.includes('.'))throw new WorkflowError('El espacio del equipo necesita un dominio propio autorizado.',503)
 if(env.CODED_DATABASE_SCHEMA!=='coded_hub_team')throw new WorkflowError('El espacio del equipo necesita su base separada de los ejemplos.',503)
 for(const key of ['CODED_OWNER_EMAIL','CODED_ADMIN_ISA_EMAIL','CODED_ADMIN_ELA_EMAIL']){
  const email=env[key]?.trim();if(!email||!/^\S+@\S+\.\S+$/.test(email)||email.toLowerCase().endsWith('@example.com'))throw new WorkflowError('Falta configurar los accesos personales de administración.',503)
 }
}
export function teamRequestDestination(origin:string,pathname:string,search:string){
 const destination=new URL(origin)
 destination.pathname=pathname;destination.search=search
 return destination
}
