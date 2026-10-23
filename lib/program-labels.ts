export function programName(program:string) {
  return !program?'Sin programa indicado':program==='London'?'Europa · Londres':program==='Tokyo'?'Tokio':program
}

export function programValue(value:string) {
 const normalized=value.trim().toLocaleLowerCase('es')
 return ['europa','europa · londres','londres','london'].includes(normalized)?'London':['tokio','tokyo'].includes(normalized)?'Tokyo':normalized==='orlando'?'Orlando':value.trim()
}
