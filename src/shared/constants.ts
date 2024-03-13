// 문서파일 확장자 목록
export const documentTypes: string[] = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'hwp', 'hwpx', 'pdf', 'xml']
// 압축파일 확장자 목록
// export const zipTypes: string[] = ['zip', 'tar', 'rar', '7z', '7z.0', 'alz', 'egg']
export const zipTypes: string[] = ['zip', 'tar', 'rar', '7z', '001']
// 메일파일 확장자 목록
export const attachEmailTypes: string[] = ['eml', 'msg', 'pst', 'ost', 'mbox']

/**
 * APP RESOURCE 채널
 *
 */
export const RESOURCE_CHANNELS = {
  appVersion: 'resource/get-app-version',
  check: 'resource/check',
  runSearchEngine: 'resource/run-search-engine',
  getSystemInfo: 'resource/get-system-info',
  getNetworkInfo: 'resource/get-network-info'
}

/**
 * 로그인 채널
 */
export const LOGIN_CHANNELS = {
  onlineStatus: 'login/online-status',
  login: 'login/login',
  logout: 'login/logout',
  laucherLogin: 'login/launcher-login',
  userRegUrl: 'login/user-reg-url'
}

/**
 * 공통 채널
 *
 */
export const COMMON_CHANNELS = {
  writeLogText: 'comm/write-log-text',
  existsFile: 'comm/exists-file',
  getFileSize: 'comm/get-file-size',
  getDiskFreeSpace: 'comm/get-disk-free-space',
  getFileHash: 'comm/get-file-hash',
  readHashFile: 'comm/read-hash-file',
  getFileCreationDate: 'comm/get-file-creation-date',
  writeHashFile: 'comm/write-hash-file',
  exportFiles: 'comm/export-files',
  convertEncoding: 'comm/convert-encoding',
  getConfigItem: 'comm/get-config-item',
  setConfigItem: 'comm/set-config-item',
  writeFileText: 'comm/write-file-text',
  readFileText: 'comm/read-file-text',
  readDir: 'comm/read-dir',
  setSettingInfo: 'comm/set-setting-info',
  getSettingInfo: 'comm/get-setting-info',
  /** 기본 경로 */
  getDefaultPath: 'comm/get-default-path',
  isDirectory: 'comm/is-directory',
  isFile: 'comm/is-file'
}

/**
 * 케이스 채널
 *
 */
export const CASE_CHANNELS = {
  getCases: 'case/get-cases',
  add: 'case/add',
  remove: 'case/remove',
  removeAll: 'case/remove-all',
  changeCase: 'case/change-case',
  create: 'case/create',
  startAnalysis: 'case/start-analysis',
  startSearchIndex: 'case/start-search-index',
  getEmailCount: 'case/get-email-count',
  sendAnalysisLog: 'case/send-analysis-log'
}

/**
 * 분석결과 채널
 *
 */
export const RESULTS_CHANNELS = {
  testIpcDB: 'tesults/test-ipc-db', //@viper 2023.09.19
  getEmails: 'results/get-emails',
  getEmailDetail: 'results/get-email-detail',
  exportEmails: 'results/export-emails',
  getCategoryByMailbox: 'results/get-category-by-mailbox',
  getCategoryByAttachment: 'results/get-category-by-attachment',
  getEmailCountByAttachment: 'results/get-email-count-by-attachment',
  getBookmarks: 'results/get-bookmarks',
  addTag: 'results/add-tag',
  removeTag: 'results/remove-tag',
  updateTag: 'results/update-tag',
  addBookmarks: 'results/add-bookmarks',
  removeBookmarks: 'results/remove-bookmarks',
  getExifModels: 'results/get-exif-models',
  getEmailHeaders: 'results/get-email-headers',
  getEmailCount: 'results/get-email-count'
}

/**
 * 증거이미지  채널
 *
 */
export const EVIDENCE_CHANNELS = {
  createEvidenceFile: 'evidence/create-evidence-file',
  getBookmarkEmailCount: 'evidence/get-bookmark-email-total-count',
  clearCase: 'evidence/clear-case',
  acquisitionType: 'evidence/acquisition-type',
  exportImage: 'evidence/export-image',
  exportImageState: 'evidence/export-image-state',
  getFileHash: 'evidence/get-fileHash',
  getFileHashState: 'evidence/get-fileHash-state',
  make_report1: 'evidence/make_report1',
  make_report2: 'evidence/make_report2',
  createImage: 'evidence/create-image',
  createImageState: 'evidence/create-image-state'
}

/**
 * 도구 업데이트 채널
 *
 */
export const UPDATE_CHANNELS = {
  checkUpdate: 'update/check-update',
  download: 'update/download',
  install: 'update/install'
}

/**
 * 응답 채널
 *
 */
export const REPLY_CHANNELS = {
  resource: 'reply/resource',
  analysis: 'reply/analysis',
  searchEngine: 'reply/searchEngine',
  evidence: 'reply/evidence',
  update: 'reply/update',
  report0: 'reply/report0'
}

/**
 * KapeDB 관련 Operation 채널 add 20231031
 */
export const KAPE_OP_CHANNELS = {
  readWinARTTableConfig: 'kape_op/readWinARTTableConfig', // front에서 필요한 kapeDB의 컬럼 상세 정보를 읽어 객체를 넘겨주는 채널
  creetCSVDBName: 'kape_op/creetCSVDBName',
  creetCSVDBNameState: 'kape_op/creetCSVDBNameState',
  runKAPEAnalysis: 'kape_op/runKAPEAnalysis',
  runKAPEAnalysisResult: 'kape_op/runKAPEAnalysisResult',
  setDBName: 'kape_op/setDBName',
  getDBStatus: 'kape_op/getDBStatus', // Kape DB 상태 정보 전달, 조회 Query 결과가 undefined로 나올 경우, 수행
  searchTotalTable: 'kape_op/searchTotalTable', // Kape 통합 테이블에서 검색하는 것
  searchTotalTableResult: 'kape_op/searchTotalTableResult', // Kape 통합 테이블에서 검색 결과 받는 것
  searchTotalTableFinalCountResult: 'kape_op/searchTotalTableFinalCountResult', // Kape 통합 테이블에서 검색 결과를 보내는 동시에 개수 정보를 같이 보낸다 받는 것
  searchCountTotalTable: 'kape_op/searchCountTotalTable', // Kape 통합 테이블에서 검색결과 count요청
  searchCountTotalTableResult: 'kape_op/searchCountTotalTableResult', // Kape 통합 테이블에서 검색 결과 count 결과 받는 것
  searchCategoryCountTotalTable: 'kape_op/searchCategoryCountTotalTable', // Kape 통합 테이블에서 검색결과 카테고리별 count요청
  searchCategoryCountTotalTableResult: 'kape_op/searchCategoryCountTotalTableResult', // Kape 통합 테이블에서 검색 결과  카테고리별 count 결과 받는 것
  bookMarkMapperCategory: 'kape_op/bookMarkMapperCategory', // Kape 북마크 id 별 category 데이터 참조
  bookMarkMapperCountPerBId: 'kape_op/bookMarkMapperCountPerBId', // Kape 북마크 id 별 데이터 개수 참조
  bookMarkMapperTable: 'kape_op/bookMarkMapperTable', // Kape 북마크 데이터 생성
  bookMarkMapperTableOneRow: 'kape_op/bookMarkMapperTableOneRow', // Kape 북마크 데이터 1개 생성/삭제
  bookMarkMapperChangeTableOneRow: 'kape_op/bookMarkMapperChangeTableOneRow', // Kape 북마크 데이터 1개에 대해 will_delete 값 변경하는 것, add 20240223
  bookMarkMapperTableResult: 'kape_op/bookMarkMapperTableResult', // Kape 북마크 데이터 생성 결과 받는 것
  bookMarkMapperTableRefResult: 'kape_op/bookMarkMapperTableRefResult', // Kape 북마크 데이터 참조 결과 받는 것
  bookMarkTable: 'kape_op/bookMarkTable', // Kape 북마크 테이블 관리(ADD/DEL/MOD/REF)
  CaseInfoTable: 'kape_op/CaseInfoTable', // Kape Case_Info 테이블 관리(ADD/DEL/MOD/REF)
  createTotalTimeTable_Test: 'kape_op/createTotalTimeTable_Test', // invoke로 TotalTime_Short테스트
  createSearchTable: 'kape_op/cteateSearch', // onEvent for create 명령어
  createSearchTableState: 'kape_op/cteateSearchStatus', // onEvent create 결과 수신
  readCategoryCountLevel1: 'kape_op/query6', // 북석 개요에 필요한 모든 아트팩트를 대상으로 1단계 범주에 대해 개수 정보를 주는 것
  readArtifactSystemInfo: 'kape_op/query7', // 분석 개요에 필요한 이미지 시스템 정보 주는 것
  readCategoryCount: 'kape_op/query1', // 모든 아트팩트를 대상으로 3단계 범주에 대해 개수 정보를 주는 것
  readTableContents: 'kape_op/query2', // 개별 아트팩트를 조회 하는 경우, 입력값으로 테이블 명을 주어야 함
  readTableOneContent: 'kape_op/query8', // 개별 아트팩트의 1개의 row를 조회 하는 경우(타입라인과 검색에서 상세정보 보기위해 사용하는 채널), 입력값으로 테이블 명과 _id(index)을 주어야 함
  writeTableContents: 'kape_op/query5', // 개별 아트팩트 화면에서 페이지의 내용을 json 파일로 생성하는 것
  readTimelineCategory: 'kape_op/query3', // 타임라인의 범주별 데이터 개수(depth 1)
  readTimelineContents: 'kape_op/query4', // 타임라인 테이블을 조회 하는 경우, 입력값으로 DB_TIMELINE_QUERY_INFO 객체 사용 - 입력된 pagesize만큼만 1번 결과 전달하는 것
  readOneTimeTimelineContents: 'kape_op/query9', // 타임라인 테이블을 조회 하는 경우로 한번 요청으로 전부 주는 것([중요] 쪼개서 여러번 응답하게 하는 것), count한후 루푸돌며 응답, 입력값으로 DB_TIMELINE_QUERY_INFO 객체 사용
  readOneTimeTimelineContentsResult: 'kape_op/query9Result', // 부분으로 응답하는 것
  readTimelineChartContents: 'kape_op/query10', // 20240108 : 타임라인 차트를 위한 Total_Timeline_Short 테이블을 조회 하는 경우, 입력값으로 DB_TIMELINE_QUERY_INFO 객체 사용
  readMinTimelineByTime: 'kape_op/query11', // 20240108 : 타임라인 테이블에서 특정시간으로부터 시작하여 가강 작은 t_id의 레코드를 찾아 주는 함수
  readMinTimelineByTimeRange_Cagegory: 'kape_op/query13', // 20240126 : 타임라인 테이블에서 특정시간과 범주1과 범주2 에 따른 가강 작은 t_id의 레코드를 찾아 주는 함수
  readRangeTimelineByTId: 'kape_op/query12', // 20240108 : 타임라인 테이블에서 유효한 시간에서 가장작은 t_id와 가장 큰 t_id를 주는 함수
  readTimelineContentsResult: 'kape_op/query4Result', // 타임라인 테이블을 조회 하고 응답하는 채널
  createReadTimelineChartContents: 'kape_op/query14', // 20240205 : 타임라인 테이블에서 특정 조건의 chart를 보기위해서 호출( 특정테이블 생성하고 조회 수행함)
  createReadTimelineChartContentsResult: 'kape_op/query14Result', // 20240205 : 타임라인 테이블에서 특정 조건의 chart에  대한 응답
  readTempMinTimelineByRange_Category: 'kape_op/query15', // 20240205 : 타임라인 차트에서 특정 point의 선택을 할때, 임시적인 페이지정보를 위한 temp_t_id 정보 바로 주는 것, Total_Timeline_GotoInfo 테이블 조회하는 것
  readTimelineChartContentsResult: 'kape_op/query10Result', // 타임라인 차트를 위한 Total_Timeline_Short 테이블을 조회, 한번 요청으로 전부 주는 것에 대한 응답
  readTimelineContentsCount: 'kape_op/query5', // 타임라인 테이블을 조회에 대한 개수정보 전달용, 입력값으로 DB_TIMELINE_QUERY_INFO 객체 사용
  readTimelineContentsCountResult: 'kape_op/query5Result', // 타임라인 테이블을 개수 정보 조회 하고 응답하는 채널
  makeCSVTableFile: 'kape_op/makeCSVTableFile', // 선택된 테이블 CSV로 생성
  makeCSVTableFileResult: 'kape_op/makeCSVTableFileResult', // 선택된 테이블 CSV생성 결과
  createSelectImage: 'kape_op/createSelectImage', // 선별이미지 생성 msg
  createSelectImageResult: 'kape_op/createSelectImageResult', // 선별이미지 생성 결과
  changeSelectReport: 'kape_op/changeSelectReport', // 선별이미지 리포트 내용 수정 (invoke)
  createSelectReportResult: 'kape_op/createSelectReportResult' // 선별이미지 리포트 생성 폴더 전달
}

/**
 * 문서 생성
 *
 */
export const REPORT_CHANNELS = {
  /** 현장조사 확인서 */
  make_report1: 'report/make_report1',
  /** 참관여부 확인서 */
  make_report2: 'report/make_report2',
  /** 전자 정보 문서 FileInfo 추가 */
  addCSVFileInfo: 'report/add_csv_fileinfo'
}
