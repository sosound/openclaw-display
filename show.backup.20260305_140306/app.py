#!/usr/bin/env python3
"""
系统状态展示应用 - show.galaxystream.online
展示：图片集 + 系统状态（模型、子代理、域名配置等）
"""

from flask import Flask, render_template_string, jsonify
import os
import json
import subprocess
from datetime import datetime

app = Flask(__name__)

# 工作目录
WORKSPACE = "/root/.openclaw/workspace"
SHOW_DIR = os.path.join(WORKSPACE, "show")

# 系统状态 HTML 模板
SYSTEM_STATUS_TEMPLATE = """
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>十一的系统状态</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            min-height: 100vh;
            background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            padding: 2rem;
        }
        .container { max-width: 1400px; margin: 0 auto; }
        header {
            text-align: center;
            margin-bottom: 2rem;
            color: white;
        }
        header h1 { font-size: 2.5rem; margin-bottom: 0.5rem; text-shadow: 0 2px 10px rgba(0,0,0,0.2); }
        header p { color: rgba(255,255,255,0.8); font-size: 1.1rem; }
        
        /* 导航标签 */
        .tabs {
            display: flex;
            gap: 1rem;
            margin-bottom: 2rem;
            justify-content: center;
        }
        .tab-btn {
            padding: 0.75rem 1.5rem;
            background: rgba(255,255,255,0.1);
            color: white;
            border: 1px solid rgba(255,255,255,0.2);
            border-radius: 0.5rem;
            cursor: pointer;
            font-size: 1rem;
            transition: all 0.3s ease;
        }
        .tab-btn:hover { background: rgba(255,255,255,0.2); }
        .tab-btn.active { background: rgba(255,255,255,0.3); border-color: white; }
        
        /* 内容区域 */
        .tab-content { display: none; }
        .tab-content.active { display: block; }
        
        /* 卡片样式 */
        .card {
            background: rgba(255,255,255,0.1);
            backdrop-filter: blur(10px);
            border-radius: 1rem;
            padding: 1.5rem;
            margin-bottom: 1.5rem;
            border: 1px solid rgba(255,255,255,0.2);
        }
        .card h2 {
            color: white;
            font-size: 1.5rem;
            margin-bottom: 1rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        /* 状态网格 */
        .status-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 1rem;
        }
        .status-item {
            background: rgba(255,255,255,0.05);
            padding: 1rem;
            border-radius: 0.5rem;
            border-left: 4px solid #4ade80;
        }
        .status-item.warning { border-left-color: #fbbf24; }
        .status-item.error { border-left-color: #f87171; }
        .status-label { color: rgba(255,255,255,0.7); font-size: 0.85rem; margin-bottom: 0.25rem; }
        .status-value { color: white; font-size: 1.1rem; font-weight: 600; }
        
        /* 表格样式 */
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 1rem;
        }
        th, td {
            padding: 0.75rem;
            text-align: left;
            border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        th { color: rgba(255,255,255,0.8); font-weight: 600; }
        td { color: white; }
        tr:hover { background: rgba(255,255,255,0.05); }
        
        /* 徽章 */
        .badge {
            display: inline-block;
            padding: 0.25rem 0.75rem;
            border-radius: 9999px;
            font-size: 0.75rem;
            font-weight: 600;
        }
        .badge-success { background: #22c55e; color: white; }
        .badge-warning { background: #fbbf24; color: black; }
        .badge-info { background: #3b82f6; color: white; }
        
        /* 刷新按钮 */
        .refresh-btn {
            position: fixed;
            bottom: 2rem;
            right: 2rem;
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: rgba(255,255,255,0.2);
            border: 2px solid rgba(255,255,255,0.3);
            color: white;
            font-size: 1.5rem;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .refresh-btn:hover {
            background: rgba(255,255,255,0.3);
            transform: rotate(180deg);
        }
        
        /* 加载动画 */
        .loading {
            text-align: center;
            color: white;
            padding: 2rem;
        }
        .spinner {
            display: inline-block;
            width: 40px;
            height: 40px;
            border: 4px solid rgba(255,255,255,0.3);
            border-top-color: white;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>🔟 十一的系统状态</h1>
            <p>System Status Dashboard</p>
        </header>
        
        <div class="tabs">
            <button class="tab-btn active" onclick="switchTab('overview')">📊 总览</button>
            <button class="tab-btn" onclick="switchTab('agents')">🤖 子代理</button>
            <button class="tab-btn" onclick="switchTab('models')">🧠 模型</button>
            <button class="tab-btn" onclick="switchTab('domains')">🌐 域名配置</button>
            <button class="tab-btn" onclick="switchTab('ssl')">🔒 SSL 证书</button>
        </div>
        
        <div id="overview" class="tab-content active">
            <div class="card">
                <h2>🖥️ 系统信息</h2>
                <div class="status-grid" id="system-info">
                    <div class="loading"><div class="spinner"></div><p>加载中...</p></div>
                </div>
            </div>
            <div class="card">
                <h2>📈 服务状态</h2>
                <div class="status-grid" id="service-status">
                    <div class="loading"><div class="spinner"></div><p>加载中...</p></div>
                </div>
            </div>
        </div>
        
        <div id="agents" class="tab-content">
            <div class="card">
                <h2>🤖 子代理列表</h2>
                <table id="agents-table">
                    <thead>
                        <tr>
                            <th>编号</th>
                            <th>名字</th>
                            <th>角色</th>
                            <th>状态</th>
                            <th>最后活动</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr><td colspan="5" class="loading">加载中...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
        
        <div id="models" class="tab-content">
            <div class="card">
                <h2>🧠 可用模型</h2>
                <table id="models-table">
                    <thead>
                        <tr>
                            <th>模型名称</th>
                            <th>类型</th>
                            <th>状态</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr><td colspan="3" class="loading">加载中...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
        
        <div id="domains" class="tab-content">
            <div class="card">
                <h2>🌐 域名配置</h2>
                <table id="domains-table">
                    <thead>
                        <tr>
                            <th>域名</th>
                            <th>类型</th>
                            <th>状态</th>
                            <th>配置</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr><td colspan="4" class="loading">加载中...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
        
        <div id="ssl" class="tab-content">
            <div class="card">
                <h2>🔒 SSL 证书状态</h2>
                <div class="status-grid" id="ssl-status">
                    <div class="loading"><div class="spinner"></div><p>加载中...</p></div>
                </div>
            </div>
        </div>
        
        <button class="refresh-btn" onclick="loadAllData()" title="刷新">🔄</button>
    </div>
    
    <script>
        function switchTab(tabId) {
            document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
            document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
            document.getElementById(tabId).classList.add('active');
            event.target.classList.add('active');
        }
        
        async function loadAllData() {
            try {
                const response = await fetch('/api/status');
                const data = await response.json();
                renderSystemInfo(data.system);
                renderServiceStatus(data.services);
                renderAgents(data.agents);
                renderModels(data.models);
                renderDomains(data.domains);
                renderSSL(data.ssl);
            } catch (error) {
                console.error('加载数据失败:', error);
            }
        }
        
        function renderSystemInfo(system) {
            const html = `
                <div class="status-item">
                    <div class="status-label">主机名</div>
                    <div class="status-value">${system.hostname || 'N/A'}</div>
                </div>
                <div class="status-item">
                    <div class="status-label">操作系统</div>
                    <div class="status-value">${system.os || 'N/A'}</div>
                </div>
                <div class="status-item">
                    <div class="status-label">Node 版本</div>
                    <div class="status-value">${system.node || 'N/A'}</div>
                </div>
                <div class="status-item">
                    <div class="status-label">当前模型</div>
                    <div class="status-value">${system.model || 'N/A'}</div>
                </div>
                <div class="status-item">
                    <div class="status-label">工作目录</div>
                    <div class="status-value">${system.workspace || 'N/A'}</div>
                </div>
                <div class="status-item">
                    <div class="status-label">更新时间</div>
                    <div class="status-value">${system.updated_at || 'N/A'}</div>
                </div>
            `;
            document.getElementById('system-info').innerHTML = html;
        }
        
        function renderServiceStatus(services) {
            const html = services.map(s => `
                <div class="status-item ${s.status === 'running' ? '' : 'warning'}">
                    <div class="status-label">${s.name}</div>
                    <div class="status-value">
                        <span class="badge badge-${s.status === 'running' ? 'success' : 'warning'}">
                            ${s.status === 'running' ? '✓ 运行中' : '⚠ ' + s.status}
                        </span>
                    </div>
                </div>
            `).join('');
            document.getElementById('service-status').innerHTML = html;
        }
        
        function renderAgents(agents) {
            const html = agents.map(a => `
                <tr>
                    <td>${a.id || '-'}</td>
                    <td>${a.name}</td>
                    <td>${a.role}</td>
                    <td><span class="badge badge-${a.status === 'active' ? 'success' : 'info'}">${a.status}</span></td>
                    <td>${a.last_active || '-'}</td>
                </tr>
            `).join('');
            document.getElementById('agents-table').querySelector('tbody').innerHTML = html;
        }
        
        function renderModels(models) {
            const html = models.map(m => `
                <tr>
                    <td>${m.name}</td>
                    <td>${m.type}</td>
                    <td><span class="badge badge-success">可用</span></td>
                </tr>
            `).join('');
            document.getElementById('models-table').querySelector('tbody').innerHTML = html;
        }
        
        function renderDomains(domains) {
            const html = domains.map(d => `
                <tr>
                    <td>${d.domain}</td>
                    <td>${d.type}</td>
                    <td><span class="badge badge-${d.enabled ? 'success' : 'warning'}">${d.enabled ? '启用' : '停用'}</span></td>
                    <td>${d.config || '-'}</td>
                </tr>
            `).join('');
            document.getElementById('domains-table').querySelector('tbody').innerHTML = html;
        }
        
        function renderSSL(ssl) {
            const html = ssl.map(s => `
                <div class="status-item ${s.days_left < 30 ? 'warning' : ''}">
                    <div class="status-label">${s.domain}</div>
                    <div class="status-value">${s.valid_until}</div>
                    <div class="status-label" style="margin-top: 0.5rem;">
                        剩余 ${s.days_left} 天 ${s.days_left < 30 ? '⚠️' : '✅'}
                    </div>
                </div>
            `).join('');
            document.getElementById('ssl-status').innerHTML = html;
        }
        
        // 页面加载时获取数据
        loadAllData();
        // 每 30 秒自动刷新
        setInterval(loadAllData, 30000);
    </script>
</body>
</html>
"""

def get_system_info():
    """获取系统信息"""
    try:
        # 获取主机名
        hostname = subprocess.check_output(['hostname']).decode().strip()
        
        # 获取系统信息
        os_info = subprocess.check_output(['uname', '-a']).decode().strip()
        
        # 获取 Node 版本
        node_version = subprocess.check_output(['node', '--version']).decode().strip()
        
        return {
            "hostname": hostname,
            "os": os_info.split()[0:3],
            "node": node_version,
            "model": "qwen3.5-plus",
            "workspace": WORKSPACE,
            "updated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
    except Exception as e:
        return {"error": str(e)}

def get_service_status():
    """获取服务状态"""
    services = []
    
    # 检查 Nginx
    try:
        result = subprocess.run(['systemctl', 'is-active', 'nginx'], capture_output=True, text=True)
        services.append({
            "name": "Nginx",
            "status": "running" if result.stdout.strip() == "active" else result.stdout.strip()
        })
    except:
        services.append({"name": "Nginx", "status": "unknown"})
    
    # 检查 OpenClaw Gateway
    try:
        result = subprocess.run(['pgrep', '-f', 'openclaw.*gateway'], capture_output=True, text=True)
        services.append({
            "name": "OpenClaw Gateway",
            "status": "running" if result.stdout.strip() else "stopped"
        })
    except:
        services.append({"name": "OpenClaw Gateway", "status": "unknown"})
    
    return services

def get_agents():
    """获取子代理列表"""
    # 固定的子代理信息
    agents = [
        {"id": "11", "name": "十一 (Eleven)", "role": "主代理", "status": "active", "last_active": "现在"},
        {"id": "12", "name": "十二", "role": "画图子代理", "status": "idle", "last_active": "-"},
        {"id": "13", "name": "十三", "role": "代码子代理", "status": "idle", "last_active": "-"},
        {"id": "14", "name": "十四", "role": "系统状态管理员", "status": "active", "last_active": "现在"},
    ]
    return agents

def get_models():
    """获取可用模型列表"""
    models = [
        {"name": "qwen3.5-plus", "type": "通用对话"},
        {"name": "qwen3-coder-plus", "type": "代码生成"},
    ]
    return models

def get_domains():
    """获取域名配置"""
    domains = [
        {"domain": "galaxystream.online", "type": "主域名", "enabled": True, "config": "SSL 证书"},
        {"domain": "diary.galaxystream.online", "type": "子域名", "enabled": True, "config": "成长日记 (Flask)"},
        {"domain": "show.galaxystream.online", "type": "子域名", "enabled": True, "config": "系统状态 + 图片集"},
        {"domain": "gateway.galaxystream.online", "type": "子域名", "enabled": False, "config": "已停用 (安全回退)"},
    ]
    return domains

def get_ssl_status():
    """获取 SSL 证书状态"""
    ssl_certs = []
    cert_dir = "/etc/letsencrypt/live"
    
    if os.path.exists(cert_dir):
        for domain in os.listdir(cert_dir):
            cert_path = os.path.join(cert_dir, domain, "fullchain.pem")
            if os.path.exists(cert_path):
                try:
                    result = subprocess.run(
                        ['openssl', 'x509', '-in', cert_path, '-noout', '-dates'],
                        capture_output=True, text=True
                    )
                    lines = result.stdout.strip().split('\n')
                    valid_until = lines[1].replace('notAfter=', '') if len(lines) > 1 else 'Unknown'
                    
                    # 计算剩余天数
                    from datetime import datetime
                    until_date = datetime.strptime(valid_until, "%b %d %H:%M:%S %Y %Z")
                    days_left = (until_date - datetime.now()).days
                    
                    ssl_certs.append({
                        "domain": domain,
                        "valid_until": valid_until,
                        "days_left": days_left
                    })
                except Exception as e:
                    ssl_certs.append({
                        "domain": domain,
                        "valid_until": "Unknown",
                        "days_left": 0
                    })
    
    return ssl_certs

@app.route('/')
def index():
    """系统状态页面"""
    return render_template_string(SYSTEM_STATUS_TEMPLATE)

@app.route('/api/status')
def api_status():
    """API: 获取完整系统状态"""
    return jsonify({
        "system": get_system_info(),
        "services": get_service_status(),
        "agents": get_agents(),
        "models": get_models(),
        "domains": get_domains(),
        "ssl": get_ssl_status()
    })

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5001, debug=False)
