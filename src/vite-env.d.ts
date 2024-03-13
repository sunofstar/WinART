/// <reference types="vite/client" />
/// <reference types="vite-plugin-pages/client" />
/// <reference types="vite-plugin-vue-layouts/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-types
  const component: DefineComponent<{}, {}, any>
  export default component
}

import { SaveDialogReturnValue, OpenDialogReturnValue, FileFilter } from 'electron'

declare interface ElectronAPI {
  openFileDialog: (filters?: FileFilter[], defaultPath?: string) => Promise<OpenDialogReturnValue>
  openFolderDialog: (defaultPath?: string) => Promise<OpenDialogReturnValue>
  openSaveDialog: (defaultPath?: string) => Promise<SaveDialogReturnValue>
  openPath: (path: string) => Promise<string>
  minimizeApp: () => void
  maximizeApp: () => void
  closeApp: () => void
  logError: (message: any) => void
  isDev: () => Promise<boolean>
}
declare interface IpcRenderer {
  send: (channel: string, data?: any) => void
  invoke: (channel: string, data?: any) => Promise<any>
  on: (channel: string, callback: Function) => void
  once: (channel: string, callback: Function) => void
  removeAllListeners: (channel: string) => void
}

declare global {
  const electronAPI: ElectronAPI
  const ipcRenderer: IpcRenderer
}
