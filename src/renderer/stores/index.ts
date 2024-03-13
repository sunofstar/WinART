import { useUserStore } from './userStore'
import { useCaseStore } from './caseStore'
import { useSystemStore } from './systemStore'
import { useTriageCaseStore } from './triageCaseStore'

/**
 * 전체 스토어 정보를 초기화
 *
 */
export function useStoreReset(): void {
  useStoreResetExceptSystem()
  const systemStore = useSystemStore()
  systemStore.$reset()
}

/**
 * 스토어 정보 초기화 (시스템정보 제외)
 *
 */
export function useStoreResetExceptSystem(): void {
  useStoreResetExceptUserSystem()
  const userStore = useUserStore()
  userStore.$reset()
}

/**
 * 스토어 정보 초기화 (사용자, 시스템 제외)
 *
 */
export function useStoreResetExceptUserSystem(): void {
  const caseStore = useCaseStore()
  caseStore.$reset()
}

/**
 * 케이스 스토어 정보 초기화 (사용자, 시스템 제외 // 트리아제, 윈아트 케이스 정보)
 *
 */
export function useStoreResetExceptUserandSystem(): void {
  const caseStore = useCaseStore()
  const triageCaseStore = useTriageCaseStore()
  caseStore.$reset()
  triageCaseStore.$reset()
}
