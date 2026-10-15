import os
HERE = os.path.dirname(os.path.abspath(__file__))
WORK = os.path.join(HERE, 'work')
os.makedirs(WORK, exist_ok=True)
WWW = os.path.join(HERE, '..', '..', 'www')
import json, glob, re
D = WORK + '/'
out = {}
for f in sorted(glob.glob(D + 'bh_part_*.json')):
    out.update(json.load(open(f, encoding='utf-8')))
out = {str(k): out[str(k)] for k in range(1, 65)}
json.dump(out, open(os.path.join(HERE, 'bh.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
try:
    from opencc import OpenCC
    cc = OpenCC('t2s')
except Exception as e:
    cc = None; print('no opencc', e)
ign = set('乾无后')
def ln(s): return len(re.sub(r'[，。；：、！？“”（）《》\s]', '', s))
bl, yl, kl = [], [], []
probs = []
for k, v in out.items():
    if set(v) - {'bh', 'yaoBh', 'spBh', 'key'}: probs.append((k, 'extra', set(v)))
    if len(v['yaoBh']) != 6 or not all(x.strip() for x in v['yaoBh']): probs.append((k, 'yao'))
    if (k in ('1', '2')) != ('spBh' in v): probs.append((k, 'sp'))
    b = len(v['bh']); bl.append(b)
    if not 25 <= b <= 50: probs.append((k, 'bh', b))
    for i, y in enumerate(v['yaoBh']):
        yl.append(len(y))
        if not 18 <= len(y) <= 40: probs.append((k, i + 1, len(y)))
    kl.append(len(v['key']))
    if not 2 <= len(v['key']) <= 4: probs.append((k, 'key'))
    allt = v['bh'] + ''.join(v['yaoBh']) + v.get('spBh', '') + v['key']
    if re.search(r'[,;:!?()]', allt): probs.append((k, 'halfwidth'))
    if cc:
        for ch in allt:
            if ch not in ign and cc.convert(ch) != ch: probs.append((k, 'trad', ch))
print('keys', len(out), 'yao total', sum(len(v['yaoBh']) for v in out.values()))
print('bh', min(bl), max(bl), 'yao', min(yl), max(yl), 'key', min(kl), max(kl))
print('spBh', [len(out[k]['spBh']) for k in ('1', '2')])
for p in probs: print(p)
