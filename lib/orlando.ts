export type OrlandoPhoto = {
  id:string; category:'parks'|'space'; place:string; src:string; width:number; height:number;
  title:string; caption:string; alt:string; author:string; source:string; license:string; licenseUrl:string; focus?:string;
}

export const orlandoPhotos:readonly OrlandoPhoto[] = [
  {
    id: 'universal',
    category: 'parks',
    place: 'Universal Studios Florida',
    src: '/photos/universal-studios-globe-v1.jpg',
    width: 1280,
    height: 640,
    title: 'La emoción de descubrir',
    caption: 'El globo de Universal Studios Florida. Fotografía de referencia del 26 de febrero de 2024.',
    alt: 'Globo iluminado de Universal Studios Florida y visitantes en la entrada del parque.',
    author: 'Eden, Janine and Jim',
    source: 'https://commons.wikimedia.org/wiki/File:Universal_Globe.jpg',
    license: 'CC BY 2.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/2.0/',
  },
  {
    id: 'space',
    category: 'space',
    place: 'Jardín de Cohetes',
    src: '/photos/kennedy-rocket-garden-v1.jpg',
    width: 3888,
    height: 2592,
    title: 'La curiosidad llega más lejos',
    caption: 'Jardín de Cohetes del Centro Espacial Kennedy, Florida. Fotografía de referencia de 2009.',
    alt: 'Cohetes históricos del Jardín de Cohetes del Centro Espacial Kennedy vistos desde abajo.',
    author: 'Kolossos',
    source: 'https://commons.wikimedia.org/wiki/File:Kennedy_Space_Center-Rocket-garden.jpg',
    license: 'CC BY-SA 3.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0/',
  },
  {
    id: 'hollywood', category: 'parks', place: 'Disney Hollywood Studios',
    src: '/photos/hollywood-studios-boulevard-v1.jpg', width:1280, height:853,
    title: 'Mira los parques de otra manera',
    caption: 'Hollywood Boulevard en Disney Hollywood Studios, Florida. Fotografía de referencia del 24 de febrero de 2024.',
    alt: 'Hollywood Boulevard, con palmeras y edificios del parque Disney Hollywood Studios.',
    author: 'Jedi94',
    source: "https://commons.wikimedia.org/wiki/File:Hollywood_Boulevard,_Disney's_Hollywood_Studios_(2024).jpg",
    license: 'CC BY-SA 4.0', licenseUrl:'https://creativecommons.org/licenses/by-sa/4.0/',
    focus: '50% 60%',
  },
  {
    id: 'atlantis', category: 'space', place: 'Atlantis',
    src: '/photos/kennedy-atlantis-v1.jpg', width:1280, height:720,
    title: 'Frente al transbordador Atlantis',
    caption: 'El transbordador Atlantis en exhibición en el Centro Espacial Kennedy, Florida. Fotografía del 22 de julio de 2023.',
    alt: 'El transbordador espacial Atlantis expuesto en el interior del Centro Espacial Kennedy.',
    author: 'Horizon206',
    source: "https://commons.wikimedia.org/wiki/File:Space_Shuttle_Atlantis_on_display_at_the_Kennedy_Space_Center's_Visitor_Complex.jpg",
    license: 'CC0 1.0', licenseUrl:'https://creativecommons.org/publicdomain/zero/1.0/',
    focus: '50% 42%',
  },
  {
    id: 'epic', category: 'parks', place: 'Epic Universe',
    src: '/photos/epic-universe-entrance-v1.jpg', width:1280, height:638,
    title: 'Curiosidad desde la entrada',
    caption: 'La entrada de Epic Universe en Orlando. Fotografía de referencia del 11 de abril de 2025.',
    alt: 'Arco ornamentado de la entrada de Epic Universe bajo un cielo con nubes.',
    author: 'CANthony0125',
    source: 'https://commons.wikimedia.org/wiki/File:UEU_Entrance.jpg',
    license: 'Dominio público (autor)', licenseUrl:'https://commons.wikimedia.org/wiki/File:UEU_Entrance.jpg#Licensing',
    focus: '50% 64%',
  },
  {
    id: 'saturn-v', category: 'space', place: 'Apolo / Saturno V',
    src: '/photos/kennedy-saturn-v-v1.png', width:1280, height:960,
    title: 'La escala de un Saturn V',
    caption: 'Exhibición del Centro Apolo / Saturno V en el Centro Espacial Kennedy, Florida. Fotografía de marzo de 2023.',
    alt: 'Los grandes motores del cohete Saturn V en la sala de exhibición del Centro Apolo / Saturno V.',
    author: 'Scu ba',
    source: 'https://commons.wikimedia.org/wiki/File:Saturn_V_Center.png',
    license: 'CC0 1.0', licenseUrl:'https://creativecommons.org/publicdomain/zero/1.0/',
    focus: '50% 40%',
  },
]

export const orlandoCoverPhotos = orlandoPhotos.filter(photo=>photo.id==='hollywood'||photo.id==='atlantis')

export const orlandoStoryTopics = [
  { id: 'parks', label: 'Los parques', title: 'Un momento que aún te hace sonreír.', prompt: '¿Qué recuerdas de los parques y cómo te sentiste al vivirlo?', tip: 'Elige un momento concreto: la emoción, una sorpresa o algo que te animaste a hacer.' },
  { id: 'space', label: 'La NASA', title: 'Una pregunta que te abrió un mundo.', prompt: '¿Qué te sorprendió de la NASA o de la exploración espacial?', tip: 'Cuenta qué te llamó la atención y qué te dio curiosidad. Puedes decirlo con palabras sencillas.' },
  { id: 'people', label: 'Mi grupo', title: 'También importa con quién lo viviste.', prompt: '¿Qué momento con tu grupo te gustaría volver a contar?', tip: 'Piensa en cómo se acompañaron, algo que compartieron o una amistad que te llevaste.' },
] as const
