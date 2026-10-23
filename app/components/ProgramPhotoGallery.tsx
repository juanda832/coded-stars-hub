'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Expand, Images } from 'lucide-react'
import { photosFor } from '@/lib/program-photos'
import ProgramPhotoViewer from './ProgramPhotoViewer'

export default function ProgramPhotoGallery({program}:{program:string}) {
 const photos=photosFor(program),[photoId,setPhotoId]=useState<string|null>(null)
 return <>
  <div className="destination-photo-grid editorial-photo-grid" aria-label="Fotos del programa">
   {photos.slice(0,5).map((item,index)=><button key={item.id} className={'destination-gallery-photo'+(index===0?' gallery-lead':'')} aria-label={'Ampliar foto: '+item.title} onClick={()=>setPhotoId(item.id)}>
    <Image src={item.src} width={item.width} height={item.height} alt="" sizes={index===0?'(max-width:700px) 100vw, 650px':'(max-width:700px) 45vw, 320px'} style={item.focus?{objectPosition:item.focus}:undefined}/>
    <span className="destination-photo-gradient"/><span className="destination-gallery-caption"><b>{item.place}</b></span><span className="destination-photo-expand"><Expand size={16}/></span>
   </button>)}
  </div>
  <div className="destination-gallery-bottom"><span>Fotografías de referencia de los lugares.</span><button className="secondary-button" onClick={()=>setPhotoId(photos[0].id)}><Images size={15}/> Ver las {photos.length} fotos</button></div>
  {photoId&&<ProgramPhotoViewer program={program} photoId={photoId} onSelect={setPhotoId} onClose={()=>setPhotoId(null)}/>}
 </>
}
