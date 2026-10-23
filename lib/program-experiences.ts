// Inspiration for a personal story, informed by the three presentations shared by the user.
// These examples are not an itinerary or a promise of inclusions for another edition.
export const programExperiences = [
  {
    id: 'Orlando', label: 'Orlando', edition: 'Liga STEAM',
    headline: 'Orlando · Liga STEAM',
    description: 'Piensa en una actividad en los parques, el proyecto STEAM o tu visita al Centro Espacial Kennedy. ¿Qué recuerdas mejor?',
    themes: ['Parques + física', 'Centro Espacial Kennedy', 'Proyecto STEAM'],
    prompts: ['¿Qué descubriste detrás de una atracción?', '¿Qué pregunta te llevaste de la exploración espacial?', '¿Cómo resolvieron un reto con tu grupo?'],
    reminder: 'Elige un recuerdo que sea tuyo. El anfitrión aclara las actividades de cada edición.',
  },
  {
    id: 'London', label: 'Europa', edition: 'Liga STEAM · Londres',
    headline: 'Europa · Liga STEAM',
    description: 'El proyecto, el Museo de Ciencias, las visitas en Londres y Oxford. Elige un momento que hayas vivido y quieras contar.',
    themes: ['IA y realidad virtual', 'Ciencia + ingeniería', 'Creatividad en equipo'],
    prompts: ['¿Qué pudiste crear o probar con tecnología?', '¿Qué descubrimiento te acercó a una carrera?', '¿Qué aprendiste al compartir ideas con tu equipo?'],
    reminder: 'Un proyecto, una visita o una conversación pueden ser el inicio. Cuenta tu experiencia real.',
  },
  {
    id: 'Tokyo', label: 'Tokio', edition: 'Campeonato STEAM',
    headline: 'Tokio · Campeonato STEAM',
    description: 'Un reto del proyecto, el ambiente de Akihabara o una experiencia cultural. Cuenta qué pasó y qué descubriste.',
    themes: ['Proyecto con impacto', 'Robótica + diseño', 'Tecnología y cultura'],
    prompts: ['¿Qué problema eligieron y por qué les importó?', '¿Qué cambió en tu idea después de probarla?', '¿Qué te sorprendió al conocer otra cultura?'],
    reminder: 'No hace falta un resultado perfecto. También puedes compartir lo que aprendiste durante el proceso.',
  },
] as const

export type ExperienceProgram = typeof programExperiences[number]['id']
export function experienceFor(program:string) {
  return programExperiences.find(item=>item.id===program)||programExperiences[0]
}
