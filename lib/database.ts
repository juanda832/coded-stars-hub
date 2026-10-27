import 'server-only'
import { AsyncLocalStorage } from 'node:async_hooks'
import { DatabaseSync, type SQLInputValue } from 'node:sqlite'
import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { Client } from '@neondatabase/serverless'

type Row = Record<string, unknown>
type Result = { rows: Row[]; changes: number }
type Connection = { scope:string; query: (sql: string, values: SQLInputValue[]) => Promise<Result> }
const context = new AsyncLocalStorage<Connection>()
const locals = new Map<string,DatabaseSync>()
let localQueue = Promise.resolve()

// Identifiers are configuration, never request input. Preview and beta stay separate.
export function databaseSchema(override?:string) {
  const schema = override || process.env.CODED_DATABASE_SCHEMA || (process.env.VERCEL_ENV === 'production' ? 'coded_hub_beta' : 'coded_hub_preview')
  if (!/^coded_hub_[a-z0-9_]{1,45}$/.test(schema)) throw new Error('Invalid database schema configuration')
  return schema
}

function localDatabase(scope?:string) {
  const key=scope||'default'
  const existing=locals.get(key);if(existing)return existing
  const original = process.env.CODED_DEMO_DB || resolve(process.cwd(), '.data/hub.sqlite')
  const file=scope?`${original}.${databaseSchema(scope)}.sqlite`:original
  mkdirSync(dirname(file), { recursive: true })
  const local = new DatabaseSync(file)
  local.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS records(collection TEXT NOT NULL,id TEXT NOT NULL,json TEXT NOT NULL,PRIMARY KEY(collection,id));
    CREATE TABLE IF NOT EXISTS applications(id TEXT PRIMARY KEY,meeting_id TEXT NOT NULL,user_id TEXT NOT NULL,status TEXT NOT NULL CHECK(status IN ('pending','confirmed','not_selected','withdrawn')),requested_at TEXT NOT NULL,updated_at TEXT NOT NULL,UNIQUE(meeting_id,user_id));
    CREATE UNIQUE INDEX IF NOT EXISTS one_confirmed_star_per_meeting ON applications(meeting_id) WHERE status='confirmed';
    CREATE TABLE IF NOT EXISTS notifications(id TEXT PRIMARY KEY,user_id TEXT NOT NULL,meeting_id TEXT NOT NULL,title TEXT NOT NULL,body TEXT NOT NULL,created_at TEXT NOT NULL,read_at TEXT);
    CREATE TABLE IF NOT EXISTS selection_criteria(meeting_id TEXT PRIMARY KEY,text TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS metadata(key TEXT PRIMARY KEY,value TEXT NOT NULL);`)
  locals.set(key,local);return local
}

export async function query(sql: string, ...values: SQLInputValue[]) {
  const connection = context.getStore()
  if (!connection) throw new Error('Database operation outside a request transaction')
  return (await connection.query(sql, values)).rows
}
export async function queryOne(sql: string, ...values: SQLInputValue[]) {
  return (await query(sql, ...values))[0]
}
export async function execute(sql: string, ...values: SQLInputValue[]) {
  const connection = context.getStore()
  if (!connection) throw new Error('Database operation outside a request transaction')
  return { changes: (await connection.query(sql, values)).changes }
}

export async function withDatabase<T>(fn: () => Promise<T>,scope?:string): Promise<T> {
  const current=context.getStore()
  if (current) {if(scope&&databaseSchema(scope)!==current.scope)throw new Error('Cross-scope database operation');return fn()}
  if (process.env.DATABASE_URL) {
    const client = new Client({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 15000, query_timeout: 20000 })
    try {
      await client.connect()
      await client.query('BEGIN')
      await client.query("SET LOCAL lock_timeout = '10s'")
      await client.query("SET LOCAL statement_timeout = '15s'")
      const schema = databaseSchema(scope)
      // The small beta serializes complete workflows across every server instance.
      // The partial unique index also enforces one confirmed Star at database level.
      await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [schema])
      await client.query(`SET LOCAL search_path TO "${schema}"`)
      const result = await context.run({ scope:schema, query: async (sql, values) => {
        let index = 0
        const statement = sql.replace(/\?/g, () => `$${++index}`).replace(/\browid\b/g, 'sequence')
        const result = await client.query(statement, values)
        return { rows: result.rows, changes: result.rowCount || 0 }
      } }, fn)
      await client.query('COMMIT')
      return result
    } catch (error) {
      await client.query('ROLLBACK').catch(() => {})
      throw error
    } finally {
      await client.end().catch(() => {})
    }
  }
  if (process.env.VERCEL === '1') throw new Error('Shared database is required on Vercel')
  const previous = localQueue
  let release!: () => void
  localQueue = new Promise<void>(resolve => { release = resolve })
  await previous
  let db: DatabaseSync | undefined
  try {
    db = localDatabase(scope)
    const database = db
    database.exec('BEGIN IMMEDIATE')
    const result = await context.run({ scope:scope||'default', query: async (sql, values) => {
      const statement = database.prepare(sql)
      if (/^\s*SELECT\b/i.test(sql)) return { rows: statement.all(...values), changes: 0 }
      return { rows: [], changes: Number(statement.run(...values).changes) }
    } }, fn)
    database.exec('COMMIT')
    return result
  } catch (error) {
    if (db) { try { db.exec('ROLLBACK') } catch {} }
    throw error
  } finally {
    release()
  }
}
