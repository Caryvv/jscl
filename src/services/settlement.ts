import { FamilyMember } from '@/types/member';
import { SettlementResult } from '@/types/resource';
import { updateMemberLifeStage, getDeathAge } from './memberService';
import { getDoctorCostReduction } from './professionService';

export function settleMonth(members: FamilyMember[], servantBonus: number): SettlementResult {
  const aliveMembers = members.filter(m => m.isAlive);
  const costReduction = getDoctorCostReduction(aliveMembers);
  let totalIncome = 0;
  let totalCost = 0;

  for (const member of aliveMembers) {
    member.age += 1;
    const updatedMember = updateMemberLifeStage(member);

    totalIncome += updatedMember.monthlyIncome;
    totalCost += Math.floor(updatedMember.monthlyCost * (1 - costReduction));

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
  const costReduction = getDoctorCostReduction(aliveMembers);
  let total = 0;
  for (const member of aliveMembers) {
    if (member.lifeStage === 'adult' || member.lifeStage === 'elder') {
      total += member.monthlyIncome - Math.floor(member.monthlyCost * (1 - costReduction));
    } else {
      total -= Math.floor(member.monthlyCost * (1 - costReduction));
    }
  }
  const bonus = Math.floor(Math.max(0, total) * (servantBonus / 100));
  return total + bonus;
}
