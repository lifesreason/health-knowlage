<template>
  <view class="publisher-page" :style="{ '--font-scale': fontScale }">
    <!-- 类型选择 -->
    <view class="type-tabs">
      <view class="type-tab" :class="{ active: publishType === 'image' }" @click="publishType = 'image'">
        <text class="tab-icon">📷</text>
        <text class="tab-text" :style="{ fontSize: `calc(14px * ${fontScale})` }">图文</text>
      </view>
      <view class="type-tab" :class="{ active: publishType === 'video' }" @click="publishType = 'video'">
        <text class="tab-icon">🎬</text>
        <text class="tab-text" :style="{ fontSize: `calc(14px * ${fontScale})` }">视频</text>
      </view>
    </view>

    <scroll-view scroll-y class="form-scroll">
      <!-- 标题 -->
      <view class="form-card">
        <view class="form-label">
          <text class="label-icon">✏️</text>
          <text :style="{ fontSize: `calc(14px * ${fontScale})` }">标题</text>
        </view>
        <input v-model="formData.title" placeholder="请输入标题（50字以内）" maxlength="50" class="form-input" :style="{ fontSize: `calc(15px * ${fontScale})` }" />
      </view>

      <!-- 内容 -->
      <view class="form-card">
        <view class="form-label">
          <text class="label-icon">📝</text>
          <text :style="{ fontSize: `calc(14px * ${fontScale})` }">内容</text>
        </view>
        <textarea v-model="formData.content" placeholder="分享您的健康经验..." maxlength="2000" class="form-textarea" :style="{ fontSize: `calc(15px * ${fontScale})` }"></textarea>
        <text class="char-count" :style="{ fontSize: `calc(12px * ${fontScale})` }">{{ formData.content.length }}/2000</text>
      </view>

      <!-- 媒体上传 -->
      <view class="form-card">
        <view class="form-label">
          <text class="label-icon">{{ publishType === 'image' ? '🖼️' : '🎥' }}</text>
          <text :style="{ fontSize: `calc(14px * ${fontScale})` }">{{ publishType === 'image' ? '图片' : '视频' }}</text>
        </view>
        
        <!-- 图片网格 -->
        <view v-if="publishType === 'image'" class="media-grid">
          <view v-for="(url, index) in formData.mediaUrls" :key="index" class="media-item">
            <image class="media-image" :src="url" mode="aspectFill"></image>
            <view class="media-delete" @click="removeMedia(index)">✕</view>
          </view>
          <view v-if="formData.mediaUrls.length < 9" class="media-add" @click="chooseImage">
            <text class="add-icon">+</text>
            <text class="add-text" :style="{ fontSize: `calc(12px * ${fontScale})` }">添加图片</text>
          </view>
        </view>
        
        <!-- 视频上传 -->
        <view v-else class="video-upload">
          <view v-if="formData.videoUrl" class="video-preview">
            <video class="video-player" :src="formData.videoUrl"></video>
            <view class="video-delete" @click="removeVideo">✕</view>
          </view>
          <view v-else class="video-add" @click="chooseVideo">
            <text class="add-icon">+</text>
            <text class="add-text" :style="{ fontSize: `calc(13px * ${fontScale})` }">添加视频</text>
            <text class="add-tip" :style="{ fontSize: `calc(11px * ${fontScale})` }">限3分钟 · 200MB</text>
          </view>
        </view>
      </view>

      <!-- 选择圈子 -->
      <view class="form-card" @click="showCirclePicker = true">
        <view class="circle-selector">
          <view class="selector-left">
            <text class="label-icon">🏠</text>
            <text class="selector-label" :style="{ fontSize: `calc(14px * ${fontScale})` }">选择圈子</text>
          </view>
          <view class="selector-right">
            <text class="selector-value" :style="{ fontSize: `calc(14px * ${fontScale})` }">{{ selectedCircle?.name || '请选择' }}</text>
            <text class="selector-arrow">›</text>
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 底部发布栏 -->
    <view class="footer-bar">
      <button class="publish-btn" :disabled="publishing" @click="handlePublish" :style="{ fontSize: `calc(17px * ${fontScale})` }">
        {{ publishing ? '发布中...' : '✨ 发布' }}
      </button>
    </view>

    <!-- 圈子选择弹窗 -->
    <view v-if="showCirclePicker" class="picker-mask" @click="showCirclePicker = false">
      <view class="picker-sheet" @click.stop>
        <view class="picker-header">
          <text class="picker-title" :style="{ fontSize: `calc(16px * ${fontScale})` }">选择圈子</text>
          <text class="picker-close" @click="showCirclePicker = false">✕</text>
        </view>
        <scroll-view scroll-y class="picker-list">
          <view 
            v-for="item in circles" 
            :key="item.id" 
            class="picker-item"
            :class="{ selected: selectedCircle?.id === item.id }"
            @click="selectCircle(item)"
          >
            <text :style="{ fontSize: `calc(15px * ${fontScale})` }">{{ item.name }}</text>
            <text v-if="selectedCircle?.id === item.id" class="check-icon">✓</text>
          </view>
        </scroll-view>
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
import { circleApi, postApi } from '@/api';

const themeStore = useThemeStore();
const userStore = useUserStore();
const { fontScale } = storeToRefs(themeStore);

const publishType = ref<'image' | 'video'>('image');
const formData = ref({ title: '', content: '', mediaUrls: [] as string[], videoUrl: '', circleId: 0 });
const selectedCircle = ref<any>(null);
const circles = ref<any[]>([]);
const showCirclePicker = ref(false);
const publishing = ref(false);

const loadCircles = async () => {
  try {
    const res = await circleApi.getMyCircles();
    circles.value = res.list || [];
  } catch (error) {
    console.error('加载圈子失败', error);
  }
};

const selectCircle = (item: any) => {
  selectedCircle.value = item;
  formData.value.circleId = item.id;
  showCirclePicker.value = false;
};

const chooseImage = () => {
  uni.chooseImage({
    count: 9 - formData.value.mediaUrls.length,
    success: (res) => {
      formData.value.mediaUrls.push(...res.tempFilePaths);
    },
  });
};

const removeMedia = (index: number) => {
  formData.value.mediaUrls.splice(index, 1);
};

const chooseVideo = () => {
  uni.chooseVideo({
    maxDuration: 180,
    success: (res) => {
      if (res.size > 200 * 1024 * 1024) {
        uni.showToast({ title: '视频大小不能超过200MB', icon: 'none' });
        return;
      }
      formData.value.videoUrl = res.tempFilePath;
    },
  });
};

const removeVideo = () => {
  formData.value.videoUrl = '';
};

const handlePublish = async () => {
  if (!formData.value.circleId) {
    uni.showToast({ title: '请选择圈子', icon: 'none' });
    return;
  }
  if (!formData.value.content) {
    uni.showToast({ title: '请输入内容', icon: 'none' });
    return;
  }
  if (publishType.value === 'image' && formData.value.mediaUrls.length === 0) {
    uni.showToast({ title: '请上传图片', icon: 'none' });
    return;
  }
  if (publishType.value === 'video' && !formData.value.videoUrl) {
    uni.showToast({ title: '请上传视频', icon: 'none' });
    return;
  }

  publishing.value = true;
  try {
    const uploadedUrls: string[] = [];
    if (publishType.value === 'image') {
      for (const path of formData.value.mediaUrls) {
        const policyRes = await postApi.getOssPolicy({ fileType: 'image' });
        const url = await postApi.uploadToOss(policyRes.url || '', policyRes, path);
        uploadedUrls.push(url);
      }
    } else if (formData.value.videoUrl) {
      const policyRes = await postApi.getOssPolicy({ fileType: 'video' });
      const url = await postApi.uploadToOss(policyRes.url || '', policyRes, formData.value.videoUrl);
      uploadedUrls.push(url);
    }

    await postApi.publish({
      title: formData.value.title,
      content: formData.value.content,
      mediaUrls: uploadedUrls,
      circleId: formData.value.circleId,
      type: publishType.value === 'image' ? 1 : 2,
    });

    uni.report?.('publish_result', { success: true, media_type: publishType.value });
    uni.showToast({ title: '发布成功，审核通过后展示', icon: 'success' });
    setTimeout(() => uni.navigateBack(), 1500);
  } catch {
    uni.report?.('publish_result', { success: false, media_type: publishType.value });
    uni.showToast({ title: '发布失败', icon: 'none' });
  } finally {
    publishing.value = false;
  }
};

onLoad((options: any) => {
  if (options.circleId) {
    formData.value.circleId = +options.circleId;
  }
});

onMounted(() => loadCircles());
</script>

<style lang="scss" scoped>
.publisher-page {
  min-height: 100vh;
  background: #f5f6f8;
  display: flex;
  flex-direction: column;
}

// 类型选择
.type-tabs {
  display: flex;
  gap: 20rpx;
  padding: 24rpx;
  background: #fff;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
}

.type-tab {
  flex: 1;
  height: 100rpx;
  border: 2rpx solid #eee;
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  color: #999;
  transition: all 0.2s;
  
  &.active {
    border-color: #E17055;
    color: #E17055;
    background: #fff5f3;
  }
}

.tab-icon {
  font-size: 36rpx;
}

// 表单滚动区
.form-scroll {
  flex: 1;
  padding: 20rpx;
}

.form-card {
  background: #fff;
  border-radius: 24rpx;
  padding: 28rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
}

.form-label {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 20rpx;
  font-weight: 600;
  color: #1a1a1a;
}

.label-icon {
  font-size: 32rpx;
}

.form-input {
  width: 100%;
  height: 80rpx;
  background: #f8f8f8;
  border-radius: 16rpx;
  padding: 0 24rpx;
}

.form-textarea {
  width: 100%;
  height: 240rpx;
  background: #f8f8f8;
  border-radius: 16rpx;
  padding: 20rpx 24rpx;
  line-height: 1.8;
}

.char-count {
  text-align: right;
  color: #ccc;
  margin-top: 8rpx;
}

// 媒体网格
.media-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16rpx;
}

.media-item {
  position: relative;
  padding-bottom: 100%;
  border-radius: 16rpx;
  overflow: hidden;
}

.media-image {
  position: absolute;
  width: 100%;
  height: 100%;
}

.media-delete, .video-delete {
  position: absolute;
  top: 8rpx;
  right: 8rpx;
  width: 44rpx;
  height: 44rpx;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 22rpx;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
}

.media-add, .video-add {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  background: #f8f8f8;
  border: 2rpx dashed #ddd;
  border-radius: 16rpx;
  padding: 40rpx;
  color: #ccc;
}

.add-icon {
  font-size: 56rpx;
  color: #ddd;
}

.add-text {
  color: #999;
}

.add-tip {
  color: #ccc;
}

// 视频
.video-upload {
  width: 100%;
}

.video-preview {
  position: relative;
  width: 100%;
  padding-bottom: 56.25%;
  border-radius: 16rpx;
  overflow: hidden;
}

.video-player {
  position: absolute;
  width: 100%;
  height: 100%;
}

// 圈子选择
.circle-selector {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.selector-left {
  display: flex;
  align-items: center;
  gap: 12rpx;
  font-weight: 600;
  color: #1a1a1a;
}

.selector-right {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.selector-value {
  color: #999;
}

.selector-arrow {
  font-size: 32rpx;
  color: #ccc;
}

// 底部调
.footer-bar {
  background: #fff;
  padding: 24rpx 32rpx;
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
  box-shadow: 0 -4rpx 16rpx rgba(0, 0, 0, 0.04);
}

.publish-btn {
  width: 100%;
  height: 96rpx;
  background: linear-gradient(135deg, #E17055, #d45d43);
  color: #fff;
  border: none;
  border-radius: 48rpx;
  font-weight: 600;
  box-shadow: 0 12rpx 32rpx rgba(225, 112, 85, 0.3);
  
  &:disabled {
    background: #ddd;
    box-shadow: none;
    color: #999;
  }
}

// 圈子选择弹窗
.picker-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
  display: flex;
  align-items: flex-end;
}

.picker-sheet {
  width: 100%;
  background: #fff;
  border-radius: 32rpx 32rpx 0 0;
  max-height: 70vh;
}

.picker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.picker-title {
  font-weight: 600;
  color: #1a1a1a;
}

.picker-close {
  font-size: 36rpx;
  color: #999;
}

.picker-list {
  max-height: 50vh;
  padding: 0 32rpx;
  padding-bottom: env(safe-area-inset-bottom);
}

.picker-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
  color: #333;
  
  &.selected {
    color: #E17055;
  }
  
  &:active {
    background: #fafafa;
  }
}

.check-icon {
  color: #E17055;
  font-size: 36rpx;
  font-weight: bold;
}
</style>
