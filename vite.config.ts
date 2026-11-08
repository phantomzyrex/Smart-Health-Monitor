import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';

interface TelemetryPayload {
  id: string;
  deviceId: string;
  temperatureC: number;
  heartRate: number;
  spO2: number;
  wifiRssi?: number;
  source: string;
  timestamp: string;
}

function esp32TelemetryPlugin(): Plugin {
  const telemetryHistory: TelemetryPayload[] = [];

  return {
    name: 'esp32-telemetry-endpoint',
    configureServer(server) {
      server.middlewares.use('/api/telemetry', (req, res, next) => {
        // Handle CORS preflight
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

        if (req.method === 'OPTIONS') {
          res.writeHead(204);
          res.end();
          return;
        }

        if (req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: Buffer) => {
            body += chunk.toString();
          });
          req.on('end', () => {
            try {
              const data = JSON.parse(body);
              const reading: TelemetryPayload = {
                id: `vital_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                deviceId: data.deviceId || 'ESP32-VITALS-01',
                temperatureC: typeof data.temperatureC === 'number' ? data.temperatureC : parseFloat(data.temperatureC) || 36.6,
                heartRate: typeof data.heartRate === 'number' ? data.heartRate : parseInt(data.heartRate, 10) || 72,
                spO2: typeof data.spO2 === 'number' ? data.spO2 : parseInt(data.spO2, 10) || 98,
                wifiRssi: data.wifiRssi,
                source: data.source || 'esp32',
                timestamp: data.timestamp || new Date().toISOString(),
              };

              telemetryHistory.unshift(reading);
              if (telemetryHistory.length > 200) {
                telemetryHistory.pop();
              }

              res.setHeader('Content-Type', 'application/json');
              res.writeHead(200);
              res.end(JSON.stringify({ status: 'success', message: 'Telemetry received', received: reading }));
            } catch (err) {
              res.setHeader('Content-Type', 'application/json');
              res.writeHead(400);
              res.end(JSON.stringify({ error: 'Invalid JSON payload in telemetry POST request' }));
            }
          });
        } else if (req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json');
          res.writeHead(200);
          res.end(
            JSON.stringify({
              status: 'online',
              deviceId: 'ESP32-VITALS-01',
              latest: telemetryHistory[0] || null,
              count: telemetryHistory.length,
              history: telemetryHistory.slice(0, 50),
            })
          );
        } else {
          next();
        }
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), esp32TelemetryPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
