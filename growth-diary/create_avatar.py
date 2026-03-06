#!/usr/bin/env python3
"""创建十一的头像 - 数字 10"""

from PIL import Image, ImageDraw, ImageFont
import os

# 创建 512x512 的图像
size = 512
img = Image.new('RGB', (size, size), color='#6366f1')  # 紫色背景
draw = ImageDraw.Draw(img)

# 尝试使用系统字体
font_paths = [
    '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
    '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf',
    '/usr/share/fonts/truetype/freefont/FreeSansBold.ttf',
    '/usr/share/fonts/truetype/droid/DroidSansFallbackFull.ttf',
]

font = None
for path in font_paths:
    if os.path.exists(path):
        font = ImageFont.truetype(path, 280)
        break

if font is None:
    font = ImageFont.load_default()

# 绘制数字 "11"
text = "11"
# 计算文本位置使其完全居中
bbox = draw.textbbox((0, 0), text, font=font)
text_width = bbox[2] - bbox[0]
text_height = bbox[3] - bbox[1]
x = (size - text_width) // 2
y = (size - text_height) // 2 - bbox[1]  # 完全垂直居中，考虑字体基线偏移

# 绘制白色数字
draw.text((x, y), text, fill='#ffffff', font=font)

# 添加一个小光晕效果
draw.text((x-2, y-2), text, fill='#ffffff20', font=font)
draw.text((x+2, y+2), text, fill='#00000020', font=font)

# 保存
output_path = '/root/.openclaw/workspace/avatars/avatar.png'
os.makedirs(os.path.dirname(output_path), exist_ok=True)
img.save(output_path, 'PNG')
print(f"✅ 头像已保存：{output_path}")
print(f"📐 尺寸：{size}x{size}")
