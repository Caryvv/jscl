import { Heirloom, HeirloomRarity } from '@/types/collection';

/** 一次抽取消耗的福缘符 */
export const DRAW_COST_LUCKY_CHARM = 10;

/** 稀有度中文名 */
export const RARITY_NAMES: Record<HeirloomRarity, string> = {
  common: '凡品',
  rare: '珍品',
  epic: '奇珍',
  legendary: '传世',
};

/** 稀有度颜色（供 UI 使用） */
export const RARITY_COLORS: Record<HeirloomRarity, string> = {
  common: '#9E9E9E',
  rare: '#4A90D9',
  epic: '#9B59B6',
  legendary: '#E6A23C',
};

/** 稀有度抽取概率区间 */
export const RARITY_PROBABILITY: { rarity: HeirloomRarity; threshold: number }[] = [
  { rarity: 'common', threshold: 0.5 },
  { rarity: 'rare', threshold: 0.8 },
  { rarity: 'epic', threshold: 0.95 },
  { rarity: 'legendary', threshold: 1.0 },
];

/** 升级消耗：目标等级 → 福缘符消耗 */
export function getUpgradeCost(currentLevel: number): number {
  return 5 + currentLevel * 3;
}

export const HEIRLOOM_POOL: Heirloom[] = [
  // ========== 凡品 common ==========
  {
    id: 'jade_ruyi',
    name: '青玉如意',
    rarity: 'common',
    description: '温润的青玉如意，寓意事事顺遂，家族月收益小幅提升。',
    icon: '\uD83E\uDDE7',
    maxLevel: 5,
    bonus: { type: 'income', baseValue: 0.03, growthPerLevel: 0.01 },
  },
  {
    id: 'bronze_mirror',
    name: '古铜宝镜',
    rarity: 'common',
    description: '斑驳的古铜镜，照见家宅平安，略微降低家族开支。',
    icon: '\uD83E\uDE9E',
    maxLevel: 5,
    bonus: { type: 'cost', baseValue: 0.03, growthPerLevel: 0.01 },
  },
  {
    id: 'silk_scroll',
    name: '锦绣画卷',
    rarity: 'common',
    description: '一幅山水画卷，怡情养性，提升离线收益时长效率。',
    icon: '\uD83D\uDCDC',
    maxLevel: 5,
    bonus: { type: 'offline', baseValue: 0.05, growthPerLevel: 0.02 },
  },

  // ========== 珍品 rare ==========
  {
    id: 'jade_pendant',
    name: '羊脂玉佩',
    rarity: 'rare',
    description: '洁白无瑕的羊脂玉佩，佩之者气度不凡，家族收益提升。',
    icon: '\uD83D\uDC8E',
    maxLevel: 8,
    bonus: { type: 'income', baseValue: 0.06, growthPerLevel: 0.02 },
  },
  {
    id: 'abacus',
    name: '紫檀算盘',
    rarity: 'rare',
    description: '精工紫檀算盘，商道通达，跑商收益提升。',
    icon: '\uD83E\uDDEE',
    maxLevel: 8,
    bonus: { type: 'trading', baseValue: 0.08, growthPerLevel: 0.02 },
  },
  {
    id: 'ink_stone',
    name: '端溪古砚',
    rarity: 'rare',
    description: '文房至宝，翰墨飘香，提升族中子弟资质成长。',
    icon: '\uD83D\uDDA4',
    maxLevel: 8,
    bonus: { type: 'aptitude', baseValue: 0.05, growthPerLevel: 0.015 },
  },

  // ========== 奇珍 epic ==========
  {
    id: 'ruyi_scepter',
    name: '鎏金权杖',
    rarity: 'epic',
    description: '象征无上权柄的鎏金权杖，家族月收益大幅提升。',
    icon: '\uD83D\uDD31',
    maxLevel: 10,
    bonus: { type: 'income', baseValue: 0.1, growthPerLevel: 0.03 },
  },
  {
    id: 'pearl_night',
    name: '夜明宝珠',
    rarity: 'epic',
    description: '暗夜生辉的稀世宝珠，跑商收益大幅提升。',
    icon: '\uD83D\uDD2E',
    maxLevel: 10,
    bonus: { type: 'trading', baseValue: 0.12, growthPerLevel: 0.03 },
  },

  // ========== 传世 legendary ==========
  {
    id: 'dragon_seal',
    name: '传国龙玺',
    rarity: 'legendary',
    description: '镇族之宝，龙气加身，家族收益极大提升，泽被子孙。',
    icon: '\uD83D\uDC09',
    maxLevel: 12,
    bonus: { type: 'income', baseValue: 0.15, growthPerLevel: 0.04 },
  },
  {
    id: 'phoenix_crown',
    name: '凤鸣朝冠',
    rarity: 'legendary',
    description: '凤凰涅槃所化朝冠，福泽绵长，大幅降低家族开支。',
    icon: '\uD83D\uDC51',
    maxLevel: 12,
    bonus: { type: 'cost', baseValue: 0.15, growthPerLevel: 0.04 },
  },
];
