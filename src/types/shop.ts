export interface ShopItem {
  id: string;
  name: string;
  description: string;
  category: 'cultivate' | 'prop';
  priceType: 'silver' | 'luckyCharm';
  price: number;
  effectType: string;
  effectValue: number;
  limitType: 'daily' | 'weekly' | 'unlimited';
  limitCount: number;
  sortOrder: number;
}
