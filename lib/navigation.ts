import type { Role } from './types'
const routes:Record<string,{slug:string;roles:Role[]}>= {
 Asistente:{slug:'asistente',roles:['star','host','admin']},
 Publicaciones:{slug:'publicaciones',roles:['star','host','admin']},
 'Mi cuenta':{slug:'mi-cuenta',roles:['star','host','admin']},
 Inicio:{slug:'inicio',roles:['star','host','admin']},
 Reuniones:{slug:'reuniones',roles:['star','host','admin']},
 Mensajes:{slug:'mensajes',roles:['star','host','admin']},
 'Mis solicitudes':{slug:'mis-solicitudes',roles:['star']},
 Preparación:{slug:'preparacion',roles:['star']},
 'Mi experiencia':{slug:'mi-experiencia',roles:['star']},
 Participante:{slug:'participante',roles:['host']},
 Resultados:{slug:'resultados',roles:['host']},
 Solicitudes:{slug:'solicitudes',roles:['admin']},
 Seguimiento:{slug:'seguimiento',roles:['admin']},
 Estadísticas:{slug:'estadisticas',roles:['admin']},
}
const messageViews:Record<string,string>={Novedades:'novedades',Preguntas:'preguntas',Indicaciones:'indicaciones'}
const applicationViews:Record<string,string>={'En revisión':'revision',Confirmadas:'confirmadas',Historial:'historial',Todas:'todas'}
export function routeHash(section:string,view='') {
 const route=Object.hasOwn(routes,section)?routes[section]:routes.Inicio
 const views=section==='Mensajes'?messageViews:section==='Mis solicitudes'?applicationViews:{}
 return '#/'+route.slug+(Object.hasOwn(views,view)?'?vista='+views[view]:'')
}
export function readRoute(hash:string,role:Role) {
 const [slug,search='']=hash.replace(/^#\/?/,'').split('?')
 const section=Object.entries(routes).find(([,route])=>route.slug===slug&&route.roles.includes(role))?.[0]||'Inicio'
 const value=new URLSearchParams(search).get('vista')
 const views=section==='Mensajes'?messageViews:section==='Mis solicitudes'?applicationViews:{}
 const view=Object.entries(views).find(([,slug])=>slug===value)?.[0]||''
 return {section,view}
}
