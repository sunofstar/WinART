import { KAPE_OP_CHANNELS } from '@share/constants'
import type { DB_TIMELINE_QUERY_INFO, DB_QUERY_PARAM } from '@/share/models'

const getTimelineDataCount = (param: DB_TIMELINE_QUERY_INFO, path: string): boolean => {
  if (path === '' || path === undefined) return false
  if (Object.keys(param).length < 1 || param == undefined) return false

  const objectParam = JSON.parse(JSON.stringify(param))

  if (ipcRenderer === undefined) {
    return false
  } else {
    try {
      ipcRenderer.send(KAPE_OP_CHANNELS.readTimelineContentsCount, {
        dbPath: path,
        dbQueryOption: objectParam
      })

      return true
    } catch (error) {
      console.log('Timeline 카운트 조회 에러 : ', error)
      return false
    }
  }
}

/**
 * @description Timeline 데이터 조회
 *
 * DB_TIMELINE_QUERY_INFO {
 * _full_search_flag: boolean 전체 범주 여부
 * _categoryName :string 범주
 * _full_time_range_flag: boolean 전체 시간 조회 여부
 * _s_time : string  시작 시간 ex) 2023-09-12 03:00:00
 * _e_time:string 종료 시간 ex) 2023-09-13 04:00:00
 * _b_id:number | undefined 북마크 Id
 *
 * @param params {DB_TIMELINE_QUERY_INFO}
 */
const getTimelineData = (param: DB_TIMELINE_QUERY_INFO, path: string): boolean => {
  if (path === '' || path === undefined) return false
  if (Object.keys(param).length < 1 || param == undefined) return false

  const objectParam = JSON.parse(JSON.stringify(param))

  if (ipcRenderer === undefined) {
    return false
  } else {
    try {
      ipcRenderer.send(KAPE_OP_CHANNELS.readTimelineContents, {
        dbPath: path,
        dbQueryOption: objectParam
      })

      return true
    } catch (error) {
      console.log('Timeline 조회 에러 : ', error)
    }
  }
}

const getTimelineChartData = (param: DB_TIMELINE_QUERY_INFO, path: string): boolean => {
  if (path === '' || path === undefined) return false
  if (Object.keys(param).length < 1 || param == undefined) return false

  const objectParam = JSON.parse(JSON.stringify(param))

  if (ipcRenderer === undefined) {
    return false
  } else {
    try {
      ipcRenderer.send(KAPE_OP_CHANNELS.readTimelineChartContents, {
        dbPath: path,
        dbQueryOption: objectParam
      })

      return true
    } catch (error) {
      console.log('Timeline 차트용 전체 데이터 조회 에러 : ', error)
    }
  }
}

const getTimelineDetailChartData = (param: DB_TIMELINE_QUERY_INFO, path: string): boolean => {
  if (path === '' || path === undefined) return false
  if (Object.keys(param).length < 1 || param == undefined) return false

  const objectParam = JSON.parse(JSON.stringify(param))

  if (ipcRenderer === undefined) {
    return false
  } else {
    try {
      ipcRenderer.send(KAPE_OP_CHANNELS.createReadTimelineChartContents, {
        dbPath: path,
        dbQueryOption: objectParam
      })

      return true
    } catch (error) {
      console.log('Timeline 차트용 상세검색 데이터 조회 에러 : ', error)
    }
  }
}

const getTimelineDetailData = async (param: DB_QUERY_PARAM): Promise[] => {
  if (Object.keys(param).length < 1 || param == undefined) return false

  const objectParam = JSON.parse(JSON.stringify(param))

  if (ipcRenderer === undefined) {
    return false
  } else {
    try {
      const result = ipcRenderer.invoke(KAPE_OP_CHANNELS.readTableOneContent, objectParam)
      return result
    } catch (error) {
      console.log('Timeline 상세 데이터 조회 에러 : ', error)
      return false
    }
  }
}

export default {
  getTimelineData,
  getTimelineChartData,
  getTimelineDataCount,
  getTimelineDetailData,
  getTimelineDetailChartData
}
