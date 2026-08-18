import { Achievement, AchievementProgressState } from '@/types/achievement';
import { ACHIEVEMENT_LIST } from '@/constants/achievement';

/** 根据条件类型从进度快照取当前值 */
export function getProgressValue(
  type: Achievement['condition']['type'],
  state: AchievementProgressState,
): number {
  switch (type) {
    case 'silver_reach': return state.silver;
    case 'member_count': return state.memberCount;
    case 'trade_count': return state.tradeCount;
    case 'tree_level': return state.treeLevel;
    case 'aptitude_genius_count': return state.geniusCount;
    case 'servant_level': return state.maxServantLevel;
    case 'profession_max': return state.maxProfessionLevel;
    default: return 0;
  }
}

/** 检查所有成就，返回本次新解锁的成就列表 */
export function checkAchievements(
  state: AchievementProgressState,
  unlockedIds: string[],
): Achievement[] {
  const newlyUnlocked: Achievement[] = [];

  for (const achievement of ACHIEVEMENT_LIST) {
    if (unlockedIds.includes(achievement.id)) continue;

    const current = getProgressValue(achievement.condition.type, state);
    if (current >= achievement.condition.target) {
      newlyUnlocked.push(achievement);
    }
  }

  return newlyUnlocked;
}
