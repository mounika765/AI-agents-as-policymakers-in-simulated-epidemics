# AI Policy Analysis Dashboard

A browser-based epidemic modelling and policy recommendation dashboard.  
Upload any CSV dataset, choose a model, tune parameters, and get instant analysis.

---

## Project Structure

```
policy-dashboard/
├── index.html          ← Main entry point
├── css/
│   └── style.css       ← All styles
├── js/
│   ├── models.js       ← 4 epidemic model functions
│   ├── charts.js       ← Chart.js rendering helpers
│   ├── policies.js     ← Policy card + LLM block generators
│   └── app.js          ← Main controller (upload, UI, run)
├── data/
│   └── sample_data.csv ← Sample dataset to test with
└── README.md
```

---

## How to Run in VS Code

### Option 1 — Live Server (Recommended)

1. Open the `policy-dashboard/` folder in VS Code
2. Install the **Live Server** extension  
   → Extensions panel (`Ctrl+Shift+X`) → search **"Live Server"** → Install
3. Right-click `index.html` → **"Open with Live Server"**
4. Browser opens at `http://127.0.0.1:5500`

### Option 2 — Python HTTP Server (no extensions needed)

```bash
cd policy-dashboard
python -m http.server 8080
```
Then open `http://localhost:8080` in your browser.

### Option 3 — Node.js HTTP Server

```bash
cd policy-dashboard
npx serve .
```

> ⚠️ **Do not open `index.html` directly as a `file://` URL** — browsers block
> cross-origin JS module loading, which will cause blank charts.

---

## Models

| Model | Description |
|-------|-------------|
| **SEIR** | Susceptible → Exposed → Infected → Recovered. Includes incubation period (σ). |
| **LLM-Guided SEIR** | SEIR with AI-detected optimal intervention at day 25%. Simulates β reduction from policy. |
| **SIR** | Classic 3-compartment model. No incubation period. |
| **Agent-Based** | Individual agents on a 2D grid. Local spatial transmission. |

---

## Parameters

| Parameter | Symbol | Range | Meaning |
|-----------|--------|-------|---------|
| Transmission rate | β | 0.1–1.0 | Probability of spreading per contact |
| Recovery rate | γ | 0.01–0.5 | Fraction recovering per day |
| Incubation rate | σ | 0.01–0.5 | Rate of moving Exposed → Infectious |
| Simulation days | — | 30–365 | Length of simulation |

**R₀ = β / γ** — values above 1 indicate sustained spread.

---

## CSV Format

Any CSV with a header row works. The dashboard uses row count to estimate N.  
Use `data/sample_data.csv` as a starting template.

Suggested columns (not required):
```
date, region, cases, deaths, recovered, population, vaccination_rate
```

---

## Output

Each run produces:
- **4 metric cards** — peak infections, R₀, total affected, susceptible remaining
- **4 charts** — compartment curves, Rₜ over time, daily cases, stacked population
- **4 policy cards** — Containment, Surveillance, Healthcare, Economic
- **Analysis block** — LLM reasoning (LLM model) or model summary (other models)
