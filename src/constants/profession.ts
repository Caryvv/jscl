import { Profession } from '@/types/member';

export interface ProfessionConfig {
  id: Profession;
  name: string;
  icon: string;
  description: string;
  /** 收益类型：稳定收益 / 跑商加成 / 全局Buff */
  incomeType: 'stable' | 'trading' | 'buff';
  /** 基础月收入 */
  baseIncome: number;
  /** 每级收益增长 */
  incomeGrowthPerLevel: number;
  /** 职业特殊效果 */
  specialEffect: {
    type: string;
    value: number;
    description: string;
  };
  /** 升级消耗函数（根据当前等级计算） */
  upgradeCost: (level: number) => number;
  /** 最大等级 */
  maxLevel: number;
}

export const PROFESSION_CONFIG: Record<Exclude<Profession, 'none'>, ProfessionConfig> = {
  scholar: {
    id: 'scholar',
    name: '书生',
    icon: '\uD83D\uDCDC',
    description: '稳定银两收益，收入均衡',
    incomeType: 'stable',
    baseIncome: 100,
    incomeGrowthPerLevel: 25,
    specialEffect: { type: 'none', value: 0, description: '无特殊效果' },
    upgradeCost: (lv) => 200 * lv * lv,
    maxLevel: 10,
  },
  merchant: {
    id: 'merchant',
    name: '商人',
    icon: '\uD83D\uDCB0',
    description: '跑商收益加成，擅长经商',
    incomeType: 'trading',
    baseIncome: 80,
    incomeGrowthPerLevel: 20,
    specialEffect: {
      type: 'trading_bonus',
      value: 0.15,
      description: '跑商收益 +15%（每级额外 +3%）',
    },
    upgradeCost: (lv) => 180 * lv * lv,
    maxLevel: 10,
  },
  officer: {
    id: 'officer',
    name: '武官',
    icon: '\u2694\uFE0F',
    description: '降低跑商风险，保家护院',
    incomeType: 'buff',
    baseIncome: 90,
    incomeGrowthPerLevel: 22,
    specialEffect: {
      type: 'risk_reduction',
      value: 0.05,
      description: '跑商亏损概率 -5%（每级额外 -1%）',
    },
    upgradeCost: (lv) => 220 * lv * lv,
    maxLevel: 10,
  },
  doctor: {
    id: 'doctor',
    name: '医者',
    icon: '\uD83C\uDF3F',
    description: '降低全族养育/赡养成本',
    incomeType: 'buff',
    baseIncome: 70,
    incomeGrowthPerLevel: 18,
    specialEffect: {
      type: 'cost_reduction',
      value: 0.08,
      description: '全族养育/赡养支出 -8%（每级额外 -2%）',
    },
    upgradeCost: (lv) => 160 * lv * lv,
    maxLevel: 10,
  },
};

/** 可选择的职业列表（排除 none） */
export const SELECTABLE_PROFESSIONS = Object.values(PROFESSION_CONFIG);

/** 获取转职费用（等于1级升级费） */
export function getProfessionChangeCost(profession: Profession): number {
  if (profession === 'none') return 0;
  return PROFESSION_CONFIG[profession].upgradeCost(1);
}

/** 获取升级到下一级的费用 */
export function getUpgradeCost(profession: Profession, currentLevel: number): number {
  if (profession === 'none') return 0;
  return PROFESSION_CONFIG[profession].upgradeCost(currentLevel);
}
