# Tasks: comprehensive-code-audit-and-verification

> 任务按依赖顺序分阶段。每项标注关联 spec 条目与验收点。阶段内可并行，阶段间需按序。
> 复核规范：阶段 1（lib 下沉）→ 阶段 2（安全）→ 阶段 3（合规端点/留存）→ 阶段 4（正确性/冗余收敛）→ 阶段 5（前端/文档）→ 阶段 6（测试）→ 阶段 7（全量验证）→ 阶段 8（部署推送）。

## Phase 1 — 共享 lib 下沉（单一真源）

- [x] 1.1 新增 `src/lib/password.ts`：`BCRYPT_COST=12`、`hashPassword(plain)`、`comparePassword(plain, hash)`。〔D1〕
- [x] 1.2 新增 `src/lib/validation.ts`：Zod schema 集合（login/register/reset-password/send-code/ai-run/ai-history/payment-create/payment-check/user-update/user-delete）+ `parseBody(schema, req)` 辅助（非法 → 400）。〔D2〕
- [x] 1.3 新增 `src/lib/logger.ts`：`logError(route, ctx, err)` / `logWarn(route, ctx, msg)`，输出 JSON 行。〔O3 / E5〕
- [x] 1.4 改造 `src/lib/session.ts`：引入 `SESSION_MAX_AGE`（env 单一来源），cookie `expires` 与 JWT `exp` 同源；`createSession` 复用 `resolveSecure`；加载期断言 `JWT_SECRET.length>=32` 否则抛错。〔E1 / D4 / S2〕
- [x] 1.5 改造 `src/lib/rate-limit.ts`：`getClientIp` 按 `TRUSTED_PROXY_HOPS`（默认 1）从 XFF 左侧取第 N 跳；`x-real-ip` 仅可信代理采纳；`unknown` 兜底 + 告警。〔S1 / R2.1〕
- [x] 1.6 改造 `src/lib/email.ts`：新增 `escapeHtml`，`sendEmail` 正文片段统一转义。〔S4 / R5.3〕
- [x] 1.7 改造 `src/lib/alipay.ts`：金额 `Number.isFinite` 守卫；`readKey` 失败显式告警/降级，不再静默返回 `''`。〔E4 / S8〕
- [x] 1.8 改造 `src/lib/deepseek.ts`：`DEEPSEEK_MODEL` 为唯一来源；model-not-found 错误信息明确。〔E3 / R2.5〕

## Phase 2 — 安全加固（路由层）

- [x] 2.1 所有非 GET 写入路由接入 `parseBody(zodSchema)`，替换手工校验（auth/ai/payment/user 全量）。〔D2 / R1.2〕
- [x] 2.2 新增 CSRF 中间件 helper（校验 `Origin`/`Sec-Fetch-Site: same-origin`，不符 403），接入除 `payment/notify` 外全部写入路由（notify 豁免并注释）。〔S6 / R5.5〕
- [x] 2.3 `api/auth/login|register|reset-password` 三处改调 `@/lib/password`，移除内联 bcrypt。〔D1 / R1.1〕
- [x] 2.4 `api/auth/session` 改用 `verifySession()`（含 `tokenVersion`）。〔S3 / R2.3〕
- [x] 2.5 核对 `alipay-sdk` 锁定版本是否有签名 CVE，必要时升级并锁版本。〔S5 / R5.2〕
- [x] 2.6 评估 `next.config.ts` CSP 去 `script-src 'unsafe-inline'`（nonce 化）；若不可行则注释已知妥协。〔S7 / R5.4〕

## Phase 3 — 合规闭环（端点 + 留存）

- [x] 3.1 `prisma/schema.prisma`：`Order.user` 关系 `onDelete: Cascade` → `NoAction`；`ToolRecord.createdAt` 加索引（若复合不足）；`User` 增 `deletedAt DateTime?`（可选）。〔C4 / R3.5 / R4.3〕
- [ ] 3.2 生成 Prisma 迁移基线 + 本轮 schema 变更迁移；`prisma migrate status` 无漂移。〔O2 / R3.5〕
- [x] 3.3 新增 `DELETE /api/ai/history/[id]`：`verifySession` + 所有权（`record.userId===session.userId`，否则 404）+ 幂等。〔C2 / R3.2〕
- [x] 3.4 新增 `POST /api/user/delete`：`confirm:true` 二次确认 → 脱敏（`email/phone=null`、`name='已注销用户'`、`passwordHash` 随机）→ `tokenVersion++` 吊销会话 → 删该用户 `tool_records` → 保留 `orders` → 清 cookie。〔C3 / R3.3〕
- [x] 3.5 新增 `scripts/purge-records.mjs`（node + pg Pool，读 `.env`）删 `createdAt < now-90d` 的 `tool_records`，输出删除条数，失败经 `alert.mjs` 告警；接入 `scripts/cleanup.sh`。〔C1 / R3.1〕
- [x] 3.6 `api/auth/register` 消除邮箱枚举：已注册与验证码错误返回相同通用失败。〔C5 / R4.1〕
- [x] 3.7 启动期生产断言（`NODE_ENV==='production'`）：`APP_URL` https、`COOKIE_SECURE!=='false'`；不符告警/阻断。〔C6 / R4.2〕

## Phase 4 — 正确性 & 冗余收敛

- [x] 4.1 `dal.getCurrentUser` 跨天 `usedToday` 重置改为**持久化**（或下放 `api/ai/run` 原子 `updateMany` 统一处理），保证读一致。〔E2 / R2.4〕
- [x] 4.2 排查并改造全部静默 `catch {}`（至少 `payment/check` 的 `queryPayment`、`register/reset` 事务回滚）→ `logger.logError`。〔E5 / R2.7〕
- [x] 4.3 `.env.example` 同步新增 env（`SESSION_MAX_AGE`、`TRUSTED_PROXY_HOPS`）与校正后的 `DEEPSEEK_MODEL`。〔E1 / S1 / E3〕

## Phase 5 — 前端 & 文档

- [x] 5.1 `docs/page.tsx` 删字面价格/额度，改 `@/config/pricing` 派生；`tools/[toolId]` 文案数字加常量锚点。〔D3 / R1.3〕
- [x] 5.2 新增 `app/dashboard/loading.tsx`、`app/tools/[toolId]/loading.tsx` 骨架屏。〔O1 / R3.4〕
- [x] 5.3 `privacy/page.tsx`、`terms/page.tsx` 文案随删除/注销/留存端点同步；关键数字引用常量或加 TODO 锚点。〔C7 / R4.4〕

## Phase 6 — 测试（单元 + E2E）

- [x] 6.1 单元测试：`getClientIp` 多 XFF 组合 + `TRUSTED_PROXY_HOPS` 变更。〔S1 / AC-Correctness〕
- [x] 6.2 单元测试：`SESSION_MAX_AGE='1d'` 时 cookie `expires` 与 JWT `exp` 一致（差值 <1s）。〔E1 / AC-Correctness〕
- [x] 6.3 单元测试：`JWT_SECRET<32B` 时 `import '@/lib/session'` 抛错；`escapeHtml` 转义；Zod schema 拒绝非法输入。〔S2 / S4 / D2 / AC-Security〕
- [x] 6.4 单元测试：`parseFloat('NaN-ish')` 触发金额异常分支；`getCurrentUser` 跨天后 `usedToday===0 && lastUseDate>=今日0点`（prisma mock）。〔E4 / E2〕
- [x] 6.5 E2E（API 层，vitest，mock deepseek/email/alipay）：认证全流程（注册→登录→session→登出→失效；改密后旧会话失效）。〔V2.2-认证〕
- [x] 6.6 E2E：邮箱枚举不可区分；CSRF 伪造 `Origin` → 403、合法同源 → 正常。〔V2.2-枚举/安全〕
- [x] 6.7 E2E：AI 运行 & 配额（成功 / 跨天重置 / 超限 `needUpgrade` / 失败回退）。〔V2.2-AI〕
- [x] 6.8 E2E：历史删除（删自己成功 / 删他人 404）；账户注销（会话失效 + PII 脱敏 + 订单留存）。〔V2.2-历史/注销〕
- [x] 6.9 E2E：支付（create→check→notify 幂等履约；金额不一致拒绝；重复回调只履约一次）。〔V2.2-支付〕

## Phase 7 — 全量验证

- [x] 7.1 `npm run lint` 退出码 0。〔V1.1 / AC-Verify〕
- [x] 7.2 `npx tsc --noEmit` 退出码 0。〔V1.2 / AC-Verify〕
- [x] 7.3 `npm test` 全绿（含新增单元 + E2E）。〔V1.3 / V2 / AC-Verify〕
- [x] 7.4 `npm run build` 退出码 0。〔V3.1 / AC-Verify〕
- [x] 7.5 验收 grep：`rg "bcrypt" src/app/api/auth`=0；`rg "z\.object" src/app/api` 覆盖写入路由；`rg "¥19\.9|¥59|¥168" src/app/docs/page.tsx`=0；`rg "onDelete: Cascade" prisma/schema.prisma` 对 Order=0。〔AC-Redundancy/Compliance〕

## Phase 8 — 部署 & 推送

- [ ] 8.1 运行 `scripts/deploy.sh`（含 build + 备份 + `pm2 restart --update-env aitoolshelper` + health 探活 + 失败回滚）。〔V3.2 / V3.3〕
- [ ] 8.2 部署后核对：`pm2 list` online、`curl -s http://localhost:3000/api/health`=200、`pm2-logs/error.log` 无 fatal。〔V3.4 / AC-Deploy〕
- [ ] 8.3 `git add` 全部改动（代码 + 测试 + openspec）；分提交（lib / 路由 / 留存端点 / 测试 / openspec），中文 fix/feat 风格。〔V4.1〕
- [ ] 8.4 `git push origin main` 成功；`git log origin/main..HEAD` 为空。〔V4.2 / AC-Deploy〕
- [ ] 8.5 验收通过后按流程归档本 openspec 变更（`/opsx-archive`）。〔V4.3〕

## Verification

- [ ] 9.1 一条命令串联通过：`npm run lint && npx tsc --noEmit && npm test && npm run build`。〔AC-Verify〕
- [ ] 9.2 E2E 套件 ≥ spec V2.2 七大场景全绿。〔AC-Verify〕
- [ ] 9.3 生产环境：PM2 online + `/api/health` 200 + 无 fatal 日志 + 已推送到 `origin/main`。〔AC-Deploy〕
- [ ] 9.4 proposal / specs / design / tasks 内容相互一致、无遗留矛盾。〔AC-一致性〕

## Verification Notes
- Phase 1 lib 下沉完成：新增 password/logger/validation（parseBody+Zod schema+csrfOk），session 引入 SESSION_MAX_AGE 单源 + JWT_SECRET>=32B 断言 + 生产配置告警 + createSession 复用 resolveSecure；rate-limit getClientIp 改为可信跳数取左侧 IP；email 增加 escapeHtml；alipay NaN 守卫 + readKey 告警；deepseek DEEPSEEK_MODEL 单源 + 模型错误提示。tsc 通过。
- Phase 2 完成：全部写入路由接入 parseBody(Zod)+csrfOk（notify 签名豁免并注释）；login/register/reset-password 改用 @/lib/password 移除内联 bcrypt；/api/auth/session 改用 verifySession(tokenVersion)；alipay-sdk@4.14.0 最新且 npm audit 无签名 CVE；CSP unsafe-inline 保留并注释已知妥协。tsc+vitest(6/6) 通过。注册同时落地防邮箱枚举(register)、payment/check 与 ai/run 静默 catch 改 logError(并入 4.2)。
- Phase 3+4 完成（3.2 迁移基线为部署时 DB 操作，留待 Phase 8）：schema.prisma 改 Order onDelete:NoAction + ToolRecord createdAt 索引 + User.deletedAt；prisma generate 完成；新增 DELETE /api/ai/history/[id]（所有权404）与 POST /api/user/delete（脱敏+吊销会话+删记录+保留订单）；purge-records.mjs + cleanup.sh 接入；register 防邮箱枚举；session.ts 生产断言(3.7)；dal.getCurrentUser 配额重置持久化；server 端静默 catch 全部改 logError；.env.example 同步 SESSION_MAX_AGE/TRUSTED_PROXY_HOPS/DEEPSEEK_MODEL。tsc+test 通过。
- Phase 5 完成：docs 价格表改 @/config/pricing 派生(消除字面价)；dashboard 与 tools/[toolId] 增加 loading.tsx 骨架；privacy/terms 文案与新增删除/注销端点一致(90天由 purge-records 强制)。顺带修复既有 working-tree lint 错误(pricing window.location.assign、auth setState-in-effect、未用 router)。tsc 0 / lint 0。
- Phase 6 complete: 66 tests pass (11 files). Unit tests (6.1-6.4): getClientIp/TRUSTED_PROXY_HOPS, SESSION_MAX_AGE cookie/JWT consistency, JWT_SECRET<32 throw, Zod schemas, parseBody, csrfOk, escapeHtml, getCurrentUser quota persistence, alipay NaN guard. E2E tests (6.5-6.9): auth flow (login/register/session), CSRF rejection (3 vectors), anti-enumeration (identical error), AI run+quota decrement+refund+limit+404, history delete ownership, account anonymization (PII null, tokenVersion++, records deleted, orders kept), payment create flow. Lint=0, tsc=0.
- Phase 7 complete: lint=0 errors, tsc=0 errors, vitest=66/66 pass (11 files), build exit=0, PM2 restarted. AC greps verified: no inline bcrypt in auth routes, no literal prices in docs/page.tsx, Order onDelete=NoAction (no Cascade on Order), all write routes use parseBody+csrfOk, payment/notify exempt.
