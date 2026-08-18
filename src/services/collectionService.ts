import { Heirloom, HeirloomRarity, OwnedHeirloom, CollectionTotalBonus } from '@/types/collection';
import { HEIRLOOM_POOL, RARITY_PROBABILITY } from '@/constants/collection';

const RARITY_ORDER: HeirloomRarity[] = ['legendary', 'epic', 'rare', 'common'];

/** 根据 id 查藏品配置 */
export function getHeirloomById(id: string): Heirloom | undefined {
  return HEIRLOOM_POOL.find(h => h.id === id);
}

/** 计算单件藏品在指定等级的加成值 */
export function getHeirloomBonusValue(heirloom: Heirloom, level: number): number {
  return heirloom.bonus.baseValue + heirloom.bonus.growthPerLevel * (level - 1);
}

/**
 * 抽取一件藏品。
 * 先按概率决定稀有度，从该稀有度池随机；若目标稀有度已全部拥有，则向低稀有度保底查找。
 * 返回 null 表示所有藏品已集齐。
 */
export function drawHeirloom(ownedIds: string[]): Heirloom | null {
  const roll = Math.random();
  let rarity: HeirloomRarity = 'common';
  for (const item of RARITY_PROBABILITY) {
    if (roll < item.threshold) {
      rarity = item.rarity;
      break;
    }
  }

  // 从当前稀有度往低稀有度依次查找未拥有的藏品
  const startIdx = RARITY_ORDER.indexOf(rarity);
  const searchOrder = [
    ...RARITY_ORDER.slice(startIdx),
    ...RARITY_ORDER.slice(0, startIdx),
  ];

  for (const r of searchOrder) {
    const pool = HEIRLOOM_POOL.filter(h => h.rarity === r && !ownedIds.includes(h.id));
    if (pool.length > 0) {
      return pool[Math.floor(Math.random() * pool.length)];
    }
  }

  return null;
}

/** 汇总装备中藏品的加成 */
export function calcTotalBonus(
  owned: OwnedHeirloom[],
  equippedIds: string[],
): CollectionTotalBonus {
  const total: CollectionTotalBonus = {
    income: 0,
    cost: 0,
    trading: 0,
    aptitude: 0,
    offline: 0,
  };

  for (const id of equippedIds) {
    const ownedItem = owned.find(o => o.id === id);
    if (!ownedItem) continue;
    const heirloom = getHeirloomById(id);
    if (!heirloom) continue;
    const value = getHeirloomBonusValue(heirloom, ownedItem.level);
    total[heirloom.bonus.type] += value;
  }

  return total;
}
