import test from 'node:test';
import assert from 'node:assert/strict';
import {
  cToF,
  fToC,
  evaluateTemperature,
  evaluateHeartRate,
  evaluateSpO2,
  createVitalReading,
  detectAlerts,
  calculateVitalsStats,
  generateDemoReading,
  filterReadingsByMode,
  createDemoSeedHistory,
  DEFAULT_THRESHOLDS,
} from './vitalsEvaluator';

test('Temperature unit conversions calculate accurately', () => {
  assert.equal(cToF(37.0), 98.6);
  assert.equal(cToF(0), 32.0);
  assert.equal(cToF(100), 212.0);
  assert.equal(fToC(98.6), 37.0);
  assert.equal(fToC(32.0), 0.0);
});

test('Temperature status detects normal, fever, and hypothermia', () => {
  assert.equal(evaluateTemperature(36.8), 'normal');
  assert.equal(evaluateTemperature(37.0), 'normal');
  // At or above 37.8 is fever
  assert.equal(evaluateTemperature(37.8), 'fever');
  assert.equal(evaluateTemperature(38.5), 'fever');
  // At or below 35.5 is hypothermia
  assert.equal(evaluateTemperature(35.5), 'hypothermia');
  assert.equal(evaluateTemperature(34.2), 'hypothermia');
});

test('Heart rate status categorizes normal, tachycardia, and bradycardia', () => {
  assert.equal(evaluateHeartRate(72), 'normal');
  assert.equal(evaluateHeartRate(99), 'normal');
  assert.equal(evaluateHeartRate(100), 'tachycardia');
  assert.equal(evaluateHeartRate(125), 'tachycardia');
  assert.equal(evaluateHeartRate(59), 'bradycardia');
  assert.equal(evaluateHeartRate(45), 'bradycardia');
});

test('SpO2 status detects normal, mild hypoxemia, and critical hypoxia', () => {
  assert.equal(evaluateSpO2(98), 'normal');
  assert.equal(evaluateSpO2(95), 'normal');
  assert.equal(evaluateSpO2(94), 'hypoxemia');
  assert.equal(evaluateSpO2(91), 'hypoxemia');
  assert.equal(evaluateSpO2(90), 'critical');
  assert.equal(evaluateSpO2(82), 'critical');
});

test('createVitalReading correctly compiles vital indicators and abnormal flags', () => {
  const normalReading = createVitalReading({
    temperatureC: 36.6,
    heartRate: 72,
    spO2: 99,
  });
  assert.equal(normalReading.isAbnormal, false);
  assert.equal(normalReading.tempStatus, 'normal');
  assert.equal(normalReading.hrStatus, 'normal');
  assert.equal(normalReading.spO2Status, 'normal');
  assert.equal(normalReading.temperatureF, 97.9);

  const feverReading = createVitalReading({
    temperatureC: 38.4,
    heartRate: 110,
    spO2: 93,
  });
  assert.equal(feverReading.isAbnormal, true);
  assert.equal(feverReading.tempStatus, 'fever');
  assert.equal(feverReading.hrStatus, 'tachycardia');
  assert.equal(feverReading.spO2Status, 'hypoxemia');
});

test('detectAlerts generates proper alerts with correct severity', () => {
  const severeReading = createVitalReading({
    temperatureC: 39.5,
    heartRate: 135,
    spO2: 88,
  });
  const alerts = detectAlerts(severeReading);
  assert.equal(alerts.length, 3);

  const feverAlert = alerts.find(a => a.alertType === 'FEVER');
  assert.ok(feverAlert);
  assert.equal(feverAlert?.severity, 'critical');

  const hrAlert = alerts.find(a => a.alertType === 'TACHYCARDIA');
  assert.ok(hrAlert);
  assert.equal(hrAlert?.severity, 'critical');

  const spo2Alert = alerts.find(a => a.alertType === 'CRITICAL_SPO2');
  assert.ok(spo2Alert);
  assert.equal(spo2Alert?.severity, 'critical');
});

test('calculateVitalsStats computes count, averages, min, max, and abnormal counts', () => {
  const r1 = createVitalReading({ temperatureC: 36.0, heartRate: 60, spO2: 96 });
  const r2 = createVitalReading({ temperatureC: 38.0, heartRate: 120, spO2: 92 }); // abnormal
  const stats = calculateVitalsStats([r1, r2]);

  assert.equal(stats.count, 2);
  assert.equal(stats.abnormalCount, 1);
  assert.equal(stats.tempMin, 36.0);
  assert.equal(stats.tempMax, 38.0);
  assert.equal(stats.tempAvg, 37.0);
  assert.equal(stats.hrMin, 60);
  assert.equal(stats.hrMax, 120);
  assert.equal(stats.hrAvg, 90);
  assert.equal(stats.spO2Min, 92);
  assert.equal(stats.spO2Max, 96);
  assert.equal(stats.spO2Avg, 94);
});

test('generateDemoReading produces valid readings for each simulation profile', () => {
  const normal = generateDemoReading('normal', DEFAULT_THRESHOLDS, () => 0.5);
  assert.equal(normal.isAbnormal, false);
  assert.equal(normal.source, 'simulator');

  const fever = generateDemoReading('fever', DEFAULT_THRESHOLDS, () => 0.5);
  assert.equal(fever.tempStatus, 'fever');
  assert.equal(fever.isAbnormal, true);

  const hypoxemia = generateDemoReading('hypoxemia', DEFAULT_THRESHOLDS, () => 0.5);
  assert.equal(hypoxemia.spO2Status, 'critical');
  assert.equal(hypoxemia.isAbnormal, true);
});

test('filterReadingsByMode returns only real esp32 sensor readings in realtime mode', () => {
  const espReading = createVitalReading({ temperatureC: 36.8, heartRate: 72, spO2: 98, source: 'esp32' });
  const simReading = createVitalReading({ temperatureC: 38.5, heartRate: 112, spO2: 95, source: 'simulator' });
  const manualReading = createVitalReading({ temperatureC: 37.1, heartRate: 80, spO2: 97, source: 'manual' });

  const realtimeFiltered = filterReadingsByMode([espReading, simReading, manualReading], 'realtime');
  assert.equal(realtimeFiltered.length, 1);
  assert.equal(realtimeFiltered[0].source, 'esp32');

  const demoFiltered = filterReadingsByMode([espReading, simReading, manualReading], 'demo');
  assert.equal(demoFiltered.length, 3);

  const demoSeed = createDemoSeedHistory();
  assert.equal(demoSeed.length, 12);
});


