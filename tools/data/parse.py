import os
HERE = os.path.dirname(os.path.abspath(__file__))
WORK = os.path.join(HERE, 'work')
os.makedirs(WORK, exist_ok=True)
WWW = os.path.join(HERE, '..', '..', 'www')
import json, os, re
from opencc import OpenCC
cc = OpenCC('t2s')
RAW = os.path.join(WORK, 'raw')
TRI = {'乾': '111', '兑': '110', '离': '101', '震': '100', '巽': '011', '坎': '010', '艮': '001', '坤': '000'}
XIANG = {'乾': '天', '兑': '泽', '离': '火', '震': '雷', '巽': '风', '坎': '水', '艮': '山', '坤': '地'}
# 文王卦序（繁体页面名）
ORDER = "乾 坤 屯 蒙 需 訟 師 比 小畜 履 泰 否 同人 大有 謙 豫 隨 蠱 臨 觀 噬嗑 賁 剝 復 无妄 大畜 頤 大過 坎 離 咸 恒 遯 大壯 晉 明夷 家人 睽 蹇 解 損 益 夬 姤 萃 升 困 井 革 鼎 震 艮 漸 歸妹 豐 旅 巽 兌 渙 節 中孚 小過 既濟 未濟".split()
assert len(ORDER) == 64

def clean(s):
    s = re.sub(r'\{\{\*\|[^}]*\}\}', '', s)          # {{*|注}}
    s = re.sub(r'\{\{另\|([^|}]*)\|[^}]*\}\}', r'\1', s)  # {{另|正文|异文}} 取正文
    s = re.sub(r'\{\{(?:僻字|Ruby|ruby|lang)\|([^|}]*)[^}]*\}\}', r'\1', s)
    s = re.sub(r'\{\{[^}]*\}\}', '', s)
    s = re.sub(r'-\{(?:[^}|]*\|)?([^}]*)\}-', r'\1', s)  # -{无}- / -{T|x}-
    s = re.sub(r'\[\[(?:[^\]|]*\|)?([^\]]*)\]\]', r'\1', s)
    s = re.sub(r'<[^>]+>', '', s)
    s = s.replace("'''", '').replace("''", '')
    s = s.strip().lstrip('*#:;').strip()
    return s

KEEP = {'乾': '\ue001', '无': '\ue002', '后': '\ue003', '咸': '\ue004', '蒙': '\ue005', '丰': '\ue006'}
def s2(s):
    # 古籍专字保护：乾(不转干)、无、后等
    for k, v in KEEP.items():
        s = s.replace(k, v)
    s = cc.convert(s)
    for k, v in KEEP.items():
        s = s.replace(v, k)
    return s.replace('於', '于')

def parse(name):
    t = open(os.path.join(RAW, name + '.txt'), encoding='utf-8').read()
    lines = t.split('\n')
    m = re.search(r'([乾坤震巽坎離艮兌])下([乾坤震巽坎離艮兌])上', clean(t))
    if not m:
        m = re.search(r'([乾坤震巽坎離艮兌])\}?-?下-?\{?([乾坤震巽坎離艮兌])\}?-?上', t)
    lower, upper = s2(m.group(1)), s2(m.group(2))
    sec = None; gua = None; yao = []; tuan = []; xiang = None; yx = []; special = None; spx = None
    for ln in lines:
        raw = ln.strip()
        c = clean(raw)
        if not c:
            continue
        if '易經：' in raw or '易经：' in raw: sec = 'jing'; continue
        if raw.startswith("*'''彖曰"): sec = 'tuan'; continue
        if raw.startswith("*'''象曰"): sec = 'xiang'; continue
        if raw.startswith("*'''文言") or raw.startswith('*:'): sec = 'other'; continue
        if raw.startswith("*'''"): sec = 'other'; continue
        if sec == 'jing':
            if raw.startswith('**') and gua is None:
                gua = c.split('：', 1)[1] if '：' in c else c
            elif raw.startswith('*#'):
                if c.startswith('用九') or c.startswith('用六'):
                    special = c
                else:
                    yao.append(re.sub(r'^(初[九六]|[九六][二三四五]|上[九六])[，,]', r'\1：', c))
        elif sec == 'tuan':
            tuan.append(c)
        elif sec == 'xiang':
            if raw.startswith('**') and xiang is None:
                xiang = c
            elif raw.startswith('*#'):
                yx.append(c)
    sp = None
    if special:
        lab, txt = special.split('：', 1)
        sp = {'label': s2(lab), 'text': s2(txt), 'xiang': s2(yx[6]) if len(yx) > 6 else None}
    return {
        'name': s2(name), 'lower': lower, 'upper': upper,
        'lines': TRI[lower] + TRI[upper],
        'gua': s2(gua), 'tuan': s2(''.join(tuan)), 'xiang': s2(xiang),
        'yao': [s2(x) for x in yao], 'yaoXiang': [s2(x) for x in yx[:6]], 'special': sp,
    }

res = []
for i, n in enumerate(ORDER):
    d = parse(n)
    d['n'] = i + 1
    nm = d['name']
    if d['lower'] == d['upper']:
        d['full'] = nm + '为' + XIANG[d['lower']]
    else:
        d['full'] = XIANG[d['upper']] + XIANG[d['lower']] + nm
    res.append(d)
json.dump(res, open(os.path.join(WORK, 'zhouyi_text.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)

# ---- 校验 ----
errs = []
assert len({r['lines'] for r in res}) == 64, 'lines 不唯一'
for r in res:
    if len(r['yao']) != 6: errs.append((r['name'], 'yao', len(r['yao'])))
    if len(r['yaoXiang']) != 6: errs.append((r['name'], 'yaoXiang', len(r['yaoXiang'])))
    for k in ('gua', 'tuan', 'xiang'):
        if not r[k]: errs.append((r['name'], k, 'empty'))
    L = r['lines']
    exp = ['初' + ('九' if L[0] == '1' else '六')] + [('九' if L[i] == '1' else '六') + '二三四五'[i - 1] for i in range(1, 5)] + ['上' + ('九' if L[5] == '1' else '六')]
    got = [y.split('：')[0] for y in r['yao']]
    if got != exp: errs.append((r['name'], 'yaoTitle', got, exp))
    allt = json.dumps(r, ensure_ascii=False)
    if s2(allt) != allt: errs.append((r['name'], 'trad-residue'))
    if re.search(r'[{}\[\]<>|=]', r['gua'] + r['tuan'] + r['xiang'] + ''.join(r['yao']) + ''.join(r['yaoXiang'])): errs.append((r['name'], 'markup'))
print('errors:', errs if errs else 'none')
print([r['full'] for r in res][:12])
print(res[10]['yao'][2], '|', res[10]['xiang'])
