export type ServantType = 'accountant' | 'guard' | 'steward';

export interface Servant {
  id: string;
  type: ServantType;
  name: string;
  icon: string;
  level: number;
  maxLevel: number;
  baseCost: number;
  costGrowth: number;
  effectDesc: string;
  effectValue: number;
  effectGrowth: number;
}

export const SERVANT_NAMES: Record<ServantType, string> = {
  accountant: '账房家丁',
  guard: '护院家丁',
  steward: '管家家丁',
};
