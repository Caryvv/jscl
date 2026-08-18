import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, Input } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { platform } from '@/utils/platform';
import CurrencyBar from '@/components/CurrencyBar';
import MemberCard from '@/components/MemberCard';
import EventPopup from '@/components/EventPopup';
import { useFamilyStore } from '@/stores/familyStore';
import { useResourceStore } from '@/stores/resourceStore';
import { useEventStore } from '@/stores/eventStore';
import { useSyncStore } from '@/stores/syncStore';
import { FamilyMember } from '@/types/member';
import styles from './index.module.scss';

const FamilyPage: React.FC = () => {
  const { members, gameYear, gameYearMonth, monthlyIncome, initialized, founded, pendingOfflineSilver, init: initFamily, foundFamily, settle, claimOfflineReward } = useFamilyStore();
  const { silver, luckyCharm, goldBar, init: initResource, setMonthlyIncome } = useResourceStore();
  const { pendingEvents, init: initEvents, resolveImmediate, resolveChoice, getPendingEventDetail } = useEventStore();
  const { pullFromCloud, pushToCloud } = useSyncStore();
  const [showOffline, setShowOffline] = useState(false);
  const [offlineSilver, setOfflineSilver] = useState(0);
  const [surnameInput, setSurnameInput] = useState('');
  const [givenNameInput, setGivenNameInput] = useState('');
  // 建族流程：先选性别（gender），再取名（name）
  const [foundStep, setFoundStep] = useState<'gender' | 'name'>('gender');
  const [founderGender, setFounderGender] = useState<'male' | 'female'>('male');

  useEffect(() => {
    // 上线时先从云端拉取最新存档，再初始化各 store（处理多端同步）
    const bootstrap = async () => {
      await pullFromCloud();
      initFamily();
      initResource();
      initEvents();
    };
    bootstrap();
  }, []);

  const handleFoundFamily = useCallback(async () => {
    const trimmedSurname = surnameInput.trim();
    if (!trimmedSurname) {
      Taro.showToast({ title: '请输入姓氏', icon: 'none' });
      return;
    }
    if (trimmedSurname.length > 2) {
      Taro.showToast({ title: '姓氏最多 2 个字', icon: 'none' });
      return;
    }
    const trimmedName = givenNameInput.trim();
    if (trimmedName.length > 4) {
      Taro.showToast({ title: '名字最多 4 个字', icon: 'none' });
      return;
    }
    const pass = await platform.checkContent(`${trimmedSurname}${trimmedName}`);
    if (!pass) {
      Taro.showToast({ title: '含违规内容，请重新输入', icon: 'none' });
      return;
    }
    foundFamily(trimmedSurname, founderGender, trimmedName);
  }, [surnameInput, givenNameInput, founderGender, foundFamily]);

  useEffect(() => {
    if (initialized && founded) {
      if (pendingOfflineSilver > 0) {
        setOfflineSilver(pendingOfflineSilver);
        setShowOffline(true);
      }
      const interval = setInterval(() => {
        settle();
        setMonthlyIncome(useFamilyStore.getState().monthlyIncome);
      }, 5000);
      // 每 60 秒异步同步一次本地存档到云端（本地优先，同步失败不影响游戏）
      const syncInterval = setInterval(() => {
        pushToCloud();
      }, 60000);
      return () => {
        clearInterval(interval);
        clearInterval(syncInterval);
      };
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
      case 'trade':
        Taro.navigateTo({ url: '/pages/trading/index' });
        break;
      case 'achievement':
        Taro.navigateTo({ url: '/pages/achievement/index' });
        break;
      case 'collection':
        Taro.navigateTo({ url: '/pages/collection/index' });
        break;
      case 'dynasty':
        Taro.navigateTo({ url: '/pages/dynasty/index' });
        break;
      case 'genealogy':
        Taro.navigateTo({ url: '/pages/genealogy/index' });
        break;
      case 'welfare':
        Taro.navigateTo({ url: '/pages/welfare/index' });
        break;
      case 'recharge':
        Taro.navigateTo({ url: '/pages/recharge/index' });
        break;
      default:
        Taro.showToast({ title: '功能开发中...', icon: 'none' });
    }
  }, []);

  const handleMemberClick = useCallback((member: FamilyMember) => {
    Taro.navigateTo({ url: `/pages/member-detail/index?id=${member.id}` });
  }, []);

  // 当前展示的事件（取队列第一个）
  const currentPending = pendingEvents[0];
  const currentEventDetail = currentPending ? getPendingEventDetail(currentPending.uid) : null;

  const handleEventResolve = useCallback((choiceIndex?: number) => {
    if (!currentPending) return;
    const msg = choiceIndex !== undefined
      ? resolveChoice(currentPending.uid, choiceIndex)
      : resolveImmediate(currentPending.uid);
    Taro.showToast({ title: msg, icon: 'none' });
  }, [currentPending, resolveImmediate, resolveChoice]);

  const patriarchMembers = members.filter(m => m.role === 'patriarch' || m.role === 'matriarch');
  const offspringMembers = members.filter(m => m.role === 'offspring' && m.isAlive);
  const deceasedMembers = members.filter(m => !m.isAlive);

  // 尚未建族：先选性别，再取名字（起始仅创始人一人，随游戏进度婚配生子）
  if (initialized && !founded) {
    return (
      <View className={styles.foundOverlay}>
        <View className={styles.foundModal}>
          <Text className={styles.foundEmoji}>{'\uD83C\uDFEF'}</Text>
          <Text className={styles.foundTitle}>开宗立族</Text>
          {foundStep === 'gender' ? (
            <>
              <Text className={styles.foundDesc}>请选择创始人的性别，你将以此人开创家业，随时光流转婚配、开枝散叶。</Text>
              <View className={styles.genderRow}>
                <View
                  className={classnames(styles.genderCard, founderGender === 'male' && styles.genderCardActive)}
                  onClick={() => setFounderGender('male')}
                >
                  <Text className={styles.genderEmoji}>{'\uD83D\uDC68'}</Text>
                  <Text className={styles.genderText}>男</Text>
                </View>
                <View
                  className={classnames(styles.genderCard, founderGender === 'female' && styles.genderCardActive)}
                  onClick={() => setFounderGender('female')}
                >
                  <Text className={styles.genderEmoji}>{'\uD83D\uDC69'}</Text>
                  <Text className={styles.genderText}>女</Text>
                </View>
              </View>
              <View className={styles.foundBtn} onClick={() => setFoundStep('name')}>
                <Text className={styles.foundBtnText}>下一步</Text>
              </View>
            </>
          ) : (
            <>
              <Text className={styles.foundDesc}>请为创始人取姓与名，子孙后代皆随此姓，辈分由系统依次赐字。</Text>
              <Input
                className={styles.foundInput}
                type="text"
                placeholder="请输入姓氏（1-2字）"
                maxlength={2}
                value={surnameInput}
                onInput={e => setSurnameInput(e.detail.value)}
              />
              <Input
                className={styles.foundInput}
                type="text"
                placeholder="请输入名字（选填，最多4字）"
                maxlength={4}
                value={givenNameInput}
                onInput={e => setGivenNameInput(e.detail.value)}
              />
              <View className={styles.foundBtnRow}>
                <View className={classnames(styles.foundBtn, styles.foundBtnGhost)} onClick={() => setFoundStep('gender')}>
                  <Text className={styles.foundBtnText}>上一步</Text>
                </View>
                <View className={styles.foundBtn} onClick={handleFoundFamily}>
                  <Text className={styles.foundBtnText}>立族</Text>
                </View>
              </View>
            </>
          )}
        </View>
      </View>
    );
  }

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
          <View className={styles.menuBtn} onClick={() => handleMenuClick('achievement')}>
            <Text className={styles.menuBtnEmoji}>{'\uD83C\uDFC6'}</Text>
            <Text className={styles.menuBtnText}>成就</Text>
          </View>
          <View className={styles.menuBtn} onClick={() => handleMenuClick('genealogy')}>
            <Text className={styles.menuBtnEmoji}>{'\uD83D\uDCDC'}</Text>
            <Text className={styles.menuBtnText}>族谱</Text>
          </View>
          <View className={styles.menuBtn} onClick={() => Taro.showToast({ title: '功能开发中...', icon: 'none' })}>
            <Text className={styles.menuBtnEmoji}>{'\uD83D\uDC8E'}</Text>
            <Text className={styles.menuBtnText}>藏品</Text>
          </View>
          <View className={styles.menuBtn} onClick={() => handleMenuClick('welfare')}>
            <Text className={styles.menuBtnEmoji}>{'\uD83C\uDF81'}</Text>
            <Text className={styles.menuBtnText}>福利</Text>
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
            <View className={styles.offlineBtn} onClick={() => { claimOfflineReward(); setShowOffline(false); }}>
              <Text className={styles.offlineBtnText}>领取收益</Text>
            </View>
          </View>
        </View>
      )}

      {currentEventDetail && currentEventDetail.event && (
        <EventPopup event={currentEventDetail.event} onResolve={handleEventResolve} />
      )}
    </View>
  );
};

export default FamilyPage;
