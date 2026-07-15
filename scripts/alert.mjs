import { readFileSync, existsSync } from 'fs'
import nodemailer from 'nodemailer'

const to = process.argv[2]
const subject = process.argv[3]
const message = process.argv[4] || ''

if (!to || !subject) {
  console.error('Usage: node alert.mjs <to> <subject> [message]')
  process.exit(1)
}

const envPath = '/root/luuux/.env'
const env = {}

if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const match = line.match(/^([A-Z_]+)=(.*)$/)
    if (match) {
      env[match[1]] = match[2].replace(/^["']|["']$/g, '')
    }
  }
}

const host = env.SMTP_HOST
const port = parseInt(env.SMTP_PORT || '465')
const user = env.SMTP_USER
const pass = env.SMTP_PASS
const from = env.SMTP_FROM || user

if (!host || !user || !pass) {
  console.error('SMTP not configured, cannot send alert')
  process.exit(1)
}

const appName = env.APP_NAME || 'AI工具箱'
const hostname = import.meta.url ? undefined : undefined

const html = `
  <div style="max-width:480px;margin:0 auto;font-family:sans-serif;padding:24px;">
    <h2 style="color:#ef4444;">${appName} - 系统告警</h2>
    <div style="padding:16px;background:#fef2f2;border-radius:8px;margin:16px 0;border:1px solid #fecaca;">
      <p style="font-size:16px;font-weight:bold;color:#dc2626;margin:0 0 8px;">${subject}</p>
      <p style="color:#666;font-size:14px;margin:0;white-space:pre-wrap;">${message}</p>
    </div>
    <p style="color:#999;font-size:12px;">
      服务器: ${env.APP_URL || 'localhost'}<br/>
      时间: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}
    </p>
  </div>
`

const transporter = nodemailer.createTransport({
  host,
  port,
  secure: port === 465,
  auth: { user, pass },
})

try {
  await transporter.sendMail({ from, to, subject: `[告警] ${subject}`, html })
  console.log(`Alert sent to ${to}: ${subject}`)
} catch (err) {
  console.error('Failed to send alert:', err.message)
  process.exit(1)
}
