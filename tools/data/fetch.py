import os
HERE = os.path.dirname(os.path.abspath(__file__))
WORK = os.path.join(HERE, 'work')
os.makedirs(WORK, exist_ok=True)
WWW = os.path.join(HERE, '..', '..', 'www')
import json, os, time, urllib.parse, urllib.request
names = "乾 夬 大有 大壯 小畜 需 大畜 泰 履 兌 睽 歸妹 中孚 節 損 臨 同人 革 離 豐 家人 既濟 賁 明夷 无妄 隨 噬嗑 震 益 屯 頤 復 姤 大過 鼎 恒 巽 井 蠱 升 訟 困 未濟 解 渙 坎 蒙 師 遯 咸 旅 小過 漸 蹇 艮 謙 否 萃 晉 豫 觀 比 剝 坤".split()
out = os.path.join(WORK, 'raw')
os.makedirs(out, exist_ok=True)
for n in names:
    fp = os.path.join(out, n + '.txt')
    if os.path.exists(fp) and os.path.getsize(fp) > 500:
        continue
    url = 'https://zh.wikisource.org/w/api.php?action=parse&prop=wikitext&format=json&page=' + urllib.parse.quote('周易/' + n)
    req = urllib.request.Request(url, headers={'User-Agent': 'YaoguanDataBuilder/1.0 (personal project)'})
    for attempt in range(3):
        try:
            d = json.load(urllib.request.urlopen(req, timeout=30))
            open(fp, 'w', encoding='utf-8').write(d['parse']['wikitext']['*'])
            break
        except Exception as e:
            print('retry', n, e); time.sleep(15)
    time.sleep(3)
print(len(os.listdir(out)))
