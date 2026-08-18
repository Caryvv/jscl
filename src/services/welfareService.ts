import { SignInState, SignInReward, GoldenPigState } from '@/types/welfare';
import { SIGN_IN_REWARDS, PIG_MAX_DAYS, PIG_INTEREST_RATES } from '@/constants/welfare';

/** 获取本地日期字符串 YYYY-MM-DD */
export function getTodayStr(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** 获取昨天日期字符串 */
export function getYesterdayStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return getTodayStr(d);
}

/** 连续签到天数映射到 1-7 循环 */
export function getSignInDayIndex(consecutiveDays: number): number {
  return ((consecutiveDays - 1) % 7) + 1;
}

/** 今日是否已签到 */
export function hasSignedToday(state: SignInState): boolean {
  return state.lastSignInDate === getTodayStr();
}

/** 执行签到，返回新状态与奖励；已签到返回 null */
export function doSignIn(state: SignInState): { newState: SignInState; reward: SignInReward } | null {
  if (hasSignedToday(state)) return null;

  const newState: SignInState = { ...state };
  if (state.lastSignInDate === getYesterdayStr()) {
    newState.consecutiveDays += 1;
  } else {
    newState.consecutiveDays = 1; // 断签重置
  }
  newState.lastSignInDate = getTodayStr();
  newState.totalDays += 1;

  const dayIndex = getSignInDayIndex(newState.consecutiveDays);
  return { newState, reward: SIGN_IN_REWARDS[dayIndex] };
}

/** 今日是否已存入金猪 */
export function hasDepositedToday(state: GoldenPigState): boolean {
  return state.lastDepositDate === getTodayStr();
}

/** 当前金猪利率 */
export function getPigInterestRate(depositDays: number): number {
  if (depositDays <= 0) return PIG_INTEREST_RATES[0];
  return PIG_INTEREST_RATES[Math.min(depositDays, PIG_MAX_DAYS) - 1];
}

/** 存入金猪，返回新状态；今日已存入返回 null */
export function doDeposit(state: GoldenPigState, amount: number): GoldenPigState | null {
  if (hasDepositedToday(state)) return null;

  const newState: GoldenPigState = { ...state };
  // 断签重置连续天数
  if (state.lastDepositDate && state.lastDepositDate !== getYesterdayStr()) {
    newState.depositDays = 0;
    newState.depositedAmount = 0;
  }
  newState.depositedAmount += amount;
  newState.depositDays = Math.min(newState.depositDays + 1, PIG_MAX_DAYS);
  newState.lastDepositDate = getTodayStr();
  return newState;
}

/** 取出金猪（含利息），返回取出总额与重置后状态；未满7天返回 null */
export function doWithdraw(state: GoldenPigState): { total: number; newState: GoldenPigState } | null {
  if (state.depositDays < PIG_MAX_DAYS) return null;

  const rate = getPigInterestRate(state.depositDays);
  const total = Math.floor(state.depositedAmount * (1 + rate));
  const newState: GoldenPigState = {
    depositedAmount: 0,
    depositDays: 0,
    lastDepositDate: '',
  };
  return { total, newState };
}
