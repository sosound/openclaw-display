# 系统状态报告 (System State Report)

**生成时间:** 2026-03-05 14:22 GMT+8  
**系统运行时间:** 403 天 15 小时  
**报告生成者:** 十四 (Fourteen/14) - 系统状态管理子代理

---

## 👥 子代理分工 (Sight Pond)

**项目名称：** Sight Pond (sight-pond)  
**域名：** show.galaxystream.online

| 编号 | 名字 | 角色/职责 | 专长 |
|------|------|-----------|------|
| **十一** 🔟 | 主代理 | 总体协调、任务分配、对外交互 | 多模态理解、长上下文处理、复杂任务规划 |
| **十二** 🎨 | 设计师 + 画图师 | UI/UX 设计、视觉风格、图像生成 | 配色方案、图像创作、视觉表达 |
| **十三** 💻 | 代码工程师 | Flask 应用、前端 UI、API 优化、Bug 修复 | Python/Flask、前端开发、系统架构 |
| **十四** 📊 | 系统状态管理员 | 系统状态数据、服务监控、SSL 证书信息 | 系统监控、数据分析、健康检查 |

---

## 1. 当前运行的服务 (Running Services)

### 核心服务
| 服务名称 | 状态 | 说明 |
|---------|------|------|
| nginx.service | ✅ 运行中 | Web 服务器和反向代理 |
| openclaw-gateway | ✅ 运行中 (PID: 4048661) | OpenClaw 网关服务 |
| docker.service | ✅ 运行中 | Docker 容器运行时 |
| frps.service | ✅ 运行中 | FRP 内网穿透服务器 |
| ssh.service | ✅ 运行中 | SSH 远程访问 |
| cron.service | ✅ 运行中 | 定时任务服务 |
| rsyslog.service | ✅ 运行中 | 系统日志服务 |
| sight-pond.service | ✅ 运行中 (PID: 4078049) | Sight Pond Flask 应用 |

### Docker 容器
| 容器名称 | 状态 | 端口映射 |
|---------|------|---------|
| certd | ✅ 运行中 (13 个月) | 7001-7002 -> 7001-7002 |

### 其他关键进程
- **FRP Server:** PID 800, 配置文件 `/etc/frp/frps.toml`
- **Growth Diary:** Python 应用运行中 (app.py, PID: 4063960)
- **Sight Pond:** Python 应用运行中 (app.py, PID: 4078049)

---

## 2. SSL 证书信息 (SSL Certificates)

所有证书均由 Let's Encrypt 签发，有效期 90 天，今日 (2026-03-05) 已续期

| 域名 | 签发日期 | 到期时间 | 状态 | 证书路径 |
|-----|---------|---------|------|---------|
| galaxystream.online | 2026-03-05 02:34:42 UTC | 2026-06-03 02:34:41 UTC | ✅ 有效 | /etc/letsencrypt/live/galaxystream.online/ |
| diary.galaxystream.online | 2026-03-05 02:49:34 UTC | 2026-06-03 02:49:33 UTC | ✅ 有效 | /etc/letsencrypt/live/diary.galaxystream.online/ |
| gateway.galaxystream.online | 2026-03-05 02:55:36 UTC | 2026-06-03 02:55:35 UTC | ✅ 有效 | /etc/letsencrypt/live/gateway.galaxystream.online/ |
| show.galaxystream.online | 2026-03-05 04:18:28 UTC | 2026-06-03 04:18:27 UTC | ✅ 有效 | /etc/letsencrypt/live/show.galaxystream.online/ |

**✅ 状态:** 所有证书今日已完成续期，下次检查日期 2026-05-15

---

## 3. Nginx 配置摘要 (Nginx Configuration)

### 配置文件位置
- **主配置:** `/etc/nginx/nginx.conf`
- **站点配置:** `/etc/nginx/sites-available/`
- **启用站点:** `/etc/nginx/sites-enabled/`

### 已配置站点

#### 3.1 diary.galaxystream.online (成长日记)
- **HTTP (80):** 重定向到 HTTPS
- **HTTPS (443):** 反向代理到 `http://127.0.0.1:5000`
- **SSL 证书:** `/etc/letsencrypt/live/diary.galaxystream.online/`
- **安全头:** HSTS, X-Frame-Options, X-Content-Type-Options, X-XSS-Protection

#### 3.2 show.galaxystream.online (Sight Pond)
- **HTTP (80):** 重定向到 HTTPS
- **HTTPS (443):** Sight Pond Flask 应用 (端口 5001)
- **SSL 证书:** `/etc/letsencrypt/live/show.galaxystream.online/`
- **图片缓存:** 30 天过期，public immutable
- **安全头:** HSTS (1 年), X-Frame-Options, X-Content-Type-Options, X-XSS-Protection

---

## 4. OpenClaw Gateway 状态

| 项目 | 值 |
|-----|-----|
| **状态** | ✅ 运行中 |
| **PID** | 4048661 |
| **绑定地址** | 127.0.0.1 (仅本地访问) |
| **端口** | 18789 |
| **配置文件** | `~/.openclaw/openclaw.json` |
| **日志文件** | `/tmp/openclaw/openclaw-2026-03-05.log` |
| **服务类型** | systemd (user) |
| **Dashboard** | http://127.0.0.1:18789/ |

### 可用模型 (Bailian/阿里云)
- qwen3.5-plus (主模型，1M 上下文)
- qwen3-max-2026-01-23 (256K 上下文)
- qwen3-coder-next / qwen3-coder-plus
- MiniMax-M2.5 (200K 上下文)
- glm-5 / glm-4.7 (200K 上下文)
- kimi-k2.5 (256K 上下文，支持图像)

---

## 5. 域名和子域名列表

| 域名 | 用途 | 后端服务 | 状态 |
|-----|------|---------|------|
| galaxystream.online | 主域名 | - | ✅ 正常 |
| diary.galaxystream.online | 成长日记 | Python Flask (端口 5000) | ✅ 正常 |
| show.galaxystream.online | Sight Pond (系统状态 + 图片集) | Flask 应用 (端口 5001) | ✅ 正常 |
| gateway.galaxystream.online | OpenClaw 网关 | OpenClaw Gateway (本地 18789) | ✅ 正常 |

---

## 6. 网络配置 (Network Configuration)

### 网络接口
| 接口 | IP 地址 | 说明 |
|-----|--------|------|
| lo | 127.0.0.1/8 | 本地回环 |
| eth0 | 10.2.8.4/22 | 主网络接口 |
| docker0 | 172.17.0.1/16 | Docker 网桥 |
| br-be9248c0120d | 172.18.0.1/16 | Docker 网络 |

### MAC 地址
- eth0: 52:54:00:c5:71:87
- docker0: 02:42:b0:95:fd:da

---

## 7. 系统资源状态 (System Resources)

### 磁盘使用
| 文件系统 | 总容量 | 已用 | 可用 | 使用率 |
|---------|-------|------|------|-------|
| /dev/vda2 | 50G | 15G | 33G | 31% |

### 内存使用
| 项目 | 用量 |
|-----|------|
| 总内存 | 1.9 GiB |
| 已用 | 996 MiB |
| 空闲 | 68 MiB |
| 缓存 | 898 MiB |
| 可用 | 772 MiB |
| Swap | 0B (未配置) |

### 系统负载
- **当前负载:** 0.33, 0.15, 0.05 (1/5/15 分钟)
- **运行时间:** 403 天 15 小时 33 分钟

---

## 8. 重要配置文件位置

| 文件/目录 | 路径 | 说明 |
|----------|------|------|
| OpenClaw 配置 | `~/.openclaw/openclaw.json` | 模型和网关配置 |
| OpenClaw 日志 | `/tmp/openclaw/` | 运行日志 |
| Nginx 主配置 | `/etc/nginx/nginx.conf` | Nginx 全局配置 |
| Nginx 站点配置 | `/etc/nginx/sites-available/` | 各站点配置 |
| SSL 证书 | `/etc/letsencrypt/live/` | Let's Encrypt 证书 |
| FRP 配置 | `/etc/frp/frps.toml` | FRP 服务器配置 |
| Growth Diary | `/root/.openclaw/workspace/growth-diary/` | 成长日记应用 |
| Sight Pond | `/root/.openclaw/workspace/sight-pond/` | Sight Pond 应用 |

---

## 9. 健康检查状态

| 检查项 | 状态 | 备注 |
|-------|------|------|
| Nginx | ✅ 正常 | 2 worker 进程运行中 |
| OpenClaw Gateway | ✅ 正常 | PID 4048661，运行正常 |
| Docker | ✅ 正常 | certd 容器运行正常 (13 个月) |
| SSL 证书 | ✅ 正常 | 所有证书今日已续期，90 天有效 |
| Sight Pond | ✅ 正常 | PID 4078049，运行 4 分钟 |
| Growth Diary | ✅ 正常 | PID 4063960，运行正常 |
| 磁盘空间 | ✅ 正常 | 31% 使用率，充足 |
| 内存 | ⚠️ 注意 | 可用 772MiB，建议监控 |
| Swap | ⚠️ 注意 | 未配置 Swap |

---

## 10. 待办事项

- [x] **2026-03-05:** SSL 证书已完成续期 ✅
- [ ] **2026-05-15:** 检查 SSL 证书自动续期状态
- [ ] **定期:** 监控内存使用情况 (当前可用 772MiB)
- [ ] **建议:** 考虑配置 Swap 以防内存压力

---

## 11. 更新日志

| 日期 | 更新内容 | 更新者 |
|-----|---------|-------|
| 2026-03-05 14:34 | 优化子代理展示：去掉状态列，改用专长展示；更新十二为双重角色 | 十四 |
| 2026-03-05 14:22 | SSL 证书续期完成，更新所有证书到期时间 | 十四 |
| 2026-03-05 14:22 | 添加十二 (设计师) 到子代理分工表 | 十四 |
| 2026-03-05 14:22 | 更新 Sight Pond 服务状态 (PID: 4078049) | 十四 |
| 2026-03-05 14:22 | 更新系统资源数据 (内存、负载) | 十四 |
| 2026-03-05 13:52 | 初始版本生成 | 十四 |

---

*此文件由系统状态管理子代理 **十四** 自动生成和维护*
