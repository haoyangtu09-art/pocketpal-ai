import AsyncStorage from '@react-native-async-storage/async-storage';

const CRASH_LOG_KEY = '__LUMO_CRASH_LOG__';

export interface CrashLogEntry {
  timestamp: string;
  message: string;
  stack?: string;
  context?: string;
}

/**
 * Write a crash/error log entry to AsyncStorage so it can be displayed
 * to the user on next app launch.
 */
export async function saveCrashLog(
  entry: Omit<CrashLogEntry, 'timestamp'>,
): Promise<void> {
  try {
    const log: CrashLogEntry = {
      ...entry,
      timestamp: new Date().toISOString(),
    };
    const existing = await AsyncStorage.getItem(CRASH_LOG_KEY);
    const logs: CrashLogEntry[] = existing ? JSON.parse(existing) : [];
    logs.push(log);
    // Keep only the last 20 entries
    if (logs.length > 20) {
      logs.splice(0, logs.length - 20);
    }
    await AsyncStorage.setItem(CRASH_LOG_KEY, JSON.stringify(logs));
  } catch {
    // Don't let error logging itself cause a crash
  }
}

/**
 * Read all stored crash logs. Returns empty array if none exist.
 */
export async function readCrashLogs(): Promise<CrashLogEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(CRASH_LOG_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as CrashLogEntry[];
  } catch {
    return [];
  }
}

/**
 * Clear all stored crash logs.
 */
export async function clearCrashLogs(): Promise<void> {
  try {
    await AsyncStorage.removeItem(CRASH_LOG_KEY);
  } catch {
    // ignore
  }
}
