<template>
  <view class="me-container">
    <!-- 用户信息头部 -->
    <view class="user-header">
      <image class="avatar" :src="userInfo?.avatarUrl || '/static/images/default-avatar.png'" mode="aspectFill"></image>
      <view class="user-info">
        <view class="nickname text-scale-lg">{{ userInfo?.nickname || '未登录' }}</view>
        <view class="user-id text-scale-sm">ID: {{ userInfo?.id || '' }}</view>
        <!-- 认证医师标签 -->
        <view v-if="userInfo?.role === 1" class="doctor-badge">
          <text class="badge-icon">✓</text>
          <text class="text-scale-sm">认证医师</text>
        </view>
      </view>
      <view class="settings-btn" @click="goToSettings">
        <text class="settings-icon">⚙</text>
      </view>
    </view>

    <!-- 数据统计 -->
    <view class="stats-bar">
      <view class="stat-item">
        <text class="stat-value text-scale-lg">{{ learnedCount || 0 }}</text>
        <text class="stat-label text-scale-sm">已学习</text>
      </view>
      <view class="stat-divider"></view>
      <view class="stat-item">
        <text class="stat-value text-scale-lg">{{ collectCount || 0 }}</text>
        <text class="stat-label text-scale-sm">我的收藏</text>
      </view>
      <view class="stat-divider"></view>
      <view class="stat-item">
        <text class="stat-value text-scale-lg">{{ viewCount || 0 }}</text>
        <text class="stat-label text-scale-sm">学习时长(分)</text>
      </view>
    </view>

    <!-- 功能列表 -->
    <view class="function-list">
      <view class="function-item" @click="goToMyLearning">
        <view class="function-left">
          <text class="function-icon">📚</text>
          <text class="function-label text-scale">学习记录</text>
        </view>
        <text class="arrow-icon">›</text>
      </view>

      <view class="function-item" @click="goToMyCollections">
        <view class="function-left">
          <text class="function-icon">⭐</text>
          <text class="function-label text-scale">我的收藏</text>
        </view>
        <text class="arrow-icon">›</text>
      </view>

      <view class="function-item" @click="goToHistory">
        <view class="function-left">
          <text class="function-icon">🕒</text>
          <text class="function-label text-scale">浏览历史</text>
        </view>
        <text class="arrow-icon">›</text>
      </view>

      <view class="function-item" @click="goToCertification" v-if="userInfo?.role !== 1">
        <view class="function-left">
          <text class="function-icon">🏅</text>
          <text class="function-label text-scale">医师认证</text>
        </view>
        <text class="arrow-icon">›</text>
      </view>

      <view class="function-item" @click="contactService">
        <view class="function-left">
          <text class="function-icon">💬</text>
          <text class="function-label text-scale">联系客服</text>
        </view>
        <text class="arrow-icon">›</text>
      </view>
    </view>

    <!-- 登录提示 -->
    <view v-if="!isLoggedIn" class="login-tip">
      <text class="text-scale">登录后查看学习记录</text>
      <button class="login-btn" @click="handleLogin">去登录</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useUserStore } from '@/store/user';
import { getUserInfo } from '@/api/user';

const userStore = useUserStore();

const userInfo = computed(() => userStore.userInfo);
const isLoggedIn = computed(() => userStore.isLoggedIn());

// 学习统计数据
const learnedCount = ref(0);
const collectCount = ref(0);
const viewCount = ref(0);

// 跳转设置
const goToSettings = () => {
  uni.navigateTo({
    url: '/pages/settings/settings',
  });
};

// 跳转学习记录
const goToMyLearning = () => {
  if (!isLoggedIn.value) {
    handleLogin();
    return;
  }
  uni.navigateTo({
    url: '/pages/my-learning/my-learning',
  });
};

// 跳转我的收藏
const goToMyCollections = () => {
  if (!isLoggedIn.value) {
    handleLogin();
    return;
  }
  uni.navigateTo({
    url: '/pages/collections/collections',
  });
};

// 跳转浏览历史
const goToHistory = () => {
  if (!isLoggedIn.value) {
    handleLogin();
    return;
  }
  uni.navigateTo({
    url: '/pages/history/history',
  });
};

// 跳转医师认证
const goToCertification = () => {
  if (!isLoggedIn.value) {
    handleLogin();
    return;
  }
  uni.navigateTo({
    url: '/pages/certification/certification',
  });
};

// 联系客服
const contactService = () => {
  uni.openCustomerServiceChat({
    extInfo: {
      url: '',
    },
    corpId: '',
    success: () => {
      console.log('打开客服成功');
    },
    fail: (err) => {
      console.error('打开客服失败', err);
      uni.showToast({
        title: '客服暂未配置',
        icon: 'none',
      });
    },
  });
};

// 登录
const handleLogin = () => {
  uni.showToast({
    title: '请先登录',
    icon: 'none',
  });
};

// 加载用户信息
const loadUserInfo = async () => {
  if (!isLoggedIn.value) return;

  try {
    const info = await getUserInfo();
    userStore.setUserInfo(info);

    // 更新统计数据（使用已有数据或模拟）
    learnedCount.value = info.learnedCount || 0;
    collectCount.value = info.collectCount || 0;
    viewCount.value = info.viewCount || 0;
  } catch (error) {
    console.error('加载用户信息失败', error);
  }
};

onMounted(() => {
  loadUserInfo();
});
</script>

<style lang="scss" scoped>
.me-container {
  min-height: 100vh;
  background-color: var(--bg-color);
}

.user-header {
  background: linear-gradient(135deg, var(--primary-color) 0%, #A29BFE 100%);
  padding: 60rpx 24rpx 40rpx;
  display: flex;
  align-items: center;
  gap: 24rpx;
}

.avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 60rpx;
  background-color: rgba(255, 255, 255, 0.3);
  border: 4rpx solid rgba(255, 255, 255, 0.5);
}

.user-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.nickname {
  font-weight: bold;
  color: #fff;
}

.user-id {
  color: rgba(255, 255, 255, 0.8);
}

.doctor-badge {
  display: flex;
  align-items: center;
  gap: 8rpx;
  background-color: rgba(255, 215, 0, 0.2);
  padding: 4rpx 12rpx;
  border-radius: 20rpx;
  color: #FFD700;
  width: fit-content;
}

.badge-icon {
  color: #FFD700;
  font-weight: bold;
}

.settings-btn {
  padding: 8rpx;
}

.settings-icon {
  font-size: 32rpx;
  color: rgba(255, 255, 255, 0.8);
}

.stats-bar {
  background-color: #fff;
  margin: -30rpx 24rpx 0;
  padding: 40rpx 0;
  display: flex;
  align-items: center;
  border-radius: 16rpx;
  position: relative;
  z-index: 10;
  box-shadow: 0 4rpx 12rpx rgba(108, 92, 231, 0.1);
}

.stat-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
}

.stat-value {
  font-weight: bold;
  color: var(--primary-color);
}

.stat-label {
  color: var(--text-light);
}

.stat-divider {
  width: 1rpx;
  height: 60rpx;
  background-color: #eee;
}

.function-list {
  background-color: #fff;
  margin: 24rpx;
  padding: 0 24rpx;
  border-radius: 16rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}

.function-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
}

.function-item:last-child {
  border-bottom: none;
}

.function-left {
  display: flex;
  align-items: center;
  gap: 24rpx;
}

.function-icon {
  font-size: 36rpx;
}

.function-label {
  font-size: 32rpx;
  color: var(--text-color);
}

.arrow-icon {
  font-size: 40rpx;
  color: var(--text-light);
  font-weight: 300;
}

.login-tip {
  background-color: #fff;
  margin: 24rpx;
  padding: 60rpx 24rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24rpx;
  border-radius: 16rpx;
}

.login-btn {
  background-color: var(--primary-color);
  color: #fff;
  border: none;
  padding: 20rpx 60rpx;
  border-radius: 40rpx;
  font-size: 32rpx;
}
</style>