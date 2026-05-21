/* ===== PARTICLES ===== */
const Particles = {
  canvas: null, ctx: null, particles: [], count: 60,
  init(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.spawn();
    this.animate();
  },
  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  },
  spawn() {
    this.particles = [];
    for (let i = 0; i < this.count; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        r: Math.random() * 2 + 0.5,
        dx: (Math.random() - 0.5) * 0.4,
        dy: (Math.random() - 0.5) * 0.4,
        o: Math.random() * 0.5 + 0.1
      });
    }
  },
  animate() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    const style = getComputedStyle(document.documentElement);
    const color = style.getPropertyValue('--accent').trim() || '#00f0ff';
    this.particles.forEach(p => {
      p.x += p.dx; p.y += p.dy;
      if (p.x < 0) p.x = this.canvas.width;
      if (p.x > this.canvas.width) p.x = 0;
      if (p.y < 0) p.y = this.canvas.height;
      if (p.y > this.canvas.height) p.y = 0;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.globalAlpha = p.o * (parseFloat(style.getPropertyValue('--glow-mult')) || 0.7);
      ctx.fill();
      // Glow
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.globalAlpha = p.o * 0.1;
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    // Draw connections
    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        const a = this.particles[i], b = this.particles[j];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        if (dist < 120) {
          ctx.beginPath();
          ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = color;
          ctx.globalAlpha = (1 - dist / 120) * 0.08;
          ctx.stroke();
        }
      }
    }
    ctx.globalAlpha = 1;
    requestAnimationFrame(() => this.animate());
  },
  setCount(n) { this.count = n; this.spawn(); }
};

/* ===== SOUND ===== */
const Sound = {
  ctx: null, enabled: true,
  init() { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); },
  click() {
    if (!this.enabled || !this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.connect(g); g.connect(this.ctx.destination);
    o.frequency.value = 800; o.type = 'sine';
    g.gain.setValueAtTime(0.08, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);
    o.start(); o.stop(this.ctx.currentTime + 0.08);
  },
  success() {
    if (!this.enabled || !this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.connect(g); g.connect(this.ctx.destination);
    o.frequency.value = 1200; o.type = 'sine';
    g.gain.setValueAtTime(0.06, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);
    o.start(); o.stop(this.ctx.currentTime + 0.15);
  }
};

/* ===== GRAPH PLOTTER ===== */
const Grapher = {
  canvas: null, ctx: null,
  init(canvas) { this.canvas = canvas; this.ctx = canvas.getContext('2d'); },
  plot(eqStr, xMin, xMax, yMin, yMax) {
    const c = this.canvas, ctx = this.ctx;
    const dpr = window.devicePixelRatio || 1;
    const rect = c.getBoundingClientRect();
    c.width = rect.width * dpr; c.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    const W = rect.width, H = rect.height;
    const style = getComputedStyle(document.documentElement);
    const isDark = !document.documentElement.getAttribute('data-theme')?.includes('white');

    // Background
    ctx.fillStyle = isDark ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.8)';
    ctx.fillRect(0, 0, W, H);

    const toX = x => (x - xMin) / (xMax - xMin) * W;
    const toY = y => H - (y - yMin) / (yMax - yMin) * H;

    // Grid
    ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
    ctx.lineWidth = 1;
    for (let x = Math.ceil(xMin); x <= xMax; x++) {
      ctx.beginPath(); ctx.moveTo(toX(x), 0); ctx.lineTo(toX(x), H); ctx.stroke();
    }
    for (let y = Math.ceil(yMin); y <= yMax; y++) {
      ctx.beginPath(); ctx.moveTo(0, toY(y)); ctx.lineTo(W, toY(y)); ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)';
    ctx.lineWidth = 1.5;
    if (yMin <= 0 && yMax >= 0) { ctx.beginPath(); ctx.moveTo(0, toY(0)); ctx.lineTo(W, toY(0)); ctx.stroke(); }
    if (xMin <= 0 && xMax >= 0) { ctx.beginPath(); ctx.moveTo(toX(0), 0); ctx.lineTo(toX(0), H); ctx.stroke(); }

    // Axis labels
    ctx.fillStyle = isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)';
    ctx.font = '10px Inter';
    for (let x = Math.ceil(xMin); x <= xMax; x++) {
      if (x === 0) continue;
      ctx.fillText(x, toX(x) + 2, toY(0) - 4 > 10 ? toY(0) - 4 : 14);
    }
    for (let y = Math.ceil(yMin); y <= yMax; y++) {
      if (y === 0) continue;
      ctx.fillText(y, toX(0) + 4 < W - 20 ? toX(0) + 4 : 4, toY(y) + 12);
    }

    // Parse equation
    const fn = this.parseEq(eqStr);
    if (!fn) return;

    // Animate the curve
    const color = style.getPropertyValue('--accent').trim() || '#00f0ff';
    const steps = Math.floor(W * 2);
    let frame = 0;
    const totalFrames = 60;

    const drawFrame = () => {
      // Clear curve area by redrawing background + grid (only on first frame we already have it)
      if (frame > 0) {
        ctx.fillStyle = isDark ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.8)';
        ctx.fillRect(0, 0, W, H);
        // Redraw grid
        ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
        ctx.lineWidth = 1;
        for (let x = Math.ceil(xMin); x <= xMax; x++) { ctx.beginPath(); ctx.moveTo(toX(x),0); ctx.lineTo(toX(x),H); ctx.stroke(); }
        for (let y = Math.ceil(yMin); y <= yMax; y++) { ctx.beginPath(); ctx.moveTo(0,toY(y)); ctx.lineTo(W,toY(y)); ctx.stroke(); }
        ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)';
        ctx.lineWidth = 1.5;
        if (yMin<=0&&yMax>=0) { ctx.beginPath(); ctx.moveTo(0,toY(0)); ctx.lineTo(W,toY(0)); ctx.stroke(); }
        if (xMin<=0&&xMax>=0) { ctx.beginPath(); ctx.moveTo(toX(0),0); ctx.lineTo(toX(0),H); ctx.stroke(); }
        ctx.fillStyle = isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)';
        ctx.font = '10px Inter';
        for (let x=Math.ceil(xMin);x<=xMax;x++){if(x===0)continue;ctx.fillText(x,toX(x)+2,toY(0)-4>10?toY(0)-4:14);}
        for (let y=Math.ceil(yMin);y<=yMax;y++){if(y===0)continue;ctx.fillText(y,toX(0)+4<W-20?toX(0)+4:4,toY(y)+12);}
      }

      const drawUpTo = Math.floor((frame / totalFrames) * steps);
      // Glow
      ctx.shadowColor = color; ctx.shadowBlur = 10;
      ctx.strokeStyle = color; ctx.lineWidth = 2.5;
      ctx.beginPath();
      let started = false;
      for (let i = 0; i <= drawUpTo; i++) {
        const x = xMin + (i / steps) * (xMax - xMin);
        let y;
        try { y = fn(x); } catch { continue; }
        if (!isFinite(y) || isNaN(y)) { started = false; continue; }
        const px = toX(x), py = toY(y);
        if (py < -50 || py > H + 50) { started = false; continue; }
        if (!started) { ctx.moveTo(px, py); started = true; } else { ctx.lineTo(px, py); }
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      frame++;
      if (frame <= totalFrames) requestAnimationFrame(drawFrame);
    };
    drawFrame();
  },

  parseEq(str) {
    try {
      let e = str.replace(/\^/g, '**')
        .replace(/sin/g, 'Math.sin').replace(/cos/g, 'Math.cos').replace(/tan/g, 'Math.tan')
        .replace(/log/g, 'Math.log10').replace(/ln/g, 'Math.log')
        .replace(/sqrt/g, 'Math.sqrt').replace(/abs/g, 'Math.abs')
        .replace(/pi/g, 'Math.PI').replace(/(?<![.a-zA-Z])e(?![a-zA-Z])/g, 'Math.E');
      return new Function('x', `"use strict"; return (${e});`);
    } catch { return null; }
  }
};

/* ===== VOICE ===== */
const Voice = {
  recognition: null, listening: false,
  init() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return false;
    this.recognition = new SR();
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.lang = 'en-US';
    return true;
  },
  start(onResult, onEnd) {
    if (!this.recognition) return;
    this.listening = true;
    this.recognition.onresult = (e) => {
      const text = e.results[0][0].transcript.toLowerCase();
      onResult(this.parseVoice(text));
    };
    this.recognition.onend = () => { this.listening = false; onEnd(); };
    this.recognition.onerror = () => { this.listening = false; onEnd(); };
    this.recognition.start();
  },
  stop() { if (this.recognition && this.listening) this.recognition.stop(); },
  parseVoice(text) {
    return text
      .replace(/plus/g, '+').replace(/minus/g, '-').replace(/times/g, '×')
      .replace(/multiplied by/g, '×').replace(/divided by/g, '÷').replace(/over/g, '÷')
      .replace(/percent/g, '%').replace(/point/g, '.').replace(/dot/g, '.')
      .replace(/open\s*(paren|bracket)/g, '(').replace(/close\s*(paren|bracket)/g, ')')
      .replace(/sine/g, 'sin').replace(/cosine/g, 'cos').replace(/tangent/g, 'tan')
      .replace(/square root of/g, 'sqrt(').replace(/log of/g, 'log(')
      .replace(/pi/g, 'π').replace(/equals/g, '=')
      .replace(/[^0-9+\-×÷%.()πesincotalgqrb\s]/g, ' ').replace(/\s+/g, ' ').trim();
  }
};

/* ===== EXPORT ===== */
function exportHistory(format) {
  const h = CalcEngine.history;
  if (!h.length) return;
  let content, mime, ext;
  if (format === 'txt') {
    content = 'NeoCalc History\n' + '='.repeat(40) + '\n\n';
    h.forEach((item, i) => {
      content += `${i+1}. ${item.expr} = ${item.result}\n   ${new Date(item.time).toLocaleString()}\n\n`;
    });
    mime = 'text/plain'; ext = 'txt';
  } else {
    // Simple HTML-based "PDF" download
    content = `<html><head><title>NeoCalc History</title><style>body{font-family:monospace;padding:40px}h1{color:#333}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background:#f4f4f4}</style></head><body><h1>NeoCalc History</h1><table><tr><th>#</th><th>Expression</th><th>Result</th><th>Date</th></tr>`;
    h.forEach((item, i) => {
      content += `<tr><td>${i+1}</td><td>${item.expr}</td><td>${item.result}</td><td>${new Date(item.time).toLocaleString()}</td></tr>`;
    });
    content += '</table></body></html>';
    mime = 'text/html'; ext = 'html';
  }
  const blob = new Blob([content], { type: mime });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `neocalc-history.${ext}`;
  a.click();
  URL.revokeObjectURL(a.href);
}
