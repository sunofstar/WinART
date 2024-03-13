import { COMMON_CHANNELS, RESOURCE_CHANNELS, KAPE_OP_CHANNELS } from '@share/constants'
import {
  ConfigItem,
  CONFIG_KEY,
  ConvertEncoding,
  CopyFile,
  HashFile,
  HashVal,
  DirInfo,
  SettingInfo
} from '@share/models'
import path from 'path'
import utils from '../utils/utils'
import fs from 'fs'

/**
 * 앱 버전 조회
 *
 * @returns 버전
 */
const getAppVersion = async (): Promise<string> => {
  return window.ipcRenderer.invoke(RESOURCE_CHANNELS.appVersion)
}

/**
 * 파일/폴더 존재 여부 확인
 *
 * @param path 파일/폴더 경로
 * @returns 존재여부
 */
const existsFile = async (path: string): Promise<boolean> => {
  return ipcRenderer !== undefined ? ipcRenderer?.invoke(COMMON_CHANNELS.existsFile, path) : false
}

/**
 * 파일/폴더 사이즈 반환
 *
 * @param filePath 파일/폴더 경로
 * @returns 사이즈 (bytes)
 */
const getFileSize = async (filePath: string): Promise<number> => {
  return ipcRenderer !== undefined ? ipcRenderer?.invoke(COMMON_CHANNELS.getFileSize, filePath) : false
}

/**
 * 디스크 사용가능 공간 사이즈 반환
 *
 * @param filePath 파일경로
 * @returns 사이즈 (bytes)
 */
const getDiskFreeSpace = async (filePath: string): Promise<number> => {
  return ipcRenderer !== undefined ? ipcRenderer?.invoke(COMMON_CHANNELS.getDiskFreeSpace, filePath) : false
}

/**
 * 파일에 대한 해시값 정보 조회
 *
 * @param filePath 파일경로
 * @returns 해시값 정보
 */
const getFileHash = async (filePath: string): Promise<HashVal> => {
  return ipcRenderer !== undefined ? ipcRenderer?.invoke(COMMON_CHANNELS.getFileHash, filePath) : false
}

/**
 * 대상파일의 해시값 파일 조회
 *
 * @param filePath 파일경로
 * @returns 해시값 정보
 */
const readHashFile = async (filePath: string): Promise<HashVal> => {
  return ipcRenderer !== undefined ? ipcRenderer?.invoke(COMMON_CHANNELS.readHashFile, filePath) : false
}

/**
 * 대상 파일의 해시값 파일 생성
 *
 * @param hashFile 해시값 파일 정보
 */
const writeHashFile = async (hashFile: HashFile): Promise<void> => {
  return ipcRenderer !== undefined ? ipcRenderer?.invoke(COMMON_CHANNELS.writeHashFile, hashFile) : false
}

/**
 * 파일 내보내기
 *
 * @param copyFiles 복사파일목록
 */
const exportFiles = async (copyFiles: CopyFile[]): Promise<void> => {
  return ipcRenderer !== undefined ? ipcRenderer?.invoke(COMMON_CHANNELS.exportFiles, copyFiles) : false
}

/**
 * 문자열 인코딩 변환
 *
 * @param info 인코딩 변환 정보
 * @returns 인코딩 문자열
 */
const convertTextEncoding = async (info: ConvertEncoding): Promise<string> => {
  return ipcRenderer !== undefined ? ipcRenderer?.invoke(COMMON_CHANNELS.convertEncoding, info) : false
}

/**
 * 파일 생성일시 반환
 *
 * @param filePath 파일경로
 * @returns 생성일시 timestamp (ms)
 */
const getFileCreationDate = async function (filePath: string): Promise<number> {
  return ipcRenderer !== undefined ? ipcRenderer?.invoke(COMMON_CHANNELS.getFileCreationDate, filePath) : false
}

/**
 * eFA 설정정보 조회
 *
 * @param key 설정키
 * @returns 설정값
 */
const getConfigItem = async (key: CONFIG_KEY): Promise<any> => {
  return ipcRenderer !== undefined ? ipcRenderer?.invoke(COMMON_CHANNELS.getConfigItem, key) : false
}

/**
 * eFA 설정정보 세팅 (설정값이 undefined 인 경우 해당 설정 삭제)
 *
 * @param item 설정정보
 */
const setConfigItem = async (item: ConfigItem): Promise<void> => {
  return ipcRenderer !== undefined ? ipcRenderer?.invoke(COMMON_CHANNELS.setConfigItem, item) : false
}

let CSVDBState
const creetCSVDBName = async (
  createinf: { csv: string; dbpath: string },
  onState: (cmd: string, state: string, index: number) => void
): Promise<void> => {
  console.log('makeImage')
  CSVDBState = onState
  window.ipcRenderer.send(KAPE_OP_CHANNELS.creetCSVDBName, createinf)
}
window.ipcRenderer.on(
  KAPE_OP_CHANNELS.creetCSVDBNameState,
  async (state: { cmd: string; state: string; index: number }): Promise<void> => {
    if (CSVDBState) CSVDBState(state.cmd, state.state, state.index)
  }
)

/**
 * 폴더 리스트
 *
 * @param filePath 파일경로
 * @returns directory 정보
 */
const readDir = async (rootPath: string): Promise<DirInfo[]> => {
  return ipcRenderer !== undefined ? ipcRenderer.invoke(COMMON_CHANNELS.readDir, rootPath) : undefined
}
/**
 * 리더 텍스트 파일
 *
 * @param filePath 파일경로
 * @returns 텍스트
 */
const readFileText = async (filepath: string): Promise<string> => {
  return ipcRenderer !== undefined ? ipcRenderer?.invoke(COMMON_CHANNELS.readFileText, filepath) : ''
}
/**
 * 텍스트 파일 저장
 * @param filePath 파일경로
 * @param text 저장 네용
 * @returns 성공
 */
const writeFileText = async (filepath: string, text: string): Promise<void> => {
  return window.ipcRenderer.invoke(COMMON_CHANNELS.writeFileText, { filePath: filepath, text: text })
}

const getSettingInfo = async (): Promise<SettingInfo> => {
  return window.ipcRenderer.invoke(COMMON_CHANNELS.getSettingInfo)
}

const setSettingInfo = async (settingInfo: SettingInfo): Promise<boolean> => {
  return window.ipcRenderer.invoke(COMMON_CHANNELS.setSettingInfo, settingInfo)
}
/**
 * case 자정 기본 경로
 * @returns 기본 경로
 */
const getDefaultPath = async (): Promise<string> => {
  return window.ipcRenderer.invoke(COMMON_CHANNELS.getDefaultPath)
}
/**
 * 파일 있는지 확인 한다.
 * @param filePath 파일 경로
 * @returns 존재 여부
 */
const isFile = async (filePath: string): Promise<boolean> => {
  return window.ipcRenderer.invoke(COMMON_CHANNELS.isFile, filePath)
}

/**
 * 디렉토리가 있는지 확인 한다.
 * @param dirPath 다렉토리 경로
 * @returns 존재 여부
 */
const isDirectory = async (dirPath: string): Promise<boolean> => {
  return window.ipcRenderer.invoke(COMMON_CHANNELS.isDirectory, dirPath)
}

export default {
  creetCSVDBName,
  existsFile,
  getFileSize,
  getDiskFreeSpace,
  getFileHash,
  readHashFile,
  writeHashFile,
  exportFiles,
  convertTextEncoding,
  getFileCreationDate,
  getConfigItem,
  setConfigItem,
  getSettingInfo,
  setSettingInfo,
  readFileText,
  writeFileText,
  readDir,
  getAppVersion,
  getDefaultPath,
  isFile,
  isDirectory
}
