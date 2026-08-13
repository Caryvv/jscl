import React, { useEffect, useState, useCallback } from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import CurrencyBar from '@/components/CurrencyBar';
import MemberCard from '@/components/MemberCard';
import { useFamilyStore } from '@/stores/familyStore';
import { useResourceStore } from '@/stores/resourceStore';
import { FamilyMember } from '@/types/member';
import styles from './index.module.scss';

const FamilyPage: React.FC = () => {
  const { members, gameYear, gameYearMonth, monthlyIncome, initialized, init: initFamily, settle } = useFamilyStore();
  const { silver, luckyCharm, goldBar, init: initResource, setMonthlyIncome } = useResourceStore();
  const [showOffline, setShowOffline] = useState(false);
  const [offlineSilver, setOfflineSilver] = useState(0);

  useEffect(() => {
    initFamily();
    initResource();
  }, []);

  useEffect(() => {
    if (initialized) {
      const interval = setInterval(() => {
        settle();
        setMonthlyIncome(useFamilyStore.getState().monthlyIncome);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [initialized]);

  useEffect(() => {
    setMonthlyIncome(monthlyIncome);
  }, [monthlyIncome]);

  const handleMenuClick = useCallback((action: string) => {
    switch (action) {
      case 'shop':
        Taro.navigateTo({ url: '/pages/shop/index' });
        break;
      case 'addChild':
        Taro.navigateTo({ url: '/pages/add-child/index' });
        break;
      default:
        Taro.showToast({ title: '功能开发中...', icon: 'none' });
    }
  }, []);

  const handleMemberClick = useCallback((member: FamilyMember) => {
    Taro.navigateTo({ url: `/pages/member-detail/index?id=${member.id}` });
  }, []);

  const patriarchMembers = members.filter(m => m.role === 'patriarch' || m.role === 'matriarch');
  const offspringMembers = members.filter(m => m.role === 'offspring' && m.isAlive);
  const deceasedMembers = members.filter(m => !m.isAlive);

  return (
    <View className={styles.page}>
      <View className={styles.topBar}>
        <View className={styles.gameTime}>
          <Text className={styles.gameTimeText}>大周</Text>
          <Text className={styles.gameTimeValue}>第{gameYear}年 第{gameYearMonth}月</Text>
        </View>
        <CurrencyBar silver={silver} luckyCharm={luckyCharm} goldBar={goldBar} monthlyIncome={monthlyIncome} />
      </View>

      <View className={styles.mainLayout}>
        <View className={styles.leftSidebar}>
          <View className={styles.menuBtn} onClick={() => handleMenuClick('shop')}>
            <Text className={styles.menuBtnEmoji}>{'\uD83D\uDED2'}</Text>
            <Text className={styles.menuBtnText}>商店</Text>
          </View>
          <View className={styles.menuBtn} onClick={() => handleMenuClick('addChild')}>
            <Text className={styles.menuBtnEmoji}>{'\uD83D\uDC76'}</Text>
            <Text className={styles.menuBtnText}>添丁</Text>
          </View>
          <View className={styles.menuBtn} onClick={() => handleMenuClick('dynasty')}>
            <Text className={styles.menuBtnEmoji}>{'\uD83C\uDFEF'}</Text>
            <Text className={styles.menuBtnText}>传承</Text>
          </View>
          <View className={styles.menuBtn} onClick={() => handleMenuClick('trade')}>
            <Text className={styles.menuBtnEmoji}>{'\uD83D\uDCE6'}</Text>
            <Text className={styles.menuBtnText}>跑商</Text>
          </View>
        </View>

        <View className={styles.centerArea}>
          {members.length === 0 ? (
            <View className={styles.emptyState}>
              <Text className={styles.emptyEmoji}>{'\uD83C\uDFE0'}</Text>
              <Text className={styles.emptyText}>家族尚未建立...</Text>
            </View>
          ) : (
            <View className={styles.familyTree}>
              {patriarchMembers.length > 0 && (
                <View className={styles.generationRow}>
                  {patriarchMembers.map(m => <MemberCard key={m.id} member={m} onClick={handleMemberClick} />)}
                </View>
              )}
              {offspringMembers.length > 0 && (
                <>
                  <View className={styles.connectorLine}><View className={styles.line} /></View>
                  <View className={styles.generationRow}>
                    {offspringMembers.map(m => <MemberCard key={m.id} member={m} compact onClick={handleMemberClick} />)}
                  </View>
                </>
              )}
              {deceasedMembers.length > 0 && (
                <>
                  <View className={styles.connectorLine}><View className={styles.line} /></View>
                  <View className={styles.generationRow}>
                    {deceasedMembers.map(m => <MemberCard key={m.id} member={m} compact />)}
                  </View>
                </>
              )}
            </View>
          )}
        </View>

        <View className={styles.rightSidebar}>
          <View className={styles.menuBtn} onClick={() => Taro.showToast({ title: '功能开发中...', icon: 'none' })}>
            <Text className={styles.menuBtnEmoji}>{'\uD83C\uDF81'}</Text>
            <Text className={styles.menuBtnText}>福利</Text>
          </View>
          <View className={styles.menuBtn} onClick={() => Taro.showToast({ title: '功能开发中...', icon: 'none' })}>
            <Text className={styles.menuBtnEmoji}>{'\uD83D\uDC37'}</Text>
            <Text className={styles.menuBtnText}>金猪</Text>
          </View>
          <View className={styles.menuBtn} onClick={() => Taro.showToast({ title: '功能开发中...', icon: 'none' })}>
            <Text className={styles.menuBtnEmoji}>{'\uD83D\uDC8E'}</Text>
            <Text className={styles.menuBtnText}>藏品</Text>
          </View>
          <View className={styles.menuBtn} onClick={() => Taro.showToast({ title: '功能开发中...', icon: 'none' })}>
            <Text className={styles.menuBtnEmoji}>{'\uD83D\uDC65'}</Text>
            <Text className={styles.menuBtnText}>邀请</Text>
          </View>
        </View>
      </View>

      <View className={styles.bottomBanner}>
        <Text className={styles.bannerText}>家世昌隆 — 经营百年名门望族</Text>
      </View>

      {showOffline && (
        <View className={styles.offlineOverlay}>
          <View className={styles.offlineModal}>
            <Text className={styles.offlineEmoji}>{'\uD83D\uDCB0'}</Text>
            <Text className={styles.offlineTitle}>离线收益结算</Text>
            <Text className={styles.offlineReward}>+{offlineSilver} 银两</Text>
            <View className={styles.offlineBtn} onClick={() => { useResourceStore.getState().addSilver(offlineSilver); setShowOffline(false); }}>
              <Text className={styles.offlineBtnText}>领取收益</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default FamilyPage;
