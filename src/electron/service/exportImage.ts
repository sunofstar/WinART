/**
 * 파일 해시값 반환 (async)
 *
 * @param filePath 파일 경로
 * @returns 해시값
 */

import path from 'path'
import fs from 'fs'
import cp from 'child_process'
import readline from 'readline'
import crypto from 'crypto'
import logger from '../logger'
import { CaseInfo, HashVal } from '@share/models'
import { app } from 'electron'
import { evidenceAff4 } from '../image/aff4'
import { evidenceDeph } from '../image/deph'
/**
 * triage 생성 이미지 export 한다.
 * @param type : 이미지 타입(aff4, deph)
 * @param imagePath : 이미지 경로
 * @param targetPath : 내보내기 경로
 * @param callback : 작업 상테 정보
 */
export async function exportImage(
  type: 'aff4' | 'deph',
  imagePath: string,
  targetPath: string,
  callback: (
    state: 'start' | 'error' | 'extract' | 'end' | 'cancel',
    percent: number,
    filepath?: string | undefined
  ) => void
) {
  let imageExport: any
  if (type === 'aff4') {
    imageExport = new evidenceAff4(imagePath)
  } else type === 'deph'
  {
    imageExport = new evidenceDeph(imagePath)
  }
  imageExport.export(
    imagePath,
    targetPath,
    (state: 'start' | 'error' | 'extract' | 'end' | 'cancel', percent: number, filepath?: string | undefined) => {
      callback(state, percent, filepath)
    }
  )
}
/**
 * File Hash 정보 (md5, sha1)
 * @param filePath 파일 경로
 * @param callback 해쉬 진행 상태
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
    const filestat = fs.statSync(filePath)
    fs.createReadStream(filePath)
      .on('data', (chunk) => {
        md5Hash.update(chunk)
        sha1Hash.update(chunk)
        const newPercent = Math.floor((chunk.length / filestat.size) * 100)
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
  })
}
