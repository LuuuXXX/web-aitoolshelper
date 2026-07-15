import 'server-only'
import nodemailer from 'nodemailer'

let transporter: nodemailer.Transporter | null = null

function getTransporter(): nodemailer.Transporter | null {
  if (transporter) return transporter

  const host = process.env.SMTP_HOST
  const port = parseInt(process.env.SMTP_PORT || '465')
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (!host || !user || !pass) return null

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  })

  return transporter
}

export function isEmailConfigured(): boolean {
  return getTransporter() !== null
}

export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const t = getTransporter()
  if (!t) {
    console.warn('Email not configured, skipping send to:', to)
    return false
  }

  try {
    const from = process.env.SMTP_FROM || process.env.SMTP_USER || ''
    await t.sendMail({ from, to, subject, html })
    return true
  } catch (err) {
    console.error('Failed to send email:', err)
    return false
  }
}

export async function sendVerificationCode(to: string, code: string, type: 'register' | 'reset'): Promise<boolean> {
  const action = type === 'register' ? '注册' : '重置密码'
  const html = `
    <div style="max-width:480px;margin:0 auto;font-family:sans-serif;padding:24px;">
      <h2 style="color:#6366f1;">AI工具箱 - ${action}验证码</h2>
      <p>您正在进行<strong>${action}</strong>操作，验证码为：</p>
      <div style="font-size:32px;font-weight:bold;letter-spacing:4px;color:#6366f1;text-align:center;padding:16px;background:#f5f3ff;border-radius:8px;margin:16px 0;">
        ${code}
      </div>
      <p style="color:#666;font-size:14px;">验证码 5 分钟内有效，请勿泄露给他人。</p>
    </div>
  `
  return sendEmail(to, `AI工具箱${action}验证码`, html)
}
