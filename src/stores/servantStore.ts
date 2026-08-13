import { create } from 'zustand';
import { Servant } from '@/types/servant';
import { SERVANTS } from '@/constants/servant';
import { getStorage, setStorage } from '@/utils/storage';

interface ServantState {
  servants: Servant[];

  init: () => void;
  upgradeServant: (type: string) => { success: boolean; message: string };
  getTotalBonus: () => number;
  save: () => void;
}

export const useServantStore = create<ServantState>((set, get) => ({
  servants: SERVANTS,

  init: () => {
    const saved = getStorage<Servant[]>('servantState', null);
    if (saved) {
      set({ servants: saved });
    }
  },

  upgradeServant: (type) => {
    const servants = [...get().servants];
    const idx = servants.findIndex(s => s.type === type);
    if (idx === -1) return { success: false, message: '家丁不存在' };

    const servant = { ...servants[idx] };
    if (servant.level >= servant.maxLevel) {
      return { success: false, message: '已达到最高等级' };
    }

    const upgradeCost = servant.baseCost + servant.costGrowth * servant.level;
    const resourceSaved = getStorage<any>('resourceState', null);
    if (!resourceSaved || resourceSaved.silver < upgradeCost) {
      return { success: false, message: `银两不足，需要 ${upgradeCost} 银两` };
    }

    resourceSaved.silver -= upgradeCost;
    setStorage('resourceState', resourceSaved);

    servant.level += 1;
    servant.effectValue += servant.effectGrowth;
    servants[idx] = servant;

    set({ servants });
    get().save();
    return { success: true, message: `升级成功！${servant.name} 升至 ${servant.level} 级` };
  },

  getTotalBonus: () => get().servants.reduce((sum, s) => sum + s.effectValue, 0),

  save: () => setStorage('servantState', get().servants),
}));
