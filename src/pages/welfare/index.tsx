import React, { useEffect, useCallback } from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { useWelfareStore } from '@/stores/welfareStore';
import { useResourceStore } from '@/stores/resourceStore';
import { SIGN_IN_REWARDS, PIG_DEPOSIT_AMOUNT, PIG_MAX_DAYS } from '@/constants/welfare';
import { getSignInDayIndex, getPigInterestRate } from '@/services/welfareService';
import styles from './index.module.scss';

const WelfarePage: React.FC = () => {
  const { signIn, pig, init, doСheckIn, signedToday, deposit, depositedToday, withdraw } = useWelfareStore();
  const { silver, luckyCharm, init: initResource } = useResourceStore();

  useEffect(() => {
    initResource();
    init();
  }, []);

  const alreadySigned = signedToday();
  const alreadyDeposited = depositedToday();
  const todayDayIndex = getSignInDayIndex(alreadySigned ? signIn.consecutiveDays : signIn.consecutiveDays + 1);
  const pigRate = getPigInterestRate(pig.depositDays);
  const canWithdraw = pig.depositDays >= PIG_MAX_DAYS;
  const pigTotal = Math.floor(pig.depositedAmount * (1 + pigRate));

  const handleSignIn = useCallback(() => {
    const result = doСheckIn();
    Taro.showToast({ title: result.message, icon: result.success ? 'success' : 'none' });
  }, [doСheckIn]);

  const handleDeposit = useCallback(() => {
    const result = deposit();
    Taro.showToast({ title: result.message, icon: result.success ? 'success' : 'none' });
  }, [deposit]);

  const handleWithdraw = useCallback(() => {
    const result = withdraw();
    Taro.showToast({ title: result.message, icon: result.success ? 'success' : 'none' });
  }, [withdraw]);

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.headerTitle}>{'\uD83C\uDF81'} 福利活动</Text>
        <View className={styles.resBar}>
          <Text className={styles.resText}>{'\uD83D\uDCB0'} {silver}</Text>
          <Text className={styles.resText}>{'\uD83E\uDDE7'} {luckyCharm}</Text>
        </View>
      </View>

      {/* 每日签到 */}
      <View className={styles.section}>
        <View className={styles.sectionHead}>
          <Text className={styles.sectionTitle}>每日签到</Text>
          <Text className={styles.sectionSub}>连续 {signIn.consecutiveDays} 天 · 累计 {signIn.totalDays} 天</Text>
        </View>
        <View className={styles.signGrid}>
          {[1, 2, 3, 4, 5, 6, 7].map(day => {
            const reward = SIGN_IN_REWARDS[day];
            const isToday = day === todayDayIndex && !alreadySigned;
            const isDone = day < todayDayIndex || (day === todayDayIndex && alreadySigned);
            return (
              <View
                key={day}
                className={classnames(
                  styles.signCell,
                  isToday && styles.signCellToday,
                  isDone && styles.signCellDone,
                  day === 7 && styles.signCellWeek,
                )}
              >
                <Text className={styles.signDay}>第{day}天</Text>
                <Text className={styles.signReward}>{'\uD83D\uDCB0'}{reward.silver}</Text>
                <Text className={styles.signReward}>{'\uD83E\uDDE7'}{reward.luckyCharm}</Text>
                {isDone && <Text className={styles.signDoneMark}>{'\u2714'}</Text>}
              </View>
            );
          })}
        </View>
        <View
          className={classnames(styles.actionBtn, alreadySigned && styles.actionBtnDisabled)}
          onClick={alreadySigned ? undefined : handleSignIn}
        >
          <Text className={styles.actionBtnText}>{alreadySigned ? '今日已签到' : '立即签到'}</Text>
        </View>
      </View>

      {/* 家族金猪 */}
      <View className={styles.section}>
        <View className={styles.sectionHead}>
          <Text className={styles.sectionTitle}>{'\uD83D\uDC37'} 家族金猪</Text>
          <Text className={styles.sectionSub}>连续存 {PIG_MAX_DAYS} 天可取，利率随天数递增</Text>
        </View>
        <View className={styles.pigBody}>
          <View className={styles.pigInfoRow}>
            <View className={styles.pigInfoItem}>
              <Text className={styles.pigInfoLabel}>已存本金</Text>
              <Text className={styles.pigInfoValue}>{pig.depositedAmount}</Text>
            </View>
            <View className={styles.pigInfoItem}>
              <Text className={styles.pigInfoLabel}>连续天数</Text>
              <Text className={styles.pigInfoValue}>{pig.depositDays}/{PIG_MAX_DAYS}</Text>
            </View>
            <View className={styles.pigInfoItem}>
              <Text className={styles.pigInfoLabel}>当前利率</Text>
              <Text className={styles.pigInfoValue}>{Math.round(pigRate * 100)}%</Text>
            </View>
          </View>
          {pig.depositedAmount > 0 && (
            <Text className={styles.pigTotalHint}>满期可取：{pigTotal} 银两（含息）</Text>
          )}
          <View className={styles.pigBtnRow}>
            <View
              className={classnames(styles.pigBtn, styles.depositBtn, alreadyDeposited && styles.actionBtnDisabled)}
              onClick={alreadyDeposited ? undefined : handleDeposit}
            >
              <Text className={styles.actionBtnText}>{alreadyDeposited ? '今日已存' : `存入${PIG_DEPOSIT_AMOUNT}`}</Text>
            </View>
            <View
              className={classnames(styles.pigBtn, styles.withdrawBtn, !canWithdraw && styles.actionBtnDisabled)}
              onClick={canWithdraw ? handleWithdraw : undefined}
            >
              <Text className={styles.actionBtnText}>{canWithdraw ? '取出' : '未满7天'}</Text>
            </View>
          </View>
        </View>
      </View>

      <View className={styles.backBtn} onClick={() => Taro.navigateBack()}>
        <Text className={styles.backBtnText}>返回</Text>
      </View>
    </View>
  );
};

export default WelfarePage;
