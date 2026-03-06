#!/usr/bin/env python3
"""Create Instagram-style motivational quote image"""

from PIL import Image, ImageDraw, ImageFont

# Image dimensions
WIDTH, HEIGHT = 1080, 1080

# Colors
COLOR_TOP = (255, 221, 225)      # #ffdde1 - light pink
COLOR_BOTTOM = (238, 156, 167)   # #ee9ca7 - light purple
TEXT_COLOR = (255, 255, 255)     # White

# Create image with gradient background
img = Image.new('RGB', (WIDTH, HEIGHT))
draw = ImageDraw.Draw(img)

# Draw vertical gradient
for y in range(HEIGHT):
    # Calculate interpolation factor (0 at top, 1 at bottom)
    t = y / HEIGHT
    r = int(COLOR_TOP[0] * (1 - t) + COLOR_BOTTOM[0] * t)
    g = int(COLOR_TOP[1] * (1 - t) + COLOR_BOTTOM[1] * t)
    b = int(COLOR_TOP[2] * (1 - t) + COLOR_BOTTOM[2] * t)
    draw.line([(0, y), (WIDTH, y)], fill=(r, g, b))

# Text settings
text = "Good Vibes Only"

# Try to use a nice font, fall back to default if not available
font_size = 80
try:
    # Try common font paths
    font_paths = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
        "/usr/share/fonts/truetype/freefont/FreeSansBold.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
        "C:\\Windows\\Fonts\\arial.ttf",
    ]
    font = None
    for path in font_paths:
        try:
            font = ImageFont.truetype(path, font_size)
            break
        except:
            continue
    if font is None:
        font = ImageFont.load_default()
except Exception as e:
    print(f"Font loading issue: {e}")
    font = ImageFont.load_default()

# Calculate text position for centering
bbox = draw.textbbox((0, 0), text, font=font)
text_width = bbox[2] - bbox[0]
text_height = bbox[3] - bbox[1]

x = (WIDTH - text_width) // 2
y = (HEIGHT - text_height) // 2

# Draw text with subtle shadow for better visibility
shadow_offset = 3
shadow_color = (0, 0, 0, 128)  # Semi-transparent black

# Draw shadow
draw.text((x + shadow_offset, y + shadow_offset), text, font=font, fill=(200, 150, 150))

# Draw main text
draw.text((x, y), text, font=font, fill=TEXT_COLOR)

# Save the image
output_path = "/root/.openclaw/workspace/images/ins-goodvibes.png"
img.save(output_path, 'PNG', quality=95)

print(f"✅ Image created successfully: {output_path}")
print(f"   Size: {WIDTH}x{HEIGHT} pixels")
print(f"   Text: '{text}'")
