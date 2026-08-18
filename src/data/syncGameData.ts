import Taro from '@tarojs/taro';
import { SyncRequest, CloudSaveRecord, SyncResult } from '@/types/sync';

/**
 * 本地 mock 云函数：非 weapp 环境（H5/RN/开发预览）下模拟 syncGameData 云端行为。
 * 用一条本地 storage 记录模拟云端数据库文档。
 */
const CLOUD_MOCK_KEY = 'jscl_cloud_mock_record';

function readCloudRecord(): CloudSaveRecord | null {
  try {
    const raw = Taro.getStorageSync(CLOUD_MOCK_KEY);
    if (raw !== '') return JSON.parse(raw) as CloudSaveRecord;
  } catch (e) {
    console.error('[MockCloud] read error:', e);
  }
  return null;
}

function writeCloudRecord(record: CloudSaveRecord): void {
  try {
    Taro.setStorageSync(CLOUD_MOCK_KEY, JSON.stringify(record));
  } catch (e) {
    console.error('[MockCloud] write error:', e);
  }
}

export default function syncGameData(req: SyncRequest): SyncResult {
  const cloud = readCloudRecord();

  if (req.mode === 'download') {
    if (!cloud) {
      return { success: true, action: 'none', dataVersion: 0, message: '云端暂无存档' };
    }
    return {
      success: true,
      action: 'download',
      dataVersion: cloud.dataVersion,
      message: '已从云端拉取存档',
    };
  }

  // upload
  const localVersion = req.localVersion ?? 0;
  const cloudVersion = cloud?.dataVersion ?? 0;

  // 冲突检测：云端版本比本地新，说明其他端已更新
  if (cloud && cloudVersion > localVersion) {
    return {
      success: false,
      action: 'none',
      dataVersion: cloudVersion,
      message: '检测到云端有更新的存档',
      conflict: true,
    };
  }

  const newVersion = cloudVersion + 1;
  writeCloudRecord({
    dataVersion: newVersion,
    updatedAt: req.localUpdatedAt ?? Date.now(),
    snapshot: req.snapshot!,
  });
  return {
    success: true,
    action: 'upload',
    dataVersion: newVersion,
    message: '已上传至云端',
  };
}
