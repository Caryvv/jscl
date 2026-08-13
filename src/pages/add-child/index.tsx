import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, Input } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { useFamilyStore } from '@/stores/familyStore';
import { useResourceStore } from '@/stores/resourceStore';
import { ADD_CHILD_COST } from '@/constants/member';
import styles from './index.module.scss';

const AddChildPage: React.FC = () => {
  const { addChildCooldown, addChild, getAliveAdultCouple, init: initFamily } = useFamilyStore();
  const { silver, init: initResource } = useResourceStore();
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [cooldownStr, setCooldownStr] = useState('');

  useEffect(() => { initFamily(); initResource(); }, []);

  useEffect(() => {
    if (addChildCooldown > 0) {
      const m = Math.floor(addChildCooldown / 60);
      const s = addChildCooldown % 60;
      setCooldownStr(`${m}分${s}秒`);
    } else { setCooldownStr(''); }
  }, [addChildCooldown]);

  const couple = getAliveAdultCouple();
  const canSubmit = name.trim().length > 0 && addChildCooldown <= 0 && silver >= ADD_CHILD_COST && !!couple;

  const handleSubmit = useCallback(() => {
    if (!canSubmit) return;
    const result = addChild(name.trim(), gender);
    if (result.success) {
      Taro.showToast({ title: `喜得${gender === 'male' ? '贵子' : '千金'}：${result.child?.name}！`, icon: 'success', duration: 2000 });
      setTimeout(() => Taro.navigateBack(), 1500);
    } else {
      Taro.showToast({ title: result.message, icon: 'none' });
    }
  }, [name, gender, canSubmit, addChild]);

  return (
    <View className={styles.page}>
      <Text className={styles.heroEmoji}>{'\uD83D\uDC76'}</Text>
      <Text className={styles.title}>添丁有喜</Text>
      <Text className={styles.desc}>为家族增添新成员，延续百年香火</Text>

      <View className={styles.formCard}>
        {couple ? (
          <View className={styles.parentsRow}>
            <Text className={styles.parent}>{'\uD83D\uDC68'} {couple.father.name}</Text>
            <Text className={styles.heartEmoji}>{'\u2764\uFE0F'}</Text>
            <Text className={styles.parent}>{'\uD83D\uDC69'} {couple.mother.name}</Text>
          </View>
        ) : (
          <View className={styles.field}>
            <Text className={styles.label} style={{ color: '#C4563A' }}>家族中暂无符合条件的成年夫妇</Text>
          </View>
        )}
        <View className={styles.divider} />

        <View className={styles.field}>
          <Text className={styles.label}>为孩儿取名</Text>
          <Input className={styles.input} type="text" placeholder="请输入姓名（2-4字）" maxlength={4} value={name} onInput={e => setName(e.detail.value)} />
        </View>

        <View className={styles.field}>
          <Text className={styles.label}>期待孩儿性别</Text>
          <View className={styles.genderSelector}>
            <View className={classnames(styles.genderBtn, gender === 'male' && styles.genderActive)} onClick={() => setGender('male')}>
              <Text className={styles.genderBtnEmoji}>{'\uD83D\uDC66'}</Text><Text>男</Text>
            </View>
            <View className={classnames(styles.genderBtn, gender === 'female' && styles.genderActive)} onClick={() => setGender('female')}>
              <Text className={styles.genderBtnEmoji}>{'\uD83D\uDC67'}</Text><Text>女</Text>
            </View>
          </View>
        </View>

        <View className={styles.divider} />
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>添丁消耗</Text>
          <Text className={styles.infoValue}>{ADD_CHILD_COST} 银两</Text>
        </View>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>当前银两</Text>
          <Text className={styles.infoValue} style={{ color: silver >= ADD_CHILD_COST ? '#6B8E5A' : '#C4563A' }}>{silver}</Text>
        </View>
        {addChildCooldown > 0 && (
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>冷却时间</Text>
            <Text className={styles.infoValue} style={{ color: '#C4563A' }}>{cooldownStr}</Text>
          </View>
        )}

        <View className={classnames(styles.submitBtn, !canSubmit && styles.submitBtnDisabled)} onClick={handleSubmit}>
          <Text className={styles.submitBtnText}>
            {!couple ? '无符合条件的夫妇' : addChildCooldown > 0 ? `冷却中 ${cooldownStr}` : silver < ADD_CHILD_COST ? '银两不足' : '\uD83C\uDF89 添丁'}
          </Text>
        </View>
      </View>
    </View>
  );
};

export default AddChildPage;
