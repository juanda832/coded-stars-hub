'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, CheckCheck, Copy, Pause, Play, RotateCcw, ShieldCheck, Timer } from 'lucide-react'
import { experienceFor, programExperiences, type ExperienceProgram } from '@/lib/program-experiences'

type Story = { moment:string; learning:string; takeaway:string }
type Drafts = Partial<Record<ExperienceProgram, Story>>
const blank:Story = {moment:'',learning:'',takeaway:''}
const fields = [
  {key:'moment',label:'Un momento',title:'Empieza por algo que recuerdes.',hint:'¿Dónde estabas? ¿Qué pasó? Un detalle concreto ayuda a imaginarlo.',placeholder:'Un momento que recuerdo de mi experiencia es…'},
  {key:'learning',label:'Lo que aprendí',title:'¿Qué te dejó ese momento?',hint:'Puede ser una habilidad, una pregunta o algo que descubriste sobre ti.',placeholder:'Lo que aprendí o descubrí fue…'},
  {key:'takeaway',label:'Lo que me llevo',title:'Cierra con algo que sea tuyo.',hint:'¿Qué le contarías a alguien que está por vivir una experiencia parecida?',placeholder:'Si pudiera compartir una idea con otra persona, sería…'},
] as const

function restoreDrafts(raw:string|null):Drafts {
  if(!raw)return {}
  const value:unknown=JSON.parse(raw)
  if(!value||typeof value!=='object')return {}
  const drafts:Drafts={}
  for(const item of programExperiences){
    const candidate=(value as Record<string,unknown>)[item.id]
    if(!candidate||typeof candidate!=='object')continue
    const entry=candidate as Record<string,unknown>
    if(fields.every(field=>typeof entry[field.key]==='string'))drafts[item.id]={moment:(entry.moment as string).slice(0,600),learning:(entry.learning as string).slice(0,600),takeaway:(entry.takeaway as string).slice(0,600)}
  }
  return drafts
}

export default function StoryStudio({userId,initialProgram='Orlando',programLocked=false}:{userId:string;initialProgram?:string;programLocked?:boolean}) {
  const id=useId(),storageKey='coded-story-v1-'+userId,inputRef=useRef<HTMLTextAreaElement>(null)
  const [program,setProgram]=useState<ExperienceProgram>(()=>experienceFor(initialProgram).id)
  const [drafts,setDrafts]=useState<Drafts>({}),[ready,setReady]=useState(false)
  const [step,setStep]=useState(0),[saveStatus,setSaveStatus]=useState(''),[copyStatus,setCopyStatus]=useState('')
  const [running,setRunning]=useState(false),[elapsed,setElapsed]=useState(0)
  useEffect(()=>{
    try{setDrafts(restoreDrafts(localStorage.getItem(storageKey)));setSaveStatus('Se guarda solo en este dispositivo.')}
    catch{setDrafts({});setSaveStatus('No pudimos recuperar el borrador. Puedes escribir aquí y copiarlo.')}
    setReady(true)
  },[storageKey])
  useEffect(()=>{
    if(!running)return
    const interval=window.setInterval(()=>setElapsed(value=>value+1),1000)
    return()=>window.clearInterval(interval)
  },[running])
  const experience=experienceFor(program),story=drafts[program]||blank,field=fields[step]
  const complete=fields.filter(item=>story[item.key].trim()).length
  const text=fields.map(item=>story[item.key].trim()).filter(Boolean).join('\n\n')
  const words=text.trim()?text.trim().split(/\s+/u).length:0
  const estimate=Math.max(1,Math.round(words/130*60))
  function update(value:string){
    const next={...drafts,[program]:{...story,[field.key]:value}}
    setDrafts(next);setCopyStatus('');setRunning(false);setElapsed(0)
    try{localStorage.setItem(storageKey,JSON.stringify(next));setSaveStatus('Borrador guardado en este dispositivo.')}
    catch{setSaveStatus('No se pudo guardar aquí. Copia tu historia antes de salir.')}
  }
  function chooseProgram(value:ExperienceProgram){setProgram(value);setStep(0);setCopyStatus('');setSaveStatus('Se guarda solo en este dispositivo.');setRunning(false);setElapsed(0)}
  function goToStep(value:number){setStep(value);requestAnimationFrame(()=>inputRef.current?.focus({preventScroll:true}))}
  async function copy(){
    try{await navigator.clipboard.writeText(text);setCopyStatus('Historia copiada. Puedes seguir editándola.')}
    catch{setCopyStatus('No se pudo copiar. Selecciona el texto de la vista previa para copiarlo.')}
  }
  return <section className="story-studio" aria-labelledby={id+'-title'}>
    <div className="studio-heading"><div><h2 id={id+'-title'}>Mi testimonio</h2><p>Anota un recuerdo, lo que aprendiste y qué quieres compartir.</p></div><span className="studio-private"><ShieldCheck size={16}/> Tu borrador es para ti</span></div>
    {programLocked?<p className="studio-program-context">Historia de {experience.label}. Para preparar otro programa, cambia de reunión arriba o elige practicar sin una reunión.</p>:<div className="experience-programs" aria-label="Programa de mi historia">{programExperiences.map(item=><button key={item.id} aria-pressed={program===item.id} aria-controls={id+'-workspace'} disabled={!ready} onClick={()=>chooseProgram(item.id)}>{item.label}{program===item.id&&<Check size={14}/>}</button>)}</div>}
    <div className="studio-workspace" id={id+'-workspace'}>
      <div className="studio-editor"><div className="studio-step-nav" aria-label="Pasos de mi historia">{fields.map((item,index)=><button key={item.key} aria-current={step===index?'step':undefined} aria-controls={id+'-field'} onClick={()=>goToStep(index)}><span>{story[item.key].trim()?<Check size={13}/>:index+1}</span>{item.label}</button>)}</div>
        <label className="studio-field" htmlFor={id+'-input'} id={id+'-field'}><span>PASO {step+1} DE 3</span><b>{field.title}</b></label><p className="studio-field-hint" id={id+'-hint'}>{field.hint}</p>
        <textarea ref={inputRef} id={id+'-input'} aria-describedby={id+'-hint'} value={story[field.key]} onChange={event=>update(event.target.value)} maxLength={600} rows={6} disabled={!ready} placeholder={field.placeholder}/>
        <div className="studio-field-meta"><span><CheckCheck size={13}/>{saveStatus||'Abriendo tu borrador…'}</span><span>{story[field.key].length}/600</span></div>
        <details className="studio-inspiration"><summary>Necesito una idea para {experience.label}</summary><p>{experience.prompts[step]}</p><small>Úsalo solo si se parece a algo que tú viviste.</small></details>
        <div className="studio-step-actions"><button className="secondary-button" disabled={step===0} onClick={()=>goToStep(step-1)}><ArrowLeft size={15}/> Atrás</button>{step<2?<button className="primary" onClick={()=>goToStep(step+1)}>Siguiente idea <ArrowRight size={15}/></button>:<span className="studio-complete">{complete===3?<><CheckCheck size={16}/> Tu historia ya tiene sus tres ideas.</>:`${complete} de 3 ideas escritas. Puedes volver a cualquier paso.`}</span>}</div>
      </div>
      <aside className="studio-preview" aria-labelledby={id+'-preview'}><h3 id={id+'-preview'}>Mi experiencia en {experience.label}</h3><div className="studio-preview-text">{fields.map(item=><p key={item.key} className={story[item.key].trim()?'':'studio-empty'}>{story[item.key].trim()||({'moment':'Aquí aparecerá tu recuerdo.','learning':'Después, lo que aprendiste.','takeaway':'Y una idea para compartir.'}[item.key])}</p>)}</div>
        <div className="studio-reading"><span>{words} palabras</span><span>{words>0?`≈ ${estimate<60?estimate+' s':Math.ceil(estimate/60)+' min'} al hablar`:'A tu ritmo'}</span></div>
        <button className="secondary-button full" onClick={copy} disabled={complete<3}><Copy size={15}/> Copiar mi historia</button><p className="studio-copy-status" role="status">{copyStatus}</p>
        <div className="studio-rehearsal"><div><Timer size={17}/><b>Prueba decirla en voz alta</b></div><p>El contador te acompaña. No se graba audio ni se usa el micrófono.</p><div className="studio-timer-row"><output aria-label="Tiempo de ensayo">{String(Math.floor(elapsed/60)).padStart(2,'0')}:{String(elapsed%60).padStart(2,'0')}</output><button className="secondary-button" disabled={complete<3} onClick={()=>setRunning(value=>!value)}>{running?<Pause size={15}/>:<Play size={15}/>} {running?'Pausar':elapsed?'Continuar':'Ensayar'}</button><button className="studio-reset" aria-label="Reiniciar tiempo de ensayo" disabled={!elapsed&&!running} onClick={()=>{setRunning(false);setElapsed(0)}}><RotateCcw size={16}/></button></div></div>
      </aside>
    </div><p className="studio-privacy"><ShieldCheck size={14}/> Tu texto no se envía al anfitrión ni se publica. Cada programa conserva su propio borrador en este navegador.</p>
  </section>
}
