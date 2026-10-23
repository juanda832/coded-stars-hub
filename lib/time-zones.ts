export const ORLANDO_ZONE = 'America/New_York'

export const zoneChoices = [
  ['America/La_Paz', 'La Paz'],
  ['America/New_York', 'Orlando'],
  ['Europe/Madrid', 'Madrid'],
  ['America/Sao_Paulo', 'São Paulo'],
  ['UTC', 'UTC'],
] as const

function wallParts(date: Date, zone: string) {
  const values = new Intl.DateTimeFormat('en-CA', {
    timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(date)
  const part = (key: string) => values.find(p => p.type === key)!.value
  return `${part('year')}-${part('month')}-${part('day')}T${part('hour')}:${part('minute')}`
}

export function localDateTime(iso: string, zone: string) {
  return wallParts(new Date(iso), zone)
}

export function zonedDateTime(local: string, zone: string) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(local)) throw new Error('Elige una fecha y una hora válidas.')
  const wall = Date.parse(local + ':00Z')
  if (!Number.isFinite(wall) || new Date(wall).toISOString().slice(0, 16) !== local) throw new Error('Revisa la fecha y la hora.')
  // Sample both sides of a possible clock change; never silently accept a missing or repeated hour.
  const candidates = new Set<number>()
  for (const hours of [-36, 0, 36]) {
    const sample = wall + hours * 3600000
    const offset = Date.parse(wallParts(new Date(sample), zone) + ':00Z') - sample
    const candidate = wall - offset
    if (wallParts(new Date(candidate), zone) === local) candidates.add(candidate)
  }
  if (!candidates.size) throw new Error('Esa hora no existe por el cambio de horario. Verifica el dato del calendario con el anfitrión.')
  if (candidates.size > 1) throw new Error('Esa hora se repite por el cambio de horario. Confirma con el anfitrión cuál corresponde antes de registrarla.')
  return new Date([...candidates][0]).toISOString()
}
