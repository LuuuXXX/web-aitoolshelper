# Spec: comprehensive-code-audit-and-verification

本文件为本轮深度审查的**主规约**，定义跨维度的总体需求与验收标准。各专项细则拆分至同目录子规约：

- `security-hardening.md` — 安全加固（限流绕过、JWT、邮件注入、CSRF、依赖 CVE）
- `compliance-pipl.md` — 合规（PIPL 隐私政策↔实现对齐、邮箱枚举、财务留存）
- `correctness-redundancy.md` — 正确性 Bug 与冗余收敛
- `e2e-verification.md` — 端到端与全量验证、部署推送

## Requirements

### R1 冗余收敛（Redundancy）
- **R1.1** 抽取共享 `src/lib/password.ts`（`hashPassword` / `comparePassword`，cost=12 常量），消除 `login/register/reset-password` 三处 bcrypt 重复。
- **R1.2** 新建 `src/lib/validation.ts`，用 Zod 定义全部 API 请求体 schema（auth、ai、payment、user），路由统一改用 Zod 校验，废弃分散的手工校验。
- **R1.3** 消除 `docs/page.tsx` 价格硬编码：价格/额度一律从 `@/config/pricing` 派生，禁止副本。
- **R1.4** 统一 `resolveSecure` 与 `createSession` 的 `secure` 判定逻辑为**单一函数**，消除双源分歧。

### R2 正确性（Errors）
- **R2.1** 修复 `getClientIp`：`X-Forwarded-For` 取**最左侧客户端 IP**（或按可配置可信跳数），新增 `TRUSTED_PROXY_HOPS` env；保留 `unknown` 兜底。
- **R2.2** Cookie `expires` 与 JWT `JWT_EXPIRES` 收敛为**单一时间常量**（`SESSION_MAX_AGE`），二者必须一致。
- **R2.3** `/api/auth/session` 改用 `verifySession()`（含 `tokenVersion` 校验），与其它受保护路由一致。
- **R2.4** `dal.getCurrentUser` 每日配额重置必须**持久化**到 DB（`usedToday=0, lastUseDate=today`），或由 `api/ai/run` 在原子扣减时统一处理，保证无不一致读。
- **R2.5** 校正 DeepSeek 默认模型：以 `DEEPSEEK_MODEL` env 为准，`.env.example` 与代码默认值改为已验证存在的模型；缺失时给出明确启动错误。
- **R2.6** `alipay.ts` 金额解析增加 `Number.isFinite`/NaN 守卫。
- **R2.7** 消除静默 `catch {}`：所有被吞错的分支必须至少 `console.error` 结构化日志（含上下文），不得完全无痕。

### R3 遗漏补齐（Omissions）
- **R3.1** 实现 `ToolRecord` 90 天留存清理：新增 `scripts/purge-records.mjs`（由 `cleanup.sh` 每日调用）删除 `createdAt < now-90d` 的记录，并在 DB 层加 `createdAt` 索引以避免全表扫描。
- **R3.2** 新增 `DELETE /api/ai/history/:id`（鉴权 + 所有权校验 + 404），允许用户删除单条历史。
- **R3.3** 新增 `POST /api/user/delete`（账户注销，软删除/二次确认，吊销会话），满足隐私政策"30 个工作日"承诺。
- **R3.4** 为关键路由段添加 `loading.tsx`（dashboard、tools/[toolId]）。
- **R3.5** 建立 Prisma 迁移基线：把现有 schema 落成 `prisma/migrations/` 初始迁移，后续 schema 变更走 `migrate`。

### R4 合规（Compliance / PIPL）
- **R4.1** 注册接口消除邮箱枚举：邮箱已注册与其它失败返回**同一**通用消息/状态，仅在完成验证码校验后揭示。
- **R4.2** 确保 `send-code` 的 `devCode` 仅在 `NODE_ENV==='development'` 泄漏；生产构建/启动断言 `NODE_ENV=production`（启动时校验，不符则告警）。
- **R4.3** `Order` 不再随 `User` 级联物理删除：改为 `onDelete: NoAction`/保留 + 注销时脱敏（`email`/`phone` 置空标记），满足财务凭证留存。
- **R4.4** 隐私政策/服务条款文案随删除/注销/留存端点落地**同步修订**，且关键数字（90 天/30 工作日）引用代码常量，杜绝漂移。

### R5 安全加固（Security）
- **R5.1** `JWT_SECRET` 启动校验：长度 < 32 字节则启动失败并打印明确错误。
- **R5.2** `alipay-sdk` 版本核对：若存在已知签名校验 CVE，升级到已修复版本并在 `package.json` 锁定。
- **R5.3** `email.ts`：`sendEmail` 正文统一经 HTML 转义/白名单消毒；禁止把未转义用户输入拼入 HTML；为调用方提供 `escapeHtml` 工具。
- **R5.4** 收敛 CSP：评估移除 `script-src 'unsafe-inline'`（或改为 nonce）；如确需保留，记录为已知妥协并在本变更说明。
- **R5.5** 所有状态变更型 API 增加最小 CSRF 防护：校验 `Origin`/`Sec-Fetch-Site`（与现有 `SameSite=Lax` 叠加）。

### R6 验证（Verification）
- **R6.1** `npm run lint`、`npx tsc --noEmit`、`npm test`、`npm run build` 全部通过。
- **R6.2** 新增/补齐单元测试覆盖 R2.x 修复点（`getClientIp`、session TTL、`/api/auth/session`、配额持久化、NaN 守卫）。
- **R6.3** 新增 **E2E 测试**覆盖关键流程（见 `e2e-verification.md`）。
- **R6.4** 部署：`scripts/deploy.sh` 完成 + `/api/health` 探活通过 + `pm2 restart aitoolshelper`。

## Behavior

- **会话生命周期**：登出/改密/重置后，`tokenVersion` 变更使**所有**受保护端点（含 `/api/auth/session`）立即判为未登录，cookie 清除。
- **限流键**：相同真实客户端 IP 在窗口内累计计数；伪造 XFF 头不再改变限流键（受可信跳数保护）。
- **配额**：跨天首调用原子重置 `usedToday` 并持久化；AI 失败回退已保证；多读路径读到一致的 `usedToday`。
- **隐私删除**：用户可自助删除单条历史；注销账户后个人字段脱敏、会话吊销、订单凭证留存。
- **留存**：每日 03:00 清理 90 天前 `ToolRecord`；清理任务失败时经 `alert.mjs` 告警。
- **错误可观测**：任何被捕获的异常至少产出结构化 `console.error`（含 route、userId、摘要），不再静默。

## Acceptance Criteria

1. **AC-Redundancy**：`rg "bcrypt"` 在 `src/app/api/auth` 下 0 命中（全部走 `@/lib/password`）；`rg "z\.object"` 命中所有 `api/**/route.ts`；`docs/page.tsx` 内无字面价格（`¥`/`19.9` 等）。
2. **AC-Correctness**：新增单测断言：XFF=`"1.1.1.1, 8.8.8.8"` → `getClientIp` 返回 `1.1.1.1`（受跳数配置）；`SESSION_MAX_AGE` 改动后 cookie 与 JWT 过期时间一致；`/api/auth/session` 在 `tokenVersion` 不匹配时返回 `authenticated:false`。
3. **AC-Omission**：`DELETE /api/ai/history/:id` 删他人记录返回 404；`POST /api/user/delete` 后该用户会话失效、`email/phone` 为空、`orders` 仍可查；`scripts/cleanup.sh` 调用清理脚本且 `tool_records` 表存在 `createdAt` 索引。
4. **AC-Compliance**：注册一个已存在邮箱，响应与注册不存在邮箱**不可区分**（同状态码+同消息）；生产 `NODE_ENV` 校验生效。
5. **AC-Security**：设 `JWT_SECRET` 为 8 字符启动 → 进程退出并报错；`sendEmail` 注入 `<script>` 的输入被转义；状态变更 API 缺失/伪造 `Origin` 返回 403。
6. **AC-Verify**：`npm run lint && npx tsc --noEmit && npm test && npm run build` 退出码 0；E2E 套件全绿；`deploy.sh` 后 `curl /api/health` 返回 200。
7. **AC-Deploy**：`git push origin main` 成功；PM2 状态 `online`；`pm2-logs` 无 fatal。
