export type AchievementCategory = 'wealth' | 'family' | 'trading' | 'growth' | 'special';

export type AchievementConditionType =
  | 'silver_reach'
  | 'member_count'
  | 'trade_count'
  | 'tree_level'
  | 'aptitude_genius_count'
  | 'servant_level'
  | 'profession_max';

export interface AchievementCondition {
  type: AchievementConditionType;
  target: number;
}

export type RewardType = 'silver' | 'luckyCharm' | 'goldBar';

export interface AchievementReward {
  type: RewardType;
  amount: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  icon: string;
  condition: AchievementCondition;
  rewards: AchievementReward[];
  sortOrder: number;
}

/** 成就进度快照，供条件取值使用 */
export interface AchievementProgressState {
  silver: number;
  memberCount: number;
  tradeCount: number;
  treeLevel: number;
  geniusCount: number;
  maxServantLevel: number;
  maxProfessionLevel: number;
}
