import { create } from 'zustand';
import { Achievement, AchievementProgressState } from '@/types/achievement';
import { ACHIEVEMENT_LIST } from '@/constants/achievement';
import { checkAchievements, getProgressValue } from '@/services/achievementService';
import { getStorage, setStorage } from '@/utils/storage';
import { useResourceStore } from '@/stores/resourceStore';
import { useFamilyStore } from '@/stores/familyStore';
import { useTradingStore } from '@/stores/tradingStore';
import { useServantStore } from '@/stores/servantStore';

interface AchievementState {
  /** 已解锁的成就 id */
  unlockedIds: string[];
  /** 已领取奖励的成就 id */
  claimedIds: string[];

  init: () => void;
  /** 检查并解锁达成的成就，返回新解锁的成就列表 */
  checkAndUnlock: () => Achievement[];
  /** 领取成就奖励 */
  claimReward: (achievementId: string) => { success: boolean; message: string };
  /** 获取某成就当前进度值 */
  getProgress: (achievement: Achievement) => number;
  save: () => void;
}

/** 采集当前游戏状态快照 */
function collectProgressState(): AchievementProgressState {
  const resource = useResourceStore.getState();
  const family = useFamilyStore.getState();
  const trading = useTradingStore.getState();
  const servant = useServantStore.getState();

  const aliveMembers = family.members.filter(m => m.isAlive);
  const geniusCount = aliveMembers.filter(m => m.aptitude === 'genius').length;
  const maxProfessionLevel = aliveMembers.reduce(
    (max, m) => (m.profession !== 'none' && m.professionLevel > max ? m.professionLevel : max),
    0,
  );
  const tradeCount = trading.missions.filter(m => m.status === 'completed').length;
  const maxServantLevel = servant.servants.reduce((max, s) => (s.level > max ? s.level : max), 0);
  const treeLevel = getStorage<{ level?: number }>('treeState', { level: 1 }).level || 1;

  return {
    silver: resource.silver,
    memberCount: aliveMembers.length,
    tradeCount,
    treeLevel,
    geniusCount,
    maxServantLevel,
    maxProfessionLevel,
  };
}

export const useAchievementStore = create<AchievementState>((set, get) => ({
  unlockedIds: [],
  claimedIds: [],

  init: () => {
    const saved = getStorage<{ unlockedIds?: string[]; claimedIds?: string[] }>('achievementState', null);
    if (saved) {
      set({
        unlockedIds: saved.unlockedIds || [],
        claimedIds: saved.claimedIds || [],
      });
    }
  },

  checkAndUnlock: () => {
    const state = collectProgressState();
    const newly = checkAchievements(state, get().unlockedIds);
    if (newly.length > 0) {
      set({ unlockedIds: [...get().unlockedIds, ...newly.map(a => a.id)] });
      get().save();
    }
    return newly;
  },

  claimReward: (achievementId) => {
    const { unlockedIds, claimedIds } = get();
    if (!unlockedIds.includes(achievementId)) {
      return { success: false, message: '成就尚未达成' };
    }
    if (claimedIds.includes(achievementId)) {
      return { success: false, message: '奖励已领取' };
    }

    const achievement = ACHIEVEMENT_LIST.find(a => a.id === achievementId);
    if (!achievement) return { success: false, message: '成就不存在' };

    const resource = useResourceStore.getState();
    for (const reward of achievement.rewards) {
      if (reward.type === 'silver') resource.addSilver(reward.amount);
      else if (reward.type === 'luckyCharm') resource.addLuckyCharm(reward.amount);
      else if (reward.type === 'goldBar') resource.addGoldBar(reward.amount);
    }

    set({ claimedIds: [...claimedIds, achievementId] });
    get().save();

    const rewardText = achievement.rewards
      .map(r => `${r.type === 'silver' ? '银两' : r.type === 'luckyCharm' ? '福缘符' : '金元宝'} +${r.amount}`)
      .join('，');
    return { success: true, message: `领取成功：${rewardText}` };
  },

  getProgress: (achievement) => {
    const state = collectProgressState();
    return getProgressValue(achievement.condition.type, state);
  },

  save: () => {
    const { unlockedIds, claimedIds } = get();
    setStorage('achievementState', { unlockedIds, claimedIds });
  },
}));
