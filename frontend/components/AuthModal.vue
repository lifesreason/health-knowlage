<template>
  <view class="auth-modal" @click="$emit('close')">
    <view class="modal-content" @click.stop>
      <!-- 顶部装饰 -->
      <view class="modal-header">
        <view class="header-bg"></view>
        <view class="header-icon">
          <image class="header-icon-image" src="/static/icons/section-user.png" mode="aspectFit"></image>
        </view>
        <view class="close-btn" @click="$emit('close')">
          <image class="close-btn-image" src="/static/icons/common-close-white.png" mode="aspectFit"></image>
        </view>
      </view>
      
      <!-- 内容区 -->
      <view class="modal-body">
        <text class="modal-title">登录银龄健康</text>
        <text class="modal-desc">登录后可享受更多专属服务</text>
        
        <!-- 功能列表 -->
        <view class="features">
          <view class="feature-item">
            <view class="feature-icon">
              <image class="feature-icon-image" src="/static/icons/quick-post.png" mode="aspectFit"></image>
            </view>
            <text class="feature-text">发布健康话题</text>
          </view>
          <view class="feature-item">
            <view class="feature-icon">
              <image class="feature-icon-image" src="/static/icons/feed-like-active.png" mode="aspectFit"></image>
            </view>
            <text class="feature-text">点赞收藏内容</text>
          </view>
          <view class="feature-item">
            <view class="feature-icon">
              <image class="feature-icon-image" src="/static/icons/quick-circle.png" mode="aspectFit"></image>
            </view>
            <text class="feature-text">加入健康圈子</text>
          </view>
        </view>
        
        <!-- 登录按钮 -->
        <button class="login-btn" @click="goToLogin">
          <text>立即登录</text>
        </button>
        
        <text class="skip-text" @click="$emit('close')">稍后再说</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
const emit = defineEmits(['close']);

const goToLogin = () => {
  emit('close');
  uni.navigateTo({ url: '/sub_pkg_B/auth/auth' });
};
</script>

<style lang="scss" scoped>
.auth-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-content {
  width: 85%;
  background: #fff;
  border-radius: 32rpx;
  overflow: hidden;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(40rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  position: relative;
  height: 200rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.header-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #E17055 0%, #d45d43 100%);
}

.header-icon {
  position: relative;
  width: 90rpx;
  height: 90rpx;
  border-radius: 24rpx;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
}

.header-icon-image {
  width: 46rpx;
  height: 46rpx;
}

.close-btn {
  position: absolute;
  top: 24rpx;
  right: 24rpx;
  width: 88rpx;
  height: 88rpx;
  border-radius: 44rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;

  &::before {
    content: '';
    width: 48rpx;
    height: 48rpx;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    position: absolute;
  }
}

.close-btn-image {
  width: 24rpx;
  height: 24rpx;
  position: relative;
  z-index: 1;
}

.modal-body {
  padding: 40rpx 40rpx 48rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.modal-title {
  font-size: 40rpx;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 12rpx;
}

.modal-desc {
  font-size: 28rpx;
  color: #999;
  margin-bottom: 40rpx;
}

.features {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  margin-bottom: 40rpx;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 20rpx 24rpx;
  background: #f8f9fa;
  border-radius: 16rpx;
}

.feature-icon {
  width: 42rpx;
  height: 42rpx;
  border-radius: 12rpx;
  background: #eef2f5;
  display: flex;
  align-items: center;
  justify-content: center;
}

.feature-icon-image {
  width: 24rpx;
  height: 24rpx;
}

.feature-text {
  font-size: 28rpx;
  color: #333;
}

.login-btn {
  width: 100%;
  height: 96rpx;
  background: linear-gradient(135deg, #E17055, #d45d43);
  border: none;
  border-radius: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  font-weight: 600;
  color: #fff;
  box-shadow: 0 12rpx 32rpx rgba(225, 112, 85, 0.4);
  margin-bottom: 24rpx;
}

.skip-text {
  font-size: 28rpx;
  color: #999;
}
</style>
