/* 爻观 · 起卦 / 摇卦（真随机） */
(function () {
  'use strict';
  const Y = window.__YG, N = window.Najia, T = window.TRNG;
  const { routes, go, esc, ic, hx, toast, haptic, settings, gzOf, sheet, pad2 } = Y;
  const CATS = ['事业', '求职', '财运', '投资', '感情', '婚姻', '健康', '考试', '出行', '寻物', '官司', '房产', '子女', '其他'];
  const METHODS = [
    ['coin', '摇钱', '物理真随机'], ['time', '时间', '年月日时'], ['num', '报数', '两数 / 三数'],
    ['char', '汉字', '笔画取卦'], ['manual', '手工', '逐爻指定'], ['offline', '离线摇钱', '仅传感器熵'],
  ];
  let draft = null;

  // =====================================================================
  // 02 起卦设置
  // =====================================================================
  routes.ask = {
    html(p) {
      if (!draft || p.category || p.method) {
        const d = new Date();
        draft = Object.assign({ question: '', category: '其他', relation: '本人', gender: settings.gender, birthYear: settings.birthYear, method: 'coin', time: d.getTime(), autoTime: true, n1: '', n2: '', n3: '', chars: '' }, draft || {});
        if (p.category) draft.category = p.category;
        if (p.method) draft.method = p.method;
      }
      delete p.category; delete p.method;
      return `
      <div class="nv"><button class="ib" data-act="back">${ic('back')}</button><span class="t">起 卦</span><span style="width:40px"></span></div>
      <div class="px mt6"><div class="lbl">所问之事</div>
        <div class="field mt10" style="padding:14px 16px 12px">
          <textarea id="q" maxlength="60" rows="2" placeholder="如：近期 offer 能否顺利落地？">${esc(draft.question)}</textarea>
          <div class="row mt10" style="justify-content:space-between"><span class="mute" style="font-size:11px">一事一问 · 越具体越好</span><span class="mute" style="font-size:11px" id="qn">${draft.question.length} / 60</span></div>
        </div>
        <div class="chips mt10">${CATS.map(c => `<button class="chip sm ${c === draft.category ? 'on' : ''}" data-cat="${c}">${c}</button>`).join('')}</div>
      </div>
      <div class="px mt18"><div class="lbl">求测人</div>
        <div class="card mt10" style="display:grid;grid-template-columns:1fr .8fr 1.25fr">
          <button data-act="rel" style="padding:12px 14px;border-right:1px solid var(--hair2);text-align:left"><div style="font-size:10.5px;color:var(--mute)">身份</div><div style="font-size:14px;font-weight:600;margin-top:3px">${draft.relation}</div></button>
          <button data-act="gender" style="padding:12px 14px;border-right:1px solid var(--hair2);text-align:left"><div style="font-size:10.5px;color:var(--mute)">性别</div><div style="font-size:14px;font-weight:600;margin-top:3px">${draft.gender}</div></button>
          <div style="padding:12px 14px"><div style="font-size:10.5px;color:var(--mute)">生年</div><div class="row" style="margin-top:3px"><input id="by" type="number" inputmode="numeric" value="${draft.birthYear}" style="width:52px;border:none;background:none;outline:none;font-size:14px;font-weight:600"><span class="serif" style="color:var(--ink2);font-size:14px" id="bygz">${yearGZ(draft.birthYear)}</span></div></div>
        </div>
      </div>
      <div class="px mt18"><div class="sec"><span class="lbl">起卦时间</span><button data-act="autotime" style="font-size:11px;color:${draft.autoTime ? 'var(--jade)' : 'var(--mute)'}">${draft.autoTime ? '● 自动取当前' : '○ 指定时间'}</button></div>
        <div class="card mt10" style="padding:12px 16px;display:flex;align-items:center;justify-content:space-between;gap:10px">
          ${draft.autoTime ? `<div class="serif" style="font-size:16px;font-weight:600" id="tnow"></div>` : `<input id="tpick" type="datetime-local" value="${toLocal(draft.time)}" style="border:none;background:none;outline:none;font-family:var(--serif);font-size:15px;font-weight:600;flex:1;min-width:0">`}
          <div class="serif" id="tgz" style="display:flex;gap:5px;font-size:12px"></div>
        </div>
      </div>
      <div class="px mt18"><div class="lbl">起卦方式</div>
        <div class="grid3 mt10">${METHODS.map(([k, n, s]) => `<button class="opt ${k === draft.method ? 'on' : ''}" data-m="${k}"><b>${n}</b><small>${s}</small>${k === 'coin' ? '<span class="qb">量子</span>' : ''}</button>`).join('')}</div>
        <div id="mx" class="mt12">${methodExtra()}</div>
      </div>
      <div class="px" style="margin-top:22px"><button class="btn k" data-act="start"><span class="cal" style="font-size:24px;letter-spacing:0;color:#E9826D">起</span>${draft.method === 'coin' || draft.method === 'offline' ? '开始摇卦' : '立即成卦'}</button></div>
      ${draft.method === 'coin' ? `<div class="px mt12 mute" style="font-size:11px;line-height:18px;text-align:center">每枚铜钱的正反取自量子物理过程（真空涨落 / 光子），<br>并混入你摇动手机时的传感器噪声，不使用任何伪随机算法。</div>` : ''}`;
    },
    mount(v) {
      const q = v.querySelector('#q');
      q.oninput = () => { draft.question = q.value; v.querySelector('#qn').textContent = q.value.length + ' / 60'; };
      const by = v.querySelector('#by');
      by.oninput = () => { draft.birthYear = +by.value; v.querySelector('#bygz').textContent = yearGZ(+by.value); };
      const tick = () => {
        if (draft.autoTime) draft.time = Date.now();
        const d = new Date(draft.time); const g = gzOf(d);
        const tn = v.querySelector('#tnow'); if (tn) tn.textContent = `${d.getFullYear()}.${pad2(d.getMonth() + 1)}.${pad2(d.getDate())}  ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
        v.querySelector('#tgz').innerHTML = `<span class="mute">${g.year}</span><span class="mute">${g.month}</span><span style="color:var(--red);font-weight:700">${g.day}</span><span class="mute">${g.time}</span>`;
      };
      tick(); const it = setInterval(tick, 15000); window.__leave = () => clearInterval(it);
      const tp = v.querySelector('#tpick'); if (tp) tp.onchange = () => { draft.time = new Date(tp.value).getTime() || Date.now(); tick(); };
      bindExtra(v);
      v.onclick = e => {
        const b = e.target.closest('[data-cat],[data-m],[data-act]'); if (!b) return;
        if (b.dataset.cat) { draft.category = b.dataset.cat; v.querySelectorAll('[data-cat]').forEach(x => x.classList.toggle('on', x === b)); return; }
        if (b.dataset.m) { draft.method = b.dataset.m; Y.render(); return; }
        const a = b.dataset.act;
        if (a === 'back') Y.back();
        if (a === 'gender') { draft.gender = draft.gender === '男' ? '女' : '男'; Y.render(); }
        if (a === 'rel') { const R = ['本人', '家人', '朋友', '同事', '代占']; draft.relation = R[(R.indexOf(draft.relation) + 1) % R.length]; Y.render(); }
        if (a === 'autotime') { draft.autoTime = !draft.autoTime; if (draft.autoTime) draft.time = Date.now(); Y.render(); }
        if (a === 'start') start();
      };
    },
  };
  function toLocal(t) { const d = new Date(t); return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`; }
  function yearGZ(y) { if (!y || y < 1900 || y > 2100) return ''; return N.GAN[(y - 4) % 10] + N.ZHI[(y - 4) % 12]; }

  function methodExtra() {
    const m = draft.method;
    if (m === 'num') return `<div class="row gap8">${['n1', 'n2', 'n3'].map((k, i) => `<div class="field f1" style="padding:10px 12px"><div class="mute" style="font-size:10px">${['上卦数', '下卦数', '动爻数（可空）'][i]}</div><input data-k="${k}" type="number" inputmode="numeric" value="${esc(draft[k])}" style="font-size:17px;font-family:var(--serif);font-weight:600;margin-top:2px"></div>`).join('')}</div><div class="mute mt10" style="font-size:11px">梅花易数报数法：上数除八取上卦，下数除八取下卦，（上+下+时辰数 或 第三数）除六取动爻。</div>`;
    if (m === 'char') return `<div class="field"><div class="mute" style="font-size:10px">输入两个及以上汉字</div><input data-k="chars" value="${esc(draft.chars)}" maxlength="12" style="font-size:18px;font-family:var(--serif);margin-top:2px"></div><div class="mute mt10" style="font-size:11px">按字数（Unicode 码位）平分上下卦，总和加时辰取动爻。</div>`;
    if (m === 'time') return `<div class="mute" style="font-size:11.5px;line-height:20px">梅花易数时间起卦：（年支数+农历月+农历日）除八为上卦，再加时辰数除八为下卦，总数除六为动爻。</div>`;
    if (m === 'manual') return `<div class="mute" style="font-size:11.5px">下一步逐爻指定 少阳 / 少阴 / 老阳 / 老阴。</div>`;
    if (m === 'offline') return `<div class="mute" style="font-size:11.5px;line-height:20px">不联网，只用手机加速度计 / 陀螺仪的物理噪声和触摸时间的抖动作为熵源。每一爻都要真的摇动手机，攒够熵才能掷出。</div>`;
    return '';
  }
  function bindExtra(v) { v.querySelectorAll('#mx [data-k]').forEach(i => i.oninput = () => { draft[i.dataset.k] = i.value; }); }

  // 梅花数理（先天数：乾1 兑2 离3 震4 巽5 坎6 艮7 坤8）→ 三位线
  const XT = { 1: '111', 2: '110', 3: '101', 4: '100', 5: '011', 6: '010', 7: '001', 8: '000' };
  const mod = (n, m) => { const r = n % m; return r === 0 ? m : r; };
  function fromNumbers(up, lo, mv) {
    const lines = XT[mod(lo, 8)] + XT[mod(up, 8)];
    const m = mod(mv, 6) - 1;
    return lines.split('').map((c, i) => i === m ? (c === '1' ? 9 : 6) : (c === '1' ? 7 : 8));
  }
  function hourNum(d) { return Math.floor(((d.getHours() + 1) % 24) / 2) + 1; }

  async function start() {
    draft.question = (draft.question || '').trim();
    if (!draft.question) { toast('先写下所问之事'); return; }
    settings.gender = draft.gender; settings.birthYear = draft.birthYear; Y.saveSettings();
    const d = new Date(draft.time);
    const base = { question: draft.question, category: draft.category, relation: draft.relation, gender: draft.gender, birthYear: draft.birthYear, time: draft.time, method: draft.method };
    if (draft.method === 'coin' || draft.method === 'offline') { go('shake', { base }); return; }
    if (draft.method === 'manual') { go('manual', { base }); return; }
    let vals;
    if (draft.method === 'time') {
      const l = gzOf(d).lunar;
      const yz = N.ZHI.indexOf(l.getYearZhiExact()) + 1, m = Math.abs(l.getMonth()), dd = l.getDay(), h = hourNum(d);
      vals = fromNumbers(yz + m + dd, yz + m + dd + h, yz + m + dd + h);
      base.methodNote = `年支${yz}+月${m}+日${dd}=${yz + m + dd}；+时${h}`;
    } else if (draft.method === 'num') {
      const a = parseInt(draft.n1), b = parseInt(draft.n2), c = parseInt(draft.n3);
      if (!(a > 0 && b > 0)) { toast('请输入两个正整数'); return; }
      vals = fromNumbers(a, b, c > 0 ? c : a + b + hourNum(d));
      base.methodNote = `报数 ${a} / ${b}${c > 0 ? ' / ' + c : ' + 时' + hourNum(d)}`;
    } else if (draft.method === 'char') {
      const cs = Array.from((draft.chars || '').replace(/\s/g, ''));
      if (cs.length < 2) { toast('至少输入两个字'); return; }
      const half = Math.floor(cs.length / 2);
      const sum = a => a.reduce((s, ch) => s + ch.codePointAt(0), 0);
      const a = sum(cs.slice(0, half)), b = sum(cs.slice(half));
      vals = fromNumbers(a, b, a + b + hourNum(d));
      base.methodNote = `「${cs.join('')}」`;
    }
    finish(base, vals, null);
  }

  function finish(base, vals, trng) {
    const g = gzOf(new Date(base.time));
    const pan = N.paipan(vals, g);
    const c = Object.assign({}, base, {
      id: 'c' + Date.now().toString(36), vals, ben: pan.ben, bian: pan.bian,
      gz: { year: g.year, month: g.month, day: g.day, time: g.time }, verdict: 'wait', notes: [], fav: false, trng,
    });
    Y.cases = [c].concat(Y.cases); Y.saveCases();
    draft = null;
    Y.resetTo('pan', { id: c.id });
  }
  window.__YG.finishCast = finish;

  // =====================================================================
  // 03 摇卦（夜墨沉浸 · 真随机）
  // =====================================================================
  const COIN = (side, rot) => `<svg class="coin" viewBox="0 0 100 100" style="transform:rotate(${rot}deg)"><defs><radialGradient id="cgA" cx=".36" cy=".3" r=".8"><stop offset="0" stop-color="#F0D9A2"/><stop offset=".45" stop-color="#C39A55"/><stop offset=".85" stop-color="#7E5C28"/><stop offset="1" stop-color="#5E431B"/></radialGradient></defs><circle cx="50" cy="50" r="47" fill="url(#cgA)"/><circle cx="50" cy="50" r="47" fill="none" stroke="#4E3815" stroke-width="2"/><circle cx="50" cy="50" r="39" fill="none" stroke="#5E431B" stroke-width="1.6" opacity=".7"/><rect x="38.5" y="38.5" width="23" height="23" fill="#12100D" stroke="#5E431B" stroke-width="2.4"/>${side === 0
    ? '<g font-family="YG Serif,serif" font-size="15" font-weight="900" fill="#4A3410" text-anchor="middle"><text x="50" y="31">乾</text><text x="50" y="83">隆</text><text x="76" y="56">通</text><text x="24" y="56">宝</text></g>'
    : '<g fill="#4A3410" opacity=".75"><path d="M18 46c5-8 13-8 16 0s-5 12-13 10z"/><path d="M82 54c-5 8-13 8-16 0s5-12 13-10z"/></g>'}</svg>`;
  const VAL_NAME = { 6: ['老阴', '×'], 7: ['少阳', ''], 8: ['少阴', ''], 9: ['老阳', '○'] };
  const POS = ['初爻', '二爻', '三爻', '四爻', '五爻', '上爻'];

  routes.shake = {
    dark: true,
    html(p) {
      const st = p.state || (p.state = { vals: [], proofs: [], busy: false, last: null, offline: p.base.method === 'offline' });
      const n = st.vals.length;
      const rows = [0, 1, 2, 3, 4, 5].map(i => {
        const v = st.vals[i];
        const cur = i === n;
        let bar;
        if (v) { const yang = v === 7 || v === 9, mv = v === 6 || v === 9; bar = `<div style="filter:${mv ? 'drop-shadow(0 0 8px rgba(217,87,63,.6))' : 'none'}">${hx(yang ? '1' : '0', { w: 120, h: 9, g: 0, gap: 16, moving: [mv], c: '#D8CFBF' })}</div>`; }
        else bar = `<div style="height:9px;border-radius:2px;border:1px dashed ${cur ? 'var(--red)' : '#3A342C'}"></div>`;
        const lab = v ? `${st.proofs[i].coins.map(c => c ? '背' : '字').join('')} · ${VAL_NAME[v][1] ? `<b style="color:var(--red)">${VAL_NAME[v][0]} ${VAL_NAME[v][1]}</b>` : VAL_NAME[v][0]}` : '';
        return `<div style="display:grid;grid-template-columns:34px 120px 1fr;align-items:center;height:30px;gap:14px"><span style="font-size:11px;color:${cur ? 'var(--red)' : v ? '#857C6E' : '#4A433A'};font-weight:${cur ? 700 : 400}">${POS[i]}</span>${bar}<span style="font-size:11.5px;color:#857C6E">${lab}</span></div>`;
      }).join('');
      const last = st.last;
      const coins = last ? last.coins : [0, 1, 0];
      return `
      <div class="nv"><button class="ib" data-act="close" style="color:#C8BEAC">${ic('close', 20)}</button><span class="t" style="font-size:15px;color:#C8BEAC">${n < 6 ? '第 ' + '一二三四五六'[n] + ' 爻' : '卦 成'}</span><button class="ib" data-act="src" style="color:#C8BEAC">${ic('atom', 20)}</button></div>
      <div style="text-align:center;margin-top:2px" class="serif"><span style="font-size:13px;color:#857C6E;letter-spacing:1px">「 ${esc(p.base.question)} 」</span></div>
      <div style="margin:20px auto 0;width:300px;display:flex;flex-direction:column-reverse;gap:6px">${rows}</div>
      <div id="coins" style="position:relative;height:250px;margin-top:6px">
        <div style="position:absolute;left:50%;top:50%;width:300px;height:180px;margin:-70px 0 0 -150px;border-radius:50%;background:radial-gradient(closest-side,rgba(217,87,63,.2),transparent);filter:blur(6px)"></div>
        <div style="position:absolute;left:50%;top:150px;width:270px;height:30px;margin-left:-135px;border-radius:50%;background:radial-gradient(closest-side,rgba(0,0,0,.75),transparent)"></div>
        <div style="position:absolute;left:50%;margin-left:-150px;top:50px;width:300px;height:120px">
          <div style="position:absolute;left:0;top:10px;filter:drop-shadow(0 14px 10px rgba(0,0,0,.6))">${COIN(coins[0], -16)}</div>
          <div style="position:absolute;left:102px;top:40px;filter:drop-shadow(0 14px 10px rgba(0,0,0,.6))">${COIN(coins[1], 12)}</div>
          <div style="position:absolute;left:204px;top:0;filter:drop-shadow(0 14px 10px rgba(0,0,0,.6))">${COIN(coins[2], 38)}</div>
        </div>
        <div id="res" style="position:absolute;left:0;right:0;top:200px;text-align:center">${last ? `<span class="cal" style="font-size:38px;color:#EEE6D6;letter-spacing:6px">${VAL_NAME[last.value][0]}</span><span class="serif" style="font-size:24px;color:var(--red);margin-left:6px;font-weight:700">${VAL_NAME[last.value][1]}</span>` : ''}</div>
      </div>
      <div id="hint" style="text-align:center;font-size:11px;color:#6E665A;letter-spacing:1.5px;margin-top:4px;min-height:16px"></div>
      <div id="ent" style="text-align:center;font-size:10.5px;color:#5E574C;margin-top:6px;min-height:15px"></div>
      <div style="display:flex;align-items:center;justify-content:center;gap:34px;margin-top:16px">
        <button data-act="undo" style="width:50px;height:50px;border-radius:25px;border:1px solid #3A342C;display:flex;align-items:center;justify-content:center;color:#C8BEAC" ${n === 0 ? 'disabled' : ''}>${ic('refresh', 20)}</button>
        ${n < 6 ? `<button class="shakebtn" data-act="throw"><span class="cal" style="font-size:40px;color:#FBEFE6">摇</span></button>` : `<button class="shakebtn" data-act="done" style="background:radial-gradient(circle at 35% 30%,#EEE6D6,#B5AB9B 75%)"><span class="cal" style="font-size:36px;color:#1A1714">排</span></button>`}
        <button data-act="src" style="width:50px;height:50px;border-radius:25px;border:1px solid #3A342C;display:flex;align-items:center;justify-content:center;color:#C8BEAC">${ic('phone', 20)}</button>
      </div>`;
    },
    mount(v, p) {
      const st = p.state;
      const hint = v.querySelector('#hint'), ent = v.querySelector('#ent');
      const setHint = () => {
        if (st.vals.length >= 6) { hint.textContent = '六爻已成 · 轻触「排」进入排盘'; return; }
        hint.textContent = st.offline ? '用力摇动手机，攒满物理噪声后自动掷出' : '摇动手机 · 或轻触「摇」';
      };
      setHint();
      // 预取量子熵
      if (!st.offline && settings.useQuantum && T.pool.qbytes.length < 96) T.pool.refillQuantum(96).then(updEnt);
      function updEnt() {
        const s = T.pool.status;
        const q = T.pool.qbytes.length;
        const lab = { ok: '●', loading: '◌', fail: '×', cooldown: '◔', idle: '·' };
        if (st.offline) { ent.innerHTML = `传感器样本 <b style="color:#C8BEAC">${T.sensor.samples.length / 8 | 0}</b> / 32`; return; }
        ent.innerHTML = `量子熵池 <b style="color:${q >= 16 ? 'var(--jade)' : 'var(--red)'}">${q}</b> 字节 · ANU ${lab[s.anu]} · LfD ${lab[s.lfd]} · 传感器 ${T.sensor.motionCount > 0 ? '●' : '·'}`;
      }
      updEnt(); const it = setInterval(updEnt, 400);
      T.sensor.requestPermission();
      T.sensor.onShake = () => { if (!st.busy && st.vals.length < 6) doThrow(); };
      window.__leave = () => { clearInterval(it); T.sensor.onShake = null; };

      async function doThrow() {
        if (st.busy || st.vals.length >= 6) return;
        if (st.offline && T.sensor.samples.length / 8 < 32) { haptic(30); hint.textContent = '熵还不够 · 继续摇动手机'; return; }
        st.busy = true; haptic(25);
        v.querySelectorAll('.coin').forEach((c, i) => { c.style.animationDelay = i * 60 + 'ms'; c.classList.add('flip'); });
        v.querySelector('#res').innerHTML = '';
        hint.innerHTML = '<span class="pulse">采集物理熵 …</span>';
        const t0 = performance.now();
        try {
          const r = await T.throwLine(st.vals.length + 1, { offline: st.offline || !settings.useQuantum });
          const wait = Math.max(0, 780 - (performance.now() - t0));
          await new Promise(res => setTimeout(res, wait));
          st.vals.push(r.value); st.proofs.push({ coins: r.coins, ...r.proof }); st.last = r;
          haptic(r.value === 6 || r.value === 9 ? [20, 40, 20] : 15);
          st.busy = false; Y.render(false);
        } catch (e) {
          st.busy = false;
          v.querySelectorAll('.coin').forEach(c => c.classList.remove('flip'));
          if (e.code === 'NO_ENTROPY') {
            hint.innerHTML = '<span style="color:var(--red)">物理熵源暂不可用</span>';
            sheet(`<div class="px mt18"><div class="serif" style="font-size:18px;font-weight:700">量子随机源暂时连不上</div>
              <div class="prose mt10">为了保证<b>真随机</b>，本应用不会退回伪随机算法。当前量子源状态：ANU ${esc(T.pool.status.anu)}，LfD ${esc(T.pool.status.lfd)}。</div>
              <div class="prose mt10">你可以：① 检查网络后重试；② 改用「离线摇钱」——只用手机传感器的物理噪声，需要真的摇动手机。</div></div>
              <div class="px mt18 row gap10"><button class="btn o" data-x="retry" style="height:46px;font-size:15px">重试</button><button class="btn k" data-x="off" style="height:46px;font-size:15px">离线摇钱</button></div>`,
              (s, c) => s.querySelectorAll('[data-x]').forEach(b => b.onclick = () => { c(); if (b.dataset.x === 'off') { st.offline = true; Y.render(false); } else { T.pool.lastAnu = 0; T.pool.refillQuantum(96); } }));
          } else { hint.textContent = '出错了：' + (e.message || e); }
        }
      }
      v.onclick = e => {
        const b = e.target.closest('[data-act]'); if (!b) return;
        const a = b.dataset.act;
        if (a === 'close') Y.back();
        if (a === 'throw') doThrow();
        if (a === 'undo' && st.vals.length) { Y.confirmBox('撤回上一爻？真随机结果撤回后会作废，不会被重新利用。', '撤回').then(ok => { if (ok) { st.vals.pop(); st.proofs.pop(); st.last = null; Y.render(false); } }); }
        if (a === 'src') showSources(st);
        if (a === 'done') {
          const trng = { offline: st.offline, lines: st.proofs };
          finish(Object.assign({}, p.base, { method: st.offline ? 'offline' : 'coin' }), st.vals, trng);
        }
      };
    },
  };

  function showSources(st) {
    const s = T.pool.status;
    sheet(`<div class="px mt18 row gap10"><span style="color:var(--red)">${ic('atom', 26)}</span><div class="serif" style="font-size:18px;font-weight:700">本卦的随机从哪里来</div></div>
      <div class="px mt12 prose">每一爻的三枚铜钱 = 3 个比特，来自下列<b>物理</b>熵源经 SHA-256 混合后取出（SHA-256 只做白化，不产生随机性）：</div>
      <div class="px mt12"><div class="card list">
        <div class="li"><span class="dot" style="background:${s.anu === 'ok' ? 'var(--jade)' : 'var(--hair)'}"></span><div class="f1"><b>ANU 量子真空涨落</b><div class="mute" style="font-size:11px">澳大利亚国立大学 · 测量真空中电磁场的量子噪声</div></div><span class="mute" style="font-size:11px">${esc(s.anu)}</span></div>
        <div class="li"><span class="dot" style="background:${s.lfd === 'ok' ? 'var(--jade)' : 'var(--hair)'}"></span><div class="f1"><b>LfD 光量子随机源</b><div class="mute" style="font-size:11px">德国 LfD 实验室 · 光子在分束器上的量子选择</div></div><span class="mute" style="font-size:11px">${esc(s.lfd)}</span></div>
        <div class="li"><span class="dot" style="background:${T.sensor.motionCount ? 'var(--jade)' : 'var(--hair)'}"></span><div class="f1"><b>手机运动传感器</b><div class="mute" style="font-size:11px">加速度计 / 陀螺仪的热噪声与手部运动</div></div><span class="mute" style="font-size:11px">${T.sensor.motionCount ? '采集中' : '无数据'}</span></div>
        <div class="li"><span class="dot" style="background:var(--jade)"></span><div class="f1"><b>触摸时序抖动</b><div class="mute" style="font-size:11px">手指按下的亚毫秒级时间差</div></div></div>
      </div></div>
      ${st && st.proofs.length ? `<div class="px mt14 lbl">已掷爻的凭据</div><div class="px mt10"><div class="card" style="padding:10px 14px">${st.proofs.map((p, i) => `<div style="padding:6px 0;${i ? 'border-top:1px solid var(--hair2)' : ''}"><b style="font-size:12px">${POS[i]}</b> <span class="mute" style="font-size:11px">${p.sources.map(x => x.label).join(' + ')}</span><div class="mono">digest ${p.digest.slice(0, 32)}…</div></div>`).join('')}</div></div>` : ''}
      <div class="px mt14 mute" style="font-size:11px;line-height:18px">不使用 Math.random() 等伪随机算法。若量子源和传感器都不可用，本应用宁可不出卦。</div>`);
  }
  window.__YG.showSources = showSources;

  // =====================================================================
  // 手工装卦
  // =====================================================================
  routes.manual = {
    html(p) {
      const st = p.state || (p.state = { vals: [7, 7, 7, 8, 8, 8] });
      const opts = [[7, '少阳 ⚊'], [8, '少阴 ⚋'], [9, '老阳 ○'], [6, '老阴 ×']];
      return `<div class="nv"><button class="ib" data-act="back">${ic('back')}</button><span class="t">手工装卦</span><span style="width:40px"></span></div>
      <div class="px mt14" style="display:flex;justify-content:center">${hx(st.vals.map(v => v === 7 || v === 9 ? '1' : '0').join(''), { w: 120, h: 11, g: 11, gap: 16, moving: st.vals.map(v => v === 6 || v === 9) })}</div>
      <div class="px mt18" style="display:flex;flex-direction:column-reverse;gap:10px">
        ${st.vals.map((v, i) => `<div class="row gap12"><span style="width:34px;font-size:12px" class="mute">${POS[i]}</span><div class="seg3 f1">${opts.map(([k, n]) => `<button class="${k === v ? 'on' : ''} ${k === 6 || k === 9 ? 'mvb' : ''}" data-i="${i}" data-v="${k}">${n}</button>`).join('')}</div></div>`).join('')}
      </div>
      <div class="px" style="margin-top:26px"><button class="btn k" data-act="ok">排 盘</button></div>`;
    },
    mount(v, p) {
      v.onclick = e => {
        const b = e.target.closest('[data-v],[data-act]'); if (!b) return;
        if (b.dataset.v) { p.state.vals[+b.dataset.i] = +b.dataset.v; Y.render(); return; }
        if (b.dataset.act === 'back') Y.back();
        if (b.dataset.act === 'ok') finish(p.base, p.state.vals.slice(), null);
      };
    },
  };
})();
