import React, { useState } from 'react';
import { X, Send, Sparkles, AlertCircle, CheckCircle } from 'lucide-react';
import { ThresholdConfig, VitalReading } from '../types/vitals';
import { createVitalReading } from '../utils/vitalsEvaluator';

interface ManualDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reading: VitalReading) => Promise<void>;
  thresholds: ThresholdConfig;
  useFahrenheit: boolean;
}

export const ManualDataModal: React.FC<ManualDataModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  thresholds,
  useFahrenheit,
}) => {
  const [tempInput, setTempInput] = useState<string>('37.0');
  const [hrInput, setHrInput] = useState<string>('75');
  const [spO2Input, setSpO2Input] = useState<string>('98');
  const [deviceId, setDeviceId] = useState<string>('ESP32-VITALS-01');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleApplyPreset = (tempC: number, hr: number, spO2: number) => {
    setTempInput(useFahrenheit ? ((tempC * 9) / 5 + 32).toFixed(1) : tempC.toFixed(1));
    setHrInput(hr.toString());
    setSpO2Input(spO2.toString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const rawTemp = parseFloat(tempInput);
    const hr = parseInt(hrInput, 10);
    const spO2 = parseInt(spO2Input, 10);

    if (isNaN(rawTemp) || isNaN(hr) || isNaN(spO2)) {
      return;
    }

    const tempC = useFahrenheit ? ((rawTemp - 32) * 5) / 9 : rawTemp;

    setSubmitting(true);
    try {
      const reading = createVitalReading({
        deviceId: deviceId.trim() || 'ESP32-VITALS-01',
        temperatureC: tempC,
        heartRate: hr,
        spO2,
        source: 'manual',
        thresholds,
      });

      await onSubmit(reading);
      setSuccessMsg('Telemetry reading successfully sent to Firebase Cloud & Dashboard!');
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 1200);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-rose-500" />
              Manual Vital Signs Entry
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Input custom readings directly from your test bench or clinical sensor
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close manual data entry modal"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Quick Presets */}
          <div>
            <span className="text-xs font-semibold text-slate-300 block mb-2">
              Quick Test Presets (Click to load):
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleApplyPreset(36.8, 72, 99)}
                className="px-2.5 py-1.5 rounded-lg text-left bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs text-emerald-300 transition-colors"
              >
                <div className="font-semibold">Normal Resting</div>
                <div className="text-[10px] text-slate-400">36.8°C • 72 BPM • 99%</div>
              </button>

              <button
                type="button"
                onClick={() => handleApplyPreset(38.8, 115, 96)}
                className="px-2.5 py-1.5 rounded-lg text-left bg-rose-950/40 hover:bg-rose-950/70 border border-rose-800/60 text-xs text-rose-300 transition-colors"
              >
                <div className="font-semibold">Fever & Tachycardia</div>
                <div className="text-[10px] text-rose-400">38.8°C • 115 BPM (Alert)</div>
              </button>

              <button
                type="button"
                onClick={() => handleApplyPreset(36.9, 98, 88)}
                className="px-2.5 py-1.5 rounded-lg text-left bg-cyan-950/40 hover:bg-cyan-950/70 border border-cyan-800/60 text-xs text-cyan-300 transition-colors"
              >
                <div className="font-semibold">Severe Hypoxemia</div>
                <div className="text-[10px] text-cyan-400">SpO2 88% (Critical)</div>
              </button>

              <button
                type="button"
                onClick={() => handleApplyPreset(37.3, 145, 98)}
                className="px-2.5 py-1.5 rounded-lg text-left bg-amber-950/40 hover:bg-amber-950/70 border border-amber-800/60 text-xs text-amber-300 transition-colors"
              >
                <div className="font-semibold">High Pulse Rate</div>
                <div className="text-[10px] text-amber-400">145 BPM (High Alert)</div>
              </button>

              <button
                type="button"
                onClick={() => handleApplyPreset(34.8, 52, 97)}
                className="px-2.5 py-1.5 rounded-lg text-left bg-sky-950/40 hover:bg-sky-950/70 border border-sky-800/60 text-xs text-sky-300 transition-colors"
              >
                <div className="font-semibold">Hypothermia</div>
                <div className="text-[10px] text-sky-400">34.8°C • 52 BPM (Alert)</div>
              </button>

              <button
                type="button"
                onClick={() => handleApplyPreset(39.2, 130, 89)}
                className="px-2.5 py-1.5 rounded-lg text-left bg-red-950/60 hover:bg-red-950/80 border border-red-700 text-xs text-red-200 transition-colors"
              >
                <div className="font-semibold text-red-300">Triple Alert!</div>
                <div className="text-[10px] text-red-400">Fever + High HR + Low SpO2</div>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Temperature */}
              <div>
                <label htmlFor="temp-input" className="block text-xs font-medium text-slate-300 mb-1">
                  Body Temp ({useFahrenheit ? '°F' : '°C'})
                </label>
                <input
                  id="temp-input"
                  type="number"
                  step="0.1"
                  required
                  value={tempInput}
                  onChange={e => setTempInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">DS18B20 Reading</span>
              </div>

              {/* Heart Rate */}
              <div>
                <label htmlFor="hr-input" className="block text-xs font-medium text-slate-300 mb-1">
                  Heart Rate (BPM)
                </label>
                <input
                  id="hr-input"
                  type="number"
                  min="20"
                  max="250"
                  required
                  value={hrInput}
                  onChange={e => setHrInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">MAX30102 Pulse</span>
              </div>

              {/* SpO2 */}
              <div>
                <label htmlFor="spo2-input" className="block text-xs font-medium text-slate-300 mb-1">
                  Blood Oxygen (%)
                </label>
                <input
                  id="spo2-input"
                  type="number"
                  min="50"
                  max="100"
                  required
                  value={spO2Input}
                  onChange={e => setSpO2Input(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">MAX30102 SpO2</span>
              </div>
            </div>

            {/* Device ID */}
            <div>
              <label htmlFor="device-id-input" className="block text-xs font-medium text-slate-300 mb-1">
                Device Identifier
              </label>
              <input
                id="device-id-input"
                type="text"
                value={deviceId}
                onChange={e => setDeviceId(e.target.value)}
                placeholder="e.g. ESP32-VITALS-01"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500 text-emerald-200 text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-950/40 transition-all active:scale-95 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{submitting ? 'Recording...' : 'Publish Reading'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
