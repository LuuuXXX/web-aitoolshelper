export type FieldType = 'text' | 'textarea' | 'select' | 'number'

export interface ToolField {
  key: string
  label: string
  type: FieldType
  placeholder?: string
  options?: { label: string; value: string }[]
  required?: boolean
  defaultValue?: string
  rows?: number
}

export interface Tool {
  id: string
  name: string
  description: string
  icon: string
  category: string
  fields: ToolField[]
  systemPrompt: (input: Record<string, string>) => string
  userPrompt: (input: Record<string, string>) => string
  badge?: string
  useCases?: string[]
}

export const CATEGORIES = [
  { id: 'writing', name: '智能写作', icon: 'PenLine' },
  { id: 'marketing', name: '营销文案', icon: 'Megaphone' },
  { id: 'office', name: '办公效率', icon: 'Briefcase' },
  { id: 'creative', name: '创意工具', icon: 'Sparkles' },
] as const

export const TOOLS: Tool[] = [
  {
    id: 'article-writer',
    name: 'AI 文章写作',
    description: '根据主题和关键词，自动生成高质量文章',
    icon: 'FileText',
    category: 'writing',
    badge: '热门',
    useCases: ['自媒体文章创作', 'SEO优化文章撰写', '行业分析报告', '公众号推文生成'],
    fields: [
      { key: 'topic', label: '文章主题', type: 'text', placeholder: '例如：人工智能在教育领域的应用', required: true },
      {
        key: 'style',
        label: '文章风格',
        type: 'select',
        options: [
          { label: '专业严谨', value: '专业严谨' },
          { label: '通俗易懂', value: '通俗易懂' },
          { label: '幽默风趣', value: '幽默风趣' },
          { label: '文学优美', value: '文学优美' },
        ],
        defaultValue: '通俗易懂',
        required: true,
      },
      { key: 'length', label: '字数要求', type: 'select', options: [
        { label: '500字', value: '500' },
        { label: '800字', value: '800' },
        { label: '1500字', value: '1500' },
        { label: '2000字', value: '2000' },
      ], defaultValue: '800', required: true },
      { key: 'keywords', label: '关键词（可选）', type: 'text', placeholder: '多个关键词用逗号分隔' },
    ],
    systemPrompt: () => '你是一位资深的内容创作者，擅长撰写各类文章。请根据用户的要求生成一篇结构清晰、内容丰富、逻辑连贯的文章。',
    userPrompt: (i) => `请以「${i.topic}」为主题写一篇文章。\n风格：${i.style}\n字数：约${i.length}字\n${i.keywords ? `需要包含关键词：${i.keywords}\n` : ''}请输出完整的文章，包含标题和正文。`,
  },
  {
    id: 'xiaohongshu',
    name: '小红书文案',
    description: '生成爆款小红书笔记，含标题、正文和标签',
    icon: 'BookOpen',
    category: 'marketing',
    badge: '热门',
    useCases: ['产品种草笔记', '探店体验分享', '好物推荐清单', '知识科普内容'],
    fields: [
      { key: 'product', label: '产品/主题', type: 'text', placeholder: '例如：一款保湿面霜', required: true },
      { key: 'sellingPoint', label: '核心卖点', type: 'textarea', placeholder: '产品的主要特点、优势等', rows: 3 },
      {
        key: 'tone',
        label: '语气风格',
        type: 'select',
        options: [
          { label: '种草安利', value: '种草安利' },
          { label: '真实测评', value: '真实测评' },
          { label: '攻略分享', value: '攻略分享' },
          { label: '日常分享', value: '日常分享' },
        ],
        defaultValue: '种草安利',
        required: true,
      },
    ],
    systemPrompt: () => '你是小红书爆款文案专家，擅长写出吸引眼球、引发互动的笔记内容。文案要有感染力，善用emoji和话题标签。',
    userPrompt: (i) => `请为「${i.product}」写一篇小红书笔记。\n${i.sellingPoint ? `卖点信息：${i.sellingPoint}\n` : ''}语气风格：${i.tone}\n\n请输出：\n1. 吸引人的标题（15字以内，带emoji）\n2. 正文内容（300-500字，分段清晰，适当使用emoji）\n3. 相关话题标签（5-8个，#格式）`,
  },
  {
    id: 'copywriting',
    name: '广告文案',
    description: '生成高转化率的广告文案，适合各种渠道',
    icon: 'Megaphone',
    category: 'marketing',
    useCases: ['朋友圈推广文案', '抖音短视频脚本', '电商详情页文案', '微博活动推广'],
    fields: [
      { key: 'product', label: '产品名称', type: 'text', required: true },
      { key: 'feature', label: '产品特点', type: 'textarea', placeholder: '详细描述产品的功能和优势', rows: 3, required: true },
      { key: 'target', label: '目标人群', type: 'text', placeholder: '例如：25-35岁都市白领' },
      {
        key: 'channel',
        label: '投放渠道',
        type: 'select',
        options: [
          { label: '微信朋友圈', value: '朋友圈' },
          { label: '抖音', value: '抖音' },
          { label: '微博', value: '微博' },
          { label: '电商详情页', value: '电商详情页' },
        ],
        defaultValue: '朋友圈',
        required: true,
      },
    ],
    systemPrompt: () => '你是一位资深广告文案策划师，精通消费者心理学，擅长写出直击痛点、引导行动的高转化文案。',
    userPrompt: (i) => `请为「${i.product}」写一份${i.channel}广告文案。\n产品特点：${i.feature}\n${i.target ? `目标人群：${i.target}\n` : ''}\n请提供3个版本的文案，风格分别为：\n1. 痛点切入型\n2. 利益驱动型\n3. 情感共鸣型\n每个版本100字以内。`,
  },
  {
    id: 'document-summary',
    name: '文档摘要',
    description: '将长文档快速浓缩为核心摘要',
    icon: 'ScrollText',
    category: 'office',
    useCases: ['会议纪要提炼', '学术论文摘要', '长文新闻速读', '合同条款要点'],
    fields: [
      { key: 'content', label: '文档内容', type: 'textarea', placeholder: '粘贴需要总结的文章或文档内容...', rows: 8, required: true },
      {
        key: 'format',
        label: '输出格式',
        type: 'select',
        options: [
          { label: '核心要点（3-5条）', value: '要点' },
          { label: '一段话摘要', value: '段落' },
          { label: '思维导图大纲', value: '大纲' },
        ],
        defaultValue: '要点',
        required: true,
      },
    ],
    systemPrompt: () => '你是文档分析专家，擅长从大量文字中提取核心信息，进行精准概括。',
    userPrompt: (i) => `请将以下内容总结为${i.format === '要点' ? '3-5个核心要点' : i.format === '段落' ? '一段简洁的摘要' : '层次分明的大纲格式'}：\n\n${i.content}`,
  },
  {
    id: 'translation',
    name: 'AI 翻译',
    description: '高质量多语言翻译，支持中英日韩法德等',
    icon: 'Languages',
    category: 'office',
    useCases: ['商务邮件翻译', '学术论文翻译', '产品说明书本地化', '旅行用语翻译'],
    fields: [
      { key: 'text', label: '原文内容', type: 'textarea', placeholder: '输入需要翻译的文本...', rows: 5, required: true },
      {
        key: 'from',
        label: '源语言',
        type: 'select',
        options: [
          { label: '自动检测', value: 'auto' },
          { label: '中文', value: '中文' },
          { label: '英语', value: '英语' },
          { label: '日语', value: '日语' },
          { label: '韩语', value: '韩语' },
          { label: '法语', value: '法语' },
          { label: '德语', value: '德语' },
        ],
        defaultValue: 'auto',
        required: true,
      },
      {
        key: 'to',
        label: '目标语言',
        type: 'select',
        options: [
          { label: '中文', value: '中文' },
          { label: '英语', value: '英语' },
          { label: '日语', value: '日语' },
          { label: '韩语', value: '韩语' },
          { label: '法语', value: '法语' },
          { label: '德语', value: '德语' },
        ],
        defaultValue: '英语',
        required: true,
      },
    ],
    systemPrompt: () => '你是专业翻译，精通多种语言，翻译准确、自然、地道，保留原文的语气和风格。',
    userPrompt: (i) => `请将以下${i.from === 'auto' ? '' : i.from + ' '}内容翻译为${i.to}：\n\n${i.text}`,
  },
  {
    id: 'resume-optimizer',
    name: '简历优化',
    description: 'AI分析并优化你的简历，提升面试邀约率',
    icon: 'UserCheck',
    category: 'office',
    badge: '推荐',
    useCases: ['应届生求职简历', '跨行业转行求职', '管理层竞聘简历', '远程工作岗位申请'],
    fields: [
      { key: 'resume', label: '你的简历内容', type: 'textarea', placeholder: '粘贴你的简历内容...', rows: 8, required: true },
      { key: 'position', label: '目标职位', type: 'text', placeholder: '例如：高级前端工程师', required: true },
    ],
    systemPrompt: () => '你是资深HR和简历优化专家，了解各类岗位的招聘需求，擅长帮助求职者突出优势、优化简历表达。',
    userPrompt: (i) => `请分析以下简历，针对「${i.position}」岗位给出优化建议：\n\n${i.resume}\n\n请输出：\n1. 简历评分（满分100）\n2. 主要问题（3-5条）\n3. 优化后的关键段落\n4. 附加建议`,
  },
  {
    id: 'weekly-report',
    name: '周报生成器',
    description: '快速生成专业的工作周报',
    icon: 'CalendarCheck',
    category: 'office',
    useCases: ['互联网团队周报', '销售业绩周报', '项目进度汇报', '实习生工作周报'],
    fields: [
      { key: 'tasks', label: '本周完成的工作', type: 'textarea', placeholder: '列出本周完成的主要工作...', rows: 5, required: true },
      { key: 'plan', label: '下周计划（可选）', type: 'textarea', placeholder: '下周计划做的工作...', rows: 3 },
      { key: 'issue', label: '遇到的问题（可选）', type: 'textarea', placeholder: '工作中的困难和问题...', rows: 2 },
    ],
    systemPrompt: () => '你是职场沟通专家，擅长撰写条理清晰、重点突出的工作周报。',
    userPrompt: (i) => `请根据以下信息生成一份规范的工作周报：\n\n本周工作：${i.tasks}\n${i.plan ? `下周计划：${i.plan}\n` : ''}${i.issue ? `遇到问题：${i.issue}\n` : ''}\n\n格式要求：\n一、本周工作总结\n二、工作成果与亮点\n三、下周工作计划\n四、需要协调的事项（如有）`,
  },
  {
    id: 'business-plan',
    name: '商业计划书',
    description: 'AI辅助生成专业的商业计划书框架',
    icon: 'TrendingUp',
    category: 'office',
    useCases: ['融资路演计划书', '创业大赛参赛方案', '新项目立项报告', '年度经营规划'],
    fields: [
      { key: 'project', label: '项目名称', type: 'text', placeholder: '例如：社区生鲜电商平台', required: true },
      { key: 'description', label: '项目简介', type: 'textarea', placeholder: '简要描述项目内容、目标市场等', rows: 4, required: true },
      { key: 'budget', label: '预算范围（可选）', type: 'text', placeholder: '例如：50万' },
    ],
    systemPrompt: () => '你是商业咨询顾问，擅长撰写专业的商业计划书，熟悉市场分析、财务预测和风险评估。',
    userPrompt: (i) => `请为以下项目撰写一份商业计划书大纲及核心内容：\n项目：${i.project}\n简介：${i.description}\n${i.budget ? `预算：${i.budget}\n` : ''}\n\n请包含以下模块：\n1. 项目概述\n2. 市场分析\n3. 产品/服务介绍\n4. 商业模式\n5. 竞争分析\n6. 营销策略\n7. 财务规划\n8. 风险分析`,
  },
  {
    id: 'naming',
    name: 'AI 起名大师',
    description: '为品牌、产品、公司生成创意名称',
    icon: 'Sparkles',
    category: 'creative',
    useCases: ['新品牌命名', 'APP应用上架名称', '商标注册参考', '公众号/小程序命名'],
    fields: [
      { key: 'type', label: '起名类型', type: 'select', options: [
        { label: '品牌名', value: '品牌' },
        { label: '产品名', value: '产品' },
        { label: '公司名', value: '公司' },
        { label: 'APP名', value: 'APP' },
        { label: '公众号名', value: '公众号' },
      ], defaultValue: '品牌', required: true },
      { key: 'industry', label: '行业/领域', type: 'text', placeholder: '例如：餐饮、教育、科技', required: true },
      { key: 'keywords', label: '关键词/寓意（可选）', type: 'text', placeholder: '希望名称包含的元素或寓意' },
    ],
    systemPrompt: () => '你是品牌命名专家，擅长创造简洁、好记、有内涵的名称。考虑商标注册的可行性。',
    userPrompt: (i) => `请为${i.type}起名。\n行业：${i.industry}\n${i.keywords ? `寓意/关键词：${i.keywords}\n` : ''}\n请提供10个创意名称方案，每个附带：\n1. 名称\n2. 含义解读\n3. 适用理由\n名称要求：2-4个字，朗朗上口，便于传播。`,
  },
  {
    id: 'email-writer',
    name: '邮件助手',
    description: '快速撰写专业的商务/工作邮件',
    icon: 'Mail',
    category: 'office',
    useCases: ['商务合作洽谈', '求职应聘邮件', '客户跟进回访', '会议邀请通知'],
    fields: [
      { key: 'type', label: '邮件类型', type: 'select', options: [
        { label: '商务合作', value: '商务合作' },
        { label: '求职应聘', value: '求职应聘' },
        { label: '工作汇报', value: '工作汇报' },
        { label: '感谢信', value: '感谢信' },
        { label: '投诉建议', value: '投诉建议' },
        { label: '会议邀请', value: '会议邀请' },
      ], defaultValue: '商务合作', required: true },
      { key: 'recipient', label: '收件人', type: 'text', placeholder: '例如：王总 / 某公司HR' },
      { key: 'content', label: '邮件要点', type: 'textarea', placeholder: '邮件需要表达的主要内容...', rows: 4, required: true },
    ],
    systemPrompt: () => '你是商务沟通专家，擅长撰写得体、专业的邮件，语气恰当，逻辑清晰。',
    userPrompt: (i) => `请写一封${i.type}邮件。\n${i.recipient ? `收件人：${i.recipient}\n` : ''}内容要点：${i.content}\n\n要求：格式规范，有邮件主题和正文，语气专业得体。`,
  },
  {
    id: 'poetry',
    name: 'AI 诗词创作',
    description: '古风诗词、现代诗歌、藏头诗自动生成',
    icon: 'Feather',
    category: 'creative',
    useCases: ['生日祝福藏头诗', '婚礼贺词创作', '节日问候诗词', '个人抒情表达'],
    fields: [
      { key: 'type', label: '诗词类型', type: 'select', options: [
        { label: '七言绝句', value: '七言绝句' },
        { label: '五言绝句', value: '五言绝句' },
        { label: '七言律诗', value: '七言律诗' },
        { label: '现代诗', value: '现代诗' },
        { label: '藏头诗', value: '藏头诗' },
      ], defaultValue: '七言绝句', required: true },
      { key: 'theme', label: '主题/意境', type: 'text', placeholder: '例如：思乡、春景、离别', required: true },
      { key: 'hidden', label: '藏头字（藏头诗专用）', type: 'text', placeholder: '例如：生日快乐' },
    ],
    systemPrompt: () => '你是诗词创作大家，精通古典诗词格律和现代诗歌创作，作品意境深远、韵律和谐。',
    userPrompt: (i) => {
      if (i.type === '藏头诗' && i.hidden) {
        return `请以「${i.hidden}」为藏头，创作一首关于「${i.theme}」的藏头诗。每句诗的第一个字依次为：${i.hidden.split('').join('、')}。`
      }
      return `请以「${i.theme}」为主题，创作一首${i.type}。要求意境优美，符合格律（古体诗需押韵）。请提供诗作并简要赏析。`
    },
  },
  {
    id: 'product-desc',
    name: '电商详情文案',
    description: '生成高转化的电商产品详情页文案',
    icon: 'ShoppingBag',
    category: 'marketing',
    useCases: ['淘宝/京东详情页', '抖音带货文案', '社群团购推广', '跨境电商Listing'],
    fields: [
      { key: 'product', label: '产品名称', type: 'text', required: true },
      { key: 'features', label: '产品特点', type: 'textarea', placeholder: '列出产品的主要特点和卖点', rows: 4, required: true },
      { key: 'price', label: '价格区间', type: 'text', placeholder: '例如：99-199元' },
    ],
    systemPrompt: () => '你是电商文案专家，精通产品卖点提炼和消费者心理，擅长写出高转化的详情页文案。',
    userPrompt: (i) => `请为「${i.product}」撰写电商详情页文案。\n产品特点：${i.features}\n${i.price ? `价格：${i.price}\n` : ''}\n\n请输出：\n1. 主标题（吸引眼球）\n2. 副标题（卖点提炼）\n3. 五大核心卖点（带场景描述）\n4. 使用场景描述\n5. 促销引导语`,
  },
]

export function getToolById(id: string): Tool | undefined {
  return TOOLS.find((t) => t.id === id)
}

export function getToolsByCategory(category: string): Tool[] {
  return TOOLS.filter((t) => t.category === category)
}
