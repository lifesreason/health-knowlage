<template>
  <view v-if="show" class="auth-modal-overlay">
    <view class="auth-modal" @click.stop>
      <view class="auth-header">
        <text class="auth-title text-scale-lg">登录提示</text>
        <text class="close-icon" @click="closeModal">✕</text>
      </view>

      <view class="auth-content">
        <image class="auth-icon" src="/static/images/auth-icon.png" mode="aspectFit"></image>
        <text class="auth-desc text-scale">依据互联网法规，互动需实名认证</text>

        <view class="auth-buttons">
          <!-- 微信一键登录 -->
          <button class="auth-btn wechat-btn" @click="handleWechatLogin">
            <text class="btn-icon">💬</text>
            <text class="text-scale">微信一键登录</text>
          </button>

          <!-- 短信验证码登录 -->
          <button class="auth-btn sms-btn" @click="handleSmsLogin">
            <text class="btn-icon">💬</text>
            <text class="text-scale">短信验证码登录</text>
          </button>
        </view>
      </view>
    </view>
  </view>

  <!-- 短信登录弹窗 -->
  <view v-if="showSmsLogin" class="sms-modal-overlay" @click="showSmsLogin = false">
    <view class="sms-login-modal" @click.stop>
      <view class="sms-header">
        <text class="sms-title text-scale-lg">短信登录</text>
        <text class="close-icon" @click="showSmsLogin = false">✕</text>
      </view>

      <view class="sms-content">
        <input
          v-model="mobile"
          placeholder="请输入手机号"
          type="number"
          maxlength="11"
          class="sms-input"
        />

        <view class="sms-code-input">
          <input
            v-model="code"
            placeholder="请输入验证码"
            type="number"
            maxlength="6"
            class="code-input"
          />
          <button class="send-code-btn" @click="sendCode" :disabled="countingDown">
            {{ countingDown ? `${countdown}s` : '发送验证码' }}
          </button>
        </view>

        <button class="sms-submit-btn" @click="handleSmsSubmit">
          <text class="text-scale">登录</text>
        </button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { wechatLogin, smsLogin, sendSmsCode } from '@/api/auth';
import { useUserStore } from '@/store/user';

const props = defineProps<{
  show: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:show', value: boolean): void;
  (e: 'success'): void;
}>();

const userStore = useUserStore();

const showSmsLogin = ref(false);
const mobile = ref('');
const code = ref('');
const countingDown = ref(false);
const countdown = ref(60);
const wxCode = ref('');

// 监听 show 变化
watch(() => props.show, (newVal) => {
  if (newVal) {
    // 获取微信 code
    uni.login({
      provider: 'weixin',
      success: (res) => {
        wxCode.value = res.code;
      },
    });
  }
});

const show = ref(props.show);
watch(() => props.show, (val) => show.value = val);
watch(show, (val) => emit('update:show', val));

// 关闭弹窗
const closeModal = () => {
  show.value = false;
};

// 微信登录
const handleWechatLogin = async () => {
  if (!wxCode.value) {
    uni.showToast({ title: '获取微信授权失败', icon: 'none' });
    return;
  }

  try {
    uni.showLoading({ title: '登录中...' });

    const res = await wechatLogin(wxCode.value);

    if (res.needBind) {
      // 需要绑定手机号
      uni.hideLoading();
      uni.showToast({ title: '需要绑定手机号', icon: 'none' });
      // TODO: 调用微信手机号授权
      handleGetPhoneNumber();
    } else {
      // 登录成功
      userStore.setToken(res.accessToken);
      userStore.setUserInfo(res.userInfo);

      uni.hideLoading();
      uni.showToast({ title: '登录成功', icon: 'success' });

      closeModal();
      emit('success');
    }
  } catch (error) {
    uni.hideLoading();
    uni.showToast({ title: '登录失败', icon: 'none' });
  }
};

// 获取微信手机号
const handleGetPhoneNumber = () => {
  // TODO: 实现微信手机号授权
  uni.showToast({ title: '手机号授权功能开发中', icon: 'none' });
};

// 短信登录
const handleSmsLogin = () => {
  showSmsLogin.value = true;
};

// 发送验证码
const sendCode = async () => {
  if (!mobile.value || mobile.value.length !== 11) {
    uni.showToast({ title: '请输入正确的手机号', icon: 'none' });
    return;
  }

  try {
    await sendSmsCode(mobile.value);
    uni.showToast({ title: '验证码已发送', icon: 'success' });

    // 开始倒计时
    countingDown.value = true;
    countdown.value = 60;

    const timer = setInterval(() => {
      countdown.value--;
      if (countdown.value <= 0) {
        clearInterval(timer);
        countingDown.value = false;
      }
    }, 1000);
  } catch (error) {
    uni.showToast({ title: '发送失败', icon: 'none' });
  }
};

// 提交短信登录
const handleSmsSubmit = async () => {
  if (!mobile.value || !code.value) {
    uni.showToast({ title: '请填写完整信息', icon: 'none' });
    return;
  }

  try {
    uni.showLoading({ title: '登录中...' });

    const res = await smsLogin({
      mobile: mobile.value,
      code: code.value,
    });

    userStore.setToken(res.accessToken);
    userStore.setUserInfo(res.userInfo);

    uni.hideLoading();
    uni.showToast({ title: '登录成功', icon: 'success' });

    showSmsLogin.value = false;
    closeModal();
    emit('success');
  } catch (error) {
    uni.hideLoading();
    uni.showToast({ title: '登录失败', icon: 'none' });
  }
};
</script>

<style lang="scss" scoped>
.auth-modal-overlay,
.sms-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}

.auth-modal {
  width: 560rpx;
  padding: 48rpx 40rpx;
  background-color: #fff;
  border-radius: 20rpx;
}

.auth-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 40rpx;
}

.auth-title {
  font-weight: bold;
  color: #333;
}

.close-icon {
  font-size: 40rpx;
  color: #999;
  cursor: pointer;
}

.btn-icon {
  font-size: 40rpx;
}

.auth-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 32rpx;
}

.auth-icon {
  width: 120rpx;
  height: 120rpx;
}

.auth-desc {
  color: #666;
  text-align: center;
}

.auth-buttons {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
  width: 100%;
}

.auth-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16rpx;
  height: 88rpx;
  border-radius: 44rpx;
  border: none;
  font-size: 32rpx;
}

.wechat-btn {
  background-color: #07c160;
  color: #fff;
}

.sms-btn {
  background-color: #f5f5f5;
  color: #3cc51f;
}

.sms-login-modal {
  width: 560rpx;
  padding: 48rpx 40rpx;
  background-color: #fff;
  border-radius: 20rpx;
}

.sms-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 40rpx;
}

.sms-title {
  font-weight: bold;
  color: #333;
}

.sms-content {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.sms-input {
  height: 88rpx;
  background-color: #f5f5f5;
  border-radius: 8rpx;
  padding: 0 24rpx;
}

.sms-code-input {
  display: flex;
  gap: 16rpx;
}

.code-input {
  flex: 1;
  height: 88rpx;
  background-color: #f5f5f5;
  border-radius: 8rpx;
  padding: 0 24rpx;
}

.send-code-btn {
  height: 88rpx;
  padding: 0 24rpx;
  background-color: #3cc51f;
  color: #fff;
  border-radius: 8rpx;
  font-size: 28rpx;
  border: none;
}

.send-code-btn:disabled {
  background-color: #ccc;
}

.sms-submit-btn {
  height: 88rpx;
  background-color: #3cc51f;
  color: #fff;
  border-radius: 44rpx;
  font-size: 32rpx;
  border: none;
  margin-top: 16rpx;
}
</style>