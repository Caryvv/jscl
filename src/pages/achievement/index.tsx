import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { useAchievementStore } from '@/stores/achievementStore';
import { ACHIEVEMENT_LIST, CATEGORY_NAMES } from '@/constants/achievement';
import { AchievementCategory } from '@/types/achievement';
import styles from './index.module.scss';

const CATEGORIES: (AchievementCategory | 'all')[] = ['all', 'wealth', 'family', 'trading', 'growth', 'special'];

const AchievementPage: React.FC = () => {
  const { unlockedIds, claimedIds, init, checkAndUnlock, claimReward, getProgress } = useAchievementStore();
  const [activeCategory, setActiveCategory] = useState<AchievementCategory | 'all'>('all');
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    init();
    checkAndUnlock();
  }, []);

  const handleClaim = useCallback((id: string) => {
    const result = claimReward(id);
    Taro.showToast({ title: result.message, icon: result.success ? 'success' : 'none' });
    if (result.success) setRefresh(n => n + 1);
  }, [claimReward]);

  const sorted = [...ACHIEVEMENT_LIST].sort((a, b) => a.sortOrder - b.sortOrder);
  const filtered = activeCategory === 'all' ? sorted : sorted.filter(a => a.category === activeCategory);

  const unlockedCount = unlockedIds.length;
  const totalCount = ACHIEVEMENT_LIST.length;

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.headerTitle}>{'\uD83C\uDFC6'} 成就殿堂</Text>
        <Text className={styles.headerProgress}>已达成 {unlockedCount}/{totalCount}</Text>
      </View>

      <ScrollView scrollX className={styles.tabs}>
        {CATEGORIES.map(cat => (
          <View
            key={cat}
            className={classnames(styles.tab, activeCategory === cat && styles.tabActive)}
            onClick={() => setActiveCategory(cat)}
          >
            <Text className={styles.tabText}>{cat === 'all' ? '全部' : CATEGORY_NAMES[cat]}</Text>
          </View>
        ))}
      </ScrollView>

      <ScrollView scrollY className={styles.list}>
        {filtered.map(a => {
          const unlocked = unlockedIds.includes(a.id);
          const claimed = claimedIds.includes(a.id);
          const progress = getProgress(a);
          const target = a.condition.target;
          const percent = Math.min(100, Math.floor((progress / target) * 100));
          const rewardText = a.rewards
            .map(r => `${r.type === 'silver' ? '银两' : r.type === 'luckyCharm' ? '福缘符' : '金元宝'}+${r.amount}`)
            .join(' ');

          return (
            <View key={a.id} className={classnames(styles.card, unlocked && styles.cardUnlocked)}>
              <View className={classnames(styles.cardIcon, !unlocked && styles.cardIconLocked)}>
                <Text>{unlocked ? a.icon : '\uD83D\uDD12'}</Text>
              </View>
              <View className={styles.cardInfo}>
                <Text className={styles.cardName}>{a.name}</Text>
                <Text className={styles.cardDesc}>{a.description}</Text>
                {!unlocked && (
                  <View className={styles.progressBar}>
                    <View className={styles.progressFill} style={{ width: `${percent}%` }} />
                    <Text className={styles.progressText}>{Math.min(progress, target)}/{target}</Text>
                  </View>
                )}
                <Text className={styles.cardReward}>奖励：{rewardText}</Text>
              </View>
              <View className={styles.cardAction}>
                {!unlocked ? (
                  <Text className={styles.statusLocked}>未达成</Text>
                ) : claimed ? (
                  <Text className={styles.statusClaimed}>已领取</Text>
                ) : (
                  <View className={styles.claimBtn} onClick={() => handleClaim(a.id)}>
                    <Text className={styles.claimBtnText}>领取</Text>
                  </View>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>

      <View className={styles.backBtn} onClick={() => Taro.navigateBack()}>
        <Text className={styles.backBtnText}>返回</Text>
      </View>
    </View>
  );
};

export default AchievementPage;
