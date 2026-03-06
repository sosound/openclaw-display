# 展示系统 (Display System) 部署检查清单

## 📋 部署前检查

### 文件完整性

- [ ] `app.py` - 主应用文件
- [ ] `templates/index.html` - 主页模板
- [ ] `templates/docs.html` - 文档中心模板
- [ ] `static/css/style-v2.css` - 样式文件
- [ ] `static/js/app.js` - 前端脚本
- [ ] `docs/` - 文档目录（至少包含 README.md）
- [ ] `images/` - 图片目录（可选）

### 系统状态

- [ ] 端口 5001 未被占用
- [ ] Python 3 可用 (`python3 --version`)
- [ ] Flask 已安装 (`python3 -c "import flask"`)
- [ ] systemd 可用（如果使用 systemd 服务）

### 快速检查命令

```bash
# 检查必需文件
ls -la /root/.openclaw/workspace/show/app.py
ls -la /root/.openclaw/workspace/show/templates/index.html
ls -la /root/.openclaw/workspace/show/templates/docs.html
ls -la /root/.openclaw/workspace/show/static/css/style-v2.css

# 检查端口
lsof -i :5001

# 检查 Flask
python3 -c "import flask; print(flask.__version__)"
```

---

## 🚀 部署流程

### 方法一：使用部署脚本（推荐）

```bash
cd /root/.openclaw/workspace/show
./deploy.sh restart
```

### 方法二：手动部署

```bash
# 1. 停止旧服务
systemctl stop show-galaxy 2>/dev/null || pkill -f "python3.*show.*app.py"

# 2. 验证文件
cd /root/.openclaw/workspace/show
./deploy.sh status

# 3. 启动服务
systemctl start show-galaxy

# 4. 验证
curl -I http://localhost:5001/api/health
```

---

## ✅ 部署后验证

### 基础检查

- [ ] 服务进程运行中
- [ ] 端口 5001 监听中
- [ ] 日志无 ERROR

### HTTP 检查

```bash
# 健康检查
curl -s http://localhost:5001/api/health | python3 -m json.tool

# 主页
curl -s -o /dev/null -w "%{http_code}" http://localhost:5001/
# 应返回 200

# 文档中心
curl -s -o /dev/null -w "%{http_code}" http://localhost:5001/docs
# 应返回 200

# API 状态
curl -s http://localhost:5001/api/status | python3 -m json.tool | head -20
```

### 浏览器访问

- [ ] https://show.galaxystream.online 可访问
- [ ] 页面正常渲染
- [ ] 文档中心可访问
- [ ] 无 404/500 错误

---

## 🔧 故障排查

### 服务无法启动

```bash
# 查看日志
journalctl -u show-galaxy -f

# 或查看应用日志
cat /tmp/show.log | tail -50
```

### 常见错误

| 错误 | 原因 | 解决方案 |
|------|------|----------|
| `TemplateNotFound` | 模板文件缺失 | 检查 `templates/` 目录 |
| `Address already in use` | 端口被占用 | `lsof -i :5001` 查找并终止进程 |
| `ModuleNotFoundError: flask` | Flask 未安装 | `pip3 install flask` |
| 启动自检失败 | 必需文件缺失 | 运行 `./deploy.sh` 检查 |

### 回滚流程

```bash
# 1. 停止服务
systemctl stop show-galaxy

# 2. 恢复备份
cd /root/.openclaw/workspace
cp -r show.backup.* show

# 3. 重启服务
systemctl start show-galaxy

# 4. 验证
curl http://localhost:5001/api/health
```

---

## 📝 变更记录

| 日期 | 操作 | 操作人 | 备注 |
|------|------|--------|------|
| 2026-03-06 | 初始部署 | 十一 | 系统重构后 |

---

## 📞 相关文档

- [README.md](README.md) - 系统说明
- [DEPLOY_CHECKLIST.md](DEPLOY_CHECKLIST.md) - 本文件
- [deploy.sh](deploy.sh) - 部署脚本
- Systemd 服务：`/etc/systemd/system/show-galaxy.service`
