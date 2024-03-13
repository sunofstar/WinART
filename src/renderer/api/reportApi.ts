import { Report1Send, Report2Send, AddCSVFileInfo } from '@share/models'
import { REPORT_CHANNELS } from '@share/constants'

/**
 * 현장 조사 확인서
 *
 * @param reportInfo 레포트 정보
 * @returns 성공/실패
 */
const reportMake1 = (reportInfo: Report1Send): Promise<boolean> => {
  return window.ipcRenderer.invoke(REPORT_CHANNELS.make_report1, reportInfo)
}

/**
 * 참관 확인서
 *
 * @param reportInfo 레포트 정보
 * @returns 성공/실패
 */
const reportMake2 = async (reportInfo: Report2Send): Promise<boolean> => {
  return window.ipcRenderer.invoke(REPORT_CHANNELS.make_report2, reportInfo)
}
/**
 * 전자 정보 문서에 파일 정보 추가
 * @param addCSVFileinfo
 * @returns 성공/실패
 */
const addCSVFileInfo = async (addCSVFileinfo: AddCSVFileInfo): Promise<boolean> => {
  return window.ipcRenderer.invoke(REPORT_CHANNELS.addCSVFileInfo, addCSVFileinfo)
}

export default {
  reportMake1,
  reportMake2,
  addCSVFileInfo
}
