# AI工具箱 — 配置与部署指南

---

## 当前状态

| 服务 | 状态 | 说明 |
|---|---|---|
| 数据库 | ✅ 已配置 | 阿里云 RDS PostgreSQL 16 |
| 邮件验证 | ✅ 已配置 | 163邮箱 SMTP |
| AI 引擎 | ✅ 已配置 | DeepSeek API |
| 支付 | ✅ 已配置 | 支付宝（密钥就绪） |
| 找回密码 | ✅ 已实现 | 邮箱验证码重置 |
| 域名 | ⏳ 待绑定 | aitoolshelper.cn（已备案） |
| 支付回调 | ⏳ 待绑定 | 需域名后配置 NOTIFY_URL |
| 定时备份 | ⏳ 待配置 | crontab 加入 cleanup.sh |

---

## 环境变量 (.env)

```bash
# ───── 数据库 ─────
# 阿里云 RDS PostgreSQL（密码含特殊字符需 URL 编码，如 @ → %40）
DATABASE_URL="postgresql://aitoolshelper:密码@外网地址.pg.rds.aliyuncs.com:5432/aitoolshelper?schema=public"

# ───── 认证 ─────
JWT_SECRET="openssl rand -base64 32 生成"
JWT_EXPIRES="7d"

# ───── AI ─────
DEEPSEEK_API_KEY="sk-xxxxxxxxxxxxxxxxxxxxxxxx"
DEEPSEEK_BASE_URL="https://api.deepseek.com"

# ───── 支付宝 ─────
ALIPAY_APP_ID="2021006163658041"
ALIPAY_APP_PRIVATE_KEY_PATH="/root/.secrets/应用私钥RSA2048-敏感数据，请妥善保管.txt"
ALIPAY_ALIPAY_PUBLIC_KEY_PATH="/root/.secrets/alipayPublicKey_RSA2.txt"
ALIPAY_SIGN_TYPE="RSA2"
ALIPAY_GATEWAY="https://openapi.alipay.com/gateway.do"
ALIPAY_NOTIFY_URL=""    # ← 绑定域名后填: https://aitoolshelper.cn/api/payment/notify
ALIPAY_RETURN_URL=""    # ← 绑定域名后填: https://aitoolshelper.cn/pricing

# ───── 邮件 (163 SMTP) ─────
SMTP_HOST="smtp.163.com"
SMTP_PORT="465"
SMTP_USER="你的邮箱@163.com"
SMTP_PASS="客户端授权码（非登录密码）"
SMTP_FROM="AI工具箱 <你的邮箱@163.com>"

# ───── 应用 ─────
APP_NAME="AI工具箱"
APP_URL="http://localhost:3000"    # ← 绑定域名后改为 https://aitoolshelper.cn
NODE_ENV="production"
```

> 完整模板见 `.env.example`

---

## 已配置服务详情

### 数据库 — 阿里云 RDS PostgreSQL

| 项目 | 值 |
|---|---|
| 实例 ID | `pgm-bp10p5t4t88e8x3e` |
| 外网地址 | `pgm-bp10p5t4t88e8x3eto.pg.rds.aliyuncs.com:5432` |
| 数据库名 | `aitoolshelper` |
| 账号 | `aitoolshelper` |

**新服务器部署时**需在 RDS 控制台将服务器公网 IP 加入白名单（数据安全性 → 白名单设置）。

**初始化表结构**：

```bash
npx prisma db push
```

### 邮件 — 163邮箱 SMTP

已验证：注册验证码、找回密码验证码均可正常发送。

如需更换邮箱服务，支持以下 SMTP（改 `.env` 中 `SMTP_*` 即可，无需改代码）：

| 邮箱 | SMTP_HOST | 说明 |
|---|---|---|
| **163**（当前） | `smtp.163.com` | 授权码，非登录密码 |
| QQ邮箱 | `smtp.qq.com` | 16位授权码 |
| Resend | `smtp.resend.com` | API Key，免费3000封/月 |
| 阿里云邮件推送 | `smtpdm.aliyuncs.com` | 需域名DNS验证 |

### AI — DeepSeek

已验证：12款工具全部可正常调用。Token 用量已统计。

更换 API Key：[DeepSeek 开放平台](https://platform.deepseek.com/) → 创建 Key → 更新 `.env`

### 支付宝

已验证：可创建支付订单并跳转支付宝收银台。

密钥文件位于 `/root/.secrets/`（不在代码仓库中）。

> **当前**：`NOTIFY_URL` 和 `RETURN_URL` 留空，系统通过主动查询兜底。绑定域名后建议填入以确保支付状态实时同步。

### 短信 — 不使用

本项目不使用短信。认证全部通过邮箱完成（注册 / 登录 / 找回密码），零成本且足够安全。

---

## 待完成配置

### 1. 绑定域名

```bash
# DNS 解析：A 记录 aitoolshelper.cn → 服务器公网 IP

# Nginx 反向代理
server {
    listen 80;
    server_name aitoolshelper.cn;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

申请 SSL 证书（阿里云免费证书或 certbot），配置 HTTPS 后更新 `.env`：

```bash
APP_URL="https://aitoolshelper.cn"
ALIPAY_NOTIFY_URL="https://aitoolshelper.cn/api/payment/notify"
ALIPAY_RETURN_URL="https://aitoolshelper.cn/pricing"
```

然后重新构建部署：

```bash
npm run build && pm2 restart aitoolshelper
```

### 2. 定时备份

```bash
crontab -e
# 添加以下行（每天凌晨3点执行）：
0 3 * * * /root/luuux/scripts/cleanup.sh
```

该脚本自动完成：PostgreSQL 备份（保留7份）、缓存清理、日志截断、磁盘/内存监控。

---

## 部署流程（新服务器）

```bash
git clone git@github.com:LuuuXXX/web-aitoolshelper.git
cd web-aitoolshelper
npm install
cp .env.example .env    # 编辑填入实际配置
npx prisma generate
npx prisma db push
npm run build
pm2 start ecosystem.config.js
pm2 save
pm2 startup             # 设置开机自启
```

---

## 认证体系说明

| 功能 | 方式 | 状态 |
|---|---|---|
| 注册 | 邮箱 + 验证码 | ✅ |
| 登录 | 邮箱 + 密码 | ✅ |
| 找回密码 | 邮箱验证码重置 | ✅ |
| 会话保持 | JWT Cookie（7天） | ✅ |
| 速率限制 | 登录/注册/验证码/AI调用 | ✅ |
