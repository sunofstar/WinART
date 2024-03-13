import { CaseInfo } from '../../shared/models'
import { CASE_CHANNELS } from '../../shared/constants'

/**
 * 케이스 생성 (폴더 및 데이터베이스 생성)
 *
 * @returns 데이터베이스 이름
 */
export const create = async (caseInfo: CaseInfo): Promise<string> => {
  return window.ipcRenderer.invoke(CASE_CHANNELS.create, caseInfo)
}

export default {
  create
}
