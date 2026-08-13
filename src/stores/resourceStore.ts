import { create } from 'zustand';
import { Resources } from '@/types/resource';
import { getStorage, setStorage } from '@/utils/storage';

interface ResourceState extends Resources {
  monthlyIncome: number;

  addSilver: (amount: number) => void;
  consumeSilver: (amount: number) => boolean;
  addLuckyCharm: (amount: number) => void;
  consumeLuckyCharm: (amount: number) => boolean;
  addGoldBar: (amount: number) => void;
  consumeGoldBar: (amount: number) => boolean;
  setMonthlyIncome: (amount: number) => void;
  init: () => void;
  save: () => void;
}

const INITIAL_RESOURCES: Resources = {
  silver: 1000,
  luckyCharm: 10,
  goldBar: 0,
};

export const useResourceStore = create<ResourceState>((set, get) => ({
  silver: 0,
  luckyCharm: 0,
  goldBar: 0,
  monthlyIncome: 0,

  init: () => {
    const saved = getStorage<Partial<ResourceState>>('resourceState', null);
    if (saved) {
      set({
        silver: saved.silver ?? INITIAL_RESOURCES.silver,
        luckyCharm: saved.luckyCharm ?? INITIAL_RESOURCES.luckyCharm,
        goldBar: saved.goldBar ?? INITIAL_RESOURCES.goldBar,
        monthlyIncome: saved.monthlyIncome || 0,
      });
    } else {
      set({ ...INITIAL_RESOURCES, monthlyIncome: 0 });
      get().save();
    }
  },

  addSilver: (amount) => { set(s => ({ silver: s.silver + amount })); get().save(); },
  consumeSilver: (amount) => {
    if (get().silver < amount) return false;
    set(s => ({ silver: s.silver - amount }));
    get().save();
    return true;
  },
  addLuckyCharm: (amount) => { set(s => ({ luckyCharm: s.luckyCharm + amount })); get().save(); },
  consumeLuckyCharm: (amount) => {
    if (get().luckyCharm < amount) return false;
    set(s => ({ luckyCharm: s.luckyCharm - amount }));
    get().save();
    return true;
  },
  addGoldBar: (amount) => { set(s => ({ goldBar: s.goldBar + amount })); get().save(); },
  consumeGoldBar: (amount) => {
    if (get().goldBar < amount) return false;
    set(s => ({ goldBar: s.goldBar - amount }));
    get().save();
    return true;
  },
  setMonthlyIncome: (amount) => set({ monthlyIncome: amount }),
  save: () => {
    const { silver, luckyCharm, goldBar, monthlyIncome } = get();
    setStorage('resourceState', { silver, luckyCharm, goldBar, monthlyIncome });
  },
}));
