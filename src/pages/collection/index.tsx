import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import CollectionCard from '@/components/CollectionCard';
import { useCollectionStore, MAX_EQUIPPED } from '@/stores/collectionStore';
import { useResourceStore } from '@/stores/resourceStore';
import { HEIRLOOM_POOL, DRAW_COST_LUCKY_CHARM, getUpgradeCost } from '@/constants/collection';
import { getHeirloomById } from '@/services/collectionService';
import { Heirloom } from '@/types/collection';
import styles from './index.module.scss';

const CollectionPage: React.FC = () => {
  const { owned, equipped, init, draw, upgrade, toggleEquip } = useCollectionStore();
  const { luckyCharm, init: initResource } = useResourceStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drawResult, setDrawResult] = useState<Heirloom | null>(null);

  useEffect(() => {
    init();
    initResource();
  }, []);

  const handleDraw = useCallback(() => {
    const result = draw();
    if (result.success && result.heirloom) {
      setDrawResult(result.heirloom);
    } else {
      Taro.showToast({ title: result.message, icon: 'none' });
    }
  }, [draw]);

  const handleUpgrade = useCallback((id: string) => {
    const result = upgrade(id);
    Taro.showToast({ title: result.message, icon: result.success ? 'success' : 'none' });
  }, [upgrade]);

  const handleToggleEquip = useCallback((id: string) => {
    const result = toggleEquip(id);
    Taro.showToast({ title: result.message, icon: result.success ? 'success' : 'none' });
  }, [toggleEquip]);

  const ownedCount = owned.length;
  const totalCount = HEIRLOOM_POOL.length;

  const selectedHeirloom = selectedId ? getHeirloomById(selectedId) : null;
  const selectedOwned = selectedId ? owned.find(o => o.id === selectedId) : undefined;
  const selectedEquipped = selectedId ? equipped.includes(selectedId) : false;
  const canUpgrade = selectedHeirloom && selectedOwned && selectedOwned.level < selectedHeirloom.maxLevel;
  const upgradeCost = selectedOwned ? getUpgradeCost(selectedOwned.level) : 0;

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <View>
          <Text className={styles.headerTitle}>{'\uD83C\uDFFA'} 传家藏品</Text>
          <Text className={styles.headerSub}>已收集 {ownedCount}/{totalCount}　装备 {equipped.length}/{MAX_EQUIPPED}</Text>
        </View>
        <View className={styles.charmInfo}>
          <Text className={styles.charmText}>{'\uD83E\uDDE7'} {luckyCharm}</Text>
        </View>
      </View>

      <View className={styles.drawBar}>
        <View
          className={classnames(styles.drawBtn, luckyCharm < DRAW_COST_LUCKY_CHARM && styles.drawBtnDisabled)}
          onClick={handleDraw}
        >
          <Text className={styles.drawBtnText}>祈福抽取</Text>
          <Text className={styles.drawBtnCost}>消耗 {DRAW_COST_LUCKY_CHARM} 福缘符</Text>
        </View>
      </View>

      <ScrollView scrollY className={styles.grid}>
        <View className={styles.gridInner}>
          {HEIRLOOM_POOL.map(h => {
            const ownedItem = owned.find(o => o.id === h.id);
            return (
              <CollectionCard
                key={h.id}
                heirloom={h}
                owned={ownedItem}
                equipped={equipped.includes(h.id)}
                onClick={ownedItem ? setSelectedId : undefined}
              />
            );
          })}
        </View>
      </ScrollView>

      <View className={styles.backBtn} onClick={() => Taro.navigateBack()}>
        <Text className={styles.backBtnText}>返回</Text>
      </View>

      {drawResult && (
        <View className={styles.mask} onClick={() => setDrawResult(null)}>
          <View className={styles.drawModal}>
            <Text className={styles.drawModalTitle}>祖荫庇佑</Text>
            <Text className={styles.drawModalIcon}>{drawResult.icon}</Text>
            <Text className={styles.drawModalName}>{drawResult.name}</Text>
            <Text className={styles.drawModalDesc}>{drawResult.description}</Text>
            <View className={styles.drawModalBtn} onClick={() => setDrawResult(null)}>
              <Text className={styles.drawModalBtnText}>收入囊中</Text>
            </View>
          </View>
        </View>
      )}

      {selectedHeirloom && selectedOwned && (
        <View className={styles.mask} onClick={() => setSelectedId(null)}>
          <View className={styles.detailModal} onClick={(e) => e.stopPropagation()}>
            <Text className={styles.detailIcon}>{selectedHeirloom.icon}</Text>
            <Text className={styles.detailName}>{selectedHeirloom.name}</Text>
            <Text className={styles.detailLevel}>Lv.{selectedOwned.level}/{selectedHeirloom.maxLevel}</Text>
            <Text className={styles.detailDesc}>{selectedHeirloom.description}</Text>
            <View className={styles.detailActions}>
              <View
                className={classnames(styles.detailBtn, styles.equipBtn)}
                onClick={() => handleToggleEquip(selectedHeirloom.id)}
              >
                <Text className={styles.detailBtnText}>{selectedEquipped ? '卸下' : '装备'}</Text>
              </View>
              {canUpgrade ? (
                <View
                  className={classnames(styles.detailBtn, styles.upgradeBtn)}
                  onClick={() => handleUpgrade(selectedHeirloom.id)}
                >
                  <Text className={styles.detailBtnText}>升级</Text>
                  <Text className={styles.detailBtnCost}>{upgradeCost} 福缘符</Text>
                </View>
              ) : (
                <View className={classnames(styles.detailBtn, styles.maxBtn)}>
                  <Text className={styles.detailBtnText}>已满级</Text>
                </View>
              )}
            </View>
            <View className={styles.detailClose} onClick={() => setSelectedId(null)}>
              <Text className={styles.detailCloseText}>关闭</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default CollectionPage;
