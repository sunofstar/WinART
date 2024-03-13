import logger from '../logger'
import resourceService from './resourceService'
import systemInterfaceService from './systemInterfaceService'
import { User, USER_STATUS } from '@share/models'
import * as crypto from 'crypto'
import path from 'path'
import fs from 'fs'
import utils from '../service/utils'
import { app } from 'electron'
// 기본 사용자 (dfc01 / dusrnth503)
const DEFAULT_USER_ID = 'd21423cd1ca48e8653b5210e0342c54fa7c03d4750dcd56a966588c05ccef2b7'
const DEFAULT_USER_DATA = '77ce5cca5a3d50760c514d841b0dddddc12390c61bd0033d5d08baf5a6554c4a'

export interface LoginStatus {
  /** 로그인 성공 여부 */
  login?: boolean
  /** 사용자 인증 상태 */
  userStatus: USER_STATUS
  /** 인증 토큰 */
  authToken?: string
  /** 인증갱신용 토큰 */
  refreshToken?: string
}

/**
 * 온라인 상태 반환
 *
 * @returns 온라인 상태
 */
const onlineStatus = async (): Promise<USER_STATUS> => {
  if (await systemInterfaceService.connectTest()) {
    return 'online'
  }
  // TO-DO : 오프라인 인증 정책 결정 시 작업 진행
  return 'offline'
}

/**
 * 사용자 정보 조회
 * 1. 온라인 사용자 정보 조회
 * 2. 오프라인 사용자 정보 조회
 *
 * @param userId 사용자 ID
 * @returns 사용자 정보
 */
const getUserInfo = async (userId: string): Promise<User> => {
  const offlinrauthPath = path.join(app.getAppPath(), 'offauth.json')
  const user: User = {
    id: userId,
    name: ''
  }
  if (isDefaultUser(userId)) return user
  // 온라인
  if (global.shared.auth.status == 'online') {
    if (!global.shared.auth.authToken) {
      return user
    }
    const onlineUser = await systemInterfaceService.getUserInfo()
    if (onlineUser) {
      let offauthJson = undefined
      let infoauth = undefined
      if (utils.isFile(offlinrauthPath)) {
        offauthJson = JSON.parse(String(fs.readFileSync(offlinrauthPath)))
        if (userId in offauthJson) {
          infoauth = offauthJson[String(getSha256Val(userId))]
        }
      }

      if (infoauth) {
        Object.assign(infoauth.user, onlineUser)
        fs.writeFileSync(offlinrauthPath, JSON.stringify(offauthJson))
      }
      Object.assign(user, onlineUser)
    }
    return user
  } else {
    if (utils.isFile(offlinrauthPath)) {
      const offauthJson = JSON.parse(String(fs.readFileSync(offlinrauthPath)))
      if (userId in offauthJson) {
        const infoauth = offauthJson[getSha256Val(userId)]
        return infoauth.user
      }
    }
  }
  // TO-DO : 오프라인 인증 정책 결정 시 작업 진행 (오프라인 인증, 오프라인 7일)
  return user
}

/**
 * SHA256 HASH 반환
 *
 * @param val 문자열
 * @returns 해시값 문자열
 */
function getSha256Val(val: string) {
  return crypto.createHash('sha256').update(val).digest('hex')
}

/**
 * 기본사용자 여부 확인
 *
 * @param userId 사용자 ID
 * @returns 기본사용자 여부
 */
function isDefaultUser(userId: string): boolean {
  return getSha256Val(userId) == DEFAULT_USER_ID
}

/**
 * 기본사용자 인증 여부 확인
 *
 * @param userId 사용자 ID
 * @param password 비밀번호
 * @returns 인증여부
 */
function defaultUserLogin(userId: string, password: string): boolean {
  return getSha256Val(userId + password) == DEFAULT_USER_DATA
}

/**
 * 로그인 진행
 *
 * 1. 기본 사용자
 * 2. 온라인
 * 3. 오프라인 인증
 * 4. 오프라인 7일 확인
 *
 * @param userId 사용자 아이디
 * @param password 비밀번호
 * @returns 로그인처리상태
 */
const login = async (userId: string, password: string): Promise<LoginStatus> => {
  const result: LoginStatus = {
    userStatus: 'offline',
    login: false
  }
  try {
    // 기본 사용자
    if (isDefaultUser(userId)) {
      result.userStatus = 'offline'
      result.login = defaultUserLogin(userId, password)
      return result
    }

    // 온라인
    if (await systemInterfaceService.connectTest()) {
      // 온라인 로그인
      const authToken = await systemInterfaceService.login(userId, password)
      // 인증토큰
      if (authToken) {
        result.authToken = authToken.token
        result.refreshToken = authToken.refresh
      }
      result.login = !!authToken
      result.userStatus = 'online'
      return result
    }
    // TO-DO : 오프라인 인증 정책 결정 시 작업 진행 (오프라인 인증, 오프라인 7일 생성및 확인)
  } catch (err) {
    logger.error(err)
  }

  return result
}
const userRegUrl = async (): Promise<string> => {
  const networkInfo = await resourceService.getNetworkInfo()
  return `https://dfta.spo.go.kr/dfta/mfa/user/userRegistrator.do?untSeCode=${systemInterfaceService.UNIT_CODE}&macAdres=${networkInfo.macAddress}&conectIp=${networkInfo.ip4}`
}
export default { onlineStatus, login, getUserInfo, userRegUrl }
