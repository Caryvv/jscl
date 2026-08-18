import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { useDynastyStore } from '@/stores/dynastyStore';
import { useFamilyStore } from '@/stores/familyStore';
import { getDynastyConfig, getNextDynastyConfig } from '@/constants/dynasty';
import { getAdultHeirs } from '@/services/dynastyService';
import { APTITUDE_NAMES, PROFESSION_NAMES } from '@/types/member';
import styles from './index.module.scss';

const DynastyPage: React.FC = () => {
  const { info, history, init, getConditions, canInherit, inherit } = useDynastyStore();
  const { members, init: initFamily } = useFamilyStore();
  const [selectedHeirId, setSelectedHeirId] = useState<string | null>(null);

  useEffect(() => {
    initFamily();
    init();
  }, []);

  const config = getDynastyConfig(info.id);
  const nextConfig = getNextDynastyConfig(info.id);
  const conditions = getConditions();
  const inheritable = canInherit();
  const heirs = getAdultHeirs(members);

  const handleInherit = useCallback(() => {
    if (!selectedHeirId) {
      Taro.showToast({ title: '请先选择继承人', icon: 'none' });
      return;
    }
    Taro.showModal({
      title: '确认传承',
      content: '确定将家主之位传给选定的继承人？此举将延续家族香火。',
      success: (res) => {
        if (!res.confirm) return;
        const result = inherit(selectedHeirId);
        if (result.success) {
          Taro.showModal({
            title: result.dynastyChanged ? '朝代更迭' : '传承成功',
            content: result.message,
            showCancel: false,
          });
          setSelectedHeirId(null);
        } else {
          Taro.showToast({ title: result.message, icon: 'none' });
        }
      },
    });
  }, [selectedHeirId, inherit]);

  return (
    <View className={styles.page} style={{ background: config.backgroundTheme }}>
      {/* 朝代信息 */}
      <View className={styles.dynastyCard}>
        <Text className={styles.dynastyName}>{'\uD83C\uDFEF'} {config.name}</Text>
        <Text className={styles.dynastyDesc}>{config.description}</Text>
        <View className={styles.dynastyStats}>
          <View className={styles.statItem}>
            <Text className={styles.statLabel}>第几代</Text>
            <Text className={styles.statValue}>{info.generationCount}</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statLabel}>家族声望</Text>
            <Text className={styles.statValue}>{info.prestige}</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statLabel}>收益加成</Text>
            <Text className={styles.statValue}>+{Math.round(config.incomeBonus * 100)}%</Text>
          </View>
        </View>
        {nextConfig && (
          <Text className={styles.nextHint}>
            下一朝代【{nextConfig.name}】需声望 {nextConfig.prestigeRequirement}
          </Text>
        )}
      </View>

      {/* 传承条件 */}
      <View className={styles.section}>
        <Text className={styles.sectionTitle}>传承条件</Text>
        {conditions.map((c, idx) => (
          <View key={idx} className={styles.conditionRow}>
            <Text className={classnames(styles.conditionDot, c.satisfied ? styles.dotOk : styles.dotNo)}>
              {c.satisfied ? '\u2714' : '\u2716'}
            </Text>
            <Text className={styles.conditionText}>{c.description}</Text>
            <Text className={styles.conditionProgress}>
              {Math.min(c.current, c.required)}/{c.required}
            </Text>
          </View>
        ))}
      </View>

      {/* 继承人选择 */}
      <View className={styles.section}>
        <Text className={styles.sectionTitle}>选择继承人</Text>
        {heirs.length === 0 ? (
          <Text className={styles.emptyHint}>暂无成年子嗣可继承，请培养后代</Text>
        ) : (
          <ScrollView scrollX className={styles.heirScroll}>
            {heirs.map(h => (
              <View
                key={h.id}
                className={classnames(styles.heirCard, selectedHeirId === h.id && styles.heirCardActive)}
                onClick={() => setSelectedHeirId(h.id)}
              >
                <Text className={styles.heirName}>{h.name}</Text>
                <Text className={styles.heirInfo}>{Math.floor(h.age)}岁 · {APTITUDE_NAMES[h.aptitude]}</Text>
                <Text className={styles.heirInfo}>{PROFESSION_NAMES[h.profession]}</Text>
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      <View
        className={classnames(styles.inheritBtn, !inheritable && styles.inheritBtnDisabled)}
        onClick={inheritable ? handleInherit : undefined}
      >
        <Text className={styles.inheritBtnText}>
          {inheritable ? '举行传承大典' : '尚未满足传承条件'}
        </Text>
      </View>

      {/* 传承史 */}
      {history.length > 0 && (
        <View className={styles.section}>
          <Text className={styles.sectionTitle}>传承史</Text>
          {history.slice().reverse().map(r => (
            <View key={r.id} className={styles.historyRow}>
              <Text className={styles.historyDynasty}>{r.dynastyName} · 第{r.generationIndex}代</Text>
              <Text className={styles.historyText}>{r.oldPatriarchName} → {r.newPatriarchName}</Text>
            </View>
          ))}
        </View>
      )}

      <View className={styles.backBtn} onClick={() => Taro.navigateBack()}>
        <Text className={styles.backBtnText}>返回</Text>
      </View>
    </View>
  );
};

export default DynastyPage;
