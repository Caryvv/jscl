import { Gender } from '@/types/member';

/** 辈分字（按代数顺序取用，第 N 代用第 N 个字） */
export const GENERATION_CHARS = [
  '德', '承', '继', '世', '泽',
  '文', '兴', '宗', '耀', '安',
  '嘉', '瑞', '昌', '隆', '延',
  '铭', '尚', '弘', '睿', '祥',
];

const MALE_NAMES = [
  '志', '远', '安', '康', '庆',
  '渊', '行', '衿', '瑾', '齐',
  '飞', '举', '之', '浩', '轩',
];

const FEMALE_NAMES = [
  '光', '兰', '漪', '瑟', '落',
  '若', '心', '霜', '珠', '画',
  '华', '裳', '琅', '雪', '岚',
];

/** 生成一个个人名（单字），姓氏与辈分字之外的部分 */
export function generateGivenName(gender: Gender): string {
  const pool = gender === 'male' ? MALE_NAMES : FEMALE_NAMES;
  return pool[Math.floor(Math.random() * pool.length)];
}

/** 取指定代数的辈分字（代数从 1 开始） */
export function getGenerationChar(generation: number): string {
  if (generation <= 0) return '';
  const idx = (generation - 1) % GENERATION_CHARS.length;
  return GENERATION_CHARS[idx];
}

/** 常见姓氏池，用于随机生成外来配偶的本姓 */
const SURNAMES = ['林', '沈', '苏', '陆', '柳', '云', '慕', '江', '楚', '洛'];

/** 随机生成一个外来配偶的姓氏 */
export function generateSurname(): string {
  return SURNAMES[Math.floor(Math.random() * SURNAMES.length)];
}

/** 生成外来配偶的完整名（本姓 + 单字名，不带辈分） */
export function generateOutsiderName(gender: Gender): { surname: string; givenName: string } {
  return { surname: generateSurname(), givenName: generateGivenName(gender) };
}

/** 兼容旧调用：生成一个不含姓氏的名字 */
export function generateName(gender: Gender): string {
  return generateGivenName(gender);
}
