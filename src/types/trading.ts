export type RouteRisk = 'low' | 'medium' | 'high';

export interface TradeRoute {
  id: string;
  name: string;
  icon: string;
  description: string;
  risk: RouteRisk;
  /** 基础收益（银两） */
  baseProfit: number;
  /** 收益浮动幅度 0~1（如 0.25 表示 ±25%） */
  volatility: number;
  /** 亏损概率 0~1 */
  lossChance: number;
  /** 耗时（现实秒） */
  timeCost: number;
  minMembers: number;
  maxMembers: number;
}

export interface TradeMission {
  id: string;
  routeId: string;
  assignedMemberIds: string[];
  startTime: number;
  endTime: number;
  status: 'running' | 'completed';
  /** 结算后的最终收益（正为盈利，负为亏损） */
  finalProfit?: number;
}

export interface TradeResult {
  profit: number;
  isLoss: boolean;
  message: string;
}
