import { Client } from '@neondatabase/serverless'
import { readFile } from 'node:fs/promises'

const schema = process.env.CODED_DATABASE_SCHEMA
if (!schema || !/^coded_hub_[a-z0-9_]{1,45}$/.test(schema)) throw new Error('Set CODED_DATABASE_SCHEMA explicitly before migrating')
const connectionString = process.env.DATABASE_URL_UNPOOLED
if (!connectionString) throw new Error('DATABASE_URL_UNPOOLED is required for migration')
const client = new Client({ connectionString, connectionTimeoutMillis: 15000, query_timeout: 30000 })
try {
  await client.connect()
  await client.query('BEGIN')
  await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [schema])
  await client.query(`CREATE SCHEMA IF NOT EXISTS "${schema}"`)
  await client.query(`SET LOCAL search_path TO "${schema}"`)
  await client.query(await readFile(new URL('../migrations/001-shared-store.sql', import.meta.url), 'utf8'))
  await client.query('COMMIT')
  console.log(`Database migration 001 verified: ${schema}`)
} catch (error) {
  await client.query('ROLLBACK').catch(() => {})
  console.error('Database migration failed:', error.code || error.name)
  process.exitCode = 1
} finally {
  await client.end().catch(() => {})
}
