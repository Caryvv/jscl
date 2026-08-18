import { create } from 'zustand';
import { TradeMission, TradeRoute, TradeResult } from '@/types/trading';
import { TRADE_ROUTES, MAX_DAILY_MISSIONS, RUSH_COST_LUCKY_CHARM } from '@/constants/trading';
import { calcTradeProfit, generateMissionId } from '@/services/tradingService';
import { getStorage, setStorage } from '@/utils/storage';
import { useResourceStore } from '@/stores/resourceStore';
import { useFamilyStore } from '@/stores/familyStore';
import { useServantStore } from '@/stores/servantStore';

interface TradingState {
  missions: TradeMission[];
  dailyMissionCount: number;
  lastMissionDate: string;

  init: () => void;
  startMission: (routeId: string, memberIds: string[]) => { success: boolean; message: string };
  claimMission: (missionId: string) => { success: boolean; result?: TradeResult; message: string };
  /** 消耗福缘符立即完成跑商并结算 */
  rushMission: (missionId: string) => { success: boolean; result?: TradeResult; message: string };
  /** 获取某成员正在进行的跑商任务 */
  getActiveMissionByMember: (memberId: string) => TradeMission | undefined;
  /** 获取当前进行中的任务数 */
  getRunningCount: () => number;
  save: () => void;
}

function getTodayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export const useTradingStore = create<TradingState>((set, get) => ({
  missions: [],
  dailyMissionCount: 0,
  lastMissionDate: '',

  init: () => {
    const saved = getStorage<any>('tradingState', null);
    if (saved) {
      set({
        missions: saved.missions || [],
        dailyMissionCount: saved.dailyMissionCount || 0,
        lastMissionDate: saved.lastMissionDate || '',
      });
    }
    // 跨天重置每日派遣次数
    const today = getTodayStr();
    if (get().lastMissionDate !== today) {
      set({ dailyMissionCount: 0, lastMissionDate: today });
      get().save();
    }
  },

  startMission: (routeId, memberIds) => {
    const route: TradeRoute | undefined = TRADE_ROUTES.find(r => r.id === routeId);
    if (!route) return { success: false, message: '商路不存在' };
    if (memberIds.length < route.minMembers || memberIds.length > route.maxMembers) {
      return { success: false, message: `该商路需派遣 ${route.minMembers}-${route.maxMembers} 人` };
    }

    // 检查每日次数
    const today = getTodayStr();
    if (get().lastMissionDate !== today) {
      set({ dailyMissionCount: 0, lastMissionDate: today });
    }
    if (get().dailyMissionCount >= MAX_DAILY_MISSIONS) {
      return { success: false, message: '今日派遣次数已用完' };
    }

    // 检查成员是否成年、是否已在跑商
    const members = useFamilyStore.getState().members;
    const selected = memberIds.map(id => members.find(m => m.id === id)).filter(Boolean) as any[];
    if (selected.length !== memberIds.length) {
      return { success: false, message: '存在无效的成员' };
    }
    for (const m of selected) {
      if (!m.isAlive) return { success: false, message: `${m.name} 已离世，无法派遣` };
      if (m.lifeStage !== 'adult') return { success: false, message: `${m.name} 尚未成年，无法跑商` };
      if (get().getActiveMissionByMember(m.id)) {
        return { success: false, message: `${m.name} 已在跑商途中` };
      }
    }

    const now = Date.now();
    const mission: TradeMission = {
      id: generateMissionId(),
      routeId,
      assignedMemberIds: memberIds,
      startTime: now,
      endTime: now + route.timeCost * 1000,
      status: 'running',
    };

    set({
      missions: [...get().missions, mission],
      dailyMissionCount: get().dailyMissionCount + 1,
    });
    get().save();
    return { success: true, message: '商队已出发！' };
  },

  claimMission: (missionId) => {
    const mission = get().missions.find(m => m.id === missionId);
    if (!mission) return { success: false, message: '任务不存在' };
    if (mission.status !== 'running') return { success: false, message: '任务已结算' };
    if (Date.now() < mission.endTime) {
      return { success: false, message: '商队尚未归来' };
    }

    return settleMission(mission);
  },

  rushMission: (missionId) => {
    const mission = get().missions.find(m => m.id === missionId);
    if (!mission) return { success: false, message: '任务不存在' };
    if (mission.status !== 'running') return { success: false, message: '任务已结算' };

    if (!useResourceStore.getState().consumeLuckyCharm(RUSH_COST_LUCKY_CHARM)) {
      return { success: false, message: `福缘符不足，需要 ${RUSH_COST_LUCKY_CHARM} 枚` };
    }

    return settleMission(mission);
  },

  getActiveMissionByMember: (memberId) =>
    get().missions.find(m => m.status === 'running' && m.assignedMemberIds.includes(memberId)),

  getRunningCount: () => get().missions.filter(m => m.status === 'running').length,

  save: () => {
    const { missions, dailyMissionCount, lastMissionDate } = get();
    setStorage('tradingState', { missions, dailyMissionCount, lastMissionDate });
  },
}));

/** 结算跑商任务：判定盈亏、入账银两、更新任务状态 */
function settleMission(mission: TradeMission): { success: boolean; result?: TradeResult; message: string } {
  const route = TRADE_ROUTES.find(r => r.id === mission.routeId);
  if (!route) return { success: false, message: '商路不存在' };

  const members = useFamilyStore.getState().members;
  const servants = useServantStore.getState().servants;
  const assignedMembers = members.filter(m => mission.assignedMemberIds.includes(m.id));

  const result = calcTradeProfit(route, assignedMembers, servants);

  if (result.profit !== 0) {
    useResourceStore.getState().addSilver(result.profit);
  }

  const updatedMission: TradeMission = {
    ...mission,
    status: 'completed',
    finalProfit: result.profit,
  };

  const store = useTradingStore.getState();
  useTradingStore.setState({
    missions: store.missions.map(m => (m.id === mission.id ? updatedMission : m)),
  });
  store.save();

  return { success: true, result, message: result.message };
}
