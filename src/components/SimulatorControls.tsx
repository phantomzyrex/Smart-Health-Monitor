import React from 'react';
import { Play, Square, Gauge, SlidersHorizontal, Sparkles } from 'lucide-react';

export type SimulationProfile = 'normal' | 'fever' | 'tachycardia' | 'hypoxemia' | 'fluctuating';

interface SimulatorControlsProps {
  isSimulating: boolean;
  onToggleSimulator: () => void;
  profile: SimulationProfile;
  onChangeProfile: (profile: SimulationProfile) => void;
  intervalMs: number;
  onChangeInterval: (ms: number) => void;
}

export const SimulatorControls: React.FC<SimulatorControlsProps> = ({
  isSimulating,
  onToggleSimulator,
  profile,
  onChangeProfile,
  intervalMs,
  onChangeInterval,
}) => {
  return (
    <div className="rounded-2xl border border-amber-900/40 bg-gradient-to-r from-amber-950/20 via-slate-900/80 to-slate-900/80 p-4 mb-6 shadow-md">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        {/* Title & Status */}
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-xl shrink-0 ${
              isSimulating ? 'bg-amber-500 text-slate-950 animate-pulse' : 'bg-slate-800 text-slate-400'
            }`}
          >
            <Gauge className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Live Hardware Stream Simulator
              </span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                  isSimulating
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {isSimulating ? 'STREAMING ACTIVE' : 'STANDBY'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Generates continuous telemetry to test abnormal alert conditions and Firebase sync
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center flex-wrap gap-3 w-full lg:w-auto justify-between lg:justify-end">
          {/* Profile Select */}
          <div className="flex items-center gap-2">
            <label htmlFor="sim-profile" className="text-xs text-slate-400 hidden sm:inline">
              Scenario:
            </label>
            <select
              id="sim-profile"
              value={profile}
              onChange={e => onChangeProfile(e.target.value as SimulationProfile)}
              className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-amber-300 font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="normal">Normal Baseline (36.8°C / 72 BPM / 99%)</option>
              <option value="fever">High Fever Spike (38.8°C / 112 BPM) [ALERT]</option>
              <option value="tachycardia">Tachycardia (135 BPM) [ALERT]</option>
              <option value="hypoxemia">Critical Hypoxemia (SpO2 87%) [ALERT]</option>
              <option value="fluctuating">Dynamic Random Patient</option>
            </select>
          </div>

          {/* Interval Select */}
          <div className="flex items-center gap-2">
            <label htmlFor="sim-interval" className="text-xs text-slate-400 hidden sm:inline">
              Rate:
            </label>
            <select
              id="sim-interval"
              value={intervalMs}
              onChange={e => onChangeInterval(Number(e.target.value))}
              className="bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value={1000}>1.0s</option>
              <option value={2000}>2.0s</option>
              <option value={3000}>3.0s</option>
              <option value={5000}>5.0s</option>
            </select>
          </div>

          {/* Start/Stop Button */}
          <button
            type="button"
            onClick={onToggleSimulator}
            aria-label={isSimulating ? 'Stop hardware simulation' : 'Start hardware simulation'}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 ${
              isSimulating
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/40'
                : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-950/40'
            }`}
          >
            {isSimulating ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>{isSimulating ? 'Stop Stream' : 'Start Stream'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
