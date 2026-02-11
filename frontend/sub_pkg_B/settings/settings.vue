<template>
  <view class="settings-page" :style="{ '--font-scale': fontScale }">
    <!-- 字体设置 -->
    <view class="section">
      <view class="section-header">
        <text class="section-icon">🔤</text>
        <text class="section-title" :style="{ fontSize: `calc(15px * ${fontScale})` }">字体设置</text>
      </view>
      <view class="font-scale-wrap">
        <view 
          v-for="item in fontScales" 
          :key="item.value" 
          class="font-option"
          :class="{ active: fontScale === item.value }"
          @click="setFontScale(item.value)"
        >
          <text :style="{ fontSize: `${14 * item.value}px` }">{{ item.label }}</text>
        </view>
      </view>
      <view class="font-preview">
        <text class="preview-label" :style="{ fontSize: `calc(12px * ${fontScale})` }">预览效果</text>
        <text class="preview-text" :style="{ fontSize: `calc(16px * ${fontScale})` }">
          这是一段预览文字，用于展示当前字体大小效果。健康养生知识分享，让生活更美好。
        </text>
      </view>
    </view>

    <!-- 账号设置 -->
    <view class="section">
      <view class="section-header">
        <text class="section-icon">👤</text>
        <text class="section-title" :style="{ fontSize: `calc(15px * ${fontScale})` }">账号设置</text>
      </view>
      <view class="menu-item" @click="goToProfile">
        <view class="menu-left">
          <text class="menu-emoji">📝</text>
          <text class="menu-label" :style="{ fontSize: `calc(15px * ${fontScale})` }">个人资料</text>
        </view>
        <text class="menu-arrow">›</text>
      </view>
      <view class="menu-item" @click="goToPrivacy">
        <view class="menu-left">
          <text class="menu-emoji">🔐</text>
          <text class="menu-label" :style="{ fontSize: `calc(15px * ${fontScale})` }">隐私设置</text>
        </view>
        <text class="menu-arrow">›</text>
      </view>
    </view>

    <!-- 关于 -->
    <view class="section">
      <view class="section-header">
        <text class="section-icon">ℹ️</text>
        <text class="section-title" :style="{ fontSize: `calc(15px * ${fontScale})` }">关于</text>
      </view>
      <view class="menu-item">
        <view class="menu-left">
          <text class="menu-emoji">📱</text>
          <text class="menu-label" :style="{ fontSize: `calc(15px * ${fontScale})` }">当前版本</text>
        </view>
        <text class="menu-value" :style="{ fontSize: `calc(14px * ${fontScale})` }">1.0.0</text>
      </view>
      <view class="menu-item" @click="goToAgreement">
        <view class="menu-left">
          <text class="menu-emoji">📋</text>
          <text class="menu-label" :style="{ fontSize: `calc(15px * ${fontScale})` }">用户协议</text>
        </view>
        <text class="menu-arrow">›</text>
      </view>
      <view class="menu-item" @click="goToPrivacyPolicy">
        <view class="menu-left">
          <text class="menu-emoji">🛡️</text>
          <text class="menu-label" :style="{ fontSize: `calc(15px * ${fontScale})` }">隐私政策</text>
        </view>
        <text class="menu-arrow">›</text>
      </view>
    </view>

    <!-- 缓存 -->
    <view class="section">
      <view class="menu-item" @click="clearCache">
        <view class="menu-left">
          <text class="menu-emoji">🧹</text>
          <text class="menu-label" :style="{ fontSize: `calc(15px * ${fontScale})` }">清除缓存</text>
        </view>
        <text class="menu-value" :style="{ fontSize: `calc(14px * ${fontScale})` }">{{ cacheSize }}</text>
      </view>
    </view>

    <!-- 退出登录 -->
    <view v-if="userStore.isLoggedIn" class="logout-section" @click="handleLogout">
      <text class="logout-text" :style="{ fontSize: `calc(16px * ${fontScale})` }">退出登录</text>
    </view>

    <!-- 底部安全区 -->
    <view style="height: env(safe-area-inset-bottom);"></view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useThemeStore, FONT_SCALES } from '@/store/theme';
import { useUserStore } from '@/store/user';
import { storeToRefs } from 'pinia';

const themeStore = useThemeStore();
const userStore = useUserStore();
const { fontScale } = storeToRefs(themeStore);

const fontScales = FONT_SCALES;
const cacheSize = ref('0KB');

const setFontScale = (value: number) => {
  themeStore.setFontScale(value);
};

const getCacheSize = () => {
  try {
    const info = uni.getStorageInfoSync();
    cacheSize.value = `${(info.currentSize / 1024).toFixed(2)}MB`;
  } catch {
    cacheSize.value = '0KB';
  }
};

const clearCache = () => {
  uni.showModal({
    title: '提示',
    content: '确定清除缓存吗？',
    success: (res) => {
      if (res.confirm) {
        uni.clearStorageSync();
        themeStore.initFontScale();
        getCacheSize();
        uni.showToast({ title: '已清除', icon: 'success' });
      }
    },
  });
};

const goToProfile = () => uni.navigateTo({ url: '/sub_pkg_B/settings/settings?tab=profile' });
const goToPrivacy = () => uni.navigateTo({ url: '/sub_pkg_B/settings/settings?tab=privacy' });
const goToAgreement = () => uni.navigateTo({ url: '/sub_pkg_B/settings/settings?tab=agreement' });
const goToPrivacyPolicy = () => uni.navigateTo({ url: '/sub_pkg_B/settings/settings?tab=policy' });

const handleLogout = () => {
  uni.showModal({
    title: '提示',
    content: '确定退出登录吗？',
    success: (res) => {
      if (res.confirm) {
        userStore.logout();
        uni.showToast({ title: '已退出', icon: 'none' });
        uni.switchTab({ url: '/pages/index/index' });
      }
    },
  });
};

onMounted(() => getCacheSize());
</script>

<style lang="scss" scoped>
.settings-page {
  min-height: 100vh;
  background: #f5f6f8;
  padding: 24rpx;
}

.section {
  background: #fff;
  border-radius: 24rpx;
  margin-bottom: 24rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
}

.section-header {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 28rpx 28rpx 16rpx;
}

.section-icon {
  font-size: 32rpx;
}

.section-title {
  font-weight: 600;
  color: #1a1a1a;
}

// 字体缩放选项
.font-scale-wrap {
  display: flex;
  gap: 16rpx;
  padding: 0 28rpx 24rpx;
}

.font-option {
  flex: 1;
  height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f6f8;
  border-radius: 16rpx;
  color: #666;
  transition: all 0.2s;
  
  &.active {
    background: linear-gradient(135deg, #E17055, #d45d43);
    color: #fff;
    box-shadow: 0 6rpx 20rpx rgba(225, 112, 85, 0.3);
  }
}

.font-preview {
  margin: 0 28rpx 28rpx;
  padding: 24rpx;
  background: #faf8f7;
  border-radius: 16rpx;
}

.preview-label {
  display: block;
  color: #999;
  margin-bottom: 12rpx;
}

.preview-text {
  display: block;
  line-height: 1.8;
  color: #333;
}

// 菜单项
.menu-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28rpx;
  border-bottom: 1rpx solid #f5f5f5;
  
  &:last-child {
    border-bottom: none;
  }
  
  &:active {
    background: #fafafa;
  }
}

.menu-left {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.menu-emoji {
  font-size: 36rpx;
}

.menu-label {
  color: #333;
}

.menu-value {
  color: #999;
}

.menu-arrow {
  font-size: 36rpx;
  color: #ccc;
}

// 退出登录
.logout-section {
  background: #fff;
  border-radius: 24rpx;
  padding: 32rpx;
  text-align: center;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
  
  &:active {
    background: #fafafa;
  }
}

.logout-text {
  color: #E17055;
  font-weight: 500;
}
</style>
