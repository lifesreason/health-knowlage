<template>
  <div class="user-container">
    <!-- 筛选栏 -->
    <el-card class="filter-card">
      <el-row :gutter="20" align="middle">
        <el-col :span="8">
          <el-input
            v-model="keyword"
            placeholder="搜索用户昵称或手机号"
            clearable
            @clear="loadList"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-col>
        <el-col :span="4">
          <el-button type="primary" @click="loadList">搜索</el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- 用户列表 -->
    <el-card class="list-card">
      <el-table :data="list" v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="用户信息" width="200">
          <template #default="{ row }">
            <div class="user-info">
              <el-avatar :size="40" :src="row.avatarUrl" />
              <div class="user-detail">
                <div class="nickname">{{ row.nickname }}</div>
                <div class="openid">{{ row.openid }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="role" label="角色" width="100">
          <template #default="{ row }">
            <el-tag :type="row.role === 1 ? 'success' : row.role === 9 ? 'danger' : ''">
              {{ getRoleText(row.role) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="fontScale" label="字体倍率" width="100">
          <template #default="{ row }">
            {{ row.fontScale }}x
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 1 ? '正常' : '封禁' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="认证" width="100">
          <template #default="{ row }">
            <el-tag :type="row.isVerified ? 'success' : 'info'">
              {{ row.isVerified ? '已认证' : '未认证' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 1"
              type="danger"
              link
              @click="handleBan(row)"
            >
              封禁
            </el-button>
            <el-button
              v-else
              type="success"
              link
              @click="handleUnban(row)"
            >
              解封
            </el-button>
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
import { Search } from '@element-plus/icons-vue';
import { getUserList, updateUserStatus } from '@/api/user';

const loading = ref(false);
const keyword = ref('');
const page = ref(1);
const pageSize = ref(20);
const total = ref(0);
const list = ref<any[]>([]);

// 加载列表
const loadList = async () => {
  loading.value = true;
  try {
    const data = await getUserList({
      page: page.value,
      pageSize: pageSize.value,
      keyword: keyword.value,
    });
    list.value = data.list || [];
    total.value = data.total || 0;
  } catch (error) {
    ElMessage.error('加载列表失败');
  } finally {
    loading.value = false;
  }
};

// 封禁用户
const handleBan = async (row: any) => {
  try {
    await ElMessageBox.confirm(`确定封禁用户 ${row.nickname} 吗？`, '提示', {
      type: 'warning',
    });
    await updateUserStatus(row.id, 0);
    ElMessage.success('封禁成功');
    loadList();
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败');
    }
  }
};

// 解封用户
const handleUnban = async (row: any) => {
  try {
    await ElMessageBox.confirm(`确定解封用户 ${row.nickname} 吗？`, '提示', {
      type: 'warning',
    });
    await updateUserStatus(row.id, 1);
    ElMessage.success('解封成功');
    loadList();
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败');
    }
  }
};

// 获取角色文本
const getRoleText = (role: number) => {
  const map: Record<number, string> = {
    0: '普通用户',
    1: '认证医师',
    9: '管理员',
  };
  return map[role] || '未知';
};

// 格式化时间
const formatTime = (time: string) => {
  return new Date(time).toLocaleString('zh-CN');
};

onMounted(() => {
  loadList();
});
</script>

<style lang="scss" scoped>
.user-container {
  .filter-card {
    margin-bottom: 20px;
  }

  .list-card {
    .user-info {
      display: flex;
      align-items: center;
      gap: 12px;

      .user-detail {
        .nickname {
          font-weight: bold;
          margin-bottom: 4px;
        }

        .openid {
          font-size: 12px;
          color: #999;
        }
      }
    }

    .pagination {
      margin-top: 20px;
      display: flex;
      justify-content: flex-end;
    }
  }
}
</style>