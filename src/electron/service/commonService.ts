import logger from '../logger'
import { AnalysisLog, CopyFile, ErrorLog, ERROR_STATUS_LIST, HashVal, SettingInfo } from '../../shared/models'
import crypto from 'crypto'
import dayjs from 'dayjs'
import diskusage from 'diskusage-ng'
import { app } from 'electron'
import filenamify from 'filenamify'
import fs, { Stats } from 'fs'
import { glob } from 'glob'
import _ from 'lodash'
import path from 'path'
import utils from './utils'
import systemInterfaceService from './systemInterfaceService'

// EFA 로그 폴더 경로
const EFA_LOG_PATH = path.join(app.getPath('userData'), '/efalogs')

/**
 * 분할압축파일의 전체 사이즈 반환
 *
 * @param filePath 파일경로
 * @returns 사이즈 (bytes)
 */
const getSplitZipFileSize = (filePath: string): number => {
  let size = 0

  try {
    const posixPath = filePath.replace(/\\/g, '/')
    // 파일 타입별 검색 패턴
    let pattern = ''
    if (path.extname(filePath).toLocaleLowerCase().substring(1) == 'rar') {
      // 패턴 : fileName.part*.rar
      const baseName = path.basename(filePath).substring(0, path.basename(filePath).indexOf('.part'))
      pattern =
        path.dirname(filePath).replace(/\\/g, '/') + path.posix.sep + baseName + '.part*' + path.extname(filePath)
    } else {
      // 패턴 : fileName.z*, fileName.0*
      pattern = posixPath.substring(0, posixPath.length - 2) + '*'
    }
    // 기본파일 제외 파일 목록 검색
    const files = glob.sync(pattern, { dot: true, nodir: true })

    // 전체 파일사이즈 계산 (검색파일 사이즈를 기본값으로 세팅)
    size = files.reduce((acc, item) => {
      acc += fs.statSync(item).size
      return acc
    }, 0)
  } catch (err) {
    logger.error(err)
  }

  return size
}

/**
 * 폴더 사이즈 반환
 *
 * @param folderPath 폴더경로
 * @returns 사이즈 (bytes)
 */
const getFolderSize = (folderPath: string): number => {
  let total = 0
  try {
    const files = glob.sync(folderPath.replace(/\\/g, '/') + '/**/*', { dot: true, nodir: true })
    total = files.reduce((acc, filePath) => {
      const stat = fs.statSync(filePath)
      acc += stat.size
      return acc
    }, 0)
  } catch (err) {
    logger.error(err)
  }

  return total
}

/**
 * 파일에 해당되는 디스크의 사용가능 사이즈 반환
 *
 * @param filePath 파일경로
 * @returns 사이즈 (bytes)
 */
const getFreeSpace = async (filePath: string): Promise<number> => {
  return new Promise<number>((resolve: (val: number) => void, reject: (err: any) => void) => {
    diskusage(filePath, (err, usage) => {
      if (err) {
        reject(err)
      } else {
        resolve(usage.available)
      }
    })
  })
}

/**
 * 파일 해시값 반환 (async)
 *
 * @param filePath 파일 경로
 * @returns 해시값
 */
const getFileHash = async (filePath: string): Promise<HashVal> => {
  return new Promise<HashVal>((resolve: (val: HashVal) => void, reject: (err: any) => void) => {
    const hashObj: HashVal = {
      md5: '',
      sha1: ''
      //sha256: ''
    }
    const md5Hash = crypto.createHash('md5')
    const sha1Hash = crypto.createHash('sha1')
    //const sha256Hash = crypto.createHash('sha256')

    fs.createReadStream(filePath)
      .on('data', (chunk) => {
        md5Hash.update(chunk)
        sha1Hash.update(chunk)
        //sha256Hash.update(chunk)
      })
      .on('end', () => {
        hashObj.md5 = md5Hash.digest('hex')
        hashObj.sha1 = sha1Hash.digest('hex')
        //hashObj.sha256 = sha256Hash.digest('hex')

        resolve(hashObj)
      })
      .on('error', (err) => {
        reject(err)
      })
  })
}

/**
 * 파일 해시값 반환 (sync)
 *
 * @param filePath 파일경로
 * @returns 해시값
 */
const getFileHashSync = (filePath: string): HashVal => {
  const buffer = fs.readFileSync(filePath)
  const hashObj: HashVal = {
    md5: crypto.createHash('md5').update(buffer).digest('hex'),
    sha1: crypto.createHash('sha1').update(buffer).digest('hex')
    //sha256: crypto.createHash('sha256').update(buffer).digest('hex')
  }
  return hashObj
}

/**
 * 해시값 파일을 조회해서 해시값 정보 반환
 *
 * @param filePath 파일 경로
 * @returns 해시값
 */
const readHashFile = (filePath: string): HashVal => {
  let hashObj: HashVal = {
    md5: '',
    sha1: ''
    //sha256: ''
  }
  // 파일에 대한 해시값 파일 경로
  const hashFilePath = getHashFilePath(filePath)
  if (!fs.existsSync(hashFilePath)) {
    return hashObj
  }
  // 해시값 파일 조회
  const obj = JSON.parse(fs.readFileSync(hashFilePath, 'utf8'))
  hashObj = Object.assign(hashObj, obj)

  return hashObj
}

/**
 * 대상 파일에 대한 해시값 파일 생성
 *
 * @param filePath 파일 경로
 * @param hashObj 해시값
 */
const writeHashFile = (filePath: string, hashObj: HashVal): void => {
  // 파일에 대한 해시값 파일 경로
  const hashFilePath = getHashFilePath(filePath)
  fs.writeFileSync(hashFilePath, JSON.stringify(hashObj, null, 2), 'utf8')
}

/**
 * 파일 정보 반환
 *
 * @param filePath 파일경로
 * @returns 파일정보
 */
const getFileStats = (filePath: string): Stats | undefined => {
  if (!fs.existsSync(filePath)) {
    return undefined
  }

  return fs.statSync(filePath)
}

/**
 * 파일의 존재여부를 확인하여 중복되지 않는 파일이름을 반환
 *
 *
 * @param fileFolder 파일폴더
 * @param fileName 파일이름
 * @returns 파일경로
 */
const getNextFileName = (fileFolder: string, fileName: string) => {
  const name: string = path.basename(fileName, path.extname(fileName))
  const ext: string = path.extname(fileName)

  let idx = 1
  let currentFileName: string = fileName
  let nextFilePath: string = path.resolve(fileFolder, currentFileName)

  while (fs.existsSync(nextFilePath)) {
    currentFileName = `${name} (${idx})${ext}`
    nextFilePath = path.resolve(fileFolder, currentFileName)
    idx++
  }

  return nextFilePath
}

/**
 * 파일 목록 복사
 *
 * @param copyFiles 대상파일목록
 */
const copyFiles = async (files: CopyFile[]): Promise<void> => {
  files.forEach((copyFile) => {
    if (!fs.existsSync(copyFile.sourceFilePath)) {
      return
    }
    // 복사대상 파일명 확인/수정
    const targetFile = path.normalize(copyFile.targetFilePath)
    let fileName = path.basename(targetFile, path.extname(targetFile))
    fileName = filenamify(fileName.substring(0, 100), { replacement: '_', maxLength: 120 })
    const currentFile = getNextFileName(path.dirname(targetFile), `${fileName}${path.extname(targetFile)}`)

    fs.copyFileSync(copyFile.sourceFilePath, currentFile)
  })
}

/**
 * 오류내역에 해당되는 오류 상세정보 반환
 *
 * @param err 오류내역
 * @param caseName 케이스이름
 * @param sourceName 대상이름
 * @returns
 */
const getErrorLog = (err: string, caseName?: string, sourceName?: string): ErrorLog => {
  // TO-DO : 도구지원시스템 오류로그 전송 API 확정 시 맞춰서 수정
  const obj: ErrorLog = {
    code: 'A001',
    error: _.trim(err),
    caseName: caseName,
    sourceName: sourceName,
    comment: undefined,
    datetime: dayjs().format('YYYY.MM.DD HH:mm:ss')
  }
  if (!obj.error) {
    return obj
  }

  try {
    // 오류상태 조회
    const errStatus = ERROR_STATUS_LIST.find((item) => item.criterion && obj.error.includes(item.criterion))
    if (errStatus) {
      obj.code = errStatus.code
      obj.comment = errStatus.comment
    }
  } catch (err) {
    logger.error(err)
  }

  return obj
}

/**
 * 오류내역 전송
 * 1. 오류로그 파일 생성
 * 2. 온라인상태 시 오류로그 전송
 *
 * @param detail 오류상세정보
 */
const sendErrorLog = async (errDetail: ErrorLog): Promise<void> => {
  // 오류 내역
  const errObj: Pick<ErrorLog, 'code' | 'error' | 'datetime' | 'caseName' | 'sourceName'> = {
    code: errDetail.code,
    error: errDetail.error,
    datetime: errDetail.datetime,
    caseName: errDetail.caseName,
    sourceName: errDetail.sourceName
  }

  try {
    // 오류로그 파일생성
    const filePath = createLogFile('err')
    writeLogFile(filePath, errObj)
    if (global.shared.auth.status != 'online') {
      return
    }
    // TO-DO : 도구지원시스템 오류로그 전송 API 확정 시 맞춰서 수정
    // let response: AxiosResponse | undefined = undefined
    // response = await systemInterfaceService.uselog(errObj)
    // if (response?.status == 401) {
    //   // 토큰재발행 및 재전송
    //   const isRefreshed = await systemInterfaceService.refreshToken()
    //   if (isRefreshed) {
    //     response = await systemInterfaceService.uselog(errObj)
    //   }
    // }
    // if (response?.status == 200) {
    //   // 전송완료 시 파일삭제
    //   fs.unlinkSync(filePath)
    // }
  } catch (err) {
    logger.error(err)
  }
}

/**
 * 분석로그 전송
 * 1. 분석로그 파일 생성
 * 2. 온라인상태 시 분석로그 전송
 *
 * @param log 분석정보
 */
const sendAnalysisLog = async (log: AnalysisLog): Promise<void> => {
  // TO-DO : 도구지원시스템 분석결과 전송 API 확정 시 맞춰서 로그파일 수정
  try {
    // 오류로그 파일생성
    const filePath = createLogFile('analysis')
    writeLogFile(filePath, log)
    if (global.shared.auth.status != 'online') {
      return
    }
    // TO-DO : 도구지원시스템 분석결과 전송 API 확정 시 맞춰서 수정
    // let response: AxiosResponse | undefined = undefined
    // response = await systemInterfaceService.auditlog(analysisLog)
    // if (response && response.status == 401) {
    //   // 토큰재발행 및 재전송
    //   const isRefreshed = await systemInterfaceService.refreshToken()
    //   if (isRefreshed) {
    //     response = await systemInterfaceService.uselog(errObj)
    //   }
    // }
    // if (response?.status == 200) {
    //   // 전송완료 시 파일삭제
    //   fs.unlinkSync(filePath)
    // }
  } catch (err) {
    logger.error(err)
  }
}

/**
 * 로그파일에 내용을 저장
 *
 * @param filePath 파일경로
 * @param obj 로그내용
 */
function writeLogFile(filePath: string, obj: any): void {
  try {
    const txt = _.isObject(obj) ? JSON.stringify(obj, undefined, 2) : obj
    fs.writeFileSync(filePath, txt, 'utf8')
  } catch (err) {
    logger.error(err)
  }
}

/**
 * 보관기간에 따른 로그파일 삭제
 *
 */
const cleanLogFiles = (): void => {
  try {
    // 일반 로그 파일 삭제 (30일 기준)
    deleteLogFiles(path.join(app.getPath('userData'), '/logs'), 30)
    // EFA 전송로그 파일 삭제 (7일 기준)
    deleteLogFiles(EFA_LOG_PATH, 7)
  } catch (err) {
    logger.error(err)
  }
}

/**
 * 온라인 상태 시 전송이 되지 않은 로그파일을 도구지원시스템으로 전송
 *
 */
const sendAllLog = async (): Promise<void> => {
  if (global.shared.auth.status != 'online') {
    return
  }

  // 오류로그 파일
  const errFiles = glob.sync(EFA_LOG_PATH.replace(/\\/g, '/') + '/err_*.log', { dot: false, nodir: true })
  for await (const file of errFiles) {
    // TO-DO : 도구지원시스템 오류로그 전송 API 확정 시 맞춰서 수정
    const txt = fs.readFileSync(file, { encoding: 'utf-8' })
    const response = await systemInterfaceService.uselog(txt)
    if (response?.status == 200) {
      fs.unlinkSync(file)
    }
  }

  // 분석로그 파일
  const logFiles = glob.sync(EFA_LOG_PATH.replace(/\\/g, '/') + '/analysis_*.log', { dot: false, nodir: true })
  for await (const file of logFiles) {
    // TO-DO : 도구지원시스템 분석결과 전송 API 확정 시 맞춰서 수정
    const txt = fs.readFileSync(file, { encoding: 'utf-8' })
    const response = await systemInterfaceService.auditlog(txt)
    if (response?.status == 200) {
      fs.unlinkSync(file)
    }
  }
}

/**
 * 보관날짜를 지난 로그파일을 삭제
 *
 * @param folderPath 폴더경로
 * @param days 일수
 */
function deleteLogFiles(folderPath: string, days: number): void {
  const files = glob.sync(folderPath.replace(/\\/g, '/') + '/*.log', { dot: false, nodir: true })
  if (!files || !files.length) {
    return
  }
  files.forEach((file) => {
    try {
      const stat = fs.statSync(file)
      if (dayjs().diff(dayjs(stat.ctimeMs), 'days') > days) {
        fs.unlinkSync(file)
      }
    } catch (err) {
      //
    }
  })
}

/**
 * 빈 로그파일 생성
 *
 * @param prefix 파일접두사
 * @returns 파일경로
 */
function createLogFile(prefix: string): string {
  if (!fs.existsSync(EFA_LOG_PATH)) {
    fs.mkdirSync(EFA_LOG_PATH, { recursive: true })
  }
  return path.join(EFA_LOG_PATH, `${prefix}_${new Date().getTime()}.log`)
}

/**
 * 파일에 대한 해시값 파일 경로 반환
 *
 * @param filePath 파일경로
 * @returns 해시값 파일 경로
 */
function getHashFilePath(filePath: string): string {
  const pathObj = path.parse(filePath)
  return path.join(pathObj.dir, pathObj.name + '_hash.txt')
}
/**
 * 파일에서 Text 읽어 온다.
 *
 * @param filePath 파일 경로
 * @returns 해시값
 */
const readFileText = (filePath: string): string => {
  if (utils.isFile(filePath)) {
    return String(fs.readFileSync(filePath))
  }
  return ''
}

/**
 * 대상 파일에 대한 text 파일 생성
 *
 * @param filePath 파일 경로
 * @param hashObj 해시값
 */
const writeFileText = (filePath: string, text: string): boolean => {
  // 파일에 대한 해시값 파일 경로
  try {
    const dirpath = path.dirname(filePath)
    if (!utils.isDirectory(dirpath)) {
      fs.mkdirSync(dirpath, { recursive: true })
    }
    fs.writeFileSync(filePath, text, 'utf8')
  } catch (err: any) {
    return false
  }
  return true
}

/**
 * 기본적인 설정 정보 저장
 * @param setinfo 기본 정보 인터페이스
 * @returns 성공여부
 */
function setSetting(setinfo: SettingInfo): boolean {
  const settingPath = path.join(app.getAppPath(), 'setting.json')
  try {
    fs.writeFileSync(settingPath, JSON.stringify(setinfo, null, 2))
  } catch (err: any) {
    logger.error(err)
    return false
  }
  return true
}
/**
 * 기본 정보 가지고 온다
 * @returns 설정 정보
 */
function getSetting(): SettingInfo {
  const settingPath = path.join(app.getAppPath(), 'setting.json')
  let settingInfo: SettingInfo = {
    saveID: '',
    isSaveID: false,
    defaultPath: app.getPath('userData'),
    theme: 'black'
  }
  if (utils.isFile(settingPath)) {
    settingInfo = JSON.parse(String(fs.readFileSync(settingPath)))
  }
  return settingInfo
}

/**
 * 로그를 기록하는 함수
 * 로그 폴더는 실행함수의 밑에 생성이됨
 * 로그 파일명은 WinARTLog.log
 * 파일 유지는 Queue형태로 진행 Old삭제하고, 현재를 Old로 변경, 그래고 현재를 새로 생성
 * 유지하는 로그 크기는 5M * 2 (2개의 파일만 유지한다)
 */
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024 // 5MB
async function writeLogText(logMessage: string) {
  const timestamp = new Date().toISOString()
  const logData = `${timestamp}: ${logMessage}\n`

  // 실행파일 밑에 로그 폴더를 만드는 것이 중요함
  // import {app} from electron
  const appFolder = app.getAppPath()
  //const appFolder = path.dirname(process.argv[0])
  // ### 실행폴더 밑 Log 폴더 생성
  // ### WinART 로그 파일 이름 정의
  // ### WinART old 로그 파일 이름 정의
  const appLogFolder = path.join(appFolder, 'Log')
  const appLogFile = path.join(appLogFolder, 'WinARTLog.log')
  const appOldLogFile = path.join(appLogFolder, 'WinARTLogOld.log')

  try {
    // 로그를 생성하기 위한 폴더가 없으면 만들도록 한다
    if (!fs.existsSync(appLogFolder)) {
      // 폴더가 존재하지 않으면 생성한다.
      fs.mkdirSync(appLogFolder, { recursive: true })
    }

    try {
      // 파일 존재 여부 확인
      await fs.promises.access(appLogFile, fs.constants.F_OK)

      // 현재 위치라면, 파일이 존재하는 것
      const stats = await fs.promises.stat(appLogFile)
      const fileSizeInBytes = stats.size

      // 기존 로그 파일이 5M를 넘으면 다른 파일로 변경하게 한다.
      if (fileSizeInBytes > MAX_FILE_SIZE_BYTES) {
        try {
          // 기존의 Old파일이 존재하게 하면 삭제를 수행하고 rename을 수행하게 한다.
          await fs.promises.access(appOldLogFile, fs.constants.F_OK)

          // 존재하면 삭제하게 한다.
          await fs.promises.unlink(appOldLogFile)
          console.log('delete old file size::', fileSizeInBytes)
        } catch (err) {
          // old파일이 존재하지 않으면
          // skip
          console.log('No Old Log File')
        }

        // 현재 파일을 old파일로 이름을 변경한다.
        await fs.promises.rename(appLogFile, appOldLogFile)

        console.log('done rename operation')
      }
    } catch (err) {
      console.log('No logfile::', appLogFile)
    }

    // 로그 파일에 현재 로그 내용을 기록한다.
    await fs.promises.appendFile(appLogFile, logData, { encoding: 'utf8' })
    //console.log('로그 파일이 성공적으로 생성되었습니다.')
  } catch (err) {
    console.error('로그 파일을 생성하는 중 오류가 발생했습니다:', err)
  }
}

/**
 * 로그를 기록하는 함수
 * 로그 폴더는 실행함수의 밑에 생성이됨
 * 로그 파일명은 WinARTLog.log
 * 파일 유지는 Queue형태로 진행 Old삭제하고, 현재를 Old로 변경, 그래고 현재를 새로 생성
 * 유지하는 로그 크기는 5M * 2 (2개의 파일만 유지한다)
 */
async function writeLogTextWithPath(_path: string, logMessage: string) {
  const timestamp = new Date().toISOString()
  const logData = `${timestamp}: ${logMessage}\n`

  // 실행파일 밑에 로그 폴더를 만드는 것이 중요함
  // import {app} from electron

  // 만약 path의 정보가 없다면 do nothing
  if (_path.length <= 0) {
    return
  }

  const appFolder = _path
  //const appFolder = path.dirname(process.argv[0])
  // ### 실행폴더 밑 Log 폴더 생성
  // ### WinART 로그 파일 이름 정의
  // ### WinART old 로그 파일 이름 정의
  const appLogFolder = path.join(appFolder, 'Log')
  const appLogFile = path.join(appLogFolder, 'WinARTLog.log')
  const appOldLogFile = path.join(appLogFolder, 'WinARTLogOld.log')

  try {
    // 로그를 생성하기 위한 폴더가 없으면 만들도록 한다
    if (!fs.existsSync(appLogFolder)) {
      // 폴더가 존재하지 않으면 생성한다.
      fs.mkdirSync(appLogFolder, { recursive: true })
    }

    try {
      // 파일 존재 여부 확인
      await fs.promises.access(appLogFile, fs.constants.F_OK)

      // 현재 위치라면, 파일이 존재하는 것
      const stats = await fs.promises.stat(appLogFile)
      const fileSizeInBytes = stats.size

      // 기존 로그 파일이 5M를 넘으면 다른 파일로 변경하게 한다.
      if (fileSizeInBytes > MAX_FILE_SIZE_BYTES) {
        try {
          // 기존의 Old파일이 존재하게 하면 삭제를 수행하고 rename을 수행하게 한다.
          await fs.promises.access(appOldLogFile, fs.constants.F_OK)

          // 존재하면 삭제하게 한다.
          await fs.promises.unlink(appOldLogFile)
          console.log('delete old file size::', fileSizeInBytes)
        } catch (err) {
          // old파일이 존재하지 않으면
          // skip
          console.log('No Old Log File')
        }

        // 현재 파일을 old파일로 이름을 변경한다.
        await fs.promises.rename(appLogFile, appOldLogFile)

        console.log('done rename operation')
      }
    } catch (err) {
      console.log('No logfile::', appLogFile)
    }

    // 로그 파일에 현재 로그 내용을 기록한다.
    await fs.promises.appendFile(appLogFile, logData, { encoding: 'utf8' })
    //console.log('로그 파일이 성공적으로 생성되었습니다.')
  } catch (err) {
    console.error('로그 파일을 생성하는 중 오류가 발생했습니다:', err)
  }
}

function getDefaultPath(): string {
  const settingPath = path.join(app.getAppPath(), 'resources', 'setting.json')

  if (utils.isFile(settingPath)) {
    const settingImfo = JSON.parse(String(fs.readFileSync(settingPath)))
    return settingImfo.defaultPath
  } else {
    return app.getPath('userData')
  }
}

export default {
  getSplitZipFileSize,
  getFolderSize,
  getFreeSpace,
  getFileHash,
  getFileHashSync,
  readHashFile,
  writeHashFile,
  getFileStats,
  copyFiles,
  getSetting,
  setSetting,
  getNextFileName,
  sendErrorLog,
  sendAnalysisLog,
  getErrorLog,
  cleanLogFiles,
  sendAllLog,
  readFileText,
  writeFileText,
  writeLogTextWithPath,
  writeLogText,
  getDefaultPath
}
