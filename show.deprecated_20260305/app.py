#!/usr/bin/env python3
"""
Show Galaxy - 文档与展示中心
展示：图片集 + 系统状态 + 文档中心（子代理文档）
"""

from flask import Flask, render_template, jsonify
import os
import subprocess
from datetime import datetime
import logging
from pathlib import Path

# 初始化 Flask 应用
app = Flask(__name__)

# 配置
WORKSPACE = Path('/root/.openclaw/workspace')
SHOW_DIR = WORKSPACE / 'show'
DOCS_DIR = SHOW_DIR / 'docs'
IMAGES_DIR = SHOW_DIR / 'images'

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ==================== 简单缓存实现 ====================

class SimpleCache:
    """简单内存缓存"""
    def __init__(self):
        self._cache = {}
    
    def get(self, key):
        """获取缓存值"""
        if key in self._cache:
            data, timestamp, ttl = self._cache[key]
            if (datetime.now().timestamp() - timestamp) < ttl:
                return data
            else:
                del self._cache[key]
        return None
    
    def set(self, key, data, ttl):
        """设置缓存值"""
        self._cache[key] = (data, datetime.now().timestamp(), ttl)

cache = SimpleCache()
CACHE_TTL = 300  # 5 分钟缓存

# ==================== 数据获取函数 ====================

def get_system_info():
    """获取系统信息（带缓存）"""
    cached = cache.get('system_info')
    if cached:
        return cached
    
    try:
        hostname = subprocess.check_output(['hostname']).decode().strip()
        os_info = subprocess.check_output(['uname', '-a']).decode().strip()
        node_version = subprocess.check_output(['node', '--version']).decode().strip()
        
        data = {
            "hostname": hostname,
            "os": os_info.split()[0:3],
            "node": node_version,
            "model": "qwen3.5-plus",
            "workspace": str(WORKSPACE),
            "updated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
        
        cache.set('system_info', data, CACHE_TTL)
        return data
    except Exception as e:
        logger.error(f"获取系统信息失败：{e}")
        return {"error": str(e)}

def get_service_status():
    """获取服务状态（带缓存）"""
    cached = cache.get('service_status')
    if cached:
        return cached
    
    services = []
    
    try:
        result = subprocess.run(['systemctl', 'is-active', 'nginx'], capture_output=True, text=True)
        services.append({
            "name": "Nginx",
            "status": "running" if result.stdout.strip() == "active" else result.stdout.strip()
        })
    except Exception as e:
        logger.warning(f"检查 Nginx 状态失败：{e}")
        services.append({"name": "Nginx", "status": "unknown"})
    
    try:
        result = subprocess.run(['pgrep', '-f', 'openclaw.*gateway'], capture_output=True, text=True)
        services.append({
            "name": "OpenClaw Gateway",
            "status": "running" if result.stdout.strip() else "stopped"
        })
    except Exception as e:
        logger.warning(f"检查 Gateway 状态失败：{e}")
        services.append({"name": "OpenClaw Gateway", "status": "unknown"})
    
    cache.set('service_status', services, CACHE_TTL)
    return services

def get_docs_index():
    """获取文档中心索引"""
    docs = []
    
    if not DOCS_DIR.exists():
        return docs
    
    # 遍历文档目录
    for category in DOCS_DIR.iterdir():
        if not category.is_dir() or category.name.startswith('.'):
            continue
        
        category_docs = []
        for doc_file in category.glob('*.md'):
            try:
                content = doc_file.read_text(encoding='utf-8')
                # 提取标题（第一行 # 标题）
                title = doc_file.stem
                for line in content.split('\n')[:5]:
                    if line.startswith('# '):
                        title = line[2:].strip()
                        break
                
                # 提取元数据
                metadata = {
                    'name': doc_file.stem,
                    'title': title,
                    'path': f"/docs/{category.name}/{doc_file.name}",
                    'category': category.name,
                    'updated_at': datetime.fromtimestamp(doc_file.stat().st_mtime).strftime("%Y-%m-%d %H:%M:%S")
                }
                
                # 解析元数据块
                for line in content.split('\n')[:20]:
                    if line.startswith('- **创建者**:'):
                        metadata['creator'] = line.replace('- **创建者**:', '').strip()
                    elif line.startswith('- **创建时间**:'):
                        metadata['created_at'] = line.replace('- **创建时间**:', '').strip()
                    elif line.startswith('- **标签**:'):
                        metadata['tags'] = line.replace('- **标签**:', '').strip()
                
                category_docs.append(metadata)
            except Exception as e:
                logger.error(f"读取文档失败 {doc_file}: {e}")
        
        if category_docs:
            docs.append({
                'category': category.name,
                'category_title': category.name.replace('-', ' ').title(),
                'docs': category_docs
            })
    
    return docs

def get_ssl_status():
    """获取 SSL 证书状态"""
    ssl_certs = []
    ssl_dir = Path('/etc/letsencrypt/live')
    
    try:
        if ssl_dir.exists():
            for domain in ssl_dir.iterdir():
                if domain.is_dir():
                    cert_path = domain / "fullchain.pem"
                    if cert_path.exists():
                        try:
                            result = subprocess.run(
                                ['openssl', 'x509', '-in', str(cert_path), '-noout', '-dates'],
                                capture_output=True, text=True, timeout=5
                            )
                            lines = result.stdout.strip().split('\n')
                            valid_until = lines[1].replace('notAfter=', '') if len(lines) > 1 else 'Unknown'
                            
                            try:
                                until_date = datetime.strptime(valid_until, "%b %d %H:%M:%S %Y %Z")
                                days_left = (until_date - datetime.now()).days
                            except:
                                days_left = 0
                            
                            ssl_certs.append({
                                "domain": domain.name,
                                "valid_until": valid_until,
                                "days_left": days_left
                            })
                        except Exception as e:
                            logger.warning(f"读取证书失败 {domain.name}: {e}")
    except Exception as e:
        logger.error(f"获取 SSL 证书状态失败：{e}")
    
    return ssl_certs

def get_images():
    """获取图片集"""
    images = []
    
    if not IMAGES_DIR.exists():
        return images
    
    for img_file in IMAGES_DIR.glob('*'):
        if img_file.suffix.lower() in ['.png', '.jpg', '.jpeg', '.gif', '.webp']:
            images.append({
                'name': img_file.stem,
                'path': f'/images/{img_file.name}',
                'type': img_file.suffix[1:]
            })
    
    return images

# ==================== 路由 ====================

@app.route('/')
def index():
    """系统状态页面"""
    logger.info("访问系统状态页面")
    return render_template('index.html')

@app.route('/docs')
def docs():
    """文档中心页面"""
    logger.info("访问文档中心页面")
    return render_template('docs.html')

@app.route('/api/status')
def api_status():
    """API: 获取完整系统状态"""
    try:
        services = get_service_status()
        
        # 生成服务健康摘要
        total_services = len(services)
        ok_services = sum(1 for s in services if s['status'] == 'running')
        health_score = int((ok_services / total_services) * 100) if total_services > 0 else 0
        
        health_summary = {
            "score": health_score,
            "total": total_services,
            "ok": ok_services,
            "warning": total_services - ok_services,
            "status": "healthy" if health_score == 100 else "degraded" if health_score > 50 else "critical",
            "last_check": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
        
        data = {
            "system": get_system_info(),
            "services": services,
            "health_summary": health_summary,
            "docs": get_docs_index(),
            "ssl": get_ssl_status(),
            "images": get_images(),
            "last_updated": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
        return jsonify(data)
    except Exception as e:
        logger.error(f"API 状态查询失败：{e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/docs')
def api_docs():
    """API: 获取文档索引"""
    return jsonify(get_docs_index())

@app.route('/api/health')
def api_health():
    """API: 健康检查"""
    return jsonify({"status": "healthy", "timestamp": datetime.now().isoformat()})

# ==================== 应用入口 ====================

if __name__ == '__main__':
    logger.info(f"启动 Show Galaxy 应用 on 0.0.0.0:5001")
    app.run(host='0.0.0.0', port=5001, debug=True)
