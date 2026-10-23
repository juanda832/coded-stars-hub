'use client'

import { useId, useState } from 'react'
import { ArrowRight, Check, Lightbulb } from 'lucide-react'
import type { Meeting } from '@/lib/types'
import { isActiveMeeting } from '@/lib/meeting-utils'
import { orlandoStoryTopics } from '@/lib/orlando'
import { experienceFor, programExperiences, type ExperienceProgram } from '@/lib/program-experiences'
import ProgramPhotoGallery from './ProgramPhotoGallery'

export default function ExperienceSpotlight({meetings,onMeeting,onExplore,onPreparation}:{meetings:Meeting[];onMeeting:(meeting:Meeting)=>void;onExplore:()=>void;onPreparation:(program?:string)=>void}) {
  const [program,setProgram]=useState<ExperienceProgram>('Orlando'),[topicIndex,setTopicIndex]=useState(0)
  const id=useId(),experience=experienceFor(program)
  const next=meetings.filter(meeting=>meeting.program===program&&isActiveMeeting(meeting)).sort((a,b)=>Date.parse(a.startsAt)-Date.parse(b.startsAt))[0]
  return <section className="experience-spotlight" aria-labelledby={id}>
    <div className="section-heading"><div><h2 id={id}>Los programas</h2></div><span className="experience-section-note">Fotos e ideas para tu testimonio.</span></div>
    <div className="experience-programs" aria-label="Explorar experiencias por programa">{programExperiences.map(item=><button key={item.id} aria-pressed={program===item.id} aria-controls={id+'-content'} onClick={()=>{setProgram(item.id);setTopicIndex(0)}}>{item.label}{program===item.id&&<Check size={14}/>}</button>)}</div>
    <div id={id+'-content'}><ProgramPhotoGallery key={program} program={program}/></div>
    <div className={'experience-content experience-editorial-copy experience-'+program.toLowerCase()}>
      <div className="experience-copy"><span className="eyebrow">{experience.edition}</span><h3>{experience.headline}</h3><p>{experience.description}</p><div className="experience-themes" aria-label={'Ideas de '+experience.label}>{experience.themes.map((theme,index)=><button key={theme} aria-pressed={topicIndex===index} aria-controls={id+'-prompt'} onClick={()=>setTopicIndex(index)}>{theme}</button>)}</div><p className="experience-prompt" id={id+'-prompt'} aria-live="polite"><Lightbulb size={18}/>{experience.prompts[topicIndex]}</p><button className="primary" onClick={()=>onPreparation(program)}>Empezar mi historia <ArrowRight size={16}/></button></div>
    </div>
    <div className="experience-footnote"><p>{experience.reminder}</p><button className="text-link" onClick={()=>next?onMeeting(next):onExplore()}>{next?'Ver JDP de '+experience.label:'Explorar reuniones'} <ArrowRight size={15}/></button></div>

  </section>
}

export function OrlandoMeetingIdeas() {
  return <details className="detail-section orlando-meeting-ideas"><summary>Parques + NASA: ideas para tu testimonio</summary><p>Elige un recuerdo de Orlando que represente lo que viviste.</p><ul>{orlandoStoryTopics.map(topic=><li key={topic.id}><b>{topic.label}</b><span>{topic.prompt}</span></li>)}</ul><p className="quiet-copy">Cuenta solo tu propia experiencia. El anfitrión aclara las visitas y actividades de cada edición.</p></details>
}
