import path from 'path'
import cp from 'child_process'
import readline from 'readline'
import { app } from 'electron'
import { evidenceImage } from './evidenceImage'
import fs from 'fs'
import logger from '../logger'
import utils from '../service/utils'
import csvWriter from 'csv-write-stream'
/**
 * aff4 이미지을 풀기
 */

export class evidenceAff4 extends evidenceImage {
  async create(
    sourcePath: string,
    callback: (
      state: 'start' | 'totalcount' | 'error' | 'extract' | 'add' | 'end' | 'cancel',
      percent: number,
      filepath?: string | undefined
    ) => void
  ): Promise<void> {
    this._callback = callback
    callback('start', 0)
    const csvfile = this._imagePath + '.csv'

    if (!utils.isDirectory(sourcePath)) this._callback('error', 0)
    this._cpProc = cp.spawn(`"${this._programPath}" -rc "${this._imagePath}" "${sourcePath}"`, [], { shell: true })
    var lineReader = readline.createInterface({
      input: this._cpProc.stdout,
      output: this._cpProc.stdin,
      terminal: false
    })
    //상태창 출력
    let isAff4 = false
    let count = 0
    const csvWrite = csvWriter({
      headers: [
        '순번',
        '파일명',
        '파일경로',
        '파일크기(Bytes)',
        '생성시간',
        '수정시간',
        '접근시간',
        '해시값MD5',
        '해시값SHA1'
      ]
    })
    const csvfs = fs.createWriteStream(csvfile, { encoding: 'utf8' })
    csvWrite.pipe(csvfs)
    csvfs.write('\ufeff')
    lineReader.on('line', (data) => {
      if (data.includes('End aff4')) {
        isAff4 = true
      } else {
        const pos = data.indexOf(':')
        if (pos >= 0) {
          const cmd = data.substring(0, pos)
          const datajson = data.substring(pos + 1)
          if (cmd === 'file') {
            const jsondata = JSON.parse(datajson)
            //const state = fs.statSync(jsondata.file)
            count++
            csvWrite.write([
              String(jsondata.count),
              path.basename(jsondata.file),
              jsondata.file,
              String(jsondata.filesize),
              jsondata.ctime,
              jsondata.mtime,
              jsondata.atime,
              jsondata.md5,
              jsondata.sha1
            ])
            this._callback!('add', Math.floor(jsondata.Adding))
          }
        }
      }
    })
    // 표준 오류 출력
    this._cpProc.stderr.on('data', (data: any) => {
      csvWrite!.end()
      this._callback!('error', 0)

      logger.error(String(data))
    })
    this._cpProc.on('close', (code: any) => {
      csvWrite!.end()
      isAff4 ? this._callback!('end', 100) : this._callback!('error', 0)
    })
  }
  isImage(): boolean {
    let readfs: any = null
    try {
      readfs = fs.createReadStream(this._imagePath!)
      const buff = readfs.read(2)
      const hstr = buff.toString()
      if ('PK' === hstr) {
        readfs.close()
        return true
      }
    } catch (err: any) {
      logger.log(err)
    }
    if (readfs) readfs.close()
    return false
  }
  protected _extractPath: any

  constructor(imagePath: string) {
    super(imagePath)
    this._programPath = path.join(app.getAppPath(), 'resources', 'aff4.exe')
    this._stop = false
  }

  public async export(
    targetPath: string,
    callback: (
      state: 'start' | 'totalcount' | 'error' | 'extract' | 'add' | 'end' | 'cancel',
      percent: number,
      filepath?: string | undefined
    ) => void
  ) {
    this._callback = callback
    this._extractPath = targetPath
    this._cpProc = cp.spawn(`"${this._programPath!}"`, ['-x', '-f', targetPath, this._imagePath!, '\\kape'], {
      shell: true
    })
    var lineReader = readline.createInterface({
      input: this._cpProc.stdout,
      output: this._cpProc.stdin,
      terminal: false
    })
    callback('start', 0)
    let isAff4 = false

    lineReader.on('line', (data) => {
      if (data.includes('End aff4')) {
        isAff4 = true
      } else {
        const pos = data.indexOf(':')
        if (pos >= 0) {
          const cmd = data.substring(0, pos)
          const datajson = data.substring(pos + 1)
          if (cmd === 'Extracted') {
            const jsondata = JSON.parse(datajson)
            this._callback!('extract', jsondata.percent, jsondata.path)
          }
        }
      }
    })
    // 표준 오류 출력
    this._cpProc.stderr.on('data', (data: any) => {
      this._callback!('error', 0)
    })
    this._cpProc.on('close', (code: any) => {
      isAff4 ? this._callback!('end', 100) : this._callback!('error', 0)
    })
  }
}
