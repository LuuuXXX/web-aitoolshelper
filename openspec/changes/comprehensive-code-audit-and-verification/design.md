# Design: comprehensive-code-audit-and-verification

## Overview

本变更是一次"审查驱动"的质量工程：先对 `luuux` 做多维度深度审查（冗余/错误/遗漏/合规/安全），再以**最小侵入、保持单实例 PM2 假设、不换技术栈**为原则落地修复，并补齐 E2E 验证与安全部署推送。

设计核心是三件事：
1. **收敛"单一真源"** —— 把散落的校验、密码、会话 TTL、价格、日志统一下沉到 `src/lib/`，消除分歧与漂移。
2. **补齐合规闭环** —— 把隐私政策里承诺但代码没实现的能力（留存清理、历史删除、账户注销、财务留存）真正落地。
3. **可验证 + 安全发布** —— 用 vitest 做 API 层 E2E（不引重依赖），用既有 `deploy.sh` 做带回滚的部署，遵守 AGENTS.md 的 PM2 重启约束。

## Goals

- 修复全部 spec 中列出的可利用安全面与 PIPL 合规缺口。
- 消除三类重复（bcrypt、手工校验、价格/secure 双源）。
- 建立可重复执行的 `lint + typecheck + unit + e2e + build` 验证链。
- 零长时间中断地部署到生产并推送到 `origin/main`。

## Constraints

- **运行环境**：单实例 PM2（`ecosystem.config.js` `instances:1`）；限流仍用进程内 Map，不引入 Redis（记录为后续多实例改造项）。
- **Next.js 16 约定**：`params`/`cookies`/`searchParams` 为 Promise 必须 `await`；`proxy.ts`（非 `middleware.ts`）是边缘入口；改代码前参阅 `node_modules/next/dist/docs/`。
- **数据库**：PostgreSQL（Aliyun RDS）；schema 变更走 `prisma migrate`（本次建立迁移基线）。
- **测试**：测试在 `tests/`，被 tsconfig/Next 构建排除；`tests/__mocks__/` stub `server-only`/`next/headers`；vitest alias `@→src`。
- **部署铁律**：`npm run build` 会覆盖在线 `.next/`，构建后必须 `pm2 restart aitoolshelper`。
- **外部依赖**：DeepSeek/SMTP/Alipay 在测试中以 mock 隔离，E2E 不打真实第三方。
- **不破坏现有契约**：API 路径/响应结构尽量保持；新增端点为纯增量。

## Technical Approach

### 1. 新增共享 lib（下沉单一真源）
- `src/lib/password.ts` — `BCRYPT_COST=12`、`hashPassword(plain)`、`comparePassword(plain, hash)`。三处 auth 路由改调。
- `src/lib/validation.ts` — Zod schema 集合 + `parseBody(schema, req)` 辅助（失败返回标准 400）。复用 `utils.isEmail` 做客户端预校验。
- `src/lib/logger.ts` — `logError(route, ctx, err)` / `logWarn(...)`，输出 JSON 行，替换裸 `console.error` 与静默 `catch`。
- `src/lib/session.ts` 改造 —— `SESSION_MAX_AGE` 常量（env `SESSION_MAX_AGE`/`JWT_EXPIRES` 单一来源），cookie `expires` 与 JWT `exp` 同源；`createSession` 复用 `resolveSecure`；加载期断言 `JWT_SECRET.length>=32`。
- `src/lib/rate-limit.ts` 改造 —— `getClientIp` 按可信跳数取左侧 IP；新增 `TRUSTED_PROXY_HOPS` env（默认 1）。
- `src/lib/email.ts` 改造 —— 新增 `escapeHtml`，`sendEmail` 正文片段统一转义。
- `src/lib/alipay.ts` 改造 —— 金额 `Number.isFinite` 守卫；`readKey` 失败显式告警/降级。
- `src/lib/deepseek.ts` 改造 —— `DEEPSEEK_MODEL` 为唯一来源；model-not-found 错误信息明确。

### 2. 路由层改造
- 所有写入路由：`parseBody(zodSchema)` 替代手工校验；新增 `Origin`/`Sec-Fetch-Site` CSRF 校验（`payment/notify` 豁免并注释）。
- `/api/auth/session` → `verifySession()`。
- `/api/auth/register` → 邮箱枚举收敛（统一失败响应）。
- 新增 `DELETE /api/ai/history/[id]`（所有权 404）。
- 新增 `POST /api/user/delete`（脱敏 + 吊销会话 + 保留订单）。

### 3. 数据层与留存
- schema 变更（走迁移）：
  - `Order.user` 关系 `onDelete: Cascade` → `NoAction`（财务留存）。
  - `ToolRecord.createdAt` 索引（若复合索引不足）。
  - `User` 注销脱敏字段复用现有 `email?/phone?/name?`（置空 + 标记），无需新列；如需"已注销"标记可加 `deletedAt DateTime?`。
- `scripts/purge-records.mjs`（node + pg Pool，读 `.env`）删 90 天前 `tool_records`；接入 `scripts/cleanup.sh`。

### 4. 前端与文档
- `docs/page.tsx` 价格改 `@/config/pricing` 派生；`tools/[toolId]` 文案数字加常量锚点。
- `dashboard/loading.tsx`、`tools/[toolId]/loading.tsx` 骨架屏。
- `privacy/page.tsx`、`terms/page.tsx` 文案随删除/注销/留存端点同步（数字引用常量或加 TODO 锚点）。
- `next.config.ts` CSP：评估去 `unsafe-inline`，否则注释已知妥协。

### 5. 验证策略
- **单元**（vitest，`tests/*.test.ts`）：纯函数与可注入模块（`getClientIp`、`resolveSecure`/`SESSION_MAX_AGE`、`escapeHtml`、`parseBody`、`JWT_SECRET` 断言、`getCurrentUser` 配额——用 prisma mock）。
- **E2E（API 层）**（vitest）：直接调用 Next route handler 函数（`POST(request)`），用测试 DB schema（`prisma migrate deploy` 到独立 schema 或事务回滚），mock `deepseek/email/alipay` 模块（vitest `vi.mock`）。覆盖 spec `e2e-verification.md` V2.2 全部场景。
- 选 API 层而非浏览器层：避免引入 Playwright/浏览器依赖，契合现有 vitest 栈与无 GUI 服务器环境；浏览器 E2E 记为后续项。

### 6. 部署与推送
- 顺序：本地 `lint+typecheck+test+build` 全绿 → `scripts/deploy.sh`（含 build + restart + health 探活 + 回滚）→ 验证 PM2/health → `git add/commit/push origin main`。
- 提交粒度：按"lib 下沉 / 路由合规 / 留存与端点 / 测试 / openspec"分多个提交，沿用仓库中文 `fix:`/`feat:` 风格。

## Alternatives Considered

| 方案 | 取舍 | 决定 |
|------|------|------|
| Redis 化限流 | 真正解决多实例/重启清零 | **否**（超范围；保留单实例假设，记录后续项） |
| 浏览器层 E2E（Playwright） | 覆盖真实 UI 交互 | **否**（重依赖、无 GUI 环境）；用 API 层 E2E 覆盖逻辑边界，浏览器层记后续 |
| 物理删除账户 + 级联删订单 | 实现简单 | **否**（违反财务留存/合规）；改脱敏 + `NoAction` |
| 一次性数据回填清理脚本 vs cron | — | 采用 cron（`cleanup.sh` 接 `purge-records.mjs`），另可手动执行 |
| 全量 Zod vs 仅新增路由 | 一致性 | **全量**（顺带收敛冗余 D2） |
| nonce CSP vs 保留 unsafe-inline | 更强 XSS 防护 | 优先尝试 nonce；若 Next 16 运行时不支持则保留并注释妥协 |

## Impacted Files / Modules

**新增**
- `src/lib/password.ts`、`src/lib/validation.ts`、`src/lib/logger.ts`
- `src/app/api/ai/history/[id]/route.ts`（DELETE）
- `src/app/api/user/delete/route.ts`（POST，或并入 `api/user/route.ts`）
- `src/app/dashboard/loading.tsx`、`src/app/tools/[toolId]/loading.tsx`
- `scripts/purge-records.mjs`
- `prisma/migrations/<ts>_init/`（基线）+ 关系/索引迁移
- `tests/*.test.ts`（单元 + E2E）

**修改**
- `src/lib/session.ts`、`rate-limit.ts`、`email.ts`、`alipay.ts`、`deepseek.ts`、`dal.ts`
- `src/app/api/auth/{login,register,reset-password,send-code,session}/route.ts`
- `src/app/api/{ai/run,user,payment/*}/**`
- `src/app/docs/page.tsx`、`privacy/page.tsx`、`terms/page.tsx`
- `prisma/schema.prisma`、`scripts/cleanup.sh`、`next.config.ts`、`.env.example`
- `package.json`（锁定 alipay-sdk 等依赖版本）

## Risks and Mitigations

| 风险 | 缓解 |
|------|------|
| schema 迁移与现有数据冲突（`NoAction` 改动） | 迁移前 `pg_dump` 备份；先在开发库 `migrate dev` 验证；`deploy.sh` 失败回滚 |
| 注销/删除端点误删数据 | 软删除 + 所有权校验 + `confirm` 二次确认 + E2E 负路径覆盖 |
| CSRF `Origin` 校验误伤合法客户端 | 仅校验同源/`Sec-Fetch-Site`；`payment/notify` 豁免；E2E 含正路径 |
| `getClientIp` 改动影响真实用户限流 | `TRUSTED_PROXY_HOPS` 可配置；`unknown` 兜底；E2E 验证不误伤 |
| build 覆盖在线 `.next/` | `deploy.sh` 备份 + 失败回滚 + 强制 `pm2 restart` + health 探活 |
| Zod 全量替换引入回归 | 增 schema 单测（合法/非法输入）；保留原手工校验语义 |
| E2E 测试 DB 隔离不彻底污染数据 | 独立 schema 或每用例事务回滚；外部依赖全 mock |
