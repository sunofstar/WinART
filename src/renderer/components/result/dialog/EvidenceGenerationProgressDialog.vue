<!-- 보고서 증거이미지 생성 진행 화면 -->
<!-- 20231201 FE 백지연_ 증거이미지 생성 진행 화면 UI 변경-->
<template>
  <q-dialog ref="dialogRef" v-model="isOpen" @hide="onDialogHide">
    <q-card class="q-dialog-plugin evidence-create-dialog evidence-generation-dialog" style="width: 900px">
      <q-card-section class="d-header">
        <h1>증거이미지 생성</h1>
      </q-card-section>
      <q-card-section class="d-container">
        <div class="progress-col progress-layout">
          <!-- 이미지 타입 -->
          <div class="row items-center main-title">
            <h2>선별이미지 DB 생성</h2>
            <div class="row items-center">
              <span class="text-lg-2 bold">{{ getStepText('selectImgDB') }}</span>
              <q-spinner v-if="getStepText('selectImgDB') === '대기중...'" color="primary" size="2em" />
            </div>
          </div>
          <div class="progress-row evidence width-max progress-ani">
            <!-- 프로그래스 바 -->
            <q-linear-progress
              stripe
              :value="getStepProgress('selectImgDB')"
              :color="progressColor"
              :class="{ loading: progressAni }"
            ></q-linear-progress>
          </div>
        </div>
        <q-separator />
        <!-- 증거이미지 생성 -->
        <div class="progress-col progress-layout">
          <!-- 이미지 타입 -->
          <div class="row items-center main-title">
            <h2>{{ getImageTypeUpperCase() }}</h2>
            <div class="row items-center">
              <span class="text-lg-2 bold">{{ getStepText('createImg') }}</span>
              <q-spinner v-if="getStepText('createImg') === '대기중...'" color="primary" size="2em" />
            </div>
          </div>
          <div class="progress-row evidence progress-ani">
            <!-- 프로그래스 바 -->
            <q-linear-progress
              stripe
              :value="getStepProgress('createImg')"
              :color="progressColor"
              :class="{ loading: progressAni }"
            ></q-linear-progress>
            <!-- 폴더 열기 버튼 (완료되지 않으면 비활성화) -->
            <q-btn
              color="primary"
              outline
              icon="mdi-folder-open-outline"
              class="btn-folder"
              label="폴더열기"
              :disable="!isShowOpenFolder"
              @click="openFolder"
            />
          </div>
        </div>
        <q-separator />
        <div class="progress-col progress-layout">
          <div class="row items-center main-title">
            <h2>해시값 계산</h2>
            <div class="row items-center">
              <span class="text-lg-2 bold">{{ getStepText('calHash') }}</span>
              <q-spinner v-if="getStepText('calHash') === '대기중...'" color="primary" size="2em" />
            </div>
          </div>
          <div class="progress-row evidence width-max progress-ani">
            <!-- 프로그래스 바 -->
            <q-linear-progress
              stripe
              :value="getStepProgress('calHash')"
              :color="progressColor"
              :class="{ loading: progressAni }"
            ></q-linear-progress>
          </div>
          <table class="tbl-data narrow">
            <colgroup>
              <col width="14%" />
              <col width="*" />
            </colgroup>
            <tbody>
              <tr>
                <th>MD5</th>
                <td>{{ imgFileInfo.hash.md5 || '' }}</td>
              </tr>
              <tr>
                <th>SHA1</th>
                <td>{{ imgFileInfo.hash.sha1 || '' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <!-- 서브 진행__문서서식 -->
        <evidence-sub-progress-bar
          v-for="(item, index) in subList"
          :all-completed="completed"
          :id="item.id"
          :key="index"
          :title="item.title"
          :file-path="item.filePath"
        ></evidence-sub-progress-bar>
      </q-card-section>
      <q-card-actions class="d-footer">
        <q-btn outline icon="mdi-close" label="닫기" :disable="!isShowOkBtn" @click="okClick" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
/**
 * 증거이미지 생성 진행 다이얼로그
 *
 */
import * as ini from 'ini'
import evidenceImageApi from '@renderer/api/evidenceImageApi'
import kapeApi from '@renderer/api/kapeApi'
import commonApi from '@renderer/api/commonApi'
import electronApi from '@renderer/api/electronApi'
import EvidenceSubProgressBar, {
  Props as SubProps
} from '@renderer/components/result/dialog/EvidenceSubProgressBar.vue'
import { useCaseStore } from '@renderer/stores/caseStore'
import { setDate } from '@renderer/utils/utils'
import { CreateEvidenceImage, HashVal, EvidenceCaseInfo, DB_COPY_CMD, Report1Send, Report2Send } from '@share/models'
import _ from 'lodash'
import { storeToRefs } from 'pinia'
import { colorsHsva, useDialogPluginComponent } from 'quasar'
import { computed, ComputedRef, onMounted, onUnmounted, Ref, ref, toRefs, reactive, watchEffect } from 'vue'
import { useRouter } from 'vue-router'
import { openError } from '@renderer/composables/useDialog'
// 사용자 다이얼로그 오픈 여부
const isOpen: Ref<boolean> = ref(true)
const router = useRouter()
const caseStore = useCaseStore()
const systemStore = useSystemStore()
const { caseDetail, dbPath, initialCasePath } = storeToRefs(caseStore)
const { appVersion } = storeToRefs(systemStore)

// props
interface Props {
  dbObj: DB_COPY_CMD
  evidenceCaseObj: EvidenceCaseInfo
  evidenceCaseFilePath: string
  evidenceObj: CreateEvidenceImage
  selectedDocuments: string[]
  report1Obj: Report1Send
}
// csv 추가되는 내용
interface newInput {
  selectedFileSize: string
  selectedHashValue: string
  selectedHashType: string
}
const props = defineProps<Props>()
const { dbObj, evidenceCaseObj, evidenceCaseFilePath, evidenceObj, selectedDocuments, report1Obj } = toRefs(props)
const $q = useQuasar()
import { useQuasar } from 'quasar'
import { useSystemStore } from '@renderer/stores/systemStore'
import moment from 'moment'
defineEmits([...useDialogPluginComponent.emits])
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent()

// 증거이미지 생성 시간
const createImageTime = ref({
  startTime: '',
  endTime: ''
})

// 이미지 타입
const getImageTypeUpperCase = () => {
  const type = imageType.value
  return type ? type.toUpperCase() : '' // type이 정의되어 있으면 대문자로 변환, 그렇지 않으면 빈 문자열 반환
}

// 현재 진행 중인 스텝 정보
const currentStep = ref('selectImgDB')

// 각 스텝에 대한 진행율을 저장하는 객체
const stepProgress: Record<string, number> = reactive({
  selectImgDB: 0,
  createImg: 0,
  calHash: 0
})

// 진행율 설정 함수
function setStepProgress(step: string, percent: number): void {
  stepProgress[step] = percent
}

// 현재 진행 중인 스텝에 대한 진행율 반환 함수
function getStepProgress(step: string): number {
  return stepProgress[step] ? stepProgress[step] / 100 : 0
}
// 진행률 텍스트
function getStepText(step: string): string {
  const percent = stepProgress[step]
  if (percent === 0 || percent === -1) {
    return '대기중...'
  }
  // 0에서 100 사이의 값으로 조절
  const adjustedPercent = Math.min(Math.max(percent, 0), 100)
  // 100 미만의 값은 그대로 표시, 100 이상의 값은 100으로 표시
  const formattedPercent = percent === 100 ? 100 : adjustedPercent.toFixed(1).replace(/\.0$/, '')
  return `${formattedPercent} %`
}

// 진행바 색상
const progressColor = computed(() => {
  const currentPercent = stepProgress[currentStep.value]
  return typeof currentPercent === 'number' && currentPercent >= 0 && currentPercent <= 100 ? 'info' : 'negative'
})

// 프로그래스바 진행중일때 애니메이션 보이게
const progressAni = computed(() => {
  return stepProgress[currentStep.value] > 0 && stepProgress[currentStep.value] < 100
})

// 증거이미지 해시값 정보
const imgFileInfo = ref({
  hash: {
    md5: '',
    sha1: ''
  },
  fileSize: 0
})

// csv 해시값 정보
const csvHashInfo = ref({
  hash: {
    md5: '',
    sha1: ''
  }
})

// 보고서 생성 정보
interface SubProgress extends SubProps {
  id: string
  title: string
  filePath: string
}
const subProgress: Ref<SubProgress[]> = ref([
  {
    id: 'report1',
    title: '현장조사확인서',
    state: 'wait',
    filePath:
      evidenceCaseObj.value.evidenceCaseFolder +
      '\\Report' +
      '\\evidence_' +
      evidenceCaseObj.value.evidenceImgfileName +
      '_현장조사확인서.pdf'
  },
  {
    id: 'report2',
    title: '전자정보의 관련성에 관한 의견진술서',
    state: 'wait',
    filePath:
      evidenceCaseObj.value.evidenceCaseFolder +
      '\\Report' +
      '\\evidence_' +
      evidenceCaseObj.value.evidenceImgfileName +
      '_전자정보의 관련성에 관한 의견진술서.pdf'
  },
  {
    id: 'report3',
    title: '결과보고서',
    state: 'end',
    filePath:
      evidenceCaseObj.value.evidenceCaseFolder +
      '\\Report' +
      '\\evidence_' +
      evidenceCaseObj.value.evidenceImgfileName +
      '.xlsx'
  }
])
// 서브 프로그래스 목록 (선택된 문서서식만 해당)
const subList: ComputedRef<SubProgress[]> = computed(() => {
  return subProgress.value.filter((item) => selectedDocuments.value.includes(item.id))
})

// 이미지 타입 정보
const imageType = computed(() => {
  const imageTypeTitle = props.evidenceObj.imageType
  return imageTypeTitle
})

// 완료여부
const completed: Ref<boolean> = ref(false)
// 오류여부
const hasError: Ref<boolean> = ref(false)
// 확인버튼 표시 여부
const isShowOkBtn = computed(() => completed.value || hasError.value)
// 증거이미지 생성 성공 여부
const isSucess: Ref<boolean> = ref(false)
// 파일열기 버튼 표시 여부
const isShowOpenFolder: Ref<boolean> = ref(false)
/**
 * 증거이미지 생성 폴더 오픈
 *
 */
async function openFolder() {
  if (!props.evidenceCaseObj.evidenceCaseFolder) {
    return
  }
  const errorMsg = await electronApi().openPath(props.evidenceCaseObj.evidenceCaseFolder)
  if (errorMsg) {
    electronApi().logError(errorMsg)
  }
}

/*
 * 선별이미지 DB 생성 진행
 * 1) 선별이미지 DB 생성 ('케이스폴더/Evidence/202311112222/DB/evidence_이미지파일명.db')
 * 2) 선별이미지 케이스 생성
 * 3) 증거이미지 생성
 * 4) 해시값 계산
 * 5) 보고서 생성
 * 6) 보고서 파일 열기 연결
 * 7) .hash 형식 파일 생성
 */
async function startDBGenerate(): Promise<void> {
  try {
    //  0) 기본 정보 설정
    const dbGenerationInfo = _.cloneDeep(dbObj.value)
    const evidenceImgInfo = _.cloneDeep(evidenceObj.value)
    const evidenceCaseInfo = _.cloneDeep(evidenceCaseObj.value)
    const evidenceCaseFilePathInfo = _.cloneDeep(evidenceCaseFilePath.value)
    const reportInfo = _.cloneDeep(report1Obj.value)
    const hashFilePath =
      evidenceCaseInfo.evidenceCaseFolder +
      '\\Image' +
      '\\evidence_' +
      evidenceCaseInfo.evidenceImgfileName +
      '.' +
      'txt'
    console.log(hashFilePath)
    // 1) step 1. 선별이미지 DB 생성 시작
    await generateSelectImgDB(dbGenerationInfo)
    // 2) step 2. 선별이미지 케이스 생성(evidence_ .cse)
    await createEvidenceCase(evidenceCaseInfo, evidenceCaseFilePathInfo)
    // 3) step 3. 증거이미지 생성
    await createEvidenceImg(evidenceImgInfo)
    // 4) step 4. 해시값 계산
    await calFileHash(evidenceImgInfo.imageFilePath)
    // 5) step 5. 보고서 생성
    await makeReport()
    // 6) step 6. .hash 형식 파일 생성
    const csvFileHashs = await getCsvFileHash(evidenceCaseInfo.evidenceCaseFolder)
    const hashtoMapString = await hashToMap(imgFileInfo.value, csvFileHashs, createImageTime.value)
    const jsonToText = hashtoMapString.iniTxt
    await writeHashFile(hashFilePath, jsonToText)
    // const evidenceImgFileSize = await getfilesize(evidenceImgInfo.imageFilePath)
    // hashInfo.value.fileSize = evidenceImgFileSize
    // console.log('----', evidenceImgFileSize)
    // 7) step 7. csv파일 내용 업데이트
    await updateCsv({
      // selectedFileSize: String(evidenceImgFileSize),
      selectedFileSize: imgFileInfo.value.fileSize + '',
      selectedHashValue: `MD5: ${imgFileInfo.value.hash.md5 || ''}, SHA1: ${imgFileInfo.value.hash.sha1 || ''}`,
      selectedHashType: 'MD5, SHA1'
    })
  } catch (error) {
    console.error('증거이미지 생성중 오류 발생:', error)
    hasError.value = true
  }
}

// Step 1. 선별이미지 DB 생성 api
async function generateSelectImgDB(dbParam: DB_COPY_CMD) {
  return new Promise<void>((resolve) => {
    kapeApi.generateSelectImageDb(dbParam, (state) => {
      console.log('(1) 선별이미지 DB 생성:', state)
      setStepProgress('selectImgDB', state.percent)
      if (state.state === '_999' || state.state === 'T001' || state.state === 'T002' || state.state === 'T003') {
        openError('DB 생성 중 오류가 발생했습니다. 확인 후 다시 시도바랍니다.')
        hasError.value = true
      } else if (state.state === '_000' && state.percent === 100) {
        // DB 생성이 완료된 경우 resolve
        resolve()
      }
    })
  })
}
// Step 2. 증거이미지 케이스 생성
async function createEvidenceCase(evidenceCaseObj: EvidenceCaseInfo, evidenceCaseFilePath: string) {
  return new Promise<void>((resolve) => {
    commonApi.writeFileText(evidenceCaseFilePath, JSON.stringify(evidenceCaseObj))
    console.log('(2) evidence 케이스 생성 완료')
    resolve()
  })
}
// Step 3. 증거이미지 생성 (DEPH/AFF4)
async function createEvidenceImg(crerateImage: CreateEvidenceImage) {
  return new Promise<void>((resolve) => {
    evidenceImageApi.createEvidenceImage(crerateImage, (state) => {
      console.log('(3) 증거이미지 생성:', state)
      setStepProgress('createImg', state.percent)
      if (state.state === 'start') {
        // 증거이미지 생성 시작 시간
        createImageTime.value.startTime = moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
      }
      if (state.state === 'end') {
        // 증거이미지 생성 종료 시간
        createImageTime.value.endTime = moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
        if (createImageTime.value.startTime === createImageTime.value.endTime) {
          // 시작 시간과 종료 시간이 동일한 경우 초를 1초 더하여 처리
          createImageTime.value.endTime = moment(createImageTime.value.endTime)
            .add(1, 'second')
            .format('YYYY-MM-DD HH:mm:ss')
        }
        resolve()
        isShowOpenFolder.value = true
        isSucess.value = true
      }
    })
  })
}
// Step 4. 해시값 계산
async function calFileHash(filePath: string) {
  return new Promise<void>((resolve) => {
    evidenceImageApi.getFileHash(filePath, (state, percent, hash) => {
      console.log('(4) 해시값 계산 :', state, percent, hash)
      setStepProgress('calHash', percent)
      imgFileInfo.value.hash.md5 = hash?.md5
      imgFileInfo.value.hash.sha1 = hash?.sha1
      if (state === 'end') {
        resolve()
      }
    })
  })
}
// Step 5. 문서 파일 생성__1. 현장 조사 확인서 __2. 의견진술서
async function makeReport(): Promise<void> {
  // 문서 생성 대상 목록
  const documentList = subList.value.map((item) => item.id)
  // 각 문서 생성을 병렬로 실행
  const results = await Promise.all(
    documentList.map(async (documentId) => {
      // 타입별 문서 생성
      try {
        const result = await createDocumentType[documentId]()
        // 문서 생성 결과에 따른 진행상태 처리
        const obj = subProgress.value.find((item) => item.id == documentId)
        if (obj) {
          obj.state = result ? 'end' : 'error'
          hasError.value = !result
        }
        return result
      } catch (error) {
        console.error(`보고서 생성시 오류 발생 ${documentId}:`, error)
        return false
      }
    })
  )
  // 완료 처리
  completed.value = true
}

// Step 6. .hash 파일 생성
async function writeHashFile(hashPath: string, jsonText: string): Promise<void> {
  await commonApi.writeFileText(hashPath, jsonText)
}

// Step 7. 결과보고서 xlsx에 값 업테이트 csv 업데이트
async function updateCsv(newValue: newInput): Promise<void> {
  const updatedDBObj: DB_COPY_CMD = _.cloneDeep(dbObj.value)
  const updatedReportItems = updateNewValues(newValue)

  updatedDBObj.reportItems = updatedReportItems
  await kapeApi.changeSelectImageInfo(updatedDBObj)
}

/**
 * 선별이미지 fileSize 반환
 *
 */
async function getfilesize(filePath: string) {
  return commonApi.getFileSize
}
/**
 * csv 파일의 해시값 조회
 *
 */
async function getCsvFileHash(getFilePathString: string) {
  const csvFilePath =
    getFilePathString +
    '\\Image' +
    '\\evidence_' +
    evidenceCaseObj.value.evidenceImgfileName +
    '.' +
    evidenceObj.value.imageType +
    '.csv'
  const getCsvFileHashString = await commonApi.getFileHash(csvFilePath)
  csvHashInfo.value.hash.md5 = getCsvFileHashString.md5
  csvHashInfo.value.hash.sha1 = getCsvFileHashString.sha1
  return getCsvFileHashString
}
/**
 *
 * 선택이미지 전자정보목록 csv xlsx 추가내용
 */
function updateNewValues(input: newInput) {
  const updatedValues = _.cloneDeep(dbObj.value.reportItems)
  updatedValues.selectedFileSize = input.selectedFileSize
  updatedValues.selectedHashValue = input.selectedHashValue
  updatedValues.selectedHashType = input.selectedHashType
  return updatedValues
}

// 문서 타입별 생성 프로세스
const createDocumentType: Record<string, () => Promise<boolean | void>> = {
  async report1() {
    console.log('보고서 생성1')
    return await createReport1()
  },
  async report2() {
    console.log('보고서 생성2')
    return await createReport2()
  },
  async report3() {
    console.log('보고서 생성3')
    return
  }
}

async function createReport1(): Promise<boolean | void> {
  // 보고서 양식 1___현장조사확인서
  const param: Report1Send = {
    caseFilePath:
      evidenceCaseObj.value.evidenceCaseFolder +
      '\\Report' +
      '\\evidence_' +
      evidenceCaseObj.value.evidenceImgfileName +
      '_현장조사확인서.pdf',
    caseName: report1Obj.value.caseName ? _.trim(report1Obj.value.caseName) : '',
    imgNum: report1Obj.value.imgNum ? _.trim(report1Obj.value.imgNum) : '',
    confiscatedPlace: evidenceCaseObj.value.acquisitionLocation
      ? _.trim(evidenceCaseObj.value.acquisitionLocation)
      : '',
    confiscatedType: report1Obj.value.confiscatedType,
    confiscatedName: evidenceCaseObj.value.confiscatedName ? _.trim(evidenceCaseObj.value.confiscatedName) : '',
    analystName: evidenceCaseObj.value.analystName ? _.trim(evidenceCaseObj.value.analystName) : '',
    realDatetime: evidenceCaseObj.value.analysisDate ? _.trim(evidenceCaseObj.value.analysisDate) : '',
    kSTTime: evidenceCaseObj.value.analysisDate ? _.trim(evidenceCaseObj.value.analysisDate) : '',
    caseImgName: evidenceCaseObj.value.evidenceImgfileName ? _.trim(evidenceCaseObj.value.evidenceImgfileName) : '',
    imageFileCreationDate: createImageTime.value.endTime, //이미지파일 생성일시
    imageFileHashMd5: imgFileInfo.value.hash.md5, // 증거이미지 해시값 md5
    imageFileHashSha1: imgFileInfo.value.hash.sha1, // 증거이미지 해시값 sha1
    listFileHashMd5: csvHashInfo.value.hash.md5 || ''
  }
  return await evidenceImageApi.makeReport1(param)
}

async function createReport2(): Promise<boolean | void> {
  // 보고서 양식 2___전자정보의 관련성에 관한 의견진술서
  const param: Report2Send = {
    caseFilePath:
      evidenceCaseObj.value.evidenceCaseFolder +
      '\\Report' +
      '\\evidence_' +
      evidenceCaseObj.value.evidenceImgfileName +
      '_전자정보의 관련성에 관한 의견진술서.pdf',
    confiscatedName: evidenceCaseObj.value.confiscatedName ? _.trim(evidenceCaseObj.value.confiscatedName) : '',
    confiscatedNumber: evidenceCaseObj.value.confiscatedNumber ? _.trim(evidenceCaseObj.value.confiscatedNumber) : '',
    caseImgName: evidenceCaseObj.value.evidenceImgfileName ? _.trim(evidenceCaseObj.value.evidenceImgfileName) : ''
  }
  return await evidenceImageApi.makeReport2(param)
}

/** Map을 통해 증거이미지 JSON 생성
 *
 * @param 해시값, 파일 해시값
 */
async function hashToMap(
  hashInfo: { hash: { md5: string; sha1: string } },
  csvFileHash: HashVal,
  createImageTime: { startTime: string; endTime: string }
) {
  const dataMap = new Map<string, any>()
  const fileName = `evidence_${evidenceCaseObj.value.evidenceImgfileName}.${evidenceObj.value.imageType}`
  const csvFileName = `evidence_${evidenceCaseObj.value.evidenceImgfileName}.${evidenceObj.value.imageType}.csv`
  const imgFilePath = evidenceCaseObj.value?.evidenceCaseFolder + '\\Image\\' + fileName
  const imgFileSize = await commonApi.getFileSize(imgFilePath)
  imgFileInfo.value.fileSize = imgFileSize
  // console.log(imgFileSize)

  // investigator 상세내역
  dataMap.set('Investigator', {
    Name: evidenceCaseObj.value.analystName,
    Title: evidenceCaseObj.value.analystRank
  })
  // WinART Version 정보
  dataMap.set('Version', {
    WinARTVersion: appVersion.value
  })
  // ARTInfo 상세내역
  dataMap.set('FileInfo', {
    fileName,
    MD5HashValue: imgFileInfo.value.hash.md5,
    SHA1HashValue: imgFileInfo.value.hash.sha1,
    startTime: createImageTime.startTime || '',
    finishTime: createImageTime.endTime || '',
    fileSize: imgFileSize
    // totalImagingCount: ''
  })
  // 성공한 이미지 파일 개수
  // dataMap.set('ImagingSuccess', {
  //   successfulFiles: ''
  // })
  // csvInfo 상세내역
  dataMap.set('CsvInfo', {
    imagingListFileName: csvFileName,
    MD5HashValue: csvFileHash.md5,
    SHA1HashValue: csvFileHash.sha1
  })
  // Map to INI 파일
  const iniTxt = ini.stringify(Object.fromEntries(dataMap))
  console.log('hash파일(.txt) 생성 완료')
  return { dataMap, iniTxt }
}

/**
 * 확인 버튼 클릭
 *
 */
async function okClick(): Promise<void> {
  // 오류
  if (hasError.value) {
    onDialogOK(false)
  } else {
    onDialogOK(true)
  }
}

// watchEffect를 사용하여 hasError를 감시하고 caseStore를 업데이트합니다.
watchEffect(() => {
  caseStore.setHasEvidenceError(hasError.value)
})

onMounted(async () => startDBGenerate())
</script>

<style scoped lang="scss">
.evidence-create-dialog {
  .tbl-data {
    font-size: 0.9375rem;
    font-weight: 700;
    th {
      font-weight: 700;
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
.evidence-generation-dialog :deep {
  .progress-col {
    margin: 0px;
    &.progress-layout {
      padding: 0.75rem 0;
      h2 {
        color: $primary;
      }
      &:first-child {
        padding-top: 0;
      }
      .main-title {
        padding-bottom: 0.5rem;
        .q-spinner {
          margin-left: 1rem;
        }
      }
      .progress-row.evidence.width-max {
        .q-linear-progress {
          width: 100%;
        }
      }
    }
    .tbl-data {
      width: 100%;
      margin: 1rem 0;
    }
  }
}
// 프로그래스바 진행중일때 애니메이션
.progress-ani :deep {
  .q-linear-progress {
    &.loading {
      .q-linear-progress__stripe {
        animation: progress 0.8s linear 0s infinite;
      }
    }
  }
  @keyframes progress {
    from {
      background-position: 0 0;
    }
    to {
      background-position: 40px 0;
    }
  }
}

// 화이트모드
.body--light {
  .evidence-generation-dialog :deep {
    .progress-col {
      &.progress-layout {
        h2 {
          color: $light-primary;
        }
      }
    }
  }
}
</style>
