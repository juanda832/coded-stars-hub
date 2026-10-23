'use client'

import Image from 'next/image'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { photosFor } from '@/lib/program-photos'
import Dialog from './Dialog'

export default function ProgramPhotoViewer({program,photoId,onSelect,onClose}:{program:string;photoId:string;onSelect:(id:string)=>void;onClose:()=>void}) {
 const photos=photosFor(program),index=Math.max(0,photos.findIndex(item=>item.id===photoId)),photo=photos[index]
 function move(direction:number){onSelect(photos[(index+direction+photos.length)%photos.length].id)}
 return <Dialog title={photo.place} onClose={onClose} className="orlando-photo-viewer destination-photo-viewer">
  <figure><Image src={photo.src} width={photo.width} height={photo.height} alt={photo.alt} sizes="(max-width:700px) 95vw, 850px"/><figcaption><p>{photo.caption}</p><span>Foto: <a href={photo.source} target="_blank" rel="noopener noreferrer">{photo.author}</a> · <a href={photo.licenseUrl} target="_blank" rel="noopener noreferrer">{photo.license}</a></span></figcaption></figure>
  <div className="orlando-viewer-nav"><button className="secondary-button" onClick={()=>move(-1)}><ArrowLeft size={16}/> Anterior</button><span aria-live="polite">{index+1} de {photos.length}</span><button className="secondary-button" onClick={()=>move(1)}>Siguiente <ArrowRight size={16}/></button></div>
  <div className="orlando-viewer-thumbnails" aria-label="Elegir una fotografía">{photos.map(item=><button key={item.id} aria-label={'Ver foto: '+item.title} aria-pressed={photo.id===item.id} onClick={()=>onSelect(item.id)}><Image src={item.src} width={item.width} height={item.height} alt="" sizes="64px"/></button>)}</div>
  <p className="orlando-gallery-note">Fotos de referencia. Las visitas y actividades dependen de la edición. <a href="/photo-credits.html" target="_blank" rel="noopener noreferrer">Créditos de las imágenes</a></p>
 </Dialog>
}
