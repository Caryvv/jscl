import React, { useEffect, useState } from 'react';
import { View, Text } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import { useFamilyStore } from '@/stores/familyStore';
import { FamilyMember, APTITUDE_NAMES, LIFE_STAGE_NAMES, PROFESSION_NAMES } from '@/types/member';
import styles from './index.module.scss';

const MemberDetailPage: React.FC = () => {
  const router = useRouter();
  const { init, getMember } = useFamilyStore();
  const [member, setMember] = useState<FamilyMember | null>(null);

  useEffect(() => { init(); }, []);
  useEffect(() => {
    const id = router.params.id;
    if (id) setMember(getMember(id) || null);
  }, [router.params.id, getMember]);

  if (!member) {
    return (
      <View className={styles.page}>
        <View className={styles.avatar}><Text>{'\u2753'}</Text></View>
        <Text className={styles.name}>未找到该成员信息</Text>
        <View className={styles.backBtn} onClick={() => Taro.navigateBack()}><Text className={styles.backBtnText}>返回</Text></View>
      </View>
    );
  }

  return (
    <View className={styles.page}>
      <View className={styles.avatar}><Text>{member.gender === 'male' ? '\uD83D\uDC68' : '\uD83D\uDC69'}</Text></View>
      <Text className={styles.name}>{member.name}</Text>
      <View className={styles.tags}>
        <Text className={`${styles.tag} ${styles.tagLife}`}>{LIFE_STAGE_NAMES[member.lifeStage]}</Text>
        <Text className={`${styles.tag} ${styles.tagAptitude}`}>{APTITUDE_NAMES[member.aptitude]}</Text>
      </View>

      <View className={styles.card}>
        <Text className={styles.cardTitle}>基本信息</Text>
        <View className={styles.row}><Text className={styles.rowLabel}>年龄</Text><Text className={styles.rowValue}>{Math.floor(member.age / 12)}岁{member.age % 12}个月</Text></View>
        <View className={styles.row}><Text className={styles.rowLabel}>性别</Text><Text className={styles.rowValue}>{member.gender === 'male' ? '男' : '女'}</Text></View>
        <View className={styles.row}><Text className={styles.rowLabel}>职业</Text><Text className={styles.rowValue}>{PROFESSION_NAMES[member.profession]}</Text></View>
        <View className={styles.row}><Text className={styles.rowLabel}>职业等级</Text><Text className={styles.rowValue}>Lv.{member.professionLevel}</Text></View>
        <View className={styles.row}><Text className={styles.rowLabel}>资质突破次数</Text><Text className={styles.rowValue}>{member.breakthroughCount}次</Text></View>
      </View>

      <View className={styles.card}>
        <Text className={styles.cardTitle}>收支信息</Text>
        {member.monthlyIncome > 0 && <View className={styles.row}><Text className={styles.rowLabel}>月收入</Text><Text className={`${styles.rowValue} ${styles.rowIncome}`}>+{member.monthlyIncome} 银两</Text></View>}
        {member.monthlyCost > 0 && <View className={styles.row}><Text className={styles.rowLabel}>月支出</Text><Text className={`${styles.rowValue} ${styles.rowCost}`}>-{member.monthlyCost} 银两</Text></View>}
      </View>

      <View className={styles.backBtn} onClick={() => Taro.navigateBack()}><Text className={styles.backBtnText}>返回家族</Text></View>
    </View>
  );
};

export default MemberDetailPage;
