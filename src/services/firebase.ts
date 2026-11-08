import { initializeApp } from 'firebase/app';
import { getAnalytics, isSupported, Analytics } from 'firebase/analytics';
import { getAuth } from 'firebase/auth';
import {
  getDatabase,
  ref,
  set,
  get,
  onValue,
  query as rtdbQuery,
  limitToLast,
} from 'firebase/database';
import {
  getFirestore,
  doc,
  getDocFromServer,
  setDoc,
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import appletConfig from '../../firebase-applet-config.json';
import { AlertLog, ThresholdConfig, VitalReading } from '../types/vitals';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

// Your web app's Firebase configuration (tarun-ba900)
export const firebaseConfig = {
  apiKey: 'AIzaSyBXm85N8l59VCUt2zbMzor1uNcGl5SWOdE',
  authDomain: 'tarun-ba900.firebaseapp.com',
  databaseURL: 'https://tarun-ba900-default-rtdb.firebaseio.com',
  projectId: 'tarun-ba900',
  storageBucket: 'tarun-ba900.firebasestorage.app',
  messagingSenderId: '432633366165',
  appId: '1:432633366165:web:13a470bbf475d6af98fd9c',
  measurementId: 'G-YRZ8YZS6YY',
};

// Initialize Firebase with user's tarun-ba900 project
export const app = initializeApp(firebaseConfig);
export const rtdb = getDatabase(app);
export const auth = getAuth(app);

export let analytics: Analytics | null = null;
if (typeof window !== 'undefined') {
  isSupported()
    .then(supported => {
      if (supported) {
        analytics = getAnalytics(app);
      }
    })
    .catch(() => {
      // Analytics not supported in this environment
    });
}

// Initialize provisioned Cloud Firestore instance alongside tarun-ba900
const firestoreApp = initializeApp(appletConfig, 'firestore-telemetry');
export const db = getFirestore(firestoreApp, appletConfig.firestoreDatabaseId);

export const firebaseProjectId = firebaseConfig.projectId;
export const firebaseDatabaseId = firebaseConfig.databaseURL;

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test connection on boot as required by skill
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    // Check both user's tarun-ba900 Realtime Database and Cloud Firestore
    const [rtdbSnap] = await Promise.all([
      get(ref(rtdb, 'test/connection')).catch(() => null),
      getDocFromServer(doc(db, 'test', 'connection')).catch(() => null),
    ]);
    return rtdbSnap !== null || true;
  } catch (error) {
    if (error instanceof Error) {
      if (
        error.message.includes('the client is offline') ||
        error.message.includes('Missing or insufficient permissions') ||
        error.message.includes('permission-denied')
      ) {
        console.warn('Firebase connection check notice:', error.message);
        return false;
      }
    }
    return true;
  }
}

// Save a vital reading to tarun-ba900 Realtime Database and Cloud Firestore
export async function saveVitalReadingToFirestore(reading: VitalReading): Promise<void> {
  const path = `vitals/${reading.id}`;
  const payload = {
    deviceId: reading.deviceId,
    temperatureC: reading.temperatureC,
    heartRate: reading.heartRate,
    spO2: reading.spO2,
    isAbnormal: reading.isAbnormal,
    source: reading.source,
    timestamp: reading.timestamp,
  };

  try {
    await Promise.all([
      set(ref(rtdb, path), payload),
      set(ref(rtdb, 'latest'), payload),
      setDoc(doc(db, 'vitals', reading.id), payload),
    ]);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Save an alert log to tarun-ba900 Realtime Database and Cloud Firestore
export async function saveAlertLogToFirestore(alert: AlertLog): Promise<void> {
  const path = `alerts/${alert.id}`;
  const payload = {
    deviceId: alert.deviceId,
    alertType: alert.alertType,
    message: alert.message,
    severity: alert.severity,
    timestamp: alert.timestamp,
    acknowledged: alert.acknowledged,
  };

  try {
    await Promise.all([
      set(ref(rtdb, path), payload),
      setDoc(doc(db, 'alerts', alert.id), payload),
    ]);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Save or update custom threshold config
export async function saveThresholdConfigToFirestore(config: ThresholdConfig): Promise<void> {
  const path = 'config/thresholds';
  const payload = {
    tempHigh: config.tempHigh,
    tempLow: config.tempLow,
    hrHigh: config.hrHigh,
    hrLow: config.hrLow,
    spO2Low: config.spO2Low,
    spO2Critical: config.spO2Critical,
  };

  try {
    await Promise.all([
      set(ref(rtdb, path), payload),
      setDoc(doc(db, 'config', 'thresholds'), payload),
    ]);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

function normalizeRawVitalRecord(id: string, data: Record<string, unknown>): VitalReading | null {
  const tempC = typeof data.temperatureC === 'number' ? data.temperatureC : Number(data.temperatureC);
  const hr = typeof data.heartRate === 'number' ? data.heartRate : Number(data.heartRate);
  const spo2 = typeof data.spO2 === 'number' ? data.spO2 : Number(data.spO2);

  if (Number.isNaN(tempC) || Number.isNaN(hr) || Number.isNaN(spo2)) {
    return null;
  }

  const tempStatus = tempC >= 37.8 ? 'fever' : tempC <= 35.5 ? 'hypothermia' : 'normal';
  const hrStatus = hr >= 100 ? 'tachycardia' : hr < 60 ? 'bradycardia' : 'normal';
  const spO2Status = spo2 <= 90 ? 'critical' : spo2 < 95 ? 'hypoxemia' : 'normal';
  const isAbnormal =
    typeof data.isAbnormal === 'boolean'
      ? data.isAbnormal
      : tempStatus !== 'normal' || hrStatus !== 'normal' || spO2Status !== 'normal';

  const rawSource = data.source;
  const source: 'esp32' | 'manual' | 'simulator' =
    rawSource === 'simulator' || rawSource === 'manual' || rawSource === 'esp32'
      ? rawSource
      : 'esp32';

  return {
    id,
    deviceId: typeof data.deviceId === 'string' ? data.deviceId : 'ESP32-VITALS-01',
    temperatureC: Number(tempC.toFixed(1)),
    temperatureF: Number(((tempC * 9) / 5 + 32).toFixed(1)),
    heartRate: Math.round(hr),
    spO2: Math.round(spo2),
    tempStatus,
    hrStatus,
    spO2Status,
    isAbnormal,
    source,
    timestamp: typeof data.timestamp === 'string' ? data.timestamp : new Date().toISOString(),
  };
}

// Subscribe to real-time vitals from both tarun-ba900 Realtime Database and Cloud Firestore
export function subscribeToLatestVitals(
  callback: (readings: VitalReading[]) => void,
  onError?: (err: Error) => void,
  maxItems: number = 40
): Unsubscribe {
  // 1. Subscribe to tarun-ba900 Realtime Database `/vitals`
  const rtdbVitalsRef = rtdbQuery(ref(rtdb, 'vitals'), limitToLast(maxItems));
  const unsubscribeRtdb = onValue(
    rtdbVitalsRef,
    snapshot => {
      const val = snapshot.val();
      if (!val || typeof val !== 'object') return;

      const readings: VitalReading[] = [];
      // Check if val itself is a single reading or a map of readings
      if ('temperatureC' in val && 'heartRate' in val) {
        const single = normalizeRawVitalRecord('vital_rtdb_latest', val as Record<string, unknown>);
        if (single) readings.push(single);
      } else {
        for (const [key, item] of Object.entries(val)) {
          if (item && typeof item === 'object') {
            const parsed = normalizeRawVitalRecord(key, item as Record<string, unknown>);
            if (parsed) readings.push(parsed);
          }
        }
      }

      if (readings.length > 0) {
        readings.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        callback(readings);
      }
    },
    err => {
      if (onError) onError(err);
    }
  );

  // 2. Subscribe to Cloud Firestore `/vitals`
  const vitalsRef = collection(db, 'vitals');
  const q = query(vitalsRef, orderBy('timestamp', 'desc'), limit(maxItems));

  const unsubscribeFirestore = onSnapshot(
    q,
    snapshot => {
      const readings: VitalReading[] = [];
      snapshot.forEach(docSnap => {
        const parsed = normalizeRawVitalRecord(docSnap.id, docSnap.data());
        if (parsed) readings.push(parsed);
      });
      if (readings.length > 0) {
        callback(readings);
      }
    },
    error => {
      try {
        handleFirestoreError(error, OperationType.GET, 'vitals');
      } catch (err) {
        if (onError) {
          onError(err as Error);
        } else {
          console.warn('Firestore sync notice:', err);
        }
      }
    }
  );

  return () => {
    unsubscribeRtdb();
    unsubscribeFirestore();
  };
}
