<template>
  <div class="menu-bar">
    <!-- 왼쪽 탭 -->
    <q-tabs v-model="tab" align="left" class="tab-wrap">
      <q-tab name="홈" label="홈">
        <Icon icon="ri:home-5-line" />
      </q-tab>
      <q-tab name="분석개요" label="분석개요">
        <Icon icon="mdi:file-document-box-outline" />
        <img src="@renderer/assets/images/popup.svg" alt="" class="cue" />
      </q-tab>
      <q-tab name="아티팩트 조회" label="아티팩트 조회">
        <Icon icon="material-symbols:event-list-outline-sharp" :rotate="2" />
      </q-tab>
      <q-tab name="아티팩트 차트" label="아티팩트 차트">
        <Icon icon="icon-park-outline:tree-diagram" />
        <img src="@renderer/assets/images/popup.svg" alt="" class="cue" />
      </q-tab>
      <q-tab name="타임라인" label="타임라인">
        <Icon icon="mdi:timeline-clock-outline" />
      </q-tab>
      <q-tab name="북마크" label="북마크">
        <Icon icon="mdi:bookmark-outline" />
        <img src="@renderer/assets/images/popup.svg" alt="" class="cue" />
      </q-tab>
      <q-tab name="보고서" label="보고서">
        <Icon icon="mdi:file-document-edit-outline" />
        <img src="@renderer/assets/images/popup.svg" alt="" class="cue" />
      </q-tab>
    </q-tabs>
    <!-- 검색 -->
    <div class="form-wrap">
      <div class="radio-wrap">
        <q-radio v-model="color" dense val="전체 아티팩트" label="전체 아티팩트" color="primary"></q-radio>
        <q-radio v-model="color" dense val="현재화면" label="현재화면" color="primary"></q-radio>
      </div>
      <div class="search-wrap main_top"><!-- main_top 추가_ 20231023 이규호 -->
        <search-item />
      </div>
    </div>
    <!-- 유저정보/테마변경/로그아웃 -->
    <div class="user-wrap">
      <user-item />
      <div>
        <q-btn flat @click="chageTheme" class="theme-btn">
          <Icon icon="ic:outline-brightness-4" class="on-left "/>
          테마변경
        </q-btn>
        <q-btn v-show="!launcherAuth" flat icon="mdi-logout" @click="logoutClick">로그아웃</q-btn>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { ref } from 'vue'
import { useQuasar } from 'quasar'

import UserItem from '@renderer/publishing/components/common/header/MenuBarUserItem.vue'
import SearchItem from '@renderer/publishing/components/common/header/MenuBarSearchItem.vue'

import { openConfirm } from '@renderer/composables/useDialog'
import { useStoreResetExceptSystem } from '@renderer/stores'
import { useUserStore } from '@renderer/stores/userStore'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'

const router = useRouter()
const route = useRoute()
const { launcherAuth } = storeToRefs(useUserStore())


const tab = ref('홈')
const color = ref('primary')

/**
 * 로그아웃 버튼 클릭
 * 전체 Store 값을 초기화하고 로그인 화면으로 이동
 *
 */
async function logoutClick(): Promise<void> {
  if (!(await openConfirm('로그아웃 하시겠습니까?'))) {
    return
  }

  try {
    // 로그아웃
    await loginApi.logout()
    // Store 초기화 (시스템정보 제외)
    useStoreResetExceptSystem()
  } catch (err) {
    electronApi.logError(err)
  }

  // 화면이동
  router.push('/login')
}

// 테마 변경
const $q = useQuasar()
const chageTheme = () => {
  $q.dark.toggle()
}
</script>

<style lang="scss" scoped>
.q-tabs :deep(.q-tab__label) {
      font-size: 1rem;
      font-weight: 700;
      padding-top: 32px;
    }
.menu-bar {
  display: flex;
  align-items: center;
  height: 5.625rem;
  border-bottom: 1px solid #111;

  /* 탭 (홈~보고서) */
  .tab-wrap {
    height: 100%;
    width: 48.95%;
    // width: 58.75rem;
    display: flex;
    
    .q-tab {
      width: 8.3125rem;
      flex-grow: 1;
      &__content {
        padding: 0;
        .iconify {
          position: absolute;
          top: calc(50% - 24px);
          width: 1.5rem;
          height: 1.5rem;
        }
        .q-tab__label {
          padding-top: 32px;
          font-size: 1rem;
          font-weight: bold;
        }
        .cue {
          position: absolute;
          top: 10px;
          right: -24px;
        }
      }
      
      
    }
  }
  /* 검색 */
  .form-wrap {
    flex-grow: 1;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    .radio-wrap {
      display: flex;
      flex-direction: column;
      padding-right: 16px;
      ::v-deep(.q-radio__inner) {
        width: 1rem;
        height: 1rem;
        min-width: 1rem;
        color: #fff;
      }
      .q-radio {
        &:first-child {
          padding-bottom: 8px;
        }
      }
    }
  }
  // 유저 정보
  .user-wrap {
    padding-right: 1.5rem;
    .q-btn:deep {
        font-size: 0.875rem;
        &.theme-btn::after {
            content: "";
            display: inline-block;
            width: 1px;
            height: 0.75rem;
            background-color: rgba(255, 255, 255, 30%);
            position: absolute;
            right: 0;
            top: calc(50% - 6px);
        }
    }
    .q-btn:deep(.q-icon) {
        margin-right: 0.375rem;
    }
  }
}


</style>

