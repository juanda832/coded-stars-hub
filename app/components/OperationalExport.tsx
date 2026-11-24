'use client'
import {useRef,useState} from 'react'
import {Download,FileSpreadsheet,LockKeyhole,Copy} from 'lucide-react'
import type {HubData} from '@/lib/types'
import {operationalExport,exportMeetings,exportPeriods,type ExportPeriod} from '@/lib/operational-export'
export default function OperationalExport({data,zone}:{data:HubData;zone:string}){
 const [period,setPeriod]=useState<ExportPeriod>('7'),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[error,setError]=useState(false)
 const inFlight=useRef(false)
 const count=exportMeetings(data.meetings,period).length
 if(data.user.role!=='admin')return null
 async function copySummary(){
  setMessage('');setError(false)
  try{
   const rows=operationalExport(data,period,zone)[0].rows
   const text=['CODED Stars Hub · Resumen de coordinación',...rows.filter(([label])=>!['Criterio','Interpretación','Privacidad'].includes(String(label))).map(([label,value])=>label+': '+value),'Confirmación y asistencia son datos diferentes.'].join('\n')
   await navigator.clipboard.writeText(text);setMessage('Resumen copiado. Puedes revisarlo antes de compartirlo.')
  }catch{setError(true);setMessage('No se pudo copiar el resumen. Puedes descargar el Excel.')}
 }
 async function download(){
  if(inFlight.current)return
  inFlight.current=true;setBusy(true);setMessage('');setError(false)
  try{
   const response=await fetch('/api/exports?'+new URLSearchParams({period,zone}),{cache:'no-store',signal:AbortSignal.timeout(30000)})
   if(!response.ok){const result=await response.json();throw Error(result.error||'No se pudo descargar.')}
   const blob=await response.blob(),url=URL.createObjectURL(blob)
   const anchor=document.createElement('a');anchor.href=url;anchor.download='coded-coordinacion-'+new Date().toISOString().slice(0,10)+'.xlsx';anchor.click()
   setTimeout(()=>URL.revokeObjectURL(url),1000)
   setMessage('Archivo preparado. Revisa las descargas de tu navegador.')
  }catch(e){setError(true);setMessage(e instanceof Error?e.message:'No se pudo descargar. Intenta de nuevo.')}
  finally{inFlight.current=false;setBusy(false)}
 }
 return <section className="operational-export" aria-labelledby="export-heading"><div className="export-intro"><span className="export-icon"><FileSpreadsheet size={24}/></span><div><h2 id="export-heading">Informes en Excel</h2><p>Prepara el resumen para el equipo sin copiar datos reunión por reunión.</p></div></div><div className="export-sheet-list"><span>Resumen</span><span>Agenda</span><span>Resultados</span></div><div className="export-controls"><label><span>Periodo</span><select value={period} disabled={busy} onChange={e=>{setPeriod(e.target.value as ExportPeriod);setMessage('')}}>{exportPeriods.map(([value,label])=><option value={value} key={value}>{label}</option>)}</select></label><div className="export-count" aria-live="polite"><b>{count}</b> {count===1?'reunión':'reuniones'} en el informe</div><button className="primary" disabled={busy} onClick={()=>void download()}><Download size={18}/>{busy?'Preparando…':'Descargar Excel'}</button><button className="secondary-button" disabled={busy} onClick={()=>void copySummary()}><Copy size={16}/> Copiar resumen</button></div><p className="export-privacy"><LockKeyhole size={14}/> Uso interno. No incluye correos, enlaces privados, comentarios ni notas internas.</p>{message&&<p className={error?'error':'export-result'} role={error?'alert':'status'}>{message}</p>}</section>
}
