export interface DynastyInfo {
  /** 当前朝代配置 id */
  id: number;
  /** 当前朝代内传承代数（从 1 开始） */
  generationCount: number;
  /** 家族声望值 */
  prestige: number;
  /** 朝代开始时的现实时间戳 */
  startTime: number;
}

export interface InheritanceRecord {
  id: string;
  dynastyId: number;
  dynastyName: string;
  generationIndex: number;
  oldPatriarchName: string;
  newPatriarchName: string;
  inheritedSilver: number;
  /** 现实时间戳 */
  timestamp: number;
}

export type InheritanceConditionType = 'patriarch_age' | 'prestige' | 'adult_heirs';

export interface InheritanceCondition {
  type: InheritanceConditionType;
  description: string;
  required: number;
  current: number;
  satisfied: boolean;
}
