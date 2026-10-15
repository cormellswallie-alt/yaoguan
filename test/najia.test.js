const assert = require('assert');
const N = require('../www/js/najia.js');
global.window = global; require('../www/data/zhouyi.js'); const zy = global.ZHOUYI;
let pass = 0;
const t = (name, fn) => { fn(); pass++; };

// 1. 八宫：64 卦全部覆盖且互不重复
t('palace covers 64', () => {
  assert.strictEqual(Object.keys(N.PALACE).length, 64);
});
// 2. 与经文数据一致：每卦都能在八宫找到
t('zhouyi lines in palace', () => zy.forEach(h => assert.ok(N.PALACE[h.lines], h.name)));

// 3. 经典宫位/世位抽查
const chk = (lines, palace, shi, kind) => {
  const p = N.PALACE[lines];
  assert.deepStrictEqual([p.palace, p.shi, p.kind], [palace, shi, kind], lines);
};
t('palace samples', () => {
  chk('111000', '坤', 3, '三世');   // 地天泰
  chk('011100', '震', 3, '三世');   // 雷风恒
  chk('111111', '乾', 6, '本宫');
  chk('011111', '乾', 1, '一世');   // 天风姤
  chk('000101', '乾', 4, '游魂');   // 火地晋
  chk('111101', '乾', 3, '归魂');   // 火天大有
  chk('101010', '坎', 3, '三世');   // 水火既济（下离上坎）
  chk('010101', '离', 3, '三世');   // 火水未济（下坎上离）
  chk('110000', '坤', 2, '二世');   // 地泽临
  chk('001010', '兑', 4, '四世');   // 水山蹇
  chk('101101', '离', 6, '本宫');
  chk('001101', '离', 1, '一世');   // 火山旅
  chk('100011', '巽', 3, '三世');   // 风雷益
  chk('110011', '艮', 4, '游魂');   // 风泽中孚
});

// 4. 设计稿示例：2026-10-15 壬戌日 地天泰(初、四爻动) 之 雷风恒
const gz = { year: '丙午', month: '戊戌', day: '壬戌', time: '丁未' };
const pan = N.paipan([9, 7, 7, 6, 8, 8], gz);
t('tai->heng', () => {
  assert.strictEqual(pan.ben, '111000');
  assert.strictEqual(pan.bian, '011100');
  assert.strictEqual(pan.kong, '子丑');
  const s = pan.yao.map(y => y.liushen + y.liuqin + y.gan + y.zhi + y.wx).join(' ');
  assert.strictEqual(s, '玄武妻财甲子水 青龙官鬼甲寅木 朱雀兄弟甲辰土 勾陈兄弟癸丑土 螣蛇妻财癸亥水 白虎子孙癸酉金');
  assert.ok(pan.yao[2].shi && pan.yao[5].ying);
  assert.strictEqual(pan.yao[0].bian.liuqin + pan.yao[0].bian.zhi, '兄弟丑');
  assert.ok(pan.yao[0].bian.rel.includes('回头克'));
  assert.ok(pan.yao[0].bian.rel.includes('化合'));
  assert.strictEqual(pan.yao[3].bian.liuqin + pan.yao[3].bian.zhi, '父母午');
  assert.ok(pan.yao[3].bian.rel.includes('回头生'));
  // 泰卦缺父母，伏神取坤为地二爻 乙巳火
  const f = pan.yao.find(y => y.fushen);
  assert.strictEqual(f.pos, 2);
  assert.strictEqual(f.fushen.liuqin + f.fushen.gan + f.fushen.zhi, '父母乙巳');
  assert.ok(pan.benInfo.liuhe, '泰为六合卦');
});
// 5. 六冲卦
t('liuchong', () => {
  ['111111', '000000', '100100', '011011', '010010', '101101', '001001', '110110', '100111', '111100'].forEach(l => {
    const p = N.paipan(l.split('').map(c => c === '1' ? 7 : 8), gz);
    assert.ok(p.benInfo.liuchong, l);
  });
});
// 6. 旬空
t('xunkong', () => {
  assert.strictEqual(N.xunkong('甲子'), '戌亥');
  assert.strictEqual(N.xunkong('甲戌'), '申酉');
  assert.strictEqual(N.xunkong('癸亥'), '子丑');
  assert.strictEqual(N.xunkong('壬戌'), '子丑');
  assert.strictEqual(N.xunkong('丙寅'), '戌亥');
});
// 7. 乾为天纳甲
t('qian najia', () => {
  const p = N.paipan([7, 7, 7, 7, 7, 7], { year: '甲子', month: '丙寅', day: '甲子', time: '甲子' });
  assert.strictEqual(p.yao.map(y => y.zhi).join(''), '子寅辰午申戌');
  assert.strictEqual(p.yao.map(y => y.liuqin).join(','), '子孙,妻财,父母,官鬼,兄弟,父母');
  assert.strictEqual(p.yao[0].liushen, '青龙');
  assert.strictEqual(p.bian, null);
});
// 8. 姤卦（乾宫一世）伏神：缺妻财，伏于二爻寅木
t('gou fushen', () => {
  const p = N.paipan([8, 7, 7, 7, 7, 7], gz);
  const f = p.yao.filter(y => y.fushen).map(y => y.pos + y.fushen.liuqin + y.fushen.zhi);
  assert.deepStrictEqual(f, ['2妻财寅']);
});
console.log('najia tests passed:', pass);
