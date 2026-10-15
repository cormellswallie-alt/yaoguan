/* 爻观 · 京房纳甲排盘引擎
 * 约定：卦以 6 位字符串表示，自下而上（index 0 = 初爻），'1' 阳 '0' 阴。
 * 爻值：6 老阴(×，动) 7 少阳 8 少阴 9 老阳(○，动)
 */
(function (root) {
  'use strict';
  const GAN = '甲乙丙丁戊己庚辛壬癸';
  const ZHI = '子丑寅卯辰巳午未申酉戌亥';

  // 八经卦（三位，自下而上）
  const TRI = {
    '111': { name: '乾', xiang: '天', wx: '金' },
    '110': { name: '兑', xiang: '泽', wx: '金' },
    '101': { name: '离', xiang: '火', wx: '火' },
    '100': { name: '震', xiang: '雷', wx: '木' },
    '011': { name: '巽', xiang: '风', wx: '木' },
    '010': { name: '坎', xiang: '水', wx: '水' },
    '001': { name: '艮', xiang: '山', wx: '土' },
    '000': { name: '坤', xiang: '地', wx: '土' },
  };
  // 纳甲：[内卦天干, 外卦天干, 内卦三地支(初二三), 外卦三地支(四五上)]
  const NAJIA = {
    '乾': ['甲', '壬', '子寅辰', '午申戌'],
    '坤': ['乙', '癸', '未巳卯', '丑亥酉'],
    '震': ['庚', '庚', '子寅辰', '午申戌'],
    '巽': ['辛', '辛', '丑亥酉', '未巳卯'],
    '坎': ['戊', '戊', '寅辰午', '申戌子'],
    '离': ['己', '己', '卯丑亥', '酉未巳'],
    '艮': ['丙', '丙', '辰午申', '戌子寅'],
    '兑': ['丁', '丁', '巳卯丑', '亥酉未'],
  };
  const ZHI_WX = { 子: '水', 丑: '土', 寅: '木', 卯: '木', 辰: '土', 巳: '火', 午: '火', 未: '土', 申: '金', 酉: '金', 戌: '土', 亥: '水' };
  const GAN_WX = { 甲: '木', 乙: '木', 丙: '火', 丁: '火', 戊: '土', 己: '土', 庚: '金', 辛: '金', 壬: '水', 癸: '水' };
  const SHENG = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' };
  const KE = { 木: '土', 土: '水', 水: '火', 火: '金', 金: '木' };
  const LIUSHEN = ['青龙', '朱雀', '勾陈', '螣蛇', '白虎', '玄武'];
  const LS_START = { 甲: 0, 乙: 0, 丙: 1, 丁: 1, 戊: 2, 己: 3, 庚: 4, 辛: 4, 壬: 5, 癸: 5 };
  const CHONG = (a, b) => Math.abs(ZHI.indexOf(a) - ZHI.indexOf(b)) === 6;
  const HE_PAIRS = ['子丑', '寅亥', '卯戌', '辰酉', '巳申', '午未'];
  const HE = (a, b) => HE_PAIRS.includes(a + b) || HE_PAIRS.includes(b + a);
  // 地支自身六合/六冲卦判定用

  function flip(s, i) { return s.slice(0, i) + (s[i] === '1' ? '0' : '1') + s.slice(i + 1); }

  // ---------- 八宫 ----------
  // 每宫 8 卦：本宫(六世) 一世 二世 三世 四世 五世 游魂(四世) 归魂(三世)
  const PALACE = {}; // lines -> {palace, wx, shi, ying, order, kind}
  ['111', '000', '100', '011', '010', '101', '001', '110'].forEach(t => {
    const pure = t + t;
    const seq = [pure];
    let cur = pure;
    for (let i = 0; i < 5; i++) { cur = flip(cur, i); seq.push(cur); } // 一世..五世
    const youhun = flip(cur, 3); seq.push(youhun);              // 游魂：五世卦四爻变
    const guihun = youhun.slice(0, 3).split('').map(c => c === '1' ? '0' : '1').join('') + youhun.slice(3); // 归魂：内卦全变
    seq.push(guihun);
    const shi = [6, 1, 2, 3, 4, 5, 4, 3];
    const kinds = ['本宫', '一世', '二世', '三世', '四世', '五世', '游魂', '归魂'];
    seq.forEach((h, k) => {
      const s = shi[k];
      PALACE[h] = { palace: TRI[t].name, wx: TRI[t].wx, shi: s, ying: ((s + 2) % 6) + 1, order: k, kind: kinds[k] };
    });
  });

  function liuqin(gongWx, yaoWx) {
    if (gongWx === yaoWx) return '兄弟';
    if (SHENG[gongWx] === yaoWx) return '子孙';
    if (SHENG[yaoWx] === gongWx) return '父母';
    if (KE[gongWx] === yaoWx) return '妻财';
    return '官鬼';
  }

  // 纳甲某卦的六爻干支
  function najia(lines) {
    const lo = TRI[lines.slice(0, 3)].name, up = TRI[lines.slice(3)].name;
    const res = [];
    for (let i = 0; i < 6; i++) {
      const inner = i < 3;
      const t = inner ? NAJIA[lo] : NAJIA[up];
      const gan = inner ? t[0] : t[1];
      const zhi = inner ? t[2][i] : t[3][i - 3];
      res.push({ gan, zhi, wx: ZHI_WX[zhi] });
    }
    return res;
  }

  // 卦身：世爻为阳从子起，为阴从午起，数至世爻
  function guashen(lines, shi) {
    const yang = lines[shi - 1] === '1';
    return ZHI[((yang ? 0 : 6) + shi - 1) % 12];
  }

  // 十二长生
  const CS = ['长生', '沐浴', '冠带', '临官', '帝旺', '衰', '病', '死', '墓', '绝', '胎', '养'];
  const CS_START = { 木: '亥', 火: '寅', 土: '申', 金: '巳', 水: '申' }; // 土随水
  function changsheng(wx, zhi) {
    const s = ZHI.indexOf(CS_START[wx]);
    return CS[(ZHI.indexOf(zhi) - s + 12) % 12];
  }

  // 旺相休囚死（以月令地支五行论）
  function wangshuai(yaoWx, monthZhi) {
    const m = ZHI_WX[monthZhi];
    if (yaoWx === m) return '旺';
    if (SHENG[m] === yaoWx) return '相';
    if (SHENG[yaoWx] === m) return '休';
    if (KE[yaoWx] === m) return '囚';
    return '死';
  }

  // 旬空
  function xunkong(dayGZ) {
    const g = GAN.indexOf(dayGZ[0]), z = ZHI.indexOf(dayGZ[1]);
    const a = (z - g + 10 + 12) % 12;
    return ZHI[a] + ZHI[(a + 1) % 12];
  }

  // 神煞（以日干/日支）
  function shensha(dayGZ, monthZhi) {
    const g = dayGZ[0], z = dayGZ[1];
    const GUIREN = { 甲: '丑未', 戊: '丑未', 庚: '丑未', 乙: '子申', 己: '子申', 丙: '亥酉', 丁: '亥酉', 壬: '卯巳', 癸: '卯巳', 辛: '午寅' };
    const LU = { 甲: '寅', 乙: '卯', 丙: '巳', 丁: '午', 戊: '巳', 己: '午', 庚: '申', 辛: '酉', 壬: '亥', 癸: '子' };
    const YANGREN = { 甲: '卯', 丙: '午', 戊: '午', 庚: '酉', 壬: '子', 乙: '辰', 丁: '未', 己: '未', 辛: '戌', 癸: '丑' };
    const sanhe = { 申: 0, 子: 0, 辰: 0, 寅: 1, 午: 1, 戌: 1, 巳: 2, 酉: 2, 丑: 2, 亥: 3, 卯: 3, 未: 3 }[z];
    const YIMA = ['寅', '申', '亥', '巳'][sanhe];
    const TAOHUA = ['酉', '卯', '午', '子'][sanhe];
    const HUAGAI = ['辰', '戌', '丑', '未'][sanhe];
    const JIANGXING = ['子', '午', '酉', '卯'][sanhe];
    const WENCHANG = { 甲: '巳', 乙: '午', 丙: '申', 丁: '酉', 戊: '申', 己: '酉', 庚: '亥', 辛: '子', 壬: '寅', 癸: '卯' };
    const TIANYI = ZHI[(ZHI.indexOf(monthZhi) + 11) % 12]; // 天医：月支前一位
    return [
      { name: '贵人', zhi: GUIREN[g] }, { name: '日禄', zhi: LU[g] }, { name: '驿马', zhi: YIMA },
      { name: '桃花', zhi: TAOHUA }, { name: '羊刃', zhi: YANGREN[g] }, { name: '文昌', zhi: WENCHANG[g] },
      { name: '华盖', zhi: HUAGAI }, { name: '将星', zhi: JIANGXING }, { name: '天医', zhi: TIANYI },
    ];
  }

  function isLiuchong(lines) {
    const n = najia(lines);
    return [0, 1, 2].every(i => CHONG(n[i].zhi, n[i + 3].zhi));
  }
  function isLiuhe(lines) {
    const n = najia(lines);
    return [0, 1, 2].every(i => HE(n[i].zhi, n[i + 3].zhi));
  }

  /**
   * 排盘
   * @param {number[]} vals 6 个爻值（自下而上），6/7/8/9
   * @param {{year:string,month:string,day:string,time:string}} gz 四柱干支
   */
  function paipan(vals, gz) {
    if (vals.length !== 6) throw new Error('需要 6 个爻值');
    const ben = vals.map(v => (v === 7 || v === 9) ? '1' : '0').join('');
    const moving = vals.map(v => v === 6 || v === 9);
    const bian = vals.map(v => v === 9 ? '0' : v === 6 ? '1' : ((v === 7) ? '1' : '0')).join('');
    const hasMove = moving.some(Boolean);
    const P = PALACE[ben], PB = PALACE[bian];
    const nj = najia(ben), njb = najia(bian);
    const monthZhi = gz.month[1], dayZhi = gz.day[1];
    const kong = xunkong(gz.day);
    const ls0 = LS_START[gz.day[0]];

    // 伏神：本宫纯卦的六亲，本卦中缺失的六亲取纯卦对应爻
    const pureLines = Object.keys(TRI).find(k => TRI[k].name === P.palace);
    const pureNj = najia(pureLines + pureLines);
    const present = new Set(nj.map(x => liuqin(P.wx, x.wx)));
    const fushen = Array(6).fill(null);
    pureNj.forEach((x, i) => {
      const q = liuqin(P.wx, x.wx);
      if (!present.has(q)) fushen[i] = { liuqin: q, gan: x.gan, zhi: x.zhi, wx: x.wx };
    });

    const yao = nj.map((x, i) => {
      const q = liuqin(P.wx, x.wx);
      const o = {
        pos: i + 1, val: vals[i], yang: ben[i] === '1', moving: moving[i],
        liushen: LIUSHEN[(ls0 + i) % 6], liuqin: q, gan: x.gan, zhi: x.zhi, wx: x.wx,
        shi: P.shi === i + 1, ying: P.ying === i + 1,
        kong: kong.includes(x.zhi),
        yuePo: CHONG(x.zhi, monthZhi), riChong: CHONG(x.zhi, dayZhi),
        wangshuai: wangshuai(x.wx, monthZhi),
        changshengDay: changsheng(x.wx, dayZhi),
        fushen: fushen[i],
      };
      if (o.riChong && !o.moving) o.anDong = o.wangshuai === '旺' || o.wangshuai === '相';
      if (moving[i]) {
        const b = njb[i];
        const bq = liuqin(P.wx, b.wx); // 变爻六亲仍以本卦宫五行论
        let rel = '';
        if (SHENG[b.wx] === x.wx) rel = '回头生';
        else if (KE[b.wx] === x.wx) rel = '回头克';
        else if (b.wx === x.wx) {
          const d = (ZHI.indexOf(b.zhi) - ZHI.indexOf(x.zhi) + 12) % 12;
          // 进神：寅→卯 巳→午 申→酉 亥→子 丑→辰 辰→未 未→戌 戌→丑
          const JIN = { 寅: '卯', 巳: '午', 申: '酉', 亥: '子', 丑: '辰', 辰: '未', 未: '戌', 戌: '丑' };
          if (JIN[x.zhi] === b.zhi) rel = '化进神';
          else if (JIN[b.zhi] === x.zhi) rel = '化退神';
          else rel = d === 0 ? '伏吟' : '比和';
        } else if (SHENG[x.wx] === b.wx) rel = '化泄';
        else if (KE[x.wx] === b.wx) rel = '化财';
        if (CHONG(x.zhi, b.zhi)) rel += (rel ? ' · ' : '') + '反吟';
        if (HE(x.zhi, b.zhi)) rel += (rel ? ' · ' : '') + '化合';
        const kongB = kong.includes(b.zhi);
        o.bian = { liuqin: bq, gan: b.gan, zhi: b.zhi, wx: b.wx, rel, kong: kongB, yang: bian[i] === '1',
          changsheng: changsheng(x.wx, b.zhi) };
        if (o.bian.changsheng === '墓') o.bian.rel += (o.bian.rel ? ' · ' : '') + '化墓';
        if (o.bian.changsheng === '绝') o.bian.rel += (o.bian.rel ? ' · ' : '') + '化绝';
      }
      return o;
    });

    // 卦身
    const gs = guashen(ben, P.shi);
    yao.forEach(y => { y.guashen = y.zhi === gs; });

    const hu = ben.slice(1, 4) + ben.slice(2, 5);
    const cuo = ben.split('').map(c => c === '1' ? '0' : '1').join('');
    const zong = ben.split('').reverse().join('');

    return {
      ben, bian: hasMove ? bian : null, hasMove,
      benInfo: { ...P, lower: TRI[ben.slice(0, 3)], upper: TRI[ben.slice(3)], liuchong: isLiuchong(ben), liuhe: isLiuhe(ben) },
      bianInfo: hasMove ? { ...PB, lower: TRI[bian.slice(0, 3)], upper: TRI[bian.slice(3)], liuchong: isLiuchong(bian), liuhe: isLiuhe(bian) } : null,
      yao, guashen: gs, kong, gz,
      hu, cuo, zong,
      shensha: shensha(gz.day, monthZhi),
      movingCount: moving.filter(Boolean).length,
    };
  }

  /** 用神建议：按所问类别 */
  const CATEGORY_YS = {
    '事业': '官鬼', '求职': '官鬼', '考试': '父母', '学业': '父母', '财运': '妻财', '投资': '妻财',
    '感情': null, '婚姻': null, '健康': '官鬼', '出行': '世', '寻物': '妻财', '官司': '官鬼', '房产': '父母', '子女': '子孙', '其他': '世',
  };
  function pickYongshen(pan, category, gender) {
    let q = CATEGORY_YS[category];
    if (q === undefined) q = '世';
    if (q === null) q = gender === '女' ? '官鬼' : '妻财';
    if (q === '世') { const y = pan.yao.find(y => y.shi); return { liuqin: '世爻', yao: y, fu: false }; }
    // 多现时：动爻 > 持世应 > 旺相 > 其他
    const cands = pan.yao.filter(y => y.liuqin === q);
    if (cands.length) {
      const score = y => (y.moving ? 8 : 0) + (y.shi || y.ying ? 4 : 0) + ({ 旺: 3, 相: 2, 休: 1 }[y.wangshuai] || 0) - (y.kong ? 1 : 0);
      cands.sort((a, b) => score(b) - score(a));
      return { liuqin: q, yao: cands[0], fu: false };
    }
    const f = pan.yao.find(y => y.fushen && y.fushen.liuqin === q);
    return { liuqin: q, yao: f || null, fu: true };
  }

  /** 力量评估（0~100），用于界面强弱条；规则简化、仅作参考 */
  function strength(y, pan) {
    const m = { 旺: 40, 相: 30, 休: 15, 囚: 8, 死: 5 }[y.wangshuai];
    let s = m;
    const dz = pan.gz.day[1];
    if (ZHI_WX[dz] === y.wx) s += 20; else if (SHENG[ZHI_WX[dz]] === y.wx) s += 15; else if (KE[ZHI_WX[dz]] === y.wx) s -= 15;
    if (y.yuePo) s -= 20;
    if (y.kong && !y.moving) s -= 10;
    if (y.moving && y.bian) {
      if (y.bian.rel.includes('回头生') || y.bian.rel.includes('进神')) s += 15;
      if (y.bian.rel.includes('回头克') || y.bian.rel.includes('退神') || y.bian.rel.includes('化绝')) s -= 15;
    }
    pan.yao.forEach(o => { if (o.moving && o !== y) { if (SHENG[o.wx] === y.wx) s += 8; if (KE[o.wx] === y.wx) s -= 8; } });
    return Math.max(4, Math.min(100, Math.round(s + 20)));
  }

  root.Najia = { paipan, pickYongshen, strength, xunkong, changsheng, wangshuai, liuqin, TRI, ZHI, GAN, ZHI_WX, GAN_WX, SHENG, KE, CHONG, HE, PALACE, najia };
  if (typeof module !== 'undefined') module.exports = root.Najia;
})(typeof window !== 'undefined' ? window : globalThis);
