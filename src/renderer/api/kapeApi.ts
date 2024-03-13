import { result } from 'lodash'
import { KAPE_OP_CHANNELS } from '../../shared/constants'
import { DB_PROGRESS_PARAM, TABLE_PRT_CMD, DB_COPY_CMD, DB_CASEINFO_OPR } from '../../shared/models'
import { KapeAnalysis } from '../kape/KapeAnalysis'

let kapeOnState: any = null
let csvOnstate: any = null
let dbOnState: any = null
let selectOnState: any = null
let selectDbOnState: any = null

/**
 * 케이프 분석 시작Api
 *
 * @param k_soruce 케이프 원본 경로, k_dest: 케이프 목적 경로
 * @returns progress: {state: string value: number}
 */

export const runKAPEAnalysis = async (
  kapeParam: { k_source: string; k_dest: string },
  onState: (state: string, percent: number) => void
): Promise<void> => {
  console.log('runKAPEAnalysis')
  kapeOnState = onState
  window.ipcRenderer.send(KAPE_OP_CHANNELS.runKAPEAnalysis, kapeParam)
}

window.ipcRenderer.on(
  KAPE_OP_CHANNELS.runKAPEAnalysisResult,
  async (progress: { state: string; percent: number }): Promise<void> => {
    if (kapeOnState) {
      kapeOnState(progress)
    }
  }
)

/**
 *  kape csv에서 DB생성하는 api
 *
 * @param csvtodb {csv: *csv가 존재하는 root폴더, dbpath: *db를 생성하기 위한 폴더 경로}
 */

export const csvToDB = async (
  csvtodb: { csv: string; dbpath: string },
  onState: (cmd: string, state: string, index: number) => void
): Promise<void> => {
  console.log('csvToDb Api호출')
  csvOnstate = onState
  window.ipcRenderer.send(KAPE_OP_CHANNELS.creetCSVDBName, csvtodb)
}
window.ipcRenderer.on(
  KAPE_OP_CHANNELS.creetCSVDBNameState,
  async (result: { cmd: string; state: string; index: number }): Promise<void> => {
    if (csvOnstate) {
      csvOnstate(result)
    }
  }
)

/**
 * 통합 테이블 생성 Api
 *
 * @param dbRootFolderName .db가 존재하는 폴더 위치
 * @returns value
 */

export const createIntegratedTable = async (
  dbRootFolderName: string,
  onState: (value: string) => void
): Promise<void> => {
  console.log('createIntegratedTable')
  dbOnState = onState
  window.ipcRenderer.send(KAPE_OP_CHANNELS.createSearchTable, dbRootFolderName)
}
window.ipcRenderer.on(KAPE_OP_CHANNELS.createSearchTableState, async (value: string): Promise<void> => {
  if (dbOnState) {
    dbOnState(value)
  }
})

/**
 * 분석 개요__ 1) 시스템 정보 조회 Api
 *
 * @returns 시스템 정보
 */

export const readSystemInfo = async (): Promise<void> => {
  // console.log('readArtifactSystemInfo')
  return window.ipcRenderer.invoke(KAPE_OP_CHANNELS.readArtifactSystemInfo)
}

/**
 * 분석 개요__ 2) 아티팩트 분석 정보 조회 Api
 *
 * @returns 아티팩트 분석 정보
 */

export const readArtifactCountLInfo = async (): Promise<void> => {
  // console.log('readArtifactCountLInfo')
  return window.ipcRenderer.invoke(KAPE_OP_CHANNELS.readCategoryCountLevel1)
}

/**
 * 아티팩트 리스트 CSV 출력 Api
 *
 * @param tableParCmd: TABLE_PRT_CMD {dbPath: DB full path, tableName: 출력할 테이블명, saveTableFileName: 저장할 파일 fulll path }
 */

export const makeCsvSelectImage = async (
  tableParCmd: TABLE_PRT_CMD,
  onState: (value: string) => void
): Promise<void> => {
  console.log('createSelectImagetoCSV')
  selectOnState = onState
  window.ipcRenderer.send(KAPE_OP_CHANNELS.makeCSVTableFile, tableParCmd)
}
window.ipcRenderer.on(KAPE_OP_CHANNELS.makeCSVTableFileResult, async (value: string): Promise<void> => {
  if (selectOnState) {
    selectOnState(value)
  }
})

/**
 * 선별이미지 DB 생성 Api
 *
 * @param dbParCmd: DB_COPY_CMD {dBPathFullFileName: org .db 경로, copyDBPathFullFileName: 생성될 db 경로, selectIds: [12, 10], selectCaseFullXlsxFileName: .xlsx, reportItems: AnalysisSelectReportSummary}
 */

export const generateSelectImageDb = async (dbParCmd: DB_COPY_CMD, onState: (value: string) => void): Promise<void> => {
  console.log('generateSelectImageDb')
  selectDbOnState = onState
  window.ipcRenderer.send(KAPE_OP_CHANNELS.createSelectImage, dbParCmd)
}
window.ipcRenderer.on(KAPE_OP_CHANNELS.createSelectImageResult, async (value: string): Promise<void> => {
  if (selectDbOnState) {
    selectDbOnState(value)
  }
})

/**
 * 선별이미지 xlsx 업데이트 Api
 *
 * @param dbParCmd: DB_COPY_CMD {dBPathFullFileName: org .db 경로, copyDBPathFullFileName: 생성될 db 경로, selectIds: [12, 10], selectCaseFullXlsxFileName: .xlsx, reportItems: AnalysisSelectReportSummary}
 */
export const changeSelectImageInfo = async (dbParCmd: DB_COPY_CMD): Promise<void> => {
  return window.ipcRenderer.invoke(KAPE_OP_CHANNELS.changeSelectReport, dbParCmd)
}

/**
 * 선별이미지 CaseInfo 데이터 Api
 *
 * @param param: DB_CASEINFO_OPR {op: _DB_CASEINFO_CMD_TYPE 명령어 정보, data: DB_CASEINFO_ITEM[]}
 */
export const writeCaseInfo = async (param: DB_CASEINFO_OPR): Promise<void> => {
  return window.ipcRenderer.invoke(KAPE_OP_CHANNELS.CaseInfoTable, param)
}

export default {
  runKAPEAnalysis,
  csvToDB,
  createIntegratedTable,
  readSystemInfo,
  readArtifactCountLInfo,
  makeCsvSelectImage,
  generateSelectImageDb,
  changeSelectImageInfo,
  writeCaseInfo
}
