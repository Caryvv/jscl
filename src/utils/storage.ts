import Taro from '@tarojs/taro';

const STORAGE_PREFIX = 'jscl_';

export function getStorage<T>(key: string, defaultValue: T): T {
  try {
    const raw = Taro.getStorageSync(STORAGE_PREFIX + key);
    if (raw !== '') return JSON.parse(raw) as T;
  } catch (e) {
    console.error('[Storage] get error:', key, e);
  }
  return defaultValue;
}

export function setStorage<T>(key: string, value: T): void {
  try {
    Taro.setStorageSync(STORAGE_PREFIX + key, JSON.stringify(value));
  } catch (e) {
    console.error('[Storage] set error:', key, e);
  }
}

export function removeStorage(key: string): void {
  try {
    Taro.removeStorageSync(STORAGE_PREFIX + key);
  } catch (e) {
    console.error('[Storage] remove error:', key, e);
  }
}
