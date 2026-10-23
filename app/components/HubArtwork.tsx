import Image from 'next/image'
import { CalendarDays } from 'lucide-react'
import { photoFor, photosFor } from '@/lib/program-photos'
const knownProgram=(program:string|undefined)=>['Orlando','London','Tokyo'].includes(program||'')
function NeutralArtwork({className=''}:{className?:string}) {
 return <div className={'neutral-meeting-artwork '+className} aria-hidden="true"><CalendarDays size={44}/><span>Reunión JDP</span></div>
}

export function CommunityArtwork({className='',eager=false,program,photoKey}:{className?:string;eager?:boolean;program?:string;photoKey?:string}) {
 if(program!==undefined&&!knownProgram(program))return <NeutralArtwork className={'community-artwork real-destination-photos '+className}/>
 const photos=program?[photoFor(program,photoKey)]:[photosFor('Orlando')[1],photosFor('Tokyo')[1],photosFor('London')[0]]
 return <div className={'community-artwork real-destination-photos '+(program?'destination-photo-single ':'destination-photo-collage ')+className} aria-hidden="true">{photos.map(photo=><div className="destination-photo-panel" key={photo.id}><Image src={photo.src} alt="" width={photo.width} height={photo.height} sizes={program?'(max-width:700px) 100vw, 450px':'(max-width:700px) 33vw, 260px'} loading={eager?'eager':'lazy'} style={photo.focus?{objectPosition:photo.focus}:undefined}/><span>{photo.place}</span></div>)}</div>
}
export function ProgramArtwork({program,className='',photoIndex,photoKey}:{program:string;className?:string;photoIndex?:number;photoKey?:string}) {
 if(!knownProgram(program))return <NeutralArtwork className={'program-artwork single-photo-art '+className}/>
 const photo=photoFor(program,photoKey,photoIndex)
 return <div className={'program-artwork single-photo-art '+program.toLowerCase()+' '+className} aria-hidden="true"><Image src={photo.src} width={photo.width} height={photo.height} alt="" sizes="(max-width:700px) 100vw, 550px" style={photo.focus?{objectPosition:photo.focus}:undefined}/><span className="program-photo-label">{photo.place}</span></div>
}
