/* 爻观 · 物理真随机（TRNG）模块
 *
 * 目标：摇钱起卦的每一枚铜钱正反，都来自物理过程，而非确定性算法（伪随机）。
 *
 * 熵源（按优先级合并，至少需要一个物理源）：
 *  A. 量子随机数（QRNG）——量子物理过程：
 *     1) ANU Quantum Random Numbers（澳大利亚国立大学，测量真空量子涨落）
 *     2) LfD QRNG（德国 LfD 实验室，基于光子到达时间/分束器的量子过程）
 *  B. 本机物理传感器噪声——用户摇动手机时，加速度计/陀螺仪读数的最低有效位
 *     含有 MEMS 器件的热噪声与人手的不可预测运动；另加触摸事件的微秒级时间抖动。
 *
 * 合成：所有物理样本 + 来源标签 → SHA-256 混合（仅作“熵提取/白化”，不产生新随机性），
 *       输出字节按 bit 使用，每枚铜钱消耗 1 bit，保证 0/1 等概率（无模偏差）。
 *
 * 决不回退到 Math.random()。若所有物理源均不可用，抛出错误并让界面提示用户。
 * 注：crypto.getRandomValues 的底层虽也会吸收硬件噪声，但它是 CSPRNG 输出，
 *     按用户要求不作为熵源使用。
 */
(function (root) {
  'use strict';

  const enc = new TextEncoder();
  const hex = b => Array.from(b, x => x.toString(16).padStart(2, '0')).join('');
  async function sha256(bytes) { return new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)); }
  function concat(arrs) {
    const n = arrs.reduce((s, a) => s + a.length, 0); const o = new Uint8Array(n); let k = 0;
    arrs.forEach(a => { o.set(a, k); k += a.length; }); return o;
  }
  function timeout(ms) { return new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms)); }

  // ---------------- A. 量子源 ----------------
  const QRNG_SOURCES = [
    {
      id: 'anu', name: 'ANU 量子真空涨落', org: '澳大利亚国立大学',
      // 公共接口限速 1 次/分钟：一次取足 64 字节，够一卦（18 枚铜钱）使用并留余量
      async fetch(n) {
        const r = await fetch(`https://qrng.anu.edu.au/API/jsonI.php?length=${n}&type=uint8`, { cache: 'no-store' });
        const t = await r.text();
        let j; try { j = JSON.parse(t); } catch (e) { throw new Error(t.slice(0, 80)); }
        if (!j.success || !Array.isArray(j.data) || j.data.length !== n) throw new Error('ANU 返回异常');
        return new Uint8Array(j.data);
      },
    },
    {
      id: 'lfd', name: 'LfD 光量子随机源', org: 'LfD Lab（德国）',
      async fetch(n) {
        const r = await fetch(`https://lfdr.de/qrng_api/qrng?length=${n}&format=HEX`, { cache: 'no-store' });
        const j = await r.json();
        if (!j.qrn || j.qrn.length !== n * 2) throw new Error('LfD 返回异常');
        return new Uint8Array(j.qrn.match(/../g).map(h => parseInt(h, 16)));
      },
    },
  ];

  // ---------------- B. 传感器物理噪声 ----------------
  const sensor = {
    samples: [],          // Float64 原始读数
    touches: [],          // 触摸时间戳（performance.now，亚毫秒）
    listening: false,
    motionCount: 0,
    lastShake: 0,
    onShake: null,        // 回调：检测到“摇一摇”
    _h: null,
    _o: null,
    async requestPermission() {
      // iOS 13+ 需要显式授权；Android WebView 直接可用
      try {
        if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
          const s = await DeviceMotionEvent.requestPermission();
          return s === 'granted';
        }
      } catch (e) { return false; }
      return typeof DeviceMotionEvent !== 'undefined';
    },
    start() {
      if (this.listening) return;
      this.listening = true;
      let prev = null;
      this._h = e => {
        const a = e.accelerationIncludingGravity || e.acceleration || {};
        const r = e.rotationRate || {};
        const v = [a.x, a.y, a.z, r.alpha, r.beta, r.gamma, e.interval, performance.now()];
        if (v.slice(0, 3).some(x => typeof x === 'number')) {
          this.samples.push(...v.map(x => (typeof x === 'number' && isFinite(x)) ? x : 0));
          this.motionCount++;
          if (this.samples.length > 8000) this.samples.splice(0, this.samples.length - 8000);
          // 摇动检测：加速度变化量
          if (prev) {
            const d = Math.abs(a.x - prev.x) + Math.abs(a.y - prev.y) + Math.abs(a.z - prev.z);
            const now = performance.now();
            if (d > 28 && now - this.lastShake > 900) { this.lastShake = now; this.onShake && this.onShake(); }
          }
          prev = { x: a.x || 0, y: a.y || 0, z: a.z || 0 };
        }
      };
      this._o = e => { this.samples.push(e.alpha || 0, e.beta || 0, e.gamma || 0, performance.now()); };
      window.addEventListener('devicemotion', this._h);
      window.addEventListener('deviceorientation', this._o);
    },
    stop() {
      window.removeEventListener('devicemotion', this._h);
      window.removeEventListener('deviceorientation', this._o);
      this.listening = false;
    },
    touch(ev) {
      this.touches.push(performance.now(), ev && ev.clientX || 0, ev && ev.clientY || 0, ev && ev.timeStamp || 0);
      if (this.touches.length > 600) this.touches.splice(0, this.touches.length - 600);
    },
    /** 取出并清空当前样本；估算熵（保守：每个有效运动样本只计 2 bit） */
    drain() {
      const s = this.samples.splice(0), t = this.touches.splice(0);
      const motion = s.length / 8 | 0;
      const f = new Float64Array(s.concat(t));
      return { bytes: new Uint8Array(f.buffer), motionSamples: motion, touchSamples: t.length / 4 | 0, estBits: motion * 2 + (t.length / 4 | 0) * 4 };
    },
  };

  // ---------------- 熵池 ----------------
  const pool = {
    qbytes: new Uint8Array(0), qsrc: [],   // 量子字节缓存
    status: { anu: 'idle', lfd: 'idle' },
    lastAnu: 0,
    async refillQuantum(need = 64) {
      const got = [];
      const tasks = QRNG_SOURCES.map(async src => {
        if (src.id === 'anu' && Date.now() - this.lastAnu < 62000) { this.status.anu = 'cooldown'; return; }
        this.status[src.id] = 'loading';
        try {
          const b = await Promise.race([src.fetch(need), timeout(9000)]);
          if (src.id === 'anu') this.lastAnu = Date.now();
          got.push({ src, b });
          this.status[src.id] = 'ok';
        } catch (e) {
          this.status[src.id] = 'fail';
          if (src.id === 'anu' && String(e.message).includes('limited')) { this.lastAnu = Date.now(); this.status.anu = 'cooldown'; }
        }
      });
      await Promise.all(tasks);
      got.forEach(({ src, b }) => {
        this.qbytes = concat([this.qbytes, b]);
        this.qsrc.push({ id: src.id, name: src.name, n: b.length, digest: '' });
      });
      return got.length;
    },
  };

  /**
   * 为一爻生成 3 枚铜钱结果。
   * 每次调用都会：取 ≥16 字节量子熵（若有）+ 传感器样本 + 爻位/时间标签 → SHA-256 → 取 3 bit。
   * @returns {Promise<{coins:number[], value:number, proof:object}>}
   *   coins: 3 个 0/1（1=背/阳面… 采用传统：字为阴，背为阳）
   *   value: 6/7/8/9
   */
  async function throwLine(index, opts = {}) {
    const minQ = 16;
    if (pool.qbytes.length < minQ && !opts.offline) await pool.refillQuantum(64);
    const q = opts.offline ? new Uint8Array(0) : pool.qbytes.slice(0, minQ);
    pool.qbytes = pool.qbytes.slice(q.length);
    const s = sensor.drain();
    const sources = [];
    if (q.length) sources.push({ type: 'quantum', label: pool.qsrc.map(x => x.name).filter((v, i, a) => a.indexOf(v) === i).join(' + '), bytes: q.length });
    if (s.motionSamples > 0) sources.push({ type: 'motion', label: '加速度计 / 陀螺仪噪声', samples: s.motionSamples });
    if (s.touchSamples > 0) sources.push({ type: 'touch', label: '触摸时序抖动', samples: s.touchSamples });

    // 熵充足性检查：量子 ≥16 字节（128 bit），或传感器保守估计 ≥ 64 bit
    const enough = q.length >= minQ || s.estBits >= 64;
    if (!enough) {
      const err = new Error('物理熵不足');
      err.code = 'NO_ENTROPY';
      err.detail = { quantum: q.length, motion: s.motionSamples, touch: s.touchSamples, status: { ...pool.status } };
      throw err;
    }
    const tag = enc.encode(`yaoguan|line${index}|${Date.now()}|`);
    const digest = await sha256(concat([tag, q, s.bytes]));
    // 取首字节的低 3 位作为三枚铜钱；每个 bit 均匀独立
    const b = digest[0];
    const coins = [(b >> 0) & 1, (b >> 1) & 1, (b >> 2) & 1]; // 1 = 背（阳面计 3），0 = 字（阴面计 2）
    const value = coins.reduce((s, c) => s + (c ? 3 : 2), 0);   // 6 老阴 7 少阳 8 少阴 9 老阳
    return {
      coins, value,
      proof: { sources, quantumHex: hex(q), sensorBytes: s.bytes.length, digest: hex(digest), at: new Date().toISOString() },
    };
  }

  /** 熵源自检：在“我的 → 真随机”页面展示 */
  async function diagnose() {
    const r = { quantum: [], sensor: sensor.motionCount > 0 };
    for (const src of QRNG_SOURCES) {
      const t0 = performance.now();
      try {
        if (src.id === 'anu' && Date.now() - pool.lastAnu < 62000) { r.quantum.push({ id: src.id, name: src.name, ok: null, msg: '冷却中（1 次/分钟）' }); continue; }
        const b = await Promise.race([src.fetch(32), timeout(9000)]);
        if (src.id === 'anu') pool.lastAnu = Date.now();
        pool.qbytes = concat([pool.qbytes, b]);
        r.quantum.push({ id: src.id, name: src.name, org: src.org, ok: true, ms: Math.round(performance.now() - t0), sample: hex(b.slice(0, 8)) });
      } catch (e) { r.quantum.push({ id: src.id, name: src.name, ok: false, msg: String(e.message || e).slice(0, 60) }); }
    }
    return r;
  }

  /** 统计检验（单比特频数检验，NIST SP800-22 Monobit）：用于“熵源质量”展示 */
  function monobit(bytes) {
    let s = 0; const n = bytes.length * 8;
    bytes.forEach(b => { for (let i = 0; i < 8; i++) s += ((b >> i) & 1) ? 1 : -1; });
    const sobs = Math.abs(s) / Math.sqrt(n);
    // erfc 近似
    const erfc = x => { const t = 1 / (1 + 0.5 * x); return t * Math.exp(-x * x - 1.26551223 + t * (1.00002368 + t * (0.37409196 + t * (0.09678418 + t * (-0.18628806 + t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 + t * (-0.82215223 + t * 0.17087277))))))))); };
    return { n, ones: (n + s) / 2, p: erfc(sobs / Math.SQRT2) };
  }

  root.TRNG = { sensor, pool, throwLine, diagnose, monobit, QRNG_SOURCES };
})(window);
