import { Report1Send, Report2Send, AddCSVFileInfo } from '../../shared/models'
import { REPORT_CHANNELS } from '../../shared/constants'
import { ipcMain } from 'electron'
import reportService from '../service/reportSevice'
export default function init() {
  /**
   * 현자 장소 확인서
   * @returns 성공/실패
   */
  ipcMain.handle(REPORT_CHANNELS.make_report1, async (_: any, reportinfo: Report1Send): Promise<boolean> => {
    // 1. 폴더 생성
    console.log('make_report1', reportinfo)
    return reportService.makeReport1(reportinfo)
  })
  /**
   * 참관 여부 확인서
   *
   * @returns 성공/실패
   */
  // ipcMain.handle(REPORT_CHANNELS.make_report2, async (_: any, reportinfo: Report2Send): Promise<boolean> => {
  //   console.log('make_report1', reportinfo)
  //   return reportService.makeReport2(reportinfo)
  // })
  /**
   * 전자 정보 문서 파일 정보 추거
   *
   * @returns 성공/실패
   */
  ipcMain.handle(REPORT_CHANNELS.addCSVFileInfo, async (_: any, addCSVFileInfo: AddCSVFileInfo): Promise<boolean> => {
    return reportService.addCSVFileInfo(addCSVFileInfo)
  })
}
