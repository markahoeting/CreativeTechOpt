/* =====================================================
   Creative Technology Portfolio Optimizer
   Info-Tech Research Group — Frontend JS
   Wired to Flask /api/calculate endpoint
   ===================================================== */

"use strict";

let currentStep = 0;
let chartRefs   = {};
let lastResults = null;

// ── Navigation ─────────────────────────────────────
function goToStep(n) {
  document.querySelectorAll('.step-panel').forEach((p, i) =>
    p.classList.toggle('hidden', i !== n));
  document.querySelectorAll('.step-tab').forEach((t, i) =>
    t.classList.toggle('active-tab', i === n));
  currentStep = n;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function startOver() {
  if (!confirm('Start a new assessment? All current data will be cleared.')) return;
  location.reload();
}

// ── Slider helpers ─────────────────────────────────
function updateSlider(inputId, displayId) {
  const el = document.getElementById(inputId);
  const dl = document.getElementById(displayId);
  if (el && dl) dl.textContent = el.value + '%';
}

// ── Usage Breakdown (Phase 2 live preview) ─────────
function updateUsageCalc() {
  const total = n('adobe-total');
  if (!total) return;
  const inactive = Math.round(total * s('pct-inactive') / 100);
  const acrobat  = Math.round(total * s('pct-acrobat')  / 100);
  const light    = Math.round(total * s('pct-light')    / 100);
  const power    = Math.round(total * s('pct-power')    / 100);
  const other    = Math.max(0, total - inactive - acrobat - light - power);

  document.getElementById('usage-breakdown').innerHTML = `
    <div class="row"><span style="color:#C0392B;font-weight:700">Inactive (90+ days):</span><span>${fmt(inactive)} licenses</span></div>
    <div class="row"><span style="color:#C47F00;font-weight:700">Acrobat-only users:</span><span>${fmt(acrobat)} licenses</span></div>
    <div class="row"><span style="color:#2676B7;font-weight:700">Light creators:</span><span>${fmt(light)} licenses</span></div>
    <div class="row"><span style="color:#1A7A4A;font-weight:700">Power users:</span><span>${fmt(power)} licenses</span></div>
    <div class="row"><span style="color:#64748b;font-weight:700">Unclassified / other:</span><span>${fmt(other)} licenses</span></div>
    <div class="row" style="border-top:1.5px solid #C8DCF0;padding-top:8px;margin-top:4px">
      <span style="font-weight:800;color:#02122B">Total:</span>
      <span style="font-weight:800;color:#02122B">${fmt(total)} licenses</span>
    </div>
  `;
}

// ── Segmentation summary (Phase 3 live preview) ────
const SEG_CFG = [
  { id:'power',      label:'Power Users',          color:'#C0392B' },
  { id:'light',      label:'Light Designers',       color:'#C47F00' },
  { id:'academic',   label:'Academic Creators',     color:'#1A7A4A' },
  { id:'occasional', label:'Occasional Users',      color:'#475569' },
  { id:'students',   label:'Gen. Students',         color:'#2676B7' },
  { id:'curriculum', label:'Curriculum-Critical',   color:'#6D28D9' },
];

function calcSegTotal() {
  const total = SEG_CFG.reduce((a, s) => a + n(`seg-${s.id}`), 0);
  const badge = document.getElementById('seg-total-badge');
  if (badge) badge.textContent = `Total: ${fmt(total)} users segmented`;
  const grid = document.getElementById('seg-summary-grid');
  if (!grid) return;
  grid.innerHTML = SEG_CFG.map(sg => {
    const v   = n(`seg-${sg.id}`);
    const pct = total > 0 ? Math.round(v / total * 100) : 0;
    return `<div class="seg-sum-item">
      <div class="seg-sum-val" style="color:${sg.color}">${fmt(v)}</div>
      <div class="seg-sum-lbl">${sg.label}</div>
      <div class="seg-sum-pct">${pct}% of total</div>
    </div>`;
  }).join('');
}

// ── Academic programs ──────────────────────────────
let progCount = 0;
function addProgram() {
  progCount++;
  const row = document.createElement('div');
  row.className = 'program-row';
  row.id = `prog-row-${progCount}`;
  row.innerHTML = `
    <input type="text"   placeholder="Program name (e.g., BFA Graphic Design)" id="prog-name-${progCount}" style="flex:2" />
    <select id="prog-risk-${progCount}">
      <option value="critical">Critical — Must have Adobe</option>
      <option value="high">High dependency</option>
      <option value="medium">Medium — could adapt</option>
      <option value="low">Low — could migrate</option>
    </select>
    <input type="number" placeholder="Students" id="prog-n-${progCount}" style="flex:0.7;min-width:70px" min="0" />
    <button class="del-btn" onclick="document.getElementById('prog-row-${progCount}').remove()" title="Remove">
      <i class="fas fa-times"></i>
    </button>`;
  document.getElementById('program-list').appendChild(row);
}

// ── Live scenario calculation (Phase 5) ───────────
function runScenarios() {
  const adobeCost   = n('fin-adobe-cost')    || n('adobe-cost') || 0;
  const supportCost = n('fin-support-cost')  || 0;
  const acrobatCost = n('fin-acrobat-cost')  || 0;
  const totalCur    = adobeCost + supportCost + acrobatCost;
  const totalLic    = n('adobe-total') || 1000;
  const cplc        = adobeCost > 0 ? adobeCost / totalLic : 175;
  const canvaCost   = n('fin-canva-user')    || 0;
  const migCost     = n('fin-migration-cost')|| 0;
  const trainCost   = n('fin-training-cost') || 0;
  const oneTime     = migCost + trainCost;

  const SCS = [
    { id:'a', label:'Scenario A', sub:'Status Quo',              color:'#64748b', border:'#CBD5E1', reduce:0,                canvaPct:0,                rec:false },
    { id:'b', label:'Scenario B', sub:'Light Optimization',      color:'#0891b2', border:'#A5F3FC', reduce:s('sc-b-reduce'), canvaPct:0,                rec:false },
    { id:'c', label:'Scenario C', sub:'Segmented Portfolio',     color:'#2676B7', border:'#74A5CD', reduce:s('sc-c-reduce'), canvaPct:s('sc-c-canva'), rec:true  },
    { id:'d', label:'Scenario D', sub:'Aggressive Rationalization', color:'#C47F00', border:'#FDE68A', reduce:s('sc-d-reduce'), canvaPct:s('sc-d-canva'), rec:false },
    { id:'e', label:'Scenario E', sub:'Academic Exception',      color:'#6D28D9', border:'#DDD6FE', reduce:s('sc-e-reduce'), canvaPct:s('sc-e-reduce'), rec:false },
  ];

  const container = document.getElementById('scenario-results');
  if (!container) return;

  container.innerHTML = SCS.map(sc => {
    const remain    = Math.round(totalLic * (1 - sc.reduce / 100));
    const newAdobe  = remain * cplc;
    const newCanva  = Math.round(totalLic * sc.canvaPct / 100) * canvaCost;
    const newTotal  = newAdobe + newCanva + supportCost;
    const saving    = totalCur - newTotal;
    const yr3       = (saving * 3) - oneTime;
    const roi       = totalCur > 0 ? Math.round(saving / totalCur * 100) : 0;
    const savClass  = saving >= 0 ? 'saving-pos' : 'saving-neg';
    const savPfx    = saving >= 0 ? '+' : '';
    return `<div class="sc-result-card" style="border-color:${sc.border}">
      <div class="sc-result-label" style="color:${sc.color}">${sc.label}</div>
      <div class="sc-result-sublabel">${sc.sub}</div>
      ${sc.rec ? '<div class="rec-chip"><i class="fas fa-star"></i> Recommended</div>' : ''}
      <hr class="sc-divider" style="margin-top:10px">
      <div class="sc-result-row"><span class="lbl">Adobe retained:</span><span class="val">${fmt(remain)}</span></div>
      <div class="sc-result-row"><span class="lbl">Canva seats:</span><span class="val">${fmt(Math.round(totalLic * sc.canvaPct / 100))}</span></div>
      <div class="sc-result-row"><span class="lbl">Annual cost:</span><span class="val">$${fmtK(Math.round(newTotal))}</span></div>
      <hr class="sc-divider">
      <div class="sc-result-row">
        <span class="lbl">Annual savings:</span>
        <span class="sc-saving ${savClass}">${savPfx}$${fmtK(Math.round(saving))}</span>
      </div>
      <div class="sc-result-row">
        <span class="lbl">3-Year net:</span>
        <span class="val ${yr3>=0?'saving-pos':'saving-neg'}">${yr3>=0?'+':''}$${fmtK(Math.round(yr3))}</span>
      </div>
      <div class="sc-result-row"><span class="lbl">Cost reduction:</span><span class="val" style="color:${sc.color}">${roi}%</span></div>
    </div>`;
  }).join('');
}

// ── Generate Full Report (calls Flask API) ─────────
async function generateReport() {
  const payload = collectFormData();
  try {
    const res  = await fetch('/api/calculate', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });
    const data = await res.json();
    if (!data.ok) { alert('Calculation error'); return; }
    lastResults = data;
    renderKPIs(data);
    renderOverviewFindings(data);
    renderSegTable(data);
    renderFinancialDetail(data);
    renderRiskDetail(data);
    renderDeptTable(data);
    renderRoadmap(data);
    renderExecBrief(data);
    setTimeout(() => renderCharts(data), 200);
  } catch (err) {
    console.error(err);
    alert('Could not reach the server. Please check your connection.');
  }
}

// ── Collect all form values ────────────────────────
function collectFormData() {
  return {
    inst_name:       v('inst-name'),
    inst_type:       selText('inst-type'),
    enrollment:      n('enrollment'),
    film_program:    v('film-program'),
    arch_program:    v('arch-program'),
    renewal_date:    v('renewal-date'),
    adobe_total:     n('adobe-total'),
    adobe_cost:      n('adobe-cost'),
    support_cost:    n('fin-support-cost'),
    acrobat_cost:    n('fin-acrobat-cost'),
    pct_inactive:    s('pct-inactive'),
    pct_acrobat:     s('pct-acrobat'),
    pct_light:       s('pct-light'),
    pct_power:       s('pct-power'),
    use_ps:          n('use-ps'),
    use_ai:          n('use-ai'),
    use_id:          n('use-id'),
    use_pr:          n('use-pr'),
    use_ae:          n('use-ae'),
    use_acro:        n('use-acro'),
    use_dim:         n('use-dim'),
    use_express:     n('use-express'),
    seg_power:       n('seg-power'),
    seg_light:       n('seg-light'),
    seg_academic:    n('seg-academic'),
    seg_occasional:  n('seg-occasional'),
    seg_students:    n('seg-students'),
    seg_curriculum:  n('seg-curriculum'),
    accreditation:   v('accreditation'),
    workforce_req:   v('workforce-req'),
    faculty_gov:     v('faculty-gov'),
    digital_literacy:v('digital-literacy'),
    gov_maturity:    v('gov-maturity'),
    rollout_strategy:v('rollout-strategy'),
    canva_user_cost: n('fin-canva-user'),
    migration_cost:  n('fin-migration-cost'),
    training_cost:   n('fin-training-cost'),
    sc_b_reduce:     s('sc-b-reduce'),
    sc_c_reduce:     s('sc-c-reduce'),
    sc_c_canva:      s('sc-c-canva'),
    sc_d_reduce:     s('sc-d-reduce'),
    sc_d_canva:      s('sc-d-canva'),
    sc_e_reduce:     s('sc-e-reduce'),
  };
}

// ── KPI Strip ──────────────────────────────────────
function renderKPIs(d) {
  const k = d.kpis;
  const strip = document.getElementById('kpi-strip');
  if (!strip) return;
  const items = [
    { icon:'fa-id-card',    bg:'#EAF2F9', ic:'#2676B7', label:'Total Adobe Licenses',  val:fmt(k.total_licenses),      sub:'currently assigned'              },
    { icon:'fa-user-slash', bg:'#FEE2E2', ic:'#C0392B', label:'Inactive Licenses',     val:fmt(k.inactive_count),      sub:`${k.inactive_pct}% of total`     },
    { icon:'fa-dollar-sign',bg:'#D1FAE5', ic:'#1A7A4A', label:'Est. Annual Savings',   val:'$'+fmtK(k.annual_saving),  sub:'Scenario C (Recommended)'        },
    { icon:'fa-chart-line', bg:'#EDE9FE', ic:'#6D28D9', label:'3-Year Savings Potential',val:'$'+fmtK(k.yr3_saving),   sub:'before migration costs'          },
  ];
  strip.innerHTML = items.map(it => `
    <div class="kpi-card">
      <div class="kpi-icon" style="background:${it.bg};color:${it.ic}"><i class="fas ${it.icon}"></i></div>
      <div>
        <div class="kpi-label">${it.label}</div>
        <div class="kpi-value">${it.val}</div>
        <div class="kpi-sub">${it.sub}</div>
      </div>
    </div>`).join('');
}

// ── Overview Findings ──────────────────────────────
function renderOverviewFindings(d) {
  const f = d.findings;
  const el = document.getElementById('overview-findings');
  if (!el) return;
  const findings = [
    { icon:'fa-chart-pie',   bg:'#EAF2F9',  ic:'#2676B7',
      msg:`<strong>${f.inst_name}</strong> has <strong>${fmt(f.total_licenses||d.kpis.total_licenses)} Adobe CC licenses</strong> assigned. Based on usage data, approximately <strong>${f.removable_pct}%</strong> (${fmt(f.removable)} licenses) may be candidates for reduction or migration.` },
    { icon:'fa-user-slash',  bg:'#FEF2F2',  ic:'#C0392B',
      msg:`<strong>${fmt(f.inactive_n)} licenses</strong> show no activity in the past 90+ days — representing pure waste. These can be safely removed with zero academic disruption risk.` },
    { icon:'fa-file-pdf',    bg:'#FFFBEB',  ic:'#C47F00',
      msg:`<strong>${fmt(f.acrobat_n)} users</strong> are estimated to use only Acrobat Pro. Migrating these to Acrobat Standard or alternatives could generate additional savings.` },
    { icon:'fa-paint-brush', bg:'#EDE9FE',  ic:'#6D28D9',
      msg:`<strong>${fmt(f.light_n)} light creators</strong> are strong Canva migration candidates. <strong>Canva for Education is often FREE</strong> for qualifying institutions.` },
    { icon:'fa-bolt',        bg:'#F0FDF4',  ic:'#1A7A4A',
      msg:`<strong>${fmt(f.power_n)} power users</strong> require full Adobe Creative Cloud and must be protected. These are your true creative professionals and curriculum-critical users.` },
    { icon:'fa-piggy-bank',  bg:'#EAF2F9',  ic:'#2676B7',
      msg:`Conservative modeling (Scenario C — Segmented Portfolio) projects annual savings of approximately <strong>$${fmt(d.scenarios.c.saving)}</strong> with moderate implementation risk.` },
  ];
  el.innerHTML = `<div style="font-size:15px;font-weight:800;color:#02122B;margin-bottom:12px;display:flex;align-items:center;gap:8px">
    <i class="fas fa-clipboard-list" style="color:#2676B7"></i> Key Assessment Findings
  </div>` + findings.map(f => `
    <div class="finding-card" style="background:${f.bg}">
      <i class="fas ${f.icon}" style="color:${f.ic}"></i>
      <p style="font-size:13px;color:#02122B">${f.msg}</p>
    </div>`).join('');
}

// ── Segmentation Table ─────────────────────────────
function renderSegTable(d) {
  const el = document.getElementById('seg-table');
  if (!el) return;
  const segs = d.segment_meta;
  const vals = d.segments;
  const total = segs.reduce((a,s)=>a+vals[s.id],0) || 1;
  const rows  = segs.map(s => {
    const v   = vals[s.id];
    const pct = Math.round(v/total*100);
    const dept= v(`seg-${s.id}-dept`) || '—';
    return `<tr>
      <td><span style="font-weight:700;color:${s.color}">${s.label}</span></td>
      <td style="text-align:right;font-weight:700">${fmt(v)}</td>
      <td style="text-align:right">${pct}%</td>
      <td style="font-size:12px;color:#64748b">${dept}</td>
      <td><span style="background:#EAF2F9;color:#0A2547;padding:2px 8px;border-radius:99px;font-size:11.5px;font-weight:700">${s.recommend}</span></td>
    </tr>`;
  }).join('');
  el.innerHTML = `
    <div style="font-size:15px;font-weight:800;color:#02122B;margin-bottom:12px;display:flex;align-items:center;gap:8px">
      <i class="fas fa-list" style="color:#2676B7"></i> User Segmentation Detail
    </div>
    <div class="table-wrap">
      <table class="data-table">
        <thead><tr>
          <th>Segment</th><th style="text-align:right">Headcount</th><th style="text-align:right">% of Total</th>
          <th>Departments</th><th>Recommendation</th>
        </tr></thead>
        <tbody>${rows}</tbody>
        <tfoot><tr>
          <td>TOTAL</td><td style="text-align:right">${fmt(total)}</td><td style="text-align:right">100%</td><td></td><td></td>
        </tr></tfoot>
      </table>
    </div>`;
}

// ── Financial Detail ───────────────────────────────
function renderFinancialDetail(d) {
  const el = document.getElementById('financial-detail');
  if (!el) return;
  const f  = d.financials;
  const sc = d.scenarios;
  const meta = d.scenario_meta;
  const rows = meta.map(m => {
    const s  = sc[m.id];
    const sv = s.saving;
    const y3 = s.yr3;
    return `<tr>
      <td style="font-weight:700;color:${m.color}">${m.label} — ${m.sublabel}${m.rec?' ⭐':''}</td>
      <td style="text-align:right">$${fmt(Math.round((s.remain||0) * (f.adobe_cost/d.kpis.total_licenses||175)))}</td>
      <td style="text-align:right">$${fmt(Math.round((s.canva_seats||0) * n('fin-canva-user')))}</td>
      <td style="text-align:right;font-weight:700">$${fmt(s.new_total)}</td>
      <td style="text-align:right;font-weight:800;color:${sv>=0?'#1A7A4A':'#C0392B'}">${sv>=0?'+':''}$${fmt(sv)}</td>
      <td style="text-align:right;font-weight:800;color:${y3>=0?'#1A7A4A':'#C0392B'}">${y3>=0?'+':''}$${fmt(y3)}</td>
    </tr>`;
  }).join('');
  el.innerHTML = `
    <div class="fin-kpi-row">
      <div class="fin-kpi-box"><div class="fin-kpi-lbl">Current Annual Cost</div><div class="fin-kpi-val">$${fmt(f.total_current)}</div></div>
      <div class="fin-kpi-box"><div class="fin-kpi-lbl">Cost Per License</div><div class="fin-kpi-val">$${fmt(f.cost_per_license)}</div></div>
      <div class="fin-kpi-box" style="background:#F0FDF4;border-color:#BBF7D0"><div class="fin-kpi-lbl" style="color:#1A7A4A">One-Time Migration Cost</div><div class="fin-kpi-val" style="color:#1A7A4A">$${fmt(f.one_time_cost)}</div></div>
    </div>
    <div style="font-size:15px;font-weight:800;color:#02122B;margin-bottom:12px;display:flex;align-items:center;gap:8px">
      <i class="fas fa-table" style="color:#2676B7"></i> Scenario Financial Comparison
    </div>
    <div class="table-wrap">
      <table class="data-table">
        <thead><tr>
          <th>Scenario</th><th style="text-align:right">Adobe Cost</th><th style="text-align:right">Canva Cost</th>
          <th style="text-align:right">Total Annual</th><th style="text-align:right">Annual Savings</th><th style="text-align:right">3-Year Net</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <p style="font-size:11.5px;color:#74A5CD;margin-top:8px">* 3-Year Net includes one-time costs of $${fmt(f.one_time_cost)}</p>`;
}

// ── Risk Detail ────────────────────────────────────
function renderRiskDetail(d) {
  const el = document.getElementById('risk-detail');
  if (!el) return;
  const scores = d.risk_scores;
  const overall = d.overall_risk;
  const avgRisk = d.avg_risk;
  const rollout = d.meta.rollout;
  const rolloutLabel = rollout==='pilot' ? 'Pilot with volunteer departments (Recommended)' :
                       rollout==='phased' ? 'Phased by department' :
                       'Institution-wide — increase change management investment';
  const oColor  = overall==='HIGH' ? '#C0392B' : overall==='MEDIUM' ? '#C47F00' : '#1A7A4A';
  const oBg     = overall==='HIGH' ? '#FEF2F2' : overall==='MEDIUM' ? '#FFFBEB' : '#F0FDF4';
  const oBorder = overall==='HIGH' ? '#FECACA' : overall==='MEDIUM' ? '#FDE68A' : '#BBF7D0';

  const riskCards = Object.entries(scores).map(([label, score]) => {
    const lvl  = score>=65 ? 'high' : score>=35 ? 'medium' : 'low';
    const lbl  = lvl.charAt(0).toUpperCase()+lvl.slice(1);
    const descs = {
      'Academic Disruption':   score>=65 ? 'Accreditation bodies explicitly reference Adobe tools. High risk — Adobe must be protected.' : score>=35 ? 'Some accreditation dependencies. Conduct program-by-program review.' : 'No significant accreditation dependency identified.',
      'Faculty Resistance':    score>=65 ? 'Faculty senate must approve changes. Engage governance early and expect formal review.' : score>=35 ? 'Faculty senate consulted periodically. Plan adequate comment period.' : 'Faculty have limited formal input. Communicate proactively.',
      'Workforce Readiness':   score>=65 ? 'Employers explicitly expect Adobe proficiency. Ensure creative programs retain access.' : score>=35 ? 'Some employer expectations exist. Audit job posting requirements by department.' : 'General digital literacy is sufficient.',
      'Creative Program Dependency': 'Based on identified film, architecture, and power user profiles.',
      'Change Management':     score>=65 ? 'Low digital literacy campus-wide. Plan extensive training and phased rollout.' : score>=35 ? 'Standard training and documentation will be needed.' : 'Tech-forward campus. Transition will be smoother with self-service resources.',
      'Governance Maturity':   score>=65 ? 'Governance is immature. Invest in SAM processes before proceeding.' : score>=35 ? 'Moderate governance. Formalize license review processes first.' : 'Strong governance foundation in place.',
    };
    return `<div class="risk-card risk-${lvl}">
      <div class="risk-header">
        <span class="risk-label">${label}</span>
        <span class="risk-score-badge">${lbl.toUpperCase()} (${score}/100)</span>
      </div>
      <div class="risk-track"><div class="risk-fill" style="width:${score}%"></div></div>
      <div class="risk-desc">${descs[label]||''}</div>
    </div>`;
  }).join('');

  el.innerHTML = `
    <div style="background:${oBg};border:1.5px solid ${oBorder};border-radius:13px;padding:18px 20px;margin-bottom:20px;display:flex;gap:14px;align-items:center">
      <i class="fas fa-shield-alt" style="font-size:28px;color:${oColor}"></i>
      <div>
        <div style="font-size:17px;font-weight:800;color:${oColor}">Overall Implementation Risk: ${overall}</div>
        <div style="font-size:13px;color:#3D5A73;margin-top:3px">Composite score: ${avgRisk}/100 &mdash; Recommended rollout: ${rolloutLabel}</div>
      </div>
    </div>
    <div style="font-size:15px;font-weight:800;color:#02122B;margin-bottom:12px;display:flex;align-items:center;gap:8px">
      <i class="fas fa-list-ul" style="color:#2676B7"></i> Risk Factor Analysis
    </div>
    ${riskCards}
    <div style="background:#EAF2F9;border:1.5px solid #74A5CD;border-radius:12px;padding:16px 18px;margin-top:10px">
      <div style="font-weight:700;color:#02122B;margin-bottom:8px;display:flex;align-items:center;gap:7px">
        <i class="fas fa-lightbulb" style="color:#2676B7"></i> Mitigation Recommendations
      </div>
      <ul style="font-size:12.5px;color:#0A2547;padding-left:18px">
        <li style="margin-bottom:5px">Use <strong>actual Adobe Admin Console usage data</strong> — never rely on estimates alone for final decisions</li>
        <li style="margin-bottom:5px">Engage <strong>faculty governance early</strong> — frame as "rightsizing" not "cutting"</li>
        <li style="margin-bottom:5px">Build in <strong>exception pathways</strong> for faculty with legitimate program needs</li>
        <li style="margin-bottom:5px">Pilot with <strong>2–3 volunteer departments</strong> before institution-wide rollout</li>
        <li style="margin-bottom:5px">Position as <strong>"Creative Platform Rationalization"</strong> — a proactive governance initiative</li>
        <li>Preserve <strong>Marketing &amp; Communications</strong> on full Adobe CC without question</li>
      </ul>
    </div>`;
}

// ── Department Table ───────────────────────────────
function renderDeptTable(d) {
  const el = document.getElementById('dept-table');
  if (!el) return;
  const rows = d.dept_recs.map(([name, rec, reason, risk]) => {
    const rColor = risk==='Critical'?'#C0392B':risk==='High'?'#C47F00':risk==='Medium'?'#D97706':'#1A7A4A';
    const rBg    = risk==='Critical'?'#FEE2E2':risk==='High'?'#FEF3C7':risk==='Medium'?'#FFFBEB':'#D1FAE5';
    const recColor = rec.includes('Retain')||rec.includes('Critical') ? '#C0392B' :
                     rec.includes('Canva') ? '#2676B7' : rec.includes('Remove') ? '#475569' : '#C47F00';
    return `<tr>
      <td style="font-weight:700">${name}</td>
      <td style="font-weight:700;color:${recColor}">${rec}</td>
      <td style="font-size:12px;color:#64748b">${reason}</td>
      <td><span style="background:${rBg};color:${rColor};padding:2px 9px;border-radius:99px;font-size:11.5px;font-weight:700">${risk}</span></td>
    </tr>`;
  }).join('');
  el.innerHTML = `
    <div style="font-size:15px;font-weight:800;color:#02122B;margin-bottom:12px;display:flex;align-items:center;gap:8px">
      <i class="fas fa-sitemap" style="color:#2676B7"></i> Department-Level Tooling Recommendations
    </div>
    <div class="table-wrap">
      <table class="data-table">
        <thead><tr><th>Department / Group</th><th>Recommended Tooling</th><th>Rationale</th><th>Disruption Risk</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <p style="font-size:11.5px;color:#74A5CD;margin-top:8px;font-style:italic">Conduct department-specific surveys for final decisions.</p>`;
}

// ── Roadmap ────────────────────────────────────────
function renderRoadmap(d) {
  const el = document.getElementById('roadmap-detail');
  if (!el) return;
  const renewal = d.meta.renewal || '';
  const govMat  = d.meta.gov_mat || 2;

  const phases = [
    { title:'Phase 1 — License Utilization Analysis',    dur:'Weeks 1–4',   icon:'fa-search',         color:'#2676B7',
      desc:'Gather definitive usage data before making any decisions.',
      tasks:['Export Adobe Admin Console reports: per-user last login, app usage, session data','Run usage analytics for all assigned licenses across 12-month period','Identify zero-use and low-use license cohorts','Map licenses to departments and budget centers','Establish baseline cost-per-active-user metric'] },
    { title:'Phase 2 — User Segmentation & Academic Review', dur:'Weeks 3–8', icon:'fa-users',         color:'#74A5CD',
      desc:'Segment users by actual need and protect academic dependencies.',
      tasks:['Conduct targeted departmental surveys (prioritize creative and academic departments)','Review course catalog for Adobe-specific course requirements','Audit accreditation standards for technology references','Interview department chairs in design, media, and communications programs','Identify curriculum-critical vs. convenience licenses', govMat<3?'Establish formal SAM process':'Review existing SAM processes for alignment'] },
    { title:'Phase 3 — Pilot Alternative Tooling',       dur:'Weeks 6–14',  icon:'fa-flask',           color:'#1A7A4A',
      desc:'Run a structured pilot with 2–3 volunteer departments before broad rollout.',
      tasks:['Identify 2–3 volunteer departments (Student Affairs, Advising ideal)','Provision Canva for Education accounts for pilot group','Develop training materials and self-service resources','Run 6–8 week active pilot with structured feedback','Measure support ticket volume, training hours, user satisfaction','Document migration lessons and refine playbook'] },
    { title:'Phase 4 — Governance, Rollout & Contract Renegotiation', dur:`Weeks 12–26${renewal?' (align with '+renewal+' renewal)':''}`, icon:'fa-gavel', color:'#C47F00',
      desc:'Implement institution-wide with clear governance and exception pathways.',
      tasks:['Present findings to CIO, CFO, and Provost leadership','Brief faculty senate with academic protection commitments','Develop formal exception request process for Adobe-needed departments','Implement departmental chargeback/showback model','Negotiate revised Adobe contract based on new license volume','Roll out Canva institution-wide with training and adoption program','Establish annual license utilization review cycle'] },
  ];

  const phColors = ['#2676B7','#0891b2','#1A7A4A','#C47F00'];
  el.innerHTML = `
    <div style="background:#EAF2F9;border:1.5px solid #74A5CD;border-radius:11px;padding:13px 18px;margin-bottom:20px;font-size:13px;color:#02122B">
      <i class="fas fa-calendar-alt" style="color:#2676B7;margin-right:8px"></i>
      <strong>Estimated Timeline: 26 Weeks</strong>${renewal ? ` — Complete before contract renewal: ${renewal}` : ' — Align with Adobe contract renewal cycle.'}
    </div>
    ${phases.map((p,i)=>`
      <div class="roadmap-phase" style="border-left-color:${phColors[i]}">
        <h4>
          <i class="fas ${p.icon}" style="color:${phColors[i]}"></i>
          ${p.title}
          <span class="roadmap-dur">${p.dur}</span>
        </h4>
        <p>${p.desc}</p>
        <ul>${p.tasks.map(t=>`<li>${t}</li>`).join('')}</ul>
      </div>`).join('')}
    <div style="background:#EAF2F9;border:1.5px solid #74A5CD;border-radius:12px;padding:16px 18px;margin-top:8px">
      <div style="font-weight:700;color:#02122B;margin-bottom:8px;display:flex;align-items:center;gap:7px">
        <i class="fas fa-bullhorn" style="color:#2676B7"></i> Recommended CIO Messaging Framework
      </div>
      <blockquote>"We are launching a <em>Creative Platform Rationalization Initiative</em> to align our digital creativity tools with actual institutional needs. This initiative will preserve full Adobe Creative Cloud capabilities where they create genuine educational and institutional value, while reducing overspending on lightly used premium licensing. All academic program needs will be fully protected."</blockquote>
    </div>`;
}

// ── Executive Brief ────────────────────────────────
function renderExecBrief(d) {
  const el = document.getElementById('exec-brief');
  if (!el) return;
  const f  = d.findings;
  const k  = d.kpis;
  const sc = d.scenarios.c;
  const fin = d.financials;
  const instName = f.inst_name || 'Your Institution';
  const instType = v('inst-type') ? selText('inst-type') : '';
  const today    = d.meta.today;

  el.innerHTML = `
    <div class="exec-wrap">
      <div class="exec-head">
        <div class="exec-kicker">CIO Executive Briefing &mdash; Confidential</div>
        <div class="exec-doc-title">Creative Technology Portfolio Optimization</div>
        <div class="exec-meta">${instName}${instType?' &mdash; '+instType:''} &mdash; Prepared ${today}</div>
      </div>
      <div class="exec-body">
        <div class="exec-section">
          <h4>Executive Summary</h4>
          <p>${instName} currently maintains <strong>${fmt(k.total_licenses)} Adobe Creative Cloud licenses</strong> at an estimated annual cost of <strong>$${fmt(fin.adobe_cost)}</strong>. A preliminary usage analysis indicates that <strong>${f.removable_pct}%</strong> of assigned licenses (${fmt(f.removable)} licenses) may be candidates for reduction or migration to lower-cost alternatives, including Canva for Education. Conservative financial modeling projects potential annual savings of approximately <strong>$${fmt(sc.saving)}</strong> without materially impacting academic programs or institutional creative capacity.</p>
        </div>
        <div class="exec-section">
          <h4>Strategic Framing</h4>
          <p>This initiative is recommended to be framed as a <strong>Creative Technology Portfolio Rationalization</strong> — not a software reduction exercise. The goal is to:</p>
          <ul>
            <li>Align creative tooling with actual institutional usage patterns</li>
            <li>Preserve full Adobe capabilities where they create genuine institutional value</li>
            <li>Expand access to collaborative, user-friendly tools (Canva) for the broader campus community</li>
            <li>Establish sustainable governance for creative technology investment</li>
          </ul>
        </div>
        <div class="exec-section">
          <h4>Financial Opportunity</h4>
          <div class="exec-kpi-row">
            <div class="exec-kpi-box" style="background:#F7FAFE;border:1.5px solid #D0E5F3">
              <div class="exec-kpi-lbl" style="color:#64748b">Current Annual Spend</div>
              <div class="exec-kpi-val" style="color:#02122B">$${fmt(fin.adobe_cost)}</div>
            </div>
            <div class="exec-kpi-box" style="background:#F0FDF4;border:1.5px solid #BBF7D0">
              <div class="exec-kpi-lbl" style="color:#1A7A4A">Projected Annual Savings</div>
              <div class="exec-kpi-val" style="color:#1A7A4A">$${fmt(sc.saving)}</div>
            </div>
            <div class="exec-kpi-box" style="background:#EAF2F9;border:1.5px solid #74A5CD">
              <div class="exec-kpi-lbl" style="color:#2676B7">3-Year Savings Potential</div>
              <div class="exec-kpi-val" style="color:#2676B7">$${fmt(sc.saving*3)}</div>
            </div>
          </div>
        </div>
        <div class="exec-section">
          <h4>Academic Protections</h4>
          <p>The following safeguards are recommended to protect academic interests:</p>
          <ul>
            <li><strong>Design, Media &amp; Film programs</strong> will retain full Adobe Creative Cloud</li>
            <li><strong>Marketing &amp; Communications</strong> will retain full Adobe Creative Cloud</li>
            <li>A formal <strong>exception request pathway</strong> will be established for faculty with legitimate program needs</li>
            <li><strong>Faculty governance</strong> will be engaged before any license changes are made</li>
            <li>Academic chair input will be required for all department-level migrations</li>
          </ul>
        </div>
        <div class="exec-section">
          <h4>Recommended Next Steps</h4>
          <ol>
            <li>Export definitive Adobe Admin Console usage data for 12-month period</li>
            <li>Present analysis to CIO, CFO, and Provost leadership team</li>
            <li>Engage faculty governance with academic protection commitments</li>
            <li>Launch 2–3 department pilot with Canva (Student Affairs recommended)</li>
            <li>Return to leadership with pilot results and refined financial model</li>
            <li>Negotiate revised Adobe contract ahead of renewal</li>
          </ol>
        </div>
        <div class="disclaimer">
          <i class="fas fa-exclamation-triangle"></i>
          <p>All financial projections are estimates based on data entered and industry benchmarks. Final decisions should be based on definitive Adobe Admin Console data, formal departmental surveys, and legal review of contract terms. This tool is intended for strategic planning purposes only.</p>
        </div>
      </div>
    </div>`;
}

// ── Charts ─────────────────────────────────────────
function renderCharts(d) {
  if (!d) d = lastResults;
  if (!d) return;

  Object.values(chartRefs).forEach(c => { try { c.destroy(); } catch(e){} });
  chartRefs = {};

  const ub  = d.usage_breakdown;
  const fin = d.financials;
  const sc  = d.scenarios;
  const totalLic = d.kpis.total_licenses;
  const totalCur = fin.total_current;

  const scLabels  = d.scenario_meta.map(m => m.id.toUpperCase() + ': ' + m.sublabel);
  const scColors  = d.scenario_meta.map(m => m.color);
  const scTotals  = d.scenario_meta.map(m => sc[m.id].new_total);
  const scSavings = d.scenario_meta.map(m => Math.max(0, sc[m.id].saving));

  const BLUE  = '#2676B7';
  const LIGHT = '#74A5CD';
  const NAVY  = '#02122B';
  const gridColor = '#E2EDF7';

  // ─ 1. Utilization Donut ─
  const ctxU = document.getElementById('chart-utilization');
  if (ctxU) {
    chartRefs.util = new Chart(ctxU, {
      type: 'doughnut',
      data: {
        labels: ['Inactive (90+ days)','Acrobat-Only','Light Creators','Power Users','Other'],
        datasets: [{ data: [ub.inactive,ub.acrobat,ub.light,ub.power,ub.other],
          backgroundColor:['#C0392B','#C47F00','#2676B7','#1A7A4A','#94A3B8'],
          borderWidth:2, borderColor:'#fff' }]
      },
      options:{ responsive:true, maintainAspectRatio:false,
        plugins:{ legend:{ position:'right', labels:{ font:{size:12}, padding:12 } } } }
    });
  }

  // ─ 2. Scenario Cost Bar ─
  const ctxS = document.getElementById('chart-scenarios');
  if (ctxS) {
    chartRefs.scenarios = new Chart(ctxS, {
      type: 'bar',
      data: {
        labels: scLabels,
        datasets: [{ label:'Annual Cost ($)', data: scTotals,
          backgroundColor: scColors.map(c=>c+'33'),
          borderColor: scColors,
          borderWidth:2, borderRadius:7 }]
      },
      options:{ responsive:true, maintainAspectRatio:false,
        plugins:{ legend:{ display:false } },
        scales:{ y:{ ticks:{ callback: v=>'$'+fmtK(v) }, grid:{ color:gridColor } } }
      }
    });
  }

  // ─ 3. 3-Year Projection Line ─
  const ctxP = document.getElementById('chart-projection');
  if (ctxP) {
    const optCost = sc['c'].new_total;
    const migCostVal = fin.one_time_cost;
    chartRefs.proj = new Chart(ctxP, {
      type: 'line',
      data: {
        labels: ['Year 1','Year 2','Year 3'],
        datasets: [
          { label:'Status Quo (4% YoY increase)',
            data:[totalCur, totalCur*1.04, totalCur*1.082],
            borderColor:'#C0392B', backgroundColor:'rgba(192,57,43,0.07)',
            fill:true, tension:0.35, pointRadius:5, borderWidth:2.5 },
          { label:'Optimized Portfolio (Scenario C)',
            data:[optCost+migCostVal, optCost, optCost*0.98],
            borderColor:BLUE, backgroundColor:'rgba(38,118,183,0.07)',
            fill:true, tension:0.35, pointRadius:5, borderWidth:2.5 },
        ]
      },
      options:{ responsive:true, maintainAspectRatio:false,
        plugins:{ legend:{ position:'bottom', labels:{ font:{size:12} } } },
        scales:{ y:{ ticks:{ callback: v=>'$'+fmtK(v) }, grid:{ color:gridColor } } }
      }
    });
  }

  // ─ 4. Seg Pie ─
  const ctxSP = document.getElementById('chart-seg-pie');
  if (ctxSP) {
    const segVals   = d.segment_meta.map(s => d.segments[s.id]);
    const segLabels = d.segment_meta.map(s => s.label);
    const segColors = d.segment_meta.map(s => s.color);
    chartRefs.segPie = new Chart(ctxSP, {
      type: 'pie',
      data: { labels:segLabels, datasets:[{ data:segVals, backgroundColor:segColors, borderWidth:2, borderColor:'#fff' }] },
      options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ position:'right', labels:{ font:{size:11}, padding:10 } } } }
    });
  }

  // ─ 5. App Usage Horizontal Bar ─
  const ctxA = document.getElementById('chart-app-usage');
  if (ctxA) {
    const apps   = Object.keys(d.app_usage);
    const vals   = Object.values(d.app_usage);
    const colors = ['#1D4ED8','#C2410C','#B91C1C','#6D28D9','#9D174D','#991B1B','#0F766E','#2676B7'];
    chartRefs.appUsage = new Chart(ctxA, {
      type: 'bar',
      data: { labels:apps, datasets:[{ label:'% of licensed users', data:vals, backgroundColor:colors, borderRadius:5 }] },
      options:{ indexAxis:'y', responsive:true, maintainAspectRatio:false,
        plugins:{ legend:{ display:false } },
        scales:{ x:{ max:100, ticks:{ callback: v=>v+'%' }, grid:{ color:gridColor } } }
      }
    });
  }

  // ─ 6. Savings Bar ─
  const ctxSv = document.getElementById('chart-savings');
  if (ctxSv) {
    chartRefs.savings = new Chart(ctxSv, {
      type: 'bar',
      data: {
        labels: scLabels,
        datasets:[{ label:'Annual Savings ($)', data:scSavings,
          backgroundColor: scSavings.map(v=>v>0?'rgba(26,122,74,0.75)':'rgba(192,57,43,0.75)'),
          borderColor:     scSavings.map(v=>v>0?'#1A7A4A':'#C0392B'),
          borderWidth:1.5, borderRadius:7 }]
      },
      options:{ responsive:true, maintainAspectRatio:false,
        plugins:{ legend:{ display:false } },
        scales:{ y:{ ticks:{ callback: v=>'$'+fmtK(v) }, grid:{ color:gridColor } } }
      }
    });
  }
}

// ── Report tab navigation ──────────────────────────
function showReport(section, btn) {
  document.querySelectorAll('.rsection').forEach(s=>s.classList.add('hidden'));
  document.querySelectorAll('.rtab').forEach(t=>t.classList.remove('active-rtab'));
  const el = document.getElementById('report-'+section);
  if (el) el.classList.remove('hidden');
  if (btn) btn.classList.add('active-rtab');
}

// ── Helper: show report tab ────────────────────────
// (called from inline onclick — needs global scope)
window.showReport = showReport;

// ── Micro helpers ──────────────────────────────────
const n   = id => { const el=document.getElementById(id); return el?parseFloat(el.value)||0:0; };
const v   = id => { const el=document.getElementById(id); return el?el.value:''; };
const s   = id => { const el=document.getElementById(id); return el?parseFloat(el.value)||0:0; };
const selText = id => { const el=document.getElementById(id); return el&&el.selectedIndex>=0?el.options[el.selectedIndex].text:''; };
const fmt  = val => Math.round(val||0).toLocaleString('en-US');
const fmtK = val => {
  const v = Math.round(val||0);
  if (v>=1000000) return (v/1000000).toFixed(1)+'M';
  if (v>=1000)    return (v/1000).toFixed(0)+'K';
  return v.toLocaleString('en-US');
};

// ── Init ───────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Default program row
  addProgram();

  // Init all slider displays
  const sliderMap = {
    'pct-inactive':'val-inactive','pct-acrobat':'val-acrobat',
    'pct-light':'val-light','pct-power':'val-power',
    'sc-b-reduce':'sc-b-v','sc-c-reduce':'sc-c-v','sc-c-canva':'sc-c-cv',
    'sc-d-reduce':'sc-d-v','sc-d-canva':'sc-d-cv','sc-e-reduce':'sc-e-v',
  };
  Object.entries(sliderMap).forEach(([input, display]) => {
    const el = document.getElementById(input);
    const dl = document.getElementById(display);
    if (el && dl) dl.textContent = el.value + '%';
  });

  calcSegTotal();
});
