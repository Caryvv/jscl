/** 资质等级 */
export type Aptitude = 'normal' | 'good' | 'excellent' | 'genius';

/** 成员身份 */
export type MemberRole = 'patriarch' | 'matriarch' | 'offspring' | 'collateral';

/** 年龄阶段 */
export type LifeStage = 'child' | 'adult' | 'elder';

/** 基础职业 */
export type Profession = 'none' | 'scholar' | 'merchant' | 'officer' | 'doctor';

/** 性别 */
export type Gender = 'male' | 'female';

export interface FamilyMember {
  id: string;
  name: string;
  gender: Gender;
  role: MemberRole;
  age: number;
  lifeStage: LifeStage;
  aptitude: Aptitude;
  profession: Profession;
  professionLevel: number;
  monthlyIncome: number;
  monthlyCost: number;
  spouseId: string | null;
  parentIds: string[];
  childrenIds: string[];
  isAlive: boolean;
  birthMonth: number;
  deathMonth: number | null;
  breakthroughCount: number;
}

export const APTITUDE_NAMES: Record<Aptitude, string> = {
  normal: '普通',
  good: '良好',
  excellent: '优秀',
  genius: '天才',
};

export const LIFE_STAGE_NAMES: Record<LifeStage, string> = {
  child: '幼年',
  adult: '成年',
  elder: '老年',
};

export const PROFESSION_NAMES: Record<Profession, string> = {
  none: '无',
  scholar: '书生',
  merchant: '商人',
  officer: '武官',
  doctor: '医者',
};
