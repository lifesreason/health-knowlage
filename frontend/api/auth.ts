/**
 * 认证相关 API
 */
import http from '@/common/http';

export const authApi = {
  /** 微信登录 */
  login(data: { code: string }) {
    return http.post('/auth/login', data);
  },

  /** 绑定手机号（微信授权方式） */
  bindPhone(data: { encryptedData: string; iv: string }) {
    return http.post('/auth/bind', data);
  },

  /** 手动绑定手机号 */
  bindPhoneManual(data: { phone: string; code: string }) {
    return http.post('/auth/bind/phone', data);
  },

  /** 发送验证码 */
  sendCode(data: { phone: string }) {
    return http.post('/auth/send-code', data);
  },

  /** 退出登录 */
  logout() {
    return http.post('/auth/logout');
  },
};

export default authApi;
