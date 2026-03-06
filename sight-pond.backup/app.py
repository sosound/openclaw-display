#!/usr/bin/env python3
"""
Sight Pond - 系统状态展示应用
域名：show.galaxystream.online
展示：图片集 + 系统状态（模型、子代理、域名配置等）
"""

from flask import Flask, render_template, jsonify
import os
import subprocess
from datetime import datetime
import logging

# 导入配置
from config import (
    APP_HOST, APP_PORT, DEBUG_MODE,
    WORKSPACE, SHOW_DIR, TEMPLATES_DIR, STATIC_DIR, IMAGES_DIR,
    LOG_LEVEL, LOG_FORMAT, LOG_DATE_FORMAT,
    CACHE_TTL_SYSTEM_INFO, CACHE_TTL_SERVICE_STATUS, CACHE_TTL_SSL_STATUS,
    SSL_CERT_DIR, AGENTS, MODELS, DOMAINS, IMAGE_GALLERY, SERVICES
)

# 初始化 Flask 应用
app = Flask(__name__, template_folder=TEMPLATES_DIR, static_folder=STATIC_DIR)

# 配置日志
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL),
    format=LOG_FORMAT,
    datefmt=LOG_DATE_FORMAT
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
            "workspace": WORKSPACE,
            "updated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
        
        cache.set('system_info', data, CACHE_TTL_SYSTEM_INFO)
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
    
    cache.set('service_status', services, CACHE_TTL_SERVICE_STATUS)
    return services

def get_agents():
    """获取子代理列表"""
    return AGENTS

def get_services():
    """获取服务健康状态"""
    return SERVICES

def get_models():
    """获取可用模型列表"""
    return MODELS

def get_domains():
    """获取域名配置"""
    return DOMAINS

def get_ssl_status():
    """获取 SSL 证书状态（带缓存）"""
    cached = cache.get('ssl_status')
    if cached:
        return cached
    
    ssl_certs = []
    
    try:
        if os.path.exists(SSL_CERT_DIR):
            for domain in os.listdir(SSL_CERT_DIR):
                cert_path = os.path.join(SSL_CERT_DIR, domain, "fullchain.pem")
                if os.path.exists(cert_path):
                    result = subprocess.run(
                        ['openssl', 'x509', '-in', cert_path, '-noout', '-dates'],
                        capture_output=True, text=True
                    )
                    lines = result.stdout.strip().split('\n')
                    valid_until = lines[1].replace('notAfter=', '') if len(lines) > 1 else 'Unknown'
                    
                    try:
                        until_date = datetime.strptime(valid_until, "%b %d %H:%M:%S %Y %Z")
                        days_left = (until_date - datetime.now()).days
                    except:
                        days_left = 0
                    
                    ssl_certs.append({
                        "domain": domain,
                        "valid_until": valid_until,
                        "days_left": days_left
                    })
    except Exception as e:
        logger.error(f"获取 SSL 证书状态失败：{e}")
    
    cache.set('ssl_status', ssl_certs, CACHE_TTL_SSL_STATUS)
    return ssl_certs

def get_images():
    """获取图片集"""
    return IMAGE_GALLERY

# ==================== 路由 ====================

@app.route('/')
def index():
    """系统状态页面"""
    logger.info("访问系统状态页面")
    return render_template('index.html')

@app.route('/api/status')
def api_status():
    """API: 获取完整系统状态"""
    try:
        services = get_services()
        
        # 生成服务健康摘要
        total_services = len(services)
        ok_services = sum(1 for s in services if s['status'] == 'ok')
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
            "agents": get_agents(),
            "models": get_models(),
            "domains": get_domains(),
            "ssl": get_ssl_status(),
            "images": get_images(),
            "last_updated": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
        return jsonify(data)
    except Exception as e:
        logger.error(f"API 状态查询失败：{e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/health')
def api_health():
    """API: 健康检查"""
    return jsonify({"status": "healthy", "timestamp": datetime.now().isoformat()})

# ==================== 应用入口 ====================

if __name__ == '__main__':
    logger.info(f"启动系统状态应用 on {APP_HOST}:{APP_PORT}")
    app.run(host=APP_HOST, port=APP_PORT, debug=DEBUG_MODE)
