<template>
  <view v-if="visible" class="comment-modal-overlay" @click="handleClose">
    <view class="comment-modal" @click.stop>
      <view class="modal-header">
        <text class="modal-title text-scale">评论</text>
        <text class="close-icon" @click="handleClose">✕</text>
      </view>

      <scroll-view scroll-y class="comment-list">
        <view
          v-for="item in commentList"
          :key="item.id"
          class="comment-item"
        >
          <!-- 一级评论 -->
          <view class="comment-main">
            <image class="user-avatar" :src="item.user?.avatarUrl || '/static/images/default-avatar.png'" mode="aspectFill"></image>
            <view class="comment-content">
              <view class="user-info">
                <text class="user-name text-scale">{{ item.user?.nickname }}</text>
                <view class="comment-stats text-scale-sm">
                  <text>{{ formatTime(item.createdAt) }}</text>
                  <text>{{ item.likeCount || 0 }}赞</text>
                </view>
              </view>
              <view class="comment-text text-scale">{{ item.content }}</view>
              <view class="comment-actions">
                <view class="action-btn" @click="handleLike(item)">
                  <text :class="['like-icon', item.liked ? 'liked' : '']">{{ item.liked ? '❤' : '♡' }}</text>
                  <text class="text-scale-sm">{{ item.liked ? '已赞' : '点赞' }}</text>
                </view>
                <view class="action-btn" @click="handleReply(item)">
                  <text class="chat-icon">💬</text>
                  <text class="text-scale-sm">回复</text>
                </view>
              </view>
            </view>
          </view>

          <!-- 二级回复 -->
          <view v-if="item.replies && item.replies.length > 0" class="replies-list">
            <view
              v-for="reply in item.replies"
              :key="reply.id"
              class="reply-item"
            >
              <image class="user-avatar" :src="reply.user?.avatarUrl || '/static/images/default-avatar.png'" mode="aspectFill"></image>
              <view class="reply-content">
                <view class="user-info">
                  <text class="user-name text-scale">{{ reply.user?.nickname }}</text>
                  <text class="text-scale-sm">{{ formatTime(reply.createdAt) }}</text>
                </view>
                <view class="reply-text text-scale">
                  <text v-if="reply.replyToUser" class="reply-to">回复 @{{ reply.replyToUser.nickname }}</text>
                  {{ reply.content }}
                </view>
              </view>
            </view>
          </view>
        </view>

        <!-- 空状态 -->
        <view v-if="commentList.length === 0 && !loading" class="empty-state">
          <image class="empty-image" src="/static/images/empty.png" mode="aspectFit"></image>
          <text class="text-scale">暂无评论，快来抢沙发吧</text>
        </view>

        <!-- 加载更多 -->
        <view class="load-more" v-if="loading">
          <text class="loading-icon">⏳</text>
          <text class="text-scale-sm">加载中...</text>
        </view>
      </scroll-view>

      <!-- 输入框 -->
      <view class="input-bar">
        <view class="input-wrapper">
          <input
            v-model="commentText"
            :placeholder="replyTo ? `回复 ${replyTo.user.nickname}` : '说点什么...'"
            @confirm="handleSend"
            class="comment-input"
          />
        </view>
        <button class="send-btn" @click="handleSend" :disabled="!commentText.trim()">
          <text class="text-scale">发送</text>
        </button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { getComments, createComment, likeComment, unlikeComment } from '@/api/comment';
import { useUserStore } from '@/store/user';

const userStore = useUserStore();

interface Props {
  show: boolean;
  postId: number;
}

const props = defineProps<Props>();

const emit = defineEmits(['update:show', 'update']);

const visible = ref(false);
const commentList = ref<any[]>([]);
const commentText = ref('');
const loading = ref(false);
const page = ref(1);
const pageSize = ref(20);
const replyTo = ref<any>(null);

watch(() => props.show, (val) => {
  visible.value = val;
  if (val && props.postId) {
    loadComments();
  }
});

watch(visible, (val) => {
  emit('update:show', val);
});

// 加载评论列表
const loadComments = async () => {
  if (!props.postId) return;

  loading.value = true;
  try {
    const res = await getComments({
      postId: props.postId,
      page: page.value,
      pageSize: pageSize.value,
    });

    if (page.value === 1) {
      commentList.value = res.list || [];
    } else {
      commentList.value.push(...(res.list || []));
    }
  } catch (error) {
    console.error('加载评论失败', error);
  } finally {
    loading.value = false;
  }
};

// 发送评论
const handleSend = async () => {
  if (!commentText.value.trim()) return;

  if (!userStore.isLoggedIn) {
    uni.showToast({ title: '请先登录', icon: 'none' });
    return;
  }

  try {
    const res = await createComment({
      postId: props.postId,
      content: commentText.value,
      rootId: replyTo.value?.rootId || 0,
      replyToUserId: replyTo.value?.userId || 0,
    });

    uni.showToast({ title: '评论成功', icon: 'success' });

    commentText.value = '';
    replyTo.value = null;

    // 重新加载评论
    page.value = 1;
    loadComments();

    // 通知父组件更新评论数
    emit('update');
  } catch (error) {
    uni.showToast({ title: '评论失败', icon: 'none' });
  }
};

// 点赞评论
const handleLike = async (item: any) => {
  if (!userStore.isLoggedIn) {
    uni.showToast({ title: '请先登录', icon: 'none' });
    return;
  }

  try {
    if (item.liked) {
      await unlikeComment(item.id);
      item.liked = false;
      item.likeCount--;
    } else {
      await likeComment(item.id);
      item.liked = true;
      item.likeCount++;
    }
  } catch (error) {
    console.error('点赞失败', error);
  }
};

// 回复
const handleReply = (item: any) => {
  replyTo.value = {
    userId: item.userId,
    user: item.user,
    rootId: item.rootId || item.id,
  };
};

// 关闭弹窗
const handleClose = () => {
  visible.value = false;
  commentText.value = '';
  replyTo.value = null;
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
</script>

<style lang="scss" scoped>
.comment-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  z-index: 999;
}

.comment-modal {
  width: 100%;
  height: 70vh;
  display: flex;
  flex-direction: column;
  background-color: #fff;
  border-radius: 32rpx 32rpx 0 0;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 32rpx;
  border-bottom: 1rpx solid #f5f5f5;
}

.modal-title {
  font-weight: bold;
  color: #333;
}

.close-icon {
  font-size: 40rpx;
  color: #999;
  cursor: pointer;
}

.like-icon {
  font-size: 28rpx;
  color: #999;
}

.like-icon.liked {
  color: #ff4757;
}

.chat-icon {
  font-size: 28rpx;
  color: #999;
}

.loading-icon {
  font-size: 32rpx;
  color: #999;
}

.comment-list {
  flex: 1;
  padding: 24rpx 32rpx;
}

.comment-item {
  margin-bottom: 32rpx;
}

.comment-main {
  display: flex;
  gap: 16rpx;
}

.user-avatar {
  width: 64rpx;
  height: 64rpx;
  border-radius: 32rpx;
  background-color: #f0f0f0;
  flex-shrink: 0;
}

.comment-content {
  flex: 1;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 8rpx;
}

.user-name {
  font-weight: bold;
  color: #333;
}

.comment-stats {
  color: #999;
  font-size: 24rpx;
}

.comment-text {
  color: #333;
  line-height: 1.6;
  margin-bottom: 12rpx;
}

.comment-actions {
  display: flex;
  gap: 32rpx;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6rpx;
  color: #999;
}

.replies-list {
  margin-top: 16rpx;
  margin-left: 80rpx;
  background-color: #f5f5f5;
  border-radius: 12rpx;
  padding: 16rpx;
}

.reply-item {
  display: flex;
  gap: 12rpx;
  padding: 12rpx 0;
}

.reply-item:not(:last-child) {
  border-bottom: 1rpx solid #eee;
}

.reply-content {
  flex: 1;
}

.reply-text {
  color: #666;
  font-size: 28rpx;
  line-height: 1.5;
}

.reply-to {
  color: #3cc51f;
  margin-right: 8rpx;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 0;
}

.empty-image {
  width: 200rpx;
  height: 200rpx;
  margin-bottom: 24rpx;
}

.load-more {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16rpx;
  padding: 32rpx 0;
  color: #999;
}

.input-bar {
  display: flex;
  gap: 16rpx;
  padding: 16rpx 32rpx;
  border-top: 1rpx solid #f5f5f5;
  background-color: #fff;
}

.input-wrapper {
  flex: 1;
}

.comment-input {
  height: 72rpx;
  background-color: #f5f5f5;
  border-radius: 36rpx;
  padding: 0 24rpx;
}

.send-btn {
  width: 120rpx;
  height: 72rpx;
  background-color: #3cc51f;
  color: #fff;
  border-radius: 36rpx;
  border: none;
  font-size: 28rpx;
}

.send-btn:disabled {
  background-color: #ccc;
}
</style>