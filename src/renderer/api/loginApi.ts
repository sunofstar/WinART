import { LOGIN_CHANNELS } from '@share/constants'
import { LoginForm, USER_STATUS, UserAuthInfo } from '@share/models'

/**
 * 도구런처 로그인
 *
 * @returns 사용자/인증 정보
 */
const launcherLogin = async (): Promise<UserAuthInfo | undefined> => {
  return ipcRenderer?.invoke(LOGIN_CHANNELS.laucherLogin)
}

/**
 * 온라인 상태 확인
 *
 * @returns 온라인 상태
 */
const onlineStatus = async (): Promise<USER_STATUS> => {
  await console.log('onlineStatus')
  return ipcRenderer?.invoke(LOGIN_CHANNELS.onlineStatus)
}

/**
 * 로그인
 *
 * @param loginForm 로그인 입력정보
 * @returns 로그인 상태
 */
const login = async (loginForm: LoginForm): Promise<UserAuthInfo | undefined> => {
  return ipcRenderer?.invoke(LOGIN_CHANNELS.login, loginForm)
}

/**
 * 로그아웃
 *
 * @param authToken 온라인 인증토큰
 */
const logout = async (): Promise<void> => {
  return ipcRenderer?.invoke(LOGIN_CHANNELS.logout)
}

/**
 * 사용자 등록 URL
 *
 * @returns url 걍로
 */
const userRegUrl = async (): Promise<string> => {
  return window.ipcRenderer.invoke(LOGIN_CHANNELS.userRegUrl)
}

export default { launcherLogin, onlineStatus, login, logout, userRegUrl }
