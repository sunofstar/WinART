<route>{ meta: { layout: "analysis" } }</route>

<script setup lang="ts">
/**********************************************
 * @description Import
 */
import { computed, ComputedRef, onMounted, reactive, Ref, ref, watch, watchEffect } from 'vue'
import { useRouter } from 'vue-router'
import { maxLengthRule, requiredRule, specialCharRule } from '@renderer/utils/validationRules'
import type {
  CaseInfo,
  AcquisitionImageExport,
  TriageCaseInfo,
  DB_CASEINFO_OPR,
  AcquisitionType,
  HashVal
} from '@share/models'
import caseApi from '@renderer/api/caseApi'
import kapeApi from '@renderer/api/kapeApi'
import electronApi from '@renderer/api/electronApi'
import evidenceImageApi from '@renderer/api/evidenceImageApi'
import commonApi from '@renderer/api/commonApi'
import { KAPE_OP_CHANNELS } from '@share/constants'
import { QForm, QInput, QTree, QDialogOptions, useQuasar } from 'quasar'
const caseStore = useCaseStore()
const config = useConfigStore()
const $q = useQuasar()
import dbConn from '@renderer/api/dbConn'
import { useConfigStore } from '@renderer/stores/configStore'
import { setDate, getParentFolder, generateTimestamp } from '@renderer/utils/utils'
import HashCheckDialog from '@renderer/components/analysis/HashCheckDialog.vue'
import AnalysisProgressDialog from '@renderer/components/analysis/AnalysisProgressDialog.vue'
import { openAlert, openConfirm, openDialog, openError } from '@renderer/composables/useDialog'
import * as ini from 'ini'
import _ from 'lodash'
import { useCaseStore } from '@renderer/stores/caseStore'
import { useTriageCaseStore } from '@renderer/stores/triageCaseStore'
import { useUserStore } from '@renderer/stores/userStore'
import { useSystemStore } from '@renderer/stores/systemStore'
import { storeToRefs } from 'pinia'
import moment from 'moment'
const triageCaseStore = useTriageCaseStore()
const userStore = useUserStore()
const systemStore = useSystemStore()
const {
  triageCaseDetail,
  triageCaseHashFileInfo,
  triageCaseHashFile,
  triageCaseFileName,
  triageCasePath,
  triageDirectory,
  triageImageType,
  triageImagePath
} = storeToRefs(triageCaseStore)
const { caseDetail, initialCasePath, hasAnalysisError, startAnalysisFlag } = storeToRefs(caseStore)
const { user, settingInfo } = storeToRefs(userStore)
const { appVersion } = storeToRefs(systemStore)

/**********************************************
 * @description theme 테마 관련
 */

/** 셋팅된 테마 정보 */
const setTheme: Ref<string> = ref(settingInfo.value?.theme || '')

/**
 * 다크모드와 화이트모드 설정
 *
 * @param {string} setTheme - 선택된 테마
 */
async function setDarkMode(setTheme: string): Promise<void> {
  if (setTheme === 'white') {
    $q.dark.set(false)
  } else {
    $q.dark.set(true)
  }
}

/** 셋팅된 테마 정보를 불러와 적용시킵니다 */
onMounted(async () => {
  setDarkMode(setTheme.value)
})

/**********************************************
 * @description Define variables
 */
const router = useRouter()
const isShowCase: Ref<boolean> = ref(false)
const stepIndex: Ref<number> = ref(1)
const isStepTwoValidate: Ref<boolean> = ref(false)

/** 로그인을 통한 default 유저 정보 */
const userName: string = user.value?.name || ''
const userOffice: string = user.value?.office || ''
const userRank: string = user.value?.rank || ''
const userDept: string = user.value?.department || ''

/**** Case step #1 */
/** 새로운 케이스(트리아제 케이스 -> 아트 케이스 생성) */

const caseInfoForm: Ref<QForm | null> = ref(null)
/** settingNewPath, 옵션 설정에서 새로운 경로를 설정했을 때 변합니다 */
const settingNewPath: Ref<string> = ref('')

const caseInfoObject: Ref<CaseInfo> = ref({
  caseName: '',
  caseFolder: '',
  analystAgency: userOffice || '',
  analystDepartment: userDept || '',
  analystName: userName || '',
  analystRank: userRank || ''
})

/** 케이스가 저장되는 폴더 경로, 옵션 설정에서 경로를 변경할 때 처리되는 로직 */
const caseFolder: ComputedRef<string> = computed(() => {
  const defaultPath = settingInfo.value?.defaultPath || '' // settingInfo에 설정된 기본 경로
  const caseName = caseInfoObject.value.caseName || '' // 케이스명
  const newPath = settingNewPath.value || defaultPath // 새롭게 설정한 settingNewPath를 우선 사용
  const newCaseFolder = `${newPath}\\${caseName}`
  // eslint-disable-next-line vue/no-side-effects-in-computed-properties
  caseInfoObject.value.caseFolder = newCaseFolder
  return newCaseFolder
})
/** 화면에 뿌려주는 caseFolder 정보 */
const caseFolderRef: Ref<QInput | null> = ref(null)

/** 케이스 내용이 변경되었을 때, caseDetail에 적힐 newValue를 watch로 관리 */
watch(
  () => caseInfoObject,
  (newValue: CaseInfo<object>) => {
    caseStore.setCaseDetail(newValue.value)
    // console.log('...flush data to caseStore : ', caseStore.caseDetail)
    // console.log('...start checking validate values')
    let isValidate = true
    for (const input in newValue.value) {
      if (input !== 'analystRank' && (newValue.value[input]?.length === 0 || newValue.value[input] === null)) {
        isValidate = false
      }
    }
    isStepTwoValidate.value = isValidate
    console.log(`...validate result is ${isStepTwoValidate.value}`)
  },
  { deep: true }
)

/** 불러온 케이스 원천 정보 */
const sourceDataPath: Ref<string | null> = ref('')
const sourceImgPath: Ref<string | null> = ref('')
const sourceFileExt: Ref<string | undefined> = ref()
const sourceDataRootPath: Ref<string | null> = ref('')

/**********************************************
 * @description Define methods
 *
 * [새로운 분석]
 * 트리아제 -> 윈아트 케이스 폴더 경로 선택 다이얼로그
 */
async function caseFolderClick(): Promise<void> {
  try {
    $q.loading.show()
    const dialogVal = await electronApi().openFolderDialog()
    if (dialogVal.canceled) {
      $q.loading.hide()
      return
    }
    // 케이스 저장폴더
    const filePath = dialogVal.filePaths.length ? dialogVal.filePaths[0] : ''
    // settingNewPath에 filePath 저장
    settingNewPath.value = filePath
    // 케이스 이름으로 경로 생성
    caseInfoObject.value.caseFolder = `${filePath}${
      caseInfoObject.value.caseName !== '' ? '\\' + caseInfoObject.value.caseName : ''
    }`
  } catch (error) {
    console.log('케이스 폴더 선택시 오류 발생')
  }
  $q.loading.hide()
}

/**
 *
 * [새로운 분석]
 * 트리아제 케이스 이미지 파일 확인 함수
 * aff4인지 deph인지 형식 압축 형식 확인하여 스토어 해당 {이미지 형식, 경로} 저장
 * 소스 원파일 루트 저장
 */
async function isImageFile(path: string) {
  const dephPath = path + '.deph'
  const aff4Path = path + '.aff4'
  triageCaseStore.setTriageImageType(undefined)
  if (await commonApi.isFile(dephPath)) {
    triageCaseStore.setTriageImageType('deph')
    triageCaseStore.setTriageImagePath(dephPath)
    sourceImgPath.value = dephPath
    return true
  }
  if (await commonApi.isFile(aff4Path)) {
    triageCaseStore.setTriageImageType('aff4')
    triageCaseStore.setTriageImagePath(aff4Path)
    sourceImgPath.value = aff4Path
    return true
  }
  return false
}

const disableNextButton = ref(false)

/**
 *
 * [새로운 분석]
 * 선택한 증거이미지 불러오기 버튼 클릭 시 파일 선택 경로 처리
 * 트리아제 케이스 파일(cse) 선택시 처리되는 다이얼로그
 * 정책상 cse 파일로만 동작한다
 */
async function sourceDataPathClick() {
  $q.loading.show()
  const dialogVal = await electronApi().openFileDialog([
    { name: 'cse File', extensions: ['cse'] }
    // { name: 'All Files', extensions: ['*'] }
  ])
  if (dialogVal.canceled || dialogVal.filePaths.length === 0) {
    $q.loading.hide()
    return
  }
  // 원소스 데이터 경로 케이스, 이미지 파일 경로 저장
  sourceDataPath.value = dialogVal.filePaths.length ? dialogVal.filePaths[0] : ''
  // 트리아제 케이스 스토어에 TriageCasePath에 원소스 경로 저장
  triageCaseStore.setTriageCasePath(sourceDataPath.value)
  sourceFileExt.value = sourceDataPath.value.substring(sourceDataPath.value.lastIndexOf('.') + 1).toLowerCase()
  // 원소스 데이터의 루트 케이스 저장
  sourceDataRootPath.value = getParentFolder(sourceDataPath.value)

  const fileNameWithoutExt = sourceDataPath.value.split('.').slice(0, -1).join('.')
  const sourceDataHashPath = sourceDataRootPath.value + '\\Image\\' + getFileName(fileNameWithoutExt)

  // 1. 선택된 트리아제 케이스 처리
  if (sourceDataPath.value) {
    // 2. 사용자가 선택한 파일 경로에서 case정보값 읽어오기
    const caseJson = await readCaseTxt(sourceDataPath.value)
    // triageStore에 해당값 파싱해서 저장
    triageCaseStore.setTriageCaseDetail(JSON.parse(caseJson))
    // 3. 디렉토리 체크 - true/false
    const dir = sourceDataRootPath.value + '\\Export'
    const isDirectoryCheck = await commonApi.isDirectory(dir)
    // 4. 이미지파일 체크 - true/false
    const isImageCheck = isImageFile(sourceDataHashPath)
    // triageCaseStore에서 triageImageType, triageImagePath 저장 + sourceImgPath 저장

    // isDirectoryCheck나 isImageCheck의 값 중 하나라도 false일 경우,
    if (!isDirectoryCheck || !isImageCheck) {
      openError('잘못된 케이스 파일입니다.')
      // 다음 버튼 비활성화
      disableNextButton.value = true
      $q.loading.hide()
      return
    }

    // 디렉토리가 존재할 경우 해당 정보 triageDirectory에 저장
    if (isDirectoryCheck) {
      triageCaseStore.setTriageDirectory(dir)
    }

    const triageCaseInfo = {
      caseName: triageCaseDetail.value?.caseName,
      caseFolder: sourceDataPath.value,
      analystAgency: triageCaseDetail.value?.analystOffice,
      analystDepartment: triageCaseDetail.value?.analystDept,
      analystName: triageCaseDetail.value?.analystName,
      analystRank: triageCaseDetail.value?.analystRank
    }
    caseInfoObject.value = triageCaseInfo

    // 해당 케이스 파일의 부모 경로(날짜)\\Image\\케이스명.txt 파일 읽어오기(hash파일)
    if (sourceDataHashPath) {
      const caseHash = await readCaseTxt(sourceDataHashPath + '.txt')
      const parseIniTxt = ini.parse(caseHash)
      // ini 파일 parsing하여 트리아제 케이스 해시 파일 상세 정보 스토어에 저장
      triageCaseStore.setTriageCaseHashFileInfo(parseIniTxt)
    } else {
      // 해시 경로가 존재하지 않는 경우의 처리
      openError('해시값이 존재하지 않습니다.')
      return
    }
    // 사용자가 선택한 파일 경로에서 root 폴더 부분(생성 일시명 - 날짜 폴더)만 추출
    const rootPath = getParentFolder(sourceDataPath.value)
    sourceDataRootPath.value = rootPath
  }
  disableNextButton.value = false
  $q.loading.hide()
}

/**
 *
 * 케이스 readFileText를 통해 정보값 가져오기
 *  @pram filePath 파일 경로
 */
async function readCaseTxt(filePath: string) {
  try {
    const caseDatas = await commonApi.readFileText(filePath)
    console.log('읽어온 데이터', caseDatas)
    // 파일 내용이 없는 경우 또는 정상적으로 파일을 읽어오지 못한 경우
    if (!caseDatas) {
      throw new Error('파일 내용이 없거나 파일을 읽어올 수 없습니다.')
    }
    return caseDatas
  } catch (error) {
    console.error('케이스 읽기 실패:', error)
    throw error
  }
}

/**
 *
 * 파일 경로에서 파일명 추출 함수
 * @param filePath 파일 경로
 * @returns 파일명
 */
function getFileNameFromPath(filePath: string): string {
  const lastSeparatorIndex = filePath.lastIndexOf('/')
  return lastSeparatorIndex !== -1 ? filePath.substring(lastSeparatorIndex + 1) : filePath
}

/**
 *
 * 파일 경로에서 파일명 추출 함수
 * @param filePath 파일 경로
 * @returns 파일명
 */
function getFileName(filePath: string) {
  const parts = filePath.split('\\')
  return parts[parts.length - 1]
}

/**********************************************
 * 해시값 관련
 *
 *
 */
/** 확인버튼 표시 여부 */
const isShowOkBtn = computed(() => sourceDataPath.value && triageCaseHashFileInfo.value)
/** 해시값 검증 진행 완료 여부 */
const isCalHashComplete = ref(false)
/** 검증한 해시값 및 결과 */
const validationData = reactive({
  validHashVal: {
    md5: '',
    sha1: ''
  },
  validResultVal: ''
})
/** 검증 해시 결과(DB 저장) */
const caseHashCheckDetail = reactive({
  isCompletedHashCheck: computed(() => isCalHashComplete.value),
  hashCheckStatus: computed(() => validationData.validResultVal)
})

/**
 *
 * 해시값 검증 진행 함수
 */
async function imageHashCalClick(): Promise<void> {
  try {
    const hashfilePath =
      getParentFolder(sourceDataPath.value) + '\\' + 'Image' + '\\' + triageCaseHashFile.value?.fileName
    const hashDialogResult: boolean | undefined = await checkHashVal(hashfilePath)
    if (hashDialogResult && validationData && validationData.validResultVal === 'match') {
      isCalHashComplete.value = true
      return
    }
    if (!hashDialogResult) {
      isCalHashComplete.value = true
      return
    }
    await openAlert(hashDialogResult || '해시값 계산중 오류가 발생했습니다.')
  } catch (err) {
    await openAlert('오류가 발생했습니다.')
  }
}
/**
 *
 * 해시값 계산 dialog Open
 * @param filePath read를 위한 파일 경로값
 * @returns 해시값 검증 결과
 */
async function checkHashVal(filePath: string): Promise<boolean | undefined> {
  // 해시값 검증 진행 다이얼로그
  const hashCheckDialogOpts: QDialogOptions = {
    component: HashCheckDialog,
    componentProps: {
      filePath
    }
  }
  // openDialog 함수의 반환값을 저장
  const dialogResult = await openDialog<{
    verification: boolean
    validHash: HashVal
    validResult: string | undefined
  }>(hashCheckDialogOpts)
  console.log('해쉬 검증 다이얼로그에서 얻은 값:', dialogResult)
  if (dialogResult) {
    validationData.validHashVal.md5 = dialogResult.validHash.md5
    validationData.validHashVal.sha1 = dialogResult.validHash.sha1
    validationData.validResultVal = dialogResult.validResult
  }
  return dialogResult.verification
}

// 해시값 문자열 처리
const getHashValue = (isSHA1 = false) => {
  if (sourceDataPath.value) {
    const hashValue = isSHA1 ? triageCaseHashFile.value?.hash.sha1 : triageCaseHashFile.value?.hash.md5
    return hashValue || '해시값이 존재하지 않습니다'
  } else {
    return ''
  }
}

const onClickToggleShowCase = (): void => {
  isShowCase.value = !isShowCase.value
}

/**********************************************
 * 분석 진행
 *
 *
 **/

/*
 * [새로운 분석]
 * 케이스 정보 입력 -> 다음 버튼 클릭시, 분석 진행
 *
 * 1) 윈아트 케이스 파일 생성
 * 2) acquisitionType 호출 => AcquisitionType{ isFolder: boolean, isImage: 'dpeh' | 'aff4' | 'none' }
 * 3) isFolder가 true이고 isImage가 none이 아닐 경우, 다이얼로그를 통해 질의 => 분석
 * 4) isFolder가 false이고 isImage가 none이 아닐 경우, 분석 다이얼로그
 * 5) DB에 케이스 정보 저장
 */
async function startAnalysisProgress(): Promise<void> {
  try {
    // 윈아트 케이스 생성을 위한 정보값
    // casePath : 기본디렉토리/케이스명
    const casePath = `${caseFolder.value}\\WinART`
    // rootDatePath 불러온 트리아제 케이스 경로 : 기본디렉토리/케이스명/Triage/생성일시/cse파일 원본
    const rootTriageCasePath = sourceDataPath.value
    // 생성일시 케이스 폴더명
    const timestamp = generateTimestamp()
    // 윈아트 케이스 생성 정보
    const caseObj: CaseInfo = await getCaseObj()
    // 윈아트 케이스 생성 폴더 경로
    const artCaseFolderPath = `${casePath}\\${timestamp}`
    const triageDirectoryFilePath = `${getParentFolder(rootTriageCasePath)}\\Export\\kape`
    const triageImgFilePath = `${getParentFolder(rootTriageCasePath)}\\Image\\${triageCaseHashFile.value?.fileName}`
    const artCaseFilePath = `${artCaseFolderPath}\\art_${caseInfoObject.value?.caseName}.cse`
    const jsonArtCase = JSON.stringify(caseObj)
    // art 케이스 파일 생성(text)
    await commonApi.writeFileText(artCaseFilePath, jsonArtCase)

    // 다이얼로그 생성 전, casePath 확인
    if (!casePath) {
      console.error('casePath가 정의되지 않았습니다.')
      return
    }
    if (triageDirectory.value || triageImagePath.value) {
      // 폴더가 있는 경우, 질의 => 분석 / 폴더가 없이 이미지만 있는 경우, 분석
      const analysisProgressDialog = await OpenAnalysisProgressDialog(
        artCaseFolderPath,
        triageDirectoryFilePath,
        triageImgFilePath
      )
      if (analysisProgressDialog === true) {
        if (hasAnalysisError.value) {
          // hasAnalysisError가 true면 다이얼로그를 그냥 닫기
          console.log('증거이미지 생성 중 오류 발생')
          await openAlert('증거이미지 생성 중 오류가 발생했습니다.')
          return
        }
        caseStore.setStartAnalysisFlag(false)
        $q.loading.show()

        // 1. 선택한 파일이 위치한 경로 WinART\\일시\\Temp\\DB\\art_케이스이름.db 로드
        const loadResult = await dbConn.initDB(`${artCaseFolderPath}\\Temp\\DB\\art_${caseDetail.value?.caseName}.db`)
        if (loadResult) {
          // 2. DB 로드 후 카테고리 count 정보 가져오기
          const categoryCount = await dbConn.readCategoryCount()
          await config.setCounts(categoryCount)
          // 3. 불러온 DB Path store 저장
          caseStore.setDbSetPath(`${artCaseFolderPath}\\Temp\\DB\\art_${caseDetail.value?.caseName}.db`)
          // 4. DB에 caseInfo 정보 기입 (** 해당 api는 setDb 이후에 이루어져야 한다)
          await performAddCaseInfoTable(
            triageCaseDetail.value || {},
            triageCaseHashFileInfo.value || {},
            caseDetail.value || {},
            caseHashCheckDetail || {}
          )
          // 5. 불러온 Case Path의 root Path store에 저장
          caseStore.setInitialCasePath(artCaseFolderPath)
          // 6. 분석화면 진입점 생성
          caseStore.setFirstRenderForAnalysisDialog(true)
          caseStore.setHomeIndicatorFlag(false)
          // 7. 분석 개요 화면 이동
          $q.loading.hide()
          router.push('/result')
        } else {
          await openAlert('DB 로드 중 오류가 발생했습니다.')
          $q.loading.hide()
        }
        return
      } else {
        await openAlert('분석 진행 다이얼로그 열기 실패')
        $q.loading.hide()
      }
    } else {
      await openAlert('분석 증거이미지 조회 실패')
      $q.loading.hide()
    }
  } catch (error) {
    openError(`분석 불러오기 실패 : ${error}`)
    $q.loading.hide()
  }
}

/**
 * [새로운 분석]
 * 분석 진행 다이얼로그
 *
 * @param acquisitionImageExport 분석 진행을 위한 정보
 * @return 분석 진행 결과
 */
async function OpenAnalysisProgressDialog(
  artCaseFolderPath: string,
  triageDirectoryFilePath: string,
  triageImgFilePath: string
): Promise<boolean | undefined> {
  // 분석 진행 다이얼로그
  const analysisProgressDialogOpts: QDialogOptions = {
    component: AnalysisProgressDialog,
    componentProps: {
      artCaseFolderPath, // art 케이스 생성일시 폴더 경로
      triageDirectoryFilePath, // 트리아제 디렉토리 경로
      triageImgFilePath // 트리아제 이미지파일 경로
    }
  }
  return await openDialog<boolean>(analysisProgressDialogOpts)
}

/**********************************************
 * 분석 불러오기
 *
 *
 **/

/**
 * [분석 불러오기]
 * @description 분석 불러오기 버튼 클릭
 * 정책상 cse 파일로만 동작한다
 */
async function onClickImportAnalysis(): Promise<void> {
  // 파일 선택 다이얼로그 오픈
  $q.loading.show()
  const loadedAnalysisDataPath: Ref<string | null> = ref('')
  const loadedAnalysisDataFileExt: Ref<string | undefined> = ref('')
  const loadedAnalysisRootPath: Ref<string | undefined> = ref('')
  const loadedAnalysisArtDBPath: Ref<string | null> = ref('')
  const loadedAnalysisEvidenceDBPath: Ref<string | null> = ref('')
  const loadedAnalysisFileName: Ref<string | null> = ref('')

  const dialogVal = await electronApi().openFileDialog([
    { name: 'cse File', extensions: ['cse'] }
    // { name: 'db File', extensions: ['db'] }
  ])
  if (dialogVal.canceled) {
    $q.loading.hide()
    return
  }
  loadedAnalysisDataPath.value = dialogVal.filePaths.length ? dialogVal.filePaths[0] : ''
  loadedAnalysisDataFileExt.value = loadedAnalysisDataPath.value
    .substring(loadedAnalysisDataPath.value.lastIndexOf('.') + 1)
    .toLowerCase()
  // 불러온 케이스의 root 경로(생성일시 날짜 폴더)
  loadedAnalysisRootPath.value = getParentFolder(loadedAnalysisDataPath.value)
  // Art DB 경로
  loadedAnalysisArtDBPath.value = loadedAnalysisRootPath.value + '\\' + 'Temp' + '\\' + 'DB'
  // Evidence DB 경로
  loadedAnalysisEvidenceDBPath.value = loadedAnalysisRootPath.value + '\\' + 'Export' + '\\' + 'DB'
  console.log(`분석 불러오는 경로 분기 : ${loadedAnalysisRootPath.value}`)
  loadedAnalysisFileName.value = getFileNameFromPath(loadedAnalysisDataPath.value)
  // 불러온 경로 caseStore에 저장
  caseStore.setInitialCasePath(loadedAnalysisDataPath.value)
  try {
    $q.loading.show()

    // [케이스를 통한 분석 불러오기]
    // 분기 처리__ 1) 확장자 cse일 때 동작
    if (loadedAnalysisDataFileExt.value === 'cse') {
      // 사용자가 선택한 파일 경로에서 case정보값 읽어오기
      const caseJson = await readCaseTxt(loadedAnalysisDataPath.value)
      const parsedCaseJson = JSON.parse(caseJson)

      // *** 케이스에 따른 분기 처리__  triage 케이스일 경우,
      if (parsedCaseJson.type === 'WinTriage') {
        openError('잘못된 케이스 파일입니다.')
        $q.loading.hide()
        return
      }

      // *** 케이스에 따른 분기 처리__  art 케이스일 경우,
      if (parsedCaseJson.type === 'WinART') {
        // 1. 케이스 스토어에 해당값 저장
        caseStore.setCaseDetail(parsedCaseJson)
        // 2. 선택한 케이스 파일이 위치한 경로 art/DB/kapedb.db 로드
        const loadResult = await dbConn.initDB(
          loadedAnalysisArtDBPath.value + '\\' + 'art_' + caseDetail.value?.caseName + '.db'
        )
        if (loadResult) {
          // 3. db 로드 후 카테고리 count 정보 가져오기
          const categoryCount = await dbConn.readCategoryCount()
          await config.setCounts(categoryCount)
          // 4. 불러온 DB Path store 저장
          caseStore.setDbSetPath(loadedAnalysisArtDBPath.value + '\\' + 'art_' + caseDetail.value?.caseName + '.db')
          caseStore.setFirstRenderForAnalysisDialog(true)
          caseStore.setHomeIndicatorFlag(false)
          // 5. 불러온 DB에서 트리아제 케이스 info 가져와서 스토어에 저장
          await getCaseInfoTable()
          // $q.loading.hide()
          // 6. 분석화면 진입점 생성
          router.push('/result')
        } else {
          openError(`분석 불러오기 실패 : ${loadResult}`, null)
          // $q.loading.hide()
        }
      }
      // *** 케이스에 따른 분기 처리__ evidence 케이스일 경우,
      else if (parsedCaseJson.type === 'EvidenceSelect') {
        // 1. evidence 파일 내용 케이스 스토어에 저장
        caseStore.setCaseDetail(parsedCaseJson)
        // 2. TODO : triage 케이스 내용 DB에서 호출해서 가져올 것
        // 3. 선택한 파일이 위치한 경로 DB/kapedb.db 로드
        const loadResult = await dbConn.initDB(
          loadedAnalysisRootPath.value + '\\Export\\evidence_' + caseDetail.value?.evidenceImgfileName + '.db'
        )
        if (loadResult) {
          // 4. db 로드 후 카테고리 count 정보 가져오기
          const categoryCount = await dbConn.readCategoryCount()
          await config.setCounts(categoryCount)
          // 5. 불러온 DB Path store 저장
          caseStore.setDbSetPath(
            loadedAnalysisRootPath.value + '\\Export\\evidence_' + caseDetail.value?.evidenceImgfileName + '.db'
          )
          caseStore.setFirstRenderForAnalysisDialog(true)
          caseStore.setHomeIndicatorFlag(false)
          // 6. 불러온 DB에서 트리아제 케이스 info 가져와서 스토어에 저장
          await getCaseInfoTable()
          // 7. 분석화면 진입점 생성
          router.push('/result')
          // $q.loading.hide()
        } else {
          openError(`분석 불러오기 실패 : ${loadResult}`, null)
        }
        // $q.loading.hide()
      }
    }
    // 분기 처리__ 2) 확장자 db일 때 동작
    else if (loadedAnalysisDataFileExt.value === 'db') {
      console.log('확장자가 db인 경우 로직')
      // 1. 선택 한 파일이 위치한 경로 art/DB/kapedb.db 로드
      const loadResult = await dbConn.initDB(loadedAnalysisDataPath.value)
      if (loadResult) {
        // 2. db 로드 후 카테고리 count 정보 가져오기
        const categoryCount = await dbConn.readCategoryCount()
        await config.setCounts(categoryCount)
        // 3. DB에 저장된 caseInfo 내용 불러오기
        // 4. 불러온 DB Path Store 저장
        caseStore.setDbSetPath(loadedAnalysisDataPath.value)
        caseStore.setInitialCasePath(loadedAnalysisRootPath.value)
        // 5. 불러온 DB에서 트리아제 케이스 info 가져와서 스토어에 저장
        await getCaseInfoTable()
        // 6. 분석화면 진입점 생성
        caseStore.setFirstRenderForAnalysisDialog(true)
        caseStore.setHomeIndicatorFlag(false)
        // $q.loading.hide()
        router.push('/result')
      } else {
        openError(`분석 불러오기 실패 : ${loadResult}`, null)
        // $q.loading.hide()
      }
    } else {
      // 분기 처리__ 3) 그 외의 확장자 처리
      openError('지원하지 않는 파일 형식입니다.', null)
    }
    $q.loading.hide()
  } catch (error) {
    openError(`분석 불러오기 실패 : ${error}`, null)
    $q.loading.hide()
  }
}

/**
 * 아트 케이스 생성 정보 반환
 *
 * @returns 케이스생성정보
 */

async function getCaseObj(): Promise<CaseInfo> {
  // 압수자 정보 + 케이스 정보 생성용 세팅
  const trimValue = (value: string) => (value ? _.trim(value) : '')
  const currentDate = new Date()
  const timestamp = generateTimestamp()
  const caseFolderValue = caseFolder.value ? `${_.trim(caseFolder.value)}\\WinART\\${timestamp}` : ''

  const obj: CaseInfo = {
    id: currentDate.getTime().toString(),
    type: 'WinART',
    version: appVersion.value,
    analystAgency: trimValue(caseInfoObject.value.analystAgency ?? ''),
    analystDepartment: trimValue(caseInfoObject.value.analystDepartment ?? ''),
    analystName: trimValue(caseInfoObject.value.analystName ?? ''),
    analystRank: trimValue(caseInfoObject.value.analystRank ?? ''),
    caseName: trimValue(caseInfoObject.value.caseName ?? ''),
    caseFolder: caseFolderValue,
    caseRegDate: moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
  }
  return obj
}

/**
 * 트리아제 & 윈아트 케이스 정보 테이블 생성 함수
 * @param dataItems {key: type, values: {}}
 */
async function performAddCaseInfoTable(
  triage_values: {},
  triageHash_values: {},
  art_values: {},
  hashCheck_values: {}
): Promise<void> {
  const triageInfos = Object.assign({}, triage_values, triageHash_values)
  const artInfos = Object.assign({}, art_values, hashCheck_values)
  const dataItems = [
    { _key: 'triage', _value: JSON.stringify(triageInfos) },
    { _key: 'art', _value: JSON.stringify(artInfos) }
  ]
  console.log('케이스 테이블 확인**************', dataItems)
  await kapeApi.writeCaseInfo({ op: 'ADD', data: dataItems })
}

/**
 * DB에서 트리아제 & 윈아트 케이스 정보 가져오는 함수
 *
 */
async function getCaseInfoTable(): Promise<void> {
  const caseInfoDatas = await kapeApi.writeCaseInfo({ op: 'REF', data: [] })
  console.log('케이스 테이블 확인**************', caseInfoDatas.data)
  const triageData = caseInfoDatas.data.find((item) => item.key === 'triage')
  // 'triage' 키를 갖는 데이터가 있으면 해당 값의 value를 JSON.parse하여 triage Store에 저장
  if (!triageData) {
    console.error('triage케이스 테이블이 데이터에 존재하지 않습니다.')
    return
  }
  let triageInfo
  try {
    triageInfo = JSON.parse(triageData.value)
  } catch (error) {
    // JSON 파싱 중 오류 발생 시 예외 처리
    console.error('데이터베이스에 저장된 triageData의 값이 유효한 JSON 형식이 아닙니다.')
    return
  }
  // triageDetail에 저장할 내용 추출
  const {
    id,
    type,
    version,
    analystOffice,
    analystDept,
    analystName,
    analystRank,
    caseName,
    imgNum,
    caseFolder,
    confiscatedPlace,
    systemDatetime,
    realDatetime,
    remarks,
    confiscatedName,
    confiscatedRank,
    confiscatedType
  }: TriageCaseInfo = triageInfo
  const triageDetail = {
    id,
    type,
    version,
    analystOffice,
    analystDept,
    analystName,
    analystRank,
    caseName,
    imgNum,
    caseFolder,
    confiscatedPlace,
    systemDatetime,
    realDatetime,
    remarks,
    confiscatedName,
    confiscatedRank,
    confiscatedType
  }

  // triageHash에 저장할 내용 추출
  const { Investigator, Version, FileInfo, ImagingSuccess, CsvInfo } = triageInfo
  const triageHash = { Investigator, Version, FileInfo, ImagingSuccess, CsvInfo }

  triageCaseStore.setTriageCaseDetail(triageDetail)
  triageCaseStore.setTriageCaseHashFileInfo(triageHash)

  console.log('저장된 트리아제 케이스 정보 확인********', triageCaseDetail.value)
  console.log('저장된 트리아제 해시 정보 확인********', triageCaseHashFileInfo.value)
}
</script>

<template>
  <q-layout>
    <q-page-container>
      <!-- 증거이미지 분석 선택 화면 (s) -->
      <q-page v-show="!isShowCase">
        <div class="select-wrap">
          <div class="btn-group">
            <!-- 202311108 버튼 위치 및 text 수정, 백지연-->
            <button class="analysis-evidence" @click="onClickToggleShowCase">
              <em class="title">새로운 분석</em>
            </button>
            <!-- <button class="import-evidence" @click="router.push('/result')"> -->
            <button class="import-evidence" @click="onClickImportAnalysis">
              <em class="title">분석 불러오기</em>
            </button>
          </div>
        </div>
      </q-page>
      <!-- 증거이미지 분석 선택 화면 (e) -->

      <!-- 케이스 생성 화면 (s) -->
      <q-page v-if="isShowCase" class="wrapper">
        <q-stepper
          ref="stepper"
          v-model="stepIndex"
          header-nav
          color="primary"
          animated
          class="case-wrap"
          done-icon="none"
        >
          <q-step :name="1" prefix="1" title="분석 대상 이미지 불러오기" :done="stepIndex > 1">
            <div class="container">
              <div class="main">
                <div class="row import-evidence">
                  <q-btn @click="sourceDataPathClick">
                    <img src="@renderer/assets/images/ico_import_evidence.svg" />
                    <div class="title">
                      케이스 선택
                      <br />
                      (증거이미지 불러오기)
                    </div>
                  </q-btn>
                  <div class="tree-wrap d-tbl-wrap">
                    <!-- 202403035 원본 이미지 해시값 (input 박스 추가, 디자인 디테일 수정 필요)-->
                    <table class="hash-table q-mb-md">
                      <caption>원본 이미지 해시값</caption>
                      <q-input v-model="sourceImgPath" outlined type="text" dense disable></q-input>
                    </table>
                    <!-- 202403035 원본 이미지 해시값 (input 박스 추가, 디자인 디테일 수정 필요)-->
                    <table class="hash-table">
                      <colgroup>
                        <col width="8.51%" />
                        <col width="*" />
                      </colgroup>
                      <tr>
                        <th>MDS</th>
                        <td>{{ getHashValue(false) }}</td>
                      </tr>
                      <tr>
                        <th>SHA1</th>
                        <td>{{ getHashValue(true) }}</td>
                      </tr>
                    </table>
                    <!-- 1121 해시값 검증(HashCalDialog)을 위한 버튼 추가 -->
                    <div class="d-tbl-wrap">
                      <div class="mid_btns_area">
                        <div class="d-flex-row btns_center">
                          <q-btn
                            outline
                            color="info"
                            :disable="!isShowOkBtn"
                            label="해시값 검증"
                            @click="imageHashCalClick"
                          />
                        </div>
                      </div>
                    </div>
                    <table v-show="isCalHashComplete" class="hash-table">
                      <caption>검증 해시값</caption>
                      <colgroup>
                        <col width="8.51%" />
                        <col width="*" />
                      </colgroup>
                      <tr>
                        <th>MDS</th>
                        <td>{{ validationData.validHashVal.md5 }}</td>
                      </tr>
                      <tr>
                        <th>SHA1</th>
                        <td>{{ validationData.validHashVal.sha1 }}</td>
                      </tr>
                    </table>
                    <div v-show="isCalHashComplete && validationData.validResultVal === 'match'" class="desc box">
                      <p class="text-info">해시값이 일치합니다.</p>
                    </div>
                    <div
                      v-show="isCalHashComplete && validationData.validResultVal === 'notMatch'"
                      class="desc noti box"
                    >
                      <p class="text-warning">
                        <q-icon name="mdi-alert-outline" color="warning"></q-icon>
                        해시값이 일치하지 않습니다.
                      </p>
                    </div>
                    <div
                      v-show="isCalHashComplete && validationData.validResultVal === 'notExist'"
                      class="desc noti box"
                    >
                      <p class="text-warning">
                        <q-icon name="mdi-alert-outline" color="warning"></q-icon>
                        검증 해시값 정보가 존재하지 않습니다.
                      </p>
                    </div>
                    <div
                      v-show="isCalHashComplete && validationData.validResultVal === 'errorImg'"
                      class="desc noti box"
                    >
                      <p class="text-warning">
                        <q-icon name="mdi-alert-outline" color="warning"></q-icon>
                        이미지 파일이 없습니다.
                      </p>
                    </div>
                    <div v-show="isCalHashComplete && validationData.validResultVal === 'error'" class="desc noti box">
                      <p class="text-warning">
                        <q-icon name="mdi-alert-outline" color="warning"></q-icon>
                        해시값 검증에 실패하였습니다.
                      </p>
                    </div>
                  </div>
                  <div class="d-tbl-wrap">
                    <table class="img-table">
                      <caption>선택 케이스 파일</caption>
                      <q-input v-model="sourceDataPath" outlined type="text" dense disable></q-input>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </q-step>
          <q-step :name="2" prefix="2" title="케이스 생성" :done="stepIndex < 1">
            <div class="container">
              <q-form ref="caseInfoForm" class="main">
                <div class="tbl-wrap">
                  <table>
                    <caption>분석대상</caption>
                    <colgroup>
                      <col width="9.6%" />
                      <col width="*" />
                    </colgroup>
                    <tbody>
                      <tr>
                        <th>케이스명</th>
                        <td>
                          <q-input
                            v-model="caseInfoObject.caseName"
                            :rules="[requiredRule, maxLengthRule, specialCharRule]"
                            lazy-rules
                            autofocus
                            type="text"
                            dense
                            clearable
                            outlined
                            maxlength="50"
                            clear-icon="mdi-close"
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <q-separator></q-separator>
                <div class="tbl-wrap">
                  <table>
                    <caption>분석관 정보</caption>
                    <colgroup>
                      <col width="9.6%" />
                      <col width="37.31%" />
                      <col width="*" />
                      <col width="37.31%" />
                    </colgroup>
                    <tbody>
                      <tr>
                        <th>소속기관</th>
                        <td>
                          <q-input
                            v-model="caseInfoObject.analystAgency"
                            :rules="[requiredRule, maxLengthRule]"
                            lazy-rules
                            type="text"
                            maxlength="50"
                            outlined
                            dense
                            clearable
                            clear-icon="mdi-close"
                          />
                        </td>
                        <th class="space">소속부서</th>
                        <td>
                          <q-input
                            v-model="caseInfoObject.analystDepartment"
                            :rules="[requiredRule, maxLengthRule]"
                            lazy-rules
                            type="text"
                            maxlength="50"
                            outlined
                            dense
                            clearable
                            clear-icon="mdi-close"
                          />
                        </td>
                      </tr>
                      <tr>
                        <th>분석관 명</th>
                        <td>
                          <q-input
                            v-model="caseInfoObject.analystName"
                            :rules="[requiredRule, maxLengthRule]"
                            lazy-rules
                            type="text"
                            maxlength="50"
                            outlined
                            dense
                            clearable
                            clear-icon="mdi-close"
                          />
                        </td>
                        <th class="space">직급</th>
                        <td>
                          <q-input
                            v-model="caseInfoObject.analystRank"
                            :rules="[maxLengthRule]"
                            lazy-rules
                            type="text"
                            maxlength="50"
                            outlined
                            dense
                            clearable
                            clear-icon="mdi-close"
                          />
                        </td>
                      </tr>
                      <tr>
                        <th>저장 경로</th>
                        <td colspan="3">
                          <div class="d-flex-row">
                            <q-input
                              ref="caseFolderRef"
                              v-model="caseFolder"
                              :rules="[requiredRule]"
                              lazy-rules
                              outlined
                              type="text"
                              maxlength="50"
                              dense
                              clearable
                              clear-icon="mdi-close"
                              readonly
                              tabindex="-1"
                            />
                            <q-btn
                              outline
                              icon="mdi-folder-open-outline"
                              label="폴더 선택"
                              color="primary"
                              @click="caseFolderClick"
                            ></q-btn>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </q-form>
            </div>
          </q-step>
          <template #navigation>
            <footer class="footer-default">
              <q-stepper-navigation class="no-padding">
                <q-btn
                  outline
                  icon="mdi-chevron-left"
                  class="prev"
                  label="이전"
                  @click="
                    () => {
                      if (stepIndex < 2) {
                        onClickToggleShowCase()
                      } else {
                        stepIndex--
                      }
                      caseStore.setCurrentIndexPage(stepIndex)
                    }
                  "
                ></q-btn>
                <q-space></q-space>
                <q-btn
                  outline
                  icon-right="mdi-chevron-right"
                  label="다음"
                  color="primary"
                  :disable="(stepIndex > 1 && !isCalHashComplete && !isStepTwoValidate) || disableNextButton"
                  @click="
                    async () => {
                      if (stepIndex < 2) {
                        ++stepIndex
                      } else if (stepIndex >= 2 && startAnalysisFlag) {
                        console.log('startAnalysisProgress 함수 호출')
                        await startAnalysisProgress()
                      }
                      caseStore.setCurrentIndexPage(stepIndex)
                    }
                  "
                ></q-btn>
              </q-stepper-navigation>
            </footer>
          </template>
        </q-stepper>
      </q-page>
      <!-- 케이스 생성 화면 (e) -->
    </q-page-container>
  </q-layout>
</template>

<style scoped lang="scss">
.q-page {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
}

.select-wrap {
  width: 100%;
  height: calc(100vh - 88px);
  display: flex;
  justify-content: center;
  .btn-group {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    height: 100%;
    max-width: 101.25rem;
    gap: 3rem;
    > button {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 50%;
      max-height: 29rem;
      box-shadow: 0px 4px 16px rgba(0, 0, 0, 0.5);
      border-radius: 0.75rem;
      border: none;
      background: inherit;
      background-color: rgba(255, 255, 255, 0.07);
      position: relative;
      cursor: pointer;

      // 아이콘
      &::before {
        content: '';
        display: inline-block;
        width: 13.5rem;
        height: 13.5rem;
        position: absolute;
        top: 5.25rem;
        background: url(@renderer/assets/images/ico_select_evidence.svg) no-repeat 0 0 / auto;
      }
      &.import-evidence {
        &:hover::before {
          background-position: -13.5rem 0;
        }
      }
      &.analysis-evidence {
        &::before {
          background-position: -27rem 0;
        }
        &:hover::before {
          background-position: -40.5rem 0;
        }
      }
      // 그라디언트
      &::after {
        content: '';
        display: inline-block;
        width: 100%;
        height: 100%;
        position: absolute;
        left: 0;
        top: 0;
        z-index: 10;
      }
      // 버튼 hover 시
      &:hover {
        border-bottom: 10px solid $primary;
        &::after {
          background: linear-gradient(to top, rgba(0, 220, 255, 100%), rgba(0, 220, 255, 10%));
          opacity: 20%;
        }
        > .title {
          color: $primary;
          font-size: 3.75rem;
          padding-top: 21.5625rem;
          padding-bottom: 2rem;
          text-shadow: 0px 4px 8px rgba(0, 0, 0, 35%);
          font-weight: 700;
        }
      }
      > .title {
        display: inline-block;
        font-style: normal;
        font-size: 3rem;
        color: #ffffff;
        padding-top: 22.125rem;
        padding-bottom: 2.5rem;
        font-weight: 700;
      }
    }
  }
}

.case-wrap :deep {
  display: flex;
  flex-direction: column;
  //height: calc(100% - 3.1875rem);
  height: calc(100vh - 84px);
  width: 100%;
  background: transparent;
  box-shadow: none;
  .q-panel-parent,
  .footer-default {
    background-color: rgba(255, 255, 255, 0.1);
  }
  .q-stepper {
    &--dark {
      box-shadow: none;
    }
    &__header {
      display: flex;
      justify-content: center;
      align-items: center;
      list-style: none;

      width: 100%;
      height: 3.75rem;
      margin: 0 auto;
      padding: 0;
      border-top: 1px solid #0a141e;
      border-bottom: 1px solid #0a141e;
    }
    &__tab {
      min-height: 3.75rem;
      padding: 0px 16px 0px 0px;
      flex: 0 0 auto;
      font-weight: 700;
      margin-left: 0.5rem;
      &--active,
      &--done {
        .q-stepper__dot {
          background-color: #45c9ff;
        }
        .q-stepper__title {
          display: inline;
          color: #fff;
        }
      }
      .q-focus-helper {
        display: none;
      }
    }
    &__dot {
      border-radius: 50%;
      width: 1.75rem;
      height: 1.75rem;
      background-color: #999999;
      font-size: 0.9375rem;
      font-weight: 700;
      span {
        color: #fff;
      }
    }
    &__step-inner {
      padding: 0px;
    }
    &__title {
      display: none;
    }
    &__nav {
      display: flex;
    }
  }
  .container {
    height: calc(100% - 3.75rem);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    .main {
      overflow-y: none;
      padding: 0px 1.25rem 0px 1.25rem;
      .tbl-wrap {
        padding-bottom: 0.625rem;
        table {
          border-collapse: separate;
          border-spacing: 0 0.625rem;
          caption {
            font-size: 1.25rem;
            font-weight: 700;
            text-align: left;
            color: $primary;
            padding-top: 1.25rem;
          }
          tr {
            &:last-child {
              padding-bottom: 0px;
            }
            th {
              text-align: left;
              &.space {
                padding-left: 7.375rem;
              }
            }
          }
        }
      }
      .import-evidence {
        display: flex;
        justify-content: space-between;
        gap: 1.875rem;
        padding-top: 1.25rem;
        .q-btn {
          width: 26.6%;
          height: 18.5rem;
          box-shadow: 0px 2px 12px rgba(0, 0, 0, 50%);
          background-color: rgba(#fff, 7%);
          &__content {
            display: flex;
            flex-direction: column;
          }
          img {
            max-width: 6.25rem;
          }
          .title {
            font-size: 1.25rem;
            font-weight: 700;
            padding-top: 2.625rem;
          }
        }
        .tree-wrap {
          // height: 18.5rem;
          flex-grow: 1;
          position: relative;
          // &::after {
          //   display: inline-block;
          //   content: '';
          //   position: absolute;
          //   top: 0;
          //   right: 190px;
          //   width: 1px;
          //   height: 100%;
          //   background-color: rgba(#f5faff, 20%);
          // }
          .caption {
            background-color: rgba(#f5faff, 20%);
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: space-between;
            height: 2.5rem;
            border-radius: 4px 4px 0 0;
            font-size: 0.9375rem;
            > span {
              display: block;
              text-align: center;
              &.name-tit {
                flex-grow: 1;
              }
              &.date-tit {
                width: 11.875rem;
              }
            }
          }

          .hash-table {
            table-layout: auto;
            padding-top: 2.5rem;
            border: 1px solid rgba(245, 250, 255, 0.2);
            // caption {
            //   font-size: 1.25rem;
            //   font-weight: 400;
            //   padding-bottom: 0.75rem;
            // }
            // tr th {
            //   padding-left: 0.75rem;
            //   background-color: #54585c;
            //   text-align: left;
            // }
            // tr {
            //   height: 2.5rem;
            //   border-bottom: 1px solid rgba(245, 250, 255, 0.2);
            // }
            // tr td {
            //   padding-left: 0.625rem;
            //   background-color: #35383b;
            // }
          }

          .img-table {
            width: 26.6%;
            border: none;
            tr {
              height: 2.5rem;
              border-bottom: 1px solid rgba(245, 250, 255, 0.2);
            }
          }

          // .q-tree {
          //   background-color: #101214;
          //   height: calc(100% - 2.5rem);
          //   overflow-y: auto;
          //   font-size: 1rem;
          //   .iconify {
          //     width: 1.5rem;
          //     height: 1.5rem;
          //   }
          //   .date {
          //     font-size: 0.9375rem;
          //     padding-right: 1.875rem;
          //   }
          //   .count {
          //     padding-left: 4px;
          //   }
          // }
        }
      }
      .d-tbl-wrap {
        // padding-top: 2.5rem;
        caption {
          padding-bottom: 0.75rem;
        }
        .d-flex-row.btns_center {
          padding: 1.25rem 0;
          display: block;
          text-align: center;
        }
        .d-flex-row.btns_center button {
          width: auto;
          height: 2.25rem;
          padding: 0 1.375rem;
          box-shadow: none;
        }
      }
    }
  }
  .q-panel-parent {
    height: 100%;
    flex: 1 1 auto;
  }
  .footer-default {
    height: 105px;
  }
}

//화이트모드 적용
.body--light {
  // 증거이미지 선택
  .select-wrap {
    .btn-group {
      > button {
        background-color: #90a2af;
        border: 1px solid rgba(#ffffff, 70%);
        // 아이콘
        &.import-evidence {
          &:hover::before {
            background-position: 0 0;
          }
        }
        &.analysis-evidence {
          &::before {
            background-position: -27rem 0;
          }
          &:hover::before {
            background-position: -27rem 0;
          }
        }
        // 그라디언트
        &::after {
          display: none;
        }
        // 버튼 hover 시
        &:hover {
          background-color: #2165a2;
          border: 1px solid #2165a2;
          border-bottom: 10px solid #2165a2;
          > .title {
            color: #ffffff;
            font-size: 3rem;
            padding-top: 22.125rem;
            padding-bottom: 2rem;
          }
        }
        > .title {
          color: #ffffff;
        }
      }
    }
  }
  // 케이스 입력 및 분석대상 불러오기
  .case-wrap :deep {
    .q-stepper {
      &__header {
        border-color: $light-border;
      }
      &__tab {
        &--active,
        &--done {
          .q-stepper__dot {
            background-color: $light-primary;
          }
          .q-stepper__title {
            color: #36393c;
          }
        }
      }
    }
    .container .main {
      .import-evidence {
        .q-btn {
          border: rgba(#ffffff, 70%);
          box-shadow: 0px 2px 12px rgba(0, 0, 0, 20%);
          background-color: rgba(#90a2af, 100%);
          .title {
            color: #fff;
          }
        }
        .hash-table {
          border-color: rgba($light-border, 100%);
        }
      }
      .tbl-wrap table caption {
        color: $light-primary;
      }
    }
    .q-panel-parent,
    .footer-default {
      background-color: $light-bg-second;
    }
  }
}

// 반응형
// 증거이미지 선택
@media (max-width: 1680px) {
  .select-wrap {
    padding: 0rem 8.5rem;
  }
}
</style>
