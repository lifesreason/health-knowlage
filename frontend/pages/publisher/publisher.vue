<template>
  <view class="publisher-container">
    <!-- 类型选择 -->
    <view class="type-selector">
      <view
        class="type-item"
        :class="{ active: publishType === 'image' }"
        @click="switchType('image')"
      >
        <text class="type-icon" :style="{ color: publishType === 'image' ? '#3cc51f' : '#999' }">📷</text>
        <text class="text-scale">图文</text>
      </view>
      <view
        class="type-item"
        :class="{ active: publishType === 'video' }"
        @click="switchType('video')"
      >
        <text class="type-icon" :style="{ color: publishType === 'video' ? '#3cc51f' : '#999' }">▶</text>
        <text class="text-scale">视频</text>
      </view>
    </view>

    <!-- 表单内容 -->
    <scroll-view scroll-y class="form-content">
      <!-- 标题 -->
      <view class="form-item">
        <view class="form-label text-scale">标题</view>
        <input
          v-model="formData.title"
          placeholder="请输入标题（50字以内）"
          maxlength="50"
          class="form-input"
        />
      </view>

      <!-- 内容 -->
      <view class="form-item">
        <view class="form-label text-scale">内容</view>
        <textarea
          v-model="formData.content"
          placeholder="请输入内容描述"
          maxlength="2000"
          class="form-textarea"
        ></textarea>
        <view class="char-count text-scale-sm">{{ formData.content.length }}/2000</view>
      </view>

      <!-- 媒体上传 -->
      <view class="form-item">
        <view class="form-label text-scale">
          {{ publishType === 'image' ? '图片' : '视频' }}
        </view>

        <!-- 图片上传 -->
        <view v-if="publishType === 'image'" class="media-grid">
          <view
            v-for="(item, index) in formData.mediaUrls"
            :key="index"
            class="media-item"
          >
            <image class="media-image" :src="item" mode="aspectFill"></image>
            <view class="media-delete" @click="removeMedia(index)">
              <text class="delete-icon">✕</text>
            </view>
          </view>
          <view
            v-if="formData.mediaUrls.length < 9"
            class="media-add"
            @click="chooseImage"
          >
            <text class="add-icon">📷</text>
            <text class="text-scale-sm">添加图片</text>
          </view>
        </view>

        <!-- 视频上传 -->
        <view v-if="publishType === 'video'" class="video-upload">
          <view v-if="formData.videoUrl" class="video-preview">
            <video class="video-player" :src="formData.videoUrl" :poster="formData.videoMeta?.coverUrl"></video>
            <view class="video-delete" @click="removeVideo">
              <text class="delete-icon">✕</text>
            </view>
          </view>
          <view v-else class="video-add" @click="chooseVideo">
            <text class="add-icon">📷</text>
            <text class="text-scale-sm">添加视频</text>
            <text class="text-scale-sm tips">(限3分钟，200MB)</text>
          </view>
        </view>
      </view>

      <!-- 圈子选择 -->
      <view class="form-item">
        <view class="form-label text-scale">圈子</view>
        <view class="circle-selector" @click="showCirclePicker = true">
          <text class="text-scale">{{ selectedCircle?.name || '请选择圈子' }}</text>
          <text class="dropdown-icon">▼</text>
        </view>
      </view>

      <!-- 话题 -->
      <view class="form-item">
        <view class="form-label text-scale">话题</view>
        <view class="topic-tags">
          <view
            v-for="(topic, index) in formData.topics"
            :key="index"
            class="topic-tag"
          >
            <text class="text-scale-sm"># {{ topic }}</text>
            <text class="close-icon" @click="removeTopic(index)">✕</text>
          </view>
          <view v-if="formData.topics.length < 3" class="topic-add" @click="showTopicInput = true">
            <text class="plus-icon">+</text>
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 底部操作栏 -->
    <view class="footer-bar">
      <button class="publish-btn" @click="handlePublish" :disabled="publishing">
        <text class="text-scale">{{ publishing ? '发布中...' : '发布' }}</text>
      </button>
    </view>

    <!-- 圈子选择器 -->
    <view v-if="showCirclePicker" class="picker-overlay" @click="showCirclePicker = false">
      <view class="picker-content" @click.stop>
        <view class="picker-header">
          <text class="picker-title text-scale">选择圈子</text>
          <text class="picker-cancel text-scale" @click="showCirclePicker = false">取消</text>
        </view>
        <scroll-view scroll-y class="picker-list">
          <view
            v-for="item in circleColumns"
            :key="item.id"
            class="picker-item"
            @click="onCircleConfirm(item)"
          >
            <text class="text-scale">{{ item.name }}</text>
            <text v-if="selectedCircle?.id === item.id" class="check-icon">✓</text>
          </view>
        </scroll-view>
      </view>
    </view>

    <!-- 话题输入弹窗 -->
    <view v-if="showTopicInput" class="modal-overlay" @click="showTopicInput = false">
      <view class="topic-modal" @click.stop>
        <view class="topic-header">
          <text class="topic-title text-scale-lg">添加话题</text>
          <text class="close-icon" @click="showTopicInput = false">✕</text>
        </view>
        <input
          v-model="topicInput"
          placeholder="请输入话题名称"
          class="topic-input"
        />
        <button class="topic-confirm-btn" @click="addTopic">
          <text class="text-scale">确定</text>
        </button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { getCircleList, getUserCircles } from '@/api/circle';
import { getOssPolicy, publishImagePost, publishVideoPost } from '@/api/publish';
import { useUserStore } from '@/store/user';

const userStore = useUserStore();

const publishType = ref<'image' | 'video'>('image');
const formData = ref({
  title: '',
  content: '',
  mediaUrls: [] as string[],
  videoUrl: '',
  videoMeta: null as any,
  circleId: 0,
  topics: [] as string[],
});

const selectedCircle = ref<any>(null);
const circleColumns = ref<any[]>([]);
const showCirclePicker = ref(false);
const showTopicInput = ref(false);
const topicInput = ref('');
const publishing = ref(false);

// 切换类型
const switchType = (type: 'image' | 'video') => {
  publishType.value = type;
  // 清空媒体数据
  formData.value.mediaUrls = [];
  formData.value.videoUrl = '';
  formData.value.videoMeta = null;
};

// 选择图片
const chooseImage = () => {
  const remaining = 9 - formData.value.mediaUrls.length;

  uni.chooseImage({
    count: remaining,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: async (res) => {
      try {
        uni.showLoading({ title: '上传中...' });

        for (const filePath of res.tempFilePaths) {
          const url = await uploadToOss(filePath, 'image');
          formData.value.mediaUrls.push(url);
        }

        uni.hideLoading();
      } catch (error) {
        uni.hideLoading();
        uni.showToast({ title: '上传失败', icon: 'none' });
      }
    },
  });
};

// 选择视频
const chooseVideo = () => {
  uni.chooseVideo({
    maxDuration: 180,
    sourceType: ['album', 'camera'],
    camera: 'back',
    success: async (res) => {
      // 检查视频大小
      if (res.size > 200 * 1024 * 1024) {
        uni.showToast({ title: '视频大小不能超过200MB', icon: 'none' });
        return;
      }

      try {
        uni.showLoading({ title: '上传中...' });

        const url = await uploadToOss(res.tempFilePath, 'video');

        // 生成封面
        const coverUrl = await generateVideoCover(res.tempFilePath);

        formData.value.videoUrl = url;
        formData.value.videoMeta = {
          duration: res.duration,
          coverUrl,
          size: res.size,
        };

        uni.hideLoading();
      } catch (error) {
        uni.hideLoading();
        uni.showToast({ title: '上传失败', icon: 'none' });
      }
    },
  });
};

// 上传到 OSS
const uploadToOss = async (filePath: string, fileType: 'image' | 'video'): Promise<string> => {
  const policy = await getOssPolicy(fileType);

  return new Promise((resolve, reject) => {
    uni.uploadFile({
      url: policy.host,
      filePath,
      name: 'file',
      formData: {
        key: policy.fileName,
        policy: policy.policy,
        OSSAccessKeyId: policy.accessKeyId,
        signature: policy.signature,
      },
      success: (res) => {
        if (res.statusCode === 204) {
          resolve(`${policy.host}/${policy.fileName}`);
        } else {
          reject(new Error('上传失败'));
        }
      },
      fail: reject,
    });
  });
};

// 生成视频封面
const generateVideoCover = (filePath: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    uni.createSelectorQuery()
      .select('#videoCanvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        // TODO: 实现视频封面生成
        resolve('');
      });
  });
};

// 删除媒体
const removeMedia = (index: number) => {
  formData.value.mediaUrls.splice(index, 1);
};

// 删除视频
const removeVideo = () => {
  formData.value.videoUrl = '';
  formData.value.videoMeta = null;
};

// 加载圈子列表
const loadCircles = async () => {
  try {
    if (userStore.isLoggedIn) {
      circleColumns.value = await getUserCircles(userStore.userInfo.id);
    }

    if (circleColumns.value.length === 0) {
      circleColumns.value = await getCircleList();
    }
  } catch (error) {
    console.error('加载圈子列表失败', error);
  }
};

// 圈子选择确认
const onCircleConfirm = (item: any) => {
  selectedCircle.value = item;
  formData.value.circleId = item.id;
  showCirclePicker.value = false;
};

// 添加话题
const addTopic = () => {
  if (!topicInput.value.trim()) {
    uni.showToast({ title: '请输入话题名称', icon: 'none' });
    return;
  }

  if (formData.value.topics.includes(topicInput.value)) {
    uni.showToast({ title: '话题已存在', icon: 'none' });
    return;
  }

  formData.value.topics.push(topicInput.value);
  topicInput.value = '';
  showTopicInput.value = false;
};

// 删除话题
const removeTopic = (index: number) => {
  formData.value.topics.splice(index, 1);
};

// 发布
const handlePublish = async () => {
  // 表单验证
  if (!formData.value.circleId) {
    uni.showToast({ title: '请选择圈子', icon: 'none' });
    return;
  }

  if (publishType.value === 'video' && !formData.value.title) {
    uni.showToast({ title: '视频发布需要填写标题', icon: 'none' });
    return;
  }

  if (publishType.value === 'image' && formData.value.mediaUrls.length === 0) {
    uni.showToast({ title: '请至少上传一张图片', icon: 'none' });
    return;
  }

  if (publishType.value === 'video' && !formData.value.videoUrl) {
    uni.showToast({ title: '请上传视频', icon: 'none' });
    return;
  }

  if (!formData.value.content) {
    uni.showToast({ title: '请输入内容描述', icon: 'none' });
    return;
  }

  try {
    publishing.value = true;

    // 组合话题到内容中
    const content = formData.value.topics.length > 0
      ? `${formData.value.topics.map(t => `#${t}`).join(' ')}\n${formData.value.content}`
      : formData.value.content;

    if (publishType.value === 'image') {
      await publishImagePost({
        circleId: formData.value.circleId,
        title: formData.value.title,
        content,
        mediaUrls: formData.value.mediaUrls,
      });
    } else {
      await publishVideoPost({
        circleId: formData.value.circleId,
        title: formData.value.title,
        content,
        videoUrl: formData.value.videoUrl,
        videoMeta: formData.value.videoMeta,
      });
    }

    uni.showToast({ title: '发布成功，审核通过后展示', icon: 'success' });

    setTimeout(() => {
      uni.navigateBack();
    }, 1500);
  } catch (error) {
    uni.showToast({ title: '发布失败', icon: 'none' });
  } finally {
    publishing.value = false;
  }
};

onLoad((options: any) => {
  // 权限检查：仅管理员可访问
  if (!userStore.isLoggedIn || userStore.userInfo.role !== 9) {
    uni.showToast({
      title: '无权限访问',
      icon: 'none'
    });
    setTimeout(() => {
      uni.switchTab({
        url: '/pages/index/index'
      });
    }, 1500);
    return;
  }

  if (options.circleId) {
    formData.value.circleId = +options.circleId;
  }
  loadCircles();
});
</script>

<style lang="scss" scoped>
.publisher-container {
  min-height: 100vh;
  background-color: #f8f8f8;
  display: flex;
  flex-direction: column;
}

.type-selector {
  background-color: #fff;
  padding: 24rpx;
  display: flex;
  gap: 24rpx;
  margin-bottom: 16rpx;
}

.type-item {
  flex: 1;
  height: 88rpx;
  border: 2rpx solid #e5e5e5;
  border-radius: 12rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  color: #999;
}

.type-item.active {
  border-color: #3cc51f;
  color: #3cc51f;
  background-color: #f0f9f4;
}

.type-icon {
  font-size: 40rpx;
}

.delete-icon {
  font-size: 28rpx;
  color: #fff;
}

.add-icon {
  font-size: 60rpx;
  color: #999;
}

.dropdown-icon {
  font-size: 24rpx;
  color: #999;
}

.close-icon {
  font-size: 24rpx;
  color: #999;
}

.plus-icon {
  font-size: 24rpx;
  color: #999;
}

.modal-overlay,
.picker-overlay {
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

.picker-content {
  width: 100%;
  height: 60%;
  background-color: #fff;
  border-radius: 24rpx 24rpx 0 0;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  flex-direction: column;
}

.picker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 32rpx;
  border-bottom: 1rpx solid #eee;
}

.picker-title {
  font-weight: bold;
  color: #333;
}

.picker-cancel {
  color: #666;
}

.picker-list {
  flex: 1;
  padding: 0 32rpx;
}

.picker-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
}

.check-icon {
  color: #3cc51f;
  font-size: 32rpx;
}

.form-content {
  flex: 1;
  padding: 0 24rpx;
}

.form-item {
  background-color: #fff;
  padding: 24rpx;
  border-radius: 16rpx;
  margin-bottom: 16rpx;
}

.form-label {
  font-weight: bold;
  color: #333;
  margin-bottom: 16rpx;
}

.form-input,
.form-textarea {
  width: 100%;
  background-color: #f5f5f5;
  border-radius: 8rpx;
  padding: 16rpx 24rpx;
}

.form-textarea {
  height: 200rpx;
}

.char-count {
  text-align: right;
  color: #999;
  margin-top: 8rpx;
}

.media-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12rpx;
}

.media-item {
  position: relative;
  width: 100%;
  padding-bottom: 100%;
  border-radius: 8rpx;
  overflow: hidden;
}

.media-image {
  position: absolute;
  width: 100%;
  height: 100%;
}

.media-delete {
  position: absolute;
  top: 8rpx;
  right: 8rpx;
  width: 40rpx;
  height: 40rpx;
  background-color: rgba(0, 0, 0, 0.5);
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.media-add,
.video-add {
  width: 100%;
  padding-bottom: 100%;
  background-color: #f5f5f5;
  border-radius: 8rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  color: #999;
}

.tips {
  font-size: 24rpx;
}

.video-upload {
  width: 100%;
}

.video-preview {
  position: relative;
  width: 100%;
  padding-bottom: 56.25%;
  border-radius: 8rpx;
  overflow: hidden;
}

.video-player {
  position: absolute;
  width: 100%;
  height: 100%;
}

.video-delete {
  position: absolute;
  top: 8rpx;
  right: 8rpx;
  width: 40rpx;
  height: 40rpx;
  background-color: rgba(0, 0, 0, 0.5);
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.circle-selector {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 72rpx;
  background-color: #f5f5f5;
  border-radius: 8rpx;
  padding: 0 24rpx;
}

.topic-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.topic-tag {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 8rpx 16rpx;
  background-color: #f0f9f4;
  border-radius: 20rpx;
  color: #3cc51f;
}

.topic-add {
  width: 60rpx;
  height: 60rpx;
  border: 2rpx dashed #ddd;
  border-radius: 30rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.footer-bar {
  background-color: #fff;
  padding: 24rpx;
  border-top: 1rpx solid #eee;
}

.publish-btn {
  width: 100%;
  height: 88rpx;
  background-color: #3cc51f;
  color: #fff;
  border-radius: 44rpx;
  border: none;
  font-size: 32rpx;
}

.publish-btn:disabled {
  background-color: #ccc;
}

.topic-modal {
  width: 560rpx;
  padding: 48rpx 40rpx;
}

.topic-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 32rpx;
}

.topic-title {
  font-weight: bold;
  color: #333;
}

.topic-input {
  height: 88rpx;
  background-color: #f5f5f5;
  border-radius: 8rpx;
  padding: 0 24rpx;
  margin-bottom: 24rpx;
}

.topic-confirm-btn {
  width: 100%;
  height: 88rpx;
  background-color: #3cc51f;
  color: #fff;
  border-radius: 44rpx;
  border: none;
  font-size: 32rpx;
}
</style>