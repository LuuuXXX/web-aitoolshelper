import { randomUUID } from 'crypto'

type Row = Record<string, unknown> & { id: string; createdAt?: Date }

type WhereCond =
  | { gt?: unknown; lt?: unknown; gte?: unknown; lte?: unknown }
  | unknown

function fieldMatches(value: unknown, cond: WhereCond): boolean {
  if (cond === null || cond === undefined) {
    return value === null || value === undefined
  }
  if (typeof cond === 'object' && cond !== null && !Array.isArray(cond) && !(cond instanceof Date)) {
    const c = cond as Record<string, unknown>
    if ('gt' in c) {
      const v = value as never
      const target = c.gt
      if (target instanceof Date && value instanceof Date) return value > target
      return typeof v === 'number' && typeof target === 'number' ? v > target : false
    }
    if ('lt' in c) {
      const v = value as never
      const target = c.lt
      if (target instanceof Date && value instanceof Date) return value < target
      return typeof v === 'number' && typeof target === 'number' ? v < target : false
    }
    if ('gte' in c) {
      const target = c.gte
      if (target instanceof Date && value instanceof Date) return value >= target
      return typeof value === 'number' && typeof target === 'number' ? value >= target : false
    }
  }
  return value === cond
}

function matches(row: Row, where: Record<string, unknown> | undefined): boolean {
  if (!where) return true
  for (const [key, cond] of Object.entries(where)) {
    if (key === 'OR') {
      const ors = cond as Array<Record<string, unknown>>
      if (!ors.some((o) => matches(row, o))) return false
      continue
    }
    if (!fieldMatches(row[key], cond as WhereCond)) return false
  }
  return true
}

function applyUpdateData(row: Row, data: Record<string, unknown>) {
  for (const [key, val] of Object.entries(data)) {
    if (val !== null && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date)) {
      const op = val as Record<string, unknown>
      if ('increment' in op) {
        row[key] = ((row[key] as number) || 0) + (op.increment as number)
      } else if ('decrement' in op) {
        row[key] = ((row[key] as number) || 0) - (op.decrement as number)
      } else if ('set' in op) {
        row[key] = op.set
      } else {
        row[key] = val
      }
    } else {
      row[key] = val
    }
  }
}

function makeModel(getTable: () => Row[]) {
  return {
    findUnique: async ({ where }: { where: Record<string, unknown> }) => {
      const t = getTable()
      return t.find((r) => matches(r, where)) || null
    },
    findFirst: async ({
      where,
      orderBy,
    }: {
      where?: Record<string, unknown>
      orderBy?: Record<string, string>
    }) => {
      let rows = getTable().filter((r) => matches(r, where))
      if (orderBy) {
        for (const [key, dir] of Object.entries(orderBy)) {
          rows = [...rows].sort((a, b) => {
            const av = a[key] as { getTime?: () => number }
            const bv = b[key] as { getTime?: () => number }
            const at = av instanceof Date ? av.getTime() : 0
            const bt = bv instanceof Date ? bv.getTime() : 0
            return dir === 'desc' ? bt - at : at - bt
          })
        }
      }
      return rows[0] || null
    },
    findMany: async ({
      where,
      orderBy,
      skip = 0,
      take,
    }: {
      where?: Record<string, unknown>
      orderBy?: Record<string, string>
      skip?: number
      take?: number
    }) => {
      let rows = getTable().filter((r) => matches(r, where))
      if (orderBy) {
        for (const [key, dir] of Object.entries(orderBy)) {
          rows = [...rows].sort((a, b) => {
            const av = a[key] as Date
            const bv = b[key] as Date
            const at = av instanceof Date ? av.getTime() : 0
            const bt = bv instanceof Date ? bv.getTime() : 0
            return dir === 'desc' ? bt - at : at - bt
          })
        }
      }
      const start = skip || 0
      return take !== undefined ? rows.slice(start, start + take) : rows.slice(start)
    },
    count: async ({ where }: { where?: Record<string, unknown> }) => {
      return getTable().filter((r) => matches(r, where)).length
    },
    create: async ({ data }: { data: Record<string, unknown> }) => {
      const row: Row = { id: randomUUID(), createdAt: new Date(), ...data }
      getTable().push(row)
      return row
    },
    update: async ({
      where,
      data,
    }: {
      where: { id?: string } & Record<string, unknown>
      data: Record<string, unknown>
    }) => {
      const row = getTable().find((r) => matches(r, where))
      if (!row) throw new Error('Record not found')
      applyUpdateData(row, data)
      return row
    },
    updateMany: async ({
      where,
      data,
    }: {
      where: Record<string, unknown>
      data: Record<string, unknown>
    }) => {
      let count = 0
      for (const row of getTable()) {
        if (matches(row, where)) {
          applyUpdateData(row, data)
          count++
        }
      }
      return { count }
    },
    delete: async ({ where }: { where: Record<string, unknown> }) => {
      const table = getTable()
      const idx = table.findIndex((r) => matches(r, where))
      if (idx === -1) throw new Error('Record not found')
      const [removed] = table.splice(idx, 1)
      return removed
    },
    deleteMany: async ({ where }: { where: Record<string, unknown> }) => {
      const table = getTable()
      let count = 0
      for (let i = table.length - 1; i >= 0; i--) {
        if (matches(table[i], where)) {
          table.splice(i, 1)
          count++
        }
      }
      return { count }
    },
  }
}

export interface MockPrisma {
  user: ReturnType<typeof makeModel>
  order: ReturnType<typeof makeModel>
  toolRecord: ReturnType<typeof makeModel>
  verificationCode: ReturnType<typeof makeModel>
  $transaction: <T>(fn: (tx: MockPrisma) => Promise<T>) => Promise<T>
  $queryRaw: Promise<unknown[]>
  __tables: Record<string, Row[]>
}

export function createMockPrisma(
  seed: { users?: Row[]; orders?: Row[]; toolRecords?: Row[]; verificationCodes?: Row[] } = {}
): MockPrisma {
  const tables: Record<string, Row[]> = {
    users: seed.users ? seed.users.map((r) => ({ ...r })) : [],
    orders: seed.orders ? seed.orders.map((r) => ({ ...r })) : [],
    toolRecords: seed.toolRecords ? seed.toolRecords.map((r) => ({ ...r })) : [],
    verificationCodes: seed.verificationCodes ? seed.verificationCodes.map((r) => ({ ...r })) : [],
  }

  const build = (): MockPrisma => ({
    user: makeModel(() => tables.users),
    order: makeModel(() => tables.orders),
    toolRecord: makeModel(() => tables.toolRecords),
    verificationCode: makeModel(() => tables.verificationCodes),
    $queryRaw: Promise.resolve([{ '?column?': 1 }]),
    __tables: tables,
    $transaction: async (fn) => {
      const snapshot = JSON.parse(
        JSON.stringify({
          users: tables.users,
          orders: tables.orders,
          toolRecords: tables.toolRecords,
          verificationCodes: tables.verificationCodes,
        }),
        (_k, v) => {
          if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(v)) return new Date(v)
          return v
        }
      )
      try {
        return await fn(build())
      } catch (err) {
        tables.users = snapshot.users
        tables.orders = snapshot.orders
        tables.toolRecords = snapshot.toolRecords
        tables.verificationCodes = snapshot.verificationCodes
        throw err
      }
    },
  })

  return build()
}
