import { FamilyMember, Profession } from '@/types/member';
import { updateMemberLifeStage } from './memberService';
import { PROFESSION_CONFIG, getProfessionChangeCost, getUpgradeCost } from '@/constants/profession';

interface ActionResult {
  success: boolean;
  cost: number;
  message: string;
}

/** 成员转职：仅成年可转，消耗银两 = 1级升级费 */
export function changeProfession(
  member: FamilyMember,
  newProfession: Profession,
): { success: boolean; cost: number; message: string } {
  if (member.lifeStage !== 'adult') {
    return { success: false, cost: 0, message: '仅成年成员可转职' };
  }
  if (newProfession === 'none') {
    return { success: false, cost: 0, message: '不能转为无职业' };
  }
  if (member.profession === newProfession) {
    return { success: false, cost: 0, message: '已是该职业' };
  }

  const cost = getProfessionChangeCost(newProfession);
  member.profession = newProfession;
  member.professionLevel = 1;
  Object.assign(member, updateMemberLifeStage(member));

  return { success: true, cost, message: `转职为「${PROFESSION_CONFIG[newProfession].name}」` };
}

/** 职业升级：消耗银两，等级 +1，重算收益 */
export function upgradeProfession(member: FamilyMember): ActionResult {
  if (member.profession === 'none') {
    return { success: false, cost: 0, message: '该成员无职业' };
  }
  if (member.lifeStage !== 'adult') {
    return { success: false, cost: 0, message: '仅成年成员可升级职业' };
  }

  const config = PROFESSION_CONFIG[member.profession];
  if (member.professionLevel >= config.maxLevel) {
    return { success: false, cost: 0, message: '已达最高等级' };
  }

  const cost = getUpgradeCost(member.profession, member.professionLevel);
  member.professionLevel += 1;
  Object.assign(member, updateMemberLifeStage(member));

  return { success: true, cost, message: `${config.name} 升至 Lv.${member.professionLevel}` };
}

/**
 * 计算全族医者提供的成本减免百分比
 * 每位医者：基础 8% + 每级额外 2%，叠加后取上限 80%
 */
export function getDoctorCostReduction(members: FamilyMember[]): number {
  const doctors = members.filter(m => m.isAlive && m.profession === 'doctor');
  if (doctors.length === 0) return 0;

  let reduction = 0;
  for (const doc of doctors) {
    const base = PROFESSION_CONFIG.doctor.specialEffect.value;
    const perLevel = 0.02;
    reduction += base + (doc.professionLevel - 1) * perLevel;
  }
  return Math.min(reduction, 0.8);
}

/**
 * 计算武官提供的跑商亏损概率减免
 * 每位武官：基础 5% + 每级额外 1%
 */
export function getOfficerRiskReduction(members: FamilyMember[]): number {
  const officers = members.filter(m => m.isAlive && m.profession === 'officer');
  if (officers.length === 0) return 0;

  let reduction = 0;
  for (const off of officers) {
    const base = PROFESSION_CONFIG.officer.specialEffect.value;
    const perLevel = 0.01;
    reduction += base + (off.professionLevel - 1) * perLevel;
  }
  return reduction;
}

/**
 * 计算商人提供的跑商收益加成百分比
 * 每位商人：基础 15% + 每级额外 3%
 */
export function getMerchantTradingBonus(members: FamilyMember[]): number {
  const merchants = members.filter(m => m.isAlive && m.profession === 'merchant');
  if (merchants.length === 0) return 0;

  let bonus = 0;
  for (const mer of merchants) {
    const base = PROFESSION_CONFIG.merchant.specialEffect.value;
    const perLevel = 0.03;
    bonus += base + (mer.professionLevel - 1) * perLevel;
  }
  return bonus;
}
