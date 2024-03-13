import { ipcMain } from 'electron'
import { USER_STATUS, LoginForm, UserAuthInfo, User } from '../../shared/models'
import { LOGIN_CHANNELS } from '../../shared/constants'
import loginService, { LoginStatus } from '../service/loginService'
import systemInterfaceService from '../service/systemInterfaceService'
import logger from '../logger'

export default function init() {
  /**
   * 도구런처 로그인
   *
   * @returns 사용자및 인증 정보
   */
  ipcMain.handle(LOGIN_CHANNELS.laucherLogin, async (): Promise<UserAuthInfo | undefined> => {
    if (!global.shared.auth.launcherOtp) {
      return undefined
    }

    let result: UserAuthInfo | undefined = undefined
    try {
      // 도구런처 로그인
      const sessionText: string | undefined = await systemInterfaceService.launcherLogin(global.shared.auth.launcherOtp)
      if (!sessionText) {
        return undefined
      }

      // 사용자/인증 정보
      const obj = JSON.parse(sessionText)
      logger.info('## launcher session obj:', obj)
      result = {
        auth: {
          launcher: true,
          status: 'online',
          authToken: obj.token
        },
        user: {
          id: obj.userId || obj.empId || '',
          name: obj.empNm || '',
          rank: obj.ofcpsNm || '',
          office: obj.psitnInsttNm || '',
          department: obj.deptNm || ''
        }
      }

      // 인증정보 세팅
      global.shared.auth.status = result.auth.status
      global.shared.auth.authToken = obj.token
      global.shared.auth.refreshToken = obj.refresh
    } catch (err) {
      logger.error(err)
    }

    return result
  })
  /**
   * 온라인 상태 확인
   *
   * @returns 온라인상태
   */
  ipcMain.handle(LOGIN_CHANNELS.onlineStatus, async (): Promise<USER_STATUS> => {
    return await loginService.onlineStatus()
  })
  /**
   * 로그인
   *
   * @param loginForm 로그인 입력정보
   * @returns 사용자및 인증 정보
   */
  ipcMain.handle(LOGIN_CHANNELS.login, async (_: any, loginForm: LoginForm): Promise<UserAuthInfo | undefined> => {
    // 사용자 인증
    const loginStatus: LoginStatus = await loginService.login(loginForm.userId, loginForm.password)
    if (!loginStatus.login) {
      return undefined
    }
    // 공유데이터 인증정보 세팅
    global.shared.auth.status = loginStatus.userStatus
    global.shared.auth.authToken = loginStatus.authToken
    global.shared.auth.refreshToken = loginStatus.refreshToken

    // 사용자 정보 조회
    const userInfo: User = await loginService.getUserInfo(loginForm.userId)
    // 사용자 / 인증 정보 세팅
    const userAuthInfo: UserAuthInfo = {
      auth: {
        launcher: false,
        status: loginStatus.userStatus,
        authToken: loginStatus.authToken
      },
      user: userInfo
    }

    return userAuthInfo
  })
  /**
   * 사용자 등록 url
   *
   * @returns url 경로
   */
  ipcMain.handle(LOGIN_CHANNELS.userRegUrl, async (): Promise<string> => {
    return await loginService.userRegUrl()
  })
}
