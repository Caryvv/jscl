export type ProductType = 'goldBar' | 'privilege' | 'gift';

export interface PaymentProduct {
  id: string;
  name: string;
  desc: string;
  /** 价格（分） */
  price: number;
  type: ProductType;
  /** 金条数量（type=goldBar / gift 时有效） */
  goldBar?: number;
  /** 特权类型（type=privilege 时有效） */
  privilege?: 'monthCard' | 'lifetimeCard';
  /** 礼包附赠银两 */
  silver?: number;
  /** 礼包附赠福缘符 */
  luckyCharm?: number;
}

/** 商品档位配置（价格单位：分） */
export const PAYMENT_PRODUCTS: PaymentProduct[] = [
  { id: 'gold_60', name: '金条×60', desc: '小额补给', price: 600, type: 'goldBar', goldBar: 60 },
  { id: 'gold_300', name: '金条×300', desc: '超值热销', price: 3000, type: 'goldBar', goldBar: 300 },
  { id: 'gold_680', name: '金条×680', desc: '豪华之选', price: 6800, type: 'goldBar', goldBar: 680 },
  { id: 'gold_1280', name: '金条×1280', desc: '至尊礼遇', price: 12800, type: 'goldBar', goldBar: 1280 },
  { id: 'card_month', name: '免广告月卡', desc: '30天免广告', price: 1800, type: 'privilege', privilege: 'monthCard' },
  { id: 'card_lifetime', name: '免广告终身卡', desc: '永久免广告', price: 9800, type: 'privilege', privilege: 'lifetimeCard' },
  { id: 'gift_newbie', name: '新手礼包', desc: '金条60+银两5000+福缘符10', price: 600, type: 'gift', goldBar: 60, silver: 5000, luckyCharm: 10 },
  { id: 'gift_heirloom', name: '传家宝限定礼包', desc: '金条300+银两20000+福缘符30', price: 3000, type: 'gift', goldBar: 300, silver: 20000, luckyCharm: 30 },
];

export function getProduct(id: string): PaymentProduct | undefined {
  return PAYMENT_PRODUCTS.find(p => p.id === id);
}

/** 单次充值限额（分）：未成年人 50 元 */
export const MINOR_SINGLE_LIMIT = 5000;
/** 月累计充值限额（分）：未成年人 200 元 */
export const MINOR_MONTHLY_LIMIT = 20000;
