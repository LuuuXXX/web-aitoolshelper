import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { fileURLToPath } from 'node:url'

vi.mock('alipay-sdk', () => ({
  AlipaySdk: class {
    async exec() {
      return {
        alipay_trade_query_response: {
          code: '10000',
          trade_status: 'TRADE_SUCCESS',
          trade_no: 'T-123',
          total_amount: 'not-a-number',
        },
      }
    }
    async pageExec() {
      return 'mock-form'
    }
    checkNotifySign() {
      return false
    }
  },
}))

import { queryPayment } from '@/lib/alipay'

const existingFile = fileURLToPath(import.meta.url)
const orig = { ...process.env }

describe('alipay queryPayment NaN guard', () => {
  beforeAll(() => {
    process.env.ALIPAY_APP_ID = 'test-app'
    process.env.ALIPAY_APP_PRIVATE_KEY_PATH = existingFile
    process.env.ALIPAY_ALIPAY_PUBLIC_KEY_PATH = existingFile
  })
  afterAll(() => {
    for (const k of Object.keys(orig)) process.env[k] = orig[k]
  })

  it('returns null instead of NaN when total_amount is non-numeric', async () => {
    const res = await queryPayment('T-123')
    expect(res).toBeNull()
  })

  it('returns parsed result when total_amount is valid', async () => {
    vi.doUnmock('alipay-sdk')
    vi.resetModules()
    vi.doMock('alipay-sdk', () => ({
      AlipaySdk: class {
        async exec() {
          return {
            alipay_trade_query_response: {
              code: '10000',
              trade_status: 'TRADE_FINANCED',
              trade_no: 'T-456',
              total_amount: '0.01',
            },
          }
        }
      },
    }))
    const { queryPayment: qp } = await import('@/lib/alipay')
    const res = await qp('T-456')
    expect(res).toEqual({
      tradeStatus: 'TRADE_FINANCED',
      tradeNo: 'T-456',
      totalAmount: 0.01,
    })
  })
})
