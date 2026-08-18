import { getStorage, setStorage } from '@/utils/storage';
import { GameDataSnapshot } from '@/types/sync';

/** 需要同步的所有存档 key */
export const SYNC_KEYS: (keyof GameDataSnapshot)[] = [
  'resourceState',
  'familyState',
  'treeState',
  'servantState',
  'shopState',
  'tradingState',
  'eventState',
  'achievementState',
  'collectionState',
  'dynastyState',
  'genealogyState',
  'welfareState',
];

/** 从本地存储聚合出完整存档快照 */
export function collectSnapshot(): GameDataSnapshot {
  const snapshot = {} as GameDataSnapshot;
  SYNC_KEYS.forEach(key => {
    snapshot[key] = getStorage<any>(key, null);
  });
  return snapshot;
}

/** 将云端快照写回本地存储 */
export function applySnapshot(snapshot: GameDataSnapshot): void {
  if (!snapshot) return;
  SYNC_KEYS.forEach(key => {
    if (snapshot[key] !== null && snapshot[key] !== undefined) {
      setStorage(key, snapshot[key]);
    }
  });
}

/** 本地数据版本号读写 */
export function getLocalVersion(): number {
  return getStorage<number>('syncVersion', 0);
}

export function setLocalVersion(version: number): void {
  setStorage('syncVersion', version);
}

/** 本地最后修改时间戳读写 */
export function getLocalUpdatedAt(): number {
  return getStorage<number>('syncUpdatedAt', 0);
}

export function setLocalUpdatedAt(ts: number): void {
  setStorage('syncUpdatedAt', ts);
}

/** 标记本地数据已变更（更新时间戳，供后续同步判定） */
export function markLocalDirty(): void {
  setLocalUpdatedAt(Date.now());
}
