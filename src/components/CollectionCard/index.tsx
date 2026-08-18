import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import { Heirloom, OwnedHeirloom } from '@/types/collection';
import { RARITY_NAMES, RARITY_COLORS } from '@/constants/collection';
import { getHeirloomBonusValue } from '@/services/collectionService';
import styles from './index.module.scss';

const BONUS_TYPE_NAMES: Record<string, string> = {
  income: '家族收益',
  cost: '开支减免',
  trading: '跑商收益',
  aptitude: '资质成长',
  offline: '离线收益',
};

interface CollectionCardProps {
  heirloom: Heirloom;
  owned?: OwnedHeirloom;
  equipped?: boolean;
  onClick?: (id: string) => void;
}

const CollectionCard: React.FC<CollectionCardProps> = ({ heirloom, owned, equipped, onClick }) => {
  const isOwned = !!owned;
  const level = owned?.level || 0;
  const bonusValue = isOwned ? getHeirloomBonusValue(heirloom, level) : heirloom.bonus.baseValue;
  const bonusPercent = Math.round(bonusValue * 100);

  return (
    <View
      className={classnames(styles.card, !isOwned && styles.cardLocked, equipped && styles.cardEquipped)}
      style={isOwned ? { borderColor: RARITY_COLORS[heirloom.rarity] } : undefined}
      onClick={() => onClick && onClick(heirloom.id)}
    >
      {equipped && <View className={styles.equipBadge}><Text className={styles.equipBadgeText}>装备中</Text></View>}
      <View className={styles.iconWrap}>
        <Text className={styles.icon}>{isOwned ? heirloom.icon : '\u2753'}</Text>
      </View>
      <Text
        className={styles.rarity}
        style={{ color: RARITY_COLORS[heirloom.rarity] }}
      >
        {RARITY_NAMES[heirloom.rarity]}
      </Text>
      <Text className={styles.name}>{isOwned ? heirloom.name : '未获得'}</Text>
      {isOwned && (
        <>
          <Text className={styles.level}>Lv.{level}/{heirloom.maxLevel}</Text>
          <Text className={styles.bonus}>{BONUS_TYPE_NAMES[heirloom.bonus.type]} +{bonusPercent}%</Text>
        </>
      )}
    </View>
  );
};

export default CollectionCard;
