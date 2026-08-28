import AsyncStorage from "@react-native-async-storage/async-storage";

type Decoder<T> = (raw: string) => T | null;

const queues = new Map<string, Promise<unknown>>();

/** Serializza tutte le operazioni sullo stesso archivio, anche tra hook diversi. */
export function withStorageLock<T>(key: string, operation: () => Promise<T>): Promise<T> {
  const previous = queues.get(key) ?? Promise.resolve();
  const current = previous.catch(() => undefined).then(operation);
  const settled = current.then(() => undefined, () => undefined);
  queues.set(key, settled);
  void settled.finally(() => {
    if (queues.get(key) === settled) queues.delete(key);
  });
  return current;
}

export async function readWithBackup<T>(
  primaryKey: string,
  backupKey: string,
  decode: Decoder<T>,
): Promise<T | null> {
  const primary = await AsyncStorage.getItem(primaryKey).catch(() => null);
  if (primary) {
    const decoded = decode(primary);
    if (decoded !== null) return decoded;
  }

  const backup = await AsyncStorage.getItem(backupKey).catch(() => null);
  return backup ? decode(backup) : null;
}

/** Scrive il nuovo valore solo dopo aver conservato l'ultima copia valida. */
export function writeWithBackup<T>(
  primaryKey: string,
  backupKey: string,
  raw: string,
  decode: Decoder<T>,
): Promise<void> {
  return withStorageLock(primaryKey, async () => {
    const previous = await AsyncStorage.getItem(primaryKey).catch(() => null);
    if (previous && decode(previous) !== null) {
      await AsyncStorage.setItem(backupKey, previous);
    }
    await AsyncStorage.setItem(primaryKey, raw);
  });
}

export function removeResilientValue(primaryKey: string, backupKey: string): Promise<void> {
  return withStorageLock(primaryKey, async () => {
    await AsyncStorage.removeItem(primaryKey);
    await AsyncStorage.removeItem(backupKey);
  });
}
