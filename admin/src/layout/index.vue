<template>
  <el-container class="layout-container">
    <el-aside width="200px">
      <div class="logo">
        <h2>银龄健康</h2>
        <p>管理后台</p>
      </div>
      <el-menu
        :default-active="activeMenu"
        class="el-menu-vertical"
        router
      >
        <el-menu-item index="/dashboard">
          <el-icon><HomeFilled /></el-icon>
          <span>首页</span>
        </el-menu-item>
        <el-menu-item index="/audit">
          <el-icon><DocumentChecked /></el-icon>
          <span>内容审核</span>
        </el-menu-item>
        <el-menu-item index="/user">
          <el-icon><User /></el-icon>
          <span>用户管理</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header>
        <div class="header-left">
          <span>{{ currentPageTitle }}</span>
        </div>
        <div class="header-right">
          <el-dropdown @command="handleCommand">
            <span class="el-dropdown-link">
              <el-icon><User /></el-icon>
              <span>管理员</span>
              <el-icon class="el-icon--right"><arrow-down /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      <el-main>
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { HomeFilled, DocumentChecked, User, ArrowDown } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

const route = useRoute();
const router = useRouter();

const activeMenu = computed(() => route.path);
const currentPageTitle = computed(() => route.meta.title as string);

const handleCommand = (command: string) => {
  if (command === 'logout') {
    localStorage.removeItem('token');
    router.push('/login');
    ElMessage.success('已退出登录');
  }
};
</script>

<style lang="scss" scoped>
.layout-container {
  width: 100%;
  height: 100vh;
}

.el-aside {
  background-color: #304156;
  color: #fff;

  .logo {
    padding: 20px;
    text-align: center;

    h2 {
      margin: 0;
      font-size: 18px;
    }

    p {
      margin: 5px 0 0;
      font-size: 12px;
      opacity: 0.7;
    }
  }

  .el-menu {
    border-right: none;
    background-color: #304156;

    .el-menu-item {
      color: #bfcbd9;

      &:hover,
      &.is-active {
        background-color: #263445;
        color: #409eff;
      }
    }
  }
}

.el-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #fff;
  border-bottom: 1px solid #e6e6e6;

  .header-left {
    span {
      font-size: 16px;
      font-weight: bold;
    }
  }

  .header-right {
    .el-dropdown-link {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
    }
  }
}

.el-main {
  background-color: #f0f2f5;
  padding: 20px;
}
</style>