import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import { FamilyMember, APTITUDE_NAMES, LIFE_STAGE_NAMES, PROFESSION_NAMES } from '@/types/member';
import { getMemberAvatar } from '@/utils/avatar';
import styles from './index.module.scss';

interface MemberCardProps {
  member: FamilyMember;
  onClick?: (member: FamilyMember) => void;
  compact?: boolean;
}

const MemberCard: React.FC<MemberCardProps> = ({ member, onClick, compact }) => {
  const isDeceased = !member.isAlive;

  const handleClick = () => {
    if (onClick && member.isAlive) {
      onClick(member);
    }
  };

  return (
    <View
      className={classnames(styles.card, styles[member.aptitude], isDeceased && styles.deceased, compact && styles.compact)}
      onClick={handleClick}
    >
      <View className={styles.avatar}>
        <Text className={styles.avatarEmoji}>
          {getMemberAvatar(member)}
        </Text>
      </View>
      <Text className={classnames(styles.name, isDeceased && styles.nameDeceased)}>{member.name}</Text>
      {!compact && (
        <>
          <View className={styles.tagRow}>
            <Text className={styles.tag}>{LIFE_STAGE_NAMES[member.lifeStage]}</Text>
            <Text className={classnames(styles.tag, styles.aptitudeTag)}>{APTITUDE_NAMES[member.aptitude]}</Text>
          </View>
          <Text className={styles.profession}>
            {member.profession !== 'none' ? PROFESSION_NAMES[member.profession] : ''}
          </Text>
          <View className={styles.finance}>
            {member.monthlyIncome > 0 && <Text className={styles.income}>+{member.monthlyIncome}/月</Text>}
            {member.monthlyCost > 0 && <Text className={styles.cost}>-{member.monthlyCost}/月</Text>}
          </View>
        </>
      )}
    </View>
  );
};

export default MemberCard;
