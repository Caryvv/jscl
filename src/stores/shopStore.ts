import { create } from 'zustand';
import { ShopItem } from '@/types/shop';
import { SHOP_ITEMS } from '@/constants/shop';
import { getStorage, setStorage } from '@/utils/storage';

interface ShopState {
  items: ShopItem[];
  dailyPurchases: Record<string, number>;
  weeklyPurchases: Record<string, number>;
  lastResetDay: string;
  lastResetWeek: string;

  init: () => void;
  getPurchaseCount: (itemId: string, limitType: string) => number;
  recordPurchase: (itemId: string, limitType: string) => void;
  resetDailyIfNeeded: () => void;
  resetWeeklyIfNeeded: () => void;
  save: () => void;
}

function getTodayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function getWeekStr(): string {
  const d = new Date();
  const start = d.getFullYear();
  const jan1 = new Date(start, 0, 1);
  const week = Math.ceil(((d.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7);
  return `${start}-W${week}`;
}

export const useShopStore = create<ShopState>((set, get) => ({
  items: SHOP_ITEMS,
  dailyPurchases: {},
  weeklyPurchases: {},
  lastResetDay: '',
  lastResetWeek: '',

  init: () => {
    const saved = getStorage<any>('shopState', null);
    if (saved) {
      set({
        dailyPurchases: saved.dailyPurchases || {},
        weeklyPurchases: saved.weeklyPurchases || {},
        lastResetDay: saved.lastResetDay || '',
        lastResetWeek: saved.lastResetWeek || '',
      });
    }
    get().resetDailyIfNeeded();
    get().resetWeeklyIfNeeded();
  },

  getPurchaseCount: (itemId, limitType) => {
    if (limitType === 'daily') return get().dailyPurchases[itemId] || 0;
    if (limitType === 'weekly') return get().weeklyPurchases[itemId] || 0;
    return 0;
  },

  recordPurchase: (itemId, limitType) => {
    if (limitType === 'daily') {
      const daily = { ...get().dailyPurchases };
      daily[itemId] = (daily[itemId] || 0) + 1;
      set({ dailyPurchases: daily });
    } else if (limitType === 'weekly') {
      const weekly = { ...get().weeklyPurchases };
      weekly[itemId] = (weekly[itemId] || 0) + 1;
      set({ weeklyPurchases: weekly });
    }
    get().save();
  },

  resetDailyIfNeeded: () => {
    const today = getTodayStr();
    if (get().lastResetDay !== today) {
      set({ dailyPurchases: {}, lastResetDay: today });
      get().save();
    }
  },

  resetWeeklyIfNeeded: () => {
    const week = getWeekStr();
    if (get().lastResetWeek !== week) {
      set({ weeklyPurchases: {}, lastResetWeek: week });
      get().save();
    }
  },

  save: () => {
    const { dailyPurchases, weeklyPurchases, lastResetDay, lastResetWeek } = get();
    setStorage('shopState', { dailyPurchases, weeklyPurchases, lastResetDay, lastResetWeek });
  },
}));
