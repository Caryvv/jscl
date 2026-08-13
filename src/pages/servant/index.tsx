import React, { useEffect } from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { useServantStore } from '@/stores/servantStore';
import { useResourceStore } from '@/stores/resourceStore';
import { Servant } from '@/types/servant';
import styles from './index.module.scss';

const ServantPage: React.FC = () => {
  const { servants, init: initServant, upgradeServant } = useServantStore();
  const { silver, init: initResource } = useResourceStore();

  useEffect(() => { initServant(); initResource(); }, []);

  const handleUpgrade = (servant: Servant) => {
    const cost = servant.baseCost + servant.costGrowth * servant.level;
    if (silver < cost) { Taro.showToast({ title: '银两不足', icon: 'none' }); return; }
    const result = upgradeServant(servant.type);
    Taro.showToast({ title: result.message, icon: result.success ? 'success' : 'none' });
  };

  return (
    <View className={styles.page}>
      {servants.map(servant => {
        const cost = servant.baseCost + servant.costGrowth * servant.level;
        const isMax = servant.level >= servant.maxLevel;
        return (
          <View key={servant.id} className={styles.card}>
            <View className={styles.iconWrap}><Text className={styles.iconEmoji}>{servant.icon}</Text></View>
            <View className={styles.infoWrap}>
              <Text className={styles.name}>{servant.name}</Text>
              <Text className={styles.desc}>{servant.effectDesc}</Text>
              <Text className={styles.effect}>+{servant.effectValue}% 加成</Text>
              <Text className={styles.levelInfo}>等级 {servant.level}/{servant.maxLevel}</Text>
            </View>
            <View style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {isMax ? (
                <Text className={styles.maxLevel}>已满级</Text>
              ) : (
                <>
                  <View className={classnames(styles.upgradeBtn, silver < cost && styles.upgradeBtnDisabled)} onClick={() => handleUpgrade(servant)}>
                    <Text className={styles.upgradeBtnText}>升级</Text>
                  </View>
                  <Text className={styles.costText}>{cost}银两</Text>
                </>
              )}
            </View>
          </View>
        );
      })}
      <View className={styles.tipCard}>
        <Text className={styles.tipTitle}>家丁说明</Text>
        <Text className={styles.tipText}>家丁为您的家族提供各种增益效果。升级家丁需要消耗银两，合理分配银两，培养家丁队伍吧！</Text>
      </View>
    </View>
  );
};

export default ServantPage;
