import Taro from '@tarojs/taro';
import { platform } from '@/utils/platform';
import { MINOR_SINGLE_LIMIT, MINOR_MONTHLY_LIMIT } from '@/constants/payment';
import { getStorage, setStorage } from '@/utils/storage';
import { getTodayStr } from '@/services/welfareService';

/** 未成年人每日游玩时长上限（秒）：1.5 小时 */
const MINOR_DAILY_LIMIT = 90 * 60;
/** 宵禁时段：21:00 - 次日 8:00 */
const CURFEW_START_HOUR = 21;
const CURFEW_END_HOUR = 8;

interface GuardPlayState {
  date: string;
  playSeconds: number;
}

interface MonthlyPayState {
  month: string; // YYYY-MM
  amount: number; // 分
}

class YouthGuardService {
  private isMinor = false;
  private tickTimer: any = null;
  private playState: GuardPlayState = { date: getTodayStr(), playSeconds: 0 };

  /** 初始化：在 app onLaunch 调用 */
  async init(): Promise<void> {
    // 抖音可直接读取未成年标记；微信需结合实名认证结果，默认非未成年
    if (platform.isDouyin) {
      const info = await platform.getUserInfo();
      this.isMinor = info?.userInfo?.isMinor || false;
    } else {
      this.isMinor = false;
    }

    this.loadPlayState();
    if (this.isMinor) {
      this.checkCurfew();
      this.startTick();
    }
  }

  private loadPlayState(): void {
    const saved = getStorage<GuardPlayState>('guardPlayState', null);
    if (saved && saved.date === getTodayStr()) {
      this.playState = saved;
    } else {
      this.playState = { date: getTodayStr(), playSeconds: 0 };
    }
  }

  private savePlayState(): void {
    setStorage('guardPlayState', this.playState);
  }

  private startTick(): void {
    if (this.tickTimer) return;
    this.tickTimer = setInterval(() => {
      // 跨天重置
      if (this.playState.date !== getTodayStr()) {
        this.playState = { date: getTodayStr(), playSeconds: 0 };
      }
      this.playState.playSeconds += 1;
      if (this.playState.playSeconds % 10 === 0) this.savePlayState();

      if (this.playState.playSeconds >= MINOR_DAILY_LIMIT) {
        this.forceLogout('今日游玩时长已达上限（1.5小时），请明日再来');
      }
      this.checkCurfew();
    }, 1000);
  }

  private checkCurfew(): void {
    const hour = new Date().getHours();
    if (hour >= CURFEW_START_HOUR || hour < CURFEW_END_HOUR) {
      this.forceLogout('当前为未成年人禁玩时段（21:00-次日8:00）');
    }
  }

  private forceLogout(msg: string): void {
    if (this.tickTimer) {
      clearInterval(this.tickTimer);
      this.tickTimer = null;
    }
    this.savePlayState();
    Taro.showModal({ title: '健康游戏提示', content: msg, showCancel: false });
  }

  /**
   * 充值限额校验。返回是否允许本次充值。
   * @param amount 本次充值金额（分）
   */
  checkPurchaseLimit(amount: number): { allowed: boolean; message: string } {
    if (!this.isMinor) return { allowed: true, message: '' };

    if (amount > MINOR_SINGLE_LIMIT) {
      return { allowed: false, message: '未成年人单次充值不得超过 50 元' };
    }

    const monthKey = getTodayStr().slice(0, 7);
    const saved = getStorage<MonthlyPayState>('guardMonthlyPay', { month: monthKey, amount: 0 });
    const current = saved.month === monthKey ? saved.amount : 0;
    if (current + amount > MINOR_MONTHLY_LIMIT) {
      return { allowed: false, message: '未成年人本月累计充值已达上限（200 元）' };
    }
    return { allowed: true, message: '' };
  }

  /** 记录一次成功充值（分），用于月累计限额 */
  recordPurchase(amount: number): void {
    if (!this.isMinor) return;
    const monthKey = getTodayStr().slice(0, 7);
    const saved = getStorage<MonthlyPayState>('guardMonthlyPay', { month: monthKey, amount: 0 });
    const current = saved.month === monthKey ? saved.amount : 0;
    setStorage('guardMonthlyPay', { month: monthKey, amount: current + amount });
  }

  getIsMinor(): boolean {
    return this.isMinor;
  }
}

export const youthGuard = new YouthGuardService();
