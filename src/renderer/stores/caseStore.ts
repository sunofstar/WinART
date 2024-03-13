import {
  _SEARCH_OPTION,
  CaseInfo,
  DB_BOOKMARK_INFO_ITEM,
  DB_BOOKMARK_MAPPER_INFO,
  DB_QUERY_PARAM,
  DB_TIMELINE_QUERY_INFO,
  OverviewSystemInfo,
  OverviewArtifactsInfo
} from '@share/models'
import { defineStore } from 'pinia'
import bookmarkApi from '@renderer/api/bookmarkApi'
import timelineApi from '../api/timelineApi'
import searchApi from '../api/searchApi'
import { getParentFolder } from '@renderer/utils/utils'

/**
 * 케이스 스토어
 *
 */
export const useCaseStore = defineStore('caseStore', {
  state: () => ({
    /** 케이스 목록 */
    caseArrayData: [] as CaseInfo[],
    caseBookmarkGroupList: [] as DB_BOOKMARK_INFO_ITEM[],
    caseSetPath: '',
    /** dbPath */
    dbSetPath: '' as string,
    initialCasePath: '' as string,
    evidenceImagePath: '' as string,
    /*************************** */
    /** 20240112 FE 백지연, 분석 개요 시스템 정보추가 */
    /** 분석 개요 1) 시스템 정보 */
    overviewSystem: undefined as OverviewSystemInfo,
    /** 분석 개요 2) 아티팩트 분석 정보 */
    overviewArtifacts: undefined as OverviewArtifactsInfo,
    /*************************** */
    /** 20240118 FE 백지연, current 북마크 정보 추가 */
    currentBookmark: [] as DB_BOOKMARK_INFO_ITEM[],
    /*************************** */
    /** 20240122 FE 백지연, 페이지 제어 정보 추가 */
    firstRenderForAnalysisDialog: false as Boolean,
    hasAnalysisError: false as Boolean,
    hasEvidenceError: false as Boolean,
    startAnalysisFlag: true as Boolean,
    homeIndicatorFlag: true as Boolean,
    currentIndexPage: 1 as Number,
    cancledAnalysis: false as Boolean,
    /*************************** */
    /** 20240220 FE 백지연, 검색 정보 추가  */
    currentSearchParams: {} as _SEARCH_OPTION,
    /*************************** */
    // 20240228 SearchDialog -> getSearchTotalTable API 진입할 수 있도록 허용/비허용(true/false)
    isSearchDialogPermission: true as Boolean
  }),
  getters: {
    // 나중에 케이스를 다중으로 관리할 수도 있을까 싶어... 그전까지 0번 배열만 사용
    caseDetail: (state) => state.caseArrayData[0],
    bookmark: (state) => state.caseBookmarkGroupList,
    path: (state) => state.caseSetPath,
    dbPath: (state) => state.dbSetPath,
    evdenceImageParentPath: (state) => getParentFolder(state.evidenceImagePath),
    /** 20240018 FE 백지연, default 북마크 정보 추가 */
    defaultBookmarkItem: (state) => state.caseBookmarkGroupList[0],
    currentBookmarkItem: (state) => state.currentBookmark,
    currentPage: (state) =>
      state.currentIndexPage === 1 ? 'firstPage' : state.currentIndexPage === 2 ? 'secondPage' : null,
    currentSearchParam: (state) => state.currentSearchParams
  },
  actions: {
    /**
     * 케이스 목록 세팅
     * @param caseInfo 케이스 목록
     */
    setCaseDetail(caseInfo: CaseInfo[]): void {
      // 나중에 케이스를 다중으로 관리할 수도 있을까 싶어... 그전까지 0번 배열만 사용
      if (this.caseArrayData.length > 0) {
        this.caseArrayData.splice(0, this.caseArrayData.length, caseInfo)
      } else {
        this.caseArrayData.push(caseInfo)
      }
    },

    /**
     * 분석 개요 시스템 정보 세팅
     *
     * @param payload 분석 개요 시스템 정보
     */
    setOverviewSystem(payload: string): void {
      this.overviewSystem = payload
    },
    /**
     * 분석 개요 아티팩트 분석 정보 세팅
     *
     * @param payload 분석 개요 아티팩트 분석 정보
     */
    setOverviewArtifacts(payload: string): void {
      this.overviewArtifacts = payload
    },
    /**
     * 최초 렌더링 정보 세팅
     *
     * @param payload 최초 렌더링 정보
     */
    setFirstRenderForAnalysisDialog(payload: Boolean): void {
      this.firstRenderForAnalysisDialog = payload
    },
    /**
     *
     * @param payload hasError
     */
    setHasAnalysisError(payload: Boolean): void {
      this.hasAnalysisError = payload
    },
    /**
     *
     * @param payload hasError
     */
    setHasEvidenceError(payload: Boolean): void {
      this.hasEvidenceError = payload
    },
    /**
     *
     * @param payload startAnalysisFlag
     */
    setStartAnalysisFlag(payload: Boolean): void {
      this.startAnalysisFlag = payload
    },
    /**
     *
     * @param payload 홈 인디케이터
     */
    setHomeIndicatorFlag(payload: Boolean): void {
      this.homeIndicatorFlag = payload
    },
    /**
     *
     * @param payload 현재 index 페이지
     */
    setCurrentIndexPage(payload: Number): void {
      this.currentIndexPage = payload
    },
    /**
     *
     * @param payload 분석 취소 플래그
     */
    setCancledAnalysis(payload: Boolean): void {
      this.cancledAnalysis = payload
    },
    /**
     *
     * @param payload 검색 정보
     */
    setCurrentSearchParams(payload: _SEARCH_OPTION): void {
      this.currentSearchParams = payload
    },
    /**
     * 현재 선택된 북마크 정보 세팅
     *
     * @param payload 현재 북마크 정보
     */
    setCurrentBookmarkItem(payload: DB_BOOKMARK_INFO_ITEM): void {
      this.currentBookmark = payload
    },
    /**
     * 케이스 대상 경로 저장
     * @param payload 케이스 목록
     */
    setPath(path: string): void {
      this.caseSetPath = path !== undefined && path !== '' ? path : ''
    },

    /**
     * 세팅된 DB 경로 저장
     * @param payload db 경로
     */
    setDbSetPath(payload: string): void {
      this.dbSetPath = payload
    },

    /**
     * 증거이미지 생성된path 저장
     * @param payload 증거이미지 path
     */
    setEvidenceImagePath(payload: string): void {
      this.evidenceImagePath = payload
    },

    /**
     * 불러오기 케이스 경로 저장
     * @param payload 케이스 경로
     */
    setInitialCasePath(payload: string): void {
      this.initialCasePath = payload !== undefined && payload !== '' ? payload : ''
    },
    /**
     * 20240228 SearchDialog -> 통합검색 허용 가능 여부 저장
     * @param payload 통합검색 허용 여부(true/false)
     */
    setSearchDialogPermisson(payload: boolean): void {
      this.isSearchDialogPermission = payload
    },
    /**
     * 북마크 Dialog용 카테고리 목록 조회
     */
    async getBookmarkCategoryList(B_Id: number): Promise<[]> {
      if (!Number.isNaN(B_Id)) {
        const result = await bookmarkApi.getBookmarkCategoryList(B_Id)
        return result
      }
      return false
    },
    /**
     * 케이스 별 북마크 목록 가져오기
     */
    async getBookmarkGroupList(): Promise<void> {
      const bookmarkListArray = await bookmarkApi.getBookmarkGroupList()

      if (Array.isArray(bookmarkListArray)) {
        this.caseBookmarkGroupList = [...bookmarkListArray]
      } else {
        this.caseBookmarkGroupList = []
      }
    },

    /**
     * 북마크 그룹 신규 등록
     */
    async addBookmarkGroup(bookmarkItem: DB_BOOKMARK_INFO_ITEM): Promise<boolean> {
      if (bookmarkItem !== undefined || bookmarkItem !== null) {
        const result = await bookmarkApi.modifyBookmarkInfo(bookmarkItem, 'ADD')

        return result ? true : false
      }

      return false
    },

    /**
     * 북마크 그룹 수정하기
     */
    async modifyBookmarkGroup(bookmarkItem: DB_BOOKMARK_INFO_ITEM): Promise<boolean> {
      if (bookmarkItem !== undefined || bookmarkItem !== null) {
        const result = await bookmarkApi.modifyBookmarkInfo(bookmarkItem, 'MOD')

        return result ? true : false
      }

      return false
    },

    /**
     * 북마크 그룹 삭제하기
     */
    async deleteBookmarkGroup(bookmarkItem: DB_BOOKMARK_INFO_ITEM): Promise<boolean> {
      if (bookmarkItem !== undefined || bookmarkItem !== null) {
        const result = await bookmarkApi.modifyBookmarkInfo(bookmarkItem, 'DEL')

        return result ? true : false
      }

      return false
    },

    /**
     * 북마크에 아티팩트 데이터 신규 등록
     * DB_BOOKMARK_MAPPER_INFO = {
     *   _id: 2,    // b_id
     *   _tableName: 'Activity',
     *   _tableIdx: 10,   // a_id
     *   _category_1: 'FileFolderAccess',
     *   _category_2: '윈도우타임라인',
     *   _category_3: 'Activity'
     * }
     * @param bookmarkItems {DB_BOOKMARK_INFO_ITEM[]}
     */
    async addBookmark(bookmarkItems: DB_BOOKMARK_MAPPER_INFO[]): Promise<any> {
      if (
        bookmarkItems !== undefined ||
        bookmarkItems !== null ||
        (Array.isArray(bookmarkItems) && bookmarkItems.length > 0)
      ) {
        const result = await bookmarkApi.addBookmarkItem(bookmarkItems, this.caseSetPath, 'ADD')

        return result
      }

      return false
    },
    /**
     * 북마크 신규 등록
     */
    async addBookmarkOne(bookmarkItems: DB_BOOKMARK_MAPPER_INFO[]): Promise<any> {
      if (
        bookmarkItems !== undefined ||
        bookmarkItems !== null ||
        (Array.isArray(bookmarkItems) && bookmarkItems.length > 0)
      ) {
        const result = await bookmarkApi.addBookmarkOneItem(bookmarkItems, this.caseSetPath, 'ADD')

        return result
      }

      return false
    },

    /**
     * 북마크 삭제
     */
    async deleteBookmarkOne(bookmarkItems: DB_BOOKMARK_MAPPER_INFO[]): Promise<any> {
      if (
        bookmarkItems !== undefined ||
        bookmarkItems !== null ||
        (Array.isArray(bookmarkItems) && bookmarkItems.length > 0)
      ) {
        const result = await bookmarkApi.addBookmarkOneItem(bookmarkItems, this.caseSetPath, 'DEL')

        return result
      }

      return false
    },

    /**
     * 북마크 신규 삭제
     */
    async deleteBookmark(bookmarkItems: DB_BOOKMARK_MAPPER_INFO[]): Promise<any> {
      if (
        bookmarkItems !== undefined ||
        bookmarkItems !== null ||
        (Array.isArray(bookmarkItems) && bookmarkItems.length > 0)
      ) {
        const result = await bookmarkApi.addBookmarkItem(bookmarkItems, this.caseSetPath, 'DEL')

        return result
      }

      return false
    },

    /**
     * 개별 북마크 will_delete 0 변경
     */
    async willAddBookmarkOne(bookmarkItems: DB_BOOKMARK_MAPPER_INFO[]): Promise<any> {
      if (
        bookmarkItems !== undefined ||
        bookmarkItems !== null ||
        (Array.isArray(bookmarkItems) && bookmarkItems.length > 0)
      ) {
        const result = await bookmarkApi.willAddBookmarkOneItem(bookmarkItems, this.caseSetPath, 'ADD')

        return result
      }

      return false
    }, 

    
    /**
     * 개별 북마크 will_delete 1 변경
     */
    async willDeleteBookmarkOne(bookmarkItems: DB_BOOKMARK_MAPPER_INFO[]): Promise<any> {
      if (
        bookmarkItems !== undefined ||
        bookmarkItems !== null ||
        (Array.isArray(bookmarkItems) && bookmarkItems.length > 0)
      ) {
        const result = await bookmarkApi.willAddBookmarkOneItem(bookmarkItems, this.caseSetPath, 'DEL')

        return result
      }

      return false
    },

    /**
     * 전체 북마크 will_delete 상태 변경
     */
    async willDelChangeBookmark(bookmarkItems: DB_BOOKMARK_MAPPER_INFO[]): Promise<any> {
      if (
        bookmarkItems !== undefined ||
        bookmarkItems !== null ||
        (Array.isArray(bookmarkItems) && bookmarkItems.length > 0)
      ) {
        const result = await bookmarkApi.addBookmarkItem(bookmarkItems, this.caseSetPath, 'WILL_DEL_CHANGE')

        return result
      }

      return false
    },

    /**
     * 북마크 will_delete 상태 적용
     */
    async willDelDoneBookmark(bookmarkItems: DB_BOOKMARK_MAPPER_INFO[]): Promise<any> {
      if (
        bookmarkItems !== undefined ||
        bookmarkItems !== null ||
        (Array.isArray(bookmarkItems) && bookmarkItems.length > 0)
      ) {
        const result = await bookmarkApi.addBookmarkItem(bookmarkItems, this.caseSetPath, 'WILL_DEL_DONE')

        return result
      }

      return false
    },

    /**
     * 북마크 별 데이터 조회
     */
    async getRowDataByBookmarkGroup(bookmarkItems: DB_BOOKMARK_MAPPER_INFO[]): Promise<any> {
      if (
        bookmarkItems !== undefined ||
        bookmarkItems !== null ||
        (Array.isArray(bookmarkItems) && bookmarkItems.length > 0)
      ) {
        // const casePath = `${this.caseSetPath}\\DB\\kapedb.db`
        const result = await bookmarkApi.getRowDataByBookmarkGroup(bookmarkItems, this.dbPath)

        return result
      }

      return false
    },

    /**
     * 타임라인 데이터 전체 개수 조회
     */
    async getTimelineDataCount(param: DB_TIMELINE_QUERY_INFO): Promise<boolean> {
      if (param !== undefined || param !== null || Object.keys(param).length > 0) {
        // const casePath = `${this.caseSetPath}\\DB\\kapedb.db`
        const result = timelineApi.getTimelineDataCount(param, this.dbPath)
        return result
      }
      return false
    },

    /**
     * 타임라인 차트용 전체 데이터 조회
     */
    async getTimelineChartData(param: DB_TIMELINE_QUERY_INFO): Promise<boolean> {
      if (param !== undefined || param !== null || Object.keys(param).length > 0) {
        // const casePath = `${this.caseSetPath}\\DB\\kapedb.db`
        const result = timelineApi.getTimelineChartData(param, this.dbPath)
        return result
      }
      return false
    },

    /**
     * 타임라인 데이터 조회
     */
    async getTimelineData(param: DB_TIMELINE_QUERY_INFO): Promise<boolean> {
      if (param !== undefined || param !== null || Object.keys(param).length > 0) {
        // const casePath = `${this.caseSetPath}\\DB\\kapedb.db`
        const result = timelineApi.getTimelineData(param, this.dbPath)
        return result
      }
      return false
    },

    /**
     * 타임라인 차트용 상세검색 데이터 조회
     */
    async getTimelineDetailChartData(param: DB_TIMELINE_QUERY_INFO): Promise<boolean> {
      if (param !== undefined || param !== null || Object.keys(param).length > 0) {
        // const casePath = `${this.caseSetPath}\\DB\\kapedb.db`
        const result = timelineApi.getTimelineDetailChartData(param, this.dbPath)
        return result
      }
      return false
    },

    /**
     * 타임라인 선택 row 상세 데이터 조회
     */
    async getTimelineSelectedRowData(param: DB_QUERY_PARAM): Promise<[]> {
      if (param !== undefined || param !== null || Object.keys(param).length > 0) {
        const result = timelineApi.getTimelineDetailData(param)
        return result
      }
      return false
    },

    /**
     * 전체 아티팩트 검색
     */
    async getSearchTotalTable(param: _SEARCH_OPTION): Promise<void> {
      if (param !== undefined || param !== null || Object.keys(param).length > 0) {
        // 20240228 SearchDialog -> 키워드 변경후 검색시 두번 검색하는 것을 방지하기 위한 검색 허용 여부 확인
        if(this.isSearchDialogPermission){
          const result = searchApi.getSearchTotalTable(param, this.dbPath)
          this.isSearchDialogPermission = false
          return result
        }
        return false
      }
      return false
    }
  }
})
