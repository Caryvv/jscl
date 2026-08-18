const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const COLLECTION = 'game_saves';

/**
 * 游戏数据云端同步
 * @param {Object} event
 * @param {'upload'|'download'} event.mode
 * @param {number} [event.localVersion] 本地数据版本号
 * @param {Object} [event.snapshot] 本地存档快照
 * @param {number} [event.localUpdatedAt] 本地最后修改时间戳
 */
exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext();
  const { mode, localVersion = 0, snapshot, localUpdatedAt } = event;

  try {
    const query = db.collection(COLLECTION).where({ _openid: OPENID });
    const existing = await query.get();
    const record = existing.data && existing.data[0];

    if (mode === 'download') {
      if (!record) {
        return { code: 0, message: '云端暂无存档', data: { success: true, action: 'none', dataVersion: 0, message: '云端暂无存档' } };
      }
      return {
        code: 0,
        message: 'ok',
        data: {
          success: true,
          action: 'download',
          dataVersion: record.dataVersion,
          snapshot: record.snapshot,
          message: '已从云端拉取存档',
        },
      };
    }

    // upload
    const cloudVersion = record ? record.dataVersion : 0;

    // 冲突检测：云端版本比本地新
    if (record && cloudVersion > localVersion) {
      return {
        code: 0,
        message: 'conflict',
        data: {
          success: false,
          action: 'none',
          dataVersion: cloudVersion,
          snapshot: record.snapshot,
          message: '检测到云端有更新的存档',
          conflict: true,
        },
      };
    }

    const newVersion = cloudVersion + 1;
    const payload = {
      dataVersion: newVersion,
      updatedAt: localUpdatedAt || Date.now(),
      snapshot: snapshot || {},
    };

    if (record) {
      await db.collection(COLLECTION).doc(record._id).update({ data: payload });
    } else {
      await db.collection(COLLECTION).add({ data: { _openid: OPENID, ...payload } });
    }

    return {
      code: 0,
      message: 'ok',
      data: { success: true, action: 'upload', dataVersion: newVersion, message: '已上传至云端' },
    };
  } catch (err) {
    return { code: -1, message: err.message || '同步失败', data: null };
  }
};
