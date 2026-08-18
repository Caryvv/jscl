import { TradeRoute } from '@/types/trading';

export const TRADE_ROUTES: TradeRoute[] = [
  {
    id: 'route_short',
    name: '短途贩粮',
    icon: '\uD83C\uDF3E',
    description: '低风险稳定收益，无亏损可能',
    risk: 'low',
    baseProfit: 300,
    volatility: 0.1,
    lossChance: 0,
    timeCost: 60,
    minMembers: 1,
    maxMembers: 1,
  },
  {
    id: 'route_medium',
    name: '中途贩绸',
    icon: '\uD83E\uDDF5',
    description: '中等风险，收益可观，小概率亏损',
    risk: 'medium',
    baseProfit: 800,
    volatility: 0.25,
    lossChance: 0.15,
    timeCost: 300,
    minMembers: 1,
    maxMembers: 2,
  },
  {
    id: 'route_high',
    name: '长途贩盐',
    icon: '\uD83E\uDDC2',
    description: '高风险高回报，存在较大亏损概率',
    risk: 'high',
    baseProfit: 2000,
    volatility: 0.4,
    lossChance: 0.3,
    timeCost: 900,
    minMembers: 1,
    maxMembers: 3,
  },
];

/** 每日派遣次数上限 */
export const MAX_DAILY_MISSIONS = 10;

/** 立即完成跑商所需消耗的福缘符数量 */
export const RUSH_COST_LUCKY_CHARM = 1;

/** 风险等级中文名 */
export const RISK_NAMES: Record<string, string> = {
  low: '低风险',
  medium: '中风险',
  high: '高风险',
};
