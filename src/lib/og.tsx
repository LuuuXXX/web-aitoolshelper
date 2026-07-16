import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

export const FONT_CACHE = (async () => {
  const data = await readFile(join(process.cwd(), 'assets/og-font.ttf'))
  return [{ name: 'WQY', data, style: 'normal' as const, weight: 400 as const }]
})()

export const OG_SIZE = { width: 1200, height: 630 }
export const OG_CONTENT_TYPE = 'image/png'

const BRAND = '#6366f1'
const ACCENT = '#14b8a6'

export async function ogImage(
  title: string,
  subtitle: string,
  badge?: string,
) {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: '#0f0f1a',
          padding: '80px',
          fontFamily: 'WQY',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '8px',
            background: `linear-gradient(90deg, ${BRAND}, ${ACCENT})`,
          }}
        />
        {badge && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '24px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '8px 24px',
                borderRadius: '100px',
                background: `linear-gradient(135deg, ${BRAND}, ${ACCENT})`,
                color: 'white',
                fontSize: '24px',
                fontWeight: 600,
              }}
            >
              {badge}
            </div>
          </div>
        )}
        <div
          style={{
            display: 'flex',
            fontSize: title.length > 12 ? '64px' : '80px',
            fontWeight: 700,
            color: 'white',
            lineHeight: 1.2,
            maxWidth: '900px',
          }}
        >
          {title}
        </div>
        <div
          style={{
            display: 'flex',
            marginTop: '24px',
            fontSize: '32px',
            color: '#9999aa',
            maxWidth: '800px',
          }}
        >
          {subtitle}
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginTop: 'auto',
            gap: '12px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: `linear-gradient(135deg, ${BRAND}, ${ACCENT})`,
              fontSize: '28px',
              fontWeight: 700,
              color: 'white',
            }}
          >
            AI
          </div>
          <div style={{ display: 'flex', fontSize: '28px', color: '#666677', fontWeight: 500 }}>
            AI工具箱 · aitoolshelper.cn
          </div>
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: await FONT_CACHE,
    },
  )
}
