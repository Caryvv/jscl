import { RandomEvent } from '@/types/event';

/** 基础事件触发概率（每月结算后） */
export const EVENT_TRIGGER_RATE = 0.2;

export const EVENT_POOL: RandomEvent[] = [
  // ========== 正面事件 ==========
  {
    id: 'windfall',
    name: '天降横财',
    icon: '\uD83D\uDCB0',
    description: '先祖祠堂中发现一坛埋藏的银两，真是祖荫庇佑！',
    type: 'positive',
    weight: 10,
    effects: [
      { target: 'silver', action: 'add', value: 500 },
    ],
  },
  {
    id: 'good_harvest',
    name: '丰年瑞雪',
    icon: '\uD83C\uDF3E',
    description: '风调雨顺，田产丰收，家族收入大增。',
    type: 'positive',
    weight: 12,
    conditions: { minGameMonth: 6 },
    effects: [
      { target: 'silver', action: 'add', value: 300 },
    ],
  },
  {
    id: 'noble_guest',
    name: '贵人来访',
    icon: '\uD83C\uDF96\uFE0F',
    description: '一位贵人造访府上，赠予福缘符以表心意。',
    type: 'positive',
    weight: 8,
    effects: [
      { target: 'luckyCharm', action: 'add', value: 3 },
    ],
  },
  {
    id: 'prodigy_born',
    name: '灵童降世',
    icon: '\u2728',
    description: '族中幼童展现出过人天赋，资质大增！',
    type: 'positive',
    weight: 6,
    conditions: { minMembers: 3 },
    effects: [
      { target: 'memberRandom', action: 'upgradeAptitude', value: 1 },
    ],
  },

  // ========== 负面事件 ==========
  {
    id: 'drought',
    name: '旱灾肆虐',
    icon: '\uD83C\uDF21\uFE0F',
    description: '大旱数月，田地龟裂，家族损失惨重。',
    type: 'negative',
    weight: 10,
    conditions: { minSilver: 200, minGameMonth: 3 },
    effects: [
      { target: 'silver', action: 'remove', value: 200 },
    ],
  },
  {
    id: 'plague',
    name: '瘟疫横行',
    icon: '\uD83E\uDDA0',
    description: '瘟疫蔓延，族中长者染病，需延医问药。',
    type: 'negative',
    weight: 8,
    conditions: { minSilver: 300, minGameMonth: 6 },
    choices: [
      {
        label: '重金延医（-300银两）',
        cost: { type: 'silver', amount: 300 },
        effects: [],
        successRate: 0.9,
        successMsg: '名医妙手回春，长者转危为安',
        failMsg: '虽已尽力，长者仍未能撑过此劫',
      },
      {
        label: '听天由命',
        cost: { type: 'silver', amount: 0 },
        effects: [
          { target: 'memberRandom', action: 'extendLife', value: -12 },
        ],
        successMsg: '长者凭自身毅力挺了过来',
      },
    ],
  },
  {
    id: 'theft',
    name: '盗匪夜袭',
    icon: '\uD83D\uDD12',
    description: '夜半盗匪闯入仓库，掠走部分财物。',
    type: 'negative',
    weight: 9,
    conditions: { minSilver: 150 },
    effects: [
      { target: 'silver', action: 'remove', value: 150 },
    ],
  },

  // ========== 中性事件（有选择） ==========
  {
    id: 'mysterious_merchant',
    name: '神秘商人',
    icon: '\uD83E\uDDCD',
    description: '一位神秘商人路过府上，兜售一枚福缘符。',
    type: 'neutral',
    weight: 8,
    conditions: { minSilver: 200 },
    choices: [
      {
        label: '购买（-200银两，+3福缘符）',
        cost: { type: 'silver', amount: 200 },
        effects: [
          { target: 'luckyCharm', action: 'add', value: 3 },
        ],
        successMsg: '商人满意离去，福缘符到手',
      },
      {
        label: '婉拒',
        cost: { type: 'silver', amount: 0 },
        effects: [],
        successMsg: '商人摇头叹息，转身离去',
      },
    ],
  },
  {
    id: 'ancestor_dream',
    name: '先祖托梦',
    icon: '\uD83D\uDE38',
    description: '先祖于梦中指引，告知一处宝藏所在。',
    type: 'neutral',
    weight: 7,
    choices: [
      {
        label: '循梦寻宝（-1福缘符）',
        cost: { type: 'luckyCharm', amount: 1 },
        effects: [
          { target: 'silver', action: 'add', value: 800 },
        ],
        successRate: 0.6,
        successMsg: '果然寻得宝箱，获银800两！',
        failMsg: '空寻一夜，一无所获',
      },
      {
        label: '只是一场梦',
        cost: { type: 'silver', amount: 0 },
        effects: [],
        successMsg: '翻个身继续睡了',
      },
    ],
  },
  {
    id: 'charity_request',
    name: '乡邻求助',
    icon: '\uD83C\uDF39',
    description: '乡邻因灾荒前来求助，望家族施以援手。',
    type: 'neutral',
    weight: 9,
    conditions: { minSilver: 100 },
    choices: [
      {
        label: '慷慨解囊（-100银两）',
        cost: { type: 'silver', amount: 100 },
        effects: [
          { target: 'luckyCharm', action: 'add', value: 2 },
        ],
        successMsg: '乡邻感恩戴德，家族声望大增，获福缘符x2',
      },
      {
        label: '婉言谢绝',
        cost: { type: 'silver', amount: 0 },
        effects: [],
        successMsg: '乡邻叹气离去',
      },
    ],
  },
];
