import { Profession } from '@/types/member';

export interface DynastyConfig {
  id: number;
  name: string;
  description: string;
  prestigeRequirement: number;
  backgroundTheme: string;
  unlockProfessions: Profession[];
  /** 朝代基础收益加成（小数，如 0.1 表示 +10%） */
  incomeBonus: number;
}

/** 传承一次增加的声望 */
export const PRESTIGE_PER_INHERITANCE = 100;

/** 家主传承的年龄门槛（岁） */
export const INHERITANCE_MIN_AGE = 50;

/** 触发朝代更迭的最小代数 */
export const DYNASTY_CHANGE_MIN_GEN = 3;
/** 强制朝代更迭的代数 */
export const DYNASTY_CHANGE_MAX_GEN = 5;
/** 达到最小代数后每次传承触发朝代更迭的概率 */
export const DYNASTY_CHANGE_CHANCE = 0.3;

export const DYNASTY_CONFIGS: DynastyConfig[] = [
  {
    id: 1,
    name: '初代开拓',
    description: '白手起家，筚路蓝缕',
    prestigeRequirement: 0,
    backgroundTheme: '#FAF3E0',
    unlockProfessions: ['scholar', 'doctor'],
    incomeBonus: 0,
  },
  {
    id: 2,
    name: '蒸蒸日上',
    description: '家业初具规模，声望渐起',
    prestigeRequirement: 500,
    backgroundTheme: '#E8F5E9',
    unlockProfessions: ['merchant'],
    incomeBonus: 0.1,
  },
  {
    id: 3,
    name: '钟鸣鼎食',
    description: '名门望族，权倾一方',
    prestigeRequirement: 1500,
    backgroundTheme: '#FFF3E0',
    unlockProfessions: ['officer'],
    incomeBonus: 0.25,
  },
  {
    id: 4,
    name: '簪缨世家',
    description: '世代簪缨，累世公卿',
    prestigeRequirement: 3500,
    backgroundTheme: '#F3E5F5',
    unlockProfessions: [],
    incomeBonus: 0.45,
  },
  {
    id: 5,
    name: '钟灵毓秀',
    description: '钟灵毓秀，冠盖满京华',
    prestigeRequirement: 7000,
    backgroundTheme: '#FBE9E7',
    unlockProfessions: [],
    incomeBonus: 0.7,
  },
];

export function getDynastyConfig(id: number): DynastyConfig {
  return DYNASTY_CONFIGS.find(d => d.id === id) || DYNASTY_CONFIGS[0];
}

/** 获取下一个朝代配置，若已是最高朝代则返回 null */
export function getNextDynastyConfig(id: number): DynastyConfig | null {
  return DYNASTY_CONFIGS.find(d => d.id === id + 1) || null;
}
