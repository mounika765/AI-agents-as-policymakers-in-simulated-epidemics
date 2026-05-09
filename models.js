/* =============================================
   js/models.js  —  4 epidemic model functions
   ============================================= */

/**
 * SEIR Model
 * Susceptible → Exposed → Infected → Recovered
 * Includes incubation period (σ)
 */
function runSEIR(N, beta, gamma, sigma, days) {
  let S = N - 1, E = 1, I = 0, R = 0;
  const ts = [], ss = [], es = [], is = [], rs = [];

  for (let t = 0; t < days; t++) {
    const dS = -beta * S * I / N;
    const dE =  beta * S * I / N - sigma * E;
    const dI =  sigma * E - gamma * I;
    const dR =  gamma * I;

    S = Math.max(0, S + dS);
    E = Math.max(0, E + dE);
    I = Math.max(0, I + dI);
    R = Math.max(0, R + dR);

    ts.push(t);
    ss.push(Math.round(S));
    es.push(Math.round(E));
    is.push(Math.round(I));
    rs.push(Math.round(R));
  }

  const peakI   = Math.round(Math.max(...is));
  const peakDay = is.indexOf(Math.max(...is));

  return {
    model:   'SEIR',
    ts, ss, es, is, rs, N,
    peakI, peakDay,
    R0:     (beta / gamma).toFixed(2),
    finalR: Math.round(rs[rs.length - 1]),
    Rt:     is.map((_, i) => parseFloat((beta * ss[i] / N / gamma).toFixed(3)))
  };
}

/**
 * SIR Model
 * Susceptible → Infected → Recovered (no incubation)
 */
function runSIR(N, beta, gamma, days) {
  let S = N - 1, I = 1, R = 0;
  const ts = [], ss = [], is = [], rs = [];

  for (let t = 0; t < days; t++) {
    const dS = -beta * S * I / N;
    const dI =  beta * S * I / N - gamma * I;
    const dR =  gamma * I;

    S = Math.max(0, S + dS);
    I = Math.max(0, I + dI);
    R = Math.max(0, R + dR);

    ts.push(t);
    ss.push(Math.round(S));
    is.push(Math.round(I));
    rs.push(Math.round(R));
  }

  const peakI   = Math.round(Math.max(...is));
  const peakDay = is.indexOf(Math.max(...is));

  return {
    model:   'SIR',
    ts, ss, es: ts.map(() => 0), is, rs, N,
    peakI, peakDay,
    R0:     (beta / gamma).toFixed(2),
    finalR: Math.round(rs[rs.length - 1]),
    Rt:     is.map((_, i) => parseFloat((beta * ss[i] / N / gamma).toFixed(3)))
  };
}

/**
 * LLM-Guided SEIR Model
 * SEIR + AI-detected optimal intervention at 25% mark
 * Simulates policy-driven β reduction
 */
function runLLM(N, beta, gamma, sigma, days) {
  const base           = runSEIR(N, beta, gamma, sigma, days);
  const interventionDay = Math.round(days * 0.25);
  const newBeta        = beta * 0.55;   // LLM recommends 45% reduction

  let S = base.ss[interventionDay];
  let E = base.es[interventionDay];
  let I = base.is[interventionDay];
  let R = base.rs[interventionDay];

  for (let t = interventionDay; t < days; t++) {
    const dS = -newBeta * S * I / N;
    const dE =  newBeta * S * I / N - sigma * E;
    const dI =  sigma * E - gamma * I;
    const dR =  gamma * I;

    S = Math.max(0, S + dS);
    E = Math.max(0, E + dE);
    I = Math.max(0, I + dI);
    R = Math.max(0, R + dR);

    base.ss[t] = Math.round(S);
    base.es[t] = Math.round(E);
    base.is[t] = Math.round(I);
    base.rs[t] = Math.round(R);
  }

  base.model           = 'LLM-Guided SEIR';
  base.peakI           = Math.round(Math.max(...base.is));
  base.peakDay         = base.is.indexOf(Math.max(...base.is));
  base.finalR          = Math.round(base.rs[base.rs.length - 1]);
  base.interventionDay = interventionDay;
  base.llmInsight      = true;

  return base;
}

/**
 * Agent-Based Model
 * Individual agents on a 2D grid; local transmission
 */
function runAgent(N, beta, gamma, days) {
  const SIM_AGENTS = Math.min(N, 5000);   // cap for performance
  const GRID       = 100;

  const agents = Array.from({ length: SIM_AGENTS }, (_, i) => ({
    x:           Math.random() * GRID,
    y:           Math.random() * GRID,
    state:       i < 5 ? 'I' : 'S',
    dayInfected: 0
  }));

  const counts = { S: [], I: [], R: [] };

  for (let day = 0; day < days; day++) {
    const infected = agents.filter(a => a.state === 'I');

    agents.forEach(agent => {
      if (agent.state === 'S') {
        for (const b of infected) {
          const dist = Math.hypot(agent.x - b.x, agent.y - b.y);
          if (dist < 2 && Math.random() < beta * 0.5) {
            agent.state = 'I';
            break;
          }
        }
      } else if (agent.state === 'I') {
        agent.dayInfected++;
        if (agent.dayInfected > Math.round(1 / gamma)) agent.state = 'R';
      }
      // random walk
      agent.x = Math.max(0, Math.min(GRID, agent.x + (Math.random() - 0.5) * 2));
      agent.y = Math.max(0, Math.min(GRID, agent.y + (Math.random() - 0.5) * 2));
    });

    counts.S.push(agents.filter(a => a.state === 'S').length);
    counts.I.push(agents.filter(a => a.state === 'I').length);
    counts.R.push(agents.filter(a => a.state === 'R').length);
  }

  const scale = N / SIM_AGENTS;
  const ts    = Array.from({ length: days }, (_, i) => i);
  const ss    = counts.S.map(v => Math.round(v * scale));
  const is    = counts.I.map(v => Math.round(v * scale));
  const rs    = counts.R.map(v => Math.round(v * scale));

  return {
    model:   'Agent-Based',
    ts, ss, es: ts.map(() => 0), is, rs, N,
    peakI:   Math.round(Math.max(...is)),
    peakDay: is.indexOf(Math.max(...is)),
    R0:      (beta / gamma).toFixed(2),
    finalR:  rs[rs.length - 1],
    Rt:      is.map((_, i) => parseFloat((beta * ss[i] / N / gamma).toFixed(3)))
  };
}
