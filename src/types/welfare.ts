export interface SignInReward {
  silver: number;
  luckyCharm: number;
}

export interface SignInState {
  /** 连续签到天数 */
  consecutiveDays: number;
  /** 累计签到天数 */
  totalDays: number;
  /** 最后签到日期 YYYY-MM-DD */
  lastSignInDate: string;
}

export interface GoldenPigState {
  /** 当前已存入本金 */
  depositedAmount: number;
  /** 已连续存入天数 */
  depositDays: number;
  /** 最后存入日期 YYYY-MM-DD */
  lastDepositDate: string;
}
