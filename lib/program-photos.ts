import additions from './destination-photos.json'
import { orlandoPhotos } from './orlando'

export type ProgramPhoto = {
  id:string; category:string; place:string; src:string; width:number; height:number;
  title:string; caption:string; alt:string; author:string; source:string; license:string; licenseUrl:string; focus?:string;
}

const orlandoOrder=['hollywood','atlantis','epic','universal','space','saturn-v']
const orlandoCollection:readonly ProgramPhoto[] = [
  ...orlandoOrder.flatMap(id=>orlandoPhotos.filter(photo=>photo.id===id)),
  ...additions.filter(photo=>photo.program==='Orlando'),
]
function ordered(photos:readonly ProgramPhoto[],ids:string[]) {
 return ids.flatMap(id=>photos.filter(photo=>photo.id===id))
}
export const photoCollections:Record<string,readonly ProgramPhoto[]> = {
  Orlando:ordered(orlandoCollection,['hollywood','orlando-atlantis-exterior-v1','atlantis','orlando-toon-lagoon-v1','epic','universal','space','saturn-v','orlando-islands-v1','orlando-ucf-v1']),
  London:ordered(additions.filter(photo=>photo.program==='London'),['europe-westminster-bridge-v1','europe-oxford-v1','europe-flight-gallery-v1','europe-arsenal-exterior-v1','europe-westminster-v1','europe-science-museum-v1','europe-arsenal-v1']),
  Tokyo:ordered(additions.filter(photo=>photo.program==='Tokyo'),['tokyo-sensoji-day-v1','tokyo-akihabara-v1','tokyo-disneysea-v1','tokyo-shibuya-night-v1','tokyo-disneysea-canals-v1','tokyo-asakusa-v1','tokyo-shibuya-v1']),
}
export function photosFor(program:string):readonly ProgramPhoto[] {
  return Object.hasOwn(photoCollections,program)?photoCollections[program]:photoCollections.Orlando
}
const coverIds:Record<string,string>={Orlando:'hollywood',London:'europe-westminster-bridge-v1',Tokyo:'tokyo-akihabara-v1'}
export function coverFor(program:string):ProgramPhoto {
 const photos=photosFor(program)
 return photos.find(photo=>photo.id===coverIds[program])||photos[0]
}
export function photoFor(program:string,key='',index?:number):ProgramPhoto {
 const photos=photosFor(program)
 const number=index??Array.from(key).reduce((value,character)=>(value*31+character.codePointAt(0)!)>>>0,0)
 const photo=photos[Math.abs(Math.trunc(number))%photos.length]
 // Keep extreme panoramas and vertical museum photos intact in the viewer.
 return index===undefined&&(photo.width/photo.height>2.4||photo.width/photo.height<1)?coverFor(program):photo
}
export const allProgramPhotos = Object.values(photoCollections).flat()
