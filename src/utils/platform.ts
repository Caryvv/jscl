import Taro from '@tarojs/taro';

const TARO_ENV = process.env.TARO_ENV;
export const isWeChat = TARO_ENV === 'weapp';
export const isDouyin = TARO_ENV === 'tt';
/** 是否为支持原生小程序能力的运行环境 */
export const isMiniApp = isWeChat || isDouyin;

/** 全局宿主对象（wx / tt），非小程序环境为 null */
function getHost(): any {
  if (isWeChat) return typeof wx !== 'undefined' ? wx : null;
  if (isDouyin) return typeof tt !== 'undefined' ? tt : null;
  return null;
}

/**
 * 平台差异适配层：统一封装登录/支付/分享/广告/内容安全/震动等原生能力。
 * 非小程序环境（H5/RN/预览）下相关方法优雅降级，返回安全默认值，不抛异常。
 */
export const platform = {
  isWeChat,
  isDouyin,
  isMiniApp,
  TARO_ENV,

  /** 登录，返回 code */
  login: async (): Promise<string> => {
    const host = getHost();
    if (!host) return '';
    try {
      const res = await host.login();
      return res?.code || '';
    } catch (e) {
      console.warn('[platform] login failed:', e);
      return '';
    }
  },

  /** 支付：微信 requestPayment / 抖音 pay */
  requestPayment: async (opts: any): Promise<boolean> => {
    const host = getHost();
    if (!host) return false;
    try {
      if (isWeChat) {
        await host.requestPayment(opts);
      } else {
        await host.pay(opts);
      }
      return true;
    } catch (e) {
      console.warn('[platform] payment failed/cancelled:', e);
      return false;
    }
  },

  /** 创建激励视频广告实例 */
  createRewardedVideoAd: (opts: any): any => {
    const host = getHost();
    if (!host || typeof host.createRewardedVideoAd !== 'function') return null;
    return host.createRewardedVideoAd(opts);
  },

  /** 创建插屏广告实例 */
  createInterstitialAd: (opts: any): any => {
    const host = getHost();
    if (!host || typeof host.createInterstitialAd !== 'function') return null;
    return host.createInterstitialAd(opts);
  },

  /** 内容安全检测：返回是否通过 */
  checkContent: async (text: string): Promise<boolean> => {
    if (!isMiniApp) return true; // 非小程序环境默认放行
    try {
      if (isWeChat) {
        const res: any = await Taro.cloud.callFunction({ name: 'msgSecCheck', data: { content: text } });
        return res?.result?.pass === true;
      }
      const host = getHost();
      const res = await host.security.checkContent({ content: text });
      return res?.errCode === 0 || res?.errcode === 0;
    } catch (e) {
      console.warn('[platform] checkContent failed:', e);
      // 检测服务异常时保守放行，避免阻断正常用户
      return true;
    }
  },

  /** 震动反馈 */
  vibrateShort: (): void => {
    const host = getHost();
    if (!host || typeof host.vibrateShort !== 'function') return;
    try {
      host.vibrateShort({ type: 'light' });
    } catch (e) {
      // 忽略震动失败
    }
  },

  /** 获取用户信息（含未成年标记，抖音支持） */
  getUserInfo: async (): Promise<any> => {
    const host = getHost();
    if (!host) return null;
    try {
      return await host.getUserInfo({ withCredentials: true });
    } catch (e) {
      console.warn('[platform] getUserInfo failed:', e);
      return null;
    }
  },
};
