import { ogImage, OG_SIZE, OG_CONTENT_TYPE } from '@/lib/og'

export const alt = 'AI工具库 - 12+款免费在线AI工具'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default async function Image() {
  return ogImage(
    'AI 工具库',
    '12+款免费在线AI工具，涵盖写作、文案、翻译、办公、创意',
  )
}
