'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ArrowUpRight } from 'lucide-react'
import { coverFor, photosFor } from '@/lib/program-photos'
import { programName } from '@/lib/program-labels'
import ProgramPhotoViewer from './ProgramPhotoViewer'

const destinations=[{program:'Orlando',theme:'Parques y espacio'},{program:'London',theme:'Ciencia y proyectos'},{program:'Tokyo',theme:'Tecnología y cultura'}]
export default function ProgramPhotoShelf() {
 const [selected,setSelected]=useState<{program:string;photoId:string}|null>(null)
 return <section className="program-photo-shelf" aria-labelledby="program-photos-heading">
  <div className="section-heading"><h2 id="program-photos-heading">Fotos de los programas</h2><span>Orlando, Europa y Tokio</span></div>
  <div className="program-photo-shelf-grid">{destinations.map(({program,theme})=>{
   const photos=photosFor(program),photo=coverFor(program)
   return <button key={program} onClick={()=>setSelected({program,photoId:photo.id})} aria-label={'Ver fotos de '+programName(program)}><Image src={photo.src} width={photo.width} height={photo.height} alt="" sizes="(max-width:700px) 90vw, 450px" style={photo.focus?{objectPosition:photo.focus}:undefined}/><span className="destination-photo-gradient"/><span className="shelf-photo-count">{photos.length} fotos</span><span className="shelf-photo-caption"><span><b>{programName(program)}</b><small>{theme}</small></span><span className="shelf-photo-arrow"><ArrowUpRight size={22}/></span></span></button>
  })}</div>
  {selected&&<ProgramPhotoViewer program={selected.program} photoId={selected.photoId} onSelect={photoId=>setSelected({...selected,photoId})} onClose={()=>setSelected(null)}/>}
 </section>
}
