import React from 'react';
import { ShieldCheck, AlertTriangle, Thermometer, Heart, Activity, CheckCircle } from 'lucide-react';
import { VitalsStats } from '../utils/vitalsEvaluator';

interface VitalsStatsBarProps {
  stats: VitalsStats;
  useFahrenheit: boolean;
}

export const VitalsStatsBar: React.FC<VitalsStatsBarProps> = ({ stats, useFahrenheit }) => {
  const avgTempDisplay = useFahrenheit
    ? `${((stats.tempAvg * 9) / 5 + 32).toFixed(1)}°F`
    : `${stats.tempAvg.toFixed(1)}°C`;

  const normalRatio = stats.count > 0 ? Math.round(((stats.count - stats.abnormalCount) / stats.count) * 100) : 100;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
      {/* 1. Readings Count */}
      <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800">
        <span className="text-[11px] font-medium text-slate-400 block">Total Telemetry</span>
        <div className="flex items-baseline gap-1 mt-1 font-mono">
          <span className="text-xl font-bold text-white">{stats.count}</span>
          <span className="text-xs text-slate-500">records</span>
        </div>
      </div>

      {/* 2. Abnormal Breaches */}
      <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800">
        <span className="text-[11px] font-medium text-slate-400 block">Abnormal Alerts</span>
        <div className="flex items-baseline gap-1 mt-1 font-mono">
          <span className={`text-xl font-bold ${stats.abnormalCount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
            {stats.abnormalCount}
          </span>
          <span className="text-xs text-slate-500">breaches</span>
        </div>
      </div>

      {/* 3. Avg Temperature */}
      <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800">
        <span className="text-[11px] font-medium text-amber-400 flex items-center gap-1">
          <Thermometer className="w-3 h-3" />
          Avg Temp
        </span>
        <div className="flex items-baseline gap-1 mt-1 font-mono">
          <span className="text-xl font-bold text-slate-200">{stats.count > 0 ? avgTempDisplay : '--'}</span>
        </div>
      </div>

      {/* 4. Avg Heart Rate */}
      <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800">
        <span className="text-[11px] font-medium text-rose-400 flex items-center gap-1">
          <Heart className="w-3 h-3" />
          Avg Heart Rate
        </span>
        <div className="flex items-baseline gap-1 mt-1 font-mono">
          <span className="text-xl font-bold text-slate-200">{stats.count > 0 ? `${stats.hrAvg} BPM` : '--'}</span>
        </div>
      </div>

      {/* 5. Avg SpO2 */}
      <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800">
        <span className="text-[11px] font-medium text-cyan-400 flex items-center gap-1">
          <Activity className="w-3 h-3" />
          Avg SpO2
        </span>
        <div className="flex items-baseline gap-1 mt-1 font-mono">
          <span className="text-xl font-bold text-slate-200">{stats.count > 0 ? `${stats.spO2Avg}%` : '--'}</span>
        </div>
      </div>

      {/* 6. Stability Index */}
      <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800">
        <span className="text-[11px] font-medium text-slate-400 block">Stability Index</span>
        <div className="flex items-center gap-1.5 mt-1 font-mono">
          <span className={`text-xl font-bold ${normalRatio >= 90 ? 'text-emerald-400' : 'text-amber-400'}`}>
            {normalRatio}%
          </span>
          {normalRatio >= 90 ? (
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          )}
        </div>
      </div>
    </div>
  );
};
