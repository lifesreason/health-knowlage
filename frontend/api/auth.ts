import http from '@/common/http';

/**
 * 微信登录
 */
export const wechatLogin = (code: string) => {
  return http.post('/auth/login', { code });
};

/**
 * 绑定手机号
 */
export const bindMobile = (data: {
  encryptedData: string;
  iv: string;
}) => {
  return http.post('/auth/bind', data);
};

/**
 * 短信验证码登录
 */
export const smsLogin = (data: {
  mobile: string;
  code: string;
}) => {
  return http.post('/auth/sms-login', data);
};

/**
 * 发送短信验证码
 */
export const sendSmsCode = (mobile: string) => {
  return http.post('/auth/send-sms', { mobile });
};