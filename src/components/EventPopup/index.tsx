import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import { RandomEvent } from '@/types/event';
import styles from './index.module.scss';

interface EventPopupProps {
  event: RandomEvent;
  onResolve: (choiceIndex?: number) => void;
}

const EventPopup: React.FC<EventPopupProps> = ({ event, onResolve }) => {
  const isImmediate = !event.choices || event.choices.length === 0;

  return (
    <View className={styles.mask}>
      <View className={styles.popup}>
        <View className={styles.header}>
          <Text className={styles.icon}>{event.icon}</Text>
          <Text className={styles.title}>{event.name}</Text>
          <Text className={classnames(styles.typeTag, styles[`type_${event.type}`])}>
            {event.type === 'positive' ? '吉' : event.type === 'negative' ? '凶' : '事'}
          </Text>
        </View>

        <Text className={styles.desc}>{event.description}</Text>

        {isImmediate ? (
          <View className={styles.actions}>
            <View className={styles.confirmBtn} onClick={() => onResolve()}>
              <Text className={styles.confirmBtnText}>知道了</Text>
            </View>
          </View>
        ) : (
          <View className={styles.choices}>
            {event.choices!.map((choice, idx) => (
              <View
                key={idx}
                className={styles.choiceBtn}
                onClick={() => onResolve(idx)}
              >
                <Text className={styles.choiceText}>{choice.label}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
};

export default EventPopup;
