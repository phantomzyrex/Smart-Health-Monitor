import React from 'react';
import { X, Bell, AlertTriangle, AlertOctagon, CheckCircle2, Trash2 } from 'lucide-react';
import { AlertLog } from '../types/vitals';

interface AlertsHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: AlertLog[];
  onAcknowledgeAlert: (alertId: string) => void;
  onClearAlerts: () => void;
}

export const AlertsHistoryModal: React.FC<AlertsHistoryModalProps> = ({
  isOpen,
  onClose,
  alerts,
  onAcknowledgeAlert,
  onClearAlerts,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-500/15 text-rose-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Abnormal Sensor Alarms Audit Log</h3>
              <p className="text-xs text-slate-400">
                Detailed record of all threshold breaches and security alerts
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close alerts audit log modal"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable list */}
        <div className="p-5 space-y-3 overflow-y-auto flex-1">
          {alerts.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
              <p className="text-sm font-semibold text-slate-200">No abnormal alarms recorded</p>
              <p className="text-xs text-slate-500 mt-1">
                All patient vitals are within safe medical thresholds.
              </p>
            </div>
          ) : (
            alerts.map(alert => (
              <div
                key={alert.id}
                className={`p-4 rounded-xl border flex items-start justify-between gap-3 transition-colors ${
                  alert.severity === 'critical'
                    ? 'bg-rose-950/40 border-rose-800/80 text-rose-100'
                    : 'bg-amber-950/30 border-amber-800/70 text-amber-100'
                } ${alert.acknowledged ? 'opacity-60' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                      alert.severity === 'critical' ? 'bg-rose-600 text-white' : 'bg-amber-600 text-slate-950'
                    }`}
                  >
                    {alert.severity === 'critical' ? (
                      <AlertOctagon className="w-4 h-4" />
                    ) : (
                      <AlertTriangle className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider font-mono">
                        {alert.alertType}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                      {alert.acknowledged && (
                        <span className="text-[10px] px-2 py-0.2 rounded-full bg-slate-800 text-slate-400 font-medium">
                          Acknowledged
                        </span>
                      )}
                    </div>
                    <p className="text-xs mt-1 font-medium text-slate-200">{alert.message}</p>
                    <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400 mt-2">
                      <span>Recorded: {alert.value}</span>
                      <span>•</span>
                      <span>Threshold: {alert.threshold}</span>
                      <span>•</span>
                      <span>Device: {alert.deviceId}</span>
                    </div>
                  </div>
                </div>

                {!alert.acknowledged && (
                  <button
                    type="button"
                    onClick={() => onAcknowledgeAlert(alert.id)}
                    className="shrink-0 px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                  >
                    Ack
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClearAlerts}
            disabled={alerts.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Log</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
