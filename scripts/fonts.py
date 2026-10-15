"""在 CI 中运行：下载 OFL 字体并按应用实际用字子集化为 woff2。
- 马善政楷书（Ma Shan Zheng）：只用于卦名、印章、标题
- 思源宋体（Noto Serif SC）：标题与经文
"""
import os, re, glob, subprocess, sys, urllib.request
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WWW = os.path.join(ROOT, 'www')
OUT = os.path.join(WWW, 'fonts'); os.makedirs(OUT, exist_ok=True)
SRC = {
    'cal': 'https://github.com/google/fonts/raw/main/ofl/mashanzheng/MaShanZheng-Regular.ttf',
    'serif': 'https://github.com/google/fonts/raw/main/ofl/notoserifsc/NotoSerifSC%5Bwght%5D.ttf',
}
text = set()
for f in glob.glob(os.path.join(WWW, '**', '*.*'), recursive=True):
    if f.endswith(('.js', '.html', '.css')) and '/fonts/' not in f and not f.endswith('lunar.js'):
        text |= set(open(f, encoding='utf-8').read())
# 干支、数字、节气等动态内容
text |= set('甲乙丙丁戊己庚辛壬癸子丑寅卯辰巳午未申酉戌亥0123456789年月日时空正一二三四五六七八九十廿卅初腊冬闰')
text |= set('立春雨水惊蛰春分清明谷雨立夏小满芒种夏至小暑大暑立秋处暑白露秋分寒露霜降立冬小雪大雪冬至小寒大寒')
text |= set('，。；：、！？「」『』《》（）·—…○×⚊⚋ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz%./-+=')
chars = ''.join(sorted(c for c in text if ord(c) >= 32))
open('/tmp/chars.txt', 'w', encoding='utf-8').write(chars)
print('subset chars:', len(chars))
for k, u in SRC.items():
    src = f'/tmp/{k}.ttf'
    if not os.path.exists(src):
        urllib.request.urlretrieve(u, src)
    args = ['pyftsubset', src, '--text-file=/tmp/chars.txt', '--flavor=woff2', f'--output-file={OUT}/{k}.woff2', '--layout-features=*', '--no-hinting']
    if k == 'serif':
        args += []  # 保留可变字重轴
    subprocess.check_call(args)
    print(k, os.path.getsize(f'{OUT}/{k}.woff2'))
