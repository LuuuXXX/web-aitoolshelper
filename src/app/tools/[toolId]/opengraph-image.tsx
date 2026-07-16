import { ogImage, OG_SIZE, OG_CONTENT_TYPE } from '@/lib/og'
import { CATEGORIES, getToolById } from '@/config/tools'

export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default async function Image({
  params,
}: {
  params: Promise<{ toolId: string }>
}) {
  const { toolId } = await params
  const tool = getToolById(toolId)
  if (!tool) return ogImage('AI工具箱', '免费在线AI工具')

  const category = CATEGORIES.find((c) => c.id === tool.category)

  return ogImage(
    tool.name,
    `${category?.name || 'AI工具'} · 免费在线使用`,
    tool.badge,
  )
}
