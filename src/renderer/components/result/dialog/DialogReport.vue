<script setup lang="ts">
/**********************************************
 *
 * 보고서 생성 Dialog
 *
 **********************************************/

/**********************************************
 * @description Import
 */
import { maxLengthRule, requiredRule, specialCharRule } from '@renderer/utils/validationRules'
import { defineProps, defineEmits, computed, onMounted, Ref, ref, ComputedRef, watchEffect, watch } from 'vue'
import { QInput, QOptionGroupProps, QDialogOptions, useQuasar } from 'quasar'
import { openAlert, openConfirm, openDialog, openError } from '@renderer/composables/useDialog'
import DbGenerationProgressDialog from '@renderer/components/result/dialog/DbGenerationProgressDialog.vue'
import EvidenceGenerationProgressDialog from '@renderer/components/result/dialog/EvidenceGenerationProgressDialog.vue'
import DateCalendar from '@renderer/components/common/DateCalendar.vue'
import electronApi from '@renderer/api/electronApi'
import bookmarkApi from '@renderer/api/bookmarkApi'
import commonApi from '@renderer/api/commonApi'
import { setDate, getFormattedCurrentDate, getParentFolder, generateTimestamp } from '@renderer/utils/utils'
import { storeToRefs } from 'pinia'
import { useSystemStore } from '@renderer/stores/systemStore'
import { useCaseStore } from '@renderer/stores/caseStore'
import { useTriageCaseStore } from '@renderer/stores/triageCaseStore'
import { useRouter } from 'vue-router'
import {
  AnalysisSelectReportSummary,
  DB_COPY_CMD,
  EvidenceCaseInfo,
  CreateEvidenceImage,
  EvidenceImageState,
  Report1Send
} from '@renderer/shared/models'
import _ from 'lodash'
import moment from 'moment'
const triageCaseStore = useTriageCaseStore()
const caseStore = useCaseStore()
const systemStore = useSystemStore()
const { triageCaseDetail, triageCaseHashFileInfo, triageCaseHashFile, triageCaseFileName } =
  storeToRefs(triageCaseStore)
const { caseDetail, dbPath, initialCasePath, evdenceImageParentPath } = storeToRefs(caseStore)
const { overviewSystem, overviewArtifacts, hasEvidenceError } = storeToRefs(caseStore)
const { appVersion } = storeToRefs(systemStore)
const $q = useQuasar()

/**********************************************
 * @description Define variables
 */
const router = useRouter()
const props = defineProps(['isShow'])
const emit = defineEmits(['update:isShow'])
const isShow = computed({
  get() {
    return props.isShow
  },
  set(value) {
    emit('update:isShow', value)
  }
})

// 불러온 케이스 파일의 상위 폴더 경로
const initialParentPath = getParentFolder(initialCasePath.value)

// 북마크 전체 선택
const checkAll = ref(false)

// 선택된 북마크 상태 관리
const selectedBookmarks = ref([])

// watchEffect를 사용하여 북마크 옵션 변경 감지
watchEffect(() => {
  // 전체 선택일 경우 모든 북마크를 선택 상태로 설정
  if (checkAll.value) {
    selectedBookmarks.value = computedBookmarkOptions.value.map((bookmark) => bookmark.value)
  }
})

watch(selectedBookmarks, (newSelectedBookmarks, oldSelectedBookmarks) => {
  const addedBookmark = newSelectedBookmarks.find((bookmark) => !oldSelectedBookmarks.includes(bookmark))
  const removedBookmark = oldSelectedBookmarks.find((bookmark) => !newSelectedBookmarks.includes(bookmark))
})

watch(checkAll, (newValue) => {
  // 전체 해제시 선택된 북마크 비움
  if (!newValue) {
    selectedBookmarks.value = []
  }
})
// 북마크 모음
const bookmarkoptions = ref([])

// 북마크 조회
const computedBookmarkOptions = computed(() =>
  bookmarkoptions.value
    .filter((bookmark) => bookmark.CNT > 0)
    .map((bookmark) => ({
      label: bookmark.b_name,
      value: bookmark.b_id,
      color: bookmark.b_color || '#FF3333',
      count: bookmark.CNT || 0
    }))
)
// 이미지 타입
const imageType = ref<'deph' | 'aff4'>('deph')
// 보고서 문서 서식
const selectedDocument: Ref<string[]> = ref(['report1', 'report2', 'report3'])
const documentOptions: QOptionGroupProps['options'] = [
  {
    label: '현장조사확인서',
    value: 'report1'
  },
  {
    label: '전자정보의 관련성에 관한 의견진술서',
    value: 'report2'
  }
]

// 초기값을 저장할 변수
let savedValues: {} | null = null

// 함수화하여 기존값을 가져오는 함수
const getInitialValues = (source: string | null | undefined, defaultValue = ''): string => {
  return source ?? defaultValue
}

// 함수화하여 초기값 담는 함수
// 1순위 : caseStore(ART 정보), 2순위: triageCaseStore(Triage 정보), 그외: '' */
const saveInitialValues = () => {
  // console.log(initialParentPath)
  savedValues = {
    // 초기 압수자 정보
    initialAnalystOffice: getInitialValues(
      caseDetail.value?.analystAgency || triageCaseDetail.value?.analystOffice,
      ''
    ),
    initialAnalystDept: getInitialValues(
      caseDetail.value?.analystDepartment || triageCaseDetail.value?.analystDept,
      ''
    ),
    initialAnalystName: getInitialValues(caseDetail.value?.analystName || triageCaseDetail.value?.analystName, ''),
    initialAnalystRank: getInitialValues(caseDetail.value?.analystRank || triageCaseDetail.value?.analystRank, ''),
    // 초기 압수 정보
    initialCaseName: getInitialValues(
      caseDetail.value?.caseName || caseDetail.value?.evidenceImgfileName || triageCaseDetail.value?.caseName,
      ''
    ),
    initialImgNum: getInitialValues(triageCaseDetail.value?.imgNum, ''),
    initialConfiscatedPlace: getInitialValues(triageCaseDetail.value?.confiscatedPlace, ''),
    initialSystemDate: getInitialValues(triageCaseDetail.value?.systemDatetime, ''),
    initialRealDatetime: getInitialValues(
      triageCaseDetail.value?.realDatetime ||
        caseDetail.value?.caseRegDate ||
        moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
      ''
    ),
    initialCaseFolder: getInitialValues(initialParentPath, ''),
    // // ** TODO : 경로 정보 설정 **
    // // 1순위 : 앞에서 입력한 값, 2순위: caseStore(ART 정보), 3순위: triageCaseStore(Triage 정보), 그외: ''
    // 피압수자 정보
    initialConfiscatedName: getInitialValues(triageCaseDetail.value?.confiscatedName, ''),
    initialConfiscatedRank: getInitialValues(triageCaseDetail.value?.confiscatedRank, ''),
    initialConfiscatedType: getInitialValues(triageCaseDetail.value?.confiscatedType, '소유자')
  }
}

const initialAnalystOffice = ref<string | null>('')
const initialAnalystDept = ref<string | null>('')
const initialAnalystName = ref<string | null>('')
const initialAnalystRank = ref<string | null>('')
const initialCaseName = ref<string | null>('')
const initialImgNum = ref<string | null>('')
const initialConfiscatedPlace = ref<string | null>('')
const initialSystemDate = ref<string | null>('')
const initialRealDatetime = ref<string | null>('')
const initialCaseFolder = ref<string | null>('')
const initialConfiscatedName = ref<string | null>('')
const initialConfiscatedRank = ref<string | null>('')
const initialConfiscatedType = ref<string | null>('')

// watchEffect를 사용하여 각 ref 변수에 초기값 할당
watchEffect(() => {
  saveInitialValues()

  initialAnalystOffice.value = savedValues.initialAnalystOffice
  initialAnalystDept.value = savedValues.initialAnalystDept
  initialAnalystName.value = savedValues.initialAnalystName
  initialAnalystRank.value = savedValues.initialAnalystRank
  initialCaseName.value = savedValues.initialCaseName
  initialImgNum.value = savedValues.initialImgNum
  initialConfiscatedPlace.value = savedValues.initialConfiscatedPlace
  initialSystemDate.value = savedValues.initialSystemDate
  initialRealDatetime.value = savedValues.initialRealDatetime
  initialCaseFolder.value = savedValues.initialCaseFolder
  initialConfiscatedName.value = savedValues.initialConfiscatedName
  initialConfiscatedRank.value = savedValues.initialConfiscatedRank
  initialConfiscatedType.value = savedValues.initialConfiscatedType
})

// 닫기 버튼시 초기화 함수 정의
const resetValues = () => {
  // 각 ref 변수를 초기값(null 또는 빈 문자열)으로 설정
  initialAnalystOffice.value = null
  initialAnalystDept.value = null
  initialAnalystName.value = null
  initialAnalystRank.value = null
  initialCaseName.value = null
  initialImgNum.value = null
  initialConfiscatedPlace.value = null
  initialSystemDate.value = null
  initialRealDatetime.value = null
  initialCaseFolder.value = null
  initialConfiscatedName.value = null
  initialConfiscatedRank.value = null
  initialConfiscatedType.value = null

  // 기타 리셋이 필요한 변수들에 대한 코드 추가

  // 선택된 북마크 초기화
  selectedBookmarks.value = []

  // 전체 선택 해제
  checkAll.value = false
}
// 닫기 버튼 클릭 시 resetValues 함수 호출
const handleCloseButtonClick = async () => {
  // 모든 값을 리셋
  await resetValues()
  await saveInitialValues()

  initialAnalystOffice.value = savedValues.initialAnalystOffice
  initialAnalystDept.value = savedValues.initialAnalystDept
  initialAnalystName.value = savedValues.initialAnalystName
  initialAnalystRank.value = savedValues.initialAnalystRank
  initialCaseName.value = savedValues.initialCaseName
  initialImgNum.value = savedValues.initialImgNum
  initialConfiscatedPlace.value = savedValues.initialConfiscatedPlace
  initialSystemDate.value = savedValues.initialSystemDate
  initialRealDatetime.value = savedValues.initialRealDatetime
  initialCaseFolder.value = savedValues.initialCaseFolder
  initialConfiscatedName.value = savedValues.initialConfiscatedName
  initialConfiscatedRank.value = savedValues.initialConfiscatedRank
  initialConfiscatedType.value = savedValues.initialConfiscatedType
  // 다이얼로그 닫기
  isShow.value = false
}

// * 압수자 정보 *
// analyst_info
// 압수자 소속기관
const analystAgency: Ref<string | null> = ref(initialAnalystOffice)
const analystAgencyRef: Ref<QInput | null> = ref(null)
// 압수자 소속부서
const analystDepartment: Ref<string | null> = ref(initialAnalystDept)
const analystDepartmentRef: Ref<QInput | null> = ref(null)
// 압수자 이름
const analystName: Ref<string | null> = ref(initialAnalystName)
const analystNameRef: Ref<QInput | null> = ref(null)
// 입수자 직급
const analystRank: Ref<string | null> = ref(initialAnalystRank)
const analystRankRef: Ref<QInput | null> = ref(null)

// * 압수 정보 *
// case_info
// 사건번호
const caseName: Ref<string | null> = ref(initialCaseName)
const caseNameRef: Ref<QInput | null> = ref(null)
//  증거번호
const imgNum: Ref<string | null> = ref(initialImgNum)
const imgNumRef: Ref<QInput | null> = ref(null)
// 이미지 파일명
const imgFileName: ComputedRef<string> = computed(() => caseName.value + '_' + confiscatedName.value)
// 장소
const confiscatedPlace: Ref<string | null> = ref(initialConfiscatedPlace)
// 획득 일시(realTime)
const acqDate: Ref<string | null> = ref(initialRealDatetime)
const acqDateRef: Ref<QInput | null> = ref(null)
// 분석 일시(KstTime)
const kstTime: Ref<string | null> = ref(moment(new Date()).format('YYYY-MM-DD HH:mm:ss'))
// 분석 일시(realTime)
const analysisDate: Ref<string | null> = ref(kstTime)
const analysisDateRef: Ref<QInput | null> = ref(null)
// 분석 장소
const analysisLocation: Ref<string | null> = ref('')
const analysisLocationRef: Ref<string | null> = ref('')
// 저장경로
const casePath: Ref<string | null> = ref(initialCaseFolder)
// 루트 경로 처리
const evidenceCaseFolder: ComputedRef<string> = computed(() => {
  if (casePath.value) {
    // 루트 경로인 경우
    if (casePath.value.endsWith('\\')) {
      return casePath.value + 'Evidence\\'
    } else {
      return casePath.value + '\\Evidence\\'
    }
  } else {
    return ''
  }
})
// 피압수자명
const confiscatedName: Ref<string | null> = ref(initialConfiscatedName)
const confiscatedNameRef: Ref<QInput | null> = ref(null)
// 피압수자 직급
const confiscatedRank: Ref<string | null> = ref(initialConfiscatedRank)
const confiscatedRankRef: Ref<QInput | null> = ref(null)
// 피압수자 소속
const confiscatedDepartment: Ref<string | null> = ref('')
const confiscatedDepartmentRef: Ref<string | null> = ref('')
// 피압수자 연락처
const confiscatedNumber: Ref<string | null> = ref('')
// 소유유형
// const confiscatedType: Ref<string> = ref(initialConfiscatedType)
const onChangeAcqDate = (date: Date) => {
  acqDate.value = moment(date).format('YYYY-MM-DD HH:mm:ss')
}
const onChangeAnalysisDate = (date: Date) => {
  analysisDate.value = moment(date).format('YYYY-MM-DD HH:mm:ss')
}
/*
 *
 * 북마크 조회 api
 *
 */
const getBookMarkResult = async (): Promise<void> => {
  try {
    const bookmarkData = await bookmarkApi.getBookmarkGroupList()
    bookmarkoptions.value = bookmarkData
  } catch (error) {
    console.error('북마크 조회시 오류 발생:', error)
  }
}
/** 데이터값 읽어오기  */
// 1. 저장된 북마크 정보 조회
watch(isShow, (newIsShow) => {
  if (newIsShow) {
    // 다이얼로그가 보여질 때의 동작
    getBookMarkResult()
    selectedBookmarks.value = []
  }
})

// 북마크 선택되었을 처리
const handleBookmarkSelection = (selectedBookmarkId: string) => {
  // 선택된 북마크의 B_Id 값을 selectedBookmarks 배열에 추가
  selectedBookmarks.value.push(selectedBookmarkId)

  // 콘솔에 선택된 북마크 확인을 출력
  console.log('Selected Bookmarks:', selectedBookmarks.value)
}

/**
 *
 * 선별이미지 케이스 생성을 위한 정보값 반환
 *
 * @param evidenceInfoParam: EvidenceCaseInfo
 */
async function getEvidenceCaseObj(currentEvidenceCasePath: string): Promise<EvidenceCaseInfo> {
  const evidenceObj: EvidenceCaseInfo = {
    id: new Date().getTime().toString(),
    type: 'EvidenceSelect',
    evidenceImgfileName: imgFileName.value ? _.trim(imgFileName.value) : '',
    evidenceImgType: imageType.value,
    evidenceCaseFolder: currentEvidenceCasePath,
    acquisitionDate: acqDate.value ? _.trim(acqDate.value) : '',
    acquisitionLocation: confiscatedPlace.value ? _.trim(confiscatedPlace.value) : '',
    analystAgency: analystAgency.value ? _.trim(analystAgency.value) : '',
    analystDepartment: analystDepartment.value ? _.trim(analystDepartment.value) : '',
    analystName: analystName.value ? _.trim(analystName.value) : '',
    analystRank: analystRank.value ? _.trim(analystRank.value) : '',
    confiscatedName: confiscatedName.value ? _.trim(confiscatedName.value) : '',
    confiscatedAgency: confiscatedDepartment.value ? _.trim(confiscatedDepartment.value) : '',
    confiscatedRank: confiscatedRank.value ? _.trim(confiscatedRank.value) : '',
    confiscatedNumber: confiscatedNumber.value ? _.trim(confiscatedNumber.value) : '',
    analysisDate: analysisDate.value ? _.trim(analysisDate.value) : '',
    analysisLocation: analysisLocation.value ? _.trim(analysisLocation.value) : ''
  }
  return evidenceObj
}
/**
 *
 * 선별이미지 db생성을 위한 정보값 반환
 *
 * @param analysisSelectReportParam: AnalysisSelectReportSummary
 *
 */
async function getAnalysisSelectReportObj(): Promise<AnalysisSelectReportSummary> {
  // 분석 정보(아트 케이스) + 획득 정보(트리아제 케이스+트리아제 해시값) + 선별 정보
  const reportObj: AnalysisSelectReportSummary = {
    // *** 아트 케이스 정보
    // 사건 정보
    caseNumber: caseName.value ? _.trim(caseName.value) : '',
    imageNumber: imgNum.value ? _.trim(imgNum.value) : '',
    // 분석자 정보
    divisionOfficeName: analystAgency.value ? _.trim(analystAgency.value) : '',
    departmentName: analystDepartment.value ? _.trim(analystDepartment.value) : '',
    analysisName: analystName.value ? _.trim(analystName.value) : '',
    analysisPosition: analystRank.value ? _.trim(analystRank.value) : '',
    // 분석 정보
    analysisLocation: analysisLocation.value ? _.trim(analysisLocation.value) : '',
    analysisDate: analysisDate.value ? _.trim(analysisDate.value) : '',
    analysisTimezone: overviewSystem.value?.TimeZoneKeyName || '',
    // *** 획득 이미지 정보(트리아제) -- img일 경우, dir일 경우
    acquisitionFileName: triageCaseHashFile.value?.fileName || '',
    acquisitionFileSize: triageCaseHashFile.value?.fileSize || '',
    acquisitionHashValue: `MD5: ${triageCaseHashFile.value?.hash.md5 || ''}, SHA1: ${
      triageCaseHashFile.value?.hash.sha1 || ''
    }`,
    acquisitionHashType: 'MD5, SHA1' || '',
    acquisitionToolName: `WinTriage(${triageCaseHashFile.value?.version})`,
    // ** 선별 이미지 정보(아트)
    selectedFileName: 'evidence_' + imgFileName.value + '.' + imageType.value,
    selectedFileSize: '',
    selectedHashValue: '',
    selectedHashType: '',
    selectedToolName: `WinART(${appVersion.value})`
  }
  return reportObj
}

/**
 * 이미지 폴더 선택 버튼 클릭 시 경로 처리
 *
 */
async function evidenceFolderClick(): Promise<void> {
  $q.loading.show()
  // 폴더 선택 다이얼로그
  const dialogVal = await electronApi().openFolderDialog(initialCaseFolder.value)
  if (dialogVal.canceled) {
    $q.loading.hide()
    return
  }
  // 케이스 저장폴더
  casePath.value = dialogVal.filePaths.length ? dialogVal.filePaths[0] : ''
  $q.loading.hide()
}

/**
 *
 * db생성을 위한 params
 *
 * @param dbCopyParam: DB_COPY_CMD
 *
 */
async function getDbCopyObj(currentEvidenceCasePath: string): Promise<DB_COPY_CMD> {
  const reportObj: AnalysisSelectReportSummary = await getAnalysisSelectReportObj()
  // KapeDB에서 통합테이블 조회시 입력 파라메타 구조
  const dbObj: DB_COPY_CMD = {
    // 아트 케이스 정보
    dBPathFullFileName: dbPath.value,
    copyDBPathFullFileName: currentEvidenceCasePath + '\\Export\\evidence_' + imgFileName.value + '.db',
    selectIds: selectedBookmarks.value,
    selectCaseFullXlsxFileName: currentEvidenceCasePath + '\\Report\\evidence_' + imgFileName.value + '.xlsx',
    reportItems: reportObj
  }
  return dbObj
}
/**
 *
 * 증거이미지 생성을 위한 params
 *
 * @param evidenceImgParam: CreateEvidenceImage
 *
 */
async function getEvidenceImgObj(currentEvidenceCasePath: string): Promise<CreateEvidenceImage> {
  // 증거이미지 생성을 위한 정보
  const evidenceObj: CreateEvidenceImage = {
    // 아트 케이스 정보
    imageType: imageType.value,
    imageFilePath: currentEvidenceCasePath + '\\Image\\evidence_' + imgFileName.value + '.' + imageType.value,
    imageSourcePath: currentEvidenceCasePath + '\\Export'
  }
  caseStore.setEvidenceImagePath(evidenceObj.imageSourcePath)
  return evidenceObj
}

/**
 *
 * 1) 보고서 양식___현장조사확인서 생성을 위한 pararms
 *
 * @param report1Obj: Report1Send
 *
 */
async function getReport1Obj(currentEvidenceCasePath: string): Promise<Report1Send> {
  // 보고서 양식 1___현장조사확인서
  const report1Obj: Report1Send = {
    caseFilePath: currentEvidenceCasePath
      ? _.trim(currentEvidenceCasePath) + '\\Report\\' + 'evidence_' + imgFileName.value + '_현장조사확인서.pdf'
      : '',
    caseName: caseName.value ? _.trim(caseName.value) : '',
    imgNum: imgNum.value ? _.trim(imgNum.value) : '',
    confiscatedPlace: confiscatedPlace.value ? _.trim(confiscatedPlace.value) : '',
    confiscatedType: initialConfiscatedType,
    confiscatedName: confiscatedName.value ? _.trim(confiscatedName.value) : '',
    analystName: analystName.value ? _.trim(analystName.value) : '',
    realDatetime: analysisDate.value ? _.trim(analysisDate.value) : '',
    kSTTime: kstTime.value,
    caseImgName: imgFileName.value ? _.trim(imgFileName.value) : '',
    imageFileCreationDate: '', //이미지파일 생성일시
    imageFileHashMd5: '', // 증거이미지 해시값 md5
    imageFileHashSha1: '', // 증거이미지 해시값 sha1
    listFileHashMd5: '' // csv 해시값
  }
  return report1Obj
}

/**
 *
 * 버튼 클릭시, 이미지 및 보고서 생성 시작
 *
 * 1) DB생성 프로그래스바 다이얼로그 호출
 * 2) DB생성 진행
 * 3) 증거이미지 케이스 파일 생성
 * 4) DB생성 완료시, 보고서 생성 프로그래스바 다이얼로그 호출
 * 5) 보고서 생성 진행
 * 6) 완료
 */
async function startDbGenerateProgress(): Promise<void> {
  // 다이얼로그 생성을 위한 정보값
  // 생성일시 케이스 폴더명
  const timestamp = generateTimestamp()
  // 증거이미지 케이스 생성을 위한 생성일시 폴더 경로
  const currentEvidenceCasePath = evidenceCaseFolder.value + timestamp
  // 케이스 생성 정보
  const evidenceCaseObj: EvidenceCaseInfo = await getEvidenceCaseObj(currentEvidenceCasePath)
  // 케이스 생성 path 정보
  const evidenceCaseFilePath =
    evidenceCaseObj.evidenceCaseFolder + '\\' + 'evidence_' + evidenceCaseObj.evidenceImgfileName + '.cse'
  // ) 증거이미지 생성 프로그래스바 다이얼로그 호출
  const dbObj: DB_COPY_CMD = await getDbCopyObj(currentEvidenceCasePath)
  const evidenceObj: CreateEvidenceImage = await getEvidenceImgObj(currentEvidenceCasePath)
  const report1Obj: Report1Send = await getReport1Obj(currentEvidenceCasePath)
  const selectedDocuments = selectedDocument.value
  const dbGenerationProgressDialog: boolean | undefined = await OpenAnalysisProgressDialog(
    dbObj,
    evidenceCaseObj,
    evidenceCaseFilePath,
    evidenceObj,
    selectedDocuments,
    report1Obj
  )
  if (dbGenerationProgressDialog === true) {
    // isCalHashComplete.value = true
    if (hasEvidenceError.value) {
      // hasEvidenceError가 true면 다이얼로그를 그냥 닫기
      return
    }
    await openAlert('보고서 생성이 완료되었습니다.')
    isShow.value = false
    return
  } else {
    await openAlert('증거이미지 생성중 오류가 발생했습니다.')
  }
}

/** STEP 1. 증거이미지 생성 진행 다이얼로그
 *
 * @param DB_COPY_CMD  선별이미지 DB 생성을 위한 정보
 * @param CreateEvidenceImage 증거이미지 생성을 위한 정보
 * @return 생성된 선별이미지 DB 결과, 증거이미지 생성 결과
 */
async function OpenAnalysisProgressDialog(
  dbObj: DB_COPY_CMD,
  evidenceCaseObj: EvidenceCaseInfo,
  evidenceCaseFilePath: string,
  evidenceObj: CreateEvidenceImage,
  selectedDocuments: string[],
  report1Obj: Report1Send
): Promise<boolean | undefined> {
  // 증거이미지 생성 진행 다이얼로그
  // Step 1) 선별이미지 DB 생성
  // Step 2) 증거이미지 생성
  // Step 3) 해시값 계산
  // Step 4) 보고서 생성
  // Step 5) 보고서 파일 열기
  const evidenceGenerationProgressDialogOpts: QDialogOptions = {
    component: EvidenceGenerationProgressDialog,
    componentProps: { dbObj, evidenceCaseObj, evidenceCaseFilePath, evidenceObj, selectedDocuments, report1Obj }
  }
  return await openDialog<boolean>(evidenceGenerationProgressDialogOpts)
}
</script>

<template>
  <q-dialog v-model="isShow">
    <q-card class="q-dialog-plugin pop-default report-dialog-wrap">
      <!-- 헤더 -->
      <!-- 20231201 백지연 FE UI 변경 반영-->
      <q-card-section class="d-header">
        <h1>보고서 생성</h1>
        <q-space></q-space>
        <q-btn v-close-popup icon="close" flat dense></q-btn>
      </q-card-section>
      <!-- 본문 -->
      <q-card-section class="d-container row justify-between">
        <q-form>
          <div class="tbl-wrap">
            <!-- 북마크 -->
            <h3>북마크</h3>
            <div class="row items-center bookmark-chk-wrap">
              <!-- 북마크 전체 체크 -->
              <q-checkbox v-model="checkAll" class="check-all" dense label="전체"></q-checkbox>
              <!-- 북마크 목록 -->
              <q-option-group
                v-model="selectedBookmarks"
                :options="computedBookmarkOptions"
                dense
                color="primary"
                type="checkbox"
                class="bookmark-chk-group"
              >
                <template #label="opt">
                  <div class="row items-center">
                    <q-icon name="mdi-bookmark" :style="{ color: opt.color }"></q-icon>
                    <span>{{ opt.label }}</span>
                    <span>({{ opt.count }})</span>
                  </div>
                </template>
              </q-option-group>
            </div>
          </div>
          <div class="img-file">
            <h3 class="q-pt-xs q-pb-sm">이미지 파일</h3>
            <table class="tbl-data">
              <colgroup>
                <col width="17.92%" />
                <col />
                <col width="17.92%" />
                <col />
              </colgroup>
              <tbody>
                <tr>
                  <th>
                    이미지 파일명
                    <strong class="text-negative q-ml-sm">*</strong>
                  </th>
                  <td>
                    <q-input v-model="imgFileName" readonly dense outlined class="file-name"></q-input>
                  </td>
                  <th>
                    이미지 타입
                    <strong class="text-negative q-ml-sm">*</strong>
                  </th>
                  <td>
                    <span class="slct_spacing_2 q-pr-sm">
                      <q-radio v-model="imageType" val="deph" label="DEPH" />
                    </span>
                    <span class="slct_spacing">
                      <q-radio v-model="imageType" val="aff4" label="AFF4" />
                    </span>
                  </td>
                </tr>
                <tr>
                  <th>
                    선택 폴더
                    <strong class="text-negative q-ml-sm">*</strong>
                  </th>
                  <td colspan="3">
                    <div class="d-flex-row">
                      <q-input
                        v-model="casePath"
                        class="folder"
                        type="text"
                        maxlength="100"
                        :rules="[requiredRule]"
                        outlined
                        dense
                        readonly
                        clear-icon="mdi-close"
                      ></q-input>
                      <q-btn
                        outline
                        icon="mdi-folder-open-outline"
                        label="폴더 선택"
                        class="btn-folder"
                        color="primary"
                        @click="evidenceFolderClick"
                      ></q-btn>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="report-create">
            <h3>보고서 생성</h3>
            <div class="report-chk-wrap row items-center">
              <strong class="tit">보고서 종류 선택</strong>
              <div class="report_area col_spacing">
                <q-option-group
                  v-model="selectedDocument"
                  inline
                  :options="documentOptions"
                  type="checkbox"
                  class="report-select"
                ></q-option-group>
              </div>
            </div>
            <table class="tbl-data">
              <colgroup>
                <col width="17.92%" />
                <col />
                <col width="17.92%" />
                <col />
              </colgroup>
              <tbody>
                <tr>
                  <th>
                    사건번호
                    <strong class="text-negative q-ml-sm">*</strong>
                  </th>
                  <td>
                    <q-input
                      ref="caseNameRef"
                      v-model="caseName"
                      maxlength="50"
                      :rules="[maxLengthRule, specialCharRule, requiredRule]"
                      dense
                      outlined
                      class="file-name"
                    ></q-input>
                  </td>
                  <th>
                    영장번호
                    <strong class="text-negative q-ml-sm">*</strong>
                  </th>
                  <td>
                    <q-input
                      ref="imgNumRef"
                      v-model="imgNum"
                      maxlength="50"
                      :rules="[maxLengthRule, specialCharRule, requiredRule]"
                      dense
                      outlined
                      class="file-name"
                    ></q-input>
                  </td>
                </tr>
                <tr>
                  <th>
                    획득 일시
                    <strong class="text-negative q-ml-sm">*</strong>
                  </th>
                  <td>
                    <DateCalendar
                      :model-value="acqDate"
                      @update:model-value="onChangeAcqDate"
                      dense
                      outlined
                      class="file-name"
                    ></DateCalendar>
                  </td>
                  <th>
                    획득 장소
                    <strong class="text-negative q-ml-sm">*</strong>
                  </th>
                  <td>
                    <q-input
                      ref="confiscatedPlaceRef"
                      v-model="confiscatedPlace"
                      dense
                      outlined
                      maxlength="50"
                      :rules="[maxLengthRule, specialCharRule, requiredRule]"
                      class="file-name"
                    ></q-input>
                  </td>
                </tr>
                <tr>
                  <th>
                    압수자 소속청
                    <strong class="text-negative q-ml-sm">*</strong>
                  </th>
                  <td>
                    <q-input
                      ref="analystAgencyRef"
                      v-model="analystAgency"
                      maxlength="50"
                      :rules="[maxLengthRule, specialCharRule, requiredRule]"
                      dense
                      outlined
                      class="file-name"
                    ></q-input>
                  </td>
                  <th>
                    압수자 소속
                    <strong class="text-negative q-ml-sm">*</strong>
                  </th>
                  <td>
                    <q-input
                      ref="analystDepartmentRef"
                      v-model="analystDepartment"
                      maxlength="50"
                      :rules="[maxLengthRule, specialCharRule, requiredRule]"
                      dense
                      outlined
                      class="file-name"
                    ></q-input>
                  </td>
                </tr>
                <tr>
                  <th>
                    압수자
                    <strong class="text-negative q-ml-sm">*</strong>
                  </th>
                  <td>
                    <q-input
                      ref="analystNameRef"
                      v-model="analystName"
                      maxlength="50"
                      :rules="[maxLengthRule, specialCharRule, requiredRule]"
                      dense
                      outlined
                      class="file-name"
                    ></q-input>
                  </td>
                  <th>
                    직급
                    <strong class="text-negative q-ml-sm">*</strong>
                  </th>
                  <td>
                    <q-input
                      ref="analystRankRef"
                      v-model="analystRank"
                      maxlength="50"
                      :rules="[maxLengthRule, specialCharRule, requiredRule]"
                      dense
                      outlined
                      class="file-name"
                    ></q-input>
                  </td>
                </tr>
                <tr>
                  <th>
                    피압수자
                    <strong class="text-negative q-ml-sm">*</strong>
                  </th>
                  <td>
                    <q-input
                      ref="confiscatedNameRef"
                      v-model="confiscatedName"
                      :rules="[maxLengthRule, specialCharRule, requiredRule]"
                      maxlength="50"
                      dense
                      outlined
                      class="file-name"
                    ></q-input>
                  </td>
                  <th>
                    피압수자 소속
                    <strong class="text-negative q-ml-sm">*</strong>
                  </th>
                  <td>
                    <q-input
                      ref="confiscatedDepartmentRef"
                      v-model="confiscatedDepartment"
                      :rules="[maxLengthRule, specialCharRule, requiredRule]"
                      maxlength="50"
                      dense
                      outlined
                      class="file-name"
                    ></q-input>
                  </td>
                </tr>
                <tr>
                  <th>
                    피압수자 직급
                    <strong class="text-negative q-ml-sm">*</strong>
                  </th>
                  <td>
                    <q-input
                      ref="confiscatedRankRef"
                      v-model="confiscatedRank"
                      :rules="[maxLengthRule, specialCharRule, requiredRule]"
                      maxlength="50"
                      dense
                      outlined
                      class="file-name"
                    ></q-input>
                  </td>
                  <th>연락처</th>
                  <td>
                    <q-input
                      ref="confiscatedNumberRef"
                      v-model="confiscatedNumber"
                      :rules="[maxLengthRule, specialCharRule]"
                      maxlength="50"
                      dense
                      outlined
                      class="file-name"
                    ></q-input>
                  </td>
                </tr>
                <tr>
                  <th>
                    분석 일시
                    <strong class="text-negative q-ml-sm">*</strong>
                  </th>
                  <td>
                    <DateCalendar
                      :model-value="analysisDate"
                      @update:model-value="onChangeAnalysisDate"
                      dense
                      outlined
                      class="file-name"
                    ></DateCalendar>
                  </td>
                  <th>분석 장소</th>
                  <td>
                    <q-input
                      ref="analysisLocationRef"
                      v-model="analysisLocation"
                      :rules="[maxLengthRule, specialCharRule]"
                      maxlength="50"
                      dense
                      outlined
                      class="file-name"
                    ></q-input>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </q-form>
      </q-card-section>
      <q-card-actions class="d-footer">
        <q-btn outline icon="mdi-close" label="닫기" @click="handleCloseButtonClick" />
        <q-btn
          outline
          color="info"
          label="이미지 및 보고서 생성 시작"
          :disable="selectedBookmarks.length === 0"
          @click="startDbGenerateProgress"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<style scoped lang="scss">
.report-dialog-wrap :deep {
  .d-container {
    padding: 1.25rem !important;

    // 체크박스 사이즈
    .q-checkbox {
      margin-right: 0rem;
      font-size: 1rem;
      .q-checkbox__inner {
        width: 1.125rem;
        height: 1.125rem;
        min-width: 1.125rem;
      }
    }
    .report-select {
      // 체크박스 사이즈
      .q-checkbox {
        margin-right: 0.625rem;
        .q-checkbox__bg {
          width: 100%;
          height: 100%;
          top: 0px;
          left: 0px;
        }
      }
    }
    // 북마크
    .bookmark-chk-wrap {
      padding: 1.25rem 0.75rem 2.5rem;
      .bookmark-chk-group {
        padding-left: 0px;
        margin-left: 0px;
        > div {
          margin-left: 1.5rem;
        }

        .q-icon {
          width: 1.25rem;
          height: 1.25rem;
          font-size: 1.125rem;
          padding-right: 0.25rem;
        }
      }
    }

    // 보고서 생성
    .report-create {
      .report-chk-wrap {
        padding: 1.25rem 0 1.875rem;
        .tit {
          padding-right: 4.5rem;
          font-size: 1rem;
        }
        .first {
          padding-right: 40px;
        }
      }
    }

    // 테이블 공통
    table.tbl-data {
      tbody {
        tr {
          th,
          td {
            font-size: 1rem;
          }
        }
      }
    }

    // 보고서 생성 버튼그룹
    .btn-group {
      padding-top: 1.25rem;
      gap: 0.625rem;
      .q-btn {
        padding: 0.375rem 1.375rem;
      }
    }

    // 이미지 파일
    .img-file {
      .file-name {
        max-width: 25rem;
      }
      .zip {
        max-width: 15.1875rem;
      }
    }
  }
}
</style>
