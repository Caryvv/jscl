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
