#!/usr/bin/env python3
"""
展示系统 (Display System) - 原 Show Galaxy
文档与展示中心 + 日记集成
展示：图片集 + 系统状态 + 文档中心 + 日记系统（子代理文档）
"""

from flask import Flask, render_template, jsonify
import os
import sys
import subprocess
from datetime import datetime
import logging
from pathlib import Path

# 初始化 Flask 应用
app = Flask(__name__)

# 配置
WORKSPACE = Path('/root/.openclaw/workspace')
DISPLAY_DIR = WORKSPACE / 'display'
DOCS_DIR = DISPLAY_DIR / 'docs'
IMAGES_DIR = DISPLAY_DIR / 'images'
TEMPLATES_DIR = DISPLAY_DIR / 'templates'
STATIC_DIR = DISPLAY_DIR / 'static'
DIARY_DIR = WORKSPACE / 'growth-diary'
MEMORY_DIR = WORKSPACE / 'memory'

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ==================== 启动自检 ====================

def validate_startup():
    """启动时验证必需文件和目录"""
    logger.info("🔍 启动自检中...")
    
    required_dirs = [
        (TEMPLATES_DIR, "模板目录"),
        (STATIC_DIR, "静态资源目录"),
        (DOCS_DIR, "文档目录"),
    ]
    
    required_files = [
        (TEMPLATES_DIR / 'index.html', "主页模板"),
        (TEMPLATES_DIR / 'docs.html', "文档中心模板"),
        (STATIC_DIR / 'css' / 'style-v2.css', "样式文件"),
    ]
    
    all_ok = True
    
    # 检查目录
    for path, desc in required_dirs:
        if not path.exists():
            logger.error(f"❌ 必需目录缺失：{desc} ({path})")
            all_ok = False
        else:
            logger.info(f"✓ {desc}: {path}")
    
    # 检查文件
    for path, desc in required_files:
        if not path.exists():
            logger.error(f"❌ 必需文件缺失：{desc} ({path})")
            all_ok = False
        else:
            logger.info(f"✓ {desc}: {path}")
    
    if not all_ok:
        logger.error("启动自检失败，请检查缺失的文件/目录")
        sys.exit(1)
    
    logger.info("✅ 启动自检通过")
    return True

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

def get_diary_entries():
    """获取日记系统条目（仅每日记录）"""
    entries = []
    
    if not MEMORY_DIR.exists():
        return entries
    
    import re
    date_pattern = re.compile(r'^\d{4}-\d{2}-\d{2}$')
    
    for file in sorted(MEMORY_DIR.glob('*.md')):
        if not date_pattern.match(file.stem):
            continue
        
        try:
            date_str = file.stem
            content = file.read_text(encoding='utf-8')
            entries.append({
                'id': date_str,
                'date': date_str,
                'title': f"日记 {date_str}",
                'content': content[:500] + '...' if len(content) > 500 else content,
                'full_path': str(file)
            })
        except Exception as e:
            logger.error(f"读取日记失败 {file}: {e}")
    
    entries.sort(key=lambda x: x['date'], reverse=True)
    return entries[:10]  # 只返回最近 10 条

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

@app.route('/docs/<category>/<name>')
def doc_detail(category, name):
    """文档详情页面"""
    logger.info(f"访问文档详情：{category}/{name}")
    return render_template('doc-detail.html', category=category, name=name)

@app.route('/diary')
def diary():
    """日记系统页面"""
    logger.info("访问日记系统页面")
    return render_template('diary.html')

@app.route('/api/diary')
def api_diary():
    """API: 获取日记条目"""
    return jsonify(get_diary_entries())

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
            "services": get_services_config(),
            "health_summary": health_summary,
            "docs": get_docs_index(),
            "diary": get_diary_entries(),
            "ssl": get_ssl_status(),
            "images": get_images_config(),
            "agents": get_agents(),
            "models": get_models(),
            "domains": get_domains(),
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

@app.route('/api/docs/<category>/<name>')
def api_doc_detail(category, name):
    """API: 获取单个文档内容"""
    try:
        doc_path = DOCS_DIR / category / f"{name}.md"
        if not doc_path.exists():
            return jsonify({"error": "文档不存在"}), 404
        
        content = doc_path.read_text(encoding='utf-8')
        
        # 解析文档元数据
        metadata = {
            'name': name,
            'category': category,
            'path': str(doc_path),
            'updated_at': datetime.fromtimestamp(doc_path.stat().st_mtime).strftime("%Y-%m-%d %H:%M:%S")
        }
        
        # 提取标题和元数据块
        lines = content.split('\n')
        title = name
        body_start = 0
        
        for i, line in enumerate(lines[:30]):
            if line.startswith('# '):
                title = line[2:].strip()
            elif line.startswith('- **创建者**:'):
                metadata['creator'] = line.replace('- **创建者**:', '').strip()
            elif line.startswith('- **创建时间**:'):
                metadata['created_at'] = line.replace('- **创建时间**:', '').strip()
            elif line.startswith('- **标签**:'):
                metadata['tags'] = line.replace('- **标签**:', '').strip()
            elif line.startswith('---') and i > 0:
                body_start = i + 1
                break
        
        # 提取正文（跳过元数据块）
        body = '\n'.join(lines[body_start:]).strip()
        
        return jsonify({
            'title': title,
            'content': content,
            'body': body,
            'metadata': metadata
        })
    except Exception as e:
        logger.error(f"读取文档失败 {category}/{name}: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/health')
def api_health():
    """API: 深度健康检查"""
    checks = {
        'templates_dir': TEMPLATES_DIR.exists(),
        'static_dir': STATIC_DIR.exists(),
        'docs_dir': DOCS_DIR.exists(),
        'index_template': (TEMPLATES_DIR / 'index.html').exists(),
        'docs_template': (TEMPLATES_DIR / 'docs.html').exists(),
        'diary_template': (TEMPLATES_DIR / 'diary.html').exists(),
        'css_file': (STATIC_DIR / 'css' / 'style-v2.css').exists(),
    }
    all_ok = all(checks.values())
    
    status_code = 200 if all_ok else 503
    status_text = 'healthy' if all_ok else 'unhealthy'
    
    logger.info(f"健康检查：{status_text} (checks={sum(checks.values())}/{len(checks)})")
    
    return jsonify({
        'status': status_text,
        'checks': checks,
        'timestamp': datetime.now().isoformat()
    }), status_code

# ==================== 静态配置数据 ====================

# 子代理配置
AGENTS = [
    {"id": "11", "name": "十一", "role": "主代理", "specialties": "统筹协调"},
    {"id": "12", "name": "十二", "role": "设计师 + 画图师", "specialties": "UI/UX、配色、图像创作"},
    {"id": "13", "name": "十三", "role": "代码工程师", "specialties": "Web 开发、API"},
    {"id": "14", "name": "十四", "role": "系统状态管理员", "specialties": "内容记录、文档维护"},
]

# 模型配置
MODELS = [
    {"name": "qwen3.5-plus", "type": "通用对话"},
    {"name": "qwen3-coder-plus", "type": "代码生成"},
]

# 域名配置
DOMAINS = [
    {"domain": "galaxystream.online", "type": "主域名", "enabled": True, "config": "SSL 证书"},
    {"domain": "diary.galaxystream.online", "type": "子域名", "enabled": True, "config": "成长日记 (Flask)"},
    {"domain": "display.galaxystream.online", "type": "子域名", "enabled": True, "config": "展示系统 (Flask)"},
    {"domain": "gateway.galaxystream.online", "type": "子域名", "enabled": False, "config": "已停用 (安全回退)"},
]

# 服务健康状态
SERVICES = [
    {"name": "Nginx", "status": "ok"},
    {"name": "OpenClaw Gateway", "status": "ok"},
    {"name": "Growth Diary", "status": "ok"},
    {"name": "Display System", "status": "ok"},
    {"name": "Docker", "status": "ok"},
]

# 图片集配置
IMAGE_GALLERY = [
    {
        'name': '✨ Good Vibes',
        'src': 'images/ins-quote.png',
        'size': '1080×1080',
        'date': '2026-03-05'
    },
    {
        'name': '❤️ 心形',
        'src': 'images/heart.png',
        'size': '512×512',
        'date': '2026-03-05'
    },
    {
        'name': '🔟 十一的头像',
        'src': 'images/avatar.png?v=3',
        'size': '512×512',
        'date': '2026-03-05'
    }
]

def get_agents():
    """获取子代理列表"""
    return AGENTS

def get_models():
    """获取可用模型列表"""
    return MODELS

def get_domains():
    """获取域名配置"""
    return DOMAINS

def get_services_config():
    """获取服务健康状态"""
    return SERVICES

def get_images_config():
    """获取图片集配置"""
    return IMAGE_GALLERY

# ==================== 应用入口 ====================

if __name__ == '__main__':
    # 启动自检
    validate_startup()
    
    logger.info(f"🚀 启动展示系统 on 0.0.0.0:5001")
    logger.info(f"工作目录：{DISPLAY_DIR}")
    logger.info(f"模板目录：{TEMPLATES_DIR}")
    logger.info(f"静态资源：{STATIC_DIR}")
    logger.info(f"文档目录：{DOCS_DIR}")
    
    app.run(host='0.0.0.0', port=5001, debug=False)
