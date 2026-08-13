import { Gender } from '@/types/member';

const MALE_NAMES = [
  '承志', '明远', '致远', '伯安', '仲康',
  '元庆', '文渊', '景行', '子衿', '怀瑾',
  '思齐', '鸿飞', '鹏举', '彦之', '君浩',
];

const FEMALE_NAMES = [
  '瑶光', '若兰', '清漪', '锦瑟', '碧落',
  '芷若', '素心', '凝霜', '明珠', '知画',
  '月华', '云裳', '琳琅', '映雪', '秋岚',
];

export function generateName(gender: Gender): string {
  const pool = gender === 'male' ? MALE_NAMES : FEMALE_NAMES;
  return pool[Math.floor(Math.random() * pool.length)];
}
