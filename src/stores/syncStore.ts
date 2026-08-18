import { create } from 'zustand';
import { SyncResult, GameDataSnapshot } from '@/types/sync';
import { callFunction } from '@/services/cloud';
import {
  collectSnapshot,
  applySnapshot,
  getLocalVersion,
  setLocalVersion,
  getLocalUpdatedAt,
} from '@/services/syncService';

interface SyncState {
  /** 同步中标记，防止并发同步 */
  syncing: boolean;
  /** 最后一次同步的时间戳 */
  lastSyncAt: number;
  /** 最后一次同步结果消息 */
  lastMessage: string;
  /** 检测到冲突待用户处理 */
  hasConflict: boolean;

  /** 上线时从云端拉取存档（云端更新则覆盖本地） */
  pullFromCloud: () => Promise<SyncResult>;
  /** 上传本地存档到云端 */
  pushToCloud: (force?: boolean) => Promise<SyncResult>;
}

export const useSyncStore = create<SyncState>((set, get) => ({
  syncing: false,
  lastSyncAt: 0,
  lastMessage: '',
  hasConflict: false,

  pullFromCloud: async () => {
    if (get().syncing) {
      return { success: false, action: 'none', dataVersion: getLocalVersion(), message: '同步进行中' };
    }
    set({ syncing: true });
    try {
      const localVersion = getLocalVersion();
      const result = await callFunction<SyncResult & { snapshot?: GameDataSnapshot }>('syncGameData', {
        mode: 'download',
        localVersion,
      });
      // 云端版本更新时才覆盖本地
      if (result.action === 'download' && result.dataVersion > localVersion && result.snapshot) {
        applySnapshot(result.snapshot);
        setLocalVersion(result.dataVersion);
      }
      set({ lastSyncAt: Date.now(), lastMessage: result.message });
      return result;
    } catch (e: any) {
      const msg = e?.message || '云端拉取失败';
      set({ lastMessage: msg });
      return { success: false, action: 'none', dataVersion: getLocalVersion(), message: msg };
    } finally {
      set({ syncing: false });
    }
  },

  pushToCloud: async (force = false) => {
    if (get().syncing) {
      return { success: false, action: 'none', dataVersion: getLocalVersion(), message: '同步进行中' };
    }
    set({ syncing: true });
    try {
      const snapshot = collectSnapshot();
      const result = await callFunction<SyncResult>('syncGameData', {
        mode: 'upload',
        localVersion: force ? Number.MAX_SAFE_INTEGER : getLocalVersion(),
        snapshot,
        localUpdatedAt: getLocalUpdatedAt() || Date.now(),
      });
      if (result.success && result.action === 'upload') {
        setLocalVersion(result.dataVersion);
        set({ hasConflict: false });
      } else if (result.conflict) {
        set({ hasConflict: true });
      }
      set({ lastSyncAt: Date.now(), lastMessage: result.message });
      return result;
    } catch (e: any) {
      const msg = e?.message || '云端上传失败';
      set({ lastMessage: msg });
      return { success: false, action: 'none', dataVersion: getLocalVersion(), message: msg };
    } finally {
      set({ syncing: false });
    }
  },
}));
