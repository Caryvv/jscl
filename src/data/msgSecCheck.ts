/** 本地敏感词表（mock 用，真机走 wx.cloud openapi 检测） */
const SENSITIVE_WORDS = ['测试违规', '广告', '涉政', '色情', '赌博', '毒品'];

/**
 * 本地 mock 云函数：非 weapp 环境模拟文本内容安全检测。
 * 命中本地敏感词表则判为不合规。
 */
export default function msgSecCheck(data: { content: string }): { pass: boolean } {
  const content = data?.content || '';
  const hit = SENSITIVE_WORDS.some(w => content.includes(w));
  return { pass: !hit };
}
