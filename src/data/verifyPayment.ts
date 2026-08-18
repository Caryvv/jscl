/**
 * 本地 mock 云函数：非 weapp 环境模拟支付校验。
 * mock 环境直接视为已支付并发货。
 */
export default function verifyPayment(data: { orderId: string }): { delivered: boolean } {
  return { delivered: true };
}
