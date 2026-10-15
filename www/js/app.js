/* 爻观 · 主程序（无框架，原生 JS） */
(function () {
  'use strict';
  const { Solar, Lunar } = window;
  const N = window.Najia, T = window.TRNG;
  const $ = (s, r = document) => r.querySelector(s);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const WX_C = { 木: 'var(--wood)', 火: 'var(--fire)', 土: 'var(--earth)', 金: 'var(--metal)', 水: 'var(--water)' };
  const pad2 = n => String(n).padStart(2, '0');
  const WEEK = '日一二三四五六';
  let ZY = [];            // 六十四卦经文
  const BY_LINES = {};    // lines -> 卦

  // ---------------- 存储 ----------------
  const store = {
    get(k, d) { try { const v = localStorage.getItem('yg.' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { localStorage.setItem('yg.' + k, JSON.stringify(v)); },
  };
  const settings = Object.assign({ name: '', gender: '男', birthYear: 1994, haptics: true, sound: true, useQuantum: true, showFushen: true }, store.get('settings', {}));
  const saveSettings = () => store.set('settings', settings);
  let cases = store.get('cases', []);
  const saveCases = () => store.set('cases', cases);

  // ---------------- 图标 ----------------
  const IC = {
    back: '<path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>',
    close: '<path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
    share: '<path d="M12 15V3M7.5 7.5 12 3l4.5 4.5M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>',
    search: '<circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="m20 20-4.2-4.2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
    chev: '<path d="m9 6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
    home: '<circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M12 3.5a4.25 4.25 0 0 1 0 8.5 4.25 4.25 0 0 0 0 8.5" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="12" cy="7.8" r="1.1" fill="currentColor"/>',
    case: '<path d="M6 3.5h9l3.5 3.5v13.5H6z M14.5 3.5V7.5h4" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M9 12h6.5M9 15.5h4.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>',
    book: '<path d="M3.5 5.5c3-1 6-1 8.5 1 2.5-2 5.5-2 8.5-1v13c-3-1-6-1-8.5 1-2.5-2-5.5-2-8.5-1zM12 6.5v13" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>',
    cal: '<rect x="3.5" y="5" width="17" height="15.5" rx="3" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M3.5 10h17M8 3v4M16 3v4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>',
    user: '<circle cx="12" cy="8.5" r="3.8" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M4.5 20.5c1.2-4 4.2-6 7.5-6s6.3 2 7.5 6" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>',
    refresh: '<path d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3M18 3v4h-4M6 21v-4h4" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>',
    star: '<path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.8l-5.2 2.8 1-5.8-4.3-4.1 5.9-.8z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>',
    starf: '<path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.8l-5.2 2.8 1-5.8-4.3-4.1 5.9-.8z" fill="currentColor"/>',
    note: '<path d="M5 4h14v12l-4 4H5zM15 20v-4h4M8.5 9h7M8.5 12.5h4" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round"/>',
    atom: '<circle cx="12" cy="12" r="1.8" fill="currentColor"/><ellipse cx="12" cy="12" rx="9" ry="3.6" fill="none" stroke="currentColor" stroke-width="1.5"/><ellipse cx="12" cy="12" rx="9" ry="3.6" fill="none" stroke="currentColor" stroke-width="1.5" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="9" ry="3.6" fill="none" stroke="currentColor" stroke-width="1.5" transform="rotate(-60 12 12)"/>',
    phone: '<rect x="7" y="3" width="10" height="18" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M3 9v6M21 9v6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>',
    trash: '<path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>',
    filter: '<path d="M4 6h16M7 12h10M10 18h4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
  };
  const ic = (n, s = 22) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24">${IC[n]}</svg>`;

  // ---------------- 爻象渲染 ----------------
  function hx(lines, o = {}) {
    const w = o.w || 60, h = o.h || 7, g = o.g == null ? 6 : o.g, gap = o.gap || Math.round(w * 0.16);
    const mv = o.moving || [];
    let s = `<div class="hx" style="width:${w}px;gap:${g}px">`;
    for (let i = 0; i < lines.length; i++) {
      const m = mv[i]; const c = m ? '' : (o.c ? `background:${o.c}` : '');
      const cls = 'y' + (m ? ' m' : '');
      if (lines[i] === '1') s += `<div class="${cls}"><i style="width:${w}px;height:${h}px;${c}"></i></div>`;
      else { const hw = (w - gap) / 2; s += `<div class="${cls}"><i style="width:${hw}px;height:${h}px;${c}"></i><i style="width:${hw}px;height:${h}px;${c}"></i></div>`; }
    }
    return s + '</div>';
  }
  const yaoBar = (yang, moving, w = 38, h = 6, c) => hx(yang ? '1' : '0', { w, h, g: 0, gap: 7, moving: [moving], c });

  // ---------------- 历法 ----------------
  function gzOf(date) {
    const s = Solar.fromYmdHms(date.getFullYear(), date.getMonth() + 1, date.getDate(), date.getHours(), date.getMinutes(), 0);
    const l = s.getLunar();
    return { year: l.getYearInGanZhiExact(), month: l.getMonthInGanZhiExact(), day: l.getDayInGanZhiExact(), time: l.getTimeInGanZhi(), lunar: l, solar: s };
  }
  function lunarText(l) { return `${l.getMonthInChinese()}月${l.getDayInChinese()}`; }

  // ---------------- 通用 UI ----------------
  const app = $('#app');
  let tabbar;
  function toast(msg, ms = 2200) {
    const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; document.body.appendChild(t);
    setTimeout(() => t.remove(), ms);
  }
  function haptic(ms = 12) { if (settings.haptics && navigator.vibrate) try { navigator.vibrate(ms); } catch (e) {} }
  function sheet(html, onMount) {
    const d = document.createElement('div'); d.className = 'dim';
    const s = document.createElement('div'); s.className = 'sheet'; s.innerHTML = '<div class="grab"></div>' + html;
    const close = () => { d.remove(); s.remove(); };
    d.onclick = close; document.body.append(d, s);
    onMount && onMount(s, close);
    return close;
  }
  function confirmBox(msg, okText = '确定') {
    return new Promise(res => {
      const close = sheet(`<div class="px mt18 serif" style="font-size:16px;line-height:26px">${esc(msg)}</div>
        <div class="px mt18 row gap10"><button class="btn o" data-x="0" style="height:46px;font-size:15px">取消</button><button class="btn k" data-x="1" style="height:46px;font-size:15px">${esc(okText)}</button></div>`,
        (s, c) => s.querySelectorAll('[data-x]').forEach(b => b.onclick = () => { c(); res(b.dataset.x === '1'); }));
    });
  }

  // ---------------- 路由 ----------------
  const routes = {};
  let stack = [];
  function go(name, params = {}, replace = false) {
    if (replace) stack.pop();
    stack.push({ name, params });
    render();
    history.pushState({ d: stack.length }, '');
  }
  function resetTo(name, params) {
    stack = stack.filter(s => !['ask', 'shake', 'manual'].includes(s.name));
    go(name, params);
  }
  function back() {
    if (stack.length > 1) { stack.pop(); render(); } else if (window.Capacitor && Capacitor.Plugins.App) Capacitor.Plugins.App.exitApp();
  }
  window.addEventListener('popstate', () => back());
  document.addEventListener('backbutton', back);
  function render(anim = true) {
    const cur = stack[stack.length - 1];
    const r = routes[cur.name];
    document.querySelectorAll('.dim,.sheet').forEach(x => x.remove());
    if (window.__leave) { window.__leave(); window.__leave = null; }
    const v = document.createElement('div');
    v.className = 'view' + (anim ? ' enter' : '') + (r.tab == null ? ' notab' : '') + (r.dark ? ' dk' : '');
    v.innerHTML = r.html(cur.params);
    app.innerHTML = ''; app.appendChild(v);
    tabbar.classList.toggle('hide', r.tab == null);
    tabbar.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', i === r.tab));
    document.body.style.background = r.dark ? '#12100D' : '';
    setStatusBar(!!r.dark);
    r.mount && r.mount(v, cur.params);
  }
  function setStatusBar(dark) {
    try {
      const SB = window.Capacitor && Capacitor.Plugins.StatusBar;
      if (SB) { SB.setStyle({ style: dark ? 'DARK' : 'LIGHT' }); SB.setBackgroundColor && SB.setBackgroundColor({ color: dark ? '#12100D' : '#F2ECE1' }); }
    } catch (e) {}
  }
  function buildTabbar() {
    tabbar = document.createElement('nav'); tabbar.className = 'tb';
    const it = [['home', '首页', 'home'], ['case', '卦例', 'cases'], null, ['cal', '万年历', 'calendar'], ['user', '我的', 'me']];
    tabbar.innerHTML = it.map(x => x ? `<button data-go="${x[2]}">${ic(x[0], 23)}<span>${x[1]}</span></button>` : '<button class="mid" data-go="ask"><b>卦</b><span>起卦</span></button>').join('');
    tabbar.onclick = e => {
      const b = e.target.closest('[data-go]'); if (!b) return; haptic(8);
      const n = b.dataset.go;
      if (n === 'ask') { go('ask'); return; }
      stack = []; go(n);
    };
    document.body.appendChild(tabbar);
  }

  // =====================================================================
  // 01 首页
  // =====================================================================
  routes.home = {
    tab: 0,
    html() {
      const now = new Date(); const g = gzOf(now); const l = g.lunar;
      const prev = l.getPrevJieQi(true), next = l.getNextJieQi(true);
      const ps = prev.getSolar(), ns = next.getSolar();
      const t0 = new Date(ps.getYear(), ps.getMonth() - 1, ps.getDay()), t1 = new Date(ns.getYear(), ns.getMonth() - 1, ns.getDay());
      const prog = Math.max(4, Math.min(100, (now - t0) / (t1 - t0) * 100));
      const left = Math.ceil((t1 - now) / 864e5);
      const kong = N.xunkong(g.day);
      const ss = N.paipan([7, 7, 7, 7, 7, 7], g).shensha;
      const ssv = n => ss.find(x => x.name === n).zhi;
      const hr = now.getHours(); const hi = hr < 5 ? '夜深了' : hr < 11 ? '早上好' : hr < 13 ? '中午好' : hr < 18 ? '午后好' : '晚上好';
      const pend = cases.filter(c => c.verdict === 'wait').slice(0, 3);
      const LSN = { 甲: '青龙', 乙: '青龙', 丙: '朱雀', 丁: '朱雀', 戊: '勾陈', 己: '螣蛇', 庚: '白虎', 辛: '白虎', 壬: '玄武', 癸: '玄武' };
      return `
      <div class="px row" style="justify-content:space-between;height:58px">
        <div><div class="lbl">${lunarText(l)} · 星期${WEEK[now.getDay()]}</div><div class="serif" style="font-size:21px;font-weight:700;letter-spacing:2px;margin-top:2px">${hi}${settings.name ? '，<span class="red">' + esc(settings.name) + '</span>' : ''}</div></div>
        <button class="ib bd" data-go="dict">${ic('book', 19)}</button>
      </div>
      <div class="px mt6"><div class="hero">
        <svg style="left:0;bottom:0;width:100%" height="110" viewBox="0 0 350 110" preserveAspectRatio="none"><path d="M0 110V70c30-8 48-30 78-34 26-4 38 18 62 14 30-5 44-40 80-42 34-2 46 26 72 30 22 3 40-6 58-14v86z" fill="#2A2520"/><path d="M0 110V92c40-6 70-22 110-20 40 2 60 18 100 14 50-5 90-24 140-18v42z" fill="#332D26"/></svg>
        <div style="left:22px;top:18px;font-size:11px;letter-spacing:2px;color:#9C9282">${now.getFullYear()} · ${pad2(now.getMonth() + 1)} · ${pad2(now.getDate())} &nbsp;日辰</div>
        <div class="cal" style="left:16px;top:34px;font-size:76px;line-height:1;color:#F2ECE1;letter-spacing:-2px">${g.day}</div>
        <span class="seal" style="left:170px;top:52px;width:22px;height:22px;font-size:12px">日</span>
        <div style="left:22px;top:124px;display:flex;gap:6px;font-size:11px;color:#B5AB9B;align-items:center"><span class="dot" style="background:${WX_C[N.GAN_WX[g.day[0]]]}"></span>${g.day[0]}${N.GAN_WX[g.day[0]]} <span class="dot" style="background:${WX_C[N.ZHI_WX[g.day[1]]]};margin-left:6px"></span>${g.day[1]}${N.ZHI_WX[g.day[1]]} &nbsp;·&nbsp; 六神起 ${LSN[g.day[0]]}</div>
        <div style="right:20px;top:20px;display:grid;grid-template-columns:auto auto;gap:9px 16px;text-align:right">
          <div><div style="font-size:10px;color:#857C6E">年</div><div class="serif" style="font-size:17px;font-weight:600">${g.year}</div></div>
          <div><div style="font-size:10px;color:#857C6E">月</div><div class="serif" style="font-size:17px;font-weight:600">${g.month}</div></div>
          <div><div style="font-size:10px;color:#857C6E">时</div><div class="serif" style="font-size:17px;font-weight:600">${g.time}</div></div>
          <div><div style="font-size:10px;color:#D9A86A">旬空</div><div class="serif" style="font-size:17px;font-weight:600;color:#E3BE82">${kong}</div></div>
        </div>
        <div style="left:22px;right:22px;bottom:16px;display:flex;align-items:center;gap:10px;font-size:10.5px;color:#9C9282">
          <span>${prev.getName()}</span><div style="flex:1;height:3px;border-radius:2px;background:#3B352D"><div style="width:${prog}%;height:3px;border-radius:2px;background:linear-gradient(90deg,#8E2A21,#D9573F)"></div></div><span>${next.getName()} · ${left}天</span>
        </div>
      </div></div>
      <div class="px mt14"><div class="card" style="padding:16px 16px 14px;box-shadow:0 10px 24px -18px rgba(60,40,20,.5)">
        <div class="row gap12" data-go="ask">
          <div class="f1"><div class="serif" style="font-size:16px;font-weight:600;letter-spacing:1px">心中所问何事？</div><div style="font-size:12px;color:var(--mute);margin-top:3px">一事一占 · 静心片刻再起卦</div></div>
          <div style="width:46px;height:46px;border-radius:23px;background:var(--red);display:flex;align-items:center;justify-content:center;box-shadow:0 8px 16px -6px rgba(176,53,42,.7)"><span class="cal" style="color:#FBEFE6;font-size:24px">问</span></div>
        </div>
        <div class="chips mt12">${['事业', '财运', '感情', '健康', '考试', '寻物', '出行'].map(c => `<button class="chip sm" data-cat="${c}">${c}</button>`).join('')}</div>
      </div></div>
      <div class="px sec mt18"><h3>起卦方式</h3><a data-go="dict">卦典 · 六十四卦 ›</a></div>
      <div class="chips mt10" style="padding-left:20px;padding-right:20px;gap:10px">
        ${[['coin', '摇钱', '真随机'], ['time', '时间', ''], ['num', '报数', ''], ['char', '汉字', ''], ['manual', '手工', '']].map(([k, n, b], i) => `
        <button class="card" data-method="${k}" style="flex:none;width:80px;height:86px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;${i === 0 ? 'border-color:#E2C7BE;background:linear-gradient(180deg,var(--card),#F6E9E2)' : ''}">
          ${i === 0 ? '<svg width="34" height="28" viewBox="0 0 34 28"><defs><radialGradient id="cg0" cx=".36" cy=".3" r=".8"><stop offset="0" stop-color="#F0D9A2"/><stop offset=".45" stop-color="#C39A55"/><stop offset="1" stop-color="#5E431B"/></radialGradient></defs><circle cx="11" cy="15" r="9" fill="url(#cg0)"/><rect x="8.5" y="12.5" width="5" height="5" fill="#F2ECE1"/><circle cx="23" cy="11" r="9" fill="url(#cg0)"/><rect x="20.5" y="8.5" width="5" height="5" fill="#F2ECE1"/></svg>' : `<span class="cal" style="font-size:26px;line-height:28px;color:var(--gold)">${{ time: '时', num: '数', char: '字', manual: '装' }[k]}</span>`}
          <span style="font-size:12px;font-weight:${i === 0 ? 500 : 400}">${n}</span>${b ? `<span style="font-size:8.5px;color:var(--red);margin-top:-4px;letter-spacing:1px">${b}</span>` : ''}
        </button>`).join('')}
      </div>
      <div class="px sec mt18"><h3>${pend.length ? '待验卦例' : '今日宜忌'}</h3><a data-go="cases">${pend.length ? '全部 ›' : ''}</a></div>
      <div class="px mt10">${pend.length ? pend.map(c => caseRow(c)).join('<div style="height:9px"></div>') : `
        <div class="card" style="padding:14px 16px;font-size:12.5px;line-height:22px;color:var(--ink2)">
          <div><b class="jade">宜</b>　${esc((l.getDayYi() || []).slice(0, 6).join(' · '))}</div>
          <div><b class="red">忌</b>　${esc((l.getDayJi() || []).slice(0, 6).join(' · '))}</div>
          <div class="mute" style="font-size:11px;margin-top:4px">驿马 ${ssv('驿马')} · 桃花 ${ssv('桃花')} · 贵人 ${ssv('贵人')} · 日禄 ${ssv('日禄')}</div>
        </div>`}</div>`;
    },
    mount(v) {
      v.onclick = e => {
        const c = e.target.closest('[data-cat]'); if (c) { go('ask', { category: c.dataset.cat }); return; }
        const m = e.target.closest('[data-method]'); if (m) { go('ask', { method: m.dataset.method }); return; }
        const cs = e.target.closest('[data-case]'); if (cs) { go('pan', { id: cs.dataset.case }); return; }
        const g = e.target.closest('[data-go]'); if (g) { const n = g.dataset.go; if (n === 'cases') { stack = []; } go(n); }
      };
    },
  };

  function caseRow(c) {
    const st = { wait: ['wait', '待验'], ok: ['ok', '已应'], no: ['no', '未应'] }[c.verdict || 'wait'];
    const h = BY_LINES[c.ben], hb = c.bian ? BY_LINES[c.bian] : null;
    const d = new Date(c.time);
    return `<button class="card" data-case="${c.id}" style="width:100%;padding:12px 14px;display:flex;gap:12px;align-items:center;text-align:left">
      <div style="width:52px;height:52px;border-radius:14px;background:var(--paper2);display:flex;align-items:center;justify-content:center;gap:4px;flex:none">
        ${hx(c.ben, { w: hb ? 16 : 20, h: 2.5, g: 2.5, gap: 3, moving: c.vals.map(v => v === 6 || v === 9) })}${hb ? hx(c.bian, { w: 16, h: 2.5, g: 2.5, gap: 3, c: '#A79D8D' }) : ''}
      </div>
      <div class="f1"><div style="font-size:14px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(c.question || '（未填写所问）')}</div>
      <div style="font-size:11.5px;color:var(--mute);margin-top:4px"><span class="serif" style="color:var(--ink2)">${h.name}${hb ? ' → ' + hb.name : ' · 静'}</span> · ${pad2(d.getMonth() + 1)}/${pad2(d.getDate())} · ${esc(c.category)}${c.method === 'coin' && c.trng ? ' · <span class="red">真随机</span>' : ''}</div></div>
      ${c.fav ? `<span style="color:var(--gold)">${ic('starf', 14)}</span>` : ''}<span class="st ${st[0]}">${st[1]}</span>
    </button>`;
  }

  // 暴露给第二部分
  window.__YG = { routes, go, back, render, resetTo, store, settings, saveSettings, get cases() { return cases; }, set cases(v) { cases = v; }, saveCases, hx, yaoBar, ic, esc, gzOf, lunarText, toast, haptic, sheet, confirmBox, caseRow, WX_C, pad2, WEEK, ZY: () => ZY, BY_LINES, $ };

  // ---------------- 启动 ----------------
  async function boot() {
    try {
      ZY = window.ZHOUYI || [];
      ZY.forEach(h => { BY_LINES[h.lines] = h; });
    } catch (e) { console.error(e); }
    buildTabbar();
    T.sensor.start();
    document.addEventListener('pointerdown', e => T.sensor.touch(e), { passive: true });
    stack = []; go('home');
    setStatusBar(true); // 开屏期间为墨色
    setTimeout(() => setStatusBar(false), sessionStorage.getItem('yg.splashed') ? 500 : 2500);
    try { const SS = window.Capacitor && Capacitor.Plugins.SplashScreen; SS && SS.hide(); } catch (e) {}
    try {
      const A = window.Capacitor && Capacitor.Plugins.App;
      A && A.addListener('backButton', () => { if (document.querySelector('.sheet')) { document.querySelectorAll('.dim,.sheet').forEach(x => x.remove()); } else back(); });
    } catch (e) {}
  }
  window.__YG.boot = boot;
})();
