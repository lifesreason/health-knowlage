<template>
  <div class="comment-container">
    <el-card class="filter-card">
      <el-row :gutter="20" align="middle">
        <el-col :span="7">
          <el-input
            v-model="keyword"
            placeholder="搜索评论内容"
            clearable
            @keyup.enter="handleFilterChange"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-col>

        <el-col :span="5">
          <el-select v-model="status" placeholder="审核状态" clearable @change="handleFilterChange">
            <el-option label="待审核" :value="0" />
            <el-option label="已通过" :value="1" />
            <el-option label="已驳回" :value="2" />
          </el-select>
        </el-col>

        <el-col :span="12" class="filter-actions">
          <el-button
            type="success"
            :disabled="selectedIds.length === 0"
            :loading="batchLoading"
            @click="handleBatchAudit('approve')"
          >批量通过</el-button>
          <el-button
            type="warning"
            :disabled="selectedIds.length === 0"
            :loading="batchLoading"
            @click="handleBatchAudit('reject')"
          >批量驳回</el-button>
          <el-button @click="loadList">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </el-col>
      </el-row>
    </el-card>

    <el-card class="list-card">
      <el-table :data="list" v-loading="loading" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="48" :selectable="isPendingRow" />
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
        <el-table-column label="审核状态" width="120">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.auditStatus)">
              {{ getStatusText(row.auditStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button v-if="row.auditStatus === 0" type="success" link @click="handleApprove(row)">通过</el-button>
            <el-button v-if="row.auditStatus === 0" type="warning" link @click="handleReject(row)">驳回</el-button>
            <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handlePageSizeChange"
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
import {
  getCommentList,
  deleteComment,
  approveComment,
  rejectComment,
  batchAuditComments,
} from '@/api/content';

const loading = ref(false);
const batchLoading = ref(false);
const keyword = ref('');
const status = ref<number | undefined>(undefined);
const page = ref(1);
const pageSize = ref(20);
const total = ref(0);
const list = ref<any[]>([]);
const selectedIds = ref<number[]>([]);

const loadList = async () => {
  loading.value = true;
  try {
    const data = await getCommentList({
      page: page.value,
      pageSize: pageSize.value,
      keyword: keyword.value || undefined,
      status: status.value,
    });
    list.value = data.list || [];
    total.value = data.total || 0;
  } catch {
    ElMessage.error('加载失败');
  } finally {
    loading.value = false;
  }
};

const handleFilterChange = () => {
  page.value = 1;
  loadList();
};

const handlePageSizeChange = () => {
  page.value = 1;
  loadList();
};

const handleSelectionChange = (rows: any[]) => {
  selectedIds.value = rows.map((item) => Number(item.id)).filter((id) => Number.isFinite(id) && id > 0);
};

const isPendingRow = (row: any) => Number(row?.auditStatus) === 0;

const getStatusText = (auditStatus: number) => {
  if (auditStatus === 0) return '待审核';
  if (auditStatus === 1) return '已通过';
  if (auditStatus === 2) return '已驳回';
  return '未知';
};

const getStatusTagType = (auditStatus: number): 'info' | 'success' | 'warning' | 'danger' => {
  if (auditStatus === 0) return 'warning';
  if (auditStatus === 1) return 'success';
  if (auditStatus === 2) return 'danger';
  return 'info';
};

const handleApprove = async (row: any) => {
  try {
    await approveComment(row.id);
    ElMessage.success('审核通过');
    loadList();
  } catch {
    ElMessage.error('操作失败');
  }
};

const handleReject = async (row: any) => {
  try {
    await rejectComment(row.id);
    ElMessage.success('已驳回');
    loadList();
  } catch {
    ElMessage.error('操作失败');
  }
};

const handleBatchAudit = async (action: 'approve' | 'reject') => {
  if (!selectedIds.value.length) return;
  const actionText = action === 'approve' ? '通过' : '驳回';

  try {
    await ElMessageBox.confirm(`确定批量${actionText}选中的 ${selectedIds.value.length} 条评论吗？`, '提示', {
      type: 'warning',
    });

    batchLoading.value = true;
    await batchAuditComments({
      commentIds: selectedIds.value,
      action,
    });

    ElMessage.success(`批量${actionText}成功`);
    selectedIds.value = [];
    loadList();
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(`批量${actionText}失败`);
    }
  } finally {
    batchLoading.value = false;
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

    :deep(.el-select) {
      width: 100%;
    }

    .filter-actions {
      text-align: right;
    }
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
