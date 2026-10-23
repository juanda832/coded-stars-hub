'use client'
import { Check } from 'lucide-react'
import { programName } from '@/lib/program-labels'
import { ProgramArtwork } from './HubArtwork'

export default function ProgramFilter({programs,selected,counts,total,onSelect}:{programs:string[];selected:string;counts:Record<string,number>;total:number;onSelect:(program:string)=>void}) {
 return <section className="agenda-program-picker" aria-label="Filtrar reuniones por programa"><div className="agenda-program-heading"><span>Elige un programa</span><button aria-pressed={selected==='Todos'} onClick={()=>onSelect('Todos')}>Todos los programas <span>{total}</span></button></div><div className="agenda-program-options">{programs.map(program=><button key={program} className="agenda-program-option" aria-label={`Filtrar por ${programName(program)}, ${counts[program]||0} ${(counts[program]||0)===1?'reunión':'reuniones'} en esta vista`} aria-pressed={selected===program} onClick={()=>onSelect(program)}><ProgramArtwork program={program} photoIndex={1} className="agenda-program-photo"/><span className="agenda-program-copy"><b>{programName(program)}</b><small>{counts[program]||0} {(counts[program]||0)===1?'reunión':'reuniones'}</small></span>{selected===program&&<span className="program-selected"><Check size={15}/></span>}</button>)}</div></section>
}
