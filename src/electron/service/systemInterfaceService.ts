import logger from '../logger'
import axios, { AxiosError, AxiosResponse } from 'axios'
import resourceService from '../service/resourceService'
import { AuthToken, User } from '../../shared/models'
import { app, IpcMainEvent } from 'electron'
// 도구식별 코드
const UNIT_CODE = 'F02'
// 도구런처 URL
const LAUNCHER_URL = 'http://localhost:61601'

const getDFTAUrl = (networkInfo: any): string => {
  const server_url = process.env.SERVER_URL
  const iptest = /^172.50/
  const isAnal = iptest.test(networkInfo.ip4)
  const server_schema =
    typeof process.env.SERVER_SCHEMA != 'undefined' ? process.env.SERVER_SCHEMA : isAnal ? 'http://' : 'https://'
  return server_schema + server_url
}

/**
 * 도구지원 시스템 연결 테스트
 *
 * @returns 성공여부
 */
const connectTest = async (): Promise<boolean> => {
  let result = false
  try {
    const networkInfo = await resourceService.getNetworkInfo()
    var url = await getDFTAUrl(networkInfo)
    const response = await axios.get(url + '/v3/api/ping', {
      timeout: 2000
    })
    if (response.data.success) {
      result = true
    }
  } catch (err) {
    logger.error(err)
  }

  return result
}

const uselog = async (data: any): Promise<AxiosResponse | undefined> => {
  // TO-DO : 도구지원시스템 오류로그 전송 API 확정 시 맞춰서 수정
  let response: AxiosResponse | undefined = undefined
  try {
    const networkInfo = await resourceService.getNetworkInfo()
    var url = await getDFTAUrl(networkInfo)
    response = await axios.post(
      url + '/v3/api/uselog',
      {
        data: data
      },
      {
        headers: {
          // ...form.getHeaders(),
          'X-AUTH-TOKEN': global.shared.auth.authToken || ''
        }
      }
    )
  } catch (err) {
    logger.error(err)
  }

  return response
}

const auditlog = async (data: any): Promise<AxiosResponse | undefined> => {
  // TO-DO : 도구지원시스템 분석결과 전송 API 확정 시 맞춰서 수정
  let response: AxiosResponse | undefined = undefined
  try {
    const networkInfo = await resourceService.getNetworkInfo()
    var url = await getDFTAUrl(networkInfo)
    response = await axios.post(
      url + '/v3/api/auditlog',
      {
        data: data
      },
      {
        headers: {
          'X-AUTH-TOKEN': global.shared.auth.authToken || ''
        }
      }
    )
  } catch (err) {
    logger.error(err)
  }

  return response
}

/**
 * 도구런처 인증
 *
 * @param otp 런처 OTP
 * @returns 텍스트
 */
const launcherLogin = async (otp: string): Promise<string | undefined> => {
  let result = undefined
  try {
    const response = await axios.get(LAUNCHER_URL + '/session', {
      params: {
        otp: otp
      }
    })
    if (!response.data) {
      return undefined
    }
    result = Buffer.from(response.data, 'base64').toString('utf8')
  } catch (err) {
    // logger.error(err)
  }

  return result
}

/**
 * 로그인
 *
 * @param userId 사용자 아이디
 * @param password 비밀번호
 * @returns 인증토큰
 */
const login = async (userId: string, password: string): Promise<AuthToken | undefined> => {
  let authToken: AuthToken | undefined = undefined
  try {
    // 네트워크 조회
    const networkInfo = await resourceService.getNetworkInfo()
    var url = await getDFTAUrl(networkInfo)
    // 로그인
    const response: AxiosResponse = await axios.post(url + '/v3/api/login', {
      untSeCode: UNIT_CODE,
      untVer: app.getVersion(),
      userId: userId,
      password: password,
      conectIp: networkInfo.ip4,
      macAdres: networkInfo.macAddress
    })
    if (response.data.success) {
      authToken = {
        token: response.data.data.token,
        refresh: response.data.data.refresh
      }
    }
  } catch (err) {
    if (err instanceof AxiosError) {
      logger.error('url:' + err.config?.url + ', message:' + err.message)
    } else {
      logger.error(err)
    }
  }

  return authToken
}

/**
 * 로그아웃
 *
 */
const logout = async (): Promise<void> => {
  try {
    const networkInfo = await resourceService.getNetworkInfo()
    var url = await getDFTAUrl(networkInfo)
    await axios.post(
      url + '/v3/api/logout',
      {},
      {
        headers: {
          'X-AUTH-TOKEN': global.shared.auth.authToken || ''
        }
      }
    )
  } catch (err) {
    if (err instanceof AxiosError) {
      logger.error('url:' + err.config?.url + ', message:' + err.message)
    } else {
      logger.error(err)
    }
  }
}

/**
 * 사용자 정보 조회
 *
 * @param token 인증토큰
 * @returns 사용자 정보
 */
const getUserInfo = async (): Promise<Pick<User, 'name' | 'rank' | 'department' | 'office'> | undefined> => {
  let user: Pick<User, 'name' | 'rank' | 'department' | 'office'> | undefined = undefined
  try {
    const networkInfo = await resourceService.getNetworkInfo()
    var url = await getDFTAUrl(networkInfo)
    const response = await axios.post(
      url + '/v3/api/user',
      {},
      {
        headers: {
          'X-AUTH-TOKEN': global.shared.auth.authToken || ''
        }
      }
    )
    // if (response.data.data) {
    //   logger.info('>> user data:', response.data.data)
    // }
    if (response.data.success) {
      user = {
        name: response.data.data.empNm || '',
        rank: response.data.data.ofcpsNm || '',
        department: response.data.data.deptNm || '',
        office: response.data.data.psitnInsttNm || ''
      }
    }
  } catch (err) {
    if (err instanceof AxiosError) {
      logger.error('url:' + err.config?.url + ', message:' + err.message)
    } else {
      logger.error(err)
    }
  }
  return user
}

export default {
  connectTest,
  launcherLogin,
  auditlog,
  login,
  logout,
  uselog,
  getUserInfo,
  UNIT_CODE
}
