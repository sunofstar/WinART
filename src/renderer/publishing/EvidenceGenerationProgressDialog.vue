<route>{ meta: { disallowAuthed: true} }</route>
<!-- 보고서 증거이미지 생성 진행 화면 -->
<!-- 20231201 FE 백지연_ 증거이미지 생성 진행 화면 UI 변경-->
<template>
  <q-dialog ref="dialogRef" v-model="isOpen" @hide="onDialogHide">
    <q-card class="q-dialog-plugin evidence-create-dialog" style="width: 900px">
      <q-card-section class="d-header">
        <h1>증거이미지 생성</h1>
      </q-card-section>
      <q-card-section class="d-container">
        <!-- 메인 진행바__증거이미지 생성 -->
        <div class="progress-col">
          <!-- 이미지 타입 -->
          <h2>DEPH/AFF4</h2>
          <div class="progress-row evidence">
            <!-- 프로그래스 바 -->
            <q-linear-progress stripe :value="100" color="info"></q-linear-progress>
            <!-- 폴더 열기 버튼 (완료되지 않으면 비활성화) -->
            <q-btn
              color="primary"
              outline
              icon="mdi-folder-open-outline"
              class="btn-folder"
              label="폴더열기"
              @click="openFolder"
            />
          </div>
        </div>
        <q-separator />
        <div class="progress-col">
          <h2>해시값 계산</h2>
          <div class="progress-row evidence">
            <!-- 프로그래스 바 -->
            <q-linear-progress stripe :value="100" color="info"></q-linear-progress>
            <!-- 폴더 열기 버튼 (완료되지 않으면 비활성화) -->
          </div>
          <table class="tbl-data narrow">
            <colgroup>
              <col width="14%" />
              <col width="*" />
            </colgroup>
            <tbody>
              <tr>
                <th>MD5</th>
                <td>098F6BCD4621D373CADE4E832627B4F6</td>
              </tr>
              <tr>
                <th>SHA1</th>
                <td>A94A8FE5CCB19BA61C4C0873D391E987982FBBD3</td>
              </tr>
            </tbody>
          </table>
        </div>
        <!-- 서브 진행__문서서식 -->
        <!-- // 1. 현장조사 확인서 -->
        <div class="progress-col">
          <div class="progress-row evidence">
            <h2 class="q-linear-text">현장조사 확인서</h2>
            <q-btn outline icon="mdi-file-document-outline" color="white" class="btn-folder" label="파일열기" />
          </div>
        </div>
        <!-- // 2. 전자정보의 관련성에 관한 의견진술서 -->
        <div class="progress-col">
          <div class="progress-row evidence">
            <h2 class="q-linear-text">전자정보의 관련성에 관한 의견진술서</h2>
            <q-btn outline icon="mdi-file-document-outline" color="white" class="btn-folder" label="파일열기" />
          </div>
        </div>
        <!-- // 3. 결과보고서 -->
        <div class="progress-col">
          <div class="progress-row evidence">
            <h2 class="q-linear-text">결과보고서</h2>
            <q-btn outline icon="mdi-file-document-outline" color="white" class="btn-folder" label="파일열기" />
          </div>
        </div>
      </q-card-section>
      <q-card-actions class="d-footer">
        <q-btn outline icon="mdi-close" label="닫기" @click="okClick" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { Ref, ref } from 'vue'
// 사용자 다이얼로그 오픈 여부
const isOpen: Ref<boolean> = ref(true)

// /**
//  * 증거이미지 생성 진행 다이얼로그
//  *
//  */
// import commonApi from '@renderer/api/commonApi'
// import electronApi from '@renderer/api/electronApi'
// import triageApi from '@renderer/api/triageApi'
// import { useCaseStore } from '@renderer/stores/caseStore'
// import { useReportStore } from '@renderer/stores/reportStore'
// import { numberWithCommas } from '@renderer/utils/utils'
// import { MakeImageInfo, EvidenceFile, EvidenceInfo, EvidenceProgress, HashVal, ReportChannelRcv } from '@share/models'
// import dayjs from 'dayjs'
// import _ from 'lodash'
// import { storeToRefs } from 'pinia'
// import { useDialogPluginComponent } from 'quasar'
// import { computed, ComputedRef, onMounted, onUnmounted, Ref, ref, toRefs } from 'vue'
// import { useRouter } from 'vue-router'
// import { openError } from '@renderer/composables/useDialog'

// const router = useRouter()

// // // props
// // interface Props {
// //   evidenceInfo: MakeImageInfo
// // }
// // const props = defineProps<Props>()
// // const { evidenceInfo } = toRefs(props)

// const reportStore = useReportStore()
// const { getFilePath } = storeToRefs(reportStore)
// const $q = useQuasar()
// const caseStore = useCaseStore()
// const { caseDetail, analyst, caseFolder, caseImgName } = storeToRefs(caseStore)
// import { useQuasar } from 'quasar'

// defineEmits([...useDialogPluginComponent.emits])
// const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent()

// // 증거이미지 해시값 생성 정보, 메인 진행바 속성
// // let imageFileCreationDate = ''
// // const mainProgress: Ref<MainProps> = ref({
// //   title: '',
// //   progress: 0,
// //   state: '',
// //   fileName: '',
// //   folderPath: '',
// //   hash: {
// //     md5: '',
// //     sha1: ''
// //   }
// // })

// // // 보고서 생성 정보
// // interface SubProgress extends SubProps {
// //   id: string
// // }
// // const subProgress: Ref<SubProgress[]> = ref([
// //   {
// //     id: 'report0',
// //     title: '현장조사확인서',
// //     percent: 0,
// //     status: 0,
// //     filePath: evidenceInfo.value.imageFile.folderPath + '\\' + '현장조사확인서.pdf'
// //   },
// //   {
// //     id: 'report1',
// //     title: '정보저장매체 복제 및 이미징 등 참관여부 확인서',
// //     percent: 0,
// //     status: 0,
// //     filePath: evidenceInfo.value.imageFile.folderPath + '\\' + '정보저장매체 복제 및 이미징 등 참관여부 확인서.pdf'
// //   }
// // ])

// // // 서브 프로그래스 목록 (선택된 문서서식만 해당)
// // const subList: ComputedRef<SubProgress[]> = computed(() => {
// //   return subProgress.value.filter((item) => evidenceInfo.value.documents.includes(item.id))
// // })

// // 완료여부
// const completed: Ref<boolean> = ref(false)
// // 오류여부
// const hasError: Ref<boolean> = ref(false)
// // 확인버튼 표시 여부
// const isShowOkBtn = computed(() => completed.value || hasError.value)

// // // 증거이미지 생성 성공 여부
// // const isSucess = computed(() => mainProgress.value.state == 1 && subList.value.every((item) => item.state == 1))

// /**
//  * 닫기버튼 클릭 시 성공여부 반환
//  *
//  */
// function okClick() {
//   onDialogOK(isSucess.value)
// }

// onUnmounted(() => {})
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

.progress-report-col {
  padding-bottom: 0rem;
}
.q-linear-text {
  width: calc(100% - 10rem);
}
</style>
