import fs from 'fs'
import path from 'path'
import { parse } from 'csv-parse'
import { parse as parseSync } from 'csv-parse/sync'
import sqlite3 from 'sqlite3'
import { open } from 'sqlite'
import Database from 'better-sqlite3'
import { Worker, isMainThread, parentPort, workerData } from 'worker_threads'
import { fork, spawn } from 'child_process'
import { app } from 'electron'

/**
 * Kape바이너리를 가지고 PC 분석을 위한 클래스 정의
 */
export class KapeAnalysis {
  protected rootpath: string = ''
  protected casePath: string = '' // 분석 case 폴더 구성
  protected sourcePath: string = '' // 분석을 위한 폴더 명
  protected destPath: string = '' // 분석 결과를 저장하는 폴더 명
  protected kapeBinary: string = '' // kape바이너리 위치
  protected cancel: boolean = false // 동작 도중에 중단을 의하는 값
  protected kapeDest: string = '' // kape 분석 결과 위치
  protected actDoneFlag: boolean = true

  protected kapeModuleInfo: string =
    'NirSoft_BrowsingHistoryView,NTFSLogTracker,AmcacheParser,EvtxECmd,JLECmd,LECmd,MFTECmd_$MFT,PECmd,RBCmd,RECmd_BasicSystemInfo,RECmd_SPO_All_Execute_Command,Recmd_installedSoftware,SBECmd,SrumECmd,WxTCmd,RecentFileCacheParser'

  public constructor() {
    this.rootpath = app.getAppPath()
    // kape 바이너리 파일이 존재하는 폴더 정보 설정 resource/KAPE
    // 20240228 대검에서 전달해 준 바이너리로 수정됨
    const kapepath = path.join(this.rootpath, 'resources', 'KAPE')  // change 20240206 바이너리 변경 webbrowser수정본 // 20240228 KAPE-240206-FileSystem_changed ==> KAPE

    // kape 바이너리가 있는 절대 경로 포함 파일 정보
    this.kapeBinary = path.join(kapepath, 'Kape.exe')

    // 테스트를 위한 코드
    this.sourcePath = ''

    // 테스트를 위한 코드
    this.destPath = ''
  }

  setCasePath(param: string) {
    this.casePath = param
  }

  setKapeBinary(param: string) {
    this.kapeBinary = param
  }

  fileExists(filePath: string): boolean {
    try {
      // 파일을 접근할려고 시도
      fs.accessSync(filePath, fs.constants.F_OK)
      return true
    } catch (err) {
      return false
    }
  }

  doAsyncKapeAnalysis(
    _source: string,
    _dest: string,
    onState?: (state: string, percent: number) => void // callback 함수 등록
  ): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      let proCount: number = 0
      let processNumber: number = 0

      try {
        // 필요한 정보가 없을 경우, 실패로 처리
        if (
          this.kapeBinary === '' ||
          (_source === '' && this.sourcePath === '') ||
          (_dest === '' && this.destPath === '')
        ) {
          console.log('경로정보가 필요함')
          if (onState) onState!('A004', -1) // 에러 코드를 전달
          reject('A004')
        } else {
          ///// 정상의 경우 ///////////////////////////////////////////////////////////
          // 분석할 소스 폴더의 정보를 설정해야 하는 경우
          if (this.sourcePath === '' && _source !== '') {
            this.sourcePath = _source
          }

          // 분석한 결과를 저장할 폴더를 설정할 경우
          if (this.destPath === '' && _dest !== '') {
            this.destPath = _dest
          }

          // 분석할 소스 폴더가 없을 경우, 그냥 종료한다
          if (!fs.existsSync(this.sourcePath) || !this.fileExists(this.kapeBinary)) {
            // 여기서는 error 처리 ///////////////////////////////////////////
            console.error('error #%d', 100)
            if (onState) onState!('A004', -2) // 에러 코드를 전달
            reject('A004')
          } else {
            ///////////// 정상의 경우 ############################################################################

            ////////////////////////////////////////////////////////////////////////////////
            // destPath는 없을 경우, KAPE에서 상위 폴더를 포함해서 모두 생성한 후, 동작하고 있다
            ////////////////////////////////////////////////////////////////////////////////

            //console.log('doAsyncKapeAnalysis ----- ', __filename, this.kapeBinary, this.sourcePath, this.destPath)

            const childProcess = spawn(`${this.kapeBinary}`, [
              '--msource',
              `${this.sourcePath}`,
              '--mdest',
              `${this.destPath}`,
              '--mflush',
              '--module',
              `${this.kapeModuleInfo}`,
              '--mef',
              'csv',
              '--gui'
            ])

            //const childProcessPID = childProcess.pid

            childProcess.stdout.on('data', (data) => {
              const orgData = `${data}`
              // 에러인 경우
              const matchErr = orgData.match(/Examples: kape.exe --tsource L: --target RegistryHives --tdest */)
              if (matchErr) {
                console.log(`ERROR happened <=== `, data)
              }

              // 처리해야 할 프로세스 개수 추출하는 것
              const matchFirst = orgData.match(/Discovered \d+ processors to run/)
              if (matchFirst) {
                const matchSecond = matchFirst[0].match(/\d+/)
                if (matchSecond) {
                  processNumber = parseInt(matchSecond[0], 10)
                  //console.log('REF process number >>>>> ' + processNumber)
                }
              }

              // 각각의 프로세스 수행되는 개수 추출
              const regPattern = / {2}Running.*\.exe:/
              const matchProcess = orgData.match(regPattern)
              if (matchProcess) {
                proCount++
                //console.log(`stdout: [[${data}]]`);////////////////

                const curState = Math.floor(((proCount - 1) / processNumber) * 100)
                console.log(`stdout: Runing == [[${curState} %]]`)
                if (onState) {
                  onState('W001', curState)
                }
              } else {
                // 각각의 SKIP되는 프로세스 수행되는 개수 추출
                const regPatternSkip = / {2}Skipping.*\.exe:/
                const matchProcessSkip = orgData.match(regPatternSkip)
                if (matchProcessSkip) {
                  proCount++

                  const curState = Math.floor(((proCount - 1) / processNumber) * 100)
                  //console.log(`stdout: Skip ==[[${curState} %]]`)
                  if (onState) {
                    onState('W001', curState)
                  }
                }
              }

              // 강제로 최종 종료되는 로그로 100 % 로 완료
              const regPattern2 = /Total execution time: /
              const matchFinal = orgData.match(regPattern2)
              if (matchFinal) {
                //console.log(`stdout: ==[[100 %]]`)
                if (onState) {
                  onState('W001', 100)
                }
              }
            })

            // 외부 프로세스의 표준 에러를 읽고 출력합니다.
            childProcess.stderr.on('data', (data) => {
              console.error(`stderr: [[${data}]]`)
            })

            childProcess.on('exit', (code, signal) => {
              // 정상 종료인 경우 : code = 0
              // kill이 된 경우에는 code = 1 임...
              if (code !== null) {
                console.log(`child process exited with code ${code}`)

                if (signal !== null) {
                  console.log(`with signal ${signal}`)
                }
              } else {
                console.log(`child process exited with null code`)
              }

              if (onState) {
                onState('_009', 100)
              }
              resolve()
            })
          } // if 폴더와 바이너리 존재하는 경우
        } // if 클래스에 정상으로 데이터가 존재하는 경우
      } catch (err) {
        console.error(err)
        if (onState) onState!('A004', -3) // 에러 코드를 전달
        reject('A004')
      }
    }) // end of new Promise
  }

  doSyncKapeAnalysis() {
    let proCount = 0
    let processNumber = 0

    //const childProcess = spawn('cmd.exe', ['/c', 'dir']);
    if (this.kapeBinary === '' || this.sourcePath == '' || this.destPath == '') {
      return
    }

    const childProcess = spawn(`${this.kapeBinary}`, [
      '--msource',
      `${this.sourcePath}`,
      '--mdest',
      `${this.destPath}`,
      '--mflush',
      '--module',
      `${this.kapeModuleInfo}`,
      '--mef',
      'csv',
      '--gui'
    ])

    const childProcessPID = childProcess.pid

    childProcess.stdout.on('data', (data) => {
      const orgData = `${data}`
      // 에러인 경우
      const matchErr = orgData.match(/Examples: kape.exe --tsource L: --target RegistryHives --tdest */)
      if (matchErr) {
        console.log(`ERROR happened <=== `, data)
      }

      // 처리해야 할 프로세스 개수 추출하는 것
      const matchFirst = orgData.match(/Discovered \d+ processors to run/)
      if (matchFirst) {
        const matchSecond = matchFirst[0].match(/\d+/)
        if (matchSecond) {
          processNumber = parseInt(matchSecond[0], 10)
          console.log('REF process number >>>>> ' + processNumber)
        }
      }

      // 각각의 프로세스 수행되는 개수 추출
      const regPattern = / {2}Running.*\.exe:/
      const matchProcess = orgData.match(regPattern)
      if (matchProcess) {
        proCount++
        //console.log(`stdout: [[${data}]]`);///////////////////////////////////////////////////////////////

        const curState = Math.floor(((proCount - 1) / processNumber) * 100)
        console.log(`stdout: Runing == [[${curState} %]]`)
      } else {
        // 각각의 SKIP되는 프로세스 수행되는 개수 추출
        const regPatternSkip = / {2}Skipping.*\.exe:/
        const matchProcessSkip = orgData.match(regPatternSkip)
        if (matchProcessSkip) {
          proCount++

          const curState = Math.floor(((proCount - 1) / processNumber) * 100)
          console.log(`stdout: Skip ==[[${curState} %]]`)
        }
      }

      // 강제로 최종 종료되는 로그로 100 % 로 완료
      const regPattern2 = /Total execution time: /
      const matchFinal = orgData.match(regPattern2)
      if (matchFinal) {
        console.log(`stdout: ==[[100 %]]`)
      }
    })

    // 외부 프로세스의 표준 에러를 읽고 출력합니다.
    childProcess.stderr.on('data', (data) => {
      console.error(`stderr: [[${data}]]`)
    })

    childProcess.on('exit', (code, signal) => {
      // 정상 종료인 경우 : code = 0
      // kill이 된 경우에는 code = 1 임...
      if (code !== null) {
        console.log(`child process exited with code ${code}`)
        if (signal !== null) {
          console.log(`with signal ${signal}`)
        }
      } else {
        console.log(`child process exited with null code`)
      }
    })
  }
} // end of class KapeAnaysis #############################################################
