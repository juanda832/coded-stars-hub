import ICAL from 'ical.js'
import {createHash} from 'node:crypto'
import {localDateTime,ORLANDO_ZONE,zonedDateTime} from './time-zones.ts'
import {WorkflowError} from './workflow-error.ts'

export type ImportCandidate={key:string;schoolName:string;startsAt:string;date:string;time:string;duration:number|null;joinUrl:string;warnings:string[];nativeId?:string}
export const CALENDAR_IMPORT_LIMIT=500_000
function instant(property:ICAL.Property|null){
 if(!property)throw new Error('missing time')
 const value=property.getFirstValue() as ICAL.Time
 if(!value||value.isDate)throw new Error('date without time')
 const raw=property.toJSON()[3];if(typeof raw!=='string'||value.toString().slice(0,19)!==raw.slice(0,19))throw new Error('invalid date')
 if(value.zone.tzid==='UTC')return value.toJSDate().toISOString()
 const tzid=String(property.getParameter('tzid')||'')
 if(!tzid)throw new Error('floating time')
 if(value.zone.tzid!=='floating')return value.toJSDate().toISOString()
 // Fall back only to a real IANA zone, never the server's local timezone.
 new Intl.DateTimeFormat('es',{timeZone:tzid})
 const wall=value.toString().slice(0,16),minute=zonedDateTime(wall,tzid)
 return new Date(Date.parse(minute)+value.second*1000).toISOString()
}
function conference(component:ICAL.Component){
 const text=['location','description','url','x-google-conference'].map(name=>String(component.getFirstPropertyValue(name)||'')).join(' ').replace(/&amp;/g,'&')
 const links=text.match(/https:\/\/[^\s<>"']+/g)||[]
 for(const raw of links){try{const link=raw.replace(/[).,;]+$/,''),url=new URL(link);if(!url.username&&!url.password&&url.port===''&&(/(^|\.)zoom\.us$/.test(url.hostname)||url.hostname==='meet.google.com'))return link.length<=1000?link:''}catch{}}
 return ''
}
export function parseHostCalendar(text:string,now=Date.now()){
 if(Buffer.byteLength(text,'utf8')>CALENDAR_IMPORT_LIMIT)throw new WorkflowError('El calendario supera 500 KB. Exporta únicamente las reuniones que quieres revisar.',413)
 let calendar:ICAL.Component
 try{calendar=new ICAL.Component(ICAL.parse(text));if(calendar.name!=='vcalendar')throw new Error()}catch{throw new WorkflowError('No pudimos leer el calendario. Elige un archivo .ics válido de Google Calendar.')}
 const events=calendar.getAllSubcomponents('vevent')
 if(events.length>500)throw new WorkflowError('El archivo contiene más de 500 eventos. Usa un calendario de JDP más pequeño.')
 const skipped={past:0,cancelled:0,recurring:0,invalid:0,duplicate:0},candidates:ImportCandidate[]=[],seen=new Set<string>()
 for(const event of events){
  if(String(event.getFirstPropertyValue('status')).toUpperCase()==='CANCELLED'){skipped.cancelled++;continue}
  if(['rrule','rdate','recurrence-id'].some(name=>event.hasProperty(name))){skipped.recurring++;continue}
  try{
   const uid=String(event.getFirstPropertyValue('uid')||'').trim(),summary=String(event.getFirstPropertyValue('summary')||'').trim()
   if(!uid||uid.length>1000||!summary||/[\u0000-\u001f]/.test(summary))throw new Error()
   const startsAt=instant(event.getFirstProperty('dtstart'));if(Date.parse(startsAt)<=now){skipped.past++;continue}
   const key=createHash('sha256').update('google-ical:'+uid).digest('hex');if(seen.has(key)){skipped.duplicate++;continue}seen.add(key)
   const wall=localDateTime(startsAt,ORLANDO_ZONE),warnings:string[]=[]
   let duration:number|null=null
   if(event.hasProperty('dtend')||event.hasProperty('duration')){
    try{const minutes=event.hasProperty('dtend')?(Date.parse(instant(event.getFirstProperty('dtend')))-Date.parse(startsAt))/60000:(event.getFirstPropertyValue('duration') as ICAL.Duration).toSeconds()/60
     if(Number.isInteger(minutes)&&minutes>=15&&minutes<=180)duration=minutes;else warnings.push('Revisa la duración; no se completará automáticamente.')
    }catch{warnings.push('No se pudo confirmar la hora de finalización.')}
   }
   const joinUrl=conference(event);if(!joinUrl)warnings.push('Falta el enlace de acceso. Puedes completarlo ahora o después.')
   if(summary.length>160)warnings.push('Completa un nombre de colegio de hasta 160 caracteres.')
   candidates.push({key,schoolName:summary.length<=160?summary:'',startsAt,date:wall.slice(0,10),time:wall.slice(11),duration,joinUrl,warnings,...(uid.endsWith('@coded-stars-hub')?{nativeId:uid.slice(0,-'@coded-stars-hub'.length)}:{})})
  }catch{skipped.invalid++}
 }
 if(candidates.length>100)throw new WorkflowError('Hay más de 100 reuniones futuras. Exporta un calendario más pequeño para revisarlas con cuidado.')
 return {candidates:candidates.toSorted((a,b)=>Date.parse(a.startsAt)-Date.parse(b.startsAt)),skipped}
}
export function googleCalendarSource(value:unknown){
 let url:URL;try{url=new URL(String(value))}catch{throw new WorkflowError('Revisa la dirección iCal de Google Calendar.')}
 if(url.protocol!=='https:'||!['calendar.google.com','www.google.com'].includes(url.hostname)||url.port||url.username||url.password||url.search||url.hash||!/^\/calendar\/ical\/[^/]+\/(?:public|private-[a-z0-9]+)\/(?:basic|full)\.ics$/.test(url.pathname))throw new WorkflowError('Usa una dirección iCal de Google Calendar o carga un archivo .ics. No hace falta publicar el calendario.')
 return url.href
}
