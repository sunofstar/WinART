import commonService from '../service/commonService'
import { COMMON_CHANNELS, RESOURCE_CHANNELS } from '../../shared/constants'
import {
  ConfigItem,
  CONFIG_KEY,
  ConvertEncoding,
  CopyFile,
  HashFile,
  HashVal,
  TextFile,
  DirInfo,
  SettingInfo
} from '@share/models'
import { ipcMain } from 'electron'
import Store from 'electron-store'
import fs from 'fs'
import iconv from 'iconv-lite'
import path from 'path'
import utils from '../service/utils'
import { app } from 'electron'
export default function init() {
  const store = new Store()

  /**
   * 앱 버전 반환
   *
   */
  ipcMain.handle(RESOURCE_CHANNELS.appVersion, async (): Promise<string> => {
    return app.getVersion()
  })
  /**
   * 파일/폴더 존재 여부 반환
   *
   * @param targetPath 파일/폴더 경로
   * @returns 존재 여부
   */
  ipcMain.handle(COMMON_CHANNELS.existsFile, async (_: any, targetPath: string): Promise<boolean> => {
    return fs.existsSync(targetPath)
  })

  /**
   * 파일/폴더 사이즈 반환
   *
   * @param filePath 파일/폴더 경로
   * @returns 사이즈
   */
  ipcMain.handle(COMMON_CHANNELS.getFileSize, async (_: any, filePath: string): Promise<number> => {
    if (!fs.existsSync(filePath)) {
      return 0
    }

    let size = 0
    const fileExt = path.extname(filePath).toLocaleLowerCase().substring(1)
    if (['zip', '001'].includes(fileExt) || (fileExt == 'rar' && path.basename(filePath).includes('.part'))) {
      // 분할 압축 파일 전체 사이즈
      size = commonService.getSplitZipFileSize(filePath)
    } else {
      // 단일 파일및 폴더 사이즈
      const stat = fs.statSync(filePath)
      size = stat.isFile() ? stat.size : commonService.getFolderSize(filePath)
    }

    return size
  })

  /**
   * 디스크 사용가능 공간 사이즈 반환
   *
   * @param filePath 파일 경로
   * @returns 사이즈 (bytes)
   */
  ipcMain.handle(COMMON_CHANNELS.getDiskFreeSpace, async (_: any, filePath: string): Promise<number> => {
    return await commonService.getFreeSpace(filePath)
  })

  /**
   * 파일 해시값 반환
   *
   * @param filePath 파일 경로
   * @returns 해시값
   */
  ipcMain.handle(COMMON_CHANNELS.getFileHash, async (_: any, filePath: string): Promise<HashVal> => {
    return await commonService.getFileHash(filePath)
  })

  /**
   * 대상 파일의 해시값 파일 조회
   *
   * @param filePath 파일 경로
   * @returns 해시값
   */
  ipcMain.handle(COMMON_CHANNELS.readHashFile, async (_: any, filePath: string): Promise<HashVal> => {
    return commonService.readHashFile(filePath)
  })

  /**
   * 대상 파일의 해시값 파일 생성
   *
   * @param hashFile 해시값
   */
  ipcMain.handle(COMMON_CHANNELS.writeHashFile, async (_: any, hashFile: HashFile): Promise<void> => {
    commonService.writeHashFile(hashFile.filePath, hashFile.hash)
  })

  /**
   * 파일 생성일시 반환
   *
   * @param filePath 파일경로
   * @returns 생성일시 timestamp (ms)
   */
  ipcMain.handle(COMMON_CHANNELS.getFileCreationDate, async (_: any, filePath: string): Promise<number> => {
    const stats = commonService.getFileStats(filePath)
    return stats && stats.isFile() ? stats.birthtimeMs : 0
  })

  /**
   * 파일 내보내기 (원본파일을 대상경로로 복사)
   *
   * @param copyFiles 복사파일목록
   */
  ipcMain.handle(COMMON_CHANNELS.exportFiles, async (_: any, copyFiles: CopyFile[]): Promise<void> => {
    commonService.copyFiles(copyFiles)
  })

  /**
   * 문자열 인코딩 변환
   *
   * @param info 인코딩 변환 정보
   * @returns 변환 문자열
   */
  ipcMain.handle(COMMON_CHANNELS.convertEncoding, async (_: any, info: ConvertEncoding): Promise<string> => {
    return iconv.encode(info.content, info.encoding).toString()
  })

  /**
   * eFA 설정 아이템 조회
   *
   * @param key 설정키
   * @returns 설정값
   */
  ipcMain.handle(COMMON_CHANNELS.getConfigItem, async (_: any, key: CONFIG_KEY): Promise<any> => {
    return store.get(key)
  })

  /**
   * eFA 설정 아이템 세팅 (세팅값이 undefined 인 경우 해당 아이템 삭제)
   *
   * @param item 설정정보
   */
  ipcMain.handle(COMMON_CHANNELS.setConfigItem, async (_: any, item: ConfigItem): Promise<void> => {
    if (item.val == undefined) {
      store.delete(item.key)
    } else {
      store.set(item.key, item.val)
    }
  })

  ipcMain.handle(COMMON_CHANNELS.writeFileText, async (_: any, textFile: TextFile): Promise<boolean> => {
    return commonService.writeFileText(textFile.filePath, textFile.text)
  })
  ipcMain.handle(COMMON_CHANNELS.readFileText, async (_: any, filepath: string): Promise<string> => {
    return commonService.readFileText(filepath)
  })
  ipcMain.handle(COMMON_CHANNELS.readDir, async (_: any, rootPath: string): Promise<DirInfo[]> => {
    const dirs = utils.getDirs(rootPath, true)
    console.log(dirs)
    return dirs
  })
  ipcMain.handle(COMMON_CHANNELS.setSettingInfo, async (_: any, setinfo: SettingInfo): Promise<boolean> => {
    return await commonService.setSetting(setinfo)
  })
  ipcMain.handle(COMMON_CHANNELS.getSettingInfo, async (): Promise<SettingInfo> => {
    return await commonService.getSetting()
  })

  ipcMain.handle(COMMON_CHANNELS.getDefaultPath, async (): Promise<string> => {
    return await commonService.getDefaultPath()
  })

  /**
   * WinART 로그 파일 생성
   * @param msg 기록할 로그 내용
   */
  ipcMain.on(COMMON_CHANNELS.writeLogText, async (_: any, msg: string) => {
    commonService.writeLogText(msg)
  })

  ipcMain.handle(COMMON_CHANNELS.isDirectory, async (_: any, dirPath: string): Promise<boolean> => {
    return await utils.isDirectory(dirPath)
  })
  ipcMain.handle(COMMON_CHANNELS.isFile, async (_: any, filePath: string): Promise<boolean> => {
    return await utils.isFile(filePath)
  })
}
