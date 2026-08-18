import { CreateOrderResult } from '@/services/paymentService';

/**
 * 本地 mock 云函数：非 weapp 环境模拟创建订单。
 * 生成一个本地订单号，不产生真实支付。
 */
export default function createOrder(data: { productId: string; platform: string }): CreateOrderResult {
  const orderId = `mock_${data.productId}_${Date.now()}`;
  return {
    orderId,
    timeStamp: String(Math.floor(Date.now() / 1000)),
    nonceStr: Math.random().toString(36).slice(2),
    package: 'prepay_id=mock',
    signType: 'MD5',
    paySign: 'mock_sign',
    orderToken: 'mock_token',
  };
}
