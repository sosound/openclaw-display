#!/usr/bin/env python3
"""
Growth Diary - 十一的成长日记
Flask 应用，只展示每日日记记录

简化版本：仅读取 memory/目录下的 YYYY-MM-DD.md 文件
"""

import os
import re
from datetime import datetime
from flask import Flask, render_template, request, jsonify
from pathlib import Path

app = Flask(__name__)

# 添加响应头，禁止 HTML 缓存
@app.after_request
def add_no_cache_headers(response):
    response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, proxy-revalidate'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    return response

# 配置
WORKSPACE = Path('/root/.openclaw/workspace')
MEMORY_DIR = WORKSPACE / 'memory'

def load_daily_entries():
    """加载每日日记条目（仅 YYYY-MM-DD.md 格式）"""
    entries = []
    
    if not MEMORY_DIR.exists():
        return entries
    
    # 只读取 YYYY-MM-DD.md 格式的每日记录
    date_pattern = re.compile(r'^\d{4}-\d{2}-\d{2}$')
    
    for file in sorted(MEMORY_DIR.glob('*.md')):
        # 跳过非每日记录文件（如 agent-*.md, *-report.md 等）
        if not date_pattern.match(file.stem):
            continue
        
        try:
            date_str = file.stem  # YYYY-MM-DD
            content = file.read_text(encoding='utf-8')
            
            # 提取标签
            tags = extract_tags(content)
            
            entries.append({
                'id': date_str,
                'date': date_str,
                'title': f"日记 {date_str}",
                'content': content,
                'tags': tags,
                'type': 'daily'
            })
        except Exception as e:
            print(f"Error loading {file}: {e}")
    
    # 按日期排序（最新在前）
    entries.sort(key=lambda x: x['date'], reverse=True)
    return entries

def extract_tags(content):
    """从内容中提取标签"""
    tags = set()
    
    # 查找 #标签 格式
    hashtag_pattern = r'#(\w+)'
    for match in re.finditer(hashtag_pattern, content):
        tags.add(match.group(1))
    
    # 根据内容自动添加标签
    content_lower = content.lower()
    if 'weather' in content_lower or '天气' in content_lower:
        tags.add('天气')
    if 'identity' in content_lower or '身份' in content_lower:
        tags.add('身份')
    if 'user' in content_lower or 'star' in content_lower:
        tags.add('用户')
    if 'bootstrap' in content_lower:
        tags.add('启动')
    if 'website' in content_lower or '网站' in content_lower:
        tags.add('项目')
    
    return sorted(list(tags))

def get_all_tags(entries):
    """获取所有唯一标签"""
    all_tags = set()
    for entry in entries:
        all_tags.update(entry['tags'])
    return sorted(list(all_tags))

@app.route('/')
def index():
    """主页 - 时间线视图"""
    entries = load_daily_entries()
    all_tags = get_all_tags(entries)
    return render_template('index.html', entries=entries, all_tags=all_tags, current_view='timeline')

@app.route('/tags')
def tags():
    """标签分类视图"""
    entries = load_daily_entries()
    all_tags = get_all_tags(entries)
    
    # 按标签分组
    tagged_entries = {}
    for tag in all_tags:
        tagged_entries[tag] = [e for e in entries if tag in e['tags']]
    
    return render_template('tags.html', tagged_entries=tagged_entries, all_tags=all_tags, current_view='tags')

@app.route('/search')
def search():
    """搜索视图"""
    query = request.args.get('q', '')
    entries = load_daily_entries()
    all_tags = get_all_tags(entries)
    
    results = []
    if query:
        query_lower = query.lower()
        for entry in entries:
            if (query_lower in entry['content'].lower() or 
                query_lower in entry['title'].lower() or
                any(query_lower in tag.lower() for tag in entry['tags'])):
                results.append(entry)
    
    return render_template('search.html', entries=results, query=query, all_tags=all_tags, current_view='search')

@app.route('/api/entries')
def api_entries():
    """API - 获取所有条目"""
    entries = load_daily_entries()
    return jsonify(entries)

@app.route('/api/tags')
def api_tags():
    """API - 获取所有标签"""
    entries = load_daily_entries()
    tags = get_all_tags(entries)
    return jsonify(tags)

@app.route('/api/refresh', methods=['POST'])
def api_refresh():
    """API - 手动刷新数据"""
    return jsonify({'status': 'ok', 'message': '数据已刷新'})

if __name__ == '__main__':
    print("🔟 十一的成长日记启动中...")
    print(f"工作目录：{WORKSPACE}")
    print(f"Memory 目录：{MEMORY_DIR}")
    print("仅读取每日记录 (YYYY-MM-DD.md)")
    app.run(host='0.0.0.0', port=5000, debug=True)
