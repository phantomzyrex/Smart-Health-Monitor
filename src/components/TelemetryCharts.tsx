import React, { useState } from 'react';
import { VitalReading, ThresholdConfig } from '../types/vitals';
import { DataSourceMode } from '../utils/vitalsEvaluator';
import { ArrowUpRight, ArrowDownRight, Radio, Sparkles, Code2, Activity } from 'lucide-react';

interface TelemetryChartsProps {
  history: VitalReading[];
  latestReading: VitalReading | null;
  thresholds: ThresholdConfig;
  useFahrenheit: boolean;
  onToggleTempUnit: () => void;
  dataSourceMode: DataSourceMode;
  onSwitchToDemo: () => void;
  onOpenCodeModal: () => void;
}

/**
 * Generates a smooth cubic bezier SVG path through a list of [x, y] coordinates
 */
function buildSmoothSvgPath(points: [number, number][]): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0][0]} ${points[0][1]}`;

  let path = `M ${points[0][0].toFixed(1)} ${points[0][1].toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const [x0, y0] = points[i];
    const [x1, y1] = points[i + 1];
    const cpx1 = x0 + (x1 - x0) * 0.45;
    const cpy1 = y0;
    const cpx2 = x1 - (x1 - x0) * 0.45;
    const cpy2 = y1;
    path += ` C ${cpx1.toFixed(1)} ${cpy1.toFixed(1)}, ${cpx2.toFixed(1)} ${cpy2.toFixed(1)}, ${x1.toFixed(1)} ${y1.toFixed(1)}`;
  }
  return path;
}

export const TelemetryCharts: React.FC<TelemetryChartsProps> = ({
  history,
  latestReading,
  thresholds,
  useFahrenheit,
  onToggleTempUnit,
  dataSourceMode,
  onSwitchToDemo,
  onOpenCodeModal,
}) => {
  const [activePrimaryMetric, setActivePrimaryMetric] = useState<'hr' | 'temp' | 'spo2'>('hr');

  // Chronological order (oldest -> newest)
  const chronological = [...history].reverse().slice(-14);
  const hasData = chronological.length > 0 && latestReading !== null;

  // Primary Chart Geometry (Left Large Card)
  const chartW = 620;
  const chartH = 250;
  const padL = 42;
  const padR = 20;
  const padT = 26;
  const padB = 34;

  const primarySeries = chronological.map(d => {
    if (activePrimaryMetric === 'hr') return d.heartRate;
    if (activePrimaryMetric === 'temp') return useFahrenheit ? d.temperatureF : d.temperatureC;
    return d.spO2;
  });

  const seriesMin = primarySeries.length > 0 ? Math.min(...primarySeries) : 60;
  const seriesMax = primarySeries.length > 0 ? Math.max(...primarySeries) : 120;
  const minSpan = activePrimaryMetric === 'hr' ? 25 : activePrimaryMetric === 'temp' ? 2.5 : 10;
  const seriesSpan = Math.max(minSpan, seriesMax - seriesMin);

  const minBound = Number((seriesMin - seriesSpan * 0.22).toFixed(1));
  const maxBound = Number((seriesMax + seriesSpan * 0.18).toFixed(1));

  const yLabels = [0, 0.2, 0.4, 0.6, 0.8, 1].map(t => {
    const val = maxBound - t * (maxBound - minBound);
    if (activePrimaryMetric === 'hr') return `${Math.round(val)}`;
    if (activePrimaryMetric === 'temp') return `${val.toFixed(1)}°`;
    return `${Math.round(val)}%`;
  });

  const plotW = chartW - padL - padR;
  const plotH = chartH - padT - padB;

  const coords: [number, number][] = primarySeries.map((val, idx) => {
    const x =
      primarySeries.length === 1
        ? padL + plotW / 2
        : padL + (idx / (primarySeries.length - 1)) * plotW;
    const norm = Math.min(1, Math.max(0, (val - minBound) / (maxBound - minBound || 1)));
    const y = padT + plotH - norm * plotH;
    return [x, y];
  });

  const smoothLinePath = buildSmoothSvgPath(coords);
  const smoothAreaPath =
    coords.length > 1
      ? `${smoothLinePath} L ${coords[coords.length - 1][0].toFixed(1)} ${(padT + plotH).toFixed(1)} L ${coords[0][0].toFixed(1)} ${(padT + plotH).toFixed(1)} Z`
      : '';

  // Callout point on primary chart
  const focusIdx = coords.length > 3 ? Math.floor(coords.length * 0.48) : coords.length - 1;
  const focusPoint = coords[focusIdx] || [padL + plotW * 0.5, padT + plotH * 0.5];
  const focusReading = chronological[focusIdx] || latestReading;

  // Card 2: SpO2 Semi-Circular Arc Gauge (0% to 100%)
  const spO2Value = latestReading ? latestReading.spO2 : 0;
  const spO2Clamped = Math.min(100, Math.max(0, spO2Value));
  const arcRadius = 72;
  const arcCircumference = Math.PI * arcRadius;
  const arcOffset = arcCircumference * (1 - spO2Clamped / 100);

  // Card 3: Body Temperature Vertical Rounded Bars (last 6 readings)
  const barReadings = chronological.slice(-6);
  const tempUnit = useFahrenheit ? '°F' : '°C';
  const tempMinScale = useFahrenheit ? 96.0 : 35.8;
  const tempMaxScale = useFahrenheit ? 103.0 : 39.5;

  // Card 4: Growth / Pulse Trend Spline (last 7 readings)
  const trendReadings = chronological.slice(-7);
  const trendW = 280;
  const trendH = 115;
  const trendHrs = trendReadings.map(r => r.heartRate);
  const tMin = trendHrs.length > 0 ? Math.min(...trendHrs) - 5 : 60;
  const tMax = trendHrs.length > 0 ? Math.max(...trendHrs) + 5 : 120;
  const trendCoords: [number, number][] = trendReadings.map((r, i) => {
    const x =
      trendReadings.length === 1
        ? trendW / 2
        : 14 + (i / (trendReadings.length - 1)) * (trendW - 28);
    const norm = Math.min(1, Math.max(0, (r.heartRate - tMin) / Math.max(1, tMax - tMin)));
    const y = 14 + (1 - norm) * (trendH - 34);
    return [x, y];
  });
  const trendLinePath = buildSmoothSvgPath(trendCoords);
  const trendAreaPath =
    trendCoords.length > 1
      ? `${trendLinePath} L ${trendCoords[trendCoords.length - 1][0].toFixed(1)} ${trendH - 18} L ${trendCoords[0][0].toFixed(1)} ${trendH - 18} Z`
      : '';
  // Find highest peak index in trendCoords
  let peakIdx = 0;
  trendReadings.forEach((r, i) => {
    if (r.heartRate >= (trendReadings[peakIdx]?.heartRate || 0)) peakIdx = i;
  });
  const peakCoord = trendCoords[peakIdx];

  // Card 5: Vital Stability Donut Chart Distribution
  const totalCount = Math.max(1, history.length);
  const optimalCount = history.filter(r => !r.isAbnormal).length;
  const feverCount = history.filter(r => r.tempStatus !== 'normal').length;
  const hrAlertCount = history.filter(r => r.hrStatus !== 'normal').length;
  const spo2AlertCount = history.filter(r => r.spO2Status !== 'normal').length;

  const optimalPct = Math.round((optimalCount / totalCount) * 100);

  return (
    <section className="grid grid-cols-1 xl:grid-cols-12 gap-5">
      {/* LEFT LARGE CARD: Primary Vital Telemetry Curve (Matches "Portfolio Value" card) */}
      <div className="xl:col-span-6 glass-card rounded-[28px] p-6 flex flex-col justify-between min-h-[390px] relative overflow-hidden">
        {/* Card Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 z-10">
          <div>
            <h2 className="text-base font-semibold text-[#1e2432]">
              {activePrimaryMetric === 'hr'
                ? 'Heart Rate Telemetry'
                : activePrimaryMetric === 'temp'
                ? `Body Temperature (${tempUnit})`
                : 'Blood Oxygen Saturation'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {dataSourceMode === 'realtime'
                ? 'Live ESP32 Hardware Sensor Stream (DS18B20 & MAX30102)'
                : 'Simulated Patient Telemetry Stream'}
            </p>
          </div>

          {/* Top-right pill tabs matching 1D | 1W | 1M | 1Y */}
          <div className="flex items-center bg-white/55 backdrop-blur-md rounded-full p-1 border border-white/75 shadow-2xs">
            <button
              type="button"
              onClick={() => setActivePrimaryMetric('hr')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                activePrimaryMetric === 'hr'
                  ? 'bg-white text-[#1e2432] shadow-xs'
                  : 'text-slate-500 hover:text-[#1e2432]'
              }`}
            >
              BPM
            </button>
            <button
              type="button"
              onClick={() => setActivePrimaryMetric('temp')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                activePrimaryMetric === 'temp'
                  ? 'bg-white text-[#1e2432] shadow-xs'
                  : 'text-slate-500 hover:text-[#1e2432]'
              }`}
            >
              Temp
            </button>
            <button
              type="button"
              onClick={() => setActivePrimaryMetric('spo2')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                activePrimaryMetric === 'spo2'
                  ? 'bg-white text-[#1e2432] shadow-xs'
                  : 'text-slate-500 hover:text-[#1e2432]'
              }`}
            >
              SpO2
            </button>
          </div>
        </div>

        {/* Chart Body or Real-Time Waiting State */}
        {!hasData ? (
          <div className="my-auto py-10 text-center max-w-md mx-auto space-y-3">
            <div className="w-11 h-11 rounded-2xl bg-white/80 border border-white flex items-center justify-center mx-auto text-[#df7841] shadow-xs">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <h3 className="text-sm font-semibold text-[#1e2432]">
              Listening for Real-Time ESP32 Sensor Data
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Real-Time Mode displays only live hardware readings from your ESP32 (DS18B20 &amp; MAX30102). Connect your board or switch to Demo Mode to preview sample waveforms.
            </p>
            <div className="flex items-center justify-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={onOpenCodeModal}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#1a1f2c] text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>ESP32 Setup &amp; Code</span>
              </button>
              <button
                type="button"
                onClick={onSwitchToDemo}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white/80 hover:bg-white text-[#1e2432] border border-white text-xs font-semibold transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#df7841]" />
                <span>Switch to Demo Mode</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="relative mt-4">
            {/* Floating Glass Callout Box (Matches "$ 2,600 Income" callout in reference image) */}
            {focusReading && (
              <div
                className="hidden sm:flex flex-col bg-white/88 backdrop-blur-md border border-white rounded-2xl px-3.5 py-2.5 shadow-md z-10 pointer-events-none"
                style={{
                  position: 'absolute',
                  left: `${Math.min(72, Math.max(12, (focusPoint[0] / chartW) * 100 - 12))}%`,
                  top: `${Math.max(4, (focusPoint[1] / chartH) * 100 - 28)}%`,
                }}
              >
                <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                  <Activity className="w-3 h-3 text-[#6a9ae8]" />
                  {focusReading.deviceId}
                </span>
                <span className="text-sm font-bold text-[#1e2432] font-mono mt-0.5">
                  {activePrimaryMetric === 'hr'
                    ? `${focusReading.heartRate} BPM`
                    : activePrimaryMetric === 'temp'
                    ? `${useFahrenheit ? focusReading.temperatureF.toFixed(1) : focusReading.temperatureC.toFixed(1)} ${tempUnit}`
                    : `${focusReading.spO2}% SpO2`}
                </span>
              </div>
            )}

            <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-64 overflow-visible">
              <defs>
                <linearGradient id="primaryAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6a9ae8" stopOpacity="0.58" />
                  <stop offset="65%" stopColor="#8bb2f0" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Horizontal Grid Lines & Left Y-Axis Labels */}
              {yLabels.map((label, i) => {
                const y = padT + (i / (yLabels.length - 1)) * plotH;
                return (
                  <g key={`y-grid-${i}`}>
                    <line
                      x1={padL}
                      y1={y}
                      x2={chartW - padR}
                      y2={y}
                      stroke="rgba(148, 163, 184, 0.18)"
                      strokeDasharray="3 3"
                      strokeWidth="1"
                    />
                    <text
                      x={padL - 10}
                      y={y + 3}
                      textAnchor="end"
                      fill="#7c8ba1"
                      fontSize="10"
                      fontFamily="Plus Jakarta Sans, sans-serif"
                    >
                      {label}
                    </text>
                  </g>
                );
              })}

              {/* Smooth Area Fill */}
              {smoothAreaPath && <path d={smoothAreaPath} fill="url(#primaryAreaGrad)" />}

              {/* Smooth Top Curve */}
              {smoothLinePath && (
                <path
                  d={smoothLinePath}
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="2.75"
                  strokeLinecap="round"
                />
              )}

              {/* Inflection Markers & Active Point */}
              {coords.map(([cx, cy], idx) => {
                const isFocus = idx === focusIdx || idx === coords.length - 1;
                if (!isFocus && idx % 3 !== 1) return null;
                const prevVal = primarySeries[Math.max(0, idx - 1)];
                const currVal = primarySeries[idx];
                const isUp = currVal >= prevVal;
                return (
                  <g key={idx}>
                    <circle
                      cx={cx}
                      cy={cy}
                      r={isFocus ? 5 : 3.5}
                      fill={isFocus ? '#1e2432' : '#ffffff'}
                      stroke="#ffffff"
                      strokeWidth="2"
                    />
                    {idx !== coords.length - 1 && (
                      <text
                        x={cx}
                        y={cy - 9}
                        textAnchor="middle"
                        fill="#1e2432"
                        fontSize="10"
                        fontWeight="700"
                      >
                        {isUp ? '↑' : '↓'}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* X-Axis Timestamps */}
              {chronological.map((item, idx) => {
                if (chronological.length > 7 && idx % 2 !== 0 && idx !== chronological.length - 1) {
                  return null;
                }
                const [cx] = coords[idx] || [padL, 0];
                const timeLabel = new Date(item.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false,
                });
                return (
                  <text
                    key={`${item.id}-${idx}`}
                    x={cx}
                    y={chartH - 8}
                    textAnchor="middle"
                    fill="#64748b"
                    fontSize="10"
                    fontFamily="JetBrains Mono, monospace"
                  >
                    {timeLabel}
                  </text>
                );
              })}
            </svg>
          </div>
        )}
      </div>

      {/* RIGHT 2x2 BENTO GRID */}
      <div className="xl:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* 1. TOP-LEFT: Blood Oxygen SpO2 Semi-Circular Gauge (Matches "Risk Distribution") */}
        <div className="glass-card-warm rounded-[28px] p-5 flex flex-col justify-between min-h-[185px]">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#1e2432]">SpO2 Distribution</h3>
            <span className="text-[11px] font-mono text-slate-500">MAX30102</span>
          </div>

          <div className="relative flex flex-col items-center justify-center my-1">
            <svg viewBox="0 0 180 105" className="w-44 h-26 overflow-visible">
              <defs>
                <linearGradient id="spo2ArcGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#f3cbb2" />
                  <stop offset="55%" stopColor="#e68a56" />
                  <stop offset="100%" stopColor="#d96b34" />
                </linearGradient>
              </defs>
              {/* Background Semi-Circle Track */}
              <path
                d="M 18 88 A 72 72 0 0 1 162 88"
                fill="none"
                stroke="rgba(255, 255, 255, 0.75)"
                strokeWidth="12"
                strokeLinecap="round"
              />
              {/* Foreground Value Arc */}
              <path
                d="M 18 88 A 72 72 0 0 1 162 88"
                fill="none"
                stroke="url(#spo2ArcGrad)"
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={arcCircumference}
                strokeDashoffset={hasData ? arcOffset : arcCircumference}
              />
            </svg>

            <div className=" -mt-12 text-center">
              <div className="text-3xl font-semibold text-[#1e2432] font-mono tracking-tight">
                {hasData ? `${spO2Value}%` : '--%'}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {hasData
                  ? spO2Value >= thresholds.spO2Low
                    ? 'Optimal Oxygenation'
                    : 'Below Threshold'
                  : 'Awaiting sensor'}
              </div>
            </div>

            <div className="w-full flex items-center justify-between px-4 text-[11px] font-mono text-slate-600 mt-1">
              <span>0%</span>
              <span>100%</span>
            </div>
          </div>
        </div>

        {/* 2. TOP-RIGHT: Body Temperature Rounded Bars (Matches "Monthly Income") */}
        <div className="glass-card-warm rounded-[28px] p-5 flex flex-col justify-between min-h-[185px]">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#1e2432]">Body Temperature</h3>
            <button
              type="button"
              onClick={onToggleTempUnit}
              aria-label="Toggle Celsius and Fahrenheit"
              className="px-2.5 py-0.5 rounded-full bg-white/75 hover:bg-white text-[11px] font-semibold text-slate-600 border border-white transition-colors"
            >
              {tempUnit}
            </button>
          </div>

          {!hasData ? (
            <div className="my-auto text-center text-xs text-slate-500">
              No DS18B20 temperature samples yet
            </div>
          ) : (
            <div className="relative pt-4 pb-1 flex flex-col justify-end h-34">
              {/* Dashed reference threshold line */}
              <div
                className="w-full border-t border-dashed border-slate-400/50 absolute left-0 right-0 pointer-events-none"
                style={{ bottom: '68%' }}
              />

              <div className="grid grid-cols-6 gap-2.5 items-end h-24 px-1">
                {barReadings.map((r, idx) => {
                  const val = useFahrenheit ? r.temperatureF : r.temperatureC;
                  const pct = Math.min(
                    100,
                    Math.max(24, ((val - tempMinScale) / (tempMaxScale - tempMinScale)) * 100)
                  );
                  const isHighlighted = idx === barReadings.length - 1 || r.tempStatus !== 'normal';

                  return (
                    <div key={`${r.id}-${idx}`} className="flex flex-col items-center gap-1.5 h-full justify-end">
                      <div
                        title={`${val.toFixed(1)}${tempUnit}`}
                        className={`w-full max-w-[26px] rounded-t-xl transition-all duration-300 relative flex justify-center ${
                          isHighlighted
                            ? 'bg-gradient-to-t from-[#e8996b]/40 via-[#df7841]/85 to-[#d96b34]'
                            : 'bg-gradient-to-t from-[#8bb2f0]/20 via-[#7aa4eb]/60 to-[#6a9ae8]/90'
                        }`}
                        style={{ height: `${pct}%` }}
                      >
                        {isHighlighted && (
                          <span className="w-2 h-2 rounded-full bg-white mt-1.5 shadow-2xs" />
                        )}
                      </div>
                      <span className="text-[10px] text-slate-600 font-mono">
                        {val.toFixed(1)}°
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 3. BOTTOM-LEFT: Pulse Wave Trend (Matches "Growth Trend") */}
        <div className="glass-card-blend rounded-[28px] p-5 flex flex-col justify-between min-h-[185px]">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#1e2432]">Pulse Trend</h3>
            <span className="px-2.5 py-1 rounded-full bg-white/90 text-xs font-bold text-[#1e2432] font-mono shadow-2xs">
              {latestReading ? `${latestReading.heartRate} BPM` : '-- BPM'}
            </span>
          </div>

          {!hasData ? (
            <div className="my-auto text-center text-xs text-slate-500">
              Waiting for MAX30102 pulse stream
            </div>
          ) : (
            <div className="mt-2">
              <svg viewBox={`0 0 ${trendW} ${trendH}`} className="w-full h-24 overflow-visible">
                <defs>
                  <linearGradient id="pulseMiniGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6a9ae8" stopOpacity="0.38" />
                    <stop offset="100%" stopColor="#6a9ae8" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                {trendAreaPath && <path d={trendAreaPath} fill="url(#pulseMiniGrad)" />}
                {trendLinePath && (
                  <path
                    d={trendLinePath}
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                  />
                )}
                {peakCoord && (
                  <circle
                    cx={peakCoord[0]}
                    cy={peakCoord[1]}
                    r="4.5"
                    fill="#ffffff"
                    stroke="#6a9ae8"
                    strokeWidth="2"
                  />
                )}
              </svg>
              <div className="flex items-center justify-between text-[10px] text-slate-600 font-mono px-1">
                {trendReadings.map((r, i) => (
                  <span key={`${r.id}-${i}`}>
                    {new Date(r.timestamp).toLocaleTimeString([], {
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 4. BOTTOM-RIGHT: Vital Stability Donut Chart (Matches "Asset Allocation") */}
        <div className="glass-card-cool rounded-[28px] p-5 flex flex-col justify-between min-h-[185px]">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#1e2432]">Vital Stability</h3>
            <span className="text-xs font-mono font-semibold text-[#1e2432]">
              {hasData ? `${optimalPct}% Normal` : '--'}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2 my-auto pt-1">
            {/* Left Legend */}
            <div className="space-y-1.5 text-[11px] text-slate-600">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#6a9ae8] inline-block" />
                <span>Optimal ({optimalCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#df7841] inline-block" />
                <span>Fever Alert ({feverCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#e8EEF7] border border-white inline-block" />
                <span>Pulse Alert ({hrAlertCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#7b6888] inline-block" />
                <span>SpO2 Alert ({spo2AlertCount})</span>
              </div>
            </div>

            {/* Right Donut Ring SVG */}
            <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
              <svg viewBox="0 0 100 100" className="w-26 h-26 -rotate-90">
                <circle
                  cx="50"
                  cy="50"
                  r="34"
                  fill="none"
                  stroke="rgba(255,255,255,0.65)"
                  strokeWidth="16"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="34"
                  fill="none"
                  stroke="#6a9ae8"
                  strokeWidth="16"
                  strokeDasharray={`${(optimalPct / 100) * 213.6} 213.6`}
                />
                {optimalPct < 100 && (
                  <circle
                    cx="50"
                    cy="50"
                    r="34"
                    fill="none"
                    stroke="#df7841"
                    strokeWidth="16"
                    strokeDasharray={`${((100 - optimalPct) / 100) * 213.6} 213.6`}
                    strokeDashoffset={`-${(optimalPct / 100) * 213.6}`}
                  />
                )}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-xs font-bold text-[#1e2432] font-mono">
                  {hasData ? `${history.length}` : '0'}
                </span>
                <span className="text-[9px] text-slate-500">samples</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
