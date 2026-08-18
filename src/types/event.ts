export type EventType = 'positive' | 'negative' | 'neutral';

export type EventTarget = 'silver' | 'luckyCharm' | 'member' | 'memberRandom';

export type EventAction = 'add' | 'remove' | 'upgradeAptitude' | 'extendLife';

export interface EventEffect {
  target: EventTarget;
  action: EventAction;
  value: number;
}

export interface EventChoice {
  label: string;
  cost?: { type: 'silver' | 'luckyCharm'; amount: number };
  effects: EventEffect[];
  /** 成功率 0~1，不传则 100% 成功 */
  successRate?: number;
  /** 成功时的提示文案 */
  successMsg?: string;
  /** 失败时的提示文案 */
  failMsg?: string;
}

export interface RandomEvent {
  id: string;
  name: string;
  icon: string;
  description: string;
  type: EventType;
  weight: number;
  /** 触发条件 */
  conditions?: {
    minMembers?: number;
    minSilver?: number;
    minGameMonth?: number;
  };
  /** 无选项事件：直接生效 */
  effects?: EventEffect[];
  /** 有选项事件：玩家选择应对 */
  choices?: EventChoice[];
}

/** 通知类事件的动态内容（结婚、生子等由系统实时生成，无选项，仅确认） */
export interface EventNotice {
  icon: string;
  name: string;
  description: string;
  type: EventType;
}

/** 待处理的触发事件 */
export interface PendingEvent {
  uid: string;
  eventId: string;
  triggeredMonth: number;
  /** 通知类事件的动态内容；存在时优先于 EVENT_POOL 中的静态配置 */
  notice?: EventNotice;
}
