import type { Metadata } from 'next'
import type { Tool } from '@/config/tools'
import { CATEGORIES } from '@/config/tools'

const APP_URL = process.env.APP_URL || 'https://aitoolshelper.cn'

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  writing: ['AI写作', '在线写作工具', '文章生成器', 'AI内容创作'],
  marketing: ['营销文案', '广告文案生成', '新媒体文案', '小红书运营'],
  office: ['办公效率', 'AI办公工具', '文档处理', '职场工具'],
  creative: ['AI创意工具', '创意生成', '灵感工具'],
}

export function getToolMetadata(tool: Tool): Metadata {
  const category = CATEGORIES.find((c) => c.id === tool.category)
  const catName = category?.name || 'AI工具'
  const extraKeywords = CATEGORY_KEYWORDS[tool.category] || []

  return {
    title: `${tool.name} - 免费${catName}工具`,
    description: `${tool.description}。${tool.name}支持在线免费使用，无需安装，一键生成专业内容。AI工具箱提供12+款免费AI工具，涵盖写作、文案、翻译、办公等场景。`,
    keywords: [tool.name, ...extraKeywords, '免费AI工具', '在线工具', 'AI工具箱'],
    alternates: {
      canonical: `/tools/${tool.id}`,
    },
    openGraph: {
      title: `${tool.name} - 免费${catName}工具 | AI工具箱`,
      description: `${tool.description} 免费在线使用，一键生成。`,
      url: `${APP_URL}/tools/${tool.id}`,
      type: 'website',
    },
  }
}

export function getToolJsonLd(tool: Tool) {
  const category = CATEGORIES.find((c) => c.id === tool.category)

  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: tool.name,
    description: tool.description,
    applicationCategory: category?.name || 'AI工具',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'CNY',
      description: '免费使用，升级会员获得更多额度',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '100',
    },
    featureList: tool.fields.map((f) => f.label),
    faqPage: {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: `${tool.name}是免费的吗？`,
          acceptedAnswer: {
            '@type': 'Answer',
            text: `${tool.name}提供每日免费使用额度，注册后即可免费体验。如需更多使用次数，可选择升级为月度、季度或年度会员。`,
          },
        },
        {
          '@type': 'Question',
          name: `${tool.name}生成的内容易被检测为AI生成吗？`,
          acceptedAnswer: {
            '@type': 'Answer',
            text: `${tool.name}采用先进的AI模型生成内容，建议在使用时提供详细的输入信息，并对生成内容进行适当修改和润色，以获得最佳效果。`,
          },
        },
        {
          '@type': 'Question',
          name: `使用${tool.name}需要安装软件吗？`,
          acceptedAnswer: {
            '@type': 'Answer',
            text: '不需要安装任何软件，AI工具箱所有工具均在线运行，打开网页即可使用，支持电脑和手机浏览器。',
          },
        },
      ],
    },
  }
}
