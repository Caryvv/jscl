import { FamilyMember, Aptitude, Gender } from '@/types/member';
import { APTITUDE_WEIGHT, AGE_THRESHOLD, CHILD_COST_BASE, ELDER_COST_BASE, ADULT_INCOME_BASE, APTITUDE_INCOME_MULTIPLIER, PROFESSION_INCOME_MULTIPLIER, DEATH_AGE_VARIANCE } from '@/constants/member';
import { getGenerationChar, generateGivenName, generateOutsiderName } from '@/utils/random';

/** 组合家族成员全名：姓氏 + 辈分字 + 名 */
export function composeFamilyName(surname: string, generation: number, givenName: string): string {
  return `${surname}${getGenerationChar(generation)}${givenName}`;
}

export function updateMemberLifeStage(member: FamilyMember): FamilyMember {
  const updated = { ...member };
  if (updated.age <= AGE_THRESHOLD.CHILD_MAX) {
    updated.lifeStage = 'child';
    updated.monthlyCost = calcChildCost(updated.aptitude);
    updated.monthlyIncome = 0;
  } else if (updated.age <= AGE_THRESHOLD.ADULT_MAX) {
    updated.lifeStage = 'adult';
    updated.monthlyCost = 0;
    updated.monthlyIncome = calcAdultIncome(updated);
  } else {
    updated.lifeStage = 'elder';
    updated.monthlyCost = calcElderCost(updated.age);
    updated.monthlyIncome = Math.floor(calcAdultIncome(updated) * 0.3);
  }
  return updated;
}

function calcChildCost(aptitude: Aptitude): number {
  const multiplier = APTITUDE_WEIGHT[aptitude];
  return CHILD_COST_BASE * multiplier;
}

function calcAdultIncome(member: FamilyMember): number {
  const base = ADULT_INCOME_BASE;
  const aptMultiplier = APTITUDE_INCOME_MULTIPLIER[member.aptitude];
  const profMultiplier = PROFESSION_INCOME_MULTIPLIER[member.profession] || 1;
  const levelBonus = 1 + (member.professionLevel - 1) * 0.1;
  const incomeMult = 1 + (member.incomeMultiplier || 0);
  return Math.floor(base * aptMultiplier * profMultiplier * levelBonus * incomeMult);
}

function calcElderCost(age: number): number {
  return ELDER_COST_BASE + Math.floor((age - AGE_THRESHOLD.ADULT_MAX) / 12) * 10;
}

export function getDeathAge(member: FamilyMember): number {
  const baseDeath = AGE_THRESHOLD.ELDER_MAX;
  const variance = Math.floor(Math.random() * DEATH_AGE_VARIANCE * 2) - DEATH_AGE_VARIANCE;
  const aptitudeBonus = (APTITUDE_WEIGHT[member.aptitude] - 1) * 12;
  const lifeBonus = member.lifeBonus || 0;
  return baseDeath + variance + aptitudeBonus + lifeBonus;
}

export function inheritAptitude(father: FamilyMember, mother: FamilyMember): Aptitude {
  const avgWeight = (APTITUDE_WEIGHT[father.aptitude] + APTITUDE_WEIGHT[mother.aptitude]) / 2;
  const offset = (Math.random() - 0.5) * 1.5;
  let finalWeight = Math.round(avgWeight + offset);
  finalWeight = Math.max(1, Math.min(4, finalWeight));

  const breakthroughChance = (avgWeight - 1) * 0.08;
  if (Math.random() < breakthroughChance && finalWeight < 4) {
    finalWeight += 1;
  }

  const weightMap: Aptitude[] = ['normal', 'good', 'excellent', 'genius'];
  return weightMap[finalWeight - 1];
}

const APTITUDE_ORDER: Aptitude[] = ['normal', 'good', 'excellent', 'genius'];

/** 提升一档资质（未满天才则 +1 档），返回新资质 */
export function upgradeAptitude(aptitude: Aptitude): Aptitude {
  const idx = APTITUDE_ORDER.indexOf(aptitude);
  if (idx < APTITUDE_ORDER.length - 1) return APTITUDE_ORDER[idx + 1];
  return aptitude;
}

/** 随机重掷资质 */
export function rerollAptitude(): Aptitude {
  const r = Math.random();
  if (r < 0.5) return 'normal';
  if (r < 0.75) return 'good';
  if (r < 0.92) return 'excellent';
  return 'genius';
}

let idCounter = Date.now();
export function generateMemberId(): string {
  return `m_${++idCounter}`;
}

/**
 * 创建初始家族：仅一位创始人（单人）。
 * 创始人为未婚成年人，随游戏进度自动婚配、生育后代。
 * @param surname 家族姓氏
 * @param gender  创始人性别
 * @param givenName 创始人个人名（默认「家主」）
 */
export function createInitialFamily(
  surname: string,
  gender: Gender = 'male',
  givenName = '家主',
): FamilyMember[] {
  const founder: FamilyMember = {
    id: generateMemberId(),
    name: composeFamilyName(surname, 1, givenName),
    gender,
    role: gender === 'male' ? 'patriarch' : 'matriarch',
    age: 20 * 12,
    lifeStage: 'adult',
    aptitude: 'excellent',
    profession: 'none',
    professionLevel: 3,
    monthlyIncome: 0,
    monthlyCost: 0,
    spouseId: '',
    parentIds: [],
    childrenIds: [],
    isAlive: true,
    birthMonth: 0,
    deathMonth: null,
    breakthroughCount: 0,
    lifeBonus: 0,
    incomeMultiplier: 0,
    surname,
    generation: 1,
    givenName,
    romanceStage: 'single',
  };

  return [updateMemberLifeStage(founder)];
}

/**
 * 为家族成员生成一位外来配偶（婚配加入家族）
 * 外来配偶保留本姓，不占用辈分（generation=0），资质随机
 */
export function createSpouse(target: FamilyMember, gameMonth: number): FamilyMember {
  const gender: Gender = target.gender === 'male' ? 'female' : 'male';
  const { surname, givenName } = generateOutsiderName(gender);
  // 配偶年龄与目标接近（±3 岁）
  const ageOffset = (Math.floor(Math.random() * 7) - 3) * 12;
  const age = Math.max(20 * 12, target.age + ageOffset);

  const spouse: FamilyMember = {
    id: generateMemberId(),
    name: `${surname}${givenName}`,
    gender,
    role: 'collateral',
    age,
    lifeStage: 'adult',
    aptitude: rerollAptitude(),
    profession: 'none',
    professionLevel: 1,
    monthlyIncome: 0,
    monthlyCost: 0,
    spouseId: target.id,
    parentIds: [],
    childrenIds: [],
    isAlive: true,
    birthMonth: gameMonth - age,
    deathMonth: null,
    breakthroughCount: 0,
    lifeBonus: 0,
    incomeMultiplier: 0,
    surname,
    generation: 0,
    givenName,
    romanceStage: 'married',
  };

  return updateMemberLifeStage(spouse);
}

export function createChild(
  father: FamilyMember,
  mother: FamilyMember,
  gender: 'male' | 'female',
  gameMonth: number,
  surname: string,
  generation: number,
  givenName: string,
): FamilyMember {
  const aptitude = inheritAptitude(father, mother);

  const child: FamilyMember = {
    id: generateMemberId(),
    name: composeFamilyName(surname, generation, givenName),
    gender,
    role: 'offspring',
    age: 0,
    lifeStage: 'child',
    aptitude,
    profession: 'none',
    professionLevel: 1,
    monthlyIncome: 0,
    monthlyCost: 0,
    spouseId: null,
    parentIds: [father.id, mother.id],
    childrenIds: [],
    isAlive: true,
    birthMonth: gameMonth,
    deathMonth: null,
    breakthroughCount: 0,
    lifeBonus: 0,
    incomeMultiplier: 0,
    surname,
    generation,
    givenName,
    romanceStage: 'single',
  };

  return updateMemberLifeStage(child);
}
