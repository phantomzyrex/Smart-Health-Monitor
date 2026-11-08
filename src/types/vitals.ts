export type VitalStatus = 'normal' | 'warning' | 'critical';

export type TemperatureStatus = 'normal' | 'fever' | 'hypothermia';
export type HeartRateStatus = 'normal' | 'tachycardia' | 'bradycardia';
export type SpO2Status = 'normal' | 'hypoxemia' | 'critical';

export interface VitalReading {
  id: string;
  deviceId: string;
  temperatureC: number;
  temperatureF: number;
  heartRate: number;
  spO2: number;
  tempStatus: TemperatureStatus;
  hrStatus: HeartRateStatus;
  spO2Status: SpO2Status;
  isAbnormal: boolean;
  source: 'esp32' | 'manual' | 'simulator';
  timestamp: string;
  createdAt?: unknown;
}

export interface ThresholdConfig {
  tempHigh: number;      // e.g. 37.8 °C (Fever)
  tempLow: number;       // e.g. 35.5 °C (Hypothermia)
  hrHigh: number;        // e.g. 100 BPM (Tachycardia)
  hrLow: number;         // e.g. 60 BPM (Bradycardia)
  spO2Low: number;       // e.g. 95 % (Mild Hypoxemia)
  spO2Critical: number;  // e.g. 90 % (Severe Hypoxemia)
  audioAlarmEnabled: boolean;
}

export interface AlertLog {
  id: string;
  deviceId: string;
  alertType: 'FEVER' | 'HYPOTHERMIA' | 'TACHYCARDIA' | 'BRADYCARDIA' | 'LOW_SPO2' | 'CRITICAL_SPO2';
  message: string;
  severity: 'warning' | 'critical';
  value: number;
  threshold: number;
  timestamp: string;
  acknowledged: boolean;
}

export interface DeviceTelemetryInfo {
  deviceId: string;
  deviceName: string;
  online: boolean;
  lastSeen: string;
  ipAddress?: string;
  wifiSSID?: string;
  rssi?: number;
}
