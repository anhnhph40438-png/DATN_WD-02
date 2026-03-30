const crypto = require('crypto');
const {
  VNPAY_TMN_CODE,
  VNPAY_HASH_SECRET,
  VNPAY_URL,
  VNPAY_RETURN_URL
} = require('../config/env');

const sortObject = (obj) => {
  const sorted = {};
  const keys = Object.keys(obj).sort();

  for (const key of keys) {
    sorted[key] = encodeURIComponent(obj[key]).replace(/%20/g, '+');
  }

  return sorted;
};

const formatVnpayDate = (date) => {
  const pad = (num) => String(num).padStart(2, '0');

  return (
    date.getFullYear().toString() +
    pad(date.getMonth() + 1) +
    pad(date.getDate()) +
    pad(date.getHours()) +
    pad(date.getMinutes()) +
    pad(date.getSeconds())
  );
};

const createPaymentUrl = (appointment, vnpTxnRef, ipAddr) => {
  const createDate = formatVnpayDate(new Date());

  const amount = Math.round((appointment.finalPrice || appointment.totalPrice || 0) * 100);

  const orderInfo = 'Thanh toan lich hen ' + appointment._id;

  // Normalize IPv6 localhost to IPv4
  let clientIp = ipAddr || '127.0.0.1';
  if (clientIp === '::1' || clientIp === '::ffff:127.0.0.1') {
    clientIp = '127.0.0.1';
  }

  let vnp_Params = {};
  vnp_Params['vnp_Version'] = '2.1.0';
  vnp_Params['vnp_Command'] = 'pay';
  vnp_Params['vnp_TmnCode'] = VNPAY_TMN_CODE;
  vnp_Params['vnp_Locale'] = 'vn';
  vnp_Params['vnp_CurrCode'] = 'VND';
  vnp_Params['vnp_TxnRef'] = vnpTxnRef;
  vnp_Params['vnp_OrderInfo'] = orderInfo;
  vnp_Params['vnp_OrderType'] = 'other';
  vnp_Params['vnp_Amount'] = String(amount);
  vnp_Params['vnp_ReturnUrl'] = VNPAY_RETURN_URL;
  vnp_Params['vnp_IpAddr'] = clientIp;
  vnp_Params['vnp_CreateDate'] = createDate;

  vnp_Params = sortObject(vnp_Params);

  const signData = Object.entries(vnp_Params)
    .map(([key, value]) => `${key}=${value}`)
    .join('&');

  const hmac = crypto.createHmac('sha512', VNPAY_HASH_SECRET);
  const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

  vnp_Params['vnp_SecureHash'] = signed;

  const queryString = Object.entries(vnp_Params)
    .map(([key, value]) => `${key}=${value}`)
    .join('&');

  return `${VNPAY_URL}?${queryString}`;
};

const verifyReturnUrl = (vnpParams) => {
  const secureHash = vnpParams['vnp_SecureHash'];

  const params = { ...vnpParams };
  delete params['vnp_SecureHash'];
  delete params['vnp_SecureHashType'];

  const sortedParams = sortObject(params);

  const signData = Object.entries(sortedParams)
    .map(([key, value]) => `${key}=${value}`)
    .join('&');

  const hmac = crypto.createHmac('sha512', VNPAY_HASH_SECRET);
  const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

  const isValid = secureHash === signed;

  return {
    isValid,
    responseCode: vnpParams['vnp_ResponseCode'],
    transactionNo: vnpParams['vnp_TransactionNo'],
    txnRef: vnpParams['vnp_TxnRef'],
    bankCode: vnpParams['vnp_BankCode'],
    amount: vnpParams['vnp_Amount'] ? parseInt(vnpParams['vnp_Amount']) / 100 : 0,
    orderInfo: vnpParams['vnp_OrderInfo'],
    payDate: vnpParams['vnp_PayDate']
  };
};

const verifyIpn = (vnpParams) => {
  return verifyReturnUrl(vnpParams);
};

const getResponseMessage = (responseCode) => {
  const messages = {
    '00': 'Giao dịch thành công',
    '07': 'Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường)',
    '09': 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng chưa đăng ký dịch vụ InternetBanking tại ngân hàng',
    '10': 'Giao dịch không thành công do: Khách hàng xác thực thông tin thẻ/tài khoản không đúng quá 3 lần',
    '11': 'Giao dịch không thành công do: Đã hết hạn chờ thanh toán. Xin quý khách vui lòng thực hiện lại giao dịch',
    '12': 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng bị khóa',
    '13': 'Giao dịch không thành công do Quý khách nhập sai mật khẩu xác thực giao dịch (OTP)',
    '24': 'Giao dịch không thành công do: Khách hàng hủy giao dịch',
    '51': 'Giao dịch không thành công do: Tài khoản của quý khách không đủ số dư để thực hiện giao dịch',
    '65': 'Giao dịch không thành công do: Tài khoản của Quý khách đã vượt quá hạn mức giao dịch trong ngày',
    '75': 'Ngân hàng thanh toán đang bảo trì',
    '79': 'Giao dịch không thành công do: KH nhập sai mật khẩu thanh toán quá số lần quy định',
    '99': 'Các lỗi khác (lỗi còn lại, không có trong danh sách mã lỗi đã liệt kê)'
  };

  return messages[responseCode] || 'Lỗi không xác định';
};

module.exports = {
  sortObject,
  createPaymentUrl,
  verifyReturnUrl,
  verifyIpn,
  getResponseMessage
};
