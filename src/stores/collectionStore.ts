import { create } from 'zustand';
import { OwnedHeirloom, Heirloom, CollectionTotalBonus } from '@/types/collection';
import { HEIRLOOM_POOL, DRAW_COST_LUCKY_CHARM, getUpgradeCost } from '@/constants/collection';
import { drawHeirloom, calcTotalBonus, getHeirloomById } from '@/services/collectionService';
import { getStorage, setStorage } from '@/utils/storage';
import { useResourceStore } from '@/stores/resourceStore';

/** 同时装备的藏品上限 */
export const MAX_EQUIPPED = 5;

interface CollectionState {
  owned: OwnedHeirloom[];
  equipped: string[];

  init: () => void;
  /** 抽取藏品：返回抽中的藏品 或 失败信息 */
  draw: () => { success: boolean; heirloom?: Heirloom; message: string };
  /** 升级藏品 */
  upgrade: (id: string) => { success: boolean; message: string };
  /** 装备/卸下藏品 */
  toggleEquip: (id: string) => { success: boolean; message: string };
  /** 获取汇总加成 */
  getTotalBonus: () => CollectionTotalBonus;
  save: () => void;
}

export const useCollectionStore = create<CollectionState>((set, get) => ({
  owned: [],
  equipped: [],

  init: () => {
    const saved = getStorage<{ owned?: OwnedHeirloom[]; equipped?: string[] }>('collectionState', null);
    if (saved) {
      set({
        owned: saved.owned || [],
        equipped: saved.equipped || [],
      });
    }
  },

  draw: () => {
    const resource = useResourceStore.getState();
    if (resource.luckyCharm < DRAW_COST_LUCKY_CHARM) {
      return { success: false, message: `福缘符不足，需要 ${DRAW_COST_LUCKY_CHARM} 枚` };
    }

    const { owned } = get();
    const ownedIds = owned.map(o => o.id);

    if (ownedIds.length >= HEIRLOOM_POOL.length) {
      return { success: false, message: '藏品已全部集齐' };
    }

    const heirloom = drawHeirloom(ownedIds);
    if (!heirloom) {
      return { success: false, message: '藏品已全部集齐' };
    }

    resource.consumeLuckyCharm(DRAW_COST_LUCKY_CHARM);
    const newOwned = [...owned, { id: heirloom.id, level: 1 }];
    set({ owned: newOwned });
    get().save();

    return { success: true, heirloom, message: `获得【${heirloom.name}】！` };
  },

  upgrade: (id) => {
    const { owned } = get();
    const item = owned.find(o => o.id === id);
    if (!item) return { success: false, message: '尚未拥有此藏品' };

    const heirloom = getHeirloomById(id);
    if (!heirloom) return { success: false, message: '藏品配置错误' };

    if (item.level >= heirloom.maxLevel) {
      return { success: false, message: '已达最高等级' };
    }

    const cost = getUpgradeCost(item.level);
    const resource = useResourceStore.getState();
    if (resource.luckyCharm < cost) {
      return { success: false, message: `福缘符不足，需要 ${cost} 枚` };
    }

    resource.consumeLuckyCharm(cost);
    const newOwned = owned.map(o => (o.id === id ? { ...o, level: o.level + 1 } : o));
    set({ owned: newOwned });
    get().save();

    return { success: true, message: `升级成功，当前 ${item.level + 1} 级` };
  },

  toggleEquip: (id) => {
    const { owned, equipped } = get();
    if (!owned.find(o => o.id === id)) {
      return { success: false, message: '尚未拥有此藏品' };
    }

    if (equipped.includes(id)) {
      set({ equipped: equipped.filter(e => e !== id) });
      get().save();
      return { success: true, message: '已卸下' };
    }

    if (equipped.length >= MAX_EQUIPPED) {
      return { success: false, message: `最多装备 ${MAX_EQUIPPED} 件藏品` };
    }

    set({ equipped: [...equipped, id] });
    get().save();
    return { success: true, message: '已装备' };
  },

  getTotalBonus: () => {
    const { owned, equipped } = get();
    return calcTotalBonus(owned, equipped);
  },

  save: () => {
    const { owned, equipped } = get();
    setStorage('collectionState', { owned, equipped });
  },
}));
