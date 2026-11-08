import React, { useState } from 'react';
import { Download, Trash2, ArrowUpDown } from 'lucide-react';
import { VitalReading } from '../types/vitals';
import { DataSourceMode } from '../utils/vitalsEvaluator';

interface HistoryTableProps {
  history: VitalReading[];
  onClearHistory: () => void;
  useFahrenheit: boolean;
  searchQuery: string;
  dataSourceMode: DataSourceMode;
}

export const HistoryTable: React.FC<HistoryTableProps> = ({
  history,
  onClearHistory,
  useFahrenheit,
  searchQuery,
  dataSourceMode,
}) => {
  const [statusTab, setStatusTab] = useState<'all' | 'normal' | 'abnormal'>('all');

  const filteredHistory = history.filter(item => {
    if (statusTab === 'normal' && item.isAbnormal) return false;
    if (statusTab === 'abnormal' && !item.isAbnormal) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.deviceId.toLowerCase().includes(q) ||
        item.source.toLowerCase().includes(q) ||
        item.tempStatus.toLowerCase().includes(q) ||
        item.hrStatus.toLowerCase().includes(q) ||
        item.spO2Status.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const exportCSV = () => {
    if (filteredHistory.length === 0) return;
    const headers = [
      'Timestamp',
      'Device ID',
      'Temp C',
      'Temp F',
      'Heart Rate BPM',
      'SpO2 %',
      'Abnormal',
      'Source',
    ];
    const rows = filteredHistory.map(h => [
      h.timestamp,
      h.deviceId,
      h.temperatureC,
      h.temperatureF,
      h.heartRate,
      h.spO2,
      h.isAbnormal ? 'YES' : 'NO',
      h.source,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `smart_health_monitor_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Render a mini sparkline for each row matching "Last 7 days" in the reference screenshot
  const renderRowSparkline = (currentReading: VitalReading, rowIndex: number) => {
    const windowSlice = history.slice(rowIndex, rowIndex + 7).reverse();
    const values =
      windowSlice.length >= 2
        ? windowSlice.map(r => r.heartRate)
        : [
            currentReading.heartRate - 3,
            currentReading.heartRate - 1,
            currentReading.heartRate + 2,
            currentReading.heartRate - 2,
            currentReading.heartRate + 1,
            currentReading.heartRate,
          ];

    const min = Math.min(...values) - 2;
    const max = Math.max(...values) + 2;
    const w = 78;
    const h = 24;
    const pts = values.map((v, i) => {
      const x = 4 + (i / Math.max(1, values.length - 1)) * (w - 8);
      const y = h - 4 - ((v - min) / Math.max(1, max - min)) * (h - 8);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    const lastPt = pts[pts.length - 1].split(',').map(Number);
    const strokeColor = currentReading.isAbnormal ? '#dc4c3e' : '#34b379';

    return (
      <svg viewBox={`0 0 ${w} ${h}`} className="w-20 h-6 overflow-visible">
        <polyline
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={pts.join(' ')}
        />
        <circle cx={lastPt[0]} cy={lastPt[1]} r="2.5" fill={strokeColor} />
      </svg>
    );
  };

  return (
    <section className="glass-card rounded-[28px] p-6">
      {/* Top Bar matching "Portfolio Overview" with All | Normal | Abnormal tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5">
        <div>
          <h2 className="text-base font-semibold text-[#1e2432]">Telemetry Overview</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {dataSourceMode === 'realtime'
              ? `Showing real ESP32 sensor readings only (${filteredHistory.length} records)`
              : `Showing demo & sensor telemetry logs (${filteredHistory.length} records)`}
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          {/* Segmented Pill Filter matching All | Gainers | Losers */}
          <div className="flex items-center bg-white/60 backdrop-blur-md border border-white/80 rounded-full p-1 shadow-2xs">
            <button
              type="button"
              onClick={() => setStatusTab('all')}
              className={`px-3.5 py-1 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                statusTab === 'all'
                  ? 'bg-white text-[#1e2432] shadow-xs'
                  : 'text-slate-500 hover:text-[#1e2432]'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setStatusTab('normal')}
              className={`px-3.5 py-1 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                statusTab === 'normal'
                  ? 'bg-white text-[#1e2432] shadow-xs'
                  : 'text-slate-500 hover:text-[#1e2432]'
              }`}
            >
              Normal
            </button>
            <button
              type="button"
              onClick={() => setStatusTab('abnormal')}
              className={`px-3.5 py-1 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                statusTab === 'abnormal'
                  ? 'bg-white text-[#1e2432] shadow-xs'
                  : 'text-slate-500 hover:text-[#1e2432]'
              }`}
            >
              Abnormal
            </button>
          </div>

          <button
            type="button"
            onClick={exportCSV}
            disabled={filteredHistory.length === 0}
            aria-label="Export telemetry as CSV"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/70 hover:bg-white text-xs font-semibold text-slate-700 border border-white/80 shadow-2xs transition-colors disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>

          <button
            type="button"
            onClick={onClearHistory}
            disabled={history.length === 0}
            aria-label="Clear telemetry history"
            className="p-2 rounded-full bg-white/70 hover:bg-white text-slate-500 hover:text-rose-600 border border-white/80 shadow-2xs transition-colors disabled:opacity-40"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Clean Airy Table matching reference screenshot */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-xs font-medium text-slate-400 border-b border-slate-200/50">
              <th className="py-3 px-3 font-medium">Sensor Device</th>
              <th className="py-3 px-3 font-medium">
                <span className="inline-flex items-center gap-1">
                  Source <ArrowUpDown className="w-3 h-3 opacity-60" />
                </span>
              </th>
              <th className="py-3 px-3 font-medium">
                <span className="inline-flex items-center gap-1">
                  Body Temp <ArrowUpDown className="w-3 h-3 opacity-60" />
                </span>
              </th>
              <th className="py-3 px-3 font-medium">
                <span className="inline-flex items-center gap-1">
                  Heart Rate <ArrowUpDown className="w-3 h-3 opacity-60" />
                </span>
              </th>
              <th className="py-3 px-3 font-medium">
                <span className="inline-flex items-center gap-1">
                  SpO2 Sat <ArrowUpDown className="w-3 h-3 opacity-60" />
                </span>
              </th>
              <th className="py-3 px-3 font-medium">
                <span className="inline-flex items-center gap-1">
                  Time <ArrowUpDown className="w-3 h-3 opacity-60" />
                </span>
              </th>
              <th className="py-3 px-3 font-medium">
                <span className="inline-flex items-center gap-1">
                  Risk Level <ArrowUpDown className="w-3 h-3 opacity-60" />
                </span>
              </th>
              <th className="py-3 px-3 font-medium text-right">
                <span className="inline-flex items-center justify-end gap-1">
                  Pulse Trend <ArrowUpDown className="w-3 h-3 opacity-60" />
                </span>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-white/40 text-xs text-[#1e2432]">
            {filteredHistory.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-10 text-center text-slate-500">
                  {dataSourceMode === 'realtime'
                    ? 'No real-time ESP32 sensor readings received yet. Send data from your ESP32 or switch to Demo Mode.'
                    : 'No matching telemetry records found.'}
                </td>
              </tr>
            ) : (
              filteredHistory.slice(0, 15).map((item, idx) => {
                const tempVal = useFahrenheit
                  ? `${item.temperatureF.toFixed(1)} °F`
                  : `${item.temperatureC.toFixed(1)} °C`;

                const isCritical =
                  item.spO2Status === 'critical' ||
                  item.temperatureC >= 39.0 ||
                  item.heartRate >= 130;

                return (
                  <tr
                    key={item.id}
                    className="hover:bg-white/40 transition-colors group"
                  >
                    <td className="py-3.5 px-3 font-semibold text-[#1e2432] whitespace-nowrap">
                      {item.deviceId}
                    </td>
                    <td className="py-3.5 px-3 text-slate-600 capitalize whitespace-nowrap">
                      {item.source === 'esp32'
                        ? 'ESP32 Sensor'
                        : item.source === 'simulator'
                        ? 'Demo Stream'
                        : 'Manual Input'}
                    </td>
                    <td className="py-3.5 px-3 font-semibold font-mono whitespace-nowrap">
                      {tempVal}
                    </td>
                    <td className="py-3.5 px-3 font-semibold font-mono whitespace-nowrap">
                      {item.heartRate} BPM
                    </td>
                    <td className="py-3.5 px-3 font-semibold font-mono whitespace-nowrap">
                      {item.spO2}%
                    </td>
                    <td className="py-3.5 px-3 text-slate-500 font-mono whitespace-nowrap">
                      {new Date(item.timestamp).toLocaleTimeString([], {
                        hour12: false,
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      {!item.isAbnormal ? (
                        <span className="inline-block px-3 py-1 rounded-lg text-xs font-semibold bg-[#cbe3d6] text-[#2b6648]">
                          Low
                        </span>
                      ) : isCritical ? (
                        <span className="inline-block px-3 py-1 rounded-lg text-xs font-semibold bg-[#f2cbc6] text-[#9c3931]">
                          High
                        </span>
                      ) : (
                        <span className="inline-block px-3 py-1 rounded-lg text-xs font-semibold bg-[#c2d4f0] text-[#35548c]">
                          Medium
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-3 flex justify-end">
                      {renderRowSparkline(item, idx)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};
