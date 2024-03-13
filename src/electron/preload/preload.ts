// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
import {
  contextBridge,
  FileFilter,
  OpenDialogOptions,
  SaveDialogOptions,
  ipcRenderer,
  OpenDialogReturnValue,
  SaveDialogReturnValue,
  shell
} from 'electron'
import { app, dialog, getCurrentWindow } from '@electron/remote'
import * as log from 'electron-log'

window.addEventListener('DOMContentLoaded', () => {
  const replaceText = (selector: any, text: any) => {
    const element = document.getElementById(selector)
    if (element) element.innerText = text
  }

  for (const dependency of ['chrome', 'node', 'electron']) {
    replaceText(`${dependency}-version`, process.versions[dependency])
  }
})

contextBridge.exposeInMainWorld('electronAPI', {
  /**
   * 파일 선택 다이얼로그 오픈
   *
   * @param filters 파일필터목록
   * @param defaultPath 기본경로
   */
  openFileDialog: (filters?: FileFilter[], defaultPath?: string): Promise<OpenDialogReturnValue> => {
    const opts: OpenDialogOptions = {
      properties: ['openFile'],
      defaultPath: defaultPath || undefined,
      filters: filters || undefined
    }
    return dialog.showOpenDialog(opts)
  },
  /**
   * 폴더 선택 다이얼로그 오픈
   *
   * @param defaultPath 기본경로
   */
  openFolderDialog: (defaultPath?: string): Promise<OpenDialogReturnValue> => {
    const opts: OpenDialogOptions = {
      properties: ['openDirectory'],
      defaultPath: defaultPath || undefined
    }
    return dialog.showOpenDialog(opts)
  },
  /**
   * 파일 저장 선택 다이얼로그오픈
   *
   * @param defaultPath 기본경로 혹은 저장 파일명
   */
  openSaveDialog: (defaultPath?: string): Promise<SaveDialogReturnValue> => {
    const opts: SaveDialogOptions = {
      defaultPath: defaultPath || undefined
    }
    return dialog.showSaveDialog(opts)
  },
  /**
   * 파일및 폴더 오픈
   *
   * @param path 경로
   */
  openPath: (path: string): Promise<string> => {
    return shell.openPath(path)
  },
  /**
   * 앱 사이즈를 최소화
   */
  minimizeApp: (): void => {
    getCurrentWindow().minimize()
  },
  /**
   * 앱 사이즈를 최대화
   * 최대화 상태면 이전 사이즈로 복원
   */
  maximizeApp: (): void => {
    if (getCurrentWindow().isMaximized()) {
      getCurrentWindow().restore()
    } else {
      getCurrentWindow().maximize()
    }
  },
  /**
   * 앱 종료
   */
  closeApp: async (): Promise<void> => {
    app.quit()
  },
  /**
   * renderer 오류 로그
   *
   * @param message 메시지
   */
  logError: (message: any) => {
    log.error(message)
  },
  isDev: (): boolean => {
    return process.env.npm_lifecycle_event === 'app:dev' ? true : false
  }
})

// ipcRenderer api
contextBridge.exposeInMainWorld('ipcRenderer', {
  /**
   * ipcRenderer send
   *
   * @param channel 채널명
   * @param data 데이터
   */
  send: (channel: string, data?: any) => {
    if (data) {
      ipcRenderer.send(channel, data)
    } else {
      ipcRenderer.send(channel)
    }
  },
  /**
   * ipcRenderer invoke
   *
   * @param channel 채널명
   * @param data 데이터
   */
  invoke: (channel: string, data?: any): Promise<any> => {
    return data ? ipcRenderer.invoke(channel, data) : ipcRenderer.invoke(channel)
  },
  /**
   * ipcRenderer on
   *
   * @param channel 채널명
   * @param callback 콜백함수
   * @returns IpcRenderer
   */
  on: (channel: string, callback: Function) => {
    ipcRenderer.on(channel, (_event, ...args) => callback(...args))
  },
  /**
   * ipcRenderer once
   *
   * @param channel 채널명
   * @param callback 콜백함수
   */
  once: (channel: string, callback: Function) => {
    ipcRenderer.once(channel, (_event, ...args) => callback(...args))
  },
  /**
   * ipcRenderer removeAllListeners
   *
   * @param channel 채널명
   */
  removeAllListeners: (channel: string) => {
    ipcRenderer.removeAllListeners(channel)
  }
})
