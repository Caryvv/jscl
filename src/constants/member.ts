import { Aptitude } from '@/types/member';

export const AGE_THRESHOLD = {
  CHILD_MAX: 16 * 12,
  ADULT_MAX: 50 * 12,
  ELDER_MAX: 75 * 12,
};

export const APTITUDE_WEIGHT: Record<Aptitude, number> = {
  normal: 1,
  good: 2,
  excellent: 3,
  genius: 4,
};

export const CHILD_COST_BASE = 20;
export const ELDER_COST_BASE = 30;
export const ADULT_INCOME_BASE = 100;

export const APTITUDE_INCOME_MULTIPLIER: Record<Aptitude, number> = {
  normal: 1,
  good: 1.5,
  excellent: 2,
  genius: 3,
};

export const PROFESSION_INCOME_MULTIPLIER: Record<string, number> = {
  none: 1,
  scholar: 1.3,
  merchant: 1.5,
  officer: 1.2,
  doctor: 1.1,
};

export const DEATH_AGE_VARIANCE = 24;
export const ADD_CHILD_COOLDOWN = 300;
export const ADD_CHILD_COST = 500;

/** 添丁福报：按累计出生孩子数解锁的阶梯奖励 */
export interface BirthMilestone {
  id: string;
  births: number;
  title: string;
  rewards: { type: 'silver' | 'luckyCharm' | 'goldBar'; amount: number }[];
}

export const BIRTH_MILESTONES: BirthMilestone[] = [
  { id: 'birth_1', births: 1, title: '初为人父母', rewards: [{ type: 'silver', amount: 500 }] },
  { id: 'birth_3', births: 3, title: '儿孙绕膝', rewards: [{ type: 'luckyCharm', amount: 3 }] },
  { id: 'birth_5', births: 5, title: '五子登科', rewards: [{ type: 'silver', amount: 2000 }, { type: 'luckyCharm', amount: 2 }] },
  { id: 'birth_10', births: 10, title: '瓜瓞绵绵', rewards: [{ type: 'luckyCharm', amount: 8 }] },
  { id: 'birth_20', births: 20, title: '百子千孙', rewards: [{ type: 'goldBar', amount: 1 }] },
  { id: 'birth_50', births: 50, title: '族望留芳', rewards: [{ type: 'goldBar', amount: 3 }, { type: 'luckyCharm', amount: 20 }] },
];
