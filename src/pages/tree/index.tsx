import React, { useEffect, useState } from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { getStorage, setStorage } from '@/utils/storage';
import styles from './index.module.scss';

interface TreeState {
  exp: number;
  level: number;
  lastWaterTime: number;
}

const EXP_PER_LEVEL = [0, 100, 250, 500, 1000, 2000, 4000, 8000, 15000, 30000];
const WATER_EXP = 100;
const WATER_COOLDOWN = 3600 * 8;

const TreePage: React.FC = () => {
  const [tree, setTree] = useState<TreeState>({ exp: 0, level: 1, lastWaterTime: 0 });
  const [canWater, setCanWater] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState('');

  useEffect(() => {
    const saved = getStorage<TreeState>('treeState', { exp: 0, level: 1, lastWaterTime: 0 });
    setTree(saved);
    updateWaterStatus(saved.lastWaterTime);
  }, []);

  const updateWaterStatus = (lastTime: number) => {
    const elapsed = (Date.now() - lastTime) / 1000;
    if (elapsed >= WATER_COOLDOWN) {
      setCanWater(true);
      setTimeRemaining('');
    } else {
      setCanWater(false);
      const remain = WATER_COOLDOWN - elapsed;
      const h = Math.floor(remain / 3600);
      const m = Math.floor((remain % 3600) / 60);
      setTimeRemaining(`${h}时${m}分后可浇水`);
    }
  };

  useEffect(() => {
    if (!canWater) {
      const timer = setInterval(() => updateWaterStatus(tree.lastWaterTime), 10000);
      return () => clearInterval(timer);
    }
  }, [tree.lastWaterTime, canWater]);

  const handleWater = () => {
    if (!canWater) { Taro.showToast({ title: timeRemaining, icon: 'none' }); return; }
    const newExp = tree.exp + WATER_EXP;
    let newLevel = tree.level;
    while (newLevel < EXP_PER_LEVEL.length - 1 && newExp >= EXP_PER_LEVEL[newLevel]) { newLevel++; }
    const newTree = { exp: newExp, level: newLevel, lastWaterTime: Date.now() };
    setTree(newTree);
    setStorage('treeState', newTree);
    setCanWater(false);
    updateWaterStatus(Date.now());
    Taro.showToast({ title: '浇水成功！+100经验', icon: 'success' });
  };

  const currentLevel = tree.level;
  const nextLevelExp = EXP_PER_LEVEL[Math.min(currentLevel, EXP_PER_LEVEL.length - 1)];
  const prevLevelExp = EXP_PER_LEVEL[currentLevel - 1] || 0;
  const progress = Math.min(100, ((tree.exp - prevLevelExp) / (nextLevelExp - prevLevelExp)) * 100);
  const bonusPercent = (currentLevel - 1) * 5;

  return (
    <View className={styles.page}>
      <View className={styles.treeContainer}>
        <Text className={styles.treeEmoji}>{currentLevel >= 8 ? '\uD83C\uDF33' : currentLevel >= 5 ? '\uD83C\uDF8B' : currentLevel >= 3 ? '\uD83E\uDEB4' : '\uD83C\uDF31'}</Text>
        <Text className={styles.treeLevel}>Lv.{currentLevel} 神树</Text>
        <View className={styles.progressBarWrap}>
          <View className={styles.progressBar} style={{ width: `${progress}%` }} />
        </View>
        <Text className={styles.progressText}>{tree.exp}/{nextLevelExp} EXP</Text>
        <View className={classnames(styles.waterBtn, !canWater && styles.waterBtnDisabled)} onClick={handleWater}>
          <Text className={styles.waterBtnText}>{canWater ? '\uD83D\uDCA7 浇水' : timeRemaining}</Text>
        </View>
      </View>

      <View className={styles.bonusCard}>
        <Text className={styles.bonusTitle}>神树加成</Text>
        <View className={styles.bonusRow}>
          <Text className={styles.bonusLabel}>全家族银两收益加成</Text>
          <Text className={styles.bonusValue}>+{bonusPercent}%</Text>
        </View>
        <View className={styles.bonusRow}>
          <Text className={styles.bonusLabel}>离线收益上限加成</Text>
          <Text className={styles.bonusValue}>+{currentLevel}小时</Text>
        </View>
      </View>

      <Text className={styles.emptyHint}>每天坚持浇水，神树将回馈家族更多福泽 \uD83D\uDE4F</Text>
    </View>
  );
};

export default TreePage;
