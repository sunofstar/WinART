import { TriageCaseInfo, HashVal } from '@share/models'
import { defineStore } from 'pinia'

/**
 * 트리아제 케이스 스토어(import한 케이스 정보)
 *
 */
export const useTriageCaseStore = defineStore('triageCaseStore', {
  state: () => ({
    /** 트리아제 케이스 상세정보 */
    triageCaseDetail: undefined as TriageCaseInfo | undefined,
    /** 트리아제 케이스 해시값 파일 상세정보 */
    triageCaseHashFileInfo: undefined as {} | undefined,
    /** 트리아제 케이스를 불러온 실제 경로 정보 */
    triageCasePath: undefined as string | undefined,
    /** 트리아제 Export 디렉토리 존재 여부 */
    triageDirectory: undefined as string | undefined,
    /** 트리아제 Image 파일 존재 여부 */
    triageImageType: undefined as 'aff4' | 'deph' | undefined,
    triageImagePath: undefined as string | undefined
  }),
  getters: {
    /** 트리아제 케이스 해시값 생성 파일 정보(파일명, 해시값) */
    triageCaseHashFile: (state) => {
      return {
        fileName: state.triageCaseHashFileInfo?.FileInfo.fileName || '',
        hash: {
          md5: state.triageCaseHashFileInfo?.FileInfo.MD5HashValue || '',
          sha1: state.triageCaseHashFileInfo?.FileInfo.SHA1HashValue || ''
        },
        version: state.triageCaseHashFileInfo?.Version.WinTriageVersion || '',
        fileSize: state.triageCaseHashFileInfo?.FileInfo.fileSize || ''
      }
    },
    /** 트리아제 케이스 파일명(확장자X) */
    triageCaseFileName: (state) => 'triage_' + state.triageCaseDetail?.caseName + '_' + state.triageCaseDetail?.imgNum
  },
  actions: {
    /**
     * 트리아제 케이스 정보 세팅
     *
     * @param payload 케이스 목록
     */
    setTriageCaseDetail(payload?: TriageCaseInfo | undefined): void {
      this.triageCaseDetail = payload
    },
    /**
     * 트리아제 케이스 해시값 파일 상세정보 세팅
     *
     * @param payload 케이스 폴더 경로
     *
     */
    setTriageCaseHashFileInfo(payload?: {} | undefined): void {
      this.triageCaseHashFileInfo = payload
    },
    /**
     * 트리아제 케이스를 불러온 실제 경로 정보
     *
     * @param payload 실제 경로
     *
     */
    setTriageCasePath(payload?: string | undefined): void {
      this.triageCasePath = payload
    },
    /**
     * 트리아제 디렉토리 경로
     *
     * @param payload 디렉토리 경로
     *
     */
    setTriageDirectory(payload?: string | undefined): void {
      this.triageDirectory = payload
    },
    /**
     * 트리아제 Image 파일 존재 여부
     *
     * @param payload 'aff4' | 'deph' | undefined
     *
     */
    setTriageImageType(payload?: 'aff4' | 'deph' | undefined): void {
      this.triageImageType = payload
    },
    /**
     * 트리아제 Image 파일 경로
     *
     * @param payload string
     *
     */
    setTriageImagePath(payload?: string | undefined): void {
      this.triageImagePath = payload
    }
  }
})
