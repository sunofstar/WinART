import { _SEARCH_OPTION } from '../../shared/models'
import { KAPE_OP_CHANNELS } from '../../shared/constants'

/**
 * 검색 기능
 *
 */
const getSearchTotalTable = async (param: _SEARCH_OPTION, path: string): Promise<boolean> => {
  if (path === '' || path === undefined) return false

  try {
    const searchParam: _SEARCH_OPTION = {
      type: '_S_WORD',
      fullSearch: true,
      tableSearch: '',
      keyString: '',
      orFlag: false,
      s_time: '',
      e_time: '',
      _b_id: undefined
    }

    Object.assign(searchParam, param)

    console.log('KAPE_OP_CHANNELS.searchTotalTable', searchParam)
    window.ipcRenderer.send(KAPE_OP_CHANNELS.searchTotalTable, { dbPath: path, dbQueryOption: searchParam })

    return true
  } catch (error) {
    console.log('전체 검색 조회 실패 :', error)
    return false
  }
}

export default {
  getSearchTotalTable
}
