<template>
  <div class="statistics-container">
    <!-- 概览卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon users">
              <el-icon><User /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ overview.userCount || 0 }}</div>
              <div class="stat-label">总用户数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon posts">
              <el-icon><Document /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ overview.postCount || 0 }}</div>
              <div class="stat-label">总帖子数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon comments">
              <el-icon><ChatDotRound /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ overview.commentCount || 0 }}</div>
              <div class="stat-label">总评论数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon circles">
              <el-icon><Opportunity /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ overview.circleCount || 0 }}</div>
              <div class="stat-label">总圈子数</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 今日数据 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card class="stat-card small">
          <div class="stat-content">
            <div class="stat-info">
              <div class="stat-value text-success">+{{ overview.todayNewUsers || 0 }}</div>
              <div class="stat-label">今日新增用户</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card small">
          <div class="stat-content">
            <div class="stat-info">
              <div class="stat-value text-primary">+{{ overview.todayNewPosts || 0 }}</div>
              <div class="stat-label">今日新增帖子</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card small">
          <div class="stat-content">
            <div class="stat-info">
              <div class="stat-value text-warning">{{ overview.pendingAudit || 0 }}</div>
              <div class="stat-label">待审核内容</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card small">
          <div class="stat-content">
            <div class="stat-info">
              <div class="stat-value text-info">{{ overview.activeUsers || 0 }}</div>
              <div class="stat-label">今日活跃用户</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 统计说明 -->
    <el-card>
      <template #header>
        <span>数据统计说明</span>
      </template>
      <el-alert
        title="数据统计功能"
        type="info"
        description="此页面展示平台核心运营数据。更多趋势图表功能正在开发中..."
        show-icon
        :closable="false"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { User, Document, ChatDotRound, Opportunity } from '@element-plus/icons-vue';
import { getOverviewStats } from '@/api/content';

const overview = reactive({
  userCount: 0,
  postCount: 0,
  commentCount: 0,
  circleCount: 0,
  todayNewUsers: 0,
  todayNewPosts: 0,
  pendingAudit: 0,
  activeUsers: 0,
});

const loadStats = async () => {
  try {
    const data = await getOverviewStats();
    Object.assign(overview, data);
  } catch (error) {
    console.log('统计数据加载失败，使用默认值');
  }
};

onMounted(() => {
  loadStats();
});
</script>

<style lang="scss" scoped>
.statistics-container {
  .stats-row {
    margin-bottom: 20px;
  }

  .stat-card {
    .stat-content {
      display: flex;
      align-items: center;
      gap: 20px;

      .stat-icon {
        width: 60px;
        height: 60px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 28px;
        color: #fff;

        &.users {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        &.posts {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        }

        &.comments {
          background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
        }

        &.circles {
          background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
        }
      }

      .stat-info {
        flex: 1;

        .stat-value {
          font-size: 28px;
          font-weight: bold;
          margin-bottom: 4px;

          &.text-success { color: #67c23a; }
          &.text-primary { color: #409eff; }
          &.text-warning { color: #e6a23c; }
          &.text-info { color: #909399; }
        }

        .stat-label {
          font-size: 14px;
          color: #999;
        }
      }
    }

    &.small .stat-content {
      justify-content: center;
      text-align: center;

      .stat-info .stat-value {
        font-size: 24px;
      }
    }
  }
}
</style>
