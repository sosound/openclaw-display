# 展示系统 (Display System) 完整文档

> 由 Claude Code 分析生成  
> 生成时间：2026-03-06

---

## 1. 系统概述

展示系统 (Display System) 是一个综合性的信息展示平台，原名为 Show Galaxy。该系统整合了多个功能模块，包括：

- **系统状态监控**：实时显示服务器和服务状态信息
- **文档中心**：子代理和系统组件的文档管理系统
- **日记集成**：与 Growth Diary 系统集成，展示每日记录
- **图片集展示**：展示 AI 生成的图片作品
- **服务健康监测**：监控各项服务的运行状态

该系统采用 Flask 框架构建，提供 Web 界面和 RESTful API 接口，是 OpenClaw 项目的重要组成部分。

**访问地址：**
- 主域名：https://display.galaxystream.online
- 历史域名：https://show.galaxystream.online

---

## 2. 目录结构

```
display/
├── app.py                 # Flask 应用主程序
├── README.md              # 系统说明文档
├── DEPLOY_CHECKLIST.md    # 部署检查清单
├── deploy.sh              # 部署脚本
├── docs/                  # 文档中心
│   ├── agent-12/          # 子代理 12 (Twelve) 的文档
│   ├── sight-pond/        # Sight Pond 项目的文档
│   └── system/            # 系统级文档
├── static/                # 静态资源
│   ├── css/               # 样式文件
│   │   ├── style.css      # 原始样式
│   │   └── style-v2.css   # V2 样式 (深色主题，响应式)
│   ├── js/                # JavaScript 文件
│   │   └── app.js         # 前端交互逻辑
│   └── images/            # 图片资源
│       ├── avatar.png     # 头像图片
│       ├── ins-quote.png  # 励志语录图片
│       └── heart.png      # 心形图片
├── templates/             # HTML 模板
│   ├── index.html         # 系统状态首页
│   ├── docs.html          # 文档中心页面
│   ├── doc-detail.html    # 文档详情页面
│   └── diary.html         # 日记系统页面
└── images/                # 图片集 (实际存储位置可能与此处不同)
```

---

## 3. 功能模块

### 3.1 系统状态监控模块
- 显示主机名、操作系统信息、Node 版本、AI 模型类型等基本信息
- 监控 Nginx、OpenClaw Gateway 等关键服务的运行状态
- 显示 SSL 证书有效期及剩余天数
- 展示工作目录和最后更新时间

### 3.2 文档中心模块
- 支持多分类文档管理 (agent-12/, sight-pond/, system/ 等)
- 自动解析 Markdown 文档的元数据 (创建者、创建时间、标签等)
- 提供文档分类浏览和搜索功能
- 支持文档详情查看（Markdown 渲染）

### 3.3 日记系统模块
- 从 `memory/YYYY-MM-DD.md` 文件读取日记数据
- 显示最近 10 条日记条目
- 集成到 Growth Diary 系统 (https://diary.galaxystream.online)
- 提供完整的日记时间线

### 3.4 图片集模块
- 展示 AI 生成的图片作品
- 支持多种图片格式 (PNG, JPG, JPEG, GIF, WEBP)
- 包含图片名称、路径、类型等信息
- 响应式布局展示

### 3.5 子代理管理系统
- 管理多个子代理 (11 号"十一"、12 号"十二"、13 号"十三"、14 号"十四")
- 显示各子代理的角色和专业领域
- 维护代理间协作关系

---

## 4. API 端点

### 4.1 公共 API
| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/health` | GET | 系统健康检查接口（7 项检查） |
| `/api/status` | GET | 获取完整系统状态信息 |
| `/api/diary` | GET | 获取日记条目列表（最近 10 条） |
| `/api/docs` | GET | 获取文档索引 |

### 4.2 文档相关 API
| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/docs/<category>/<name>` | GET | 获取特定文档内容 |
| `/docs` | GET | 文档中心页面 |
| `/docs/<category>/<name>` | GET | 文档详情页面 |

### 4.3 页面路由
| 端点 | 说明 |
|------|------|
| `/` | 系统状态主页 |
| `/diary` | 日记系统页面 |

### 4.4 API 返回结构示例
```json
{
  "system": {
    "hostname": "server-name",
    "os": ["Linux", "kernel-version"],
    "node": "v18.x.x",
    "model": "qwen3.5-plus",
    "workspace": "/root/.openclaw/workspace",
    "updated_at": "2026-03-06 10:00:00"
  },
  "services": [
    {"name": "Nginx", "status": "running"},
    {"name": "OpenClaw Gateway", "status": "running"}
  ],
  "health_summary": {
    "score": 100,
    "total": 2,
    "ok": 2,
    "warning": 0,
    "status": "healthy",
    "last_check": "2026-03-06 10:00:00"
  },
  "docs": [...],
  "diary": [...],
  "ssl": [...],
  "images": [...],
  "agents": [...],
  "models": [...],
  "domains": [...],
  "last_updated": "2026-03-06 10:00:00"
}
```

---

## 5. 技术栈

### 5.1 后端技术
- **Python 3**: 主要编程语言
- **Flask**: Web 框架，用于构建 RESTful API 和动态页面
- **Pathlib**: 用于路径操作和文件系统访问
- **Subprocess**: 用于执行系统命令获取系统信息

### 5.2 前端技术
- **HTML5**: 页面结构
- **CSS3**: 样式设计，采用深色主题和响应式设计
- **Vanilla JavaScript**: 前端交互逻辑

### 5.3 系统组件
- **Nginx**: Web 服务器和反向代理
- **Systemd**: 服务管理器
- **OpenSSL**: SSL 证书管理
- **Git**: 版本控制系统

### 5.4 缓存机制
- 内建简单的内存缓存系统 (`SimpleCache`)
- 默认缓存时间为 5 分钟 (300 秒)

---

## 6. 部署方式

### 6.1 部署脚本
使用 `deploy.sh` 脚本进行自动化部署：

```bash
# 部署或重启服务
./deploy.sh deploy
./deploy.sh restart

# 查看服务状态
./deploy.sh status

# 查看实时日志
./deploy.sh logs

# 停止服务
./deploy.sh stop
```

### 6.2 服务配置
- **端口**: 5001
- **服务名**: display-system
- **运行用户**: 当前用户
- **日志文件**: `/var/log/show-galaxy.log` 或 systemd 日志

### 6.3 部署流程
1. 检查必需文件和目录是否存在
2. 检查端口可用性
3. 停止旧服务进程
4. 启动新服务 (优先使用 systemd，否则直接启动)
5. 验证服务是否正常运行
6. 输出部署结果

### 6.4 系统要求
- Python 3.x
- Flask 框架
- Git
- Nginx
- Systemd (用于服务管理)

---

## 7. 配置说明

### 7.1 应用配置
在 `app.py` 中定义的主要配置项：

```python
# 工作目录配置
WORKSPACE = Path('/root/.openclaw/workspace')
DISPLAY_DIR = WORKSPACE / 'display'
DOCS_DIR = DISPLAY_DIR / 'docs'
IMAGES_DIR = DISPLAY_DIR / 'images'
TEMPLATES_DIR = DISPLAY_DIR / 'templates'
STATIC_DIR = DISPLAY_DIR / 'static'
DIARY_DIR = WORKSPACE / 'growth-diary'
MEMORY_DIR = WORKSPACE / 'memory'

# 缓存配置
CACHE_TTL = 300  # 5 分钟缓存时间
```

### 7.2 静态资源配置
- **CSS**: `static/css/style-v2.css` (深色主题，响应式设计)
- **JavaScript**: `static/js/app.js` (前端交互逻辑)
- **图片资源**: `static/images/` 目录下各种图片文件

### 7.3 服务配置
- **Nginx**: 配置反向代理到 5001 端口
- **SSL 证书**: 使用 Let's Encrypt 证书，位于 `/etc/letsencrypt/live/`
- **域名**: 
  - `display.galaxystream.online` (主域名)
  - `show.galaxystream.online` (历史别名)

### 7.4 子代理配置
系统预定义的子代理配置：

```python
AGENTS = [
    {"id": "11", "name": "十一", "role": "主代理", "specialties": "统筹协调"},
    {"id": "12", "name": "十二", "role": "设计师 + 画图师", "specialties": "UI/UX、配色、图像创作"},
    {"id": "13", "name": "十三", "role": "代码工程师", "specialties": "Web 开发、API"},
    {"id": "14", "name": "十四", "role": "系统状态管理员", "specialties": "内容记录、文档维护"},
]

MODELS = [
    {"name": "qwen3.5-plus", "type": "通用对话"},
    {"name": "qwen3-coder-plus", "type": "代码生成"},
]
```

### 7.5 域名配置
系统管理的域名及其状态：

```python
DOMAINS = [
    {"domain": "galaxystream.online", "type": "主域名", "enabled": True, "config": "SSL 证书"},
    {"domain": "diary.galaxystream.online", "type": "子域名", "enabled": True, "config": "成长日记 (Flask)"},
    {"domain": "display.galaxystream.online", "type": "子域名", "enabled": True, "config": "展示系统 (Flask) - 文档 + 状态 + 日记集成"},
    {"domain": "show.galaxystream.online", "type": "子域名", "enabled": True, "config": "展示系统 (同 display，已更名)"},
    {"domain": "gateway.galaxystream.online", "type": "子域名", "enabled": False, "config": "已停用 (安全回退)"},
]
```

---

## 8. 相关文档

- [README.md](README.md) - 系统简介
- [DEPLOY_CHECKLIST.md](DEPLOY_CHECKLIST.md) - 部署检查清单
- [deploy.sh](deploy.sh) - 部署脚本

---

*本文档由 Claude Code 分析生成 | 最后更新：2026-03-06*
