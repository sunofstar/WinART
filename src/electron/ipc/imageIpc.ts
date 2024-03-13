import { evidenceDeph } from '../image/deph'
import { evidenceAff4 } from '../image/aff4'
import { evidenceImage, getFileHash, makeReport1, makeReport2 } from '../image/evidenceImage'
import { EVIDENCE_CHANNELS } from '../../shared/constants'
import { AcquisitionImageExport, AcquisitionType, Report1Send, Report2Send, CreateEvidenceImage } from '@share/models'
import { ipcMain } from 'electron'
import path from 'path'
import utils from '../service/utils'
// import logger from '../logger'
import fs from 'fs'
export default function init() {
  /**
   * 증거 이미지 확인
   *
   * @param targetPath case 경로
   * @returns 폴더, deph, aff4 타입 확인
   */
  ipcMain.handle(EVIDENCE_CHANNELS.acquisitionType, async (_: any, targetPath: string): Promise<AcquisitionType> => {
    return evidenceImage.acquisitionType(targetPath)
  })
  ipcMain.on(
    EVIDENCE_CHANNELS.exportImage,
    async (event: Electron.IpcMainEvent, targetInfo: AcquisitionImageExport) => {
      let exportImage: evidenceImage | null = null
      let imagePath: string | null = null
      if (targetInfo.imageType == 'aff4') {
        imagePath = utils.changeFileExt(targetInfo.imageFilePath, '.aff4')
        exportImage = new evidenceAff4(imagePath)
      } else if (targetInfo.imageType === 'deph') {
        imagePath = utils.changeFileExt(targetInfo.imageFilePath, '.deph')
        exportImage = new evidenceDeph(imagePath)
      }

      if (exportImage) {
        const tagePath = path.join(targetInfo.exportPath, 'Temp', 'Export')

        if (!utils.isDirectory(tagePath)) {
          fs.mkdirSync(tagePath, { recursive: true })
        }
        exportImage?.export(tagePath, (state, percent, filepath) => {
          console.log(state, percent, filepath)
          event.sender.send(EVIDENCE_CHANNELS.exportImageState, { state: state, percent: percent, filepath: filepath })
        })
      } else {
        // logger.error('export image')
        event.sender.send(EVIDENCE_CHANNELS.exportImageState, { state: 'error', percent: -1, filepath: '' })
      }
    }
  )
  ipcMain.on(EVIDENCE_CHANNELS.createImage, (event: Electron.IpcMainEvent, evidenceImage: CreateEvidenceImage) => {
    let createImage: evidenceImage | null = null
    if (evidenceImage.imageType == 'aff4') {
      createImage = new evidenceAff4(evidenceImage.imageFilePath)
    } else if (evidenceImage.imageType == 'deph') {
      createImage = new evidenceDeph(evidenceImage.imageFilePath)
    } else {
      // logger.error('create evidence image')
      event.sender.send(EVIDENCE_CHANNELS.exportImageState, { state: 'error', percent: -1, filepath: '' })
    }
    if (createImage) {
      createImage.create(evidenceImage.imageSourcePath, (state, percent, filepath) => {
        event.sender.send(EVIDENCE_CHANNELS.createImageState, { state: state, percent: percent, filepath: filepath })
      })
    }
  })
  ipcMain.on(EVIDENCE_CHANNELS.getFileHash, (event: Electron.IpcMainEvent, filepath: string) => {
    getFileHash(filepath, (state, percent, hashObj) => {
      event.sender.send(EVIDENCE_CHANNELS.getFileHashState, { state: state, percent: percent, hash: hashObj })
    })
  })

  ipcMain.handle(EVIDENCE_CHANNELS.make_report1, async (_: any, reportinfo: Report1Send): Promise<boolean> => {
    // 1. 폴더 생성
    console.log('make_report1', reportinfo)
    return makeReport1(reportinfo)
  })

  ipcMain.handle(EVIDENCE_CHANNELS.make_report2, async (_: any, reportinfo: Report2Send): Promise<boolean> => {
    // 1. 폴더 생성
    console.log('make_report1', reportinfo)
    return makeReport2(reportinfo)
  })
}
