import { app, ipcMain } from 'electron'
import {
  DB_STATUS,
  DB_PROGRESS_PARAM,
  _SEARCH_OPTION,
  DB_QUERY_PARAM,
  ERROR_CODE,
  DB_THREAD_QUERY_CMD,
  DB_SEARCH_CMD,
  DB_BOOKMARK_CMD,
  DB_BOOKMARK_MAPPER_RESULT,
  DB_BOOKMARK_OPR,
  DB_CASEINFO_OPR,
  DB_COPY_CMD,
  TABLE_PRT_CMD,
  DB_JSON_WRT_CMD,
  DB_TIMELINE_CHART_QUERY_INFO,
  DB_TIMELINE_QUERY_INFO,
  DB_OPERATION_TOTAL_SEARCH_RESULT,
  DB_OPERATION_RESULT
} from '../../shared/models'
import { KAPE_OP_CHANNELS } from '../../shared/constants'
import { queryKapeDB } from '../kape/queryKapeDB'
import logger from '../logger'
import path from 'path'

import fs from 'fs'
import { createKapeDB } from '../kape/createKapeDB'
import { KapeAnalysis } from '../kape/KapeAnalysis'
import commonService from '../service/commonService'

import { threadId, parentPort, Worker, WorkerOptions } from 'worker_threads'

// dbCreateDooingFlag === true  ==> 통합DB 진행 중
// dbCreateDooingFlag === false ==> 통합DB idle
let dbCreateDoingFlag: boolean = false
let dbTotalQueryFlag: boolean = false
let dbCopyCreateDoingFlag: boolean = false
const dbCopyReportDoingFlag: boolean = false
/////////////////////////////////////////////////

function workerTs(filename: string, workerOptions: WorkerOptions) {
  workerOptions.eval = true

  if (!workerOptions.workerData) {
    workerOptions.workerData = {}
  }

  workerOptions.workerData.__filename = filename

  //   return new Worker(
  //     `

  //  const wk = require('worker_threads');

  //  require('ts-node').register();

  //  let file = wk.workerData.__filename;

  //  require(file);

  //   `,

  //     workerOptions
  //   )
  return new Worker(filename)
}

/**
 * KapeDB.db 파일관련 render process의 모든 IPC의 함수를 본 모듈에서 구현함
 */
export default function init() {
  const kapedb = new queryKapeDB(app.getAppPath())
  dbCreateDoingFlag = false
  dbTotalQueryFlag = false
  let createTotalDBWorker: Worker | null = null
  let queryDBWorker: Worker | null = null
  let createCopyDBWorker: Worker | null = null
  const createCopyDBReportWorker: Worker | null = null
  let killCnt: number = 0
  let finalDBFullName: string = ''

  /**
   * KapeDB.db Connect(Open) 관련 함수
   * 입력 param : kape db의 full 경로 포함 파일이름.
   * @return값 : string : error code string, 오류가 존재하는 경우 'D001'
   *                       성공이면 '_000'
   */
  ipcMain.handle(KAPE_OP_CHANNELS.setDBName, async (_: any, dbFullName: string): Promise<ERROR_CODE> => {
    try {
      const re = await kapedb.setDBConnect(dbFullName)
      if (re === 1) return '_000'
      else return 'D001'
    } catch (err) {
      console.error(err)
      return 'D001'
    }
  })

  /**
   * DB 상태 정보 체크 API
   *
   * @returns ERROR_CODE
   */
  ipcMain.handle(KAPE_OP_CHANNELS.getDBStatus, async (): Promise<ERROR_CODE> => {
    // [1] db connectiion 상태를 체크한다
    const dbStatus = kapedb.getDBStatus()
    if (dbStatus !== 'idle') {
      return 'D001'
    } else {
      return '_000'
    }
  })

  /**
   * DB Query 3개의 범주를 포함한 모든 Category별 개수 정보 참조
   *
   * @returns category 개수 정보 객체[]
   */
  ipcMain.handle(KAPE_OP_CHANNELS.readCategoryCount, async (): Promise<any[] | ERROR_CODE> => {
    // [1] db connectiion 상태를 체크한다
    const dbStatus = kapedb.getDBStatus()
    if (dbStatus !== 'idle') {
      return 'D001'
    }

    let result: any = undefined // init default value

    try {
      console.log('call readCategoryCount')
      result = await kapedb.selectSummaryTable()
    } catch (err) {
      logger.error(err)
    }

    if (result === undefined) return 'D003'
    else return result
  })

  /**
   * DB Query Category Level 1의 범주를 기반으로 데이터 개수 정보 참조
   *
   * @returns category 개수 정보 객체[]
   */
  ipcMain.handle(KAPE_OP_CHANNELS.readCategoryCountLevel1, async (): Promise<any[] | ERROR_CODE> => {
    // [1] db connectiion 상태를 체크한다
    const dbStatus = kapedb.getDBStatus()
    if (dbStatus !== 'idle') {
      return 'D001'
    }

    let result: any = undefined // init default value

    try {
      console.log('call readCategoryCountLevel1')
      result = await kapedb.selectSummaryTableByCategory1()
    } catch (err) {
      logger.error(err)
    }

    if (result === undefined) return 'D003'
    else return result
  })

  /**
   * DB Query RECmd_Batch_SPO_All_Execute_Command_Output
   * 테이블에서 분석 개요에 필요한 정보 전달용
   *
   * @returns category 개수 정보 객체[]
   */
  ipcMain.handle(KAPE_OP_CHANNELS.readArtifactSystemInfo, async (): Promise<any[] | ERROR_CODE> => {
    // [1] db connectiion 상태를 체크한다
    const dbStatus = kapedb.getDBStatus()
    if (dbStatus !== 'idle') {
      return 'D001'
    }

    let result: any = undefined // init default value

    try {
      console.log('call readArtifactSystemInfo')
      result = await kapedb.selectArtifactSystemInfoByTable()
    } catch (err) {
      logger.error(err)
    }

    if (result === undefined) return 'D003'
    else return result
  })

  /**
   * 20240108 : 특정 시간 값을 입력값으로하여 해당 시간에서 시작하여 가강 작은 t_id값을 전달하는 함수
   * 해당 정보를 기준으로 Timeline 테이블 정보를 조회해야 한다.
   *
   * @returns category 개수 정보 객체[]
   */
  ipcMain.handle(KAPE_OP_CHANNELS.readMinTimelineByTime, async (_: any, s_time: string): Promise<any | ERROR_CODE> => {
    // [1] db connectiion 상태를 체크한다
    const dbStatus = kapedb.getDBStatus()
    if (dbStatus !== 'idle') {
      return 'D001'
    }

    let result: any = undefined // init default value

    try {
      //console.log('call readMinTimelineByTime')
      result = await kapedb.syncOneSelectContentTimelineByTime(s_time)

      commonService.writeLogTextWithPath(app.getAppPath(), 'readMinTimelineByTime : ' + s_time + ', ' + result.t_id)
      console.log('readMinTimelineByTime :: ' + s_time + ', ' + result.t_id)
    } catch (err) {
      logger.error(err)
    }

    if (result === undefined) return 'D003'
    else return result
  })

  /**
   * 20240126 : 특정 시간 값과 범주1과 범주2를 입력값으로하여 해당 시간에서 시작하여 가강 작은 t_id값을 전달하는 함수
   * 해당 정보를 기준으로 Timeline 테이블 정보를 조회해야 한다.
   *
   * @returns category 개수 정보 객체[]
   */
  ipcMain.handle(
    KAPE_OP_CHANNELS.readMinTimelineByTimeRange_Cagegory,
    async (_: any, param: DB_TIMELINE_CHART_QUERY_INFO): Promise<any | ERROR_CODE> => {
      // [1] db connectiion 상태를 체크한다
      const dbStatus = kapedb.getDBStatus()
      if (dbStatus !== 'idle') {
        return 'D001'
      }

      let result: any = undefined // init default value

      try {
        //console.log('call readMinTimelineByTimeRange_Cagegory')
        result = await kapedb.syncOneSelectContentTimelineByTime_Category(param)

        const inputString = JSON.stringify(param)
        commonService.writeLogTextWithPath(app.getAppPath(), 'readMinTimelineByTimeRange_Cagegory : ' + inputString)
        console.log('readMinTimelineByTimeRange_Cagegory :: ' + inputString)
      } catch (err: any) {
        logger.error(err)
        const errString = err.message
        commonService.writeLogTextWithPath(app.getAppPath(), 'readMinTimelineByTimeRange_Cagegory : ' + errString)
      }

      if (result === undefined) return 'D003'
      else return result
    }
  )

  /**
   * 20240108 : 타임 라인 테이블의 유효한  가강 작은 t_id값과 가장 큰 t_id값 을 전달하는 함수
   * 해당 정보를 기준으로 Timeline 테이블 정보를 조회해야 한다.
   *
   * @returns category 개수 정보 객체[]
   */
  ipcMain.handle(KAPE_OP_CHANNELS.readRangeTimelineByTId, async (): Promise<any[] | ERROR_CODE> => {
    // [1] db connectiion 상태를 체크한다
    const dbStatus = kapedb.getDBStatus()
    if (dbStatus !== 'idle') {
      return 'D001'
    }

    let result: any[] | undefined = undefined // init default value

    try {
      console.log('call readRangeTimelineByTId')
      result = await kapedb.syncRangeSelectContentTimelineByTId()

      const jsonString = JSON.stringify(result, null, 2)

      commonService.writeLogTextWithPath(app.getAppPath(), 'readRangeTimelineByTId : ' + jsonString)
      console.log('readRangeTimelineByTId : ' + jsonString)
    } catch (err) {
      logger.error(err)
    }

    if (result === undefined) return 'D003'
    else return result
  })

  /**
   * 20240205 : 타임라인 차트에서 선택된 row의 페이지 정보를 알수 있는 API temp_t_id 가 0부터 시작하는 SEQ
   * 해당 정보를 기준으로 Timeline 테이블 정보를 조회해야 한다.
   *
   * @returns DB_OPERATION_RESULT 객체 정보 객체[]
   */
  ipcMain.handle(KAPE_OP_CHANNELS.readTempMinTimelineByRange_Category, async (_: any, param : DB_TIMELINE_QUERY_INFO): Promise<DB_OPERATION_RESULT> => {
    let result: any | undefined = undefined // init default value

    // [1] db connectiion 상태를 체크한다
    const dbStatus = kapedb.getDBStatus()
    if (dbStatus !== 'idle') {
      return {state:'D001', data: result}
    }

    try {
      console.log('call readTempMinTimelineByRange_Category')
      result = await kapedb.syncSelectMinTimelineGotoByCondition(param)

      const jsonString = JSON.stringify(result, null, 2)

      commonService.writeLogTextWithPath(app.getAppPath(), 'readTempMinTimelineByRange_Category : ' + jsonString)
      console.log('readTempMinTimelineByRange_Category : ' + jsonString)
    } catch (err) {
      logger.error('readTempMinTimelineByRange_Category::', err)
    }

    if (result === undefined) return {state:'D003', data: result}
    else return {state:'_000', data: result}
  })

  /**
   * DB Query 3개의 범주를 포함한 모든 Category별 개수 정보 참조
   *
   * @returns category 개수 정보 객체[]
   */
  ipcMain.handle(KAPE_OP_CHANNELS.bookMarkMapperCategory, async (_: any, b_id: number): Promise<any[] | ERROR_CODE> => {
    // [1] db connectiion 상태를 체크한다
    const dbStatus = kapedb.getDBStatus()
    if (dbStatus !== 'idle') {
      return 'D001'
    }

    let result: any = undefined // init default value

    try {
      console.log('call bookMarkMapperCategory')
      result = await kapedb.selectBookMarkMapperCetegoryByBId(b_id)
    } catch (err) {
      logger.error(err)
    }

    if (result === undefined) return 'D003'
    else return result
  })

  /**
   * DB Query BId별로 등록된 데이터 개수 정보 참조
   *
   * @returns BId 개수 정보 객체[]
   */
  ipcMain.handle(KAPE_OP_CHANNELS.bookMarkMapperCountPerBId, async (): Promise<any[] | ERROR_CODE> => {
    //commonService.writeLogText('called bookMapperCountPerBId')
    // [1] db connectiion 상태를 체크한다
    const dbStatus = kapedb.getDBStatus()
    if (dbStatus !== 'idle') {
      return 'D001'
    }

    let result: any = undefined // init default value

    try {
      //console.log('call bookMarkMapperCountPerBId')
      result = await kapedb.selectBookMarkMapperCountPerBId()
    } catch (err) {
      logger.error(err)
    }

    if (result === undefined) return 'D003'
    else return result
  })


  /**
   * 1개의 북마크 정보 ADD/DEL 기능
   *
   * @returns status string : '_000' success, 'D00X' error
   */
  ipcMain.handle(KAPE_OP_CHANNELS.bookMarkMapperTableOneRow, async (_: any, input: DB_BOOKMARK_CMD): Promise<ERROR_CODE> => {
    // [1] db connectiion 상태를 체크한다
    const dbStatus = kapedb.getDBStatus()
    if (dbStatus !== 'idle') {
      return 'D001'
    }

    let result: ERROR_CODE = '_999' // init default value

    try {
      if( input.oprType === 'ADD') {
        result = await kapedb.asyncInsertBookMarkMapper(input.dbBookMarkMapperInfo)
      } else if ( input.oprType === 'DEL' ) {
        result = await kapedb.asyncDeleteBookMarkMapper(input.dbBookMarkMapperInfo)
      } else {
        result = 'D007'
        logger.error('입력명령어 에러')
      }
      
    } catch (err) {
      logger.error(err)
    }

    return result
  })

  /**
   * 1개의 북마크의 will_delete 필드 변경
   *
   * @returns status string : '_000' success, 'D00X' error
   */
  ipcMain.handle(KAPE_OP_CHANNELS.bookMarkMapperChangeTableOneRow, async (_: any, input: DB_BOOKMARK_CMD): Promise<ERROR_CODE> => {
    // [1] db connectiion 상태를 체크한다
    const dbStatus = kapedb.getDBStatus()
    if (dbStatus !== 'idle') {
      return 'D001'
    }

    let result: ERROR_CODE = '_999' // init default value

    try {
      result = await kapedb.asyncChangeWillDeleteBookMarkMapper(input.dbBookMarkMapperInfo) 
    } catch (err) {
      logger.error(err)
    }

    return result
  })

  /**
   * 20240105
   * for timeline_Short에 데이터 생성하고 업데이트 하기 위한 TEST를 위한 코드 20240105
   */
  ipcMain.handle(KAPE_OP_CHANNELS.createTotalTimeTable_Test, async (): Promise<any | ERROR_CODE> => {
    //commonService.writeLogText('called bookMapperCountPerBId')
    // [1] db connectiion 상태를 체크한다
    const dbStatus = kapedb.getDBStatus()
    if (dbStatus !== 'idle') {
      return 'D001'
    }

    let result: any = undefined // init default value

    try {
      console.log('call syncCreateTotalTimelineShort()')
      result = await kapedb.syncCreateTotalTimelineShort()
    } catch (err) {
      logger.error(err)
    }

    if (result === undefined) return 'D003'
    else return result
  })

  /**
   * Timeline 테이블에서 category_1 별로 레코드 개수 정보 전달
   *
   * @returns category 개수 정보 객체[]
   */
  ipcMain.handle(KAPE_OP_CHANNELS.readTimelineCategory, async (): Promise<DB_OPERATION_RESULT> => {
    // [1] db connectiion 상태를 체크한다
    const dbStatus = kapedb.getDBStatus()
    if (dbStatus !== 'idle') {
      return { state: 'D001', data: undefined }
    }

    let result: any = undefined // init default value

    try {
      console.log('call readTimelineCategory')
      result = await kapedb.selectSummaryTimelineTable()
    } catch (err) {
      logger.error(err)
    }

    if (result === undefined) return { state: 'D003', data: result }
    else return { state: '_000', data: result }
  })

  /**
   * 북마크에 관련된 ADD, DEL, MOD, REF(참조) 하는 API
   *
   * @returns DB_OPERATION_RESULT 객체 구조에서 data 필드
   */
  ipcMain.handle(
    KAPE_OP_CHANNELS.bookMarkTable,
    async (_: any, oprOption: DB_BOOKMARK_OPR): Promise<DB_OPERATION_RESULT> => {
      // [1] db connectiion 상태를 체크한다
      const dbStatus = kapedb.getDBStatus()
      if (dbStatus !== 'idle') {
        return { state: 'D001', data: undefined }
      }

      let result: any = undefined // init default value

      try {
        if (oprOption.op === 'ADD') {
          console.log('call ADD BooKMarkInfo')
          result = await kapedb.insertBookMarkInfo(oprOption.data[0])
        } else if (oprOption.op === 'DEL') {
          console.log('call DEL BooKMarkInfo')
          result = await kapedb.deleteBookMarkInfo(oprOption.data[0]._id!)
        } else if (oprOption.op === 'MOD') {
          // B_id를 기준으로 B_name과 B_color를 변경하는 것
          console.log('call MOD BooKMarkInfo')
          result = await kapedb.updateBookMarkInfo(oprOption.data[0])
        } else {
          console.log('call REF BooKMarkInfo')
          // 모든 BookMark정보를 주는 것
          result = await kapedb.selectBookMarkInfo()
        }

        return { state: '_000', data: result }
      } catch (err) {
        logger.error(err)
        return { state: 'D003', data: undefined }
      }
    }
  )

  /**
   * Case Info를 처리하는 API로 ADD, DEL, MOD, REF(참조) 를 수행하는 함수
   * 해당 함수를 수행할 때는 setDBName API를 이용하여, db connection을 수행해야 한다.
   * 해당 값이 설정이 안된 경우, DB_STATUS = 'noDBInfo'로 응답한다
   *
   * @returns DB_OPERATION_RESULT 객체 구조에서 data 필드 부분에 Case_Info 관련 객체 배열이 전송됨
   */
  ipcMain.handle(
    KAPE_OP_CHANNELS.CaseInfoTable,
    async (_: any, oprOption: DB_CASEINFO_OPR): Promise<DB_OPERATION_RESULT> => {
      // [1] db connectiion 상태를 체크한다
      const dbStatus = kapedb.getDBStatus()
      if (dbStatus !== 'idle') {
        console.log(dbStatus)
        commonService.writeLogTextWithPath(
          app.getAppPath(),
          'CaseInfoTable error: ' + dbStatus
        )
        return { state: 'D001', data: undefined }
      }

      let result: any = undefined // init default value

      try {
        if (oprOption.op === 'ADD') {
          console.log('call ADD Case_Info')
          result = await kapedb.insertCaseInfo(oprOption.data)
        } else if (oprOption.op === 'DEL') {
          console.log('call DEL Case_Info')
          result = await kapedb.deleteCaseInfo(oprOption.data[0]._key)
        } else if (oprOption.op === 'MOD') {
          console.log('call MOD Case_Info')
          result = await kapedb.updateCaseInfo(oprOption.data[0])
        } else {
          console.log('call REF Case_Info')
          // 모든 BookMark정보를 주는 것
          result = await kapedb.selectCaseInfo()
        }

        return { state: '_000', data: result }
      } catch (err) {
        logger.error(err)
        return { state: 'D003', data: undefined }
      }
    }
  )

  /**
   * DB Query (하나의 테이블을 조회하는 경우)
   * 입력 파라메타 : 조회할 테이블 이름 string
   *                조회시 offset 값 :  0 으로 시작함
   *
   * @returns [1] 'noDBInfo' 또는 'disconnect' 이면 DB 연경이 안된 경우 D001
   *          [2] 내부에러 D003
   *          [3] 객체[1] 정상 Query가 된 경우
   */
  ipcMain.handle(
    KAPE_OP_CHANNELS.readTableContents,
    async (_: any, inputData: DB_QUERY_PARAM): Promise<any[] | ERROR_CODE> => {
      // [1] db connectiion 상태를 체크한다
      const dbStatus = kapedb.getDBStatus()
      if (dbStatus !== 'idle') {
        return 'D001'
      }

      let result: any = undefined

      try {
        // console.log('called readTableContents', inputData.queryTable)
        result = await kapedb.selectEachTable(inputData)
      } catch (err) {
        logger.error(err)
      }

      if (result === undefined) return 'D003'
      else return result
    }
  )

  /**
   * DB Query (하나의 레코드(row)을 조회하는 경우)
   * 입력 파라메타 : 조회할 테이블 이름 string, offset에는 _id(즉, index) 정보를 주면, 1개의 레코드(row) 객체를 준다
   *                조회시 없으면 undefined
   *
   * @returns [1] 'noDBInfo' 또는 'disconnect' 이면 DB 연경이 안된 경우 D001
   *          [2] 내부에러 D003
   *          [3] 정상 Query가 된 경우 : 1개의 테이블 객체 정보
   */
  ipcMain.handle(
    KAPE_OP_CHANNELS.readTableOneContent,
    async (_: any, inputData: DB_QUERY_PARAM): Promise<any | ERROR_CODE> => {
      // [1] db connectiion 상태를 체크한다
      const dbStatus = kapedb.getDBStatus()
      if (dbStatus !== 'idle') {
        return 'D001'
      }

      let result: any = undefined

      try {
        console.log('called readTableOneContent', inputData.queryTable, inputData.queryOffset)
        result = await kapedb.selectOneRow(inputData)
      } catch (err) {
        logger.error(err)
      }

      if (result === undefined) return 'D003'
      else return result
    }
  )

  /**
   * DB Query (하나의 테이블을 조회하는 경우)
   * 입력 파라메타 : 조회할 테이블 이름 string
   *                조회시 offset 값 :  0 으로 시작함
   *
   * @returns [1] 'noDBInfo' 또는 'disconnect' 이면 DB 연경이 안된 경우 D001
   *          [2] 내부에러 D006
   *          [3] 입력 파라메타는 저장할 파일 명, 'FILE' 명령어, 저장할 객체리스트
   */
  ipcMain.handle(
    KAPE_OP_CHANNELS.writeTableContents,
    async (_: any, inputData: DB_JSON_WRT_CMD): Promise<ERROR_CODE> => {
      // [1] db connectiion 상태를 체크한다
      const dbStatus = kapedb.getDBStatus()
      if (dbStatus !== 'idle') {
        return 'D001'
      }

      let result: any = undefined

      try {
        // console.log('called readTableContents', inputData.queryTable)
        if (inputData.oprType === 'FILE') {
          // JSON 형식의 문자열로 변환
          const jsonString = JSON.stringify(inputData.wrtData, null, 2)

          // 파일에 쓰기
          fs.writeFile(inputData.filePath, jsonString, (err) => {
            if (err) {
              console.error('파일 쓰기 오류:', err)
              return 'D006'
            }
            //console.log('파일이 성공적으로 생성되었습니다.')
            result = '_000'
          })
        } else {
          result = 'D006'
        }
      } catch (err) {
        logger.error(err)
      }

      if (result === undefined) return 'D006'
      else return result
    }
  )

  ipcMain.on(
    KAPE_OP_CHANNELS.creetCSVDBName,
    (event: Electron.IpcMainEvent, csvtodb: { csv: string; dbpath: string }) => {
      const kapedb = new createKapeDB()
      kapedb.CreateDB(csvtodb.dbpath, async (cmd, state, index) => {
        console.log(cmd, state)
        event.sender.send(KAPE_OP_CHANNELS.creetCSVDBNameState, { cmd: cmd, state: state, index: index })
        if (cmd === 'open') {
          const csvdirs = fs.readdirSync(csvtodb.csv, { withFileTypes: true }).filter(function (file) {
            return file.isDirectory()
          })
          for (const csvdir of csvdirs) {
            await kapedb.getTables(path.join(csvtodb.csv, csvdir.name))
          }
          await kapedb.convertDB()
        }
      })
    }
  )

  ipcMain.on(
    KAPE_OP_CHANNELS.runKAPEAnalysis,
    async (event: Electron.IpcMainEvent, kapeParam: { k_source: string; k_dest: string }) => {
      const kapeObj = new KapeAnalysis()
      console.log('runKAPEAnalysis::kapeParam -> ', kapeParam)
      commonService.writeLogTextWithPath(
        app.getAppPath(),
        'runKAPEAnalysis : ' + kapeParam.k_source + ', ' + kapeParam.k_dest
      )
      kapeObj.doAsyncKapeAnalysis(kapeParam.k_source, kapeParam.k_dest, (state: string, value: number) =>
        event.sender.send(KAPE_OP_CHANNELS.runKAPEAnalysisResult, { state: state, data: value })
      )
    }
  )

  /**
   * 개별 테이블 생성한 후, 통합 테이블을 생성하는 API
   * 입력 변수는 db 이름및 폴더를 포함한 full name
   * @returns 없다. 주기적으로 결과를 보내는 것
   */
  ipcMain.on(KAPE_OP_CHANNELS.createSearchTable, (event: Electron.IpcMainEvent, _dbFullPathName: string) => {
    console.log('KAPE_OP_CHANNELS.createSearchTable', _dbFullPathName)
    ////////////////////////////////////////// IPC 테스트 코드
    // setTimeout(() => {
    //   console.log('KAPE_OP_CHANNELS.createSearchTable message 수신###')
    //   event.reply(KAPE_OP_CHANNELS.createSearchTableState, { state: 'ININ', percent: 200 })
    // }, 1000)

    const workerPath = __dirname + '/queryKapeDB2.js'
    if (dbCreateDoingFlag === false) {
      dbCreateDoingFlag = true
      killCnt = 0 // workerThread가 생성이 되면 관련 변수 초기화함

      // csv에서 생성된 DB가 없을 경우 에러 내용 전송
      const _dbName = _dbFullPathName
      const dbFolder = path.dirname(_dbFullPathName)

      // 최종 경로 위치에 DB 파일이 없으면 에러가 발생하게 한다
      if (kapedb.fileExists(_dbName)) {
        // 통합DB 설정이 완료가 되면, 해당 DB 파일 위치를 설정한다. 다음 Queyr에 의한 thread등작을 위해
        // 기존 case의 경우에는 화면 설정할 때, 반드시 해당 테이터를 설정하게 하는 함수를 만들어야 함
        finalDBFullName = _dbName // 이코드가 왜 필요한지 모르겠음...용도는 한번 DB가 결정이 나면 해당 내용을 유지 할려는 것인데...
        ///////////////////////////////////////////////////////////////////////////////////////

        createTotalDBWorker = workerTs(workerPath, {})

        const param: DB_THREAD_QUERY_CMD = {
          type: '_CREATE_TOTAL_TBL',
          dbPath: _dbName,
          data: null,
          appPath: app.getAppPath() // Thread에서는 반드시 있어야 함
        }

        createTotalDBWorker.postMessage(param) // worker Thread가 동작하게 함

        createTotalDBWorker.on('message', (value: DB_PROGRESS_PARAM) => {
          console.log('[_CREATE_TOTAL_TBL] child: ', value) // for worker Thread 동작 확인용

          // child에서 전달해 주는 percent값이 음수이거나 100이상이면  프로세스 종료로 인식함
          if ((value.percent < 0 && (value.state === '_999' || value.state === 'D005')) || value.percent >= 100) {
            dbCreateDoingFlag = false
            createTotalDBWorker = null
          }

          if (value.percent == 990) {
            console.log(value.state)
          } else if (value.percent == 991) {
            console.log(value.state)
            commonService.writeLogTextWithPath(app.getAppPath(), 'createTotalDB : ' + value.state)
          } else {
            ///////////////////////////////////////////////////////////////////////
            // worker thread에서 전달해 주는 값을 renderer process에게 전달해 주는 것
            ///////////////////////////////////////////////////////////////////////
            event.sender.send(KAPE_OP_CHANNELS.createSearchTableState, value)
          }
        })

        createTotalDBWorker.on('exit', (code) => {
          console.log('CreateSearchTable::>>>>>> worker Thread end, ', code)
        })
      } else {
        dbCreateDoingFlag = false
        // workThread가 없기에, createTotalDBWorker를 null로 설정하는 것은 없음
        event.sender.send(KAPE_OP_CHANNELS.createSearchTableState, { state: 'D005', percent: -1 })
      }
    } else {
      killCnt++
      // if (createTotalDBWorker !== null && killCnt >= 2) {
      //   console.log('통합DB 작업 진행중 명령어 killed 처음부터 작업을 다시 해야 함: ', killCnt)
      //   createTotalDBWorker.terminate()
      //   createTotalDBWorker = null
      //   killCnt = 0
      // } else
      {
        console.log('통합DB 작업 진행중 명령어 skip : ', killCnt)
        event.sender.send(KAPE_OP_CHANNELS.createSearchTableState, { state: 'W001', percent: -1 }) // 재 명령어 수행시, front에 진행 중으로 전달
      }
    }
    // console.log('##########################end of createSearchTable')
  })

  /**
   * 통합 테이블에서 검색을 수행하는 API
   * ###[중요] 추가 인자로 받을 수 있는 것은 오직 1개임....2개는 될 수 없음
   * //  _dbRootFolderName: string, _dbQueryOption: _SEARCH_OPTION
   * @returns 검색된 결과. 1번만 응답하게 됨
   */
  ipcMain.on(KAPE_OP_CHANNELS.searchTotalTable, (event: Electron.IpcMainEvent, input: DB_SEARCH_CMD) => {
    console.log('KAPE_OP_CHANNELS.searchTotalTable', input.dbPath, input.dbQueryOption)

    const workerPath = __dirname + '/queryKapeDB2.js'
    if (dbTotalQueryFlag === false) {
      dbTotalQueryFlag = true // 두번 동작하는 것을 막는 코드

      // csv에서 생성된 DB가 없을 경우 에러 내용 전송
      // const caseFolder = input.dbPath
      // const dbFolder = path.join(caseFolder, kapedb.dbForderName)
      const _dbName = path.join(input.dbPath)

      // 최종 경로 위치에 DB 파일이 없으면 에러가 발생하게 한다
      if (kapedb.fileExists(_dbName)) {
        // 통합DB 설정이 완료가 되면, 해당 DB 파일 위치를 설정한다. 다음 Queyr에 의한 thread등작을 위해
        // 기존 case의 경우에는 화면 설정할 때, 반드시 해당 테이터를 설정하게 하는 함수를 만들어야 함
        finalDBFullName = _dbName
        ///////////////////////////////////////////////////////////////////////////////////////

        queryDBWorker = workerTs(workerPath, {})

        const params: DB_THREAD_QUERY_CMD = {
          type: '_QUERY_TOTAL_TBL',
          dbPath: _dbName,
          data: input.dbQueryOption,
          appPath: app.getAppPath() // Thread에서는 반드시 있어야 함
        }

        commonService.writeLogTextWithPath(app.getAppPath(), 'searchTotalTable : ' + JSON.stringify(params))

        queryDBWorker.postMessage(params) // worker Thread가 동작하게 함

        queryDBWorker.on('message', (value: DB_OPERATION_TOTAL_SEARCH_RESULT) => {
          // DB_OPERATION_TOTAL_SEARCH_RESULT, ==> DB_OPERATION_RESULT
          console.log('[_QUERY_TOTAL_TBL] child::data_len: ', value.data.length) // for worker Thread 동작 확인용
          if (value.etc !== '') {
            console.log('[_QUERY_TOTAL_TBL] child::etc: ', value.etc)
            commonService.writeLogTextWithPath(app.getAppPath(), 'searchTotalTableFinalCountResult-ETC : ' + value.etc)
          }

          ///////////////////////////////////////////////////////////////////////
          // worker thread에서 전달해 주는 값을 renderer process에게 전달해 주는 것
          ///////////////////////////////////////////////////////////////////////
          // [중요] 로그를 위한 타입에서 front와 예약된 타입으로 변경 DB_OPERATION_TOTAL_SEARCH_RESULT ==> DB_OPERATION_RESULT
          const transformedValue: DB_OPERATION_RESULT = { state: value.state, data: value.data }
          event.sender.send(KAPE_OP_CHANNELS.searchTotalTableResult, transformedValue)
          event.sender.send(KAPE_OP_CHANNELS.searchTotalTableFinalCountResult, transformedValue.data.length)

          console.log('searchTotalTableFinalCountResult::', transformedValue.data.length)
          commonService.writeLogTextWithPath(
            app.getAppPath(),
            'searchTotalTableFinalCountResult : ' + transformedValue.data.length
          )

          // 응답이 오면 무조건 Thread가 종료된 것으로 인식한다.
          {
            dbTotalQueryFlag = false
            queryDBWorker = null
          }
        })

        queryDBWorker.on('exit', (code) => {
          console.log('_QUERY_TOTAL_TBL::>>>>>> worker Thread end, ', code)
        })
      } else {
        dbTotalQueryFlag = false

        const err_value: DB_OPERATION_RESULT = {
          state: 'D003',
          data: []
        }
        event.sender.send(KAPE_OP_CHANNELS.searchTotalTableResult, err_value)
        event.sender.send(KAPE_OP_CHANNELS.searchTotalTableFinalCountResult, 0)
      }
    } else {
      {
        console.log('통합DB 작업 진행중 명령어 skip : ', killCnt)
        const warr_value: DB_OPERATION_RESULT = {
          state: 'W001',
          data: []
        }
        event.sender.send(KAPE_OP_CHANNELS.searchTotalTableResult, warr_value) // 재 명령어 수행시, front에 진행 중으로 전달
        event.sender.send(KAPE_OP_CHANNELS.searchTotalTableFinalCountResult, 0)
      }
    }
    /////////////////////////////////////////////////////////
  })

  /**
   * 통합 테이블에서 카테고리별 검색 개수를 정보를 전달하는 API
   * ###[중요] 추가 인자로 받을 수 있는 것은 오직 1개임....2개는 될 수 없음
   * //  _dbRootFolderName: string, _dbQueryOption: _SEARCH_OPTION
   * @returns 검색된 결과. {state: 결과 상태 정보, data: 개수 정보}
   *                        정상이면 '_000' 그외는 에러
   *                        정상이면, data는 카테고리별 개수 정보과 이외의 값, 음수이면 에러
   */
  ipcMain.on(KAPE_OP_CHANNELS.searchCategoryCountTotalTable, (event: Electron.IpcMainEvent, input: DB_SEARCH_CMD) => {
    console.log('KAPE_OP_CHANNELS.searchCategoryCountTotalTable', input.dbPath, input.dbQueryOption)

    const workerPath = __dirname + '/queryKapeDB2.js'
    if (dbTotalQueryFlag === false) {
      dbTotalQueryFlag = true // 두번 동작하는 것을 막는 코드

      // csv에서 생성된 DB가 없을 경우 에러 내용 전송
      // const caseFolder = input.dbPath
      // const dbFolder = path.join(caseFolder, kapedb.dbForderName)
      const _dbName = path.join(input.dbPath)

      // 최종 경로 위치에 DB 파일이 없으면 에러가 발생하게 한다
      if (kapedb.fileExists(_dbName)) {
        // 통합DB 설정이 완료가 되면, 해당 DB 파일 위치를 설정한다. 다음 Queyr에 의한 thread등작을 위해
        // 기존 case의 경우에는 화면 설정할 때, 반드시 해당 테이터를 설정하게 하는 함수를 만들어야 함
        finalDBFullName = _dbName
        ///////////////////////////////////////////////////////////////////////////////////////

        queryDBWorker = workerTs(workerPath, {})

        const params: DB_THREAD_QUERY_CMD = {
          type: '_QUERY_CATEGORY_TOTAL_CNT_TBL',
          dbPath: _dbName,
          data: input.dbQueryOption,
          appPath: app.getAppPath() // Thread에서는 반드시 있어야 함
        }

        queryDBWorker.postMessage(params) // worker Thread가 동작하게 함

        queryDBWorker.on('message', (value: DB_OPERATION_RESULT) => {
          console.log('[_QUERY_CATEGORY_TOTAL_CNT_TBL] child: ', value.data) // for worker Thread 동작 확인용 data에는 count결과 값이 나온다

          ///////////////////////////////////////////////////////////////////////
          // worker thread에서 전달해 주는 값을 renderer process에게 전달해 주는 것
          ///////////////////////////////////////////////////////////////////////
          event.sender.send(KAPE_OP_CHANNELS.searchCategoryCountTotalTableResult, value)

          // 응답이 오면 무조건 Thread가 종료된 것으로 인식한다.
          {
            dbTotalQueryFlag = false
            queryDBWorker = null
          }
        })

        queryDBWorker.on('exit', (code) => {
          console.log('SearchCategoryCNT::>>>>>> worker Thread end, ', code)
        })
      } else {
        dbTotalQueryFlag = false

        const err_value: DB_OPERATION_RESULT = {
          state: 'D003',
          data: -1
        }
        event.sender.send(KAPE_OP_CHANNELS.searchCategoryCountTotalTableResult, err_value)
      }
    } else {
      {
        console.log('통합DB 작업 진행중 명령어 skip : ', killCnt)
        const warr_value: DB_OPERATION_RESULT = {
          state: 'W001',
          data: -1
        }
        event.sender.send(KAPE_OP_CHANNELS.searchCategoryCountTotalTableResult, warr_value) // 재 명령어 수행시, front에 진행 중으로 전달
      }
    }
    /////////////////////////////////////////////////////////
  })

  /**
   * 통합 테이블에서 검색 개수를 정보를 전달하는 API
   * ###[중요] 추가 인자로 받을 수 있는 것은 오직 1개임....2개는 될 수 없음
   * //  _dbRootFolderName: string, _dbQueryOption: _SEARCH_OPTION
   * @returns 검색된 결과. {state: 결과 상태 정보, data: 개수 정보}
   *                        정상이면 '_000' 그외는 에러
   *                        정상이면, data는 0과 이외의 값, 음수이면 에러
   */
  ipcMain.on(KAPE_OP_CHANNELS.searchCountTotalTable, (event: Electron.IpcMainEvent, input: DB_SEARCH_CMD) => {
    console.log('KAPE_OP_CHANNELS.searchCountTotalTable', input.dbPath, input.dbQueryOption)

    const workerPath = __dirname + '/queryKapeDB2.js'
    if (dbTotalQueryFlag === false) {
      dbTotalQueryFlag = true // 두번 동작하는 것을 막는 코드

      // csv에서 생성된 DB가 없을 경우 에러 내용 전송
      // const caseFolder = input.dbPath
      // const dbFolder = path.join(caseFolder, kapedb.dbForderName)
      const _dbName = path.join(input.dbPath)

      // 최종 경로 위치에 DB 파일이 없으면 에러가 발생하게 한다
      if (kapedb.fileExists(_dbName)) {
        // 통합DB 설정이 완료가 되면, 해당 DB 파일 위치를 설정한다. 다음 Queyr에 의한 thread등작을 위해
        // 기존 case의 경우에는 화면 설정할 때, 반드시 해당 테이터를 설정하게 하는 함수를 만들어야 함
        finalDBFullName = _dbName
        ///////////////////////////////////////////////////////////////////////////////////////

        queryDBWorker = workerTs(workerPath, {})

        const params: DB_THREAD_QUERY_CMD = {
          type: '_QUERY_TOTAL_CNT_TBL',
          dbPath: _dbName,
          data: input.dbQueryOption,
          appPath: app.getAppPath() // Thread에서는 반드시 있어야 함
        }

        queryDBWorker.postMessage(params) // worker Thread가 동작하게 함

        queryDBWorker.on('message', (value: DB_OPERATION_RESULT) => {
          console.log('[_QUERY_TOTAL_CNT_TBL] child: ', value.data) // for worker Thread 동작 확인용 data에는 count결과 값이 나온다

          ///////////////////////////////////////////////////////////////////////
          // worker thread에서 전달해 주는 값을 renderer process에게 전달해 주는 것
          ///////////////////////////////////////////////////////////////////////
          event.sender.send(KAPE_OP_CHANNELS.searchCountTotalTableResult, value)

          // 응답이 오면 무조건 Thread가 종료된 것으로 인식한다.
          {
            dbTotalQueryFlag = false
            queryDBWorker = null
          }
        })

        queryDBWorker.on('exit', (code) => {
          console.log('SearchCNT::>>>>>> worker Thread end, ', code)
        })
      } else {
        dbTotalQueryFlag = false

        const err_value: DB_OPERATION_RESULT = {
          state: 'D003',
          data: -1
        }
        event.sender.send(KAPE_OP_CHANNELS.searchCountTotalTableResult, err_value)
      }
    } else {
      {
        console.log('통합DB 작업 진행중 명령어 skip : ', killCnt)
        const warr_value: DB_OPERATION_RESULT = {
          state: 'W001',
          data: -1
        }
        event.sender.send(KAPE_OP_CHANNELS.searchCountTotalTableResult, warr_value) // 재 명령어 수행시, front에 진행 중으로 전달
      }
    }
    /////////////////////////////////////////////////////////
  })

  /**
   * 북마트 관련 통합 API
   * 북마크 생성, 삭제, SELECT(REF)
   * 20240223 : 'WILL_DEL_CHANGE' | 'WILL_DEL_DONE'
   * @returns 검색된 결과. 참조일 경우에는 응답 채널이 다름 bookMarkMapperTableRefResult(front개발자 요청사항)
   *                      그외의 명령어일 경우, bookMarkMapperTableResult
   */
  ipcMain.on(KAPE_OP_CHANNELS.bookMarkMapperTable, (event: Electron.IpcMainEvent, input: DB_BOOKMARK_CMD) => {
    console.log('KAPE_OP_CHANNELS.bookMarkMapperTable', input.dbPath, input.dbBookMarkMapperInfo.length)

    const workerPath = __dirname + '/queryKapeDB2.js'
    if (dbCreateDoingFlag === false) {
      dbCreateDoingFlag = true // 두번 동작하는 것을 막는 코드

      // csv에서 생성된 DB가 없을 경우 에러 내용 전송
      //const caseFolder = input.dbPath
      const dbFolder = path.dirname(input.dbPath)
      const _dbName = path.join(input.dbPath)

      // 최종 경로 위치에 DB 파일이 없으면 에러가 발생하게 한다
      if (kapedb.fileExists(_dbName)) {
        // 통합DB 설정이 완료가 되면, 해당 DB 파일 위치를 설정한다. 다음 Queyr에 의한 thread등작을 위해
        // 기존 case의 경우에는 화면 설정할 때, 반드시 해당 테이터를 설정하게 하는 함수를 만들어야 함
        finalDBFullName = _dbName
        ///////////////////////////////////////////////////////////////////////////////////////

        queryDBWorker = workerTs(workerPath, {})

        const params: DB_THREAD_QUERY_CMD = {
          type: '_ADD_BOOKMARK_MAPPER', // dummy로 임의의 값을 넣는다
          dbPath: _dbName,
          data: input.dbBookMarkMapperInfo,
          appPath: app.getAppPath() // Thread에서는 반드시 있어야 함
        }

        if (input.oprType === 'ADD') {
          params.type = '_ADD_BOOKMARK_MAPPER'
          commonService.writeLogTextWithPath(
            app.getAppPath(),
            '_ADD_BOOKMARK_MAPPER : ' + input.dbBookMarkMapperInfo.length
          )
        } else if (input.oprType === 'DEL') {
          params.type = '_DEL_BOOKMARK_MAPPER'
          commonService.writeLogTextWithPath(
            app.getAppPath(),
            '_DEL_BOOKMARK_MAPPER : ' + input.dbBookMarkMapperInfo.length
          )
        } else if (input.oprType === 'WILL_DEL_CHANGE') {
          params.type = '_WILL_DEL_CHANGE_BOOKMARK_MAPPER'
          commonService.writeLogTextWithPath(
            app.getAppPath(),
            '_WILL_DEL_CHANGE_BOOKMARK_MAPPER : ' + input.dbBookMarkMapperInfo.length
          )
        } else if (input.oprType === 'WILL_DEL_DONE') {
          params.type = '_WILL_DEL_DONE_BOOKMARK_MAPPER'
          commonService.writeLogTextWithPath(
            app.getAppPath(),
            '_WILL_DEL_DONE_BOOKMARK_MAPPER : ' + input.dbBookMarkMapperInfo.length
          )
        } else {
          params.type = '_REF_BOOKMARK_MAPPER'
          console.log(
            '_REF_BOOKMARK_MAPPER : ' +
              input.dbBookMarkMapperInfo[0]._id.toString() +
              ', ' +
              input.dbBookMarkMapperInfo[0]._tableName
          )
          commonService.writeLogTextWithPath(
            app.getAppPath(),
            '_REF_BOOKMARK_MAPPER : ' +
              input.dbBookMarkMapperInfo[0]._id.toString() +
              ', ' +
              input.dbBookMarkMapperInfo[0]._tableName
          )
        }

        queryDBWorker.postMessage(params) // worker Thread가 동작하게 함

        queryDBWorker.on('message', (value: DB_BOOKMARK_MAPPER_RESULT) => {
          //console.log('[_ADD_BOOKMARK_MAPPER] child: ', Array.isArray(value.data) ? value.data.length : value.data) // for worker Thread 동작 확인용

          ///////////////////////////////////////////////////////////////////////
          // worker thread에서 전달해 주는 값을 renderer process에게 전달해 주는 것
          // front에서 요청 파라메타는 변경사항이 없지만, 경우에 따라 응다 채널을 달리하여 처리하고 있음
          // type이 _REF_BOOKMARK_MAPPER 로 올 경우에만, 응답 채널을 다른 것(bookMarkMapperTableRefResult)으로 보내야 함
          // front에서 그렇게 처리하고 있음.
          // 다른 타입인 경우는 결과를 bookMarkMapperTableResult 채널로 보낸다
          ///////////////////////////////////////////////////////////////////////
          if (params.type === '_REF_BOOKMARK_MAPPER') {
            event.sender.send(KAPE_OP_CHANNELS.bookMarkMapperTableRefResult, value)
            commonService.writeLogTextWithPath(
              app.getAppPath(),
              '_REF_BOOKMARK_MAPPER Result : ' + (Array.isArray(value.data) ? value.data.length : value.data)
            )
            console.log('[_REF_BOOKMARK_MAPPER] child: ', Array.isArray(value.data) ? value.data.length : value.data) // for worker Thread 동작 확인용
          } else {
            event.sender.send(KAPE_OP_CHANNELS.bookMarkMapperTableResult, value)
            commonService.writeLogTextWithPath(
              app.getAppPath(),
              '_ADD-DEL_BOOKMARK_MAPPER Result : ' +
                value.state +
                ', ' +
                (Array.isArray(value.data) ? value.data.length : value.data)
            )
            console.log(
              '[_ADD-DEL_BOOKMARK_MAPPER] child: ' + value.state + ', ',
              Array.isArray(value.data) ? value.data.length : value.data
            ) // for worker Thread 동작 확인용
          }

          // 응답이 오면 무조건 Thread가 종료된 것으로 인식한다.
          {
            dbCreateDoingFlag = false
            queryDBWorker = null
          }
        })

        queryDBWorker.on('exit', (code) => {
          console.log('Search::>>>>>> worker Thread end, ', code)
        })
      } else {
        dbCreateDoingFlag = false

        const err_value: DB_BOOKMARK_MAPPER_RESULT = {
          state: 'D003',
          data: -1
        }
        event.sender.send(KAPE_OP_CHANNELS.bookMarkMapperTableResult, err_value)
      }
    } else {
      {
        console.log('통합DB 작업 진행중 명령어 skip : ', killCnt)
        const warr_value: DB_BOOKMARK_MAPPER_RESULT = {
          state: 'W001',
          data: -1
        }
        event.sender.send(KAPE_OP_CHANNELS.bookMarkMapperTableResult, warr_value) // 재 명령어 수행시, front에 진행 중으로 전달
      }
    }
    /////////////////////////////////////////////////////////
  })

  /**
   * TimeLine 차트를 위한 테이블 검색을 수행하는 API
   * ###[중요] 추가 인자로 받을 수 있는 것은 DB_TIMELINE_QUERY_INFO 객체임
   * //  _dbRootFolderName: string, _dbQueryOption: DB_TIMELINE_QUERY_INFO
   * @returns 검색된 결과는 입력값의 offset만큼 생성하여 줌
   */
  ipcMain.on(KAPE_OP_CHANNELS.readTimelineChartContents, (event: Electron.IpcMainEvent, input: DB_SEARCH_CMD) => {
    console.log('KAPE_OP_CHANNELS.readTimelineChartContents', input)

    commonService.writeLogTextWithPath(app.getAppPath(), 'readTimelineChartContents : ' + JSON.stringify(input))

    const workerPath = __dirname + '/queryKapeDB2.js'
    if (dbTotalQueryFlag === false) {
      dbTotalQueryFlag = true // 두번 동작하는 것을 막는 코드

      const _dbName = path.join(input.dbPath)

      // 최종 경로 위치에 DB 파일이 없으면 에러가 발생하게 한다
      if (kapedb.fileExists(_dbName)) {
        // 통합DB 설정이 완료가 되면, 해당 DB 파일 위치를 설정한다. 다음 Queyr에 의한 thread등작을 위해
        // 기존 case의 경우에는 화면 설정할 때, 반드시 해당 테이터를 설정하게 하는 함수를 만들어야 함
        finalDBFullName = _dbName
        ///////////////////////////////////////////////////////////////////////////////////////
        const testCnt = 0
        queryDBWorker = workerTs(workerPath, {})

        const params: DB_THREAD_QUERY_CMD = {
          type: '_QUERY_TIMELINE_SHORT_TBL',
          dbPath: _dbName,
          data: input.dbQueryOption,
          appPath: app.getAppPath() // Thread에서는 반드시 있어야 함
        }

        queryDBWorker.postMessage(params) // worker Thread가 동작하게 함

        queryDBWorker.on('message', (value: DB_OPERATION_RESULT) => {
          console.log('[_QUERY_TIMELINE_SHORT_TBL] child: ', value.data.length) // for worker Thread 동작 확인용

          ///////////////////////////////////////////////////////////////////////
          // worker thread에서 전달해 주는 값을 renderer process에게 전달해 주는 것
          ///////////////////////////////////////////////////////////////////////
          event.sender.send(KAPE_OP_CHANNELS.readTimelineChartContentsResult, value)

          commonService.writeLogTextWithPath(app.getAppPath(), 'readTimelineChartContentsResult : ' + value.data.length)
        })

        queryDBWorker.on('exit', (code) => {
          console.log('Search::>>>>>> worker Thread end, ', code)
          const done_value: DB_OPERATION_RESULT = {
            state: '_009',
            data: []
          }
          event.sender.send(KAPE_OP_CHANNELS.readTimelineChartContentsResult, done_value)
          // 응답이 오면 무조건 Thread가 종료된 것으로 인식한다.
          {
            dbTotalQueryFlag = false
            queryDBWorker = null
          }
        })
      } else {
        dbTotalQueryFlag = false

        const err_value: DB_OPERATION_RESULT = {
          state: 'D003',
          data: []
        }
        event.sender.send(KAPE_OP_CHANNELS.readTimelineChartContentsResult, err_value)
      }
    } else {
      {
        console.log('타임라인 차트  조회 작업 진행중 명령어 skip : ', killCnt)
        const warr_value: DB_OPERATION_RESULT = {
          state: 'W001',
          data: []
        }
        event.sender.send(KAPE_OP_CHANNELS.readTimelineChartContentsResult, warr_value) // 재 명령어 수행시, front에 진행 중으로 전달
      }
    }
    /////////////////////////////////////////////////////////
  })

  /**
   * ADD : 20240205, 사용자가 시간과 범주 조건을 입력하고 TimelineChart를 위한 데이터를 요청하는 경우 호출되는 API
   * 해당 테이블을 삭제하고 생성하여 조회 결과를 주는 것임
   * ###[중요] 추가 인자로 받을 수 있는 것은 DB_TIMELINE_QUERY_INFO 객체임
   * //  _dbRootFolderName: string, _dbQueryOption: DB_TIMELINE_QUERY_INFO
   * @returns 검색된 결과는 입력값에 한번에 준다
   */
  ipcMain.on(KAPE_OP_CHANNELS.createReadTimelineChartContents, (event: Electron.IpcMainEvent, input: DB_SEARCH_CMD) => {
    console.log('KAPE_OP_CHANNELS.createReadTimelineChartContents', input)

    commonService.writeLogTextWithPath(app.getAppPath(), 'createReadTimelineChartContents : ' + JSON.stringify(input))

    const workerPath = __dirname + '/queryKapeDB2.js'
    if (dbTotalQueryFlag === false) {
      dbTotalQueryFlag = true // 두번 동작하는 것을 막는 코드

      // csv에서 생성된 DB가 없을 경우 에러 내용 전송
      // const caseFolder = input.dbPath
      // const dbFolder = path.join(caseFolder, kapedb.dbForderName)
      const _dbName = path.join(input.dbPath)

      // 최종 경로 위치에 DB 파일이 없으면 에러가 발생하게 한다
      if (kapedb.fileExists(_dbName)) {
        // 통합DB 설정이 완료가 되면, 해당 DB 파일 위치를 설정한다. 다음 Queyr에 의한 thread등작을 위해
        // 기존 case의 경우에는 화면 설정할 때, 반드시 해당 테이터를 설정하게 하는 함수를 만들어야 함
        finalDBFullName = _dbName
        ///////////////////////////////////////////////////////////////////////////////////////
        const testCnt = 0
        queryDBWorker = workerTs(workerPath, {})

        const params: DB_THREAD_QUERY_CMD = {
          type: '_CREATE_QUERY_TIMELINE_TBL',
          dbPath: _dbName,
          data: input.dbQueryOption,
          appPath: app.getAppPath() // Thread에서는 반드시 있어야 함
        }

        queryDBWorker.postMessage(params) // worker Thread가 동작하게 함

        queryDBWorker.on('message', (value: DB_OPERATION_RESULT) => {
          console.log('[_CREATE_QUERY_TIMELINE_TBL] child: ', value.data.length) // for worker Thread 동작 확인용

          commonService.writeLogTextWithPath(app.getAppPath(), 'createReadTimelineChartContentsResult : ' + value.data.length)

          ///////////////////////////////////////////////////////////////////////
          // worker thread에서 전달해 주는 값을 renderer process에게 전달해 주는 것
          ///////////////////////////////////////////////////////////////////////
          event.sender.send(KAPE_OP_CHANNELS.createReadTimelineChartContentsResult, value)
        })

        queryDBWorker.on('exit', (code) => {
          console.log('createReadTimelineChartContents::>>>>>> worker Thread end, ', code)
          const done_value: DB_OPERATION_RESULT = {
            state: '_009',
            data: []
          }
          event.sender.send(KAPE_OP_CHANNELS.createReadTimelineChartContentsResult, done_value)
          // 응답이 오면 무조건 Thread가 종료된 것으로 인식한다.
          {
            dbTotalQueryFlag = false
            queryDBWorker = null
          }
        })
      } else {
        dbTotalQueryFlag = false

        const err_value: DB_OPERATION_RESULT = {
          state: 'D003',
          data: []
        }
        event.sender.send(KAPE_OP_CHANNELS.createReadTimelineChartContentsResult, err_value)
      }
    } else {
      {
        console.log('타임라인 조회 작업 진행중 명령어 skip : ', killCnt)
        const warr_value: DB_OPERATION_RESULT = {
          state: 'W001',
          data: []
        }
        event.sender.send(KAPE_OP_CHANNELS.createReadTimelineChartContentsResult, warr_value) // 재 명령어 수행시, front에 진행 중으로 전달
      }
    }
    /////////////////////////////////////////////////////////
  })

  /**
   * TimeLine에서 검색을 수행하는 API
   * ###[중요] 추가 인자로 받을 수 있는 것은 DB_TIMELINE_QUERY_INFO 객체임
   * //  _dbRootFolderName: string, _dbQueryOption: DB_TIMELINE_QUERY_INFO
   * @returns 검색된 결과는 입력값의 offset만큼 생성하여 줌
   */
  ipcMain.on(KAPE_OP_CHANNELS.readTimelineContents, (event: Electron.IpcMainEvent, input: DB_SEARCH_CMD) => {
    console.log('KAPE_OP_CHANNELS.readTimelineContents', input)

    commonService.writeLogTextWithPath(app.getAppPath(), 'readTimelineContents : ' + JSON.stringify(input))

    const workerPath = __dirname + '/queryKapeDB2.js'
    if (dbTotalQueryFlag === false) {
      dbTotalQueryFlag = true // 두번 동작하는 것을 막는 코드

      // csv에서 생성된 DB가 없을 경우 에러 내용 전송
      // const caseFolder = input.dbPath
      // const dbFolder = path.join(caseFolder, kapedb.dbForderName)
      const _dbName = path.join(input.dbPath)

      // 최종 경로 위치에 DB 파일이 없으면 에러가 발생하게 한다
      if (kapedb.fileExists(_dbName)) {
        // 통합DB 설정이 완료가 되면, 해당 DB 파일 위치를 설정한다. 다음 Queyr에 의한 thread등작을 위해
        // 기존 case의 경우에는 화면 설정할 때, 반드시 해당 테이터를 설정하게 하는 함수를 만들어야 함
        finalDBFullName = _dbName
        ///////////////////////////////////////////////////////////////////////////////////////
        const testCnt = 0
        queryDBWorker = workerTs(workerPath, {})

        const params: DB_THREAD_QUERY_CMD = {
          type: '_QUERY_TIMELINE_TBL',
          dbPath: _dbName,
          data: input.dbQueryOption,
          appPath: app.getAppPath() // Thread에서는 반드시 있어야 함
        }

        queryDBWorker.postMessage(params) // worker Thread가 동작하게 함

        queryDBWorker.on('message', (value: DB_OPERATION_RESULT) => {
          console.log('[_QUERY_TIMELINE_TBL] child: ', value.data.length) // for worker Thread 동작 확인용

          commonService.writeLogTextWithPath(app.getAppPath(), 'readTimelineContentsResult : ' + value.data.length)

          ///////////////////////////////////////////////////////////////////////
          // worker thread에서 전달해 주는 값을 renderer process에게 전달해 주는 것
          ///////////////////////////////////////////////////////////////////////
          event.sender.send(KAPE_OP_CHANNELS.readTimelineContentsResult, value)
        })

        queryDBWorker.on('exit', (code) => {
          console.log('readTimelineContents::>>>>>> worker Thread end, ', code)
          const done_value: DB_OPERATION_RESULT = {
            state: '_009',
            data: []
          }
          event.sender.send(KAPE_OP_CHANNELS.readTimelineContentsResult, done_value)
          // 응답이 오면 무조건 Thread가 종료된 것으로 인식한다.
          {
            dbTotalQueryFlag = false
            queryDBWorker = null
          }
        })
      } else {
        dbTotalQueryFlag = false

        const err_value: DB_OPERATION_RESULT = {
          state: 'D003',
          data: []
        }
        event.sender.send(KAPE_OP_CHANNELS.readTimelineContentsResult, err_value)
      }
    } else {
      {
        console.log('타임라인 조회 작업 진행중 명령어 skip : ', killCnt)
        const warr_value: DB_OPERATION_RESULT = {
          state: 'W001',
          data: []
        }
        event.sender.send(KAPE_OP_CHANNELS.readTimelineContentsResult, warr_value) // 재 명령어 수행시, front에 진행 중으로 전달
      }
    }
    /////////////////////////////////////////////////////////
  })

  /**
   * TimeLine에서 검색을 수행하는 API, 한번 요청하면 요청한 _pagesize개수만큼 그 사이즈로 여러번으로 쪼개어서 계속 전달하는 것
   * ###[중요] 추가 인자로 받을 수 있는 것은 DB_TIMELINE_QUERY_INFO 객체임
   * //  _dbRootFolderName: string, _dbQueryOption: DB_TIMELINE_QUERY_INFO
   * @returns 검색된 결과는 입력값의 offset만큼 생성하여 줌
   */
  ipcMain.on(KAPE_OP_CHANNELS.readOneTimeTimelineContents, (event: Electron.IpcMainEvent, input: DB_SEARCH_CMD) => {
    // front에서 한번 요청을 하면, 전체 조회를 한 후,
    // 일정 개수만큰 응답을 주어서 모두 전달하는 방식

    console.log('KAPE_OP_CHANNELS.readOneTimeTimelineContents', input)

    const workerPath = __dirname + '/queryKapeDB2.js'
    if (dbTotalQueryFlag === false) {
      dbTotalQueryFlag = true // 두번 동작하는 것을 막는 코드

      // 입력된 DB full name에 대해 DB가 없을 경우 에러 내용 전송
      const _dbName = path.join(input.dbPath)

      // 최종 경로 위치에 DB 파일이 없으면 에러가 발생하게 한다
      if (kapedb.fileExists(_dbName)) {
        // 통합DB 설정이 완료가 되면, 해당 DB 파일 위치를 설정한다. 다음 Queyr에 의한 thread등작을 위해
        // 기존 case의 경우에는 화면 설정할 때, 반드시 해당 테이터를 설정하게 하는 함수를 만들어야 함
        finalDBFullName = _dbName
        ///////////////////////////////////////////////////////////////////////////////////////
        const testCnt = 0
        queryDBWorker = workerTs(workerPath, {})

        const params: DB_THREAD_QUERY_CMD = {
          type: '_QUERY_ONETIME_TIMELINE_TBL',
          dbPath: _dbName,
          data: input.dbQueryOption,
          appPath: app.getAppPath() // Thread에서는 반드시 있어야 함
        }

        queryDBWorker.postMessage(params) // worker Thread가 동작하게 함

        queryDBWorker.on('message', (value: DB_OPERATION_RESULT) => {
          console.log('[_QUERY_ONETIME_TIMELINE_TBL] child: ', value.data.length) // for worker Thread 동작 확인용

          ///////////////////////////////////////////////////////////////////////
          // worker thread에서 전달해 주는 값을 renderer process에게 전달해 주는 것
          ///////////////////////////////////////////////////////////////////////
          event.sender.send(KAPE_OP_CHANNELS.readOneTimeTimelineContentsResult, value)
        })

        queryDBWorker.on('exit', (code) => {
          console.log('Search::>>>>>> worker Thread end, ', code)
          const done_value: DB_OPERATION_RESULT = {
            state: '_009',
            data: []
          }
          event.sender.send(KAPE_OP_CHANNELS.readOneTimeTimelineContentsResult, done_value)
          // 응답이 오면 무조건 Thread가 종료된 것으로 인식한다.
          {
            dbTotalQueryFlag = false
            queryDBWorker = null
          }
        })
      } else {
        dbTotalQueryFlag = false

        const err_value: DB_OPERATION_RESULT = {
          state: 'D003',
          data: []
        }
        event.sender.send(KAPE_OP_CHANNELS.readOneTimeTimelineContentsResult, err_value)
      }
    } else {
      {
        console.log('타임라인 조회 작업 진행중 명령어 skip : ', killCnt)
        const warr_value: DB_OPERATION_RESULT = {
          state: 'W001',
          data: []
        }
        event.sender.send(KAPE_OP_CHANNELS.readOneTimeTimelineContentsResult, warr_value) // 재 명령어 수행시, front에 진행 중으로 전달
      }
    }
    /////////////////////////////////////////////////////////
  })

  /**
   * TimeLine에서 검색의 개수 정보를전달하는 API
   * ###[중요] 추가 인자로 받을 수 있는 것은 DB_TIMELINE_QUERY_INFO 객체임
   * //  _dbRootFolderName: string, _dbQueryOption: DB_TIMELINE_QUERY_INFO
   * @returns 검색된 결과는 입력값의 offset만큼 생성하여 줌
   */
  ipcMain.on(KAPE_OP_CHANNELS.readTimelineContentsCount, (event: Electron.IpcMainEvent, input: DB_SEARCH_CMD) => {
    console.log('KAPE_OP_CHANNELS.readTimelineContentsCount', input)

    commonService.writeLogTextWithPath(app.getAppPath(), 'readTimelineContentsCount : ' + JSON.stringify(input))

    const workerPath = __dirname + '/queryKapeDB2.js'
    if (dbTotalQueryFlag === false) {
      dbTotalQueryFlag = true // 두번 동작하는 것을 막는 코드

      // csv에서 생성된 DB가 없을 경우 에러 내용 전송
      // const caseFolder = input.dbPath
      // const dbFolder = path.join(caseFolder, kapedb.dbForderName)
      const _dbName = path.join(input.dbPath)

      // 최종 경로 위치에 DB 파일이 없으면 에러가 발생하게 한다
      if (kapedb.fileExists(_dbName)) {
        // 통합DB 설정이 완료가 되면, 해당 DB 파일 위치를 설정한다. 다음 Queyr에 의한 thread등작을 위해
        // 기존 case의 경우에는 화면 설정할 때, 반드시 해당 테이터를 설정하게 하는 함수를 만들어야 함
        finalDBFullName = _dbName
        ///////////////////////////////////////////////////////////////////////////////////////
        const testCnt = 0
        queryDBWorker = workerTs(workerPath, {})

        // 해당 명령어는 offset정보와 무관하게 조건의 모든 개수 정보를 넘겨주게 된다.
        const params: DB_THREAD_QUERY_CMD = {
          type: '_QUERY_CNT_TIMELINE_TBL',
          dbPath: _dbName,
          data: input.dbQueryOption,
          appPath: app.getAppPath() // Thread에서는 반드시 있어야 함
        }

        queryDBWorker.postMessage(params) // worker Thread가 동작하게 함

        queryDBWorker.on('message', (value: DB_OPERATION_RESULT) => {
          console.log('[_QUERY_CNT_TIMELINE_TBL] child: ', value.data) // for worker Thread 동작 확인용

          commonService.writeLogTextWithPath(
            app.getAppPath(),
            'readTimelineContentsCountResult : ' + value.data
          )

          ///////////////////////////////////////////////////////////////////////
          // worker thread에서 전달해 주는 값을 renderer process에게 전달해 주는 것
          ///////////////////////////////////////////////////////////////////////
          event.sender.send(KAPE_OP_CHANNELS.readTimelineContentsCountResult, value)
        })

        queryDBWorker.on('exit', (code) => {
          console.log('Search::>>>>>> worker Thread end, ', code)
          const done_value: DB_OPERATION_RESULT = {
            state: '_009',
            data: -1
          }
          event.sender.send(KAPE_OP_CHANNELS.readTimelineContentsCountResult, done_value)
          // 응답이 오면 무조건 Thread가 종료된 것으로 인식한다.
          {
            dbTotalQueryFlag = false
            queryDBWorker = null
          }
        })
      } else {
        dbTotalQueryFlag = false

        const err_value: DB_OPERATION_RESULT = {
          state: 'D003',
          data: -1
        }
        event.sender.send(KAPE_OP_CHANNELS.readTimelineContentsCountResult, err_value)
      }
    } else {
      {
        console.log('타임라인 조회 작업 진행중 명령어 skip : ', killCnt)
        const warr_value: DB_OPERATION_RESULT = {
          state: 'W001',
          data: -1
        }
        event.sender.send(KAPE_OP_CHANNELS.readTimelineContentsCountResult, warr_value) // 재 명령어 수행시, front에 진행 중으로 전달
      }
    }
    /////////////////////////////////////////////////////////
  })

  /**
   * 선병이미지를 생성하는 API
   *
   * @returns 없다. 주기적으로 결과를 보내는 것
   */
  ipcMain.on(KAPE_OP_CHANNELS.createSelectImage, (event: Electron.IpcMainEvent, param: DB_COPY_CMD) => {
    //console.log('KAPE_OP_CHANNELS.createSelectImage', param)

    const workerPath = __dirname + '/queryKapeDB2.js'
    if (dbCopyCreateDoingFlag === false) {
      dbCopyCreateDoingFlag = true

      // 복사를 할 기존 DB정보 설정
      const _dbName = path.join(param.dBPathFullFileName)

      // 쓰레드에서는 엑셀 원본위치를 알 수 없다 실행 위치 정보를 미리 알려 주어야 한다.
      const _rootpath = app.getAppPath() // 프로그램 실행 현재 디렉토리

      // 최종 경로 위치에 DB 파일이 없으면 에러가 발생하게 한다
      if (kapedb.fileExists(_dbName)) {
        // 통합DB 설정이 완료가 되면, 해당 DB 파일 위치를 설정한다. 다음 Queyr에 의한 thread등작을 위해
        // 기존 case의 경우에는 화면 설정할 때, 반드시 해당 테이터를 설정하게 하는 함수를 만들어야 함
        finalDBFullName = _dbName // 이코드가 왜 필요한지 모르겠음...용도는 한번 DB가 결정이 나면 해당 내용을 유지 할려는 것인데...
        ///////////////////////////////////////////////////////////////////////////////////////

        createCopyDBWorker = workerTs(workerPath, {})

        // 쓰레드 함수에서 원본 엑셀위치를 알기 우해 필요한 정보
        param.appPath = app.getAppPath() // Thread에서는 반드시 있어야 함

        const input: DB_THREAD_QUERY_CMD = {
          type: '_MAKE_SELECTED_IMAGE',
          dbPath: _dbName,
          data: param,
          appPath: _rootpath // Thread에서는 반드시 있어야 함
        }

        commonService.writeLogTextWithPath(_rootpath, 'createSelectImage::' + param.selectIds) // 숫자배열은 자동으로 string으로 출력이 됨
        createCopyDBWorker.postMessage(input) // worker Thread가 동작하게 함

        createCopyDBWorker.on('message', (value: DB_PROGRESS_PARAM) => {
          console.log('[_MAKE_SELECTED_IMAGE] child: ', value) // for worker Thread 동작 확인용

          // child에서 전달해 주는 percent값이 음수이거나 100이상이면  프로세스 종료로 인식함
          if (value.percent === 999) {
            ///////////////////////////////////////////////////////////////////////
            // worker thread에서 전달해 주는 값을 renderer process에게 리포트가 생성될 폴더 정보를 state에 폴더 정보를 준다.
            // 보고서 파일은 해당 폴더 밑에 존재하고, DB는 해당 폴더 밑 DB에 존재
            // 전달해 주는 것
            ///////////////////////////////////////////////////////////////////////
            event.sender.send(KAPE_OP_CHANNELS.createSelectReportResult, value)
          } else if (value.percent === 990) {
            console.log(value.state) // for debuging 용 로그만 생성하고 아무 동작도 하지 않는다
          } else if (value.percent === 991) {
            // 로그 파일에 기록
            console.log(value.state)
            commonService.writeLogTextWithPath(_rootpath, value.state)
          } else if (
            (value.percent < 0 && (value.state === '_999' || value.state === 'T002')) ||
            value.percent >= 100
          ) {
            dbCopyCreateDoingFlag = false
            createCopyDBWorker = null

            ///////////////////////////////////////////////////////////////////////
            // worker thread에서 전달해 주는 값을 renderer process에게 전달해 주는 것
            ///////////////////////////////////////////////////////////////////////
            event.sender.send(KAPE_OP_CHANNELS.createSelectImageResult, value)
          } else {
            ///////////////////////////////////////////////////////////////////////
            // worker thread에서 전달해 주는 값을 renderer process에게 전달해 주는 것
            ///////////////////////////////////////////////////////////////////////
            event.sender.send(KAPE_OP_CHANNELS.createSelectImageResult, value)
          }
        })

        createCopyDBWorker.on('exit', (code) => {
          console.log('CopySelectImageDB::>>>>>> worker Thread end, ', code)
          dbCopyCreateDoingFlag = false
        })
      } else {
        dbCopyCreateDoingFlag = false
        // workThread가 없기에, createCopyDBWorker null로 설정하는 것은 없음
        event.sender.send(KAPE_OP_CHANNELS.createSelectImageResult, { state: 'D005', percent: -1 })
      }
    } else {
      // if (createTotalDBWorker !== null && killCnt >= 2) {
      //   console.log('통합DB 작업 진행중 명령어 killed 처음부터 작업을 다시 해야 함: ', killCnt)
      //   createTotalDBWorker.terminate()
      //   createTotalDBWorker = null
      //   killCnt = 0
      // } else
      {
        console.log('선별이미지 작업 진행중 명령어 skip ')
        event.sender.send(KAPE_OP_CHANNELS.createSelectImageResult, { state: 'W001', percent: -1 }) // 재 명령어 수행시, front에 진행 중으로 전달
      }
    }
    // console.log('##########################end of createSearchTable')
  })

  /**
   * 선병이미지의 엑셀 summary수정 API
   * 입력 : param: DB_COPY_CMD
   * @returns {state: string, percent: number}
   * 에러이면, T003, 정상이면 _000
   */
  ipcMain.handle(KAPE_OP_CHANNELS.changeSelectReport, (_: any, param: DB_COPY_CMD) => {
    console.log('KAPE_OP_CHANNELS.changeSelectReport', param)
    const re = kapedb.changeWrtieImageDBReport(param)
    console.log('##########################end of changeSelectReport')
    return re
  })

  /**
   * 선택된 테이블 csv 파일로 만드는 API
   *
   * @returns 없다. 주기적으로 결과를 보내는 것
   */
  ipcMain.on(KAPE_OP_CHANNELS.makeCSVTableFile, (event: Electron.IpcMainEvent, param: TABLE_PRT_CMD) => {
    //console.log('KAPE_OP_CHANNELS.makeCSVTableFile', param)

    const workerPath = __dirname + '/queryKapeDB2.js'
    if (dbCopyCreateDoingFlag === false) {
      dbCopyCreateDoingFlag = true

      // csv로 추출할 DB 정보
      const _dbName = path.join(param.dBPath)

      // 최종 경로 위치에 DB 파일이 없으면 에러가 발생하게 한다
      if (kapedb.fileExists(_dbName)) {
        // 통합DB 설정이 완료가 되면, 해당 DB 파일 위치를 설정한다. 다음 Queyr에 의한 thread등작을 위해
        // 기존 case의 경우에는 화면 설정할 때, 반드시 해당 테이터를 설정하게 하는 함수를 만들어야 함
        finalDBFullName = _dbName // 이코드가 왜 필요한지 모르겠음...용도는 한번 DB가 결정이 나면 해당 내용을 유지 할려는 것인데...
        ///////////////////////////////////////////////////////////////////////////////////////

        createCopyDBWorker = workerTs(workerPath, {})

        const input: DB_THREAD_QUERY_CMD = {
          type: '_MAKE_PRINT_TABLE',
          dbPath: _dbName,
          data: param,
          appPath: app.getAppPath() // Thread에서는 반드시 있어야 함
        }

        createCopyDBWorker.postMessage(input) // worker Thread가 동작하게 함

        createCopyDBWorker.on('message', (value: DB_PROGRESS_PARAM) => {
          console.log('[_MAKE_PRINT_TABLE] child: ', value) // for worker Thread 동작 확인용

          // child에서 전달해 주는 percent값이 음수이거나 100이상이면  프로세스 종료로 인식함
          if (
            // _999 임의의 에러 이거나 T002 상태에서 음수
            // 100 이상의 값
            (value.percent < 0 && (value.state === '_999' || value.state === 'T002')) ||
            value.percent >= 100
          ) {
            dbCopyCreateDoingFlag = false
            createCopyDBWorker = null
            ///////////////////////////////////////////////////////////////////////
            // worker thread에서 에러가 발생한 경우
            ///////////////////////////////////////////////////////////////////////
            event.sender.send(KAPE_OP_CHANNELS.makeCSVTableFileResult, value)
          } else {
            ///////////////////////////////////////////////////////////////////////
            // worker thread에서 정상 결과 전달해 주는 값을 renderer process에게 전달해 주는 것
            ///////////////////////////////////////////////////////////////////////
            event.sender.send(KAPE_OP_CHANNELS.makeCSVTableFileResult, value)
          }
        })

        createCopyDBWorker.on('exit', (code) => {
          console.log('CopySelectImageDB::>>>>>> worker Thread end, ', code)
          dbCopyCreateDoingFlag = false
        })
      } else {
        dbCopyCreateDoingFlag = false
        // workThread가 없기에, createCopyDBWorker null로 설정하는 것은 없음
        event.sender.send(KAPE_OP_CHANNELS.makeCSVTableFileResult, { state: 'D005', percent: -1 })
      }
    } else {
      // if (createTotalDBWorker !== null && killCnt >= 2) {
      //   console.log('통합DB 작업 진행중 명령어 killed 처음부터 작업을 다시 해야 함: ', killCnt)
      //   createTotalDBWorker.terminate()
      //   createTotalDBWorker = null
      //   killCnt = 0
      // } else
      {
        console.log('선택된 테이블 처리 중')
        event.sender.send(KAPE_OP_CHANNELS.makeCSVTableFileResult, { state: 'W001', percent: -1 }) // 재 명령어 수행시, front에 진행 중으로 전달
      }
    }
    // console.log('##########################end of createSearchTable')
  })

  /**
   * DB 처리를 하기 전에 반드시 호출하여 DB 컬럼 상세 정보를 받아와야 한다.
   * 해당 정보를 가지고 artifact 그리드에서 DB 조회 값을 출력하게 된다
   * @returns DB 컬럼에 대한 객체정보
   */
  ipcMain.handle(KAPE_OP_CHANNELS.readWinARTTableConfig, (): any => {
    //
    const dbConfig = kapedb.getWinArtTableConfig()
    console.log('WinArt Table 상세정보 전달 완료 ')
    return dbConfig
  })
}
