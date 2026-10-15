/* 爻观 · 卦例 / 万年历 / 卦典 / 我的 */
(function () {
  'use strict';
  const Y = window.__YG, N = window.Najia, T = window.TRNG;
  const { routes, esc, ic, hx, toast, sheet, pad2, BY_LINES, WEEK } = Y;

  // =====================================================================
  // 07 卦例
  // =====================================================================
  const CF = { cat: '全部', q: '', st: 'all' };
  routes.cases = {
    tab: 1,
    html() {
      const all = Y.cases;
      const ok = all.filter(c => c.verdict === 'ok').length, no = all.filter(c => c.verdict === 'no').length, wait = all.length - ok - no;
      const rate = ok + no ? Math.round(ok / (ok + no) * 100) : 0;
      const C = 2 * Math.PI * 26;
      const cats = ['全部', ...Array.from(new Set(all.map(c => c.category)))];
      const q = CF.q.trim();
      let list = all.filter(c => (CF.cat === '全部' || c.category === CF.cat) && (CF.st === 'all' || (CF.st === 'fav' ? c.fav : c.verdict === CF.st)));
      if (q) list = list.filter(c => (c.question + BY_LINES[c.ben].full + (c.bian ? BY_LINES[c.bian].full : '') + c.notes.map(n => n.s).join('')).includes(q));
      // 按月分组
      const groups = {};
      list.forEach(c => { const d = new Date(c.time); const k = `${d.getFullYear()} · ${d.getMonth() + 1}月`; (groups[k] = groups[k] || []).push(c); });
      return `
      <div class="px row" style="justify-content:space-between;align-items:flex-end;height:58px">
        <div class="htitle"><span class="cal">卦例</span><span class="mute" style="font-size:12px;padding-bottom:5px">共 ${all.length} 例</span></div>
        <div class="row gap8"><button class="ib bd" data-act="search">${ic('search', 19)}</button><button class="ib bd" data-act="filter">${ic('filter', 19)}</button></div>
      </div>
      ${CF.searching || q ? `<div class="px mt10"><div class="field row gap8" style="padding:9px 14px">${ic('search', 16)}<input id="sq" value="${esc(CF.q)}" placeholder="搜索所问、卦名、笔记…" style="font-size:14px"></div></div>` : ''}
      <div class="px mt14"><div class="card row gap16" style="padding:14px 16px;gap:16px">
        <svg width="62" height="62" viewBox="0 0 62 62" style="flex:none"><circle cx="31" cy="31" r="26" fill="none" stroke="var(--hair)" stroke-width="7"/>${ok + no ? `<circle cx="31" cy="31" r="26" fill="none" stroke="var(--jade)" stroke-width="7" stroke-dasharray="${C * ok / (ok + no)} ${C}" stroke-linecap="round" transform="rotate(-90 31 31)"/>` : ''}<text x="31" y="36" text-anchor="middle" font-family="YG Serif,serif" font-weight="700" font-size="15" fill="var(--ink)">${ok + no ? rate + '%' : '—'}</text></svg>
        <div class="f1" style="display:grid;grid-template-columns:repeat(3,1fr)">
          <button data-st="ok" style="text-align:left"><div class="serif jade" style="font-size:20px;font-weight:700">${ok}</div><div class="mute" style="font-size:10.5px">已应</div></button>
          <button data-st="no" style="text-align:left"><div class="serif red" style="font-size:20px;font-weight:700">${no}</div><div class="mute" style="font-size:10.5px">未应</div></button>
          <button data-st="wait" style="text-align:left"><div class="serif gold" style="font-size:20px;font-weight:700">${wait}</div><div class="mute" style="font-size:10.5px">待验</div></button>
        </div>
      </div></div>
      <div class="chips mt14" style="padding:0 20px">${cats.map(c => `<button class="chip ${CF.cat === c ? 'on' : ''}" data-cat="${c}">${c}${c !== '全部' ? ' ' + all.filter(x => x.category === c).length : ''}</button>`).join('')}
        ${CF.st !== 'all' ? `<button class="chip r" data-st="all">${{ ok: '已应', no: '未应', wait: '待验', fav: '收藏' }[CF.st]} ✕</button>` : ''}</div>
      ${list.length ? Object.keys(groups).map(k => `<div class="px mt18 row gap10"><span class="serif" style="font-size:13px;font-weight:600;letter-spacing:2px">${k}</span><div class="f1" style="height:1px;background:var(--hair)"></div></div>
        <div class="px mt10" style="display:flex;flex-direction:column;gap:9px">${groups[k].map(Y.caseRow).join('')}</div>`).join('')
        : `<div class="empty"><span class="cal">空</span>${all.length ? '没有符合条件的卦例' : '还没有卦例<br>点下方「卦」起第一卦'}</div>`}`;
    },
    mount(v) {
      const sq = v.querySelector('#sq');
      if (sq) { sq.oninput = () => { CF.q = sq.value; clearTimeout(sq._t); sq._t = setTimeout(() => { Y.render(); const n = document.querySelector('#sq'); if (n) { n.focus(); n.setSelectionRange(n.value.length, n.value.length); } }, 350); }; if (CF.searching && !CF.q) sq.focus(); }
      v.onclick = e => {
        const b = e.target.closest('[data-case],[data-cat],[data-st],[data-act]'); if (!b) return;
        if (b.dataset.case) { Y.go('pan', { id: b.dataset.case }); return; }
        if (b.dataset.cat) { CF.cat = b.dataset.cat; Y.render(); return; }
        if (b.dataset.st) { CF.st = CF.st === b.dataset.st ? 'all' : b.dataset.st; Y.render(); return; }
        if (b.dataset.act === 'search') { CF.searching = !CF.searching; if (!CF.searching) CF.q = ''; Y.render(); }
        if (b.dataset.act === 'filter') { CF.st = CF.st === 'fav' ? 'all' : 'fav'; Y.render(); toast(CF.st === 'fav' ? '只看收藏' : '显示全部'); }
      };
    },
  };

  // =====================================================================
  // 08 万年历
  // =====================================================================
  const CAL = { y: new Date().getFullYear(), m: new Date().getMonth(), sel: null };
  routes.calendar = {
    tab: 3,
    html() {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      if (!CAL.sel) CAL.sel = today.getTime();
      const first = new Date(CAL.y, CAL.m, 1), days = new Date(CAL.y, CAL.m + 1, 0).getDate();
      const lead = (first.getDay() + 6) % 7;
      // 卦例事件：起卦日 + 待验
      const evDays = new Set(Y.cases.map(c => { const d = new Date(c.time); return d.getFullYear() === CAL.y && d.getMonth() === CAL.m ? d.getDate() : 0; }));
      let cells = '<span></span>'.repeat(lead);
      for (let d = 1; d <= days; d++) {
        const s = window.Solar.fromYmd(CAL.y, CAL.m + 1, d); const l = s.getLunar();
        const jq = l.getJieQi();
        const t = new Date(CAL.y, CAL.m, d).getTime();
        cells += `<button class="cd ${t === today.getTime() ? 'today' : ''} ${t === CAL.sel ? 'sel' : ''} ${jq ? 'jq' : ''}" data-d="${t}"><span class="d">${d}</span><span class="g">${jq || l.getDayInGanZhiExact()}</span>${evDays.has(d) ? '<i></i>' : ''}</button>`;
      }
      const sd = new Date(CAL.sel); const ss = window.Solar.fromYmd(sd.getFullYear(), sd.getMonth() + 1, sd.getDate()); const sl = ss.getLunar();
      const dgz = sl.getDayInGanZhiExact();
      const shs = N.paipan([7, 7, 7, 7, 7, 7], { year: sl.getYearInGanZhiExact(), month: sl.getMonthInGanZhiExact(), day: dgz, time: '甲子' }).shensha;
      const sv = n => shs.find(x => x.name === n).zhi;
      const pj = sl.getPrevJieQi(true), dd = Math.round((sd - new Date(pj.getSolar().getYear(), pj.getSolar().getMonth() - 1, pj.getSolar().getDay())) / 864e5) + 1;
      const dayCases = Y.cases.filter(c => { const d = new Date(c.time); return d.toDateString() === sd.toDateString(); });
      const ly = window.Solar.fromYmd(CAL.y, CAL.m + 1, 15).getLunar();
      return `
      <div class="px row" style="justify-content:space-between;align-items:flex-end;height:58px">
        <div class="htitle"><span class="cal">${['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'][CAL.m]}月</span><span class="mute" style="font-size:12px;padding-bottom:5px">${CAL.y} · ${ly.getYearInGanZhi()}年</span></div>
        <div class="row gap8"><button class="ib bd" data-mv="-1">${ic('back', 18)}</button><button class="ib bd" data-mv="0" style="font-size:12px;width:auto;padding:0 12px">今</button><button class="ib bd" data-mv="1" style="transform:scaleX(-1)">${ic('back', 18)}</button></div>
      </div>
      <div class="px mt14"><div class="card" style="padding:12px 10px 8px">
        <div style="display:grid;grid-template-columns:repeat(7,1fr);text-align:center;font-size:10.5px;color:var(--mute);padding-bottom:8px">${'一二三四五'.split('').map(x => `<span>${x}</span>`).join('')}<span class="red">六</span><span class="red">日</span></div>
        <div class="calg">${cells}</div>
      </div></div>
      <div class="px mt14"><div class="card row" style="padding:16px;gap:16px;align-items:stretch">
        <div style="text-align:center;width:76px;flex:none;border-right:1px solid var(--hair);padding-right:14px">
          <div class="cal red" style="font-size:44px;line-height:46px">${dgz[0]}<br>${dgz[1]}</div>
          <div class="mute" style="font-size:10.5px;margin-top:4px">${sd.getMonth() + 1}月${sd.getDate()}日</div>
        </div>
        <div class="f1" style="font-size:12px;line-height:24px;color:var(--ink2)">
          <div class="row" style="justify-content:space-between"><span class="mute">农历</span><span>${Y.lunarText(sl)} · 周${WEEK[sd.getDay()]}</span></div>
          <div class="row" style="justify-content:space-between"><span class="mute">四柱</span><span class="serif">${sl.getYearInGanZhiExact()} ${sl.getMonthInGanZhiExact()} ${dgz}</span></div>
          <div class="row" style="justify-content:space-between"><span class="mute">节气</span><span>${pj.getName()} 第${dd}日</span></div>
          <div class="row" style="justify-content:space-between"><span class="mute">旬空</span><span class="gold">${N.xunkong(dgz).split('').join(' ')}</span></div>
          <div class="row" style="justify-content:space-between"><span class="mute">马 / 桃 / 贵</span><span>${sv('驿马')} / ${sv('桃花')} / ${sv('贵人')}</span></div>
        </div>
      </div></div>
      <div class="px mt12"><div class="card" style="padding:12px 16px;font-size:12px;line-height:22px;color:var(--ink2)">
        <div><b class="jade">宜</b>　${esc((sl.getDayYi() || []).slice(0, 8).join(' · '))}</div>
        <div><b class="red">忌</b>　${esc((sl.getDayJi() || []).slice(0, 8).join(' · '))}</div>
      </div></div>
      ${dayCases.length ? `<div class="px mt14 lbl">当日卦例</div><div class="px mt10" style="display:flex;flex-direction:column;gap:9px">${dayCases.map(Y.caseRow).join('')}</div>` : ''}`;
    },
    mount(v) {
      v.onclick = e => {
        const b = e.target.closest('[data-d],[data-mv],[data-case]'); if (!b) return;
        if (b.dataset.case) { Y.go('pan', { id: b.dataset.case }); return; }
        if (b.dataset.d) { CAL.sel = +b.dataset.d; Y.render(); return; }
        const mv = +b.dataset.mv;
        if (mv === 0) { const t = new Date(); CAL.y = t.getFullYear(); CAL.m = t.getMonth(); CAL.sel = null; }
        else { CAL.m += mv; if (CAL.m < 0) { CAL.m = 11; CAL.y--; } if (CAL.m > 11) { CAL.m = 0; CAL.y++; } }
        Y.render();
      };
    },
  };

  // =====================================================================
  // 卦典
  // =====================================================================
  const PAL = ['乾', '兑', '离', '震', '巽', '坎', '艮', '坤'];
  routes.dict = {
    html(p) {
      const by = p.by || 'seq';
      const ZY = Y.ZY();
      let list;
      if (by === 'seq') list = ZY;
      else list = PAL.flatMap(pl => Object.entries(N.PALACE).filter(([l, v]) => v.palace === pl).sort((a, b) => a[1].order - b[1].order).map(([l]) => BY_LINES[l]));
      return `<div class="nv"><button class="ib" data-act="back">${ic('back')}</button><span class="t">卦 典</span><span style="width:40px"></span></div>
      <div class="px mt6 row" style="justify-content:center"><div class="seg"><button class="${by === 'seq' ? 'on' : ''}" data-by="seq">文王卦序</button><button class="${by === 'pal' ? 'on' : ''}" data-by="pal">京房八宫</button></div></div>
      ${by === 'pal' ? PAL.map((pl, k) => `<div class="px mt18 row gap10"><span class="serif" style="font-size:14px;font-weight:600;letter-spacing:2px">${pl}宫</span><span class="mute" style="font-size:11px">${{ 乾: '金', 兑: '金', 离: '火', 震: '木', 巽: '木', 坎: '水', 艮: '土', 坤: '土' }[pl]}</span><div class="f1" style="height:1px;background:var(--hair)"></div></div>
        <div class="px mt10 gg">${list.slice(k * 8, k * 8 + 8).map(h => cell(h, N.PALACE[h.lines].kind)).join('')}</div>`).join('')
        : `<div class="px mt14 gg">${list.map(h => cell(h, '第' + h.n + '卦')).join('')}</div>`}`;
    },
    mount(v, p) {
      v.onclick = e => {
        const b = e.target.closest('[data-gua],[data-by],[data-act]'); if (!b) return;
        if (b.dataset.gua) { Y.go('gua', { lines: b.dataset.gua }); return; }
        if (b.dataset.by) { p.by = b.dataset.by; Y.render(); return; }
        if (b.dataset.act === 'back') Y.back();
      };
    },
  };
  const cell = (h, sub) => `<button data-gua="${h.lines}">${hx(h.lines, { w: 30, h: 4, g: 3.5, gap: 6 })}<span>${h.name}</span><small>${sub}</small></button>`;

  // 卦详情
  routes.gua = {
    dark: true,
    html(p) {
      const h = BY_LINES[p.lines]; const pi = N.PALACE[p.lines];
      p.sec = p.sec || 'gua';
      const hu = p.lines.slice(1, 4) + p.lines.slice(2, 5), cuo = p.lines.split('').map(c => c === '1' ? '0' : '1').join(''), zong = p.lines.split('').reverse().join('');
      const S = {
        gua: `<div class="serif" style="font-size:20px;line-height:36px;letter-spacing:2px">${h.name}：${esc(h.gua)}</div><div style="height:1px;background:var(--hair);margin:12px 0"></div><div class="prose">【白话】${esc(h.bh)}</div>`,
        tuan: `<div class="serif" style="font-size:16px;line-height:30px;letter-spacing:1px">《彖》曰：${esc(h.tuan)}</div>`,
        xiang: `<div class="serif" style="font-size:18px;line-height:32px;letter-spacing:1px">《象》曰：${esc(h.xiang)}</div>`,
        yao: h.yao.map((y, i) => `<div style="padding:10px 0;${i ? 'border-top:1px solid var(--hair)' : ''}"><div class="serif" style="font-size:15px;line-height:25px">${esc(y)}</div><div class="mute" style="font-size:11.5px;line-height:19px;margin-top:3px">象曰：${esc(h.yaoXiang[i])}</div><div class="prose" style="font-size:12.5px;line-height:21px;margin-top:3px">${esc(h.yaoBh[i])}</div></div>`).join('') + (h.special ? `<div style="padding:10px 0;border-top:1px solid var(--hair)"><div class="serif" style="font-size:15px;line-height:25px">${h.special.label}：${esc(h.special.text)}</div><div class="mute" style="font-size:11.5px;margin-top:3px">象曰：${esc(h.special.xiang)}</div><div class="prose" style="font-size:12.5px;line-height:21px;margin-top:3px">${esc(h.special.bh || '')}</div></div>` : ''),
        jf: (() => { const nj = N.najia(p.lines); return `<div class="mute" style="font-size:12px;margin-bottom:8px">${pi.palace}宫 · 五行属${pi.wx} · ${pi.kind}卦 · 世${['初', '二', '三', '四', '五', '上'][pi.shi - 1]} 应${['初', '二', '三', '四', '五', '上'][pi.ying - 1]}</div>` + nj.map((x, i) => ({ x, i })).reverse().map(({ x, i }) => `<div class="row gap12" style="height:36px;${i < 5 ? 'border-top:1px solid var(--hair)' : ''}"><span class="mute" style="width:28px;font-size:12px">${['初', '二', '三', '四', '五', '上'][i]}</span>${hx(p.lines[i], { w: 40, h: 6, g: 0, gap: 8 })}<span class="serif f1">${N.liuqin(pi.wx, x.wx)} ${x.gan}${x.zhi}${x.wx}</span><span>${pi.shi === i + 1 ? '<span class="seal" style="width:18px;height:18px;font-size:10px">世</span>' : pi.ying === i + 1 ? '<span class="sealo" style="width:18px;height:18px;font-size:10px">应</span>' : ''}</span></div>`).join(''); })(),
      };
      return `<div class="nv"><button class="ib" data-act="back" style="color:var(--ink2)">${ic('back')}</button><span class="mute" style="font-size:13px">第 ${h.n} 卦 / 64</span><span style="width:40px"></span></div>
      <div style="text-align:center;margin-top:18px">
        <div style="display:inline-block">${hx(p.lines, { w: 120, h: 13, g: 9, gap: 16 })}</div>
        <div class="cal" style="font-size:44px;letter-spacing:8px;margin-top:18px;padding-left:8px">${h.full}</div>
        <div class="mute" style="font-size:12px;letter-spacing:2px;margin-top:2px">${h.upper}上 · ${h.lower}下 &nbsp;|&nbsp; ${pi.palace}宫${pi.kind} &nbsp;|&nbsp; ${esc(h.key || '')}</div>
      </div>
      <div class="chips mt18" style="justify-content:center;padding:0 16px">${[['gua', '卦辞'], ['tuan', '彖传'], ['xiang', '象传'], ['yao', '爻辞'], ['jf', '纳甲']].map(([k, n]) => `<button class="chip ${p.sec === k ? 'on' : ''}" style="${p.sec === k ? 'background:var(--red);border-color:var(--red);color:#fff' : ''}" data-sec="${k}">${n}</button>`).join('')}</div>
      <div class="px mt14"><div class="card" style="padding:16px 18px">${S[p.sec]}</div></div>
      <div class="px mt12" style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px">${[['互卦', hu], ['错卦', cuo], ['综卦', zong]].map(([n, l]) => `<button class="card" data-gua="${l}" style="padding:10px 12px;text-align:left"><div class="mute" style="font-size:10px">${n}</div><div class="serif" style="font-size:14px;margin-top:2px">${BY_LINES[l].full}</div></button>`).join('')}</div>
      <div class="px mt14 mute" style="font-size:10px;text-align:center;line-height:16px">经文底本：《御纂周易折中》武英殿本（1715）/ 维基文库</div>`;
    },
    mount(v, p) {
      v.onclick = e => {
        const b = e.target.closest('[data-sec],[data-gua],[data-act]'); if (!b) return;
        if (b.dataset.sec) { p.sec = b.dataset.sec; Y.render(); return; }
        if (b.dataset.gua) { Y.go('gua', { lines: b.dataset.gua }, true); return; }
        if (b.dataset.act === 'back') Y.back();
      };
    },
  };

  // =====================================================================
  // 我的
  // =====================================================================
  routes.me = {
    tab: 4,
    html() {
      const s = Y.settings;
      const n = Y.cases.length, q = Y.cases.filter(c => c.trng && c.trng.lines.every(l => l.quantumHex)).length;
      return `<div class="px htitle"><span class="cal">我的</span></div>
      <div class="px mt14"><div class="card row gap12" style="padding:16px">
        <div style="width:54px;height:54px;border-radius:27px;background:var(--ink);display:flex;align-items:center;justify-content:center;flex:none"><span class="cal" style="font-size:28px;color:var(--paper)">${esc((s.name || '观')[0])}</span></div>
        <div class="f1"><input id="nm" value="${esc(s.name)}" placeholder="点此填写称呼" style="border:none;background:none;outline:none;font-family:var(--serif);font-size:18px;font-weight:700;width:100%"><div class="mute" style="font-size:11.5px;margin-top:2px">${s.gender} · ${s.birthYear} · 已起 ${n} 卦，其中量子真随机 ${q} 卦</div></div>
      </div></div>
      <div class="px mt18 lbl">真随机</div>
      <div class="px mt10"><div class="card list">
        <div class="li"><span class="red">${ic('atom', 20)}</span><div class="f1"><div style="font-size:14px">量子随机源</div><div class="mute" style="font-size:11px">ANU 真空涨落 · LfD 光量子；关闭后仅用传感器噪声</div></div><button class="sw ${s.useQuantum ? 'on' : ''}" data-sw="useQuantum"></button></div>
        <button class="li" data-act="diag" style="width:100%;text-align:left">${ic('refresh', 20)}<div class="f1"><div style="font-size:14px">熵源自检</div><div class="mute" style="font-size:11px">测试各物理熵源连通性与随机性</div></div>${ic('chev', 16)}</button>
        <button class="li" data-act="about-trng" style="width:100%;text-align:left">${ic('book', 20)}<div class="f1"><div style="font-size:14px">真随机是怎么实现的</div></div>${ic('chev', 16)}</button>
      </div></div>
      <div class="px mt18 lbl">显示</div>
      <div class="px mt10"><div class="card" style="padding:14px 14px 12px">
        <div class="row" style="justify-content:space-between"><div><div style="font-size:14px">屏幕刷新率</div><div class="mute" style="font-size:11px;margin-top:2px" id="rrinfo">读取中…</div></div><span class="serif" id="rrcur" style="font-size:20px;font-weight:700">—</span></div>
        <div class="seg3 mt12" id="rrseg" style="grid-template-columns:repeat(4,1fr)">${[['auto', '自动'], ['60', '60'], ['90', '90'], ['120', '120']].map(([k, n]) => `<button data-rr="${k}" class="${(s.refresh || 'max') === k || ((s.refresh || 'max') === 'max' && k === '120') ? 'on' : ''}">${n}${k !== 'auto' ? '<small style="font-size:9px"> Hz</small>' : ''}</button>`).join('')}</div>
        <div class="row mt10" style="justify-content:space-between"><span class="mute" style="font-size:11px">实测帧率</span><span class="serif" id="fps" style="font-size:13px;font-weight:600">—</span></div>
      </div></div>
      <div class="px mt18 lbl">偏好</div>
      <div class="px mt10"><div class="card list">
        <div class="li"><div class="f1" style="font-size:14px">震动反馈</div><button class="sw ${s.haptics ? 'on' : ''}" data-sw="haptics"></button></div>
        <button class="li" data-act="gender" style="width:100%;text-align:left"><div class="f1" style="font-size:14px">默认性别</div><span class="mute">${s.gender}</span></button>
      </div></div>
      <div class="px mt18 lbl">数据</div>
      <div class="px mt10"><div class="card list">
        <button class="li" data-act="export" style="width:100%;text-align:left"><div class="f1" style="font-size:14px">导出卦例（复制 JSON）</div>${ic('chev', 16)}</button>
        <button class="li" data-act="import" style="width:100%;text-align:left"><div class="f1" style="font-size:14px">导入卦例</div>${ic('chev', 16)}</button>
        <button class="li" data-act="clear" style="width:100%;text-align:left;color:var(--red)"><div class="f1" style="font-size:14px">清空全部卦例</div></button>
      </div></div>
      <div class="px mt18 mute" style="font-size:10.5px;line-height:18px;text-align:center">爻观 v1.0.0 · 京房纳甲 · 经文底本《御纂周易折中》<br>排盘断语仅供文化研究与参考</div>`;
    },
    mount(v) {
      const s = Y.settings;
      const nm = v.querySelector('#nm'); nm.onchange = () => { s.name = nm.value.trim().slice(0, 12); Y.saveSettings(); Y.render(); };
      // ---- 刷新率 ----
      const RR = window.Capacitor && Capacitor.Plugins && Capacitor.Plugins.RefreshRate;
      const info = v.querySelector('#rrinfo'), cur = v.querySelector('#rrcur'), fpsEl = v.querySelector('#fps');
      const loadInfo = () => {
        if (!RR) { info.textContent = '仅在 App 内可调（浏览器预览不支持）'; return; }
        RR.getInfo().then(r => {
          const sup = (r.supported || []).join(' / ');
          info.textContent = sup ? `本机支持 ${sup} Hz` : '未读取到屏幕模式';
          cur.textContent = (r.current || '—') + ' Hz';
          v.querySelectorAll('[data-rr]').forEach(b => {
            const k = b.dataset.rr; const n = +k;
            if (n && r.supported && r.supported.length && !r.supported.some(x => Math.abs(x - n) <= 1)) { b.disabled = true; b.title = '本机不支持'; }
          });
        }).catch(() => { info.textContent = '读取失败'; });
      };
      loadInfo();
      // 实测：requestAnimationFrame 计数
      let frames = 0, t0 = performance.now(), alive = true;
      const loop = t => { if (!alive) return; frames++; if (t - t0 >= 1000) { fpsEl.textContent = Math.round(frames * 1000 / (t - t0)) + ' fps'; frames = 0; t0 = t; } requestAnimationFrame(loop); };
      requestAnimationFrame(loop);
      window.__leave = () => { alive = false; };
      v.querySelector('#rrseg').onclick = e => {
        const b = e.target.closest('[data-rr]'); if (!b || b.disabled) return;
        const k = b.dataset.rr; s.refresh = k === '120' ? 'max' : k; Y.saveSettings();
        v.querySelectorAll('[data-rr]').forEach(x => x.classList.toggle('on', x === b));
        if (RR) RR.set({ mode: k === '120' ? '120' : k }).then(r => { cur.textContent = (r.current || '—') + ' Hz'; Y.toast(k === 'auto' ? '刷新率交给系统' : `已请求 ${r.target} Hz`); setTimeout(loadInfo, 600); });
        else Y.toast('预览环境不支持切换');
      };
      v.onclick = async e => {
        const b = e.target.closest('[data-sw],[data-act]'); if (!b) return;
        if (b.dataset.sw) { s[b.dataset.sw] = !s[b.dataset.sw]; Y.saveSettings(); b.classList.toggle('on', s[b.dataset.sw]); return; }
        const a = b.dataset.act;
        if (a === 'gender') { s.gender = s.gender === '男' ? '女' : '男'; Y.saveSettings(); Y.render(); }
        if (a === 'diag') Y.go('diag');
        if (a === 'about-trng') aboutTrng();
        if (a === 'export') { try { await navigator.clipboard.writeText(JSON.stringify(Y.cases)); toast(`已复制 ${Y.cases.length} 条卦例`); } catch (er) { toast('复制失败'); } }
        if (a === 'import') {
          sheet(`<div class="px mt18 serif" style="font-size:17px;font-weight:700">粘贴导出的 JSON</div><div class="px mt10"><div class="field"><textarea id="ij" rows="6" style="font-family:monospace;font-size:12px;line-height:18px"></textarea></div></div><div class="px mt14"><button class="btn k" data-x="ok" style="height:46px;font-size:15px">导入</button></div>`, (sh, close) => {
            sh.querySelector('[data-x]').onclick = () => {
              try { const arr = JSON.parse(sh.querySelector('#ij').value); if (!Array.isArray(arr)) throw 0; const ids = new Set(Y.cases.map(c => c.id)); const add = arr.filter(c => c && c.id && c.vals && c.gz && !ids.has(c.id)); Y.cases = add.concat(Y.cases).sort((a, b) => b.time - a.time); Y.saveCases(); close(); toast(`导入 ${add.length} 条`); Y.render(); } catch (er) { toast('格式不正确'); }
            };
          });
        }
        if (a === 'clear') { if (await Y.confirmBox(`清空全部 ${Y.cases.length} 条卦例？不可恢复。`, '清空')) { Y.cases = []; Y.saveCases(); Y.render(); } }
      };
    },
  };

  function aboutTrng() {
    sheet(`<div class="px mt18 serif" style="font-size:19px;font-weight:700">什么是真随机</div>
      <div class="px mt10 prose">
        <p>电脑里常见的随机数（如 <code>Math.random</code>）是<b>伪随机</b>：用一个公式从“种子”算出来，知道种子就能复现全部结果。</p>
        <p class="mt10"><b>真随机</b>来自物理世界本身不可预测的过程。爻观的摇钱起卦使用：</p>
        <p class="mt10">① <b>量子随机数</b> —— 澳大利亚国立大学（ANU）测量真空中的量子涨落；德国 LfD 实验室利用光子通过分束器时的量子选择。量子力学保证这些结果在原理上不可预测。</p>
        <p class="mt10">② <b>手机传感器噪声</b> —— 你摇动手机时，加速度计 / 陀螺仪读数里的热噪声和手部微动；以及每次触摸的亚毫秒时间抖动。</p>
        <p class="mt10">这些物理样本经 SHA-256 混合（只是“搅匀”，不增加也不制造随机性），每爻取 3 个比特对应三枚铜钱：1 为背、0 为字。三背老阳、三字老阴、一背少阳、两背少阴。</p>
        <p class="mt10">如果量子源和传感器都不可用，爻观<b>宁可不出卦</b>，也不会偷偷换成伪随机。每一卦都保存了熵源凭据，可在排盘页查看。</p>
      </div>`);
  }

  routes.diag = {
    html() {
      return `<div class="nv"><button class="ib" data-act="back">${ic('back')}</button><span class="t">熵源自检</span><span style="width:40px"></span></div>
      <div class="px mt10" id="dg"><div class="empty"><span class="cal pulse">测</span>正在连接量子随机源…</div></div>`;
    },
    async mount(v) {
      v.onclick = e => { if (e.target.closest('[data-act=back]')) Y.back(); };
      const r = await T.diagnose();
      const box = v.querySelector('#dg'); if (!box) return;
      const q = T.pool.qbytes; const mb = q.length ? T.monobit(q) : null;
      box.innerHTML = `<div class="card list">${r.quantum.map(x => `<div class="li"><span class="dot" style="background:${x.ok ? 'var(--jade)' : x.ok === null ? 'var(--gold)' : 'var(--red)'}"></span><div class="f1"><div style="font-size:14px">${esc(x.name)}</div><div class="mute" style="font-size:11px">${x.ok ? `${x.ms} ms · 样本 ${x.sample}` : esc(x.msg || '')}</div></div><span class="${x.ok ? 'jade' : 'red'}" style="font-size:12px">${x.ok ? '可用' : x.ok === null ? '冷却' : '不可用'}</span></div>`).join('')}
        <div class="li"><span class="dot" style="background:${T.sensor.motionCount ? 'var(--jade)' : 'var(--gold)'}"></span><div class="f1"><div style="font-size:14px">运动传感器</div><div class="mute" style="font-size:11px">已采集 ${T.sensor.motionCount} 帧</div></div><span class="${T.sensor.motionCount ? 'jade' : 'gold'}" style="font-size:12px">${T.sensor.motionCount ? '可用' : '待摇动'}</span></div></div>
        ${mb ? `<div class="card mt12" style="padding:14px 16px"><div style="font-size:13px;font-weight:600">单比特频数检验（NIST Monobit）</div><div class="mute mt6" style="font-size:11.5px;line-height:19px">熵池现有 ${q.length} 字节 = ${mb.n} bit，其中 1 的个数 ${mb.ones}。p 值 ≥ 0.01 视为通过。</div><div class="serif mt6 ${mb.p >= 0.01 ? 'jade' : 'red'}" style="font-size:22px;font-weight:700">p = ${mb.p.toFixed(4)} ${mb.p >= 0.01 ? '通过' : '偏差'}</div></div>` : ''}`;
    },
  };
})();
