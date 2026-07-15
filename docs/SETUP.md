# AI工具箱 — 部署与配置指南

本文档详细介绍如何从零配置和部署 AI工具箱。

---

## 目录

1. [环境要求](#1-环境要求)
2. [数据库配置（阿里云 RDS PostgreSQL）](#2-数据库配置阿里云-rds-postgresql)
3. [SMTP 邮件服务配置](#3-smtp-邮件服务配置)
4. [支付宝配置](#4-支付宝配置)
5. [DeepSeek AI 配置](#5-deepseek-ai-配置)
6. [阿里云短信配置（可选）](#6-阿里云短信配置可选)
7. [环境变量总览](#7-环境变量总览)
8. [部署流程](#8-部署流程)
9. [定时维护任务](#9-定时维护任务)

---

## 1. 环境要求

- Node.js 18+
- PostgreSQL 14+（或阿里云 RDS PostgreSQL）
- PM2（进程管理）
- Nginx（反向代理，可选）

---

## 2. 数据库配置（阿里云 RDS PostgreSQL）

### 2.1 创建 RDS 实例

1. 登录 [阿里云控制台](https://rds.console.aliyun.com/) → 创建 PostgreSQL 实例
2. 推荐配置：
   - **规格**：`pg.n2.small.1`（1核2G，约 ¥84/月）或按需选择
   - **存储**：20GB SSD 起步
   - **网络**：选择与服务器相同的 VPC
3. 创建完成后，在 **数据库连接** 页面获取：
   - 外网/内网地址（如 `pgm-xxxxx.pg.rds.aliyuncs.com`）
   - 端口（默认 `5432`）
4. 在 **数据安全性** → **白名单设置** 中添加服务器 IP

### 2.2 创建数据库和账号

1. 在 RDS 控制台 → **账号管理** → 创建账号
   - 数据库账号：`aitoolshelper`
   - 密码：自行设置强密码
2. 在 **数据库管理** → 创建数据库
   - 数据库名：`aitoolshelper`
   - 所属账号：`aitoolshelper`

### 2.3 配置连接串

在 `.env` 中设置：

```bash
DATABASE_URL="postgresql://aitoolshelper:你的密码@pgm-xxxxx.pg.rds.aliyuncs.com:5432/aitoolshelper?schema=public"
```

### 2.4 初始化表结构

```bash
npx prisma db push
```

---

## 3. SMTP 邮件服务配置

用于发送注册验证码邮件。推荐使用 **阿里云邮件推送**（免费额度每日200封）。

### 3.1 阿里云邮件推送

1. 登录 [阿里云邮件推送控制台](https://dm.console.aliyun.com/)
2. **发信域名** → 添加域名 → 完成 DNS 解析验证
3. **发信地址** → 创建发信地址（如 `noreply@aitoolshelper.cn`）
4. **SMTP 密码** → 设置 SMTP 密码

### 3.2 获取 SMTP 信息

阿里云邮件推送 SMTP 信息：
- **服务器**：`smtpdm.aliyun.com`
- **端口**：`465`（SSL）或 `80`（明文）

### 3.3 配置 .env

```bash
SMTP_HOST="smtpdm.aliyun.com"
SMTP_PORT="465"
SMTP_USER="noreply@aitoolshelper.cn"
SMTP_PASS="你在阿里云设置的SMTP密码"
SMTP_FROM="AI工具箱 <noreply@aitoolshelper.cn>"
```

---

## 4. 支付宝配置

### 4.1 获取支付宝密钥

1. 登录 [支付宝开放平台](https://open.alipay.com/) → 进入应用（APP ID: `2021006163658041`）
2. **开发设置** → **接口加签方式** → 选择 **公钥模式**（RSA2）
3. 使用 **支付宝密钥生成工具** 生成应用公钥/私钥对
4. 上传应用公钥到支付宝，获取 **支付宝公钥**
5. 保存密钥文件到 `/root/.secrets/` 目录：

```
/root/.secrets/应用私钥RSA2048-敏感数据，请妥善保管.txt
/root/.secrets/alipayPublicKey_RSA2.txt
```

### 4.2 配置 .env

```bash
ALIPAY_APP_ID="2021006163658041"
ALIPAY_APP_PRIVATE_KEY_PATH="/root/.secrets/应用私钥RSA2048-敏感数据，请妥善保管.txt"
ALIPAY_ALIPAY_PUBLIC_KEY_PATH="/root/.secrets/alipayPublicKey_RSA2.txt"
ALIPAY_SIGN_TYPE="RSA2"
ALIPAY_GATEWAY="https://openapi.alipay.com/gateway.do"

# 部署后替换为实际域名
ALIPAY_NOTIFY_URL="https://aitoolshelper.cn/api/payment/notify"
ALIPAY_RETURN_URL="https://aitoolshelper.cn/pricing"
```

> **注意**：`NOTIFY_URL` 和 `RETURN_URL` 在绑定域名前可留空，系统会通过主动查询兜底。

---

## 5. DeepSeek AI 配置

API Key 已配置，如需更换：

1. 访问 [DeepSeek 开放平台](https://platform.deepseek.com/)
2. 创建 API Key
3. 在 `.env` 中设置：

```bash
DEEPSEEK_API_KEY="sk-xxxxxxxxxxxxxxxxxxxxxxxx"
DEEPSEEK_BASE_URL="https://api.deepseek.com"
```

---

## 6. 阿里云短信配置（可选）

当前默认使用邮箱验证码。如需短信验证：

### 6.1 开通阿里云短信

1. 登录 [阿里云短信服务控制台](https://dysms.console.aliyun.com/)
2. **国内消息** → **签名管理** → 添加签名（需审核）
3. **国内消息** → **模板管理** → 添加模板（验证码模板）
4. 获取 **AccessKey**：访问 [RAM 控制台](https://ram.console.aliyun.com/) 创建子账号，授予 `AliyunDysmsFullAccess` 权限

### 6.2 配置 .env

```bash
ALIYUN_SMS_ACCESS_KEY_ID="你的AccessKeyId"
ALIYUN_SMS_ACCESS_KEY_SECRET="你的AccessKeySecret"
ALIYUN_SMS_SIGN_NAME="你的短信签名"
ALIYUN_SMS_TEMPLATE_CODE="SMS_xxxxxxxx"
```

### 6.3 安装依赖

```bash
npm install @alicloud/dysmsapi20170525 @alicloud/openapi-client
```

然后取消 `src/lib/sms.ts` 中的注释实现。

---

## 7. 环境变量总览

| 变量 | 说明 | 必填 |
|---|---|---|
| `DATABASE_URL` | PostgreSQL 连接串 | ✅ |
| `JWT_SECRET` | JWT 签名密钥（`openssl rand -base64 32`） | ✅ |
| `JWT_EXPIRES` | Session 有效期（默认 `7d`） | |
| `DEEPSEEK_API_KEY` | DeepSeek API Key | ✅ |
| `DEEPSEEK_BASE_URL` | DeepSeek API 地址 | |
| `ALIPAY_APP_ID` | 支付宝应用 ID | ✅ |
| `ALIPAY_APP_PRIVATE_KEY_PATH` | 应用私钥文件路径 | ✅ |
| `ALIPAY_ALIPAY_PUBLIC_KEY_PATH` | 支付宝公钥文件路径 | ✅ |
| `ALIPAY_NOTIFY_URL` | 支付回调地址 | 部署后 |
| `ALIPAY_RETURN_URL` | 支付返回地址 | 部署后 |
| `SMTP_HOST` | SMTP 服务器 | 邮箱验证 |
| `SMTP_PORT` | SMTP 端口 | |
| `SMTP_USER` | SMTP 用户名 | |
| `SMTP_PASS` | SMTP 密码 | |
| `SMTP_FROM` | 发件人地址 | |
| `APP_URL` | 应用 URL | |
| `NODE_ENV` | 环境标识 | |

---

## 8. 部署流程

```bash
# 1. 克隆代码
git clone git@github.com:LuuuXXX/web-aitoolshelper.git
cd web-aitoolshelper

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env 填入实际配置

# 4. 生成 Prisma Client
npx prisma generate

# 5. 初始化数据库
npx prisma db push

# 6. 构建
npm run build

# 7. 启动（PM2）
pm2 start ecosystem.config.js
pm2 save

# 8. 配置 Nginx 反向代理（示例）
# 将 80/443 端口转发到 localhost:3000
```

### Nginx 配置示例

```nginx
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

---

## 9. 定时维护任务

将 `scripts/cleanup.sh` 加入 crontab：

```bash
# 每天凌晨 3 点执行
crontab -e
0 3 * * * /root/luuux/scripts/cleanup.sh
```

该脚本会：
- 自动备份 PostgreSQL 数据库（保留最近 7 份）
- 清理过大的 Next.js 缓存
- 截断 PM2 日志
- 监控磁盘和内存使用
