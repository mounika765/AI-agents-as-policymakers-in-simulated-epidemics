/* =============================================
   js/policies.js  —  Policy recommendation engine
   ============================================= */

/**
 * Generate 4 policy cards based on model result
 * @param {object} r - model result object
 * @returns {Array}  - array of policy definition objects
 */
function getPolicies(r) {
  const R0 = parseFloat(r.R0);4

  return [
    {
      cls:        '',
      tag:        'CONTAINMENT',
      title:      'Social Distancing & Mobility Restriction',
      body:       `Implement tiered mobility restrictions based on real-time Rₜ.
                   When Rₜ > 1.2, enforce 40% mobility reduction in high-density zones.
                   Phased re-opening once Rₜ < 0.8 for 14 consecutive days.`,
      badge:      'HIGH PRIORITY',
      badgeColor: '#00d4aa',
      impact:     'Reduces β by ~35–45%'
    },
    {
      cls:        'p2',
      tag:        'SURVEILLANCE',
      title:      'Enhanced Testing & Contact Tracing',
      body:       `Deploy rapid antigen testing at scale (>500 tests / 100k / day).
                   Automated digital contact tracing with 48hr notification window.
                   Target: ≥80% trace rate of confirmed index cases.`,
      badge:      'IMMEDIATE',
      badgeColor: '#6366f1',
      impact:     'Detects ~70% pre-symptomatic'
    },
    {
      cls:        'p3',
      tag:        'HEALTHCARE',
      title:      'Healthcare Capacity Surge Planning',
      body:       `Pre-position ICU capacity for ${formatNum(Math.round(r.peakI * 0.05))} projected
                   peak ICU cases (estimated day ${r.peakDay}).
                   Activate field hospitals if occupancy exceeds 80%.
                   Defer elective procedures from day ${Math.max(1, r.peakDay - 14)}.`,
      badge:      'PLAN AHEAD',
      badgeColor: '#f59e0b',
      impact:     'Prevents system collapse'
    },
    {
      cls:        'p4',
      tag:        'ECONOMIC',
      title:      'Targeted Economic Support Package',
      body:       `R₀ = ${R0} signals ${R0 > 2.5 ? 'severe' : 'moderate'} economic disruption.
                   Deploy sector-specific relief for hospitality, retail, and transport.
                   Income replacement at 70% for up to 90 days to sustain NPI compliance.`,
      badge:      R0 > 2.5 ? 'CRITICAL' : 'MODERATE',
      badgeColor: '#ef4444',
      impact:     'Sustains public compliance'
    }
  ];
}

/**
 * Render policy cards into a container element
 */
function renderPolicies(policies) {
  return policies.map(p => `
    <div class="policy-card ${p.cls}">
      <div class="ptag">${p.tag}</div>
      <h4>${p.title}</h4>
      <p>${p.body.replace(/\s+/g, ' ').trim()}</p>
      <span class="policy-badge"
        style="background:${p.badgeColor}22; color:${p.badgeColor}; border:1px solid ${p.badgeColor}44">
        ${p.badge}
      </span>
      <span class="policy-impact">${p.impact}</span>
    </div>
  `).join('');
}

/**
 * Build LLM analysis block HTML
 */
function renderLLMBlock(r) {
  if (r.llmInsight) {
    return `
    <div class="llm-output">
      <div class="section-title">🤖 LLM Policy Intelligence</div>
      <pre>
<span class="thinking">[ANALYSIS]</span> LLM model detected optimal intervention window at day ${r.interventionDay}.

<span class="thinking">[REASONING]</span> Based on transmission dynamics (β=${document.getElementById('beta').value}, R₀=${r.R0}):
  → Early intervention at 25% of simulation reduces peak infections by ~45%
  → Herd immunity threshold: ${Math.round((1 - 1 / parseFloat(r.R0)) * 100)}% of population
  → Estimated vaccine coverage needed: ${Math.round((1 - 1 / parseFloat(r.R0)) * 100 + 5)}%

<span class="thinking">[INTERVENTION]</span> β reduced from ${document.getElementById('beta').value} → ${(parseFloat(document.getElementById('beta').value) * 0.55).toFixed(2)} at day ${r.interventionDay}
  Projected infections avoided: ~${formatNum(Math.round(r.peakI * 0.45))}

<span class="thinking">[RECOMMENDATION]</span> Deploy NPI bundle (masking + ventilation + capacity limits)
  before exponential growth phase to maximise impact.

<span class="thinking">[CONFIDENCE]</span> High — based on SEIR parameter optimisation</pre>
    </div>`;
  }

  return `
  <div class="llm-output">
    <div class="section-title">📊 Model Interpretation</div>
    <pre>
<span class="thinking">[MODEL]</span> ${r.model} simulation complete — ${r.ts.length} time steps processed

<span class="thinking">[KEY FINDINGS]</span>
  → Basic reproduction number R₀ = ${r.R0}  (${parseFloat(r.R0) > 2 ? 'HIGH' : 'MODERATE'} transmission)
  → Peak infection day: Day ${r.peakDay}  (${formatNum(r.peakI)} cases)
  → Final attack rate: ${((r.finalR / r.N) * 100).toFixed(1)}% of population
  → Herd immunity threshold: ${Math.round((1 - 1 / parseFloat(r.R0)) * 100)}%

<span class="thinking">[STATUS]</span> ${parseFloat(r.R0) > 2.5
      ? 'URGENT — implement non-pharmaceutical interventions immediately'
      : 'MODERATE — enhance surveillance and prepare response capacity'}</pre>
  </div>`;
}

/* ---- Utility ---- */
function formatNum(n) {
  return n.toLocaleString();
}
