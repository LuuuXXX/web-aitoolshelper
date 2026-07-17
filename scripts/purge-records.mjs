import { Pool } from 'pg'

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  console.error('purge-records: DATABASE_URL not set')
  process.exit(1)
}

const pool = new Pool({ connectionString })

try {
  const result = await pool.query(
    "DELETE FROM tool_records WHERE \"createdAt\" < NOW() - INTERVAL '90 days'"
  )
  console.log(`purge-records: removed ${result.rowCount} tool_records older than 90 days`)
} catch (err) {
  console.error('purge-records: failed to purge tool_records:', err.message || err)
  process.exit(1)
} finally {
  await pool.end()
}
