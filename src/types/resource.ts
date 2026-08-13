export interface Resources {
  silver: number;
  luckyCharm: number;
  goldBar: number;
}

export interface SettlementResult {
  totalIncome: number;
  totalCost: number;
  netIncome: number;
  gameMonth: number;
}

export interface OfflineReward {
  gameMonths: number;
  totalSilver: number;
}
