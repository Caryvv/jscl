import { Achievement } from '@/types/achievement';

export const ACHIEVEMENT_LIST: Achievement[] = [
  // ========== 财富类 ==========
  {
    id: 'wealth_1',
    name: '小有积蓄',
    description: '累计拥有 5000 银两',
    category: 'wealth',
    icon: '\uD83D\uDCB0',
    condition: { type: 'silver_reach', target: 5000 },
    rewards: [{ type: 'luckyCharm', amount: 2 }],
    sortOrder: 1,
  },
  {
    id: 'wealth_2',
    name: '家财万贯',
    description: '累计拥有 20000 银两',
    category: 'wealth',
    icon: '\uD83D\uDCB0',
    condition: { type: 'silver_reach', target: 20000 },
    rewards: [{ type: 'luckyCharm', amount: 5 }],
    sortOrder: 2,
  },
  {
    id: 'wealth_3',
    name: '富可敌国',
    description: '累计拥有 100000 银两',
    category: 'wealth',
    icon: '\uD83D\uDC8E',
    condition: { type: 'silver_reach', target: 100000 },
    rewards: [{ type: 'goldBar', amount: 1 }],
    sortOrder: 3,
  },

  // ========== 家族类 ==========
  {
    id: 'family_1',
    name: '人丁兴旺',
    description: '家族成员达到 5 人',
    category: 'family',
    icon: '\uD83D\uDC6A',
    condition: { type: 'member_count', target: 5 },
    rewards: [{ type: 'silver', amount: 1000 }],
    sortOrder: 10,
  },
  {
    id: 'family_2',
    name: '枝繁叶茂',
    description: '家族成员达到 10 人',
    category: 'family',
    icon: '\uD83C\uDF33',
    condition: { type: 'member_count', target: 10 },
    rewards: [{ type: 'luckyCharm', amount: 5 }],
    sortOrder: 11,
  },

  // ========== 跑商类 ==========
  {
    id: 'trading_1',
    name: '初涉商道',
    description: '完成 10 次跑商',
    category: 'trading',
    icon: '\uD83D\uDCE6',
    condition: { type: 'trade_count', target: 10 },
    rewards: [{ type: 'silver', amount: 800 }],
    sortOrder: 20,
  },
  {
    id: 'trading_2',
    name: '商贾巨富',
    description: '完成 50 次跑商',
    category: 'trading',
    icon: '\uD83D\uDE9A',
    condition: { type: 'trade_count', target: 50 },
    rewards: [{ type: 'luckyCharm', amount: 8 }],
    sortOrder: 21,
  },

  // ========== 成长类 ==========
  {
    id: 'growth_1',
    name: '神树初长',
    description: '神树等级达到 5 级',
    category: 'growth',
    icon: '\uD83C\uDF32',
    condition: { type: 'tree_level', target: 5 },
    rewards: [{ type: 'silver', amount: 1500 }],
    sortOrder: 30,
  },
  {
    id: 'growth_2',
    name: '天纵奇才',
    description: '拥有 1 位天资聪颖的成员',
    category: 'growth',
    icon: '\u2728',
    condition: { type: 'aptitude_genius_count', target: 1 },
    rewards: [{ type: 'luckyCharm', amount: 3 }],
    sortOrder: 31,
  },
  {
    id: 'growth_3',
    name: '一代宗师',
    description: '任一成员职业达到满级',
    category: 'growth',
    icon: '\uD83C\uDF93',
    condition: { type: 'profession_max', target: 10 },
    rewards: [{ type: 'goldBar', amount: 1 }],
    sortOrder: 32,
  },

  // ========== 特殊类 ==========
  {
    id: 'special_1',
    name: '忠仆得力',
    description: '任一家丁等级达到 5 级',
    category: 'special',
    icon: '\uD83D\uDC64',
    condition: { type: 'servant_level', target: 5 },
    rewards: [{ type: 'silver', amount: 2000 }],
    sortOrder: 40,
  },
];

export const CATEGORY_NAMES: Record<string, string> = {
  wealth: '财富',
  family: '家族',
  trading: '经商',
  growth: '成长',
  special: '特殊',
};
