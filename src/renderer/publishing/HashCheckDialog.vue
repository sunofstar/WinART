<route>{ meta: { disallowAuthed: true} }</route>

<!-- 보고서 증거이미지 해시 계산 -->
<template>
  <q-dialog v-model="isOpen" ref="dialogRef" @hide="onDialogHide">
    <q-card class="q-dialog-plugin hash-cal-dialog" style="width: 47rem">
      <q-card-section class="d-header">
        <h1>증거이미지 해시 계산</h1>
      </q-card-section>
      <q-card-section class="d-container">
        <!-- <div class="tbl-wrap">
          <h2>원본 해시값</h2>
          <table class="tbl-data narrow q-mt-xs">
            <colgroup>
              <col width="14%" />
              <col width="*" />
            </colgroup>
            <tbody>
              <tr>
                <th>MD5</th>
                <td>{{  }}</td>
              </tr>
              <tr>
                <th>SHA1</th>
                <td>{{ }}</td>
              </tr>
            </tbody>
          </table>
        </div> -->
        <div class="progress-col">
          <!-- 전체 진행율 -->
          <div class="title-and-progress q-mb-xs">
            <h2>해시값</h2>
            <span class="text-lg-2 bold">{{  }}</span>
            <q-spinner size="2em" />
          </div>
          <!-- 프로그래스 바 -->
          <q-linear-progress stripe value="" color="progressColor"></q-linear-progress>
        </div>
        <table class="tbl-data narrow" loading="">
          <colgroup>
            <col width="14%" />
            <col width="*" />
          </colgroup>
          <tbody>
            <tr>
              <th>MD5</th>
              <td>{{  }}</td>
            </tr>
            <tr>
              <th>SHA1</th>
              <td>{{ }}</td>
            </tr>
          </tbody>
        </table>
        <div v-show="result" class="desc noti box">
          <p class="text-warning">해시값 계산중입니다.</p>
        </div>
        <div v-show="result" class="desc box">
          <p class="text-info">해시값이 일치합니다.</p>
        </div>
        <div
          class="desc noti box"
        >
          <p class="text-warning">
            <q-icon name="mdi-alert-outline" color="warning"></q-icon>
            해시값이 일치하지 않습니다.
          </p>
        </div>
        <div v-show="result" class="desc noti box">
          <p class="text-warning">
            <q-icon name="mdi-alert-outline" color="warning"></q-icon>
            검증 해시값 정보가 존재하지 않습니다.
          </p>
        </div>
      </q-card-section>
      <q-card-actions class="d-footer">
        <q-btn
          outline
          icon="mdi-check"
          class="q-ml-sm"
          color="info"
          label="확인"
          @click="okClick"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">


/**
 * 해시값 검증 다이얼로그
 *
 */
// import { getFileHash } from '@electron/proc/makeImage'
// import commonApi from '@renderer/api/commonApi'
// import electronApi from '@renderer/api/electronApi'
// import { HashVal } from '@share/models'
// import { storeToRefs } from 'pinia'
import { useDialogPluginComponent, useQuasar } from 'quasar'
import { computed, ComputedRef, onMounted, reactive, Ref, ref, toRefs } from 'vue'
// import { useReportStore } from '../../stores/reportStore'
// import triageApi from '@renderer/api/triageApi'
// const reportStore = useReportStore()
// const { evidenceHashVal } = storeToRefs(reportStore)



// 사용자 다이얼로그 오픈 여부 
const isOpen: Ref<boolean> = ref(true)
const result = ref(false)

// props
// interface Props {
//   filePath: string
// }
// const props = defineProps<Props>()
// const { filePath } = toRefs(props)

// defineEmits([...useDialogPluginComponent.emits])
// const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent()

// const $q = useQuasar()

// 진행율 텍스트
// const progressText = computed(() => {
//   if (validHash.value.percent === 0) {
//     return '대기중...'
//   }
//   const formattedPercent = validHash.value.percent.toFixed(1).replace(/\.0$/, '') // 소수점 0이면 제거
//   return `${formattedPercent} %`
// })

// // 진행율 (진행바 범위 : 0 ~ 1)
// const computedProgress: ComputedRef<number> = computed(() => {
//   return validHash.value.percent ? validHash.value.percent / 100 : 0
// })

// // 진행바 색상
// const progressColor = computed(() => (validHash.value.state === 'error' ? 'negative' : 'info'))

// // 받아오는 해시값 정보
// export interface HashInfo {
//   percent: number
//   state: string
//   hash: HashVal
// }

// // 원본 해시값, 검증 해시값
// const originalHash: Ref<HashVal | undefined> = ref<HashVal | undefined>(undefined)
// const validHash: Ref<HashInfo> = ref<HashInfo>({
//   percent: 0,
//   state: '',
//   hash: {
//     md5: '',
//     sha1: '',
//     sha256: ''
//   }
// })

// // 검증결과
// const verification: ComputedRef<boolean> = computed(() => {
//   return originalHash.value?.md5 == validHash.value.hash.md5 && originalHash.value.sha1 == validHash.value.hash.sha1
// })

// // 해시 생성 로딩 완료 여부
// const completedHashLoading: Ref<boolean> = ref(false)

// // 로딩 완료 여부
// const completed: Ref<boolean> = ref(false)

// // 원본 해시값 존재여부
// const hasOriginalHash: ComputedRef<boolean> = computed(() => {
//   return !!originalHash.value?.md5 && !!originalHash.value.sha1
// })

// onMounted(async () => {
//   try {
//     $q.loading.show()
//     const evidenceHash = evidenceHashVal.value
//     if (evidenceHash) {
//       originalHash.value = {
//         md5: evidenceHash.md5,
//         sha1: evidenceHash.sha1
//       }
//       triageApi.getFileHash(filePath.value, (state: 'data' | 'end' | 'error', percent: number, hash?: HashVal) => {
//         console.log(state, percent, hash)
//         validHash.value = {
//           percent: percent,
//           state: state,
//           hash: {
//             md5: hash?.md5 ?? '',
//             sha1: hash?.sha1 ?? ''
//           }
//         }
//         if (state == 'data') {
//           completedHashLoading.value == false
//         }
//       })
//     }
//   } catch (err) {
//     // 오류 로그
//     electronApi.logError(err)
//   } finally {
//     completed.value = true
//     completedHashLoading.value == true
//     $q.loading.hide()
//   }
// })

// /**
//  * 확인 버튼 클릭
//  *
//  */
// function okClick(): void {
//   onDialogOK(verification.value)
// }
</script>
<style scoped lang="scss">
.hash-cal-dialog {
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
.title-and-progress {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
