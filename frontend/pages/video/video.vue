<template>
  <view class="video-container">
    <swiper 
      class="video-swiper"
      :vertical="true"
      :duration="300"
      :current="currentIndex"
      @change="onSwiperChange"
    >
      <swiper-item v-for="(item, index) in videoList" :key="item.id">
        <view class="video-item">
          <!-- 视频播放器 -->
          <video 
            class="video-player"
            :src="item.videoUrl"
            :poster="item.coverUrl"
            :autoplay="index === currentIndex"
            :controls="false"
            :show-center-play-btn="false"
            :enable-progress-gesture="false"
            :show-play-btn="false"
            object-fit="contain"
            @click="togglePlay"
            @ended="onVideoEnded"
          ></video>

          <!-- 暂停图标 -->
          <view v-if="!playing && !ended" class="play-icon">
            <text class="play-symbol">▶</text>
          </view>

          <!-- 播放结束提示 -->
          <view v-if="ended" class="ended-tip">
            <text class="text-scale">播放完成，下滑看下一个</text>
          </view>

          <!-- 侧边栏 -->
          <view class="sidebar">
            <!-- 头像 -->
            <view class="sidebar-item avatar-item" @click="goToUserProfile(item.userId)">
              <image class="avatar" :src="item.user?.avatarUrl || '/static/images/default-avatar.png'" mode="aspectFill"></image>
              <view class="follow-btn" @click.stop="toggleFollow(item.userId)">
                <text class="follow-symbol">+</text>
              </view>
            </view>

            <!-- 点赞 -->
            <view class="sidebar-item" @click="toggleLike(item)">
              <text class="sidebar-icon" :style="{ color: item.liked ? '#ff4757' : '#fff' }">
                {{ item.liked ? '❤' : '♡' }}
              </text>
              <text class="sidebar-text text-scale-sm">{{ item.likeCount }}</text>
            </view>

            <!-- 评论 -->
            <view class="sidebar-item" @click="openComment(item.id)">
              <text class="sidebar-icon">💬</text>
              <text class="sidebar-text text-scale-sm">{{ item.commentCount }}</text>
            </view>

            <!-- 收藏 -->
            <view class="sidebar-item" @click="toggleCollect(item)">
              <text class="sidebar-icon" :style="{ color: item.collected ? '#ffd700' : '#fff' }">
                {{ item.collected ? '★' : '☆' }}
              </text>
              <text class="sidebar-text text-scale-sm">{{ item.collectCount }}</text>
            </view>

            <!-- 分享 -->
            <view class="sidebar-item" @click="shareVideo(item)">
              <text class="sidebar-icon">↗</text>
              <text class="sidebar-text text-scale-sm">分享</text>
            </view>
          </view>

          <!-- 底部信息 -->
          <view class="bottom-info">
            <view class="video-title text-scale">{{ item.title }}</view>
            <view class="user-name text-scale">@{{ item.user?.nickname }}</view>
            <view class="video-desc text-scale-sm">{{ item.description }}</view>
          </view>
        </view>
      </swiper-item>
    </swiper>

    <!-- 评论弹窗 -->
    <comment-modal
      :show="showComment"
      :post-id="currentPostId"
      @update:show="showComment = $event"
      @update="loadVideoList"
    />
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { likePost, unlikePost, collectPost, uncollectPost } from '@/api/feed';
import { useUserStore } from '@/store/user';

const userStore = useUserStore();

const currentIndex = ref(0);
const playing = ref(false);
const ended = ref(false);
const videoList = ref<any[]>([]);
const showComment = ref(false);
const currentPostId = ref(0);

// 加载视频列表
const loadVideoList = async () => {
  try {
    // TODO: 调用视频列表接口
    videoList.value = [
      {
        id: 1,
        videoUrl: '',
        coverUrl: '',
        title: '示例视频',
        description: '这是一个示例视频',
        userId: 1,
        user: {
          nickname: '测试用户',
          avatarUrl: '/static/images/default-avatar.png',
        },
        likeCount: 100,
        commentCount: 50,
        collectCount: 20,
        liked: false,
        collected: false,
        followed: false,
      },
    ];
  } catch (error) {
    console.error('加载视频列表失败', error);
  }
};

// Swiper 切换
const onSwiperChange = (e: any) => {
  currentIndex.value = e.detail.current;
  playing.value = false;
  ended.value = false;
};

// 播放/暂停
const togglePlay = () => {
  playing.value = !playing.value;
  ended.value = false;
};

// 视频结束
const onVideoEnded = () => {
  ended.value = true;
  playing.value = false;
};

// 点赞
const toggleLike = async (item: any) => {
  if (!userStore.isLoggedIn) {
    uni.showToast({ title: '请先登录', icon: 'none' });
    return;
  }

  try {
    if (item.liked) {
      await unlikePost(item.id);
      item.liked = false;
      item.likeCount--;
    } else {
      await likePost(item.id);
      item.liked = true;
      item.likeCount++;
    }
  } catch (error) {
    console.error('点赞失败', error);
  }
};

// 收藏
const toggleCollect = async (item: any) => {
  if (!userStore.isLoggedIn) {
    uni.showToast({ title: '请先登录', icon: 'none' });
    return;
  }

  try {
    if (item.collected) {
      await uncollectPost(item.id);
      item.collected = false;
      item.collectCount--;
    } else {
      await collectPost(item.id);
      item.collected = true;
      item.collectCount++;
    }
  } catch (error) {
    console.error('收藏失败', error);
  }
};

// 关注
const toggleFollow = (userId: number) => {
  if (!userStore.isLoggedIn) {
    uni.showToast({ title: '请先登录', icon: 'none' });
    return;
  }
  uni.showToast({ title: '关注功能待实现', icon: 'none' });
};

// 打开评论
const openComment = (postId: number) => {
  if (!userStore.isLoggedIn) {
    uni.showToast({ title: '请先登录', icon: 'none' });
    return;
  }
  currentPostId.value = postId;
  showComment.value = true;
};

// 分享
const shareVideo = (item: any) => {
  uni.shareAppMessage({
    title: item.title,
    path: `/pages/detail/detail?id=${item.id}`,
    imageUrl: item.coverUrl,
  });
};

// 跳转用户主页
const goToUserProfile = (userId: number) => {
  uni.navigateTo({
    url: `/pages/me/me?userId=${userId}`,
  });
};

onMounted(() => {
  loadVideoList();
});
</script>

<style lang="scss" scoped>
.video-container {
  width: 100%;
  height: 100vh;
  background-color: #000;
}

.video-swiper {
  width: 100%;
  height: 100%;
}

.video-item {
  width: 100%;
  height: 100%;
  position: relative;
}

.video-player {
  width: 100%;
  height: 100%;
}

.play-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 10;
  
  .play-symbol {
    font-size: 120rpx;
    color: rgba(255, 255, 255, 0.8);
  }
}

.ended-tip {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 10;
  text-align: center;

  text {
    color: #fff;
    background-color: rgba(0, 0, 0, 0.5);
    padding: 20rpx 40rpx;
    border-radius: 40rpx;
  }
}

.sidebar {
  position: absolute;
  right: 24rpx;
  bottom: 200rpx;
  display: flex;
  flex-direction: column;
  gap: 40rpx;
  z-index: 10;
}

.sidebar-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
}

.avatar-item {
  position: relative;
}

.avatar {
  width: 96rpx;
  height: 96rpx;
  border-radius: 48rpx;
  border: 4rpx solid #fff;
}

.follow-btn {
  position: absolute;
  bottom: -10rpx;
  width: 40rpx;
  height: 40rpx;
  background-color: #ff4757;
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  
  .follow-symbol {
    color: #fff;
    font-size: 24rpx;
    font-weight: bold;
  }
}

.sidebar-icon {
  font-size: 48rpx;
  text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.5);
}

.sidebar-text {
  color: #fff;
  font-size: 24rpx;
  text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.5);
}

.bottom-info {
  position: absolute;
  left: 24rpx;
  right: 150rpx;
  bottom: 100rpx;
  z-index: 10;
}

.video-title {
  color: #fff;
  font-weight: bold;
  margin-bottom: 12rpx;
  text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.5);
}

.user-name {
  color: #fff;
  margin-bottom: 8rpx;
  text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.5);
}

.video-desc {
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.6;
  text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.5);
}
</style>