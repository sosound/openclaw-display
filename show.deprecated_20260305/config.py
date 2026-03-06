#!/usr/bin/env python3
"""
配置管理模块 - config.py
管理应用配置：端口、工作目录、日志、缓存等
"""

import os

# ==================== 基础配置 ====================

# 应用配置
APP_HOST = '127.0.0.1'
APP_PORT = 5001
DEBUG_MODE = False

# 工作目录
WORKSPACE = "/root/.openclaw/workspace"
SHOW_DIR = os.path.join(WORKSPACE, "show")
TEMPLATES_DIR = os.path.join(SHOW_DIR, "templates")
STATIC_DIR = os.path.join(SHOW_DIR, "static")
IMAGES_DIR = os.path.join(SHOW_DIR, "images")

# ==================== 日志配置 ====================

LOG_LEVEL = 'INFO'
LOG_FORMAT = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
LOG_DATE_FORMAT = '%Y-%m-%d %H:%M:%S'

# ==================== 缓存配置 ====================

# 缓存过期时间（秒）
CACHE_TTL_SYSTEM_INFO = 60      # 系统信息缓存 1 分钟
CACHE_TTL_SERVICE_STATUS = 30   # 服务状态缓存 30 秒
CACHE_TTL_SSL_STATUS = 300      # SSL 状态缓存 5 分钟

# ==================== SSL 证书配置 ====================

SSL_CERT_DIR = "/etc/letsencrypt/live"

# ==================== 子代理配置 ====================

AGENTS = [
    {"id": "11", "name": "十一", "role": "主代理", "specialties": "统筹协调"},
    {"id": "12", "name": "十二", "role": "设计师 + 画图师", "specialties": "UI/UX、配色、图像创作"},
    {"id": "13", "name": "十三", "role": "代码工程师", "specialties": "Web 开发、API"},
    {"id": "14", "name": "十四", "role": "系统状态管理员", "specialties": "内容记录、文档维护"},
]

# ==================== 服务健康状态 ====================

SERVICES = [
    {"name": "Nginx", "status": "ok"},
    {"name": "OpenClaw Gateway", "status": "ok"},
    {"name": "Sight Pond", "status": "ok"},
    {"name": "Growth Diary", "status": "ok"},
    {"name": "Docker", "status": "ok"},
]

# ==================== 模型配置 ====================

MODELS = [
    {"name": "qwen3.5-plus", "type": "通用对话"},
    {"name": "qwen3-coder-plus", "type": "代码生成"},
]

# ==================== 域名配置 ====================

DOMAINS = [
    {"domain": "galaxystream.online", "type": "主域名", "enabled": True, "config": "SSL 证书"},
    {"domain": "diary.galaxystream.online", "type": "子域名", "enabled": True, "config": "成长日记 (Flask)"},
    {"domain": "show.galaxystream.online", "type": "子域名", "enabled": True, "config": "系统状态 + 图片集"},
    {"domain": "gateway.galaxystream.online", "type": "子域名", "enabled": False, "config": "已停用 (安全回退)"},
]

# ==================== 图片集配置 ====================

IMAGE_GALLERY = [
    {
        'name': '✨ Good Vibes',
        'src': 'ins-quote.png',
        'size': '1080×1080',
        'date': '2026-03-05'
    },
    {
        'name': '❤️ 心形',
        'src': 'heart.png',
        'size': '512×512',
        'date': '2026-03-05'
    },
    {
        'name': '🔟 十一的头像',
        'src': 'avatar.png?v=3',
        'size': '512×512',
        'date': '2026-03-05'
    }
]
