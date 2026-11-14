# Data generation and model validation

## Data source

CampusAI currently produces **synthetic sensor readings** in the Next.js
application. It does not connect to physical IoT hardware, a campus database or
a live university network. The five building labels and map coordinates are
illustrative placeholders. Do not interpret the generated values as a report
about any real campus.

The generator creates 50 stable sensor identities and stable map positions.
Readings vary with the server's local hour and a bounded random component. A
small fraction of readings are deliberately perturbed and labelled as injected
anomalies to make the dashboard demonstrable.

The generator accepts an explicit Date and random function so tests and
experiments can produce repeatable data. For published research, also record
the timezone and random seed used for each run.

## Anomaly detector

For each sensor, the detector maintains a bounded rolling history. A candidate
reading is compared against the **previous** history window; it is added only
after the score is calculated. This avoids contaminating the reference
distribution with the observation being evaluated.

The detector waits for a configurable minimum history, computes a population
mean and standard deviation, applies a small standard-deviation floor for
near-constant synthetic series, and flags values whose absolute z-score exceeds
the configured threshold. Simulator-injected labels are preserved as known
synthetic anomaly labels.

This is a baseline demonstration, not a calibrated anomaly detector. It does
not account for seasonal drift, sensor-specific measurement error, autocorrelation,
missing data, multiple-testing effects or concept drift. A research evaluation
should compare it with robust alternatives (MAD, EWMA, Isolation Forest,
change-point methods), use labelled held-out sequences, and report precision,
recall, false-positive rate and detection delay.

## Temperature forecast

The temperature forecast is ordinary least-squares linear regression over the
recent sequence. It is a one-step extrapolation baseline, not a weather or
building-thermal model. It should be compared with naive persistence, moving
average and seasonal baselines using a chronological holdout split.

## Running checks

```bash
npm install
npm run typecheck
npm test
npm run build
```

The sensor-model tests compile the TypeScript library into a temporary
CommonJS directory and use Node's built-in test runner. They check deterministic
generation, stable sensor identities, historical-only anomaly scoring,
injected-label preservation, per-sensor state isolation and forecast edge cases.
