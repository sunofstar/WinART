<template>
  <div class="title-bar" z-max>
    <div class="title prevent-select draggable">
      <img src="@renderer/assets/images/logo_tit_winart.svg" />
      <span class="txt">WinART</span>
      <span class="version">Version {{ version }}</span>
    </div>
    <div class="control prevent-select">
      <q-btn flat square size="sm" icon="mdi-minus" @click="minimizeClick"></q-btn>
      <q-btn flat size="sm" :icon="isMaximized ? 'fullscreen' : 'mdi-window-maximize'" @click="maximizeClick"></q-btn>
      <q-btn flat square size="sm" icon="mdi-close" @click="closeClick"></q-btn>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Ref, ref } from 'vue'
import AppCloseDialog from '@renderer/components/common/app/AppCloseDialog.vue'
import { openDialog } from '@renderer/composables/useDialog'
import { QDialogOptions } from 'quasar'
import commonApi from '@renderer/api/commonApi'

// 사이즈 최대화 여부
const isMaximized: Ref<boolean> = ref(false)
// 종료 다이얼로그 오픈 여부
const isCloseOpend: Ref<boolean> = ref(false)
let version = ref('')
commonApi.getAppVersion().then((ver: string) => {
  version.value = ver
})
function maximizeClick(): void {
  electronAPI.maximizeApp()
  isMaximized.value = !isMaximized.value
}

/**
 * 최소화 아이콘 클릭
 *
 */
function minimizeClick(): void {
  electronAPI.minimizeApp()
}

async function closeClick(): Promise<void> {
  if (isCloseOpend.value) {
    return
  }

  // 프로그램 종료 다이얼로그
  const AppCloseDialogOpt: QDialogOptions = {
    component: AppCloseDialog
  }
  isCloseOpend.value = true
  const confirm = await openDialog<boolean>(AppCloseDialogOpt)
  isCloseOpend.value = false
  if (!confirm) {
    return
  }

  // 종료
  electronAPI.closeApp()
}
</script>

<style scoped lang="scss">
.logo-tit {
  display: inline-block;
  font-size: 0.875rem;
  font-weight: 700;
  padding: 0 0.75rem 0 0.625rem;
}

/* Program title bar */
.title-bar {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  min-width: 35rem;
  .title {
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-content: center;
    height: auto;
    font-size: 0.875rem;
    line-height: 1.25rem;
    padding: 0.625rem;
    .txt {
      font-size: 0.875rem;
      font-weight: 700;
      padding: 0 0.75rem 0 0.625rem;
    }
    .version {
      font-size: 0.75rem;
    }
  }
  .control {
    position: absolute;
    top: 0;
    right: 0;
    float: right;
    display: flex;
    flex-direction: row;
    z-index: 99999;
  }

  .control button {
    color: currentColor;
    width: 2.5rem;
    height: 2.5rem;
    border-left: 1px solid;
    -webkit-app-region: no-drag;
  }

  .control button:hover {
    background: $info;
  }

  .prevent-select {
    user-select: none;
    -webkit-touch-callout: none;
    -webkit-user-select: none;
  }
}
.title-bar {
  background-color: #000;
  color: #ffffff;
  .control {
    button {
      border-color: $grey-10;
    }
  }
}
.tit-area {
  border-bottom-color: #0a141e;
  &.h3 {
    background-color: #1e2022;
  }
  &.h4 {
    background: rgba(245, 250, 255, 20%);
  }
}
</style>
