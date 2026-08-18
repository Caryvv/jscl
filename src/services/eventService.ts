import { RandomEvent, EventEffect, EventChoice, PendingEvent } from '@/types/event';
import { EVENT_POOL, EVENT_TRIGGER_RATE } from '@/constants/events';
import { FamilyMember } from '@/types/member';
import { upgradeAptitude } from './memberService';

interface TriggerContext {
  memberCount: number;
  silver: number;
  gameMonth: number;
}

interface ChoiceResult {
  success: boolean;
  message: string;
}

let eventUidCounter = Date.now();

/** 检查是否触发随机事件，返回触发的事件或 null */
export function checkRandomEvent(ctx: TriggerContext): RandomEvent | null {
  if (Math.random() > EVENT_TRIGGER_RATE) return null;

  const available = EVENT_POOL.filter(event => {
    const c = event.conditions;
    if (!c) return true;
    if (c.minMembers && ctx.memberCount < c.minMembers) return false;
    if (c.minSilver && ctx.silver < c.minSilver) return false;
    if (c.minGameMonth && ctx.gameMonth < c.minGameMonth) return false;
    return true;
  });

  if (available.length === 0) return null;

  const totalWeight = available.reduce((sum, e) => sum + e.weight, 0);
  let random = Math.random() * totalWeight;
  for (const event of available) {
    random -= event.weight;
    if (random <= 0) return event;
  }
  return available[0];
}

/** 生成待处理事件 */
export function createPendingEvent(eventId: string, gameMonth: number): PendingEvent {
  return {
    uid: `evt_${++eventUidCounter}`,
    eventId,
    triggeredMonth: gameMonth,
  };
}

/**
 * 执行无选项事件的效果
 * 返回效果描述文本
 */
export function executeEffects(effects: EventEffect[], members: FamilyMember[]): string {
  const messages: string[] = [];

  for (const effect of effects) {
    switch (effect.target) {
      case 'silver':
        // 银两效果由调用方通过 resourceStore 处理
        messages.push(effect.action === 'add'
          ? `银两 +${effect.value}`
          : `银两 -${effect.value}`);
        break;
      case 'luckyCharm':
        messages.push(effect.action === 'add'
          ? `福缘符 +${effect.value}`
          : `福缘符 -${effect.value}`);
        break;
      case 'memberRandom':
        const alive = members.filter(m => m.isAlive);
        if (alive.length > 0) {
          const target = alive[Math.floor(Math.random() * alive.length)];
          if (effect.action === 'upgradeAptitude') {
            const before = target.aptitude;
            target.aptitude = upgradeAptitude(target.aptitude);
            if (target.aptitude !== before) {
              messages.push(`${target.name} 资质提升`);
            }
          } else if (effect.action === 'extendLife') {
            target.lifeBonus += effect.value;
            messages.push(`${target.name} 寿命${effect.value > 0 ? '延长' : '减少'} ${Math.abs(effect.value)} 月`);
          }
        }
        break;
    }
  }

  return messages.length > 0 ? messages.join('，') : '无事发生';
}

/**
 * 执行选项效果
 * 返回成功/失败结果
 */
export function executeChoice(
  choice: EventChoice,
  members: FamilyMember[],
): ChoiceResult & { effects: EventEffect[] } {
  // 判定成功率
  if (choice.successRate !== undefined && choice.successRate < 1) {
    if (Math.random() > choice.successRate) {
      // 失败：消耗代价但不执行效果
      return {
        success: false,
        message: choice.failMsg || '未能成功',
        effects: [],
      };
    }
  }

  // 成功：执行效果
  executeEffects(choice.effects, members);
  return {
    success: true,
    message: choice.successMsg || '成功',
    effects: choice.effects,
  };
}
