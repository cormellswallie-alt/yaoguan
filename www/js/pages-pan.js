/* 爻观 · 排盘 / 断卦 / 笔记 / 爻详情 */
(function () {
  'use strict';
  const Y = window.__YG, N = window.Najia;
  const { routes, esc, ic, hx, yaoBar, toast, sheet, WX_C, pad2, BY_LINES } = Y;
  const POSN = ['初', '二', '三', '四', '五', '上'];
  const yaoTitle = (lines, i) => (i === 0 ? '初' : i === 5 ? '上' : '') + (lines[i] === '1' ? '九' : '六') + (i > 0 && i < 5 ? POSN[i] : '');
  const findCase = id => Y.cases.find(c => c.id === id);

  function build(c) {
    const pan = N.paipan(c.vals, c.gz);
    const ys = N.pickYongshen(pan, c.category, c.gender);
    return { pan, ys };
  }

  // =====================================================================
  // 04 排盘 · 05 断卦 · 笔记（同一路由，分段切换）
  // =====================================================================
  routes.pan = {
    html(p) {
      const c = findCase(p.id); if (!c) return '<div class="empty">卦例不存在</div>';
      p.tab = p.tab || 'pan';
      const { pan, ys } = build(c);
      const H = BY_LINES[pan.ben], HB = pan.bian ? BY_LINES[pan.bian] : null;
      const mvPos = pan.yao.filter(y => y.moving).map(y => POSN[y.pos - 1]).join('·');
      const bi = pan.benInfo, bbi = pan.bianInfo;
      const tag = info => [info.palace + '宫', info.kind === '本宫' ? '六世' : info.kind, info.liuchong ? '<span class="red">六冲</span>' : '', info.liuhe ? '<span class="red">六合</span>' : ''].filter(Boolean).join(' · ');
      const head = `
      <div class="nv"><button class="ib" data-act="back">${ic('back')}</button>
        <div class="seg">${[['pan', '排盘'], ['duan', '断卦'], ['note', '笔记']].map(([k, n]) => `<button class="${p.tab === k ? 'on' : ''}" data-tab="${k}">${n}</button>`).join('')}</div>
        <button class="ib" data-act="more">${ic('share', 20)}</button></div>
      <div class="px mt6 row gap8" style="font-size:12px;color:var(--mute)">
        <span class="st" style="background:var(--ink);color:var(--paper)">${esc(c.category)}</span><span class="f1" style="color:var(--ink2);font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(c.question)}</span><span>${c.gender} · ${N.GAN[(c.birthYear - 4) % 10] || ''}${N.ZHI[(c.birthYear - 4) % 12] || ''}</span>
      </div>
      <div class="px mt14" style="display:grid;grid-template-columns:1fr ${HB ? '34px 1fr' : ''};align-items:center">
        <button class="row gap10" data-gua="${pan.ben}" style="text-align:left">
          ${hx(pan.ben, { w: 30, h: 4.5, g: 4, gap: 6, moving: pan.yao.map(y => y.moving) })}
          <div><div style="font-size:10px;color:var(--mute);letter-spacing:2px">本 卦</div><div class="cal" style="font-size:${HB ? 30 : 34}px;line-height:36px;white-space:nowrap">${H.full}</div><div style="font-size:10.5px;color:var(--ink2)">${tag(bi)}</div></div>
        </button>
        ${HB ? `<div style="text-align:center"><svg width="26" height="12" viewBox="0 0 26 12"><path d="M1 6h22M18 1.5 23.5 6 18 10.5" stroke="var(--red)" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg><div style="font-size:9.5px;color:var(--red);margin-top:2px;white-space:nowrap">${mvPos}</div></div>
        <button class="row gap10" data-gua="${pan.bian}" style="justify-content:flex-end;text-align:right">
          <div><div style="font-size:10px;color:var(--mute);letter-spacing:2px">变 卦</div><div class="cal" style="font-size:30px;line-height:36px;color:var(--ink2);white-space:nowrap">${HB.full}</div><div style="font-size:10.5px;color:var(--ink2)">${tag(bbi)}</div></div>
          ${hx(pan.bian, { w: 30, h: 4.5, g: 4, gap: 6, c: '#A79D8D' })}
        </button>` : ''}
      </div>
      <div class="px mt14"><div style="display:grid;grid-template-columns:repeat(5,1fr);border-top:1px solid var(--hair);border-bottom:1px solid var(--hair);padding:8px 0;text-align:center">
        ${[['年', c.gz.year], ['月建', c.gz.month], ['日辰', c.gz.day, 'red'], ['时', c.gz.time], ['旬空', pan.kong, 'gold']].map(([k, v, cl], i) => `<div style="${i ? 'border-left:1px solid var(--hair2)' : ''}"><div style="font-size:9.5px;color:${cl ? 'var(--' + cl + ')' : 'var(--mute)'};letter-spacing:1px">${k}</div><div class="serif" style="font-size:15px;font-weight:${cl === 'red' ? 700 : 600};${cl ? 'color:var(--' + cl + ')' : ''}">${v}</div></div>`).join('')}
      </div></div>`;
      if (p.tab === 'pan') return head + panTable(c, pan, ys, HB);
      if (p.tab === 'duan') return head + duan(c, pan, ys);
      return head + notes(c);
    },
    mount(v, p) {
      const c = findCase(p.id); if (!c) return;
      v.onclick = e => {
        const b = e.target.closest('[data-tab],[data-act],[data-yao],[data-gua],[data-v]'); if (!b) return;
        if (b.dataset.tab) { p.tab = b.dataset.tab; Y.render(); return; }
        if (b.dataset.yao) { yaoSheet(c, +b.dataset.yao); return; }
        if (b.dataset.gua) { Y.go('gua', { lines: b.dataset.gua }); return; }
        if (b.dataset.v) { c.verdict = b.dataset.v; c.verdictAt = Date.now(); Y.saveCases(); Y.render(); toast('已标记：' + { ok: '已应', no: '未应', wait: '待验' }[c.verdict]); return; }
        const a = b.dataset.act;
        if (a === 'back') Y.back();
        if (a === 'fav') { c.fav = !c.fav; Y.saveCases(); Y.render(); }
        if (a === 'duan') { p.tab = 'duan'; Y.render(); v.scrollTop = 0; }
        if (a === 'note') { p.tab = 'note'; Y.render(); }
        if (a === 'proof') Y.go('proof', { id: c.id });
        if (a === 'addnote') { const t = v.querySelector('#nt'); const s = (t.value || '').trim(); if (!s) return; c.notes.push({ t: Date.now(), s }); Y.saveCases(); Y.render(); }
        if (a === 'more') moreSheet(c);
        if (a === 'ss') { ssSheet(c); }
      };
    },
  };

  function panTable(c, pan, ys, HB) {
    const ysYao = ys.yao && !ys.fu ? ys.yao.pos : 0;
    const rows = pan.yao.slice().reverse().map(y => {
      const i = y.pos - 1;
      const b = y.bian;
      const bianLine = pan.bian ? pan.bian[i] === '1' : null;
      return `<button class="pr ${y.moving ? 'mv' : ''} ${y.pos === ysYao ? 'ys' : ''}" data-yao="${y.pos}" style="width:100%;text-align:left">
        <span class="ls">${y.liushen}</span>
        <span class="fs">${y.fushen ? `${y.fushen.liuqin}<br>${y.fushen.gan}${y.fushen.zhi}${y.fushen.wx}` : ''}</span>
        <span class="lq"><b style="${y.pos === ysYao ? 'color:var(--jade)' : ''}">${y.liuqin}</b> ${y.gan}${y.zhi}<span style="color:${WX_C[y.wx]}">${y.wx}</span>${y.kong ? '<span class="kong">空</span>' : ''}<small style="${y.pos === ysYao ? 'color:var(--jade)' : ''}">${[y.pos === ysYao ? '用神' : '', y.guashen ? '卦身' : '', y.yuePo ? '月破' : '', y.anDong ? '暗动' : ''].filter(Boolean).join(' · ') || y.wangshuai}</small></span>
        <span>${yaoBar(y.yang, y.moving, 36, 6)}</span>
        <span>${y.shi ? '<span class="seal" style="width:18px;height:18px;font-size:10px">世</span>' : y.ying ? '<span class="sealo" style="width:18px;height:18px;font-size:10px">应</span>' : ''}</span>
        <span class="mk">${y.val === 9 ? '○' : y.val === 6 ? '×' : ''}</span>
        <span style="padding-left:4px">${pan.bian ? yaoBar(bianLine, y.moving, 32, 5, y.moving ? null : '#BDB3A3') : ''}</span>
        <span class="lq bq">${b ? `<b>${b.liuqin}</b> ${b.zhi}<span>${b.wx}</span>${b.kong ? '<span class="kong">空</span>' : ''}<small>${esc(b.rel || '')}</small>` : (pan.bian ? `<span style="opacity:.55">${N.liuqin(pan.benInfo.wx, N.najia(pan.bian)[i].wx)} ${N.najia(pan.bian)[i].zhi}</span>` : '')}</span>
      </button>`;
    }).join('');
    const ss = pan.shensha;
    const H = BY_LINES[pan.ben];
    return `
      <div class="pan card mt12" style="--split:${pan.bian ? '61%' : '200%'}">
        <div class="pr hd"><span style="text-align:center">六神</span><span>伏神</span><span>本卦</span><span></span><span></span><span></span><span style="padding-left:4px">${pan.bian ? '变卦' : ''}</span><span></span></div>
        ${rows}
      </div>
      <div class="px mt12 chips">${ss.slice(0, 5).map(s => `<button class="chip sm" data-act="ss">${s.name} <b>${s.zhi}</b></button>`).join('')}<button class="chip sm" data-act="ss">更多 ›</button></div>
      <div class="px mt12"><div class="card" style="padding:12px 14px">
        <div class="row gap8"><span class="serif" style="font-weight:700">${H.name}</span><span class="mute" style="font-size:11px">${esc(H.key || '')}</span><span class="f1"></span><button class="mute" style="font-size:11px" data-gua="${pan.ben}">卦典 ›</button></div>
        <div class="serif mt6" style="font-size:15px;line-height:24px">${esc(H.gua)}</div>
        <div class="mute mt6" style="font-size:12px;line-height:20px">${esc(H.bh || '')}</div>
      </div></div>
      ${c.trng ? `<div class="px mt10"><button class="card row gap10" data-act="proof" style="width:100%;padding:11px 14px;text-align:left;border-color:#E6BFB4;background:linear-gradient(90deg,#F8ECE6,var(--card))"><span class="red">${ic('atom', 20)}</span><span class="f1" style="font-size:12.5px">${c.trng.lines.every(l => l.quantumHex) ? '量子物理真随机起卦' : '传感器物理噪声起卦'} · <span class="mute">查看每一爻的熵源凭据</span></span>${ic('chev', 16)}</button></div>` : c.methodNote ? `<div class="px mt10 mute" style="font-size:11.5px">起卦：${esc(c.methodNote)}</div>` : ''}
      <div class="px mt14 row gap10">
        <button class="ib bd" style="width:52px;height:52px;border-radius:26px" data-act="note">${ic('note', 21)}</button>
        <button class="ib bd" style="width:52px;height:52px;border-radius:26px;color:${c.fav ? 'var(--gold)' : 'inherit'}" data-act="fav">${ic(c.fav ? 'starf' : 'star', 21)}</button>
        <button class="btn r f1" style="height:52px;font-size:16px;letter-spacing:3px" data-act="duan">进入断卦 ${ic('chev', 16)}</button>
      </div>
      <div class="px mt10 mute" style="text-align:center;font-size:10.5px;letter-spacing:1px">轻触任一爻 · 查看旺衰、生克与爻辞</div>`;
  }

  // ---------------- 断卦 ----------------
  function duan(c, pan, ys) {
    const shi = pan.yao.find(y => y.shi);
    const yy = ys.yao ? (ys.fu ? { ...ys.yao.fushen, pos: ys.yao.pos, liushen: ys.yao.liushen, fu: true, wangshuai: N.wangshuai(ys.yao.fushen.wx, c.gz.month[1]), kong: pan.kong.includes(ys.yao.fushen.zhi), moving: false, yuePo: N.CHONG(ys.yao.fushen.zhi, c.gz.month[1]) } : ys.yao) : null;
    const sY = yy ? N.strength(yy, pan) : 0, sS = N.strength(shi, pan);
    const lv = v => Math.max(1, Math.min(5, Math.round(v / 20)));
    const bar = (v, col) => `<div class="bar mt10">${[1, 2, 3, 4, 5].map(i => `<i style="${i <= lv(v) ? 'background:' + col : ''}"></i>`).join('')}</div>`;
    // 原神/忌神
    const SH = N.SHENG, KE = N.KE;
    const yWx = yy ? yy.wx : shi.wx;
    const yuan = pan.yao.filter(o => SH[o.wx] === yWx), ji = pan.yao.filter(o => KE[o.wx] === yWx);
    const yuanMv = yuan.filter(o => o.moving), jiMv = ji.filter(o => o.moving);
    // 综合评分（规则推演，仅供参考）
    let score = sY * 0.6 + sS * 0.25;
    if (yy && !yy.fu) {
      if (yy.moving && yy.bian && /回头生|进神/.test(yy.bian.rel)) score += 8;
      if (yy.moving && yy.bian && /回头克|退神|化绝|化墓/.test(yy.bian.rel)) score -= 10;
    } else score -= 8;
    score += yuanMv.length * 6 - jiMv.length * 8;
    if (pan.benInfo.liuhe) score += 4; if (pan.benInfo.liuchong) score -= 4;
    if (yy && N.SHENG[yy.wx] === shi.wx) score += 5; if (yy && N.KE[yy.wx] === shi.wx) score -= 3;
    const L = score >= 72 ? 0 : score >= 58 ? 1 : score >= 44 ? 2 : score >= 32 ? 3 : 4;
    const LV = ['大吉', '吉', '小吉', '平', '凶'];
    // 要点
    const pts = [];
    if (yy) {
      pts.push(`用神 ${ys.liuqin} ${yy.zhi}${yy.wx}${yy.fu ? '（伏于' + POSN[yy.pos - 1] + '爻下）' : ''}，月令${yy.wangshuai}${yy.kong ? '，<b class="gold">旬空</b>' : ''}${yy.yuePo ? '，<b class="red">月破</b>' : ''}${yy.moving ? '，<b class="red">发动</b>' + (yy.bian ? '化' + yy.bian.zhi + (yy.bian.rel ? '（' + yy.bian.rel + '）' : '') : '') : ''}`);
    } else pts.push('卦中无对应用神，以世爻为主论');
    if (yuanMv.length) pts.push(`原神 ${yuanMv.map(o => o.zhi + o.wx).join('、')} 发动，生扶用神`);
    if (jiMv.length) pts.push(`<b class="red">忌神</b> ${jiMv.map(o => o.zhi + o.wx).join('、')} 发动，克制用神`);
    pts.push(`世爻 ${shi.liuqin} ${shi.zhi}${shi.wx} 月令${shi.wangshuai}${shi.riChong ? '，日冲' + (shi.anDong ? '暗动' : '为日破') : ''}${shi.kong ? '，旬空' : ''}`);
    if (pan.benInfo.liuchong) pts.push('本卦六冲，事多散、多变，近事速应');
    if (pan.benInfo.liuhe) pts.push('本卦六合，主事有聚合、成就之象');
    if (pan.bianInfo && pan.bianInfo.liuchong) pts.push('变卦六冲，先合后散，需防后续变化');
    if (!pan.hasMove) pts.push('静卦：以用神旺衰、日月生克为主');
    // 应期推演
    const ZHI = N.ZHI;
    const base = new Date(c.time); base.setHours(12, 0, 0, 0);
    const gzAt = d => { const s = window.Solar.fromYmd(d.getFullYear(), d.getMonth() + 1, d.getDate()); return s.getLunar().getDayInGanZhiExact(); };
    const nextDay = (zhiList, from = 1) => { for (let k = from; k <= 36; k++) { const d = new Date(base.getTime() + k * 864e5); const g = gzAt(d); if (zhiList.includes(g[1])) return { d, g, k }; } return null; };
    const evs = [{ d: new Date(c.time), g: c.gz.day, t: '起卦', k: 0, cls: 'ink' }];
    if (yy) {
      if (yy.kong) { const x = nextDay([yy.zhi]); x && evs.push({ ...x, t: '用神出空', cls: 'red' }); }
      else { const x = nextDay([yy.zhi]); x && evs.push({ ...x, t: '用神值日', cls: 'jade' }); }
      const chong = ZHI[(ZHI.indexOf(yy.zhi) + 6) % 12];
      if (!yy.moving && !yy.kong) { const x = nextDay([chong]); x && evs.push({ ...x, t: '冲动用神', cls: 'gold' }); }
      if (yy.moving) { const he = { 子: '丑', 丑: '子', 寅: '亥', 亥: '寅', 卯: '戌', 戌: '卯', 辰: '酉', 酉: '辰', 巳: '申', 申: '巳', 午: '未', 未: '午' }[yy.zhi]; const x = nextDay([he]); x && evs.push({ ...x, t: '合住动爻', cls: 'gold' }); }
    }
    const shengDay = nextDay(ZHI.split('').filter(z => N.SHENG[N.ZHI_WX[z]] === yWx));
    shengDay && evs.push({ ...shengDay, t: '生用之日', cls: 'mute' });
    const ev = evs.filter((e, i, a) => a.findIndex(x => x.k === e.k) === i).sort((a, b) => a.k - b.k).slice(0, 4);
    const span = Math.max(4, ev[ev.length - 1].k);
    // 关系图节点
    const node = (o, x, yv, r, fill, stroke, tc, sub) => `<circle cx="${x}" cy="${yv}" r="${r}" fill="${fill}" ${stroke ? `stroke="${stroke}" stroke-width="1.4"` : ''}/><text x="${x}" y="${yv - 1}" font-size="${r > 22 ? 13 : 11.5}" font-weight="700" fill="${tc}" text-anchor="middle" font-family="YG Serif,serif">${o}</text><text x="${x}" y="${yv + 12}" font-size="8.5" fill="${tc === '#fff' || tc === '#F2ECE1' ? '#D8E6DF' : '#8E8577'}" text-anchor="middle">${sub}</text>`;
    const Wc = { 木: '#3F6E5E', 火: '#B0352A', 土: '#8A6B3E', 金: '#9A8C70', 水: '#34506B' };
    // 五行环
    const WXS = ['木', '火', '土', '金', '水'];
    const cnt = {}; WXS.forEach(w => cnt[w] = pan.yao.filter(o => o.wx === w).length);
    const pos5 = WXS.map((w, i) => { const a = -Math.PI / 2 + i * 2 * Math.PI / 5; return [159 + Math.cos(a) * 70, 82 + Math.sin(a) * 66]; });
    let graph = '<g>';
    for (let i = 0; i < 5; i++) { const [x1, y1] = pos5[i], [x2, y2] = pos5[(i + 1) % 5]; graph += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#3F6E5E" stroke-width="1.4" opacity=".7"/>`; const [x3, y3] = pos5[(i + 2) % 5]; graph += `<line x1="${x1}" y1="${y1}" x2="${x3}" y2="${y3}" stroke="#B0352A" stroke-width="1" stroke-dasharray="3 3" opacity=".45"/>`; }
    WXS.forEach((w, i) => {
      const [x, yv] = pos5[i]; const isY = w === yWx, isS = w === shi.wx;
      const r = 16 + cnt[w] * 3;
      const roles = [isY ? '用' : '', isS ? '世' : '', SH[w] === yWx ? '原' : '', KE[w] === yWx ? '忌' : ''].filter(Boolean).join('·');
      graph += node(w, x, yv, r, isY ? Wc[w] : isS ? '#1A1714' : '#FAF7F0', isY || isS ? null : Wc[w], isY ? '#fff' : isS ? '#F2ECE1' : Wc[w], roles + (cnt[w] ? ' ×' + cnt[w] : ''));
    });
    graph += '</g>';
    return `
      <div class="px mt12"><div style="border-radius:24px;background:#1A1714;color:#EEE6D6;padding:18px 18px 16px;position:relative;overflow:hidden">
        <div class="cal" style="position:absolute;right:-6px;top:-18px;font-size:120px;line-height:1;color:#fff;opacity:.05">${BY_LINES[pan.ben].name[0]}</div>
        <div class="row gap8"><span style="font-size:10.5px;letter-spacing:2px;color:#9C9282">综合断语</span><span class="st" style="background:rgba(201,164,106,.16);color:#D9B678;height:18px;font-size:10px">规则推演 · 仅供参考</span></div>
        <div class="row gap12 mt10" style="align-items:flex-end"><span class="cal" style="font-size:50px;line-height:1;color:#F2ECE1">${LV[L]}</span>
          <div style="font-size:12.5px;line-height:19px;color:#C8BEAC;padding-bottom:3px">${['用神有力，事可速成', '用神得助，事可成', '事可成，时尚未至', '吉凶参半，宜守待时', '用神受制，不宜强求'][L]}${ev[1] ? `<br>留意 <b style="color:#E9826D">${pad2(ev[1].d.getMonth() + 1)}/${pad2(ev[1].d.getDate())} ${ev[1].g}</b> ${ev[1].t}` : ''}</div></div>
        <div class="row mt14" style="gap:4px">${[0, 1, 2, 3, 4].map(i => `<div class="f1" style="height:5px;border-radius:3px;background:${i <= L ? ['#8E2A21', '#B0352A', '#D9573F', '#C9A46A', '#857C6E'][i] : '#3B352D'};${i === L ? 'box-shadow:0 0 0 2px #1A1714,0 0 0 3.5px ' + ['#8E2A21', '#B0352A', '#D9573F', '#C9A46A', '#857C6E'][i] : ''}"></div>`).join('')}</div>
        <div class="row mt6" style="justify-content:space-between;font-size:9.5px;color:#6E665A">${LV.map((x, i) => `<span style="${i === L ? 'color:#E9826D' : ''}">${x}</span>`).join('')}</div>
      </div></div>
      <div class="px mt12" style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div class="card" style="padding:13px 14px"><div class="row" style="justify-content:space-between"><span class="lbl" style="letter-spacing:1px">用神</span><span style="font-size:10px" class="jade">${yy ? yy.liushen || '' : ''}${yy && yy.fu ? ' · 伏' : ''}</span></div>
          <div class="row gap6 mt6" style="align-items:baseline"><span class="serif jade" style="font-size:21px;font-weight:700">${ys.liuqin}</span><span class="serif" style="font-size:14px">${yy ? yy.zhi + yy.wx : '—'}</span></div>${bar(sY, 'var(--jade)')}
          <div class="mute" style="font-size:10.5px;margin-top:6px">月令 <b style="color:var(--ink2)">${yy ? yy.wangshuai : '—'}</b> · 日 <b style="color:var(--ink2)">${yy ? N.changsheng(yy.wx, c.gz.day[1]) : '—'}</b></div></div>
        <div class="card" style="padding:13px 14px"><div class="row" style="justify-content:space-between"><span class="lbl" style="letter-spacing:1px">世爻</span><span class="mute" style="font-size:10px">${shi.liushen}</span></div>
          <div class="row gap6 mt6" style="align-items:baseline"><span class="serif" style="font-size:21px;font-weight:700">${shi.liuqin}</span><span class="serif" style="font-size:14px">${shi.zhi}${shi.wx}</span></div>${bar(sS, 'var(--earth)')}
          <div class="mute" style="font-size:10.5px;margin-top:6px">月令 <b style="color:var(--ink2)">${shi.wangshuai}</b> · 日 <b style="color:var(--ink2)">${N.changsheng(shi.wx, c.gz.day[1])}</b></div></div>
      </div>
      <div class="px mt12"><div class="card" style="padding:12px 14px 6px">
        <div class="sec"><h3 style="font-size:14px">五行生克</h3><span style="font-size:10px" class="mute"><span class="jade">━</span> 相生 &nbsp;<span class="red">╍</span> 相克</span></div>
        <svg viewBox="0 0 318 168" style="display:block;width:100%;margin-top:4px">${graph}</svg>
      </div></div>
      <div class="px mt12"><div class="card" style="padding:14px 16px">
        <div class="sec"><h3 style="font-size:14px">要点</h3></div>
        <div class="mt10" style="font-size:12.5px;line-height:22px;color:var(--ink2)">${pts.map(x => `<div>· ${x}</div>`).join('')}</div>
      </div></div>
      <div class="px mt12"><div class="card" style="padding:12px 14px">
        <div class="sec"><h3 style="font-size:14px">应期推演</h3><span class="mute" style="font-size:10.5px">以日辰论 · 36 日内</span></div>
        <div style="position:relative;margin:14px 6px 0;height:48px">
          <div style="position:absolute;left:0;right:0;top:8px;height:2px;background:var(--hair)"></div>
          ${ev.map(e => { const x = e.k / span * 100; const col = { ink: 'var(--ink)', red: 'var(--red)', jade: 'var(--jade)', gold: 'var(--gold)', mute: 'var(--mute)' }[e.cls]; const al = x > 80 ? 'right:' + (100 - x) + '%;text-align:right' : x < 10 ? 'left:' + x + '%' : 'left:' + x + '%;transform:translateX(-50%);text-align:center'; return `<div style="position:absolute;left:${x}%;top:2px;width:14px;height:14px;margin-left:-7px;border-radius:7px;background:${e.cls === 'red' || e.cls === 'ink' ? col : 'var(--card)'};border:2px solid ${col}"></div><div style="position:absolute;${al};top:22px;font-size:10px;line-height:13px;color:${col};white-space:nowrap">${pad2(e.d.getMonth() + 1)}/${pad2(e.d.getDate())} ${e.g}<br><span style="color:var(--mute)">${e.t}</span></div>`; }).join('')}
        </div>
      </div></div>
      <div class="px mt14"><div class="lbl">应验反馈</div>
        <div class="row gap8 mt10">${[['ok', '已应'], ['no', '未应'], ['wait', '待验']].map(([k, n]) => `<button class="chip f1 ${c.verdict === k ? 'on' : ''}" style="justify-content:center" data-v="${k}">${n}</button>`).join('')}</div>
      </div>
      <div class="px mt12 mute" style="font-size:10.5px;line-height:17px;text-align:center">断语由规则引擎依旺衰、生克、动变推演生成，<br>不能替代你自己的判断。</div>`;
  }

  // ---------------- 笔记 ----------------
  function notes(c) {
    return `<div class="px mt14"><div class="field"><textarea id="nt" rows="3" placeholder="记下断卦思路、后续发生的事……"></textarea></div>
      <div class="row mt10" style="justify-content:flex-end"><button class="btn k" style="width:auto;height:40px;padding:0 22px;font-size:14px;letter-spacing:2px" data-act="addnote">保存</button></div></div>
      <div class="px mt14">${c.notes.length ? c.notes.slice().reverse().map(n => { const d = new Date(n.t); return `<div class="card" style="padding:12px 14px;margin-bottom:9px"><div class="mute" style="font-size:10.5px">${d.getFullYear()}.${pad2(d.getMonth() + 1)}.${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}</div><div class="mt6" style="font-size:13.5px;line-height:22px;white-space:pre-wrap;user-select:text">${esc(n.s)}</div></div>`; }).join('') : '<div class="empty"><span class="cal">记</span>还没有笔记</div>'}</div>
      <div class="px mt10"><div class="lbl">应验反馈</div><div class="row gap8 mt10">${[['ok', '已应'], ['no', '未应'], ['wait', '待验']].map(([k, n]) => `<button class="chip f1 ${c.verdict === k ? 'on' : ''}" style="justify-content:center" data-v="${k}">${n}</button>`).join('')}</div></div>`;
  }

  // ---------------- 06 爻位详解 ----------------
  function yaoSheet(c, pos) {
    const { pan } = build(c);
    const show = p => {
      const y = pan.yao[p - 1];
      const H = BY_LINES[pan.ben];
      const SH = N.SHENG, KE = N.KE;
      const rel = [];
      if (y.moving && y.bian) rel.push(['no', '化', `化出 <b>${y.bian.liuqin} ${y.bian.zhi}${y.bian.wx}</b>${y.bian.rel ? '，' + y.bian.rel : ''}`, '变爻']);
      pan.yao.forEach(o => {
        if (o === y) return;
        const tag = `${o.liuqin} ${o.zhi}${o.wx}${o.shi ? '（世）' : o.ying ? '（应）' : ''}`;
        if (o.moving && SH[o.wx] === y.wx) rel.push(['ok', '生', `受 <b>${tag}</b> 动来相生`, '得助']);
        if (o.moving && KE[o.wx] === y.wx) rel.push(['no', '克', `受 <b>${tag}</b> 动来相克`, '受制']);
        if (y.moving && SH[y.wx] === o.wx) rel.push(['ok', '生', `动而生 <b>${tag}</b>`, '生出']);
        if (y.moving && KE[y.wx] === o.wx) rel.push(['wait', '克', `动而克 <b>${tag}</b>`, '克出']);
        if (N.CHONG(o.zhi, y.zhi)) rel.push(['wait', '冲', `与 <b>${tag}</b> 相冲`, o.moving || y.moving ? '冲动' : '静冲']);
        if (N.HE(o.zhi, y.zhi)) rel.push(['ok', '合', `与 <b>${tag}</b> 相合`, '合']);
      });
      const md = c.gz.month[1], dd = c.gz.day[1];
      const r2 = (zz, nm) => { const w = N.ZHI_WX[zz]; if (N.CHONG(zz, y.zhi)) return [nm === '月建' ? '月破' : (y.wangshuai === '旺' || y.wangshuai === '相' ? '暗动' : '日破'), 'red']; if (w === y.wx) return ['比和', '']; if (SH[w] === y.wx) return ['生扶', 'jade']; if (KE[w] === y.wx) return ['受克', 'red']; if (SH[y.wx] === w) return ['泄气', 'gold']; return ['克之', 'gold']; };
      const [m1, m1c] = r2(md, '月建'), [d1, d1c] = r2(dd, '日辰');
      return `
        <div class="px mt14 row gap12">
          <div style="width:64px;height:64px;border-radius:18px;background:${y.moving ? 'var(--red-soft)' : 'var(--paper2)'};border:1px solid ${y.moving ? '#E6BFB4' : 'var(--hair)'};display:flex;flex-direction:column;align-items:center;justify-content:center;flex:none"><span class="cal" style="font-size:30px;line-height:30px;color:${y.moving ? 'var(--red)' : 'var(--ink)'}">${POSN[p - 1]}</span><span style="font-size:9.5px;margin-top:2px;color:${y.moving ? 'var(--red)' : 'var(--mute)'}">${{ 6: '老阴 ×', 7: '少阳', 8: '少阴', 9: '老阳 ○' }[y.val]}</span></div>
          <div class="f1"><div class="row gap6" style="align-items:baseline"><span class="serif" style="font-size:21px;font-weight:700">${y.liuqin} ${y.gan}${y.zhi}${y.wx}</span>${y.kong ? '<span class="kong" style="width:18px;height:18px;font-size:10px">空</span>' : ''}</div>
          <div class="mute" style="font-size:12px;margin-top:4px">${y.liushen}${y.shi ? ' · 世' : y.ying ? ' · 应' : ''}${y.guashen ? ' · 卦身' : ''}${y.fushen ? ` · 伏 ${y.fushen.liuqin}${y.fushen.zhi}${y.fushen.wx}` : ''}</div></div>
        </div>
        <div class="px mt14" style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px">
          ${[[`月建 ${md}`, m1, m1c], [`日辰 ${dd}`, d1, d1c], ['旺衰', y.wangshuai, ''], ['日长生', y.changshengDay, '']].map(([a, b, cl]) => `<div class="card" style="padding:10px 0;text-align:center"><div class="mute" style="font-size:10px">${a}</div><div class="serif ${cl}" style="font-size:16px;font-weight:700;margin-top:2px">${b}</div></div>`).join('')}
        </div>
        <div class="px mt14 lbl">与诸爻关系</div>
        <div class="px mt10"><div class="card" style="padding:2px 14px">${rel.length ? rel.slice(0, 6).map(([k, t, s, r], i) => `<div class="row" style="min-height:40px;font-size:13px;${i ? 'border-top:1px solid var(--hair2)' : ''}"><span class="st ${k}" style="width:30px;justify-content:center">${t}</span><span class="f1" style="margin-left:10px">${s}</span><span class="mute" style="font-size:11px">${r}</span></div>`).join('') : '<div class="mute" style="padding:12px 0;font-size:12.5px">与其他爻无明显动静生克</div>'}</div></div>
        <div class="px mt14 lbl">爻辞 · ${H.name} ${yaoTitle(pan.ben, p - 1)}</div>
        <div class="px mt10"><div class="qt"><div class="serif">${esc(H.yao[p - 1].split('：')[1])}</div><div class="mute mt6" style="font-size:12px;line-height:20px">《象》曰：${esc(H.yaoXiang[p - 1])}</div><div class="prose mt6" style="font-size:12.5px;line-height:21px">${esc(H.yaoBh[p - 1])}</div></div></div>
        <div class="px mt18 row gap10"><button class="btn o" data-p="${p - 1}" style="height:46px;font-size:14px;letter-spacing:2px" ${p === 1 ? 'disabled' : ''}>‹ 上一爻</button><button class="btn k" data-p="${p + 1}" style="height:46px;font-size:14px;letter-spacing:2px" ${p === 6 ? 'disabled' : ''}>下一爻 ›</button></div>`;
    };
    sheet('<div id="ys"></div>', s => {
      const box = s.querySelector('#ys'); box.innerHTML = show(pos);
      s.onclick = e => { const b = e.target.closest('[data-p]'); if (b && !b.disabled) { box.innerHTML = show(+b.dataset.p); s.scrollTop = 0; } };
    });
  }

  function ssSheet(c) {
    const { pan } = build(c);
    sheet(`<div class="px mt18 serif" style="font-size:18px;font-weight:700">神煞 <span class="mute" style="font-size:12px;font-weight:400">以日干支 ${c.gz.day} 起</span></div>
      <div class="px mt12"><div class="card list">${pan.shensha.map(s => { const hit = pan.yao.filter(y => s.zhi.includes(y.zhi)); return `<div class="li"><b style="width:44px">${s.name}</b><span class="serif f1">${s.zhi}</span><span class="mute" style="font-size:11.5px">${hit.length ? '临 ' + hit.map(y => POSN[y.pos - 1] + '爻' + y.liuqin).join('、') : '—'}</span></div>`; }).join('')}</div></div>
      <div class="px mt14 lbl">卦象关系</div>
      <div class="px mt10" style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">${[['互卦', pan.hu], ['错卦', pan.cuo], ['综卦', pan.zong]].map(([n, l]) => `<div class="card" style="padding:10px 12px"><div class="mute" style="font-size:10px">${n}</div><div class="serif" style="font-size:14px;margin-top:2px">${BY_LINES[l].full}</div></div>`).join('')}</div>`);
  }

  function moreSheet(c) {
    const H = BY_LINES[c.ben], HB = c.bian ? BY_LINES[c.bian] : null;
    sheet(`<div class="px mt14"><div class="card list">
      <button class="li" data-x="copy" style="width:100%;text-align:left">${ic('share', 20)}<span class="f1">复制卦例文本</span></button>
      <button class="li" data-x="del" style="width:100%;text-align:left;color:var(--red)">${ic('trash', 20)}<span class="f1">删除此卦例</span></button>
    </div></div>`, (s, close) => {
      s.onclick = async e => {
        const b = e.target.closest('[data-x]'); if (!b) return;
        if (b.dataset.x === 'copy') {
          const { pan } = build(c);
          const txt = [`【爻观】${c.question}`, `${c.gz.year}年 ${c.gz.month}月 ${c.gz.day}日 ${c.gz.time}时 · 旬空${pan.kong}`, `${H.full}${HB ? ' 之 ' + HB.full : '（静卦）'}  ${pan.benInfo.palace}宫`,
            ...pan.yao.slice().reverse().map(y => `${y.liushen} ${y.liuqin}${y.zhi}${y.wx} ${y.yang ? '⚊' : '⚋'}${y.val === 9 ? '○' : y.val === 6 ? '×' : ''}${y.shi ? ' 世' : y.ying ? ' 应' : ''}${y.bian ? ' → ' + y.bian.liuqin + y.bian.zhi + y.bian.wx : ''}`),
            c.trng ? (c.trng.lines.every(l => l.quantumHex) ? '起卦：量子物理真随机' : '起卦：传感器物理噪声') : ''].filter(Boolean).join('\n');
          try { await navigator.clipboard.writeText(txt); toast('已复制'); } catch (er) { toast('复制失败'); }
          close();
        }
        if (b.dataset.x === 'del') { close(); if (await Y.confirmBox('删除这条卦例？此操作不可恢复。', '删除')) { Y.cases = Y.cases.filter(x => x.id !== c.id); Y.saveCases(); Y.back(); } }
      };
    });
  }

  // ---------------- 熵源凭据 ----------------
  routes.proof = {
    html(p) {
      const c = findCase(p.id); const t = c.trng;
      const all = t.lines.map(l => l.quantumHex).join('');
      const bytes = all ? new Uint8Array(all.match(/../g).map(h => parseInt(h, 16))) : new Uint8Array(0);
      const mb = bytes.length ? window.TRNG.monobit(bytes) : null;
      return `<div class="nv"><button class="ib" data-act="back">${ic('back')}</button><span class="t">真随机凭据</span><span style="width:40px"></span></div>
      <div class="px mt10 prose">这一卦的 18 枚铜钱，全部来自下面这些物理熵源。每一爻：熵源字节 → SHA-256 → 取 3 个比特，1 为背（计 3），0 为字（计 2）。</div>
      ${mb ? `<div class="px mt12"><div class="card row gap12" style="padding:12px 14px"><span class="jade">${ic('atom', 22)}</span><div class="f1"><div style="font-size:13px;font-weight:600">量子字节单比特频数检验</div><div class="mute" style="font-size:11px">NIST SP800-22 Monobit · ${mb.n} bit 中 1 占 ${mb.ones}</div></div><span class="serif ${mb.p >= 0.01 ? 'jade' : 'red'}" style="font-weight:700">p=${mb.p.toFixed(3)}</span></div></div>` : ''}
      <div class="px mt12">${t.lines.map((l, i) => `<div class="card" style="padding:12px 14px;margin-bottom:9px">
        <div class="row gap8"><b>${['初', '二', '三', '四', '五', '上'][i]}爻</b><span class="serif">${l.coins.map(x => x ? '背' : '字').join(' ')}</span><span class="f1"></span><span class="mute" style="font-size:11px">${new Date(l.at).toLocaleTimeString()}</span></div>
        <div class="mute mt6" style="font-size:11px">${l.sources.map(s => s.label + (s.bytes ? ` ${s.bytes}B` : s.samples ? ` ${s.samples} 样本` : '')).join(' + ')}</div>
        ${l.quantumHex ? `<div class="mono mt6">Q ${l.quantumHex}</div>` : ''}<div class="mono">H ${l.digest}</div></div>`).join('')}</div>`;
    },
    mount(v) { v.onclick = e => { if (e.target.closest('[data-act=back]')) Y.back(); }; },
  };
})();
