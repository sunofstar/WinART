import utils from '../service/utils'
import { AcquisitionType, HashVal } from '@share/models'
import cp from 'child_process'
import path from 'path'
import fs from 'fs'
import crypto from 'crypto'
import logger from '../logger'

import { Report1Send, Report2Send } from '../../shared/models'
import puppeteer from 'puppeteer'
import { BrowserWindow, app } from 'electron'
async function startBrowser() {
  const browser = await puppeteer.launch()
  const page = await browser.newPage()
  return { browser, page }
}

async function closeBrowser(browser: any) {
  return browser.close()
}

async function html2_pdf(htmlfile: string, pdffile: string) {
  const { browser, page } = await startBrowser()
  await page.goto(`file://${htmlfile}`)
  await page.emulateMediaType('screen')
  await page.pdf({ path: pdffile })
  await closeBrowser(browser)
}

/**
 * htmt 문서를 pdf 문서 변환
 * @param htmlfile html 문서 경로
 * @param pdffile pdf 문서 경로
 */
function printPDF(htmlfile: string, pdffile: string) {
  logger.info(htmlfile, pdffile)

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
            logger.error(error)
            window_to_PDF.close()
            throw error
          }
          console.log('Write PDF successfully.')
        })
        window_to_PDF.close()
      })
      .catch((error: any) => {
        logger.error(error)
        // window_to_PDF.close()
        throw error
      })
  })
}

/**
 * 획득 이미지 풀기 추상 클레스
 */
export abstract class evidenceImage {
  protected _programPath?: string
  protected _stop?: boolean
  protected _cpProc?: cp.ChildProcessWithoutNullStreams
  protected _totFileCount: number = 0
  protected _imagePath?: string
  protected _callback?: (
    state: 'start' | 'totalcount' | 'error' | 'extract' | 'add' | 'end' | 'cancel',
    percent: number,
    filepath?: string | undefined
  ) => void | undefined

  constructor(imagePath: string) {
    const dirPath = path.dirname(imagePath)
    if (!utils.isDirectory(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true })
    }
    this._imagePath = imagePath
    this._programPath = ''
    this._stop = false
  }
  /**
   * 특정 디렉토리에 deph, aff4 이미지 풀기
   * @param targetPath 풀 위치
   * @param callback 진행 상테 정보
   */

  abstract export(
    targetPath: string,
    callback: (
      state: 'start' | 'totalcount' | 'error' | 'extract' | 'add' | 'end' | 'cancel',
      percent: number,
      filepath?: string | undefined
    ) => void
  ): void
  /**
   * 선별 이미지 생성
   * @param targetPath 선별 이미지 생성 위치
   * @param callback 선별 이미지 생성 상태
   */
  abstract create(
    sourcePath: string,
    callback: (
      state: 'start' | 'totalcount' | 'error' | 'extract' | 'add' | 'end' | 'cancel',
      percent: number,
      filepath?: string | undefined
    ) => void
  ): void
  /**
   * 풀기, 생성 중지
   */
  public stop() {
    this._cpProc?.kill()
    if (this._callback) this._callback('cancel', 0)
  }
  /**
   * deph4, aff4 이미지 확인
   */
  abstract isImage(): boolean
  /**
   * 이미지 타입 확인
   * @param casepath 이미지 path(case 파일 위치)
   * @returns 이미지 타입 정보
   */
  public static acquisitionType(casepath: string): AcquisitionType {
    const rootdir = path.dirname(casepath)
    const kapedir = path.join(rootdir, 'triage', 'kape')
    let imageType: 'deph' | 'aff4' | 'none' = 'none'
    let isDir = false

    if (utils.isDirectory(kapedir)) {
      isDir = true
    }
    if (utils.isFile(utils.changeFileExt(casepath, '.aff4'))) {
      imageType = 'aff4'
    } else if (utils.isFile(utils.changeFileExt(casepath, '.deph'))) {
      imageType = 'deph'
    }
    return { isFolder: isDir, isImage: imageType }
  }
}

/**
 * 파일 해시값 반환 (async)
 *
 * @param filePath 파일 경로
 * @returns 해시값
 */

export async function getFileHash(
  filePath: string,
  callback: (state: 'data' | 'end' | 'error', percent: number, hashObj?: HashVal) => void | undefined
) {
  new Promise<void>(() => {
    const hashObj: HashVal = {
      md5: '',
      sha1: ''
      //sha256: ''
    }
    let oldPercent: number = 0
    const md5Hash = crypto.createHash('md5')
    const sha1Hash = crypto.createHash('sha1')
    //const sha256Hash = crypto.createHash('sha256')
    if (!utils.isFile(filePath)) {
      callback!('error', 404)
      return
    }

    const filestat = fs.statSync(filePath)
    if (filestat.size === 0) {
      callback!('error', 1)
      return
    }
    let totRead = 0
    try {
      fs.createReadStream(filePath)
        .on('data', (chunk) => {
          md5Hash.update(chunk)
          sha1Hash.update(chunk)
          totRead += chunk.length
          const newPercent = Math.floor((totRead / filestat.size) * 100)
          if (oldPercent !== newPercent) {
            callback!('data', newPercent)
            oldPercent = newPercent
          }
        })
        .on('end', () => {
          hashObj.md5 = md5Hash.digest('hex')
          hashObj.sha1 = sha1Hash.digest('hex')
          callback!('end', 100, hashObj)
          // hashObj.sha256 = sha256Hash.digest('hex')
        })
        .on('error', (err) => {
          logger.error(err)
          callback!('error', 0)
        })
    } catch (err: any) {
      logger.error(err)
      callback!('error', 0)
    }
  })
}

/**
 * 현장 조사 확인서
 * @param reportInfo 확인서 내용
 * @returns 성공/ 실패
 */
export const makeReport1 = async (reportInfo: Report1Send): Promise<boolean> => {
  const dirPath = path.dirname(reportInfo.caseFilePath)
  if (!utils.isDirectory(dirPath)) fs.mkdirSync(dirPath, { recursive: true })
  const htmlfile = utils.changeFileExt(reportInfo.caseFilePath, '.html')
  const pdffile = utils.changeFileExt(reportInfo.caseFilePath, '.pdf')
  try {
    let temphtml: string = String(
      fs.readFileSync(path.join(app.getAppPath(), 'resources', 'report', '현장조사확인서.html'))
    )
    temphtml = temphtml.replace('<!--caseName-->', reportInfo.caseName)
    temphtml = temphtml.replace('<!--imgNum-->', reportInfo.imgNum)
    temphtml = temphtml.replace('<!--confiscatedPlace-->', reportInfo.confiscatedPlace)
    temphtml = temphtml.replace('<!--confiscatedName-->', `${reportInfo.confiscatedName}`)
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
  const dirPath = path.dirname(reportInfo.caseFilePath)
  if (!utils.isDirectory(dirPath)) fs.mkdirSync(dirPath, { recursive: true })
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
    return false
  }
  return true
}
