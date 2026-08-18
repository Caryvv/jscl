import { platform } from '@/utils/platform';
import { usePrivilegeStore } from '@/stores/privilegeStore';
import { AdScene, AD_UNITS, INTERSTITIAL_AD_UNIT, INTERSTITIAL_MIN_INTERVAL } from '@/constants/ad';
import { getStorage, setStorage } from '@/utils/storage';
import { getTodayStr } from '@/services/welfareService';

interface AdDailyState {
  date: string;
  counts: Partial<Record<AdScene, number>>;
}

function loadDailyState(): AdDailyState {
  const saved = getStorage<AdDailyState>('adDailyState', { date: '', counts: {} });
  // 跨天重置
  if (saved.date !== getTodayStr()) {
    return { date: getTodayStr(), counts: {} };
  }
  return saved;
}

function saveDailyState(state: AdDailyState): void {
  setStorage('adDailyState', state);
}

/** 某场景今日剩余可看次数 */
export function getRemainingCount(scene: AdScene): number {
  const cfg = AD_UNITS.find(c => c.scene === scene);
  if (!cfg) return 0;
  const state = loadDailyState();
  const used = state.counts[scene] || 0;
  return Math.max(0, cfg.dailyLimit - used);
}

/**
 * 播放激励视频广告。返回是否完整观看并应发放奖励。
 * 非小程序环境或广告不可用时，直接视为观看成功（便于开发调试）。
 */
export async function showRewardVideo(scene: AdScene): Promise<boolean> {
  const cfg = AD_UNITS.find(c => c.scene === scene);
  if (!cfg) return false;

  if (getRemainingCount(scene) <= 0) {
    return false;
  }

  const grantReward = () => {
    const state = loadDailyState();
    state.counts[scene] = (state.counts[scene] || 0) + 1;
    saveDailyState(state);
  };

  // 非小程序环境：直接发奖
  if (!platform.isMiniApp) {
    grantReward();
    return true;
  }

  const adUnitId = platform.isDouyin ? cfg.douyinAdUnitId : cfg.wechatAdUnitId;
  const ad = platform.createRewardedVideoAd({ adUnitId });
  if (!ad) {
    // 广告实例创建失败，保守发奖，避免卡住用户体验
    grantReward();
    return true;
  }

  return new Promise<boolean>((resolve) => {
    let settled = false;
    const onClose = (res: any) => {
      ad.offClose(onClose);
      if (settled) return;
      settled = true;
      // isEnded 为 true 表示完整观看
      if (res && res.isEnded) {
        grantReward();
        resolve(true);
      } else {
        resolve(false);
      }
    };
    ad.onClose(onClose);
    ad.show().catch(() => {
      // 拉取失败时重新加载再播
      ad.load().then(() => ad.show()).catch(() => {
        if (!settled) { settled = true; resolve(false); }
      });
    });
  });
}

/** 插屏广告：受最小间隔与免广告特权约束 */
let interstitialAd: any = null;
let lastInterstitialAt = 0;

export async function showInterstitial(): Promise<void> {
  // 免广告特权用户跳过
  if (usePrivilegeStore.getState().isAdFree()) return;
  if (!platform.isMiniApp) return;

  const now = Date.now();
  if (now - lastInterstitialAt < INTERSTITIAL_MIN_INTERVAL) return;

  const adUnitId = platform.isDouyin ? INTERSTITIAL_AD_UNIT.douyin : INTERSTITIAL_AD_UNIT.wechat;
  if (!interstitialAd) {
    interstitialAd = platform.createInterstitialAd({ adUnitId });
  }
  if (!interstitialAd) return;

  try {
    await interstitialAd.show();
    lastInterstitialAt = now;
  } catch (e) {
    console.warn('[adService] interstitial show failed:', e);
  }
}
