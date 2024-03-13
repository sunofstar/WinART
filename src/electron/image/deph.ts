import path from 'path'
import cp from 'child_process'
import readline from 'readline'
import { app } from 'electron'
import fs from 'fs'
import logger from '../logger'
import { evidenceImage } from './evidenceImage'
import utils from '../service/utils'
import csvWriter from 'csv-write-stream'
/**
 * dep 이미지을 풀기
 */
export class evidenceDeph extends evidenceImage {
  async create(
    sourcePath: string,
    callback: (
      state: 'start' | 'totalcount' | 'error' | 'extract' | 'add' | 'end' | 'cancel',
      percent: number,
      filepath?: string | undefined
    ) => void
  ) {
    this._callback = callback
    callback('start', 0)
    const acqFiles: string[] = []
    await utils.walkSync(sourcePath, (filepath, state) => {
      acqFiles.push(filepath)
    })
    this._cpProc = cp.spawn(`"${this._programPath!}"`, [], { shell: true })
    var lineReader = readline.createInterface({
      input: this._cpProc.stdout,
      terminal: false
    })
    const csvfile = this._imagePath + '.csv'
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
    let addCount = 0
    let count = 0
    lineReader.on('line', (output) => {
      const pos = output.indexOf(':')
      if (pos >= 0) {
        const cmd = output.substring(0, pos)
        const data = output.substring(pos + 1)
        console.log(output)
        if (cmd === 'create') {
          if (data === 'ok') {
            this._cpProc!.stdin.write(`setpath:${sourcePath}\n`)
          } else {
            csvWrite!.end()
            this._cpProc!.kill()
            this._callback!('error', 0)
          }
        } else if (cmd === 'setpath') {
          this._cpProc!.stdin.write(`add:${acqFiles[addCount]}\n`)
        } else if (cmd === 'add') {
          if (this._stop === false) {
            if (data !== 'error') {
              const jsondata = JSON.parse(data)
              count++
              csvWrite.write([
                String(count),
                path.basename(jsondata.file),
                jsondata.file,
                String(jsondata.size),
                jsondata.ctime,
                jsondata.mtime,
                jsondata.atime,
                jsondata.md5,
                jsondata.sha1
              ])
            }
            addCount++
            this._callback!('add', Math.floor((addCount / acqFiles.length) * 100))
            if (addCount >= acqFiles.length) {
              this._cpProc!.stdin.write('end:all\n')
            } else {
              this._cpProc!.stdin.write(`add:${acqFiles[addCount]}\n`)
            }
          }
        } else if (cmd === 'end') {
          this._callback!('end', 100)
          this._cpProc!.kill()
          csvWrite!.end()
        }
      }
    })
    this._cpProc.stdin.write(`create:${this._imagePath}\n`)
  }
  isImage(): boolean {
    let readfs: any = null
    try {
      readfs = fs.createReadStream(this._imagePath!)
      const buff = readfs.read(4)
      const dephstr = buff.toString('hex')
      if ('3f520102' === dephstr) {
        readfs.close()
        return true
      }
    } catch (err: any) {
      logger.log(err)
    }
    if (readfs) readfs.close()
    return false
  }
  constructor(imagePath: string) {
    super(imagePath)
    this._programPath = path.join(app.getAppPath(), 'resources', 'acqdeph.exe')
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
    this._cpProc = cp.spawn(`"${this._programPath!}"`, [], { shell: true })
    var lineReader = readline.createInterface({
      input: this._cpProc.stdout,
      terminal: false
    })

    lineReader.on('line', (output) => {
      const pos = output.indexOf(':')
      if (pos >= 0) {
        const cmd = output.substring(0, pos)
        const data = output.substring(pos + 1)
        if (cmd === 'open') {
          if (data === 'ok') {
            this._cpProc?.stdin.write(`setpath:${targetPath}\n`)
          } else {
            this._cpProc?.kill()
            callback('error', 0)
            return
          }
        }
        if (cmd === 'setpath') {
          callback('start', 0)
          if (data === 'ok') {
            this._cpProc?.stdin.write(`getfilecount\n`)
          } else {
            callback('error', 0)
            this._cpProc?.kill()
            return
          }
        }
        if (cmd === 'getfilecount') {
          this._totFileCount = Number(data)
          if (this._totFileCount > 0) {
            callback('totalcount', this._totFileCount)
            this._cpProc?.stdin.write(`exportall\n`)
          } else {
            if (this._totFileCount === 0) {
              callback('totalcount', this._totFileCount)
              callback('end', 0)
            } else {
              callback('error', 0)
            }
          }
        }
        if (cmd === 'exportall') {
          if (data === 'end') {
            this._cpProc?.stdin.write('end\n')
            callback('end', 100)
            this._cpProc?.kill()
            return
          } else if (data === 'error') {
            //오류 처리?
          } else {
            try {
              const fileinfo: any = JSON.parse(data)
              callback('extract', Math.floor((fileinfo.count / this._totFileCount) * 100), fileinfo.filepath)
            } catch (err: any) {
              //오류 처리?
            }
          }
        }
      }
    })
    this._cpProc.stdin.write(`open:${this._imagePath}\n`)
  }

  public stop() {
    this._cpProc?.stdin.write('end\n')
    super.stop()
  }
}
