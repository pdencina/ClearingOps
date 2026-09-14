// ============================================================
// KLAP CORE — Cliente Neon (Postgres)
// Usado por el módulo Release Watchdog para persistencia real.
// Requiere DATABASE_URL en .env.local (connection string de
// Neon Console → Connection Details → "Pooled connection").
// ============================================================
import { neon, type NeonQueryFunction } from '@neondatabase/serverless'

let _sql: NeonQueryFunction<false, false> | null = null

export function getNeonSql(): NeonQueryFunction<false, false> {
  if (_sql) return _sql
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error('Neon no configurado — agrega DATABASE_URL en .env.local (connection string de Neon Console).')
  }
  _sql = neon(url)
  return _sql
}
