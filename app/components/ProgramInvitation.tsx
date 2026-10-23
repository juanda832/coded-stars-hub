'use client'

import { useId, useState } from 'react'
import Image from 'next/image'
import { ArrowRight, CalendarDays, Check, Images, MapPin } from 'lucide-react'
import type { Meeting } from '@/lib/types'
import { coverFor, photosFor } from '@/lib/program-photos'
import { dateText, friendlyDay, languageText } from '@/lib/meeting-utils'
import { programExperiences, type ExperienceProgram } from '@/lib/program-experiences'
import { ProgramArtwork } from './HubArtwork'
import MeetingSchedule from './MeetingSchedule'
import ProgramPhotoViewer from './ProgramPhotoViewer'

const themes:Record<ExperienceProgram,string>={
 Orlando:'Parques, espacio y retos en equipo.',
 London:'Ciencia, proyectos y nuevas perspectivas.',
 Tokyo:'Tecnología, creatividad y otra cultura.',
}

export default function ProgramInvitation({opportunities,zone,onMeeting,onExplore,onPreparation}:{
 opportunities:Meeting[];zone:string;onMeeting:(meeting:Meeting)=>void;onExplore:()=>void;onPreparation:(program?:string)=>void;
}) {
 const first=opportunities[0]?.program
 const [program,setProgram]=useState<ExperienceProgram>(first==='London'||first==='Tokyo'?first:'Orlando')
 const [photoId,setPhotoId]=useState<string|null>(null)
 const id=useId(),photo=coverFor(program),experience=programExperiences.find(item=>item.id===program)!
 const next=opportunities.find(meeting=>meeting.program===program)
 const firstMeeting=opportunities[0]
 if(firstMeeting&&!['Orlando','London','Tokyo'].includes(firstMeeting.program))return <section className="school-jdp-invitation"><div><span className="invitation-eyebrow">PRÓXIMA JDP</span><h2>{firstMeeting.schoolName||firstMeeting.title}</h2>{firstMeeting.program&&<p>{firstMeeting.program}</p>}{firstMeeting.language&&<p>Idioma requerido: {languageText(firstMeeting.language)}</p>}<MeetingSchedule meeting={firstMeeting} zone={zone}/><button className="primary" onClick={()=>onMeeting(firstMeeting)}>Ver JDP y solicitar participar <ArrowRight size={17}/></button><small>Coordinación revisa las solicitudes y confirma a un único participante.</small></div><ProgramArtwork program={firstMeeting.program}/></section>
 return <section className="program-invitation" aria-labelledby={id}>
  <div className="invitation-copy">
   <span className="invitation-eyebrow">REUNIONES JDP</span>
   <h2 id={id}>Comparte lo <br/>que viviste.</h2>
   <p>Los lugares, los retos, tu grupo. Ayuda a otras familias a conocer el programa con tu experiencia.</p>
   <div className="invitation-next" aria-live="polite">
    <span className="invitation-next-icon"><CalendarDays size={19}/></span>
    <div><b>{next?'Próxima JDP de '+experience.label:'Prepara tu historia de '+experience.label}</b><span>{next?`${friendlyDay(next.startsAt,zone)} · ${dateText(next.startsAt,zone,{hour:'2-digit',minute:'2-digit'})}${next.language?' · '+languageText(next.language):''}`:'Todavía no hay nuevas reuniones de este programa.'}</span></div>
   </div>
   <div className="invitation-actions"><button className="primary" onClick={()=>next?onMeeting(next):onPreparation(program)}>{next?'Ver próxima JDP':'Preparar mi historia'}<ArrowRight size={18}/></button><button className="text-link" onClick={onExplore}>Ver toda la agenda</button></div>
   <small>{next?'Envía tu solicitud. El equipo revisa y confirma a un participante.':'Puedes dejar lista tu historia mientras se abren próximas fechas.'}</small>
  </div>
  <div className="invitation-destination" id={id+'-destination'}>
   <Image key={photo.id} className="invitation-cover" src={photo.src} width={photo.width} height={photo.height} alt={photo.alt} loading="eager" sizes="(max-width:700px) 100vw, (max-width:1200px) 50vw, 650px" style={{objectPosition:photo.focus||'50% 50%'}}/>
   <div className="invitation-photo-shade"/>
   <span className="invitation-place"><MapPin size={13}/>{photo.place}</span>
   <button className="invitation-open-photos" onClick={()=>setPhotoId(photo.id)} aria-label={'Ver fotos de '+experience.label}><Images size={16}/>{photosFor(program).length} fotos</button>
   <div className="invitation-photo-copy"><span>{experience.edition}</span><h3>{experience.label}</h3><p>{themes[program]}</p></div>
  </div>
  <div className="invitation-program-picker" role="group" aria-label="Elige el programa de tu experiencia">
   {programExperiences.map(item=>{const cover=coverFor(item.id);return <button key={item.id} aria-pressed={program===item.id} aria-controls={id+'-destination'} onClick={()=>{setProgram(item.id);setPhotoId(null)}}><Image src={cover.src} width={cover.width} height={cover.height} alt="" sizes="72px" style={cover.focus?{objectPosition:cover.focus}:undefined}/><span><b>{item.label}</b><small>{item.id==='Orlando'?'Parques y espacio':item.id==='London'?'Ciencia y proyectos':'Tecnología y cultura'}</small></span><span className="invitation-choice-mark" aria-hidden="true">{program===item.id?<Check size={14}/>:<ArrowRight size={14}/>}</span></button>})}
  </div>
  {photoId&&<ProgramPhotoViewer program={program} photoId={photoId} onSelect={setPhotoId} onClose={()=>setPhotoId(null)}/>}
 </section>
}
