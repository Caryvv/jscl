import { create } from 'zustand';
import { PendingEvent, EventEffect, EventNotice, RandomEvent } from '@/types/event';
import { EVENT_POOL } from '@/constants/events';
import { createPendingEvent, executeChoice, executeEffects, checkRandomEvent } from '@/services/eventService';
import { getStorage, setStorage } from '@/utils/storage';
import { useResourceStore } from '@/stores/resourceStore';
import { useFamilyStore } from '@/stores/familyStore';

interface EventState {
  pendingEvents: PendingEvent[];
  /** 最近一次事件的处理结果文案（用于 toast） */
  lastResultMsg: string;

  init: () => void;
  /** 尝试触发随机事件（由 settle 调用） */
  tryTrigger: (gameMonth: number) => void;
  /** 推入一条通知类事件（结婚、生子等），复用事件弹窗展示 */
  pushNotice: (notice: EventNotice, gameMonth: number) => void;
  /** 处理无选项事件：直接生效并移除 */
  resolveImmediate: (uid: string) => string;
  /** 处理有选项事件：执行选项效果并移除 */
  resolveChoice: (uid: string, choiceIndex: number) => string;
  /** 获取待处理事件详情 */
  getPendingEventDetail: (uid: string) => ReturnType<typeof getEventById> | null;
  save: () => void;
}

function getEventById(eventId: string) {
  return EVENT_POOL.find(e => e.id === eventId) || null;
}

/** 将效果中的银两/福缘符变化应用到 resourceStore */
function applyResourceEffects(effects: EventEffect[]): void {
  const resource = useResourceStore.getState();
  for (const effect of effects) {
    if (effect.target === 'silver') {
      if (effect.action === 'add') resource.addSilver(effect.value);
      else if (effect.action === 'remove') resource.addSilver(-effect.value);
    } else if (effect.target === 'luckyCharm') {
      if (effect.action === 'add') resource.addLuckyCharm(effect.value);
      else if (effect.action === 'remove') resource.addLuckyCharm(-effect.value);
    }
  }
}

export const useEventStore = create<EventState>((set, get) => ({
  pendingEvents: [],
  lastResultMsg: '',

  init: () => {
    const saved = getStorage<PendingEvent[]>('eventState', []);
    if (saved) set({ pendingEvents: saved });
  },

  tryTrigger: (gameMonth) => {
    const state = get();
    // 最多保留 3 个待处理事件
    if (state.pendingEvents.length >= 3) return;

    const familyState = useFamilyStore.getState();
    const resourceState = useResourceStore.getState();

    const event = checkRandomEvent({
      memberCount: familyState.members.filter(m => m.isAlive).length,
      silver: resourceState.silver,
      gameMonth,
    });

    if (!event) return;

    const pending = createPendingEvent(event.id, gameMonth);
    set({ pendingEvents: [...state.pendingEvents, pending] });
    get().save();
  },

  pushNotice: (notice, gameMonth) => {
    const state = get();
    const pending = createPendingEvent(`notice_${notice.name}`, gameMonth);
    pending.notice = notice;
    set({ pendingEvents: [...state.pendingEvents, pending] });
    get().save();
  },

  resolveImmediate: (uid) => {
    const state = get();
    const pending = state.pendingEvents.find(e => e.uid === uid);
    if (!pending) return '事件不存在';

    // 通知类事件：无实际效果（效果在推送时已结算），直接移除
    if (pending.notice) {
      set({
        pendingEvents: state.pendingEvents.filter(e => e.uid !== uid),
        lastResultMsg: '',
      });
      get().save();
      return pending.notice.description;
    }

    const event = getEventById(pending.eventId);
    if (!event || !event.effects) return '事件配置错误';

    const members = useFamilyStore.getState().members;
    const msg = executeEffects(event.effects, members);
    applyResourceEffects(event.effects);

    // 更新成员数据（月收益由下次 settle 自动重算）
    useFamilyStore.setState({ members: [...members] });
    useFamilyStore.getState().save();

    set({
      pendingEvents: state.pendingEvents.filter(e => e.uid !== uid),
      lastResultMsg: msg,
    });
    get().save();
    return msg;
  },

  resolveChoice: (uid, choiceIndex) => {
    const state = get();
    const pending = state.pendingEvents.find(e => e.uid === uid);
    if (!pending) return '事件不存在';

    const event = getEventById(pending.eventId);
    if (!event || !event.choices || choiceIndex >= event.choices.length) return '选项无效';

    const choice = event.choices[choiceIndex];
    const members = useFamilyStore.getState().members;
    const resource = useResourceStore.getState();

    // 扣除代价
    if (choice.cost) {
      if (choice.cost.type === 'silver') {
        if (!resource.consumeSilver(choice.cost.amount)) {
          return '银两不足，无法选择此项';
        }
      } else if (choice.cost.type === 'luckyCharm') {
        if (!resource.consumeLuckyCharm(choice.cost.amount)) {
          return '福缘符不足，无法选择此项';
        }
      }
    }

    // 执行选项
    const result = executeChoice(choice, members);
    if (result.success) {
      applyResourceEffects(result.effects);
    }

    // 更新成员数据（月收益由下次 settle 自动重算）
    useFamilyStore.setState({ members: [...members] });
    useFamilyStore.getState().save();

    set({
      pendingEvents: state.pendingEvents.filter(e => e.uid !== uid),
      lastResultMsg: result.message,
    });
    get().save();
    return result.message;
  },

  getPendingEventDetail: (uid) => {
    const pending = get().pendingEvents.find(e => e.uid === uid);
    if (!pending) return null;
    // 通知类事件：用动态内容拼成一个无选项的临时事件供弹窗展示
    if (pending.notice) {
      const noticeEvent: RandomEvent = {
        id: pending.eventId,
        name: pending.notice.name,
        icon: pending.notice.icon,
        description: pending.notice.description,
        type: pending.notice.type,
        weight: 0,
      };
      return { pending, event: noticeEvent };
    }
    return { pending, event: getEventById(pending.eventId) };
  },

  save: () => {
    setStorage('eventState', get().pendingEvents);
  },
}));
