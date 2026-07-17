import 'server-only'
import fs from 'fs'
import { AlipaySdk } from 'alipay-sdk'

function readKey(path: string): string {
  if (!path) return ''
  try {
    return fs.readFileSync(path, 'utf-8').trim()
  } catch (err) {
    console.error(`[alipay] Failed to read key file: ${path}`, err)
    return ''
  }
}

let client: AlipaySdk | null = null

function getAlipayClient(): AlipaySdk {
  if (client) return client

  const appId = process.env.ALIPAY_APP_ID || ''
  const privateKey = readKey(process.env.ALIPAY_APP_PRIVATE_KEY_PATH || '')
  const alipayPublicKey = readKey(process.env.ALIPAY_ALIPAY_PUBLIC_KEY_PATH || '')

  if (!appId || !privateKey || !alipayPublicKey) {
    throw new Error('Alipay configuration incomplete. Check .env and key files.')
  }

  client = new AlipaySdk({
    appId,
    privateKey,
    alipayPublicKey,
    signType: (process.env.ALIPAY_SIGN_TYPE || 'RSA2') as 'RSA2',
    gateway: process.env.ALIPAY_GATEWAY || 'https://openapi.alipay.com/gateway.do',
    timeout: 15000,
  })

  return client
}

export async function createPayment(
  orderNo: string,
  amount: number,
  subject: string,
  body: string = ''
): Promise<string> {
  const sdk = getAlipayClient()
  const notifyUrl = process.env.ALIPAY_NOTIFY_URL || ''
  const returnUrl = process.env.ALIPAY_RETURN_URL || ''

  const result = await sdk.pageExec('alipay.trade.page.pay', {
    method: 'GET',
    bizContent: {
      out_trade_no: orderNo,
      product_code: 'FAST_INSTANT_TRADE_PAY',
      subject,
      body,
      total_amount: amount.toFixed(2),
    },
    notify_url: notifyUrl,
    return_url: returnUrl,
  })

  return result as string
}

export async function verifyNotification(params: Record<string, string>): Promise<boolean> {
  try {
    const sdk = getAlipayClient()
    const signVerifi = sdk.checkNotifySign(params)
    return signVerifi
  } catch {
    return false
  }
}

export async function queryPayment(tradeNo: string, outTradeNo?: string): Promise<{
  tradeStatus: string
  tradeNo: string
  totalAmount: number
} | null> {
  const sdk = getAlipayClient()
  const result = await sdk.exec('alipay.trade.query', {
    bizContent: outTradeNo
      ? { out_trade_no: outTradeNo }
      : { trade_no: tradeNo },
  })

  const response = result as { alipay_trade_query_response?: { code: string; trade_status: string; trade_no: string; total_amount: string } }
  if (response.alipay_trade_query_response?.code === '10000') {
    const data = response.alipay_trade_query_response
    const totalAmount = parseFloat(data.total_amount)
    if (!Number.isFinite(totalAmount)) {
      console.error(`[alipay] queryPayment returned non-finite total_amount: ${data.total_amount}`)
      return null
    }
    return {
      tradeStatus: data.trade_status,
      tradeNo: data.trade_no,
      totalAmount,
    }
  }
  return null
}

export function isAlipayConfigured(): boolean {
  const appId = process.env.ALIPAY_APP_ID || ''
  const privateKey = readKey(process.env.ALIPAY_APP_PRIVATE_KEY_PATH || '')
  const alipayPublicKey = readKey(process.env.ALIPAY_ALIPAY_PUBLIC_KEY_PATH || '')
  return !!(appId && privateKey && alipayPublicKey)
}
