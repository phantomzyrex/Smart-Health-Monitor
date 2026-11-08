import { AlertLog, HeartRateStatus, SpO2Status, TemperatureStatus, ThresholdConfig, VitalReading } from '../types/vitals';

export const DEFAULT_THRESHOLDS: ThresholdConfig = {
  tempHigh: 37.8,     // 100.0 °F Fever
  tempLow: 35.5,      // 95.9 °F Hypothermia
  hrHigh: 100,        // Tachycardia (>100 BPM)
  hrLow: 60,          // Bradycardia (<60 BPM)
  spO2Low: 95,        // Mild hypoxemia (<95%)
  spO2Critical: 90,   // Critical hypoxia (<90%)
  audioAlarmEnabled: true,
};

export function cToF(c: number): number {
  return Number(((c * 9) / 5 + 32).toFixed(1));
}

export function fToC(f: number): number {
  return Number((((f - 32) * 5) / 9).toFixed(1));
}

export function evaluateTemperature(tempC: number, thresholds: ThresholdConfig = DEFAULT_THRESHOLDS): TemperatureStatus {
  if (tempC >= thresholds.tempHigh) return 'fever';
  if (tempC <= thresholds.tempLow) return 'hypothermia';
  return 'normal';
}

export function evaluateHeartRate(bpm: number, thresholds: ThresholdConfig = DEFAULT_THRESHOLDS): HeartRateStatus {
  if (bpm >= thresholds.hrHigh) return 'tachycardia';
  if (bpm < thresholds.hrLow) return 'bradycardia';
  return 'normal';
}

export function evaluateSpO2(spO2: number, thresholds: ThresholdConfig = DEFAULT_THRESHOLDS): SpO2Status {
  if (spO2 <= thresholds.spO2Critical) return 'critical';
  if (spO2 < thresholds.spO2Low) return 'hypoxemia';
  return 'normal';
}

export function createVitalReading(params: {
  id?: string;
  deviceId?: string;
  temperatureC: number;
  heartRate: number;
  spO2: number;
  source?: 'esp32' | 'manual' | 'simulator';
  timestamp?: string;
  thresholds?: ThresholdConfig;
}): VitalReading {
  const thresholds = params.thresholds || DEFAULT_THRESHOLDS;
  const tempStatus = evaluateTemperature(params.temperatureC, thresholds);
  const hrStatus = evaluateHeartRate(params.heartRate, thresholds);
  const spO2Status = evaluateSpO2(params.spO2, thresholds);
  const isAbnormal = tempStatus !== 'normal' || hrStatus !== 'normal' || spO2Status !== 'normal';

  const ts = params.timestamp || new Date().toISOString();
  const id = params.id || `vital_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  return {
    id,
    deviceId: params.deviceId || 'ESP32-VITALS-01',
    temperatureC: Number(params.temperatureC.toFixed(1)),
    temperatureF: cToF(params.temperatureC),
    heartRate: Math.round(params.heartRate),
    spO2: Math.min(100, Math.max(0, Math.round(params.spO2))),
    tempStatus,
    hrStatus,
    spO2Status,
    isAbnormal,
    source: params.source || 'esp32',
    timestamp: ts,
  };
}

export function detectAlerts(reading: VitalReading, thresholds: ThresholdConfig = DEFAULT_THRESHOLDS): AlertLog[] {
  const alerts: AlertLog[] = [];
  const baseId = `alert_${Date.now()}`;

  // Temperature check
  if (reading.tempStatus === 'fever') {
    alerts.push({
      id: `${baseId}_temp`,
      deviceId: reading.deviceId,
      alertType: 'FEVER',
      message: `High Body Temp detected: ${reading.temperatureC.toFixed(1)}°C (${reading.temperatureF.toFixed(1)}°F) exceeds limit of ${thresholds.tempHigh}°C`,
      severity: reading.temperatureC >= thresholds.tempHigh + 1.5 ? 'critical' : 'warning',
      value: reading.temperatureC,
      threshold: thresholds.tempHigh,
      timestamp: reading.timestamp,
      acknowledged: false,
    });
  } else if (reading.tempStatus === 'hypothermia') {
    alerts.push({
      id: `${baseId}_temp`,
      deviceId: reading.deviceId,
      alertType: 'HYPOTHERMIA',
      message: `Low Body Temp detected: ${reading.temperatureC.toFixed(1)}°C (${reading.temperatureF.toFixed(1)}°F) below safe minimum of ${thresholds.tempLow}°C`,
      severity: reading.temperatureC <= thresholds.tempLow - 1.0 ? 'critical' : 'warning',
      value: reading.temperatureC,
      threshold: thresholds.tempLow,
      timestamp: reading.timestamp,
      acknowledged: false,
    });
  }

  // Heart Rate check
  if (reading.hrStatus === 'tachycardia') {
    alerts.push({
      id: `${baseId}_hr`,
      deviceId: reading.deviceId,
      alertType: 'TACHYCARDIA',
      message: `Elevated Heart Rate: ${reading.heartRate} BPM exceeds threshold of ${thresholds.hrHigh} BPM`,
      severity: reading.heartRate >= thresholds.hrHigh + 30 ? 'critical' : 'warning',
      value: reading.heartRate,
      threshold: thresholds.hrHigh,
      timestamp: reading.timestamp,
      acknowledged: false,
    });
  } else if (reading.hrStatus === 'bradycardia') {
    alerts.push({
      id: `${baseId}_hr`,
      deviceId: reading.deviceId,
      alertType: 'BRADYCARDIA',
      message: `Low Heart Rate: ${reading.heartRate} BPM below minimum threshold of ${thresholds.hrLow} BPM`,
      severity: reading.heartRate <= thresholds.hrLow - 15 ? 'critical' : 'warning',
      value: reading.heartRate,
      threshold: thresholds.hrLow,
      timestamp: reading.timestamp,
      acknowledged: false,
    });
  }

  // SpO2 check
  if (reading.spO2Status === 'critical') {
    alerts.push({
      id: `${baseId}_spo2`,
      deviceId: reading.deviceId,
      alertType: 'CRITICAL_SPO2',
      message: `CRITICAL HYPOXIA: Blood Oxygen SpO2 dropped to ${reading.spO2}% (Critical threshold: ≤${thresholds.spO2Critical}%)`,
      severity: 'critical',
      value: reading.spO2,
      threshold: thresholds.spO2Critical,
      timestamp: reading.timestamp,
      acknowledged: false,
    });
  } else if (reading.spO2Status === 'hypoxemia') {
    alerts.push({
      id: `${baseId}_spo2`,
      deviceId: reading.deviceId,
      alertType: 'LOW_SPO2',
      message: `Low Blood Oxygen: SpO2 at ${reading.spO2}% is below optimal standard of ${thresholds.spO2Low}%`,
      severity: 'warning',
      value: reading.spO2,
      threshold: thresholds.spO2Low,
      timestamp: reading.timestamp,
      acknowledged: false,
    });
  }

  return alerts;
}

export interface VitalsStats {
  count: number;
  tempMin: number;
  tempMax: number;
  tempAvg: number;
  hrMin: number;
  hrMax: number;
  hrAvg: number;
  spO2Min: number;
  spO2Max: number;
  spO2Avg: number;
  abnormalCount: number;
}

export function calculateVitalsStats(readings: VitalReading[]): VitalsStats {
  if (readings.length === 0) {
    return {
      count: 0,
      tempMin: 0,
      tempMax: 0,
      tempAvg: 0,
      hrMin: 0,
      hrMax: 0,
      hrAvg: 0,
      spO2Min: 0,
      spO2Max: 0,
      spO2Avg: 0,
      abnormalCount: 0,
    };
  }

  let tempSum = 0;
  let hrSum = 0;
  let spO2Sum = 0;
  let abnormalCount = 0;

  let tempMin = Infinity;
  let tempMax = -Infinity;
  let hrMin = Infinity;
  let hrMax = -Infinity;
  let spO2Min = Infinity;
  let spO2Max = -Infinity;

  for (const r of readings) {
    tempSum += r.temperatureC;
    hrSum += r.heartRate;
    spO2Sum += r.spO2;

    if (r.temperatureC < tempMin) tempMin = r.temperatureC;
    if (r.temperatureC > tempMax) tempMax = r.temperatureC;

    if (r.heartRate < hrMin) hrMin = r.heartRate;
    if (r.heartRate > hrMax) hrMax = r.heartRate;

    if (r.spO2 < spO2Min) spO2Min = r.spO2;
    if (r.spO2 > spO2Max) spO2Max = r.spO2;

    if (r.isAbnormal) abnormalCount++;
  }

  const n = readings.length;
  return {
    count: n,
    tempMin: Number(tempMin.toFixed(1)),
    tempMax: Number(tempMax.toFixed(1)),
    tempAvg: Number((tempSum / n).toFixed(1)),
    hrMin,
    hrMax,
    hrAvg: Math.round(hrSum / n),
    spO2Min,
    spO2Max,
    spO2Avg: Math.round(spO2Sum / n),
    abnormalCount,
  };
}

export type DataSourceMode = 'realtime' | 'demo';
export type SimulationProfile = 'normal' | 'fever' | 'tachycardia' | 'hypoxemia' | 'fluctuating';

export function generateDemoReading(
  profile: SimulationProfile,
  thresholds: ThresholdConfig = DEFAULT_THRESHOLDS,
  randomFn: () => number = Math.random
): VitalReading {
  let baseTemp = 36.8;
  let baseHr = 74;
  let baseSpO2 = 98;

  if (profile === 'normal') {
    baseTemp = 36.6 + (randomFn() * 0.4 - 0.2);
    baseHr = 72 + Math.floor(randomFn() * 6 - 3);
    baseSpO2 = 98 + Math.floor(randomFn() * 2);
  } else if (profile === 'fever') {
    baseTemp = 38.6 + (randomFn() * 0.7 - 0.1);
    baseHr = 110 + Math.floor(randomFn() * 10 - 4);
    baseSpO2 = 96 + Math.floor(randomFn() * 2 - 1);
  } else if (profile === 'tachycardia') {
    baseTemp = 37.0 + randomFn() * 0.3;
    baseHr = 132 + Math.floor(randomFn() * 14 - 4);
    baseSpO2 = 97 + Math.floor(randomFn() * 2 - 1);
  } else if (profile === 'hypoxemia') {
    baseTemp = 36.8 + (randomFn() * 0.4 - 0.2);
    baseHr = 102 + Math.floor(randomFn() * 8 - 4);
    baseSpO2 = 86 + Math.floor(randomFn() * 4 - 2);
  } else if (profile === 'fluctuating') {
    const r = randomFn();
    if (r < 0.25) {
      baseTemp = 38.5;
      baseHr = 108;
      baseSpO2 = 96;
    } else if (r < 0.5) {
      baseTemp = 36.8;
      baseHr = 124;
      baseSpO2 = 98;
    } else if (r < 0.75) {
      baseTemp = 36.7;
      baseHr = 88;
      baseSpO2 = 89;
    } else {
      baseTemp = 36.7;
      baseHr = 74;
      baseSpO2 = 99;
    }
  }

  return createVitalReading({
    deviceId: 'DEMO-PATIENT-01',
    temperatureC: baseTemp,
    heartRate: baseHr,
    spO2: baseSpO2,
    source: 'simulator',
    thresholds,
  });
}

/**
 * Filters telemetry readings according to active data source mode.
 * In 'realtime' mode, strictly returns readings originating from real ESP32 sensor hardware.
 */
export function filterReadingsByMode(readings: VitalReading[], mode: DataSourceMode): VitalReading[] {
  if (mode === 'realtime') {
    return readings.filter(r => r.source === 'esp32');
  }
  return readings;
}

/**
 * Generates deterministic initial demo telemetry history so charts and sparklines render immediately in Demo mode.
 */
export function createDemoSeedHistory(thresholds: ThresholdConfig = DEFAULT_THRESHOLDS): VitalReading[] {
  const samples = [
    { temp: 36.4, hr: 64, spo2: 99, offsetMin: 22, device: 'ESP32-VITALS-01' },
    { temp: 36.6, hr: 72, spo2: 98, offsetMin: 20, device: 'ESP32-VITALS-02' },
    { temp: 36.5, hr: 68, spo2: 98, offsetMin: 18, device: 'ESP32-VITALS-01' },
    { temp: 36.9, hr: 81, spo2: 97, offsetMin: 16, device: 'ESP32-VITALS-03' },
    { temp: 36.7, hr: 75, spo2: 98, offsetMin: 14, device: 'ESP32-VITALS-01' },
    { temp: 37.9, hr: 104, spo2: 96, offsetMin: 12, device: 'ESP32-VITALS-02' },
    { temp: 37.2, hr: 88, spo2: 97, offsetMin: 10, device: 'ESP32-VITALS-01' },
    { temp: 38.4, hr: 116, spo2: 94, offsetMin: 8, device: 'ESP32-VITALS-03' },
    { temp: 37.4, hr: 94, spo2: 97, offsetMin: 6, device: 'ESP32-VITALS-02' },
    { temp: 39.1, hr: 132, spo2: 89, offsetMin: 4, device: 'ESP32-VITALS-03' },
    { temp: 37.5, hr: 98, spo2: 96, offsetMin: 2, device: 'ESP32-VITALS-02' },
    { temp: 36.8, hr: 108, spo2: 95, offsetMin: 0, device: 'ESP32-VITALS-01' },
  ];

  const now = Date.now();
  return samples
    .map((s, idx) =>
      createVitalReading({
        id: `demo_seed_${idx}`,
        deviceId: s.device,
        temperatureC: s.temp,
        heartRate: s.hr,
        spO2: s.spo2,
        source: 'simulator',
        timestamp: new Date(now - s.offsetMin * 60 * 1000).toISOString(),
        thresholds,
      })
    )
    .reverse();
}


