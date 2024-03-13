import { threadId, parentPort } from 'worker_threads'
import { queryKapeDB } from '../kape/queryKapeDB'
import {
  DB_STATUS,
  DB_PROGRESS_PARAM,
  _SEARCH_TYPE,
  _SEARCH_OPTION,
  DB_BOOKMARK_MAPPER_INFO,
  _DB_CMD_TYPE,
  DB_TIMELINE_QUERY_INFO,
  DB_COPY_CMD,
  TABLE_PRT_CMD,
  DB_THREAD_QUERY_CMD
} from '../../shared/models'

const pagesize = 1000 // 2023.11.14 200000 -> 1000
const _MAX_QUERY_COUNT = 5000000
const _CreateDBpageSize = 100000 // queryKapeDB.ts의 값과 항상 일치 시켜야 함
/**
 * work thread body 함수
 * --> 통합 DB를 생성하는 함수임
 */
parentPort?.on('message', (value: DB_THREAD_QUERY_CMD) => {
  // Thread로 동작하는 DB_THREAD_QUERY_CMD를 사용하는 경우, appPath에 값을 꼭 주어야 한다.
  const kapedb = new queryKapeDB(value.appPath)

  // console.log('threadID: ' + threadId)
  // console.log('parent message: ', value)

  try {
    if (value.type === '_CREATE_TOTAL_TBL') {
      const re = kapedb.setDBConnectSync(value.dbPath) // thread db connect
      if (re === 1) {
        kapedb.makeTotalTableListener((_status) => {
          parentPort?.postMessage(_status) // 진행 상태 정보를 콜백 함수를 통해 전달
        })
      } else {
        parentPort?.postMessage({ state: 'D001', percent: -1 })
      }
    } else if (value.type === '_QUERY_TOTAL_TBL') {
      const re = kapedb.setDBConnectSync(value.dbPath) // thread db connect
      if (re === 1) {
        if (!Array.isArray(value.data!)) {
          const param: _SEARCH_OPTION = value.data! as _SEARCH_OPTION // 강제로 바꿔서 수행하게 한다.
          const result = kapedb.selectTotalSearchTable(param)
          parentPort?.postMessage(result) // 정상 처리가 되면 데이터를 준다.
        } else {
          parentPort?.postMessage({ state: 'D003', data: [], etc: 'param error' })
        }
      } else {
        parentPort?.postMessage({ state: 'D003', data: [], etc: 'db connection error' })
      }
    } else if (value.type === '_QUERY_CATEGORY_TOTAL_CNT_TBL') {
      const re = kapedb.setDBConnectSync(value.dbPath) // thread db connect
      if (re === 1) {
        if (!Array.isArray(value.data!)) {
          const param: _SEARCH_OPTION = value.data! as _SEARCH_OPTION // 강제로 바꿔서 수행하게 한다.
          const result = kapedb.selectCountPerCategoryTotalSearchTable(param) // Select Count(*)
          parentPort?.postMessage(result) // 정상 처리가 되면 데이터를 준다. state는 상태 정보, data에는 count값
        } else {
          parentPort?.postMessage({ state: 'D003', data: -1 })
        }
      } else {
        parentPort?.postMessage({ state: 'D003', data: -1 })
      }
    } else if (value.type === '_QUERY_TOTAL_CNT_TBL') {
      const re = kapedb.setDBConnectSync(value.dbPath) // thread db connect
      if (re === 1) {
        if (!Array.isArray(value.data!)) {
          const param: _SEARCH_OPTION = value.data! as _SEARCH_OPTION // 강제로 바꿔서 수행하게 한다.
          const result = kapedb.selectCountTotalSearchTable(param) // Select Count(*)
          parentPort?.postMessage(result) // 정상 처리가 되면 데이터를 준다. state는 상태 정보, data에는 count값
        } else {
          parentPort?.postMessage({ state: 'D003', data: -1 })
        }
      } else {
        parentPort?.postMessage({ state: 'D003', data: -1 })
      }
    } else if (value.type === '_ADD_BOOKMARK_MAPPER') {
      const re = kapedb.setDBConnectSync(value.dbPath) // thread db connect
      if (re === 1) {
        if (Array.isArray(value.data!)) {
          let errFlag = false
          for (const data of value.data!) {
            if (data._tableName === '' || data._tableName === undefined || data._tableIdx === undefined || data._tableName === null || data._tableIdx === null) {
              errFlag = true
              break
            }
          }

          if( errFlag ) {
            parentPort?.postMessage({ state: 'D003', data: -2 })
          } else {
            const result = kapedb.insertBookMarkMapper(value.data!)
            parentPort?.postMessage({ state: '_000', data: result }) // 정상 처리가 되면 데이터를 준다. 코드와 개수정보
          }
          
        } else {
          parentPort?.postMessage({ state: 'D003', data: -1 })
        }
      } else {
        parentPort?.postMessage({ state: 'D003', data: -1 })
      }
    } else if (value.type === '_WILL_DEL_CHANGE_BOOKMARK_MAPPER') { // bookmark_mapper_info에서 will_delete 값을 변경하는 API
      const re = kapedb.setDBConnectSync(value.dbPath) // thread db connect
      if (re === 1) {
        if (Array.isArray(value.data!)) {
          let errFlag = false
          for (const data of value.data!) {
            if (data._tableName === '' || data._tableName === undefined || data._tableIdx === undefined || data._tableName === null || data._tableIdx === null) {
              errFlag = true
              break
            }
          }

          if( errFlag ) {
            parentPort?.postMessage({ state: 'D003', data: -2 })
          } else {
            const result = kapedb.changeWillDelBookMarkMapper(value.data!)
            parentPort?.postMessage({ state: '_000', data: result }) // 정상 처리가 되면 데이터를 준다. 코드와 개수정보
          }
          
        } else {
          parentPort?.postMessage({ state: 'D003', data: -1 })
        }
      } else {
        parentPort?.postMessage({ state: 'D003', data: -1 })
      }
    } else if (value.type === '_DEL_BOOKMARK_MAPPER') {
      const re = kapedb.setDBConnectSync(value.dbPath) // thread db connect
      if (re === 1) {
        if (Array.isArray(value.data!)) {

          let errFlag = false
          for (const data of value.data!) {
            if (data._tableName === '' || data._tableName === undefined || data._tableIdx === undefined || data._tableName === null || data._tableIdx === null) {
              errFlag = true
              break
            }
          }

          if( errFlag ) {
            parentPort?.postMessage({ state: 'D003', data: -3 })
          } else {
            const result = kapedb.deleteBookMarkMapper(value.data!)
            parentPort?.postMessage({ state: '_000', data: result }) // 정상 처리가 되면 데이터를 준다. 코드와 개수정보
          }
        } else {
          parentPort?.postMessage({ state: 'D003', data: -1 })
        }
      } else {
        parentPort?.postMessage({ state: 'D003', data: -1 })
      }
    } else if (value.type === '_WILL_DEL_DONE_BOOKMARK_MAPPER') {  // 북마크 관리 화면에서 실제로 삭제를 할 경우 처리하는 것
      const re = kapedb.setDBConnectSync(value.dbPath) // thread db connect
      if (re === 1) {
        if (Array.isArray(value.data!)) {

          let errFlag = false
          for (const data of value.data!) {
            if (data._tableName === '' || data._tableName === undefined || data._tableIdx === undefined || data._tableName === null || data._tableIdx === null) {
              errFlag = true
              break
            }
          }

          if( errFlag ) {
            parentPort?.postMessage({ state: 'D003', data: -3 })
          } else {
            const result = kapedb.DoWillDelBookMarkMapper(value.data!)
            parentPort?.postMessage({ state: '_000', data: result }) // 정상 처리가 되면 데이터를 준다. 코드와 개수정보
          }
        } else {
          parentPort?.postMessage({ state: 'D003', data: -1 })
        }
      } else {
        parentPort?.postMessage({ state: 'D003', data: -1 })
      }
    }else if (value.type === '_REF_BOOKMARK_MAPPER') {
      const re = kapedb.setDBConnectSync(value.dbPath) // thread db connect
      if (re === 1) {
        if (Array.isArray(value.data!)) {
          const param: DB_BOOKMARK_MAPPER_INFO = value.data[0]
          // 함수가 프라미스가 되면 결과도 프라미스 결과가 된다.
          if (param._offset === undefined || param._tableName === '') {
            // 에러 처리
            parentPort?.postMessage({ state: 'D003', data: -1 })
          } else {
            const result = kapedb.selectBookMarkMapperListByBIdPerTable(param._id, param._tableName, param._offset!)
            parentPort?.postMessage({ state: '_000', data: result }) // 정상 처리가 되면 데이터를 준다. 코드와 개수정보
          }
        } else {
          parentPort?.postMessage({ state: 'D003', data: -1 })
        }
      } else {
        parentPort?.postMessage({ state: 'D003', data: -1 })
      }
    } else if (value.type === '_QUERY_TIMELINE_SHORT_TBL') {
      // 1년치 max 레코드 개수는 8,760 개
      const re = kapedb.setDBConnectSync(value.dbPath) // thread db connect
      if (re === 1) {
        if (!Array.isArray(value.data!)) {
          const param: DB_TIMELINE_QUERY_INFO = value.data! as DB_TIMELINE_QUERY_INFO // 강제로 바꿔서 수행하게 한다.
          const re = kapedb.syncSelectContentTimelineShortTable(param) // add 20240108
          parentPort?.postMessage({ state: '_000', data: re })
        } else {
          parentPort?.postMessage({ state: 'D003', data: [] })
        }
      } else {
        parentPort?.postMessage({ state: 'D003', data: [] })
      }
    } else if (value.type === '_CREATE_QUERY_TIMELINE_TBL') {   // add 20240205
      const re = kapedb.setDBConnectSync(value.dbPath) // thread db connect
      if (re === 1) {
        if (!Array.isArray(value.data!)) {
          const param: DB_TIMELINE_QUERY_INFO = value.data! as DB_TIMELINE_QUERY_INFO // 강제로 바꿔서 수행하게 한다.
          const re = kapedb.syncCreaate_SelectContentTimelineShortTempTable(param)
          parentPort?.postMessage({ state: '_000', data: re })
        } else {
          parentPort?.postMessage({ state: 'D003', data: [] })
        }
      } else {
        parentPort?.postMessage({ state: 'D003', data: [] })
      }
    } else if (value.type === '_QUERY_TIMELINE_TBL') {
      const re = kapedb.setDBConnectSync(value.dbPath) // thread db connect
      if (re === 1) {
        if (!Array.isArray(value.data!)) {
          const param: DB_TIMELINE_QUERY_INFO = value.data! as DB_TIMELINE_QUERY_INFO // 강제로 바꿔서 수행하게 한다.
          const re = kapedb.syncSelectContentTimelineTable(param)
          parentPort?.postMessage({ state: '_000', data: re })
        } else {
          parentPort?.postMessage({ state: 'D003', data: [] })
        }
      } else {
        parentPort?.postMessage({ state: 'D003', data: [] })
      }
    } else if (value.type === '_QUERY_ONETIME_TIMELINE_TBL') {
      // front에서 한번 요청을 하면, 전체 조회를 한 후,
      // 일정 개수만큰 응답을 주어서 모두 전달하는 방식
      const re = kapedb.setDBConnectSync(value.dbPath) // thread db connect
      if (re === 1) {
        if (!Array.isArray(value.data!)) {
          const param: DB_TIMELINE_QUERY_INFO = value.data! as DB_TIMELINE_QUERY_INFO // 강제로 바꿔서 수행하게 한다.

          // 요청하는 페이지 사이즈가 500이하이면, 500으로 설정하게 한다
          if (param._pageSize === undefined || param._pageSize < 500) param._pageSize = 500 // 조건이 않맞으면 defult로 500 설정(20240108:타임라인은 무조건 500개씩 보이게 하기 때문)

          // 20231205 추가 예외 처리 : 너무 많은 페이지로 요청할 경우, 메로리 부족으로 Node가 GC에러로 죽음
          if (param._pageSize > _CreateDBpageSize) param._pageSize = _CreateDBpageSize

          const setPageSize = param._pageSize

          const re_total_cnt = kapedb.syncSelectCountTimelineTable(param) // 33000 //

          let totalLoop = 0
          if (re_total_cnt === 0) {
            parentPort?.postMessage({ state: '_000', data: [] })
          } else {
            totalLoop = Math.floor(re_total_cnt / setPageSize) // 소수점이하 버린다
            if (re_total_cnt % setPageSize) totalLoop++

            let offsetValue = 0
            for (let idx = 0; idx < totalLoop; idx++) {
              // 조건에서 offset정보를 계속 변경하여 Query수행함
              param._offset = offsetValue
              // 하나의 레코드의 길이 정보를 적게 하여 올리는 것
              //const re = kapedb.syncSelectContentTimelineTableShortType(param) //[{ 1: 1 }] // 12.04 syncSelectContentTimelineTable ==> syncSelectContentTimelineTableShortType
              const re = kapedb.syncSelectContentTimelineTable(param) // 12/05 2번 요구사항 : 타임라인차트에서 클릭하면, 타임라인그리드에서 보여야 한다.
              console.log(param) //// for debug
              if (idx === totalLoop - 1) {
                parentPort?.postMessage({ state: `_000_${idx + 1}_${totalLoop}`, data: re })
              } else {
                parentPort?.postMessage({ state: `W001_${idx + 1}_${totalLoop}`, data: re })
              }

              // 쿼리의 offset은 설정된 pagesize만큰 증가하게 한다.
              offsetValue = offsetValue + param._pageSize
            }
          }
        } else {
          parentPort?.postMessage({ state: 'D003', data: [] })
        }
      } else {
        parentPort?.postMessage({ state: 'D003', data: [] })
      }
    } else if (value.type === '_QUERY_CNT_TIMELINE_TBL') {
      const re = kapedb.setDBConnectSync(value.dbPath) // thread db connect
      if (re === 1) {
        if (!Array.isArray(value.data!)) {
          const param: DB_TIMELINE_QUERY_INFO = value.data! as DB_TIMELINE_QUERY_INFO // 강제로 바꿔서 수행하게 한다.
          const re = kapedb.syncSelectCountTimelineTable(param)
          parentPort?.postMessage({ state: '_000', data: re }) // re ==> { total_cnt: 개수정보 }
        } else {
          parentPort?.postMessage({ state: 'D003', data: { total_cnt: -1 } })
        }
      } else {
        parentPort?.postMessage({ state: 'D003', data: { total_cnt: -1 } })
      }
    } else if (value.type === '_MAKE_SELECTED_IMAGE') {
      const re = kapedb.setDBConnectSync(value.dbPath) // thread db connect
      if (re === 1) {
        if (value.data !== null && typeof value.data === 'object' && !Array.isArray(value.data!)) {
          const input: DB_COPY_CMD = value.data! as DB_COPY_CMD
          kapedb.makeSelectImageDBListener(input, (_status) => {
            parentPort?.postMessage(_status) // 진행 상태 정보를 콜백 함수를 통해 전달
          })
        } else {
          parentPort?.postMessage({ state: 'T002', percent: -1 })
        }
      } else {
        parentPort?.postMessage({ state: 'D003', percent: -1 })
      }
    } else if (value.type === '_MAKE_PRINT_TABLE') {
      const re = kapedb.setDBConnectSync(value.dbPath) // thread db connect
      if (re === 1) {
        if (value.data !== null && typeof value.data === 'object' && !Array.isArray(value.data!)) {
          const input: TABLE_PRT_CMD = value.data! as TABLE_PRT_CMD
          kapedb.makePrintDBTable(input, (_status) => {
            parentPort?.postMessage(_status) // 진행 상태 정보를 콜백 함수를 통해 전달
          })
        } else {
          parentPort?.postMessage({ state: 'P001', percent: -1 })
        }
      } else {
        parentPort?.postMessage({ state: 'D003', data: [] })
      }
    } else {
      parentPort?.postMessage({ state: '_999', percent: -2 })
    }
  } catch (err) {
    console.error(err)
    parentPort?.postMessage({ state: 'D003', data: [] })
  }

  //parentPort?.close()
  //console.log('in child: on ###') // 해당 로그는 생성이 안된다. 바로 프로세스가 죽기 때문에
  process.exit()
})
