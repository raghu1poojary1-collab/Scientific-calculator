/* ===== MAIN APP CONTROLLER ===== */
(function() {
  'use strict';

  // State
  let expression = '';
  let currentResult = '0';
  let justEvaluated = false;

  // DOM refs
  const $ = id => document.getElementById(id);
  const exprEl = $('display-expression');
  const resultEl = $('display-result');
  const aiHintEl = $('ai-hint');
  const angleBadge = $('angle-mode-badge');
  const memBadge = $('memory-badge');

  /* ===== BOOT SEQUENCE ===== */
  function boot() {
    const bootEl = $('boot-screen');
    const statusEl = $('boot-status');
    const msgs = ['Loading modules...', 'Preparing interface...', 'Ready.'];
    let i = 0;
    const iv = setInterval(() => {
      if (i < msgs.length) { statusEl.textContent = msgs[i]; i++; }
      else {
        clearInterval(iv);
        bootEl.classList.add('fade-out');
        const app = $('app');
        app.classList.remove('app-hidden');
        setTimeout(() => { bootEl.style.display = 'none'; }, 800);
      }
    }, 600);
  }

  /* ===== DISPLAY UPDATE ===== */
  function updateDisplay() {
    exprEl.textContent = expression;
    // Live preview
    if (expression && !justEvaluated) {
      const preview = CalcEngine.preview(expression);
      if (preview && preview !== expression) {
        resultEl.textContent = preview;
        resultEl.classList.remove('error');
      }
    }
    // AI hint
    const hint = CalcEngine.validateExpression(expression);
    aiHintEl.textContent = hint ? '⚠ ' + hint : '';
    // Auto-scroll expression
    exprEl.scrollLeft = exprEl.scrollWidth;
  }

  function showResult(res) {
    resultEl.textContent = res.result;
    resultEl.classList.toggle('error', res.error);
    if (!res.error) {
      resultEl.classList.remove('animate-result');
      void resultEl.offsetWidth;
      resultEl.classList.add('animate-result');
      Sound.success();
    }
  }

  /* ===== INPUT HANDLING ===== */
  function inputValue(val) {
    if (justEvaluated) {
      // If result shown and user types a number, start fresh
      if (/[0-9.π]/.test(val)) { expression = ''; }
      justEvaluated = false;
    }
    expression += val;
    updateDisplay();
  }

  function handleAction(action) {
    switch(action) {
      case 'clear':
        expression = '';
        currentResult = '0';
        justEvaluated = false;
        resultEl.textContent = '0';
        resultEl.classList.remove('error', 'animate-result');
        exprEl.textContent = '';
        aiHintEl.textContent = '';
        break;

      case 'backspace':
        if (justEvaluated) { expression = ''; justEvaluated = false; }
        // Remove last token (function name or single char)
        const fns = ['sin(','cos(','tan(','asin(','acos(','atan(','log(','ln(','sqrt(','cbrt(','abs(','EXP'];
        let removed = false;
        for (const fn of fns) {
          if (expression.endsWith(fn)) { expression = expression.slice(0, -fn.length); removed = true; break; }
        }
        if (!removed) expression = expression.slice(0, -1);
        updateDisplay();
        if (!expression) { resultEl.textContent = '0'; resultEl.classList.remove('error'); }
        break;

      case 'equals':
        if (!expression) break;
        const res = CalcEngine.evaluate(expression);
        showResult(res);
        if (!res.error) { expression = res.result; }
        justEvaluated = true;
        renderHistory();
        break;

      case 'negate':
        if (justEvaluated && currentResult !== '0') {
          const n = parseFloat(CalcEngine.lastResult);
          expression = String(-n);
          resultEl.textContent = expression;
          justEvaluated = false;
        } else {
          expression = '(-' + expression + ')';
        }
        updateDisplay();
        break;

      case '2nd':
        CalcEngine.is2nd = !CalcEngine.is2nd;
        $('btn-2nd').classList.toggle('active-2nd', CalcEngine.is2nd);
        // Swap button labels
        const swaps = CalcEngine.is2nd ?
          {sin:'asin',cos:'acos',tan:'atan',log:'10ˣ',ln:'eˣ',sqrt:'³√',pow2:'√x',fact:'x⁻¹'} :
          {sin:'sin',cos:'cos',tan:'tan',log:'log',ln:'ln',sqrt:'√',pow2:'x²',fact:'x!'};
        for (const [id, label] of Object.entries(swaps)) {
          const btn = $('btn-' + id);
          if (btn) btn.textContent = label;
        }
        break;

      case 'sin': case 'cos': case 'tan':
        const trig = CalcEngine.is2nd ? 'a' + action : action;
        inputValue(trig + '(');
        break;

      case 'log':
        inputValue(CalcEngine.is2nd ? '10^(' : 'log(');
        break;
      case 'ln':
        inputValue(CalcEngine.is2nd ? `${Math.E}^(` : 'ln(');
        break;

      case 'sqrt': inputValue(CalcEngine.is2nd ? 'cbrt(' : 'sqrt('); break;
      case 'cbrt': inputValue('cbrt('); break;
      case 'pow2':
        if (CalcEngine.is2nd) { inputValue('sqrt('); }
        else { expression += '^2'; updateDisplay(); }
        break;
      case 'pow3': expression += '^3'; updateDisplay(); break;
      case 'pow': expression += '^'; updateDisplay(); break;

      case 'fact':
        if (CalcEngine.is2nd) { expression = '1/(' + expression + ')'; }
        else { expression += '!'; }
        updateDisplay();
        break;
      case 'inv': expression = '1/(' + expression + ')'; updateDisplay(); break;
      case 'mod': inputValue('mod'); break;
      case 'exp': inputValue('EXP'); break;
      case 'abs': inputValue('abs('); break;

      // Memory
      case 'mc': CalcEngine.memory = 0; memBadge.style.display = 'none'; toast('Memory cleared'); break;
      case 'mr':
        inputValue(String(CalcEngine.memory));
        break;
      case 'mplus':
        CalcEngine.memory += parseFloat(CalcEngine.lastResult) || 0;
        memBadge.style.display = 'inline'; toast('M+ ' + CalcEngine.memory);
        break;
      case 'mminus':
        CalcEngine.memory -= parseFloat(CalcEngine.lastResult) || 0;
        memBadge.style.display = CalcEngine.memory !== 0 ? 'inline' : 'none';
        toast('M− ' + CalcEngine.memory);
        break;

      case 'deg-rad':
        CalcEngine.isDeg = !CalcEngine.isDeg;
        const mode = CalcEngine.isDeg ? 'DEG' : 'RAD';
        angleBadge.textContent = mode;
        $('btn-deg-rad').textContent = mode;
        toast('Mode: ' + mode);
        break;
    }
  }

  /* ===== TOAST ===== */
  function toast(msg) {
    const t = $('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2000);
  }

  /* ===== HISTORY ===== */
  function renderHistory(filter = '') {
    const list = $('history-list');
    const empty = $('history-empty');
    const items = CalcEngine.history.filter(h =>
      !filter || h.expr.includes(filter) || h.result.includes(filter)
    );
    // Remove old items except empty state
    list.querySelectorAll('.history-item').forEach(el => el.remove());
    empty.style.display = items.length ? 'none' : 'block';
    items.forEach(item => {
      const div = document.createElement('div');
      div.className = 'history-item';
      div.innerHTML = `<div class="h-expr">${escHtml(item.expr)}</div><div class="h-result">= ${escHtml(item.result)}</div><div class="h-time">${new Date(item.time).toLocaleString()}</div>`;
      div.addEventListener('click', () => {
        expression = item.expr;
        justEvaluated = false;
        updateDisplay();
        navigateTo('calculator');
      });
      list.appendChild(div);
    });
  }

  function escHtml(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

  /* ===== NAVIGATION ===== */
  function navigateTo(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    const target = $('page-' + page);
    if (target) { target.classList.remove('active'); void target.offsetWidth; target.classList.add('active'); }
    const navBtn = $('nav-' + page);
    if (navBtn) navBtn.classList.add('active');

    if (page === 'history') renderHistory();
    if (page === 'graphs') {
      Grapher.init($('graph-canvas'));
      const eq = $('graph-equation').value || 'sin(x)';
      plotGraph(eq);
    }
    if (page === 'tools') initTools();
  }

  /* ===== GRAPH ===== */
  function plotGraph(eq) {
    Grapher.init($('graph-canvas'));
    const xMin = parseFloat($('graph-xmin').value) || -10;
    const xMax = parseFloat($('graph-xmax').value) || 10;
    const yMin = parseFloat($('graph-ymin').value) || -10;
    const yMax = parseFloat($('graph-ymax').value) || 10;
    Grapher.plot(eq || $('graph-equation').value, xMin, xMax, yMin, yMax);
  }

  /* ===== TOOLS ===== */
  function initTools() {
    // Unit converter
    populateUnits();
    // Constants
    const cl = $('constants-list');
    if (!cl.children.length) {
      SCI_CONSTANTS.forEach(c => {
        const div = document.createElement('div');
        div.className = 'const-item';
        div.innerHTML = `<span class="const-name">${c.name} (${c.symbol})</span><span class="const-val">${c.value} ${c.unit}</span>`;
        div.addEventListener('click', () => {
          expression += String(c.value);
          updateDisplay();
          navigateTo('calculator');
          toast('Inserted ' + c.symbol);
        });
        cl.appendChild(div);
      });
    }
  }

  function populateUnits() {
    const cat = $('unit-category').value;
    const data = UnitData[cat];
    const fromSel = $('unit-from');
    const toSel = $('unit-to');
    fromSel.innerHTML = '';
    toSel.innerHTML = '';
    data.units.forEach((u, i) => {
      fromSel.add(new Option(u, i));
      toSel.add(new Option(u, i));
    });
    if (data.units.length > 1) toSel.selectedIndex = 1;
    doConvert();
  }

  function doConvert() {
    const cat = $('unit-category').value;
    const val = parseFloat($('unit-from-val').value) || 0;
    const fromIdx = parseInt($('unit-from').value);
    const toIdx = parseInt($('unit-to').value);
    const result = convertUnit(cat, fromIdx, toIdx, val);
    $('unit-to-val').value = parseFloat(result.toPrecision(10));
  }

  /* ===== RIPPLE EFFECT ===== */
  function addRipple(btn, e) {
    const rect = btn.getBoundingClientRect();
    const x = ((e.clientX || e.touches?.[0]?.clientX || rect.left + rect.width/2) - rect.left) / rect.width * 100;
    const y = ((e.clientY || e.touches?.[0]?.clientY || rect.top + rect.height/2) - rect.top) / rect.height * 100;
    btn.style.setProperty('--ripple-x', x + '%');
    btn.style.setProperty('--ripple-y', y + '%');
    btn.classList.remove('ripple');
    void btn.offsetWidth;
    btn.classList.add('ripple');
    setTimeout(() => btn.classList.remove('ripple'), 600);
  }

  /* ===== KEYBOARD SUPPORT ===== */
  function handleKey(e) {
    if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'SELECT') return;
    const k = e.key;
    if (/^[0-9.]$/.test(k)) { inputValue(k); Sound.click(); }
    else if (k === '+') { inputValue('+'); Sound.click(); }
    else if (k === '-') { inputValue('-'); Sound.click(); }
    else if (k === '*') { inputValue('×'); Sound.click(); }
    else if (k === '/') { e.preventDefault(); inputValue('÷'); Sound.click(); }
    else if (k === '%') { inputValue('%'); Sound.click(); }
    else if (k === '(' || k === ')') { inputValue(k); Sound.click(); }
    else if (k === '^') { inputValue('^'); Sound.click(); }
    else if (k === 'Enter' || k === '=') { e.preventDefault(); handleAction('equals'); }
    else if (k === 'Backspace') { handleAction('backspace'); Sound.click(); }
    else if (k === 'Escape' || k === 'Delete') { handleAction('clear'); }
  }

  /* ===== SETTINGS ===== */
  function loadSettings() {
    const theme = localStorage.getItem('nc_theme') || 'default';
    const lang = localStorage.getItem('nc_lang') || 'en';
    const sound = localStorage.getItem('nc_sound') !== 'false';
    const glow = localStorage.getItem('nc_glow') || '70';
    const btnStyle = localStorage.getItem('nc_btn_style') || 'rounded';
    const density = localStorage.getItem('nc_density') || '60';

    applyTheme(theme);
    I18N.set(lang);
    Sound.enabled = sound;
    $('sound-toggle').checked = sound;
    $('glow-intensity').value = glow;
    document.documentElement.style.setProperty('--glow-mult', parseInt(glow) / 100);
    $('button-style').value = btnStyle;
    document.body.setAttribute('data-btn-style', btnStyle);
    $('particle-density').value = density;
    Particles.setCount(parseInt(density));

    document.querySelectorAll('.lang-btn').forEach(b => b.classList.toggle('active', b.dataset.lang === lang));
  }

  function applyTheme(name) {
    document.documentElement.setAttribute('data-theme', name);
    document.querySelectorAll('.theme-preview').forEach(b => b.classList.toggle('active', b.dataset.theme === name));
    localStorage.setItem('nc_theme', name);
  }

  /* ===== INIT ===== */
  function init() {
    // Boot
    boot();

    // Particles
    Particles.init($('particle-canvas'));

    // Sound
    Sound.init();

    // Load settings
    setTimeout(loadSettings, 100);

    // Calculator buttons
    document.querySelectorAll('.calc-btn, .mem-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        Sound.click();
        addRipple(btn, e);
        if (btn.dataset.val !== undefined) {
          inputValue(btn.dataset.val);
        } else if (btn.dataset.action) {
          handleAction(btn.dataset.action);
        }
      });
    });

    // Navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        Sound.click();
        navigateTo(btn.dataset.page);
      });
    });

    // History search
    $('history-search').addEventListener('input', (e) => renderHistory(e.target.value));
    $('clear-history-btn').addEventListener('click', () => {
      CalcEngine.history = [];
      localStorage.removeItem('nc_history');
      renderHistory();
      toast('History cleared');
    });
    $('export-history-btn').addEventListener('click', () => exportHistory('txt'));

    // Graph
    $('plot-btn').addEventListener('click', () => plotGraph());
    document.querySelectorAll('.preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        $('graph-equation').value = btn.dataset.eq;
        plotGraph(btn.dataset.eq);
      });
    });

    // Tools
    $('unit-category').addEventListener('change', populateUnits);
    $('unit-from-val').addEventListener('input', doConvert);
    $('unit-from').addEventListener('change', doConvert);
    $('unit-to').addEventListener('change', doConvert);
    $('unit-swap').addEventListener('click', () => {
      const f = $('unit-from').value, t = $('unit-to').value;
      $('unit-from').value = t; $('unit-to').value = f;
      doConvert();
    });

    // BMI
    $('bmi-calc-btn').addEventListener('click', () => {
      const w = parseFloat($('bmi-weight').value);
      const h = parseFloat($('bmi-height').value) / 100;
      if (!w || !h) { $('bmi-result').textContent = 'Enter weight and height'; return; }
      const bmi = (w / (h * h)).toFixed(1);
      let cat = bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Normal' : bmi < 30 ? 'Overweight' : 'Obese';
      $('bmi-result').innerHTML = `<strong>${bmi}</strong> — ${cat}`;
    });

    // Age
    $('age-calc-btn').addEventListener('click', () => {
      const dob = new Date($('age-dob').value);
      if (isNaN(dob)) { $('age-result').textContent = 'Enter date of birth'; return; }
      const now = new Date();
      let years = now.getFullYear() - dob.getFullYear();
      let months = now.getMonth() - dob.getMonth();
      let days = now.getDate() - dob.getDate();
      if (days < 0) { months--; days += 30; }
      if (months < 0) { years--; months += 12; }
      $('age-result').innerHTML = `<strong>${years}</strong> years, <strong>${months}</strong> months, <strong>${days}</strong> days`;
    });

    // Random
    $('random-btn').addEventListener('click', () => {
      const min = parseInt($('random-min').value) || 0;
      const max = parseInt($('random-max').value) || 100;
      const val = Math.floor(Math.random() * (max - min + 1)) + min;
      const el = $('random-result');
      el.textContent = ''; el.classList.remove('animate-result');
      // Counting animation
      let cur = min; const step = Math.max(1, Math.floor((val - min) / 20));
      const iv = setInterval(() => {
        cur += step;
        if (cur >= val) { cur = val; clearInterval(iv); }
        el.textContent = cur;
      }, 30);
      Sound.success();
    });

    // Settings
    document.querySelectorAll('.theme-preview').forEach(btn => {
      btn.addEventListener('click', () => applyTheme(btn.dataset.theme));
    });
    $('sound-toggle').addEventListener('change', (e) => {
      Sound.enabled = e.target.checked;
      localStorage.setItem('nc_sound', e.target.checked);
    });
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        I18N.set(btn.dataset.lang);
      });
    });
    $('glow-intensity').addEventListener('input', (e) => {
      document.documentElement.style.setProperty('--glow-mult', parseInt(e.target.value) / 100);
      localStorage.setItem('nc_glow', e.target.value);
    });
    $('button-style').addEventListener('change', (e) => {
      document.body.setAttribute('data-btn-style', e.target.value);
      localStorage.setItem('nc_btn_style', e.target.value);
    });
    $('particle-density').addEventListener('input', (e) => {
      Particles.setCount(parseInt(e.target.value));
      localStorage.setItem('nc_density', e.target.value);
    });

    // Voice
    const voiceAvail = Voice.init();
    $('voice-btn').addEventListener('click', () => {
      if (!voiceAvail) { toast('Voice not supported in this browser'); return; }
      const btn = $('voice-btn');
      if (Voice.listening) { Voice.stop(); return; }
      btn.classList.add('listening');
      toast('Listening...');
      Voice.start(
        (text) => { expression = text; updateDisplay(); handleAction('equals'); },
        () => { btn.classList.remove('listening'); }
      );
    });

    // Keyboard
    document.addEventListener('keydown', handleKey);

    // Haptic
    $('haptic-toggle').addEventListener('change', (e) => {
      if (e.target.checked && navigator.vibrate) navigator.vibrate(50);
    });

    // Init tools
    populateUnits();
  }

  // Start
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
