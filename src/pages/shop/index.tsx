import React, { useEffect, useState, useCallback } from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { useShopStore } from '@/stores/shopStore';
import { useResourceStore } from '@/stores/resourceStore';
import { ShopItem } from '@/types/shop';
import styles from './index.module.scss';

const CATEGORIES = [
  { key: 'all', label: '全部' },
  { key: 'cultivate', label: '培养' },
  { key: 'prop', label: '道具' },
];

const ITEM_ICONS: Record<string, string> = {
  upgrade_aptitude: '\uD83D\uDCDA', breakthrough: '\uD83D\uDC8A', extend_life: '\uD83D\uDD6F\uFE0F',
  reroll_aptitude: '\uD83D\uDD2E', income_boost: '\uD83E\uDD63', reset_cooldown: '\uD83D\uDC09',
  family_aptitude_boost: '\uD83C\uDFC5', random_reward: '\uD83C\uDF92',
};

const ShopPage: React.FC = () => {
  const { items, init: initShop, getPurchaseCount, recordPurchase, resetDailyIfNeeded, resetWeeklyIfNeeded } = useShopStore();
  const { silver, luckyCharm, init: initResource, consumeSilver, consumeLuckyCharm, addSilver, addLuckyCharm } = useResourceStore();
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => { initResource(); initShop(); resetDailyIfNeeded(); resetWeeklyIfNeeded(); }, []);

  const filtered = activeTab === 'all' ? items : items.filter(i => i.category === activeTab);

  const handleBuy = useCallback((item: ShopItem) => {
    const count = getPurchaseCount(item.id, item.limitType);
    const max = item.limitType === 'unlimited' ? Infinity : item.limitCount;
    if (count >= max) { Taro.showToast({ title: '购买次数已达上限', icon: 'none' }); return; }
    if (item.priceType === 'silver' && silver < item.price) { Taro.showToast({ title: '银两不足', icon: 'none' }); return; }
    if (item.priceType === 'luckyCharm' && luckyCharm < item.price) { Taro.showToast({ title: '福缘符不足', icon: 'none' }); return; }

    if (item.priceType === 'silver') consumeSilver(item.price);
    else consumeLuckyCharm(item.price);

    if (item.effectType === 'random_reward') {
      if (Math.random() < 0.5) {
        const r = 200 + Math.floor(Math.random() * 800);
        addSilver(r);
        Taro.showToast({ title: `获得 ${r} 银两！`, icon: 'success' });
      } else {
        const c = 5 + Math.floor(Math.random() * 15);
        addLuckyCharm(c);
        Taro.showToast({ title: `获得 ${c} 福缘符！`, icon: 'success' });
      }
    } else {
      Taro.showToast({ title: `购买成功：${item.name}`, icon: 'success' });
    }
    recordPurchase(item.id, item.limitType);
  }, [silver, luckyCharm, getPurchaseCount, recordPurchase, consumeSilver, consumeLuckyCharm, addSilver, addLuckyCharm]);

  const isDisabled = (item: ShopItem) => {
    if (item.limitType === 'unlimited') return false;
    return getPurchaseCount(item.id, item.limitType) >= item.limitCount;
  };

  return (
    <View className={styles.page}>
      <View className={styles.header}><Text className={styles.headerTitle}>{'\uD83C\uDFEA'} 家族商铺</Text></View>
      <View className={styles.tabBar}>
        {CATEGORIES.map(cat => (
          <Text key={cat.key} className={classnames(styles.tab, activeTab === cat.key && styles.tabActive)} onClick={() => setActiveTab(cat.key)}>{cat.label}</Text>
        ))}
      </View>
      <View className={styles.list}>
        {filtered.map(item => {
          const divDis = isDisabled(item);
          const cantBuy = item.priceType === 'silver' ? silver < item.price : luckyCharm < item.price;
          return (
            <View key={item.id} className={styles.item}>
              <View className={styles.itemIcon}><Text>{ITEM_ICONS[item.effectType] || '\uD83D\uDCE6'}</Text></View>
              <View className={styles.itemInfo}>
                <Text className={styles.itemName}>{item.name}</Text>
                <Text className={styles.itemDesc}>{item.description}</Text>
                <Text className={styles.itemPrice}>{item.price} {item.priceType === 'silver' ? '银两' : '福缘符'}</Text>
                {item.limitType !== 'unlimited' && <Text className={styles.itemLimit}>今日剩余：{Math.max(0, item.limitCount - getPurchaseCount(item.id, item.limitType))}次</Text>}
              </View>
              <View className={classnames(styles.buyBtn, (divDis || cantBuy) && styles.buyBtnDisabled)} onClick={() => !divDis && !cantBuy && handleBuy(item)}>
                <Text className={styles.buyBtnText}>{divDis ? '已售罄' : cantBuy ? '不足' : '购买'}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};

export default ShopPage;
