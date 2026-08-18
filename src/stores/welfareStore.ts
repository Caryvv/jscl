import { create } from 'zustand';
import { SignInState, SignInReward, GoldenPigState } from '@/types/welfare';
import { PIG_DEPOSIT_AMOUNT } from '@/constants/welfare';
import {
  doSignIn,
  hasSignedToday,
  doDeposit,
  doWithdraw,
  hasDepositedToday,
} from '@/services/welfareService';
import { getStorage, setStorage } from '@/utils/storage';
import { useResourceStore } from '@/stores/resourceStore';

interface WelfareState {
  signIn: SignInState;
  pig: GoldenPigState;

  init: () => void;
  /** 执行签到 */
  doСheckIn: () => { success: boolean; reward?: SignInReward; message: string };
  /** 今日是否已签到 */
  signedToday: () => boolean;
  /** 存入金猪 */
  deposit: () => { success: boolean; message: string };
  /** 今日是否已存入 */
  depositedToday: () => boolean;
  /** 取出金猪 */
  withdraw: () => { success: boolean; total?: number; message: string };
  save: () => void;
}

const INITIAL_SIGN_IN: SignInState = {
  consecutiveDays: 0,
  totalDays: 0,
  lastSignInDate: '',
};

const INITIAL_PIG: GoldenPigState = {
  depositedAmount: 0,
  depositDays: 0,
  lastDepositDate: '',
};

export const useWelfareStore = create<WelfareState>((set, get) => ({
  signIn: { ...INITIAL_SIGN_IN },
  pig: { ...INITIAL_PIG },

  init: () => {
    const saved = getStorage<{ signIn?: SignInState; pig?: GoldenPigState }>('welfareState', null);
    if (saved) {
      set({
        signIn: saved.signIn || { ...INITIAL_SIGN_IN },
        pig: saved.pig || { ...INITIAL_PIG },
      });
    }
  },

  doСheckIn: () => {
    const result = doSignIn(get().signIn);
    if (!result) {
      return { success: false, message: '今日已签到' };
    }
    set({ signIn: result.newState });
    const resource = useResourceStore.getState();
    resource.addSilver(result.reward.silver);
    resource.addLuckyCharm(result.reward.luckyCharm);
    get().save();
    return {
      success: true,
      reward: result.reward,
      message: `签到成功，获得 ${result.reward.silver} 银两、${result.reward.luckyCharm} 福缘符`,
    };
  },

  signedToday: () => hasSignedToday(get().signIn),

  deposit: () => {
    if (hasDepositedToday(get().pig)) {
      return { success: false, message: '今日已存入' };
    }
    const resource = useResourceStore.getState();
    if (!resource.consumeSilver(PIG_DEPOSIT_AMOUNT)) {
      return { success: false, message: `银两不足，需要 ${PIG_DEPOSIT_AMOUNT} 银两` };
    }
    const newPig = doDeposit(get().pig, PIG_DEPOSIT_AMOUNT);
    if (!newPig) {
      // 理论不会到这（已判断今日已存），回滚银两
      resource.addSilver(PIG_DEPOSIT_AMOUNT);
      return { success: false, message: '今日已存入' };
    }
    set({ pig: newPig });
    get().save();
    return { success: true, message: `已存入 ${PIG_DEPOSIT_AMOUNT} 银两，连续 ${newPig.depositDays} 天` };
  },

  depositedToday: () => hasDepositedToday(get().pig),

  withdraw: () => {
    const result = doWithdraw(get().pig);
    if (!result) {
      return { success: false, message: '需连续存满 7 天才可取出' };
    }
    set({ pig: result.newState });
    useResourceStore.getState().addSilver(result.total);
    get().save();
    return { success: true, total: result.total, message: `取出成功，连本带息共 ${result.total} 银两` };
  },

  save: () => {
    const { signIn, pig } = get();
    setStorage('welfareState', { signIn, pig });
  },
}));
