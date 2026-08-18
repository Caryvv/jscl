const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

/**
 * 文本内容安全检测
 * @param {Object} event
 * @param {string} event.content 待检测文本
 *
 * 返回 { code, message, data: { pass } }
 * pass=true 表示内容合规
 */
exports.main = async (event) => {
  const { content } = event;
  if (!content) {
    return { code: 0, message: 'ok', data: { pass: true } };
  }

  try {
    // 微信 openapi 文本安全检测，scene=2 表示评论/昵称场景
    const res = await cloud.openapi.security.msgSecCheck({
      version: 2,
      scene: 2,
      content,
    });
    // errCode 0 且 result.suggest 为 pass 视为合规
    const suggest = res && res.result && res.result.suggest;
    const pass = res.errCode === 0 && suggest !== 'risky';
    return { code: 0, message: 'ok', data: { pass } };
  } catch (err) {
    // 命中安全策略时 SDK 会抛错（errCode 87014），判为不合规
    if (err && err.errCode === 87014) {
      return { code: 0, message: '内容含违规信息', data: { pass: false } };
    }
    // 其他异常保守放行，避免阻断正常用户
    console.error('[msgSecCheck] error:', err);
    return { code: 0, message: 'ok', data: { pass: true } };
  }
};
