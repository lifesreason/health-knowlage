<template>
  <view class="home-container">
    <!-- 顶部欢迎区域 -->
    <view class="welcome-section">
      <view class="welcome-text">
        <text class="greeting text-scale-lg">{{ getGreeting() }}</text>
        <text class="subtitle text-scale">智慧养生，健康生活</text>
      </view>
      <view class="date-info">
        <text class="date-text text-scale">{{ currentDate }}</text>
      </view>
    </view>

    <!-- 实用工具矩阵 -->
    <view class="tools-section">
      <view class="section-header">
        <text class="section-title text-scale-subtitle">🔧 实用工具</text>
      </view>

      <view class="tools-grid">
        <view class="tool-card" @click="openTool('blood-pressure')">
          <view class="tool-icon" style="background: linear-gradient(135deg, #FF6B6B 0%, #FF8E8E 100%);">
            <text class="icon-text">❤️</text>
          </view>
          <text class="tool-name text-scale">血压记录</text>
        </view>

        <view class="tool-card" @click="openTool('medication')">
          <view class="tool-icon" style="background: linear-gradient(135deg, #4ECDC4 0%, #7ED7D1 100%);">
            <text class="icon-text">💊</text>
          </view>
          <text class="tool-name text-scale">用药提醒</text>
        </view>

        <view class="tool-card" @click="openTool('weather')">
          <view class="tool-icon" style="background: linear-gradient(135deg, #74B9FF 0%, #A4CFFF 100%);">
            <text class="icon-text">🌤️</text>
          </view>
          <text class="tool-name text-scale">天气查询</text>
        </view>

        <view class="tool-card" @click="openTool('calculator')">
          <view class="tool-icon" style="background: linear-gradient(135deg, #FDCB6E 0%, #FFEAA7 100%);">
            <text class="icon-text">🧮</text>
          </view>
          <text class="tool-name text-scale">计算器</text>
        </view>

        <view class="tool-card" @click="openTool('phonebook')">
          <view class="tool-icon" style="background: linear-gradient(135deg, #A29BFE 0%, #C4CFFF 100%);">
            <text class="icon-text">📞</text>
          </view>
          <text class="tool-name text-scale">便民电话</text>
        </view>

        <view class="tool-card" @click="openTool('notepad')">
          <view class="tool-icon" style="background: linear-gradient(135deg, #00B894 0%, #55EFC4 100%);">
            <text class="icon-text">📝</text>
          </view>
          <text class="tool-name text-scale">记事本</text>
        </view>
      </view>
    </view>

    <!-- 今日健康提示 -->
    <view class="health-tip-section">
      <view class="section-header">
        <text class="section-title text-scale-subtitle">💡 今日健康提示</text>
      </view>
      <view class="health-tip-card">
        <text class="tip-icon">🌟</text>
        <text class="tip-content text-scale">{{ todayTip }}</text>
      </view>
    </view>

    <!-- 课程分类 -->
    <view class="section-header">
      <text class="section-title text-scale-subtitle">📚 课程分类</text>
      <text class="section-more text-scale" @click="goToAllCategories">查看全部 ›</text>
    </view>

    <view class="categories-grid" v-if="categoryList.length > 0">
      <view
        v-for="category in categoryList"
        :key="category.id"
        class="category-item"
        @click="goToCategoryDetail(category.id)"
      >
        <view class="category-icon">{{ getCategoryIcon(category.name) }}</view>
        <text class="category-name text-scale">{{ category.name }}</text>
        <text class="category-count text-scale-sm">{{ category.postCount }}节课程</text>
      </view>
    </view>

    <!-- 推荐课程 -->
    <view class="section-header">
      <text class="section-title text-scale-subtitle">⭐ 推荐课程</text>
    </view>

    <scroll-view
      scroll-y
      class="course-list"
      @scrolltolower="loadMore"
      :refresher-enabled="true"
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
    >
      <view
        v-for="item in courseList"
        :key="item.id"
        class="course-card"
        @click="goToDetail(item.id)"
      >
        <image
          v-if="item.mediaUrls && item.mediaUrls.length > 0"
          class="course-cover"
          :src="item.mediaUrls[0]"
          mode="aspectFill"
        ></image>
        <view v-else class="course-cover course-cover-placeholder">
          <text class="placeholder-icon">📖</text>
        </view>

        <view class="course-info">
          <view class="course-title text-scale-lg">{{ item.title || '养生知识' }}</view>
          <view class="course-desc text-scale">{{ item.content }}</view>
          <view class="course-meta text-scale-sm">
            <text class="meta-tag">{{ getCategoryName(item.circleId) }}</text>
            <text class="meta-divider">|</text>
            <text>{{ item.viewCount }}人学习</text>
          </view>
        </view>

        <view class="course-type">
          <text v-if="item.type === 2" class="type-tag video-tag">视频</text>
          <text v-else class="type-tag article-tag">图文</text>
        </view>
      </view>

      <view class="load-more" v-if="!noMore">
        <text class="loading-icon">⏳</text>
        <text class="text-scale-sm">加载中...</text>
      </view>

      <view class="no-more" v-else>
        <text class="text-scale-sm">没有更多了</text>
      </view>

      <view v-if="courseList.length === 0 && !loading" class="empty-state">
        <text class="empty-icon">📭</text>
        <text class="text-scale">暂无课程内容</text>
      </view>
    </scroll-view>
  </view>

  <!-- 工具弹窗 -->
  <view v-if="showToolModal" class="modal-overlay" @click="closeTool">
    <view class="modal-content" @click.stop>
      <!-- 血压记录工具 -->
      <view v-if="currentTool === 'blood-pressure'" class="blood-pressure-tool">
        <view class="tool-header">
          <text class="tool-title text-scale-lg">❤️ 血压记录</text>
          <text class="close-btn" @click="closeTool">✕</text>
        </view>

        <view class="bp-form">
          <view class="form-group">
            <text class="form-label text-scale">收缩压 (高压)</text>
            <input v-model="bpData.systolic" type="number" placeholder="120" class="form-input" />
            <text class="unit">mmHg</text>
          </view>
          <view class="form-group">
            <text class="form-label text-scale">舒张压 (低压)</text>
            <input v-model="bpData.diastolic" type="number" placeholder="80" class="form-input" />
            <text class="unit">mmHg</text>
          </view>
          <view class="form-group">
            <text class="form-label text-scale">测量时间</text>
            <picker mode="date" :value="bpData.date" @change="onDateChange">
              <view class="picker-input">{{ bpData.date }}</view>
            </picker>
          </view>

          <button class="save-btn" @click="saveBPRecord">保存记录</button>

          <view class="history-section">
            <text class="history-title text-scale-subtitle">历史记录</text>
            <view v-if="bpHistory.length > 0" class="history-list">
              <view v-for="(record, index) in bpHistory" :key="index" class="history-item">
                <view class="history-date">{{ record.date }}</view>
                <view class="history-values">
                  <text class="value-item">{{ record.systolic }}/{{ record.diastolic }}</text>
                  <text :class="['status-tag', record.status]">{{ getStatusText(record.status) }}</text>
                </view>
                <text class="delete-btn" @click="deleteBPRecord(index)">删除</text>
              </view>
            </view>
            <view v-else class="empty-history">
              <text class="text-scale">暂无记录</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 用药提醒工具 -->
      <view v-if="currentTool === 'medication'" class="medication-tool">
        <view class="tool-header">
          <text class="tool-title text-scale-lg">💊 用药提醒</text>
          <text class="close-btn" @click="closeTool">✕</text>
        </view>

        <view class="medication-form">
          <view class="form-group">
            <text class="form-label text-scale">药品名称</text>
            <input v-model="medData.name" placeholder="请输入药品名称" class="form-input" />
          </view>
          <view class="form-group">
            <text class="form-label text-scale">用药时间</text>
            <picker mode="time" :value="medData.time" @change="onTimeChange">
              <view class="picker-input">{{ medData.time }}</view>
            </picker>
          </view>
          <view class="form-group">
            <text class="form-label text-scale">备注</text>
            <input v-model="medData.note" placeholder="用量、频次等" class="form-input" />
          </view>

          <button class="save-btn" @click="addMedicationReminder">添加提醒</button>

          <view class="history-section">
            <text class="history-title text-scale-subtitle">提醒列表</text>
            <view v-if="medicationList.length > 0" class="medication-list">
              <view v-for="(item, index) in medicationList" :key="index" class="medication-item">
                <view class="medication-info">
                  <text class="medication-name">{{ item.name }}</text>
                  <text class="medication-time">{{ item.time }}</text>
                  <text class="medication-note">{{ item.note }}</text>
                </view>
                <text class="delete-btn" @click="deleteMedication(index)">删除</text>
              </view>
            </view>
            <view v-else class="empty-history">
              <text class="text-scale">暂无提醒</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 天气查询工具 -->
      <view v-if="currentTool === 'weather'" class="weather-tool">
        <view class="tool-header">
          <text class="tool-title text-scale-lg">🌤️ 天气查询</text>
          <text class="close-btn" @click="closeTool">✕</text>
        </view>

        <view class="weather-content">
          <view class="weather-current">
            <text class="weather-city text-scale-lg">北京</text>
            <text class="weather-temp">{{ weatherData.temp }}°C</text>
            <text class="weather-condition">{{ weatherData.condition }}</text>
          </view>
          <view class="weather-details">
            <view class="detail-item">
              <text class="detail-label">湿度</text>
              <text class="detail-value">{{ weatherData.humidity }}%</text>
            </view>
            <view class="detail-item">
              <text class="detail-label">风速</text>
              <text class="detail-value">{{ weatherData.wind }}级</text>
            </view>
            <view class="detail-item">
              <text class="detail-label">空气质量</text>
              <text :class="['detail-value', weatherData.aqiLevel]">{{ weatherData.aqi }}</text>
            </view>
          </view>
          <text class="weather-tip text-scale">天气数据为示例数据，实际需接入天气API</text>
        </view>
      </view>

      <!-- 计算器工具 -->
      <view v-if="currentTool === 'calculator'" class="calculator-tool">
        <view class="tool-header">
          <text class="tool-title text-scale-lg">🧮 计算器</text>
          <text class="close-btn" @click="closeTool">✕</text>
        </view>

        <view class="calculator">
          <view class="display">{{ calcDisplay }}</view>
          <view class="buttons">
            <button class="btn btn-clear" @click="calcClear">C</button>
            <button class="btn btn-delete" @click="calcDelete">⌫</button>
            <button class="btn btn-op" @click="calcInput('%')">%</button>
            <button class="btn btn-op" @click="calcInput('/')">÷</button>

            <button class="btn btn-num" @click="calcInput('7')">7</button>
            <button class="btn btn-num" @click="calcInput('8')">8</button>
            <button class="btn btn-num" @click="calcInput('9')">9</button>
            <button class="btn btn-op" @click="calcInput('*')">×</button>

            <button class="btn btn-num" @click="calcInput('4')">4</button>
            <button class="btn btn-num" @click="calcInput('5')">5</button>
            <button class="btn btn-num" @click="calcInput('6')">6</button>
            <button class="btn btn-op" @click="calcInput('-')">−</button>

            <button class="btn btn-num" @click="calcInput('1')">1</button>
            <button class="btn btn-num" @click="calcInput('2')">2</button>
            <button class="btn btn-num" @click="calcInput('3')">3</button>
            <button class="btn btn-op" @click="calcInput('+')">+</button>

            <button class="btn btn-num btn-zero" @click="calcInput('0')">0</button>
            <button class="btn btn-num" @click="calcInput('.')">.</button>
            <button class="btn btn-equals" @click="calcResult">=</button>
          </view>
        </view>
      </view>

      <!-- 便民电话工具 -->
      <view v-if="currentTool === 'phonebook'" class="phonebook-tool">
        <view class="tool-header">
          <text class="tool-title text-scale-lg">📞 便民电话</text>
          <text class="close-btn" @click="closeTool">✕</text>
        </view>

        <view class="phonebook-content">
          <view class="phone-section">
            <text class="phone-section-title text-scale-subtitle">紧急电话</text>
            <view class="phone-item" @click="makeCall('110')">
              <text class="phone-name">报警电话</text>
              <text class="phone-number">110</text>
            </view>
            <view class="phone-item" @click="makeCall('120')">
              <text class="phone-name">急救电话</text>
              <text class="phone-number">120</text>
            </view>
            <view class="phone-item" @click="makeCall('119')">
              <text class="phone-name">火警电话</text>
              <text class="phone-number">119</text>
            </view>
          </view>

          <view class="phone-section">
            <text class="phone-section-title text-scale-subtitle">常用服务</text>
            <view class="phone-item" @click="makeCall('12345')">
              <text class="phone-name">政务服务热线</text>
              <text class="phone-number">12345</text>
            </view>
            <view class="phone-item" @click="makeCall('12320')">
              <text class="phone-name">公共卫生热线</text>
              <text class="phone-number">12320</text>
            </view>
            <view class="phone-item" @click="makeCall('12315')">
              <text class="phone-name">消费者投诉</text>
              <text class="phone-number">12315</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 记事本工具 -->
      <view v-if="currentTool === 'notepad'" class="notepad-tool">
        <view class="tool-header">
          <text class="tool-title text-scale-lg">📝 记事本</text>
          <text class="close-btn" @click="closeTool">✕</text>
        </view>

        <view class="notepad-content">
          <view class="note-form">
            <textarea
              v-model="noteContent"
              placeholder="在这里输入您的笔记..."
              class="note-textarea"
            ></textarea>
            <view class="note-actions">
              <text class="note-tip text-scale-sm">{{ noteContent.length }} 字</text>
              <button class="save-btn" @click="saveNote">保存</button>
            </view>
          </view>

          <view class="history-section">
            <text class="history-title text-scale-subtitle">历史笔记</text>
            <view v-if="noteList.length > 0" class="note-list">
              <view v-for="(note, index) in noteList" :key="index" class="note-item">
                <view class="note-text">{{ note.content }}</view>
                <view class="note-meta">
                  <text class="note-date">{{ note.date }}</text>
                  <text class="delete-btn" @click="deleteNote(index)">删除</text>
                </view>
              </view>
            </view>
            <view v-else class="empty-history">
              <text class="text-scale">暂无笔记</text>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { getFeedList, type PostItem } from '@/api/feed';
import { getCircleList, type CircleItem } from '@/api/circle';

const categoryList = ref<CircleItem[]>([]);
const courseList = ref<PostItem[]>([]);
const page = ref(1);
const pageSize = ref(10);
const loading = ref(false);
const refreshing = ref(false);
const noMore = ref(false);

// 工具相关
const showToolModal = ref(false);
const currentTool = ref('');
const currentDate = ref('');

// 健康提示
const todayTip = ref('适量运动，保持健康的生活方式。建议每天散步30分钟。');

// 血压记录数据
const bpData = ref({
  systolic: '',
  diastolic: '',
  date: new Date().toISOString().split('T')[0]
});
const bpHistory = ref<any[]>([]);

// 用药提醒数据
const medData = ref({
  name: '',
  time: '08:00',
  note: ''
});
const medicationList = ref<any[]>([]);

// 天气数据（示例）
const weatherData = ref({
  temp: 22,
  condition: '晴',
  humidity: 45,
  wind: 3,
  aqi: 75,
  aqiLevel: 'good'
});

// 计算器数据
const calcDisplay = ref('0');

// 记事本数据
const noteContent = ref('');
const noteList = ref<any[]>([]);

// 获取问候语
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 6) return '凌晨好';
  if (hour < 9) return '早上好';
  if (hour < 12) return '上午好';
  if (hour < 14) return '中午好';
  if (hour < 18) return '下午好';
  if (hour < 22) return '晚上好';
  return '夜深了';
};

// 更新当前日期
const updateDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  currentDate.value = `${year}年${month}月${day}日`;
};

// 获取分类图标
const getCategoryIcon = (name: string) => {
  const iconMap: Record<string, string> = {
    '食物': '🍚',
    '禁忌': '⚠️',
    '健身': '🏃',
    '银龄无忧': '🌿'
  };
  return iconMap[name] || '📚';
};

// 获取分类名称
const getCategoryName = (circleId: number) => {
  const category = categoryList.value.find(c => c.id === circleId);
  return category ? category.name : '综合';
};

// 加载分类列表
const loadCategories = async () => {
  try {
    const res = await getCircleList();
    categoryList.value = res || [];
  } catch (error) {
    console.error('加载分类失败', error);
  }
};

// 加载课程列表
const loadCourseList = async () => {
  if (loading.value || noMore.value) return;

  loading.value = true;
  try {
    const res = await getFeedList({
      type: 'recommend',
      page: page.value,
      pageSize: pageSize.value,
    });

    if (page.value === 1) {
      courseList.value = res.list || [];
    } else {
      courseList.value.push(...(res.list || []));
    }

    if (courseList.value.length >= res.total) {
      noMore.value = true;
    }

    page.value++;
  } catch (error) {
    console.error('加载课程列表失败', error);
  } finally {
    loading.value = false;
    refreshing.value = false;
  }
};

// 下拉刷新
const onRefresh = () => {
  refreshing.value = true;
  page.value = 1;
  courseList.value = [];
  noMore.value = false;
  loadCourseList();
};

// 加载更多
const loadMore = () => {
  if (!loading.value && !noMore.value) {
    loadCourseList();
  }
};

// 跳转详情
const goToDetail = (id: number) => {
  uni.navigateTo({
    url: `/pages/detail/detail?id=${id}`,
  });
};

// 跳转分类详情
const goToCategoryDetail = (id: number) => {
  uni.navigateTo({
    url: `/pages/circle-detail/circle-detail?id=${id}`,
  });
};

// 跳转全部分类
const goToAllCategories = () => {
  uni.switchTab({
    url: '/pages/circle/circle',
  });
};

// 打开工具
const openTool = (tool: string) => {
  currentTool.value = tool;
  showToolModal.value = true;
};

// 关闭工具
const closeTool = () => {
  showToolModal.value = false;
  currentTool.value = '';
};

// 血压记录相关
const onDateChange = (e: any) => {
  bpData.value.date = e.detail.value;
};

const saveBPRecord = () => {
  if (!bpData.value.systolic || !bpData.value.diastolic) {
    uni.showToast({ title: '请输入血压值', icon: 'none' });
    return;
  }

  const systolic = parseInt(bpData.value.systolic);
  const diastolic = parseInt(bpData.value.diastolic);

  let status = 'normal';
  if (systolic >= 140 || diastolic >= 90) {
    status = 'high';
  } else if (systolic < 90 || diastolic < 60) {
    status = 'low';
  }

  bpHistory.value.unshift({
    systolic,
    diastolic,
    date: bpData.value.date,
    status
  });

  // 保存到本地存储
  uni.setStorageSync('bpHistory', bpHistory.value);

  uni.showToast({ title: '保存成功', icon: 'success' });

  // 清空输入
  bpData.value.systolic = '';
  bpData.value.diastolic = '';
};

const deleteBPRecord = (index: number) => {
  uni.showModal({
    title: '确认删除',
    content: '确定要删除这条记录吗？',
    success: (res) => {
      if (res.confirm) {
        bpHistory.value.splice(index, 1);
        uni.setStorageSync('bpHistory', bpHistory.value);
        uni.showToast({ title: '已删除', icon: 'success' });
      }
    }
  });
};

const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    'normal': '正常',
    'high': '偏高',
    'low': '偏低'
  };
  return statusMap[status] || '正常';
};

// 用药提醒相关
const onTimeChange = (e: any) => {
  medData.value.time = e.detail.value;
};

const addMedicationReminder = () => {
  if (!medData.value.name) {
    uni.showToast({ title: '请输入药品名称', icon: 'none' });
    return;
  }

  medicationList.value.push({
    name: medData.value.name,
    time: medData.value.time,
    note: medData.value.note
  });

  // 保存到本地存储
  uni.setStorageSync('medicationList', medicationList.value);

  uni.showToast({ title: '添加成功', icon: 'success' });

  // 清空输入
  medData.value.name = '';
  medData.value.note = '';
};

const deleteMedication = (index: number) => {
  uni.showModal({
    title: '确认删除',
    content: '确定要删除这条提醒吗？',
    success: (res) => {
      if (res.confirm) {
        medicationList.value.splice(index, 1);
        uni.setStorageSync('medicationList', medicationList.value);
        uni.showToast({ title: '已删除', icon: 'success' });
      }
    }
  });
};

// 计算器相关
const calcInput = (value: string) => {
  if (calcDisplay.value === '0' && value !== '.') {
    calcDisplay.value = value;
  } else {
    calcDisplay.value += value;
  }
};

const calcClear = () => {
  calcDisplay.value = '0';
};

const calcDelete = () => {
  calcDisplay.value = calcDisplay.value.slice(0, -1) || '0';
};

const calcResult = () => {
  try {
    calcDisplay.value = String(eval(calcDisplay.value));
  } catch (error) {
    calcDisplay.value = 'Error';
  }
};

// 便民电话相关
const makeCall = (phone: string) => {
  uni.showModal({
    title: '拨打电话',
    content: `确定要拨打 ${phone} 吗？`,
    success: (res) => {
      if (res.confirm) {
        uni.makePhoneCall({
          phoneNumber: phone
        });
      }
    }
  });
};

// 记事本相关
const saveNote = () => {
  if (!noteContent.value.trim()) {
    uni.showToast({ title: '请输入内容', icon: 'none' });
    return;
  }

  noteList.value.unshift({
    content: noteContent.value,
    date: new Date().toLocaleString()
  });

  // 保存到本地存储
  uni.setStorageSync('noteList', noteList.value);

  uni.showToast({ title: '保存成功', icon: 'success' });

  noteContent.value = '';
};

const deleteNote = (index: number) => {
  uni.showModal({
    title: '确认删除',
    content: '确定要删除这条笔记吗？',
    success: (res) => {
      if (res.confirm) {
        noteList.value.splice(index, 1);
        uni.setStorageSync('noteList', noteList.value);
        uni.showToast({ title: '已删除', icon: 'success' });
      }
    }
  });
};

// 加载本地数据
const loadLocalData = () => {
  try {
    bpHistory.value = uni.getStorageSync('bpHistory') || [];
    medicationList.value = uni.getStorageSync('medicationList') || [];
    noteList.value = uni.getStorageSync('noteList') || [];
  } catch (error) {
    console.error('加载本地数据失败', error);
  }
};

onMounted(() => {
  updateDate();
  loadCategories();
  loadCourseList();
  loadLocalData();
});
</script>

<style lang="scss" scoped>
.home-container {
  min-height: 100vh;
  background-color: var(--bg-color);
  padding-bottom: 24rpx;
}

/* 欢迎区域 */
.welcome-section {
  background: linear-gradient(135deg, var(--primary-color) 0%, #A29BFE 100%);
  padding: 60rpx 32rpx 40rpx;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.welcome-text {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.greeting {
  color: #fff;
  font-weight: bold;
}

.subtitle {
  color: rgba(255, 255, 255, 0.9);
  font-size: 28rpx;
}

.date-info {
  text-align: right;
}

.date-text {
  color: rgba(255, 255, 255, 0.8);
  font-size: 28rpx;
}

/* 实用工具区域 */
.tools-section {
  background-color: #fff;
  margin: 24rpx;
  border-radius: 16rpx;
  padding: 24rpx;
  box-shadow: 0 4rpx 12rpx rgba(108, 92, 231, 0.1);
}

.section-header {
  margin-bottom: 24rpx;
}

.section-title {
  font-weight: bold;
  color: var(--text-color);
}

.section-more {
  color: var(--primary-color);
}

.tools-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24rpx;
}

.tool-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
  padding: 24rpx 16rpx;
}

.tool-icon {
  width: 100rpx;
  height: 100rpx;
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-text {
  font-size: 48rpx;
}

.tool-name {
  font-size: 24rpx;
  color: var(--text-color);
}

/* 健康提示 */
.health-tip-section {
  background-color: #fff;
  margin: 0 24rpx 24rpx;
  border-radius: 16rpx;
  padding: 24rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}

.health-tip-card {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 20rpx;
  background: linear-gradient(135deg, #FFF9E6 0%, #FFEAA7 100%);
  border-radius: 12rpx;
}

.tip-icon {
  font-size: 40rpx;
}

.tip-content {
  flex: 1;
  color: var(--text-color);
  font-size: 28rpx;
}

/* 课程分类 */
.categories-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24rpx;
  padding: 0 24rpx;
  margin-bottom: 24rpx;
}

.category-item {
  background-color: #fff;
  border-radius: 16rpx;
  padding: 32rpx 24rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}

.category-icon {
  font-size: 64rpx;
}

.category-name {
  color: var(--text-color);
  font-weight: bold;
}

.category-count {
  color: var(--text-light);
}

/* 课程列表 */
.course-list {
  height: calc(100vh - 800rpx);
  padding: 0 24rpx;
}

.course-card {
  background-color: #fff;
  border-radius: 16rpx;
  overflow: hidden;
  margin-bottom: 24rpx;
  display: flex;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}

.course-cover {
  width: 240rpx;
  height: 180rpx;
  flex-shrink: 0;
}

.course-cover-placeholder {
  background: linear-gradient(135deg, var(--primary-color) 0%, #A29BFE 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.placeholder-icon {
  font-size: 64rpx;
}

.course-info {
  flex: 1;
  padding: 20rpx;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.course-title {
  color: var(--text-color);
  font-weight: bold;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.course-desc {
  color: var(--text-light);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.course-meta {
  color: var(--text-light);
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.meta-tag {
  color: var(--primary-color);
}

.meta-divider {
  color: #E0E0E0;
}

.course-type {
  position: absolute;
  top: 20rpx;
  right: 20rpx;
}

.type-tag {
  padding: 8rpx 16rpx;
  border-radius: 8rpx;
  font-size: 20rpx;
}

.video-tag {
  background-color: rgba(108, 92, 231, 0.1);
  color: var(--primary-color);
}

.article-tag {
  background-color: rgba(0, 184, 148, 0.1);
  color: var(--secondary-color);
}

/* 加载状态 */
.load-more,
.no-more {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16rpx;
  padding: 32rpx 0;
  color: var(--text-light);
}

.loading-icon {
  font-size: 32rpx;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 0;
}

.empty-icon {
  font-size: 80rpx;
  margin-bottom: 24rpx;
}

/* 工具弹窗 */
.modal-overlay {
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

.modal-content {
  width: 90%;
  max-height: 80vh;
  background-color: #fff;
  border-radius: 24rpx;
  overflow-y: auto;
}

.tool-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 32rpx;
  border-bottom: 1rpx solid #eee;
}

.tool-title {
  font-weight: bold;
  color: var(--text-color);
}

.close-btn {
  font-size: 40rpx;
  color: var(--text-light);
  padding: 8rpx;
}

/* 血压记录工具 */
.blood-pressure-tool,
.medication-tool,
.weather-tool,
.calculator-tool,
.phonebook-tool,
.notepad-tool {
  padding: 32rpx;
}

.bp-form,
.medication-form {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.form-label {
  font-weight: bold;
  color: var(--text-color);
}

.form-input,
.picker-input,
.note-textarea {
  height: 80rpx;
  padding: 16rpx 24rpx;
  background-color: #f5f5f5;
  border-radius: 8rpx;
  border: none;
}

.note-textarea {
  height: 200rpx;
  padding: 16rpx 24rpx;
}

.unit {
  color: var(--text-light);
  font-size: 28rpx;
}

.save-btn {
  background-color: var(--primary-color);
  color: #fff;
  border: none;
  border-radius: 40rpx;
  height: 80rpx;
  font-size: 32rpx;
}

.history-section {
  margin-top: 32rpx;
}

.history-title {
  font-weight: bold;
  color: var(--text-color);
  margin-bottom: 16rpx;
}

.history-list,
.medication-list,
.note-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.history-item,
.medication-item,
.note-item {
  padding: 24rpx;
  background-color: #f9f9f9;
  border-radius: 12rpx;
}

.history-date,
.medication-date,
.note-date {
  color: var(--text-light);
  font-size: 24rpx;
}

.history-values,
.medication-info {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-top: 8rpx;
}

.value-item {
  font-size: 32rpx;
  font-weight: bold;
  color: var(--text-color);
}

.status-tag {
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
  font-size: 24rpx;
}

.status-tag.normal {
  background-color: rgba(0, 184, 148, 0.1);
  color: var(--secondary-color);
}

.status-tag.high {
  background-color: rgba(255, 107, 107, 0.1);
  color: #FF6B6B;
}

.status-tag.low {
  background-color: rgba(253, 203, 110, 0.1);
  color: #FDCB6E;
}

.delete-btn {
  color: var(--danger-color);
  font-size: 24rpx;
}

.medication-name,
.note-text {
  font-size: 28rpx;
  color: var(--text-color);
  flex: 1;
}

.medication-time {
  color: var(--primary-color);
  font-size: 32rpx;
  font-weight: bold;
}

.medication-note,
.note-meta {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-top: 8rpx;
}

.medication-note {
  color: var(--text-light);
  font-size: 24rpx;
}

.empty-history {
  text-align: center;
  padding: 60rpx 0;
  color: var(--text-light);
}

/* 天气工具 */
.weather-content {
  text-align: center;
  padding: 40rpx 0;
}

.weather-city {
  font-size: 48rpx;
  font-weight: bold;
  color: var(--text-color);
  margin-bottom: 16rpx;
}

.weather-temp {
  font-size: 80rpx;
  font-weight: bold;
  color: var(--primary-color);
  display: block;
  margin-bottom: 8rpx;
}

.weather-condition {
  font-size: 32rpx;
  color: var(--text-light);
}

.weather-details {
  display: flex;
  justify-content: space-around;
  margin: 40rpx 0;
  padding: 24rpx;
  background-color: #f9f9f9;
  border-radius: 12rpx;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.detail-label {
  color: var(--text-light);
  font-size: 24rpx;
}

.detail-value {
  font-size: 32rpx;
  font-weight: bold;
  color: var(--text-color);
}

.detail-value.good {
  color: var(--secondary-color);
}

.detail-value.moderate {
  color: #FDCB6E;
}

.detail-value.poor {
  color: var(--danger-color);
}

.weather-tip {
  color: var(--text-light);
  font-size: 24rpx;
}

/* 计算器 */
.calculator {
  padding: 24rpx 0;
}

.display {
  background-color: #f5f5f5;
  padding: 32rpx;
  border-radius: 16rpx;
  text-align: right;
  font-size: 48rpx;
  font-weight: bold;
  color: var(--text-color);
  margin-bottom: 24rpx;
  min-height: 100rpx;
}

.buttons {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12rpx;
}

.btn {
  height: 100rpx;
  border: none;
  border-radius: 16rpx;
  font-size: 36rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-num {
  background-color: #f5f5f5;
  color: var(--text-color);
}

.btn-op {
  background-color: rgba(108, 92, 231, 0.1);
  color: var(--primary-color);
}

.btn-clear,
.btn-delete {
  background-color: rgba(255, 107, 107, 0.1);
  color: var(--danger-color);
}

.btn-equals {
  background-color: var(--primary-color);
  color: #fff;
  grid-column: span 2;
}

.btn-zero {
  grid-column: span 2;
}

/* 便民电话 */
.phonebook-content {
  display: flex;
  flex-direction: column;
  gap: 32rpx;
}

.phone-section-title {
  font-weight: bold;
  color: var(--text-color);
  margin-bottom: 16rpx;
}

.phone-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx;
  background-color: #f9f9f9;
  border-radius: 12rpx;
}

.phone-name {
  font-size: 28rpx;
  color: var(--text-color);
}

.phone-number {
  font-size: 32rpx;
  font-weight: bold;
  color: var(--primary-color);
}

/* 记事本 */
.note-form {
  margin-bottom: 32rpx;
}

.note-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16rpx;
}

.note-tip {
  color: var(--text-light);
}
</style>