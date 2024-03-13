<!-- 보고서 이미지 생성 및 열기 화면 -->
<template>
  <div class="progress-col">
    <div class="progress-row evidence">
      <h2 class="q-linear-text">
        {{ title }}
        <!-- 파일 열기 버튼 -->
      </h2>
      <q-btn
        outline
        icon="mdi-file-document-outline"
        label="파일열기"
        class="btn-folder"
        :disable="!isShowOpenFile"
        @click="openFile"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 증거이미지 생성 서브 진행바 (각종 서식 파일)
 *
 */
import commonApi from '@renderer/api/commonApi'
import electronApi from '@renderer/api/electronApi'
import _ from 'lodash'
import { storeToRefs } from 'pinia'
import { useDialogPluginComponent } from 'quasar'
import { computed, ComputedRef, onMounted, onUnmounted, Ref, ref, toRefs, reactive } from 'vue'

// props
interface Props {
  allCompleted: boolean
  id: string
  title: string
  filePath: string
}
const props = defineProps<Props>()
const { id, title, filePath, allCompleted } = toRefs(props)
const $q = useQuasar()
import { useQuasar } from 'quasar'
defineEmits([...useDialogPluginComponent.emits])
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent()

// 파일열기 버튼 표시 여부
const isShowOpenFile: ComputedRef<boolean> = computed(() => !!filePath.value && allCompleted.value === true)

/**
 * 증거이미지 서식 파일 열기
 *
 */
async function openFile() {
  if (!filePath.value) {
    return
  }
  const errorMsg = await electronApi().openPath(filePath.value)
  if (errorMsg) {
    electronApi().logError(errorMsg)
  }
}
</script>

<style scoped lang="scss">
.evidence-create-dialog {
  .tbl-data {
    font-size: 0.9375rem;
    font-weight: 700;
    th {
      font-weight: 700;
    }
    td {
      background-color: #35383b;
    }
  }
}

.progress-row {
  .evidence {
    margin-top: none;
  }
}
.progress-report-col {
  padding-bottom: 0rem;
}
.q-linear-text {
  width: calc(100% - 10rem);
}
</style>
