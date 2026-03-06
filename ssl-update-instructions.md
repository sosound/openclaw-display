# SSL 证书更新指南 - test.galaxystream.online

## 当前状态

- ✅ Flask 应用运行正常（端口 5003）
- ✅ Nginx 配置正确
- ⚠️ SSL 证书需要更新

## 为什么需要验证？

Let's Encrypt 要求验证域名所有权，防止他人冒名申请证书。

## 验证方式对比

| 方式 | 日记系统 | show 系统 | test 系统 |
|------|---------|---------|---------|
| **HTTP 验证** | ✅ 成功 | ✅ 成功 | ❌ 被 Nginx 拦截 |
| **Nginx 插件** | - | - | ❌ 未安装 |
| **DNS 验证** | - | - | ⏳ 需要手动添加 TXT 记录 |

## 手动申请证书步骤

### 1. 运行 Certbot

```bash
certbot certonly --manual --preferred-challenges dns -d test.galaxystream.online
```

### 2. 添加 DNS TXT 记录

Certbot 会显示类似以下信息：

```
Please deploy a DNS TXT record under the name:
_acme-challenge.test.galaxystream.online

with the value:
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

### 3. 在域名服务商添加记录

登录你的域名服务商（如阿里云、腾讯云、Cloudflare 等）：

| 字段 | 值 |
|------|-----|
| **记录类型** | `TXT` |
| **主机记录** | `_acme-challenge.test` |
| **记录值** | （Certbot 提供的值） |

### 4. 等待 DNS 传播

通常 1-5 分钟，可以用以下命令检查：

```bash
dig TXT _acme-challenge.test.galaxystream.online
```

### 5. 继续验证

在 Certbot 提示处按 **Enter** 继续。

### 6. 验证成功后

证书会保存到：
```
/etc/letsencrypt/live/test.galaxystream.online/fullchain.pem
/etc/letsencrypt/live/test.galaxystream.online/privkey.pem
```

### 7. 更新 Nginx 配置

编辑 `/etc/nginx/sites-available/test.galaxystream.online`：

```nginx
ssl_certificate /etc/letsencrypt/live/test.galaxystream.online/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/test.galaxystream.online/privkey.pem;
```

### 8. 重启 Nginx

```bash
/usr/sbin/nginx -t && /usr/sbin/nginx -s reload
```

### 9. 验证

```bash
curl -I https://test.galaxystream.online/
# 应该返回 HTTP/2 200
```

---

## 快速命令

```bash
# 运行 Certbot
sudo certbot certonly --manual --preferred-challenges dns -d test.galaxystream.online

# 检查 DNS 记录
dig TXT _acme-challenge.test.galaxystream.online

# 测试 Nginx 配置
sudo /usr/sbin/nginx -t

# 重启 Nginx
sudo /usr/sbin/nginx -s reload

# 验证 HTTPS
curl -I https://test.galaxystream.online/
```

---

**完成后删除此文件！**
