/* ===== CALCULATOR ENGINE ===== */
const CalcEngine = {
  expression: '',
  lastResult: '0',
  memory: 0,
  isDeg: true,
  is2nd: false,
  history: JSON.parse(localStorage.getItem('nc_history') || '[]'),
  favorites: JSON.parse(localStorage.getItem('nc_favs') || '[]'),

  toRad(v) { return this.isDeg ? v * Math.PI / 180 : v; },
  fromRad(v) { return this.isDeg ? v * 180 / Math.PI : v; },

  factorial(n) {
    if (n < 0) return NaN;
    if (n === 0 || n === 1) return 1;
    if (n > 170) return Infinity;
    let r = 1; for (let i = 2; i <= n; i++) r *= i;
    return r;
  },

  preprocess(expr) {
    let e = expr
      .replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-')
      .replace(/π/g, `(${Math.PI})`).replace(/(?<![a-zA-Z])e(?![a-zA-Z])/g, `(${Math.E})`)
      .replace(/(\d+)!/g, 'FACT($1)')
      .replace(/mod/g, '%')
      .replace(/(\d+)\s*EXP\s*(\-?\d+)/g, '($1*Math.pow(10,$2))');

    // Handle functions
    const self = this;
    const fnMap = {
      'sin': v => Math.sin(self.toRad(v)),
      'cos': v => Math.cos(self.toRad(v)),
      'tan': v => Math.tan(self.toRad(v)),
      'asin': v => self.fromRad(Math.asin(v)),
      'acos': v => self.fromRad(Math.acos(v)),
      'atan': v => self.fromRad(Math.atan(v)),
      'log': v => Math.log10(v),
      'ln': v => Math.log(v),
      'sqrt': v => Math.sqrt(v),
      'cbrt': v => Math.cbrt(v),
      'abs': v => Math.abs(v),
      'FACT': v => self.factorial(v),
    };

    // Replace function calls
    for (const [fn, impl] of Object.entries(fnMap)) {
      const re = new RegExp(fn + '\\(', 'g');
      e = e.replace(re, `__fn_${fn}(`);
    }
    e = e.replace(/\^/g, '**');

    try {
      const scope = {};
      for (const [fn, impl] of Object.entries(fnMap)) {
        scope[`__fn_${fn}`] = impl;
      }
      const keys = Object.keys(scope);
      const vals = Object.values(scope);
      const fn = new Function(...keys, `"use strict"; return (${e});`);
      return fn(...vals);
    } catch (err) {
      throw new Error('Invalid expression');
    }
  },

  autoCloseBrackets(expr) {
    let open = 0;
    for (const ch of expr) { if (ch === '(') open++; if (ch === ')') open--; }
    return expr + ')'.repeat(Math.max(0, open));
  },

  validateExpression(expr) {
    // Basic validation hints
    if (/[+\-×÷*/%^]{2,}/.test(expr.replace(/\(-/g,''))) return 'Double operator detected';
    if (/\(\)/.test(expr)) return 'Empty parentheses';
    return null;
  },

  evaluate(expr) {
    if (!expr || !expr.trim()) return { result: '0', error: false };
    try {
      const closed = this.autoCloseBrackets(expr);
      const val = this.preprocess(closed);
      if (val === undefined || val === null || isNaN(val)) throw new Error('Invalid');
      if (!isFinite(val)) {
        const r = val > 0 ? '∞' : '-∞';
        return { result: r, error: false };
      }
      // Format result
      let res = val;
      if (Math.abs(val) > 1e15 || (Math.abs(val) < 1e-10 && val !== 0)) {
        res = val.toExponential(8);
      } else {
        res = parseFloat(val.toPrecision(12));
      }
      this.lastResult = String(res);
      // Save to history
      this.history.unshift({ expr, result: String(res), time: Date.now() });
      if (this.history.length > 200) this.history.pop();
      localStorage.setItem('nc_history', JSON.stringify(this.history));
      return { result: String(res), error: false };
    } catch (e) {
      return { result: 'Error', error: true };
    }
  },

  preview(expr) {
    if (!expr || !expr.trim()) return '';
    try {
      const closed = this.autoCloseBrackets(expr);
      const val = this.preprocess(closed);
      if (val === undefined || isNaN(val) || !isFinite(val)) return '';
      let res = parseFloat(val.toPrecision(12));
      return String(res);
    } catch { return ''; }
  }
};

/* ===== I18N ===== */
const I18N = {
  current: 'en',
  t: {
    en: {
      'nav.calculator':'Calculator','nav.history':'History','nav.graphs':'Graphs','nav.tools':'Tools','nav.settings':'Settings',
      'history.title':'History','history.search':'Search history...','history.empty':'No calculations yet',
      'graphs.title':'Graph Plotter','graphs.plot':'Plot',
      'tools.title':'Tools','tools.unit':'Unit Converter','tools.bmi':'BMI Calculator','tools.age':'Age Calculator','tools.random':'Random Number','tools.constants':'Scientific Constants',
      'settings.title':'Settings','settings.theme':'Theme','settings.sound':'Sound Effects','settings.language':'Language','settings.customize':'Customization'
    },
    hi: {
      'nav.calculator':'कैलकुलेटर','nav.history':'इतिहास','nav.graphs':'ग्राफ़','nav.tools':'उपकरण','nav.settings':'सेटिंग्स',
      'history.title':'इतिहास','history.search':'इतिहास खोजें...','history.empty':'अभी तक कोई गणना नहीं',
      'graphs.title':'ग्राफ़ प्लॉटर','graphs.plot':'प्लॉट',
      'tools.title':'उपकरण','tools.unit':'इकाई कनवर्टर','tools.bmi':'BMI कैलकुलेटर','tools.age':'आयु कैलकुलेटर','tools.random':'यादृच्छिक संख्या','tools.constants':'वैज्ञानिक स्थिरांक',
      'settings.title':'सेटिंग्स','settings.theme':'थीम','settings.sound':'ध्वनि प्रभाव','settings.language':'भाषा','settings.customize':'अनुकूलन'
    },
    kn: {
      'nav.calculator':'ಕ್ಯಾಲ್ಕುಲೇಟರ್','nav.history':'ಇತಿಹಾಸ','nav.graphs':'ಗ್ರಾಫ್','nav.tools':'ಉಪಕರಣ','nav.settings':'ಸೆಟ್ಟಿಂಗ್ಸ್',
      'history.title':'ಇತಿಹಾಸ','history.search':'ಇತಿಹಾಸ ಹುಡುಕಿ...','history.empty':'ಇನ್ನೂ ಯಾವುದೇ ಲೆಕ್ಕಾಚಾರಗಳಿಲ್ಲ',
      'graphs.title':'ಗ್ರಾಫ್ ಪ್ಲಾಟರ್','graphs.plot':'ಪ್ಲಾಟ್',
      'tools.title':'ಉಪಕರಣಗಳು','tools.unit':'ಘಟಕ ಪರಿವರ್ತಕ','tools.bmi':'BMI ಕ್ಯಾಲ್ಕುಲೇಟರ್','tools.age':'ವಯಸ್ಸು ಕ್ಯಾಲ್ಕುಲೇಟರ್','tools.random':'ಯಾದೃಚ್ಛಿಕ ಸಂಖ್ಯೆ','tools.constants':'ವೈಜ್ಞಾನಿಕ ಸ್ಥಿರಾಂಕಗಳು',
      'settings.title':'ಸೆಟ್ಟಿಂಗ್ಸ್','settings.theme':'ಥೀಮ್','settings.sound':'ಧ್ವನಿ ಪರಿಣಾಮಗಳು','settings.language':'ಭಾಷೆ','settings.customize':'ಕಸ್ಟಮೈಸೇಶನ್'
    }
  },
  set(lang) {
    this.current = lang;
    const dict = this.t[lang] || this.t.en;
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (dict[key]) el.textContent = dict[key];
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (dict[key]) el.placeholder = dict[key];
    });
    localStorage.setItem('nc_lang', lang);
  }
};

/* ===== SCIENTIFIC CONSTANTS ===== */
const SCI_CONSTANTS = [
  { name: 'Speed of Light', symbol: 'c', value: 299792458, unit: 'm/s' },
  { name: 'Gravitational Constant', symbol: 'G', value: 6.674e-11, unit: 'N⋅m²/kg²' },
  { name: 'Planck Constant', symbol: 'h', value: 6.626e-34, unit: 'J⋅s' },
  { name: 'Boltzmann Constant', symbol: 'k_B', value: 1.381e-23, unit: 'J/K' },
  { name: 'Avogadro Number', symbol: 'N_A', value: 6.022e23, unit: '1/mol' },
  { name: 'Elementary Charge', symbol: 'e', value: 1.602e-19, unit: 'C' },
  { name: 'Electron Mass', symbol: 'm_e', value: 9.109e-31, unit: 'kg' },
  { name: 'Proton Mass', symbol: 'm_p', value: 1.673e-27, unit: 'kg' },
  { name: 'Fine-Structure Constant', symbol: 'α', value: 7.297e-3, unit: '' },
  { name: 'Gas Constant', symbol: 'R', value: 8.314, unit: 'J/(mol⋅K)' },
  { name: 'Stefan-Boltzmann', symbol: 'σ', value: 5.670e-8, unit: 'W/(m²⋅K⁴)' },
  { name: 'Vacuum Permittivity', symbol: 'ε₀', value: 8.854e-12, unit: 'F/m' },
  { name: 'Vacuum Permeability', symbol: 'μ₀', value: 1.257e-6, unit: 'H/m' },
  { name: 'Atomic Mass Unit', symbol: 'u', value: 1.661e-27, unit: 'kg' },
  { name: 'Faraday Constant', symbol: 'F', value: 96485.3, unit: 'C/mol' },
];

/* ===== UNIT CONVERTER ===== */
const UnitData = {
  length: { units: ['m','km','cm','mm','mi','yd','ft','in'], base: [1,1000,0.01,0.001,1609.34,0.9144,0.3048,0.0254] },
  weight: { units: ['kg','g','mg','lb','oz','ton'], base: [1,0.001,1e-6,0.453592,0.0283495,1000] },
  temperature: { units: ['°C','°F','K'], special: true },
  speed: { units: ['m/s','km/h','mph','knot'], base: [1,0.277778,0.44704,0.514444] },
  area: { units: ['m²','km²','ha','acre','ft²'], base: [1,1e6,1e4,4046.86,0.0929] },
  volume: { units: ['L','mL','m³','gal','qt'], base: [1,0.001,1000,3.78541,0.946353] },
  time: { units: ['s','min','hr','day','week','year'], base: [1,60,3600,86400,604800,31557600] },
};

function convertUnit(cat, fromIdx, toIdx, val) {
  const d = UnitData[cat];
  if (cat === 'temperature') {
    // Convert to Celsius first
    let c;
    if (fromIdx === 0) c = val;
    else if (fromIdx === 1) c = (val - 32) * 5/9;
    else c = val - 273.15;
    // Convert from Celsius
    if (toIdx === 0) return c;
    if (toIdx === 1) return c * 9/5 + 32;
    return c + 273.15;
  }
  return val * d.base[fromIdx] / d.base[toIdx];
}
