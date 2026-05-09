/* =============================================
   js/charts.js  —  Chart.js rendering helpers
   ============================================= */

// Registry so we can destroy before re-render
const chartRegistry = {};

function destroyAllCharts() {
  Object.values(chartRegistry).forEach(c => { try { c.destroy(); } catch (_) {} });
  Object.keys(chartRegistry).forEach(k => delete chartRegistry[k]);
}

const GRID_COLOR  = '#1e2d40';
const TICK_COLOR  = '#475569';
const LEGEND_FONT = { size: 10 };
const LEGEND_OPTS = {
  display: true,
  labels: { color: '#94a3b8', font: LEGEND_FONT, boxWidth: 12, padding: 8 }
};

function thinArray(arr, skip) {
  return arr.filter((_, i) => i % skip === 0);
}

/**
 * Render all 4 charts into their canvas elements.
 * Expects IDs: c1, c2, c3, c4 to exist in DOM.
 */
function renderCharts(r) {
  destroyAllCharts();

  const skip   = Math.max(1, Math.floor(r.ts.length / 60));
  const labels = thinArray(r.ts, skip);

  /* ---- Chart 1: Compartment Trajectories ---- */
  chartRegistry.c1 = new Chart(document.getElementById('c1'), {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Susceptible', data: thinArray(r.ss, skip),
          borderColor: '#64748b', backgroundColor: 'transparent',
          borderWidth: 1.5, pointRadius: 0
        },
        {
          label: 'Exposed', data: thinArray(r.es, skip),
          borderColor: '#f59e0b', backgroundColor: 'transparent',
          borderWidth: 1.5, pointRadius: 0
        },
        {
          label: 'Infected', data: thinArray(r.is, skip),
          borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.1)',
          borderWidth: 2, pointRadius: 0, fill: true
        },
        {
          label: 'Recovered', data: thinArray(r.rs, skip),
          borderColor: '#00d4aa', backgroundColor: 'transparent',
          borderWidth: 1.5, pointRadius: 0
        }
      ]
    },
    options: baseLineOptions(LEGEND_OPTS)
  });

  /* ---- Chart 2: Effective Rt ---- */
  const R0     = parseFloat(r.R0);
  const rtData = thinArray(r.Rt || r.ts.map(() => R0), skip);

  chartRegistry.c2 = new Chart(document.getElementById('c2'), {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Rₜ', data: rtData,
          borderColor: '#6366f1', backgroundColor: 'rgba(99,102,241,0.08)',
          borderWidth: 2, pointRadius: 0, fill: true
        },
        {
          label: 'Threshold (1.0)', data: labels.map(() => 1),
          borderColor: '#ef4444', borderWidth: 1,
          borderDash: [5, 5], pointRadius: 0
        }
      ]
    },
    options: {
      ...baseLineOptions(LEGEND_OPTS),
      scales: {
        x: axisStyle({ maxTicksLimit: 8 }),
        y: axisStyle({ min: 0, max: Math.max(3, R0 + 0.5) })
      }
    }
  });

  /* ---- Chart 3: Daily New Infections (bar) ---- */
  const daily = r.is.map((_, i) =>
    i === 0 ? 0 : Math.max(0, (r.rs[i] - r.rs[i - 1]) + (r.is[i] - r.is[i - 1]))
  );
  const dailyThin = thinArray(daily, skip);

  chartRegistry.c3 = new Chart(document.getElementById('c3'), {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'New Cases',
        data: dailyThin,
        backgroundColor: dailyThin.map(v => v > r.peakI * 0.3
          ? 'rgba(239,68,68,0.7)'
          : 'rgba(99,102,241,0.6)'),
        borderWidth: 0
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false, animation: false,
      plugins: { legend: { display: false } },
      scales: {
        x: axisStyle({ maxTicksLimit: 8 }),
        y: axisStyle({})
      }
    }
  });

  /* ---- Chart 4: Stacked Population Distribution ---- */
  const step        = Math.max(1, Math.floor(r.ts.length / 8));
  const stackLabels = r.ts.filter((_, i) => i % step === 0);
  const stackSlice  = arr => arr.filter((_, i) => i % step === 0);

  chartRegistry.c4 = new Chart(document.getElementById('c4'), {
    type: 'bar',
    data: {
      labels: stackLabels,
      datasets: [
        { label: 'Susceptible', data: stackSlice(r.ss), backgroundColor: 'rgba(100,116,139,0.75)', borderWidth: 0 },
        { label: 'Exposed',     data: stackSlice(r.es), backgroundColor: 'rgba(245,158,11,0.75)',  borderWidth: 0 },
        { label: 'Infected',    data: stackSlice(r.is), backgroundColor: 'rgba(239,68,68,0.75)',   borderWidth: 0 },
        { label: 'Recovered',   data: stackSlice(r.rs), backgroundColor: 'rgba(0,212,170,0.75)',   borderWidth: 0 }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false, animation: false,
      plugins: { legend: LEGEND_OPTS },
      scales: {
        x: { stacked: true, ...axisStyle({ maxTicksLimit: 8 }) },
        y: { stacked: true, ...axisStyle({}) }
      }
    }
  });
}

/* ---- Helpers ---- */
function baseLineOptions(legendOpts) {
  return {
    responsive: true, maintainAspectRatio: false, animation: false,
    plugins: { legend: legendOpts },
    scales: {
      x: axisStyle({ maxTicksLimit: 8 }),
      y: axisStyle({})
    }
  };
}

function axisStyle(extra = {}) {
  return {
    ticks: { color: TICK_COLOR, font: { size: 9 }, ...extra },
    grid:  { color: GRID_COLOR },
    ...extra
  };
}
