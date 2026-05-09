/* =============================================
   js/app.js  —  Main controller
   Wires: CSV upload · model selection · run · render
   ============================================= */

/* ---- State ---- */
let csvData     = null;
let activeModel = 'seir';

/* ---- Init ---- */
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('ts').textContent = new Date().toLocaleString();
  initUpload();
  initModelButtons();
  initSliders();
  document.getElementById('runBtn').addEventListener('click', runAnalysis);
});

/* =============================================
   CSV UPLOAD
   ============================================= */
function initUpload() {
  const input    = document.getElementById('csvInput');
  const dropzone = document.getElementById('dropzone');

  // click to open file dialog
  dropzone.addEventListener('click', () => input.click());

  // file chosen via dialog
  input.addEventListener('change', e => {
    const file = e.target.files[0];
    if (file) loadCSV(file);
  });

  // drag & drop
  dropzone.addEventListener('dragover', e => {
    e.preventDefault();
    dropzone.classList.add('dragover');
  });
  dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
  dropzone.addEventListener('drop', e => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.csv')) loadCSV(file);
  });
}

function loadCSV(file) {
  document.getElementById('fileName').textContent = file.name;
  document.getElementById('fileInfo').textContent  = 'Parsing…';

  Papa.parse(file, {
    header: true, skipEmptyLines: true,
    complete(result) {
      csvData = result.data;
      document.getElementById('fileInfo').textContent =
        `${result.data.length} rows × ${result.meta.fields.length} cols`;
    },
    error(err) {
      document.getElementById('fileInfo').textContent = 'Parse error: ' + err.message;
    }
  });
}

/* =============================================
   MODEL SELECTION
   ============================================= */
function initModelButtons() {
  document.querySelectorAll('.model-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.model-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeModel = btn.dataset.model;
    });
  });
}

/* =============================================
   SLIDERS
   ============================================= */
function initSliders() {
  const sliders = [
    { id: 'beta',  valId: 'betaV',  decimals: 2 },
    { id: 'gamma', valId: 'gammaV', decimals: 2 },
    { id: 'sigma', valId: 'sigmaV', decimals: 2 },
    { id: 'days',  valId: 'daysV',  decimals: 0 }
  ];
  sliders.forEach(({ id, valId, decimals }) => {
    const el  = document.getElementById(id);
    const out = document.getElementById(valId);
    el.addEventListener('input', () => {
      out.textContent = decimals > 0
        ? parseFloat(el.value).toFixed(decimals)
        : el.value;
    });
  });
}

/* =============================================
   RUN ANALYSIS
   ============================================= */
function runAnalysis() {
  const area = document.getElementById('contentArea');

  // Show loading state
  area.innerHTML = `
    <div class="empty-state">
      <div class="loader">
        <div class="spinner"></div>
        Running ${activeModel.toUpperCase()} model…
      </div>
    </div>`;

  // Small timeout so the loading UI paints before heavy computation
  setTimeout(() => {
    const beta  = parseFloat(document.getElementById('beta').value);
    const gamma = parseFloat(document.getElementById('gamma').value);
    const sigma = parseFloat(document.getElementById('sigma').value);
    const days  = parseInt(document.getElementById('days').value, 10);
    const N     = csvData ? csvData.length * 100 : 1_000_000;

    let result;
    switch (activeModel) {
      case 'seir':  result = runSEIR(N, beta, gamma, sigma, days); break;
      case 'sir':   result = runSIR(N, beta, gamma, days);         break;
      case 'llm':   result = runLLM(N, beta, gamma, sigma, days);  break;
      case 'agent': result = runAgent(N, beta, gamma, days);       break;
      default:      result = runSEIR(N, beta, gamma, sigma, days);
    }

    renderDashboard(area, result);
  }, 400);
}

/* =============================================
   RENDER DASHBOARD
   ============================================= */
function renderDashboard(area, r) {
  const pct         = v => ((v / r.N) * 100).toFixed(1);
  const modelColors = {
    'SEIR': '#00d4aa', 'LLM-Guided SEIR': '#6366f1',
    'SIR':  '#f59e0b', 'Agent-Based':     '#ef4444'
  };
  const modelColor = modelColors[r.model] || '#00d4aa';
  const policies   = getPolicies(r);

  area.innerHTML = `
    <!-- Status Bar -->
    <div class="status-bar">
      <div class="status-dot green pulse"></div>
      <span style="font-family:var(--mono);font-size:0.78rem;color:var(--accent)">${r.model}</span>
      <span style="color:var(--muted)">|</span>
      <span style="font-size:0.78rem">
        N = ${r.N.toLocaleString()} · Days = ${r.ts.length} · R₀ = ${r.R0}
      </span>
      ${csvData ? `<span style="color:var(--muted)">|</span>
        <span style="font-size:0.78rem;color:var(--accent)">📄 ${csvData.length} rows loaded</span>` : ''}
    </div>

    <!-- Metric Cards -->
    <div class="metrics-grid">
      <div class="metric-card">
        <div class="label">PEAK INFECTIONS</div>
        <div class="value" style="color:${modelColor}">${r.peakI.toLocaleString()}</div>
        <div class="sub">Day ${r.peakDay} · ${pct(r.peakI)}% of N</div>
      </div>
      <div class="metric-card">
        <div class="label">BASIC R₀</div>
        <div class="value" style="color:${parseFloat(r.R0) > 2 ? '#ef4444' : '#f59e0b'}">${r.R0}</div>
        <div class="sub">${parseFloat(r.R0) > 2.5 ? 'High risk' : 'Moderate risk'}</div>
      </div>
      <div class="metric-card">
        <div class="label">TOTAL AFFECTED</div>
        <div class="value" style="color:#6366f1">${r.finalR.toLocaleString()}</div>
        <div class="sub">${pct(r.finalR)}% final attack rate</div>
      </div>
      <div class="metric-card">
        <div class="label">SUSCEPTIBLE REMAINING</div>
        <div class="value" style="color:#64748b">${r.ss[r.ss.length - 1].toLocaleString()}</div>
        <div class="sub">${pct(r.ss[r.ss.length - 1])}% of population</div>
      </div>
    </div>

    <!-- Charts -->
    <div>
      <div class="section-title">Epidemic Curves & Dynamics</div>
      <div class="charts-grid">
        <div class="chart-card">
          <h3>Compartment Trajectories</h3>
          <div class="chart-wrap"><canvas id="c1" role="img" aria-label="Compartment trajectories over time"></canvas></div>
        </div>
        <div class="chart-card">
          <h3>Effective Reproduction Number (Rₜ)</h3>
          <div class="chart-wrap"><canvas id="c2" role="img" aria-label="Effective reproduction number over time"></canvas></div>
        </div>
        <div class="chart-card">
          <h3>Daily New Infections</h3>
          <div class="chart-wrap"><canvas id="c3" role="img" aria-label="Daily new infections bar chart"></canvas></div>
        </div>
        <div class="chart-card">
          <h3>Population Distribution Over Time</h3>
          <div class="chart-wrap"><canvas id="c4" role="img" aria-label="Stacked population distribution chart"></canvas></div>
        </div>
      </div>
    </div>

    <!-- Policies -->
    <div>
      <div class="section-title">Policy Recommendations</div>
      <div class="policies-grid">
        ${renderPolicies(policies)}
      </div>
    </div>

    <!-- LLM / Model Analysis -->
    ${renderLLMBlock(r)}
  `;

  // Draw charts after DOM is ready
  renderCharts(r);
}
