import { TradeRoute, TradeResult } from '@/types/trading';
import { FamilyMember } from '@/types/member';
import { Servant } from '@/types/servant';
import { getMerchantTradingBonus, getOfficerRiskReduction } from './professionService';

/** 护院家丁每级降低的亏损概率 */
const GUARD_LOSS_REDUCTION_PER_LEVEL = 0.05;

/**
 * 计算跑商最终收益
 * 收益 = 基础收益 × 浮动系数 × (1 + 商人加成)
 * 亏损概率 = 商路亏损概率 − 护院减免 − 武官减免
 * 若判定亏损，则返回负收益（最多亏一半）
 */
export function calcTradeProfit(
  route: TradeRoute,
  members: FamilyMember[],
  servants: Servant[],
): TradeResult {
  // 浮动系数：±波动率
  const floatFactor = 1 + (Math.random() * 2 - 1) * route.volatility;

  // 商人加成：派遣的商人提供收益加成（基础15% + 每级3%）
  const merchantBonusPercent = getMerchantTradingBonus(members);
  const merchantBonus = 1 + merchantBonusPercent;

  // 护院家丁降低亏损概率
  const guard = servants.find(s => s.type === 'guard');
  const guardLevel = guard ? guard.level : 0;
  const guardReduction = guardLevel * GUARD_LOSS_REDUCTION_PER_LEVEL;

  // 武官降低亏损概率（基础5% + 每级1%）
  const officerReduction = getOfficerRiskReduction(members);

  const adjustedLossChance = Math.max(0, route.lossChance - guardReduction - officerReduction);
  const isLoss = Math.random() < adjustedLossChance;

  if (isLoss) {
    const loss = -Math.floor(route.baseProfit * floatFactor * merchantBonus * 0.5);
    return { profit: loss, isLoss: true, message: '商队遇险，货物折损' };
  }

  const profit = Math.floor(route.baseProfit * floatFactor * merchantBonus);
  return { profit, isLoss: false, message: '商队满载而归' };
}

let idCounter = Date.now();

/** 生成跑商任务 ID */
export function generateMissionId(): string {
  return `t_${++idCounter}`;
}
