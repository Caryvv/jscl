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

/** 婚恋阶段：未婚 → 相识 → 熟悉 → 相爱 → 已婚 */
export type RomanceStage = 'single' | 'acquainted' | 'familiar' | 'inlove' | 'married';

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
  /** 额外寿命加成（月），由延年益寿丹等道具累加 */
  lifeBonus: number;
  /** 收益倍率加成（如金饭碗 +0.1 表示 +10%），用于计算月收益 */
  incomeMultiplier: number;
  /** 家族姓氏（外来配偶为其本姓） */
  surname: string;
  /** 辈分序号：第一代（创始）为 1，其子女为 2，依此递增 */
  generation: number;
  /** 名（姓氏与辈分字之外、玩家可自定义的部分） */
  givenName: string;
  /** 婚恋阶段 */
  romanceStage: RomanceStage;
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
