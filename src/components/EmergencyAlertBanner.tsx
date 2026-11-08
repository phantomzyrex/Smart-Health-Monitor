import React from 'react';
import { AlertOctagon, Volume2, VolumeX, CheckCircle, BellRing } from 'lucide-react';
import { AlertLog } from '../types/vitals';

interface EmergencyAlertBannerProps {
  alerts: AlertLog[];
  audioAlarmActive: boolean;
  onSilenceAlarm: () => void;
  onAcknowledgeAll: () => void;
  onOpenAlertsModal: () => void;
}

export const EmergencyAlertBanner: React.FC<EmergencyAlertBannerProps> = ({
  alerts,
  audioAlarmActive,
  onSilenceAlarm,
  onAcknowledgeAll,
  onOpenAlertsModal,
}) => {
  if (alerts.length === 0) return null;

  const hasCritical = alerts.some(a => a.severity === 'critical');

  return (
    <div
      role="alert"
      className={`w-full rounded-3xl p-4 mb-5 border backdrop-blur-xl transition-all ${
        hasCritical
          ? 'bg-[#f8dcd8]/90 border-[#e59890] text-[#782620] shadow-md'
          : 'bg-[#f9e8d8]/90 border-[#e8b892] text-[#78431b] shadow-sm'
      }`}
    >
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div
            className={`p-2.5 rounded-2xl shrink-0 mt-0.5 ${
              hasCritical ? 'bg-[#c9453b] text-white' : 'bg-[#df7841] text-white'
            }`}
          >
            <AlertOctagon className="w-5 h-5" />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider">
                {hasCritical ? 'Critical Vital Sign Alert' : 'Threshold Warning'}
              </span>
              <span className="text-xs font-mono opacity-75">
                · {alerts.length} active {alerts.length === 1 ? 'breach' : 'breaches'}
              </span>
            </div>

            <div className="mt-1 space-y-0.5">
              {alerts.slice(0, 2).map(alert => (
                <p key={alert.id} className="text-xs font-medium">
                  {alert.message}
                </p>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 w-full lg:w-auto justify-end">
          <button
            type="button"
            onClick={onSilenceAlarm}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white/75 hover:bg-white text-[#1e2432] border border-white transition-colors"
          >
            {audioAlarmActive ? <Volume2 className="w-3.5 h-3.5 text-[#c9453b]" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span>{audioAlarmActive ? 'Silence Alarm' : 'Muted'}</span>
          </button>

          <button
            type="button"
            onClick={onAcknowledgeAll}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold bg-[#1a1f2c] hover:bg-slate-800 text-white transition-colors"
          >
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>Dismiss</span>
          </button>

          <button
            type="button"
            onClick={onOpenAlertsModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white/75 hover:bg-white text-[#1e2432] border border-white transition-colors"
          >
            <BellRing className="w-3.5 h-3.5" />
            <span>Log</span>
          </button>
        </div>
      </div>
    </div>
  );
};
