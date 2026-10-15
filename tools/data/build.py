"""经文数据管线一键构建：生成 www/data/zhouyi.js

步骤：
  1. fetch.py      从维基文库抓取《周易》64 卦 wikitext（公有领域）→ work/raw/
  2. parse.py      解析卦辞 / 彖 / 大象 / 爻辞 / 小象 / 用九用六，转简体 → work/zhouyi_text.json
  3. align.py      爻辞逐字对齐武英殿本《御纂周易折中》（保留维基标点）→ align_log.txt
  4. fix.py        少量人工定稿（大畜九三“曰闲”、涣初六等）
  5. crosscheck.py 再次与武英殿本比对，输出剩余差异
  6. 合并白话简释 bh.json（人工撰写）与爻辞吉凶表 jixiong.json（规则提取 + 人工复核）
  7. 写出 www/data/zhouyi.js

用法：
  python3 tools/data/build.py            # 使用 work/ 下已有原始数据
  python3 tools/data/build.py --fetch    # 先联网抓取原始数据
依赖：pip install opencc-python-reimplemented
"""
import json, os, subprocess, sys, urllib.request
HERE = os.path.dirname(os.path.abspath(__file__))
WORK = os.path.join(HERE, 'work'); os.makedirs(WORK, exist_ok=True)
OUT = os.path.join(HERE, '..', '..', 'www', 'data', 'zhouyi.js')
WY = 'https://raw.githubusercontent.com/poplolioi11/yigua-wuyingdian-lines/main/wuying-lines.json'

def run(f):
    print(f'==> {f}'); subprocess.check_call([sys.executable, os.path.join(HERE, f)])

if '--fetch' in sys.argv or not os.path.isdir(os.path.join(WORK, 'raw')):
    run('fetch.py')
wy = os.path.join(WORK, 'wuying-lines.json')
if not os.path.exists(wy):
    print('==> download wuying-lines.json'); urllib.request.urlretrieve(WY, wy)
for f in ('parse.py', 'align.py', 'fix.py', 'crosscheck.py'):
    run(f)

z = json.load(open(os.path.join(WORK, 'zhouyi_text.json'), encoding='utf-8'))
bh = json.load(open(os.path.join(HERE, 'bh.json'), encoding='utf-8'))
jx = json.load(open(os.path.join(HERE, 'jixiong.json'), encoding='utf-8'))
for h in z:
    k = str(h['n']); x = bh[k]
    h['bh'], h['yaoBh'], h['key'] = x['bh'], x['yaoBh'], x['key']
    if h['special']: h['special']['bh'] = x.get('spBh', '')
    h['jx'] = jx[k]
open(OUT, 'w', encoding='utf-8').write('window.ZHOUYI=' + json.dumps(z, ensure_ascii=False, separators=(',', ':')) + ';')
print('written', os.path.relpath(OUT), os.path.getsize(OUT), 'bytes')
