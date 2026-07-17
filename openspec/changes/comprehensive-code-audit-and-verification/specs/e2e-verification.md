# Spec: E2E & Full Verification + Deploy

专项：为本轮修复提供可重复执行的验证矩阵，并安全部署推送。

## Requirements

### V1 静态与单元验证
- **V1.1** `npm run lint` 退出码 0。
- **V1.2** `npx tsc --noEmit` 退出码 0。
- **V1.3** `npm test`（vitest）全绿；新增覆盖：`getClientIp`、`SESSION_MAX_AGE` 一致性、`/api/auth/session` tokenVersion、`getCurrentUser` 配额持久化、`parseFloat` NaN 守卫、`JWT_SECRET` 长度断言、`escapeHtml`、Zod schema（非法输入拒绝）。

### V2 端到端（E2E）
- **V2.1 选型**：采用轻量、无浏览器依赖的 **API 层 E2E**（在 vitest 内用真实 Next 路由 handler + 测试 DB / mocked 外部依赖），避免引入 Playwright 重依赖；若需浏览器层，记录为后续项。
- **V2.2 流程覆盖（每个场景含正/负路径）**：
  - **认证**：注册（发码 mock）→ 登录 → `/api/auth/session` 已登录 → 登出 → 受保护资源 401/重定向；改密后旧会话失效。
  - **邮箱枚举**：注册已存在邮箱与不存在邮箱响应不可区分。
  - **AI 运行 & 配额**：登录后 `POST /api/ai/run` 成功；跨天配额重置；超限返回 `needUpgrade`；AI 失败后配额回退。
  - **历史 & 删除**：创建记录 → `DELETE /api/ai/history/:id` 成功；删他人 → 404。
  - **账户注销**：`POST /api/user/delete` → 会话失效 + PII 脱敏 + 订单留存。
  - **支付（mock Alipay）**：`create` 下单 → `check` 查询 → `notify` 回调幂等履约；金额不一致拒绝；重复回调只履约一次。
  - **安全**：伪造 `Origin` 写入 → 403；伪造 XFF 不改变限流键。
- **V2.3 外部依赖隔离**：DeepSeek、SMTP、Alipay 在 E2E 中以 mock/拦截 替代；测试 DB 使用独立 schema 或事务回滚隔离。

### V3 构建与部署
- **V3.1** `npm run build`（`prisma generate && next build`）退出码 0。
- **V3.2** 部署走 `scripts/deploy.sh`：`git pull` → `npm ci` → 备份 `.next` → build → `pm2 restart --update-env aitoolshelper` → `/api/health` 探活（≤30s）；失败自动回滚 `.next.prev`。
- **V3.3** 构建后**必须** `pm2 restart aitoolshelper`（AGENTS.md 强约束，避免 `Failed to find Server Action`）。
- **V3.4** 部署后核对：`pm2 list` 状态 `online`；`curl -s http://localhost:3000/api/health` 返回 200；`pm2-logs/error.log` 近期无 fatal。

### V4 推送与归档
- **V4.1** 将全部代码改动、openspec 变更、测试纳入 `git`；提交信息遵循仓库中文 fix/feat 风格。
- **V4.2** `git push origin main` 成功。
- **V4.3** 本 openspec 变更经验收后按流程归档（`/opsx-archive`）。

## Behavior

- `npm run lint && npx tsc --noEmit && npm test && npm run build` 一条命令串联即应全绿。
- E2E 套件可在 CI/本地一键执行，不依赖真实第三方服务。
- 部署脚本失败时自动回滚并保留日志，生产服务不长时间中断。

## Acceptance Criteria

- 一条 shell 命令完成 `lint + typecheck + test + build` 且退出码 0。
- E2E 套件 ≥ 上述 V2.2 的 7 个场景，全部通过。
- `scripts/deploy.sh` 执行后 `pm2 list` 显示 `aitoolshelper` online，`/api/health` 200。
- `git log origin/main..HEAD` 为空（已推送）。
- 变更目录下 `proposal/specs/design/tasks` 齐全且内容相互一致。
