# Drive Navigator

Build "DR Navigator — Intelligent Dead Reckoning Monitoring System", a polished professional web dashboard prototype (React + TypeScript + Tailwind, Recharts, MapLibre GL JS with OSM tiles plus an SVG/canvas fallback route visualization if tiles are unavailable — the app must still work offline/without map tiles).

CORE FLOW: Dashboard (pre-populated with demo drives 021–024) → Drives page with table (search/filter/sort) → Upload Drive modal (drag-drop accepting .csv/.json/.txt/.log + "Load Demo Drive" button, phone model/mount/route fields, upload progress + 7-step simulated analysis pipeline: reading sensor data → checking timestamps → evaluating GPS health → classifying motion → estimating dead reckoning → calculating drift → generating report, each step Pending→Processing→Complete) → Drive Analysis page (large route map with GPS path vs dead-reckoning path, GPS blackout segment, clickable event markers for GPS Lost/Recovered, Hard Brake, Pothole, Idle, Phone Knocked; tabs: Overview, GPS, Motion, Drift, Events, Raw Data ~50 rows paginated) → Reports page + Report detail ("Dead Reckoning Evaluation Report" with executive summary, drive info, GPS performance, motion distribution, drift performance, final score/91 PASS, Export as printable HTML) → Models page (3 demo model cards: Speed Estimation v1.2.0 XGBoost 94.2%, Motion Classifier v1.0.3 91.8%, GPS Health Classifier v1.1.0 96.1%) → Settings (theme, units, map style, drift/GPS/blackout thresholds, Reset Demo Data).

Sidebar: Overview, Drives, Analysis, Reports, Models, Settings + System Status / v0.1 Prototype at bottom; collapsible on desktop, drawer on mobile.

Dashboard KPI cards: Total Drives 24 (+4 this week), Average Drift 7.8% (Within target), GPS Reliability 91.4% (Healthy), Model Accuracy 94.2% (Latest model). Large "Latest Drive" card with route map showing GPS path (blue), DR estimated path, and tunnel/blackout segment; legend GPS / Dead Reckoning / Tunnel blackout. Drive status panel (DR-2026-024, Bhopal Test Route, 18m 42s, 8.7 km, GPS 86%, max drift 9.4%, GPS RECOVERED badge). Motion timeline (Driving/Idle/Hard Brake/Pothole/Phone Knocked/GPS Blackout). GPS Health card (availability, satellites 18, avg C/N0 34 dB-Hz, accuracy 4.2 m, status + quality line chart with green/amber/red logic). DR Performance card (drift 7.8%, max error 42 m, avg error 16 m, blackout 2m 14s, recovery 8.2 s + position-error-over-time chart rising during blackout, falling after recovery).

ARCHITECTURE: src/components (Sidebar, Header, StatCard, StatusBadge, DriveMap, GpsHealthCard, MotionTimeline, DriftChart, DriveTable, UploadDriveModal, AnalysisProgress, ReportCard, ModelCard), src/pages (Dashboard, Drives, DriveAnalysis, Reports, ReportDetail, Models, Settings), src/data/demoData.ts (3+ realistic demo drives with route points resembling a real road journey; at least one with a simulated GPS blackout), src/services/analysisEngine.ts (deterministic mock analysis returning duration, distance, gpsAvailability, gpsHealth, motionEvents, drift, maxError, averageError, blackoutPeriods, recoveryTime, route, gpsRoute, drRoute, report), src/types/index.ts (Drive, GPS health, motion event, route point, analysis result, report, model interfaces). Keep the analysis service swappable so a real backend can replace it later without UI changes.

DESIGN: Restrained professional dark navy/charcoal or clean light dashboard, near-white cards, subtle borders, muted secondary text, one primary accent (blue for GPS/nav, green healthy, amber warning, red critical only), moderate rounded corners, subtle shadows, excellent spacing, responsive desktop-first. Include a "System Concept" diagram (GPS + IMU + AI Speed Model + Map Info → Fusion/Analysis → Position Estimate) labeled as concept, not implemented fusion.

INTEGRITY: Label simulated functionality as "Demo / Simulated". Never claim real AI, real-time 200Hz processing, real sensor fusion, real TFLite, or production accuracy. Friendly error states for invalid/empty/unsupported files, missing drive, unavailable map — never raw stack traces. Toasts, skeleton loading, empty states, hover states, breadcrumbs on detail pages, accessible contrast and focus states. No lorem ipsum, no dead buttons, no console errors. Ship everything fully working; demo drives load automatically so the dashboard is never empty on first launch.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/ae68af79-7beb-49d4-8dbd-6b5ad4830086).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
