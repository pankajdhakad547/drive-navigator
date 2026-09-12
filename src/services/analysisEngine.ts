/**
 * Deterministic mock analysis engine (Demo / Simulated).
 *
 * Everything here is generated locally from a drive seed — there is no real
 * sensor fusion, no real machine learning inference and no server call. The
 * exported `analyzeDrive` signature is the only contract the UI depends on, so
 * a real backend implementation can replace this file without UI changes.
 */

import type {
  AnalysisResult,
  BlackoutPeriod,
  Drive,
  DriveReport,
  ErrorSample,
  GpsHealth,
  GpsSample,
  HealthLevel,
  MotionDistributionSlice,
  MotionEvent,
  RawSensorRow,
  RoutePoint,
} from "@/types";

function mulberry32(seed: number) {
  let a = seed * 1831565813 + 0x6d2b79f5;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface DriveProfile {
  duration: number;
  distance: number;
  gpsAvailability: number;
  drift: number;
  maxError: number;
  averageError: number;
  recoveryTime: number;
  blackouts: BlackoutPeriod[];
  score: number;
  origin: { lat: number; lng: number };
}

const PROFILES: Record<string, DriveProfile> = {
  24: {
    duration: 1122,
    distance: 8.7,
    gpsAvailability: 86,
    drift: 9.4,
    maxError: 42,
    averageError: 16,
    recoveryTime: 8.2,
    blackouts: [{ start: 560, end: 694, reason: "Tunnel / underpass — no sky view" }],
    score: 91,
    origin: { lat: 23.2599, lng: 77.4126 },
  },
  23: {
    duration: 1480,
    distance: 21.4,
    gpsAvailability: 97.2,
    drift: 4.1,
    maxError: 19,
    averageError: 7,
    recoveryTime: 0,
    blackouts: [],
    score: 96,
    origin: { lat: 23.2312, lng: 77.4344 },
  },
  22: {
    duration: 940,
    distance: 5.2,
    gpsAvailability: 78.5,
    drift: 11.6,
    maxError: 58,
    averageError: 24,
    recoveryTime: 12.4,
    blackouts: [{ start: 300, end: 372, reason: "Urban canyon — severe multipath" }],
    score: 74,
    origin: { lat: 23.2668, lng: 77.4008 },
  },
  21: {
    duration: 1260,
    distance: 24.8,
    gpsAvailability: 98.6,
    drift: 3.4,
    maxError: 15,
    averageError: 6,
    recoveryTime: 0,
    blackouts: [],
    score: 97,
    origin: { lat: 23.2875, lng: 77.3372 },
  },
};

function profileFor(drive: Drive): DriveProfile {
  const known = PROFILES[String(drive.seed)];
  if (known) return known;

  const rand = mulberry32(drive.seed || 7);
  const duration = Math.round(720 + rand() * 900);
  const distance = Math.round((duration / 60) * (0.35 + rand() * 0.35) * 10) / 10;
  const hasBlackout = drive.hasBlackout;
  const blackoutStart = Math.round(duration * (0.35 + rand() * 0.2));
  const blackoutLength = Math.round(60 + rand() * 110);
  const blackouts: BlackoutPeriod[] = hasBlackout
    ? [
        {
          start: blackoutStart,
          end: blackoutStart + blackoutLength,
          reason: "Signal loss detected — no usable fix",
        },
      ]
    : [];
  const lost = blackouts.reduce((sum, b) => sum + (b.end - b.start), 0);
  const gpsAvailability = Math.round((1 - lost / duration) * 1000) / 10;
  const drift = Math.round((hasBlackout ? 7 + rand() * 5 : 3 + rand() * 3) * 10) / 10;
  const maxError = Math.round(18 + drift * 3.4);
  const averageError = Math.round(maxError * 0.38);
  const score = Math.max(52, Math.min(98, Math.round(100 - drift * 2.6 - (100 - gpsAvailability) * 0.4)));

  return {
    duration,
    distance,
    gpsAvailability,
    drift,
    maxError,
    averageError,
    recoveryTime: hasBlackout ? Math.round((6 + rand() * 8) * 10) / 10 : 0,
    blackouts,
    score,
    origin: { lat: 23.2599 + (rand() - 0.5) * 0.06, lng: 77.4126 + (rand() - 0.5) * 0.06 },
  };
}

const STEP_SECONDS = 6;

function inBlackout(t: number, blackouts: BlackoutPeriod[]) {
  return blackouts.some((b) => t >= b.start && t <= b.end);
}

function buildRoute(profile: DriveProfile, seed: number): RoutePoint[] {
  const rand = mulberry32(seed + 101);
  const points: RoutePoint[] = [];
  const steps = Math.floor(profile.duration / STEP_SECONDS);

  let lat = profile.origin.lat;
  let lng = profile.origin.lng;
  let heading = rand() * Math.PI * 2;
  let speed = 0;

  // Idle windows keep the route shaped like a real journey with stops.
  const idleWindows: [number, number][] = [
    [Math.round(profile.duration * 0.18), Math.round(profile.duration * 0.18) + 42],
    [Math.round(profile.duration * 0.72), Math.round(profile.duration * 0.72) + 30],
  ];

  const targetSpeed = (profile.distance / (profile.duration / 3600)) * 1.18;

  for (let i = 0; i <= steps; i++) {
    const t = i * STEP_SECONDS;
    const idle = idleWindows.some(([s, e]) => t >= s && t <= e);
    const cruise = idle ? 0 : targetSpeed * (0.72 + rand() * 0.5);
    speed = speed + (cruise - speed) * 0.45;

    // Turns: gentle drift plus occasional junction turns.
    heading += (rand() - 0.5) * 0.08;
    if (i > 0 && i % 11 === 0) heading += (rand() - 0.5) * 1.1;

    const metres = (speed * 1000) / 3600 * STEP_SECONDS;
    const dLat = (metres * Math.cos(heading)) / 111_320;
    const dLng = (metres * Math.sin(heading)) / (111_320 * Math.cos((lat * Math.PI) / 180));
    lat += dLat;
    lng += dLng;

    points.push({
      t,
      lat: Number(lat.toFixed(6)),
      lng: Number(lng.toFixed(6)),
      speed: Math.round(Math.max(0, speed) * 10) / 10,
      accuracy: Math.round((3.2 + rand() * 3) * 10) / 10,
    });
  }
  return points;
}

function buildErrorSeries(profile: DriveProfile, seed: number): ErrorSample[] {
  const rand = mulberry32(seed + 202);
  const baseline = Math.max(2, profile.averageError * 0.35);
  const samples: ErrorSample[] = [];
  const steps = Math.floor(profile.duration / STEP_SECONDS);

  for (let i = 0; i <= steps; i++) {
    const t = i * STEP_SECONDS;
    let error = baseline + rand() * baseline * 0.6;

    for (const b of profile.blackouts) {
      const span = b.end - b.start;
      if (t >= b.start && t <= b.end) {
        const progress = (t - b.start) / span;
        error = baseline + (profile.maxError - baseline) * Math.pow(progress, 0.85);
      } else if (t > b.end && t <= b.end + profile.recoveryTime + 20) {
        const decay = (t - b.end) / (profile.recoveryTime + 20);
        error = baseline + (profile.maxError - baseline) * (1 - decay) * 0.9;
      }
    }
    samples.push({ t, error: Math.round(error * 10) / 10 });
  }
  return samples;
}

function buildDrRoute(
  gpsTruth: RoutePoint[],
  errors: ErrorSample[],
  seed: number,
): RoutePoint[] {
  const rand = mulberry32(seed + 303);
  return gpsTruth.map((p, i) => {
    const error = errors[i]?.error ?? 0;
    const angle = (i * 0.19 + rand() * 0.02) % (Math.PI * 2);
    const dLat = (error * Math.cos(angle)) / 111_320;
    const dLng = (error * Math.sin(angle)) / (111_320 * Math.cos((p.lat * Math.PI) / 180));
    return {
      ...p,
      lat: Number((p.lat + dLat).toFixed(6)),
      lng: Number((p.lng + dLng).toFixed(6)),
    };
  });
}

function buildGpsHealth(profile: DriveProfile, seed: number): GpsHealth {
  const rand = mulberry32(seed + 404);
  const samples: GpsSample[] = [];
  const step = 12;
  for (let t = 0; t <= profile.duration; t += step) {
    const dark = inBlackout(t, profile.blackouts);
    const degraded = profile.blackouts.some(
      (b) => t > b.end && t <= b.end + profile.recoveryTime + 24,
    );
    const cn0 = dark ? 0 : degraded ? 21 + rand() * 6 : 30 + rand() * 9;
    const satellites = dark ? 0 : degraded ? 5 + Math.floor(rand() * 4) : 14 + Math.floor(rand() * 8);
    const accuracy = dark ? 0 : degraded ? 12 + rand() * 9 : 3 + rand() * 3;
    samples.push({
      t,
      cn0: Math.round(cn0 * 10) / 10,
      satellites,
      accuracy: Math.round(accuracy * 10) / 10,
      available: !dark,
    });
  }

  const live = samples.filter((s) => s.available);
  const averageCn0 = live.length
    ? Math.round((live.reduce((a, s) => a + s.cn0, 0) / live.length) * 10) / 10
    : 0;
  const satellites = live.length
    ? Math.round(live.reduce((a, s) => a + s.satellites, 0) / live.length)
    : 0;
  const accuracy = live.length
    ? Math.round((live.reduce((a, s) => a + s.accuracy, 0) / live.length) * 10) / 10
    : 0;

  const status: HealthLevel =
    profile.gpsAvailability >= 92 ? "healthy" : profile.gpsAvailability >= 80 ? "warning" : "critical";

  return {
    availability: profile.gpsAvailability,
    satellites: Math.max(satellites, profile.blackouts.length ? 18 : satellites),
    averageCn0: averageCn0 || 34,
    accuracy: accuracy || 4.2,
    status,
    statusLabel:
      status === "healthy"
        ? "Healthy fix throughout"
        : status === "warning"
          ? "Degraded in places"
          : "Unreliable for long stretches",
    samples,
  };
}

function buildMotionEvents(
  profile: DriveProfile,
  route: RoutePoint[],
  seed: number,
): MotionEvent[] {
  const rand = mulberry32(seed + 505);
  const events: MotionEvent[] = [];
  const at = (t: number) =>
    route.reduce((best, p) => (Math.abs(p.t - t) < Math.abs(best.t - t) ? p : best), route[0]!);

  const push = (
    type: MotionEvent["type"],
    label: string,
    start: number,
    end: number,
    detail: string,
    severity?: HealthLevel,
  ) => {
    const p = at(start);
    events.push({
      id: `${type}-${start}`,
      type,
      label,
      start,
      end,
      lat: p.lat,
      lng: p.lng,
      detail,
      ...(severity ? { severity } : {}),
    });
  };

  // Driving segments split around idle stops.
  const idleA = Math.round(profile.duration * 0.18);
  const idleB = Math.round(profile.duration * 0.72);
  push("driving", "Driving", 0, idleA, "Steady urban cruise, model speed tracking GPS speed closely.");
  push("idle", "Idle", idleA, idleA + 42, "Stationary at a signal — zero-velocity update applied.");
  push("driving", "Driving", idleA + 42, idleB, "Mixed traffic with several junction turns.");
  push("idle", "Idle", idleB, idleB + 30, "Short stop, engine idle vibration only.");
  push("driving", "Driving", idleB + 30, profile.duration, "Final approach to the drop-off point.");

  push(
    "hard_brake",
    "Hard Brake",
    Math.round(profile.duration * 0.29),
    Math.round(profile.duration * 0.29) + 3,
    `Longitudinal deceleration peak ${(4.1 + rand() * 1.4).toFixed(1)} m/s².`,
    "warning",
  );
  push(
    "pothole",
    "Pothole",
    Math.round(profile.duration * 0.46),
    Math.round(profile.duration * 0.46) + 2,
    `Vertical spike ${(7.2 + rand() * 2).toFixed(1)} m/s² on the Z axis.`,
    "warning",
  );
  push(
    "phone_knocked",
    "Phone Knocked",
    Math.round(profile.duration * 0.63),
    Math.round(profile.duration * 0.63) + 4,
    "Mount orientation shifted — heading reference re-aligned after the knock.",
    "warning",
  );

  for (const b of profile.blackouts) {
    push("gps_lost", "GPS Lost", b.start, b.start + 1, b.reason, "critical");
    push("gps_blackout", "GPS Blackout", b.start, b.end, `Dead reckoning only for ${formatDuration(b.end - b.start)}.`, "critical");
    push(
      "gps_recovered",
      "GPS Recovered",
      b.end,
      b.end + 1,
      `Fix re-acquired, position re-converged in ${profile.recoveryTime.toFixed(1)} s.`,
      "healthy",
    );
  }

  return events.sort((a, b) => a.start - b.start);
}

function buildMotionDistribution(
  events: MotionEvent[],
  duration: number,
): MotionDistributionSlice[] {
  const buckets: Record<string, number> = {};
  for (const e of events) {
    if (e.type === "gps_lost" || e.type === "gps_recovered" || e.type === "gps_blackout") continue;
    buckets[e.label] = (buckets[e.label] ?? 0) + Math.max(1, e.end - e.start);
  }
  return Object.entries(buckets)
    .map(([label, seconds]) => ({
      label,
      seconds,
      share: Math.round((seconds / duration) * 1000) / 10,
    }))
    .sort((a, b) => b.seconds - a.seconds);
}

export function formatDuration(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  if (m === 0) return `${rem}s`;
  return `${m}m ${String(rem).padStart(2, "0")}s`;
}

function buildReport(drive: Drive, profile: DriveProfile, health: GpsHealth): DriveReport {
  const verdict: DriveReport["verdict"] =
    profile.score >= 85 ? "PASS" : profile.score >= 70 ? "REVIEW" : "FAIL";

  const findings = [
    `GPS was available for ${profile.gpsAvailability}% of the ${formatDuration(profile.duration)} drive (${health.statusLabel.toLowerCase()}).`,
    `Dead reckoning drift peaked at ${profile.drift}% of distance travelled, with a maximum position error of ${profile.maxError} m.`,
    profile.blackouts.length
      ? `${profile.blackouts.length} blackout period totalling ${formatDuration(
          profile.blackouts.reduce((a, b) => a + (b.end - b.start), 0),
        )}; position re-converged ${profile.recoveryTime.toFixed(1)} s after the fix returned.`
      : "No GPS blackout periods were detected on this drive.",
    `Average position error across the drive was ${profile.averageError} m.`,
  ];

  const recommendations = [
    profile.drift > 8
      ? "Tighten the speed-estimation window during long no-fix stretches to limit along-track drift."
      : "Current drift stays inside the target band — keep the existing estimator settings.",
    health.status === "healthy"
      ? "Fix quality was good; no change needed to the GPS health thresholds."
      : "Review the GPS health thresholds for this mount and phone combination.",
    "Collect more drives with the same mount to confirm these numbers repeat.",
  ];

  return {
    id: `RPT-${drive.code.replace("DR-", "")}`,
    driveId: drive.id,
    title: "Dead Reckoning Evaluation Report",
    createdAt: drive.recordedAt,
    score: profile.score,
    verdict,
    executiveSummary: `${drive.name} (${drive.code}) covered ${profile.distance} km in ${formatDuration(
      profile.duration,
    )} using a ${drive.phoneModel} on a ${drive.mount.toLowerCase()}. The dead-reckoning estimate stayed within ${profile.drift}% of the travelled distance and reached a peak error of ${profile.maxError} m${
      profile.blackouts.length ? " during the GPS blackout" : ""
    }. Overall evaluation score: ${profile.score}/100 — ${verdict}.`,
    findings,
    recommendations,
  };
}

export function analyzeDrive(drive: Drive): AnalysisResult {
  const profile = profileFor(drive);
  const route = buildRoute(profile, drive.seed);
  const errorSeries = buildErrorSeries(profile, drive.seed);
  const drRoute = buildDrRoute(route, errorSeries, drive.seed);
  const gpsRoute = route.filter((p) => !inBlackout(p.t, profile.blackouts));
  const gpsHealth = buildGpsHealth(profile, drive.seed);
  const motionEvents = buildMotionEvents(profile, route, drive.seed);

  return {
    driveId: drive.id,
    duration: profile.duration,
    distance: profile.distance,
    gpsAvailability: profile.gpsAvailability,
    gpsHealth,
    motionEvents,
    motionDistribution: buildMotionDistribution(motionEvents, profile.duration),
    drift: profile.drift,
    maxError: profile.maxError,
    averageError: profile.averageError,
    blackoutPeriods: profile.blackouts,
    recoveryTime: profile.recoveryTime,
    route,
    gpsRoute,
    drRoute,
    errorSeries,
    report: buildReport(drive, profile, gpsHealth),
  };
}

export function buildRawRows(drive: Drive, result: AnalysisResult, count = 50): RawSensorRow[] {
  const rand = mulberry32(drive.seed + 606);
  const started = new Date(drive.recordedAt).getTime();
  const stride = Math.max(1, Math.floor(result.route.length / count));
  const rows: RawSensorRow[] = [];

  for (let i = 0; i < count; i++) {
    const p = result.route[Math.min(result.route.length - 1, i * stride)]!;
    const dark = result.blackoutPeriods.some((b) => p.t >= b.start && p.t <= b.end);
    const sample = result.gpsHealth.samples.reduce((best, s) =>
      Math.abs(s.t - p.t) < Math.abs(best.t - p.t) ? s : best,
    );
    const motionEvent = result.motionEvents.find(
      (e) => p.t >= e.start && p.t <= e.end && e.type !== "gps_blackout",
    );
    rows.push({
      index: i + 1,
      timestamp: new Date(started + p.t * 1000).toISOString().slice(11, 19),
      accelX: Math.round((rand() - 0.5) * 240) / 100,
      accelY: Math.round((rand() - 0.5) * 180) / 100,
      accelZ: Math.round((9.81 + (rand() - 0.5) * 1.6) * 100) / 100,
      gyroZ: Math.round((rand() - 0.5) * 120) / 100,
      speed: p.speed,
      cn0: dark ? 0 : sample.cn0,
      satellites: dark ? 0 : sample.satellites,
      gpsFix: dark ? "none" : sample.satellites > 8 ? "3D" : "2D",
      motion: motionEvent?.label ?? "Driving",
    });
  }
  return rows;
}
