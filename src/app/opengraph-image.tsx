import { ogImage, OG_SIZE, OG_CONTENT_TYPE } from '@/lib/og'

export const alt = 'AI工具箱 - 12+款免费在线AI工具'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default async function Image() {
  return ogImage(
    '免费 AI 工具箱',
    '12+款在线AI工具 · 写作 · 文案 · 翻译 · 办公',
  )
}
