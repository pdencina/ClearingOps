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

// ============================================================
// Helpers compartidos por las capas de datos (watchdog-db, bpc-tickets-db).
// El driver de Neon devuelve objetos Date nativos para columnas
// DATE/TIMESTAMPTZ (a diferencia de Supabase, que serializa a texto
// ISO vía su API REST). El resto del código espera siempre string,
// así que normalizamos aquí, en el borde con la base.
// ============================================================

export function serializeDates<T>(row: T): T {
  const out = { ...(row as object) } as Record<string, unknown>
  for (const key in out) {
    if (out[key] instanceof Date) {
      out[key] = (out[key] as Date).toISOString()
    }
  }
  return out as T
}

export function serializeRows<T>(rows: unknown[]): T[] {
  return rows.map(r => serializeDates(r as T))
}
