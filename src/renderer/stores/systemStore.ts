import { NetworkInfo, SystemInfo } from '@share/models'
import { defineStore } from 'pinia'

/**
 * 시스템 정보 스토어
 *
 */
export const useSystemStore = defineStore('systemStore', {
  state: () => ({
    /** 시스템 정보 */
    system: undefined as SystemInfo | undefined,
    /** 네트워크 정보 */
    network: undefined as NetworkInfo | undefined,
    /** 구동자원 로딩 여부 */
    loaded: false as boolean,
    /** 앱 버전 */
    appVersion: '' as string
  }),
  actions: {
    /**
     * 시스템 정보 세팅
     *
     * @param payload 사용자정보
     */
    setSystem(payload?: SystemInfo): void {
      this.system = payload
    },
    /**
     * 네트워크 정보 세팅
     *
     * @param payload 사용자정보
     */
    setNetwork(payload?: NetworkInfo): void {
      this.network = payload
    },
    /**
     * 구동자원 로딩 여부
     *
     * @param payload 로딩여부
     */
    setLoaded(payload: boolean): void {
      this.loaded = payload
    },
    /**
     * 앱 버전 세팅
     *
     * @param payload 버전정보
     */
    setAppVersion(payload: string): void {
      this.appVersion = payload
    }
  }
})
