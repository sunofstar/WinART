/** @description Layout::analysis */
<!-- route 권한 관련 false일 경우 login 없이 접근 불가 (s) -->
<route>{ meta: { disallowAuthed: false } }</route>
<!-- route 권한 관련 false일 경우 login 없이 접근 불가 (e) -->

<script setup lang="ts">
import electronApi from '@renderer/api/electronApi'
import { computed, onMounted, Ref, ref } from 'vue'
// import loginApi from '@renderer/api/loginApi'
import { useRouter } from 'vue-router'
import { useStoreResetExceptSystem } from '@renderer/stores'
import { useUserStore } from '@renderer/stores/userStore'
import { openConfirm, openDialog } from '@renderer/composables/useDialog'
import { useQuasar, QDialogOptions } from 'quasar'
import MenuBarUserItem from '@renderer/components/result/header/MenuBarUserItem.vue'
import SettingDialog from '@renderer/components/analysis/header/SettingDialog.vue'
const isPortable: Ref<boolean> = ref(false)
import { Icon } from '@iconify/vue'
const userStore = useUserStore()
const router = useRouter()
const $q = useQuasar()

/**
 * @description Action:Logout
 */
async function onClickLogout(): Promise<void> {
  if (!(await openConfirm('로그아웃 하시겠습니까?'))) {
    return
  }

  try {
    // 로그아웃
    // TODO: electron:ipc:loginipc 내 logout 선언 후 로그아웃처리 필요
    // await loginApi.logout()
    // Store 초기화 (시스템정보 제외)
    useStoreResetExceptSystem()
  } catch (err) {
    electronApi().logError(err)
  }

  // 화면이동
  await router.push('/login')
}

/**
 * 옵션설정 다이얼로그 오픈
 *
 */
async function OpenSettingDialog(): Promise<boolean | undefined> {
  const settingDialogOpts: QDialogOptions = {
    component: SettingDialog,
    componentProps: { isPortable }
  }
  return await openDialog<boolean>(settingDialogOpts)
}
</script>

<template>
  <div class="analysis-wrap">
    <header>
      <div class="top-user row justify-end items-center">
        <div class="user-wrap">
          <menu-bar-user-item />
          <!-- <q-btn flat class="theme-btn" @click="$q.dark.toggle()">
            <Icon icon="ic:outline-brightness-4" class="on-left" />
            테마변경
          </q-btn> -->
          <!-- 20240115 옵션설정 추가(기본 경로 설정을 위한 dialog)-->
          <q-btn flat class="theme-btn" @click="OpenSettingDialog">
            <Icon icon="uil:setting" class="on-left" />
            옵션설정
          </q-btn>
          <q-btn flat icon="mdi-logout" @click="onClickLogout">로그아웃</q-btn>
        </div>
      </div>
    </header>
    <router-view />
  </div>
</template>
<style scoped lang="scss">
// 유저 정보
.analysis-wrap :deep {
  .user-wrap {
    padding: 0.5rem 0.5rem 0.5rem 0rem;
    // 버튼 폰트 사이즈 수정
    .q-btn {
      font-size: 0.875rem;
    }
    .theme-btn {
      &::after {
        content: '';
        display: inline-block;
        width: 1px;
        height: 0.75rem;
        background-color: rgba(255, 255, 255, 30%);
        position: absolute;
        right: 0;
        top: calc(50% - 6px);
      }
    }
    // 간격수정
    .theme-btn + button {
      .q-icon.mdi-logout {
        margin-right: 0.375rem;
      }
    }
  }
}

.body--light {
  .user-wrap {
    .theme-btn {
      &::after {
        background-color: rgba($light-border, 100%);
      }
    }
  }
}
</style>
