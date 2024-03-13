import fs from 'fs'
import cp from 'child_process'
import path from 'path'
import { parse } from 'csv-parse'
import { parse as parseSync } from 'csv-parse/sync'
import { app } from 'electron'
import Database from 'better-sqlite3'
import sqlite3 from 'sqlite3'
import * as xlsx from 'xlsx'
import commonService from '../service/commonService'
//import * as ExcelJS from 'exceljs'

import {
  DB_STATUS,
  DB_PROGRESS_PARAM,
  _SEARCH_TYPE,
  _SEARCH_OPTION,
  DB_QUERY_PARAM,
  DB_BOOKMARK_INFO,
  DB_BOOKMARK_MAPPER_INFO,
  DB_TIMELINE_QUERY_INFO,
  DB_COPY_CMD,
  TABLE_PRT_CMD,
  DB_CASEINFO_ITEM,
  DB_TIMELINE_CHART_QUERY_INFO,
  DB_OPERATION_TOTAL_SEARCH_RESULT,
  ERROR_CODE,
  DB_OPERATION_RESULT
} from '../../shared/models'
import { EventEmitter } from 'events'

export class queryKapeDB {
  protected DBPath: string = ''
  protected destDBPath: string = ''
  protected destReportPath: string = ''
  protected kapedb: any = null
  protected destKapedb: any = null
  protected cancel: boolean = false
  protected dbStatus: DB_STATUS = 'noDBInfo'
  protected re: any

  protected MAX_PROGRESS_COUNT: number = 46 + 2 + 1 // case_info , case systemInfo, timeline_idx조정, 엑셀작업(49)
  protected selectedProgressCnt: number = 1

  protected rootpath = ''
  protected tableSetting: any
  protected winArtTableConfig: any
  dbForderName: string = 'DB'
  dbFileName: string = 'kapedb.db'
  protected localTimezone = 9

  protected pageSize = 1000 // 2023.11.14 100000 -> 1000
  protected timelinePageSize = 500 // add 20240108
  protected CreateDBpageSize = 100000 // 2023.12.05 1000 ==> 100000, 통합DB 생성시에는 많은 용량이 필요함
  protected TotalSearchDBpageSize = 10000 // 2023.12.05 1000 ==> 100000, 통합DB 생성시에는 많은 용량이 필요함, 1218 5만에서 1만으로 줄임

  protected timeLineInsertSQL =
    'INSERT INTO Total_Timeline (t_dateTime, t_attribute, t_timelineCategory, t_category, t_type, t_itemName, t_itemValue, t_tableName, t_tableId, category_1, category_2, category_3, t_main ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  protected timeLineTmpInsertSQL =
    'INSERT INTO Total_Timeline_Tmp (t_dateTime, t_attribute, t_timelineCategory, t_category, t_type, t_itemName, t_itemValue, t_tableName, t_tableId, category_1, category_2, category_3, t_main ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'

  // 통합DB 생성할 때 호출하는 SQL문  
  protected timeLine_Sorted_InsertSQL =
    'INSERT INTO Total_Timeline (t_dateTime, t_attribute, t_timelineCategory, t_category, t_type, t_itemName, t_itemValue, t_tableName, t_tableId, category_1, category_2, category_3, t_main) select t_dateTime, t_attribute, t_timelineCategory, t_category, t_type, t_itemName, t_itemValue, t_tableName, t_tableId, category_1, category_2, category_3, t_main FROM Total_Timeline_Tmp order by t_dateTime, category_1, category_2, category_3'
  
  // 타임라인 그리드에서 사용자가 시간만 조건을 입력하고 chart를 호출하면 만들어야야 하는 테이블
  protected timeLine_GotoInfo_time_InsertSQL =
    `INSERT INTO Total_Timeline_GotoInfo (t_id, t_dateTime, category_1, category_2, category_3) 
            select t_id, t_dateTime, category_1, category_2, category_3 
              FROM Total_Timeline 
              WHERE t_dateTime is not null AND
              (t_dateTime >= ? AND t_dateTime <= ?)
            order by t_dateTime, category_1, category_2, category_3`

  // 타임라인 그리드에서 사용자가 시간과 범주 두개의 조건을 입력하고 chart를 호출하면 만들어야야 하는 테이블
  protected timeLine_GotoInfo_time_category_InsertSQL =
    `INSERT INTO Total_Timeline_GotoInfo (t_id, t_dateTime, category_1, category_2, category_3) 
                    select t_id, t_dateTime, category_1, category_2, category_3 
                      FROM Total_Timeline 
                      WHERE t_dateTime is not null AND
                      (t_dateTime >= ? AND t_dateTime <= ?) AND
                      category_1 IN (?)
                    order by t_dateTime, category_1, category_2, category_3`
  
  // 타임라인 그리드에서 사용자가 범주  조건을 입력하고 chart를 호출하면 만들어야야 하는 테이블
  protected timeLine_GotoInfo_category_InsertSQL =
  `INSERT INTO Total_Timeline_GotoInfo (t_id, t_dateTime, category_1, category_2, category_3) 
                  select t_id, t_dateTime, category_1, category_2, category_3 
                    FROM Total_Timeline 
                    WHERE t_dateTime is not null AND
                    category_1 IN (?)
                  order by t_dateTime, category_1, category_2, category_3`

  // 통합DB 생성할 때, 호출되는 SQL문                  
  protected timeLine_Short2_InsertSQL = `INSERT INTO Total_Timeline_Short2 (t_dateTime, category_1, category_2, c_count) select substr(t_dateTime, 1, 13)||':00:00' as t_dateTime, category_1, category_2, count(*) as c_count
          from 
            total_timeline
          where 
            t_dateTime is not null
            and t_dateTime >= '1970-01-01 00:00:00'
          group by substr(t_dateTime, 1, 13), category_1, category_2
          order by substr(t_dateTime, 1, 13), category_1, category_2`

  // 아래의 조건을 수행하기 전에 기존 데이터를 무조건 삭제해야 한다
  protected timeLine_Short2_DeleteSQL = `DELETE FROM Total_Timeline_Short2`     
  protected timeLine_ShortTemp_DeleteSQL = `DELETE FROM Total_Timeline_ShortTemp` 
  protected timeLine_GotoInfo_DeleteSQL = `DELETE FROM Total_Timeline_GotoInfo`       


  // 타임라인 chart에 보여질 데이터의 초기 데이터 생성하는 것 -> 이것은 Total_Timeline_Short2 읽어서 Total_Timeline_Short에 넣는 것
  protected timeLine_Short_InsertSQL = `INSERT INTO Total_Timeline_Short (t_dateTime, category_1, c_count, detail) select t_dateTime, category_1, sum(c_count) as c_count, NULL
          from 
          Total_Timeline_Short2
          group by t_dateTime, category_1
          order by t_dateTime, category_1`
        
  // 사용자 요청에 의한 특정 데이터들만 타임라인 chart에 보여질 데이터의 초기 데이터 생성하는 것 -> 이것은 Total_Timeline_Short2 읽어서 Total_Timeline_ShortTemp에 넣는 것
  protected timeLine_Short_InsertSQL_from_ShortTemp = `INSERT INTO Total_Timeline_ShortTemp (t_dateTime, category_1, c_count, detail) select t_dateTime, category_1, sum(c_count) as c_count, NULL
          from 
          Total_Timeline_Short2
          group by t_dateTime, category_1
          order by t_dateTime, category_1`

  protected totalSearchInsertSQL = 'INSERT INTO Total_Search (s_tableName, s_tableId, searchData) VALUES (?, ?, ?)'

  protected totalSearchSelectSQL = 's_tableName, s_tableId, searchData'
  protected timeLineSelectSQL =
    't_id, t_dateTime, t_attribute, t_timelineCategory, t_category, t_type, t_itemName, t_itemValue, t_tableName, t_tableId, category_1, category_2, category_3, t_main'
  protected bookMarkInfoSelectSQL = 'b_id, b_name, b_color'
  protected bookMarkMapperSelectSQL = 'b_id, b_tableName, b_tableId, category_1, category_2, category_3'
  /**
   * percent 값이 0 미만 : 에러, 100 완료, 0 < 값 < 100 진행중
   * state : 진행중일 경우, 테이블 명,
   *         에러일 경우, 에러 코드 또는 '_999'
   */
  protected progressStatus: DB_PROGRESS_PARAM = { state: '_000', percent: 0 }

  // 최초 생성시 하는 동작
  public constructor(rootAppPath: string) {
    // 생성시, 초기 동작관련 내용
    this.cancel = false
    this.DBPath = ''
    this.rootpath = rootAppPath

    // 현재 아래의 2개으 파일은 반드시 있어야 하는 것임
    if (fs.existsSync(path.join(this.rootpath, 'resources', 'TableInfo.json'))) {
      const tableSetting = fs.readFileSync(path.join(this.rootpath, 'resources', 'TableInfo.json'), 'utf8') //#### [중요] resources 폴더 밑에 TabbleInfo.json이 있어야 함
      this.tableSetting = JSON.parse(tableSetting)
    } else {
      this.tableSetting = null
    }

    if (fs.existsSync(path.join(this.rootpath, 'resources', 'winart_config.json'))) {
      const _winArtTableConfig = fs.readFileSync(path.join(this.rootpath, 'resources', 'winart_config.json'), 'utf8') //#### [중요] resources 폴더 밑에 winart_config.json이 있어야 함
      this.winArtTableConfig = JSON.parse(_winArtTableConfig)
    } else {
      this.winArtTableConfig = null
    }

    // initialize
    this.progressStatus = { state: '_000', percent: 0 }
  }

  /**
   *
   * @param filePath : 검사해야할 파일의 절대 경로 및 파일명
   * @returns : true : 파일이 존재
   *            false : 파일 미존재
   */
  fileExists(filePath: string): boolean {
    try {
      // 파일을 접근할려고 시도
      fs.accessSync(filePath, fs.constants.F_OK)
      return true
    } catch (err) {
      return false
    }
  }
  /**
   * DB 연결을 위해 DB정보를 설정한다.
   * @param : dbFullName : 절대 경로로 db 파일명까지 전달해주는 것
   * 그리고 DB Open을 수행한다
   */
  async setDBConnect(dbFullName: string) {
    try {
      console.log('setDBConnect::in setDBConnect')
      if (this.dbStatus === 'noDBInfo' || this.dbStatus === 'disconnect') {
        if (dbFullName.length !== 0) {
          this.DBPath = path.join(dbFullName)

          // 최종 경로 위치에 DB 파일이 없으면 에러가 발생하게 한다
          if (this.fileExists(this.DBPath)) {
            //this.kapedb = new sqlite3.Database(this.DBPath) // for sqlite3
            this.kapedb = new Database(this.DBPath) // better-sqlte3
            this.dbStatus = 'idle'
          } else {
            console.log(`${this.DBPath} is not existed`)
            return 0
          }
        } else {
          // null인 경우 에외 처리
          console.log('no case folder info')
          return 0
        }
      } else if (this.dbStatus === 'idle') {
        // 입력값으로 다시 파일 위치를 다시 설정함
        console.log('DB reconnect')
        this.close()

        this.DBPath = path.join(dbFullName)
        //this.kapedb = new sqlite3.Database(this.DBPath) // for sqlite3
        this.kapedb = new Database(this.DBPath) // better-sqlte3
        this.dbStatus = 'idle'
      }

      console.log('DB INFO ', this.kapedb)
      return 1
    } catch (err) {
      console.log(err)
      return 0
    }
  }

  /**
   *
   * @param dbPath
   * @returns 1 : 정상 connect
   *          0 : 비정상
   */
  setDBConnectSync(dbPath: string) {
    try {
      console.log('setDBConnectSync::in setDBConnect')
      if (this.dbStatus === 'noDBInfo' || this.dbStatus === 'disconnect') {
        if (dbPath.length !== 0) {
          this.DBPath = dbPath
          //this.kapedb = new sqlite3.Database(this.DBPath) // for sqlite3
          this.kapedb = new Database(this.DBPath) // better-sqlte3
          this.dbStatus = 'idle'
        }
      } else if (this.dbStatus === 'idle') {
        if (this.DBPath !== dbPath) {
          this.close()
          this.DBPath = dbPath
          //this.kapedb = new sqlite3.Database(this.DBPath) // for sqlite3
          this.kapedb = new Database(this.DBPath) // better-sqlte3
          this.dbStatus = 'idle'
        }
      }

      console.log('setDBConnectSync::DB INFO ', this.kapedb)
      return 1
    } catch (err) {
      console.log(err)
      return 0
    }
  }
  /**
   *
   * @returns DB의 상태 정보를 전달 해주는 것(string)
   */
  getDBStatus(): DB_STATUS {
    return this.dbStatus
  }

  /**
   * renderer 프로세스에서 반드시 해당 정보를 읽어서, 화면에 출력하는데 사용됨
   * @returns kapedb.db 의 컬럼 상세 정보를 위한 config정보, 만약에 문제가 존재하면 null값이 전달이 됨
   */
  getWinArtTableConfig(): any {
    return this.winArtTableConfig
  }

  /**
   * DB 닫고 작업 취소
   */
  close() {
    if (this.dbStatus == 'idle') {
      this.kapedb.close()
      if (this.destKapedb !== null) {
        this.destKapedb.close()
        this.destKapedb = null
      }
      this.kapedb = null
      this.dbStatus = 'disconnect'
    }
  }

  /**
   * 비동기 방식으로 SearchTable 생성 API
   */
  async asyncCreateSearchTable(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      try {
        // table fts5 테이블 생성 , FTS 테이블은 모든 컬럼이 text임
        const createTable = this.kapedb.prepare(
          `CREATE virtual TABLE IF NOT EXISTS Total_Search using fts5(s_tableName ,s_tableId ,searchData)`
        )
        createTable.run()
      } catch (err) {
        console.error('CreateTable 중 오류 발생:', err)
        reject()
      } finally {
        //console.log('done asyncCreateSearchTable()')
        resolve()
      }
    })
  }

  /**
   * 동기 방식으로 total search 테이블 생성
   * 20240104_col_rename
   */
  async syncCreateSearchTable() {
    try {
      // table fts5 테이블 생성 , FTS 테이블은 모든 컬럼이 text임
      const createTable = this.kapedb.prepare(
        `CREATE virtual TABLE IF NOT EXISTS Total_Search using fts5(s_tableName ,s_tableId ,searchData)`
      )
      createTable.run()
    } catch (err) {
      console.error('CreateTable 중 오류 발생:', err)
    }
  }

  /**
   * [비동기] Total_Timeline_Search 테이블 생성
   */
  async asyncCreateTimeTable(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      try {
        // Total_Timeline table 생성 INTEGER PRIMARY KEY, t_main 컬럼 추가함
        const createTimeTable = this.kapedb.prepare(
          `CREATE TABLE IF NOT EXISTS Total_Timeline (t_id INTEGER PRIMARY KEY AUTOINCREMENT, t_dateTime text,t_attribute text,  t_timelineCategory text, t_category text, t_type text, t_itemName text, t_itemValue text,t_tableName text,t_tableId INTEGER, category_1  text,category_2  text,category_3  text, t_main INTEGER DEFAULT 0)`
        )
        createTimeTable.run()

        // [1] _DateTime 관련 index 생성, idx_DateTime_Total_Timeline
        // 타임라인 정보 출력할 때, _DateTime을 기준으로 인덱스를 생성하는 것
        const createIndex = this.kapedb.prepare(
          `CREATE INDEX IF NOT EXISTS idx_DateTime1_Total_Timeline ON Total_Timeline (t_dateTime, t_main, category_1, category_2, category_3)`
        )
        createIndex.run()

        const createIndex1 = this.kapedb.prepare(
          `CREATE INDEX IF NOT EXISTS idx_DateTime2_Total_Timeline ON Total_Timeline (t_dateTime, category_1, category_2, category_3)`
        )
        createIndex1.run()

        // [2] Join을 위한 (_TableName 과 _Table_id) index 생성, idx_Tbl_Id_Total_Timeline
        const createIndex2 = this.kapedb.prepare(
          `CREATE INDEX IF NOT EXISTS idx_Tbl_Id_Total_Timeline ON Total_Timeline (t_main, t_tableName, t_tableId)`
        )
        createIndex2.run()

        // [3] idx_depth_Total_Timeline
        const createIndex3 = this.kapedb.prepare(
          `CREATE INDEX IF NOT EXISTS idx_depth_Total_Timeline ON Total_Timeline (t_main, category_1, category_2, category_3)`
        )
        createIndex3.run()

        // [4] idx_DateTimeOnly_Total_Timeline
        const createIndex4 = this.kapedb.prepare(
          `CREATE INDEX IF NOT EXISTS idx_DateTimeOnly_Total_Timeline ON Total_Timeline (t_dateTime)`
        )
        createIndex4.run()

        // [5] idx_DateTimeMain_Total_Timeline
        const createIndex5 = this.kapedb.prepare(
          `CREATE INDEX IF NOT EXISTS idx_DateTimeMain_Total_Timeline ON Total_Timeline (t_dateTime, t_main)`
        )
        createIndex5.run()

        //////////////////////////////////////////////////////////////////////////////////////////
        // [5] Total_Timeline table 생성 INTEGER PRIMARY KEY, t_main 컬럼 추가함
        const createTimeTableTmp = this.kapedb.prepare(
          `CREATE TABLE IF NOT EXISTS Total_Timeline_Tmp (t_id INTEGER PRIMARY KEY AUTOINCREMENT, t_dateTime text,t_attribute text,  t_timelineCategory text, t_category text, t_type text, t_itemName text, t_itemValue text,t_TableName text,t_TableId INTEGER, category_1  text,category_2  text,category_3  text, t_main INTEGER DEFAULT 0)`
        )
        createTimeTableTmp.run()

        // [6] idx_DateTimeOnly_Total_Timeline_Tmp
        const createIndexTmp5 = this.kapedb.prepare(
          `CREATE INDEX IF NOT EXISTS idx_DateTimeOnly_Total_Timeline_Tmp ON Total_Timeline_Tmp (t_dateTime, category_1, category_2, category_3)`
        )
        createIndexTmp5.run()

        // [7] Total_Timeline_Short table 생성
        const createTimeTableShort = this.kapedb.prepare(
          `CREATE TABLE IF NOT EXISTS Total_Timeline_Short (t_dateTime text, category_1 text, c_count INTEGER, detail text, primary key (t_dateTime, category_1))`
        )
        createTimeTableShort.run()

        // [8] Total_Timeline_Short2 table 생성
        const createTimeTableShort2 = this.kapedb.prepare(
          `CREATE TABLE IF NOT EXISTS Total_Timeline_Short2 (t_dateTime text, category_1 text, category_2 text, c_count INTEGER, primary key (t_dateTime, category_1, category_2))`
        )
        createTimeTableShort2.run()

        // [9] idx_Total_Timeline_Short2
        const createIndexTmp6 = this.kapedb.prepare(
          `CREATE INDEX IF NOT EXISTS idx_Total_Timeline_Short2 ON Total_Timeline_Short2 (t_dateTime, category_1)`
        )
        createIndexTmp6.run()
        //////////////////////////////////////////////////////////////////////////////////////////////

      ////////////////////////////////////////////////////////////////////////////// add 20240205
      // [10] Total_Timeline_GotoInfo 테이블 생성, 타임라인 차트에서 기간 및 범주로 select되어진 데이터 set에서 어느 페이지에 존재하는지 확인하기 위한 테이블
      const createTimeTableGotoInfo = this.kapedb.prepare(
        `CREATE TABLE IF NOT EXISTS Total_Timeline_GotoInfo (temp_t_id INTEGER PRIMARY KEY AUTOINCREMENT, t_id integer, t_dateTime text, category_1  text,category_2  text,category_3  text)`
      )
      createTimeTableGotoInfo.run()

      // [11] idx_DateTimeOnly_Total_Timeline_Tmp
      const createIndexGotoInfo = this.kapedb.prepare(
        `CREATE INDEX IF NOT EXISTS idx_DateTimeOnly_Total_Timeline_GotoInfo ON Total_Timeline_GotoInfo (t_dateTime, category_1, category_2, category_3)`
      )
      createIndexGotoInfo.run()

      // [12] Total_Timeline_ShortTemp table 생성 ( 기간 또는 범주로 조회한 결과를 timeline chart로 보기 위한 테이블 20240205)
      // 이것을 만들기 위해서는 기존에 생성되어 있는 Total_Timeline_Short2를 재사용한다.
      const createTimeTableShortTemp = this.kapedb.prepare(
        `CREATE TABLE IF NOT EXISTS Total_Timeline_ShortTemp (t_dateTime text, category_1 text, c_count INTEGER, detail text, primary key (t_dateTime, category_1))`
      )
      createTimeTableShortTemp.run()
      ///////////////////////////////////////////////////////////////////////////// end 20240205

      } catch (err) {
        console.error('CreateTimelineTable 중 오류 발생:', err)
        reject()
      } finally {
        //console.log('done asyncCreateTimeTable()')
        resolve()
      }
    })
  }

  /**
   * 동기방식으로 타임테이블 생성 함수
   * 20240104_col_rename
   */
  async syncCreateTimeTable() {
    try {
      // Total_Timeline table 생성 INTEGER PRIMARY KEY, t_main 컬럼 추가함
      const createTimeTable = this.kapedb.prepare(
        `CREATE TABLE IF NOT EXISTS Total_Timeline (t_id INTEGER PRIMARY KEY AUTOINCREMENT, t_dateTime text,t_attribute text,  t_timelineCategory text, t_category text, t_type text, t_itemName text, t_itemValue text,t_tableName text,t_tableId INTEGER, category_1  text,category_2  text,category_3  text, t_main INTEGER DEFAULT 0)`
      )
      createTimeTable.run()

      // [1] _DateTime 관련 index 생성, idx_DateTime_Total_Timeline
      // 타임라인 정보 출력할 때, _DateTime을 기준으로 인덱스를 생성하는 것
      const createIndex = this.kapedb.prepare(
        `CREATE INDEX IF NOT EXISTS idx_DateTime1_Total_Timeline ON Total_Timeline (t_dateTime, t_main, category_1, category_2, category_3)`
      )
      createIndex.run()

      const createIndex1 = this.kapedb.prepare(
        `CREATE INDEX IF NOT EXISTS idx_DateTime2_Total_Timeline ON Total_Timeline (t_dateTime, category_1, category_2, category_3)`
      )
      createIndex1.run()

      // [2] Join을 위한 (_TableName 과 _Table_id) index 생성, idx_Tbl_Id_Total_Timeline
      const createIndex2 = this.kapedb.prepare(
        `CREATE INDEX IF NOT EXISTS idx_Tbl_Id_Total_Timeline ON Total_Timeline (t_main, t_tableName, t_tableId)`
      )
      createIndex2.run()

      // [3] idx_depth_Total_Timeline
      const createIndex3 = this.kapedb.prepare(
        `CREATE INDEX IF NOT EXISTS idx_depth_Total_Timeline ON Total_Timeline (t_main, category_1, category_2, category_3)`
      )
      createIndex3.run()

      // [4] idx_DateTimeOnly_Total_Timeline
      const createIndex4 = this.kapedb.prepare(
        `CREATE INDEX IF NOT EXISTS idx_DateTimeOnly_Total_Timeline ON Total_Timeline (t_dateTime)`
      )
      createIndex4.run()

      // [5] idx_DateTimeMain_Total_Timeline
      const createIndex5 = this.kapedb.prepare(
        `CREATE INDEX IF NOT EXISTS idx_DateTimeMain_Total_Timeline ON Total_Timeline (t_dateTime, t_main)`
      )
      createIndex5.run()

      //////////////////////////////////////////////////////////////////////////////////////////
      // [5] Total_Timeline table 생성 INTEGER PRIMARY KEY, t_main 컬럼 추가함
      const createTimeTableTmp = this.kapedb.prepare(
        `CREATE TABLE IF NOT EXISTS Total_Timeline_Tmp (t_id INTEGER PRIMARY KEY AUTOINCREMENT, t_dateTime text,t_attribute text,  t_timelineCategory text, t_category text, t_type text, t_itemName text, t_itemValue text,t_TableName text,t_TableId INTEGER, category_1  text,category_2  text,category_3  text, t_main INTEGER DEFAULT 0)`
      )
      createTimeTableTmp.run()

      // [6] idx_DateTimeOnly_Total_Timeline_Tmp
      const createIndexTmp5 = this.kapedb.prepare(
        `CREATE INDEX IF NOT EXISTS idx_DateTimeOnly_Total_Timeline_Tmp ON Total_Timeline_Tmp (t_dateTime, category_1, category_2, category_3)`
      )
      createIndexTmp5.run()

      // [7] Total_Timeline_Short table 생성
      const createTimeTableShort = this.kapedb.prepare(
        `CREATE TABLE IF NOT EXISTS Total_Timeline_Short (t_dateTime text, category_1 text, c_count INTEGER, detail text, primary key (t_dateTime, category_1))`
      )
      createTimeTableShort.run()

      // [8] Total_Timeline_Short2 table 생성
      const createTimeTableShort2 = this.kapedb.prepare(
        `CREATE TABLE IF NOT EXISTS Total_Timeline_Short2 (t_dateTime text, category_1 text, category_2 text, c_count INTEGER, primary key (t_dateTime, category_1, category_2))`
      )
      createTimeTableShort2.run()

      // [9] idx_Total_Timeline_Short2
      const createIndexTmp6 = this.kapedb.prepare(
        `CREATE INDEX IF NOT EXISTS idx_Total_Timeline_Short2 ON Total_Timeline_Short2 (t_dateTime, category_1)`
      )
      createIndexTmp6.run()

      ////////////////////////////////////////////////////////////////////////////// add 20240205
      // [10] Total_Timeline_GotoInfo 테이블 생성, 타임라인 차트에서 기간 및 범주로 select되어진 데이터 set에서 어느 페이지에 존재하는지 확인하기 위한 테이블
      const createTimeTableGotoInfo = this.kapedb.prepare(
        `CREATE TABLE IF NOT EXISTS Total_Timeline_GotoInfo (temp_t_id INTEGER PRIMARY KEY AUTOINCREMENT, t_id integer, t_dateTime text, category_1  text,category_2  text,category_3  text)`
      )
      createTimeTableGotoInfo.run()

      // [11] idx_DateTimeOnly_Total_Timeline_Tmp
      const createIndexGotoInfo = this.kapedb.prepare(
        `CREATE INDEX IF NOT EXISTS idx_DateTimeOnly_Total_Timeline_GotoInfo ON Total_Timeline_GotoInfo (t_dateTime, category_1, category_2, category_3)`
      )
      createIndexGotoInfo.run()

      // [12] Total_Timeline_ShortTemp table 생성 ( 기간 또는 범주로 조회한 결과를 timeline chart로 보기 위한 테이블 20240205)
      // 이것을 만들기 위해서는 기존에 생성되어 있는 Total_Timeline_Short2를 재사용한다.
      const createTimeTableShortTemp = this.kapedb.prepare(
        `CREATE TABLE IF NOT EXISTS Total_Timeline_ShortTemp (t_dateTime text, category_1 text, c_count INTEGER, detail text, primary key (t_dateTime, category_1))`
      )
      createTimeTableShortTemp.run()
      ////////////////////////////////////////////////////////////////////////////// end of 20240205

      ////////////////////////////////////////////////////////////////////////////////////////
    } catch (err) {
      console.error('CreateTable 중 오류 발생:', err)
    }
  }

  /**
   * 동기방식으로 북마크테이블 생성 함수
   * 20240104_col_rename
   */
  async syncCreateBookMarkTable() {
    try {
      // 북마크 상세 정보 테이블
      const createBookMarkInfoTable = this.kapedb.prepare(
        `CREATE TABLE IF NOT EXISTS BookMark_Info (b_id INTEGER PRIMARY KEY AUTOINCREMENT, b_name text unique, b_color text)`
      )
      createBookMarkInfoTable.run()

      const insertBookMarkInfoTable1 = this.kapedb.prepare(
        `insert OR IGNORE into BookMark_Info (b_id , b_name , b_color ) values (1, '북마크_1', '#FF3333')`
      )
      insertBookMarkInfoTable1.run()

      const insertBookMarkInfoTable2 = this.kapedb.prepare(
        `insert OR IGNORE into BookMark_Info (b_id , b_name , b_color ) values (2, '북마크_2', '#FF9933')`
      )
      insertBookMarkInfoTable2.run()

      const insertBookMarkInfoTable3 = this.kapedb.prepare(
        `insert OR IGNORE into BookMark_Info (b_id , b_name , b_color ) values (3, '북마크_3', '#FFFF33')`
      )
      insertBookMarkInfoTable3.run()

      const insertBookMarkInfoTable4 = this.kapedb.prepare(
        `insert OR IGNORE into BookMark_Info (b_id , b_name , b_color ) values (4, '북마크_4', '#33FF33')`
      )
      insertBookMarkInfoTable4.run()

      const insertBookMarkInfoTable5 = this.kapedb.prepare(
        `insert OR IGNORE into BookMark_Info (b_id , b_name , b_color ) values (5, '북마크_5', '#3399FF')`
      )
      insertBookMarkInfoTable5.run()

      const insertBookMarkInfoTable6 = this.kapedb.prepare(
        `insert OR IGNORE into BookMark_Info (b_id , b_name , b_color ) values (6, '북마크_6', '#3333FF')`
      )
      insertBookMarkInfoTable6.run()

      const insertBookMarkInfoTable7 = this.kapedb.prepare(
        `insert OR IGNORE into BookMark_Info (b_id , b_name , b_color ) values (7, '북마크_7', '#9933FF')`
      )
      insertBookMarkInfoTable7.run()

      // 북마크와 각각의 테이블 연관관계 테이블
      // 해당 테이블에서 북마크 정보 삭제가 되면, 테이블과 id로 데이터가 존재하지 않을 경우, BookMark_mapper_Sum 테이블에서 해당 자료 삭제를 꼭 해줘야 함
      const createBookMarkMapperTable = this.kapedb.prepare(
        `CREATE TABLE IF NOT EXISTS BookMark_mapper (b_id integer, b_tableName text, b_tableId integer, category_1 text, category_2 text, category_3 text, will_delete integer DEFAULT 0, primary key (b_id, b_tableName, b_tableId ))`
      )
      createBookMarkMapperTable.run()

      // [1] index1 BookMarkMapper, idx_Bk_Id_BookMark_Mapper
      const createBIndex = this.kapedb.prepare(
        `CREATE INDEX IF NOT EXISTS idx_Bk_Id_BookMark_Mapper ON BookMark_mapper (b_id)`
      )
      createBIndex.run()

      // [2] index2 BookMarkMapper, idx_Bk_Id_Range_BookMark_Mapper
      const createBIndex2 = this.kapedb.prepare(
        `CREATE INDEX IF NOT EXISTS idx_Bk_Id_Range_BookMark_Mapper ON BookMark_mapper (b_id, category_1, category_2, category_3)`
      )
      createBIndex2.run()

      // [3] index3 BookMarkMapper, idx_Tbl_Id_BookMark_Mapper 20231109->UNIQUE INDEX로 변경 --> 북마크 ID와 아트팩트는 1:1 mapping이다...
      // 2023.11.15 북마크와 아트팩트는 M : 1이 된다..그래서 unique를 뺀다
      // 따라서, 타임라인에 같은 tableName과 idx에 북마크가 설정이 되면, 해당 모든 타임라인 데이터가 북마크가 되게 보여주어야 함
      const createBIndex3 = this.kapedb.prepare(
        `CREATE INDEX IF NOT EXISTS idx_Tbl_Id_BookMark_Mapper ON BookMark_mapper (b_tableName, b_tableId)`
      )
      createBIndex3.run()

      // [4] index4 BookMarkMapper, idx_Tbl_name_BookMark_Mapper
      const createBIndex4 = this.kapedb.prepare(
        `CREATE INDEX IF NOT EXISTS idx_Tbl_name_BookMark_Mapper ON BookMark_mapper (b_tableName)`
      )
      createBIndex4.run()
    } catch (err) {
      console.error('CreateBookMarkTable 중 오류 발생:', err)
    }
  }

  /**
   * 동기방식으로 CASE_INFO 테이블 생성 함수
   * 초기 ART구동으로 통합테이블 생성시 동작하는 것
   * 테이블을 생성하고, default row인 통합테이블 생성 날짜 정보를 입력하게 한다
   * 20240104_col_rename
   */
  async syncCreateCaseInfoTable() {
    try {
      // CASE 상세 정보 테이블
      const createCaseInfoTable = this.kapedb.prepare(
        `CREATE TABLE IF NOT EXISTS Case_Info (key	TEXT, value	TEXT, PRIMARY KEY(key))`
      )
      createCaseInfoTable.run()

      /////////////////////////////////////////////////////////////////
      /////////////////////////////////////////////////////////////////
      // 현재 날짜와 시간을 얻음
      const now = new Date()

      // 년, 월, 일, 시, 분, 초를 가져옴
      const year = now.getFullYear() // 년도
      const month = ('0' + (now.getMonth() + 1)).slice(-2) // 월 (0부터 시작하므로 +1, 두 자리로 표시)
      const day = ('0' + now.getDate()).slice(-2) // 일 (두 자리로 표시)
      const hours = ('0' + now.getHours()).slice(-2) // 시간 (24시간 표시, 두 자리로 표시)
      const minutes = ('0' + now.getMinutes()).slice(-2) // 분 (두 자리로 표시)
      const seconds = ('0' + now.getSeconds()).slice(-2) // 초 (두 자리로 표시)

      // YYYY/MM/DD hh:mm:ss 형태로 날짜와 시간을 조합
      const formattedDateTime = `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`

      //insert into ... on deplicate key update 대신에 sqlite3에서는 insert or replace into를 사용함
      const insertCreateDateInfo = this.kapedb.prepare(`insert or replace into Case_Info (key, value) values (?, ?)`)
      insertCreateDateInfo.run('first_create_datetime', formattedDateTime)

      // 무조건 생성이 되는 정보 triage key add 2024.02.23
      const insertCreateDateInfoTriageInfo = this.kapedb.prepare(`insert or replace into Case_Info (key, value) values ('triage', '')`)
      insertCreateDateInfoTriageInfo.run()
      //////////////////////////////////////////////////////////////////
    } catch (err) {
      console.error('CreateCaseInfoTable 중 오류 발생:', err)
    }
  }

  /**
   * [비동기처리] 개별 테이블에서 테이터를 select하여, 통합테이블과 타임라인테이블에 insert하는것
   * @param data : 테이블 정보 객체
   * @returns void
   */
  async eachInsert(data: any): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      // 함수 호출과 데이터 검증을 위한 디버깅 코드
      //console.log('eachInsert() in : ', data);
      //console.time('time002');            // for 테이블마다 소요 시간 알기위해

      let offset = 0
      let cnt = 0

      // 트랜잭션 시작
      this.kapedb.exec('BEGIN TRANSACTION')

      try {
        /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        //if (data['tablename'] === 'NLT_UsnJrnl' || data['tablename'] === 'AutomaticDestinations') // 기능 테스트를 위한 디버깅을 위한 코드
        /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        {
          // for 개별 테스트 debuging용 코드########################
          while (true) {
            // 원본 테이블에서 데이터 선택
            //const sourceTable = this.kapedb.prepare(`SELECT * FROM NLT_LogFile LIMIT ? OFFSET ?`);
            const sourceTable = this.kapedb.prepare(`SELECT * FROM ${data['tablename']} LIMIT ? OFFSET ?`)
            const dataToCopy = sourceTable.all(this.pageSize, offset)

            if (dataToCopy.length === 0) {
              // 더이상 데이터가 없음
              break
            }

            for (const row of dataToCopy) {
              ////////////////////////////////////////////////////////////////////////////
              // Timeline 테이블에 데이터 insert //////////////////////////////////////

              //  TimeTable의 item value값 설정하는 것
              let logValue = ''
              const nullLogValue = null
              if (data['timeNoInfo']) {
                const timelineMainTable = this.kapedb.prepare(this.timeLineInsertSQL) // for insert main

                timelineMainTable.run(
                  nullLogValue,
                  nullLogValue,
                  nullLogValue,
                  nullLogValue,
                  nullLogValue,
                  nullLogValue,
                  nullLogValue,
                  data['tablename'], // 참조 테이블 명
                  row.a_id,
                  row.category_1,
                  row.category_2,
                  row.category_3,
                  1 // t_main is true
                )
              } else {
                // 참조 컬럼 정보 생성
                const refList = data['_timeRefVal']
                const refListLen = refList.length
                let idx = 0

                for (const item of refList) {
                  idx++
                  if (idx < refListLen) {
                    logValue += row[item] + '&'
                  } else {
                    logValue += row[item]
                  }
                }

                const timeColNameList = data['timeColName']

                for (const timerow of timeColNameList) {
                  // main 컬럼인지 확인
                  if (data['mainColName'] === timerow) {
                    // Main인 경우는 단지 t_main에 1
                    // _Datetime값이 없는 경우, null로 입력 --> timeline에서는 불필요 데이터로 인식됨 삭제
                    if ((row[timerow] ? row[timerow].trim() : '').length === 0) {
                      row[timerow] = null // 반드시 넣어야 한다. 그렇지 않으면 검색에서 범주 정보가 나오지 않게 된다.
                      // 따라서, 타임라인에 대한 조사를 할때는 _Datetime이 NULL인 것은 빼야 한다.
                    }

                    const timelineMainTable = this.kapedb.prepare(this.timeLineInsertSQL) // for insert main

                    // 아래의 내용은 하드 코딩 밖에 할 수 없음
                    if (data['tablename'] === 'NLT_UsnJrnl') {
                      timelineMainTable.run(
                        row[timerow],
                        row.EventInfo, // 2023.10.24 대검요청 해당 컬럼에 EventInfo 정보 저장(컬럼 참조 정보)
                        data['timeCategory'],
                        data['_timeCategory'],
                        data['_timeType'],
                        data['_timeRefName'],
                        logValue,
                        data['tablename'], // 참조 테이블 명
                        row.a_id,
                        row.category_1,
                        row.category_2,
                        row.category_3,
                        1 // t_main is true
                      )
                    } else {
                      timelineMainTable.run(
                        row[timerow],
                        timerow,
                        data['timeCategory'],
                        data['_timeCategory'],
                        data['_timeType'],
                        data['_timeRefName'],
                        logValue,
                        data['tablename'], // 참조 테이블 명
                        row.a_id,
                        row.category_1,
                        row.category_2,
                        row.category_3,
                        1 // t_main is true
                      )
                    }
                  } // end of Main 인 경우 insert
                  else {
                    // if(data['tablename'] === 'NLT_UsnJrnl') 처리가 없는 이유
                    // NLT_UsnJrnl 테이블은 레코드가 메인 하나만 있어서 추가 코드 필요 없음

                    // Main이 아닌 경우는 단지 t_main에 0
                    if ((row[timerow] ? row[timerow].trim() : '').length !== 0) {
                      const timelineMainTable = this.kapedb.prepare(this.timeLineInsertSQL) // for insert
                      timelineMainTable.run(
                        row[timerow],
                        timerow,
                        data['timeCategory'],
                        data['_timeCategory'],
                        data['_timeType'],
                        data['_timeRefName'],
                        logValue,
                        data['tablename'], // 참조 테이블 명
                        row.a_id,
                        row.category_1,
                        row.category_2,
                        row.category_3,
                        0 // t_main is true
                      )
                    } // 데이터가 존재하는 경우 insert하는 것
                  } // end of Main이 아닌 경우 insert
                } // end of for loop
              } // end of timeNoInfo if

              ////////////////////////////////////////////////////////////////////////////
              // Total_Search 테이블에 데이터 insert //////////////////////////////////////

              // Tatal Search에 참조 컬럼 정보 생성
              const totalRefColList = data['_searchCol']
              const totalRefColListLen = totalRefColList.length
              let totalIdx = 0
              let searchData = ''
              for (const searchItem of totalRefColList) {
                totalIdx++
                if (totalIdx < totalRefColListLen) {
                  searchData += (row[searchItem] ? row[searchItem].trim() : '') + '    '
                } else {
                  searchData += row[searchItem] ? row[searchItem].trim() : ''
                }
              }
              //////////////////////////////////////// end of searchData create

              // Total_Seach에 insert한 SQL
              const totalSearch = this.kapedb.prepare(this.totalSearchInsertSQL)

              totalSearch.run(data['tablename'], row.a_id, searchData)

              cnt++

              // for debuging TODO
              // if(!(cnt%100000)) {
              //     console.log(`[${data['tablename']}]cnt:`, cnt);
              // }

              ////////////////////////////////////////////////////////////////////////////// End of Total_Search
            } // Paging단위로 select 한 결과에 대한 end of for loop

            // for next page
            offset += this.pageSize
          } // end of while loop
        } //테스트용 if문 나중에는 없애야 한다

        // 트랜잭션 커밋
        this.kapedb.exec('COMMIT')

        //console.log(`데이터 복사 완료(${data['tablename']})`, cnt);
      } catch (err) {
        this.kapedb.exec('ROLLBACK')
        console.error('eachInsert 중 오류 발생:', err)
        reject()
      } finally {
        //console.timeEnd('time002');           // 개별 DB 변경된 내용 적용시간을 확인하기 위해 사용  // for 테이블마다 소요 시간 알기위해
        resolve()
      }
    })
  }

  /**
   * 통합DB를 생성할 때, UTC0 -> UTC 9으로 변경하는 코드
   * @param utcString : UTC 0 의 값
   *        iTimeZone : 변경할 타임존 숫자
   * @returns UTC9 의 시간 string
   */
  convertUTCtoUTC9(utcString: string, iTimeZone: number): string {
    // UTC 시간을 Date 객체로 변환
    const utcTime = new Date(utcString)

    // UTC+9 시간으로 변경
    const utcPlus9Time = new Date(utcTime.getTime() + iTimeZone * 60 * 60 * 1000)

    // // 변경된 시간을 문자열로 변환 (ISO 8601 형식)
    // const utcPlus9TimeStr = utcPlus9Time.toISOString() // UTC 시간대를 기준으로 날짜와 시간을 문자열로 변환하기에 문제가 됨
    // return utcPlus9TimeStr.replace('T', ' ').slice(0, 19)

    // 현지 시간대의 연, 월, 일, 시, 분, 초를 얻기
    const year = utcPlus9Time.getFullYear()
    const month = (utcPlus9Time.getMonth() + 1).toString().padStart(2, '0') // 월은 0부터 시작
    const day = utcPlus9Time.getDate().toString().padStart(2, '0')
    const hours = utcPlus9Time.getHours().toString().padStart(2, '0')
    const minutes = utcPlus9Time.getMinutes().toString().padStart(2, '0')
    const seconds = utcPlus9Time.getSeconds().toString().padStart(2, '0')

    // 현지 시간대의 날짜 문자열로 반환
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
  }

  /**
   * 20240104_col_rename
   * @param data : 각각의 아트팩트 테이블에 대한 정보
   */
  syncEachTimeUpdate(data: any, listener: (_status: { state: string; percent: number }) => void) {
    let offset = 0
    let cnt = 0
    let updatecount = 0

    // 트랜잭션 시작
    this.kapedb.exec('BEGIN TRANSACTION')

    try {
      //if (data['tablename'] === 'NLT_UsnJrnl' || data['tablename'] === 'AutomaticDestinations')
      // 통합 테이블에 처리할 테이블이 존재하는지르 검사하는 로직
      const tableName = data['tablename']
      const tableExistsQuery = this.kapedb.prepare(
        "SELECT count(*) as count FROM sqlite_master WHERE type='table' AND name=?"
      )
      const tableExists = tableExistsQuery.get(tableName)

      // 테이블 존재 유무 체크
      if (tableExists.count > 0) {
        // 테이블이 존재할 경우 처리하는 것

        //listener({ state: `${data['tablename']} timeUTCConvertFlag :: ` + data['timeUTCConvertFlag'], percent: 991 }) // for log

        //////////////////////////////////
        // UTC0 -> UTC9 으로 변경하여 모든 row에 반영하게 한다
        //////////////////////////////////
        // timeUTCConvertFlag 필드 값이 true이면 UTC 0 -> UTC 9으로 변환 모듈이 진행이 됨
        // 만약 변환을 진행하지 않을려면, 해당 필드값을 false로 하면 진행하지 않게 됨
        if (data['timeUTCConvertFlag']) {
          while (true) {
            const sourceTable = this.kapedb.prepare(`SELECT * FROM ${data['tablename']} LIMIT ? OFFSET ?`)
            const dataToCopy = sourceTable.all(this.CreateDBpageSize, offset)

            if (dataToCopy.length === 0) {
              // 더이상 데이터가 없음
              break
            }

            // TableInfo.json의 파일에서 timeColNameUTC 항목에 존재하는 타임 필드는 모두 UTC 0 이므로 이걸 UTC 9으로 변경한다
            // 각각의 추출된 데이터에서 시간 값을 변환해 준다. 
            // [중요] 변환할 항목이 없을 경우, 해당 컬럼을 [] 로 설정해야 한다.
            if(data['timeColNameUTC'].length !== 0 ) {
              for (const row of dataToCopy) {
                const timeColNameList = data['timeColNameUTC']
                const idColName = 'a_id'
  
                let updateString = ''
                let updateCount = 0
                for (const timerow of timeColNameList) {

                  updateCount++
  
                  const orgTime = row[timerow]
                  let convertedTime: string | null = ''
                  if (orgTime !== null && orgTime !== '' && orgTime !== undefined) {
                    convertedTime = this.convertUTCtoUTC9(orgTime, this.localTimezone)
                  } else if (orgTime === null) {
                    convertedTime = null
                  }
  
                  //row[timerow] = convertedTime
  
                  // 데이터베이스 업데이트 쿼리
                  if (updateCount === 1) {
                    updateString += `\"${timerow}\" = '${convertedTime}'`
                  } else {
                    updateString += `, \"${timerow}\" = '${convertedTime}'`
                  }
                  // const updateQuery = `UPDATE ${data['tablename']} SET ${timerow} = ? WHERE ${idColName} = ?`
                  // const updateTable = this.kapedb.prepare(updateQuery)
                  // updateTable.run(convertedTime, row[idColName])
                  cnt++
                } // end of inner for lloop
  
                const updateQuery = `UPDATE ${data['tablename']} SET ${updateString} WHERE ${idColName} = ?`
                // if (updateCount === 1) {
                //   // for log
                //   listener({ state: `${data['tablename']} UPDATE :: ` + updateQuery, percent: 991 })
                // }
                const updateTable = this.kapedb.prepare(updateQuery)
                updateTable.run(row[idColName])
  
                updatecount++
              } // end of outer for loop Paging단위로 select 한 결과에 대한 UTC 9 처리 모듈
            }
            
            // for next page
            offset += this.CreateDBpageSize
          } // end of while

        } // End of Time컬럼 존재여부 =======> UTC0 -> UTC9으로 변경하는 모듈

      } // end of if 해당 테이블이 존재하여야 수행이 되게 하였음

      // 트랜잭션 커밋
      this.kapedb.exec('COMMIT')

      //console.log(`데이터 복사 완료(${data['tablename']})`, cnt)
      listener({
        state: `${data['tablename']} syncEachTimeUpdate:: cnt:` + cnt.toString() + ', u:' + updatecount.toString(),
        percent: 991
      })
    } catch (err) {
      this.kapedb.exec('ROLLBACK')
      console.error('syncEachTimeUpdate 중 오류 발생:', err)
      listener({
        state: `${data['tablename']} ##### syncEachTimeUpdate::err:: ` + (err as Error).message,
        percent: 991
      })
    }
  }

  /**
   * 20240104_col_rename
   * @param : void
   * RECmd_Batch_SPO_All_Execute_Command_Output 테이블의 install time을 수정
   */
  syncEachTimeUpdate_InstallTime(listener: (_status: { state: string; percent: number }) => void) {
    let offset = 0
    let cnt = 0
    let updatecount = 0

    // 트랜잭션 시작
    this.kapedb.exec('BEGIN TRANSACTION')

    try {
      // 통합 테이블에 처리할 테이블이 존재하는지르 검사하는 로직
      const tableName = 'RECmd_Batch_SPO_All_Execute_Command_Output'
      const tableExistsQuery = this.kapedb.prepare(
        "SELECT count(*) as count FROM sqlite_master WHERE type='table' AND name=?"
      )
      const tableExists = tableExistsQuery.get(tableName)

      if (tableExists.count > 0) {
        // 테이블이 존재할 경우 처리하는 것

        listener({
          state: `RECmd_Batch_SPO_All_Execute_Command_Output syncEachTimeUpdate:: start`,
          percent: 991
        })

        //////////////////////////////////
        // time컬럼이 존재하면 UTC0 -> UTC9 으로 변경하여 모든 DB에 반영하게 한다
        //////////////////////////////////

        while (true) {
          const sourceTable = this.kapedb.prepare(`select a_id, ValueData 
                                    from RECmd_Batch_SPO_All_Execute_Command_Output
                                      where ValueName = ?
                                      LIMIT ? OFFSET ?`)
          const dataToCopy = sourceTable.all('InstallTime', this.CreateDBpageSize, offset)

          listener({
            state:
              `RECmd_Batch_SPO_All_Execute_Command_Output syncEachTimeUpdate:: select , ` +
              dataToCopy.length.toString(),
            percent: 991
          })

          if (dataToCopy.length === 0) {
            // 더이상 데이터가 없음
            break
          }

          for (const row of dataToCopy) {
            const timeColNameList = ['ValueData']
            const idColName = 'a_id'

            let updateString = ''
            let updateCount = 0
            for (const timerow of timeColNameList) {
              updateCount++

              const orgTime = row[timerow]
              let convertedTime: string | null = ''
              if (orgTime !== null && orgTime !== '') {
                convertedTime = this.convertUTCtoUTC9(orgTime, this.localTimezone)
              } else if (orgTime === null) {
                convertedTime = null
              }

              //row[timerow] = convertedTime

              // 데이터베이스 업데이트 쿼리
              if (updateCount === 1) {
                updateString += `\"${timerow}\" = '${convertedTime}'`
              } else {
                updateString += `, \"${timerow}\" = '${convertedTime}'`
              }
              // const updateQuery = `UPDATE ${data['tablename']} SET ${timerow} = ? WHERE ${idColName} = ?`
              // const updateTable = this.kapedb.prepare(updateQuery)
              // updateTable.run(convertedTime, row[idColName])
              cnt++
            } // end of inner for lloop

            const updateQuery = `UPDATE RECmd_Batch_SPO_All_Execute_Command_Output SET ${updateString} WHERE ${idColName} = ?`
            // if (updateCount === 1) {
            //   // for log
            //   listener({ state: `${data['tablename']} UPDATE :: ` + updateQuery, percent: 991 })
            // }
            const updateTable = this.kapedb.prepare(updateQuery)
            updateTable.run(row[idColName])

            updatecount++
          } // end of outer for loop Paging단위로 select 한 결과에 대한 처리

          // for next page
          offset += this.CreateDBpageSize
        } // end of while
      } // end of if 해당 테이블이 존재하여야 수행이 되게 하였음

      // 트랜잭션 커밋
      this.kapedb.exec('COMMIT')

      //console.log(`데이터 복사 완료(${data['tablename']})`, cnt)
      listener({
        state:
          `RECmd_Batch_SPO_All_Execute_Command_Output syncEachTimeUpdate:: cnt:` +
          cnt.toString() +
          ', u:' +
          updatecount.toString(),
        percent: 991
      })
    } catch (err) {
      this.kapedb.exec('ROLLBACK')
      console.error('syncEachTimeUpdate 중 오류 발생:', err)
      listener({
        state: `RECmd_Batch_SPO_All_Execute_Command_Output ##### syncEachTimeUpdate::err:: ` + (err as Error).message,
        percent: 991
      })
    }
  }

  /**
   * 20240104_col_rename
   * @param data : 각각의 아트팩트 테이블에 대한 정보
   */
  syncEachInsert(data: any, listener: (_status: { state: string; percent: number }) => void) {
    let offset = 0
    let cnt = 0

    // 트랜잭션 시작
    this.kapedb.exec('BEGIN TRANSACTION')

    try {
      //if (data['tablename'] === 'NLT_UsnJrnl' || data['tablename'] === 'AutomaticDestinations') // 기능 단위 테스트를 위한 코드, 특정 테이블로 체크하기 위한 것
      // 통합 테이블에 처리할 테이블이 존재하는지르 검사하는 로직
      const tableName = data['tablename']
      const tableExistsQuery = this.kapedb.prepare(
        "SELECT count(*) as count FROM sqlite_master WHERE type='table' AND name=?"
      )
      const tableExists = tableExistsQuery.get(tableName)

      if (tableExists.count > 0) {
        // 테이블이 존재할 경우 처리하는 것

        // 윗 테이블이 존재하면, 수행하게 하고 그렇지 않으면, skip 하게 하였다
        // for 개별 테스트 debuging용 코드########################
        while (true) {
          // 원본 테이블에서 데이터 선택

          //const sourceTable = this.kapedb.prepare(`SELECT * FROM NLT_LogFile LIMIT ? OFFSET ?`);
          const sourceTable = this.kapedb.prepare(`SELECT * FROM ${data['tablename']} LIMIT ? OFFSET ?`)
          const dataToCopy = sourceTable.all(this.CreateDBpageSize, offset)

          if (dataToCopy.length === 0) {
            // 더이상 데이터가 없음
            break
          }

          for (const row of dataToCopy) {
            ////////////////////////////////////////////////////////////////////////////
            // Timeline 테이블에 데이터 insert //////////////////////////////////////

            //  TimeTable의 item value값 설정하는 것
            let logValue = ''
            const nullLogValue = null

            // 주요 타임 컬럼 정보를 대검에서 정의하지 않는 경우
            // 타임라인에 다른 컬럼에는 NULL로 설정하게 한다. json config에서 다른 부분을 참조하지 않게 된다.
            if (data['timeNoInfo']) {
              //const timelineMainTable = this.kapedb.prepare(this.timeLineInsertSQL) // for insert main
              const timelineMainTable = this.kapedb.prepare(this.timeLineTmpInsertSQL) // chnage 2040104 for TMP for insert main
              timelineMainTable.run(
                nullLogValue,
                nullLogValue,
                nullLogValue,
                nullLogValue,
                nullLogValue,
                nullLogValue,
                nullLogValue,
                data['tablename'], // 참조 테이블 명
                row.a_id,
                row.category_1,
                row.category_2,
                row.category_3,
                1 // t_main is true
              )
            } else {
              // 주요 설정해야 하는 타임 컬럼이 존재하는 경우
              // 참조 컬럼 정보 생성
              const refList = data['_timeRefVal']
              const refListLen = refList.length
              let idx = 0

              for (const item of refList) {
                idx++
                if (idx < refListLen) {
                  logValue += row[item] + '  &  '
                } else {
                  logValue += row[item]
                }
              }

              // 위 logValue 항목에 대해서, _timeRefName 으로 등록된 정보가 해당 값의 대표 이름으로 설정하게 대검에서 요청하였다.
              // 따라서, TableInfo.json에서 _timeRefName 필드와 _timeRefVal 필드가 서로 관련이 되어 있음 [소스 분석에 중요한 것]

              const timeColNameList = data['timeColName']

              for (const timerow of timeColNameList) {
                // main 컬럼인지 확인
                if (data['mainColName'] === timerow) {
                  // Main인 경우는 단지 t_main에 1
                  if ((row[timerow] ? row[timerow].trim() : '').length === 0) {
                    row[timerow] = null // 반드시 넣어야 한다. 그렇지 않으면 검색에서 범주 정보가 나오지 않게 된다.
                    // 따라서, 타임라인에 대한 조사를 할때는 t_Datetime이 NULL인 것은 빼야 한다.
                  }

                  const timelineMainTable = this.kapedb.prepare(this.timeLineTmpInsertSQL) // for insert main

                  // 아래의 내용은 하드 코딩 밖에 할 수 없음
                  if (data['tablename'] === 'NLT_UsnJrnl') {
                    timelineMainTable.run(
                      row[timerow],
                      row.EventInfo, // 2023.10.24 대검요청 해당 컬럼에 EventInfo 정보 저장(컬럼 참조 정보)
                      data['timeCategory'],
                      data['_timeCategory'],
                      data['_timeType'],
                      data['_timeRefName'],
                      logValue,
                      data['tablename'], // 참조 테이블 명
                      row.a_id,
                      row.category_1,
                      row.category_2,
                      row.category_3,
                      1 // t_main is true
                    )
                  } else {
                    timelineMainTable.run(
                      row[timerow],
                      timerow,
                      data['timeCategory'],
                      data['_timeCategory'],
                      data['_timeType'],
                      data['_timeRefName'],
                      logValue,
                      data['tablename'], // 참조 테이블 명
                      row.a_id,
                      row.category_1,
                      row.category_2,
                      row.category_3,
                      1 // t_main is true
                    )
                  }
                } // end of Main 인 경우 insert
                else {
                  // if(data['tablename'] === 'NLT_UsnJrnl') 처리가 없는 이유
                  // NLT_UsnJrnl 테이블은 레코드가 메인 하나만 있어서 추가 코드 필요 없음

                  // Main이 아닌 경우는 단지 t_main에 0
                  // main이 아닌 경우에는 값이 없으면 입력하지 않는다.
                  if ((row[timerow] ? row[timerow].trim() : '').length !== 0) {
                    const timelineMainTable = this.kapedb.prepare(this.timeLineTmpInsertSQL) // for insert
                    timelineMainTable.run(
                      row[timerow],
                      timerow,
                      data['timeCategory'],
                      data['_timeCategory'],
                      data['_timeType'],
                      data['_timeRefName'],
                      logValue,
                      data['tablename'], // 참조 테이블 명
                      row.a_id,
                      row.category_1,
                      row.category_2,
                      row.category_3,
                      0 // t_main is true
                    )
                  } // 데이터가 존재하는 경우 insert하는 것
                } // end of Main이 아닌 경우 insert
              } // end of for loop
            } // end of timeNoInfo if

            ////////////////////////////////////////////////////////////////////////////
            // Total_Search 테이블에 데이터 insert //////////////////////////////////////

            // Tatal Search에 참조 컬럼 정보 생성
            const totalRefColList = data['_searchCol']
            const totalRefColListLen = totalRefColList.length
            let totalIdx = 0
            let searchData = ''
            for (const searchItem of totalRefColList) {
              totalIdx++
              if (totalIdx < totalRefColListLen) {
                searchData += (row[searchItem] ? row[searchItem].trim() : '') + '    '
              } else {
                searchData += row[searchItem] ? row[searchItem].trim() : ''
              }
            }
            //////////////////////////////////////// end of searchData create

            // Total_Seach에 insert한 SQL
            const totalSearch = this.kapedb.prepare(this.totalSearchInsertSQL)

            totalSearch.run(data['tablename'], row.a_id, searchData)

            cnt++

            // for debuging TODO
            // if(!(cnt%100000)) {
            //     console.log(`[${data['tablename']}]cnt:`, cnt);
            // }

            ////////////////////////////////////////////////////////////////////////////// End of Total_Search
          } // Paging단위로 select 한 결과에 대한 end of for loop

          // for next page
          offset += this.CreateDBpageSize
        } // end of while loop
      } // end of if 해당 테이블이 존재하여야 수행이 되게 하였음

      // 트랜잭션 커밋
      this.kapedb.exec('COMMIT')

      //console.log(`데이터 복사 완료(${data['tablename']})`, cnt)
      listener({ state: `${data['tablename']} syncEachInsert:: ` + cnt.toString(), percent: 991 })
    } catch (err) {
      this.kapedb.exec('ROLLBACK')
      console.error('eachInsert 중 오류 발생:', err)
      listener({
        state: `${data['tablename']} ########## syncEachInsert::err:: ` + (err as Error).message,
        percent: 991
      })
    }
  }

  // 각각의 테이블에서 TimeLine 테이블과 Search 테이블에 데이터를 입력하는 것
  async insertData(): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
      // 하단의 await 를 사용하기 위해서는 Promise 함수를 async로 해야 한다.

      try {
        const tableSetInfos = Object.keys(this.tableSetting)
        console.time('time001')

        // tableSetInfos.forEach( (key) => {
        //   await this.eachInsert(this.tableSetting[key]);
        // });  // 해당 방식으로는 await가 동작하지 않는다...

        for (const key of tableSetInfos) {
          // 진행사항정보 설정
          this.progressStatus = {
            state: this.tableSetting[key].tablename,
            percent: ((this.tableSetting[key].id - 1) / 40) * 100
          }
          await this.eachInsert(this.tableSetting[key])

          // 마지막테이블 진행완료 시, 100로 표현
          if (this.tableSetting[key].id === 40) this.progressStatus.percent = 100
        }
      } catch (err) {
        console.error('insertData 중 오류 발생:', err)
        reject()
      } finally {
        console.timeEnd('time001') // ###################### for debug
        resolve()
      }
    })
  }

  /**
   * Working Thread에 의해서
   * 각각의 아트팩트 테이블에서 TimeLine 테이블과 Search 테이블에 데이터를 입력하는 함수
   * 20240104_col_rename
   * @param listener : callback 함수(parent 프로세스에게 메시지 전달)
   */
  syncSelectInsertAll(listener: (_status: { state: string; percent: number }) => void) {
    // 하단의 await 를 사용하기 위해서는 Promise 함수를 async로 해야 한다.

    // console.log('start selectInsertAll')
    listener({ state: 'STASRT', percent: -1 })

    listener({ state: `START :: 0`, percent: 991 })

    console.time('time001')
    // console.log(new Date().toLocaleTimeString())

    try {
      const tableSetInfos = Object.keys(this.tableSetting)

      // tableSetInfos.forEach( (key) => {
      //   await this.eachInsert(this.tableSetting[key]);
      // });  // 해당 방식으로는 await가 동작하지 않는다...

      for (const key of tableSetInfos) {
        ///////////// for loop #########
        // 진행사항정보 설정 및 보정
        // 첫번째 테이블은 무조건 1% 로 설정
        // 마지막은 100 로 설정하게 한다
        if (this.tableSetting[key].id === 1) {
          this.progressStatus = {
            state: this.tableSetting[key].tablename,
            percent: 1
          }
        } else {
          this.progressStatus = {
            state: this.tableSetting[key].tablename,
            percent: Math.round(((this.tableSetting[key].id - 1) / 41) * 100) // 40 -> 41
          }
        }

        listener(this.progressStatus)

        this.syncEachTimeUpdate(this.tableSetting[key], listener) // add 20240123 for UTC+0 --> UTC+9

        this.syncEachInsert(this.tableSetting[key], listener)

        // 마지막테이블 진행완료 시, 100로 표현
        if (this.tableSetting[key].id === 40) {
          this.progressStatus.percent = 96 // 100 -> 96
          listener(this.progressStatus)
        }
      } // end of for Table list ########################################

      // add 20240123 case의 system의 install time을 UTC+9으로 변경함
      this.syncEachTimeUpdate_InstallTime(listener)

      ///////////////////////////////////////////////////////////////////////////////////
      // add 20240104 타임라인을 t_DateTime컬럼으로 sort하여 t_id를 다시 재생성해주어야 한다.
      // front에서 page를 500개 단위로 찾기 위해서(timeline의 t_id는 오름차순만 존재한다)

      // 1 : success, 0 : fail
      const re1 = this.syncCreateTotalTimelineShort()

      //////////////////////////////////////////////////////////////////////////////////////
      // [중요] 반드시 syncCreateTotalTimelineShort() 수행하고 tmp 테이블을 삭제해야 한다.
      //const timelineTmpTableIdxDel = this.kapedb.prepare('DROP INDEX idx_DateTimeOnly_Total_Timeline_Tmp') // chnage 2040104 for TMP for insert main
      //const runTimelineTmpIdxDel = timelineTmpTableIdxDel.run()

      //const timelineTmpTableDel = this.kapedb.prepare('DROP TABLE Total_Timeline_Tmp') // chnage 2040104 for TMP for insert main
      //const runTimelineTmpDel = timelineTmpTableDel.run()
      ///////////////////////////////////////////////////////////////////////////////////////

      // 마지막테이블 진행완료 시, 100로 표현
      {
        this.progressStatus.state = 'TotalTimeline_' + re1.toString()
        this.progressStatus.percent = 100
        listener(this.progressStatus)

        listener({ state: `${this.progressStatus.state} :: ` + this.progressStatus.percent.toString(), percent: 991 })
      }
      //////////////////////////////////////////////////////////////////////////////////
    } catch (err) {
      console.error('insertData(timeline, totalSearch) 중 오류 발생:', err)
      this.progressStatus = {
        state: 'D002',
        percent: -1
      }
      listener(this.progressStatus)
      listener({ state: `${this.progressStatus.state} :: ` + (err as Error).message, percent: 991 })
    } finally {
      // console.log('End selectInsertAll()#################################')
      // console.log(new Date().toLocaleTimeString())
      console.timeEnd('time001') // ###################### for debug
    }
  }

  /**
   * 타임라인차트를 위한 테이블 데이터 생성함수
   */
  syncCreateTotalTimelineShort(): number {
    let re: number = 0

    try {
      // TotalTimeLine_tmp 테이블에서 t_DateTime을 sort하여 정식으로 데이터를 생성하는 것
      const timelineSortMainTable = this.kapedb.prepare(this.timeLine_Sorted_InsertSQL) // chnage 2040104 for TMP for insert main
      const runInfo = timelineSortMainTable.run()

      console.log('TotalTimeline : ', runInfo.change) // 사용할 TotalTimeline 테이블 생성완료

      // >> Timeline Chart를 위한 데이터를 생성한다. - 가공하여 만들기 위한 1차 데이더
      // >> TotalTimeLine_Short2 에 데이터 생성, t_DateTime, category_1, category_2, c_count
      const timeline_Short2_Table = this.kapedb.prepare(this.timeLine_Short2_InsertSQL) // add 2040104
      const runInfoShort2 = timeline_Short2_Table.run()

      console.log('TotalTimelineShort2 : ', runInfoShort2.change)

      // >> 위에서 생성된 TotalTimeLine_Short2에서 사용할 최종데이터 테이블을 생성하게 한다.
      // >> TotalTimeLine_Short 에 데이터 생성, t_DateTime, category_1, c_count, NULL
      const timeline_Short_Table = this.kapedb.prepare(this.timeLine_Short_InsertSQL) // add 2040104
      const runInfoShort = timeline_Short_Table.run()

      console.log('TotalTimelineShort FIRST : ', runInfoShort.change)

      const local_limit = this.CreateDBpageSize
      let local_offset = 0
      while (true) {
        const checkQuery1 = this.kapedb.prepare(
          `select t_dateTime, category_1 
            from Total_Timeline_Short
            limit ? offset ?`
        )
        const orgRows = checkQuery1.all(local_limit, local_offset)

        if (orgRows.length === 0) break // end of while loop

        let idx
        for (idx = 0; idx < orgRows.length; idx++) {
          const checkQuery2 = this.kapedb.prepare(
            `select category_2, c_count
              from Total_Timeline_Short2
              where t_dateTime = ? and category_1 = ?
              order by category_2
            `
          )
          const detailRows = checkQuery2.all(orgRows[idx].t_dateTime, orgRows[idx].category_1)

          // detail에 넣을 JSON 데이터 생성
          const detailString = JSON.stringify(detailRows, null, 2)

          // 윗에서 생성된 데이터를 가지고 Total_Timeline_Short의 detail 컬럼을 update한다.
          const checkQuery3 = this.kapedb.prepare(
            `update Total_Timeline_Short
              set detail = ?
              where t_dateTime = ? and category_1 = ?
            `
          )
          const updateResult = checkQuery3.run(detailString, orgRows[idx].t_dateTime, orgRows[idx].category_1)
        }

        local_offset = local_offset + local_limit
      }
      console.log('TotalTimelineShort SECOND DONE')

      re = 1
    } catch (e) {
      console.error('syncCreateTotalTimelineShort 중 오류 발생:', e)
      re = 0
    }
    return re
  }

  /**
   *
   * @returns DB의 진행 상태를 알려주는 API
   */
  getProgressStatus(): DB_PROGRESS_PARAM {
    return this.progressStatus
  }

  /**
   * 독립 프로세스에 동작하기 때문에 sync로 동작하게 하였음
   * json에 등록된 Table 정보를 기반으로
   * 검색 테이블 생성
   * 타임라인 테이블 생성
   * 데이터 insert
   * 를 수행함
   */
  async makeTotalTableListener(listener: (_status: { state: string; percent: number }) => void) {
    if (this.tableSetting !== null && this.tableSetting !== undefined) {
      // 진행상태 정보를 초기화해주어야 한다.
      console.log('call makeTotalTableListener')
      // listener({ state: 'makeTotalTableListener', percent: -1 }) // IPC 테스트용

      /////////////////////////////////////////////////////////
      try {
        // 통합 테이블 생성
        this.syncCreateSearchTable()
        //////////////////////////////////////////////////////////////

        // 통합 검색 테이블 생성시, 통합 타임테이블 생성
        this.syncCreateTimeTable()
        /////////////////////////////////////////////////////////////

        // 통합 검색 테이블 생성시, 북마크 테이블 생성
        this.syncCreateBookMarkTable()

        // 통합 검색 테이블 생성시, case info 테이블 생성
        this.syncCreateCaseInfoTable()

        // 모든 테이블에서 데이터 추출하여 통합테이블로 생성
        this.syncSelectInsertAll((_status: { state: string; percent: number }) => {
          listener(_status)
        })

        /////////////////////////////////////////////////////////////
      } catch (err) {
        console.error('CreateTable 중 오류 발생:', err)
        this.progressStatus = {
          state: 'D005',
          percent: -1
        }
        listener(this.progressStatus)
        this.close()
        return
      }
      console.log('End makeTotalTableListener')
      this.close()
      return
    } else {
      // 테이블 처리 정보가 없을 경우 에러 처리 한다.
      this.progressStatus = {
        state: 'D005',
        percent: -2
      }
      listener(this.progressStatus)
      this.close()
      return
    }
  }

  /**
   * 테이블 정보를 주면, 결과 객체 파일을 만들어 주는 함수
   * DB 연결이 되어 있어야 한다.
   * 결과 값은 undefined : 에러인 경우
   *          또는 obj [] : 성공인 경우
   */
  async selectSummaryTable(): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      const offset = 0
      const eachPageSize = 1000
      let re: any

      // sqlite3 lib로 구현한 내용
      // {
      //   this.kapedb.serialize(async () => {
      //     const query = `SELECT Category_1, Category_2, Category_3, count(*) as count
      //                     FROM Total_Timeline
      //                     WHERE t_main = 1
      //                     GROUP BY Category_1, Category_2, Category_3
      //                     ORDER BY Category_1, Category_2, Category_3
      //                     LIMIT ? OFFSET ?`

      //     try {
      //       this.kapedb.run('BEGIN')

      //       const rows2 = await new Promise<any[]>((resolve, reject) => {
      //         this.kapedb.all(query, eachPageSize, offset, (err: Error | null, rows: any[]) => {
      //           if (err) reject(err)
      //           else resolve(rows)
      //         })
      //       }) // end of new Promise

      //       if (rows2.length !== 0) {
      //         // 결과 데이터를 JSON 파일로 저장
      //         re = rows2
      //         console.log(9999999)
      //       }
      //     } catch (err) {
      //       this.kapedb.run('ROLLBACK')
      //       console.error('selectSummaryTable 중 오류 발생:', err)
      //       re = undefined
      //       reject(re)
      //     } finally {
      //       this.kapedb.run('COMMIT')
      //       console.log('AAAAAA2222222222')
      //       resolve(re)
      //     }
      //   })
      // }

      ///////////////////
      // for better-sqlite3
      ///////////////////
      {
        // 트랜잭션 시작
        this.kapedb.exec('BEGIN TRANSACTION')

        try {
          const query = `SELECT category_1, category_2, category_3, count(*) as count
                          FROM Total_Timeline
                          WHERE t_main = 1
                          GROUP BY category_1, category_2, category_3
                          ORDER BY category_1, category_2, category_3
                          LIMIT ? OFFSET ?`
          const sourceTable = this.kapedb.prepare(query)
          const rows = sourceTable.all(eachPageSize, offset)

          if (rows.length !== 0) {
            re = rows
          }
        } catch (err) {
          this.kapedb.exec('ROLLBACK')
          console.error('selectSummaryTable 중 오류 발생:', err)
          reject(undefined)
        } finally {
          this.kapedb.exec('COMMIT')
          resolve(re)
        }
      }
    }) // end of new Promise()
  }

  /**
   * Category1을 기준으로 아트팩트가 얼마나 있는지 주는 API
   * DB 연결이 되어 있어야 한다.
   * 결과 값은 undefined : 에러인 경우
   *          또는 obj [] : 성공인 경우
   */
  async selectSummaryTableByCategory1(): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      const offset = 0
      const eachPageSize = 1000
      let re: any

      ///////////////////
      // for better-sqlite3
      ///////////////////
      {
        // 트랜잭션 시작
        this.kapedb.exec('BEGIN TRANSACTION')

        try {
          const query = `SELECT category_1, count(*) as count
                            FROM Total_Timeline
                            WHERE t_main = 1
                            GROUP BY category_1
                            ORDER BY category_1
                            LIMIT ? OFFSET ?`
          const sourceTable = this.kapedb.prepare(query)
          const rows = sourceTable.all(eachPageSize, offset)

          if (rows.length !== 0) {
            re = rows
          }
        } catch (err) {
          this.kapedb.exec('ROLLBACK')
          console.error('selectSummaryTableByCategory1 중 오류 발생:', err)
          reject(undefined)
        } finally {
          this.kapedb.exec('COMMIT')
          resolve(re)
        }
      }
    }) // end of new Promise()
  }

  /**
   * Case의 시스템 정보를 출력하는 API
   * DB 연결이 되어 있어야 한다.
   * 결과 값은 undefined : 에러인 경우
   *          [] empty 배열 : 해당 테이블이 존재하지 않을 경우
   *          obj [] : 성공인 경우
   */
  async selectArtifactSystemInfoByTable(): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      const offset = 0
      const eachPageSize = 1000
      let re: any

      ///////////////////
      // for better-sqlite3
      ///////////////////
      {
        // 트랜잭션 시작
        this.kapedb.exec('BEGIN TRANSACTION')

        try {
          const tableName = 'RECmd_Batch_SPO_All_Execute_Command_Output'
          const tableExistsQuery = this.kapedb.prepare(
            "SELECT count(*) as count FROM sqlite_master WHERE type='table' AND name=?"
          )
          const tableExists = tableExistsQuery.get(tableName)

          if (tableExists.count > 0) {
            const query = `select valueName, ValueData 
                              from RECmd_Batch_SPO_All_Execute_Command_Output
                            where ValueName = ? 
                                  or ValueName = ? 
                                  or ValueName = ? 
                                  or ValueName = ? 
                                  or ValueName = ? 
                                  or ValueName = ? 
                                  or ValueName = ? 
                                  or ValueName = ?
                            LIMIT ? OFFSET ?`
            const sourceTable = this.kapedb.prepare(query)
            const rows = sourceTable.all(
              'ProductName',
              'DisplayVersion',
              'CurrentMajorVersionNumber',
              'CurrentMinorVersionNumber',
              'CurrentBuildNumber',
              'InstallTime',
              'TimeZoneKeyName',
              'RegisteredOwner',
              eachPageSize,
              offset
            )

            if (rows.length !== 0) {
              re = rows
            }
          } else {
            re = []
          }
        } catch (err) {
          this.kapedb.exec('ROLLBACK')
          console.error('selectArtifactSystemInfoByTable 중 오류 발생:', err)
          reject(undefined)
        } finally {
          this.kapedb.exec('COMMIT')
          resolve(re)
        }
      }
    }) // end of new Promise()
  }

  /**
   * 타임라인 테이블 조건에 대한 레코드 개수 정보 전달
   * _Datetime이 not null인 데이터만 처리한다
   * DB 연결이 되어 있어야 한다.
   * [주요참고사항] ### total_timeline 최종테이블은 기본적으로 ( ORDER BY t_dateTime, category_1, category_2, category_3 ) 소트되어 생성되기에, 사용할 때 t_id로 sort하면 된다. 
   * 결과 값은 -1 : 에러인 경우
   *          레코드 개수 : 성공인 경우
   */
  syncSelectCountTimelineTable(param: DB_TIMELINE_QUERY_INFO) {
    const offset = 0
    const eachPageSize = 1000
    let re = { total_cnt: -1 }

    // 트랜잭션 시작
    this.kapedb.exec('BEGIN TRANSACTION')

    try {
      if (param._full_search_flag === true) {
        // 전체 범주에서 찾는 것
        if (param._full_time_range_flag === true) {
          // [조건1] t_dateTime이 not null
          // 전체 count정보
          const query = `SELECT count(*) as total_cnt 
                          FROM Total_Timeline 
                        WHERE t_dateTime is not null
                        `
          const sourceTable = this.kapedb.prepare(query)
          re = sourceTable.get()
        } else {
          // [조건1] t_dateTime이 not null인 것 중
          // [조건2] 특정 날짜의 
          // 종 개수 count정보
          const query = `SELECT count(*) as total_cnt 
                          FROM Total_Timeline 
                        WHERE t_dateTime is not null AND t_dateTime >= ? AND t_dateTime <= ?
                        `
          const sourceTable = this.kapedb.prepare(query)
          re = sourceTable.get(param._s_time, param._e_time)
        }
      } else {
        // 기본적으로 특정 1차 범주에서 찾는 것이다.
        if (param._full_time_range_flag === true) {
          // [조건 1] t_dateTime이 not null인 것 중, 
          // [조건 2] 특정 범주1에 속한 
          // 데이터의 총 개수
          const query = `SELECT count(*) as total_cnt 
                          FROM Total_Timeline 
                        WHERE t_dateTime is not null AND category_1 IN (${param._categoryName})
                        `
          const sourceTable = this.kapedb.prepare(query)
          re = sourceTable.get()
        } else {
          // t_dateTime이 not null인 것 중, 
          // [조건1] : 특정 기간
          // [조건2] : 특정 범주1에 속한 
          // 데이터의 총 개수
          const query = `SELECT count(*) as total_cnt 
                          FROM Total_Timeline 
                         WHERE (t_dateTime is not null AND t_dateTime >= ? AND t_dateTime <= ?) 
                                AND category_1 IN (${param._categoryName}) 
                        `
          const sourceTable = this.kapedb.prepare(query)
          re = sourceTable.get(param._s_time, param._e_time)
        }
      }
      this.kapedb.exec('COMMIT')
      return re.total_cnt
    } catch (err) {
      this.kapedb.exec('ROLLBACK')
      console.error('syncSelectCountTimelineTable 중 오류 발생:', err)
      return -1 // 에러인 경우 -1
    }
  }

  /**
   * 타임라인 차트를 위한 테이블 생성한 후, 해당 테이블 데이터를 주는 것이다. 기간 조건은 최대 1년이 되어야 한다.
   * 결과 값은 undefined : 에러인 경우
   *          obj[] : 성공인 경우
   */
  syncCreaate_SelectContentTimelineShortTempTable(param: DB_TIMELINE_QUERY_INFO) {
    
    let re: any[] | undefined = undefined
    let runRe: any | undefined = undefined
    let runRe2: any | undefined = undefined

    // 트랜잭션 시작
    this.kapedb.exec('BEGIN TRANSACTION')

    try {

      // 기존 Total_Timeline_ShortTemp 테이블, 
      const deleteTable = this.kapedb.prepare(this.timeLine_ShortTemp_DeleteSQL)
      runRe = deleteTable.run()

      // Total_Timeline_Short2(기존것 재사용)의 데이터를 삭제
      const deleteTable2 = this.kapedb.prepare(this.timeLine_Short2_DeleteSQL)
      runRe = deleteTable2.run()

      // Total_Timeline_GotoInfo 데이터를 삭제 후 다시 생성해야 한다.
      const dropIndexTimeTableGotoInfo = this.kapedb.prepare(
        `DROP INDEX IF EXISTS idx_DateTimeOnly_Total_Timeline_GotoInfo`
      )
      dropIndexTimeTableGotoInfo.run()

      const dropTableTimeTableGotoInfo = this.kapedb.prepare(
        `DROP TABLE IF EXISTS Total_Timeline_GotoInfo`
      )
      dropTableTimeTableGotoInfo.run()

      const createTimeTableGotoInfo = this.kapedb.prepare(
        `CREATE TABLE IF NOT EXISTS Total_Timeline_GotoInfo (temp_t_id INTEGER PRIMARY KEY AUTOINCREMENT, t_id integer, t_dateTime text, category_1  text,category_2  text,category_3  text)`
      )
      createTimeTableGotoInfo.run()

      const createIndexGotoInfo = this.kapedb.prepare(
        `CREATE INDEX IF NOT EXISTS idx_DateTimeOnly_Total_Timeline_GotoInfo ON Total_Timeline_GotoInfo (t_dateTime, category_1, category_2, category_3)`
      )
      createIndexGotoInfo.run()

      // 다시 생성해야 SEQ가 자동으로 0부터 생성하기 때문
      // const deleteTable3 = this.kapedb.prepare(this.timeLine_GotoInfo_DeleteSQL)
      // runRe = deleteTable3.run()

      //////////////////////////////////////////////////////////////////////////////////////////////////////////

      // 조건에 맞는 데이터를 Total_Timeline 테이블에서 추출하여 Total_Timeline_Short2에 데이터를 넣는다.
      if(param._full_search_flag === true && param._full_time_range_flag === false) {
        const _timeLine_Short2_InsertSQL_from_Time = `INSERT INTO Total_Timeline_Short2 (t_dateTime, category_1, category_2, c_count) select substr(t_dateTime, 1, 13)||':00:00' as t_dateTime, category_1, category_2, count(*) as c_count
                      from 
                        total_timeline
                      where 
                        t_dateTime is not null
                        and (t_dateTime >= ? AND t_dateTime <= ?) 
                      group by substr(t_dateTime, 1, 13), category_1, category_2
                      order by substr(t_dateTime, 1, 13), category_1, category_2`
        const sourceTable = this.kapedb.prepare(_timeLine_Short2_InsertSQL_from_Time)
        runRe = sourceTable.run(param._s_time, param._e_time)

        // 타임라인 그리드 위치를 알기위한 테이블 timeLine_GotoInfo 테이블에 자료 생성
        const _timeLine_GotoInfo_time_InsertSQL =
                    `INSERT INTO Total_Timeline_GotoInfo (t_id, t_dateTime, category_1, category_2, category_3) 
                            select t_id, t_dateTime, category_1, category_2, category_3 
                              FROM Total_Timeline 
                              WHERE t_dateTime is not null AND
                              (t_dateTime >= ? AND t_dateTime <= ?)
                            order by t_dateTime, category_1, category_2, category_3`
        const sourceTable2 = this.kapedb.prepare(_timeLine_GotoInfo_time_InsertSQL)
        runRe2 = sourceTable2.run(param._s_time, param._e_time)
      } else if (param._full_search_flag === false && param._full_time_range_flag === true) {
        const _timeLine_Short2_InsertSQL_from_Category = `INSERT INTO Total_Timeline_Short2 (t_dateTime, category_1, category_2, c_count) select substr(t_dateTime, 1, 13)||':00:00' as t_dateTime, category_1, category_2, count(*) as c_count
                    from 
                      total_timeline
                    where 
                      t_dateTime is not null
                      and category_1 IN (${param._categoryName})
                    group by substr(t_dateTime, 1, 13), category_1, category_2
                    order by substr(t_dateTime, 1, 13), category_1, category_2`
        const sourceTable = this.kapedb.prepare(_timeLine_Short2_InsertSQL_from_Category)
        runRe = sourceTable.run()

        // 타임라인 그리드 위치를 알기위한 테이블 timeLine_GotoInfo 테이블에 자료 생성
        const _timeLine_GotoInfo_category_InsertSQL =
                    `INSERT INTO Total_Timeline_GotoInfo (t_id, t_dateTime, category_1, category_2, category_3) 
                                    select t_id, t_dateTime, category_1, category_2, category_3 
                                      FROM Total_Timeline 
                                      WHERE t_dateTime is not null AND
                                      category_1 IN (${param._categoryName})
                                    order by t_dateTime, category_1, category_2, category_3`
        const sourceTable2 = this.kapedb.prepare(_timeLine_GotoInfo_category_InsertSQL)
        runRe2 = sourceTable2.run()
      } else {    // if (param._full_search_flag === false && param._full_time_range_flag === false) 그리고 
                  // (param._full_search_flag === true && param._full_time_range_flag === true) <== 이건 오면 안됨
        const _timeLine_Short2_InsertSQL_from_Time_Category = `INSERT INTO Total_Timeline_Short2 (t_dateTime, category_1, category_2, c_count) select substr(t_dateTime, 1, 13)||':00:00' as t_dateTime, category_1, category_2, count(*) as c_count
                    from 
                      total_timeline
                    where 
                      t_dateTime is not null
                      and (t_dateTime >= ? AND t_dateTime <= ?) 
                      and category_1 IN (${param._categoryName})
                    group by substr(t_dateTime, 1, 13), category_1, category_2
                    order by substr(t_dateTime, 1, 13), category_1, category_2`
        const sourceTable = this.kapedb.prepare(_timeLine_Short2_InsertSQL_from_Time_Category)
        runRe = sourceTable.run(param._s_time, param._e_time)

        // 타임라인 그리드 위치를 알기위한 테이블 timeLine_GotoInfo 테이블에 자료 생성
        const _timeLine_GotoInfo_time_category_InsertSQL =
                  `INSERT INTO Total_Timeline_GotoInfo (t_id, t_dateTime, category_1, category_2, category_3) 
                                  select t_id, t_dateTime, category_1, category_2, category_3 
                                    FROM Total_Timeline 
                                    WHERE t_dateTime is not null AND
                                    (t_dateTime >= ? AND t_dateTime <= ?) AND
                                    category_1 IN (${param._categoryName})
                                  order by t_dateTime, category_1, category_2, category_3`
        const sourceTable2 = this.kapedb.prepare(_timeLine_GotoInfo_time_category_InsertSQL)
        runRe2 = sourceTable2.run(param._s_time, param._e_time)
      }

      console.log('TotalTimelineShort2 FIRST : ', runRe.changes, runRe2.changes)

      // 조건에 맞는 데이터를 Total_Timeline 테이블에서 추출하여 Total_Timeline_ShortTemp 넣는다.
      // timeLine_Short_InsertSQL_from_ShortTemp 수행하여 timeline_shortTemp에 데이터 1차 생성하게 한다.
      const sourceTable = this.kapedb.prepare(this.timeLine_Short_InsertSQL_from_ShortTemp)
      runRe = sourceTable.run()

      console.log('TotalTimelineShortTemp SECOND : ', runRe.changes)

      const local_limit = this.CreateDBpageSize
      let local_offset = 0
      while (true) {
        // Total_Timeline_ShortTemp 테이블에는 조건에 원하는 timeline chart 데이터들만 있으므로, 전체를 처리해야 함
        const checkQuery1 = this.kapedb.prepare(
          `select t_dateTime, category_1 
            from Total_Timeline_ShortTemp
            limit ? offset ?`
        )
        const orgRows = checkQuery1.all(local_limit, local_offset)

        if (orgRows.length === 0) break // end of while loop

        let idx
        for (idx = 0; idx < orgRows.length; idx++) {
          const checkQuery2 = this.kapedb.prepare(
            `select category_2, c_count
              from Total_Timeline_Short2
              where t_dateTime = ? and category_1 = ?
              order by category_2
            `
          )
          const detailRows = checkQuery2.all(orgRows[idx].t_dateTime, orgRows[idx].category_1)

          // detail에 넣을 JSON 데이터 생성
          const detailString = JSON.stringify(detailRows, null, 2)

          // 윗에서 생성된 데이터를 가지고 Total_Timeline_Short의 detail 컬럼을 update한다.
          const checkQuery3 = this.kapedb.prepare(
            `update Total_Timeline_ShortTemp
              set detail = ?
              where t_dateTime = ? and category_1 = ?
            `
          )
          const updateResult = checkQuery3.run(detailString, orgRows[idx].t_dateTime, orgRows[idx].category_1)
        }

        local_offset = local_offset + local_limit
      } // end of while loop

      console.log('TotalTimelineShortTemp THIRD DONE')

      // 그리고 최종으로 전체 데이터를 전달.
      const QueryAll = this.kapedb.prepare(
        `select *  from Total_Timeline_ShortTemp`
      )
      re = QueryAll.all()

      this.kapedb.exec('COMMIT')
      return re
    } catch (err) {
      this.kapedb.exec('ROLLBACK')
      console.error('syncCreaate_SelectContentTimelineShortTempTable 중 오류 발생:', err)
      return undefined
    }
  }

  /**
   * 타임라인 테이블 조회 조건에 대한 레코드 정보 전달 with 북마크 ID도 포함됨
   * 전제조건 : DB 연결이 되어 있어야 한다.
   * * _Datetime이 not null인 데이터만 처리한다 그리고 순서는 _Datetime DESC, Category_1, Category_2, Category_3
   * * 시간값은 내림차순으로 최근 날짜가 맨 처음에 나오게 한다
   * [주의 사항] 중간 과정에서 설정된 pagesize만큼 자르고 나서 북마크와 조인하기에,(param._b_id === 99999 북마크 ID를 99999로 할 경우 멀티북마크임)
   *            멀티 북마크를 보는 경우, 데이터가 증가 될 수 있음, 예로 pagesize를 1000로 만든 후 , 북마크 조인하면 1020개의 데이터가 될 수 있음
   *            (이때, [중요]같은 데이터가 북마크별로 같은 순서 위치에 존재한다. map 처리로 하나으 컬럼에 처리할 수 있음)
   * 결과 값은 undefined : 에러인 경우
   *          obj[] : 성공인 경우
   */
  syncSelectContentTimelineTable(param: DB_TIMELINE_QUERY_INFO) {
    //////////////////////////////////////////////////////////////////////////////////////////
    // 출력 순서 변경 : t_dateTime, category_1, category_2, category_3 --> t_id로 변경 20240108
    //////////////////////////////////////////////////////////////////////////////////////////
    const offset: number = param._offset
    let pagesize
    if (param._pageSize !== undefined && param._pageSize >= 500) {
      // 20240108 change 1000 -> 500
      pagesize = param._pageSize

      // 20231205 추가 예외 처리 : 너무 많은 페이지로 요청할 경우, 메로리 부족으로 Node가 GC에러로 죽음
      if (pagesize > this.CreateDBpageSize) pagesize = this.CreateDBpageSize
    } else {
      pagesize = this.timelinePageSize // 500 정의가 안되어 있으면 500개로 제한함
    }

    let re: any[] | undefined = undefined

    // 트랜잭션 시작
    this.kapedb.exec('BEGIN TRANSACTION')

    try {
      ////////////////////////////////////
      // _t_id가 undefined가 아니라면, 해당 _t_id기반으로 시작해서 테이터를 조회 하게 된다.
      // 따라서, offset는 0이 된다.
      if (param._t_id !== undefined) {
        // 북마크가 없는 경우
        if (param._b_id === undefined) {
          const query = `SELECT * 
                            FROM (
                                    SELECT false as _book, t1.*
                                      FROM (
                                        SELECT *
                                          FROM Total_Timeline 
                                          WHERE t_id >= ?
                                          ORDER BY t_id
                                          LIMIT ? OFFSET ?
                                      ) as t1
                                  ) AS org
                          `
          const sourceTable = this.kapedb.prepare(query)
          re = sourceTable.all(param._t_id, pagesize, offset)
        } else {
          // 특정 북마크가 있는 경우
          const query = `SELECT * 
                              FROM (
                                      SELECT CASE WHEN b2.b_id IS NULL THEN false ELSE b2.b_id END as _book, t1.*
                                        FROM ( 
                                              SELECT *
                                                FROM Total_Timeline 
                                              WHERE t_id >= ?
                                              ORDER BY t_id
                                              LIMIT ? OFFSET ?
                                              ) as t1
                                          LEFT JOIN BookMark_Mapper AS b2 ON 
                                                                b2.b_tableName = t1.t_tableName AND 
                                                                b2.b_tableId = t1.t_tableId AND 
                                                                b2.b_id = ?
                                    ) AS org
                                `
          const sourceTable = this.kapedb.prepare(query)
          re = sourceTable.all(param._t_id, pagesize, offset, param._b_id)
        }
      } else {
        /////////////////////////////////////////////////////////////////////////////////////////////////
        // 북마크 id가 정의 되지 않은 경우 : 1개의 아트팩트에 대해 2개의 북마크가 있을 경우, 2개가 보여지게 된다.
        //////////////////////////////////////////////////////////////////////////////////////////////////
        // 20231215 : 수사 기관은 날짜 정보는 과거에서 부터 보고 싶어 한다. 받드시 ORDER BY를 ASC로 해야 한다.
        // order by _DateTime을 수행하면, null이 먼저 나오게 된다.
        if (param._b_id === undefined) {
          // 북마크 정보가 undefined이면 북마크 정보 없이 timeline정보만 가져오는것
          // 맨 처음 timeline을 볼 경우에는 북마크 정보가 없기에, 아래 블럭으로 처리해야 한다.
          ///////////////////////////////////////////////////////////
          if (param._full_search_flag === true) {
            if (param._full_time_range_flag === true) {
              // 먼저 요청한 offset에서 1000개를 추출한 후에 북마크와 붙이면 1000개를 넘게 줄 수 있게 된다. 하나의 artifact에 2개의 북마크가 있으면
              // 레코드가 1개 더 존재하게 된다.
              const query = `SELECT * 
                            FROM (
                                    SELECT false as _book, t1.*
                                      FROM (
                                        SELECT *
                                          FROM Total_Timeline 
                                          WHERE t_dateTime is not null
                                          ORDER BY t_id
                                          LIMIT ? OFFSET ?
                                      ) as t1
                                  ) AS org
                          `
              const sourceTable = this.kapedb.prepare(query)
              re = sourceTable.all(pagesize, offset)
            } else {
              // 아래의 쿼리는 기간을 주고, 거기에서 1000개를 추출한 결과를 북마크과 조인하게 한다. 따라서, 레코드가 1000개를 넘을 수가 있음
              const query = `SELECT * 
                            FROM (
                                  SELECT false as _book, t1.*
                                  FROM ( 
                                          SELECT *
                                            FROM Total_Timeline 
                                          WHERE 
                                          t_dateTime is not null AND t_dateTime >= ? AND t_dateTime <= ?
                                          ORDER BY t_id
                                          LIMIT ? OFFSET ?
                                        ) as t1  
                                  ) AS org
                          `
              const sourceTable = this.kapedb.prepare(query)
              re = sourceTable.all(param._s_time, param._e_time, pagesize, offset)
            }
          } else {
            if (param._full_time_range_flag === true) {
              // 아래의 쿼리는 범주1 의 값에 의해 추출된 타임라인 아트팩트 중에 사용자가 요청한 offset에서 1000를 추출한 후, 조인하는 것임
              // 따라서, 1000개를 넘게 전달할 수 있음
              const query = `SELECT * 
                            FROM (
                                  SELECT false as _book, t1.*
                                  FROM ( 
                                          SELECT *
                                            FROM Total_Timeline 
                                          WHERE 
                                          t_dateTime is not null AND category_1 IN (${param._categoryName}) 
                                          ORDER BY t_id
                                          LIMIT ? OFFSET ?
                                        ) as t1   
                                  ) AS org
                          `
              const sourceTable = this.kapedb.prepare(query)
              re = sourceTable.all(pagesize, offset)
            } else {
              // 먼저 날짜로 필터링하고, 그리고 나서 범주로 필터링하여, limit를 수행한다(where은 왼쪽에서 오른쪽으로 진행)
              const query = `SELECT * 
                            FROM (
                                  SELECT false as _book, t1.*
                                    FROM ( 
                                            SELECT *
                                              FROM Total_Timeline 
                                            WHERE 
                                              (t_dateTime is not null AND t_dateTime >= ? AND t_dateTime <= ?) AND category_1 IN (${param._categoryName}) 
                                            ORDER BY t_id
                                            LIMIT ? OFFSET ?
                                          ) as t1   
                                  ) AS org 
                          `
              const sourceTable = this.kapedb.prepare(query)
              re = sourceTable.all(param._s_time, param._e_time, pagesize, offset)
            }
          }
          ////////////////////////////////////////////////////////////////////
        } else if (param._b_id === 99999) {
          /// 99999 는 북마크 전체를 조인하여 가져오는 것
          ///////////////////////////////////////////////////////////
          if (param._full_search_flag === true) {
            // 모든 범주, 범주1 조건이 없음
            if (param._full_time_range_flag === true) {
              // 먼저 요청한 offset에서 1000개를 추출한 후에 북마크와 붙이면 1000개를 넘게 줄 수 있게 된다. 하나의 artifact에 2개의 북마크가 있으면
              // 레코드가 1개 더 존재하게 된다.
              const query = `SELECT * 
                            FROM (
                                    SELECT CASE WHEN b2.b_id IS NULL THEN false ELSE b2.b_id END as _book, t1.*
                                      FROM (
                                        SELECT *
                                          FROM Total_Timeline 
                                          WHERE t_dateTime is not null
                                          ORDER BY t_id
                                          LIMIT ? OFFSET ?
                                      ) as t1
                                      LEFT JOIN BookMark_Mapper AS b2 ON 
                                                              b2.b_tableName = t1.t_tableName AND 
                                                              b2.b_tableId = t1.t_tableId
                                  ) AS org
                          `
              const sourceTable = this.kapedb.prepare(query)
              re = sourceTable.all(pagesize, offset)

              // TODO-MULTI_BOOKMARK 필요
            } else {
              // 아래의 쿼리는 기간을 주고, 거기에서 1000개를 추출한 결과를 북마크과 조인하게 한다. 따라서, 레코드가 1000개를 넘을 수가 있음
              const query = `SELECT * 
                            FROM (
                                  SELECT CASE WHEN b2.b_id IS NULL THEN false ELSE b2.b_id END as _book, t1.*
                                  FROM ( 
                                          SELECT *
                                            FROM Total_Timeline 
                                          WHERE 
                                          t_dateTime is not null AND t_dateTime >= ? AND t_dateTime <= ?
                                          ORDER BY t_id
                                          LIMIT ? OFFSET ?
                                        ) as t1
                                  LEFT JOIN BookMark_Mapper AS b2 ON 
                                                          b2.b_tableName = t1.t_tableName AND 
                                                          b2.b_tableId = t1.t_TableId   
                                  ) AS org
                          `
              const sourceTable = this.kapedb.prepare(query)
              re = sourceTable.all(param._s_time, param._e_time, pagesize, offset)

              // TODO-MULTI_BOOKMARK 필요
            }
          } else {
            // 특정 범주가 설정됨, 범주1 조건 생김
            if (param._full_time_range_flag === true) {
              // 아래의 쿼리는 범주1 의 값에 의해 추출된 타임라인 아트팩트 중에 사용자가 요청한 offset에서 1000를 추출한 후, 조인하는 것임
              // 따라서, 1000개를 넘게 전달할 수 있음
              const query = `SELECT * 
                            FROM (
                                  SELECT CASE WHEN b2.b_id IS NULL THEN false ELSE b2.b_id END as _book, t1.*
                                  FROM ( 
                                          SELECT *
                                            FROM Total_Timeline 
                                          WHERE 
                                          t_dateTime is not null AND category_1 IN (${param._categoryName}) 
                                          ORDER BY t_id
                                          LIMIT ? OFFSET ?
                                        ) as t1
                                  LEFT JOIN BookMark_Mapper AS b2 ON 
                                                        b2.b_tableName = t1.t_tableName AND 
                                                        b2.b_tableId = t1.t_tableId   
                                  ) AS org
                          `
              const sourceTable = this.kapedb.prepare(query)
              re = sourceTable.all(pagesize, offset)

              // TODO-MULTI_BOOKMARK 필요
            } else {
              // 먼저 날짜로 필터링하고, 그리고 나서 범주로 필터링하여, limit를 수행한다(where은 왼쪽에서 오른쪽으로 진행)
              const query = `SELECT * 
                            FROM (
                                  SELECT CASE WHEN b2.b_id IS NULL THEN false ELSE b2.b_id END as _book, t1.*
                                    FROM ( 
                                            SELECT *
                                              FROM Total_Timeline 
                                            WHERE 
                                              (t_dateTime is not null AND t_dateTime >= ? AND t_dateTime <= ?) AND category_1 IN (${param._categoryName}) 
                                            ORDER BY t_id
                                            LIMIT ? OFFSET ?
                                          ) as t1
                                  LEFT JOIN BookMark_Mapper AS b2 ON 
                                                        b2.b_tableName = t1.t_tableName AND 
                                                        b2.b_tableId = t1.t_tableId   
                                  ) AS org 
                          `
              const sourceTable = this.kapedb.prepare(query)
              re = sourceTable.all(param._s_time, param._e_time, pagesize, offset)

              // TODO-MULTI_BOOKMARK 필요
            }
          }
          ////////////////////////////////////////////////////////////////////
        } else {
          ///////////////////////////////////////////////////////////
          // 202302 에 결정된 가장 많이 요청되어 처리 되는 로직
          // 
          // B_Id가 정의가 된 경우
          // B_Id가 존재할 경우에는 개수 정보가 북마크를 이용하지 않는 것과 동일하다. 1:1 mapping이기에...
          ///////////////////////////////////////////////////////////
          if (param._full_search_flag === true) {
            //범주1 조건이 없다
            if (param._full_time_range_flag === true) {
              // 조건1 : t_dateTime이 not null인 전체 테이블
              // 먼저 요청한 offset에서 1000개를 추출한 후에 북마크와 붙이면 1000개를 넘게 주게 된다. 이 경우는 북마크가 1:1 mapping이기 때문이다
              const query = `SELECT * 
                              FROM (
                                      SELECT CASE WHEN b2.b_id IS NULL THEN false ELSE b2.b_id END as _book, t1.*
                                        FROM ( 
                                              SELECT *
                                                FROM Total_Timeline 
                                              WHERE t_dateTime is not null
                                              ORDER BY t_id
                                              LIMIT ? OFFSET ?
                                              ) as t1
                                          LEFT JOIN BookMark_Mapper AS b2 ON 
                                                                b2.b_tableName = t1.t_tableName AND 
                                                                b2.b_tableId = t1.t_tableId AND 
                                                                b2.b_id = ?
                                    ) AS org
                                `
              const sourceTable = this.kapedb.prepare(query)
              re = sourceTable.all(pagesize, offset, param._b_id)
            } else {
              // [조건 1] t_dateTime이 not null 인 것
              // [조건 2] t_dateTime에 form /  to 특정 조건인 것
              // 맨처음 특정 page의 id를 기준으로 조회를 하게 된다.
              // 먼저 요청한 offset에서 1000개를 추출한 후에 북마크와 붙이면 1000개를 넘게 주게 된다. 이 경우는 북마크가 1:1 mapping이기 때문이다
              const query = `SELECT * 
                              FROM (
                                    SELECT CASE WHEN b2.b_id IS NULL THEN false ELSE b2.b_id END as _book, t1.*
                                    FROM (
                                            SELECT *
                                              FROM Total_Timeline 
                                            WHERE 
                                            t_dateTime is not null AND t_dateTime >= ? AND t_dateTime <= ?
                                            ORDER BY t_id
                                            LIMIT ? OFFSET ?
                                          ) as t1
                                    LEFT JOIN BookMark_Mapper AS b2 ON 
                                                          b2.b_tableName = t1.t_tableName AND 
                                                          b2.b_tableId = t1.t_tableId  AND 
                                                          b2.b_id = ?  
                                    ) AS org
                            `
              const sourceTable = this.kapedb.prepare(query)
              re = sourceTable.all(param._s_time, param._e_time, pagesize, offset, param._b_id)
            }
          } else {
            // 범주1 조건이 생성이 된다.
            if (param._full_time_range_flag === true) {
              // [조건 1] t_dateTime의 조건이 없기에 not null인 것만
              // [조건 2] cateogry_1 조건만
              // 먼저 요청한 offset에서 1000개를 추출한 후에 북마크와 붙이면 1000개를 넘게 주게 된다. 이 경우는 북마크가 1:1 mapping이기 때문이다
              const query = `SELECT * 
                              FROM (
                                    SELECT CASE WHEN b2.b_id IS NULL THEN false ELSE b2.b_id END as _book, t1.*
                                    FROM (
                                            SELECT *
                                              FROM Total_Timeline 
                                            WHERE 
                                            t_dateTime is not null AND category_1 IN (${param._categoryName})
                                            ORDER BY t_id
                                            LIMIT ? OFFSET ?
                                          ) as t1
                                    LEFT JOIN BookMark_Mapper AS b2 ON 
                                                          b2.b_tableName = t1.t_tableName AND 
                                                          b2.b_tableId = t1.t_tableId  AND 
                                                          b2.b_id = ?  
                                    ) AS org
                                  `
              const sourceTable = this.kapedb.prepare(query)
              re = sourceTable.all(pagesize, offset, param._b_id)
            } else {
              // [조건1] t_dateTime의 from / to 조건이 존재
              // [조건2] 범주1 조건 조건 추가
              // 먼저 요청한 offset에서 1000개를 추출한 후에 북마크와 붙이면 1000개를 넘게 주게 된다. 이 경우는 북마크가 1:1 mapping이기 때문이다
              const query = `SELECT * 
                              FROM (
                                    SELECT CASE WHEN b2.b_id IS NULL THEN false ELSE b2.b_id END as _book, t1.*
                                    FROM ( 
                                            SELECT *
                                              FROM Total_Timeline 
                                            WHERE 
                                              (t_dateTime is not null AND t_dateTime >= ? AND t_dateTime <= ?) AND category_1 IN (${param._categoryName}) 
                                            ORDER BY t_id
                                            LIMIT ? OFFSET ?
                                          ) as t1
                                    LEFT JOIN BookMark_Mapper AS b2 ON 
                                                          b2.b_tableName = t1.t_tableName AND 
                                                          b2.b_tableId = t1.t_tableId AND 
                                                          b2.b_id = ?  
                                    ) AS org
                                  `
              const sourceTable = this.kapedb.prepare(query)
              re = sourceTable.all(param._s_time, param._e_time, pagesize, offset, param._b_id)
            }
          }
          ////////////////////////////////////////////////////////////////////
        }
      }

      this.kapedb.exec('COMMIT')
      return re
    } catch (err) {
      this.kapedb.exec('ROLLBACK')
      console.error('syncSelectCountTimelineTable 중 오류 발생:', err)
      return undefined
    }
  }

  /**
   * add 20240108
   * 특정 시간을 주면 그 시간에서 가장 작은 t_id를 전달하는 함수.
   * 차트에서 선택을 하면 선택된 날짜에서 가장 작은 t_id의 레코드를 전달한다
   * 전제조건 : DB 연결이 되어 있어야 한다.
   * 결과 값은 undefined : 에러인 경우
   *          obj : 성공인 경우
   */
  syncOneSelectContentTimelineByTime(param_s_time: string) {
    let re: any | undefined = undefined

    // 트랜잭션 시작
    this.kapedb.exec('BEGIN TRANSACTION')

    try {
      const query = `
                        SELECT *
                          FROM Total_Timeline
                        WHERE t_id = ( select min(t_id) from Total_Timeline where t_dateTime is not null and t_dateTime >= ? )         
                      `
      const sourceTable = this.kapedb.prepare(query)
      re = sourceTable.get(param_s_time)

      this.kapedb.exec('COMMIT')
      return re
    } catch (err) {
      this.kapedb.exec('ROLLBACK')
      console.error('syncOneSelectContentTimelineByShortTable 중 오류 발생:', err)
      return undefined
    }
  }

  /**
   * add 20240108
   * 특정 시간을 주면 그 시간에서 가장 작은 t_id를 전달하는 함수.
   * 차트에서 선택을 하면 선택된 날짜에서 가장 작은 t_id의 레코드를 전달한다
   * 전제조건 : DB 연결이 되어 있어야 한다.
   * 결과 값은 undefined : 에러인 경우
   *          obj : 성공인 경우
   */
  syncOneSelectContentTimelineByTime_Category(param: DB_TIMELINE_CHART_QUERY_INFO) {
    let re: any | undefined = undefined

    const pattern = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/

    // 트랜잭션 시작
    this.kapedb.exec('BEGIN TRANSACTION')

    try {
      if (!pattern.test(param._s_time)) {
        throw new Error("_s_time 문자열이 'YYYY-MM-DD HH:MM:SS' 형식과 일치하지 않습니다.")
      }

      if (!pattern.test(param._e_time)) {
        throw new Error("_e_time 문자열이 'YYYY-MM-DD HH:MM:SS' 형식과 일치하지 않습니다.")
      }

      if (param._category1Name === '-') {
        const query = `
                  SELECT *
                    FROM Total_Timeline
                  WHERE t_id = ( select min(t_id) 
                                    from Total_Timeline 
                                  where t_dateTime is not null and 
                                      t_dateTime >= ? and t_dateTime < ? 
                              )         
                `
        const sourceTable = this.kapedb.prepare(query)
        re = sourceTable.get(param._s_time, param._e_time)
        console.log('case 1: ' + JSON.stringify(re))
      } else if (param._category2Name === '-') {
        const query = `
                  SELECT *
                    FROM Total_Timeline
                  WHERE t_id = ( select min(t_id) 
                                    from Total_Timeline 
                                  where t_dateTime is not null and 
                                      t_dateTime >= ? and t_dateTime < ? and 
                                      category_1 = ? 
                              )         
                `
        const sourceTable = this.kapedb.prepare(query)
        re = sourceTable.get(param._s_time, param._e_time, param._category1Name)
        console.log('case 2: ' + JSON.stringify(re))
      } else {
        const query = `
                  SELECT *
                    FROM Total_Timeline
                  WHERE t_id = ( select min(t_id) 
                                    from Total_Timeline 
                                  where t_dateTime is not null and 
                                      t_dateTime >= ? and t_dateTime < ? and 
                                      category_1 = ? and 
                                      category_2 = ? 
                              )         
                `
        const sourceTable = this.kapedb.prepare(query)
        re = sourceTable.get(param._s_time, param._e_time, param._category1Name, param._category2Name)
        console.log('case 3: ' + JSON.stringify(re))
      }

      this.kapedb.exec('COMMIT')
      return re
    } catch (err) {
      this.kapedb.exec('ROLLBACK')
      console.error('syncOneSelectContentTimelineByTime_Category 중 오류 발생:', err)
      return undefined
    }
  }

  /**
   * add 20240108
   * 특정 시간을 주면 그 시간에서 가장 작은 t_id를 전달하는 함수.
   * 차트에서 선택을 하면 선택된 날짜에서 가장 작은 t_id의 레코드를 전달한다
   * 전제조건 : DB 연결이 되어 있어야 한다.
   * 결과 값은 undefined : 에러인 경우
   *          obj : 성공인 경우
   */
  syncRangeSelectContentTimelineByTId() {
    let re_min: any | undefined = undefined
    let re_max: any | undefined = undefined

    // 트랜잭션 시작
    this.kapedb.exec('BEGIN TRANSACTION')

    try {
      const query_min = `
                        SELECT min(t_id) as min_id
                          FROM Total_Timeline
                        WHERE t_dateTime is not null         
                      `
      const sourceMinRow = this.kapedb.prepare(query_min)
      re_min = sourceMinRow.get()

      const query_max = `
                        SELECT max(t_id) as max_id
                          FROM Total_Timeline
                        WHERE t_dateTime is not null         
                      `
      const sourceMaxRow = this.kapedb.prepare(query_max)
      re_max = sourceMaxRow.get()

      this.kapedb.exec('COMMIT')
      const re: any[] = [re_min, re_max]
      return re
    } catch (err) {
      this.kapedb.exec('ROLLBACK')
      console.error('syncRangeSelectContentTimelineByTId 중 오류 발생:', err)
      return undefined
    }
  }

  /**
   * add 20240205
   * timeline chart에서 선택된 조건으로 최소의 temp_t_id를 찾는 것, 페이지의 정보를 알기위해서
   * 결과 값은 undefined : 에러인 경우
   *          obj : 성공인 경우
   */
  syncSelectMinTimelineGotoByCondition(param:DB_TIMELINE_QUERY_INFO) {
    let re_min: any | undefined = undefined
    

    // 트랜잭션 시작
    this.kapedb.exec('BEGIN TRANSACTION')

    try {
      if(param._full_search_flag === true && param._full_time_range_flag === false) {
        const query = `select temp_t_id, t_id 
                        from Total_Timeline_GotoInfo 
                        where t_dateTime >= ? 
                        order by temp_t_id
                        LIMIT 1 OFFSET 0
                      `
        const sourceTable = this.kapedb.prepare(query)
        re_min = sourceTable.get(param._s_time)
      } else if (param._full_search_flag === false && param._full_time_range_flag === true) {
        const query = `select temp_t_id, t_id 
                        from Total_Timeline_GotoInfo 
                        where category_1 = ? 
                        order by temp_t_id
                        LIMIT 1 OFFSET 0
                      `
        const sourceTable = this.kapedb.prepare(query)
        re_min = sourceTable.get(param._categoryName)
      } else {    // if (param._full_search_flag === false && param._full_time_range_flag === false) 그리고 
                  // (param._full_search_flag === true && param._full_time_range_flag === true) <== 이건 오면 안됨
        const query = `select temp_t_id, t_id 
                  from Total_Timeline_GotoInfo 
                  where category_1 = ? and
                        t_dateTime >= ?
                  order by temp_t_id
                  LIMIT 1 OFFSET 0
                `
        const sourceTable = this.kapedb.prepare(query)
        re_min = sourceTable.get(param._categoryName,param._s_time)
      }

      this.kapedb.exec('COMMIT')
      return re_min
    } catch (err) {
      this.kapedb.exec('ROLLBACK')
      console.error('syncSelectMinTimelineGotoByCondition 중 오류 발생:', err)
      return undefined
    }
  }

  /**
   * add 20240108
   * 타임라인 차트에는 북마크 정보가 없다.
   * 전제조건 : DB 연결이 되어 있어야 한다.
   * * Total_Timeline_Short테이블에는 t_dateTime 이 not null인 데이터가 미존재한다.그리고 순서는 t_dateTime, category_1 (날싸로 오름차순으로 테이블이 생성되어 있기에)
   *    그리고 t_dateTime 이 >= '1970-01-01 00:00:00'
   * 결과 값은 undefined : 에러인 경우
   *          obj[] : 성공인 경우
   */
  syncSelectContentTimelineShortTable(param: DB_TIMELINE_QUERY_INFO) {
    //////////////////////////////////////////////////////////////////////////////////////////
    // 출력 순서 변경 :  t_id로 변경 20240108
    //////////////////////////////////////////////////////////////////////////////////////////
    const offset: number = param._offset
    let pagesize
    if (param._pageSize !== undefined && param._pageSize >= 500) {
      // 20240108 change 1000 -> 500
      pagesize = param._pageSize

      // 20231205 추가 예외 처리 : 너무 많은 페이지로 요청할 경우, 메로리 부족으로 Node가 GC에러로 죽음
      if (pagesize > this.CreateDBpageSize) pagesize = this.CreateDBpageSize
    } else {
      pagesize = this.timelinePageSize // 500 정의가 안되어 있으면 500개로 제한함
    }

    let re: any[] | undefined = undefined

    // 트랜잭션 시작
    this.kapedb.exec('BEGIN TRANSACTION')

    try {
      {
        // undefined조건을 없앤다..혹시 front에서 잘못 주면 처리 못하기에...무조건 북마크 정보 없이 처리하게 한다.
        if (param._full_search_flag === true) {
          // full 검색이면서 기간이 없는 것
          if (param._full_time_range_flag === true) {
            const query = `
                            SELECT *
                              FROM Total_Timeline_Short 
                            ORDER BY t_dateTime, category_1
                            LIMIT ? OFFSET ?            
                          `
            const sourceTable = this.kapedb.prepare(query)
            re = sourceTable.all(pagesize, offset)
          } else {
            // full 검색이면서, 기간이 있는 것
            // 아래의 쿼리는 기간을 주고, 검색하며, 최소 500개
            const query = `
                            SELECT *
                              FROM Total_Timeline_Short 
                            WHERE 
                                  t_dateTime >= ? AND 
                                  t_dateTime <= ?
                            ORDER BY t_dateTime, category_1
                            LIMIT ? OFFSET ?
                          `
            const sourceTable = this.kapedb.prepare(query)
            re = sourceTable.all(param._s_time, param._e_time, pagesize, offset)
          }
        } else {
          // 범주1별 검색이면서, 시간 조건 없는 것
          if (param._full_time_range_flag === true) {
            // 아래의 쿼리는 범주1 의 값에 의해 추출된 타임라인 아트팩트 중에 사용자가 요청한 offset 만큼 추출할 것
            const query = `
                            SELECT *
                              FROM Total_Timeline_Short 
                            WHERE 
                                  category_1 = ? 
                            ORDER BY t_dateTime, category_1
                            LIMIT ? OFFSET ?
                          `
            const sourceTable = this.kapedb.prepare(query)
            re = sourceTable.all(param._categoryName, pagesize, offset)
          } else {
            // 기간으로 먼저 필터링하고, 범주로 나눈 것
            const query = `
                            SELECT *
                              FROM Total_Timeline_Short 
                            WHERE 
                                  ( t_dateTime >= ? AND 
                                    t_dateTime <= ?) AND 
                                  category_1 = ? 
                            ORDER BY t_dateTime, category_1
                            LIMIT ? OFFSET ?   
                          `
            const sourceTable = this.kapedb.prepare(query)
            re = sourceTable.all(param._s_time, param._e_time, param._categoryName, pagesize, offset)
          }
        }
        ////////////////////////////////////////////////////////////////////
      }

      this.kapedb.exec('COMMIT')
      return re
    } catch (err) {
      this.kapedb.exec('ROLLBACK')
      console.error('syncSelectContentTimelineShortTable 중 오류 발생:', err)
      return undefined
    }
  }

  /**
   * 타임라인 테이블 조건에 대한 레코드 정보 전달. with 북마크 ID도 포함됨(차트에 필요한 정보만 출력되게 한다)
   * DB 연결이 되어 있어야 한다.
   * 20240108 : 기존에 t_dateTime으로 sort가 되어 있기에, t_id기준으로 sort하면 됨, t_dateTime, category_1, category_2, category_3 ==> t_id
   * [주의 사항] 중간 과정에서 설정된 pagesize만큼 자르고 나서 북마크와 조인하기에,(param._b_id === 99999 북마크 ID를 99999로 할 경우 멀티북마크임)
   *            멀티 북마크를 보는 경우, 데이터가 증가 될 수 있음, 예로 pagesize를 1000로 만든 후 , 북마크 조인하면 1020개의 데이터가 될 수 있음
   *            (이때, [중요]같은 데이터가 북마크별로 같은 순서 위치에 존재한다. map 처리로 하나으 컬럼에 처리할 수 있음)
   * 결과 값은 undefined : 에러인 경우
   *          obj[] : 성공인 경우
   */
  syncSelectContentTimelineTableShortType(param: DB_TIMELINE_QUERY_INFO) {
    const offset: number = param._offset
    let pagesize
    if (param._pageSize !== undefined && param._pageSize > 1000) {
      pagesize = param._pageSize
      // 20231205 추가 예외 처리 : 너무 많은 페이지로 요청할 경우, 메로리 부족으로 Node가 GC에러로 죽음
      if (pagesize > this.CreateDBpageSize) pagesize = this.CreateDBpageSize
    } else {
      pagesize = this.pageSize
    }

    let re: any[] | undefined = undefined

    // 트랜잭션 시작
    this.kapedb.exec('BEGIN TRANSACTION')

    try {
      /////////////////////////////////////////////////////////////////////////////////////////////////
      // 북마크 id가 정의 되지 않은 경우 : 1개의 아트팩트에 대해 2개의 북마크가 있을 경우, 2개가 보여지게 된다.
      //////////////////////////////////////////////////////////////////////////////////////////////////
      // 20231215 : 수사 기관은 날짜 정보는 과거에서 부터 보고 싶어 한다. 받드시 ORDER BY를 ASC로 해야 한다.
      // order by _DateTime을 수행하면, null이 먼저 나오게 된다.
      if (param._b_id === undefined) {
        // 북마크 정보가 undefined이면 북마크 정보 없이 timeline정보만 가져오는것
        // 맨 처음 timeline을 볼 경우에는 북마크 정보가 없기에, 아래 블럭으로 처리해야 한다.
        ///////////////////////////////////////////////////////////
        if (param._full_search_flag === true) {
          // 범주1 조건 없음
          if (param._full_time_range_flag === true) {
            // 시간 조건 없음
            // 먼저 요청한 offset에서 1000개를 추출한 후에 북마크와 붙이면 1000개를 넘게 줄 수 있게 된다. 하나의 artifact에 2개의 북마크가 있으면
            // 레코드가 1개 더 존재하게 된다.
            const query = `SELECT * 
                            FROM (
                                    SELECT false as _book, t1.t_id, t1.t_dateTime, t1.t_attribute, t1.t_timelineCategory, t1.t_category, t1.t_type, t1.t_itemName, t1.t_itemValue
                                      FROM (
                                        SELECT *
                                          FROM Total_Timeline 
                                          WHERE t_dateTime is not null
                                          ORDER BY t_id
                                          LIMIT ? OFFSET ?
                                      ) as t1
                                  ) AS org
                          `
            const sourceTable = this.kapedb.prepare(query)
            re = sourceTable.all(pagesize, offset)
          } else {
            // 시간 조건 존재
            // 아래의 쿼리는 기간을 주고, 거기에서 1000개를 추출한 결과를 북마크과 조인하게 한다. 따라서, 레코드가 1000개를 넘을 수가 있음
            const query = `SELECT * 
                            FROM (
                                  SELECT false as _book, t1.t_id, t1.t_dateTime, t1.t_attribute, t1.t_timelineCategory, t1.t_category, t1.t_type, t1.t_itemName, t1.t_itemValue
                                  FROM ( 
                                          SELECT *
                                            FROM Total_Timeline 
                                          WHERE 
                                          t_dateTime is not null AND t_dateTime >= ? AND t_dateTime <= ?
                                          ORDER BY t_id
                                          LIMIT ? OFFSET ?
                                        ) as t1  
                                  ) AS org
                          `
            const sourceTable = this.kapedb.prepare(query)
            re = sourceTable.all(param._s_time, param._e_time, pagesize, offset)
          }
        } else {
          // 범주1 조건 존재
          if (param._full_time_range_flag === true) {
            // 시간 조건 없음
            // 아래의 쿼리는 범주1 의 값에 의해 추출된 타임라인 아트팩트 중에 사용자가 요청한 offset에서 1000를 추출한 후, 조인하는 것임
            // 따라서, 1000개를 넘게 전달할 수 있음
            const query = `SELECT * 
                            FROM (
                                  SELECT false as _book, t1.t_id, t1.t_dateTime, t1.t_attribute, t1.t_timelineCategory, t1.t_category, t1.t_type, t1.t_itemName, t1.t_itemValue
                                  FROM ( 
                                          SELECT *
                                            FROM Total_Timeline 
                                          WHERE 
                                          t_dateTime is not null AND category_1 = ? 
                                          ORDER BY t_id
                                          LIMIT ? OFFSET ?
                                        ) as t1   
                                  ) AS org
                          `
            const sourceTable = this.kapedb.prepare(query)
            re = sourceTable.all(param._categoryName, pagesize, offset)
          } else {
            // 시간조건 생성됨
            // 먼저 날짜로 필터링하고, 그리고 나서 범주로 필터링하여, limit를 수행한다(where은 왼쪽에서 오른쪽으로 진행)
            const query = `SELECT * 
                            FROM (
                                  SELECT false as _book, t1.t_id, t1.t_dateTime, t1.t_attribute, t1.t_timelineCategory, t1.t_category, t1.t_type, t1.t_itemName, t1.t_itemValue
                                    FROM ( 
                                            SELECT *
                                              FROM Total_Timeline 
                                            WHERE 
                                              (t_dateTime is not null AND t_dateTime >= ? AND t_dateTime <= ?) AND category_1 = ? 
                                            ORDER BY t_id
                                            LIMIT ? OFFSET ?
                                          ) as t1   
                                  ) AS org 
                          `
            const sourceTable = this.kapedb.prepare(query)
            re = sourceTable.all(param._s_time, param._e_time, param._categoryName, pagesize, offset)
          }
        }
        ////////////////////////////////////////////////////////////////////
      } else if (param._b_id === 99999) {
        /// 99999 는 북마크 전체를 조인하여 가져오는 것
        ///////////////////////////////////////////////////////////
        if (param._full_search_flag === true) {
          // 범주1 조건 없음
          if (param._full_time_range_flag === true) {
            // 시간 조건 없음
            // 먼저 요청한 offset에서 1000개를 추출한 후에 북마크와 붙이면 1000개를 넘게 줄 수 있게 된다. 하나의 artifact에 2개의 북마크가 있으면
            // 레코드가 1개 더 존재하게 된다.
            const query = `SELECT * 
                            FROM (
                                    SELECT CASE WHEN b2.b_id IS NULL THEN false ELSE b2.b_id END as _book, t1.t_id, t1.t_dateTime, t1.t_attribute, t1.t_timelineCategory, t1.t_category, t1.t_type, t1.t_itemName, t1.t_itemValue
                                      FROM (
                                        SELECT *
                                          FROM Total_Timeline 
                                          WHERE t_dateTime is not null
                                          ORDER BY t_id
                                          LIMIT ? OFFSET ?
                                      ) as t1
                                      LEFT JOIN BookMark_Mapper AS b2 ON 
                                                            b2.b_tableName = t1.t_tableName AND 
                                                            b2.b_tableId = t1.t_tableId
                                  ) AS org
                          `
            const sourceTable = this.kapedb.prepare(query)
            re = sourceTable.all(pagesize, offset)

            // TODO-MULTI_BOOKMARK 필요
          } else {
            // 시간 조건 생성
            // 아래의 쿼리는 기간을 주고, 거기에서 1000개를 추출한 결과를 북마크과 조인하게 한다. 따라서, 레코드가 1000개를 넘을 수가 있음
            const query = `SELECT * 
                            FROM (
                                  SELECT CASE WHEN b2.b_id IS NULL THEN false ELSE b2.b_id END as _book, t1.t_id, t1.t_dateTime, t1.t_attribute, t1.t_timelineCategory, t1.t_category, t1.t_type, t1.t_itemName, t1.t_itemValue
                                  FROM ( 
                                          SELECT *
                                            FROM Total_Timeline 
                                          WHERE 
                                          t_dateTime is not null AND t_dateTime >= ? AND t_dateTime <= ?
                                          ORDER BY t_id
                                          LIMIT ? OFFSET ?
                                        ) as t1
                                  LEFT JOIN BookMark_Mapper AS b2 ON 
                                                        b2.b_tableName = t1.t_tableName AND 
                                                        b2.b_tableId = t1.t_TableId   
                                  ) AS org
                          `
            const sourceTable = this.kapedb.prepare(query)
            re = sourceTable.all(param._s_time, param._e_time, pagesize, offset)

            // TODO-MULTI_BOOKMARK 필요
          }
        } else {
          // 범주1 조건 생성됨
          if (param._full_time_range_flag === true) {
            // 시간 조건 없음
            // 아래의 쿼리는 범주1 의 값에 의해 추출된 타임라인 아트팩트 중에 사용자가 요청한 offset에서 1000를 추출한 후, 조인하는 것임
            // 따라서, 1000개를 넘게 전달할 수 있음
            const query = `SELECT * 
                            FROM (
                                  SELECT CASE WHEN b2.b_id IS NULL THEN false ELSE b2.b_id END as _book, t1.t_id, t1.t_dateTime, t1.t_attribute, t1.t_timelineCategory, t1.t_category, t1.t_type, t1.t_itemName, t1.t_itemValue
                                  FROM ( 
                                          SELECT *
                                            FROM Total_Timeline 
                                          WHERE 
                                          t_dateTime is not null AND category_1 = ? 
                                          ORDER BY t_id
                                          LIMIT ? OFFSET ?
                                        ) as t1
                                  LEFT JOIN BookMark_Mapper AS b2 ON 
                                                        b2.b_tableName = t1.t_tableName AND 
                                                        b2.b_tableId = t1.t_tableId   
                                  ) AS org
                          `
            const sourceTable = this.kapedb.prepare(query)
            re = sourceTable.all(param._categoryName, pagesize, offset)

            // TODO-MULTI_BOOKMARK 필요
          } else {
            // 시간 조건 생성됨
            // 먼저 날짜로 필터링하고, 그리고 나서 범주로 필터링하여, limit를 수행한다(where은 왼쪽에서 오른쪽으로 진행)
            const query = `SELECT * 
                            FROM (
                                  SELECT CASE WHEN b2.b_id IS NULL THEN false ELSE b2.b_id END as _book, t1.t_id, t1.t_dateTime, t1.t_attribute, t1.t_timelineCategory, t1.t_category, t1.t_type, t1.t_itemName, t1.t_itemValue
                                    FROM ( 
                                            SELECT *
                                              FROM Total_Timeline 
                                            WHERE 
                                              (t_dateTime is not null AND t_dateTime >= ? AND t_dateTime <= ?) AND category_1 = ? 
                                            ORDER BY t_id
                                            LIMIT ? OFFSET ?
                                          ) as t1
                                  LEFT JOIN BookMark_Mapper AS b2 ON 
                                                        b2.b_tableName = t1.t_tableName AND 
                                                        b2.b_tableId = t1.t_tableId   
                                  ) AS org 
                          `
            const sourceTable = this.kapedb.prepare(query)
            re = sourceTable.all(param._s_time, param._e_time, param._categoryName, pagesize, offset)

            // TODO-MULTI_BOOKMARK 필요
          }
        }
        ////////////////////////////////////////////////////////////////////
      } else {
        ///////////////////////////////////////////////////////////
        // B_Id가 정의가 된 경우
        // B_Id가 존재할 경우에는 개수 정보가 북마크를 이용하지 않는 것과 동일하다. 1:1 mapping이기에...
        ///////////////////////////////////////////////////////////
        if (param._full_search_flag === true) {
          // 범주1 조건 없음
          if (param._full_time_range_flag === true) {
            // 시간 조건 없음
            // 먼저 요청한 offset에서 1000개를 추출한 후에 북마크와 붙이면 1000개를 넘게 주게 된다. 이 경우는 북마크가 1:1 mapping이기 때문이다
            const query = `SELECT * 
                              FROM (
                                      SELECT CASE WHEN b2.b_id IS NULL THEN false ELSE b2.b_id END as _book, t1.t_id, t1.t_dateTime, t1.t_attribute, t1.t_timelineCategory, t1.t_category, t1.t_type, t1.t_itemName, t1.t_itemValue
                                        FROM ( 
                                              SELECT *
                                                FROM Total_Timeline 
                                              WHERE t_dateTime is not null
                                              ORDER BY t_id
                                              LIMIT ? OFFSET ?
                                              ) as t1
                                          LEFT JOIN BookMark_Mapper AS b2 ON 
                                                                b2.b_tableName = t1.t_tableName AND 
                                                                b2.b_tableId = t1.t_tableId AND 
                                                                b2.b_id = ?
                                    ) AS org
                                `
            const sourceTable = this.kapedb.prepare(query)
            re = sourceTable.all(pagesize, offset, param._b_id)
          } else {
            // 시간 조건 존재
            // 먼저 요청한 offset에서 1000개를 추출한 후에 북마크와 붙이면 1000개를 넘게 주게 된다. 이 경우는 북마크가 1:1 mapping이기 때문이다
            const query = `SELECT * 
                              FROM (
                                    SELECT CASE WHEN b2.b_id IS NULL THEN false ELSE b2.b_id END as _book, t1.t_id, t1.t_dateTime, t1.t_attribute, t1.t_timelineCategory, t1.t_category, t1.t_type, t1.t_itemName, t1.t_itemValue
                                    FROM (
                                            SELECT *
                                              FROM Total_Timeline 
                                            WHERE 
                                            t_dateTime is not null AND t_dateTime >= ? AND t_dateTime <= ?
                                            ORDER BY t_id
                                            LIMIT ? OFFSET ?
                                          ) as t1
                                    LEFT JOIN BookMark_Mapper AS b2 ON 
                                                          b2.b_tableName = t1.t_tableName AND 
                                                          b2.b_tableId = t1.t_tableId  AND 
                                                          b2.b_id = ?  
                                    ) AS org
                            `
            const sourceTable = this.kapedb.prepare(query)
            re = sourceTable.all(param._s_time, param._e_time, pagesize, offset, param._b_id)
          }
        } else {
          // 범주1 조건 존재
          if (param._full_time_range_flag === true) {
            // 시간 조건 없음
            // 먼저 요청한 offset에서 1000개를 추출한 후에 북마크와 붙이면 1000개를 넘게 주게 된다. 이 경우는 북마크가 1:1 mapping이기 때문이다
            const query = `SELECT * 
                              FROM (
                                    SELECT CASE WHEN b2.b_id IS NULL THEN false ELSE b2.b_id END as _book, t1.t_id, t1.t_dateTime, t1.t_attribute, t1.t_timelineCategory, t1.t_category, t1.t_type, t1.t_itemName, t1.t_itemValue
                                    FROM (
                                            SELECT *
                                              FROM Total_Timeline 
                                            WHERE 
                                            t_dateTime is not null AND category_1 = ?
                                            ORDER BY t_id
                                            LIMIT ? OFFSET ?
                                          ) as t1
                                    LEFT JOIN BookMark_Mapper AS b2 ON 
                                                          b2.b_tableName = t1.t_tableName AND 
                                                          b2.b_tableId = t1.t_tableId  AND 
                                                          b2.b_id = ?  
                                    ) AS org
                                  `
            const sourceTable = this.kapedb.prepare(query)
            re = sourceTable.all(param._categoryName, pagesize, offset, param._b_id)
          } else {
            // 시간 조건 있음
            // 먼저 요청한 offset에서 1000개를 추출한 후에 북마크와 붙이면 1000개를 넘게 주게 된다. 이 경우는 북마크가 1:1 mapping이기 때문이다
            const query = `SELECT * 
                              FROM (
                                    SELECT CASE WHEN b2.b_id IS NULL THEN false ELSE b2.b_id END as _book, t1.t_id, t1.t_dateTime, t1.t_attribute, t1.t_timelineCategory, t1.t_category, t1.t_type, t1.t_itemName, t1.t_itemValue
                                    FROM ( 
                                            SELECT *
                                              FROM Total_Timeline 
                                            WHERE 
                                              (t_dateTime is not null AND t_dateTime >= ? AND t_dateTime <= ?) AND category_1 = ? 
                                            ORDER BY t_id
                                            LIMIT ? OFFSET ?
                                          ) as t1
                                    LEFT JOIN BookMark_Mapper AS b2 ON 
                                                          b2.b_tableName = t1.t_tableName AND 
                                                          b2.b_tableId = t1.t_tableId  AND 
                                                          b2.b_id = ?  
                                    ) AS org
                                  `
            const sourceTable = this.kapedb.prepare(query)
            re = sourceTable.all(param._s_time, param._e_time, param._categoryName, pagesize, offset, param._b_id)
          }
        }
        ////////////////////////////////////////////////////////////////////
      }

      this.kapedb.exec('COMMIT')
      return re
    } catch (err) {
      this.kapedb.exec('ROLLBACK')
      console.error('syncSelectCountTimelineTable 중 오류 발생:', err)
      return undefined
    }
  }

  /**
   * 타임라인 테이블의 Category_1별 레코드 개수 전달
   * DB 연결이 되어 있어야 한다.
   * 결과 값은 undefined : 에러인 경우
   *          obj [] : 성공인 경우
   */
  async selectSummaryTimelineTable(): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      const offset = 0
      const eachPageSize = 1000
      let re: any = []

      {
        // 트랜잭션 시작
        this.kapedb.exec('BEGIN TRANSACTION')

        try {
          const query = `SELECT category_1, count(*) as total_cnt 
                          FROM Total_Timeline 
                          group by category_1
                          LIMIT ? OFFSET ?`
          const sourceTable = this.kapedb.prepare(query)
          const rows = sourceTable.all(eachPageSize, offset)

          if (rows.length !== 0) {
            re = rows
          }
        } catch (err) {
          this.kapedb.exec('ROLLBACK')
          console.error('selectSummaryTimelineTable 중 오류 발생:', err)
          reject(undefined)
        } finally {
          this.kapedb.exec('COMMIT')
          resolve(re)
        }
      }
    }) // end of new Promise()
  }

  /**
   * offset는 0 부터 시작이고, 만약 page가 10이면 다음을 10을 주어야 함
   * offset = offset + pagesize 로 관리해야 한다.
   * 테이블 정보를 주면, 결과 객체 파일을 만들어 주는 함수
   * DB 연결이 되어 있어야 한다.
   * 20240103 : columnlist 추가
   * [주의 사항] 현재 구조에서는 데이터를 1000개로 잘라서 조회하는 것이 메인이라, 최종 북마크 테이블과 JOIN하면 1000개를 넘길 수 있음, 현재 구조에서]
   *            TODO-MULTI_BOOKMARK 처리 기능 필요 - 중복된 것을 하나의 배열로 처리하는 것
   * @return : success : obj[], 조회 결과가 없으면 빈 배열이 전달됨
   *           fail : undefined
   */
  async selectEachTable(queryOption: DB_QUERY_PARAM): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      // 아래의 두개는 필수 정보
      const offset = queryOption.queryOffset
      const tableName = queryOption.queryTable
      /////////////////////////////////////////
      // front에서 pagesize를 조정하여 요청할 경우, 더 많이 처리하여 줄 수 있게 한다.
      let eachPageSize = queryOption.queryPageSize //this.pageSize //20231108 : 100000 -> 20231114 :1000
      if (
        queryOption.queryPageSize !== undefined &&
        queryOption.queryPageSize > 0 && // delete 20240105 만약 front에서 1 ~ 99999 까지 요청하면 설정해수 준다
        queryOption.queryPageSize < 100
      )
        eachPageSize = 100

      // 250000: 메모리 에러 발생, 500000: 메모리 에러, 4000000:에러발생함
      let re: any = undefined

      const columnList = this.tableSetting[tableName].select1 // add 20240103 for col_list

      ////////////////////
      // better-sqlite3 code
      ////////////////////
      {
        // 트랜잭션 시작
        this.kapedb.exec('BEGIN TRANSACTION')

        try {
          if (queryOption.queryBookMarkId !== undefined) {
            //////////////////////////////////////////////
            // 북마크의 정보가 포함되어 보여지는 경우
            //////////////////////////////////////////////
            if (queryOption.querySortFlag === false) {
              const sourceTable = this.kapedb.prepare(`
                          SELECT CASE WHEN b1.b_id IS NULL THEN false ELSE b1.b_id END as _book, org.*
                              FROM (
                                  select ${columnList} 
                                      from ${tableName} 
                                  limit ?  offset ?
                                ) AS org
                          LEFT JOIN BookMark_Mapper AS b1
                                        ON b1.b_tableName = '${tableName}' AND 
                                        b1.b_tableId = org.a_id AND 
                                        b1.b_id = ?
                        `)
              const rows = sourceTable.all(eachPageSize, offset, queryOption.queryBookMarkId)

              if (rows.length !== 0) {
                re = rows
                console.log('one-select-table: offset, row_count:', offset, re.length, tableName)
              } else {
                re = [] // 정상 처리되었지만, 조회결과가 없다
                console.log('one-select-table: NoData, offset, row_count:', offset, re.length, tableName)
              }
            } else {
              // sort를 해서 전달해야 하는 경우
              if (queryOption.querySortDescFlag) {
                // DESC
                const sourceTable = this.kapedb.prepare(`
                          SELECT CASE WHEN b1.b_id IS NULL THEN false ELSE b1.b_id END as _book, org.*
                              FROM (
                                    select ${columnList} 
                                      from ${tableName} 
                                    ORDER BY \"${queryOption.querySortColName}\" DESC
                                    limit ?  offset ?
                                  ) AS org
                              LEFT JOIN BookMark_Mapper AS b1
                                                  ON b1.b_tableName = '${tableName}' AND 
                                                  b1.b_tableId = org.a_id AND 
                                                  b1.b_id = ?
                          
                        `)
                const rows = sourceTable.all(eachPageSize, offset, queryOption.queryBookMarkId)

                if (rows.length !== 0) {
                  re = rows
                  console.log(
                    'one-select-table desc order: offset, row_count, col:',
                    offset,
                    re.length,
                    queryOption.queryBookMarkId,
                    queryOption.querySortColName,
                    tableName
                  )
                } else {
                  re = [] // 정상 처리되었지만, 조회결과가 없다
                  console.log(
                    'one-select-table desc order: NoData, offset, row_count, col:',
                    offset,
                    re.length,
                    queryOption.queryBookMarkId,
                    queryOption.querySortColName,
                    tableName
                  )
                }
              } else {
                // ASC
                const sourceTable = this.kapedb.prepare(`
                          SELECT CASE WHEN b1.b_id IS NULL THEN false ELSE b1.b_id END as _book, org.*
                              FROM (
                                    select ${columnList} 
                                      from ${tableName} 
                                      ORDER BY \"${queryOption.querySortColName}\" ASC
                                    limit ?  offset ?
                                    ) AS org
                              LEFT JOIN BookMark_Mapper AS b1
                                                  ON b1.b_tableName = '${tableName}' AND 
                                                  b1.b_tableId = org.a_id AND 
                                                  b1.b_id = ?
                          
                        `)
                const rows = sourceTable.all(eachPageSize, offset, queryOption.queryBookMarkId)

                if (rows.length !== 0) {
                  re = rows
                  console.log(
                    'one-select-table asc order: offset, row_count, col:',
                    offset,
                    re.length,
                    queryOption.queryBookMarkId,
                    queryOption.querySortColName,
                    tableName
                  )
                } else {
                  re = [] // 정상 처리되었지만, 조회결과가 없다
                  console.log(
                    'one-select-table asc order: NoData, offset, row_count, col:',
                    offset,
                    re.length,
                    queryOption.queryBookMarkId,
                    queryOption.querySortColName,
                    tableName
                  )
                }
              }
            }
          } else {
            /////////////////////////////////////////////////////////////
            // [주의] 먼저 추출할 테이블 정보를 최대로 추출(sort까지 완료)한 후,
            //        북마크 정보가 undefined로 정의되므로 모든 북마크를 조인하게 된다
            // 따라서 같은 테이블 레코드에 대해서 가중복으로 데이터가 보이게 된다. 그러므로 1000개를 추출이 되었다면, 1007로 전달이 될 수 있다.
            /////////////////////////////////////////////////////////////
            if (queryOption.querySortFlag === false) {
              const sourceTable = this.kapedb.prepare(`
                          SELECT CASE WHEN b1.b_id IS NULL THEN false ELSE b1.b_id END as _book, org.*
                              FROM (
                                    select ${columnList} 
                                      from ${tableName} 
                                    limit ?  offset ?
                                    ) AS org
                              LEFT JOIN BookMark_Mapper AS b1
                                                    ON b1.b_tableName = '${tableName}' AND 
                                                    b1.b_tableId = org.a_id 
                        `)
              const rows = sourceTable.all(eachPageSize, offset)

              if (rows.length !== 0) {
                // TODO-MULTI_BOOKMARK

                re = rows
                console.log('one-select-table(no_bk): offset, row_count:', offset, re.length, tableName)
              } else {
                re = [] // 정상 처리되었지만, 조회결과가 없다
                console.log('one-select-table(no_bk): NoData, offset, row_count:', offset, re.length, tableName)
              }
            } else {
              // sort를 해서 전달해야 하는 경우
              if (queryOption.querySortDescFlag) {
                // DESC
                const sourceTable = this.kapedb.prepare(`
                          SELECT CASE WHEN b1.b_id IS NULL THEN false ELSE b1.b_id END as _book, org.*
                              FROM (
                                    select ${columnList} 
                                      from ${tableName} 
                                    ORDER BY \"${queryOption.querySortColName}\" DESC
                                    limit ?  offset ?
                                    ) AS org
                              LEFT JOIN BookMark_Mapper AS b1
                                                  ON b1.b_tableName = '${tableName}' AND 
                                                  b1.b_tableId = org.a_id 
                          
                        `)
                const rows = sourceTable.all(eachPageSize, offset)

                if (rows.length !== 0) {
                  // TODO-MULTI_BOOKMARK

                  re = rows
                  console.log(
                    'one-select-table desc order(no_bk): offset, row_count, col:',
                    offset,
                    re.length,
                    queryOption.querySortColName,
                    tableName
                  )
                } else {
                  re = [] // 정상 처리되었지만, 조회결과가 없다
                  console.log(
                    'one-select-table desc order(no_bk): NoData, offset, row_count, col:',
                    offset,
                    re.length,
                    queryOption.querySortColName,
                    tableName
                  )
                }
              } else {
                // ASC
                const sourceTable = this.kapedb.prepare(`
                          SELECT CASE WHEN b1.b_id IS NULL THEN false ELSE b1.b_id END as _book, org.*
                              FROM (
                                    select ${columnList} 
                                      from ${tableName} 
                                    ORDER BY \"${queryOption.querySortColName}\" ASC
                                    limit ?  offset ?
                                    ) AS org
                          LEFT JOIN BookMark_Mapper AS b1
                                                ON b1.b_tableName = '${tableName}' AND 
                                                b1.b_tableId = org.a_id 
                          
                        `)
                const rows = sourceTable.all(eachPageSize, offset)

                if (rows.length !== 0) {
                  // TODO-MULTI_BOOKMARK

                  re = rows
                  console.log(
                    'one-select-table asc order(no_bk): offset, row_count, col:',
                    offset,
                    re.length,
                    queryOption.querySortColName,
                    tableName
                  )
                } else {
                  re = [] // 정상 처리되었지만, 조회결과가 없다
                  console.log(
                    'one-select-table asc order(no_bk): NoData, offset, row_count, col:',
                    offset,
                    re.length,
                    queryOption.querySortColName,
                    tableName
                  )
                }
              }
            }
          }
        } catch (err) {
          this.kapedb.exec('ROLLBACK')
          console.error('selectEachTable 중 오류 발생:', err, tableName)
          reject(undefined)
        } finally {
          this.kapedb.exec('COMMIT')
          resolve(re)
        }
      }
      //////////////////////////////////////// end of better-sqlite3 code
    })
  }

  /**
   * 테이블 정보와 offset은 검색하고 싶은 테이블의 index값를 주면, 1개의 row 정보를 준다
   * DB 연결이 되어 있어야 한다.
   * @return : success : obj[] 배열에는 1개의 정보만 있다
   *           fail : undefined
   */
  async selectOneRow(queryOption: DB_QUERY_PARAM): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      const index = queryOption.queryOffset
      const tableName = queryOption.queryTable
      let re: any = undefined

      ////////////////////
      // better-sqlite3 code
      ////////////////////
      {
        // 트랜잭션 시작
        this.kapedb.exec('BEGIN TRANSACTION')

        try {
          const columnList = this.tableSetting[tableName].select1 // add 20240103 for col_list
          const sourceTable = this.kapedb.prepare(`
                            SELECT ${columnList} 
                                FROM ${tableName}
                            WHERE a_id = ?
                          `)
          const row = sourceTable.get(index)

          if (row !== undefined) {
            re = row
            console.log('one-row-table: index, row_count:', index, re.length)
          }
        } catch (err) {
          this.kapedb.exec('ROLLBACK')
          console.error('selectOneRow 중 오류 발생:', err)
          reject(undefined)
        } finally {
          this.kapedb.exec('COMMIT')
          resolve(re)
        }
      }
      //////////////////////////////////////// end of better-sqlite3 code
    })
  }

    /**
   * 북마크 정보 변경에 대해 처리 할 레코드 개수는 무조건 1개이어야 한다.
   * @param insertData 
   * @returns 
   */
    async asyncChangeWillDeleteBookMarkMapper(insertData: DB_BOOKMARK_MAPPER_INFO[]): Promise<ERROR_CODE> {
      return new Promise<ERROR_CODE>((resolve, reject) => {
      
        if(insertData.length > 1 ) {
          reject('D007')
        } else {
          
          // 트랜잭션 시작
          this.kapedb.exec('BEGIN TRANSACTION')
      
          try {
            const bookmarkmapper = insertData[0]

            // UPDATE 작업 수행
            const query = `UPDATE BookMark_mapper 
                              SET will_delete = ?
                            WHERE b_id = ? AND b_tableName = ? AND b_tableId = ?
                          `
            const stmt = this.kapedb.prepare(query)
            const info = stmt.run(
            bookmarkmapper._will_delete,
            bookmarkmapper._id,
            bookmarkmapper._tableName,
            bookmarkmapper._tableIdx
            )
  
            this.kapedb.exec('COMMIT')
            resolve('_000')
          } catch (err) {
            this.kapedb.exec('ROLLBACK')
            console.error('asyncInsertBookMarkMapper 중 오류 발생:', err)
            reject('D003')
          }
  
        }
      }) // end of new Promise()
    }

  /**
   * 북마크로 추가해야 할 레코드 개수는 무조건 1개이어야 한다.
   * @param insertData 
   * @returns 
   */
  async asyncInsertBookMarkMapper(insertData: DB_BOOKMARK_MAPPER_INFO[]): Promise<ERROR_CODE> {
    return new Promise<ERROR_CODE>((resolve, reject) => {
	  
      if(insertData.length > 1 ) {
        reject('D007')
      } else {
        
        // 트랜잭션 시작
        this.kapedb.exec('BEGIN TRANSACTION')
    
        try {
          for (let i = 0; i < insertData.length; i++) {
            const bookmarkmapper = insertData[i]

            // 전에 작업과 내용이 다르면 insert를 수행하고 같으면 skip --> PK조건에 위반을 피하기 위해 insert or ignore수행
            const query = `INSERT OR IGNORE INTO BookMark_mapper (b_id, b_tableName, b_tableId, category_1, category_2, category_3) 
                      VALUES (?, ?, ?, ?, ?, ?)
                    `
            const stmt = this.kapedb.prepare(query)
            stmt.run(
              bookmarkmapper._id,
              bookmarkmapper._tableName,
              bookmarkmapper._tableIdx,
              bookmarkmapper._category_1,
              bookmarkmapper._category_2,
              bookmarkmapper._category_3
            )

          } // end of for loop

          this.kapedb.exec('COMMIT')
          resolve('_000')
        } catch (err) {
          this.kapedb.exec('ROLLBACK')
          console.error('asyncInsertBookMarkMapper 중 오류 발생:', err)
          reject('D003')
        }

      }
    }) // end of new Promise()
  }

/**
   * 북마크로 삭제해야 할 레코드 개수는 무조건 1개이어야 한다.
   * @param deleteData 
   * @returns 
   */
async asyncDeleteBookMarkMapper(deleteData: DB_BOOKMARK_MAPPER_INFO[]): Promise<ERROR_CODE> {
  return new Promise<ERROR_CODE>((resolve, reject) => {
    
    if(deleteData.length > 1 ) {
      reject('D007')
    } else {
      
      // 트랜잭션 시작
      this.kapedb.exec('BEGIN TRANSACTION')
  
      try {
        for (let i = 0; i < deleteData.length; i++) {
          const bookmarkmapper = deleteData[i]

          // 전에 작업과 내용이 다르면 insert를 수행하고 같으면 skip --> PK조건에 위반을 피하기 위해 insert or ignore수행
          const query = `DELETE FROM BookMark_mapper 
                              WHERE b_id = ? AND  b_tableName = ? and b_tableId = ?`
          const stmt = this.kapedb.prepare(query)
          stmt.run(bookmarkmapper._id, bookmarkmapper._tableName, bookmarkmapper._tableIdx)

        } // end of for loop

        this.kapedb.exec('COMMIT')
        resolve('_000')
      } catch (err) {
        this.kapedb.exec('ROLLBACK')
        console.error('asyncDeleteBookMarkMapper 중 오류 발생:', err)
        reject('D003')
      }

    }
  }) // end of new Promise()
}

  /**
   * bookmark_mapper 테이블에 데이터를 입력하는 것
   * insert중복이면 update를 수행하게 함--> 해당 내용 삭제함. 하나의 아트팩트에 여러개의 북마크 id가 설정될 수 있음
   * 해당 API는 시간이 오래 걸릴 수 있으므로 Thread로 동작하게 한다. 따라서, Sync로 만듦
   * @input : DB_BOOKMARK_MAPPER_INFO 객체의 배열
   * @result : -1 : 에러 발생
   *           0 이상이면 sql정상 동작
   */
  insertBookMarkMapper(insertData: DB_BOOKMARK_MAPPER_INFO[]) {
    let re: number

    ///////////////////
    // for better-sqlite3
    ///////////////////
    {
      // 트랜잭션 시작
      this.kapedb.exec('BEGIN TRANSACTION')

      re = 0
      try {
        for (let i = 0; i < insertData.length; i++) {
          const bookmarkmapper = insertData[i]

          // 전에 작업과 내용이 다르면 insert를 수행하고 같으면 skip --> PK조건에 위반을 피하기 위해 insert or ignore수행
          const query = `INSERT OR IGNORE INTO BookMark_mapper (b_id, b_tableName, b_tableId, category_1, category_2, category_3) 
                              VALUES (?, ?, ?, ?, ?, ?)
                          `
          const stmt = this.kapedb.prepare(query)
          const info = stmt.run(
            bookmarkmapper._id,
            bookmarkmapper._tableName,
            bookmarkmapper._tableIdx,
            bookmarkmapper._category_1,
            bookmarkmapper._category_2,
            bookmarkmapper._category_3
          )

          if (info.changes > 0) {
            re++
          } else {
            re++ // insert or ignore into 문에 의한 예외 처리
          }
        } // end of for loop

        this.kapedb.exec('COMMIT')
        return re
      } catch (err) {
        this.kapedb.exec('ROLLBACK')
        console.error('insertBookMarkMapper 중 오류 발생:', err)
        return -1
      }
    }
  }

  /**
   * bookmark_mapper 테이블에서 will_delete 필드 값을 1 또는 0로 설정하는 것 UPDATE 구문
   * 해당 API는 시간이 오래 걸릴 수 있으므로 Thread로 동작하게 한다. 따라서, Sync로 만듦
   * @input : DB_BOOKMARK_MAPPER_INFO 객체의 배열
   * @result : -1 : 에러 발생
   *           0 이상이면 sql정상 동작
   */
  changeWillDelBookMarkMapper(insertData: DB_BOOKMARK_MAPPER_INFO[]) {
    let re: number

    {
      // 트랜잭션 시작
      this.kapedb.exec('BEGIN TRANSACTION')

      re = 0
      try {
        for (let i = 0; i < insertData.length; i++) {
          const bookmarkmapper = insertData[i]

          // UPDATE 작업 수행
          const query = `UPDATE BookMark_mapper 
                            SET will_delete = ?
                          WHERE b_id = ? AND b_tableName = ? AND b_tableId = ?
                          `
          const stmt = this.kapedb.prepare(query)
          const info = stmt.run(
            bookmarkmapper._will_delete,
            bookmarkmapper._id,
            bookmarkmapper._tableName,
            bookmarkmapper._tableIdx
          )

          if (info.changes > 0) {
            re++
          } else {
            re++ // insert or ignore into 문에 의한 예외 처리
          }
        } // end of for loop

        this.kapedb.exec('COMMIT')
        return re
      } catch (err) {
        this.kapedb.exec('ROLLBACK')
        console.error('changeWillDelBookMarkMapper 중 오류 발생:', err)
        return -1
      }
    }
  }

    /**
   * bookmark_mapper 테이블에서 will_delete 필드 값이 1인 것을 삭제하는 구문
   * 해당 API는 시간이 오래 걸릴 수 있으므로 Thread로 동작하게 한다. 따라서, Sync로 만듦
   * @input : DB_BOOKMARK_MAPPER_INFO 객체의 배열
   * @result : -1 : 에러 발생
   *           0 이상이면 sql정상 동작
   */
  DoWillDelBookMarkMapper(insertData: DB_BOOKMARK_MAPPER_INFO[]) {
      let re: number
      {
        // 트랜잭션 시작
        this.kapedb.exec('BEGIN TRANSACTION')
  
        re = 0
        try {
          
          const bookmarkmapper = insertData[0]

          // UPDATE 작업 수행
          const query = `DELETE FROM BookMark_mapper 
                          WHERE b_id = ? AND b_tableName = ? AND will_delete = 1
                          `
          const stmt = this.kapedb.prepare(query)
          const info = stmt.run(
          bookmarkmapper._id,
          bookmarkmapper._tableName
          )

          if (info.changes > 0) {
            re++
          } else {
            re++ // insert or ignore into 문에 의한 예외 처리
          }
          
          this.kapedb.exec('COMMIT')
          return re
        } catch (err) {
          this.kapedb.exec('ROLLBACK')
          console.error('DoWillDelBookMarkMapper 중 오류 발생:', err)
          return -1
        }
      }
    }

  /**
   * bookmakr_mapper 테이블에 데이터를 입력하는 것
   * insert중복이면 update를 수행하게 함
   * 해당 API는 시간이 오래 걸릴 수 있으므로 Thread로 동작하게 한다. 따라서, Sync로 만듦
   * @input : DB_BOOKMARK_MAPPER_INFO 객체의 배열
   * @result : -1 : 에러 발생
   *           0 이상이면 sql정상 동작
   */
  deleteBookMarkMapper(insertData: DB_BOOKMARK_MAPPER_INFO[]) {
    let re: number

    ///////////////////
    // for better-sqlite3
    ///////////////////
    {
      // 트랜잭션 시작
      this.kapedb.exec('BEGIN TRANSACTION')

      re = 0
      try {
        for (let i = 0; i < insertData.length; i++) {
          const bookmarkmapper = insertData[i]
          const query = `DELETE FROM BookMark_mapper 
                              WHERE b_id = ? AND  b_tableName = ? and b_tableId = ?`
          const stmt = this.kapedb.prepare(query)
          const info = stmt.run(bookmarkmapper._id, bookmarkmapper._tableName, bookmarkmapper._tableIdx)

          if (info.changes >= 0) re++
        } // end of for loop

        this.kapedb.exec('COMMIT')
        return re
      } catch (err) {
        this.kapedb.exec('ROLLBACK')
        console.error('insertBookMarkMapper 중 오류 발생:', err)
        return -1
      }
    }
  }

  transformRows(rows: Array<any>): Array<any> {
    // Map관련 변수를 생성하는데, key는 string타입이고, value는 any타입으로 되어 있는 것
    const rowsMap = new Map<string, any>()

    // 전달 받은 배열을 하나씩 처리하는 방법 , const element of element_list
    for (const row of rows) {
      const { _book, ...rowWithoutBId } = row // B_Id 필드를 제외한 나머지 필드를 rowWithoutBId에 할당, 즉 원하는 항목을 추출하여 놓은 것

      const key = `${row.s_tableName}_${row.s_tableId}` // 두개의 컬럼으로 신규 키를 임시적으로 생성한다.

      // Map 자료구조에서 위에서 생성된 key가 존재하는지 확인한다.
      if (!rowsMap.has(key)) {
        // 존재하지 않을 경우에는 해당 key를 가지고 있는 해당 Map자료구조 element를 생성한다.
        rowsMap.set(key, { _book: [], ...rowWithoutBId }) // 위 임시 키 기반으로 나머지 값을 생성, 생성할 때, 추가 신규 필드도 추가
        // value는 위에서 객체를 분리한 결과를 이용함
      }

      // 여기에는 위에서 생성된 임의의 key에 대한 Map 객체가 존재한다.

      // 임의로 생성한 key에 대한 value를 가져온다.
      const currentRow = rowsMap.get(key) // 다시 위에서 생성한 필드를 생성
      const bId = row._book as number

      if (bId !== null && bId !== undefined) {
        // 자료에 문제가 없다면 신규 value의 객체의 b_id 배열 필드에 값을 등록한다.
        // 배열 currentRow._book에 bId가 이미 존재하지 않는 경우에만 bId를 추가
        if (!currentRow._book.includes(bId)) {
          currentRow._book.push(bId) // 신규료 생성한 필드에 값을 설정함
        }
      }
    }

    const checkRows = Array.from(rowsMap.values())
    return checkRows
  }
  
  /**
   * searchOption을 주면 sync로 DB 조회를 수행하게 한다.
   * 반드시 WorkerThread를 기동하여 수행하게 하여야 한다. - 어떤 질의는 시간이 많이 걸리기 때문이다.
   * [주의 사항] total_search 테이블에서 limit조건을 주었기 때문에, 멀티 북마크 정보를 처리할 경우에는  1000 이상의 데이터가 반환 될 수 있음
   * 20231206 제한 조건을 설정한다. 최대 데이터 개수 10만개로
   * 20231212 : front에서 검색 결과에 대한 offset과 pagesize를 조정하여 수행할 수 있음
   * @return : DB_OPERATION_TOTAL_SEARCH_RESULT { state, data, etc }
   */
  selectTotalSearchTable(searchOption: _SEARCH_OPTION) {
    let offset = 0
    let etcString: string = ''
    let eachPageSize = this.TotalSearchDBpageSize //this.pageSize는 1000으로 너무 적어서 변경함 10,000 으로

    // 0115 offset이 정의 되어 있지 않으면, 기본값으로 설정함
    if (searchOption._offset === undefined) {
      offset = 0
    } else {
      offset = searchOption._offset
    }

    // Page size가 정의 되어 있지 않으면, 기본값으로 설정함
    if (searchOption._pagesize === undefined) {
      eachPageSize = this.TotalSearchDBpageSize
    } else {
      eachPageSize = searchOption._pagesize
    }

    // 결과값의 초기값은 미정의에러 : '_999', empty 배열
    let queryResult: DB_OPERATION_TOTAL_SEARCH_RESULT = { state: '_999', data: [], etc: '' }

    console.log('start selectTotalSearchTable')

    {
      // 트랜잭션 시작
      this.kapedb.exec('BEGIN TRANSACTION')

      try {
        let param_s_time: string = ''
        let param_e_time: string = ''
        let param_Search: string = ''
        let noTimeFlag: boolean = false

        // 시간 설정값이 empty string인 경우: front에서 준 조건을 무시하고 시간 검색조건을 OFF함
        if (searchOption.s_time === '' || searchOption.e_time === '') {
          etcString += 'time_empty + '
          noTimeFlag = true
        }

        // 타임 검색 조건 미설정 flag가 true가 아니고, 시간값이 undefined 인 경우
        if (noTimeFlag !== true && (searchOption.s_time === undefined || searchOption.e_time === undefined)) {
          etcString += 'time_undefined + '
          noTimeFlag = true
        }

        // 타임 검색 조건 미설정 flag가 true가 아니고, 에외처리 front에서 못한 것
        if (noTimeFlag !== true && (searchOption.s_time === 'Invalid date' || searchOption.e_time === 'Invalid date')) {
          etcString += 'time_Invalid_Data + '
          noTimeFlag = true
        }

        // 위 방어 코드에 의해 설정된 값이 font에서 잘못 전달되면, 해당 기능을 OFF함...보완해서 검색하지 않음
        // 시간 조건으로 검색을 하겠다고 front에서 준것
        // if (noTimeFlag === false) {
        //   if (searchOption.s_time === '') {
        //     param_s_time = '1070-01-01 00:00:00'
        //   } else {
        //     param_s_time = searchOption.s_time
        //   }

        //   if (searchOption.e_time === '') {
        //     const now = new Date()

        //     // 날짜와 시간을 원하는 형식으로 포맷
        //     const year = now.getFullYear().toString().padStart(4, '0')
        //     const month = (now.getMonth() + 1).toString().padStart(2, '0')
        //     const day = now.getDate().toString().padStart(2, '0')
        //     const hours = now.getHours().toString().padStart(2, '0')
        //     const minutes = now.getMinutes().toString().padStart(2, '0')
        //     const seconds = now.getSeconds().toString().padStart(2, '0')

        //     // 포맷된 값들을 조합하여 반환
        //     param_e_time = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
        //   } else {
        //     param_e_time = searchOption.e_time
        //   }
        // }

        // 시간 검색 조건이 존재하는 것
        if (noTimeFlag === false) {
          const controlCharsRegex = /[\x00-\x1F\x7F]/g

          param_s_time = searchOption.s_time.replace(controlCharsRegex, '')   // add 20240227 특수문자 제거로직 추가
          param_e_time = searchOption.e_time.replace(controlCharsRegex, '')   // add 20240227 특수문자 제거로직 추가
          etcString += 'time_Seted + '

          // 속도에 대한 예외 처리
          if( eachPageSize > this.TotalSearchDBpageSize)
            eachPageSize = this.TotalSearchDBpageSize                // add 20240227 개수가 많으면 DB처리가 늦어져서 문제가 된다. 10000
        }

        if (searchOption.orFlag) {
          // '\s+' : 하나이상의 공백문자(스페이스, 탭, 줄바꿈등), 'g'은 전역 검색
          param_Search = searchOption.keyString.replace(/\s+/g, ' OR ') // OR 로 교체
          etcString += 'Word_OR + '
        } else {
          param_Search = searchOption.keyString.replace(/\s+/g, ' AND ') // AND 로 교체
          etcString += 'Word_AND + '
        }

        // front 예외처리 1218
        // 검색 조건은 '_S_WORD' : 단어기반 검색
        //            '_S_TIME' : 시간기반 검색
        if (searchOption.type === '_S_TIME' && noTimeFlag === true) {
          etcString += 'Time=>Word + '
          searchOption.type = '_S_WORD'
        }

        let time_plus_word_flag = false
        if (
          (searchOption.type === '_S_TIME' && searchOption.keyString !== '') ||
          (searchOption.type === '_S_WORD' && param_s_time !== '' && param_e_time !== '')
        ) {
          time_plus_word_flag = true
        }

        if (searchOption.type === '_S_WORD' && param_Search === '') {
          this.kapedb.exec('COMMIT')
          queryResult = { state: '_000', data: [], etc: etcString + 'type is Word but No searchingword' }
          return queryResult
        }

        if (searchOption._b_id === undefined) {
          /////////////////////////////////////////////////////////////////////////////////////////////////////////////////
          // 북마크 ID없이 조회를 하는 경우, ==> 모드 북마크 정보가 나오게 된다. (검색에 북마크 관련 중복 데이터 가 생성하게 된다)
          // 따라서, 아래 모든 SELECT는 TODO-MULTI_BOOKMARK 처리를 해야 한다.
          /////////////////////////////////////////////////////////////////////////////////////////////////////////////////
          if (searchOption.fullSearch) {
            if (searchOption.type === '_S_WORD') {
              // word 기반 검색

              if (noTimeFlag === true) {
                // word & no time
                // 먼저 검색에서 1000개를 추출한 후에 조인을 수행하게 한다. 전체를 추출하지 않는 것이다.
                // [1] Total_Search 에서 필요 자료 찾기
                // [2] 타임라인 조인 ==> 날짜 및 대략적인 정보 찾기
                // [3] 북마크 정보 조인
                const sourceTable = this.kapedb.prepare(`
                    WITH org AS (
                        SELECT * 
                        FROM Total_Search 
                        WHERE searchData MATCH ? 
                        LIMIT ? OFFSET ?
                    )
                    , t1 AS (
                        SELECT * 
                        FROM Total_Timeline 
                        WHERE t_main = 1 
                    )
                    SELECT CASE WHEN b2.b_id IS NULL THEN false ELSE b2.b_id END as _book, t1.category_1, t1.category_2, t1.category_3, t1.t_dateTime, org.searchData, org.s_tableName, org.s_tableId
                    FROM org
                    LEFT JOIN t1 ON t1.t_main = 1 AND t1.t_tableName = org.s_tableName AND t1.t_tableId = org.s_tableId
                    LEFT JOIN BookMark_Mapper AS b2 ON b2.b_tableName = org.s_tableName AND b2.b_tableId = org.s_tableId
                `)

                const rows = sourceTable.all(param_Search, eachPageSize, offset)

                // TODO-MULTI_BOOKMARK
                const rows2 = this.transformRows(rows)

                // if (rows.length !== 0) {
                //   console.log('done selectTotalSearchTable ALL : ', rows.length)
                // }

                this.kapedb.exec('COMMIT')
                queryResult = { state: '_000', data: rows2, etc: etcString + 'Multi+WordBase+AddedWord' }
                //return queryResult
              } else {
                // word[단어] & time이 존재
                // 시간 기준이 같이 들어 갔기 때문에, 마지막에 t_dateTime 이 NULL인 것은 자료는 뺀다
                const sourceTable = this.kapedb.prepare(`
                  WITH org AS (
                      SELECT * 
                          FROM Total_Search 
                      WHERE searchData MATCH ? 
                      LIMIT ? OFFSET ?
                  )
                  , t1 AS (
                      SELECT * 
                      FROM Total_Timeline 
                      WHERE t_main = 1 AND t_dateTime IS NOT NULL AND t_dateTime >= ? AND t_dateTime <= ?
                  )
                  SELECT CASE WHEN b2.b_id IS NULL THEN false ELSE b2.b_id END as _book, t1.category_1, t1.category_2, t1.category_3, t1.t_dateTime, org.searchData, org.s_tableName, org.s_tableId
                  FROM org
                  LEFT JOIN t1 ON t1.t_main = 1 AND t1.t_tableName = org.s_tableName AND t1.t_tableId = org.s_tableId
                  LEFT JOIN BookMark_Mapper AS b2 ON b2.b_tableName = org.s_tableName AND b2.b_tableId = org.s_tableId
                  WHERE t1.t_dateTime IS NOT NULL 
              `)

                const rows = sourceTable.all(param_Search, eachPageSize, offset, param_s_time, param_e_time)

                // TODO-MULTI_BOOKMARK
                const rows2 = this.transformRows(rows)

                // if (rows.length !== 0) {
                //   console.log('done selectTotalSearchTable ALL : ', rows.length)
                // }

                this.kapedb.exec('COMMIT')
                queryResult = { state: '_000', data: rows2, etc: etcString + 'Multi+WordBase+AddedTime' }
                //return queryResult
              }
            } // end of fully word 기반
            else {
              ///////////////////////////////////
              // full search && time기반 인 경우임
              ///////////////////////////////////

              // 시간기준으로 되는 경우 - noTime은 없음
              // [1] 타임라인에서 페이지 사이즈 만큼 자료 추출(_Datetime으로, 값이 없으면 제외)하고
              // [2] 검색 데이터를 조인
              // [3] 북마크 조인

              if (time_plus_word_flag === true) {
                ///////////////////////////////////////////////
                // Time기반으로 요청하고 검색 단어가 존재하는 경우
                ///////////////////////////////////////////////
                const sourceTable = this.kapedb.prepare(`
                WITH org AS (
                    SELECT * 
                    FROM Total_Search 
                    WHERE searchData MATCH ? 
                    LIMIT ? OFFSET ?
                )
                , t1 AS (
                    SELECT * 
                    FROM Total_Timeline 
                    WHERE t_main = 1 AND t_dateTime IS NOT NULL AND t_dateTime >= ? AND t_dateTime <= ?
                    ORDER BY t_dateTime
                    
                )
                SELECT CASE WHEN b2.b_id IS NULL THEN false ELSE b2.b_id END as _book, t1.category_1, t1.category_2, t1.category_3, t1.t_tableName, org.searchData, org.s_tableName, org.s_tableId
                FROM org
                LEFT JOIN t1 ON t1.t_tableName = org.s_tableName AND t1.t_tableId = org.s_tableId
                LEFT JOIN BookMark_Mapper AS b2 ON b2.b_tableName = org.s_tableName AND b2.b_tableId = org.s_tableId 
                WHERE t1.t_dateTime is not null
                `)

                const rows = sourceTable.all(param_Search, eachPageSize, offset, param_s_time, param_e_time)

                // TODO-MULTI_BOOKMARK
                const rows2 = this.transformRows(rows)

                // if (rows.length !== 0) {
                //   console.log('done selectTotalSearchTable ALL : ', rows.length)
                // }

                this.kapedb.exec('COMMIT')
                queryResult = { state: '_000', data: rows2, etc: etcString + 'Multi+TimeBase+AddedWord+AddedTime' }
                //return queryResult
              } else {
                /////////////////////////////////////////////
                // Time기반으로 요청하고 검색 단어가 없는 경우 : 오직 시간 기준, Timeline 테이블이 기준
                /////////////////////////////////////////////
                const sourceTable = this.kapedb.prepare(`
                WITH org AS (
                    SELECT * 
                    FROM Total_Search 
                )
                , t1 AS (
                    SELECT * 
                    FROM Total_Timeline 
                    WHERE t_main = 1 AND t_dateTime IS NOT NULL AND t_dateTime >= ? AND t_dateTime <= ?
                    ORDER BY t_dateTime
                    LIMIT ? OFFSET ?
                )
                SELECT CASE WHEN b2.b_id IS NULL THEN false ELSE b2.b_id END as _book, t1.category_1, t1.category_2, t1.category_3, t1.t_dateTime, org.searchData, t1.t_tableName as s_tableName, t1.t_tableId as s_tableId
                FROM t1
                LEFT JOIN org ON t1.t_tableName = org.s_tableName AND t1.t_tableId = org.s_tableId
                LEFT JOIN BookMark_Mapper AS b2 ON b2.b_tableName = org.s_tableName AND b2.b_tableId = org.s_tableId 
                `)

                const rows = sourceTable.all(param_s_time, param_e_time, eachPageSize, offset)

                // TODO-MULTI_BOOKMARK
                const rows2 = this.transformRows(rows)

                // if (rows.length !== 0) {
                //   console.log('done selectTotalSearchTable ALL : ', rows.length)
                // }

                this.kapedb.exec('COMMIT')
                queryResult = { state: '_000', data: rows2, etc: etcString + 'Multi+TimeBase+AddedTime' }
                //return queryResult
              }
            }
            ///////////////////////////////////////////////////////////////////////////////////////
            ///////////////////////////////////////////////////////////////// End Of full search
          } else {
            // 각각 테이블 기반 검색 작업

            if (searchOption.type === '_S_WORD') {
              // 워드 기반
              // word 기반 & 개별 테이블

              if (noTimeFlag === true) {
                // word & no time
                const sourceTable = this.kapedb.prepare(`
                  WITH org AS (
                      SELECT * 
                      FROM Total_Search 
                      WHERE searchData MATCH ? AND s_tableName = ?
                      LIMIT ? OFFSET ?
                  )
                  , t1 AS (
                      SELECT * 
                      FROM Total_Timeline 
                      WHERE t_tableName = ? AND t_main = 1
                  )
                  SELECT CASE WHEN b2.b_id IS NULL THEN false ELSE b2.b_id END as _book, t1.category_1, t1.category_2, t1.category_3, t1.t_dateTime, org.searchData, org.s_tableName, org.s_tableId
                  FROM org
                  LEFT JOIN t1 ON t1.t_main = 1 AND t1.t_tableName = org.s_tableName AND t1.t_tableId = org.s_tableId
                  LEFT JOIN BookMark_Mapper AS b2 ON b2.b_tableName = org.s_tableName AND b2.b_tableId = org.s_tableId
                `)

                const rows = sourceTable.all(
                  param_Search,
                  searchOption.tableSearch,
                  eachPageSize,
                  offset,
                  searchOption.tableSearch
                )

                // TODO-MULTI_BOOKMARK
                const rows2 = this.transformRows(rows)

                // if (rows.length !== 0) {
                //   console.log('done selectTotalSearchTable ALL : ', rows.length)
                // }

                this.kapedb.exec('COMMIT')
                queryResult = { state: '_000', data: rows2, etc: etcString + 'Multi+WordBase+AddedTableName+AddedWord' }
                //return queryResult
              } else {
                // work & time이 존재 --> 시간 조건이 있기에 최종 자료에 _Datetime이 없으면 제거해야 함
                const sourceTable = this.kapedb.prepare(`
                  WITH org AS (
                      SELECT * 
                      FROM Total_Search 
                      WHERE searchData MATCH ? AND s_tableName = ?
                      LIMIT ? OFFSET ?
                  )
                  , t1 AS (
                      SELECT * 
                      FROM Total_Timeline 
                      WHERE t_tableName = ? AND t_main = 1 AND t_dateTime IS NOT NULL AND t_dateTime >= ? AND t_dateTime <= ? 
                  )
                  SELECT CASE WHEN b2.b_id IS NULL THEN false ELSE b2.b_id END as _book, t1.category_1, t1.category_2, t1.category_3, t1.t_dateTime, org.searchData, org.s_tableName, org.s_tableId
                  FROM org
                  LEFT JOIN t1 ON t1.t_main = 1 AND t1.t_tableName = org.s_tableName AND t1.t_tableId = org.s_tableId
                  LEFT JOIN BookMark_Mapper AS b2 ON b2.b_tableName = org.s_tableName AND b2.b_tableId = org.s_tableId
                  WHERE t1.t_dateTime IS NOT NULL
                `)

                const rows = sourceTable.all(
                  param_Search,
                  searchOption.tableSearch,
                  eachPageSize,
                  offset,
                  searchOption.tableSearch,
                  param_s_time,
                  param_e_time
                )

                // TODO-MULTI_BOOKMARK
                const rows2 = this.transformRows(rows)

                // if (rows.length !== 0) {
                //   console.log('done selectTotalSearchTable ALL : ', rows.length)
                // }

                this.kapedb.exec('COMMIT')
                queryResult = { state: '_000', data: rows2, etc: etcString + 'Multi+WordBase+AddedTableName+addTime' }
                //return queryResult
              }
            } // end of work full
            else {
              //////////////////////////////////
              // 테이블명과 시간기준으로 되는 경우
              ///////////////////////////////////

              if (time_plus_word_flag === true) {
                //////////////////////////////////
                // 시간과 검색 단어가 동시에 있는 경우
                //////////////////////////////////
                const sourceTable = this.kapedb.prepare(`
                WITH org AS (
                    SELECT * 
                    FROM Total_Search 
                    WHERE searchData MATCH ? AND s_tableName = ?
                    LIMIT ? OFFSET ?  
                )
                , t1 AS (
                    SELECT * 
                    FROM Total_Timeline 
                    WHERE t_tableName = ? AND t_main = 1 AND t_dateTime IS NOT NULL AND t_dateTime >= ? AND t_dateTime <= ? 
                    ORDER BY t_dateTime
                    
                )
                SELECT CASE WHEN b2.b_id IS NULL THEN false ELSE b2.b_id END as _book, t1.category_1, t1.category_2, t1.category_3, t1.t_dateTime, org.searchData, org.s_tableName, org.s_tableId
                FROM org
                LEFT JOIN t1 ON t1.t_tableName = org.s_tableName AND t1.t_tableId = org.s_tableId
                LEFT JOIN BookMark_Mapper AS b2 ON b2.b_tableName = org.s_tableName AND b2.b_tableId = org.s_tableId
                WHERE t1.t_dateTime is not null
                
                `)

                const rows = sourceTable.all(
                  param_Search,
                  searchOption.tableSearch,
                  eachPageSize,
                  offset,
                  searchOption.tableSearch,
                  param_s_time,
                  param_e_time
                )

                // TODO-MULTI_BOOKMARK
                const rows2 = this.transformRows(rows)

                // if (rows.length !== 0) {
                //   console.log('done selectTotalSearchTable ALL : ', rows.length)
                // }

                this.kapedb.exec('COMMIT')
                queryResult = {
                  state: '_000',
                  data: rows2,
                  etc: etcString + 'Multi+TimeBase+AddedWord+AddedTableName+AddedTime'
                }
                //return queryResult
              } else {
                //////////////////////////////////
                // 시간만 있고 검색 단어가 없는 경우
                //////////////////////////////////
                const sourceTable = this.kapedb.prepare(`
                WITH org AS (
                    SELECT * 
                    FROM Total_Search 
                    WHERE s_tableName = ?
                )
                , t1 AS (
                    SELECT * 
                    FROM Total_Timeline 
                    WHERE t_tableName = ? AND t_main = 1 AND t_dateTime IS NOT NULL AND t_dateTime >= ? AND t_dateTime <= ? 
                    ORDER BY t_dateTime
                    LIMIT ? OFFSET ?
                )
                SELECT CASE WHEN b2.b_id IS NULL THEN false ELSE b2.b_id END as _book, t1.category_1, t1.category_2, t1.category_3, t1.t_dateTime, org.searchData, t1.t_tableName as s_tableName, t1.t_tableId as s_tableId
                FROM t1
                LEFT JOIN org ON t1.t_tableName = org.s_tableName AND t1.t_tableId = org.s_tableId
                LEFT JOIN BookMark_Mapper AS b2 ON b2.b_tableName = org.s_tableName AND b2.b_tableId = org.s_tableId
                `)

                const rows = sourceTable.all(
                  searchOption.tableSearch,
                  searchOption.tableSearch,
                  param_s_time,
                  param_e_time,
                  eachPageSize,
                  offset
                )

                // TODO-MULTI_BOOKMARK
                const rows2 = this.transformRows(rows)

                // if (rows.length !== 0) {
                //   console.log('done selectTotalSearchTable ALL : ', rows.length)
                // }

                this.kapedb.exec('COMMIT')
                queryResult = { state: '_000', data: rows2, etc: etcString + 'Multi+TimeBase+AddedTable+AddedTime' }
                //return queryResult
              }
            }
            console.log('end selectTotalSearchTable')

            ///////////////////////////////////////////////////////////////// End Of Time & 테이블 기반
          } // end of 테이블별 검색
          ////////////////////////////////////////////////////////////////////// end of 북마크 정보 필터 없는 것
        } else {
          //######################////////////////////////////////////////////////////////////////////////////#################################
          // 북마크 ID별 기반으로 조회하는 경우
          //////////////////////////////////////////////////////////////////////////////
          if (searchOption.fullSearch) {
            if (searchOption.type === '_S_WORD') {
              // word 기반

              // 단어기반에 시간검색 조검 없는 것
              if (noTimeFlag === true) {
                // word & no time

                // 단어기반 검색이지만, 범주 정보를 갖기 위해 Timeline과 join한다.
                const sourceTable = this.kapedb.prepare(`
                    WITH org AS (
                        SELECT * 
                        FROM Total_Search 
                        WHERE searchData MATCH ? 
                        LIMIT ? OFFSET ?
                    )
                    , t1 AS (
                        SELECT * 
                        FROM Total_Timeline 
                        WHERE t_main = 1 
                    )
                    SELECT CASE WHEN b2.b_id IS NULL THEN false ELSE b2.b_id END as _book, t1.category_1, t1.category_2, t1.category_3, t1.t_dateTime, org.searchData, org.s_tableName, org.s_tableId
                    FROM org
                    LEFT JOIN t1 ON t1.t_tableName = org.s_tableName AND t1.t_tableId = org.s_tableId
                    LEFT JOIN BookMark_Mapper AS b2 ON b2.b_id = ? AND b2.b_tableName = org.s_tableName AND b2.b_tableId = org.s_tableId
                `)

                const rows = sourceTable.all(param_Search, eachPageSize, offset, searchOption._b_id)

                // if (rows.length !== 0) {
                //   console.log('done selectTotalSearchTable ALL : ', rows.length)
                // }

                this.kapedb.exec('COMMIT')
                queryResult = { state: '_000', data: rows, etc: etcString + 'one+WordBase+AddedWord' }
                //return queryResult
              } else {
                // work & time이 존재
                // 시간 정보가 필터링 조건이기에 최종 자료에서 _Datetime이 NULL이면 제거해야 함
                /////////////////////////////////////////////////
                // full 검색 + 시간기준 검색 + 검색 단어가 있는 경우:시간에도 동일 검색이 있음
                /////////////////////////////////////////////////
                const sourceTable = this.kapedb.prepare(`
                  WITH org AS (
                      SELECT * 
                      FROM Total_Search 
                      WHERE searchData MATCH ? 
                      LIMIT ? OFFSET ?
                  )
                  , t1 AS (
                      SELECT * 
                      FROM Total_Timeline 
                      WHERE t_main = 1 AND t_dateTime IS NOT NULL AND t_dateTime >= ? AND t_dateTime <= ?
                  )
                  SELECT CASE WHEN b2.b_id IS NULL THEN false ELSE b2.b_id END as _book, t1.category_1, t1.category_2, t1.category_3, t1.t_dateTime, org.searchData, org.s_tableName, org.s_tableId
                  FROM org
                  LEFT JOIN t1 ON t1.t_tableName = org.s_tableName AND t1.t_tableId = org.s_tableId
                  LEFT JOIN BookMark_Mapper AS b2 ON b2.b_id = ? AND b2.b_tableName = org.s_tableName AND b2.b_tableId = org.s_tableId
                  WHERE t1.t_dateTime IS NOT NULL
              `)

                const rows = sourceTable.all(
                  param_Search,
                  eachPageSize,
                  offset,
                  param_s_time,
                  param_e_time,
                  searchOption._b_id
                )

                // if (rows.length !== 0) {
                //   console.log('done selectTotalSearchTable ALL : ', rows.length)
                // }

                this.kapedb.exec('COMMIT')
                queryResult = { state: '_000', data: rows, etc: etcString + 'one+WordBase+AddedWord+AddTime' }
                //return queryResult
              }
            } // end of work 기반
            else {
              // 시간기준으로 되는 경우 - noTime은 없음
              // [1] 타임라인을 조회하게 한다. 여기에 페이지 제한 조건을 넣어야 함
              // [2] Total_Search를 조인
              // [3] 특정 북마크 조인

              // 단어와 시간을 같이 하는 경우
              if (time_plus_word_flag == true) {
                /////////////////////////////////////////////////
                // full 검색 + 시간기준 검색 + 검색 단어가 있는 경우:단어에도 동일 검색이 있음
                /////////////////////////////////////////////////
                const sourceTable = this.kapedb.prepare(`
                WITH org AS (
                    SELECT * 
                    FROM Total_Search 
                    WHERE searchData MATCH ? 
                    LIMIT ? OFFSET ?
                )
                , t1 AS (
                    SELECT * 
                    FROM Total_Timeline 
                    WHERE t_main = 1 AND t_dateTime IS NOT NULL AND t_dateTime >= ? AND t_dateTime <= ?
                )
                SELECT CASE WHEN b2.b_id IS NULL THEN false ELSE b2.b_id END as _book, t1.category_1, t1.category_2, t1.category_3, t1.t_dateTime, org.searchData, org.s_tableName, org.s_tableId
                FROM org
                LEFT JOIN t1 ON t1.t_tableName = org.s_tableName AND t1.t_tableId = org.s_tableId
                LEFT JOIN BookMark_Mapper AS b2 ON b2.b_id = ? AND b2.b_tableName = org.s_tableName AND b2.b_tableId = org.s_tableId 
                WHERE t1.t_dateTime IS NOT NULL
                
            `)

                const rows = sourceTable.all(
                  param_Search,
                  eachPageSize,
                  offset,
                  param_s_time,
                  param_e_time,
                  searchOption._b_id
                )

                // if (rows.length !== 0) {
                //   console.log('done selectTotalSearchTable ALL : ', rows.length)
                // }

                this.kapedb.exec('COMMIT')
                queryResult = { state: '_000', data: rows, etc: etcString + 'one+TimeBase+AddedWord+AddedTime' }
                //return queryResult
              } else {
                /////////////////////////////////////////////////
                // full 검색 + 시간기준 검색 만 있는 것( 검색 단어가 없는 경우 ) -- Timeline 테이블이 기준이 됨, 이 조건은 없는게 맞을 듯한데...일단 생성시킴
                /////////////////////////////////////////////////
                const sourceTable = this.kapedb.prepare(`
                WITH org AS (
                    SELECT * 
                    FROM Total_Search 
                )
                , t1 AS (
                    SELECT * 
                    FROM Total_Timeline 
                    WHERE t_main = 1 AND t_dateTime IS NOT NULL AND t_dateTime >= ? AND t_dateTime <= ?
                    ORDER BY t_dateTime
                    LIMIT ? OFFSET ?
                )
                SELECT CASE WHEN b2.b_id IS NULL THEN false ELSE b2.b_id END as _book, t1.category_1, t1.category_2, t1.category_3, t1.t_dateTime, org.searchData, t1.t_tableName as s_tableName, t1.t_tableId as s_tableId
                FROM t1
                LEFT JOIN org ON t1.t_tableName = org.s_tableName AND t1.t_tableId = org.s_tableId
                LEFT JOIN BookMark_Mapper AS b2 ON b2.b_id = ? AND b2.b_tableName = org.s_tableName AND b2.b_tableId = org.s_tableId
            `)

                const rows = sourceTable.all(param_s_time, param_e_time, eachPageSize, offset, searchOption._b_id)

                // if (rows.length !== 0) {
                //   console.log('done selectTotalSearchTable ALL : ', rows.length)
                // }

                this.kapedb.exec('COMMIT')
                queryResult = { state: '_000', data: rows, etc: etcString + 'one+TimeBase+AddedTime' }
                //return queryResult
              }
            }
            ///////////////////////////////////////////////////////////////////////////////////////
            ///////////////////////////////////////////////////////////////// End Of full search
          } else {
            // 테이블 기반 검색 작업
            // (Full Table 검색이 아닌 경우임)
            if (searchOption.type === '_S_WORD') {
              // word 기반 & 개별 테이블 <-- 여기에는 시간 조건이 없기에 _Datetime is not null조건이 필요 없음

              if (noTimeFlag === true) {
                // word & no time
                const sourceTable = this.kapedb.prepare(`
                  WITH org AS (
                      SELECT * 
                      FROM Total_Search 
                      WHERE searchData MATCH ? AND s_tableName = ?
                      LIMIT ? OFFSET ?
                  )
                  , t1 AS (
                      SELECT * 
                      FROM Total_Timeline 
                      WHERE t_tableName = ? AND t_main = 1 
                  )
                  SELECT CASE WHEN b2.b_id IS NULL THEN false ELSE b2.b_id END as _book, t1.category_1, t1.category_2, t1.category_3, t1.t_dateTime, org.searchData, org.s_tableName, org.s_tableId
                  FROM org
                  LEFT JOIN t1 ON t1.t_tableName = org.s_tableName AND t1.t_tableId = org.s_tableId
                  LEFT JOIN BookMark_Mapper AS b2 ON b2.b_id = ? AND b2.b_tableName = org.s_tableName AND b2.b_tableId = org.s_tableId
              `)

                const rows = sourceTable.all(
                  param_Search,
                  searchOption.tableSearch,
                  eachPageSize,
                  offset,
                  searchOption.tableSearch,
                  searchOption._b_id
                )

                // if (rows.length !== 0) {
                //   console.log('done selectTotalSearchTable ALL : ', rows.length)
                // }

                this.kapedb.exec('COMMIT')
                queryResult = { state: '_000', data: rows, etc: etcString + 'one+WordBase+AddedTable+AddedWord' }
                //return queryResult
              } else {
                // work & time이 존재
                /////////////////////////////////////////////////
                // 테이블 검색 + 시간기준 검색 + 검색 단어가 있는 경우:시간조건에도 동일 검색이 있음
                /////////////////////////////////////////////////
                // Timeline테이블이 기준이 아니기때문에, Join결과에 t_dateTime값이 Null인 것이 존재하게 됨
                const sourceTable = this.kapedb.prepare(`
                  WITH org AS (
                      SELECT * 
                      FROM Total_Search 
                      WHERE searchData MATCH ? AND s_tableName = ?
                      LIMIT ? OFFSET ?
                  )
                  , t1 AS (
                      SELECT * 
                      FROM Total_Timeline 
                      WHERE t_tableName = ? AND t_main = 1 AND t_dateTime IS NOT NULL AND t_dateTime >= ? AND t_dateTime <= ?
                  )
                  SELECT CASE WHEN b2.b_id IS NULL THEN false ELSE b2.b_id END as _book, t1.category_1, t1.category_2, t1.category_3, t1.t_dateTime, org.searchData, org.s_tableName, org.s_tableId
                  FROM org
                  LEFT JOIN t1 ON t1.t_tableName = org.s_tableName AND t1.t_tableId = org.s_tableId
                  LEFT JOIN BookMark_Mapper AS b2 ON b2.b_id = ? AND b2.b_tableName = org.s_tableName AND b2.b_tableId = org.s_tableId
                  WHERE t1.t_dateTime IS NOT NULL 
              `)

                const rows = sourceTable.all(
                  param_Search,
                  searchOption.tableSearch,
                  eachPageSize,
                  offset,
                  searchOption.tableSearch,
                  param_s_time,
                  param_e_time,
                  searchOption._b_id
                )

                // if (rows.length !== 0) {
                //   console.log('done selectTotalSearchTable ALL : ', rows.length)
                // }

                this.kapedb.exec('COMMIT')
                queryResult = {
                  state: '_000',
                  data: rows,
                  etc: etcString + 'one+WordBase+AddedTableName+AddedWord+AddedTime'
                }
                //return queryResult
              }
            } // end of work full
            else {
              // 테이블 & 시간기준으로 되는 경우
              // 타임라인을 기준으로 하기에 _Datetime이 NULL인 것이 없다

              if (time_plus_word_flag === true) {
                // time기반 + 테이블존재 + 검색 단어 있음 + bid존재
                // 윗 단어겁색에도 동일하게 처리하는 것
                const sourceTable = this.kapedb.prepare(`
                WITH org AS (
                    SELECT * 
                    FROM Total_Search 
                    WHERE searchData MATCH ? AND s_tableName = ?
                    LIMIT ? OFFSET ?
                )
                , t1 AS (
                    SELECT * 
                    FROM Total_Timeline 
                    WHERE t_tableName = ? AND t_main = 1 AND t_dateTime IS NOT NULL AND t_dateTime >= ? AND t_dateTime <= ?
                )
                SELECT CASE WHEN b2.b_id IS NULL THEN false ELSE b2.b_id END as _book, t1.category_1, t1.category_2, t1.category_3, t1.t_dateTime, org.searchData, org.s_tableName, org.s_tableId
                FROM org
                LEFT JOIN t1 ON t1.t_tableName = org.s_tableName AND t1.t_tableId = org.s_tableId
                LEFT JOIN BookMark_Mapper AS b2 ON b2.b_id = ? AND b2.b_tableName = org.s_tableName AND b2.b_tableId = org.s_tableId
                WHERE t1.t_dateTime is not null
            `)

                const rows = sourceTable.all(
                  param_Search,
                  searchOption.tableSearch,
                  eachPageSize,
                  offset,
                  searchOption.tableSearch,
                  param_s_time,
                  param_e_time,
                  searchOption._b_id
                )

                // if (rows.length !== 0) {
                //   console.log('done selectTotalSearchTable ALL : ', rows.length)
                // }

                this.kapedb.exec('COMMIT')
                queryResult = {
                  state: '_000',
                  data: rows,
                  etc: etcString + 'one+TimeBase+AddedWord+AddedTablename+AddedTime'
                }
                //return queryResult
              } else {
                // time기반 + 테이블존재 + 검색 단어 없음 + bid존재
                const sourceTable = this.kapedb.prepare(`
                WITH org AS (
                    SELECT * 
                    FROM Total_Search 
                    WHERE s_tableName = ?
                )
                , t1 AS (
                    SELECT * 
                    FROM Total_Timeline 
                    WHERE t_tableName = ? AND t_main = 1 AND t_dateTime IS NOT NULL AND t_dateTime >= ? AND t_dateTime <= ?
                    ORDER BY t_dateTime
                    LIMIT ? OFFSET ?
                )
                SELECT CASE WHEN b2.b_id IS NULL THEN false ELSE b2.b_id END as _book, t1.category_1, t1.category_2, t1.category_3, t1.t_dateTime, org.searchData, t1.t_tableName as s_tableName, t1.t_tableId as s_tableId
                FROM t1
                LEFT JOIN org ON t1.t_tableName = org.s_tableName AND t1.t_tableId = org.s_tableId
                LEFT JOIN BookMark_Mapper AS b2 ON b2.b_id = ? AND b2.b_tableName = org.s_tableName AND b2.b_tableId = org.s_tableId 
            `)

                const rows = sourceTable.all(
                  searchOption.tableSearch,
                  searchOption.tableSearch,
                  param_s_time,
                  param_e_time,
                  eachPageSize,
                  offset,
                  searchOption._b_id
                )

                // if (rows.length !== 0) {
                //   console.log('done selectTotalSearchTable ALL : ', rows.length)
                // }

                this.kapedb.exec('COMMIT')
                queryResult = { state: '_000', data: rows, etc: etcString + 'one+TimeBase+AddedTableName+AddedTime' }
                //return queryResult
              }
            }
            console.log('end selectTotalSearchTable')

            ///////////////////////////////////////////////////////////////// End Of Time 기반
          } // end of time 기반
          //////////////////////////////////////////////////////////////////////
        }

        return queryResult
      } catch (err) {
        this.kapedb.exec('ROLLBACK')
        const errString = (err as Error).message
        console.error('selectTotalSearchTable 중 오류 발생:', err)
        queryResult = { state: 'D003', data: [], etc: etcString + errString }
        console.log('end error selectTotalSearchTable')
        return queryResult
      }
    }
  }

  /**
   * searchOption을 주면 sync로 DB 조회를 수행하게 한다.
   * 반드시 WorkerThread를 기동하여 수행하게 하여야 한다. - 어떤 질의는 시간이 많이 걸리기 때문이다.
   * 3개의 범주별 데이터 개수 정보를 전달해 주는 것
   * @return : DB_OPERATION_RESULT { state, data }
   */
  selectCountPerCategoryTotalSearchTable(searchOption: _SEARCH_OPTION) {
    let queryResult: DB_OPERATION_RESULT = { state: '_999', data: [] }

    console.log('start selectTotalSearchTable')

    {
      // 트랜잭션 시작
      this.kapedb.exec('BEGIN TRANSACTION')

      try {
        let param_s_time: string = ''
        let param_e_time: string = ''
        let param_Search: string = ''
        let noTimeFlag: boolean = false

        // 시간값이 empty string인 경우
        if (searchOption.s_time === '' || searchOption.e_time === '') noTimeFlag = true

        // 시간값이 undefined 인 경우
        if (searchOption.s_time === undefined || searchOption.e_time === undefined) noTimeFlag = true

        if (searchOption.s_time === '') {
          param_s_time = '1070-01-01 00:00:00'
        } else {
          param_s_time = searchOption.s_time
        }

        if (searchOption.e_time === '') {
          const now = new Date()

          // 날짜와 시간을 원하는 형식으로 포맷
          const year = now.getFullYear().toString().padStart(4, '0')
          const month = (now.getMonth() + 1).toString().padStart(2, '0')
          const day = now.getDate().toString().padStart(2, '0')
          const hours = now.getHours().toString().padStart(2, '0')
          const minutes = now.getMinutes().toString().padStart(2, '0')
          const seconds = now.getSeconds().toString().padStart(2, '0')

          // 포맷된 값들을 조합하여 반환
          param_e_time = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
        } else {
          param_e_time = searchOption.e_time
        }

        if (searchOption.orFlag) {
          param_Search = searchOption.keyString.replace(/\s+/g, ' OR ')
        } else {
          param_Search = searchOption.keyString.replace(/\s+/g, ' AND ')
        }

        if (searchOption._b_id === undefined) {
          /////////////////////////////////////////////////////////////////////////////////////////////////////////////////
          // 북마크 ID없이 조회를 하는 경우, ==> 모드 북마크 정보가 나오게 된다. (검색에 북마크 관련 중복 데이터 가 생성하게 된다)
          // 따라서, 아래 모든 SELECT는 TODO-MULTI_BOOKMARK 처리를 해야 한다.
          /////////////////////////////////////////////////////////////////////////////////////////////////////////////////
          if (searchOption.fullSearch) {
            if (searchOption.type === '_S_WORD') {
              // search by WORD
              // word 기반

              if (noTimeFlag === true) {
                // word & no time
                // 먼저 검색에서 1000개를 추출한 후에 조인을 수행하게 한다. 전체를 추출하지 않는 것이다.
                // [1] Total_Search 에서 필요 자료 찾기
                // [2] 타임라인 조인 ==> 날짜 및 대략적인 정보 찾기
                // [3] 북마크 정보 조인
                const sourceTable = this.kapedb.prepare(`
                      WITH org AS (
                          SELECT * 
                          FROM Total_Search 
                          WHERE searchData MATCH ? 
                      )
                      , t1 AS (
                          SELECT * 
                          FROM Total_Timeline 
                          WHERE t_main = 1 
                      )
                      SELECT t1.category_1, t1.category_2, t1.category_3, count(*) as count
                      FROM org
                      LEFT JOIN t1 ON t1.t_tableName = org.s_tableName AND t1.b_tableId = org.s_tableId
                      LEFT JOIN BookMark_Mapper AS b2 ON b2.b_tableName = org.s_tableName AND b2.b_tableId = org.s_tableId
                      GROUP BY t1.category_1, t1.category_2, t1.category_3
                      ORDER BY t1.category_1, t1.category_2, t1.category_3
                  `)

                const rows = sourceTable.all(param_Search)

                // TODO-MULTI_BOOKMARK

                // if (rows.length !== 0) {
                //   console.log('done selectTotalSearchTable ALL : ', rows.length)
                // }

                this.kapedb.exec('COMMIT')
                queryResult = { state: '_000', data: rows }
                //return queryResult
              } else {
                // word[단어] & time이 존재
                // 시간 기준이 같이 들어 갔기 때문에, 마지막에 _DateTime 이 NULL인 것은 자료는 뺀다
                const sourceTable = this.kapedb.prepare(`
                    WITH org AS (
                        SELECT * 
                            FROM Total_Search 
                        WHERE searchData MATCH ? 
                    )
                    , t1 AS (
                        SELECT * 
                        FROM Total_Timeline 
                        WHERE t_main = 1 AND t_dateTime IS NOT NULL AND t_dateTime >= ? AND t_dateTime <= ?
                    )
                    SELECT t1.category_1, t1.category_2, t1.category_3, count(*) as count 
                    FROM org
                    LEFT JOIN t1 ON t1.t_tableName = org.s_tableName AND t1.b_tableId = org.s_tableId
                    LEFT JOIN BookMark_Mapper AS b2 ON b2.b_tableName = org.s_tableName AND b2.b_tableId = org.s_tableId
                    WHERE t1.t_dateTime IS NOT NULL 
                    GROUP BY t1.category_1, t1.category_2, t1.category_3
                    ORDER BY t1.category_1, t1.category_2, t1.category_3
                `)

                const rows = sourceTable.all(param_Search, param_s_time, param_e_time)

                // TODO-MULTI_BOOKMARK

                // if (rows.length !== 0) {
                //   console.log('done selectTotalSearchTable ALL : ', rows.length)
                // }

                this.kapedb.exec('COMMIT')
                queryResult = { state: '_000', data: rows }
                //return queryResult
              }
            } // end of work 기반
            else {
              // 시간기준으로 되는 경우 - noTime은 없음
              // [1] 타임라인에서 페이지 사이즈 만큼 자료 추출(_Datetime으로, 값이 없으면 제외)하고
              // [2] 검색 데이터를 조인
              // [3] 북마크 조인

              const sourceTable = this.kapedb.prepare(`
                  WITH org AS (
                      SELECT * 
                      FROM Total_Search 
                  )
                  , t1 AS (
                      SELECT * 
                      FROM Total_Timeline 
                      WHERE t_main = 1 AND t_dateTime IS NOT NULL AND t_dateTime >= ? AND t_dateTime <= ?
                     
                  )
                  SELECT t1.category_1, t1.category_2, t1.category_3, count(*) as count 
                  FROM t1
                  LEFT JOIN t1 ON t1.t_tableName = org.s_tableName AND t1.b_tableId = org.s_tableId
                  LEFT JOIN BookMark_Mapper AS b2 ON b2.b_tableName = org.s_tableName AND b2.b_tableId = org.s_tableId 
                  GROUP BY t1.category_1, t1.category_2, t1.category_3
                  ORDER BY t1.category_1, t1.category_2, t1.category_3
              `)

              const rows = sourceTable.all(param_s_time, param_e_time)

              // TODO-MULTI_BOOKMARK

              // if (rows.length !== 0) {
              //   console.log('done selectTotalSearchTable ALL : ', rows.length)
              // }

              this.kapedb.exec('COMMIT')
              queryResult = { state: '_000', data: rows }
              //return queryResult
            }
            ///////////////////////////////////////////////////////////////////////////////////////
            ///////////////////////////////////////////////////////////////// End Of full search
          } else {
            // 각각 테이블 기반 검색 작업

            if (searchOption.type === '_S_WORD') {
              // 워드 기반
              // word 기반 & 개별 테이블

              if (noTimeFlag === true) {
                // word & no time
                const sourceTable = this.kapedb.prepare(`
                    WITH org AS (
                        SELECT * 
                        FROM Total_Search 
                        WHERE searchData MATCH ? AND s_tableName = ?
                    )
                    , t1 AS (
                        SELECT * 
                        FROM Total_Timeline 
                        WHERE t_tableName = ? AND t_main = 1
                    )
                    SELECT t1.category_1, t1.category_2, t1.category_3, count(*) as count 
                    FROM org
                    LEFT JOIN t1 ON t1.t_tableName = org.s_tableName AND t1.b_tableId = org.s_tableId
                    LEFT JOIN BookMark_Mapper AS b2 ON b2.b_tableName = org.s_tableName AND b2.b_tableId = org.s_tableId
                    GROUP BY t1.category_1, t1.category_2, t1.category_3
                    ORDER BY t1.category_1, t1.category_2, t1.category_3
                  `)

                const rows = sourceTable.all(param_Search, searchOption.tableSearch, searchOption.tableSearch)

                // TODO-MULTI_BOOKMARK

                // if (rows.length !== 0) {
                //   console.log('done selectTotalSearchTable ALL : ', rows.length)
                // }

                this.kapedb.exec('COMMIT')
                queryResult = { state: '_000', data: rows }
                //return queryResult
              } else {
                // work & time이 존재 --> 시간 조건이 있기에 최종 자료에 t_dateTime이 없으면 제거해야 함
                const sourceTable = this.kapedb.prepare(`
                    WITH org AS (
                        SELECT * 
                        FROM Total_Search 
                        WHERE searchData MATCH ? AND s_tableName = ?
                    )
                    , t1 AS (
                        SELECT * 
                        FROM Total_Timeline 
                        WHERE t_tableName = ? AND t_main = 1 AND t_dateTime IS NOT NULL AND t_dateTime >= ? AND t_dateTime <= ? 
                    )
                    SELECT t1.category_1, t1.category_2, t1.category_3, count(*) as count  
                    FROM org
                    LEFT JOIN t1 ON t1.t_tableName = org.s_tableName AND t1.b_tableId = org.s_tableId
                    LEFT JOIN BookMark_Mapper AS b2 ON b2.b_tableName = org.s_tableName AND b2.b_tableId = org.s_tableId
                    WHERE t1.t_dateTime IS NOT NULL
                    GROUP BY t1.category_1, t1.category_2, t1.category_3
                    ORDER BY t1.category_1, t1.category_2, t1.category_3
                  `)

                const rows = sourceTable.all(
                  param_Search,
                  searchOption.tableSearch,
                  searchOption.tableSearch,
                  param_s_time,
                  param_e_time
                )

                // TODO-MULTI_BOOKMARK

                // if (rows.length !== 0) {
                //   console.log('done selectTotalSearchTable ALL : ', rows.length)
                // }

                this.kapedb.exec('COMMIT')
                queryResult = { state: '_000', data: rows }
                //return queryResult
              }
            } // end of work full
            else {
              // 테이블명과 시간기준으로 되는 경우
              const sourceTable = this.kapedb.prepare(`
                  WITH org AS (
                      SELECT * 
                      FROM Total_Search 
                      WHERE s_tableName = ?
                  )
                  , t1 AS (
                      SELECT * 
                      FROM Total_Timeline 
                      WHERE t_tableName = ? AND t_main = 1 AND t_dateTime IS NOT NULL AND t_dateTime >= ? AND t_dateTime <= ? 

                  )
                  SELECT t1.category_1, t1.category_2, t1.category_3, count(*) as count 
                  FROM t1
                  LEFT JOIN org ON t1.t_tableName = org.s_tableName AND t1.t_tableId = org.s_tableId
                  LEFT JOIN BookMark_Mapper AS b2 ON b2.b_tableName = org.s_tableName AND b2.b_tableId = org.s_tableId
                  GROUP BY t1.category_1, t1.category_2, t1.category_3
                  ORDER BY t1.category_1, t1.category_2, t1.category_3
              `)

              const rows = sourceTable.all(
                searchOption.tableSearch,
                searchOption.tableSearch,
                param_s_time,
                param_e_time
              )

              // TODO-MULTI_BOOKMARK

              // if (rows.length !== 0) {
              //   console.log('done selectTotalSearchTable ALL : ', rows.length)
              // }

              this.kapedb.exec('COMMIT')
              queryResult = { state: '_000', data: rows }
              //return queryResult
            }
            console.log('end selectTotalSearchTable')

            ///////////////////////////////////////////////////////////////// End Of Time & 테이블 기반
          } // end of 테이블별 검색
          ////////////////////////////////////////////////////////////////////// end of 북마크 정보 필터 없는 것
        } else {
          //////////////////////////////////////////////////////////////////////////////
          // 북마크 ID별 기반으로 조회하는 경우
          //////////////////////////////////////////////////////////////////////////////
          if (searchOption.fullSearch) {
            if (searchOption.type === '_S_WORD') {
              // word 기반

              if (noTimeFlag === true) {
                // word & no time
                const sourceTable = this.kapedb.prepare(`
                      WITH org AS (
                          SELECT * 
                          FROM Total_Search 
                          WHERE searchData MATCH ? 
                      )
                      , t1 AS (
                          SELECT * 
                          FROM Total_Timeline 
                          WHERE t_main = 1 
                      )
                      SELECT t1.category_1, t1.category_2, t1.category_3, count(*) as count 
                      FROM org
                      LEFT JOIN t1 ON t1.t_tableName = org.s_tableName AND t1.t_tableId = org.s_tableId
                      LEFT JOIN BookMark_Mapper AS b2 ON b2.b_tableName = org.s_tableName AND b2.b_tableId = org.s_tableId AND b2.b_id = ?
                      GROUP BY t1.category_1, t1.category_2, t1.category_3
                      ORDER BY t1.category_1, t1.category_2, t1.category_3
                  `)

                const rows = sourceTable.all(param_Search, searchOption._b_id)

                // if (rows.length !== 0) {
                //   console.log('done selectTotalSearchTable ALL : ', rows.length)
                // }

                this.kapedb.exec('COMMIT')
                queryResult = { state: '_000', data: rows }
                //return queryResult
              } else {
                // work & time이 존재
                // 시간 정보가 필터링 조건이기에 최종 자료에서 _Datetime이 NULL이면 제거해야 함
                const sourceTable = this.kapedb.prepare(`
                    WITH org AS (
                        SELECT * 
                        FROM Total_Search 
                        WHERE searchData MATCH ? 
                    )
                    , t1 AS (
                        SELECT * 
                        FROM Total_Timeline 
                        WHERE t_main = 1 AND t_dateTime IS NOT NULL AND t_dateTime >= ? AND t_dateTime <= ?
                    )
                    SELECT t1.category_1, t1.category_2, t1.category_3, count(*) as count 
                    FROM org
                    LEFT JOIN t1 ON t1.t_tableName = org.s_tableName AND t1.t_tableId = org.s_tableId
                    LEFT JOIN BookMark_Mapper AS b2 ON b2.b_tableName = org.s_tableName AND b2.b_tableId = org.s_tableId AND b2.b_id = ?
                    WHERE t1.t_dateTime IS NOT NULL
                    GROUP BY t1.category_1, t1.category_2, t1.category_3
                    ORDER BY t1.category_1, t1.category_2, t1.category_3
                `)

                const rows = sourceTable.all(param_Search, param_s_time, param_e_time, searchOption._b_id)

                // if (rows.length !== 0) {
                //   console.log('done selectTotalSearchTable ALL : ', rows.length)
                // }

                this.kapedb.exec('COMMIT')
                queryResult = { state: '_000', data: rows }
                //return queryResult
              }
            } // end of work 기반
            else {
              // 시간기준으로 되는 경우 - noTime은 없음
              // [1] 타임라인을 조회하게 한다. 여기에 페이지 제한 조건을 넣어야 함
              // [2] Total_Search를 조인
              // [3] 특정 북마크 조인
              const sourceTable = this.kapedb.prepare(`
                  WITH org AS (
                      SELECT * 
                      FROM Total_Search 
                  )
                  , t1 AS (
                      SELECT * 
                      FROM Total_Timeline 
                      WHERE t_main = 1 AND t_dateTime IS NOT NULL AND t_dateTime >= ? AND t_dateTime <= ?
                  )
                  SELECT t1.category_1, t1.category_2, t1.category_3, count(*) as count 
                  FROM t1
                  LEFT JOIN org ON t1.t_tableName = org.s_tableName AND t1.t_tableId = org.s_tableId
                  LEFT JOIN BookMark_Mapper AS b2 ON b2.b_tableName = org.s_tableName AND b2.b_tableId = org.s_tableId AND b2.b_id = ?
                  GROUP BY t1.category_1, t1.category_2, t1.category_3
                  ORDER BY t1.category_1, t1.category_2, t1.category_3
              `)

              const rows = sourceTable.all(param_s_time, param_e_time, searchOption._b_id)

              // if (rows.length !== 0) {
              //   console.log('done selectTotalSearchTable ALL : ', rows.length)
              // }

              this.kapedb.exec('COMMIT')
              queryResult = { state: '_000', data: rows }
              //return queryResult
            }
            ///////////////////////////////////////////////////////////////////////////////////////
            ///////////////////////////////////////////////////////////////// End Of full search
          } else {
            // 테이블 기반 검색 작업
            if (searchOption.type === '_S_WORD') {
              // word 기반 & 개별 테이블 <-- 여기에는 시간 조건이 없기에 _Datetime is not null조건이 필요 없음

              if (noTimeFlag === true) {
                // word & no time
                const sourceTable = this.kapedb.prepare(`
                    WITH org AS (
                        SELECT * 
                        FROM Total_Search 
                        WHERE SearchData MATCH ? AND s_tableName = ?
                    )
                    , t1 AS (
                        SELECT * 
                        FROM Total_Timeline 
                        WHERE t_tableName = ? AND t_main = 1 
                    )
                    SELECT t1.category_1, t1.category_2, t1.category_3, count(*) as count 
                    FROM org
                    LEFT JOIN t1 ON t1.t_tableName = org.s_tableName AND t1.t_tableId = org.s_tableId
                    LEFT JOIN BookMark_Mapper AS b2 ON b2.b_tableName = org.s_tableName AND b2.b_tableId = org.s_tableId AND b2.b_id = ?
                    GROUP BY t1.category_1, t1.category_2, t1.category_3
                    ORDER BY t1.category_1, t1.category_2, t1.category_3
                `)

                const rows = sourceTable.all(
                  param_Search,
                  searchOption.tableSearch,
                  searchOption.tableSearch,
                  searchOption._b_id
                )

                // if (rows.length !== 0) {
                //   console.log('done selectTotalSearchTable ALL : ', rows.length)
                // }

                this.kapedb.exec('COMMIT')
                queryResult = { state: '_000', data: rows }
                //return queryResult
              } else {
                // work & time이 존재
                const sourceTable = this.kapedb.prepare(`
                    WITH org AS (
                        SELECT * 
                        FROM Total_Search 
                        WHERE searchData MATCH ? AND s_tableName = ?
                    )
                    , t1 AS (
                        SELECT * 
                        FROM Total_Timeline 
                        WHERE t_tableName = ? AND t_main = 1 AND t_dateTime IS NOT NULL AND t_dateTime >= ? AND t_dateTime <= ?
                    )
                    SELECT t1.category_1, t1.category_2, t1.category_3, count(*) as count 
                    FROM org
                    LEFT JOIN t1 ON t1.t_tableName = org.s_tableName AND t1.t_tableId = org.s_tableId
                    LEFT JOIN BookMark_Mapper AS b2 ON b2.b_tableName = org.s_tableName AND b2.b_tableId = org.s_tableId AND b2.b_id = ?
                    WHERE t1.t_dateTime IS NOT NULL 
                    GROUP BY t1.category_1, t1.category_2, t1.category_3
                    ORDER BY t1.category_1, t1.category_2, t1.category_3
                `)

                const rows = sourceTable.all(
                  param_Search,
                  searchOption.tableSearch,
                  searchOption.tableSearch,
                  param_s_time,
                  param_e_time,
                  searchOption._b_id
                )

                // if (rows.length !== 0) {
                //   console.log('done selectTotalSearchTable ALL : ', rows.length)
                // }

                this.kapedb.exec('COMMIT')
                queryResult = { state: '_000', data: rows }
                //return queryResult
              }
            } // end of work full
            else {
              // 테이블 & 시간기준으로 되는 경우
              // 타임라인을 기준으로 하기에 _Datetime이 NULL인 것이 없다
              const sourceTable = this.kapedb.prepare(`
                  WITH org AS (
                      SELECT * 
                      FROM Total_Search 
                      WHERE s_tableName = ?
                  )
                  , t1 AS (
                      SELECT * 
                      FROM Total_Timeline 
                      WHERE t_tableName = ? AND t_main = 1 AND t_dateTime IS NOT NULL AND t_dateTime >= ? AND t_dateTime <= ?
                  )
                  SELECT t1.category_1, t1.category_2, t1.category_3, count(*) as count 
                  FROM t1
                  LEFT JOIN org ON t1.t_tableName = org.s_tableName AND t1.t_tableId = org.s_tableId
                  LEFT JOIN BookMark_Mapper AS b2 ON b2.b_tableName = org.s_tableName AND b2.b_tableId = org.s_tableId AND b2.b_id = ?
                  GROUP BY t1.category_1, t1.category_2, t1.category_3
                  ORDER BY t1.category_1, t1.category_2, t1.category_3
              `)

              const rows = sourceTable.all(
                searchOption.tableSearch,
                searchOption.tableSearch,
                param_s_time,
                param_e_time,
                searchOption._b_id
              )

              // if (rows.length !== 0) {
              //   console.log('done selectTotalSearchTable ALL : ', rows.length)
              // }

              this.kapedb.exec('COMMIT')
              queryResult = { state: '_000', data: rows }
              //return queryResult
            }
            console.log('end selectTotalSearchTable')

            ///////////////////////////////////////////////////////////////// End Of Time 기반
          } // end of time 기반
          //////////////////////////////////////////////////////////////////////
        }

        return queryResult
      } catch (err) {
        this.kapedb.exec('ROLLBACK')
        console.error('selectTotalSearchTable 중 오류 발생:', err)
        queryResult = { state: 'D003', data: [] }
        console.log('end error selectTotalSearchTable')
        return queryResult
      }
    }
  }

  /**
   * searchOption을 주면 sync로 DB 조회를 수행하여 총 개수 정보를 전달해 주는 함수.(limit는 전달이 되어도 무시가 된다)
   * @return : DB_OPERATION_RESULT { state, data } // data에는 개수 정보가 들어간다.
   */
  selectCountTotalSearchTable(searchOption: _SEARCH_OPTION) {
    let queryResult: DB_OPERATION_RESULT = { state: '_999', data: Number }

    //console.log('start selectCountTotalSearchTable')
    ////////////////////
    // better-sqlite3 code
    ////////////////////
    {
      // 트랜잭션 시작
      this.kapedb.exec('BEGIN TRANSACTION')

      try {
        let param_s_time: string = ''
        let param_e_time: string = ''
        let param_Search: string = ''
        let noTimeFlag: boolean = false

        if (searchOption.s_time === '' && searchOption.e_time === '') noTimeFlag = true

        if (searchOption.s_time === '') {
          param_s_time = '1070-01-01 00:00:00'
        } else {
          param_s_time = searchOption.s_time
        }

        if (searchOption.e_time === '') {
          const now = new Date()

          // 날짜와 시간을 원하는 형식으로 포맷
          const year = now.getFullYear().toString().padStart(4, '0')
          const month = (now.getMonth() + 1).toString().padStart(2, '0')
          const day = now.getDate().toString().padStart(2, '0')
          const hours = now.getHours().toString().padStart(2, '0')
          const minutes = now.getMinutes().toString().padStart(2, '0')
          const seconds = now.getSeconds().toString().padStart(2, '0')

          // 포맷된 값들을 조합하여 반환
          param_e_time = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
        } else {
          param_e_time = searchOption.e_time
        }

        if (searchOption.orFlag) {
          param_Search = searchOption.keyString.replace(/\s+/g, ' OR ')
        } else {
          param_Search = searchOption.keyString.replace(/\s+/g, ' AND ')
        }

        if (searchOption._b_id === undefined) {
          /////////////////////////////////////////////////////////////////////////////////////////////////////////////////
          // 북마크 ID없이 조회를 하는 경우, ==> 모드 북마크 정보가 나오게 된다. (검색에 북마크 관련 중복 데이터가 생성하게 된다)
          // 어디서든 북마크를 insert하게 되면, 아트팩트 테이블명과 index로 설정되기 때문에 timeline와 totalSearch에 나오게 된다.
          /////////////////////////////////////////////////////////////////////////////////////////////////////////////////
          if (searchOption.fullSearch) {
            if (searchOption.type === '_S_WORD') {
              // word 기반

              if (noTimeFlag === true) {
                // word & no time
                // 먼저 검색에서 1000개를 추출한 후에 조인을 수행하게 한다. 전체를 추출하지 않는 것이다.
                const sourceTable = this.kapedb.prepare(`
                  WITH org AS (
                      SELECT * 
                      FROM Total_Search 
                      WHERE searchData MATCH ? 
                  )
                  , t1 AS (
                      SELECT * 
                      FROM Total_Timeline 
                      WHERE t_main = 1 
                  )
                  SELECT count(*) as CNT
                  FROM org
                  LEFT JOIN t1 ON t1.t_tableName = org.s_tableName AND t1.t_tableId = org.s_tableId
                  LEFT JOIN BookMark_Mapper AS b2 ON b2.b_tableName = org.s_tableName AND b2.b_tableId = org.s_tableId
              `)

                const row = sourceTable.get(param_Search)

                this.kapedb.exec('COMMIT')
                queryResult = { state: '_000', data: row.CNT }
                //return queryResult
              } else {
                // work & time이 존재
                const sourceTable = this.kapedb.prepare(`
                WITH org AS (
                    SELECT * 
                        FROM Total_Search 
                    WHERE searchData MATCH ? 
                )
                , t1 AS (
                    SELECT * 
                    FROM Total_Timeline 
                    WHERE t_main = 1 AND t_dateTime >= ? AND t_dateTime <= ?
                )
                SELECT count(*) as CNT
                FROM org
                LEFT JOIN t1 ON t1.t_tableName = org.s_tableName AND t1.t_tableId = org.s_tableId
                LEFT JOIN BookMark_Mapper AS b2 ON b2.b_tableName = org.s_tableName AND b2.b_tableId = org.s_tableId
                WHERE t1.t_dateTime IS NOT NULL 
            `)

                const row = sourceTable.get(param_Search, param_s_time, param_e_time)

                this.kapedb.exec('COMMIT')
                queryResult = { state: '_000', data: row.CNT }
                //return queryResult
              }
            } // end of work 기반
            else {
              // 오직 시간기준으로 되는 경우 - noTime은 없음 - 많은 시간이 예상된 다 조인을 하여,
              const sourceTable = this.kapedb.prepare(`
              WITH org AS (
                  SELECT * 
                  FROM Total_Search 
              )
              , t1 AS (
                  SELECT * 
                  FROM Total_Timeline 
                  WHERE t_main = 1 AND t_dateTime >= ? AND t_dateTime <= ?
              )
              SELECT count(*) AS CNT
              FROM t1
              LEFT JOIN org ON t1.t_tableName = org.s_tableName AND t1.t_tableId = org.s_tableId
              LEFT JOIN BookMark_Mapper AS b2 ON b2.b_tableName = org.s_tableName AND b2.b_tableId = org.s_tableId
              WHERE t1.t_dateTime IS NOT NULL 
          `)

              const row = sourceTable.get(param_s_time, param_e_time)

              this.kapedb.exec('COMMIT')
              queryResult = { state: '_000', data: row.CNT }
              //return queryResult
            }
            ///////////////////////////////////////////////////////////////////////////////////////
            ///////////////////////////////////////////////////////////////// End Of Word 기반
          } else {
            // 테이블 기반 검색 작업
            if (searchOption.type === '_S_WORD') {
              // word 기반 & 개별 테이블

              if (noTimeFlag === true) {
                // word & no time
                const sourceTable = this.kapedb.prepare(`
                WITH org AS (
                    SELECT * 
                    FROM Total_Search 
                    WHERE searchData MATCH ? AND s_tableName = ?
                )
                , t1 AS (
                    SELECT * 
                    FROM Total_Timeline 
                    WHERE t_main = 1 
                )
                SELECT count(*) AS CNT
                FROM org
                LEFT JOIN t1 ON t1.t_tableName = org.s_tableName AND t1.t_tableId = org.s_tableId
                LEFT JOIN BookMark_Mapper AS b2 ON b2.b_tableName = org.s_tableName AND b2.b_tableId = org.s_tableId
            `)

                const row = sourceTable.get(param_Search, searchOption.tableSearch)

                this.kapedb.exec('COMMIT')
                queryResult = { state: '_000', data: row.CNT }
                //return queryResult
              } else {
                // work & time이 존재
                const sourceTable = this.kapedb.prepare(`
                WITH org AS (
                    SELECT * 
                    FROM Total_Search 
                    WHERE SearchData MATCH ? AND s_tableName = ?
                )
                , t1 AS (
                    SELECT * 
                    FROM Total_Timeline 
                    WHERE t_tableName = ? AND t_main = 1 AND t_dateTime >= ? AND t_dateTime <= ? 
                )
                SELECT count(*) AS CNT
                FROM org
                LEFT JOIN t1 ON t1.t_tableName = org.s_tableName AND t1.t_tableId = org.s_tableId
                LEFT JOIN BookMark_Mapper AS b2 ON b2.b_tableName = org.s_tableName AND b2.b_tableId = org.s_tableId
                WHERE t1.t_dateTime IS NOT NULL 
            `)

                const row = sourceTable.get(
                  param_Search,
                  searchOption.tableSearch,
                  searchOption.tableSearch,
                  param_s_time,
                  param_e_time
                )

                this.kapedb.exec('COMMIT')
                queryResult = { state: '_000', data: row.CNT }
                //return queryResult
              }
            } // end of work full
            else {
              // 시간기준으로 되는 경우 - 검색 시간이 오래 걸리는 Query
              const sourceTable = this.kapedb.prepare(`
              WITH org AS (
                  SELECT * 
                  FROM Total_Search 
                  WHERE s_tableName = ?
              )
              , t1 AS (
                  SELECT * 
                  FROM Total_Timeline 
                  WHERE t_tableName = ? AND t_main = 1 AND t_dateTime >= ? AND t_dateTime <= ? 
              )
              SELECT count(*) AS CNT
              FROM t1
              LEFT JOIN org ON t1.t_tableName = org.s_tableName AND t1.t_tableId = org.s_tableId
              LEFT JOIN BookMark_Mapper AS b2 ON b2.b_tableName = org.s_tableName AND b2.b_tableId = org.s_tableId
              WHERE t1.t_dateTime IS NOT NULL 
              `)

              const row = sourceTable.get(
                searchOption.tableSearch,
                searchOption.tableSearch,
                param_s_time,
                param_e_time
              )

              this.kapedb.exec('COMMIT')
              queryResult = { state: '_000', data: row }
              //return queryResult
            }
            //console.log('end selectCountTotalSearchTable')

            ///////////////////////////////////////////////////////////////// End Of Time 기반
          } // end of time 기반
          //////////////////////////////////////////////////////////////////////
        } else {
          //////////////////////////////////////////////////////////////////////////////
          // 북마크 ID별 기반으로 조회하는 경우
          //////////////////////////////////////////////////////////////////////////////
          if (searchOption.fullSearch) {
            if (searchOption.type === '_S_WORD') {
              // word 기반

              if (noTimeFlag === true) {
                // word & no time
                const sourceTable = this.kapedb.prepare(`
                  WITH org AS (
                      SELECT * 
                      FROM Total_Search 
                      WHERE searchData MATCH ? 
                  )
                  , t1 AS (
                      SELECT * 
                      FROM Total_Timeline 
                      WHERE t_main = 1 
                  )
                  SELECT count(*) AS CNT
                  FROM org
                  LEFT JOIN t1 ON t1.t_tableName = org.s_tableName AND t1.t_tableId = org.s_tableId
                  LEFT JOIN BookMark_Mapper AS b2 ON b2.b_tableName = org.s_tableName AND b2.b_tableId = org.s_tableId AND b2.b_id = ?
              `)

                const row = sourceTable.get(param_Search, searchOption._b_id)

                this.kapedb.exec('COMMIT')
                queryResult = { state: '_000', data: row.CNT }
                //return queryResult
              } else {
                // work & time이 존재
                const sourceTable = this.kapedb.prepare(`
                WITH org AS (
                    SELECT * 
                    FROM Total_Search 
                    WHERE searchData MATCH ? 
                )
                , t1 AS (
                    SELECT * 
                    FROM Total_Timeline 
                    WHERE t_main = 1 AND t_dateTime >= ? AND t_dateTime <= ?
                )
                SELECT count(*) AS CNT
                FROM org
                LEFT JOIN t1 ON t1.t_tableName = org.s_tableName AND t1.t_tableId = org.s_tableId
                LEFT JOIN BookMark_Mapper AS b2 ON b2.b_tableName = org.s_tableName AND b2.b_tableId = org.s_tableId AND b2.b_id = ?
                WHERE t1.t_dateTime IS NOT NULL 
                `)

                const row = sourceTable.get(param_Search, param_s_time, param_e_time, searchOption._b_id)

                this.kapedb.exec('COMMIT')
                queryResult = { state: '_000', data: row.CNT }
                //return queryResult
              }
            } // end of work 기반
            else {
              // 시간기준으로 되는 경우 - noTime은 없음
              const sourceTable = this.kapedb.prepare(`
              WITH org AS (
                  SELECT * 
                  FROM Total_Search 
              )
              , t1 AS (
                  SELECT * 
                  FROM Total_Timeline 
                  WHERE t_main = 1 AND t_dateTime >= ? AND t_dateTime <= ?
              )
              SELECT count(*) AS CNT
              FROM t1
              LEFT JOIN org ON t1.t_tableName = org.s_tableName AND t1.t_tableId = org.s_tableId
              LEFT JOIN BookMark_Mapper AS b2 ON b2.b_tableName = org.s_tableName AND b2.b_tableId = org.s_tableId AND b2.b_id = ?
              WHERE t1.t_dateTime IS NOT NULL 
              `)

              const row = sourceTable.get(param_s_time, param_e_time, searchOption._b_id)

              this.kapedb.exec('COMMIT')
              queryResult = { state: '_000', data: row.CNT }
              //return queryResult
            }
            ///////////////////////////////////////////////////////////////////////////////////////
            ///////////////////////////////////////////////////////////////// End Of Word 기반
          } else {
            // 테이블 기반 검색 작업
            if (searchOption.type === '_S_WORD') {
              // word 기반 & 개별 테이블

              if (noTimeFlag === true) {
                // word & no time
                const sourceTable = this.kapedb.prepare(`
                WITH org AS (
                    SELECT * 
                    FROM Total_Search 
                    WHERE SearchData MATCH ? AND s_tableName = ?
                )
                , t1 AS (
                    SELECT * 
                    FROM Total_Timeline 
                    WHERE t_main = 1 
                )
                SELECT count(*) AS CNT
                FROM org
                LEFT JOIN t1 ON t1.t_tableName = org.s_tableName AND t1.t_tableId = org.s_tableId
                LEFT JOIN BookMark_Mapper AS b2 ON b2.b_tableName = org.s_tableName AND b2.b_tableId = org.s_tableId AND b2.b_id = ?
            `)

                const row = sourceTable.get(param_Search, searchOption.tableSearch, searchOption._b_id)

                this.kapedb.exec('COMMIT')
                queryResult = { state: '_000', data: row.CNT }
                //return queryResult
              } else {
                // work & time이 존재   //########################################################################
                const sourceTable = this.kapedb.prepare(`
                WITH org AS (
                    SELECT * 
                    FROM Total_Search 
                    WHERE SearchData MATCH ? AND s_tableName = ?
                )
                , t1 AS (
                    SELECT * 
                    FROM Total_Timeline 
                    WHERE t_main = 1 AND t_dateTime >= ? AND t_dateTime <= ? AND t_dateTime = ?
                )
                SELECT count(*) AS CNT
                FROM org
                LEFT JOIN t1 ON t1.t_tableName = org.s_tableName AND t1.t_tableId = org.s_tableId
                LEFT JOIN BookMark_Mapper AS b2 ON b2.b_tableName = org.s_tableName AND b2.b_tableId = org.s_tableId AND b2.b_id = ?
                WHERE t1.t_dateTime IS NOT NULL 
                `)

                const row = sourceTable.get(
                  param_Search,
                  searchOption.tableSearch,
                  param_s_time,
                  param_e_time,
                  searchOption.tableSearch,
                  searchOption._b_id
                )

                this.kapedb.exec('COMMIT')
                queryResult = { state: '_000', data: row.CNT }
                //return queryResult
              }
            } // end of work full
            else {
              // 시간기준으로 되는 경우
              const sourceTable = this.kapedb.prepare(`
              WITH org AS (
                  SELECT * 
                  FROM Total_Search 
                  WHERE s_tableName = ?
              )
              , t1 AS (
                  SELECT * 
                  FROM Total_Timeline 
                  WHERE t_main = 1 AND t_dateTime >= ? AND t_dateTime <= ? AND t_tableName = ?
              )
              SELECT count(*) AS CNT
              FROM t1
              LEFT JOIN org ON t1.t_tableName = org.s_tableName AND t1.t_tableId = org.s_tableId
              LEFT JOIN BookMark_Mapper AS b2 ON b2.b_tableName = org.s_tableName AND b2.b_tableId = org.s_tableId AND b2.b_id = ?
              WHERE t1._DateTime IS NOT NULL 
              `)

              const row = sourceTable.get(
                searchOption.tableSearch,
                param_s_time,
                param_e_time,
                searchOption.tableSearch,
                searchOption._b_id
              )

              this.kapedb.exec('COMMIT')
              queryResult = { state: '_000', data: row.CNT }
              //return queryResult
            }
            //console.log('end selectCountTotalSearchTable')

            ///////////////////////////////////////////////////////////////// End Of Time 기반
          } // end of time 기반
          //////////////////////////////////////////////////////////////////////
        }

        return queryResult
      } catch (err) {
        this.kapedb.exec('ROLLBACK')
        console.error('selectCountTotalSearchTable 중 오류 발생:', err)
        queryResult = { state: 'D003', data: -1 }
        return queryResult
      }
    }
  }

  /**
   * 북마크로 등록된 아트팩트의 범주 정보와 개수 정보를 주는 함수
   * 20240223 : bookmakr_mapper 테이블에서 will_delete 필드 추가
   * DB 연결이 되어 있어야 한다.
   * 결과 값은 undefined : 에러인 경우
   *          또는 obj [] : 성공인 경우
   * @param: id : 조회할 북마크Id , tableName: 조회할 테이블 명
   */
  selectBookMarkMapperListByBIdPerTable(id: number, tableName: string, _offset: number) {
    let offset = 0
    const eachPageSize = this.pageSize
    let re: any = []

    ///////////////////
    // for better-sqlite3
    ///////////////////

    offset = _offset

    {
      // 트랜잭션 시작
      this.kapedb.exec('BEGIN TRANSACTION')

      try {
        const columnList = this.tableSetting[tableName].select2 // add 20240122 for col_list    org.* --> ${columnList} + 공통 컬럼  // update 20240223 will_delete추가
        const query = `SELECT b2.b_id, ${columnList} , org.category_1, org.category_2, org.category_3, org.a_old_id, b2.will_delete
                            FROM (SELECT * FROM BookMark_Mapper WHERE b_id = ? AND b_tableName = ?)  AS b2
                            LEFT join ${tableName} AS org on b2.b_tableId = org.a_id
                            LIMIT ? OFFSET ?`
        const sourceTable = this.kapedb.prepare(query)
        const rows = sourceTable.all(id, tableName, eachPageSize, offset)

        if (rows.length !== 0) {
          re = rows
        }
        this.kapedb.exec('COMMIT')
        return re
        // 관련 값이 없을 경우에는 [] 로 전달이 된다.
      } catch (err) {
        this.kapedb.exec('ROLLBACK')
        console.error('selectBookMarkMapperListByBIdPerTable 중 오류 발생:', err)
        return undefined
      }
    }
  }

  /**
   * 북마크로 등록된 아트팩트의 범주 정보와 개수 정보를 주는 함수
   * DB 연결이 되어 있어야 한다.
   * 결과 값은 undefined : 에러인 경우
   *          또는 obj [] : 성공인 경우
   * @param: tableName: 조회할 테이블 명 - 북마크 ID에 대해 중복 데이터가 보일 수 있음
   */
  selectBookMarkMapperListPerTable(tableName: string) {
    const offset = 0
    const eachPageSize = this.pageSize
    let re: any = []

    {
      // 트랜잭션 시작
      this.kapedb.exec('BEGIN TRANSACTION')

      try {
        const query = `SELECT b2.b_id, org.*
                              FROM BookMark_Mapper  AS b2
                              LEFT join ${tableName} AS org on b2.b_tableId = org.a_id  AND b2.b_tableName = ?  
                              LIMIT ? OFFSET ?`
        const sourceTable = this.kapedb.prepare(query)
        const rows = sourceTable.all(tableName, eachPageSize, offset)

        if (rows.length !== 0) {
          re = rows
        }
        this.kapedb.exec('COMMIT')
        return re
        // 관련 값이 없을 경우에는 [] 로 전달이 된다.
      } catch (err) {
        this.kapedb.exec('ROLLBACK')
        console.error('selectBookMarkMapperListPerTable 중 오류 발생:', err)
        return undefined
      }
    }
  }

  /**
   * 특정 북마크로 등록된 아트팩트의 범주 정보와 개수 정보를 주는 함수
   * DB 연결이 되어 있어야 한다.
   * 결과 값은 undefined : 에러인 경우
   *          또는 obj [] : 성공인 경우
   */
  async selectBookMarkMapperCetegoryByBId(_id: number): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      const offset = 0
      const eachPageSize = 1000
      let re: any = []

      ///////////////////
      // for better-sqlite3
      ///////////////////
      {
        // 트랜잭션 시작
        this.kapedb.exec('BEGIN TRANSACTION')

        try {
          const query = `SELECT b2.category_1, b2.category_2, b2.category_3, count(*) AS CNT
                          FROM BookMark_Mapper  AS b2 
                          WHERE b2.b_id = ?
                          GROUP BY b2.category_1, b2.category_2, b2.category_3
                          LIMIT ? OFFSET ?`
          const sourceTable = this.kapedb.prepare(query)
          const rows = sourceTable.all(_id, eachPageSize, offset)

          if (rows.length !== 0) {
            re = rows
          }
          // 관련 값이 없을 경우에는 [] 로 전달이 된다.
        } catch (err) {
          this.kapedb.exec('ROLLBACK')
          console.error('selectBookMarkMapperCetegoryByBid 중 오류 발생:', err)
          reject(undefined)
        } finally {
          this.kapedb.exec('COMMIT')
          resolve(re)
        }
      }
    }) // end of new Promise()
  }

  /**
   * 전체 북마크 별로 등록된 아트팩트 개수 정보 주는 함수
   * DB 연결이 되어 있어야 한다.
   * 결과 값은 undefined : 에러인 경우
   *          또는 obj [] : 성공인 경우
   */
  async selectBookMarkMapperCountPerBId(): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      const offset = 0
      const eachPageSize = 1000
      let re: any = []

      {
        // 트랜잭션 시작
        this.kapedb.exec('BEGIN TRANSACTION')

        try {
          const query = `SELECT b1.b_id, b2.b_name, B2.b_color, count(*) AS CNT
                            FROM BookMark_Mapper AS b1
                            LEFT JOIN BookMark_Info AS b2 on b1.b_id = b2.b_id
                            GROUP BY b1.b_id
                            LIMIT ? OFFSET ?`
          const sourceTable = this.kapedb.prepare(query)
          const rows = sourceTable.all(eachPageSize, offset)

          if (rows.length !== 0) {
            re = rows
          }
          // 관련 값이 없을 경우에는 [] 로 전달이 된다.
        } catch (err) {
          this.kapedb.exec('ROLLBACK')
          console.error('selectBookMarkMapperCountPerBId 중 오류 발생:', err)
          reject(undefined)
        } finally {
          this.kapedb.exec('COMMIT')
          resolve(re)
        }
      }
    }) // end of new Promise()
  }

  /**
   * 모든 북마크에 대해서 북마크로 등록된 아트팩트의 범주 정보와 개수 정보를 주는 함수
   * DB 연결이 되어 있어야 한다.
   * 결과 값은 undefined : 에러인 경우
   *          또는 obj [] : 성공인 경우
   */
  async selectBookMarkMapperCetegory(): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      const offset = 0
      const eachPageSize = 1000
      let re: any = []

      ///////////////////
      // for better-sqlite3
      ///////////////////
      {
        // 트랜잭션 시작
        this.kapedb.exec('BEGIN TRANSACTION')

        try {
          const query = `SELECT b2.category_1, b2.category_2, b2.category_3, count(*) AS CNT
                            FROM BookMark_Mapper  AS b2 
                            GROUP BY b2.category_1, b2.category_2, b2.category_3
                            LIMIT ? OFFSET ?`
          const sourceTable = this.kapedb.prepare(query)
          const rows = sourceTable.all(eachPageSize, offset)

          if (rows.length !== 0) {
            re = rows
          }
          // 관련 값이 없을 경우에는 [] 로 전달이 된다.
        } catch (err) {
          this.kapedb.exec('ROLLBACK')
          console.error('selectBookMarkMapperCetegory 중 오류 발생:', err)
          reject(undefined)
        } finally {
          this.kapedb.exec('COMMIT')
          resolve(re)
        }
      }
    }) // end of new Promise()
  }

  /**
   * 북마크 정보를 주는 함수
   * DB 연결이 되어 있어야 한다.
   * 결과 값은 undefined : 에러인 경우
   *          또는 obj [] : 성공인 경우
   */
  async selectBookMarkInfo(): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      const offset = 0
      const eachPageSize = 1000
      let re: any

      ///////////////////
      // for better-sqlite3
      ///////////////////
      {
        // 트랜잭션 시작
        this.kapedb.exec('BEGIN TRANSACTION')

        try {
          const query = `SELECT b1.b_id, b1.b_name, b1.b_color, CASE WHEN b2.cnt IS NULL THEN 0 ELSE b2.cnt END AS CNT 
                          FROM BookMark_Info AS b1
                            LEFT JOIN (select b_id, count(*) AS CNT from BookMark_Mapper group by b_id) AS b2 
                                  on b1.b_id = b2.b_id
                          LIMIT ? OFFSET ?`
          const sourceTable = this.kapedb.prepare(query)
          const rows = sourceTable.all(eachPageSize, offset)

          if (rows.length !== 0) {
            re = rows
          }
        } catch (err) {
          this.kapedb.exec('ROLLBACK')
          console.error('selectBookMarkInfo 중 오류 발생:', err)
          reject(undefined)
        } finally {
          this.kapedb.exec('COMMIT')
          resolve(re)
        }
      }
    }) // end of new Promise()
  }

  /**
   * CaseInfo 전체 정보를 주는 함수
   * DB 연결이 되어 있어야 한다.
   * 결과 값은 undefined : 에러인 경우
   *          또는 obj [] : 성공인 경우
   */
  async selectCaseInfo(): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      const offset = 0
      const eachPageSize = this.pageSize
      let re: any = []

      ///////////////////
      // for better-sqlite3
      ///////////////////
      {
        // 트랜잭션 시작
        this.kapedb.exec('BEGIN TRANSACTION')

        try {
          const query = `SELECT key, value 
                          FROM Case_Info
                          LIMIT ? OFFSET ?
                        `
          const sourceTable = this.kapedb.prepare(query)
          const rows = sourceTable.all(eachPageSize, offset)

          if (rows.length !== 0) {
            re = rows
          }
        } catch (err) {
          this.kapedb.exec('ROLLBACK')
          console.error('selectCaseInfo 중 오류 발생:', err)
          reject(undefined)
        } finally {
          this.kapedb.exec('COMMIT')
          resolve(re)
        }
      }
    }) // end of new Promise()
  }

  /**
   * 북마크 정보를 삭제하는 함수
   * 북마크 정보를 삭제시, 등록되어있던 모든 아크팩트 북마크 정보가 존재하면, 먼저 삭제하고 수행해야 한다
   * DB 연결이 되어 있어야 한다.
   * 결과 값은 -1 : 에러인 경우
   *          0 이상의 값은 : 정상 동작
   */
  async deleteBookMarkInfo(_id: number): Promise<number> {
    return new Promise<number>((resolve, reject) => {
      let re: number

      ///////////////////
      // for better-sqlite3
      ///////////////////
      {
        // 트랜잭션 시작
        this.kapedb.exec('BEGIN TRANSACTION')

        try {
          const query = `delete FROM BookMark_Info
                          where b_id = ?
                        `
          const sourceTable = this.kapedb.prepare(query)
          const info = sourceTable.run(_id)

          re = info.changes

          // 현재는 시간이 걸리드라도, mapper테이블에서 관련 북마크 자료를 모두 지우게 하는 것
          if (re >= 0) {
            const query = `delete FROM BookMark_mapper
                          where b_id = ?
                        `
            const sourceTable = this.kapedb.prepare(query)
            const info = sourceTable.run(_id)

            re = info.changes
          }

          this.kapedb.exec('COMMIT')
          resolve(re)
        } catch (err) {
          this.kapedb.exec('ROLLBACK')
          console.error('selectBookMarkInfo 중 오류 발생:', err)
          reject(-1)
        } // end of catch문
      }
    }) // end of new Promise()
  }

  /**
   * Case_Info 테이블에서 정보 삭제하는 함수
   * DB 연결이 되어 있어야 한다.
   * 결과 값은 -1 : 에러인 경우
   *          0 이상의 값은 : 정상 동작
   */
  async deleteCaseInfo(_key: string): Promise<number> {
    return new Promise<number>((resolve, reject) => {
      let re: number

      {
        // 트랜잭션 시작
        this.kapedb.exec('BEGIN TRANSACTION')

        try {
          const query = `delete FROM Case_Info
                            where key = ?
                        `
          const sourceTable = this.kapedb.prepare(query)
          const info = sourceTable.run(_key)

          re = info.changes

          this.kapedb.exec('COMMIT')
          resolve(re)
        } catch (err) {
          this.kapedb.exec('ROLLBACK')
          console.error('selectCaseInfo 중 오류 발생:', err)
          reject(-1)
        } // end of catch문
      }
    }) // end of new Promise()
  }

  /**
   * 북마크 정보를 추가하는 함수
   * DB 연결이 되어 있어야 한다.
   * 결과 값은 -1 : 에러인 경우
   *          1 : 성공인 경우
   */
  async insertBookMarkInfo(data: DB_BOOKMARK_INFO): Promise<number> {
    return new Promise<number>((resolve, reject) => {
      let re: number

      ///////////////////
      // for better-sqlite3
      ///////////////////
      {
        // 트랜잭션 시작
        this.kapedb.exec('BEGIN TRANSACTION')

        try {
          // B_id값은 자동으로 증가해서 생성이 됨
          const query = `INSERT INTO BookMark_Info (b_name, b_color) VALUES (?, ?)`
          const stmt = this.kapedb.prepare(query)
          const info = stmt.run(data._name, data._colorInfo)

          re = info.changes
          this.kapedb.exec('COMMIT')
          resolve(re)
        } catch (err) {
          this.kapedb.exec('ROLLBACK')
          console.error('insertBookMarkInfo 중 오류 발생:', err)
          reject(-1)
        }
      }
    }) // end of new Promise()
  }

  /**
   * Case 정보를 추가하는 함수
   * 입력값은 case정보 배열
   * DB 연결이 되어 있어야 한다.
   * 결과 값은 -1 : 에러인 경우
   *          1 : 성공인 경우
   */
  async insertCaseInfo(data: DB_CASEINFO_ITEM[]): Promise<number> {
    return new Promise<number>((resolve, reject) => {
      let re: number = 0

      ///////////////////
      // for better-sqlite3
      ///////////////////
      {
        // 트랜잭션 시작
        this.kapedb.exec('BEGIN TRANSACTION')

        try {
          for (let i = 0; i < data.length; i++) {
            const row = data[i]
            const stmt = this.kapedb.prepare(`INSERT OR REPLACE INTO Case_Info (key, value) VALUES (?, ?)`)
            const info = stmt.run(row._key, row._value)
            re = re + info.changes
          }

          this.kapedb.exec('COMMIT')
          resolve(re)
        } catch (err) {
          this.kapedb.exec('ROLLBACK')
          console.error('insertCaseInfo 중 오류 발생:', err)
          reject(-1)
        }
      }
    }) // end of new Promise()
  }

  /**
   * 북마크 정보를 수정하는 함수(이름, 색정보)
   * DB 연결이 되어 있어야 한다.
   * 결과 값은 -1 : 에러인 경우
   *          0 이상의 값 : 성공인 경우(반영된 row개수)
   */
  async updateBookMarkInfo(data: DB_BOOKMARK_INFO): Promise<number> {
    return new Promise<number>((resolve, reject) => {
      let re: number

      ///////////////////
      // for better-sqlite3
      ///////////////////
      {
        // 트랜잭션 시작
        this.kapedb.exec('BEGIN TRANSACTION')

        try {
          const query = `UPDATE BookMark_Info 
                            SET b_name = ?, 
                                b_color = ?
                            WHERE b_id = ?`
          const stmt = this.kapedb.prepare(query)
          const info = stmt.run(data._name, data._colorInfo, data._id)

          re = info.changes
          this.kapedb.exec('COMMIT')
          resolve(re)
        } catch (err) {
          this.kapedb.exec('ROLLBACK')
          console.error('updateBookMarkInfo 중 오류 발생:', err)
          reject(-1)
        }
      }
    }) // end of new Promise()
  }

  /**
   * Case_Info 정보를 수정하는 함수
   * DB 연결이 되어 있어야 한다.
   * 결과 값은 -1 : 에러인 경우
   *          0 이상의 값 : 성공인 경우(반영된 row개수)
   */
  async updateCaseInfo(data: DB_CASEINFO_ITEM): Promise<number> {
    return new Promise<number>((resolve, reject) => {
      let re: number

      ///////////////////
      // for better-sqlite3
      ///////////////////
      {
        // 트랜잭션 시작
        this.kapedb.exec('BEGIN TRANSACTION')

        try {
          const query = `UPDATE Case_Info 
                            SET value = ? 
                            WHERE key = ?
                        `
          const stmt = this.kapedb.prepare(query)
          const info = stmt.run(data._value, data._key)

          re = info.changes
          this.kapedb.exec('COMMIT')
          resolve(re)
        } catch (err) {
          this.kapedb.exec('ROLLBACK')
          console.error('updateCaseInfo 중 오류 발생:', err)
          reject(-1)
        }
      }
    }) // end of new Promise()
  }

  /**
   *
   * @param dbRootPath : Case폴더 명을 입력파일로 받음
   * @returns '_000' : 성공적으로 케이스이미지 폴더 생성 및 DB가 생성된 경우
   *          'T002' : 에러 발생
   */
  CreateCopyTotalDB(dbOrgRootPath: string, dbRootPath: string) {
    try {
      // let caseFolder = ''
      // let dbSelectImageFolder = ''

      // if (dbOrgRootPath !== dbRootPath) {
      //   // DB 폴더와 선별이미지 폴더가 다른 경우
      //   // 다른 선별이미지 폴더를 기준으로 DB 폴더를 만들어서 kapedb.db를 생성한다.
      //   caseFolder = dbRootPath

      //   // 기준이 되는 선별이미지 폴더에 리포트를 생성하기 위한 위치 정보 저장
      //   this.destReportPath = caseFolder
      //   // 기준이 되는 다른 폴더기준으로 DB 폴더를 생성한다.
      //   dbSelectImageFolder = path.join(caseFolder, this.dbForderName)
      // } else {
      //   // CASE폴더가 동일할 경우
      //   const caseFolder = dbRootPath

      //   const now = new Date()
      //   // 날짜와 시간을 원하는 형식으로 포맷
      //   const year = now.getFullYear().toString().padStart(4, '0')
      //   const month = (now.getMonth() + 1).toString().padStart(2, '0')
      //   const day = now.getDate().toString().padStart(2, '0')
      //   const hours = now.getHours().toString().padStart(2, '0')
      //   const minutes = now.getMinutes().toString().padStart(2, '0')
      //   const seconds = now.getSeconds().toString().padStart(2, '0')
      //   // 선택이미지를 여러번 수행해도 문제가 없게 초 단위로 신규 생성하게 한다
      //   const datetime_postfix = `selectImage_${year}${month}${day}${hours}${minutes}${seconds}`

      //   // 동일 폴더에 case를 생성할 경우, 날짜 정보를이용하여, selectImage_XXXXXX폴더를 생성한다.
      //   this.destReportPath = path.join(caseFolder, datetime_postfix)
      //   dbSelectImageFolder = path.join(caseFolder, datetime_postfix, this.dbForderName)
      // }

      // 입력 받은 복사 선별이미지 절대 path정보를 가지고 폴더 생성한다.
      this.destReportPath = path.dirname(dbRootPath)
      if (!fs.existsSync(this.destReportPath)) {
        // 선별이미지를 위한 폴더는 입력값으로 전달받은 db 절대 path 기준으로 자동으로 생성하게 한다.
        fs.mkdirSync(this.destReportPath, { recursive: true })
        console.log('### Create Destination DB folder')
      }

      // 선별이미지 db 이름 정보 설정
      this.destDBPath = path.join(dbRootPath)

      // 최종 선별이미지를 위한 DB 파일을 생성한다.
      this.destKapedb = new Database(this.destDBPath)

      //console.log(this.destDBPath)
      return '_000'
    } catch (err: any) {
      this.destDBPath = ''
      return 'T002'
    }
  }

  /**
   * 선별이미지 DB에 필요 테이블을 생성하는 함수
   * @returns '_000' 성공
   *          'T001' 테이블 생성 정보 없음
   *          'T002' 테이블 생성 도중 에러 발생
   */
  syncMakeCopyTablesInDestDB() {
    if (this.tableSetting !== null && this.tableSetting !== undefined) {
      const tableSetInfos = Object.keys(this.tableSetting)

      let cnt = 0
      let tableName = ''
      let data: any = null // 각각의 테이블의 정보 객체

      try {
        this.destKapedb.exec('BEGIN TRANSACTION')

        cnt = 0
        for (const key of tableSetInfos) {
          cnt++

          // this.tableSetting[key] : 각각의 테이블 객체 정보
          tableName = key
          data = this.tableSetting[key]

          //console.log('data : ',cnt,  data._sql);
          const queryCreateTables = this.destKapedb.prepare(data._sql)
          queryCreateTables.run()
        }
        this.destKapedb.exec('COMMIT')
        return '_000' // 성공한 경우
      } catch (err) {
        console.log(err)
        this.destKapedb.exec('ROLLBACK')
        return 'T002' // 테이블 생성에 문제가 발생한 경우
      }
    } else {
      return 'T001' // 테이블 생성에 필요 파일이 없는 경우 에러
    }
  }

  /**
   * 동기 방식으로 선별이미지 DB에 total search 테이블 생성
   * @returns '_000' 성공
   *          'T002' 테이블 생성 도중 에러 발생
   */
  syncCreateSearchTableCopyDB() {
    try {
      // table fts5 테이블 생성 , FTS 테이블은 모든 컬럼이 text임
      const createTable = this.destKapedb.prepare(
        `CREATE virtual TABLE IF NOT EXISTS Total_Search using fts5(s_tableName ,s_tableId ,searchData)`
      )
      createTable.run()
      return '_000'
    } catch (err) {
      console.error('CreateTable 중 오류 발생:', err)
      return 'T002'
    }
  }

  /**
   * 동기 방식으로 선별이미지 DB에 total timeline 테이블 생성
   * @returns '_000' 성공
   *          'T002' 테이블 생성 도중 에러 발생
   */
  syncCreateTimeTableCopyDB() {
    try {
      // Total_Timeline table 생성 INTEGER PRIMARY KEY, _main 컬럼 추가함
      const createTimeTable = this.destKapedb.prepare(
        `CREATE TABLE IF NOT EXISTS Total_Timeline (t_id INTEGER PRIMARY KEY AUTOINCREMENT, t_dateTime text,t_attribute text,  t_timelineCategory text, t_category text, t_type text, t_itemName text, t_itemValue text,t_tableName text,t_tableId INTEGER, category_1  text,category_2  text,category_3  text, t_main INTEGER DEFAULT 0)`
      )
      createTimeTable.run()

      // [1] _DateTime 관련 index 생성, idx_DateTime_Total_Timeline
      const createIndex = this.destKapedb.prepare(
        `CREATE INDEX IF NOT EXISTS idx_DateTime1_Total_Timeline ON Total_Timeline (t_dateTime, t_main, category_1, category_2, category_3)`
      )
      createIndex.run()

      const createIndex1 = this.destKapedb.prepare(
        `CREATE INDEX IF NOT EXISTS idx_DateTime2_Total_Timeline ON Total_Timeline (t_dateTime, category_1, category_2, category_3)`
      )
      createIndex1.run()

      // [2] Join을 위한 (_TableName 과 _Table_id) index 생성, idx_Tbl_Id_Total_Timeline
      const createIndex2 = this.destKapedb.prepare(
        `CREATE INDEX IF NOT EXISTS idx_Tbl_Id_Total_Timeline ON Total_Timeline (t_main, t_tableName, t_tableId)`
      )
      createIndex2.run()

      // [3] idx_depth_Total_Timeline
      const createIndex3 = this.destKapedb.prepare(
        `CREATE INDEX IF NOT EXISTS idx_depth_Total_Timeline ON Total_Timeline (t_main, category_1, category_2, category_3)`
      )
      createIndex3.run()

      // [4] idx_DateTimeOnly_Total_Timeline
      const createIndex4 = this.destKapedb.prepare(
        `CREATE INDEX IF NOT EXISTS idx_DateTimeOnly_Total_Timeline ON Total_Timeline (t_dateTime)`
      )
      createIndex4.run()

      // [5] idx_DateTimeMain_Total_Timeline
      const createIndex5 = this.destKapedb.prepare(
        `CREATE INDEX IF NOT EXISTS idx_DateTimeMain_Total_Timeline ON Total_Timeline (t_dateTime, t_main)`
      )
      createIndex5.run()

      ////////////////////////////////////////////////////////////////////////////////////////// add 20240105 for new Timeline table for chart
      // [5] Total_Timeline table 생성 INTEGER PRIMARY KEY, t_main 컬럼 추가함
      const createTimeTableTmp = this.destKapedb.prepare(
        `CREATE TABLE IF NOT EXISTS Total_Timeline_Tmp (t_id INTEGER PRIMARY KEY AUTOINCREMENT, t_dateTime text,t_attribute text,  t_timelineCategory text, t_category text, t_type text, t_itemName text, t_itemValue text,t_TableName text,t_TableId INTEGER, category_1  text,category_2  text,category_3  text, t_main INTEGER DEFAULT 0)`
      )
      createTimeTableTmp.run()

      // [6] idx_DateTimeOnly_Total_Timeline
      const createIndexTmp5 = this.destKapedb.prepare(
        `CREATE INDEX IF NOT EXISTS idx_DateTimeOnly_Total_Timeline_Tmp ON Total_Timeline_Tmp (t_dateTime, category_1, category_2, category_3)`
      )
      createIndexTmp5.run()

      // [7] Total_Timeline_Short table 생성
      const createTimeTableShort = this.destKapedb.prepare(
        `CREATE TABLE IF NOT EXISTS Total_Timeline_Short (t_dateTime text, category_1 text, c_count INTEGER, detail text, primary key (t_dateTime, category_1))`
      )
      createTimeTableShort.run()

      // [8] Total_Timeline_Short2 table 생성
      const createTimeTableShort2 = this.destKapedb.prepare(
        `CREATE TABLE IF NOT EXISTS Total_Timeline_Short2 (t_dateTime text, category_1 text, category_2 text, c_count INTEGER, primary key (t_dateTime, category_1, category_2))`
      )
      createTimeTableShort2.run()

      // [9] idx_Total_Timeline_Short2
      const createIndexTmp6 = this.destKapedb.prepare(
        `CREATE INDEX IF NOT EXISTS idx_Total_Timeline_Short2 ON Total_Timeline_Short2 (t_dateTime, category_1)`
      )
      createIndexTmp6.run()
      //////////////////////////////////////////////////////////////////////////////////////

      ////////////////////////////////////////////////////////////////////////////// add 20240205
      // [10] Total_Timeline_GotoInfo 테이블 생성, 타임라인 차트에서 기간 및 범주로 select되어진 데이터 set에서 어느 페이지에 존재하는지 확인하기 위한 테이블
      const createTimeTableGotoInfo = this.destKapedb.prepare(
        `CREATE TABLE IF NOT EXISTS Total_Timeline_GotoInfo (temp_t_id INTEGER PRIMARY KEY AUTOINCREMENT, t_id integer, t_dateTime text, category_1  text,category_2  text,category_3  text)`
      )
      createTimeTableGotoInfo.run()

      // [11] idx_DateTimeOnly_Total_Timeline_Tmp
      const createIndexGotoInfo = this.destKapedb.prepare(
        `CREATE INDEX IF NOT EXISTS idx_DateTimeOnly_Total_Timeline_GotoInfo ON Total_Timeline_GotoInfo (t_dateTime, category_1, category_2, category_3)`
      )
      createIndexGotoInfo.run()

      // [12] Total_Timeline_ShortTemp table 생성 ( 기간 또는 범주로 조회한 결과를 timeline chart로 보기 위한 테이블 20240205)
      // 이것을 만들기 위해서는 기존에 생성되어 있는 Total_Timeline_Short2를 재사용한다.
      const createTimeTableShortTemp = this.destKapedb.prepare(
        `CREATE TABLE IF NOT EXISTS Total_Timeline_ShortTemp (t_dateTime text, category_1 text, c_count INTEGER, detail text, primary key (t_dateTime, category_1))`
      )
      createTimeTableShortTemp.run()
      //////////////////////////////////////////////////////////////////////////////// end 20240205

      return '_000'
    } catch (err) {
      console.error('CreateTable 중 오류 발생:', err)
      return 'T002'
    }
  }

  /**
   * 동기 방식으로 선별이미지 DB에 BookMark 테이블 생성
   * @returns '_000' 성공
   *          'T002' 테이블 생성 도중 에러 발생
   */
  syncCreateBookMarkTableCopyDB() {
    try {
      // 북마크 상세 정보 테이블
      const createBookMarkInfoTable = this.destKapedb.prepare(
        `CREATE TABLE IF NOT EXISTS BookMark_Info (b_id INTEGER PRIMARY KEY AUTOINCREMENT, b_name text unique, b_color text)`
      )
      createBookMarkInfoTable.run()

      // 북마크와 각각의 테이블 연관관계 테이블
      // 해당 테이블에서 북마크 정보 삭제가 되면, 테이블과 id로 데이터가 존재하지 않을 경우, BookMark_mapper_Sum 테이블에서 해당 자료 삭제를 꼭 해줘야 함
      const createBookMarkMapperTable = this.destKapedb.prepare(
        `CREATE TABLE IF NOT EXISTS BookMark_mapper (b_id integer, b_tableName text, b_tableId integer, category_1 text, category_2 text, category_3 text, will_delete integer DEFAULT 0, primary key (b_id, b_tableName, b_tableId ))`
      )
      createBookMarkMapperTable.run()

      // [1] index1 BookMarkMapper, idx_Bk_Id_BookMark_Mapper
      const createBIndex = this.destKapedb.prepare(
        `CREATE INDEX IF NOT EXISTS idx_Bk_Id_BookMark_Mapper ON BookMark_mapper (b_id)`
      )
      createBIndex.run()

      // [2] index2 BookMarkMapper, idx_Bk_Id_Range_BookMark_Mapper
      const createBIndex2 = this.destKapedb.prepare(
        `CREATE INDEX IF NOT EXISTS idx_Bk_Id_Range_BookMark_Mapper ON BookMark_mapper (b_id, category_1, category_2, category_3)`
      )
      createBIndex2.run()

      // [3] index3 BookMarkMapper, idx_Tbl_Id_BookMark_Mapper 20231109->UNIQUE INDEX로 변경 --> 북마크 ID와 아트팩트는 1:1 mapping이다...
      // 2023.11.15 북마크와 아트팩트는 M : 1이 된다..그래서 unique를 뺀다
      // 따라서, 타임라인에 같은 tableName과 idx에 북마크가 설정이 되면, 해당 모든 타임라인 데이터가 북마크가 되게 보여주어야 함
      const createBIndex3 = this.destKapedb.prepare(
        `CREATE INDEX IF NOT EXISTS idx_Tbl_Id_BookMark_Mapper ON BookMark_mapper (b_tableName, b_tableId)`
      )
      createBIndex3.run()

      // [4] index4 BookMarkMapper, idx_Tbl_name_BookMark_Mapper
      const createBIndex4 = this.destKapedb.prepare(
        `CREATE INDEX IF NOT EXISTS idx_Tbl_name_BookMark_Mapper ON BookMark_mapper (b_tableName)`
      )
      createBIndex4.run()

      return '_000'
    } catch (err) {
      console.error('CreateTable 중 오류 발생:', err)
      return 'T002'
    }
  }

  /**
   * 동기 방식으로 선별이미지 DB에 CaseInfo 테이블 생성
   * 선별이미지 생성시, 호출되는 함수
   * default row에는 선별이미지 생성 날짜 정보를 등록한다
   * @returns '_000' 성공
   *          'T002' 테이블 생성 도중 에러 발생
   */
  syncCreateCaseInfoTableCopyDB() {
    try {
      // Case 상세 정보 테이블 생성
      const createCaseInfoInfoTable = this.destKapedb.prepare(
        `CREATE TABLE IF NOT EXISTS Case_Info (key	TEXT, value	TEXT, PRIMARY KEY(key))`
      )
      createCaseInfoInfoTable.run()

      /////////////////////////////////////////////////////////////////
      /////////////////////////////////////////////////////////////////
      // 현재 날짜와 시간을 얻음
      const now = new Date()

      // 년, 월, 일, 시, 분, 초를 가져옴
      const year = now.getFullYear() // 년도
      const month = ('0' + (now.getMonth() + 1)).slice(-2) // 월 (0부터 시작하므로 +1, 두 자리로 표시)
      const day = ('0' + now.getDate()).slice(-2) // 일 (두 자리로 표시)
      const hours = ('0' + now.getHours()).slice(-2) // 시간 (24시간 표시, 두 자리로 표시)
      const minutes = ('0' + now.getMinutes()).slice(-2) // 분 (두 자리로 표시)
      const seconds = ('0' + now.getSeconds()).slice(-2) // 초 (두 자리로 표시)

      // YYYY/MM/DD hh:mm:ss 형태로 날짜와 시간을 조합
      const formattedDateTime = `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`

      //insert into ... on deplicate key update 대신에 sqlite3에서는 insert or replace into를 사용함
      const insertCreateDateInfo = this.destKapedb.prepare(
        `insert or replace into Case_Info (key, value) values (?, ?)`
      )
      insertCreateDateInfo.run('second_create_datetime', formattedDateTime)

      // 무조건 생성이 되는 정보 triage key add 2024.02.23
      const insertCreateDateInfoTriageInfo = this.destKapedb.prepare(`insert or replace into Case_Info (key, value) values ('triage', '')`)
      insertCreateDateInfoTriageInfo.run()

      //////////////////////////////////////////////////////////////////
      return '_000'
    } catch (err) {
      console.error('CreateCaseInfoTable 중 오류 발생:', err)
      return 'T002'
    }
  }

  /**
   * 동기 방식으로 선별이미지 DB에 통합테이블에는 안들어가지만, SystemInfo정보 테이블 생성(RECmd_Batch_SPO_All_Execute_Command_Output)
   * @returns '_000' 성공
   *          'T002' 테이블 생성 도중 에러 발생
   */
  syncCreateCaseSystenmTableCopyDB() {
    try {
      // Case 상세 정보 테이블 change 20240105
      // CREATE TABLE RECmd_Batch_SPO_All_Execute_Command_Output (a_id INTEGER PRIMARY KEY AUTOINCREMENT,'HivePath' text,'HiveType' text,'Description' text,'Category' text,'KeyPath' text,'ValueName' text,'ValueType' text,'ValueData' text,'ValueData2' text,'ValueData3' text,'Comment' text,'Recursive' text,'Deleted' text,'LastWriteTimestamp' text,'PluginDetailFile' text,a_old_id integer, category_1 text, category_2 text, category_3 text)
      const createCaseSystemTable = this.destKapedb.prepare(
        `CREATE TABLE IF NOT EXISTS RECmd_Batch_SPO_All_Execute_Command_Output (a_id INTEGER PRIMARY KEY AUTOINCREMENT,'HivePath' text,'HiveType' text,'Description' text,'Category' text,'KeyPath' text,'ValueName' text,'ValueType' text,'ValueData' text,'ValueData2' text,'ValueData3' text,'Comment' text,'Recursive' text,'Deleted' text,'LastWriteTimestamp' text,'PluginDetailFile' text,a_old_id integer, category_1 text, category_2 text, category_3 text)`
      )
      createCaseSystemTable.run()

      return '_000'
    } catch (err) {
      console.error('RECmd_Batch_SPO_All_Execute_Command_Output 테이블 생성 중 오류 발생:', err)
      return 'T002'
    }
  }

  /**
   * 동기 방식으로 선별이미지 DB에 BookMark에 기록된 정볼르 기준으로 생성
   * 수정 20240109
   * @Param selectBIds : 선별이미지를 위한 북마크 ID
   *        listener : render에게 전달한 진행사항의 콜백 함수
   * @returns '100' 성공
   *          'T002' 테이블 생성 도중 에러 발생
   *          percent: 991 -> file로 로그 생성
   *          percnet: 990 -> 오직 main thread에서 로그 생성하는 기능
   */
  syncDoCopyTables(selectBIds: number[], listener: (_status: { state: string; percent: number }) => void) {
    const tableSetInfos = Object.keys(this.tableSetting)

    const cnt = 0
    let tableName = ''
    const data: any = null // 각각의 테이블의 정보 객체

    listener({ state: 'STASRT', percent: -1 })

    if (selectBIds.length === 0) {
      this.progressStatus = {
        state: 'T002',
        percent: -1
      }
      listener(this.progressStatus)
      return
    }

    const placeholders = selectBIds.map(() => '?').join(',')

    // percent 991 는 로그를 기록하는 값, 로그는 state에 정보가 들어감
    let log_progress: DB_PROGRESS_PARAM = {
      state: `[selected] B_IDs : ${selectBIds.toString()}`,
      percent: 991
    }
    listener(log_progress)

    try {
      this.destKapedb.exec('BEGIN TRANSACTION')

      const attachQuery = this.destKapedb.prepare(`ATTACH DATABASE '${this.DBPath}' AS sourceDB`)
      attachQuery.run()

      this.selectedProgressCnt = 0 // 긴행사항을 보여주기 위해 초기화 함

      ////////////////////////////////////////////////////////////////////////////////////////////
      ////////////////////////////////////////////////////////////////////////////////////////////
      // 선별된 북마크에 의한 통합검색 테이블 복사
      this.selectedProgressCnt++ // 1
      tableName = 'Total_Search'
      const copySearch = this.destKapedb.prepare(
        `INSERT INTO Total_Search SELECT * FROM sourceDB.Total_Search WHERE (s_tableName, s_tableId) in (SELECT b_tableName, b_tableId FROM sourceDB.BookMark_Mapper WHERE b_id IN (${placeholders}))`
      )
      copySearch.run(selectBIds)

      // 진행사항에서 1을 빼는 이유는 맨 마지막에 리포트를 생성하는 단계완료 후, 100%를 전달하기 위함.
      this.progressStatus = {
        state: tableName,
        percent: Math.round((this.selectedProgressCnt / this.MAX_PROGRESS_COUNT) * 100)
      }
      listener(this.progressStatus)

      // 선별된 북마크에 의한 통합타임라인 테이블 복사 ...Total_Timeline_Tmp에 임의로 넣어야 한다.
      this.selectedProgressCnt++ //2
      tableName = 'Total_Timeline_Tmp'
      const copyTimeline = this.destKapedb.prepare(
        `INSERT INTO Total_Timeline_Tmp SELECT * FROM sourceDB.Total_Timeline WHERE t_main in (0, 1) and (t_tableName, t_tableId) in (SELECT b_tableName, b_tableId FROM sourceDB.BookMark_Mapper WHERE b_id IN (${placeholders}))`
      )
      copyTimeline.run(selectBIds)

      this.progressStatus = {
        state: tableName,
        percent: Math.round((this.selectedProgressCnt / this.MAX_PROGRESS_COUNT) * 100)
      }
      listener(this.progressStatus)

      // 선별된 북마크에 의한 북마크 정보 복사
      this.selectedProgressCnt++ //3
      tableName = 'BookMark_Info'
      const copyBookMarkInfo = this.destKapedb.prepare(
        `INSERT INTO BookMark_Info SELECT * FROM sourceDB.BookMark_Info WHERE b_id IN (${placeholders})`
      )
      copyBookMarkInfo.run(selectBIds)
      this.progressStatus = {
        state: tableName,
        percent: Math.round((this.selectedProgressCnt / this.MAX_PROGRESS_COUNT) * 100)
      }
      listener(this.progressStatus)

      // add 20240223 : Case_Info 테이블에 triage key 값을 복사하게 한다.
      const copyCaseInfo = this.destKapedb.prepare(
        `insert or replace into Case_Info (key, value) SELECT * FROM sourceDB.Case_Info WHERE key = 'triage'`
      )
      copyCaseInfo.run()

      // 선별된 북마크에 의한 북마크 mapper 복사
      this.selectedProgressCnt++ //4
      tableName = 'BookMark_mapper'
      const copyBookMarkMapper = this.destKapedb.prepare(
        `INSERT INTO BookMark_mapper SELECT * FROM sourceDB.BookMark_mapper WHERE b_id IN (${placeholders})`
      )
      copyBookMarkMapper.run(selectBIds)
      this.progressStatus = {
        state: tableName,
        percent: Math.round((this.selectedProgressCnt / this.MAX_PROGRESS_COUNT) * 100)
      }
      listener(this.progressStatus)

      ////////////////////////////////////////////////////////////////////////////////////////////
      // 원본 테이블 체크하여 DB 복사

      for (const key of tableSetInfos) {
        this.selectedProgressCnt++ // 5 .. 9 , 10 .. 14, 15..19, 20..24, 25..29, 30..34, 35..39, 40..44
        // this.tableSetting[key] : 각각의 테이블 객체 정보
        tableName = key

        const tableExistsQuery = this.destKapedb.prepare(
          "SELECT count(*) as count FROM sourceDB.sqlite_master WHERE type='table' AND name=?"
        )
        const tableExists = tableExistsQuery.get(tableName)

        //원본 DB에서 해당 테이블이 존재하는지 확인하여 있으면 선별내용을 체크해서 진행한다
        if (tableExists.count > 0) {
          // add 20240109 동일한 컬럼 정보 리스트를 이용하여, insert가 이루어지게 한다.
          // 아트팩트 테이블마다 미리 정의된 컬럼 정보를 참조하게 한다.
          // 만약 출력되는 컬럼 정보 순서를 변경할려면, tableSetting정보의 select1 key의 value를 변경하면 된다.
          //const columnList = this.tableSetting[tableName].select1      // 20240122 sekect1 --> create1 으로 변경
          const createColumnList = this.tableSetting[tableName].create1
          ////////////////////////////////////////////////////////////////////////

          const copyQuery = this.destKapedb.prepare(
            `INSERT INTO ${tableName} (${createColumnList}) SELECT ${createColumnList} FROM sourceDB.${tableName} WHERE a_id IN (SELECT b_tableId from sourceDB.BookMark_Mapper WHERE b_tableName = ?  AND b_id IN (${placeholders}))`
          )
          copyQuery.run(tableName, selectBIds)
          // 기존 북마크된 모든 테이터를 모두 넣는다....
          ////////////////////////////////////////////////////////////////////////////////////////////

          //////////////////////////////////////////////////////////////////////////////////////////////
          // 선별된 모든 데이터를 복사한 후, 다시 테이블의 a_id를 재 구성하게 한다.
          const local_limit = 10000
          let local_offset = 0
          let each_idx = 1 // [중요] sqlit3 의 index는 1부터 시작이다 ####
          while (true) {
            const checkQuery1 = this.destKapedb.prepare(
              `select a_id, a_old_id 
                from ${tableName}
                limit ? offset ?`
            )
            const re = checkQuery1.all(local_limit, local_offset)

            if (re.length === 0) break // end of while loop

            log_progress = {
              state: `[selected] ${tableName} : ` + re.length.toString(),
              percent: 991
            }
            listener(log_progress)

            for (let l_idx = 0; l_idx < re.length; l_idx++) {
              const row = re[l_idx] /// row는 옛날데이터이다

              // 각각의 아트팩트 테이블에 대해서 기존의 값에서 _id는 재배치, _old_id는 기존_id로 변경
              const updateQuery1 = this.destKapedb.prepare(
                `update ${tableName}
                  set a_id = ?, a_old_id = ?
                  where a_id = ?
                `
              )
              const re2 = updateQuery1.run(each_idx, row.a_id, row.a_id)

              ////////////////////////////////////////////////////////
              // 윗 수정된 내용을 기반으로 book mark mapper 자료 수정
              // CREATE TABLE BookMark_mapper (b_id integer, b_tableName text, b_tableId integer, category_1 text, category_2 text, category_3 text,  primary key (b_id, b_tableName, b_tableId ))
              const updateQuery2 = this.destKapedb.prepare(
                `update BookMark_mapper
                  set b_tableId = ?
                  where b_tableName = ? and b_tableId = ?
                `
              )
              const re3 = updateQuery2.run(each_idx, tableName, row.a_id)

              ////////////////////////////////////////////////////////
              // 윗 수정된 내용을 기반으로 Total Search 자료 수정
              // CREATE VIRTUAL TABLE Total_Search using fts5(s_tableName ,s_tableId ,searchData)
              const updateQuery3 = this.destKapedb.prepare(
                `update Total_Search
                  set s_tableId = ?
                  where s_tableName = ? and s_tableId = ?
                `
              )
              const re4 = updateQuery3.run(each_idx, tableName, row.a_id)

              ////////////////////////////////////////////////////////
              // Total Timeline 자료 수정
              // CREATE TABLE IF NOT EXISTS Total_Timeline_Tmp (t_id INTEGER PRIMARY KEY AUTOINCREMENT, t_dateTime text,t_attribute text,  t_timelineCategory text, t_category text, t_type text, t_itemName text, t_itemValue text,t_tableName text,t_tableId INTEGER, category_1  text,category_2  text,category_3  text, t_main INTEGER DEFAULT 0)
              // Total_Timeline 도 존재한다  t_tableName, t_tableId
              const updateQuery4 = this.destKapedb.prepare(
                `update Total_Timeline_Tmp
                  set t_tableId = ?
                  where t_tableName = ? and t_tableId = ?
                `
              )
              const re5 = updateQuery4.run(each_idx, tableName, row.a_id)

              each_idx++ // 각각의 테이블에 대한 id값 1 증가
            } // end of for loop for update

            local_offset = local_offset + local_limit
          }
        } else {
          // end of 선별 데이터 존재 경우
          this.progressStatus = {
            state: `${this.tableSetting[key].tablename} is No Data!!!!!`,
            percent: 990
          }
          listener(this.progressStatus)
        }

        this.progressStatus = {
          state: this.tableSetting[key].tablename,
          percent: Math.round((this.selectedProgressCnt / this.MAX_PROGRESS_COUNT) * 100)
        }
        listener(this.progressStatus)
      } // end of for table list
      //////////////////////////////////////////////////////////////////////////////////////////////

      // 아래와 같이 코드를 구현할 수 있는 이유
      // sqlite는 입력된 순서로 display된다.
      this.selectedProgressCnt++ //45  중간에 추가됨
      tableName = 'Total_Timeline_Update'
      //////////////////////////////////////////////////////////////////////////////////////////////
      // 앞 코드에서 TimeLine_Tmp 테이블을 북마크의 선별 기준으로 데이터를 insert하였음
      //////////////////////////////////////////////////////////////////////////////////////////////
      const timelineSortMainTable = this.destKapedb.prepare(this.timeLine_Sorted_InsertSQL) // chnage 2040104 : TimeLineTmp에서 sort하여 다시 최종 TimeLine 테이블에 넣는다.
      const runInfo = timelineSortMainTable.run()
      console.log('TotalTimeline : ', runInfo.change) // 사용할 TotalTimeline 테이블 생성완료 ### for Timeline 그리드 테이블 표를 위한 데이터

      // >> 선별이미지를 위한 Timeline Chart를 위한 데이터 테이블을 생성한다. - 추가 정보를 가공하기 위해 만들기 위한 1차 데이더
      // >> TotalTimeLine_Short2 에 데이터 생성, t_DateTime, category_1, category_2, c_count
      // >> TotalTimeLine_Shrt 의 detail 필드를 만들기 위한 임시 테이블
      const timeline_Short2_Table = this.destKapedb.prepare(this.timeLine_Short2_InsertSQL) // add 2040104
      const runInfoShort2 = timeline_Short2_Table.run()
      console.log('TotalTimelineShort_2 : ', runInfoShort2.change)

      // >> 위에서 생성된 TotalTimeLine_Short2에서 사용할 최종데이터 테이블을 생성하게 한다.
      // >> TotalTimeLine_Short 에 데이터 생성, t_DateTime, category_1, c_count, NULL
      const timeline_Short_Table = this.destKapedb.prepare(this.timeLine_Short_InsertSQL) // add 2040104
      const runInfoShort = timeline_Short_Table.run()
      console.log('Copy TotalTimelineShort FIRST: ', runInfoShort.change)

      // TimeLineShort 테이블의 detail 컬럼을 채운다
      const local_limit = this.CreateDBpageSize
      let local_offset = 0
      while (true) {
        const checkQuery1 = this.destKapedb.prepare(
          `select t_dateTime, category_1 
            from Total_Timeline_Short
            limit ? offset ?`
        )
        const orgRows = checkQuery1.all(local_limit, local_offset)

        if (orgRows.length === 0) break // end of while loop

        let idx
        for (idx = 0; idx < orgRows.length; idx++) {
          const checkQuery2 = this.destKapedb.prepare(
            `select category_2, c_count
              from Total_Timeline_Short2
              where t_dateTime = ? and category_1 = ?
              order by category_2
            `
          )
          const detailRows = checkQuery2.all(orgRows[idx].t_dateTime, orgRows[idx].category_1)

          // 조회된 DB 결과를 가지고 detail에 넣을 JSON 데이터 생성
          const detailString = JSON.stringify(detailRows, null, 2)

          // 윗에서 생성된 데이터를 가지고 Total_Timeline_Short의 detail 컬럼을 update한다.
          const checkQuery3 = this.destKapedb.prepare(
            `update Total_Timeline_Short
              set detail = ?
              where t_dateTime = ? and category_1 = ?
            `
          )
          const updateResult = checkQuery3.run(detailString, orgRows[idx].t_dateTime, orgRows[idx].category_1)
        }

        local_offset = local_offset + local_limit
      }
      console.log('Copy TotalTimelineShort SECOND DONE')

      //////////////////////////////////////////////////////////////////////////////////////////////

      this.progressStatus = {
        state: tableName,
        percent: Math.round((this.selectedProgressCnt / this.MAX_PROGRESS_COUNT) * 100)
      }
      listener(this.progressStatus)
      //////////////////////////////////////////////////////////////////////////////////////////////

      this.selectedProgressCnt++ // 46
      tableName = 'Case_Info'
      const tableExistsQuery2 = this.destKapedb.prepare(
        "SELECT count(*) as count FROM sourceDB.sqlite_master WHERE type='table' AND name=?"
      )
      const tableExists2 = tableExistsQuery2.get('Case_Info')

      if (tableExists2.count > 0) {
        const copyCaseInfo = this.destKapedb.prepare(`INSERT OR IGNORE INTO Case_Info SELECT * FROM sourceDB.Case_Info`)
        copyCaseInfo.run()
      }

      this.progressStatus = {
        state: tableName,
        percent: Math.round((this.selectedProgressCnt / this.MAX_PROGRESS_COUNT) * 100)
      }
      listener(this.progressStatus)

      // 나중에 추가된 case의 시스템 정보
      this.selectedProgressCnt++ // 47
      tableName = 'Case_SystemInfo'
      const copyCaseSystem = this.destKapedb
        .prepare(`INSERT INTO RECmd_Batch_SPO_All_Execute_Command_Output SELECT * FROM sourceDB.RECmd_Batch_SPO_All_Execute_Command_Output
                                                                                                          WHERE ValueName = ? 
                                                                                                              or ValueName = ? 
                                                                                                              or ValueName = ? 
                                                                                                              or ValueName = ? 
                                                                                                              or ValueName = ? 
                                                                                                              or ValueName = ? 
                                                                                                              or ValueName = ? 
                                                                                                              or ValueName = ?`)
      copyCaseSystem.run(
        'ProductName',
        'DisplayVersion',
        'CurrentMajorVersionNumber',
        'CurrentMinorVersionNumber',
        'CurrentBuildNumber',
        'InstallTime',
        'TimeZoneKeyName',
        'RegisteredOwner'
      )
      this.progressStatus = {
        state: tableName,
        percent: Math.round((this.selectedProgressCnt / this.MAX_PROGRESS_COUNT) * 100)
      }
      listener(this.progressStatus)

      this.destKapedb.exec('COMMIT')

      const detachQuery = this.destKapedb.prepare(`DETACH DATABASE sourceDB`)
      detachQuery.run()
    } catch (err: any) {
      console.log(err)
      this.destKapedb.exec('ROLLBACK')

      this.progressStatus = {
        state: 'T002',
        percent: -1
      }
      listener(this.progressStatus)

      const errString = err.message
      this.progressStatus = {
        state: errString + ', ' + tableName,
        percent: 990
      }
      listener(this.progressStatus)
    }
  }

  /**
   *
   * @param param : 선별이미지를 생성하기 위한 정보
   * @returns 기존 엑셀에서 리포트 작성된 복사된 신규 엑셀 파일
   */
  async copyWrtieImageDBSummaryReport(param: DB_COPY_CMD) {
    const detail = param.reportItems // 엑셀에 기술할 상세 정보
    const orgFileName = 'PC_app_report_ex.xlsx' // 원본 파일 명
    const filename = param.selectCaseFullXlsxFileName // 저장할 엑셀 파일 경로

    const _rootpath = param.appPath //app.getAppPath() // 프로그램 실행 현재 디렉토리

    if (fs.existsSync(path.join(_rootpath, 'resources', orgFileName))) {
      try {
        const workbook = xlsx.readFile(path.join(_rootpath, 'resources', orgFileName))
        const worksheetName = 'Summary' // 시트 이름 지정
        const worksheet = workbook.Sheets[worksheetName]

        if (worksheet) {
          const range = worksheet['!ref']
          const sheetData = xlsx.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]

          for (let row = 0; row < sheetData.length; row++) {
            for (let col = 0; col < sheetData[row].length; col++) {
              if (sheetData[row][col] === '@사건번호') {
                sheetData[row][col] = detail.caseNumber
              } else if (sheetData[row][col] === '@증거번호') {
                sheetData[row][col] = detail.imageNumber
              } else if (sheetData[row][col] === '@소속청') {
                sheetData[row][col] = detail.divisionOfficeName
              } else if (sheetData[row][col] === '@소속부서') {
                sheetData[row][col] = detail.departmentName
              } else if (sheetData[row][col] === '@분석관명') {
                sheetData[row][col] = detail.analysisName
              } else if (sheetData[row][col] === '@직급') {
                sheetData[row][col] = detail.analysisPosition
              } else if (sheetData[row][col] === '@장소') {
                sheetData[row][col] = detail.analysisLocation
              } else if (sheetData[row][col] === '@분석일자') {
                sheetData[row][col] = detail.analysisDate
              } else if (sheetData[row][col] === '@타임존') {
                sheetData[row][col] = detail.analysisTimezone
              } else if (sheetData[row][col] === '@획득파일명') {
                sheetData[row][col] = detail.acquisitionFileName
              } else if (sheetData[row][col] === '@획득파일크기') {
                sheetData[row][col] = detail.acquisitionFileSize
              } else if (sheetData[row][col] === '@획득해시값') {
                sheetData[row][col] = detail.acquisitionHashValue
              } else if (sheetData[row][col] === '@획득해시타입') {
                sheetData[row][col] = detail.acquisitionHashType
              } else if (sheetData[row][col] === '@획득도구명') {
                sheetData[row][col] = detail.acquisitionToolName
              }
              // else if (sheetData[row][col] === '@선별파일명') {
              //   sheetData[row][col] = detail.selectedFileName
              // } else if (sheetData[row][col] === '@선별파일크기') {
              //   sheetData[row][col] = detail.selectedFileSize
              // } else if (sheetData[row][col] === '@선별해시값') {
              //   sheetData[row][col] = detail.selectedHashValue
              // } else if (sheetData[row][col] === '@선별해시타입') {
              //   sheetData[row][col] = detail.selectedHashType
              // } else if (sheetData[row][col] === '@선별도구명') {
              //   sheetData[row][col] = detail.selectedToolName
              // }
            }
          }

          const newWorksheet = xlsx.utils.aoa_to_sheet(sheetData)
          workbook.Sheets[worksheetName] = newWorksheet

          // 파일 이름에서 디렉토리 정보 추출
          const dirPath = path.dirname(filename);

          // 추출된 디렉토리가 없다면, 생성하게 한다.
          if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
          }

          xlsx.writeFile(workbook, filename)
          //console.log('특정 값이 변경된 파일이 생성되었습니다.')
        } else {
          console.log('시트를 찾을 수 없습니다.')
        }
      } catch (err) {
        console.error('파일을 읽거나 쓰는 동안 오류가 발생했습니다:', err)
      }
    }
  }

  /**
   * 기존에 만들어져 있는 엑셀문서의 앞 tab을 update하는 것
   * @param param : 선별이미지를 수정하기 위한 정보
   *                selectCaseFullXlsxFileName 필드와 reportItems 필드만 참조함
   * @returns : none 수정된 엑셀에서 리포트 작성된 복사된 신규 엑셀 파일, 선별이미지 관련 내용만 바꾼다
   */
  async changeWrtieImageDBReport(param: DB_COPY_CMD) {
    const detail = param.reportItems // 엑셀에 기술할 상세 정보
    const orgFileName = param.selectCaseFullXlsxFileName // 생성 되었던 엑셀 파일 명
    const filename = param.selectCaseFullXlsxFileName // 저장할 엑셀 파일명 동일

    if (fs.existsSync(path.join(orgFileName))) {
      const orgFullFileName = path.join(orgFileName)
      try {
        const workbook = xlsx.readFile(orgFullFileName)
        const worksheetName = 'Summary' // 시트 이름 지정
        const worksheet = workbook.Sheets[worksheetName]

        if (worksheet) {
          const range = worksheet['!ref']
          const sheetData = xlsx.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]

          for (let row = 0; row < sheetData.length; row++) {
            for (let col = 0; col < sheetData[row].length; col++) {
              if (sheetData[row][col] === '@선별파일명') {
                sheetData[row][col] = detail.selectedFileName
              } else if (sheetData[row][col] === '@선별파일크기') {
                sheetData[row][col] = detail.selectedFileSize
              } else if (sheetData[row][col] === '@선별해시값') {
                sheetData[row][col] = detail.selectedHashValue
              } else if (sheetData[row][col] === '@선별해시타입') {
                sheetData[row][col] = detail.selectedHashType
              } else if (sheetData[row][col] === '@선별도구명') {
                sheetData[row][col] = detail.selectedToolName
              }
            }
          }

          const newWorksheet = xlsx.utils.aoa_to_sheet(sheetData)
          workbook.Sheets[worksheetName] = newWorksheet

          xlsx.writeFile(workbook, filename)
          //console.log('특정 값이 변경된 파일이 생성되었습니다.')
          return { state: '_000', percent: 100 }
        } else {
          console.log('시트를 찾을 수 없습니다.')
          return { state: 'T003', percent: -1 }
        }
      } catch (err) {
        console.error('파일을 읽거나 쓰는 동안 오류가 발생했습니다:', err)
        return { state: 'T003', percent: -2 }
      }
    }
  }

  /**
   *
   * @param param : 선별이미지를 생성하기 위한 정보
   * @param listener : renderer 프로세스에게 상태 정보를 전달하기 위한 값
   * @returns
   */
  async makeSelectImageDBListener(param: DB_COPY_CMD, listener: (_status: { state: string; percent: number }) => void) {
    if (this.tableSetting !== null && this.tableSetting !== undefined) {
      // 진행상태 정보를 초기화해주어야 한다.
      console.log('call makeSelectImageDBListener')

      let ret: string = ''
      /////////////////////////////////////////////////////////
      try {
        // 선택이미지 DB 신규 생성
        ret = this.CreateCopyTotalDB(param.dBPathFullFileName, param.copyDBPathFullFileName)

        // ///////////////////////////////////////////////////////////////////////////
        if (ret === '_000') {
          // 선택이미지 DB의 테이블 생성 기존 DB 생성 sql구문을 수행하는 것
          ret = this.syncMakeCopyTablesInDestDB()
        }

        if (ret === '_000') {
          // 선택이미지 DB의 통합 테이블 생성
          ret = this.syncCreateSearchTableCopyDB()
        }

        if (ret === '_000') {
          // 선택이미지 DB의 통합 타입 테이블 생성
          ret = this.syncCreateTimeTableCopyDB()
        }

        if (ret === '_000') {
          // 선택이미지 DB의 북마크 테이블 및 Index 생성
          ret = this.syncCreateBookMarkTableCopyDB()
        }

        if (ret === '_000') {
          // 선택이미지 DB에 CaseInfo 테이블 생성
          // 해당 테이블은 통합DB 생성시, 생성되는 테이블이므로 선별이미지에서도 생성이 되어야 함
          ret = this.syncCreateCaseInfoTableCopyDB()
        }

        if (ret === '_000') {
          // system Info를 위한 RECmd_Batch_SPO_All_Execute_Command_Output 테이블 생성
          // 해당 테이블은 CSV에서 DB 생성시에는 CSV모듈에서 생성시키지만, 선별이미지에는 TableInfo.json에 해당 정보가 없기에
          // 따로 생성해 주어야 함
          ret = this.syncCreateCaseSystenmTableCopyDB()
        }
        //////////////////////////////////////////////////////////////////////////// 선별이미지 DB에 DB 스키마 생성
        // const _state = {
        //   state: 'end of syncCreateCaseSystenmTableCopyDB()',
        //   percent: 990
        // }
        // listener(_state) // for debug 20240109

        if (ret === '_000') {
          // 선택이미지 DB 자료 생성상태로 데이터 전송
          // 북마트에 있는 searchData와 Timeline테이터를 넣기에 용량이 크지 않다
          this.syncDoCopyTables(param.selectIds, (_status: { state: string; percent: number }) => {
            listener(_status)
          })

          // 엑셀의 첫 탭의 summary 리포트를 위한 파일 자동 생성
          this.copyWrtieImageDBSummaryReport(param)

          // 완성된 선택이미지로 리포트 작성
          await this.makeSelectImageDBReportListenerByTool(param, (_status: { state: string; percent: number }) => {
            listener(_status)
          })

        } else {
          this.progressStatus = {
            state: 'T002',
            percent: -1
          }
          listener(this.progressStatus)
        }

        /////////////////////////////////////////////////////////////
      } catch (err) {
        console.error('선택이미지 생성  중 오류 발생:', err)
        this.progressStatus = {
          state: 'T002',
          percent: -1
        }
        listener(this.progressStatus)
        this.close()
        return
      }
      console.log('End makeSelectImageDBListener')
      this.close()
      return
    } else {
      // 테이블 처리 정보가 없을 경우 에러 처리 한다.
      this.progressStatus = {
        state: 'T001',
        percent: -2
      }
      this.close()
      return
    }
  }

  /**
   * 증거이미지 DB를 xlxs로 만드는 파이썬 바이너리 수행하는 것
   * 증거이미지 엑셀 처리를 수정할려면, 파이썬 프로그램을 수정해야 한다.
   * 독립 쓰레드로 동작하고 있기에, Sync 모두로 외부 프로그램을 수행해야 한다.
   * 선별이미지의 아트팩트 테이블 40개중에 데이터가 존재하는 것만 생성한다.
   * 선별된 TimeLine정보는 추출한다
   * 선별된 북마크 정보도 추출한다
   * TotalSearch내용은 엑셀에 기술 안해도 된다. 대검 요청 사항 20240202 from 오중경수사관
   * case infor 정보가 엑셀에 필요 없다. 20240202 from 대검 오중경수사관
   * Case System Info 테이블 정보 -- RECmd_Batch_SPO_All_Execute_Command_Output 검사 시스템 정보가 엑셀에 필요 없다. 20240202 from 대검 오중경수사관
   * @param param , app실행위치와 엑셀파일위치, 선별이미지DB파일 위치 를 포함하고 있음
   * @param listener : 완료 시, caller에세 전달할 정보
   * @returns 
   */
  async makeSelectImageDBReportListenerByTool(
    param: DB_COPY_CMD,
    listener: (_status: { state: string; percent: number }) => void
  ) {

    this.progressStatus = {
      state: 'DB => XLSX START ',
      percent: 990
    };
    listener(this.progressStatus)

    try {
      // shell : ture 로 수행하기 때문에, 공백이 인자 구분자로 인식된다. 따라서, 인자 구분을 위해 " " 로 묶어 주어야 한다.
      const dbSelectReportName = `"${path.join(param.selectCaseFullXlsxFileName)}"`  // 엑셀파일명 절대 경로 포함
      const dbFileName = `"${path.join(param.copyDBPathFullFileName)}"`              // 선별이미지 DB 파일명
      const jsonFileName = `"${path.join(param.appPath, 'resources', 'evidence_data.json')}"`  // 선별이미지를 추출할 테이블 정보 및 컬럼 정보

      const _programPath = `"${path.join(param.appPath, 'resources', 'db2xlsx_convert.exe')}"`
        
      const _cpProc = cp.spawnSync(_programPath, [dbSelectReportName, dbFileName, jsonFileName], { encoding: 'utf-8', shell: true })

      if(_cpProc.status === 0 ){
        this.progressStatus = {
                state: '_000',
                percent: 100
              };
        listener(this.progressStatus)
      } else {
        this.progressStatus = {
          state: 'T002',
          percent: -1
        };
        listener(this.progressStatus)
      }

    } catch(err) {
      this.progressStatus = {
        state: 'T001',
        percent: -1
      };
      listener(this.progressStatus)
    }
    
  }

  makePrintDBTable(param: TABLE_PRT_CMD, listener: (_status: { state: string; percent: number }) => void) {
    console.log('call makePrintDBTable')

    const csvFileName = path.join(param.saveTableFileName)

    this.progressStatus = {
      state: 'PRT_START',
      percent: 0
    }
    listener(this.progressStatus)

    // 입력한 파일이 존재한다면, 삭제하게 한다.
    if (fs.existsSync(csvFileName)) {
      fs.unlinkSync(csvFileName)
      console.warn(`데이터 CSV파일 생성 명령어에 대해 기존 ${csvFileName} 파일을 삭제합니다.`)
    }

    /////////////////////////////////////////////////////////
    try {
      // 선택이미지로 데이터 전송
      let offset = 0
      const pagesize = 10000

      const getAllCountQuery = this.kapedb.prepare(`SELECT count(*) AS TOTAL_CNT FROM ${param.tableName}`)
      const rowCount = getAllCountQuery.get()

      let loopTotalCount = Math.floor(rowCount.TOTAL_CNT / pagesize)
      if (rowCount.TOTAL_CNT % pagesize) loopTotalCount++

      let cnt = 0
      let loopCnt = 0
      while (true) {
        const getAllQuery = this.kapedb.prepare(`SELECT * FROM ${param.tableName} LIMIT ? OFFSET ?`)
        const rows = getAllQuery.all(pagesize, offset)

        if (rows.length === 0) {
          // 더이상 데이터가 없음
          break
        }

        if (rows.length !== 0) {
          //console.log(rows.length)
          let i: number = 0
          for (i = 0; i < rows.length; i++) {
            /////////////////////////////////////////////////////////////////////////////
            // 해당 테이블에서  첫 라인의 데이터를 넣을 경우 타이틀을 넣어 준다
            if (cnt === 0) {
              const row = rows[i]
              const row2 = Object.keys(row) // 객체의 key 배열을 만든다
              const stringified = row2
                .map((item: any) => {
                  if (typeof item === 'string') {
                    return `"${item}"` // 문자열은 큰 따옴표로 둘러싸기
                  } else if (typeof item === 'number') {
                    return `${item.toString()}` // 숫자이면 그냥
                  }
                  return `"${item.toString()}"` // 그 외의 다른 유형의 데이터는 그냥 문자열로 변환
                })
                .join(', ')

              // 유니코드에서 BOM(Byte Order Mark) 정보를 파일의 제일 앞에 넣는다
              const rowWithNewLine = '\ufeff' + stringified + '\n'
              fs.appendFileSync(csvFileName, rowWithNewLine, { encoding: 'utf8' })
            }
            ////////////////////////////////////////////////////////////////////////////////

            const row = rows[i]
            const row2 = Object.values(row)
            const stringified = row2
              .map((item: any) => {
                if (item === null) {
                  return ''
                } else if (typeof item === 'string') {
                  return `"${item}"` // 문자열은 큰 따옴표로 둘러싸기
                } else if (typeof item === 'number') {
                  return `${item.toString()}` // 숫자이면 그냥
                }
                return `"${item.toString()}"` // 그 외의 다른 유형의 데이터는 그냥 문자열로 변환
              })
              .join(', ')
            console.log(stringified)
            const rowWithNewLine = stringified + '\n'
            fs.appendFileSync(csvFileName, rowWithNewLine, { encoding: 'utf8' })

            cnt++ // 반드시 증가시켜야 한다. 첫번째 데이터에 header를 넣어야 하기 때문이다
          } // end of for loop
        } // end of if 조회 데이터 존재

        offset = offset + pagesize
        loopCnt++
        const stepVal: number = Math.floor((loopCnt / loopTotalCount) * 100)
        this.progressStatus = {
          state: `W001_${loopCnt}_${loopTotalCount}`,
          percent: stepVal
        }
        listener(this.progressStatus)
      } // end of while loop

      //////////////////////////
      // 데이터가 없으면 예외 처리
      //////////////////////////
      if (cnt === 0) {
        // 데이터가 전혀 없는 경우

        console.log('No Data')
        this.progressStatus = {
          state: 'P001',
          percent: -2
        }
        listener(this.progressStatus)
      } else {
        console.log('success')
        this.progressStatus = {
          state: '_000',
          percent: 100
        }
        listener(this.progressStatus)
      }
      this.close()

      /////////////////////////////////////////////////////////////
    } catch (err) {
      console.error('프린트 출력 중 오류 발생:', err)
      this.progressStatus = {
        state: 'P001',
        percent: -1
      }
      listener(this.progressStatus)
      this.close()
    }
  }
}
