import React from 'react';
import {
  Search,
  Settings,
  Bell,
  Volume2,
  VolumeX,
  Radio,
  Sparkles,
  Plus,
  Play,
  Square,
} from 'lucide-react';
import { DataSourceMode, SimulationProfile } from '../utils/vitalsEvaluator';

interface HeaderProps {
  dataSourceMode: DataSourceMode;
  onChangeDataSourceMode: (mode: DataSourceMode) => void;
  isCloudSynced: boolean;
  isSimulating: boolean;
  onToggleSimulator: () => void;
  simProfile: SimulationProfile;
  onChangeSimProfile: (profile: SimulationProfile) => void;
  audioMuted: boolean;
  onToggleAudioMute: () => void;
  searchQuery: string;
  onChangeSearchQuery: (q: string) => void;
  onOpenManualModal: () => void;
  onOpenThresholdModal: () => void;
  onOpenCodeModal: () => void;
  onOpenAlertsModal: () => void;
  unreadAlertCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  dataSourceMode,
  onChangeDataSourceMode,
  isCloudSynced,
  isSimulating,
  onToggleSimulator,
  simProfile,
  onChangeSimProfile,
  audioMuted,
  onToggleAudioMute,
  searchQuery,
  onChangeSearchQuery,
  onOpenManualModal,
  onOpenThresholdModal,
  onOpenAlertsModal,
  unreadAlertCount,
}) => {
  return (
    <header className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-3 pb-4">
      {/* Zone 1: Brand Title */}
      <div className="flex items-center gap-3 shrink-0">
        <h1 className="text-2xl sm:text-[26px] font-semibold tracking-tight text-[#1a1f2c] whitespace-nowrap">
          Smart Health Monitor
        </h1>
      </div>

      {/* Zone 2: Center Search Pill & Mode Switcher on a single clean row */}
      <div className="flex flex-wrap xl:flex-nowrap items-center gap-2.5 w-full xl:w-auto justify-start xl:justify-center">
        {/* Search Input Pill matching reference image */}
        <div className="flex items-center gap-2 bg-white/65 backdrop-blur-md border border-white/80 rounded-full pl-3.5 pr-1.5 py-1.5 shadow-xs w-56 sm:w-64 shrink-0">
          <Search className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => onChangeSearchQuery(e.target.value)}
            placeholder="Search..."
            aria-label="Search telemetry records"
            className="bg-transparent text-xs text-[#1e2432] placeholder:text-slate-500 focus:outline-none w-full"
          />
          <span className="px-2 py-0.5 rounded-full bg-white/90 text-[10px] font-semibold text-slate-600 shadow-2xs whitespace-nowrap shrink-0">
            {isCloudSynced ? '⌘ Live' : 'Local'}
          </span>
        </div>

        {/* Real-Time Sensors vs Demo Mode Switcher */}
        <div
          role="group"
          aria-label="Data source mode"
          className="flex items-center bg-white/65 backdrop-blur-md border border-white/80 rounded-full p-1 shadow-xs shrink-0"
        >
          <button
            type="button"
            onClick={() => onChangeDataSourceMode('realtime')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
              dataSourceMode === 'realtime'
                ? 'bg-[#1a1f2c] text-white shadow-xs'
                : 'text-slate-600 hover:text-[#1a1f2c]'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-[#df7841]" />
            <span>Real-Time Sensors</span>
          </button>

          <button
            type="button"
            onClick={() => onChangeDataSourceMode('demo')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
              dataSourceMode === 'demo'
                ? 'bg-[#df7841] text-white shadow-xs'
                : 'text-slate-600 hover:text-[#1a1f2c]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Demo Mode</span>
          </button>
        </div>

        {/* Compact Demo Controls when Demo Mode is active */}
        {dataSourceMode === 'demo' && (
          <div className="flex items-center gap-1.5 bg-white/65 backdrop-blur-md border border-white/80 rounded-full pl-3 pr-1 py-1 shadow-xs shrink-0">
            <select
              aria-label="Simulation scenario"
              value={simProfile}
              onChange={e => onChangeSimProfile(e.target.value as SimulationProfile)}
              className="bg-transparent text-xs font-medium text-[#1e2432] focus:outline-none cursor-pointer"
            >
              <option value="normal">Normal Vitals</option>
              <option value="fever">Fever Spike</option>
              <option value="tachycardia">High Pulse</option>
              <option value="hypoxemia">Low SpO2</option>
              <option value="fluctuating">Dynamic</option>
            </select>
            <button
              type="button"
              onClick={onToggleSimulator}
              aria-label={isSimulating ? 'Pause demo stream' : 'Start live demo stream'}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors whitespace-nowrap shrink-0 ${
                isSimulating
                  ? 'bg-rose-500 text-white'
                  : 'bg-[#1a1f2c] text-white hover:bg-slate-800'
              }`}
            >
              {isSimulating ? <Square className="w-2.5 h-2.5 fill-current" /> : <Play className="w-2.5 h-2.5 fill-current" />}
              <span>{isSimulating ? 'Stop' : 'Stream'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Zone 3: Right Circular Action Buttons matching reference image */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onOpenManualModal}
          aria-label="Log manual vital sign reading"
          className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-white/75 hover:bg-white text-[#1e2432] border border-white/80 text-xs font-semibold shadow-xs transition-all whitespace-nowrap shrink-0"
        >
          <Plus className="w-3.5 h-3.5 text-[#df7841]" />
          <span>Log Reading</span>
        </button>

        <button
          type="button"
          onClick={onToggleAudioMute}
          aria-label={audioMuted ? 'Unmute alert alarm' : 'Mute alert alarm'}
          className="w-9 h-9 rounded-full bg-white/70 hover:bg-white border border-white/80 flex items-center justify-center text-[#334155] shadow-xs transition-colors"
        >
          {audioMuted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-[#df7841]" />}
        </button>

        <button
          type="button"
          onClick={onOpenThresholdModal}
          aria-label="Configure vital threshold limits"
          className="w-9 h-9 rounded-full bg-white/70 hover:bg-white border border-white/80 flex items-center justify-center text-[#334155] shadow-xs transition-colors"
        >
          <Settings className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={onOpenAlertsModal}
          aria-label={`View Alert Logs (${unreadAlertCount} unacknowledged)`}
          className="relative w-9 h-9 rounded-full bg-white/70 hover:bg-white border border-white/80 flex items-center justify-center text-[#334155] shadow-xs transition-colors"
        >
          <Bell className="w-4 h-4" />
          {unreadAlertCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#df7841] text-white text-[10px] font-bold flex items-center justify-center">
              {unreadAlertCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};
