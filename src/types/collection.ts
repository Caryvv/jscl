export type HeirloomRarity = 'common' | 'rare' | 'epic' | 'legendary';

export type HeirloomBonusType = 'income' | 'cost' | 'trading' | 'aptitude' | 'offline';

export interface HeirloomBonus {
  type: HeirloomBonusType;
  /** 1级加成值（百分比，如 0.05 表示 +5%） */
  baseValue: number;
  /** 每级成长值 */
  growthPerLevel: number;
}

export interface Heirloom {
  id: string;
  name: string;
  rarity: HeirloomRarity;
  description: string;
  icon: string;
  maxLevel: number;
  bonus: HeirloomBonus;
}

/** 玩家已拥有的藏品实例 */
export interface OwnedHeirloom {
  id: string;
  level: number;
}

/** 汇总加成，按类型聚合的百分比 */
export interface CollectionTotalBonus {
  income: number;
  cost: number;
  trading: number;
  aptitude: number;
  offline: number;
}
