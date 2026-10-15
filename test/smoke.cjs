// 全流程冒烟测试（jsdom）。用法：NODE_PATH=/tmp/jt/node_modules node test/smoke.cjs
const { JSDOM } = require('jsdom');
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const www = path.join(__dirname, '../www');
let html = fs.readFileSync(path.join(www, 'index.html'), 'utf8');
html = html.replace(/<script src="([^"]+)"><\/script>/g, (m, s) => `<script>${fs.readFileSync(path.join(www, s), 'utf8').replace(/<\/script>/g, '<\\/script>')}</script>`);
html = html.replace(/<meta http-equiv="Content-Security-Policy"[^>]*>/, '');
const errors = [];
const fetchLog = [];
const dom = new JSDOM(html, {
  runScripts: 'dangerously', pretendToBeVisual: true, url: 'https://localhost/',
  beforeParse(w) {
    w.fetch = async (url) => {
      fetchLog.push(String(url).split('?')[0]);
      const u = String(url);
      const n = +(u.match(/length=(\d+)/) || [0, 16])[1];
      const b = crypto.randomBytes(n); // 测试替身：模拟量子源返回
      if (u.includes('anu')) return { text: async () => JSON.stringify({ type: 'uint8', length: n, data: Array.from(b), success: true }) };
      if (u.includes('lfdr')) return { json: async () => ({ length: n, qrn: b.toString('hex') }) };
      throw new Error('unexpected fetch ' + u);
    };
    Object.defineProperty(w, 'crypto', { value: { subtle: crypto.webcrypto.subtle, getRandomValues: () => { throw new Error('getRandomValues 不应被使用'); } } });
    w.TextEncoder = TextEncoder;
    w.Math.random = () => { errors.push('Math.random 被调用！'); return 0.5; };
    w.addEventListener('error', e => errors.push('error: ' + e.message));
    w.console.error = (...a) => errors.push('console.error: ' + a.join(' '));
    w.navigator.vibrate = () => true;
    w.scrollTo = () => {};
    w.HTMLElement.prototype.scrollIntoView = () => {};
    w.HTMLInputElement.prototype.setSelectionRange = function () {};
  },
});
const w = dom.window, d = w.document;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const click = sel => { const el = typeof sel === 'string' ? d.querySelector(sel) : sel; if (!el) throw new Error('找不到元素 ' + sel); el.dispatchEvent(new w.MouseEvent('click', { bubbles: true })); };
const view = () => d.querySelector('.view');
const txt = () => view().textContent.replace(/\s+/g, ' ');
const assert = (c, m) => { if (!c) throw new Error('断言失败：' + m); };
const step = (n) => console.log('✓', n);

(async () => {
  await sleep(400);
  assert(txt().includes('心中所问何事'), '首页渲染'); step('首页');
  click('[data-cat="事业"]'); await sleep(50);
  assert(txt().includes('起 卦'), '起卦页'); step('起卦页');
  const q = d.querySelector('#q'); q.value = '近期 offer 能否顺利落地？'; q.dispatchEvent(new w.Event('input'));
  click('[data-act="start"]'); await sleep(80);
  assert(view().classList.contains('dk'), '摇卦页为暗色'); step('摇卦页');
  // 模拟传感器
  for (let i = 0; i < 40; i++) { const e = new w.Event('devicemotion'); e.accelerationIncludingGravity = { x: Math.sin(i) * 9, y: Math.cos(i) * 7, z: 9.8 }; e.rotationRate = { alpha: i, beta: 2 * i, gamma: 3 }; e.interval = 16; w.dispatchEvent(e); }
  for (let k = 0; k < 6; k++) {
    click('[data-act="throw"]'); await sleep(1100);
  }
  assert(d.querySelector('[data-act="done"]'), '六爻已成');
  step('摇六爻：' + txt().match(/(初爻.*?上爻)/)?.[0]?.slice(0, 120));
  click('[data-act="done"]'); await sleep(80);
  assert(txt().includes('本 卦'), '排盘页'); step('排盘页：' + d.querySelector('.cal[style*="font-size:3"]')?.textContent);
  const rows = d.querySelectorAll('.pr[data-yao]'); assert(rows.length === 6, '6 行爻');
  assert(txt().includes('量子物理真随机起卦'), '量子凭据入口');
  click(rows[2]); await sleep(60);
  assert(d.querySelector('.sheet') && d.querySelector('.sheet').textContent.includes('爻辞'), '爻详情'); step('爻详情抽屉');
  click(d.querySelector('.sheet [data-p]:not([disabled])')); await sleep(30);
  click('.dim'); await sleep(30);
  click('[data-tab="duan"]'); await sleep(60);
  assert(txt().includes('综合断语') && txt().includes('应期推演'), '断卦页'); step('断卦页：' + d.querySelector('.view .cal[style*="font-size:50px"]').textContent);
  click('[data-v="ok"]'); await sleep(30);
  click('[data-tab="note"]'); await sleep(30);
  d.querySelector('#nt').value = '测试笔记'; click('[data-act="addnote"]'); await sleep(30);
  assert(txt().includes('测试笔记'), '笔记'); step('笔记');
  click('[data-tab="pan"]'); await sleep(30);
  click('[data-act="proof"]'); await sleep(50);
  assert(txt().includes('真随机凭据') && txt().includes('Monobit'), '凭据页'); step('凭据页：' + txt().match(/p=[\d.]+/)[0]);
  click('[data-act="back"]'); await sleep(30);
  click('[data-act="ss"]'); await sleep(30); assert(d.querySelector('.sheet').textContent.includes('互卦'), '神煞'); click('.dim');
  click('[data-gua]'); await sleep(40); assert(txt().includes('卦辞'), '卦详情');
  for (const s of ['tuan', 'xiang', 'yao', 'jf']) { click(`[data-sec="${s}"]`); await sleep(15); }
  step('卦详情（卦辞/彖/象/爻/纳甲）');
  // tab 切换
  click('.tb [data-go="cases"]'); await sleep(40); assert(txt().includes('共 1 例'), '卦例'); step('卦例');
  click('[data-act="search"]'); await sleep(20);
  click('.tb [data-go="calendar"]'); await sleep(40); assert(txt().includes('旬空'), '万年历');
  click('[data-mv="1"]'); await sleep(20); click('[data-mv="-1"]'); await sleep(20); click('.cd[data-d]'); await sleep(20); step('万年历');
  click('.tb [data-go="me"]'); await sleep(40); assert(txt().includes('量子随机源'), '我的'); step('我的');
  click('[data-act="diag"]'); await sleep(200); assert(txt().includes('NIST'), '自检'); step('熵源自检');
  click('.tb [data-go="home"]'); await sleep(30); click('[data-go="dict"]'); await sleep(40);
  click('[data-by="pal"]'); await sleep(30); assert(d.querySelectorAll('.gg button').length === 64, '卦典 64'); step('卦典八宫');
  // 其他起卦方式
  for (const m of ['time', 'num', 'char', 'manual']) {
    click('.tb [data-go="ask"]'); await sleep(30);
    const qq = d.querySelector('#q'); qq.value = '测试' + m; qq.dispatchEvent(new w.Event('input'));
    click(`[data-m="${m}"]`); await sleep(20);
    if (m === 'num') { d.querySelector('[data-k="n1"]').value = '7'; d.querySelector('[data-k="n1"]').dispatchEvent(new w.Event('input')); d.querySelector('[data-k="n2"]').value = '13'; d.querySelector('[data-k="n2"]').dispatchEvent(new w.Event('input')); }
    if (m === 'char') { const i = d.querySelector('[data-k="chars"]'); i.value = '爻观测试'; i.dispatchEvent(new w.Event('input')); }
    click('[data-act="start"]'); await sleep(40);
    if (m === 'manual') { click('[data-i="0"][data-v="9"]'); await sleep(10); click('[data-act="ok"]'); await sleep(40); }
    assert(txt().includes('本 卦'), m + ' 成卦');
  }
  step('时间 / 报数 / 汉字 / 手工 起卦');
  // 离线摇钱：无量子
  click('.tb [data-go="ask"]'); await sleep(30);
  const q2 = d.querySelector('#q'); q2.value = '离线'; q2.dispatchEvent(new w.Event('input'));
  click('[data-m="offline"]'); await sleep(20); click('[data-act="start"]'); await sleep(40);
  const before = fetchLog.length;
  for (let k = 0; k < 6; k++) {
    for (let i = 0; i < 40; i++) { const e = new w.Event('devicemotion'); e.accelerationIncludingGravity = { x: Math.sin(i + k) * 9, y: 1, z: 9.8 }; e.rotationRate = { alpha: 1, beta: 2, gamma: 3 }; w.dispatchEvent(e); }
    click('[data-act="throw"]'); await sleep(1000);
  }
  click('[data-act="done"]'); await sleep(60);
  assert(txt().includes('传感器物理噪声起卦'), '离线凭据');
  assert(fetchLog.length === before, '离线模式不应联网');
  step('离线摇钱（仅传感器）');
  // 量子源全挂 → 必须拒绝出卦
  w.fetch = async () => { throw new Error('network down'); };
  w.TRNG.pool.qbytes = new Uint8Array(0); w.TRNG.pool.lastAnu = 0;
  w.TRNG.sensor.samples.length = 0; w.TRNG.sensor.touches.length = 0;
  let refused = false;
  try { await w.TRNG.throwLine(1, {}); } catch (e) { refused = e.code === 'NO_ENTROPY'; }
  assert(refused, '无物理熵时应拒绝');
  step('无物理熵时拒绝出卦（不回退伪随机）');
  console.log('\nfetch 调用:', [...new Set(fetchLog)].join(', '));
  console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : '无 JS 错误');
  process.exit(errors.length ? 1 : 0);
})().catch(e => { console.log('FAIL', e.message); console.log(errors.join('\n')); console.log('当前视图:', txt().slice(0, 300)); process.exit(1); });
