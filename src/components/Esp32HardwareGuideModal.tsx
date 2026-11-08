import React, { useState } from 'react';
import { X, Copy, Check, Cpu, Terminal, Wifi, ExternalLink, HelpCircle } from 'lucide-react';
import { generateEsp32ArduinoCode } from '../utils/esp32CodeGenerator';
import { firebaseProjectId, firebaseDatabaseId } from '../services/firebase';

interface Esp32HardwareGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Esp32HardwareGuideModal: React.FC<Esp32HardwareGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [wifiSsid, setWifiSsid] = useState<string>('Home_WiFi_2.4G');
  const [wifiPassword, setWifiPassword] = useState<string>('YourWiFiPassword');
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [copiedCurl, setCopiedCurl] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://ais-dev-...';
  const serverWebhookUrl = `${currentOrigin}/api/telemetry`;

  const arduinoCode = generateEsp32ArduinoCode({
    wifiSsid,
    wifiPassword,
    serverUrl: serverWebhookUrl,
    deviceId: 'ESP32-VITALS-01',
    firebaseProjectId,
    firebaseDatabaseId,
    sendIntervalMs: 2000,
  });

  const curlExample = `curl -X POST "${serverWebhookUrl}" \\
  -H "Content-Type: application/json" \\
  -d '{"deviceId":"ESP32-VITALS-01","temperatureC":37.2,"heartRate":78,"spO2":98}'`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(arduinoCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyCurl = () => {
    navigator.clipboard.writeText(curlExample);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                ESP32 (30-Pin) Hardware Setup & Arduino Code
              </h3>
              <p className="text-xs text-slate-400">
                DS18B20 (Temperature) + MAX30102 (Heart Rate & SpO2) Wiring Guide
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close hardware guide modal"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 space-y-6 overflow-y-auto">
          {/* 1. Pinout Wiring Table */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
              30-Pin ESP32 Wiring Diagram
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* DS18B20 Box */}
              <div className="rounded-xl bg-slate-950 p-4 border border-slate-800">
                <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-800">
                  <span className="text-xs font-bold text-amber-400">DS18B20 Probe</span>
                  <span className="text-[11px] font-mono text-slate-400">OneWire Digital</span>
                </div>
                <table className="w-full text-xs font-mono">
                  <thead>
                    <tr className="text-slate-500 text-left">
                      <th className="pb-1">Sensor Pin</th>
                      <th className="pb-1">Wire Color</th>
                      <th className="pb-1">ESP32 Pin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900 text-slate-300">
                    <tr>
                      <td className="py-1">VDD (Power)</td>
                      <td className="py-1 text-rose-400">Red</td>
                      <td className="py-1 text-indigo-300 font-bold">3V3</td>
                    </tr>
                    <tr>
                      <td className="py-1">GND (Ground)</td>
                      <td className="py-1 text-slate-400">Black</td>
                      <td className="py-1 text-indigo-300 font-bold">GND</td>
                    </tr>
                    <tr>
                      <td className="py-1">DATA (Signal)</td>
                      <td className="py-1 text-amber-400">Yellow</td>
                      <td className="py-1 text-indigo-300 font-bold">GPIO 4</td>
                    </tr>
                  </tbody>
                </table>
                <div className="mt-2.5 p-2 rounded bg-amber-950/30 border border-amber-900/50 text-[11px] text-amber-300 flex items-start gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400" />
                  <span>
                    <strong>Important:</strong> Connect a <strong>4.7kΩ pull-up resistor</strong> between the DS18B20 Yellow Data wire and 3V3 power!
                  </span>
                </div>
              </div>

              {/* MAX30102 Box */}
              <div className="rounded-xl bg-slate-950 p-4 border border-slate-800">
                <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-800">
                  <span className="text-xs font-bold text-rose-400">MAX30102 Sensor</span>
                  <span className="text-[11px] font-mono text-slate-400">I2C Protocol</span>
                </div>
                <table className="w-full text-xs font-mono">
                  <thead>
                    <tr className="text-slate-500 text-left">
                      <th className="pb-1">Sensor Pin</th>
                      <th className="pb-1">Function</th>
                      <th className="pb-1">ESP32 Pin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900 text-slate-300">
                    <tr>
                      <td className="py-1">VIN / VCC</td>
                      <td className="py-1">Power</td>
                      <td className="py-1 text-indigo-300 font-bold">3V3 (or 5V)</td>
                    </tr>
                    <tr>
                      <td className="py-1">GND</td>
                      <td className="py-1">Ground</td>
                      <td className="py-1 text-indigo-300 font-bold">GND</td>
                    </tr>
                    <tr>
                      <td className="py-1">SDA</td>
                      <td className="py-1">I2C Data</td>
                      <td className="py-1 text-indigo-300 font-bold">GPIO 21</td>
                    </tr>
                    <tr>
                      <td className="py-1">SCL</td>
                      <td className="py-1">I2C Clock</td>
                      <td className="py-1 text-indigo-300 font-bold">GPIO 22</td>
                    </tr>
                  </tbody>
                </table>
                <div className="mt-2.5 p-2 rounded bg-slate-900 border border-slate-800 text-[11px] text-slate-400">
                  Place finger lightly with steady pressure on the sensor's glass window for accurate PPG pulse waveform.
                </div>
              </div>
            </div>
          </div>

          {/* 2. WiFi Settings for Code Generation */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-2">
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
              Configure Your Wi-Fi Credentials for Arduino Sketch
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Wi-Fi Network Name (SSID)</label>
                <input
                  type="text"
                  value={wifiSsid}
                  onChange={e => setWifiSsid(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Wi-Fi Password</label>
                <input
                  type="text"
                  value={wifiPassword}
                  onChange={e => setWifiPassword(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* 3. Arduino IDE Sketch */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                Arduino C++ Sketch (.ino)
              </h4>
              <button
                type="button"
                onClick={handleCopyCode}
                className="flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? 'Code Copied!' : 'Copy Sketch'}</span>
              </button>
            </div>
            <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-72">
              {arduinoCode}
            </pre>
          </div>

          {/* 4. Terminal cURL Webhook Tester */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-amber-400" />
                Instant Test via Terminal / cURL
              </h4>
              <button
                type="button"
                onClick={handleCopyCurl}
                className="flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
              >
                {copiedCurl ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCurl ? 'cURL Copied!' : 'Copy cURL'}</span>
              </button>
            </div>
            <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-amber-300 overflow-x-auto">
              {curlExample}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
