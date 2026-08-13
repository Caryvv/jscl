import { FamilyMember, Aptitude, LifeStage } from '@/types/member';
import { APTITUDE_WEIGHT, AGE_THRESHOLD, CHILD_COST_BASE, ELDER_COST_BASE, ADULT_INCOME_BASE, APTITUDE_INCOME_MULTIPLIER, PROFESSION_INCOME_MULTIPLIER, DEATH_AGE_VARIANCE } from '@/constants/member';

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
  return Math.floor(base * aptMultiplier * profMultiplier * levelBonus);
}

function calcElderCost(age: number): number {
  return ELDER_COST_BASE + Math.floor((age - AGE_THRESHOLD.ADULT_MAX) / 12) * 10;
}

export function getDeathAge(member: FamilyMember): number {
  const baseDeath = AGE_THRESHOLD.ELDER_MAX;
  const variance = Math.floor(Math.random() * DEATH_AGE_VARIANCE * 2) - DEATH_AGE_VARIANCE;
  const aptitudeBonus = (APTITUDE_WEIGHT[member.aptitude] - 1) * 12;
  return baseDeath + variance + aptitudeBonus;
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

let idCounter = Date.now();
export function generateMemberId(): string {
  return `m_${++idCounter}`;
}

export function createInitialFamily(): FamilyMember[] {
  const patriarch: FamilyMember = {
    id: generateMemberId(),
    name: '家主',
    gender: 'male',
    role: 'patriarch',
    age: 26 * 12,
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
  };

  const matriarch: FamilyMember = {
    id: generateMemberId(),
    name: '主母',
    gender: 'female',
    role: 'matriarch',
    age: 24 * 12,
    lifeStage: 'adult',
    aptitude: 'good',
    profession: 'none',
    professionLevel: 2,
    monthlyIncome: 0,
    monthlyCost: 0,
    spouseId: patriarch.id,
    parentIds: [],
    childrenIds: [],
    isAlive: true,
    birthMonth: 0,
    deathMonth: null,
    breakthroughCount: 0,
  };

  patriarch.spouseId = matriarch.id;

  const updatedPatriarch = updateMemberLifeStage(patriarch);
  const updatedMatriarch = updateMemberLifeStage(matriarch);

  return [updatedPatriarch, updatedMatriarch];
}

export function createChild(
  father: FamilyMember,
  mother: FamilyMember,
  name: string,
  gender: 'male' | 'female',
  gameMonth: number,
): FamilyMember {
  const aptitude = inheritAptitude(father, mother);

  const child: FamilyMember = {
    id: generateMemberId(),
    name,
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
  };

  return updateMemberLifeStage(child);
}
