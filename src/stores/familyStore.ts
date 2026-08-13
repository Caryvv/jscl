import { create } from 'zustand';
import { FamilyMember } from '@/types/member';
import { createInitialFamily, createChild as createChildService, updateMemberLifeStage } from '@/services/memberService';
import { calcFamilyMonthlyIncome } from '@/services/settlement';
import { getStorage, setStorage } from '@/utils/storage';
import { ADD_CHILD_COOLDOWN, ADD_CHILD_COST } from '@/constants/member';

interface FamilyState {
  members: FamilyMember[];
  gameMonth: number;
  gameYear: number;
  gameYearMonth: number;
  lastSettleTime: number;
  monthlyIncome: number;
  addChildCooldown: number;
  initialized: boolean;

  init: () => void;
  settle: () => void;
  addChild: (name: string, gender: 'male' | 'female') => { success: boolean; child?: FamilyMember; message: string };
  getMember: (id: string) => FamilyMember | undefined;
  getAliveAdultCouple: () => { father: FamilyMember; mother: FamilyMember } | null;
  save: () => void;
}

export const useFamilyStore = create<FamilyState>((set, get) => ({
  members: [],
  gameMonth: 1,
  gameYear: 1,
  gameYearMonth: 1,
  lastSettleTime: Date.now(),
  monthlyIncome: 200,
  addChildCooldown: 0,
  initialized: false,

  init: () => {
    const saved = getStorage<any>('familyState', null);
    if (saved && saved.members && saved.members.length > 0) {
      set({
        members: saved.members,
        gameMonth: saved.gameMonth || 1,
        gameYear: saved.gameYear || 1,
        gameYearMonth: saved.gameYearMonth || 1,
        lastSettleTime: Date.now(),
        monthlyIncome: saved.monthlyIncome || 200,
        addChildCooldown: saved.addChildCooldown || 0,
        initialized: true,
      });
    } else {
      const members = createInitialFamily();
      const monthlyIncome = calcFamilyMonthlyIncome(members, 0);
      set({
        members,
        gameMonth: 1,
        gameYear: 1,
        gameYearMonth: 1,
        lastSettleTime: Date.now(),
        monthlyIncome,
        addChildCooldown: 0,
        initialized: true,
      });
    }
    get().save();
  },

  settle: () => {
    const state = get();
    const { members, gameMonth, lastSettleTime } = state;

    const realElapsed = (Date.now() - lastSettleTime) / 1000;
    const GAME_MONTH_PER_REAL_SEC = 1 / 5;
    const monthsToSettle = Math.max(1, Math.floor(realElapsed * GAME_MONTH_PER_REAL_SEC));
    const cappedMonths = Math.min(monthsToSettle, 60);

    let newMembers = [...members];
    let totalSilver = 0;
    let newGameMonth = gameMonth;

    const resourceSaved = getStorage<any>('resourceState', null);
    let silver = resourceSaved?.silver || 0;

    for (let i = 0; i < cappedMonths; i++) {
      newGameMonth++;

      const aliveMembers = newMembers.filter(m => m.isAlive);
      let monthIncome = 0;
      let monthCost = 0;

      for (const member of aliveMembers) {
        member.age += 1;
        const updated = updateMemberLifeStage(member);
        Object.assign(member, updated);

        monthIncome += member.monthlyIncome;
        monthCost += member.monthlyCost;

        if (member.lifeStage === 'elder' && member.age >= (75 * 12 + Math.floor((Math.random() - 0.5) * 48))) {
          member.isAlive = false;
          member.deathMonth = newGameMonth;
        }
      }

      totalSilver += (monthIncome - monthCost);
    }

    silver += totalSilver;
    if (silver < 0) silver = 0;
    setStorage('resourceState', { ...resourceSaved, silver });

    const newCooldown = Math.max(0, state.addChildCooldown - Math.floor(realElapsed));

    const newGameYear = Math.floor((newGameMonth - 1) / 12) + 1;
    const newGameYearMonth = ((newGameMonth - 1) % 12) + 1;

    const newMonthlyIncome = calcFamilyMonthlyIncome(newMembers, 0);

    set({
      members: newMembers,
      gameMonth: newGameMonth,
      gameYear: newGameYear,
      gameYearMonth: newGameYearMonth,
      lastSettleTime: Date.now(),
      monthlyIncome: newMonthlyIncome,
      addChildCooldown: newCooldown,
    });

    get().save();
  },

  addChild: (name, gender) => {
    const state = get();
    if (state.addChildCooldown > 0) {
      return { success: false, message: `添丁冷却中，还需等待 ${state.addChildCooldown} 秒` };
    }

    const couple = state.getAliveAdultCouple();
    if (!couple) {
      return { success: false, message: '没有符合条件的成年夫妇' };
    }

    const resourceSaved = getStorage<any>('resourceState', null);
    if (!resourceSaved || resourceSaved.silver < ADD_CHILD_COST) {
      return { success: false, message: `银两不足，需要 ${ADD_CHILD_COST} 银两` };
    }

    resourceSaved.silver -= ADD_CHILD_COST;
    setStorage('resourceState', resourceSaved);

    const child = createChildService(couple.father, couple.mother, name, gender, state.gameMonth);
    const newMembers = [...state.members, child];

    set({
      members: newMembers,
      addChildCooldown: ADD_CHILD_COOLDOWN,
      monthlyIncome: calcFamilyMonthlyIncome(newMembers, 0),
    });

    get().save();
    return { success: true, child, message: '添丁成功！' };
  },

  getMember: (id) => get().members.find(m => m.id === id),

  getAliveAdultCouple: () => {
    const adults = get().members.filter(m => m.isAlive && m.lifeStage === 'adult');
    for (const member of adults) {
      if (member.spouseId) {
        const spouse = adults.find(a => a.id === member.spouseId);
        if (spouse) {
          const father = member.gender === 'male' ? member : spouse;
          const mother = member.gender === 'female' ? member : spouse;
          return { father, mother };
        }
      }
    }
    return null;
  },

  save: () => {
    const { members, gameMonth, gameYear, gameYearMonth, monthlyIncome, addChildCooldown } = get();
    setStorage('familyState', { members, gameMonth, gameYear, gameYearMonth, monthlyIncome, addChildCooldown });
  },
}));
