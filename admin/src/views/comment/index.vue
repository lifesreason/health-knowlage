<template>
  <div class="comment-container">
    <!-- 筛选栏 -->
    <el-card class="filter-card">
      <el-row :gutter="20" align="middle">
        <el-col :span="8">
          <el-input
            v-model="keyword"
            placeholder="搜索评论内容"
            clearable
            @keyup.enter="loadList"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-col>
        <el-col :span="16" style="text-align: right">
          <el-button @click="loadList">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- 评论列表 -->
    <el-card class="list-card">
      <el-table :data="list" v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="评论者" width="150">
          <template #default="{ row }">
            <div class="user-info">
              <el-avatar :size="32" :src="row.user?.avatarUrl" />
              <span>{{ row.user?.nickname || '未知' }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="content" label="评论内容" min-width="300" show-overflow-tooltip />
        <el-table-column label="所属帖子" min-width="200">
          <template #default="{ row }">
            {{ row.post?.title || `帖子#${row.postId}` }}
          </template>
        </el-table-column>
        <el-table-column prop="likeCount" label="点赞数" width="100" />
        <el-table-column label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadList"
          @current-change="loadList"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Search, Refresh } from '@element-plus/icons-vue';
import { getCommentList, deleteComment } from '@/api/content';

const loading = ref(false);
const keyword = ref('');
const page = ref(1);
const pageSize = ref(20);
const total = ref(0);
const list = ref<any[]>([]);

const loadList = async () => {
  loading.value = true;
  try {
    const data = await getCommentList({
      page: page.value,
      pageSize: pageSize.value,
      keyword: keyword.value || undefined,
    });
    list.value = data.list || [];
    total.value = data.total || 0;
  } catch (error) {
    ElMessage.error('加载失败');
  } finally {
    loading.value = false;
  }
};

const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm('确定删除这条评论吗？', '提示', {
      type: 'warning',
    });
    await deleteComment(row.id);
    ElMessage.success('删除成功');
    loadList();
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败');
    }
  }
};

const formatTime = (time: string) => {
  return new Date(time).toLocaleString('zh-CN');
};

onMounted(() => {
  loadList();
});
</script>

<style lang="scss" scoped>
.comment-container {
  .filter-card {
    margin-bottom: 20px;
  }

  .list-card {
    .user-info {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .pagination {
      margin-top: 20px;
      display: flex;
      justify-content: flex-end;
    }
  }
}
</style>
