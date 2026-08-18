import { Gender, MemberRole, Profession } from '@/types/member';

export interface GenealogyEntry {
  memberId: string;
  name: string;
  gender: Gender;
  role: MemberRole;
  aptitude: string;
  finalProfession: Profession;
  finalProfessionLevel: number;
  /** 出生时的游戏月 */
  birthMonth: number;
  /** 去世时的年龄（岁） */
  deathAge: number;
  /** 子嗣数量 */
  childrenCount: number;
  /** 去世时所属朝代名 */
  dynastyName: string;
  /** 自动生成的生平简介 */
  epitaph: string;
  /** 归档的现实时间戳 */
  archivedAt: number;
}
