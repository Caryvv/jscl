export type AdScene =
  | 'reward_offline_double'
  | 'reward_trade_double'
  | 'reward_daily_double'
  | 'reward_extend_offline'
  | 'reward_refresh_aptitude'
  | 'reward_free_prop';

export interface AdUnitConfig {
  scene: AdScene;
  wechatAdUnitId: string;
  douyinAdUnitId: string;
  dailyLimit: number;
}

/** 激励视频广告位配置（广告位 ID 需在平台后台申请后填入） */
export const AD_UNITS: AdUnitConfig[] = [
  { scene: 'reward_offline_double', wechatAdUnitId: 'TODO_wx_offline', douyinAdUnitId: 'TODO_tt_offline', dailyLimit: 5 },
  { scene: 'reward_trade_double', wechatAdUnitId: 'TODO_wx_trade', douyinAdUnitId: 'TODO_tt_trade', dailyLimit: 5 },
  { scene: 'reward_daily_double', wechatAdUnitId: 'TODO_wx_daily', douyinAdUnitId: 'TODO_tt_daily', dailyLimit: 1 },
  { scene: 'reward_extend_offline', wechatAdUnitId: 'TODO_wx_extend', douyinAdUnitId: 'TODO_tt_extend', dailyLimit: 1 },
  { scene: 'reward_refresh_aptitude', wechatAdUnitId: 'TODO_wx_aptitude', douyinAdUnitId: 'TODO_tt_aptitude', dailyLimit: 3 },
  { scene: 'reward_free_prop', wechatAdUnitId: 'TODO_wx_prop', douyinAdUnitId: 'TODO_tt_prop', dailyLimit: 3 },
];

/** 插屏广告位 ID */
export const INTERSTITIAL_AD_UNIT = { wechat: 'TODO_wx_interstitial', douyin: 'TODO_tt_interstitial' };

/** 插屏最小展示间隔（毫秒）：30 分钟 */
export const INTERSTITIAL_MIN_INTERVAL = 30 * 60 * 1000;
