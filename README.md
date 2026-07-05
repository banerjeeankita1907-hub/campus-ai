# CampusAI – Digital Twin for Smart Campus Monitoring

A full‑stack capstone project combining **IoT simulation**, **3D geovisualization**, **on‑device machine learning**, and **predictive analytics** – built entirely with Next.js 

## System Architecture
[Browser] ←── SSE Stream ──→ [Next.js API (/api/sensors)]
│ │
├─ React Three Fiber (3D) Sensor Simulator (50 nodes)
├─ Recharts (time‑series) Realistic diurnal patterns
├─ On‑Device Anomaly Detector
└─ Linear Regression Forecast


## Technical Highlights
- **SSE over WebSockets** for efficient unidirectional streaming.
- **Rolling Z‑score anomaly detection** runs entirely in the browser (threshold 2.5σ, window size 20).
- **Linear regression model** forecasts next temperature value from recent history.
- **No external database** – data is generated ephemerally, mimicking an edge IoT gateway.
- **3D scene** built with Three.js and React Three Fiber, interactive orbit controls.

## How to Deploy (One‑Click)
1. Fork or clone this repository.
2. Go to [Vercel](https://vercel.com) and import this repository.
3. No environment variables, no configuration. Just click **Deploy**.

*Built with Next.js 14, Three.js, Recharts, Tailwind CSS.*
