<template>
  <view class="detail-container">
    <!-- 加载状态 -->
    <view v-if="loading" class="loading">
      <text class="loading-text text-scale">加载中...</text>
    </view>

    <!-- 内容展示 -->
    <view v-else-if="postDetail" class="detail-content">
      <!-- 作者信息 -->
      <view class="author-bar">
        <image class="avatar" :src="postDetail.user?.avatarUrl || '/static/images/default-avatar.png'" mode="aspectFill" @click="goToUserProfile(postDetail.userId)"></image>
        <view class="author-info" @click="goToUserProfile(postDetail.userId)">
          <view class="author-name text-scale">{{ postDetail.user?.nickname }}</view>
          <view class="publish-time text-scale-sm">{{ formatTime(postDetail.createdAt) }}</view>
        </view>
        <view class="follow-btn" @click="toggleFollow" v-if="!postDetail.user?.isMe">
          <text class="text-scale-sm">{{ postDetail.user?.followed ? '已关注' : '关注' }}</text>
        </view>
      </view>

      <!-- 标题 -->
      <view v-if="postDetail.title" class="post-title text-scale-lg">{{ postDetail.title }}</view>

      <!-- 内容 -->
      <view class="post-content text-scale">
        <text>{{ postDetail.content }}</text>
      </view>

      <!-- 媒体内容 -->
      <view v-if="postDetail.type === 2 && postDetail.videoUrl" class="media-section">
        <video class="video-player" :src="postDetail.videoUrl" :poster="postDetail.videoMeta?.coverUrl" object-fit="contain"></video>
      </view>
      <view v-else-if="postDetail.mediaUrls && postDetail.mediaUrls.length > 0" class="media-section">
        <image
          v-for="(img, index) in postDetail.mediaUrls"
          :key="index"
          class="post-image"
          :src="img"
          mode="widthFix"
          @click="previewImage(index)"
        ></image>
      </view>

      <!-- 话题标签 -->
      <view v-if="postDetail.topics && postDetail.topics.length > 0" class="topics-section">
        <view
          v-for="(topic, index) in postDetail.topics"
          :key="index"
          class="topic-tag"
          @click="searchTopic(topic)"
        >
          <text class="text-scale-sm"># {{ topic }}</text>
        </view>
      </view>

      <!-- 圈子信息 -->
      <view v-if="postDetail.circle" class="circle-info" @click="goToCircle(postDetail.circle.id)">
        <image class="circle-cover" :src="postDetail.circle.coverUrl || '/static/images/default-circle.png'" mode="aspectFill"></image>
        <view class="circle-detail">
          <view class="circle-name text-scale">{{ postDetail.circle.name }}</view>
          <view class="circle-desc text-scale-sm">{{ postDetail.circle.description }}</view>
        </view>
        <text class="arrow-icon">›</text>
      </view>

      <!-- 操作栏 -->
      <view class="action-bar">
        <view class="action-item" @click="toggleLike">
          <text class="action-icon" :style="{ color: postDetail.liked ? '#ff4757' : '#999' }">
            {{ postDetail.liked ? '❤' : '♡' }}
          </text>
          <text class="action-text text-scale-sm">{{ postDetail.likeCount || 0 }}</text>
        </view>
        <view class="action-item" @click="openComment">
          <text class="action-icon">💬</text>
          <text class="action-text text-scale-sm">{{ postDetail.commentCount || 0 }}</text>
        </view>
        <view class="action-item" @click="toggleCollect">
          <text class="action-icon" :style="{ color: postDetail.collected ? '#ffd700' : '#999' }">
            {{ postDetail.collected ? '★' : '☆' }}
          </text>
          <text class="action-text text-scale-sm">{{ postDetail.collected || 0 }}</text>
        </view>
        <view class="action-item" @click="sharePost">
          <text class="action-icon">↗</text>
          <text class="action-text text-scale-sm">分享</text>
        </view>
      </view>

      <!-- 评论区 -->
      <view class="comment-section">
        <view class="section-header text-scale">评论 ({{ postDetail.commentCount || 0 }})</view>
        <view v-if="postDetail.commentCount > 0" class="comment-list">
          <view
            v-for="comment in comments"
            :key="comment.id"
            class="comment-item"
          >
            <image class="comment-avatar" :src="comment.user?.avatarUrl || '/static/images/default-avatar.png'" mode="aspectFill"></image>
            <view class="comment-content">
              <view class="comment-user text-scale">{{ comment.user?.nickname }}</view>
              <view class="comment-text text-scale">{{ comment.content }}</view>
              <view class="comment-meta text-scale-sm">
                <text>{{ formatTime(comment.createdAt) }}</text>
                <text @click="replyComment(comment)">回复</text>
              </view>
            </view>
          </view>
        </view>
        <view v-else class="empty-comment text-scale-sm">暂无评论，快来抢沙发吧</view>
      </view>
    </view>

    <!-- 评论弹窗 -->
    <comment-modal
      :show="showComment"
      :post-id="postId"
      @update:show="showComment = $event"
      @update="loadDetail"
    />
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { getPostDetail, likePost, unlikePost, collectPost, uncollectPost } from '@/api/feed';
import { getComments } from '@/api/comment';
import { useUserStore } from '@/store/user';

const userStore = useUserStore();

const postId = ref(0);
const loading = ref(true);
const postDetail = ref<any>(null);
const comments = ref<any[]>([]);
const showComment = ref(false);

// 加载详情
const loadDetail = async () => {
  loading.value = true;
  try {
    postDetail.value = await getPostDetail(postId.value);
    await loadComments();
  } catch (error) {
    console.error('加载详情失败', error);
    uni.showToast({ title: '加载失败', icon: 'none' });
  } finally {
    loading.value = false;
  }
};

// 加载评论
const loadComments = async () => {
  try {
    const data = await getComments({
      postId: postId.value,
      page: 1,
      pageSize: 10,
    });
    comments.value = data.list || [];
  } catch (error) {
    console.error('加载评论失败', error);
  }
};

// 点赞
const toggleLike = async () => {
  if (!userStore.isLoggedIn) {
    uni.showToast({ title: '请先登录', icon: 'none' });
    return;
  }

  try {
    if (postDetail.value.liked) {
      await unlikePost(postId.value);
      postDetail.value.liked = false;
      postDetail.value.likeCount--;
    } else {
      await likePost(postId.value);
      postDetail.value.liked = true;
      postDetail.value.likeCount++;
    }
  } catch (error) {
    console.error('点赞失败', error);
  }
};

// 收藏
const toggleCollect = async () => {
  if (!userStore.isLoggedIn) {
    uni.showToast({ title: '请先登录', icon: 'none' });
    return;
  }

  try {
    if (postDetail.value.collected) {
      await uncollectPost(postId.value);
      postDetail.value.collected = false;
      postDetail.value.collectCount--;
    } else {
      await collectPost(postId.value);
      postDetail.value.collected = true;
      postDetail.value.collectCount++;
    }
  } catch (error) {
    console.error('收藏失败', error);
  }
};

// 关注
const toggleFollow = () => {
  if (!userStore.isLoggedIn) {
    uni.showToast({ title: '请先登录', icon: 'none' });
    return;
  }
  uni.showToast({ title: '关注功能待实现', icon: 'none' });
};

// 打开评论
const openComment = () => {
  if (!userStore.isLoggedIn) {
    uni.showToast({ title: '请先登录', icon: 'none' });
    return;
  }
  showComment.value = true;
};

// 回复评论
const replyComment = (comment: any) => {
  if (!userStore.isLoggedIn) {
    uni.showToast({ title: '请先登录', icon: 'none' });
    return;
  }
  showComment.value = true;
};

// 分享
const sharePost = () => {
  uni.shareAppMessage({
    title: postDetail.value?.title || '银龄健康',
    path: `/pages/detail/detail?id=${postId.value}`,
    imageUrl: postDetail.value?.mediaUrls?.[0] || '',
  });
};

// 预览图片
const previewImage = (index: number) => {
  uni.previewImage({
    current: index,
    urls: postDetail.value.mediaUrls || [],
  });
};

// 搜索话题
const searchTopic = (topic: string) => {
  uni.showToast({ title: `搜索话题：${topic}`, icon: 'none' });
};

// 跳转用户主页
const goToUserProfile = (userId: number) => {
  uni.navigateTo({
    url: `/pages/me/me?userId=${userId}`,
  });
};

// 跳转圈子
const goToCircle = (circleId: number) => {
  uni.navigateTo({
    url: `/pages/circle-detail/circle-detail?id=${circleId}`,
  });
};

// 格式化时间
const formatTime = (time: string) => {
  const now = Date.now();
  const diff = now - new Date(time).getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) {
    return '刚刚';
  } else if (diff < hour) {
    return `${Math.floor(diff / minute)}分钟前`;
  } else if (diff < day) {
    return `${Math.floor(diff / hour)}小时前`;
  } else if (diff < day * 7) {
    return `${Math.floor(diff / day)}天前`;
  } else {
    return new Date(time).toLocaleDateString();
  }
};

onLoad((options: any) => {
  if (options.id) {
    postId.value = +options.id;
    loadDetail();
  }
});
</script>

<style lang="scss" scoped>
.detail-container {
  min-height: 100vh;
  background-color: #f8f8f8;
}

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 100rpx 0;
  
  .loading-text {
    color: #999;
  }
}

.detail-content {
  padding: 24rpx;
  background-color: #fff;
}

.author-bar {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 24rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
}

.avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 40rpx;
}

.author-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.author-name {
  font-weight: bold;
  color: #333;
}

.publish-time {
  color: #999;
  font-size: 24rpx;
}

.follow-btn {
  padding: 12rpx 32rpx;
  border: 2rpx solid #3cc51f;
  border-radius: 32rpx;
  color: #3cc51f;
  font-size: 24rpx;
}

.post-title {
  font-weight: bold;
  color: #333;
  margin: 24rpx 0 16rpx;
}

.post-content {
  color: #666;
  line-height: 1.8;
  margin-bottom: 24rpx;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.media-section {
  margin: 24rpx 0;
}

.video-player {
  width: 100%;
  border-radius: 12rpx;
}

.post-image {
  width: 100%;
  border-radius: 12rpx;
  margin-bottom: 12rpx;
}

.topics-section {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin: 24rpx 0;
}

.topic-tag {
  padding: 8rpx 16rpx;
  background-color: #f0f9f4;
  border-radius: 20rpx;
  color: #3cc51f;
}

.circle-info {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 24rpx;
  background-color: #f8f8f8;
  border-radius: 12rpx;
  margin: 24rpx 0;
}

.circle-cover {
  width: 80rpx;
  height: 80rpx;
  border-radius: 12rpx;
}

.circle-detail {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.circle-name {
  font-weight: bold;
  color: #333;
}

.circle-desc {
  color: #999;
  font-size: 24rpx;
}

.arrow-icon {
  font-size: 48rpx;
  color: #999;
}

.action-bar {
  display: flex;
  gap: 48rpx;
  padding: 24rpx 0;
  border-top: 1rpx solid #f5f5f5;
  border-bottom: 1rpx solid #f5f5f5;
  margin: 24rpx 0;
}

.action-item {
  display: flex;
  align-items: center;
  gap: 8rpx;
  color: #999;
}

.action-icon {
  font-size: 40rpx;
}

.action-text {
  font-size: 24rpx;
}

.comment-section {
  margin-top: 24rpx;
}

.section-header {
  font-weight: bold;
  color: #333;
  margin-bottom: 24rpx;
}

.comment-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.comment-item {
  display: flex;
  gap: 16rpx;
}

.comment-avatar {
  width: 64rpx;
  height: 64rpx;
  border-radius: 32rpx;
  flex-shrink: 0;
}

.comment-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.comment-user {
  font-weight: bold;
  color: #333;
}

.comment-text {
  color: #666;
  line-height: 1.6;
}

.comment-meta {
  color: #999;
  font-size: 24rpx;
  display: flex;
  gap: 24rpx;
}

.empty-comment {
  text-align: center;
  padding: 60rpx 0;
  color: #999;
}
</style>