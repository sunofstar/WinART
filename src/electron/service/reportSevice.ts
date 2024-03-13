import { Report1Send, Report2Send, AddCSVFileInfo } from '../../shared/models'
import utils from './utils'
import puppeteer from 'puppeteer'
import fs from 'fs'
import path from 'path'
import { BrowserWindow, app } from 'electron'
// import logger from '@electron/logger'
async function startBrowser() {
  const browser = await puppeteer.launch()
  const page = await browser.newPage()
  return { browser, page }
}

async function closeBrowser(browser: any) {
  return browser.close()
}

/**
 * htmt 문서를 pdf 문서 변환
 * @param htmlfile html 문서 경로
 * @param pdffile pdf 문서 경로
 */
function printPDF(htmlfile: string, pdffile: string) {
  const window_to_PDF = new BrowserWindow({ show: false })
  window_to_PDF.loadURL(htmlfile) //give the file link you want to display

  window_to_PDF.webContents.on('did-finish-load', () => {
    window_to_PDF.webContents
      .printToPDF({
        landscape: false,
        pageSize: 'A4',
        margins: { marginType: 'default' },
        printBackground: false,
        preferCSSPageSize: true
      })
      .then((value: Buffer) => {
        fs.writeFile(pdffile, value, (error) => {
          if (error) {
            window_to_PDF.close()
            throw error
          }
          console.log('Write PDF successfully.')
        })
        window_to_PDF.close()
      })
      .catch((error: any) => {
        window_to_PDF.close()
        throw error
      })
  })
}
/**
 * 현장 조사 확인서
 * @param reportInfo 확인서 내용
 * @returns 성공/ 실패
 */
export const makeReport1 = async (reportInfo: Report1Send): Promise<boolean> => {
  const htmlfile = utils.changeFileExt(reportInfo.caseFilePath, '.html')
  const pdffile = utils.changeFileExt(reportInfo.caseFilePath, '.pdf')
  try {
    let temphtml: string = String(
      fs.readFileSync(path.join(app.getAppPath(), 'resources', 'report', '현장조사확인서.html'))
    )
    temphtml = temphtml.replace('<!--caseName-->', reportInfo.caseName)
    temphtml = temphtml.replace('<!--imgNum-->', reportInfo.imgNum)
    temphtml = temphtml.replace('<!--confiscatedPlace-->', reportInfo.confiscatedPlace)
    temphtml = temphtml.replace(
      '<!--confiscatedName-->',
      `${reportInfo.confiscatedName}(${reportInfo.confiscatedType})`
    )
    temphtml = temphtml.replace('<!--analystName-->', reportInfo.analystName)
    temphtml = temphtml.replace('<!--realDatetime-->', reportInfo.realDatetime)
    temphtml = temphtml.replace('<!--kSTTime-->', reportInfo.kSTTime)
    temphtml = temphtml.replace('<!--imageFileCreationDate-->', reportInfo.imageFileCreationDate)
    temphtml = temphtml.replace('<!--caseImgName-->', reportInfo.caseImgName)
    temphtml = temphtml.replace('<!--imageFileHashSha1-->', reportInfo.imageFileHashSha1)
    temphtml = temphtml.replace('<!--imageFileHashMd5-->', reportInfo.imageFileHashMd5)
    fs.writeFileSync(htmlfile, temphtml)
    await printPDF(htmlfile, pdffile)
  } catch (err: any) {
    // logger.error(err)
    return false
  }
  return true
}
/**
 * 전자정보의 관련성에 관한 의견진술서
 * @param reportInfo 확인서 내용
 * @returns 성공/ 실패
 */
export const makeReport2 = async (reportInfo: Report2Send): Promise<boolean> => {
  const htmlfile = utils.changeFileExt(reportInfo.caseFilePath, '.html')
  const pdffile = utils.changeFileExt(reportInfo.caseFilePath, '.pdf')
  try {
    let temphtml: string = String(
      fs.readFileSync(path.join(app.getAppPath(), 'resources', 'report', '전자정보의 관련성에 관한 의견진술서.html'))
    )
    temphtml = temphtml.replace('<!--caseImgName-->', reportInfo.caseImgName)
    temphtml = temphtml.replace('<!--confiscatedName-->', reportInfo.confiscatedName)
    temphtml = temphtml.replace('<!--confiscatedNumber-->', reportInfo.confiscatedNumber)

    fs.writeFileSync(htmlfile, temphtml)
    await printPDF(htmlfile, pdffile)
  } catch (err: any) {
    // logger.error(err)
    return false
  }
  return true
}

export const addCSVFileInfo = async (addCSVFileinfo: AddCSVFileInfo): Promise<boolean> => {
  if (!utils.isFile(addCSVFileinfo.csvFilePath)) {
    return false
  }

  const wfs = fs.openSync(addCSVFileinfo.csvFilePath, 'rw')
  fs.appendFileSync(wfs, '\n', 'utf8')
  fs.appendFileSync(wfs, addCSVFileinfo.fileInfo, 'utf8')

  return true
}
export default {
  makeReport1,
  makeReport2,
  addCSVFileInfo
}
