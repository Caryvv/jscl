import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { useResourceStore } from '@/stores/resourceStore';
import { usePrivilegeStore } from '@/stores/privilegeStore';
import { PAYMENT_PRODUCTS, PaymentProduct } from '@/constants/payment';
import { purchase } from '@/services/paymentService';
import { youthGuard } from '@/services/guardService';
import styles from './index.module.scss';

const TYPE_LABEL: Record<string, string> = {
  goldBar: '金条直充',
  privilege: '特权卡',
  gift: '限定礼包',
};

const RechargePage: React.FC = () => {
  const { goldBar, init: initResource } = useResourceStore();
  const { isAdFree, init: initPrivilege } = usePrivilegeStore();
  const [paying, setPaying] = useState('');

  useEffect(() => {
    initResource();
    initPrivilege();
  }, []);

  const handleBuy = useCallback(async (product: PaymentProduct) => {
    if (paying) return;
    // 防沉迷充值限额校验
    const limit = youthGuard.checkPurchaseLimit(product.price);
    if (!limit.allowed) {
      Taro.showModal({ title: '充值受限', content: limit.message, showCancel: false });
      return;
    }
    setPaying(product.id);
    try {
      const result = await purchase(product.id);
      if (result.success) {
        youthGuard.recordPurchase(product.price);
        Taro.showToast({ title: `${product.name} 已到账`, icon: 'success' });
      } else {
        Taro.showToast({ title: result.message, icon: 'none' });
      }
    } finally {
      setPaying('');
    }
  }, [paying]);

  // 按类型分组
  const groups = ['goldBar', 'privilege', 'gift'].map(type => ({
    type,
    label: TYPE_LABEL[type],
    items: PAYMENT_PRODUCTS.filter(p => p.type === type),
  }));

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.headerTitle}>{'\uD83D\uDCB0'} 充值中心</Text>
        <View className={styles.headerRight}>
          <Text className={styles.goldText}>{'\uD83E\uDD47'} {goldBar}</Text>
          {isAdFree() && <Text className={styles.adFreeTag}>免广告中</Text>}
        </View>
      </View>

      <ScrollView scrollY className={styles.list}>
        {groups.map(group => (
          <View key={group.type} className={styles.group}>
            <Text className={styles.groupTitle}>{group.label}</Text>
            <View className={styles.grid}>
              {group.items.map(product => (
                <View key={product.id} className={styles.card}>
                  <Text className={styles.cardName}>{product.name}</Text>
                  <Text className={styles.cardDesc}>{product.desc}</Text>
                  <View
                    className={classnames(styles.buyBtn, paying === product.id && styles.buyBtnDisabled)}
                    onClick={() => handleBuy(product)}
                  >
                    <Text className={styles.buyBtnText}>
                      {paying === product.id ? '支付中...' : `¥${(product.price / 100).toFixed(2)}`}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        ))}
        <Text className={styles.notice}>
          温馨提示：游戏内充值仅用于虚拟道具，购买后不支持退款。未成年人请在监护人指导下理性消费。
        </Text>
      </ScrollView>

      <View className={styles.backBtn} onClick={() => Taro.navigateBack()}>
        <Text className={styles.backBtnText}>返回</Text>
      </View>
    </View>
  );
};

export default RechargePage;
