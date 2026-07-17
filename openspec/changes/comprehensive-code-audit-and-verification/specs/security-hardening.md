# Spec: Security Hardening

专项：把本轮审查发现的可利用安全面收敛到"默认安全"。

## Requirements

- **S1 限流不可绕过**：`getClientIp` 必须解析出**真实客户端 IP**，而非代理 IP。
  - `X-Forwarded-For` 列表按 `TRUSTED_PROXY_HOPS`（默认 `1`）从左取第 N 跳；无配置时取最左侧。
  - `x-real-ip` 仅在来自可信代理时采纳；新增可信代理校验，未配置时回退到连接 IP。
  - 当无法解析 IP 时统一为 `'unknown'`，但需在 `rateLimit` 上层记录告警，避免单桶放大。
- **S2 JWT 密钥强度**：`JWT_SECRET` 在 `session.ts` 模块加载时校验 `>= 32 bytes`，否则抛出明确启动错误（`JWT_SECRET must be >= 32 bytes`）。算法继续钉死 `HS256`，`decrypt` 保留 `algorithms:['HS256']`。
- **S3 会话即时失效**：`/api/auth/session` 改用 `verifySession()`；任何受保护资源禁止直接读 `getSession()` 后即信任（必须经 DAL 的 `tokenVersion` 校验）。
- **S4 邮件内容注入**：`email.ts` 提供 `escapeHtml(s)`；`sendEmail` 内部对文本片段统一转义；新增 lint 规则/约定：禁止在邮件 HTML 模板中直接拼接外部输入。
- **S5 支付签名完整性**：核对 `alipay-sdk` 当前锁定版本是否存在签名校验绕过 CVE；若有则升级并在 `package.json`/`package-lock.json` 锁定修复版本。`verifyNotification` 必须保持**失败即拒绝**（fail-closed）。
- **S6 CSRF 最小防护**：所有非 GET 的 API 路由（除支付回调 `payment/notify`）校验 `Origin` 或 `Sec-Fetch-Site: same-origin`；不匹配返回 `403`。`payment/notify` 依赖 Alipay 签名校验，单独豁免并注释说明。
- **S7 CSP 收敛**：评估去 `script-src 'unsafe-inline'`；若 Next 16 运行时不支持纯 nonce，则记录已知妥协并在 `next.config.ts` 注释说明，保留后续 nonce 改造项。
- **S8 密钥与 PII 边界**：Alipay 私钥/公钥继续走文件路径（`/root/.secrets/`）；`readKey` 失败由静默返回 `''` 改为抛错或显式 `isAlipayConfigured()=false` 并记录告警，避免"看似配置实则空"。

## Behavior

- 伪造 `X-Forwarded-For: attacker-ip, real-ip` 不改变对真实客户端的限流计数。
- 弱 JWT 密钥时进程**不启动**。
- 跨站 POST（无合法 `Origin`）被 403 拒绝；正常同源与 Alipay 回调不受影响。
- 邮件正文中的 `<`、`>`、`&` 被转义，用户输入无法注入脚本/链接。

## Acceptance Criteria

- 单测：`getClientIp` 在多种 XFF 组合下返回预期 IP（含 `TRUSTED_PROXY_HOPS` 变更）。
- 单测：`JWT_SECRET` 过短时 `import '@/lib/session'` 抛错。
- E2E：跨站请求（伪造 `Origin`）→ 403；合法同源 → 正常。
- `npm audit`（或人工核对）确认 `alipay-sdk` 无已知高危签名 CVE。
- `rg "dangerouslySetInnerHTML"` 在受用户输入影响的路径下 0 命中或经充分转义。
