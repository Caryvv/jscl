# 《家世昌隆》第一阶段（MVP核心版）技术方案

## 文档信息

- 文档版本：V1.0
- 编制日期：2026年08月12日
- 对应阶段：第一阶段 MVP核心版（4周）
- 核心目标：家族成员系统、基础放置收益、收支结算、添丁功能、商店系统、主界面开发

---

## 一、技术选型与架构总览

### 1.1 技术栈

| 层级 | 技术选型 | 说明 |
|------|----------|------|
| 跨端框架 | Taro 4.x | 一套代码同时编译微信/抖音小程序，React 语法 |
| UI 框架 | Taro UI + 自定义组件 | 轻量组件库，按需引入，控制包体积 |
| 状态管理 | Zustand | 轻量（<1KB），无 boilerplate，适合小程序场景 |
| 数据持久化 | Taro.setStorageSync + 云开发 | 本地缓存优先，关键数据云端同步 |
| 云服务 | 微信云开发 / 抖音云开发 | 无需自建服务器，提供数据库、云函数、存储 |
| 构建工具 | Webpack（Taro 内置） | 支持分包加载、Tree Shaking |

### 1.2 技术选型理由

- **Taro 4.x**：社区活跃、双端编译成熟度最高，React/Vue 皆可，团队学习成本低
- **Zustand**：比 Redux 轻量 10 倍以上，API 简洁，对小程序包体积友好
- **云开发**：免运维，自带数据库与鉴权，符合小程序平台规范，降低后端开发成本
- **Taro UI**：专为 Taro 设计，组件兼容性好，包体积可控

### 1.3 架构分层

```
┌─────────────────────────────────────────────┐
│                  视图层 (View)                │
│  Taro 页面/组件 + Taro UI + CSS Modules      │
├─────────────────────────────────────────────┤
│                 状态层 (Store)                │
│  Zustand Store（家族/资源/商店/系统）         │
├─────────────────────────────────────────────┤
│                  逻辑层 (Service)             │
│  结算引擎 / 成员管理 / 商店逻辑               │
├─────────────────────────────────────────────┤
│                  数据层 (Data)                │
│  本地 Storage + 云数据库 + 云函数             │
└─────────────────────────────────────────────┘
```

---

## 二、项目工程结构

```
jycl/
├── src/
│   ├── app.tsx                      # 应用入口
│   ├── app.config.ts                # 全局配置（页面路由、窗口、分包）
│   ├── app.scss                     # 全局样式变量
│   ├── pages/
│   │   ├── index/                   # 主界面（家族树）
│   │   │   ├── index.tsx
│   │   │   ├── index.config.ts
│   │   │   └── index.module.scss
│   │   ├── family-detail/           # 成员详情页
│   │   ├── shop/                    # 商店页
│   │   └── add-child/              # 添丁有喜页
│   ├── components/
│   │   ├── FamilyTree/             # 家族关系树组件
│   │   ├── MemberCard/             # 成员卡片组件
│   │   ├── TopStatusBar/           # 顶部状态栏
│   │   ├── BottomNav/              # 底部导航
│   │   ├── SideBar/                # 左右功能栏
│   │   └── CurrencyBar/            # 货币展示条
│   ├── stores/
│   │   ├── familyStore.ts          # 家族成员状态
│   │   ├── resourceStore.ts        # 资源（银两/福缘符/金条）
│   │   ├── shopStore.ts            # 商店状态
│   │   └── systemStore.ts          # 系统设置、游戏时间
│   ├── services/
│   │   ├── settlement.ts           # 收支结算引擎
│   │   ├── memberService.ts        # 成员增删改查
│   │   ├── shopService.ts          # 商店购买逻辑
│   │   └── offlineService.ts       # 离线收益计算
│   ├── constants/
│   │   ├── member.ts               # 成员属性常量（资质/职业/年龄阈值）
│   │   ├── game.ts                 # 游戏基础配置（结算周期等）
│   │   └── shop.ts                 # 商品配置表
│   ├── types/
│   │   ├── member.d.ts             # 成员类型定义
│   │   ├── resource.d.ts           # 资源类型定义
│   │   └── game.d.ts               # 游戏通用类型
│   └── utils/
│       ├── time.ts                 # 游戏时间工具（月/年换算）
│       ├── random.ts               # 随机数工具（资质生成等）
│       └── storage.ts              # 本地存储封装
├── cloud/
│   ├── functions/                  # 云函数
│   │   ├── syncGameData/           # 游戏数据云端同步
│   │   └── userInit/               # 新用户初始化
│   └── database/
│       └── schema.md               # 数据库集合设计文档
├── project.config.json             # 微信小程序项目配置
├── project.dd.config.json          # 抖音小程序项目配置
└── package.json
```

### 2.1 分包策略

为保证主包 < 2MB，采用如下分包方案：

| 分包名称 | 包含内容 | 预估大小 |
|----------|----------|----------|
| 主包 | 首页（家族树）、顶部状态栏、底部导航、核心通用组件、状态管理、结算引擎 | ~1.5MB |
| shop 分包 | 商店页面及组件 | ~200KB |
| member 分包 | 成员详情页、添丁有喜页 | ~200KB |

---

## 三、核心系统技术实现

### 3.1 家族成员系统

#### 3.1.1 数据模型

```typescript
// types/member.d.ts

/** 资质等级 */
type Aptitude = 'normal' | 'good' | 'excellent' | 'genius';

/** 成员身份 */
type MemberRole = 'patriarch' | 'matriarch' | 'offspring' | 'collateral';

/** 年龄阶段 */
type LifeStage = 'child' | 'adult' | 'elder';

/** 基础职业 */
type Profession = 'none' | 'scholar' | 'merchant' | 'officer' | 'doctor';

/** 性别 */
type Gender = 'male' | 'female';

interface FamilyMember {
  id: string;                    // 唯一标识
  name: string;                  // 姓名
  gender: Gender;
  role: MemberRole;
  age: number;                   // 游戏内月数
  lifeStage: LifeStage;
  aptitude: Aptitude;
  profession: Profession;
  professionLevel: number;       // 职业等级 1-10
  monthlyIncome: number;         // 月收益（成年正值，幼/老年负值）
  monthlyCost: number;           // 月支出

  // 关系属性
  spouseId: string | null;       // 配偶ID
  parentIds: string[];           // 双亲ID
  childrenIds: string[];         // 子女ID列表

  // 状态
  isAlive: boolean;
  birthMonth: number;            // 出生时的游戏总月数
  deathMonth: number | null;     // 离世时的游戏总月数

  // 资质突破相关
  breakthroughCount: number;     // 突破次数
}
```

#### 3.1.2 成员年龄推进与生命周期

```typescript
// services/memberService.ts

// 年龄阈值（月）
const AGE_THRESHOLD = {
  CHILD_MAX: 16 * 12,     // 16岁 = 192个月
  ADULT_MAX: 50 * 12,     // 50岁 = 600个月
  ELDER_MAX: 75 * 12,     // 75岁 = 900个月（随机浮动±24月）
};

/**
 * 根据年龄更新成员生命阶段与收支
 */
function updateMemberLifeStage(member: FamilyMember): FamilyMember {
  const ageMonths = member.age;

  if (ageMonths <= AGE_THRESHOLD.CHILD_MAX) {
    member.lifeStage = 'child';
    member.monthlyCost = calcChildCost(member.aptitude);
    member.monthlyIncome = 0;
  } else if (ageMonths <= AGE_THRESHOLD.ADULT_MAX) {
    member.lifeStage = 'adult';
    member.monthlyCost = 0;
    member.monthlyIncome = calcAdultIncome(member);
  } else {
    member.lifeStage = 'elder';
    member.monthlyCost = calcElderCost(member.age);
    member.monthlyIncome = calcElderIncome(member);
  }

  return member;
}
```

#### 3.1.3 子嗣资质继承算法

```typescript
// services/memberService.ts

/**
 * 资质继承：取父母双方资质档位均值 + 随机偏移
 * 有概率发生"资质突破"提升一档
 */
function inheritAptitude(father: FamilyMember, mother: FamilyMember): Aptitude {
  const APTITUDE_WEIGHT = { normal: 1, good: 2, excellent: 3, genius: 4 };

  const avgWeight = (APTITUDE_WEIGHT[father.aptitude] + APTITUDE_WEIGHT[mother.aptitude]) / 2;

  // 随机偏移 (-0.5 ~ +0.5)
  const offset = (Math.random() - 0.5);
  let finalWeight = Math.round(avgWeight + offset);
  finalWeight = Math.max(1, Math.min(4, finalWeight));

  // 突破概率（基于父母平均权重）
  const breakthroughChance = (avgWeight - 1) * 0.08; // 最高24%
  if (Math.random() < breakthroughChance && finalWeight < 4) {
    finalWeight += 1;
  }

  const weightMap: Aptitude[] = ['normal', 'good', 'excellent', 'genius'];
  return weightMap[finalWeight - 1];
}
```

### 3.2 收支结算引擎

#### 3.2.1 结算时机与流程

```
结算触发方式：
  ├── 在线结算：每 N 秒自动触发（对应游戏内一个月）
  ├── 上线结算：计算离线时长，批量结算
  └── 手动结算：特定操作触发（如添丁扣费后立即结算）
```

```typescript
// services/settlement.ts

interface SettlementResult {
  totalIncome: number;           // 总收入
  totalCost: number;             // 总支出
  netIncome: number;             // 净收益
  memberDetails: MemberSettlement[];  // 各成员明细
  gameMonth: number;             // 当月游戏月份
}

interface MemberSettlement {
  memberId: string;
  memberName: string;
  income: number;
  cost: number;
  lifeStage: LifeStage;
}

/**
 * 结算引擎核心方法
 */
function settleMonth(members: FamilyMember[], gameMonth: number): SettlementResult {
  const aliveMembers = members.filter(m => m.isAlive);

  let totalIncome = 0;
  let totalCost = 0;
  const memberDetails: MemberSettlement[] = [];

  for (const member of aliveMembers) {
    // 年龄推进
    member.age += 1;
    updateMemberLifeStage(member);

    totalIncome += member.monthlyIncome;
    totalCost += member.monthlyCost;

    memberDetails.push({
      memberId: member.id,
      memberName: member.name,
      income: member.monthlyIncome,
      cost: member.monthlyCost,
      lifeStage: member.lifeStage,
    });

    // 检查离世
    if (member.age >= getDeathAge(member)) {
      member.isAlive = false;
      member.deathMonth = gameMonth;
    }
  }

  return {
    totalIncome,
    totalCost,
    netIncome: totalIncome - totalCost,
    memberDetails,
    gameMonth,
  };
}
```

#### 3.2.2 离线收益计算

```typescript
// services/offlineService.ts

/** 离线收益上限（小时） */
const MAX_OFFLINE_HOURS = 12;

function calcOfflineReward(
  lastOnlineTime: number,       // 最后在线时间戳
  currentTime: number,          // 当前时间戳
  monthlyIncome: number,        // 当前家族月总收益
  offlineBonusMultiplier: number // 离线加成倍率（家丁/广告等）
): number {
  const elapsedMs = currentTime - lastOnlineTime;
  const elapsedHours = Math.min(
    elapsedMs / (1000 * 60 * 60),
    MAX_OFFLINE_HOURS
  );

  // 游戏内1个月 = 现实5分钟，离线收益按此比例折算
  const GAME_MONTH_PER_REAL_HOUR = 12;
  const gameMonths = Math.floor(elapsedHours * GAME_MONTH_PER_REAL_HOUR);

  return gameMonths * monthlyIncome * offlineBonusMultiplier;
}
```

### 3.3 资源管理系统

#### 3.3.1 Store 设计（Zustand）

```typescript
// stores/resourceStore.ts
import { create } from 'zustand';

interface ResourceState {
  silver: number;        // 银两
  luckyCharm: number;    // 福缘符
  goldBar: number;       // 金条
  monthlyIncome: number; // 当前月总收益预览

  addSilver: (amount: number) => void;
  consumeSilver: (amount: number) => boolean;
  addLuckyCharm: (amount: number) => void;
  consumeLuckyCharm: (amount: number) => boolean;
  addGoldBar: (amount: number) => void;
  consumeGoldBar: (amount: number) => boolean;
  updateMonthlyIncome: (income: number) => void;
}

export const useResourceStore = create<ResourceState>((set, get) => ({
  silver: 0,
  luckyCharm: 0,
  goldBar: 0,
  monthlyIncome: 0,

  addSilver: (amount) => set((s) => ({ silver: s.silver + amount })),
  consumeSilver: (amount) => {
    if (get().silver < amount) return false;
    set((s) => ({ silver: s.silver - amount }));
    return true;
  },
  addLuckyCharm: (amount) => set((s) => ({ luckyCharm: s.luckyCharm + amount })),
  consumeLuckyCharm: (amount) => {
    if (get().luckyCharm < amount) return false;
    set((s) => ({ luckyCharm: s.luckyCharm - amount }));
    return true;
  },
  addGoldBar: (amount) => set((s) => ({ goldBar: s.goldBar + amount })),
  consumeGoldBar: (amount) => {
    if (get().goldBar < amount) return false;
    set((s) => ({ goldBar: s.goldBar - amount }));
    return true;
  },
  updateMonthlyIncome: (income) => set({ monthlyIncome: income }),
}));
```

### 3.4 商店系统

#### 3.4.1 商品配置表驱动

```typescript
// constants/shop.ts

interface ShopItem {
  id: string;
  name: string;
  description: string;
  category: 'prop' | 'cultivate' | 'gift';
  priceType: 'silver' | 'luckyCharm' | 'goldBar';
  price: number;
  effect: {
    type: string;     // 效果类型
    value: number;    // 效果数值
  };
  limitType: 'daily' | 'weekly' | 'unlimited';
  limitCount: number;
  sortOrder: number;
}

export const SHOP_ITEMS: ShopItem[] = [
  {
    id: 'item_001',
    name: '启蒙书卷',
    description: '提升幼年成员资质，概率提升一档',
    category: 'cultivate',
    priceType: 'silver',
    price: 500,
    effect: { type: 'upgrade_aptitude', value: 0.3 },
    limitType: 'daily',
    limitCount: 3,
    sortOrder: 1,
  },
  // ... 更多商品配置
];
```

### 3.5 主界面实现

#### 3.5.1 页面布局（Flex 实现）

```tsx
// pages/index/index.tsx（伪代码结构）
const IndexPage: React.FC = () => {
  return (
    <View className="page-container">
      {/* 顶部状态栏 */}
      <TopStatusBar />

      <View className="main-content">
        {/* 左侧功能栏 */}
        <SideBar position="left" items={LEFT_MENU_ITEMS} />

        {/* 中间家族树 */}
        <View className="center-area">
          <FamilyTree />
        </View>

        {/* 右侧功能栏 */}
        <SideBar position="right" items={RIGHT_MENU_ITEMS} />
      </View>

      {/* 底部导航 */}
      <BottomNav currentTab="family" />
    </View>
  );
};
```

#### 3.5.2 家族树组件设计

- 采用绝对定位 + CSS 连线（伪元素 border）实现家族关系可视化
- 家主/主母卡片置顶，子嗣按年龄从左至右排列
- 每个卡片显示：头像、姓名、年龄阶段标签、月收支数值
- 点击卡片触发跳转成员详情页
- 性能考虑：家族树节点数上限控制在 30 个以内，超出折叠展示

---

## 四、双平台规范合规

### 4.1 微信小程序规范

| 规范项 | 实施方案 |
|--------|----------|
| 主包 ≤ 2MB | 分包加载，主包仅含首页及核心逻辑 |
| 请求域名白名单 | 云开发免配域名，使用 `wx.cloud.callFunction` |
| 用户隐私协议 | 首次启动弹窗展示并获取同意，使用 `<button open-type="agreePrivacyAuthorization">` |
| 内容安全 | 用户输入（成员命名）接入 `msgSecCheck` |
| 未成年人保护 | 接入微信未成年人防沉迷，限制时长与充值 |

### 4.2 抖音小程序规范

| 规范项 | 实施方案 |
|--------|----------|
| 主包 ≤ 2MB | 与微信一致的分包策略 |
| 请求域名配置 | 在抖音开发者平台配置 `request` 合法域名 |
| 用户隐私 | 接入抖音用户信息授权，明示隐私政策 |
| 内容审核 | 用户生成内容接入 `tt.security.checkContent` |
| 未成年人模式 | 接入抖音防沉迷 SDK |

### 4.3 通用合规要点

- **命名规范**：全局变量前缀 `__` 避免平台冲突，使用 `Object.defineProperty` 做安全防护
- **API 调用**：封装平台差异层 `src/utils/platform.ts`，运行时判断环境调用对应 API
- **禁止行为**：不使用 `eval`、`new Function`、动态执行代码

```typescript
// utils/platform.ts
const isWeChat = process.env.TARO_ENV === 'weapp';
const isDouyin = process.env.TARO_ENV === 'tt';

export const platform = {
  isWeChat,
  isDouyin,
  /** 获取云开发实例 */
  getCloud: () => isWeChat ? wx.cloud : tt.cloud,
  /** 获取存储 API */
  getStorage: (key: string) => isWeChat ? wx.getStorageSync(key) : tt.getStorageSync(key),
  setStorage: (key: string, data: any) => isWeChat ? wx.setStorageSync(key, data) : tt.setStorageSync(key, data),
};
```

---

## 五、MVP 阶段交付清单

| 交付项 | 说明 |
|--------|------|
| 主界面（家族树） | 完整布局，家族关系可视化，成员卡片交互 |
| 家族成员系统 | 成员 CRUD、年龄推进、生命周期、资质系统 |
| 收支结算引擎 | 在线/离线结算，离线收益累计 |
| 添丁有喜 | 子嗣生育、资质继承、冷却机制 |
| 商店系统 | 商品配置、购买逻辑、限购刷新 |
| 资源管理 | 银两/福缘符/金条三种货币 |
| 本地存档 | Storage 读写、数据持久化 |
| 双端基础适配 | 编译到微信/抖音小程序，基础平台 API 封装 |
| 隐私合规 | 隐私弹窗、内容安全检测 |

---

## 六、风险与应对

| 风险 | 影响 | 应对 |
|------|------|------|
| Taro 双端编译差异 | 部分 API 表现不一致 | 封装平台差异层，关键路径做两端真机测试 |
| 离线收益计算精度 | 数值溢出或不准 | 使用整数（银两最小单位），避免浮点运算 |
| 主包体积超限 | 审核不通过 | 持续监控包体积，非核心模块全部进分包 |
| 云开发冷启动 | 新用户首次加载慢 | 本地缓存优先，云端同步异步执行 |

---

## 七、开发环境与工具链

| 工具 | 用途 |
|------|------|
| VS Code + Taro 插件 | IDE |
| 微信开发者工具 | 微信端调试与预览 |
| 抖音开发者工具 | 抖音端调试与预览 |
| 微信云开发控制台 | 数据库/云函数管理 |
| 抖音云开发控制台 | 数据库/云函数管理 |
| Git | 版本管理 |
| ESLint + Prettier | 代码规范 |
