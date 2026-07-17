---
slug: "comprehensive-code-audit-and-verification"
createdAt: "2026-07-17T02:44:41.580Z"
---

# Proposal: comprehensive-code-audit-and-verification

## Summary

对 `luuux`（AI工具箱 SaaS，Next.js 16 + Prisma + Alipay + DeepSeek）进行**新一轮深度代码审查**，覆盖五大维度：**冗余、错误、遗漏、合法合规（PIPL）、安全**。审查后对发现的问题进行修复，补齐**端到端（E2E）验证**与现有单元/类型/lint/构建验证，最终**重新部署到生产（PM2）并推送到远端仓库**。

本变更不新增业务功能，而是以"质量、安全、合规、可验证"为目标，把前几轮（`204bee6`、`21fca8f`、`e9291c5` 等）未覆盖的盲区一次性收敛。

## Motivation

前几轮已做安全加固与合规重写，但本次探索性审查（已完成）发现仍存在**真实可被利用或导致合规违约**的问题：

1. **安全可利用**
   - `src/lib/rate-limit.ts` 的 `getClientIp` 取 `X-Forwarded-For` 的**最后一个**元素（惯例应为最左侧/可信跳数），且无条件信任 `x-real-ip`/`x-forwarded-for` 头，无可信代理白名单 → 攻击者可伪造 IP **绕过全部限流**（登录/注册/发码/AI/支付）。
   - `/api/auth/session` 用 `getSession()` 而非 `verifySession()` → 跳过 `tokenVersion` 数据库校验，已注销/改密的会话在 JWT 过期前仍被判为"已登录"。
   - `JWT_SECRET` 无最小长度/熵校验，弱密钥使 HS256 可被伪造。
   - `email.ts` 的 `sendEmail` 接受任意 HTML 且不消毒，任何把用户输入拼入正文的调用方即邮件客户端 XSS 入口。
2. **配置/逻辑错误**
   - Cookie `expires` 硬编码 7 天，而 JWT 内部用 `JWT_EXPIRES`（默认 `7d`）→ 覆盖 env 时两者错位。
   - `dal.getCurrentUser` 的每日配额重置只在返回对象里改、**不落库**，存在配额状态不一致。
   - `deepseek` 默认模型 `deepseek-v4-pro` 真实性存疑，可能运行时 404。
   - 多处 `catch {}` 静默吞错（支付查询、事务回滚），排障困难。
3. **冗余**
   - bcrypt（cost 12）在三处 auth 路由内重复，无共享 `password` 模块。
   - 除 `api/user` 外，所有路由手工校验输入，仅 1 处用 Zod；校验逻辑分散重复。
   - `docs/page.tsx` 硬编码价格表，需手动与 `config/pricing` 同步（漂移风险）。
4. **遗漏**
   - 隐私政策承诺但**无对应实现**：① 90 天自动清除 `ToolRecord`；② 用户可删除历史记录；③ 30 个工作日内注销账户。均为 PIPL 违约风险。
   - 全站无 `loading.tsx`；无结构化日志/错误监控；无 Prisma 迁移（仅 `db push`）；除 CSRF `SameSite=Lax` 外无额外 CSRF 防护。
5. **合规**
   - 注册接口返回"该邮箱已注册"造成**邮箱枚举**（其它接口已做防枚举）。
   - `send-code` 在 `NODE_ENV=development` 下回包 `devCode`，需确保生产环境变量正确。
   - `Order` 级联删除会销毁财务凭证（合规留存要求）。

## Scope

**审查范围（只读诊断 + 修复 + 验证）：**

| 维度 | 覆盖点 |
|------|--------|
| 冗余 | bcrypt 抽象、输入校验统一（Zod 共享 schema）、配置漂移（docs 价格表）、`resolveSecure` 双源逻辑 |
| 错误 | `getClientIp` XFF 方向与可信代理、Cookie/JWT TTL 单一真源、`/api/auth/session` tokenVersion、`usedToday` 持久化、DeepSeek 模型名校验、`parseFloat` NaN 守卫、静默 catch |
| 遗漏 | `ToolRecord` 90 天留存清理、历史记录删除端点、账户注销端点、`loading.tsx`、结构化日志、Prisma 迁移基线 |
| 合规 | PIPL 隐私政策↔实现对齐、邮箱枚举、`devCode` 生产兜底、`Order` 财务留存、CSP `unsafe-inline` 收敛 |
| 安全 | 限流可绕过、JWT 密钥熵、`alipay-sdk` 版本 CVE、邮件 HTML 注入、CSRF、`server-only` 边界、密钥/PII 处理 |

**验证范围：**
- 现有：`npm run lint`、`npx tsc --noEmit`、`npm test`（vitest）、`npm run build`。
- 新增：补充单元测试 + **E2E 测试**（关键流程：注册→登录→AI 运行→配额→登出会话失效；支付创建→查询→回调幂等；隐私删除/注销端点）。

**交付范围：**
- `scripts/deploy.sh` 构建 + `pm2 restart aitoolshelper` + 健康检查。
- `git add`/`commit`/`push` 到 `origin/main`（含 openspec 变更归档）。

## Non-Goals

- 不做业务功能扩展、不改 UI 设计语言、不重构为多实例/Redis 架构（仅**记录**为后续优化项，本变更保持单实例 PM2 假设）。
- 不更换技术栈（仍 Next.js 16 / Prisma / Alipay / DeepSeek）。
- 不引入重量级监控（Sentry 等）——本变更仅做结构化 `console` 与最小可观测性，外部 SaaS 留待后续。
- 不为历史数据做一次性回填清理脚本以外的数据迁移。
- 不调整定价/套餐业务规则。

## Risks

| 风险 | 说明 | 缓解 |
|------|------|------|
| 生产构建覆盖 `.next/` 导致在线服务 `Failed to find Server Action` | AGENTS.md 已警示 | 构建后**立即** `pm2 restart aitoolshelper`，并用 `deploy.sh` 回滚机制 + `/api/health` 探活 |
| 修复限流/IP 解析影响真实用户 | 改动 `getClientIp` 可能改变限流键 | 以配置驱动（可信代理跳数），保留 `unknown` 兜底，E2E 验证不误伤 |
| 新增删除/注销端点误删数据 | 涉及 PII/账户销毁 | 软删除优先 + 鉴权 + 所有权校验 + 二次确认；E2E 覆盖 |
| 数据库 schema 变更 | 加索引/枚举约束可能影响现有数据 | 用 `prisma migrate` 而非裸 `db push`；先备份（`cleanup.sh` 已含 pg_dump） |
| E2E 依赖外部服务（DeepSeek/SMTP/Alipay） | 真实调用不稳定 | 对外部依赖做 mock/契约测试，E2E 聚焦应用逻辑与边界 |
| 合规文案与实现再次漂移 | 文档/政策手改 | 删除端点上线后同步修订 `privacy/terms` 文案，单一真源取自代码常量 |
