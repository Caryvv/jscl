const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const COLLECTION = 'orders';

/**
 * 支付回执校验与发货
 * @param {Object} event
 * @param {string} event.orderId
 *
 * 说明：真实场景应在此校验微信支付回调签名/查询支付结果，
 * 确认支付成功后再将订单置为 paid。此处对已存在的 pending 订单做幂等发货标记。
 */
exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext();
  const { orderId } = event;

  try {
    const res = await db.collection(COLLECTION).where({ orderId, _openid: OPENID }).get();
    const order = res.data && res.data[0];
    if (!order) {
      return { code: -1, message: '订单不存在', data: { delivered: false } };
    }

    // 幂等：已发货直接返回成功
    if (order.status === 'paid') {
      return { code: 0, message: 'ok', data: { delivered: true, productId: order.productId } };
    }

    await db.collection(COLLECTION).doc(order._id).update({
      data: { status: 'paid', payTime: Date.now() },
    });

    return { code: 0, message: 'ok', data: { delivered: true, productId: order.productId } };
  } catch (err) {
    return { code: -1, message: err.message || '校验失败', data: { delivered: false } };
  }
};
