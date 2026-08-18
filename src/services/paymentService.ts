import { callFunction } from '@/services/cloud';
import { platform } from '@/utils/platform';
import { getProduct } from '@/constants/payment';
import { useResourceStore } from '@/stores/resourceStore';
import { usePrivilegeStore } from '@/stores/privilegeStore';

export interface CreateOrderResult {
  orderId: string;
  /** 微信支付参数 */
  timeStamp?: string;
  nonceStr?: string;
  package?: string;
  paySign?: string;
  signType?: string;
  /** 抖音支付参数 */
  orderToken?: string;
}

export interface PurchaseResult {
  success: boolean;
  orderId?: string;
  message: string;
}

/**
 * 发起购买：创建订单 → 调起平台支付 → 服务端校验发货。
 * 非小程序环境走 mock 云函数，直接返回成功用于开发调试。
 */
export async function purchase(productId: string): Promise<PurchaseResult> {
  const product = getProduct(productId);
  if (!product) {
    return { success: false, message: '商品不存在' };
  }

  try {
    // 1. 创建订单
    const order = await callFunction<CreateOrderResult>('createOrder', {
      productId,
      platform: platform.isDouyin ? 'douyin' : 'wechat',
    });

    // 2. 调起平台支付（非小程序环境跳过，视为支付成功）
    if (platform.isMiniApp) {
      const payOpts = platform.isDouyin
        ? { orderId: order.orderId, orderToken: order.orderToken }
        : {
            timeStamp: order.timeStamp,
            nonceStr: order.nonceStr,
            package: order.package,
            signType: order.signType || 'MD5',
            paySign: order.paySign,
          };
      const paid = await platform.requestPayment(payOpts);
      if (!paid) {
        return { success: false, orderId: order.orderId, message: '支付已取消' };
      }
    }

    // 3. 服务端校验并发货
    const verify = await callFunction<{ delivered: boolean }>('verifyPayment', {
      orderId: order.orderId,
    });
    if (!verify.delivered) {
      return { success: false, orderId: order.orderId, message: '支付校验中，稍后到账' };
    }

    // 4. 客户端发货入账
    deliverProduct(productId);

    return { success: true, orderId: order.orderId, message: '购买成功' };
  } catch (e: any) {
    return { success: false, message: e?.message || '支付失败' };
  }
}

/** 根据商品类型发货入账：金条走 resourceStore，特权卡走 privilegeStore */
export function deliverProduct(productId: string): void {
  const product = getProduct(productId);
  if (!product) return;

  const resource = useResourceStore.getState();
  const privilege = usePrivilegeStore.getState();

  if (product.goldBar) resource.addGoldBar(product.goldBar);
  if (product.silver) resource.addSilver(product.silver);
  if (product.luckyCharm) resource.addLuckyCharm(product.luckyCharm);

  if (product.type === 'privilege') {
    if (product.privilege === 'monthCard') privilege.activateMonthCard();
    else if (product.privilege === 'lifetimeCard') privilege.activateLifetimeCard();
  }
}
