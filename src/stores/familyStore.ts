import { create } from 'zustand';
import { FamilyMember, APTITUDE_NAMES, Profession } from '@/types/member';
import { EventNotice } from '@/types/event';
import {
  createInitialFamily,
  createChild as createChildService,
  createSpouse,
  updateMemberLifeStage,
  getDeathAge,
  upgradeAptitude,
  rerollAptitude,
} from '@/services/memberService';
import { generateGivenName } from '@/utils/random';
import {
  changeProfession as changeProfessionService,
  upgradeProfession as upgradeProfessionService,
  getDoctorCostReduction,
} from '@/services/professionService';
import { calcFamilyMonthlyIncome } from '@/services/settlement';
import { getStorage, setStorage } from '@/utils/storage';
import { ADD_CHILD_COOLDOWN, ADD_CHILD_COST } from '@/constants/member';
import { useResourceStore } from '@/stores/resourceStore';
import { useServantStore } from '@/stores/servantStore';
import { useEventStore } from '@/stores/eventStore';
import { useCollectionStore } from '@/stores/collectionStore';
import { useDynastyStore } from '@/stores/dynastyStore';
import { useGenealogyStore } from '@/stores/genealogyStore';
import { getDynastyConfig } from '@/constants/dynasty';

/** 神树加成：每级 +5% 全家族银两收益 */
const TREE_BONUS_PER_LEVEL = 5;
/** 现实 1 秒 = 游戏内 0.2 月（即 5 秒 = 1 月） */
const GAME_MONTH_PER_REAL_SEC = 1 / 5;
/** 离线收益基础时长上限（小时） */
const BASE_OFFLINE_HOURS = 12;
/** 现实 1 小时 = 游戏内 12 个月 */
const GAME_MONTH_PER_REAL_HOUR = 12;

/** 婚恋起始年龄（满 20 岁进入相识阶段），单位：月 */
const MARRIAGE_MIN_AGE = 20 * 12;
/** 每月婚恋阶段推进概率 */
const ROMANCE_ADVANCE_RATE = 0.25;
/** 已婚夫妻每月生育概率 */
const BIRTH_RATE = 0.05;
/** 母亲可生育的年龄上限，单位：月 */
const BIRTH_MAX_AGE = 45 * 12;

const ROMANCE_NEXT: Record<string, FamilyMember['romanceStage']> = {
  single: 'acquainted',
  acquainted: 'familiar',
  familiar: 'inlove',
  inlove: 'married',
};

const ROMANCE_STAGE_NAME: Record<string, string> = {
  acquainted: '相识',
  familiar: '熟悉',
  inlove: '相爱',
  married: '结婚',
};

/**
 * 处理婚恋推进与生育（直接修改传入的 members 数组）
 * - 未婚成年后辈按阶段逐步推进，到「结婚」时生成外来配偶加入家族
 * - 已婚夫妻按概率生育，生男生女 50:50，资质遗传，自动辈分命名
 * 返回本轮出生数量与需要推送的通知事件
 */
function processRomanceAndBirth(
  members: FamilyMember[],
  surname: string,
  gameMonth: number,
): { births: number; notices: EventNotice[] } {
  const notices: EventNotice[] = [];
  let births = 0;

  // 婚恋推进：仅家族后辈（offspring/patriarch/matriarch，非外来配偶）参与主动推进
  const singles = members.filter(
    m => m.isAlive && m.lifeStage === 'adult' && m.age >= MARRIAGE_MIN_AGE
      && m.romanceStage !== 'married' && m.generation > 0 && !m.spouseId,
  );

  for (const person of singles) {
    if (Math.random() > ROMANCE_ADVANCE_RATE) continue;
    const next = ROMANCE_NEXT[person.romanceStage];
    if (!next) continue;
    person.romanceStage = next;

    if (next === 'married') {
      // 生成外来配偶加入家族
      const spouse = createSpouse(person, gameMonth);
      person.spouseId = spouse.id;
      members.push(spouse);
      notices.push({
        icon: '\uD83D\uDC70',
        name: '喜结连理',
        description: `${person.name} 与 ${spouse.name} 结为夫妻，喜结良缘！`,
        type: 'positive',
      });
    } else {
      notices.push({
        icon: '\uD83D\uDC9E',
        name: '情缘渐进',
        description: `${person.name} 与心仪之人${ROMANCE_STAGE_NAME[next]}了。`,
        type: 'neutral',
      });
    }
  }

  // 生育：已婚且双方在世的夫妻，由母亲一侧判定
  const processedCouples = new Set<string>();
  const marriedWomen = members.filter(
    m => m.isAlive && m.gender === 'female' && m.romanceStage === 'married'
      && m.spouseId && m.lifeStage === 'adult' && m.age <= BIRTH_MAX_AGE,
  );

  for (const mother of marriedWomen) {
    const father = members.find(m => m.id === mother.spouseId && m.isAlive);
    if (!father) continue;
    const coupleKey = [mother.id, father.id].sort().join('_');
    if (processedCouples.has(coupleKey)) continue;
    processedCouples.add(coupleKey);

    if (Math.random() > BIRTH_RATE) continue;

    // 确定家族血脉一方的辈分：孩子辈分 = 家族方辈分 + 1
    const familyParent = father.generation > 0 ? father : mother.generation > 0 ? mother : null;
    if (!familyParent) continue;
    const childGeneration = familyParent.generation + 1;

    const gender: FamilyMember['gender'] = Math.random() < 0.5 ? 'male' : 'female';
    const givenName = generateGivenName(gender);
    const child = createChildService(father, mother, gender, gameMonth, surname, childGeneration, givenName);
    members.push(child);
    father.childrenIds.push(child.id);
    mother.childrenIds.push(child.id);
    births++;

    notices.push({
      icon: gender === 'male' ? '\uD83D\uDC76' : '\uD83D\uDC67',
      name: '喜添新丁',
      description: `${father.name} 与 ${mother.name} 喜得${gender === 'male' ? '贵子' : '千金'}「${child.name}」！`,
      type: 'positive',
    });
  }

  return { births, notices };
}

/** 汇总账房家丁 + 神树提供的收益百分比加成 */
function getTotalBonusPercent(): number {
  const accountantBonus = useServantStore.getState().getAccountantBonus();
  const tree = getStorage<{ level?: number }>('treeState', { level: 1 });
  const treeBonus = ((tree.level || 1) - 1) * TREE_BONUS_PER_LEVEL;
  // 传家藏品收益加成（income 类型为百分比小数，转为百分数）
  const collectionBonus = useCollectionStore.getState().getTotalBonus().income * 100;
  // 朝代收益加成（incomeBonus 为小数，转为百分数）
  const dynastyBonus = useDynastyStore.getState().getIncomeBonus() * 100;
  return accountantBonus + treeBonus + collectionBonus + dynastyBonus;
}

interface ItemEffectResult {
  success: boolean;
  message: string;
}

interface FamilyState {
  members: FamilyMember[];
  gameMonth: number;
  gameYear: number;
  gameYearMonth: number;
  lastSettleTime: number;
  lastOnlineTime: number;
  monthlyIncome: number;
  addChildCooldown: number;
  initialized: boolean;
  /** 待领取的离线收益银两 */
  pendingOfflineSilver: number;
  /** 家族姓氏（玩家首次进入时设置） */
  surname: string;
  /** 是否已完成建族（设置姓氏） */
  founded: boolean;
  /** 累计出生孩子数量（用于添丁福报阶梯奖励） */
  totalBirths: number;

  init: () => void;
  /** 建立家族，设置姓氏并生成初始成员 */
  foundFamily: (surname: string) => void;
  settle: () => void;
  addChild: (name: string, gender: 'male' | 'female') => { success: boolean; child?: FamilyMember; message: string };
  /** 修改成员的个人名（姓氏、辈分字之外的部分） */
  renameMember: (memberId: string, givenName: string) => { success: boolean; message: string };
  getMember: (id: string) => FamilyMember | undefined;
  getAliveAdultCouple: () => { father: FamilyMember; mother: FamilyMember } | null;
  /** 商店道具效果落地 */
  applyItemEffect: (effectType: string, effectValue: number) => ItemEffectResult;
  /** 领取离线收益，返回领取的银两数 */
  claimOfflineReward: () => number;
  /** 成员转职 */
  changeProfession: (memberId: string, newProfession: Profession) => { success: boolean; message: string };
  /** 成员职业升级 */
  upgradeProfession: (memberId: string) => { success: boolean; message: string };
  save: () => void;
}

export const useFamilyStore = create<FamilyState>((set, get) => ({
  members: [],
  gameMonth: 1,
  gameYear: 1,
  gameYearMonth: 1,
  lastSettleTime: Date.now(),
  lastOnlineTime: Date.now(),
  monthlyIncome: 200,
  addChildCooldown: 0,
  initialized: false,
  pendingOfflineSilver: 0,
  surname: '',
  founded: false,
  totalBirths: 0,

  init: () => {
    // 确保家丁加成已从存档加载
    useServantStore.getState().init();

    const saved = getStorage<any>('familyState', null);
    const now = Date.now();

    if (saved && saved.members && saved.members.length > 0) {
      // 兼容旧存档：补齐新增字段
      const members: FamilyMember[] = (saved.members as FamilyMember[]).map(m => ({
        ...m,
        lifeBonus: m.lifeBonus ?? 0,
        incomeMultiplier: m.incomeMultiplier ?? 0,
      }));

      const monthlyIncome = saved.monthlyIncome || calcFamilyMonthlyIncome(members, getTotalBonusPercent());

      // 计算离线收益
      let pendingOfflineSilver = 0;
      const lastOnlineTime = saved.lastOnlineTime;
      if (lastOnlineTime) {
        const tree = getStorage<{ level?: number }>('treeState', { level: 1 });
        const maxOfflineHours = BASE_OFFLINE_HOURS + ((tree.level || 1) - 1);
        const elapsedMs = now - lastOnlineTime;
        const elapsedHours = Math.min(elapsedMs / 3600000, maxOfflineHours);
        const gameMonths = Math.floor(elapsedHours * GAME_MONTH_PER_REAL_HOUR);
        if (gameMonths > 0) {
          const bonus = getTotalBonusPercent();
          pendingOfflineSilver = Math.max(0, Math.floor(gameMonths * monthlyIncome * (1 + bonus / 100)));
        }
      }

      // 兼容旧存档：从首个成员推断姓氏
      const surname = saved.surname || members[0]?.surname || '';

      set({
        members,
        gameMonth: saved.gameMonth || 1,
        gameYear: saved.gameYear || 1,
        gameYearMonth: saved.gameYearMonth || 1,
        lastSettleTime: now,
        lastOnlineTime: now,
        monthlyIncome,
        addChildCooldown: saved.addChildCooldown || 0,
        pendingOfflineSilver,
        surname,
        founded: !!surname,
        totalBirths: saved.totalBirths || 0,
        initialized: true,
      });
      get().save();
    } else {
      // 尚未建族：等待玩家输入姓氏后调用 foundFamily
      set({ initialized: true, founded: false });
    }
  },

  foundFamily: (surname, gender, givenName) => {
    const trimmed = surname.trim();
    if (!trimmed) return;
    const trimmedName = (givenName || '').trim() || '家主';
    const now = Date.now();
    const members = createInitialFamily(trimmed, gender, trimmedName);
    const monthlyIncome = calcFamilyMonthlyIncome(members, getTotalBonusPercent());
    set({
      members,
      gameMonth: 1,
      gameYear: 1,
      gameYearMonth: 1,
      lastSettleTime: now,
      lastOnlineTime: now,
      monthlyIncome,
      addChildCooldown: 0,
      pendingOfflineSilver: 0,
      surname: trimmed,
      founded: true,
      totalBirths: 0,
      initialized: true,
    });
    get().save();
  },

  settle: () => {
    const state = get();
    const { members, gameMonth, lastSettleTime } = state;

    const realElapsed = (Date.now() - lastSettleTime) / 1000;
    const monthsToSettle = Math.max(1, Math.floor(realElapsed * GAME_MONTH_PER_REAL_SEC));
    const cappedMonths = Math.min(monthsToSettle, 60);

    const bonusPercent = getTotalBonusPercent();
    const costReduction = getDoctorCostReduction(members);
    const newMembers = members.map(m => ({ ...m }));
    const diedThisSettle: FamilyMember[] = [];
    let totalNet = 0;
    let newGameMonth = gameMonth;

    for (let i = 0; i < cappedMonths; i++) {
      newGameMonth++;

      let monthIncome = 0;
      let monthCost = 0;

      for (const member of newMembers) {
        if (!member.isAlive) continue;

        member.age += 1;
        const updated = updateMemberLifeStage(member);
        Object.assign(member, updated);

        monthIncome += member.monthlyIncome;
        monthCost += Math.floor(member.monthlyCost * (1 - costReduction));

        if (member.lifeStage === 'elder' && member.age >= getDeathAge(member)) {
          member.isAlive = false;
          member.deathMonth = newGameMonth;
          diedThisSettle.push(member);
        }
      }

      const rawNet = monthIncome - monthCost;
      const bonus = Math.floor(Math.max(0, rawNet) * (bonusPercent / 100));
      totalNet += rawNet + bonus;
    }

    if (totalNet !== 0) {
      useResourceStore.getState().addSilver(totalNet);
    }

    // 婚恋推进与生育（结婚/生子会追加新成员并推送通知事件）
    const { births, notices } = processRomanceAndBirth(newMembers, state.surname, newGameMonth);
    const totalBirths = state.totalBirths + births;

    const newCooldown = Math.max(0, state.addChildCooldown - Math.floor(realElapsed));
    const newGameYear = Math.floor((newGameMonth - 1) / 12) + 1;
    const newGameYearMonth = ((newGameMonth - 1) % 12) + 1;
    const newMonthlyIncome = calcFamilyMonthlyIncome(newMembers, bonusPercent);

    set({
      members: newMembers,
      gameMonth: newGameMonth,
      gameYear: newGameYear,
      gameYearMonth: newGameYearMonth,
      lastSettleTime: Date.now(),
      monthlyIncome: newMonthlyIncome,
      addChildCooldown: newCooldown,
      totalBirths,
    });

    get().save();

    // 归档本轮去世成员到族谱
    if (diedThisSettle.length > 0) {
      const dynastyName = getDynastyConfig(useDynastyStore.getState().info.id).name;
      const genealogy = useGenealogyStore.getState();
      diedThisSettle.forEach(m => genealogy.archiveMember(m, dynastyName));
    }

    // 推送婚恋/生育通知事件（复用事件弹窗）
    const eventStore = useEventStore.getState();
    notices.forEach(n => eventStore.pushNotice(n, newGameMonth));

    // 结算后尝试触发随机事件
    eventStore.tryTrigger(newGameMonth);
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

    if (!useResourceStore.getState().consumeSilver(ADD_CHILD_COST)) {
      return { success: false, message: `银两不足，需要 ${ADD_CHILD_COST} 银两` };
    }

    // 辈分取家族血脉一方 +1；姓氏用家族姓氏；玩家输入作为个人名
    const familyParent = couple.father.generation > 0 ? couple.father
      : couple.mother.generation > 0 ? couple.mother : null;
    const childGeneration = (familyParent?.generation ?? 1) + 1;
    const givenName = name.trim() || generateGivenName(gender);

    const child = createChildService(couple.father, couple.mother, gender, state.gameMonth, state.surname, childGeneration, givenName);
    const newMembers = [...state.members, child];
    couple.father.childrenIds.push(child.id);
    couple.mother.childrenIds.push(child.id);

    set({
      members: newMembers,
      addChildCooldown: ADD_CHILD_COOLDOWN,
      totalBirths: state.totalBirths + 1,
      monthlyIncome: calcFamilyMonthlyIncome(newMembers, getTotalBonusPercent()),
    });

    get().save();
    return { success: true, child, message: '添丁成功！' };
  },

  renameMember: (memberId, givenName) => {
    const trimmed = givenName.trim();
    if (!trimmed) return { success: false, message: '名字不能为空' };
    const state = get();
    const target = state.members.find(m => m.id === memberId);
    if (!target) return { success: false, message: '成员不存在' };
    if (target.generation <= 0) return { success: false, message: '外来配偶不可改名' };

    const members = state.members.map(m =>
      m.id === memberId
        ? { ...m, givenName: trimmed, name: composeFamilyName(m.surname, m.generation, trimmed) }
        : m,
    );
    set({ members });
    get().save();
    return { success: true, message: '改名成功' };
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

  applyItemEffect: (effectType, effectValue) => {
    const state = get();
    const members = state.members.map(m => ({ ...m }));
    const alive = members.filter(m => m.isAlive);
    const children = alive.filter(m => m.lifeStage === 'child');
    const adults = alive.filter(m => m.lifeStage === 'adult');
    const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

    let result: ItemEffectResult;
    let newCooldown = state.addChildCooldown;

    switch (effectType) {
      case 'upgrade_aptitude': {
        if (children.length === 0) {
          result = { success: false, message: '没有幼年成员可培养' };
        } else {
          const target = pick(children);
          if (Math.random() < effectValue) {
            const before = target.aptitude;
            target.aptitude = upgradeAptitude(target.aptitude);
            if (target.aptitude !== before) {
              result = { success: true, message: `${target.name} 资质提升至「${APTITUDE_NAMES[target.aptitude]}」` };
            } else {
              result = { success: true, message: `${target.name} 已是天才，资质无法再提升` };
            }
          } else {
            result = { success: true, message: `${target.name} 使用了书卷，但未能突破` };
          }
        }
        break;
      }
      case 'breakthrough': {
        if (adults.length === 0) {
          result = { success: false, message: '没有成年成员可突破' };
        } else {
          const target = pick(adults);
          if (Math.random() < effectValue) {
            const before = target.aptitude;
            target.aptitude = upgradeAptitude(target.aptitude);
            target.breakthroughCount += 1;
            if (target.aptitude !== before) {
              result = { success: true, message: `${target.name} 突破至「${APTITUDE_NAMES[target.aptitude]}」` };
            } else {
              result = { success: true, message: `${target.name} 已是天才，突破无果` };
            }
          } else {
            result = { success: true, message: `${target.name} 服用了丹药，但未能突破` };
          }
        }
        break;
      }
      case 'extend_life': {
        if (alive.length === 0) {
          result = { success: false, message: '没有存活成员' };
        } else {
          const target = pick(alive);
          target.lifeBonus += effectValue;
          result = { success: true, message: `${target.name} 寿命延长 ${effectValue} 个月` };
        }
        break;
      }
      case 'reroll_aptitude': {
        if (alive.length === 0) {
          result = { success: false, message: '没有存活成员' };
        } else {
          const target = pick(alive);
          target.aptitude = rerollAptitude();
          result = { success: true, message: `${target.name} 资质重掷为「${APTITUDE_NAMES[target.aptitude]}」` };
        }
        break;
      }
      case 'income_boost': {
        if (adults.length === 0) {
          result = { success: false, message: '没有成年成员可加成' };
        } else {
          const target = pick(adults);
          target.incomeMultiplier += effectValue;
          Object.assign(target, updateMemberLifeStage(target));
          result = { success: true, message: `${target.name} 月收益永久提升 ${Math.round(effectValue * 100)}%` };
        }
        break;
      }
      case 'reset_cooldown': {
        newCooldown = 0;
        result = { success: true, message: '添丁冷却已重置' };
        break;
      }
      case 'family_aptitude_boost': {
        let boosted = 0;
        for (const c of children) {
          if (c.aptitude !== 'genius' && Math.random() < effectValue) {
            c.aptitude = upgradeAptitude(c.aptitude);
            boosted++;
          }
        }
        result = { success: true, message: boosted > 0 ? `${boosted} 位幼年成员资质提升` : '匾额已挂上，本次暂无成员突破' };
        break;
      }
      default:
        result = { success: false, message: '未知道具效果' };
    }

    if (result.success) {
      set({
        members,
        addChildCooldown: newCooldown,
        monthlyIncome: calcFamilyMonthlyIncome(members, getTotalBonusPercent()),
      });
      get().save();
    }

    return result;
  },

  claimOfflineReward: () => {
    const { pendingOfflineSilver } = get();
    if (pendingOfflineSilver <= 0) return 0;
    useResourceStore.getState().addSilver(pendingOfflineSilver);
    set({ pendingOfflineSilver: 0 });
    return pendingOfflineSilver;
  },

  changeProfession: (memberId, newProfession) => {
    const state = get();
    const member = state.members.find(m => m.id === memberId);
    if (!member) return { success: false, message: '成员不存在' };

    const members = state.members.map(m => ({ ...m }));
    const target = members.find(m => m.id === memberId)!;

    const result = changeProfessionService(target, newProfession);
    if (!result.success) return { success: false, message: result.message };

    if (!useResourceStore.getState().consumeSilver(result.cost)) {
      return { success: false, message: `银两不足，需要 ${result.cost} 银两` };
    }

    set({
      members,
      monthlyIncome: calcFamilyMonthlyIncome(members, getTotalBonusPercent()),
    });
    get().save();
    return { success: true, message: result.message };
  },

  upgradeProfession: (memberId) => {
    const state = get();
    const member = state.members.find(m => m.id === memberId);
    if (!member) return { success: false, message: '成员不存在' };

    const members = state.members.map(m => ({ ...m }));
    const target = members.find(m => m.id === memberId)!;

    const result = upgradeProfessionService(target);
    if (!result.success) return { success: false, message: result.message };

    if (!useResourceStore.getState().consumeSilver(result.cost)) {
      return { success: false, message: `银两不足，需要 ${result.cost} 银两` };
    }

    set({
      members,
      monthlyIncome: calcFamilyMonthlyIncome(members, getTotalBonusPercent()),
    });
    get().save();
    return { success: true, message: result.message };
  },

  save: () => {
    const { members, gameMonth, gameYear, gameYearMonth, monthlyIncome, addChildCooldown, lastOnlineTime } = get();
    setStorage('familyState', { members, gameMonth, gameYear, gameYearMonth, monthlyIncome, addChildCooldown, lastOnlineTime });
  },
}));
