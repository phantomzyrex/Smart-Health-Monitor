import React, { useState } from 'react';
import { X, Sliders, RotateCcw, Save, ShieldAlert, Check } from 'lucide-react';
import { ThresholdConfig } from '../types/vitals';
import { DEFAULT_THRESHOLDS } from '../utils/vitalsEvaluator';

interface ThresholdSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  thresholds: ThresholdConfig;
  onSave: (config: ThresholdConfig) => Promise<void>;
  useFahrenheit: boolean;
}

export const ThresholdSettingsModal: React.FC<ThresholdSettingsModalProps> = ({
  isOpen,
  onClose,
  thresholds,
  onSave,
  useFahrenheit,
}) => {
  const [config, setConfig] = useState<ThresholdConfig>({ ...thresholds });
  const [saved, setSaved] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleReset = () => {
    setConfig({ ...DEFAULT_THRESHOLDS });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(config);
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        onClose();
      }, 1000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-500/15 text-rose-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Alert Safety Thresholds</h3>
              <p className="text-xs text-slate-400">
                Trigger visual & audible alarms when sensors breach these limits
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close thresholds configuration modal"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-5 space-y-5">
          {/* Temperature Section */}
          <div className="space-y-3 pb-3 border-b border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                DS18B20 Temperature Limits (°C)
              </span>
              <span className="text-[11px] text-slate-400">
                Medical Standard: 36.5–37.5°C
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="temp-high" className="block text-xs text-slate-300 mb-1">
                  High Fever Alert (&ge;)
                </label>
                <div className="relative">
                  <input
                    id="temp-high"
                    type="number"
                    step="0.1"
                    required
                    value={config.tempHigh}
                    onChange={e => setConfig({ ...config, tempHigh: parseFloat(e.target.value) || 37.8 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400">°C</span>
                </div>
              </div>

              <div>
                <label htmlFor="temp-low" className="block text-xs text-slate-300 mb-1">
                  Hypothermia Alert (&le;)
                </label>
                <div className="relative">
                  <input
                    id="temp-low"
                    type="number"
                    step="0.1"
                    required
                    value={config.tempLow}
                    onChange={e => setConfig({ ...config, tempLow: parseFloat(e.target.value) || 35.5 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400">°C</span>
                </div>
              </div>
            </div>
          </div>

          {/* Heart Rate Section */}
          <div className="space-y-3 pb-3 border-b border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
                MAX30102 Heart Rate Limits (BPM)
              </span>
              <span className="text-[11px] text-slate-400">
                Resting Range: 60–100 BPM
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="hr-high" className="block text-xs text-slate-300 mb-1">
                  Tachycardia High (&gt;)
                </label>
                <div className="relative">
                  <input
                    id="hr-high"
                    type="number"
                    min="60"
                    max="220"
                    required
                    value={config.hrHigh}
                    onChange={e => setConfig({ ...config, hrHigh: parseInt(e.target.value, 10) || 100 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400">BPM</span>
                </div>
              </div>

              <div>
                <label htmlFor="hr-low" className="block text-xs text-slate-300 mb-1">
                  Bradycardia Low (&lt;)
                </label>
                <div className="relative">
                  <input
                    id="hr-low"
                    type="number"
                    min="30"
                    max="90"
                    required
                    value={config.hrLow}
                    onChange={e => setConfig({ ...config, hrLow: parseInt(e.target.value, 10) || 60 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400">BPM</span>
                </div>
              </div>
            </div>
          </div>

          {/* SpO2 Section */}
          <div className="space-y-3 pb-3 border-b border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                MAX30102 Blood Oxygen Limits (%)
              </span>
              <span className="text-[11px] text-slate-400">
                Optimal: 95–100%
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="spo2-low" className="block text-xs text-slate-300 mb-1">
                  Mild Hypoxemia Warning (&lt;)
                </label>
                <div className="relative">
                  <input
                    id="spo2-low"
                    type="number"
                    min="70"
                    max="99"
                    required
                    value={config.spO2Low}
                    onChange={e => setConfig({ ...config, spO2Low: parseInt(e.target.value, 10) || 95 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400">%</span>
                </div>
              </div>

              <div>
                <label htmlFor="spo2-crit" className="block text-xs text-slate-300 mb-1">
                  Critical Hypoxia Alert (&le;)
                </label>
                <div className="relative">
                  <input
                    id="spo2-crit"
                    type="number"
                    min="50"
                    max="95"
                    required
                    value={config.spO2Critical}
                    onChange={e => setConfig({ ...config, spO2Critical: parseInt(e.target.value, 10) || 90 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400">%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Audible Alarm Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
            <div>
              <span className="text-xs font-semibold text-slate-200 block">
                Enable Audible Siren on Breach
              </span>
              <span className="text-[11px] text-slate-400">
                Plays medical telemetry sound alarm when values are abnormal
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.audioAlarmEnabled}
                onChange={e => setConfig({ ...config, audioAlarmEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Defaults</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-950/40 transition-all active:scale-95 disabled:opacity-50"
              >
                {saved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                <span>{saved ? 'Saved!' : saving ? 'Saving...' : 'Save Thresholds'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
