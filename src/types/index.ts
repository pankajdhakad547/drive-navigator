// Core domain types for DR Navigator (demo / simulated prototype).

export type DriveStatus = "analyzed" | "processing" | "failed";
export type HealthLevel = "healthy" | "warning" | "critical";

export interface RoutePoint {
  /** seconds from drive start */
  t: number;
  lat: number;
  lng: number;
  /** km/h */
  speed: number;
  /** metres, horizontal accuracy estimate */
  accuracy?: number;
}

export type MotionEventType =
  | "driving"
  | "idle"
  | "hard_brake"
  | "pothole"
  | "phone_knocked"
  | "gps_blackout"
  | "gps_lost"
  | "gps_recovered";

export interface MotionEvent {
  id: string;
  type: MotionEventType;
  label: string;
  /** seconds from drive start */
  start: number;
  /** seconds from drive start */
  end: number;
  lat?: number;
  lng?: number;
  detail?: string;
  severity?: HealthLevel;
}

export interface GpsSample {
  t: number;
  /** carrier-to-noise density, dB-Hz */
  cn0: number;
  satellites: number;
  accuracy: number;
  available: boolean;
}

export interface GpsHealth {
  availability: number;
  satellites: number;
  averageCn0: number;
  accuracy: number;
  status: HealthLevel;
  statusLabel: string;
  samples: GpsSample[];
}

export interface BlackoutPeriod {
  start: number;
  end: number;
  reason: string;
}

export interface ErrorSample {
  t: number;
  /** metres of position error between DR estimate and GPS truth */
  error: number;
}

export interface MotionDistributionSlice {
  label: string;
  seconds: number;
  share: number;
}

export interface DriveReport {
  id: string;
  driveId: string;
  title: string;
  createdAt: string;
  score: number;
  verdict: "PASS" | "REVIEW" | "FAIL";
  executiveSummary: string;
  findings: string[];
  recommendations: string[];
}

export interface AnalysisResult {
  driveId: string;
  /** seconds */
  duration: number;
  /** km */
  distance: number;
  gpsAvailability: number;
  gpsHealth: GpsHealth;
  motionEvents: MotionEvent[];
  motionDistribution: MotionDistributionSlice[];
  /** percent */
  drift: number;
  /** metres */
  maxError: number;
  /** metres */
  averageError: number;
  blackoutPeriods: BlackoutPeriod[];
  /** seconds to re-converge after GPS returns */
  recoveryTime: number;
  route: RoutePoint[];
  gpsRoute: RoutePoint[];
  drRoute: RoutePoint[];
  errorSeries: ErrorSample[];
  report: DriveReport;
}

export interface Drive {
  id: string;
  code: string;
  name: string;
  recordedAt: string;
  phoneModel: string;
  mount: string;
  routeType: string;
  status: DriveStatus;
  source: "demo" | "upload";
  notes?: string;
  /** raw seed used by the deterministic analysis engine */
  seed: number;
  hasBlackout: boolean;
}

export interface ModelInfo {
  id: string;
  name: string;
  version: string;
  algorithm: string;
  accuracy: number;
  task: string;
  trainedOn: string;
  latencyMs: number;
  status: "active" | "candidate";
  metrics: { label: string; value: string }[];
}

export interface RawSensorRow {
  index: number;
  timestamp: string;
  accelX: number;
  accelY: number;
  accelZ: number;
  gyroZ: number;
  speed: number;
  cn0: number;
  satellites: number;
  gpsFix: "3D" | "2D" | "none";
  motion: string;
}

export interface AppSettings {
  theme: "dark" | "light";
  units: "metric" | "imperial";
  mapStyle: "tiles" | "schematic";
  driftThreshold: number;
  gpsThreshold: number;
  blackoutThreshold: number;
}
