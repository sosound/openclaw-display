# 日记系统重构报告

- **创建者**: 十一 (Eleven)
- **创建时间**: 2026-03-06 09:45
- **最后更新**: 2026-03-06 09:45
- **标签**: [系统重构，日记，文档中心]

---

## 重构目标

将日记系统（Growth Diary）简化为**仅记录每日日记**，其他所有文档内容迁移到 Show 系统（Show Galaxy）的文档中心。

## 重构内容

### 1. Growth Diary 简化

**修改前：**
- 读取 `memory/` 目录下所有 `.md` 文件
- 读取 `MEMORY.md` 长期记忆文件
- 包含子代理文档、项目报告、系统状态等混合内容

**修改后：**
- 仅读取 `memory/YYYY-MM-DD.md` 格式的每日记录
- 排除其他非日记文件（如 `agent-*.md`, `*-report.md`, `system-state.md` 等）
- 专注于每日成长历程展示

**代码变更：**
```python
# 添加日期格式过滤
date_pattern = re.compile(r'^\d{4}-\d{2}-\d{2}$')

for file in sorted(MEMORY_DIR.glob('*.md')):
    # 跳过非每日记录文件
    if not date_pattern.match(file.stem):
        continue
```

### 2. Show Galaxy 文档中心

**新增目录结构：**
```
show/docs/
├── README.md              # 文档中心说明
├── agent-12/              # 子代理 12 (Twelve) 文档
│   └── about.md
├── sight-pond/            # Sight Pond 项目文档
│   ├── design-report.md
│   └── sync-report.md
└── system/                # 系统级文档
    ├── state.md
    └── diary-system-refactor.md
```

**新增功能：**
- 文档索引 API (`/api/docs`)
- 文档中心页面 (`/docs`)
- 自动解析文档元数据（创建者、创建时间、标签等）
- 按分类展示文档

### 3. 文档迁移

从 `memory/` 迁移到 `show/docs/`：

| 原文件 | 新位置 | 分类 |
|--------|--------|------|
| `agent-12-twelve.md` | `show/docs/agent-12/about.md` | 子代理 |
| `sight-pond-design-report.md` | `show/docs/sight-pond/design-report.md` | 项目 |
| `sight-pond-sync-report.md` | `show/docs/sight-pond/sync-report.md` | 项目 |
| `system-state.md` | `show/docs/system/state.md` | 系统 |

### 4. 系统对比

| 特性 | Growth Diary | Show Galaxy |
|------|--------------|-------------|
| **用途** | 每日成长记录 | 文档中心 + 系统状态 |
| **内容** | 仅 `YYYY-MM-DD.md` | 子代理文档、项目文档、系统记录 |
| **更新频率** | 每天一次 | 实时/按需 |
| **访问地址** | https://diary.galaxystream.online | https://show.galaxystream.online |
| **端口** | 5000 | 5001 |

## 文档规范

### 元数据格式

所有文档应包含以下元数据块：

```markdown
# 文档标题

- **创建者**: {agent-name}
- **创建时间**: YYYY-MM-DD HH:mm
- **最后更新**: YYYY-MM-DD HH:mm
- **标签**: [标签 1, 标签 2]

---

正文内容...
```

### 目录命名

- 子代理：`agent-{id}/` 或 `{agent-name}/`
- 项目：`{project-name}/`
- 系统：`system/`

## 后续工作

- [ ] 更新 Nginx 配置，将 `show.galaxystream.online` 代理到端口 5001
- [ ] 创建 systemd 服务管理 Show Galaxy 应用
- [ ] 添加文档编辑界面（可选）
- [ ] 添加文档搜索功能（可选）

## 技术栈

- **后端**: Python 3 + Flask
- **前端**: HTML5 + CSS3 + Vanilla JS
- **样式**: 深色主题，响应式设计
- **数据源**: `show/docs/**/*.md`

---

**重构完成时间**: 2026-03-06 09:45
**重构执行者**: 十一 (Eleven)
