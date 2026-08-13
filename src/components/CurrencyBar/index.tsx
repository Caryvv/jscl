import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';

interface CurrencyBarProps {
  silver: number;
  luckyCharm: number;
  goldBar: number;
  monthlyIncome: number;
}

const CurrencyBar: React.FC<CurrencyBarProps> = ({ silver, luckyCharm, goldBar, monthlyIncome }) => {
  return (
    <View className={styles.container}>
      <View className={styles.item}>
        <Text className={styles.label}>银两</Text>
        <Text className={styles.value}>{silver >= 10000 ? `${(silver / 10000).toFixed(1)}万` : silver}</Text>
        <Text className={styles.income}>+{monthlyIncome}/月</Text>
      </View>
      <View className={styles.item}>
        <Text className={styles.label}>福缘符</Text>
        <Text className={styles.value}>{luckyCharm}</Text>
      </View>
      <View className={styles.item}>
        <Text className={styles.label}>金条</Text>
        <Text className={styles.value}>{goldBar}</Text>
      </View>
    </View>
  );
};

export default CurrencyBar;
