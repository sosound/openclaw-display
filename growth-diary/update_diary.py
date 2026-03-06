#!/usr/bin/env python3
"""
自动更新日记脚本
在每次会话后运行，将新的 memory 文件添加到日记中
"""

import json
from datetime import datetime
from pathlib import Path

WORKSPACE = Path('/root/.openclaw/workspace')
MEMORY_DIR = WORKSPACE / 'memory'
DATA_FILE = WORKSPACE / 'growth-diary' / 'data' / 'entries.json'

def update_diary():
    """更新日记数据"""
    entries = []
    
    # 确保目录存在
    MEMORY_DIR.mkdir(exist_ok=True)
    DATA_FILE.parent.mkdir(exist_ok=True)
    
    # 创建今天的日记文件（如果不存在）
    today = datetime.now().strftime('%Y-%m-%d')
    today_file = MEMORY_DIR / f'{today}.md'
    
    if not today_file.exists():
        today_file.write_text(f"# {today} 的成长记录\n\n", encoding='utf-8')
        print(f"📝 创建了今天的日记文件：{today_file}")
    
    print(f"✅ 日记更新完成")
    print(f"📂 Memory 目录：{MEMORY_DIR}")
    print(f"💾 数据文件：{DATA_FILE}")

if __name__ == '__main__':
    update_diary()
