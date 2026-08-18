const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const COLLECTION = 'orders';

/** 商品档位配置（价格单位：分），服务端权威副本 */
const PRODUCT_CONFIG = {
  gold_60: { name: '金条×60', price: 600 },
  gold_300: { name: '金条×300', price: 3000 },
  gold_680: { name: '金条×680', price: 6800 },
  gold_1280: { name: '金条×1280', price: 12800 },
  card_month: { name: '免广告月卡', price: 1800 },
  card_lifetime: { name: '免广告终身卡', price: 9800 },
  gift_newbie: { name: '新手礼包', price: 600 },
  gift_heirloom: { name: '传家宝限定礼包', price: 3000 },
};

function generateOrderId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * 创建支付订单
 * @param {Object} event
 * @param {string} event.productId
 * @param {'wechat'|'douyin'} event.platform
 */
exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext();
  const { productId } = event;

  const product = PRODUCT_CONFIG[productId];
  if (!product) {
    return { code: -1, message: '商品不存在', data: null };
  }

  const orderId = generateOrderId();
  await db.collection(COLLECTION).add({
    data: {
      orderId,
      _openid: OPENID,
      productId,
      amount: product.price,
      status: 'pending',
      createTime: Date.now(),
    },
  });

  // 注意：真实微信支付需通过 cloudPay.unifiedOrder 下单获取支付参数，
  // 此处返回订单号与占位支付参数，接入商户号后补全。
  return {
    code: 0,
    message: 'ok',
    data: {
      orderId,
      timeStamp: String(Math.floor(Date.now() / 1000)),
      nonceStr: Math.random().toString(36).slice(2),
      package: 'prepay_id=TODO',
      signType: 'MD5',
      paySign: 'TODO',
    },
  };
};
