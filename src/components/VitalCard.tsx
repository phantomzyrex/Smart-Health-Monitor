import React, { useState } from 'react';
import { Thermometer, Heart, Activity, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { VitalReading, ThresholdConfig } from '../types/vitals';
import { PPGWaveformCanvas } from './PPGWaveformCanvas';

interface VitalCardProps {
  reading: VitalReading;
  thresholds: ThresholdConfig;
  useFahrenheit: boolean;
  onToggleTempUnit: () => void;
}

export const VitalCard: React.FC<VitalCardProps> = ({
  reading,
  thresholds,
  useFahrenheit,
  onToggleTempUnit,
}) => {
  const isFever = reading.tempStatus === 'fever';
  const isHypothermia = reading.tempStatus === 'hypothermia';
  const isTempAbnormal = isFever || isHypothermia;

  const isTachycardia = reading.hrStatus === 'tachycardia';
  const isBradycardia = reading.hrStatus === 'bradycardia';
  const isHrAbnormal = isTachycardia || isBradycardia;

  const isSpO2Critical = reading.spO2Status === 'critical';
  const isSpO2Hypoxemia = reading.spO2Status === 'hypoxemia';
  const isSpO2Abnormal = isSpO2Critical || isSpO2Hypoxemia;

  // Temperature display
  const tempValue = useFahrenheit ? reading.temperatureF : reading.temperatureC;
  const tempUnit = useFahrenheit ? '°F' : '°C';

  // Calculate percentage along standard physiological scale for thermometer visual bar
  // Human scale 34°C to 42°C
  const tempBarPercent = Math.min(100, Math.max(0, ((reading.temperatureC - 34) / (42 - 34)) * 100));

  // Pulse rate scale 40 to 180 BPM
  const hrBarPercent = Math.min(100, Math.max(0, ((reading.heartRate - 40) / (180 - 40)) * 100));

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {/* 1. DS18B20 BODY TEMPERATURE CARD */}
      <div
        className={`relative rounded-2xl p-5 border transition-all duration-300 ${
          isTempAbnormal
            ? 'bg-rose-950/30 border-rose-500/60 shadow-lg shadow-rose-950/40 ring-1 ring-rose-500/50'
            : 'bg-slate-900/80 border-slate-800 shadow-md hover:border-slate-700'
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2.5 rounded-xl ${
                isTempAbnormal ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
              }`}
            >
              <Thermometer className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-slate-200 text-sm">Body Temperature</h3>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                  DS18B20
                </span>
              </div>
              <p className="text-xs text-slate-400">Digital OneWire Probe</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onToggleTempUnit}
            aria-label="Toggle temperature unit between Celsius and Fahrenheit"
            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
          >
            {useFahrenheit ? '°F' : '°C'}
          </button>
        </div>

        {/* Temperature Value */}
        <div className="flex items-baseline justify-between my-2">
          <div className="flex items-baseline gap-1">
            <span
              className={`text-4xl lg:text-5xl font-extrabold tracking-tight font-mono ${
                isTempAbnormal ? 'text-rose-400' : 'text-slate-100'
              }`}
            >
              {tempValue.toFixed(1)}
            </span>
            <span className="text-xl font-bold text-slate-400">{tempUnit}</span>
          </div>

          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
              isFever
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                : isHypothermia
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 animate-pulse'
                : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
            }`}
          >
            {isTempAbnormal ? <AlertTriangle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
            <span>
              {isFever
                ? 'High Fever'
                : isHypothermia
                ? 'Hypothermia'
                : 'Normal'}
            </span>
          </div>
        </div>

        {/* Thermometer Gauge Bar */}
        <div className="mt-4 pt-3 border-t border-slate-800/80">
          <div className="flex justify-between text-[11px] text-slate-400 mb-1.5 font-mono">
            <span>Low ({thresholds.tempLow}°C)</span>
            <span className="text-emerald-400 font-semibold">Normal 36.5–37.5°C</span>
            <span className="text-rose-400">Fever ({thresholds.tempHigh}°C)</span>
          </div>
          <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden p-0.5 relative">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isFever
                  ? 'bg-gradient-to-r from-amber-500 to-rose-500 shadow-sm shadow-rose-500'
                  : isHypothermia
                  ? 'bg-gradient-to-r from-sky-500 to-cyan-400'
                  : 'bg-gradient-to-r from-teal-400 to-emerald-500'
              }`}
              style={{ width: `${tempBarPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. MAX30102 HEART RATE (BPM) CARD */}
      <div
        className={`relative rounded-2xl p-5 border transition-all duration-300 ${
          isHrAbnormal
            ? 'bg-rose-950/30 border-rose-500/60 shadow-lg shadow-rose-950/40 ring-1 ring-rose-500/50'
            : 'bg-slate-900/80 border-slate-800 shadow-md hover:border-slate-700'
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2.5 rounded-xl ${
                isHrAbnormal ? 'bg-rose-500/20 text-rose-400' : 'bg-rose-500/15 text-rose-400'
              }`}
            >
              <Heart
                className={`w-5 h-5 ${
                  reading.heartRate > 0 ? 'animate-heartbeat text-rose-500 fill-rose-500/40' : 'text-slate-400'
                }`}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-slate-200 text-sm">Heart Rate (Pulse)</h3>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                  MAX30102
                </span>
              </div>
              <p className="text-xs text-slate-400">Optical PPG Photoplethysmography</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
            <span className="text-[11px] font-mono text-slate-400">LIVE</span>
          </div>
        </div>

        {/* BPM Value */}
        <div className="flex items-baseline justify-between my-2">
          <div className="flex items-baseline gap-1.5">
            <span
              className={`text-4xl lg:text-5xl font-extrabold tracking-tight font-mono ${
                isHrAbnormal ? 'text-rose-400' : 'text-slate-100'
              }`}
            >
              {reading.heartRate}
            </span>
            <span className="text-base font-bold text-slate-400">BPM</span>
          </div>

          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
              isTachycardia
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                : isBradycardia
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
            }`}
          >
            {isHrAbnormal ? <AlertTriangle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
            <span>
              {isTachycardia
                ? 'Tachycardia'
                : isBradycardia
                ? 'Bradycardia'
                : 'Resting Normal'}
            </span>
          </div>
        </div>

        {/* Live PPG Waveform Canvas */}
        <div className="mt-3">
          <PPGWaveformCanvas bpm={reading.heartRate} isAbnormal={isHrAbnormal} />
        </div>
      </div>

      {/* 3. MAX30102 BLOOD OXYGEN (SpO2) CARD */}
      <div
        className={`relative rounded-2xl p-5 border transition-all duration-300 ${
          isSpO2Abnormal
            ? 'bg-rose-950/30 border-rose-500/60 shadow-lg shadow-rose-950/40 ring-1 ring-rose-500/50'
            : 'bg-slate-900/80 border-slate-800 shadow-md hover:border-slate-700'
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2.5 rounded-xl ${
                isSpO2Critical
                  ? 'bg-rose-500/20 text-rose-400'
                  : isSpO2Hypoxemia
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'bg-cyan-500/20 text-cyan-400'
              }`}
            >
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-slate-200 text-sm">Blood Oxygen (SpO2)</h3>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                  MAX30102
                </span>
              </div>
              <p className="text-xs text-slate-400">Pulse Oximeter Hemoglobin Sat.</p>
            </div>
          </div>
          <span className="text-xs font-mono text-slate-400">IR/Red Ratio</span>
        </div>

        {/* SpO2 Value */}
        <div className="flex items-baseline justify-between my-2">
          <div className="flex items-baseline gap-1">
            <span
              className={`text-4xl lg:text-5xl font-extrabold tracking-tight font-mono ${
                isSpO2Critical
                  ? 'text-rose-400'
                  : isSpO2Hypoxemia
                  ? 'text-amber-400'
                  : 'text-slate-100'
              }`}
            >
              {reading.spO2}
            </span>
            <span className="text-xl font-bold text-slate-400">%</span>
          </div>

          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
              isSpO2Critical
                ? 'bg-rose-500/25 text-rose-300 border border-rose-500/50 animate-pulse'
                : isSpO2Hypoxemia
                ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40 animate-pulse'
                : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
            }`}
          >
            {isSpO2Abnormal ? <AlertTriangle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
            <span>
              {isSpO2Critical
                ? 'Critical Hypoxia'
                : isSpO2Hypoxemia
                ? 'Low SpO2'
                : 'Optimal'}
            </span>
          </div>
        </div>

        {/* SpO2 Progress and Oxygen Scale */}
        <div className="mt-4 pt-3 border-t border-slate-800/80">
          <div className="flex justify-between text-[11px] text-slate-400 mb-1.5 font-mono">
            <span className="text-rose-400">Critical (&lt;{thresholds.spO2Critical}%)</span>
            <span className="text-amber-400">Warning (90-94%)</span>
            <span className="text-emerald-400 font-semibold">Healthy (95-100%)</span>
          </div>
          <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isSpO2Critical
                  ? 'bg-rose-500 shadow-sm shadow-rose-500'
                  : isSpO2Hypoxemia
                  ? 'bg-amber-500'
                  : 'bg-gradient-to-r from-cyan-400 to-emerald-400'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, reading.spO2))}%` }}
            />
          </div>
          <p className="mt-2 text-[11px] text-slate-400">
            {reading.spO2 >= 95
              ? 'Arterial blood oxygenation is optimal for brain and organ perfusion.'
              : reading.spO2 >= 90
              ? 'Moderate desaturation observed. Recommend checking probe contact.'
              : 'Severe hypoxemia detected! Immediate medical attention advised.'}
          </p>
        </div>
      </div>
    </div>
  );
};
