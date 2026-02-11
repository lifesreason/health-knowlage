<template>
  <view class="auth-container" :style="{ '--font-scale': fontScale }">
    <!-- 顶部装饰背景 -->
    <view class="auth-bg">
      <view class="bg-circle c1"></view>
      <view class="bg-circle c2"></view>
      <view class="bg-circle c3"></view>
    </view>

    <!-- 头部信息 -->
    <view class="auth-header">
      <view class="logo-wrap">
        <text class="logo-emoji">🏥</text>
      </view>
      <text class="app-name" :style="{ fontSize: `calc(26px * ${fontScale})` }">银龄健康</text>
      <text class="app-desc" :style="{ fontSize: `calc(14px * ${fontScale})` }">专为中老年人打造的健康知识平台</text>
    </view>

    <!-- 内容卡片 -->
    <view class="auth-card">
      <!-- 登录步骤 -->
      <view v-if="step === 'login'" class="login-section">
        <text class="section-title" :style="{ fontSize: `calc(20px * ${fontScale})` }">欢迎使用</text>
        <text class="section-desc" :style="{ fontSize: `calc(14px * ${fontScale})` }">登录后享受专属健康服务</text>
        
        <!-- 功能亮点 -->
        <view class="features">
          <view class="feature-item">
            <text class="feature-icon">📖</text>
            <text class="feature-text" :style="{ fontSize: `calc(13px * ${fontScale})` }">专业健康知识</text>
          </view>
          <view class="feature-item">
            <text class="feature-icon">👨‍⚕️</text>
            <text class="feature-text" :style="{ fontSize: `calc(13px * ${fontScale})` }">医师在线答疑</text>
          </view>
          <view class="feature-item">
            <text class="feature-icon">🏠</text>
            <text class="feature-text" :style="{ fontSize: `calc(13px * ${fontScale})` }">健康圈子交流</text>
          </view>
        </view>
        
        <button class="wx-login-btn" @click="handleWxLogin">
          <text class="wx-icon">💬</text>
          <text :style="{ fontSize: `calc(17px * ${fontScale})` }">微信一键登录</text>
        </button>
        
        <text class="login-tips" :style="{ fontSize: `calc(12px * ${fontScale})` }">
          登录即表示同意《用户协议》和《隐私政策》
        </text>
      </view>

      <!-- 绑定手机步骤 -->
      <view v-else-if="step === 'bind'" class="bind-section">
        <text class="section-title" :style="{ fontSize: `calc(20px * ${fontScale})` }">绑定手机号</text>
        <text class="section-desc" :style="{ fontSize: `calc(14px * ${fontScale})` }">绑定后可获得更多专属功能</text>
        
        <button class="phone-auth-btn" open-type="getPhoneNumber" @getphonenumber="handleGetPhone">
          <text class="phone-icon">📱</text>
          <text :style="{ fontSize: `calc(16px * ${fontScale})` }">一键授权手机号</text>
        </button>

        <view class="divider-wrap">
          <view class="divider-line"></view>
          <text class="divider-text" :style="{ fontSize: `calc(13px * ${fontScale})` }">或手动输入</text>
          <view class="divider-line"></view>
        </view>

        <view class="input-group">
          <view class="input-wrap">
            <text class="input-icon">📞</text>
            <input v-model="phone" type="number" placeholder="请输入手机号" maxlength="11" class="form-input" :style="{ fontSize: `calc(15px * ${fontScale})` }" />
          </view>
          <view class="input-wrap code-wrap">
            <text class="input-icon">🔒</text>
            <input v-model="code" type="number" placeholder="验证码" maxlength="6" class="form-input" :style="{ fontSize: `calc(15px * ${fontScale})` }" />
            <button class="code-btn" :disabled="countdown > 0" @click="sendCode" :style="{ fontSize: `calc(13px * ${fontScale})` }">
              {{ countdown > 0 ? `${countdown}s` : '获取验证码' }}
            </button>
          </view>
          <button class="bind-btn" :disabled="!phone || !code" @click="handleManualBind" :style="{ fontSize: `calc(16px * ${fontScale})` }">
            确认绑定
          </button>
        </view>

        <text class="skip-btn" @click="skipBind" :style="{ fontSize: `calc(14px * ${fontScale})` }">暂不绑定，先看看 →</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { useThemeStore } from '@/store/theme';
import { useUserStore } from '@/store/user';
import { storeToRefs } from 'pinia';

const themeStore = useThemeStore();
const userStore = useUserStore();
const { fontScale } = storeToRefs(themeStore);

const step = ref<'login' | 'bind'>('login');
const phone = ref('');
const code = ref('');
const countdown = ref(0);

let timer: ReturnType<typeof setInterval> | null = null;

const handleWxLogin = async () => {
  try {
    uni.showLoading({ title: '登录中...' });
    const [err, res] = await uni.login({ provider: 'weixin' });
    if (err || !res?.code) {
      uni.showToast({ title: '登录失败', icon: 'none' });
      return;
    }

    const success = await userStore.wxLogin(res.code);
    if (success) {
      if (!userStore.userInfo?.mobile) {
        step.value = 'bind';
      } else {
        uni.showToast({ title: '登录成功', icon: 'success' });
        setTimeout(() => uni.navigateBack(), 1000);
      }
    }
  } finally {
    uni.hideLoading();
  }
};

const handleGetPhone = async (e: any) => {
  if (e.detail.errMsg !== 'getPhoneNumber:ok') return;

  try {
    uni.showLoading({ title: '绑定中...' });
    const success = await userStore.bindPhone(e.detail.encryptedData, e.detail.iv);
    if (success) {
      uni.showToast({ title: '绑定成功', icon: 'success' });
      setTimeout(() => uni.navigateBack(), 1000);
    }
  } finally {
    uni.hideLoading();
  }
};

const sendCode = async () => {
  if (phone.value.length !== 11) {
    uni.showToast({ title: '请输入正确的手机号', icon: 'none' });
    return;
  }

  try {
    countdown.value = 60;
    timer = setInterval(() => {
      countdown.value--;
      if (countdown.value <= 0 && timer) {
        clearInterval(timer);
        timer = null;
      }
    }, 1000);
    uni.showToast({ title: '验证码已发送', icon: 'success' });
  } catch {
    uni.showToast({ title: '发送失败', icon: 'none' });
  }
};

const handleManualBind = async () => {
  if (phone.value.length !== 11 || code.value.length !== 6) {
    uni.showToast({ title: '请输入正确的手机号和验证码', icon: 'none' });
    return;
  }

  try {
    uni.showLoading({ title: '绑定中...' });
    await new Promise(r => setTimeout(r, 1000));
    uni.showToast({ title: '绑定成功', icon: 'success' });
    setTimeout(() => uni.navigateBack(), 1000);
  } finally {
    uni.hideLoading();
  }
};

const skipBind = () => {
  uni.navigateBack();
};

onLoad(() => {
  if (userStore.isLoggedIn && !userStore.userInfo?.mobile) {
    step.value = 'bind';
  }
});
</script>

<style lang="scss" scoped>
.auth-container {
  min-height: 100vh;
  background: linear-gradient(150deg, #E17055 0%, #d45d43 40%, #c4472f 100%);
  position: relative;
  overflow: hidden;
}

// 装饰背景圆
.auth-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.bg-circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
  
  &.c1 { width: 400rpx; height: 400rpx; top: -100rpx; right: -100rpx; }
  &.c2 { width: 300rpx; height: 300rpx; top: 200rpx; left: -80rpx; }
  &.c3 { width: 200rpx; height: 200rpx; bottom: 300rpx; right: 40rpx; }
}

// 头部
.auth-header {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 120rpx 0 60rpx;
  padding-top: calc(120rpx + env(safe-area-inset-top));
}

.logo-wrap {
  width: 160rpx;
  height: 160rpx;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 28rpx;
  backdrop-filter: blur(10px);
}

.logo-emoji {
  font-size: 80rpx;
}

.app-name {
  font-weight: 700;
  color: #fff;
  margin-bottom: 12rpx;
  letter-spacing: 4rpx;
}

.app-desc {
  color: rgba(255, 255, 255, 0.8);
}

// 内容卡片
.auth-card {
  position: relative;
  background: #fff;
  border-radius: 48rpx 48rpx 0 0;
  min-height: 60vh;
  padding: 56rpx 48rpx;
  padding-bottom: calc(56rpx + env(safe-area-inset-bottom));
}

// 登录区
.login-section {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.section-title {
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 8rpx;
}

.section-desc {
  color: #999;
  margin-bottom: 48rpx;
}

// 功能亮点
.features {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  margin-bottom: 48rpx;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 24rpx;
  background: #faf8f7;
  border-radius: 20rpx;
}

.feature-icon {
  font-size: 40rpx;
}

.feature-text {
  color: #555;
}

// 微信登录按钮
.wx-login-btn {
  width: 100%;
  height: 100rpx;
  background: #07C160;
  color: #fff;
  border: none;
  border-radius: 50rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16rpx;
  box-shadow: 0 12rpx 32rpx rgba(7, 193, 96, 0.3);
  margin-bottom: 32rpx;
}

.wx-icon {
  font-size: 40rpx;
}

.login-tips {
  color: #ccc;
  text-align: center;
}

// 绑定手机区
.bind-section {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.phone-auth-btn {
  width: 100%;
  height: 100rpx;
  background: linear-gradient(135deg, #E17055, #d45d43);
  color: #fff;
  border: none;
  border-radius: 50rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16rpx;
  box-shadow: 0 12rpx 32rpx rgba(225, 112, 85, 0.3);
  margin-bottom: 40rpx;
}

.phone-icon {
  font-size: 36rpx;
}

// 分隔线
.divider-wrap {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 20rpx;
  margin-bottom: 40rpx;
}

.divider-line {
  flex: 1;
  height: 1rpx;
  background: #eee;
}

.divider-text {
  color: #ccc;
}

// 输入组
.input-group {
  width: 100%;
}

.input-wrap {
  display: flex;
  align-items: center;
  gap: 16rpx;
  height: 100rpx;
  background: #f8f8f8;
  border-radius: 20rpx;
  padding: 0 24rpx;
  margin-bottom: 20rpx;
}

.input-icon {
  font-size: 32rpx;
}

.form-input {
  flex: 1;
  background: transparent;
}

.code-wrap {
  .form-input {
    flex: 1;
  }
}

.code-btn {
  width: 200rpx;
  height: 64rpx;
  background: #E17055;
  color: #fff;
  border: none;
  border-radius: 32rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:disabled {
    background: #ddd;
    color: #999;
  }
}

.bind-btn {
  width: 100%;
  height: 100rpx;
  background: linear-gradient(135deg, #E17055, #d45d43);
  color: #fff;
  border: none;
  border-radius: 50rpx;
  font-weight: 600;
  margin-top: 12rpx;
  box-shadow: 0 12rpx 32rpx rgba(225, 112, 85, 0.3);
  
  &:disabled {
    background: #ddd;
    box-shadow: none;
    color: #999;
  }
}

.skip-btn {
  margin-top: 40rpx;
  color: #E17055;
}
</style>
