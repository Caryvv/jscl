import { FamilyMember } from '@/types/member';
import { InheritanceCondition } from '@/types/dynasty';
import { INHERITANCE_MIN_AGE } from '@/constants/dynasty';

/** 获取当前家主 */
export function getPatriarch(members: FamilyMember[]): FamilyMember | undefined {
  return members.find(m => m.role === 'patriarch' && m.isAlive);
}

/** 统计可继承的成年子嗣（成年或老年、存活、身份为后代/旁系） */
export function getAdultHeirs(members: FamilyMember[]): FamilyMember[] {
  return members.filter(
    m =>
      m.isAlive &&
      (m.role === 'offspring' || m.role === 'collateral') &&
      (m.lifeStage === 'adult' || m.lifeStage === 'elder'),
  );
}

/** 计算当前朝代/代数所需声望 */
export function calcRequiredPrestige(generationCount: number): number {
  return generationCount * 200;
}

/** 判定传承条件 */
export function checkInheritanceConditions(
  members: FamilyMember[],
  prestige: number,
  generationCount: number,
): InheritanceCondition[] {
  const patriarch = getPatriarch(members);
  const patriarchAge = patriarch?.age || 0;
  const requiredPrestige = calcRequiredPrestige(generationCount);
  const heirCount = getAdultHeirs(members).length;

  return [
    {
      type: 'patriarch_age',
      description: `家主年满 ${INHERITANCE_MIN_AGE} 岁`,
      required: INHERITANCE_MIN_AGE,
      current: patriarchAge,
      satisfied: patriarchAge >= INHERITANCE_MIN_AGE,
    },
    {
      type: 'prestige',
      description: `家族声望达到 ${requiredPrestige}`,
      required: requiredPrestige,
      current: prestige,
      satisfied: prestige >= requiredPrestige,
    },
    {
      type: 'adult_heirs',
      description: '至少 1 位成年子嗣可继承',
      required: 1,
      current: heirCount,
      satisfied: heirCount >= 1,
    },
  ];
}

/** 是否满足全部传承条件 */
export function canInherit(conditions: InheritanceCondition[]): boolean {
  return conditions.every(c => c.satisfied);
}
