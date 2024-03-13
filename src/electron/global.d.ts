import { ChildProcess } from 'child_process'
import { EfaChannel, USER_STATUS } from '@share/models'

interface Shared {
  /** 데이터베이스 이름 */
  database?: string
  /** 검색엔진 */
  searchEngine?: ChildProcess
  /** Command Server */
  commandChannel: EfaChannel
  /** Status Server */
  statusChannel: EfaChannel
  /** efa Module */
  efaModule: {
    /** 프로세스 */
    process?: ChildProcess
    /** 프로세스 오류 */
    error?: string
  }
  /** 인증정보 */
  auth: {
    /** 실행 구분 */
    executionType?: string
    /** 도구런처 OTP */
    launcherOtp?: string
    /** 인증 상태 */
    status?: USER_STATUS
    /** 인증 토큰 */
    authToken?: string
    /** 인증 갱신 토큰 */
    refreshToken?: string
  }
}

declare global {
  var shared: Shared
}

export {}
