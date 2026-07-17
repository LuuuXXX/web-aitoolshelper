# Spec: PIPL Compliance

专项：使代码实现与对外隐私政策/服务条款**逐条对齐**，消除 PIPL 违约风险。

## Requirements

- **C1 数据留存自动化**：`ToolRecord`（含用户输入/输出 PII）保留 ≤ 90 天。
  - 新增 `scripts/purge-records.mjs`：删除 `createdAt < now - 90d` 的 `tool_records`，输出删除条数，失败经 `alert.mjs` 告警。
  - `scripts/cleanup.sh`（每日 03:00）在清理 `verification_codes` 后调用本脚本。
  - `prisma/schema.prisma` 为 `ToolRecord.createdAt` 增加索引（或确认复合索引 `[userId, createdAt]` 可被清理查询利用）。
- **C2 用户删除历史记录**：新增 `DELETE /api/ai/history/:id`。
  - 鉴权（`verifySession`）+ 所有权校验（`record.userId === session.userId`，否则 404）。
  - 删除成功返回 `{ ok: true }`；幂等（已删返回 404）。
- **C3 账户注销**：新增 `POST /api/user/delete`。
  - 要求二次确认（请求体 `confirm: true` 或密码二次校验，二选一，默认采用 `confirm` 布尔）。
  - 软删除/脱敏：`email=null`、`phone=null`、`name='已注销用户'`、`passwordHash` 置为随机不可用值；递增 `tokenVersion` 吊销所有会话；删除该用户 `tool_records`；**保留** `orders`（财务留存）。
  - 返回并清除会话 cookie。
- **C4 财务凭证留存**：`User ← Order` 关系由 `onDelete: Cascade` 改为 `onDelete: NoAction`（或保留订单但脱敏 `userId` 指向匿名用户）。注销用户时订单不被物理删除。迁移脚本需兼容现有数据。
- **C5 防邮箱枚举**：`POST /api/auth/register` 对"邮箱已注册"与"验证码错误"返回**相同**的通用失败（同 HTTP 状态、同消息体），仅在校验码通过后才创建账户。
- **C6 生产环境断言**：启动时（`NODE_ENV==='production'` 下）断言关键生产条件：`NODE_ENV` 实际为 `production`、`APP_URL` 为 https、`COOKIE_SECURE !== 'false'`；不符则告警（`alert.mjs`/控制台），严重项阻断启动。
- **C7 文案对齐**：`privacy/page.tsx`、`terms/page.tsx` 中与代码相关的数字（90 天留存、30 工作日注销、保留期）改为引用同一常量来源或在其变更时同步；删除/注销端点上线后在文案中补充"操作入口"说明。

## Behavior

- 用户在控制台可删除任一自己的历史记录；删除他人记录得到 404（不泄漏存在性）。
- 用户可自助注销账户；注销后无法再用原会话访问受保护资源，个人 PII 被脱敏，但已支付订单仍可被运营/对账查询。
- 注册一个已存在邮箱与一个不存在邮箱，外部观察到的响应完全一致。
- 每日自动清理使 `tool_records` 中不存在 90 天前的记录；清理失败时产生告警。

## Acceptance Criteria

- E2E：创建历史记录 → 调 `DELETE /api/ai/history/:id` 成功删除；再次 GET 该记录 → 不存在。
- E2E：`POST /api/user/delete {confirm:true}` → 后续访问受保护资源 401；DB 中该用户 `email/phone` 为空、`orders` 仍在。
- 测试：注册已存在邮箱 vs 不存在邮箱，断言响应状态码与消息体相等。
- `rg "onDelete: Cascade" prisma/schema.prisma` 对 `Order` 关系 0 命中（改为 NoAction 或脱敏保留）。
- `scripts/cleanup.sh` 调用 `purge-records.mjs`；手动运行该脚本可删掉伪造的 91 天前记录。
- 隐私政策文案中"90 天"、"30 个工作日"与代码常量一致（人工核对 + 注释指引）。
