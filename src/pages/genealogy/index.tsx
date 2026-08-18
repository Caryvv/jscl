import React, { useEffect } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useGenealogyStore } from '@/stores/genealogyStore';
import styles from './index.module.scss';

const GenealogyPage: React.FC = () => {
  const { entries, init } = useGenealogyStore();

  useEffect(() => {
    init();
  }, []);

  // 按归档时间倒序（最近去世的在前）
  const sorted = [...entries].sort((a, b) => b.archivedAt - a.archivedAt);

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.headerTitle}>{'\uD83D\uDCDC'} 家族族谱</Text>
        <Text className={styles.headerSub}>先祖 {entries.length} 位，永享香火</Text>
      </View>

      {sorted.length === 0 ? (
        <View className={styles.empty}>
          <Text className={styles.emptyEmoji}>{'\uD83C\uDF3F'}</Text>
          <Text className={styles.emptyText}>族谱尚无记载</Text>
          <Text className={styles.emptyHint}>先祖离世后，其生平将载入族谱，泽被后世</Text>
        </View>
      ) : (
        <ScrollView scrollY className={styles.list}>
          {sorted.map(entry => (
            <View key={entry.memberId} className={styles.card}>
              <View className={styles.cardHead}>
                <Text className={styles.cardIcon}>{entry.gender === 'male' ? '\uD83D\uDC68' : '\uD83D\uDC69'}</Text>
                <View className={styles.cardTitleWrap}>
                  <Text className={styles.cardName}>{entry.name}</Text>
                  <Text className={styles.cardDynasty}>{entry.dynastyName}</Text>
                </View>
                <Text className={styles.cardAge}>享年{entry.deathAge}岁</Text>
              </View>
              <Text className={styles.epitaph}>{entry.epitaph}</Text>
            </View>
          ))}
        </ScrollView>
      )}

      <View className={styles.backBtn} onClick={() => Taro.navigateBack()}>
        <Text className={styles.backBtnText}>返回</Text>
      </View>
    </View>
  );
};

export default GenealogyPage;
