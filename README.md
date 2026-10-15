# 爻观 · 六爻排盘

新中式风格的六爻排盘 App（Android）。摇钱起卦使用**物理真随机**，不用伪随机算法。

## 真随机是怎么实现的

| 熵源 | 物理过程 | 说明 |
|---|---|---|
| [ANU QRNG](https://qrng.anu.edu.au) | 真空量子涨落 | 澳大利亚国立大学；公共接口限速 1 次/分钟，一次取 96 字节缓存 |
| [LfD QRNG](https://lfdr.de/qrng_api/) | 光子过分束器的量子选择 | 德国 LfD 实验室 |
| 手机加速度计 / 陀螺仪 | MEMS 热噪声 + 手部运动 | 摇动手机时采集；离线摇钱模式只用它，每爻要攒满 32 帧 |
| 触摸时序 | 按下时刻的亚毫秒级抖动 | 辅助 |

- 每一爻：取 16 字节量子熵 + 传感器样本 → **SHA-256**（只用来混合和白化，本身不产生随机性）→ 取 3 个比特当三枚铜钱。1 为背（计 3），0 为字（计 2），加起来 6/7/8/9 对应老阴、少阳、少阴、老阳。
- 量子源和传感器的熵都不够时，**拒绝出卦**，不回退到 `Math.random()` 或 `crypto.getRandomValues()`。冒烟测试会把这两个函数换成桩，确认它们没被调用。
- 每一卦都保存熵源凭据（量子原始字节、摘要），可以在 App 里查看，并对量子字节做 NIST SP800-22 单比特频数检验。

## 功能

- 起卦：摇钱（量子 + 传感器）、离线摇钱（只用传感器）、时间、报数、汉字、手工装卦
- 排盘：京房八宫纳甲，包括六亲、六神、世应、伏神、卦身、旬空、月破、暗动；**本卦和变卦并排对照**；变爻标注回头生克、进退神、化合、化墓绝、反吟、伏吟
- 断卦：按所问类别自动取用神，评估旺衰强弱，画五行生克图，标出原神忌神，推演应期时间轴（规则引擎，仅供参考）
- 爻位详解：月建和日辰对该爻的作用、十二长生、与其他爻的关系、爻辞、小象、白话解释
- 卦例库：分类、搜索、收藏、应验反馈统计、笔记、导入导出
- 万年历：干支、节气、旬空、神煞、宜忌
- 卦典：六十四卦可按文王卦序或京房八宫浏览，包括卦辞、彖传、象传、爻辞、白话和纳甲

## 数据来源

- 经文：维基文库《周易》（公有领域）。爻辞逐字对齐武英殿本《御纂周易折中》（1715），对齐数据来自 [poplolioi11/yigua-wuyingdian-lines](https://github.com/poplolioi11/yigua-wuyingdian-lines)。
- 白话简释：本项目撰写，依据朱熹、程颐一系的通行理解。
- 历法：[lunar-javascript](https://github.com/6tail/lunar-javascript)（MIT）
- 字体：马善政楷书、思源宋体（SIL OFL），构建时按用字子集化

## 构建

推送到 `main` 分支后，GitHub Actions 会自动跑测试并构建 APK，产物在 Actions 的 Artifacts 里下载。推送 `v*` 标签时，还会自动发布 Release。

本地构建步骤：

```bash
npm install && npm test
pip install fonttools brotli pillow && npm run fonts && npm run icons
npx cap add android && npx capacitor-assets generate --android && npx cap sync android
python3 scripts/patch_android.py
cd android && ./gradlew assembleRelease
```

> `ci/debug.keystore` 只是一个公开的测试签名，用来保证每次构建出的 APK 能覆盖安装。正式上架前要换成私有密钥。
