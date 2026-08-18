import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { useFamilyStore } from '@/stores/familyStore';
import { useResourceStore } from '@/stores/resourceStore';
import { getStorage, setStorage } from '@/utils/storage';
import { BIRTH_MILESTONES } from '@/constants/member';
import styles from './index.module.scss';

const CLAIMED_KEY = 'birthMilestoneClaimed';

const rewardText = (rewards: { type: string; amount: number }[]) =>
  rewards
    .map(r => `${r.type === 'silver' ? '银两' : r.type === 'luckyCharm' ? '福缘符' : '金元宝'}+${r.amount}`)
    .join(' ');

const AddChildPage: React.FC = () => {
  const { totalBirths, init: initFamily } = useFamilyStore();
  const { addSilver, addLuckyCharm, addGoldBar, init: initResource } = useResourceStore();
  const [claimedIds, setClaimedIds] = useState<string[]>([]);

  useEffect(() => {
    initFamily();
    initResource();
    setClaimedIds(getStorage<string[]>(CLAIMED_KEY, []) || []);
  }, []);

  const handleClaim = useCallback((id: string) => {
    const milestone = BIRTH_MILESTONES.find(m => m.id === id);
    if (!milestone) return;
    if (totalBirths < milestone.births) {
      Taro.showToast({ title: '尚未达成', icon: 'none' });
      return;
    }
    if (claimedIds.includes(id)) {
      Taro.showToast({ title: '已领取', icon: 'none' });
      return;
    }
    for (const r of milestone.rewards) {
      if (r.type === 'silver') addSilver(r.amount);
      else if (r.type === 'luckyCharm') addLuckyCharm(r.amount);
      else if (r.type === 'goldBar') addGoldBar(r.amount);
    }
    const next = [...claimedIds, id];
    setClaimedIds(next);
    setStorage(CLAIMED_KEY, next);
    Taro.showToast({ title: `领取成功：${rewardText(milestone.rewards)}`, icon: 'success' });
  }, [totalBirths, claimedIds, addSilver, addLuckyCharm, addGoldBar]);

  const handleBack = useCallback(() => {
    const pages = Taro.getCurrentPages();
    if (pages.length > 1) Taro.navigateBack();
    else Taro.switchTab({ url: '/pages/family/index' });
  }, []);

  return (
    <View className={styles.page}>
      <Text className={styles.heroEmoji}>{'\uD83D\uDC76'}</Text>
      <Text className={styles.title}>添丁福报</Text>
      <Text className={styles.desc}>家族开枝散叶，累计添丁可领取福报奖励</Text>

      <View className={styles.countCard}>
        <Text className={styles.countLabel}>累计添丁</Text>
        <Text className={styles.countValue}>{totalBirths}</Text>
        <Text className={styles.countUnit}>人</Text>
      </View>

      <ScrollView scrollY className={styles.list}>
        {BIRTH_MILESTONES.map(m => {
          const reached = totalBirths >= m.births;
          const claimed = claimedIds.includes(m.id);
          const percent = Math.min(100, Math.floor((totalBirths / m.births) * 100));
          return (
            <View key={m.id} className={classnames(styles.card, reached && styles.cardReached)}>
              <View className={styles.cardInfo}>
                <Text className={styles.cardName}>{m.title}</Text>
                <Text className={styles.cardCond}>累计添丁 {m.births} 人</Text>
                {!reached && (
                  <View className={styles.progressBar}>
                    <View className={styles.progressFill} style={{ width: `${percent}%` }} />
                    <Text className={styles.progressText}>{Math.min(totalBirths, m.births)}/{m.births}</Text>
                  </View>
                )}
                <Text className={styles.cardReward}>奖励：{rewardText(m.rewards)}</Text>
              </View>
              <View className={styles.cardAction}>
                {!reached ? (
                  <Text className={styles.statusLocked}>未达成</Text>
                ) : claimed ? (
                  <Text className={styles.statusClaimed}>已领取</Text>
                ) : (
                  <View className={styles.claimBtn} onClick={() => handleClaim(m.id)}>
                    <Text className={styles.claimBtnText}>领取</Text>
                  </View>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>

      <View className={styles.backBtn} onClick={handleBack}>
        <Text className={styles.backBtnText}>返回</Text>
      </View>
    </View>
  );
};

export default AddChildPage;
