import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {
  Activity,
  Home,
  Radio,
  Sparkles,
  PlusCircle,
  Sliders,
  Info,
  Bell,
} from 'lucide-react';
import { Header } from './components/Header';
import { EmergencyAlertBanner } from './components/EmergencyAlertBanner';
import { TelemetryCharts } from './components/TelemetryCharts';
import { HistoryTable } from './components/HistoryTable';
import { ManualDataModal } from './components/ManualDataModal';
import { ThresholdSettingsModal } from './components/ThresholdSettingsModal';
import { Esp32HardwareGuideModal } from './components/Esp32HardwareGuideModal';
import { AlertsHistoryModal } from './components/AlertsHistoryModal';
import {
  AlertLog,
  ThresholdConfig,
  VitalReading,
} from './types/vitals';
import {
  DEFAULT_THRESHOLDS,
  DataSourceMode,
  SimulationProfile,
  createVitalReading,
  detectAlerts,
  generateDemoReading,
  filterReadingsByMode,
  createDemoSeedHistory,
} from './utils/vitalsEvaluator';
import {
  testFirestoreConnection,
  saveVitalReadingToFirestore,
  saveAlertLogToFirestore,
  saveThresholdConfigToFirestore,
  subscribeToLatestVitals,
} from './services/firebase';
import {
  playHeartbeatBeep,
  startAudibleAlarmLoop,
  stopAudibleAlarmLoop,
} from './utils/audioAlarm';

export default function App() {
  const [thresholds, setThresholds] = useState<ThresholdConfig>(DEFAULT_THRESHOLDS);
  const [useFahrenheit, setUseFahrenheit] = useState<boolean>(false);
  const [audioMuted, setAudioMuted] = useState<boolean>(false);
  const [isCloudSynced, setIsCloudSynced] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Mode state: 'demo' (with rich seeded curves & live simulator) vs 'realtime' (strictly real ESP32 sensor packets)
  const [dataSourceMode, setDataSourceMode] = useState<DataSourceMode>('demo');
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simProfile, setSimProfile] = useState<SimulationProfile>('normal');

  // Initial seeded demo history so graphs & table match reference image out of the box
  const initialDemoSeed = useMemo(() => createDemoSeedHistory(DEFAULT_THRESHOLDS), []);
  const [allReadings, setAllReadings] = useState<VitalReading[]>(initialDemoSeed);
  const [activeAlerts, setActiveAlerts] = useState<AlertLog[]>([]);
  const [alertHistory, setAlertHistory] = useState<AlertLog[]>([]);

  // Modals state
  const [isManualModalOpen, setIsManualModalOpen] = useState<boolean>(false);
  const [isThresholdModalOpen, setIsThresholdModalOpen] = useState<boolean>(false);
  const [isCodeModalOpen, setIsCodeModalOpen] = useState<boolean>(false);
  const [isAlertsModalOpen, setIsAlertsModalOpen] = useState<boolean>(false);

  // Refs for fresh state inside intervals/callbacks
  const thresholdsRef = useRef<ThresholdConfig>(thresholds);
  const audioMutedRef = useRef<boolean>(audioMuted);
  const isCloudSyncedRef = useRef<boolean>(isCloudSynced);
  const dataSourceModeRef = useRef<DataSourceMode>(dataSourceMode);

  useEffect(() => {
    thresholdsRef.current = thresholds;
  }, [thresholds]);

  useEffect(() => {
    audioMutedRef.current = audioMuted;
  }, [audioMuted]);

  useEffect(() => {
    isCloudSyncedRef.current = isCloudSynced;
  }, [isCloudSynced]);

  useEffect(() => {
    dataSourceModeRef.current = dataSourceMode;
  }, [dataSourceMode]);

  // Filtered readings based on active mode ('realtime' shows ONLY source === 'esp32')
  const visibleHistory = useMemo(
    () => filterReadingsByMode(allReadings, dataSourceMode),
    [allReadings, dataSourceMode]
  );

  const latestVisibleReading = visibleHistory.length > 0 ? visibleHistory[0] : null;

  // Switch between Real-Time Sensors and Demo Mode
  const handleChangeDataSourceMode = (mode: DataSourceMode) => {
    setDataSourceMode(mode);
    if (mode === 'realtime') {
      setIsSimulating(false);
    }
  };

  // Recompute active alerts whenever latestVisibleReading or thresholds change
  useEffect(() => {
    if (!latestVisibleReading) {
      setActiveAlerts([]);
      return;
    }
    const alerts = detectAlerts(latestVisibleReading, thresholds);
    setActiveAlerts(alerts);
  }, [latestVisibleReading, thresholds]);

  // Audio Alarm management based on active alerts
  useEffect(() => {
    if (activeAlerts.length > 0 && thresholds.audioAlarmEnabled && !audioMuted) {
      startAudibleAlarmLoop();
    } else {
      stopAudibleAlarmLoop();
    }
  }, [activeAlerts, thresholds.audioAlarmEnabled, audioMuted]);

  // Process a newly arrived vital reading
  const handleProcessReading = useCallback(async (reading: VitalReading, persistToCloud = true) => {
    setAllReadings(prev => {
      if (prev.some(r => r.id === reading.id)) return prev;
      return [reading, ...prev].slice(0, 150);
    });

    // Subtle audio blip for pulse rhythm if visible in current mode
    if (
      !audioMutedRef.current &&
      reading.heartRate > 40 &&
      (dataSourceModeRef.current === 'demo' || reading.source === 'esp32')
    ) {
      playHeartbeatBeep(700, 0.03);
    }

    const alerts = detectAlerts(reading, thresholdsRef.current);
    if (alerts.length > 0) {
      setAlertHistory(prev => [...alerts, ...prev].slice(0, 80));
      if (persistToCloud && isCloudSyncedRef.current) {
        for (const alert of alerts) {
          saveAlertLogToFirestore(alert).catch(err => {
            console.warn('Firestore alert sync notification:', err);
          });
        }
      }
    }

    if (persistToCloud && isCloudSyncedRef.current) {
      saveVitalReadingToFirestore(reading).catch(err => {
        console.warn('Firestore vital write status:', err);
      });
    }
  }, []);

  // Check initial Firebase connection & subscribe to live vitals
  useEffect(() => {
    let unsubscribeFirebase: (() => void) | null = null;

    testFirestoreConnection().then(connected => {
      setIsCloudSynced(connected);
      if (connected) {
        try {
          unsubscribeFirebase = subscribeToLatestVitals(
            remoteReadings => {
              if (remoteReadings.length > 0) {
                setAllReadings(prev => {
                  const byId = new Map<string, VitalReading>();
                  for (const item of prev) {
                    byId.set(item.id, item);
                  }
                  let added = false;
                  for (const remote of remoteReadings) {
                    if (!byId.has(remote.id)) {
                      byId.set(remote.id, remote);
                      added = true;
                    }
                  }
                  if (!added) return prev;
                  const merged = Array.from(byId.values());
                  merged.sort(
                    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                  );
                  return merged.slice(0, 150);
                });
              }
            },
            err => {
              console.warn('Firebase subscription status:', err.message);
            }
          );
        } catch (err) {
          console.warn('Firebase subscribe notice:', err);
        }
      }
    });

    return () => {
      if (unsubscribeFirebase) unsubscribeFirebase();
    };
  }, []);

  // Hardware polling: Check `/api/telemetry` for live ESP32 HTTP POST data
  useEffect(() => {
    const lastIdRef = { current: '' };

    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/telemetry');
        if (res.ok) {
          const data = await res.json();
          if (data && data.latest && data.latest.id !== lastIdRef.current) {
            lastIdRef.current = data.latest.id;
            const newReading = createVitalReading({
              id: data.latest.id,
              deviceId: data.latest.deviceId || 'ESP32-VITALS-01',
              temperatureC: data.latest.temperatureC,
              heartRate: data.latest.heartRate,
              spO2: data.latest.spO2,
              source: 'esp32',
              timestamp: data.latest.timestamp,
              thresholds: thresholdsRef.current,
            });
            handleProcessReading(newReading, true);
          }
        }
      } catch {
        // Ignore poll error when hardware endpoint is idle
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [handleProcessReading]);

  // Demo Mode Live Simulation Loop
  useEffect(() => {
    if (!isSimulating || dataSourceMode !== 'demo') return;

    const timer = setInterval(() => {
      const demoReading = generateDemoReading(simProfile, thresholdsRef.current);
      handleProcessReading(demoReading, true);
    }, 2000);

    return () => clearInterval(timer);
  }, [isSimulating, dataSourceMode, simProfile, handleProcessReading]);

  const handleAcknowledgeAll = () => {
    setActiveAlerts([]);
    stopAudibleAlarmLoop();
    setAlertHistory(prev => prev.map(a => ({ ...a, acknowledged: true })));
  };

  const handleAcknowledgeSingleAlert = (alertId: string) => {
    setAlertHistory(prev =>
      prev.map(a => (a.id === alertId ? { ...a, acknowledged: true } : a))
    );
    setActiveAlerts(prev => prev.filter(a => a.id !== alertId));
  };

  const handleSilenceAlarm = () => {
    stopAudibleAlarmLoop();
    setAudioMuted(true);
  };

  const handleSaveThresholds = async (newConfig: ThresholdConfig) => {
    setThresholds(newConfig);
    if (isCloudSyncedRef.current) {
      try {
        await saveThresholdConfigToFirestore(newConfig);
      } catch (err) {
        console.warn('Threshold save notice:', err);
      }
    }
  };

  const handleManualSubmit = async (reading: VitalReading) => {
    await handleProcessReading(reading, true);
  };

  const handleClearHistory = () => {
    if (dataSourceMode === 'realtime') {
      setAllReadings(prev => prev.filter(r => r.source !== 'esp32'));
    } else {
      setAllReadings(initialDemoSeed.slice(0, 1));
    }
  };

  const unreadAlertCount = alertHistory.filter(a => !a.acknowledged).length;

  return (
    <div className="min-h-screen w-full p-2 sm:p-4 lg:p-6 flex items-stretch">
      {/* Main Full-Page Frosted Glass Dashboard Container matching Reference Screenshot */}
      <div className="glass-shell rounded-[36px] w-full flex flex-col md:flex-row p-4 sm:p-6 lg:p-7 gap-5 lg:gap-7">
        {/* Left Vertical Icon Navigation Rail matching reference screenshot */}
        <aside
          aria-label="Primary Sidebar Navigation"
          className="flex md:flex-col items-center justify-between md:w-14 shrink-0 gap-4"
        >
          {/* Top Black Rounded-2xl Brand Icon */}
          <div
            title="Smart Health Monitor"
            className="w-12 h-12 rounded-2xl bg-[#14171f] text-white flex items-center justify-center shadow-md shrink-0"
          >
            <Activity className="w-5 h-5" />
          </div>

          {/* Center Navigation Icon Stack */}
          <nav className="flex md:flex-col items-center gap-3">
            <button
              type="button"
              onClick={() => handleChangeDataSourceMode('demo')}
              aria-label="Dashboard Overview"
              title="Dashboard Overview"
              className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${
                dataSourceMode === 'demo' && !isSimulating
                  ? 'bg-white text-[#df7841] shadow-sm'
                  : 'bg-white/50 hover:bg-white/80 text-slate-600'
              }`}
            >
              <Home className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => handleChangeDataSourceMode('realtime')}
              aria-label="Real-Time ESP32 Sensor Mode"
              title="Real-Time ESP32 Sensor Mode"
              className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${
                dataSourceMode === 'realtime'
                  ? 'bg-white text-[#df7841] shadow-sm'
                  : 'bg-white/50 hover:bg-white/80 text-slate-600'
              }`}
            >
              <Radio className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => {
                setDataSourceMode('demo');
                setIsSimulating(prev => !prev);
              }}
              aria-label="Toggle Demo Simulation Stream"
              title="Toggle Demo Simulation Stream"
              className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${
                dataSourceMode === 'demo' && isSimulating
                  ? 'bg-white text-[#df7841] shadow-sm'
                  : 'bg-white/50 hover:bg-white/80 text-slate-600'
              }`}
            >
              <Sparkles className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setIsManualModalOpen(true)}
              aria-label="Manual Vital Entry"
              title="Manual Vital Entry"
              className="w-11 h-11 rounded-2xl bg-white/50 hover:bg-white/80 text-slate-600 flex items-center justify-center transition-all"
            >
              <PlusCircle className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setIsThresholdModalOpen(true)}
              aria-label="Safety Threshold Settings"
              title="Safety Threshold Settings"
              className="w-11 h-11 rounded-2xl bg-white/50 hover:bg-white/80 text-slate-600 flex items-center justify-center transition-all"
            >
              <Sliders className="w-4 h-4" />
            </button>
          </nav>

          {/* Bottom Utility Icons */}
          <div className="hidden md:flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={() => setIsCodeModalOpen(true)}
              aria-label="ESP32 Hardware & Wiring Guide"
              title="ESP32 Hardware & Wiring Guide"
              className="w-11 h-11 rounded-2xl bg-white/50 hover:bg-white/80 text-slate-600 flex items-center justify-center transition-all"
            >
              <Info className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setIsAlertsModalOpen(true)}
              aria-label="Alert History Log"
              title="Alert History Log"
              className="w-11 h-11 rounded-2xl bg-white/50 hover:bg-white/80 text-slate-600 flex items-center justify-center transition-all"
            >
              <Bell className="w-4 h-4" />
            </button>
          </div>
        </aside>

        {/* Main Dashboard Content Area */}
        <div className="flex-1 min-w-0 flex flex-col justify-between space-y-5">
          <div>
            {/* Top Bar */}
            <Header
              dataSourceMode={dataSourceMode}
              onChangeDataSourceMode={handleChangeDataSourceMode}
              isCloudSynced={isCloudSynced}
              isSimulating={isSimulating}
              onToggleSimulator={() => setIsSimulating(prev => !prev)}
              simProfile={simProfile}
              onChangeSimProfile={setSimProfile}
              audioMuted={audioMuted}
              onToggleAudioMute={() => setAudioMuted(prev => !prev)}
              searchQuery={searchQuery}
              onChangeSearchQuery={setSearchQuery}
              onOpenManualModal={() => setIsManualModalOpen(true)}
              onOpenThresholdModal={() => setIsThresholdModalOpen(true)}
              onOpenCodeModal={() => setIsCodeModalOpen(true)}
              onOpenAlertsModal={() => setIsAlertsModalOpen(true)}
              unreadAlertCount={unreadAlertCount}
            />

            {/* Abnormal Alert Banner (only visible when an active threshold breach occurs) */}
            <EmergencyAlertBanner
              alerts={activeAlerts}
              audioAlarmActive={
                activeAlerts.length > 0 && !audioMuted && thresholds.audioAlarmEnabled
              }
              onSilenceAlarm={handleSilenceAlarm}
              onAcknowledgeAll={handleAcknowledgeAll}
              onOpenAlertsModal={() => setIsAlertsModalOpen(true)}
            />

            {/* 5-Card Bento Grid Charts & Gauges matching reference image */}
            <TelemetryCharts
              history={visibleHistory}
              latestReading={latestVisibleReading}
              thresholds={thresholds}
              useFahrenheit={useFahrenheit}
              onToggleTempUnit={() => setUseFahrenheit(prev => !prev)}
              dataSourceMode={dataSourceMode}
              onSwitchToDemo={() => handleChangeDataSourceMode('demo')}
              onOpenCodeModal={() => setIsCodeModalOpen(true)}
            />
          </div>

          {/* Bottom Full-Width Telemetry Overview Table matching reference image */}
          <HistoryTable
            history={visibleHistory}
            onClearHistory={handleClearHistory}
            useFahrenheit={useFahrenheit}
            searchQuery={searchQuery}
            dataSourceMode={dataSourceMode}
          />
        </div>
      </div>

      {/* Modals */}
      <ManualDataModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        onSubmit={handleManualSubmit}
        thresholds={thresholds}
        useFahrenheit={useFahrenheit}
      />

      <ThresholdSettingsModal
        isOpen={isThresholdModalOpen}
        onClose={() => setIsThresholdModalOpen(false)}
        thresholds={thresholds}
        onSave={handleSaveThresholds}
        useFahrenheit={useFahrenheit}
      />

      <Esp32HardwareGuideModal
        isOpen={isCodeModalOpen}
        onClose={() => setIsCodeModalOpen(false)}
      />

      <AlertsHistoryModal
        isOpen={isAlertsModalOpen}
        onClose={() => setIsAlertsModalOpen(false)}
        alerts={alertHistory}
        onAcknowledgeAlert={handleAcknowledgeSingleAlert}
        onClearAlerts={() => setAlertHistory([])}
      />
    </div>
  );
}
