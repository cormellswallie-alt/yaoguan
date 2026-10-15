"""在 CI 中运行：生成应用图标与启动图（Pillow），供 @capacitor/assets 生成各尺寸资源。
图标：朱砂印章底 + 宣纸色“爻”字（马善政楷书）。"""
import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
A = os.path.join(ROOT, 'assets'); os.makedirs(A, exist_ok=True)
CAL = '/tmp/cal.ttf'
RED = (176, 53, 42); PAPER = (242, 236, 225); INK = (26, 23, 20)

def glyph(size, ch, color, font=CAL):
    f = ImageFont.truetype(font, size)
    im = Image.new('RGBA', (size * 2, size * 2), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.text((size, size), ch, font=f, fill=color, anchor='mm')
    return im.crop(im.getbbox())

def paste_center(bg, fg, cy=None):
    x = (bg.width - fg.width) // 2; y = (bg.height - fg.height) // 2 if cy is None else cy - fg.height // 2
    bg.alpha_composite(fg, (x, y))

# 1024 图标（完整）
S = 1024
icon = Image.new('RGBA', (S, S), RED + (255,))
d = ImageDraw.Draw(icon)
d.rounded_rectangle([88, 88, S - 88, S - 88], radius=70, outline=PAPER + (255,), width=18)
paste_center(icon, glyph(640, '爻', PAPER + (255,)))
icon.convert('RGB').save(os.path.join(A, 'icon-only.png'))

# 自适应图标：前景（安全区内）+ 背景
fg = Image.new('RGBA', (S, S), (0, 0, 0, 0))
d = ImageDraw.Draw(fg)
d.rounded_rectangle([250, 250, S - 250, S - 250], radius=40, outline=PAPER + (255,), width=14)
paste_center(fg, glyph(420, '爻', PAPER + (255,)))
fg.save(os.path.join(A, 'icon-foreground.png'))
Image.new('RGB', (S, S), RED).save(os.path.join(A, 'icon-background.png'))

# 启动图 2732
L = 2732
sp = Image.new('RGBA', (L, L), PAPER + (255,))
paste_center(sp, glyph(420, '爻观', INK + (255,)), cy=L // 2 - 60)
seal = Image.new('RGBA', (120, 120), RED + (255,))
paste_center(seal, glyph(80, '观', PAPER + (255,)))
sp.alpha_composite(seal, (L // 2 + 330, L // 2 - 160))
sub = glyph(64, '六 爻 排 盘', (142, 133, 119, 255), font='/tmp/serif.ttf')
paste_center(sp, sub, cy=L // 2 + 200)
sp.convert('RGB').save(os.path.join(A, 'splash.png'))
dk = Image.new('RGBA', (L, L), (18, 16, 13, 255))
paste_center(dk, glyph(420, '爻观', (238, 230, 214, 255)), cy=L // 2 - 60)
dk.alpha_composite(seal, (L // 2 + 330, L // 2 - 160))
dk.convert('RGB').save(os.path.join(A, 'splash-dark.png'))
print('icons ok')
