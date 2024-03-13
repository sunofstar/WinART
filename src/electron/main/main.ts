import { join } from 'path'
import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import logger from '../logger'
import { enable, initialize } from '@electron/remote/main'
import dotenv from 'dotenv'
import path from 'path'
import ipcmains from '../ipc'

if (app.isPackaged) {
  dotenv.config({ path: path.join(app.getAppPath(), '.env') })
} else {
  dotenv.config({ path: path.join(app.getAppPath(), '.env.development') })
}
const isDev = process.env.npm_lifecycle_event === 'app:dev' ? true : false

logger.info(
  '========================================================================================================================================'
)
logger.info('app version: ', app.getVersion())
logger.info('app path: ', app.getAppPath())
logger.info('platform: ', process.platform)
logger.info('arch: ', process.arch)
logger.info('version: ', process.version)
logger.info('app packaged:', app.isPackaged)
logger.info(
  '========================================================================================================================================'
)

async function handleFileOpen() {
  const { canceled, filePaths } = await dialog.showOpenDialog({ title: 'Open File' })
  if (!canceled) {
    return filePaths[0]
  }
}

function createWindow() {
  initialize()

  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    minWidth: 1400,
    minHeight: 800,
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: join(__dirname, '../preload/preload.js'),
      nodeIntegration: true,
      devTools: true
    }
  })

  // and load the index.html of the app.
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173/') // Open the DevTools.
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile('dist/renderer/index.html')
    //mainWindow.webContents.openDevTools() //###################### 240202_DevTool보이기
  }
  enable(mainWindow.webContents)
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  app.applicationMenu = null
  createWindow()

  let executionType: string | undefined = undefined
  let launcherOtp: string | undefined = undefined
  if (app.isPackaged && process.argv.length > 2) {
    executionType = process.argv[1]
    launcherOtp = process.argv[2]
    logger.info('## execution: ', executionType)
    logger.info('## launcher_otp: ', launcherOtp)
  }

  global.shared = {
    database: undefined,
    searchEngine: undefined,
    commandChannel: {
      channelName: undefined,
      server: undefined,
      socketWrite: undefined,
      receiveMessage: undefined,
      receiveCompleted: false,
      messages: []
    },
    statusChannel: {
      channelName: undefined,
      server: undefined,
      socketWrite: undefined,
      receiveMessage: undefined,
      receiveCompleted: false,
      messages: []
    },
    efaModule: {
      process: undefined,
      error: undefined
    },
    auth: {
      executionType: executionType,
      launcherOtp: launcherOtp,
      status: undefined,
      authToken: undefined,
      refreshToken: undefined
    }
  }
  ipcmains()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
