# Spec: Correctness & Redundancy

专项：修复逻辑/配置错误，消除重复实现，收敛"单一真源"。

## Requirements

### 正确性（Errors）
- **E1 单一会话 TTL**：引入 `SESSION_MAX_AGE`（默认 `7d`，可由 env 覆盖）；Cookie `expires` 与 JWT `setExpirationTime` **同源**派生，禁止两处硬编码。
- **E2 配额持久化**：`dal.getCurrentUser` 的跨天 `usedToday` 重置必须落库（`update { usedToday:0, lastUseDate: now }`），或下放到 `api/ai/run` 的原子 `updateMany` 内统一处理；保证任何读路径拿到的 `usedToday` 与 DB 一致。
- **E3 DeepSeek 模型**：以 `DEEPSEEK_MODEL` env 为唯一来源；`.env.example`/代码默认值改为经验证存在的模型；运行时若调用返回 model-not-found，错误日志须明确指出是模型名问题。
- **E4 NaN 守卫**：`alipay.ts` 中 `parseFloat(amount)` 结果经 `Number.isFinite` 校验，非有限值按"金额异常"失败处理，不进入比对/履约。
- **E5 可观测的错误处理**：排查并改造所有静默 `catch {}`（至少 `payment/check` 的 `queryPayment`、`register/reset` 事务回滚分支），统一 `console.error` 结构化日志（含 route 名、关键 id、错误摘要），不再无痕吞错。

### 冗余（Redundancy）
- **D1 共享密码模块**：新增 `src/lib/password.ts`（`hashPassword`、`comparePassword`、`BCRYPT_COST=12` 常量）；`login/register/reset-password` 三处改调该模块。
- **D2 统一 Zod 校验**：新增 `src/lib/validation.ts`，导出各路由请求体 schema（login、register、reset-password、send-code、ai-run、ai-history、payment-create、payment-check、user-update、user-delete）；路由以 `schema.safeParse` 取代手工校验；保留 `utils.isEmail` 作为客户端预校验。
- **D3 价格单一真源**：`docs/page.tsx` 删除字面价格/额度，改 `import { PLANS, FREE_PLAN } from '@/config/pricing'` 渲染；`tools/[toolId]` SEO 文案中的"每日 5 次"等数字也由常量派生或加 TODO 锚点。
- **D4 `secure` 单一函数**：`createSession` 复用 `resolveSecure(ctx)`（或其派生），删除内联 `process.env.COOKIE_SECURE !== 'false'` 分支，确保两路径永不分歧。

### 遗漏（Omissions — 工程基础设施）
- **O1 `loading.tsx`**：为 `dashboard`、`tools/[toolId]` 增加 `loading.tsx` 骨架屏。
- **O2 Prisma 迁移基线**：生成 `prisma/migrations/` 初始迁移（`prisma migrate diff --from-empty --to-schema-datamodel ... --name init`），后续走 `prisma migrate`；C1/C4 的索引与关系变更作为新迁移纳入。
- **O3 结构化日志约定**：约定统一日志格式（JSON 行：`{level, route, userId?, msg, ts}`），新增最小 `src/lib/logger.ts`（封装 `console.error`/`console.warn`），关键路径替换裸 `console.error`。

## Behavior

- 修改 `SESSION_MAX_AGE`（或 `JWT_EXPIRES`）后，浏览器 cookie 过期时刻与 JWT 内 `exp` 一致。
- 跨天后首次 AI 调用读到的 `usedToday` 恢复为 0，且 DB 中该值确为 0。
- 任何被捕获的异常在 `pm2-logs/error.log` 中可查到对应 route 与摘要。
- 三处 auth 路由不再各自出现 `bcrypt.hash/compare` 字面调用。

## Acceptance Criteria

- 单测：`SESSION_MAX_AGE='1d'` 时 cookie `expires` 与 JWT `exp` 折算后差值 < 1s。
- 单测：`getCurrentUser` 跨天后 DB 中 `usedToday===0 && lastUseDate>=今日0点`。
- 单测：`parseFloat('NaN-ish')` 在金额比对中触发"金额异常"分支。
- `rg -n "bcrypt" src/app/api/auth` → 0 命中；`rg -n "hashPassword|comparePassword" src/app/api/auth` → ≥3 命中。
- `rg "z\.object" src/app/api` 覆盖全部非 GET 写入路由。
- `rg "¥19\.9|¥59|¥168" src/app/docs/page.tsx` → 0 命中。
- `prisma/migrations/` 存在且 `npx prisma migrate status` 报告无漂移（针对开发库）。
