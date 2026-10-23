import test from 'node:test'
import assert from 'node:assert/strict'
import { localDateTime, zonedDateTime } from '../lib/time-zones.ts'
for (const [zone,expected] of [
 ['America/La_Paz','2026-10-23T21:00:00.000Z'],
 ['America/New_York','2026-10-23T21:00:00.000Z'],
 ['Europe/Madrid','2026-10-23T15:00:00.000Z'],
 ['America/Sao_Paulo','2026-10-23T20:00:00.000Z'],
 ['UTC','2026-10-23T17:00:00.000Z'],
]) test(`Creates the intended instant in ${zone}`,()=>assert.equal(zonedDateTime('2026-10-23T17:00',zone),expected))
test('Converts an existing meeting to another country without moving its instant',()=>assert.equal(localDateTime('2026-10-23T21:00:00.000Z','Europe/Madrid'),'2026-10-23T23:00'))
for(const [zone,local] of [['America/New_York','2026-03-08T02:30'],['Europe/Madrid','2026-03-29T02:30']])test(`Rejects nonexistent clock-change hour in ${zone}`,()=>assert.throws(()=>zonedDateTime(local,zone),/no existe/))
for(const [zone,local] of [['America/New_York','2026-11-01T01:30'],['Europe/Madrid','2026-10-25T02:30']])test(`Rejects ambiguous clock-change hour in ${zone}`,()=>assert.throws(()=>zonedDateTime(local,zone),/se repite/))
test('Rejects an impossible calendar date',()=>assert.throws(()=>zonedDateTime('2026-02-30T10:00','UTC')))
test('Preserves a day boundary when changing country',()=>assert.equal(localDateTime('2026-10-24T01:00:00.000Z','America/La_Paz'),'2026-10-23T21:00'))
