import React, { useEffect, useState, useCallback } from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { useTradingStore } from '@/stores/tradingStore';
import { useFamilyStore } from '@/stores/familyStore';
import { useResourceStore } from '@/stores/resourceStore';
import { TRADE_ROUTES, MAX_DAILY_MISSIONS, RISK_NAMES, RUSH_COST_LUCKY_CHARM } from '@/constants/trading';
import { TradeRoute, TradeMission } from '@/types/trading';
import styles from './index.module.scss';

const TradingPage: React.FC = () => {
  const { missions, dailyMissionCount, init: initTrading, startMission, claimMission, rushMission } = useTradingStore();
  const { members, init: initFamily } = useFamilyStore();
  const { luckyCharm, init: initResource } = useResourceStore();

  const [selectedRouteId, setSelectedRouteId] = useState<string>('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    initFamily();
    initResource();
    initTrading();
  }, []);

  // 每秒刷新一次，用于更新倒计时
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const adults = members.filter(m => m.isAlive && m.lifeStage === 'adult');
  const selectedRoute = TRADE_ROUTES.find(r => r.id === selectedRouteId);

  const toggleMember = useCallback((id: string) => {
    setSelectedMembers(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (selectedRoute && prev.length >= selectedRoute.maxMembers) return prev;
      return [...prev, id];
    });
  }, [selectedRoute]);

  const handleSelectRoute = useCallback((route: TradeRoute) => {
    setSelectedRouteId(route.id);
    setSelectedMembers([]);
  }, []);

  const handleBack = useCallback(() => {
    const pages = Taro.getCurrentPages();
    if (pages.length > 1) {
      Taro.navigateBack();
    } else {
      Taro.switchTab({ url: '/pages/family/index' });
    }
  }, []);

  const handleStart = useCallback(() => {
    if (!selectedRoute) return;
    if (selectedMembers.length < selectedRoute.minMembers) {
      Taro.showToast({ title: `至少派遣 ${selectedRoute.minMembers} 人`, icon: 'none' });
      return;
    }
    const result = startMission(selectedRoute.id, selectedMembers);
    if (result.success) {
      Taro.showToast({ title: result.message, icon: 'success' });
      setSelectedMembers([]);
      setSelectedRouteId('');
    } else {
      Taro.showToast({ title: result.message, icon: 'none' });
    }
  }, [selectedRoute, selectedMembers, startMission]);

  const handleClaim = useCallback((mission: TradeMission) => {
    const result = claimMission(mission.id);
    if (result.success && result.result) {
      const { profit, isLoss } = result.result;
      const title = isLoss ? `亏损 ${Math.abs(profit)} 银两` : `获得 ${profit} 银两`;
      Taro.showModal({ title: '跑商结算', content: title, showCancel: false });
    } else {
      Taro.showToast({ title: result.message, icon: 'none' });
    }
  }, [claimMission]);

  const handleRush = useCallback((mission: TradeMission) => {
    Taro.showModal({
      title: '福缘符加速',
      content: `消耗 ${RUSH_COST_LUCKY_CHARM} 枚福缘符，立即完成本次跑商？`,
      success: (res) => {
        if (!res.confirm) return;
        const result = rushMission(mission.id);
        if (result.success && result.result) {
          const { profit, isLoss } = result.result;
          const title = isLoss ? `亏损 ${Math.abs(profit)} 银两` : `获得 ${profit} 银两`;
          Taro.showModal({ title: '跑商结算', content: title, showCancel: false });
        } else {
          Taro.showToast({ title: result.message, icon: 'none' });
        }
      },
    });
  }, [rushMission]);

  const formatRemain = (endTime: number) => {
    const remain = Math.max(0, Math.ceil((endTime - now) / 1000));
    const m = Math.floor(remain / 60);
    const s = remain % 60;
    return `${m}分${s}秒`;
  };

  const runningMissions = missions.filter(m => m.status === 'running');
  const completedMissions = missions.filter(m => m.status === 'completed').slice(-5).reverse();

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.headerTitle}>{'\uD83D\uDCE6'} 跑商</Text>
        <View className={styles.headerRight}>
          <Text className={styles.headerInfo}>福缘符 {luckyCharm}</Text>
          <Text className={styles.headerInfo}>今日 {dailyMissionCount}/{MAX_DAILY_MISSIONS}</Text>
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>选择商路</Text>
        <View className={styles.routeList}>
          {TRADE_ROUTES.map(route => (
            <View
              key={route.id}
              className={classnames(styles.routeCard, selectedRouteId === route.id && styles.routeActive)}
              onClick={() => handleSelectRoute(route)}
            >
              <View className={styles.routeIcon}><Text>{route.icon}</Text></View>
              <View className={styles.routeInfo}>
                <View className={styles.routeNameRow}>
                  <Text className={styles.routeName}>{route.name}</Text>
                  <Text className={classnames(styles.riskTag, styles[`risk_${route.risk}`])}>{RISK_NAMES[route.risk]}</Text>
                </View>
                <Text className={styles.routeDesc}>{route.description}</Text>
                <View className={styles.routeStats}>
                  <Text className={styles.stat}>基础 {route.baseProfit} 两</Text>
                  <Text className={styles.stat}>耗时 {Math.round(route.timeCost / 60)} 分</Text>
                  <Text className={styles.stat}>{route.minMembers}-{route.maxMembers} 人</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>

      {selectedRoute && (
        <View className={styles.section}>
          <Text className={styles.sectionTitle}>派遣成员（{selectedMembers.length}/{selectedRoute.maxMembers}）</Text>
          {adults.length === 0 ? (
            <Text className={styles.emptyHint}>暂无成年成员可派遣</Text>
          ) : (
            <View className={styles.memberList}>
              {adults.map(m => {
                const active = getActiveMission(m.id);
                const selected = selectedMembers.includes(m.id);
                return (
                  <View
                    key={m.id}
                    className={classnames(styles.memberChip, selected && styles.memberSelected, active && styles.memberDisabled)}
                    onClick={() => !active && toggleMember(m.id)}
                  >
                    <Text className={styles.memberName}>{m.name}</Text>
                    <Text className={styles.memberProf}>{m.profession === 'merchant' ? '商人' : m.profession === 'none' ? '无职业' : m.profession}</Text>
                    {active && <Text className={styles.memberBusy}>跑商中</Text>}
                  </View>
                );
              })}
            </View>
          )}
          <View
            className={classnames(styles.startBtn, selectedMembers.length < selectedRoute.minMembers && styles.startBtnDisabled)}
            onClick={handleStart}
          >
            <Text className={styles.startBtnText}>{'\uD83D\uDE9A'} 出发</Text>
          </View>
        </View>
      )}

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>进行中（{runningMissions.length}）</Text>
        {runningMissions.length === 0 ? (
          <Text className={styles.emptyHint}>暂无进行中的商队</Text>
        ) : (
          runningMissions.map(mission => {
            const route = TRADE_ROUTES.find(r => r.id === mission.routeId);
            const ready = now >= mission.endTime;
            return (
              <View key={mission.id} className={styles.missionCard}>
                <View className={styles.missionInfo}>
                  <Text className={styles.missionName}>{route?.name}</Text>
                  <Text className={styles.missionTime}>{ready ? '已归来，可结算' : `剩余 ${formatRemain(mission.endTime)}`}</Text>
                </View>
                <View className={styles.missionActions}>
                  {!ready && (
                    <View className={styles.rushBtn} onClick={() => handleRush(mission)}>
                      <Text className={styles.rushBtnText}>{'\u26A1'} 加速</Text>
                    </View>
                  )}
                  <View className={classnames(styles.claimBtn, !ready && styles.claimBtnDisabled)} onClick={() => ready && handleClaim(mission)}>
                    <Text className={styles.claimBtnText}>结算</Text>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </View>

      {completedMissions.length > 0 && (
        <View className={styles.section}>
          <Text className={styles.sectionTitle}>最近记录</Text>
          {completedMissions.map(mission => (
            <View key={mission.id} className={styles.historyItem}>
              <Text className={styles.historyName}>{TRADE_ROUTES.find(r => r.id === mission.routeId)?.name}</Text>
              <Text className={classnames(styles.historyProfit, (mission.finalProfit || 0) >= 0 ? styles.profitPos : styles.profitNeg)}>
                {(mission.finalProfit || 0) >= 0 ? '+' : ''}{mission.finalProfit} 两
              </Text>
            </View>
          ))}
        </View>
      )}

      <View className={styles.footerTip}>
        <Text className={styles.footerTipText}>消耗 {RUSH_COST_LUCKY_CHARM} 枚福缘符可立即完成跑商</Text>
      </View>

      <View className={styles.backBtn} onClick={() => Taro.navigateBack()}>
        <Text className={styles.backBtnText}>返回</Text>
      </View>
    </View>
  );

  function getActiveMission(memberId: string) {
    return useTradingStore.getState().getActiveMissionByMember(memberId);
  }
};

export default TradingPage;
