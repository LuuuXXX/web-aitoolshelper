import 'server-only'

export function logError(route: string, ctx: Record<string, unknown>, err: unknown): void {
  const record = {
    level: 'error',
    route,
    ...ctx,
    msg: err instanceof Error ? err.message : String(err),
    ts: new Date().toISOString(),
  }
  console.error(JSON.stringify(record))
}

export function logWarn(route: string, ctx: Record<string, unknown>, msg: string): void {
  const record = {
    level: 'warn',
    route,
    ...ctx,
    msg,
    ts: new Date().toISOString(),
  }
  console.warn(JSON.stringify(record))
}
