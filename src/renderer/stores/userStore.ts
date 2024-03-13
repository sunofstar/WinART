import { defineStore } from 'pinia'
import { User, USER_STATUS, SettingInfo } from '@share/models'

/**
 * 사용자 정보 스토어
 *
 */
export const useUserStore = defineStore('userStore', {
  state: () => ({
    /** 사용자 정보 */
    user: undefined as User | undefined,
    /** 인증 상태 */
    userStatus: undefined as USER_STATUS | undefined,
    /** 도구런처 인증 여부 */
    launcherAuth: false,
    /** 사용자 설정 및 기본 경로 */
    settingInfo: undefined as SettingInfo | undefined
  }),
  getters: {
    // 로그인 여부 반환
    isLogin: (state) => !!state.user && !!state.user.id
  },
  actions: {
    /**
     * 사용자 정보 세팅
     *
     * @param payload 사용자정보
     */
    setUser(payload?: User): void {
      this.user = payload
    },
    /**
     * 사용자 인증상태 세팅
     *
     * @param payload 인증상태
     */
    setUserStatus(payload?: USER_STATUS): void {
      this.userStatus = payload
    },
    /**
     * 도구런처 인증 여부
     *
     * @param payload 인증여부
     */
    setLauncherAuth(payload: boolean): void {
      this.launcherAuth = payload
    },
    setSettingInfo(payload?: SettingInfo): void {
      this.settingInfo = payload
    }
  }
})
