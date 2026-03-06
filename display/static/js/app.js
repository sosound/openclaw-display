/**
 * 系统状态展示应用 - 前端 JavaScript
 * 负责数据加载、渲染和交互逻辑
 */

// ==================== 标签页切换 ====================
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    event.target.classList.add('active');
}

// ==================== 数据加载 ====================
async function loadAllData() {
    try {
        const response = await fetch('/api/status');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        renderHealthSummary(data.health_summary);
        renderSystemInfo(data.system);
        renderServiceHealth(data.services);
        renderAgents(data.agents);
        renderModels(data.models);
        renderDomains(data.domains);
        renderSSL(data.ssl);
        renderGallery(data.images);
        
        // 更新最后更新时间
        const lastUpdated = document.getElementById('last-updated');
        if (lastUpdated && data.last_updated) {
            lastUpdated.textContent = '最后更新：' + data.last_updated;
        }
    } catch (error) {
        console.error('加载数据失败:', error);
        showError('加载数据失败，请稍后重试');
    }
}

// ==================== 错误处理 ====================
function showError(message) {
    console.error(message);
}

// ==================== 渲染函数 ====================

function renderHealthSummary(health) {
    if (!health) return;
    
    const statusEmoji = health.status === 'healthy' ? '✅' : health.status === 'degraded' ? '⚠️' : '❌';
    const statusColor = health.status === 'healthy' ? '#22c55e' : health.status === 'degraded' ? '#fbbf24' : '#f87171';
    
    const html = `
        <div class="status-item" style="border-left-color: ${statusColor};">
            <div class="status-label">健康状态</div>
            <div class="status-value">${statusEmoji} ${health.status.toUpperCase()}</div>
        </div>
        <div class="status-item">
            <div class="status-label">健康分数</div>
            <div class="status-value">${health.score}%</div>
        </div>
        <div class="status-item">
            <div class="status-label">正常服务</div>
            <div class="status-value">${health.ok}/${health.total}</div>
        </div>
        <div class="status-item">
            <div class="status-label">最后检查</div>
            <div class="status-value">${health.last_check}</div>
        </div>
    `;
    document.getElementById('health-summary').innerHTML = html;
}

function renderServiceHealth(services) {
    if (!services || services.length === 0) {
        document.getElementById('service-health').innerHTML = 
            '<div class="status-item"><div class="status-value">暂无服务</div></div>';
        return;
    }
    
    const html = services.map(s => `
        <div class="status-item ${s.status === 'ok' ? '' : 'warning'}">
            <div class="status-label">${s.name}</div>
            <div class="status-value">
                ${s.status === 'ok' ? '✅' : '⚠️'}
            </div>
        </div>
    `).join('');
    document.getElementById('service-health').innerHTML = html;
}

function renderSystemInfo(system) {
    if (!system || system.error) {
        document.getElementById('system-info').innerHTML = 
            '<div class="status-item error"><div class="status-value">获取系统信息失败</div></div>';
        return;
    }
    
    const html = `
        <div class="status-item">
            <div class="status-label">主机名</div>
            <div class="status-value">${system.hostname || 'N/A'}</div>
        </div>
        <div class="status-item">
            <div class="status-label">操作系统</div>
            <div class="status-value">${Array.isArray(system.os) ? system.os.join(' ') : (system.os || 'N/A')}</div>
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
    if (!services || services.length === 0) {
        document.getElementById('service-status').innerHTML = 
            '<div class="status-item"><div class="status-value">暂无服务状态</div></div>';
        return;
    }
    
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
    const tbody = document.getElementById('agents-table').querySelector('tbody');
    
    if (!agents || agents.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="loading">暂无子代理</td></tr>';
        return;
    }
    
    const html = agents.map(a => `
        <tr>
            <td>${a.id || '-'}</td>
            <td>${a.name}</td>
            <td>${a.role}</td>
            <td>${a.specialties || '-'}</td>
        </tr>
    `).join('');
    tbody.innerHTML = html;
}

function renderModels(models) {
    const tbody = document.getElementById('models-table').querySelector('tbody');
    
    if (!models || models.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="loading">暂无模型</td></tr>';
        return;
    }
    
    const html = models.map(m => `
        <tr>
            <td>${m.name}</td>
            <td>${m.type}</td>
            <td><span class="badge badge-success">可用</span></td>
        </tr>
    `).join('');
    tbody.innerHTML = html;
}

function renderDomains(domains) {
    const tbody = document.getElementById('domains-table').querySelector('tbody');
    
    if (!domains || domains.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="loading">暂无域名配置</td></tr>';
        return;
    }
    
    const html = domains.map(d => `
        <tr>
            <td>${d.domain}</td>
            <td>${d.type}</td>
            <td><span class="badge badge-${d.enabled ? 'success' : 'warning'}">${d.enabled ? '启用' : '停用'}</span></td>
            <td>${d.config || '-'}</td>
        </tr>
    `).join('');
    tbody.innerHTML = html;
}

function renderSSL(ssl) {
    const container = document.getElementById('ssl-status');
    
    if (!ssl || ssl.length === 0) {
        container.innerHTML = '<div class="status-item"><div class="status-value">暂无 SSL 证书</div></div>';
        return;
    }
    
    const html = ssl.map(s => `
        <div class="status-item ${s.days_left < 30 ? 'warning' : ''}">
            <div class="status-label">${s.domain}</div>
            <div class="status-value">${s.valid_until}</div>
            <div class="status-label" style="margin-top: 0.5rem;">
                剩余 ${s.days_left} 天 ${s.days_left < 30 ? '⚠️' : '✅'}
            </div>
        </div>
    `).join('');
    container.innerHTML = html;
}

function renderGallery(images) {
    const gallery = document.getElementById('gallery-container');
    const emptyState = document.getElementById('gallery-empty');
    
    if (!images || images.length === 0) {
        gallery.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }
    
    emptyState.style.display = 'none';
    
    const html = images.map((img, index) => `
        <div class="image-card">
            <img src="${img.src}" alt="${img.name}" loading="lazy" onerror="this.style.display='none'">
            <div class="image-info">
                <div class="image-name">${img.name}</div>
                <div class="image-meta">${img.size} · ${img.date}</div>
                <a href="${img.src}" download class="download-btn">⬇️ 下载</a>
            </div>
        </div>
    `).join('');
    gallery.innerHTML = html;
}

// ==================== 初始化 ====================
document.addEventListener('DOMContentLoaded', function() {
    loadAllData();
    setInterval(loadAllData, 30000);
    console.log('系统状态面板已初始化');
});
