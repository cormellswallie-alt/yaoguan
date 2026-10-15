import os
HERE = os.path.dirname(os.path.abspath(__file__))
WORK = os.path.join(HERE, 'work')
os.makedirs(WORK, exist_ok=True)
WWW = os.path.join(HERE, '..', '..', 'www')
import json, re, difflib, sys
from opencc import OpenCC
cc = OpenCC('t2s')
z = json.load(open(os.path.join(WORK, 'zhouyi_text.json'), encoding='utf-8'))
w = json.load(open(os.path.join(WORK, 'wuying-lines.json'), encoding='utf-8'))['hexagrams']
def norm(s):
    s = s.replace('乾', '\ue001')
    s = cc.convert(s).replace('\ue001', '乾')
    return re.sub(r'[，。；：、！？「」『』\s]', '', s)
VAR = str.maketrans({'彚': '汇', '彙': '汇', '羣': '群', '寘': '置', '恒': '恒', '恆': '恒', '於': '于', '徳': '德', '眞': '真'})
diff = 0
for a, b in zip(z, w):
    assert a['n'] == b['number']
    for i in range(6):
        x = norm(a['yao'][i]).translate(VAR); y = norm(b['lines'][i]).translate(VAR)
        if x != y:
            diff += 1
            sm = difflib.SequenceMatcher(None, x, y)
            ops = [(x[i1:i2], y[j1:j2]) for t, i1, i2, j1, j2 in sm.get_opcodes() if t != 'equal']
            print(a['n'], a['name'], i + 1, ops)
print('diff lines:', diff)
