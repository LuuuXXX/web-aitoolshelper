# AI工具箱

开箱即用的 AI 应用服务平台，集合 12+ 款 AI 工具，涵盖智能写作、营销文案、办公效率、创意工具等场景。

## 技术栈

- **前端**：Next.js 16 + React 19 + Tailwind CSS v4
- **后端**：Next.js API Routes（全栈一体）
- **数据库**：PostgreSQL（阿里云 RDS）
- **AI**：DeepSeek API
- **支付**：支付宝电脑网站支付
- **部署**：PM2 + Nginx

## 功能

- 用户注册/登录（邮箱验证码 + 密码）
- 12+ AI 工具（文章写作、小红书文案、简历优化等）
- 支付宝订阅支付（月/季/年三档）
- 使用历史记录
- 每日免费额度 + 付费套餐
- 响应式设计，支持深色模式

## 快速开始

```bash
# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env，至少配置 DATABASE_URL、JWT_SECRET、DEEPSEEK_API_KEY

# 生成 Prisma Client 并初始化数据库
npx prisma generate
npx prisma db push

# 启动开发服务器
npm run dev
```

访问 http://localhost:3000

## 项目结构

```
src/
├── app/              # Next.js App Router 页面和 API
│   ├── api/          # API 路由
│   ├── dashboard/    # 用户控制台
│   ├── login/        # 登录页
│   ├── register/     # 注册页
│   ├── pricing/      # 定价页
│   └── docs/         # 使用文档
├── components/       # React 组件
├── config/           # 配置（工具定义、定价方案）
├── generated/        # Prisma 生成的客户端代码
└── lib/              # 工具库（数据库、认证、AI、支付等）
```

## 定价

| 套餐 | 价格 | 每日额度 |
|---|---|---|
| 免费体验 | ¥0 | 5 次/天 |
| 月度会员 | ¥19.9 | 50 次/天 |
| 季度会员 | ¥59 | 50 次/天 |
| 年度会员 | ¥168 | 80 次/天 |

## 文档

- [部署与配置指南](docs/SETUP.md)
- [使用文档](https://aitoolshelper.cn/docs)

## 备案

湘ICP备2026026989号-1
