import { KAPE_OP_CHANNELS } from '@share/constants'
import { DB_QUERY_PARAM } from '@/share/models'
import { useCaseStore } from '@renderer/stores/caseStore'

const caseStore = useCaseStore()

const getFilePath = (): void => {
  return caseStore.path !== undefined && caseStore.path !== '' ? caseStore.path : ''
}

/**
 * @description DB connection 수립
 * @param filePath {string}
 */
const initDB = async (filePath: string): Promise<boolean> => {
  if (ipcRenderer === undefined) {
    return false
  } else {
    try {
      const connectResult = await ipcRenderer.invoke(KAPE_OP_CHANNELS.setDBName, filePath)
      if (connectResult === '_000') {
        caseStore.setPath(filePath)
        return true
      } else {
        console.log('분석 불러오기 실패 :', connectResult)
        return false
      }
    } catch (error) {
      console.log('분석 불러오기 실패 :', error)
    }
  }
}

/**
 * @description 아티팩트 목록 좌측 부 사이드 카테고리 네비게이션 용 count 조회
 */
const readCategoryCount = async (): Promise<[]> => {
  if (ipcRenderer === undefined) {
    return false
  } else {
    try {
      const readCategoryCount = await ipcRenderer.invoke(KAPE_OP_CHANNELS.readCategoryCount)
      if (readCategoryCount !== 'D001' && readCategoryCount !== 'D003') {
        return readCategoryCount
      } else {
        console.log('테이블 개수 불러오기 실패 :', readCategoryCount)
        return false
      }
    } catch (error) {
      console.log('테이블 개수 불러오기 실패 :', error)
    }
  }
}

/**
 * @description 카테고리 별 테이블 명 기준으로 조회
 * @param queryTableName {string}
 */
const readTableContents = async (param: DB_QUERY_PARAM): Promise<[]> => {
  if (ipcRenderer === undefined && (queryTableName === undefined || queryTableName === '')) {
    return false
  } else {
    try {
      const defaultParamData: DB_QUERY_PARAM = {
        queryTable: '', // ex) 'UserAssist___Users__NTUSER_DAT',
        queryOffset: 0,
        querySortFlag: false,
        querySortColName: '',
        querySortDescFlag: false,
        queryBookMarkId: undefined
      }

      Object.assign(defaultParamData, param)
      console.log('selected param data : ', defaultParamData)
      console.log('invoke KAPE_OP_CHANNELS.readTableContents')

      const readTableContents = await ipcRenderer.invoke(KAPE_OP_CHANNELS.readTableContents, defaultParamData)
      if (readTableContents !== 'D001' && readTableContents !== 'D003') {
        return readTableContents
      } else {
        console.log('테이블 불러오기 실패 :', readTableContents)
        return []
      }
    } catch (error) {
      console.log('테이블 불러오기 실패 :', error)
    }
  }
}

export default { initDB, readCategoryCount, readTableContents, getFilePath }
