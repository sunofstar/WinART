<script setup lang="ts">
/**********************************************
 *
 * 아티팩트 상단 탭
 *
 **********************************************/

/**********************************************
 * @description Import
 */
import { Icon } from '@iconify/vue'
import { Ref, ref } from 'vue'
import { useQuasar } from 'quasar'
import { useRouter } from 'vue-router'

import electronApi from '@renderer/api/electronApi'
import { openConfirm } from '@renderer/composables/useDialog'
import { useStoreResetExceptSystem, useStoreResetExceptUserandSystem } from '@renderer/stores'

import menuBarSearchItem from '@renderer/components/result/header/MenuBarSearchItem.vue'
import MenuBarUserItem from '@renderer/components/result/header/MenuBarUserItem.vue'
import DialogAnalysisOverview from '@renderer/components/result/dialog/DialogAnalysisOverview.vue'
import DialogBookmark from '@renderer/components/result/dialog/DialogBookmark.vue'
import DialogReport from '@renderer/components/result/dialog/DialogReport.vue'
import DialogChart from '@renderer/components/result/dialog/DialogChart.vue'

import { useCaseStore } from '@renderer/stores/caseStore'
import { storeToRefs } from 'pinia'
const caseStore = useCaseStore()
const { firstRenderForAnalysisDialog } = storeToRefs(caseStore)

/**********************************************
 * @description Define variables
 */
const emit = defineEmits<{
  (e: 'tabClick', id: number, opton?: any): void
}>()
const router = useRouter()
const tab: Ref<string> = ref('artifactLookup')

//분석개요 Dialog isShow
const isShowAnalysisDialog: Ref<boolean> = ref(false)
// 북마크 Dialog isShow
const isShowBookmarkDialog: Ref<boolean> = ref(false)
// 보고서 Dialog isShow
const isShowReportDialog: Ref<boolean> = ref(false)
// 차트 Dialog isShow
const isShowChartDialog: Ref<boolean> = ref(false)

/**
 * @description 로그아웃
 */
async function logoutClick(): Promise<void> {
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
 * @desctiption 홈 이동
 */
async function homeButtonClick(): Promise<void> {
  if (!(await openConfirm('처음 화면으로 이동하겠습니까?'))) {
    return
  }
  try {
    // Store 초기화 (케이스, 트리아제 케이스)
    useStoreResetExceptUserandSystem()
  } catch (err) {
    electronApi().logError(err)
  }
  // 화면 이동
  await router.push('/analysis')
}

// 테마 변경
const $q = useQuasar()
const changeTheme = () => {
  $q.dark.toggle()
}
</script>

<template>
  <div class="menu-bar">
    <!-- 왼쪽 탭 -->
    <q-tabs v-model="tab" align="left" class="tab-wrap">
      <q-tab name="홈" label="홈" @click="homeButtonClick">
        <Icon icon="ri:home-5-line" class="tab-icon" />
      </q-tab>
      <q-tab
        name="분석개요"
        label="분석개요"
        @click="
          () => {
            isShowAnalysisDialog = true
            tab = 'artifactLookup'
          }
        "
      >
        <Icon icon="mdi:file-document-box-outline" class="tab-icon" />
        <Icon icon="carbon:popup" class="cue" />
      </q-tab>
      <q-tab name="아티팩트 조회" label="아티팩트 조회" @click="router.push('/result')">
        <Icon icon="material-symbols:event-list-outline-sharp" class="tab-icon" :rotate="2" />
      </q-tab>
      <q-tab
        name="아티팩트 차트"
        label="아티팩트 차트"
        @click="
          () => {
            isShowChartDialog = true
            tab = 'artifactLookup'
          }
        "
      >
        <Icon icon="icon-park-outline:tree-diagram" class="tab-icon" />
        <Icon icon="carbon:popup" class="cue" />
      </q-tab>
      <q-tab name="타임라인" label="타임라인" @click="router.push('/result/timeline')">
        <Icon icon="mdi:timeline-clock-outline" class="tab-icon" />
      </q-tab>
      <q-tab
        name="북마크"
        label="북마크"
        @click="
          () => {
            emit('tabClick', 0)
            // isShowBookmarkDialog = true
            // tab = 'artifactLookup'
          }
        "
      >
        <Icon icon="mdi:bookmark-outline" class="tab-icon" />
        <Icon icon="carbon:popup" class="cue" />
      </q-tab>
      <q-tab
        name="보고서"
        label="보고서"
        @click="
          () => {
            // emit('tabClick', 1)
            isShowReportDialog = true
            tab = 'artifactLookup'
          }
        "
      >
        <Icon icon="mdi:file-document-edit-outline" class="tab-icon" />
        <Icon icon="carbon:popup" class="cue" />
      </q-tab>
    </q-tabs>
    <!-- 검색 -->
    <div class="form-wrap">
      <!-- main_top 추가_ 20231023 이규호 -->
      <menu-bar-search-item
        @onSearch="
          () => {
            emit('tabClick', 1)
          }
        "
      />
    </div>
    <!-- 유저정보/테마변경/로그아웃 -->
    <div class="user-wrap">
      <menu-bar-user-item />
      <div>
        <q-btn flat class="theme-btn" @click="changeTheme">
          <Icon icon="ic:outline-brightness-4" class="on-left" />
          <span class="btn-tit">테마변경</span>
        </q-btn>
        <q-btn flat icon="mdi-logout" class="logout-btn" @click="logoutClick">
          <span class="btn-tit">로그아웃</span>
        </q-btn>
      </div>
    </div>
  </div>

  <DialogAnalysisOverview
    :is-show="isShowAnalysisDialog || firstRenderForAnalysisDialog"
    @update:isShow="(newValue) => (isShowAnalysisDialog = newValue)"
  />
  <!-- <DialogBookmark :is-show="isShowBookmarkDialog" @update:isShow="(newValue) => (isShowBookmarkDialog = newValue)" /> -->
  <DialogReport :is-show="isShowReportDialog" @update:isShow="(newValue) => (isShowReportDialog = newValue)" />
  <DialogChart :is-show="isShowChartDialog" @update:isShow="(newValue) => (isShowChartDialog = newValue)" />
</template>

<style lang="scss" scoped>
// 탭 스타일
.q-tabs :deep(.q-tab__label) {
  font-size: 1rem;
  font-weight: 700;
  padding-top: 32px;
}
.menu-bar :deep {
  display: flex;
  align-items: center;
  height: 5.625rem;
  border-bottom: 1px solid #111;

  /* 탭 (홈~보고서) */
  .tab-wrap {
    height: 100%;
    width: 48.85%;
    display: flex;

    .q-tab {
      min-width: 8.3125rem;
      width: 100%;
      flex-grow: 1;
      &__content {
        padding: 0;
        width: 100%;
        .tab-icon {
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
          opacity: 40%;
          position: absolute;
          top: 10px;
          right: -0.1875rem;
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
  }
  // 유저 정보
  .user-wrap {
    padding-right: 1.5rem;
    .q-btn {
      font-size: 0.875rem;
    }
    .line-division {
      &::after {
        display: none;
      }
    }
    // 테마
    .theme-btn {
      padding: 0 0.75rem 0 1rem;
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
    // 로그아웃
    .logout-btn {
      padding: 0 0.75rem;
      .q-icon {
        margin-right: 0.375rem;
      }
    }
  }

  // 반응형
  // 반응형 (2201px ~ max)
  @media (min-width: 2201px) {
    .tab-wrap {
      .q-tab {
        width: 8.57%;
      }
    }
  }
  // 반응형 (1900px ~ 1641px)
  @media (max-width: 1900px) {
    .q-tabs--not-scrollable .q-tabs__arrow,
    body.mobile .q-tabs--scrollable.q-tabs--mobile-without-arrows .q-tabs__arrow {
      display: flex;
    }
    .tab-wrap {
      width: 45.6rem;
      padding: 0 2rem;
      .q-tabs__arrow {
        display: flex;
        text-shadow: none;
        min-width: 2rem !important;
        &.q-tabs__arrow--faded {
          display: flex;
          color: rgba(#ffffff, 40%);
        }
      }
    }
  }
  // 반응형 (1640px~ 1511px)
  @media (max-width: 1640px) {
    .tab-wrap {
      width: 37.3rem;
    }
  }
  //  반응형 (1510px 이하)
  @media (max-width: 1510px) {
    .theme-btn {
      svg.on-left {
        margin: 0;
      }
    }
    .logout-btn {
      .q-btn__content {
        padding: 0;
      }
      .q-icon {
        margin-right: 0;
      }
    }
    // 테마변경, 로그아웃 텍스트 display :none
    .btn-tit {
      display: none;
    }
  }
}
// // 화이트모드
.body--light {
  .menu-bar :deep {
    background-color: $light-bg;
    border-bottom: 1px solid $light-border;
    .tab-wrap {
      .cue {
        opacity: 100%;
        color: $light-dark;
      }

      .q-tabs__arrow {
        color: $light-dark;
        &.q-tabs__arrow--faded {
          color: rgba(#bdbdbd, 100%) !important;
        }
      }
    }
    .user-wrap {
      .theme-btn {
        &::after {
          background-color: rgba($light-border, 100%);
        }
      }
    }
  }
}
</style>
