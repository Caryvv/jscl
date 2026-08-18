import { create } from 'zustand';
import { getStorage, setStorage } from '@/utils/storage';

interface PrivilegeState {
  /** 免广告到期时间戳（毫秒）；0 表示无月卡 */
  adFreeUntil: number;
  /** 是否拥有终身免广告卡 */
  lifetimeAdFree: boolean;

  init: () => void;
  /** 是否当前免广告 */
  isAdFree: () => boolean;
  /** 激活月卡：在现有到期时间基础上叠加 30 天 */
  activateMonthCard: () => void;
  /** 激活终身卡 */
  activateLifetimeCard: () => void;
  save: () => void;
}

const DAY_MS = 24 * 3600 * 1000;

export const usePrivilegeStore = create<PrivilegeState>((set, get) => ({
  adFreeUntil: 0,
  lifetimeAdFree: false,

  init: () => {
    const saved = getStorage<{ adFreeUntil?: number; lifetimeAdFree?: boolean }>('privilegeState', null);
    if (saved) {
      set({
        adFreeUntil: saved.adFreeUntil || 0,
        lifetimeAdFree: saved.lifetimeAdFree || false,
      });
    }
  },

  isAdFree: () => {
    const { adFreeUntil, lifetimeAdFree } = get();
    return lifetimeAdFree || adFreeUntil > Date.now();
  },

  activateMonthCard: () => {
    const base = Math.max(get().adFreeUntil, Date.now());
    set({ adFreeUntil: base + 30 * DAY_MS });
    get().save();
  },

  activateLifetimeCard: () => {
    set({ lifetimeAdFree: true });
    get().save();
  },

  save: () => {
    const { adFreeUntil, lifetimeAdFree } = get();
    setStorage('privilegeState', { adFreeUntil, lifetimeAdFree });
  },
}));
