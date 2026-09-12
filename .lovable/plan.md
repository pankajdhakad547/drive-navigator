# DR Navigator — Intelligent Dead Reckoning Monitoring System

A professional dashboard prototype for reviewing vehicle drives and how well a
dead-reckoning (position-without-GPS) estimate holds up. Everything runs locally
with built-in demo data, clearly labelled **Demo / Simulated** — no real sensors,
no real AI, no backend required.

## Pages

1. **Overview (home)** — four KPI cards (Total Drives 24 +4 this week, Average
   Drift 7.8% within target, GPS Reliability 91.4% healthy, Model Accuracy 94.2%),
   a large "Latest Drive" route map (GPS path in blue, dead-reckoning path,
   highlighted tunnel blackout segment, legend), a drive status panel
   (DR-2026-024, Bhopal Test Route, 18m 42s, 8.7 km, GPS 86%, max drift 9.4%,
   "GPS RECOVERED" badge), a motion timeline, a GPS health card with quality
   chart, a dead-reckoning performance card with position-error-over-time chart,
   and a labelled "System Concept" diagram (GPS + IMU + AI speed model + map info
   → fusion → position estimate).
2. **Drives** — searchable, filterable, sortable table of demo drives 021–024,
   plus the Upload Drive flow.
3. **Upload Drive modal** — drag-and-drop for .csv/.json/.txt/.log, a "Load Demo
   Drive" button, phone model / mount / route fields, upload progress, then a
   7-step simulated analysis pipeline (reading sensor data, checking timestamps,
   evaluating GPS health, classifying motion, estimating dead reckoning,
   calculating drift, generating report) each moving Pending → Processing →
   Complete.
4. **Drive Analysis** — big route map with clickable event markers (GPS Lost /
   Recovered, Hard Brake, Pothole, Idle, Phone Knocked) and tabs: Overview, GPS,
   Motion, Drift, Events, Raw Data (~50 rows, paginated).
5. **Reports + Report detail** — "Dead Reckoning Evaluation Report" with
   executive summary, drive info, GPS performance, motion distribution, drift
   performance, final score 91 PASS, and Export as printable HTML.
6. **Models** — three demo model cards: Speed Estimation v1.2.0 (XGBoost, 94.2%),
   Motion Classifier v1.0.3 (91.8%), GPS Health Classifier v1.1.0 (96.1%).
7. **Settings** — theme, units, map style, drift / GPS / blackout thresholds,
   Reset Demo Data.

Sidebar with Overview, Drives, Analysis, Reports, Models, Settings and a System
Status / v0.1 Prototype footer; collapsible on desktop, slide-in drawer on mobile.

## Design

Restrained professional dark navy/charcoal dashboard with near-white surfaces on
light theme, subtle borders, muted secondary text, one blue accent for
GPS/navigation, and green/amber/red reserved for healthy/warning/critical only.
Moderate rounded corners, soft shadows, generous spacing, desktop-first and
responsive. Toasts, skeletons, empty states, hover and focus states, breadcrumbs
on detail pages.

## Maps

Map tiles via MapLibre GL with OpenStreetMap, with an automatic SVG route
fallback so the route still draws when tiles cannot load or the app is offline.

## Technical notes

- `src/types/index.ts` — Drive, RoutePoint, GpsHealth, MotionEvent,
  AnalysisResult, Report, Model interfaces.
- `src/data/demoData.ts` — four demo drives with realistic road-shaped route
  point sequences; drive 024 includes a tunnel GPS blackout.
- `src/services/analysisEngine.ts` — deterministic mock analysis behind a single
  interface (`analyzeDrive`), returning duration, distance, gpsAvailability,
  gpsHealth, motionEvents, drift, maxError, averageError, blackoutPeriods,
  recoveryTime, route/gpsRoute/drRoute and report, so a real backend can replace
  it without touching UI.
- `src/components/` — Sidebar, Header, StatCard, StatusBadge, DriveMap,
  GpsHealthCard, MotionTimeline, DriftChart, DriveTable, UploadDriveModal,
  AnalysisProgress, ReportCard, ModelCard.
- Routes under `src/routes/` (TanStack Router) rendering page components from
  `src/pages/`; drives/reports persisted in localStorage seeded from demo data so
  the dashboard is never empty.
- Recharts for line/area/distribution charts; semantic design tokens in
  `src/styles.css` only — no hardcoded colour classes.
- Per-route page titles and descriptions.
