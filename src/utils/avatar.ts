import { FamilyMember, Gender, Profession } from '@/types/member';

/** 已故墓碑 */
const DECEASED_AVATAR = '\uD83E\uDEA6';

/** 幼年头像池（不区分职业） */
const CHILD_AVATARS: Record<Gender, string[]> = {
  male: ['\uD83D\uDC66', '\uD83E\uDDD2', '\uD83D\uDC76'],
  female: ['\uD83D\uDC67', '\uD83E\uDDD2', '\uD83D\uDC76'],
};

/** 老年头像池（不区分职业） */
const ELDER_AVATARS: Record<Gender, string[]> = {
  male: ['\uD83D\uDC74', '\uD83E\uDDD3'],
  female: ['\uD83D\uDC75', '\uD83E\uDDD3'],
};

/** 成年头像池：按职业 + 性别区分 */
const ADULT_AVATARS: Record<Profession, Record<Gender, string[]>> = {
  none: {
    male: ['\uD83D\uDC68', '\uD83E\uDDD1', '\uD83D\uDC68\u200D\uD83C\uDF3E'],
    female: ['\uD83D\uDC69', '\uD83E\uDDD1', '\uD83D\uDC69\u200D\uD83C\uDF3E'],
  },
  scholar: {
    male: ['\uD83D\uDC68\u200D\uD83C\uDFEB', '\uD83D\uDC68\u200D\uD83C\uDF93', '\uD83E\uDDD1\u200D\uD83C\uDF93'],
    female: ['\uD83D\uDC69\u200D\uD83C\uDFEB', '\uD83D\uDC69\u200D\uD83C\uDF93', '\uD83E\uDDD1\u200D\uD83C\uDF93'],
  },
  merchant: {
    male: ['\uD83D\uDC68\u200D\uD83D\uDCBC', '\uD83E\uDD35'],
    female: ['\uD83D\uDC69\u200D\uD83D\uDCBC', '\uD83E\uDD35'],
  },
  officer: {
    male: ['\uD83D\uDC82', '\uD83E\uDD34'],
    female: ['\uD83D\uDC82', '\uD83D\uDC78'],
  },
  doctor: {
    male: ['\uD83D\uDC68\u200D\u2695\uFE0F', '\uD83E\uDDD1\u200D\u2695\uFE0F'],
    female: ['\uD83D\uDC69\u200D\u2695\uFE0F', '\uD83E\uDDD1\u200D\u2695\uFE0F'],
  },
};

/** 根据成员 id 生成稳定哈希，保证同一成员每次取到相同头像 */
function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) >>> 0;
  }
  return h;
}

/** 在头像池中按成员 id 稳定选取一个，让同类成员也各不相同 */
function pick(pool: string[], id: string): string {
  return pool[hashId(id) % pool.length];
}

/** 获取成员头像：先看存活状态，再按年龄段与职业区分，并按 id 在池内取值 */
export function getMemberAvatar(member: FamilyMember): string {
  if (!member.isAlive) return DECEASED_AVATAR;
  if (member.lifeStage === 'child') return pick(CHILD_AVATARS[member.gender], member.id);
  if (member.lifeStage === 'elder') return pick(ELDER_AVATARS[member.gender], member.id);
  const profPool = ADULT_AVATARS[member.profession] ?? ADULT_AVATARS.none;
  return pick(profPool[member.gender], member.id);
}
