import { MMKV } from "react-native-mmkv";

/**
 * Development Fallback Storage
 * This allows the app to run in Expo Go/Simulators even before a native build is ready.
 * If native MMKV is not available, it fallbacks to a memory map.
 */
const memoryStorage = new Map<string, string>();

const mockStorage = {
  setItem: (name: string, value: string) => {
    memoryStorage.set(name, value);
  },
  getItem: (name: string) => {
    return memoryStorage.get(name) ?? null;
  },
  removeItem: (name: string) => {
    memoryStorage.delete(name);
  },
};

let storageInstance: any;
let persistenceProvider: any;

try {
  storageInstance = new MMKV({
    id: "cubgame-storage",
  });

  persistenceProvider = {
    setItem: (name: string, value: string) => {
      storageInstance.set(name, value);
    },
    getItem: (name: string) => {
      const val = storageInstance.getString(name);
      return val ?? null;
    },
    removeItem: (name: string) => {
      storageInstance.delete(name);
    },
  };

  console.log("✅ MMKV Native Storage Initialized");
} catch (e) {
  console.warn(
    "⚠️ MMKV not available (Native Module missing). Switching to Memory Fallback.",
  );
  persistenceProvider = mockStorage;
}

export const storage = storageInstance;
export const mmkvStorage = persistenceProvider;
