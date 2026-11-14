# CampusAI — Synthetic Smart-Campus Digital Twin

CampusAI is a full-stack Next.js demonstration of a campus monitoring
interface built around **synthetic IoT data**. It combines a server-sent-event
(SSE) stream, a 3D sensor map, simple anomaly detection and a one-step
temperature trend baseline.

> **Data transparency:** this repository currently simulates all sensor
> readings. It is not connected to real campus hardware, a production IoT
> gateway or a university database. Buildings and coordinates are illustrative.

## Features

- 50 stable synthetic sensor identities across five illustrative building labels.
- SSE endpoint at `/api/sensors`, emitting a fresh reading batch every two seconds.
- Browser-side rolling z-score detector with per-sensor history.
- A simple linear-regression next-value estimate for recent average temperature.
- 3D campus visualization and time-series dashboard.
- Deterministic sensor-generation hooks for repeatable automated tests.

## Run locally

Requires Node.js 18.18 or newer.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The dashboard is available
at `/dashboard` if the root route does not redirect in your environment.

## Quality checks

```bash
npm run typecheck
npm test
npm run build
```

The test suite exercises deterministic sensor generation, stable sensor
identities, historical-only anomaly scoring, injected-label preservation,
per-sensor detector state and regression forecast edge cases. GitHub Actions
runs these checks and a production build on pushes and pull requests.

## Project structure

```text
src/
  app/
    api/sensors/route.ts     # SSE sensor stream
    dashboard/page.tsx       # dashboard UI
  components/Campus3D.tsx     # 3D view
  lib/sensor-simulator.ts    # data generator, detector, forecast baseline
scripts/
  sensor-simulator.test.cjs  # Node built-in tests
docs/
  data-and-validation.md     # data provenance and evaluation notes
.github/workflows/ci.yml
```

## Method notes

The anomaly detector compares a new observation with prior observations from
that sensor, then adds the candidate to its bounded history. This avoids
diluting a spike with the point being tested. A minimum warm-up period and
small standard-deviation floor are configurable.

The forecast is ordinary least-squares linear extrapolation over a short
temperature window. It is a baseline for teaching, not a validated prediction
system. See [docs/data-and-validation.md](docs/data-and-validation.md) for
assumptions, limitations and a research-grade evaluation plan.

## Research extensions

Useful next experiments include labelled anomaly benchmarks, comparisons with
MAD/EWMA/change-point detectors, time-series holdout evaluation, sensor-noise
sensitivity, missing-data handling and drift detection. Report precision,
recall, false-positive rate and detection delay before making model-performance
claims.

## Deployment

This Next.js app is structured for deployment on a Node-compatible host or
Vercel. No hosted deployment has been configured from this repository
connection; the CI workflow validates the build only.

## License

No separate license file is currently provided. Ask before reusing or
redistributing this repository's code.
