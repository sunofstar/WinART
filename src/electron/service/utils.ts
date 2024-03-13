import { DirInfo } from '@share/models'
import dayjs from 'dayjs'
import fs from 'fs'
import path from 'path'

function getDirs(rootPath: string, broot: boolean, recursive?: boolean): DirInfo[] {
  const dirinfos: DirInfo[] = []
  const dirs = fs.readdirSync(rootPath, { withFileTypes: true })
  for (const dir of dirs) {
    const fsstat = fs.statSync(path.join(rootPath, dir.name))
    const mtime = dayjs(fsstat.mtime).format('YYYY.MM.DD HH:mm:ss')
    if (dir.isDirectory()) {
      if (recursive) {
        dirinfos.push({
          filename: dir.name,
          type: 'dir',
          lastModifyDateTime: mtime,
          subdir: getDirs(path.join(rootPath, dir.name), broot, recursive)
        })
      } else {
        if (broot == true)
          dirinfos.push({
            filename: dir.name,
            type: 'dir',
            lastModifyDateTime: mtime,
            subdir: getDirs(path.join(rootPath, dir.name), false)
          })
        else dirinfos.push({ filename: dir.name, type: 'dir', lastModifyDateTime: mtime })
      }
    } else if (dir.isFile()) {
      dirinfos.push({ filename: dir.name, type: 'file', lastModifyDateTime: mtime })
    }
  }
  return dirinfos
}
function isDirectory(path: string) {
  if (fs.existsSync(path)) {
    return fs.statSync(path).isDirectory()
  }
  return false
}
/**
 * web history에 데이트 타임을 ART에서 사용하는 시간 포멧을 변경
 * @param dateTime web history Date time(regular expression 필더된 데이터)
 * @returns
 */
function webDateToDate(dateTime: any) {
  if (dateTime) {
    //'2023-07-17 00:38:14'
    let h = Number(dateTime[5])
    if (dateTime[4] == '오전') {
      if (h === 12) {
        h = 0
      }
    } else if (dateTime[4] == '오후') {
      if (h === 12) {
        h = 12
      } else {
        h += 12
      }
    }
    const strDate = `${dateTime[1]}-${dateTime[2]}-${dateTime[3]} ${String(h).padStart(2, '0')}:${dateTime[6]}:${
      dateTime[7]
    }`
    return strDate
  }
  return ''
}
function isFile(path: string) {
  console.log(path)
  if (fs.existsSync(path)) {
    return fs.statSync(path).isFile()
  }
  return false
}

function changeFileExt(strPath: string, ext: string) {
  const myPath = path.parse(strPath)
  myPath.base = myPath.base.replace(myPath.ext, ext)
  return path.format(myPath)
}

/**
 * 디렉토리에 있는 모든 파일 Path 를 가지고 온다
 * @param currentDirPath 검색할 폴더
 * @param callback 검색한 결과 콜백
 */
async function walkSync(currentDirPath: string, callback: (filepath: string, state: fs.Dirent) => void) {
  fs.readdirSync(currentDirPath, { withFileTypes: true }).forEach(function (pathInfo) {
    var filePath = path.join(currentDirPath, pathInfo.name)
    if (pathInfo.isFile()) {
      callback(filePath, pathInfo)
    } else if (pathInfo.isDirectory()) {
      walkSync(filePath, callback)
    }
  })
}

export default {
  getDirs,
  isFile,
  isDirectory,
  changeFileExt,
  walkSync,
  webDateToDate
}
