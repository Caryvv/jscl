import { create } from 'zustand';
import { DynastyInfo, InheritanceRecord, InheritanceCondition } from '@/types/dynasty';
import {
  DYNASTY_CONFIGS,
  getDynastyConfig,
  getNextDynastyConfig,
  PRESTIGE_PER_INHERITANCE,
  DYNASTY_CHANGE_MIN_GEN,
  DYNASTY_CHANGE_MAX_GEN,
  DYNASTY_CHANGE_CHANCE,
} from '@/constants/dynasty';
import {
  checkInheritanceConditions,
  canInherit as canInheritCheck,
  getPatriarch,
} from '@/services/dynastyService';
import { getStorage, setStorage } from '@/utils/storage';
import { useFamilyStore } from '@/stores/familyStore';
import { useResourceStore } from '@/stores/resourceStore';

interface InheritResult {
  success: boolean;
  message: string;
  dynastyChanged?: boolean;
  newDynastyName?: string;
}

interface DynastyState {
  info: DynastyInfo;
  history: InheritanceRecord[];

  init: () => void;
  /** 增加声望 */
  addPrestige: (amount: number) => void;
  /** 获取当前朝代收益加成（小数） */
  getIncomeBonus: () => number;
  /** 获取传承条件 */
  getConditions: () => InheritanceCondition[];
  /** 是否可传承 */
  canInherit: () => boolean;
  /** 执行传承 */
  inherit: (newPatriarchId: string) => InheritResult;
  save: () => void;
}

const INITIAL_INFO: DynastyInfo = {
  id: 1,
  generationCount: 1,
  prestige: 0,
  startTime: Date.now(),
};

export const useDynastyStore = create<DynastyState>((set, get) => ({
  info: { ...INITIAL_INFO },
  history: [],

  init: () => {
    const saved = getStorage<{ info?: DynastyInfo; history?: InheritanceRecord[] }>('dynastyState', null);
    if (saved && saved.info) {
      set({ info: saved.info, history: saved.history || [] });
    } else {
      set({ info: { ...INITIAL_INFO, startTime: Date.now() }, history: [] });
      get().save();
    }
  },

  addPrestige: (amount) => {
    set(s => ({ info: { ...s.info, prestige: s.info.prestige + amount } }));
    get().save();
  },

  getIncomeBonus: () => {
    return getDynastyConfig(get().info.id).incomeBonus;
  },

  getConditions: () => {
    const { members } = useFamilyStore.getState();
    const { prestige, generationCount } = get().info;
    return checkInheritanceConditions(members, prestige, generationCount);
  },

  canInherit: () => {
    return canInheritCheck(get().getConditions());
  },

  inherit: (newPatriarchId) => {
    const conditions = get().getConditions();
    if (!canInheritCheck(conditions)) {
      return { success: false, message: '尚未满足传承条件' };
    }

    const familyStore = useFamilyStore.getState();
    const members = familyStore.members;
    const oldPatriarch = getPatriarch(members);
    const newPatriarch = members.find(m => m.id === newPatriarchId);

    if (!oldPatriarch || !newPatriarch) {
      return { success: false, message: '继承人无效' };
    }
    if (!newPatriarch.isAlive || (newPatriarch.lifeStage !== 'adult' && newPatriarch.lifeStage !== 'elder')) {
      return { success: false, message: '继承人须为成年在世成员' };
    }

    // 变更家主身份：旧家主转为旁系，新家主继位
    const newMembers = members.map(m => {
      if (m.id === oldPatriarch.id) return { ...m, role: 'collateral' as const };
      if (m.id === newPatriarch.id) return { ...m, role: 'patriarch' as const };
      return m;
    });

    // 声望增加
    let info = { ...get().info };
    info.prestige += PRESTIGE_PER_INHERITANCE;
    info.generationCount += 1;

    // 判定朝代更迭
    let dynastyChanged = false;
    const nextDynasty = getNextDynastyConfig(info.id);
    if (nextDynasty && info.prestige >= nextDynasty.prestigeRequirement) {
      const reachMax = info.generationCount > DYNASTY_CHANGE_MAX_GEN;
      const reachMin = info.generationCount > DYNASTY_CHANGE_MIN_GEN;
      if (reachMax || (reachMin && Math.random() < DYNASTY_CHANGE_CHANCE)) {
        info.id = nextDynasty.id;
        info.generationCount = 1;
        info.startTime = Date.now();
        dynastyChanged = true;
      }
    }

    // 记录传承
    const currentConfig = getDynastyConfig(info.id);
    const resourceSilver = require('@/stores/resourceStore').useResourceStore.getState().silver;
    const record: InheritanceRecord = {
      id: `inherit_${Date.now()}`,
      dynastyId: info.id,
      dynastyName: currentConfig.name,
      generationIndex: info.generationCount,
      oldPatriarchName: oldPatriarch.name,
      newPatriarchName: newPatriarch.name,
      inheritedSilver: resourceSilver,
      timestamp: Date.now(),
    };

    // 提交家族成员变更（资产/神树/藏品自然保留，无需处理）
    useFamilyStore.setState({ members: newMembers });
    familyStore.save();

    set({ info, history: [...get().history, record] });
    get().save();

    return {
      success: true,
      message: dynastyChanged
        ? `${newPatriarch.name} 继位，开启新朝代【${currentConfig.name}】！`
        : `${newPatriarch.name} 继承家业，家族香火延续`,
      dynastyChanged,
      newDynastyName: dynastyChanged ? currentConfig.name : undefined,
    };
  },

  save: () => {
    const { info, history } = get();
    setStorage('dynastyState', { info, history });
  },
}));
