<template>
  <view class="me-page" :style="{ '--font-scale': fontScale }">
    <!-- 顶部用户卡片 -->
    <view class="profile-card">
      <!-- 背景装饰 -->
      <view class="card-bg"></view>
      
      <!-- 用户信息 -->
      <view class="user-section">
        <view class="avatar-wrapper" @click="goToSettings">
          <image 
            class="user-avatar" 
            :src="userInfo?.avatarUrl || '/static/default-avatar.png'" 
            mode="aspectFill"
          ></image>
          <view v-if="userStore.isDoctor" class="verified-badge">
            <text>✓</text>
          </view>
        </view>
        
        <view class="user-info" @click="goToSettings">
          <view class="name-row">
            <text class="user-name" :style="{ fontSize: `calc(20px * ${fontScale})` }">
              {{ userInfo?.nickname || '点击登录' }}
            </text>
            <view v-if="userStore.isDoctor" class="doctor-tag">
              <text>认证医师</text>
            </view>
          </view>
          <text class="user-bio" :style="{ fontSize: `calc(13px * ${fontScale})` }">
            {{ userInfo ? (userInfo.bio || '这个人很懒，什么都没写~') : '登录后享受更多服务' }}
          </text>
        </view>
        
        <view class="edit-btn" @click="goToSettings">
          <text>编辑</text>
        </view>
      </view>

      <!-- 数据统计 -->
      <view class="stats-section">
        <view class="stat-item" @click="goToStats('following')">
          <text class="stat-value" :style="{ fontSize: `calc(22px * ${fontScale})` }">{{ stats.following }}</text>
          <text class="stat-label" :style="{ fontSize: `calc(12px * ${fontScale})` }">关注</text>
        </view>
        <view class="stat-divider"></view>
        <view class="stat-item" @click="goToStats('followers')">
          <text class="stat-value" :style="{ fontSize: `calc(22px * ${fontScale})` }">{{ stats.followers || 0 }}</text>
          <text class="stat-label" :style="{ fontSize: `calc(12px * ${fontScale})` }">粉丝</text>
        </view>
        <view class="stat-divider"></view>
        <view class="stat-item" @click="goToStats('likes')">
          <text class="stat-value" :style="{ fontSize: `calc(22px * ${fontScale})` }">{{ stats.likesReceived }}</text>
          <text class="stat-label" :style="{ fontSize: `calc(12px * ${fontScale})` }">获赞</text>
        </view>
      </view>
    </view>

    <!-- 快捷功能 -->
    <view class="quick-section">
      <view class="section-header">
        <text class="section-title" :style="{ fontSize: `calc(16px * ${fontScale})` }">我的内容</text>
      </view>
      <view class="quick-grid">
        <view class="quick-item" @click="goToMyPosts">
          <view class="quick-icon-wrapper" style="background: linear-gradient(135deg, #74b9ff, #0984e3)">
            <text class="quick-icon">文</text>
          </view>
          <text class="quick-text" :style="{ fontSize: `calc(13px * ${fontScale})` }">我的发布</text>
        </view>
        <view class="quick-item" @click="goToCollections">
          <view class="quick-icon-wrapper" style="background: linear-gradient(135deg, #ffeaa7, #fdcb6e)">
            <text class="quick-icon">藏</text>
          </view>
          <text class="quick-text" :style="{ fontSize: `calc(13px * ${fontScale})` }">我的收藏</text>
        </view>
        <view class="quick-item" @click="goToHistory">
          <view class="quick-icon-wrapper" style="background: linear-gradient(135deg, #a29bfe, #6c5ce7)">
            <text class="quick-icon">迹</text>
          </view>
          <text class="quick-text" :style="{ fontSize: `calc(13px * ${fontScale})` }">浏览历史</text>
        </view>
        <view class="quick-item" @click="goToCircles">
          <view class="quick-icon-wrapper" style="background: linear-gradient(135deg, #55efc4, #00b894)">
            <text class="quick-icon">圈</text>
          </view>
          <text class="quick-text" :style="{ fontSize: `calc(13px * ${fontScale})` }">我的圈子</text>
        </view>
      </view>
    </view>

    <!-- 设置列表 -->
    <view class="settings-section">
      <view class="settings-group">
        <view class="settings-item" @click="goToFontSettings">
          <view class="item-left">
            <text class="item-icon">A</text>
            <text class="item-text" :style="{ fontSize: `calc(15px * ${fontScale})` }">字体大小</text>
          </view>
          <view class="item-right">
            <text class="item-value" :style="{ fontSize: `calc(14px * ${fontScale})` }">{{ currentScaleLabel }}</text>
            <text class="item-arrow">›</text>
          </view>
        </view>
        
        <button class="settings-item settings-contact-btn" open-type="contact" @click="contactService">
          <view class="item-left">
            <text class="item-icon">客</text>
            <text class="item-text" :style="{ fontSize: `calc(15px * ${fontScale})` }">联系客服</text>
          </view>
          <view class="item-right">
            <text class="item-arrow">›</text>
          </view>
        </button>
        
        <view class="settings-item" @click="goToAbout">
          <view class="item-left">
            <text class="item-icon">i</text>
            <text class="item-text" :style="{ fontSize: `calc(15px * ${fontScale})` }">关于我们</text>
          </view>
          <view class="item-right">
            <text class="item-value" :style="{ fontSize: `calc(13px * ${fontScale})` }">v1.0.0</text>
            <text class="item-arrow">›</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 退出登录 -->
    <view v-if="userStore.isLoggedIn" class="logout-section">
      <view class="logout-btn" @click="handleLogout">
        <text class="logout-text" :style="{ fontSize: `calc(15px * ${fontScale})` }">退出登录</text>
      </view>
    </view>

    <!-- 底部安全区 -->
    <view class="safe-bottom"></view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { useThemeStore } from '@/store/theme';
import { useUserStore } from '@/store/user';
import { storeToRefs } from 'pinia';
import { userApi } from '@/api';

const themeStore = useThemeStore();
const userStore = useUserStore();
const { fontScale, currentScaleLabel } = storeToRefs(themeStore);
const { userInfo, isLoggedIn } = storeToRefs(userStore);

// 用户统计数据
const stats = ref({
  likesReceived: 0,
  following: 0,
  followers: 0,
  circles: 0,
});

// 加载用户数据
const loadUserStats = async () => {
  if (!userStore.isLoggedIn) return;

  try {
    const res = await userApi.getStats();
    stats.value = {
      likesReceived: res.likesReceived || 0,
      following: res.following || 0,
      followers: res.followers || 0,
      circles: res.circles || 0,
    };
  } catch (error) {
    console.error('加载用户统计失败', error);
  }
};

// 跳转我的发布
const goToMyPosts = () => {
  if (!userStore.requireLogin()) return;
  uni.navigateTo({ url: '/sub_pkg_B/settings/settings?tab=posts' });
};

// 跳转浏览历史
const goToHistory = () => {
  if (!userStore.requireLogin()) return;
  uni.navigateTo({ url: '/sub_pkg_B/settings/settings?tab=history' });
};

// 跳转我的收藏
const goToCollections = () => {
  if (!userStore.requireLogin()) return;
  uni.navigateTo({ url: '/sub_pkg_B/settings/settings?tab=collections' });
};

// 跳转我的圈子
const goToCircles = () => {
  if (!userStore.requireLogin()) return;
  uni.navigateTo({ url: '/sub_pkg_B/settings/settings?tab=circles' });
};

// 跳转统计详情
const goToStats = (type: string) => {
  if (!userStore.requireLogin()) return;
  uni.navigateTo({ url: `/sub_pkg_B/settings/settings?tab=${type}` });
};

// 联系客服
const contactService = () => {
  if (typeof wx !== 'undefined') return;
  uni.showActionSheet({
    itemList: ['在线客服', '复制客服邮箱'],
    success: (res) => {
      if (res.tapIndex === 1) {
        uni.setClipboardData({
          data: 'support@silverhealth.local',
          success: () => uni.showToast({ title: '已复制客服邮箱', icon: 'none' }),
        });
      }
    },
  });
};

// 跳转字体设置
const goToFontSettings = () => {
  uni.navigateTo({ url: '/sub_pkg_B/settings/settings?tab=font' });
};

// 跳转设置
const goToSettings = () => {
  if (!userStore.isLoggedIn) {
    uni.navigateTo({ url: '/sub_pkg_B/auth/auth' });
    return;
  }
  uni.navigateTo({ url: '/sub_pkg_B/settings/settings' });
};

// 跳转关于
const goToAbout = () => {
  uni.navigateTo({ url: '/sub_pkg_B/settings/settings?tab=about' });
};

// 退出登录
const handleLogout = () => {
  uni.showModal({
    title: '提示',
    content: '确定要退出登录吗？',
    success: (res) => {
      if (res.confirm) {
        userStore.logout();
        uni.showToast({ title: '已退出登录', icon: 'none' });
      }
    },
  });
};

onMounted(() => {
  loadUserStats();
});

onShow(() => {
  loadUserStats();
});
</script>

<style lang="scss" scoped>
.me-page {
  min-height: 100vh;
  background: #f5f6f8;
}

// 用户卡片
.profile-card {
  position: relative;
  background: #fff;
  margin: 24rpx;
  border-radius: 32rpx;
  overflow: hidden;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.06);
}

.card-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 200rpx;
  background: linear-gradient(135deg, #E17055 0%, #d45d43 100%);
}

.user-section {
  position: relative;
  display: flex;
  align-items: flex-end;
  padding: 32rpx;
  padding-top: 120rpx;
  gap: 20rpx;
}

.avatar-wrapper {
  position: relative;
}

.user-avatar {
  width: 140rpx;
  height: 140rpx;
  border-radius: 50%;
  border: 6rpx solid #fff;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.15);
}

.verified-badge {
  position: absolute;
  bottom: 4rpx;
  right: 4rpx;
  width: 36rpx;
  height: 36rpx;
  background: linear-gradient(135deg, #00b894, #00a085);
  border-radius: 50%;
  border: 4rpx solid #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20rpx;
  color: #fff;
}

.user-info {
  flex: 1;
  padding-bottom: 8rpx;
}

.name-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 8rpx;
}

.user-name {
  font-weight: 700;
  color: #1a1a1a;
}

.doctor-tag {
  background: linear-gradient(135deg, #ffeaa7, #fdcb6e);
  padding: 4rpx 16rpx;
  border-radius: 16rpx;
  font-size: 20rpx;
  color: #8b6914;
  font-weight: 600;
}

.user-bio {
  color: #999;
  display: block;
}

.edit-btn {
  background: #f5f5f5;
  padding: 12rpx 28rpx;
  border-radius: 28rpx;
  font-size: 26rpx;
  color: #666;
  margin-bottom: 8rpx;
}

// 统计数据
.stats-section {
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 32rpx;
  border-top: 1rpx solid #f5f5f5;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  flex: 1;
}

.stat-value {
  font-weight: 700;
  color: #1a1a1a;
}

.stat-label {
  color: #999;
}

.stat-divider {
  width: 1rpx;
  height: 48rpx;
  background: #eee;
}

// 快捷功能
.quick-section {
  background: #fff;
  margin: 0 24rpx 24rpx;
  border-radius: 24rpx;
  padding: 28rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.04);
}

.section-header {
  margin-bottom: 24rpx;
}

.section-title {
  font-weight: 600;
  color: #1a1a1a;
}

.quick-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20rpx;
}

.quick-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
}

.quick-icon-wrapper {
  width: 88rpx;
  height: 88rpx;
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.quick-icon {
  font-size: 28rpx;
  color: #fff;
  font-weight: 700;
}

.quick-text {
  color: #666;
}

// 设置列表
.settings-section {
  margin: 0 24rpx;
}

.settings-group {
  background: #fff;
  border-radius: 24rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.04);
}

.settings-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32rpx 28rpx;
  border-bottom: 1rpx solid #f5f5f5;
  
  &:last-child {
    border-bottom: none;
  }
}

.item-left {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.item-icon {
  width: 44rpx;
  height: 44rpx;
  border-radius: 12rpx;
  background: #f6efe9;
  color: #c5664d;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  font-weight: 700;
}

.item-text {
  color: #333;
}

.item-right {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.item-value {
  color: #999;
}

.item-arrow {
  font-size: 32rpx;
  color: #ccc;
}

.settings-contact-btn {
  width: 100%;
  border: none;
  background: #fff;
  text-align: left;
  border-radius: 0;

  &::after {
    border: none;
  }
}

// 退出登录
.logout-section {
  margin: 32rpx 24rpx;
}

.logout-btn {
  background: #fff;
  border-radius: 24rpx;
  padding: 32rpx;
  text-align: center;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.04);
}

.logout-text {
  color: #E17055;
  font-weight: 500;
}

// 安全区
.safe-bottom {
  height: calc(120rpx + env(safe-area-inset-bottom));
}
</style>
