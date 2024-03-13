<!-- eslint-disable vue/no-setup-props-destructure -->
<!-- 20231121_아티팩트분석중팝업(아티팩트 분석진행)-->
<template>
  <q-dialog v-if="isFolder && !isShowSecondDialog" ref="dialogRef" v-model="isOpen" @hide="onDialogHide">
    <q-card class="q-dialog-plugin hash-cal-dialog" style="width: 47rem">
      <q-card-section class="d-header">
        <h1>분석 이미지 선택</h1>
      </q-card-section>
      <q-card-section class="d-container">
        <div class="progress-col">
          <div class="title-and-progress q-mb-xs">
            <h2>현재 분석 가능한 디렉토리가 존재합니다. 디렉토리로 진행하시겠습니까?</h2>
            <span class="text-lg-2 bold"></span>
          </div>
        </div>
        <div class="desc box">
          <p class="text-info">
            <q-checkbox v-model="isImage">이미지( {{ triageImageType }} )로 분석하기 (장시간 소요)</q-checkbox>
          </p>
        </div>
      </q-card-section>
      <q-card-actions class="d-footer">
        <q-btn outline icon="mdi-check" class="q-ml-sm" color="info" label="확인" @click="onFirstDialogOK" />
      </q-card-actions>
    </q-card>
  </q-dialog>
  <q-dialog
    v-else-if="(isShowSecondDialog || !isFolder) && indexPage === 'secondPage'"
    ref="dialogRef"
    v-model="isShowSecondDialog"
    persistent
    @hide="onDialogHide"
  >
    <q-card class="q-dialog-plugin" style="width: 900px">
      <q-card-section class="d-header">
        <h1>WinART 분석 진행</h1>
      </q-card-section>
      <!-- 서브 진행바 목록 -->
      <q-card-section class="d-container">
        <div class="tbl-wrap winarti">
          <table class="tbl-data">
            <colgroup>
              <col width="20%" />
              <col width="*" />
            </colgroup>
            <tbody>
              <analysis-sub-progress-bar v-for="(item, idx) in filteredSubBars" :key="idx" v-bind="item" />
            </tbody>
          </table>
          <br />
        </div>
      </q-card-section>
      <q-card-actions class="d-footer">
        <q-btn outline icon="mdi-close" label="닫기" :disable="!isShowOkBtn" @click="onSecondDialogClose" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
/**
 * 분석 진행 다이얼로그
 *
 */
import kapeApi from '@renderer/api/kapeApi'
import electronApi from '@renderer/api/electronApi'
import AnalysisSubProgressBar, { Props as SubBarProps } from '@renderer/components/analysis/AnalysisSubProgressBar.vue'
import _ from 'lodash'
import { AcquisitionImageExport } from '@share/models'
import { useRouter } from 'vue-router'
import { useDialogPluginComponent } from 'quasar'
import { computed, ComputedRef, onMounted, onUnmounted, reactive, Ref, ref, toRefs, watch, watchEffect } from 'vue'
import { openError } from '@renderer/composables/useDialog'
import evidenceImageApi from '@renderer/api/evidenceImageApi'
const router = useRouter()
import { ipcMain, ipcRenderer } from 'electron'
import { KAPE_OP_CHANNELS } from '@share/constants'
import { useCaseStore } from '@renderer/stores/caseStore'
import { useTriageCaseStore } from '@renderer/stores/triageCaseStore'
import { storeToRefs } from 'pinia'
const caseStore = useCaseStore()
const triageCaseStore = useTriageCaseStore()
const { triageDirectory, triageImageType, triageImagePath, triageCaseHashFile, triageCaseHashFileInfo } =
  storeToRefs(triageCaseStore)
const { caseDetail, hasAnalysisError, startAnalysisFlag, homeIndicatorFlag, currentIndexPage, currentPage } =
  storeToRefs(caseStore)
import { setDate, getParentFolder } from '@renderer/utils/utils'

// props
interface Props {
  artCaseFolderPath: string
  triageDirectoryFilePath: string
  triageImgFilePath: string
}
const props = defineProps<Props>()
defineEmits([...useDialogPluginComponent.emits])
const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent()

// 디렉토리 존재 여부 관리
const isFolder = computed(() => triageDirectory.value !== undefined)
// page index 정보
// const indexPage = computed(() => currentIndexPage.value)
// page 정보
const indexPage = computed(() => currentPage.value)
// kape root 경로 관리
const kapeRootPath: Ref<string> = ref('')
// kape dest 경로 관리
const kapeDestPath: Ref<string> = ref('')
// csv 폴더root 경로 관리
const csvRootPath: Ref<string> = ref('')
// db 폴더 경로 관리
const dbPath: Ref<string> = ref('')
// 완료 여부
const completed: Ref<boolean> = ref(false)
// 오류 여부
const hasError: Ref<boolean> = ref(false)
const errorText: Ref<string | undefined> = ref(undefined)
// 확인버튼 표시 여부
const isShowOkBtn: ComputedRef<boolean> = computed(() => completed.value || hasError.value)
// 사용자 다이얼로그 오픈 여부
const isOpen: Ref<boolean> = ref(true)
const isImage: Ref<boolean> = ref(false)
const isShowSecondDialog: Ref<boolean> = ref(false)

const acquisitionImageExport: Ref<AcquisitionImageExport> = ref({
  imageType: triageImageType.value,
  imageFilePath: triageImagePath.value
})

const forExportImgDir: Ref<string> = ref(props.artCaseFolderPath)

// 첫 번째 dialog에서 확인 버튼 클릭 시 실행되는 함수
async function onFirstDialogOK(): Promise<void> {
  isOpen.value = false // 첫 번째 dialog 닫기
  isShowSecondDialog.value = true // 두 번째 dialog 보이기
}

/*
 * 분석 진행
 *
 * 1) 이미지 풀기 (isImage가 true인 경우에만 진행)
 * 2) KAPE 분석
 * 3) CSV를 통한 DB 생성
 * 4) 통합 테이블 생성 ('케이스폴더/art/DB/art_케이스명.db'로 생성)
 * 5) case테이블 생성
 */
async function startAnalysis(): Promise<void> {
  console.log('분석 진행 다이얼로그')
  caseStore.setStartAnalysisFlag(false)
  try {
    // 획득 결과값 기본 정보 설정
    const acqInfo = _.cloneDeep(acquisitionImageExport.value)
    const exportImg = _.cloneDeep(forExportImgDir.value)

    console.log(exportImg)
    // 획득 시작
    // 1) step1. 이미지 풀기 (isImage가 true인 경우에만 진행)
    if (isImage.value) {
      acqInfo.exportPath = exportImg
      await performImageUnzip(acqInfo)
    }
    // 2) step2. KAPE 분석
    await performKAPEAnalysis()
    // 3) step3. CSV를 통한 DB 생성
    await performCSVToDB()
    // 4) step4. 통합 테이블 생성
    await performCreateIntegratedTable()
  } catch (error) {
    console.error('분석 중 오류 발생:', error)
    hasError.value = true
  }
}

// Step 1. 이미지 풀기
async function performImageUnzip(acqInfo: AcquisitionImageExport) {
  return new Promise((resolve) => {
    evidenceImageApi.exportImage(acqInfo, async (info) => {
      setAnalysisInfo(filteredSubBars, 'unzip', info)
      if (info.state === 'error') {
        openError('이미지를 푸는 과정에서 오류가 발생했습니다. 확인 후 다시 시도하세요.')
        hasError.value = true
        caseStore.setHasAnalysisError(hasError.value)
        console.log(hasAnalysisError)
      } else if (info.state === 'end') {
        // 이미지 풀기가 완료된 경우 resolve
        resolve(info)
      }
    })
  })
}

// Step 2. KAPE 분석 함수
async function performKAPEAnalysis() {
  const kapeAnalysisParams = {
    k_source: kapeRootPath.value,
    k_dest: kapeDestPath.value
  }
  try {
    console.log(kapeAnalysisParams)
    const progress = await new Promise((resolve) => {
      kapeApi.runKAPEAnalysis(kapeAnalysisParams, (progress) => {
        console.log('KAPE 분석 API 호출:', progress.state, progress.data)
        setAnalysisInfo(filteredSubBars, 'kape', { state: progress.state, percent: progress.data })

        if (
          progress.state === '_999' ||
          progress.state === 'A001' ||
          progress.state === 'A002' ||
          progress.state === 'A003' ||
          progress.state === 'A004'
        ) {
          openError('KAPE 분석 중 오류가 발생했습니다. 확인 후 다시 시도바랍니다.')
          hasError.value = true
          caseStore.setHasAnalysisError(hasError.value)
        } else if (progress.state === '_009') {
          // KAPE 분석이 완료된 경우 resolve
          resolve(progress)
        }
      })
    })
    return progress
  } catch (error) {
    console.error('KAPE 분석 중 오류 발생:', error)
    openError('KAPE 분석 중 오류가 발생했습니다. 확인 후 다시 시도바랍니다.')
    hasError.value = true
    caseStore.setHasAnalysisError(hasError.value)
    throw error
  }
}

// Step 3. CSV를 통한 DB 생성 함수
async function performCSVToDB() {
  const csvToDbParams = {
    csv: csvRootPath.value,
    dbpath: dbPath.value
  }
  return new Promise<void>((resolve) => {
    kapeApi.csvToDB(csvToDbParams, (result) => {
      console.log(csvToDbParams)
      console.log('csv로 DB 생성(개별 아티팩트 생성) API 호출:', result)
      setAnalysisInfo(filteredSubBars, 'csv', { state: result.cmd, percent: result.index })
      if (result.cmd === 'error') {
        openError('개별 아티팩트 생성 중 오류가 발생했습니다. 확인 후 다시 시도바랍니다.')
        hasError.value = true
        caseStore.setHasAnalysisError(hasError.value)
      } else if (result.cmd === 'end') {
        // KAPE 분석이 완료된 경우 resolve
        resolve()
      }
    })
  })
}

// Step 4. 통합 테이블 생성 함수
async function performCreateIntegratedTable() {
  return new Promise<void>((resolve) => {
    kapeApi.createIntegratedTable(dbPath.value, (result) => {
      console.log('통합 테이블 API 호출:', result.state, result.percent)
      setAnalysisInfo(filteredSubBars, 'integratedDB', { state: result.state, percent: result.percent })
      if (
        result.state === '_999' ||
        result.state === 'D001' ||
        result.state === 'D002' ||
        result.state === 'D003' ||
        result.state === 'D004' ||
        result.state === 'D005' ||
        result.state === 'D006' ||
        result.state === 'D007'
      ) {
        openError('통합 테이블 생성 중 오류가 발생했습니다. 확인 후 다시 시도바랍니다.')
        hasError.value = true
        caseStore.setHasAnalysisError(hasError.value)
      } else if (result.percent === 100) {
        // KAPE 분석이 완료된 경우 resolve
        resolve()
      }
    })
  })
}
// Step 4. 트리아제 & 윈아트 정보 케이스 테이블 생성 함수
async function performAddCaseInfoTable(): Promise<void> {
  const triageCaseHashFileValue = triageCaseHashFile.value
  const triageData = [
    { _key: 'triage', _value: triageCaseHashFileValue?.fileName },
    { _key: 'triage', _value: triageCaseHashFileValue?.hash.md5 },
    { _key: 'triage', _value: triageCaseHashFileValue?.hash.sha1 },
    { _key: 'triage', _value: triageCaseHashFileValue?.fileSize },
    { _key: 'triage', _value: triageCaseHashFileValue?.version }
  ].filter(({ _value }) => _value !== undefined)

  const artData = [
    { _key: 'art', _value: '왜' },
    { _key: 'art', _value: '왜 안돼' },
    { _key: 'art', _value: '왜지?!' }
  ]
  await kapeApi.writeCaseInfo({ op: 'ADD', data: [...triageData, ...artData] })
}

// isFolder 값이 변경될 때 실행되는 로직
watch(
  isFolder,
  (newValue) => {
    if (newValue) {
      // isFolder가 true일 경우, 첫 번째 다이얼로그를 열기
      if (dialogRef.value) {
        dialogRef.value.show() // null 체크 추가
      }
    } else {
      // isFolder가 false일 경우, 두 번째 다이얼로그를 열기
      acquisitionImageExport.value.imageType = triageImageType.value
      acquisitionImageExport.value.imageFilePath = triageImagePath.value

      // isShowSecondDialog.value = true
      isShowSecondDialog.value = !homeIndicatorFlag.value
    }
  },
  { immediate: true }
)
// isShowSecondDialog 값이 변경될 때 실행
watch(
  isShowSecondDialog,
  (newValue) => {
    if (newValue === true) {
      // isShowSecondDialog가 true일 경우에만 startAnalysis 함수 호출
      startAnalysis()
    }
  },
  { immediate: true }
)
// isImage 값이 변경될 때 실행되는 로직
watch(
  isImage,
  (newValue) => {
    if (newValue) {
      // isImage가 true일 경우 => 이미지 풀기
      acquisitionImageExport.value.imageType = triageImageType.value
      acquisitionImageExport.value.imageFilePath = triageImagePath.value
      kapeRootPath.value = `${props.artCaseFolderPath}\\Temp\\Export\\kape`
      kapeDestPath.value = `${props.artCaseFolderPath}\\Temp\\CSV`
      csvRootPath.value = `${props.artCaseFolderPath}\\Temp\\CSV`
      dbPath.value = `${props.artCaseFolderPath}\\Temp\\DB\\art_${caseDetail.value?.caseName}.db`
    } else {
      // isImage가 false일 경우 => 디렉토리 분석
      acquisitionImageExport.value.imageType = triageImageType.value
      acquisitionImageExport.value.imageFilePath = ''
      kapeRootPath.value = `${props.triageDirectoryFilePath}`
      kapeDestPath.value = `${props.artCaseFolderPath}\\Temp\\CSV`
      csvRootPath.value = `${props.artCaseFolderPath}\\Temp\\CSV`
      dbPath.value = `${props.artCaseFolderPath}\\Temp\\DB\\art_${caseDetail.value?.caseName}.db`
    }
  },
  { immediate: true }
)
/** 서브바 필터 */
const filteredSubBars: Ref<SubBarProps[]> = computed(() => {
  if (isFolder.value && !isImage.value) {
    // 폴더 경우에 해당하는 subBars의 부분집합 반환
    return reactive([
      {
        step: 'kape',
        progress: {
          state: '',
          percent: 0
        }
      },
      {
        step: 'csv',
        progress: {
          state: '',
          percent: 0
        }
      },
      {
        step: 'integratedDB',
        progress: {
          state: '',
          percent: 0
        }
      }
    ])
  } else {
    // 폴더가 아닌 경우
    return reactive([
      {
        step: 'unzip',
        progress: {
          state: 'start',
          percent: 0,
          filepath: ''
        }
      },
      {
        step: 'kape',
        progress: {
          state: '',
          percent: 0
        }
      },
      {
        step: 'csv',
        progress: {
          state: '',
          percent: 0
        }
      },
      {
        step: 'integratedDB',
        progress: {
          state: '',
          percent: 0
        }
      }
    ])
  }
})

/**
 * 획득 진행에 따른 진행바 정보 세팅
 *
 * @param bars 진행바 목록
 * @param step 진행 스텝
 * @param info 진행 정보
 */
async function setAnalysisInfo(
  bars: Ref<SubBarProps[]>,
  step: string,
  info: { state: string; percent: number; filepath?: string }
): Promise<void> {
  // 스텝 조회
  const obj = bars.value.find((item) => item.step === step)
  if (!obj) {
    return
  }
  // 서브바 진행상태 세팅
  obj.progress.state = info.state
  obj.progress.percent = info.percent
  obj.progress.filepath = info.filepath
  if (info.state == 'end' || info.state == 'error') {
    hasError.value = info.state == 'error'
  }
  // 서브바 진행 상태 세팅
  obj.progress.percent = info.percent
  obj.progress.state =
    info.state == 'end' ||
    (info.state === '_009' && info.percent == 100) ||
    (step === 'integratedDB' && info.percent === 100)
      ? 'end'
      : info.state == 'error' ||
        info.state == '_999' ||
        info.state === 'A001' ||
        info.state === 'A002' ||
        info.state === 'A003' ||
        info.state === 'A004' ||
        (info.percent == -1 &&
          (info.state == 'D001' ||
            info.state == 'D002' ||
            info.state == 'D003' ||
            info.state == 'D004' ||
            info.state == 'D005' ||
            info.state == 'D006' ||
            info.state == 'D007'))
      ? 'error'
      : 'extract'

  // 모든 obj의 progress.percent가 100인지 확인
  const allStepsCompleted = bars.value.every((item) => item.progress.percent === 100)
  if (allStepsCompleted) {
    completed.value = true
  } else {
    completed.value = false
  }
}
/**
 * 분석 확인 버튼 클릭
 *
 */
async function onSecondDialogClose(): Promise<void> {
  // 오류
  if (hasError.value) {
    console.error('오류가 발생했습니다.')
    hasError.value = true
    caseStore.setHasAnalysisError(hasError.value)
    onDialogOK(false)
  } else {
    //TO DO : 완료 시간, 획득 시간 정보 처리 필요
    onDialogOK(true)
  }
  isShowSecondDialog.value = false
  caseStore.setStartAnalysisFlag(false)
  console.log(isShowSecondDialog.value)
}
// onMounted(() => {})
// onUnmounted(() => {})
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
