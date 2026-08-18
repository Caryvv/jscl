import { SignInReward } from '@/types/welfare';

/** 7天签到奖励循环（连续签到第几天） */
export const SIGN_IN_REWARDS: Record<number, SignInReward> = {
  1: { silver: 100, luckyCharm: 1 },
  2: { silver: 200, luckyCharm: 1 },
  3: { silver: 300, luckyCharm: 2 },
  4: { silver: 400, luckyCharm: 2 },
  5: { silver: 500, luckyCharm: 3 },
  6: { silver: 600, luckyCharm: 3 },
  7: { silver: 1000, luckyCharm: 5 },
};

/** 家族金猪：满存天数 */
export const PIG_MAX_DAYS = 7;

/** 家族金猪：单次存入固定金额 */
export const PIG_DEPOSIT_AMOUNT = 500;

/** 家族金猪：第1-7天连续存入对应利率 */
export const PIG_INTEREST_RATES = [0.02, 0.04, 0.06, 0.08, 0.12, 0.16, 0.25];
