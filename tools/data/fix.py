import os
HERE = os.path.dirname(os.path.abspath(__file__))
WORK = os.path.join(HERE, 'work')
os.makedirs(WORK, exist_ok=True)
WWW = os.path.join(HERE, '..', '..', 'www')
import json
P = os.path.join(WORK, 'zhouyi_text.json')
z = json.load(open(P, encoding='utf-8'))
by = {d['name']: d for d in z}
FIX = {
    ('大畜', 2): '九三：良马逐，利艰贞。曰闲舆卫，利有攸往。',   # 武英殿本作「曰」，标点按《折中》
    ('涣', 0): '初六：用拯马壮，吉。',                         # 武英殿本无「悔亡」
    ('睽', 5): '上九：睽孤，见豕负涂，载鬼一车，先张之弧，后说之弧，匪寇婚媾，往遇雨则吉。',
}
for (n, i), v in FIX.items():
    by[n]['yao'][i] = v
# 小象同步清理多余空格
for d in z:
    for k in ('yao', 'yaoXiang'):
        d[k] = [s.replace(' ', '').replace('\u3000', '') for s in d[k]]
    for k in ('gua', 'tuan', 'xiang'):
        d[k] = d[k].replace(' ', '').replace('\u3000', '')
json.dump(z, open(P, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(by['大畜']['yao'][2], by['涣']['yao'][0], by['乾']['special'], by['坤']['special'], sep='\n')
print(by['乾']['gua'], '|', by['乾']['tuan'][:30], '|', by['未济']['yaoXiang'][5])
