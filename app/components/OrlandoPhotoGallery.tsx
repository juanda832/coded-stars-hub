'use client'

import { useId, useState } from 'react'
import Image from 'next/image'
import { ArrowLeft, ArrowRight, Camera, Compass, Expand, Rocket } from 'lucide-react'
import { orlandoPhotos } from '@/lib/orlando'
import Dialog from './Dialog'

const filters = [
  {id:'all', label:'Todas'},
  {id:'parks', label:'Parques'},
  {id:'space', label:'NASA'},
] as const

export default function OrlandoPhotoGallery() {
  const [filter,setFilter]=useState<typeof filters[number]['id']>('all')
  const [photoId,setPhotoId]=useState<string|null>(null)
  const id=useId()
  const photos=orlandoPhotos.filter(photo=>filter==='all'||photo.category===filter)
  const index=photos.findIndex(photo=>photo.id===photoId)
  const photo=photos[index]

  function movePhoto(direction:number) {
    setPhotoId(photos[(index+direction+photos.length)%photos.length].id)
  }

  return <>
    <div className="orlando-gallery-toolbar">
      <div className="orlando-gallery-filters" aria-label="Filtrar fotos de Orlando">
        {filters.map(item=><button key={item.id} aria-pressed={filter===item.id} aria-controls={id} onClick={()=>setFilter(item.id)}>{item.label}<span>{item.id==='all'?orlandoPhotos.length:orlandoPhotos.filter(photo=>photo.category===item.id).length}</span></button>)}
      </div>
      <span className="orlando-gallery-count" aria-live="polite"><Camera size={13}/>{photos.length} fotos para explorar</span>
    </div>
    <div className="orlando-photo-grid" id={id}>
      {photos.map(item=><button className={'orlando-photo-card '+item.category} key={item.id} aria-label={'Ampliar foto: '+item.title} onClick={()=>setPhotoId(item.id)}>
        <Image src={item.src} width={item.width} height={item.height} alt="" sizes="(max-width:700px) 44vw, 28vw" style={item.focus?{objectPosition:item.focus}:undefined}/>
        <span className="orlando-photo-shade"/>
        <span className="orlando-photo-caption"><span>{item.category==='parks'?<Compass size={15}/>:<Rocket size={15}/>} {item.place}</span><b>{item.title}</b></span>
        <span className="orlando-expand"><Expand size={16}/></span>
      </button>)}
    </div>
    {photo&&<Dialog title={photo.title} onClose={()=>setPhotoId(null)} className="orlando-photo-viewer">
      <figure>
        <Image src={photo.src} width={photo.width} height={photo.height} alt={photo.alt} sizes="(max-width:700px) 90vw, 850px"/>
        <figcaption><p>{photo.caption}</p><span>Foto: <a href={photo.source} target="_blank" rel="noopener noreferrer">{photo.author}</a> · <a href={photo.licenseUrl} target="_blank" rel="noopener noreferrer">{photo.license}</a></span></figcaption>
      </figure>
      <div className="orlando-viewer-nav">
        <button className="secondary-button" onClick={()=>movePhoto(-1)}><ArrowLeft size={16}/> Anterior</button>
        <span aria-live="polite">{index+1} de {photos.length}</span>
        <button className="secondary-button" onClick={()=>movePhoto(1)}>Siguiente <ArrowRight size={16}/></button>
      </div>
      <div className="orlando-viewer-thumbnails" aria-label="Elegir una foto de la galería">
        {photos.map(item=><button key={item.id} aria-label={'Ver foto: '+item.place} aria-pressed={photoId===item.id} onClick={()=>setPhotoId(item.id)}><Image src={item.src} width={item.width} height={item.height} alt="" sizes="64px" style={item.focus?{objectPosition:item.focus}:undefined}/></button>)}
      </div>
      <p className="orlando-gallery-note">Imágenes de referencia de los lugares; no son fotografías de participantes de CODED ni un itinerario de viaje.</p>
    </Dialog>}
  </>
}
