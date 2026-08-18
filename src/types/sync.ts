/** 云端同步的完整游戏存档快照 */
export interface GameDataSnapshot {
  resourceState: any;
  familyState: any;
  treeState: any;
  servantState: any;
  shopState: any;
  tradingState: any;
  eventState: any;
  achievementState: any;
  collectionState: any;
  dynastyState: any;
  genealogyState: any;
  welfareState: any;
}

/** 云端存档记录（含元数据） */
export interface CloudSaveRecord {
  /** 数据版本号，用于冲突检测，每次上传 +1 */
  dataVersion: number;
  /** 最后更新的时间戳（毫秒） */
  updatedAt: number;
  /** 游戏存档快照 */
  snapshot: GameDataSnapshot;
}

/** 同步动作类型 */
export type SyncAction = 'upload' | 'download' | 'merged' | 'none';

/** 同步结果 */
export interface SyncResult {
  success: boolean;
  action: SyncAction;
  /** 同步后的数据版本号 */
  dataVersion: number;
  message: string;
  /** 检测到冲突时为 true */
  conflict?: boolean;
}

/** syncGameData 云函数请求参数 */
export interface SyncRequest {
  /** upload: 上传本地存档；download: 拉取云端存档 */
  mode: 'upload' | 'download';
  /** 本地数据版本号 */
  localVersion?: number;
  /** 上传时携带的本地存档 */
  snapshot?: GameDataSnapshot;
  /** 本地最后修改时间戳 */
  localUpdatedAt?: number;
}
