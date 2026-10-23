import type { Meeting } from './types'
import { localDateTime, ORLANDO_ZONE, zonedDateTime } from './time-zones.ts'

export type MeetingEditorValues={
 schoolName:string;title:string;description:string;program:string;language:Meeting['language'];duration:number|null;
 timeZone:string;date:string;hostId:string;hostNote:string;joinUrl:string;
}
export function meetingEditorDraftKey(userId:string) {return 'coded-meeting-draft-v1:'+encodeURIComponent(userId)}
export function restoreMeetingEditorDraft(raw:string|null,hostIds:readonly string[],timeZones:readonly string[]):MeetingEditorValues|null {
 try {
  const saved:unknown=JSON.parse(raw||'null')
  if(!saved||typeof saved!=='object'||Array.isArray(saved))return null
  const value=saved as Record<string,unknown>
  if(value.version!==1&&value.version!==2)return null
  const limits={title:160,description:600,program:80,language:30,timeZone:80,date:16,hostId:100,hostNote:400,joinUrl:1000}
  for(const [field,limit] of Object.entries(limits))if(typeof value[field]!=='string'||(value[field] as string).length>limit)return null
  if(value.version===2&&(typeof value.schoolName!=='string'||value.schoolName.length>160))return null
  if(!['','Español','English','Português'].includes(value.language as string))return null
  if(value.duration!==null&&(!Number.isInteger(value.duration)||Number(value.duration)<15||Number(value.duration)>180))return null
  if(value.hostId&&!hostIds.includes(value.hostId as string)||!timeZones.includes(value.timeZone as string))return null
  let date=value.date as string
  if(date){
   if(value.version===1&&!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(date))return null
   if(value.version===2&&!/^(?:\d{4}-\d{2}-\d{2})?T(?:\d{2}:\d{2})?$/.test(date))return null
   const [day,time]=date.split('T')
   if(day){const parsed=new Date(day+'T12:00:00Z');if(!Number.isFinite(parsed.getTime())||parsed.toISOString().slice(0,10)!==day)return null}
   if(time&&(Number(time.slice(0,2))>23||Number(time.slice(3))>59))return null
   if(value.timeZone!==ORLANDO_ZONE){if(date.length!==16)return null;date=localDateTime(zonedDateTime(date,value.timeZone as string),ORLANDO_ZONE)}
  }
  return {schoolName:value.version===2?value.schoolName as string:'',title:value.title as string,description:value.description as string,program:value.program as string,language:value.language as Meeting['language'],duration:value.duration as number|null,timeZone:ORLANDO_ZONE,date,hostId:value.hostId as string,hostNote:value.hostNote as string,joinUrl:value.joinUrl as string}
 }catch{return null}
}
