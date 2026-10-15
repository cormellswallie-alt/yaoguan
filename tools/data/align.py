"""爻辞以武英殿本《御纂周易折中》(1715) 为准，保留维基文库的标点。
做法：去标点后逐字对齐，把武英殿本文字填回带标点的骨架。"""
import os
HERE = os.path.dirname(os.path.abspath(__file__))
WORK = os.path.join(HERE, 'work')
os.makedirs(WORK, exist_ok=True)
WWW = os.path.join(HERE, '..', '..', 'www')

import json, re, difflib
from opencc import OpenCC
cc = OpenCC('t2s')
P = os.path.join(WORK, 'zhouyi_text.json')
z = json.load(open(P, encoding='utf-8'))
w = json.load(open(os.path.join(WORK, 'wuying-lines.json'), encoding='utf-8'))['hexagrams']
PUNCT = '，。；：、！？「」『』'
KEEP = {'乾': '\ue001', '无': '\ue002', '后': '\ue003'}
def s2(s):
    for k, v in KEEP.items(): s = s.replace(k, v)
    s = cc.convert(s)
    for k, v in KEEP.items(): s = s.replace(v, k)
    return s.replace('於', '于')
# 武英殿本里的异体字 → 现行规范写法（不改字义）
VAR = str.maketrans({'彚': '汇', '彙': '汇', '羣': '群', '恆': '恒', '朶': '朵', '眞': '真'})

def merge(punct_src, plain_tgt):
    """把 plain_tgt 的字放进 punct_src 的标点骨架"""
    chars = [(i, c) for i, c in enumerate(punct_src) if c not in PUNCT]
    a = ''.join(c for _, c in chars)
    sm = difflib.SequenceMatcher(None, a, plain_tgt, autojunk=False)
    # 为 a 中每个字符位置记录替换文本
    rep = {}
    ins_before = {}
    for t, i1, i2, j1, j2 in sm.get_opcodes():
        if t == 'equal':
            continue
        seg = plain_tgt[j1:j2]
        if i1 == i2:  # 插入
            ins_before.setdefault(i1, '')
            ins_before[i1] += seg
        else:
            for k in range(i1, i2):
                rep[k] = ''
            rep[i1] = seg
    out = []; k = 0
    for c in punct_src:
        if c in PUNCT:
            out.append(c); continue
        if k in ins_before: out.append(ins_before[k])
        out.append(rep.get(k, c)); k += 1
    if k in ins_before:  # 末尾插入，放到最后一个标点之前
        tail = ins_before[k]
        if out and out[-1] in PUNCT:
            out.insert(len(out) - 1, tail)
        else:
            out.append(tail)
    return ''.join(out)

changes = []
for a, b in zip(z, w):
    for i in range(6):
        title, body = a['yao'][i].split('：', 1)
        tb = s2(b['lines'][i]).translate(VAR)
        ttitle, tbody = tb.split('：', 1)
        assert ttitle == title, (a['name'], title, ttitle)
        plain = re.sub('[' + PUNCT + ']', '', body)
        if plain != tbody:
            nb = merge(body, tbody)
            assert re.sub('[' + PUNCT + ']', '', nb) == tbody, (a['name'], nb, tbody)
            changes.append(f"{a['n']:>2} {a['name']} {title}: {body} → {nb}")
            a['yao'][i] = title + '：' + nb
    if b.get('special') and a.get('special'):
        sp = s2(b['special']['text']).translate(VAR)
        plain = re.sub('[' + PUNCT + ']', '', a['special']['text'])
        if plain != sp:
            a['special']['text'] = merge(a['special']['text'], sp)
            changes.append(f"{a['name']} {a['special']['label']}: → {a['special']['text']}")
json.dump(z, open(P, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
open(os.path.join(HERE, 'align_log.txt'), 'w', encoding='utf-8').write('\n'.join(changes))
print(len(changes), 'lines aligned')
print('\n'.join(changes[:60]))
