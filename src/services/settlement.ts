import { FamilyMember } from '@/types/member';
import { SettlementResult } from '@/types/resource';
import { updateMemberLifeStage, getDeathAge } from './memberService';

export function settleMonth(members: FamilyMember[], servantBonus: number): SettlementResult {
  const aliveMembers = members.filter(m => m.isAlive);
  let totalIncome = 0;
  let totalCost = 0;

  for (const member of aliveMembers) {
    member.age += 1;
    const updatedMember = updateMemberLifeStage(member);

    totalIncome += updatedMember.monthlyIncome;
    totalCost += updatedMember.monthlyCost;

    if (updatedMember.lifeStage === 'elder' && updatedMember.age >= getDeathAge(updatedMember)) {
      updatedMember.isAlive = false;
      updatedMember.deathMonth = member.age;
    }
  }

  const incomeBonus = Math.floor(totalIncome * (servantBonus / 100));

  return {
    totalIncome: totalIncome + incomeBonus,
    totalCost,
    netIncome: totalIncome + incomeBonus - totalCost,
    gameMonth: 0,
  };
}

export function calcFamilyMonthlyIncome(members: FamilyMember[], servantBonus: number): number {
  const aliveMembers = members.filter(m => m.isAlive);
  let total = 0;
  for (const member of aliveMembers) {
    if (member.lifeStage === 'adult' || member.lifeStage === 'elder') {
      total += member.monthlyIncome - member.monthlyCost;
    } else {
      total -= member.monthlyCost;
    }
  }
  const bonus = Math.floor(Math.max(0, total) * (servantBonus / 100));
  return total + bonus;
}
