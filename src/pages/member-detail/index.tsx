import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, Input } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import classnames from 'classnames';
import { useFamilyStore } from '@/stores/familyStore';
import { useResourceStore } from '@/stores/resourceStore';
import { platform } from '@/utils/platform';
import { APTITUDE_NAMES, LIFE_STAGE_NAMES, Profession } from '@/types/member';
import { SELECTABLE_PROFESSIONS, PROFESSION_CONFIG, getUpgradeCost } from '@/constants/profession';
import styles from './index.module.scss';

const MemberDetailPage: React.FC = () => {
  const router = useRouter();
  const { init, members, changeProfession, upgradeProfession, renameMember } = useFamilyStore();
  const { silver, init: initResource } = useResourceStore();
  const [showProfessionPanel, setShowProfessionPanel] = useState(false);
  const [showRename, setShowRename] = useState(false);
  const [renameInput, setRenameInput] = useState('');

  useEffect(() => { init(); initResource(); }, []);

  const memberId = router.params.id;
  const member = members.find(m => m.id === memberId) || null;

  const canChangeProfession = member?.lifeStage === 'adult';

  const handleChangeProfession = useCallback((prof: Profession) => {
    if (!member) return;
    if (prof === member.profession) {
      Taro.showToast({ title: '已是该职业', icon: 'none' });
      return;
    }
    const cost = PROFESSION_CONFIG[prof as Exclude<Profession, 'none'>].upgradeCost(1);
    Taro.showModal({
      title: '确认转职',
      content: `消耗 ${cost} 银两，转为「${PROFESSION_CONFIG[prof as Exclude<Profession, 'none'>].name}」？（等级将重置为1）`,
      success: (res) => {
        if (!res.confirm) return;
        const result = changeProfession(member.id, prof);
        Taro.showToast({ title: result.message, icon: result.success ? 'success' : 'none' });
        if (result.success) setShowProfessionPanel(false);
      },
    });
  }, [member, changeProfession]);

  const handleUpgradeProfession = useCallback(() => {
    if (!member || member.profession === 'none') return;
    const config = PROFESSION_CONFIG[member.profession as Exclude<Profession, 'none'>];
    if (member.professionLevel >= config.maxLevel) {
      Taro.showToast({ title: '已达最高等级', icon: 'none' });
      return;
    }
    const cost = getUpgradeCost(member.profession, member.professionLevel);
    Taro.showModal({
      title: '确认升级',
      content: `消耗 ${cost} 银两，${config.name} Lv.${member.professionLevel} → Lv.${member.professionLevel + 1}？`,
      success: (res) => {
        if (!res.confirm) return;
        const result = upgradeProfession(member.id);
        Taro.showToast({ title: result.message, icon: result.success ? 'success' : 'none' });
      },
    });
  }, [member, upgradeProfession]);

  const handleRename = useCallback(async () => {
    if (!member) return;
    const trimmed = renameInput.trim();
    if (!trimmed) {
      Taro.showToast({ title: '请输入名字', icon: 'none' });
      return;
    }
    const pass = await platform.checkContent(trimmed);
    if (!pass) {
      Taro.showToast({ title: '名字含违规内容，请重新输入', icon: 'none' });
      return;
    }
    const result = renameMember(member.id, trimmed);
    Taro.showToast({ title: result.message, icon: result.success ? 'success' : 'none' });
    if (result.success) setShowRename(false);
  }, [member, renameInput, renameMember]);

  if (!member) {
    return (
      <View className={styles.page}>
        <View className={styles.avatar}><Text>{'\u2753'}</Text></View>
        <Text className={styles.name}>未找到该成员信息</Text>
        <View className={styles.backBtn} onClick={() => Taro.navigateBack()}><Text className={styles.backBtnText}>返回</Text></View>
      </View>
    );
  }

  const professionConfig = member.profession !== 'none' ? PROFESSION_CONFIG[member.profession] : null;
  const upgradeCost = professionConfig && member.professionLevel < professionConfig.maxLevel
    ? getUpgradeCost(member.profession, member.professionLevel)
    : 0;
  const isMaxLevel = professionConfig && member.professionLevel >= professionConfig.maxLevel;

  return (
    <View className={styles.page}>
      <View className={styles.avatar}><Text>{getMemberAvatar(member)}</Text></View>
      <View className={styles.nameRow}>
        <Text className={styles.name}>{member.name}</Text>
        {member.isAlive && member.generation > 0 && (
          <Text className={styles.renameEntry} onClick={() => { setRenameInput(member.givenName); setShowRename(true); }}>改名</Text>
        )}
      </View>
      {showRename && (
        <View className={styles.renameRow}>
          <Text className={styles.renamePrefix}>{member.surname}{member.name.length > member.surname.length + member.givenName.length ? member.name.charAt(member.surname.length) : ''}</Text>
          <Input className={styles.renameInput} type="text" placeholder="输入名" maxlength={2} value={renameInput} onInput={e => setRenameInput(e.detail.value)} />
          <Text className={styles.renameConfirm} onClick={handleRename}>确定</Text>
        </View>
      )}
      <View className={styles.tags}>
        <Text className={`${styles.tag} ${styles.tagLife}`}>{LIFE_STAGE_NAMES[member.lifeStage]}</Text>
        <Text className={`${styles.tag} ${styles.tagAptitude}`}>{APTITUDE_NAMES[member.aptitude]}</Text>
        {professionConfig && (
          <Text className={`${styles.tag} ${styles.tagProfession}`}>{professionConfig.icon} {professionConfig.name}</Text>
        )}
      </View>

      <View className={styles.card}>
        <Text className={styles.cardTitle}>基本信息</Text>
        <View className={styles.row}><Text className={styles.rowLabel}>年龄</Text><Text className={styles.rowValue}>{Math.floor(member.age / 12)}岁{member.age % 12}个月</Text></View>
        <View className={styles.row}><Text className={styles.rowLabel}>性别</Text><Text className={styles.rowValue}>{member.gender === 'male' ? '男' : '女'}</Text></View>
        <View className={styles.row}><Text className={styles.rowLabel}>资质突破次数</Text><Text className={styles.rowValue}>{member.breakthroughCount}次</Text></View>
      </View>

      <View className={styles.card}>
        <View className={styles.cardHeader}>
          <Text className={styles.cardTitle}>职业信息</Text>
          {canChangeProfession && (
            <Text className={styles.changeBtn} onClick={() => setShowProfessionPanel(!showProfessionPanel)}>
              {member.profession === 'none' ? '选择职业' : '转职'}
            </Text>
          )}
        </View>

        {member.profession === 'none' ? (
          <View className={styles.row}><Text className={styles.rowLabel}>当前状态</Text><Text className={styles.rowValue}>无职业</Text></View>
        ) : (
          <>
            <View className={styles.row}><Text className={styles.rowLabel}>职业</Text><Text className={styles.rowValue}>{professionConfig!.icon} {professionConfig!.name}</Text></View>
            <View className={styles.row}><Text className={styles.rowLabel}>等级</Text><Text className={styles.rowValue}>Lv.{member.professionLevel} / {professionConfig!.maxLevel}</Text></View>
            <View className={styles.row}><Text className={styles.rowLabel}>特殊效果</Text><Text className={styles.rowValue}>{professionConfig!.specialEffect.description}</Text></View>

            {canChangeProfession && (
              <View
                className={classnames(styles.upgradeBtn, (isMaxLevel || silver < upgradeCost) && styles.upgradeBtnDisabled)}
                onClick={() => !isMaxLevel && silver >= upgradeCost && handleUpgradeProfession()}
              >
                <Text className={styles.upgradeBtnText}>
                  {isMaxLevel ? '已达满级' : `升级 ( ${upgradeCost} 银两 )`}
                </Text>
              </View>
            )}
          </>
        )}
      </View>

      {showProfessionPanel && canChangeProfession && (
        <View className={styles.professionPanel}>
          <Text className={styles.panelTitle}>选择职业</Text>
          {SELECTABLE_PROFESSIONS.map(prof => {
            const cost = prof.upgradeCost(1);
            const isCurrent = member.profession === prof.id;
            return (
              <View
                key={prof.id}
                className={classnames(styles.profCard, isCurrent && styles.profCardCurrent)}
                onClick={() => !isCurrent && handleChangeProfession(prof.id)}
              >
                <View className={styles.profIcon}><Text>{prof.icon}</Text></View>
                <View className={styles.profInfo}>
                  <View className={styles.profNameRow}>
                    <Text className={styles.profName}>{prof.name}</Text>
                    {isCurrent && <Text className={styles.profCurrent}>当前</Text>}
                  </View>
                  <Text className={styles.profDesc}>{prof.description}</Text>
                  <Text className={styles.profEffect}>{prof.specialEffect.description}</Text>
                  <Text className={styles.profCost}>转职费用：{cost} 银两</Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

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
