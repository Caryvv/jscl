import { FamilyMember, PROFESSION_NAMES, APTITUDE_NAMES, MemberRole } from '@/types/member';
import { GenealogyEntry } from '@/types/genealogy';

const ROLE_DESC: Record<MemberRole, string> = {
  patriarch: '曾任家主',
  matriarch: '曾任主母',
  offspring: '家族子嗣',
  collateral: '家族旁支',
};

/** 生成生平简介 */
export function generateEpitaph(entry: GenealogyEntry): string {
  const parts: string[] = [];
  parts.push(`${entry.name}，${ROLE_DESC[entry.role]}，`);

  parts.push(`天资${entry.aptitude}，`);

  if (entry.finalProfession !== 'none') {
    parts.push(`终成${PROFESSION_NAMES[entry.finalProfession]}${entry.finalProfessionLevel}级，`);
  }

  parts.push(`享年${entry.deathAge}岁。`);

  if (entry.childrenCount > 0) {
    parts.push(`育有${entry.childrenCount}名子女，`);
  }

  parts.push(`一生历经【${entry.dynastyName}】，家风绵延。`);

  return parts.join('');
}

/** 将一位去世成员转为族谱条目 */
export function createGenealogyEntry(
  member: FamilyMember,
  dynastyName: string,
): GenealogyEntry {
  const entry: GenealogyEntry = {
    memberId: member.id,
    name: member.name,
    gender: member.gender,
    role: member.role,
    aptitude: APTITUDE_NAMES[member.aptitude],
    finalProfession: member.profession,
    finalProfessionLevel: member.professionLevel,
    birthMonth: member.birthMonth,
    deathAge: Math.floor(member.age),
    childrenCount: member.childrenIds.length,
    dynastyName,
    epitaph: '',
    archivedAt: Date.now(),
  };
  entry.epitaph = generateEpitaph(entry);
  return entry;
}
