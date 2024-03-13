<route>{ meta: { disallowAuthed: true} }</route>

<!-- eslint-disable vue/no-setup-props-destructure -->

<!-- 아티팩트분석중팝업(아티팩트 분석진행)-->
<template>
  <q-dialog v-model="isOpen" ref="dialogRef" @hide="onDialogHide">
    <q-card class="q-dialog-plugin" style="width: 900px">
      <q-card-section class="d-header">
        <h1>Win Artifacts 분석 진행</h1>
      </q-card-section>
      <!-- 메인 진행바 -->
      <!-- <div class="progress-col winarti">
        <span class="text-lg-2 bold">75 %</span>\
        <q-linear-progress stripe :value="75" color="info"></q-linear-progress>
        <p v-show="isShowTarget" class="ellipsis fix-height">
          파일이름표시파일이름표시파일이름표시파일이름표시파일이름표시파일이름표시파일이름표시파일이름표시파일이름표시.eml
        </p>
      </div> -->
      <q-card-section class="d-container">
        <!-- <acquisition-main-progress-bar /> -->
        <!-- 서브 진행바 목록 -->
        <div class="tbl-wrap winarti">
          <table class="tbl-data">
            <colgroup>
              <col width="20%" />
              <col width="*" />
            </colgroup>
            <tbody>
              <tr>
                <th>CSV 파일 만들기</th>
                <td>
                  <div class="progress-row winarti">
                    <!-- 프로그래스 바 -->
                    <q-linear-progress stripe :value="progress" color="primary"></q-linear-progress>
                    <!-- 진행 상태 -->
                    <div class="status-label">
                      <q-icon name="mdi-check-circle"></q-icon>
                      <span>완료</span>
                    </div>
                  </div>
                  <div class="progress_time_info on">(2023-09-01 12:00:00)</div>
                </td>
              </tr>
              <tr>
                <th>개별 DB 파일 만들기</th>
                <td>
                  <div class="progress-row winarti">
                    <!-- 프로그래스 바 -->
                    <q-linear-progress stripe :value="progress" color="primary"></q-linear-progress>
                    <!-- 진행 상태 -->
                    <div class="status-label">
                      <q-icon name="mdi-check-circle"></q-icon>
                      <span>완료</span>
                    </div>
                  </div>
                  <div class="progress_time_info on">(2023-09-01 12:00:00)</div>
                </td>
              </tr>
              <tr>
                <th>통합 DB 파일 만들기</th>
                <td>
                  <div class="progress-row winarti">
                    <!-- 프로그래스 바 -->
                    <q-linear-progress stripe :value="progress" color="red"></q-linear-progress>
                    <!-- 진행 상태 -->
                    <div class="status-label text-negative">
                      <q-icon name="mdi-alert-circle"></q-icon>
                      <span>실패</span>
                    </div>
                  </div>
                  <div class="progress_time_info">(2023-09-01 12:00:00)</div>
                </td>
              </tr>
              <tr>
                <th>Lorem ipsum</th>
                <td>
                  <div class="progress-row winarti">
                    <!-- 프로그래스 바 -->
                    <q-linear-progress stripe :value="progress" color="primary"></q-linear-progress>
                    <!-- 진행 상태 -->
                    <div class="status-label text-primary">
                      <q-icon name="mdi-play-circle"></q-icon>
                      <span>진행중</span>
                    </div>
                  </div>
                  <div class="progress_time_info">(2023-09-01 12:00:00)</div>
                </td>
              </tr>
              <tr>
                <th>Lorem ipsum</th>
                <td>
                  <div class="progress-row winarti">
                    <!-- 프로그래스 바 -->
                    <q-linear-progress stripe :value="progress" color="primary"></q-linear-progress>
                    <!-- 진행 상태 -->
                    <div class="status-label text-grey-5">
                      <q-icon name="mdi-stop-circle"></q-icon>
                      <span>대기</span>
                    </div>
                  </div>
                  <div class="progress_time_info">(2023-09-01 12:00:00)</div>
                </td>
              </tr>
              <tr>
                <th>Lorem ipsum</th>
                <td>
                  <div class="progress-row winarti">
                    <!-- 프로그래스 바 -->
                    <q-linear-progress stripe :value="progress" color="primary"></q-linear-progress>
                    <!-- 진행 상태 -->
                    <div class="status-label text-grey-5">
                      <q-icon name="mdi-stop-circle"></q-icon>
                      <span>대기</span>
                    </div>
                  </div>
                  <div class="progress_time_info">(2023-09-01 12:00:00)</div>
                </td>
              </tr>
              <tr>
                <th>Lorem ipsum</th>
                <td>
                  <div class="progress-row winarti">
                    <!-- 프로그래스 바 -->
                    <q-linear-progress stripe :value="progress" color="primary"></q-linear-progress>
                    <!-- 진행 상태 -->
                    <div class="status-label text-grey-5">
                      <q-icon name="mdi-stop-circle"></q-icon>
                      <span>대기</span>
                    </div>
                  </div>
                  <div class="progress_time_info">(2023-09-01 12:00:00)</div>
                </td>
              </tr>
              <tr>
                <th>Lorem ipsum</th>
                <td>
                  <div class="progress-row winarti">
                    <!-- 프로그래스 바 -->
                    <q-linear-progress stripe :value="progress" color="primary"></q-linear-progress>
                    <!-- 진행 상태 -->
                    <div class="status-label text-grey-5">
                      <q-icon name="mdi-stop-circle"></q-icon>
                      <span>대기</span>
                    </div>
                  </div>
                  <div class="progress_time_info">(2023-09-01 12:00:00)</div>
                </td>
              </tr>
            </tbody>
          </table>
          <br />
        </div>
        <!-- <acquisition-sub-progress-bar /> -->
      </q-card-section>
      <q-card-actions class="d-footer">
        <!-- 확인버튼 (진행이 완료되지 않으면 확인 버튼이 비활성화 되어야 함) -->
        <q-btn outline color="" icon="mdi-close" label="닫기" @click="onDialogHide" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, ComputedRef, Ref, ref } from 'vue'


// 사용자 다이얼로그 오픈 여부 
const isOpen: Ref<boolean> = ref(true)


// /**
//  * 획득 진행 다이얼로그
//  *
//  */
import AcquisitionMainProgressBar from '@renderer/publishing/components/AcquisitionMainProgressBar.vue'
import AcquisitionSubProgressBar from '@renderer/publishing/components/AcquisitionSubProgressBar.vue'
// // import { TriageDetectionInfo } from '@share/models'
import { useDialogPluginComponent } from 'quasar'
// import { Ref, ref, toRefs } from 'vue'

// // // props
// // interface Props {
// //   detectionResult: TriageDetectionInfo
// // }

// // const props = defineProps<Props>()
// // const { detectionResult } = toRefs(props)

defineEmits([...useDialogPluginComponent.emits])
const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent()
const progress = ref(50)
const isShowTarget = ref(true)

// 완료 여부
const completed: Ref<boolean> = ref(false)
</script>

<style scoped lang="scss">
.tbl-wrap.winarti {
  padding: 0;
  padding-top: 1.25rem;
  max-height: 28rem;

  .tbl-data {
    margin-top: -1.25rem;
    padding-bottom: 2rem;
  }
}

.progress-col.winarti {
  padding: 1.25rem 1rem 1.5rem 1rem;
  background: #42464a;

  .text-lg-2 {
    margin-bottom: 0.25rem;
  }
}

.progress-row.winarti {
  margin-top: 1.25rem;
  padding: 0 0.25rem 0 0.625rem;
  text-align: right;
  line-height: 1.3125rem;

  .q-linear-progress {
    width: 100%;
    height: 0.875rem;
  }

  .status-label {
    width: 5.5rem;
  }
}

.tbl-data .progress_time_info {
  height: 1rem;
  margin-top: 0.25rem;
  padding: 0 0.25rem;
  font-size: 0;
  color: #bcbebf;
  text-align: right;
  line-height: 1rem;

  &.on {
    font-size: 0.75rem;
  }
}

.body--dark .q-dialog .q-card .d-container .tbl-data tbody tr td.wint {
  width: 42.375rem;
}
</style>
