import { KAPE_OP_CHANNELS } from '@share/constants'
import type {
  DB_BOOKMARK_OPR,
  DB_BOOKMARK_INFO_ITEM,
  _DB_BOOKMARK_CMD_TYPE,
  DB_BOOKMARK_INFO,
  DB_BOOKMARK_MAPPER_INFO,
  _DB_BOOKMARK_MAPPER_CMD_TYPE,
  DB_THREAD_QUERY_CMD
} from '@/share/models'
import { _DB_BOOKMARK_MAPPER_CMD_TYPE } from '../../shared/models'

/**
 * @description 북마크 정보 가져오기
 */
const getBookmarkCategoryList = async (b_id: number): Promise<[]> => {
  if (ipcRenderer === undefined) {
    return false
  } else {
    try {
      // B_Id : 0은 북마크 그룹이 존재하지 않을 때 정의
      if (!Number.isNaN(b_id) && b_id > 0) {
        const result = await ipcRenderer.invoke(KAPE_OP_CHANNELS.bookMarkMapperCategory, b_id)
        return result
      } else {
        throw new TypeError('북마크 ID 형식이 잘못되었습니다.')
      }
    } catch (error) {
      console.log('북마크 정보 조회 실패 :', error)
      return false
    }
  }
}

/**
 * @description 북마크 그룹 목록 정보 가져오기
 */
const getBookmarkGroupList = async (): Promise<[]> => {
  if (ipcRenderer === undefined) {
    return false
  } else {
    try {
      const param: DB_BOOKMARK_OPR = {
        op: 'REF',
        data: []
      }

      const result = await ipcRenderer.invoke(KAPE_OP_CHANNELS.bookMarkTable, param)
      if (result?.state === '_000') {
        console.log('북마크 그룹 :', result.data)
        return result.data
      } else {
        console.log('북마크 그룹 불러오기 실패 :', result)
        return []
      }
    } catch (error) {
      console.log('북마크 그룹 실패 :', error)
    }
  }
}

/**
 * @description 북마크 그룹 수정
 */
const modifyBookmarkInfo = async (
  item: DB_BOOKMARK_INFO_ITEM,
  operatorCode: _DB_BOOKMARK_CMD_TYPE
): Promise<boolean> => {
  if (ipcRenderer === undefined) {
    return false
  } else {
    try {
      const operator: _DB_BOOKMARK_CMD_TYPE = operatorCode !== '' ? operatorCode : 'ADD' // 추가 : ADD, 삭제 : DEL, 수정 : MOD

      const bookmarkItem: DB_BOOKMARK_INFO = {
        _name: item.b_name !== undefined ? item.b_name : '',
        _colorInfo: item.b_color !== undefined ? item.b_color : '',
        _id: item.b_id !== undefined ? item.b_id : ''
      }
      const param: DB_BOOKMARK_OPR = {
        op: operator,
        data: [bookmarkItem]
      }
      const result = await ipcRenderer.invoke(KAPE_OP_CHANNELS.bookMarkTable, param)
      if (result?.state === '_000') {
        return true
      } else {
        throw new Error('북마크 수정 실패')
        return false
      }
    } catch (error) {
      console.log('북마크 수정 실패 :', error)
    }
  }
}

/**
 * @description 북마크 추가
 */
const addBookmarkOneItem = async (items: DB_BOOKMARK_MAPPER_INFO[], path: string, op: typeOfOP): Promise<boolean> => {
  if (ipcRenderer === undefined) {
    return false
  } else {
    try {
      const operator: _DB_BOOKMARK_MAPPER_CMD_TYPE = op !== '' ? op : 'ADD' // 추가 : ADD, 삭제 : DEL

      if (Array.isArray(items)) {
        const param: DB_THREAD_QUERY_CMD = {
          dbPath: path !== '' ? path : '',
          oprType: operator,
          rootPath: '',
          dbBookMarkMapperInfo: items
        }

        const result = await ipcRenderer.invoke(KAPE_OP_CHANNELS.bookMarkMapperTableOneRow, param)
        if (result === '_000') {
          return true
        } else {
          throw new Error('북마크 추가 실패')
        }
      } else {
        throw new TypeError('북마크에 추가할 데이터가 존재하지 않습니다.')
      }
    } catch (error) {
      console.log('북마크 추가 실패 :', error)
    }
  }
  return false
}


/**
 * @description 개별 북마크 will_delete 상태 변경
 */
const willAddBookmarkOneItem = async (items: DB_BOOKMARK_MAPPER_INFO[], path: string, op: typeOfOP): Promise<boolean> => {
  if (ipcRenderer === undefined) {
    return false
  } else {
    try {
      const operator: _DB_BOOKMARK_MAPPER_CMD_TYPE = op !== '' ? op : 'ADD' // 추가 : ADD, 삭제 : DEL

      if (Array.isArray(items)) {
        const param: DB_THREAD_QUERY_CMD = {
          dbPath: path !== '' ? path : '',
          oprType: operator,
          rootPath: '',
          dbBookMarkMapperInfo: items
        }

        const result = await ipcRenderer.invoke(KAPE_OP_CHANNELS.bookMarkMapperChangeTableOneRow , param)
        if (result === '_000') {
          return true
        } else {
          throw new Error('북마크 추가 실패')
        }
      } else {
        throw new TypeError('북마크에 추가할 데이터가 존재하지 않습니다.')
      }
    } catch (error) {
      console.log('북마크 추가 실패 :', error)
    }
  }
  return false
}

/**
 * @description 북마크 추가
 */
const addBookmarkItem = async (items: DB_BOOKMARK_MAPPER_INFO[], path: string, op: typeOfOP): Promise<boolean> => {
  if (ipcRenderer === undefined) {
    return false
  } else {
    try {
      const operator: _DB_BOOKMARK_MAPPER_CMD_TYPE = op !== '' ? op : 'ADD' // 추가 : ADD, 삭제 : DEL

      if (Array.isArray(items)) {
        const param: DB_THREAD_QUERY_CMD = {
          dbPath: path !== '' ? path : '',
          oprType: operator,
          rootPath: '',
          dbBookMarkMapperInfo: items
        }

        ipcRenderer.send(KAPE_OP_CHANNELS.bookMarkMapperTable, param)
      } else {
        throw new TypeError('북마크에 추가할 데이터가 존재하지 않습니다.')
      }
    } catch (error) {
      console.log('북마크 추가 실패 :', error)
    }
  }
}

/**
 * @description 북마크 별 데이터 조회
 */
const getRowDataByBookmarkGroup = async (items: DB_BOOKMARK_MAPPER_INFO[], path: string): Promise<boolean> => {
  if (ipcRenderer === undefined) {
    return false
  } else {
    try {
      if (Array.isArray(items)) {
        const param: DB_THREAD_QUERY_CMD = {
          dbPath: path !== '' ? path : '',
          oprType: 'REF',
          rootPath: '',
          dbBookMarkMapperInfo: items
        }

        ipcRenderer.send(KAPE_OP_CHANNELS.bookMarkMapperTable, param)
      } else {
        throw new TypeError('북마크 별 데이터가 존재하지 않습니다.')
      }
    } catch (error) {
      console.log('북마크 별 데이터 조회 실패 :', error)
    }
  }
}

export default {
  getBookmarkCategoryList,
  getBookmarkGroupList,
  modifyBookmarkInfo,
  addBookmarkItem,
  addBookmarkOneItem,
  willAddBookmarkOneItem,
  getRowDataByBookmarkGroup
}
