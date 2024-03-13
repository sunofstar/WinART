import net from 'net'

/**
 * 해시값 정보
 *
 */
export interface HashVal {
  /** MD5 해시값 */
  md5: string
  /** SHA1 해시값 */
  sha1: string
  /** SHA256 해시값 */
  //sha256: string
}

/**
 * 해시값 생성 정보
 *
 */
export interface HashState {
  /** 진행 상태 */
  state: string
  /** 진행율  */
  percent: number
  /** 해시값 */
  hash: HashVal
}

/**
 * text file 저장
 */
export interface TextFile {
  /** 파일 경로 */
  filePath: string
  /** 해시값 정보 */
  text: string
}

/**
 * 해시값 파일을 생성을 위한 정보
 *
 */
export interface HashFile {
  /** 파일 경로 */
  filePath: string
  /** 해시값 정보 */
  hash: HashVal
}

/**
 * 파일 복사 정보
 *
 */
export interface CopyFile {
  sourceFilePath: string
  targetFilePath: string
}

/**
 * 텍스트 인코딩 변환 정보
 *
 */
export interface ConvertEncoding {
  /** 내용 */
  content: string
  /** 인코딩 */
  encoding: string
}

/** eFA 설정키 */
export type CONFIG_KEY = 'savedId'
/**
 * EFA 설정 아이템
 */
export interface ConfigItem {
  /** 설정키 */
  key: CONFIG_KEY
  /** 설정값 */
  val?: any
}

/** 사용자 상태 */
export type USER_STATUS = 'online' | 'offline' | 'offline_auth' | 'offline_auth_required'

/**
 * 사용자 정보
 *
 * @interface User
 */
export interface User {
  /** 아이디 */
  id: string
  /** 이름 */
  name: string
  /** 직급 */
  rank?: string
  /** 부서 */
  department?: string
  /** 기관 */
  office?: string
}
/**
 * 트리아제 케이스 정보
 *
 * @interface TriageCaseInfo
 */
export interface TriageCaseInfo {
  /** 식별 아이디 */
  id: number
  /** WinTriage */
  type: string
  /** 버전 */
  version: string
  /** --- 압수자 정보 */
  /** 압수자 소속기관 */
  analystOffice: string
  /** 압수자 소속부서 */
  analystDept: string
  /** 압수자 이름 */
  analystName: string
  /** 압수자 직급 */
  analystRank: string
  /** --- 압수 정보 */
  /** 사건번호 */
  caseName: string
  /** 증거번호 */
  imgNum: string
  /** 저장경로 */
  caseFolder: string
  /** 장소 */
  confiscatedPlace: string
  /** 시스템 시간 */
  systemDatetime: string
  /** 실제 시간 */
  realDatetime: string
  /** 비고 */
  remarks?: string
  /** 피압수자명 */
  confiscatedName: string
  /** 직급 */
  confiscatedRank: string
  /** 소유유형 */
  confiscatedType: string
}

/**
 * 아트 케이스 정보
 *
 * @interface CaseInfo
 */
export interface CaseInfo {
  /** 식별 아이디 */
  id: string
  /** WinART */
  type: string
  /** 버전 */
  version: string
  /** 케이스 이름 */
  caseName: string
  /** 케이스 폴더 경로 */
  caseFolder: string
  /** 케이스 생성일시 */
  caseRegDate: string
  /** 분석관 소속기관 */
  analystAgency: string
  /** 분석관 소속부서 */
  analystDepartment: string
  /** 분석관 이름 */
  analystName: string
  /** 분석관 직급 */
  analystRank: string
}

/**
 * 증거이미지 케이스 정보
 *
 * @interface EvidenceCaseInfo
 */
export interface EvidenceCaseInfo {
  [x: string]: any
  value: any
  /** 식별 아이디 */
  id: string
  /** EvidenceSelect */
  type: string
  /** 증거이미지 파일명 */
  evidenceImgfileName: string
  /** 증거이미지 타입 */
  evidenceImgType: string
  /** 증거이미지 선택폴더 */
  evidenceCaseFolder: string
  /** 증거이미지 획득일시 */
  acquisitionDate: string
  /** 증거이미지 획득장소 */
  acquisitionLocation: string
  /** 압수자 소속청 */
  analystAgency: string
  /** 압수자 소속 */
  analystDepartment: string
  /** 압수자 이름 */
  analystName: string
  /** 압수자 직급 */
  analystRank: string
  /** 피압수자 이름 */
  confiscatedName: string
  /** 피압수자 소속 */
  confiscatedAgency: string
  /** 피압수자 직급 */
  confiscatedRank: string
  /** 피압수자 연락처 */
  confiscatedNumber: string
  /** 분석 일시 */
  analysisDate: string
  /** 분석 장소 */
  analysisLocation: string
}

export interface ArtCaseInfo extends CaseInfo {
  /** 원본 데이터 경로 */
  sourceDataPath: string
  /** 원본 데이터 사이즈 (bytes) */
  sourceDataSize?: number
}
/**
 * 삭제 대상 케이스 정보
 *
 */
export interface RemoveCase extends CaseInfo {
  /** 현재 케이스 여부 */
  currentCase: boolean
}

/**
 * 분석 시간 정보
 *
 */
export interface AnalysisTime {
  /** 시작 시간 (ms) */
  startTime?: number
  /** 종료 시간 (ms) */
  endTime?: number
}

/**
 * 북마크 태그
 *
 * @interface Tag
 */
export interface Tag {
  /** 아이디 */
  id: number
  /** 이름 */
  name: string
  /** 색깔 */
  color?: string
}

/**
 * 북마크 정보
 *
 * @interface Bookmark
 */
export interface Bookmark extends Tag {
  /** 북마크 건수 */
  count: number
}

/**
 * 북마크 추가/삭제를 위한 북마크 목록
 */
export interface BookmarkList {
  /** 북마크 태그 아이디 */
  tagId: number
  /** 이메일 UUID 목록 */
  emails: string[]
}

/** 카테고리 타입 */
export type CategoryType = 'tree' | 'attachment' | 'bookmark' | 'search'

export interface CategoryCountInfo {
  Category_1: string
  Category_2: string
  Category_3: string
  count: number
}

/**
 * 트리 노드 (카테고리 선택)
 *
 */
export interface TreeNode {
  /** 표시 레이블 */
  label: string
  /** 제목 */
  header: string
  /** 건수 */
  count?: number
  /** 아이콘 이미지 */
  icon: string
  /** 마지막으로 수정된 일시 */
  date?: string
  /** 하위노드 목록 */
  children?: TreeNode[]
}

/** 첨부파일 타입 (문서, 사진, 멀티미디어, 압축파일, 이메일첨부, 암호화파일, 스캐너생산문서(PDF), 미지원파일)  */
export type AttachmentType =
  | 'document'
  | 'photo'
  | 'media'
  | 'zip'
  | 'attachedemail'
  | 'encryptedfile'
  | 'scanpdf'
  | 'unknown'
/** 첨부파일 서브타입 (문서: DOC, XLS, PPT, HWP, PDF, 기타 암호화: 암호설정파일, DRM파일) */
export type AttachmentSubType = 'doc' | 'xls' | 'ppt' | 'hwp' | 'pdf' | 'etc' | 'encrypted' | 'drm'

// 첨부파일 파일 타입/서브타입 이름
export const attachmentTypeNames: Record<string, string> = {
  document: '문서',
  document_doc: 'DOC',
  document_xls: 'XLS',
  document_ppt: 'PPT',
  document_hwp: 'HWP',
  document_pdf: 'PDF',
  document_etc: '기타',
  photo: '사진',
  media: '멀티미디어',
  zip: '압축파일',
  attachedemail: '첨부된 이메일',
  encryptedfile: '암호화 파일',
  encryptedfile_encrypted: '암호설정 파일',
  encryptedfile_drm: 'DRM',
  scanpdf: '스캐너 생산문서(PDF)',
  unknown: '미지원 파일'
}

/**
 * 첨부파일 카테고리 기본속성
 *
 */
export interface AttachmentTypeBase {
  /** 첨부파일 타입 */
  type: AttachmentType
  /** 첨부파일 서브타입 */
  subType?: AttachmentSubType
  /** 제목 */
  title?: string
  /** 건수 */
  count?: number
}

/**
 * 첨부파일 카테고리 아이템
 *
 */
export interface AttachmentTypeItem extends AttachmentTypeBase {
  /** 서브타입 목록 */
  subItems?: AttachmentTypeBase[]
}

/**
 * 정렬 정보
 *
 */
export interface Sort {
  /** 정렬 컬럼명 */
  sortBy: string
  /** 내림차순 정렬 여부 */
  descending: boolean
}

/**
 * 페이지 정보
 *
 */
export interface Page {
  /** 시작 offset */
  startOffset: number
  /** 조회 건수 */
  limit: number
}

/**
 * 통합검색 조회조건
 *
 */
export interface SearchConditons {
  /** 검색타입*/
  searchType?: 'keyword' | 'detail'
  /** 검색 시작일 */
  fromDate?: string
  /** 검색 종료일 */
  toDate?: string
  /** 발신 계정 목록 */
  fromAccounts?: string[]
  /** 수신 계정 목록 */
  toAccounts?: string[]
  /** 제외 계정 목록 */
  excludeAccounts?: string[]
  /** 계정 동작 방식 (AND / OR) */
  accountOperation?: string
  /** 키워드 목록 */
  keywords: string[]
  /** 제외키워드 목록 */
  excludeKeywords?: string[]
  /** 패턴 검색 목록 */
  patternSearch?: string[]
  /** EXIF 모델 */
  exifModel?: string
}

/**
 * 첨부파일 조회조건
 *
 */
export interface AttachmentConditons {
  /** 첨부파일 존재 여부 (첨부파일 카테고리) */
  hasAttachment?: boolean
  /** 첨부파일 타입 (첨부파일 카테고리) */
  attachmentType?: AttachmentType
  /** 첨부파일 서브타입 (첨부파일 카테고리) */
  attachmentSubType?: AttachmentSubType
}

/**
 * 이메일 카테고리 선택 정보
 *
 */
export interface EmailCategory {
  /** 카테고리 */
  category: CategoryType
  /** 조회조건 */
  condition: number | string | AttachmentConditons | SearchConditons
}

/**
 * 이메일 조회 조건
 *
 */
export interface EmailConditions extends EmailCategory {
  /** 정렬 */
  sort?: Sort
  /** 페이지 정보 */
  page?: Page
}

/**
 * 목록 헤더
 *
 */
export interface ListHeader {
  /** 타이틀 */
  title: string
  /** 건수  */
  count?: number
}

/**
 * 이메일 아이템
 *
 */
export interface Email {
  /** 아이디 */
  emailId: number
  /** UUID */
  emailUuid: string
  /** 경로 UUID */
  pathUuid: string
  /** 원본파일명 */
  originalFileName?: string | null
  /** 실제파일경로 */
  realFilePath?: string | null
  /** 파일형식코드 (01: EML, 02: MSG) */
  fileType?: string | null
  /** 보낸사람 */
  sender?: string | null
  /** 받은 사람 */
  recipientTo?: string | null
  /** 참조 */
  cc?: string | null
  /** 숨은참조 */
  bcc?: string | null
  /** 메시지 아이디 */
  messageId?: string | null
  /** 제목 */
  subject?: string | null
  /** 내용형식코드 (01: TEXT, 02: HTML, 03: RTF) */
  bodyType?: string | null
  /** 내용 */
  body?: string | null
  /** 내용 텍스트 */
  bodyText?: string | null
  /** 수신일시 */
  receivedDate?: string | null
  /** 전송일시 */
  sentDate?: string | null
  /** 첨부파일 건수 */
  attachedFileCount?: number | null
  /** 분석에러여부 */
  parsingErrorAt?: string | null
  /** 비고 */
  rm?: string | null
  /** 계층 전체 경로 */
  hierachyFullPath?: string
  /** 첨부파일 목록 */
  attachments?: EmailAttachment[]
  /** 북마크 목록 */
  bookmarks?: number[]
}

/**
 * 이메일 첨부파일 정보
 */
export interface EmailAttachment {
  /** 아이디 */
  attachId: number
  /** UUID */
  attachUuid: string
  /** 파일명 */
  fileName: string | null
  /** 파일 확장자 */
  fileExt: string | null
  /** 파일 사이즈 */
  fileSize: number | null
  /** 실제 파일 경로 */
  realFilePath: string | null
  /** Mime Type */
  mimeType: string | null
  /** 암호화 여부 */
  encryptedAt: string | null
  /** DRM 여부 */
  drmAt: string | null
  /** 텍스트 추출 여부 */
  textAt: string | null
  /** 텍스트 크기 초과 여부 */
  textOverSizeAt: string | null
  /** 내용 텍스트 */
  contentText: string | null
  /** 내용 텍스트 사이즈 */
  contentTextSize: number | null
  /** EXIF 제조사 */
  exifMaker: string | null
  /** EXIF 모델명 */
  exifModel: string | null
  /** EXIF GPS */
  exifGps: string | null
  /** EXIF 날짜 */
  exifDatetime: string | null
  /** 아이콘 */
  icon?: string
}

/**
 * 이메일 목록 내보내기 조회조건
 *
 */
export interface ExportEmailConditions extends EmailConditions {
  /** 파일 경로 */
  filePath: string
}

/**
 * 이메일 헤더
 *
 */
export interface EmailHeader {
  /** 헤더 이름 */
  name: string
  /** 헤더값 */
  value?: string
}

/**
 * 증거이미지 케이스정보
 *
 */
export interface EvidenceCase {
  /** 사건번호 */
  caseNumber: string
  /** 압수일시 */
  confiscationDate?: string
  /** 압수영장번호 */
  confiscatedNumber?: string
  /** 압수장소 */
  confiscatedPlace?: string
  /** 특이사항 */
  remarks?: string
}

/**
 * 증거이미지 분석관정보
 *
 */
export interface EvidenceAnalyst {
  /** 이름 */
  name: string
  /** 소속기관 */
  office?: string
  /** 직급 */
  rank?: string
}

/**
 * 증거이미지 피압수자정보
 *
 */
export interface EvidenceConfiscatedPerson {
  /** 이름 */
  name?: string
  /** 소속/부서 */
  office?: string
  /** 연락처 */
  contact?: string
  /** 생년월일 */
  birthday?: string
  /** 사건과의관계 */
  relationship?: string
}

/**
 * 증거이미지 압수물건정보
 *
 */
export interface EvidenceConfiscated {
  /** 저장매체종류 */
  device?: string
  /** 제조사/모델명 */
  model?: string
  /** 시리얼번호 */
  serial?: string
}

/**
 * 증거이미지 이미지파일 정보
 *
 */
export interface EvidenceImageFile {
  /** 폴더경로 */
  folderPath: string
  /** 파일명 */
  fileName: string
  /** 파일포맷 */
  fileFormat: 'deph' | 'aff4'
}

/**
 * 증거이미지 정보
 *
 */
export interface EvidenceInfo {
  /** 대상 북마크 아이디 목록 */
  bookmarks: number[]
  /** 케이스정보 */
  case: EvidenceCase
  /** 분석관정보 */
  analyst: EvidenceAnalyst
  /** 사용자(소유자) 성명 */
  ownerName: string
  /** 피압수자정보 */
  confiscatedPerson: EvidenceConfiscatedPerson
  /** 압수물건정보 */
  confiscated: EvidenceConfiscated
  /** 이미지파일정보 */
  imageFile: EvidenceImageFile
  /** 문서서식 목록 */
  documents: string[]
}

/**
 * 증거이미지 생성용 파일정보
 *
 */
export interface EvidenceFile extends EvidenceImageFile {
  /** 대상 북마크 아이디 목록 */
  bookmarks: number[]
  /** 케이스 폴더 경로 */
  caseFolderPath: string
  /** 전자정보상세목록 파일 경로 */
  report0FilePath: string
}

/**
 * 증거이미지 생성 진행상태
 *
 */
export interface EvidenceProgress {
  /** 진행율 (100% 기준) */
  progress: number
  /** 진행상태 (0: 진행, 1: 완료, -1: 오류) */
  status: CHANNEL_STATUS
  /** 해시값 */
  hash?: HashVal
  /** 증거이미지 생성일 */
  createTime?: number
  /** 오류원인 */
  errorRsn?: string
}

/**
 * 케이스 정리 (증거이미지 생성 완료 후)
 *
 */
export interface ClearCase {
  // 케이스 ID
  caseId: number
  // 케이스 폴더 경로
  caseFolderPath: string
  // 원본 경로
  sourcePath: string
  // 증거이미지 폴더 경로
  evidenceFolderPath: string
  // 데이터베이스 이름
  database: string
}

/**
 * 검색엔진 설정 정보
 *
 */
export interface SearchEngineConfig {
  /** 케이스 폴더 경로 */
  caseFolder: string
  /** 데이터베이스 이름 */
  database: string
}

/** 앱 리소스 진행 스텝 */
export type AppResourceStep = 'db' | 'search' | 'efa_module' | 'log'
/** 앱 리소스 진행 서브 스텝 */
export type AppResourceSubStep = 'install_database' | 'start_service' | 'start_server' | 'start_module'
/**
 * 앱 리소스 로딩 진행
 *
 */
export interface AppResourceProgress {
  /** 진행 스텝 */
  step: AppResourceStep
  /** 진행 서브 스텝 */
  subStep?: AppResourceSubStep
  /** 진행 상태 (0: 진행, 1: 완료, -1: 오류) */
  status: CHANNEL_STATUS
  /** 오류 메시지 */
  errorMsg?: string
}

/**
 * 검색엔진 프로세스 파라미터
 *
 */
export interface SearchEngineParam {
  /** 케이스 폴더 경로 */
  caseFolderPath: string
  /** 데이터베이스 이름 */
  database: string
}

/**
 * 시스템정보
 *
 * */
export interface SystemInfo {
  /** 제조사 */
  manufacturer: string
  /** 모델명 */
  model: string
  /** 시리얼넘버 */
  serial: string
  /** OS 플랫폼 */
  platform: string
  /** OS 정보 */
  distro: string
  /** OS 릴리즈 버전 */
  release: string
  /** CPU 제조사 */
  cpuManufacturer: string
  /** CPU 정보 */
  cpuBrand: string
}

/**
 * 네트워크 정보
 *
 */
export interface NetworkInfo {
  macAddress: string
  ip4: string
}

/**
 * EFA Named Pipe Channel
 */
export interface EfaChannel {
  /** 채널명 */
  channelName?: string
  /** Server */
  server?: net.Server
  /** Server Socket Write Function */
  socketWrite?: Function
  /** Server Socket Receive Message */
  receiveMessage?: string
  /** Server Socket Receive Complete Status */
  receiveCompleted: boolean
  /** Server Socket Receive Message json array */
  messages: any[]
}

/** Channel Type */
export type EFA_CHANNEL_TYPE =
  | 'ready'
  | 'init'
  | 'init_result'
  | 'analysis'
  | 'analysis_progress'
  | 'report1'
  | 'report1_result'
  | 'report2'
  | 'report2_result'
  | 'report3'
  | 'report3_result'
  | 'report4'
  | 'report4_result'
  | 'report5'
  | 'report5_result'
/** Channel Status (0: 진행, 1: 완료, -1: 오류) */
export type CHANNEL_STATUS = 0 | 1 | -1

/**
 * eFA Channel 기본정보
 *
 */
export interface ChannelBase {
  readonly name: EFA_CHANNEL_TYPE
}

/**
 * 준비체크 채널 전송/수신
 *
 */
export interface ReadyChannel extends ChannelBase {
  /** channel name */
  readonly name: 'ready'
  /** 준비완료 상태 */
  ready: boolean
}

/**
 * 초기화 채널 전송
 *
 */
export interface InitChannelSend extends ChannelBase {
  /** channel name */
  readonly name: 'init'
  /** 외부 프로그램 경로 */
  external: string
}

/**
 * 초기화 채널 수신
 *
 */
export interface InitChannelRcv extends ChannelBase {
  /** channel name */
  readonly name: 'init_result'
  /** 상태코드 */
  status: CHANNEL_STATUS
  /** 오류내용 */
  errorRsn?: string
}

/** 이메일분석 스텝 타입 */
export type ANALYSIS_STEP_TYPE = 'unzip' | 'email' | 'search'
/**
 * 이메일 분석 채널 전송
 *
 */
export interface AnalysisChannelSend {
  /** channel name */
  readonly name: 'analysis'
  /** 데이터베이스 이름 */
  databaseName: string
  /** 케이스 폴더경로 */
  caseFolder: string
  /** 원본 타입 */
  sourceType: 'file' | 'folder'
  /** 대상 파일/폴더 */
  source: string
  /** 하위 폴더 포함 여부 (0:미포함, 1:포함) */
  includeChildren: 0 | 1
  /** 압축파일 패스워드 */
  password: string
}

/**
 * 이메일 분석 채널 수신
 */
export interface AnalysisChannelRcv {
  /** channel name */
  readonly name: 'analysis_progress'
  /** 스텝이름 */
  step: ANALYSIS_STEP_TYPE
  /** 대상 파일 / 제목 */
  target: string
  /** 진행율 */
  progress: number
  /** 상태코드 */
  status: CHANNEL_STATUS
  /** 오류내용 */
  errorRsn?: string
}

/**
 * 보고서0 전송 (전송전자정보상세목록)
 */
export interface Report0Send {
  /**  케이스 폴더 */
  caseFolder: string
  /** 문서 파일 경로 */
  filePath: string
  /** 북마크 태그 아이디 목록 */
  tagIds: number[]
}

/**
 * 보고서1 채널 전송 (현장조사확인서)
 *
 */
export interface Report1ChannelSend {
  /** channel name */
  readonly name: 'report1'
  /** 문서파일경로 */
  filePath: string
  /** 사건번호 */
  caseNumber: string
  /** 압수일시 */
  confiscationDate: string
  /** 압수장소 */
  confiscatedPlace: string
  /** 분석관 성명 */
  analystName: string
  /** 사용자(소유자)성명 */
  ownerName: string
  /** 피압수자 성명 */
  confiscatedPersonName: string
  /** 피압수자 연락처 */
  confiscatedPersonContact: string
  /** 피압수자 생년월일 */
  confiscatedPersonBirthday: string
  /** 피압수자 사건과의관계 */
  confiscatedPersonRelationship: string
  /** 피압수자 저장매체종류 */
  confiscatedDevice: string
  /** PC설정시간/KST시간 */
  PcSettingTime: string
  /** 증거이미지 파일명 */
  imageFileName: string
  /** 증거이미지 파일 생성일시 */
  imageFileCreationDate: string
  /** 증거이미지 파일 해시값 (MD5) */
  imageFileHashMd5: string
  /** 전자정보상세목록 파일 해시값 (MD5) */
  listFileHashMd5: string
}

/**
 * 보고서2 채널 전송 (참관및전자정보상세목록교부확인서)
 *
 */
export interface Report2ChannelSend {
  /** channel name */
  readonly name: 'report2'
  /** 문서파일경로 */
  filePath: string
  /** 사건번호 */
  caseNumber: string
  /** 압수장소 */
  confiscatedPlace: string
  /** 특이사항 */
  remarks: string
  /** 사용자(소유자)성명 */
  ownerName: string
  /** 피압수자 성명 */
  confiscatedPersonName: string
  /** 피압수자 사건과의관계 */
  confiscatedPersonRelationship: string
  /** 피압수자 저장매체종류 */
  confiscatedDevice: string
  /** 피압수자 제조사/모델명 */
  confiscatedModel: string
  /** 피압수자 시리얼번호 */
  confiscatedSerial: string
  /** 증거이미지 파일명 */
  imageFileName: string
  /** 증거이미지 파일 해시값 (MD5) */
  imageFileHashMd5: string
  /** 증거이미지 파일 해시값 (SHA1) */
  imageFileHashSha1: string
  /** 증거이미지 파일 해시값 (SHA256) */
  imageFileHashSha256: string
}

/**
 * 보고서3 채널 전송 (전자정보의관련성에관한의견진술서)
 *
 */
export interface Report3ChannelSend {
  /** channel name */
  readonly name: 'report3'
  /** 문서파일경로 */
  filePath: string
  /** 압수장소 */
  confiscatedPlace: string
  /** 피압수자 성명 */
  confiscatedPersonName: string
  /** 피압수자 연락처 */
  confiscatedPersonContact: string
  /** 피압수자 생년월일 */
  confiscatedPersonBirthday: string
  /** 피압수자 사건과의관계 */
  confiscatedPersonRelationship: string
  /** 피압수자 저장매체종류 */
  confiscatedDevice: string
  /** 피압수자 제조사/모델명 */
  confiscatedModel: string
  /** 증거이미지 파일명 */
  imageFileName: string
}

/**
 * 보고서4 채널 전송 (소유권포기서)
 *
 */
export interface Report4ChannelSend {
  /** channel name */
  readonly name: 'report4'
  /** 문서파일경로 */
  filePath: string
  /** 압수장소 */
  confiscatedPlace: string
  /** 피압수자 성명 */
  confiscatedPersonName: string
  /** 피압수자 연락처 */
  confiscatedPersonContact: string
  /** 피압수자 생년월일 */
  confiscatedPersonBirthday: string
}

/**
 * 보고서5 채널 전송 (수사보고서)
 *
 */
export interface Report5ChannelSend {
  /** channel name */
  readonly name: 'report5'
  /** 문서파일경로 */
  filePath: string
  /** 영장번호 */
  confiscatedNumber: string
  /** 압수장소 */
  confiscatedPlace: string
  /** 분석관 성명 */
  analystName: string
  /** 분석관 소속기관 */
  analystOffice: string
  /** 분석관 직급 */
  analystRank: string
  /** 피압수자 성명 */
  confiscatedPersonName: string
  /** 현재날짜 */
  currentDate: string
  /** 이메일 개수 */
  emailCount: string
}

/**
 * 보고서 채널 수신
 */
export interface ReportChannelRcv {
  /** channel name */
  readonly name:
    | 'report0'
    | 'report1_result'
    | 'report2_result'
    | 'report3_result'
    | 'report4_result'
    | 'report5_result'
  status: number
  errorRsn?: string
}

/**
 * 로그인 정보
 *
 */
export interface LoginForm {
  /** 사용자 아이디 */
  userId: string
  /** 비밀번호 */
  password: string
}

/**
 * 인증토큰
 *
 */
export interface AuthToken {
  /** 인증토큰 */
  token: string
  /** 갱신토큰 */
  refresh: string
}

/**
 * 인증정보
 *
 */
interface AuthInfo {
  /** 도구런처 실행여부 */
  launcher: boolean
  /** 사용자 인증상태 */
  status: USER_STATUS
  /** 인증토크 */
  authToken?: string
}

/**
 * 사용자 및 인증 정보
 *
 */
export interface UserAuthInfo {
  /** 인증정보 */
  auth: AuthInfo
  /** 사용자정보 */
  user: User
}

/**
 * 도구 업데이트 진행상태
 *
 */
export interface UpdateProgress {
  /** 상태코드 */
  status: CHANNEL_STATUS
  /** 진행율 */
  progress: number
  /** 전체건수 */
  total?: number
  /** 전송건수 */
  transferred?: number
  /** 업데이트 파일 경로 */
  filePath?: string
}

/** 오류코드 */
export type ERROR_CODE =
  | '_000'
  | '_999'
  | 'A001'
  | 'A002'
  | 'A003'
  | 'A004'
  | 'D001'
  | 'D002'
  | 'D003'
  | 'D004'
  | 'D005'
  | 'D006'
  | 'D007'
  | 'W001'
  | '_001'
  | '_009'
  | '_099'
  | 'S001'
  | 'T001'
  | 'T002'
  | 'T003'
  | 'P001'

/**
 * 오류 상세정보
 *
 */
export interface ErrorLog {
  /** 오류 내역 */
  error: string
  /** 오류코드 */
  code?: ERROR_CODE
  /** 오류설명 */
  comment?: string
  /** 오류일시 */
  datetime?: string
  /** 케이스 이름 */
  caseName?: string
  /** 대상이름 */
  sourceName?: string
}

/**
 * 오류 상태
 */
export interface ErrorStatus {
  /** 오류코드 */
  code: ERROR_CODE
  /** 제목 */
  title: string
  /** 오류기준 */
  criterion?: string
  /** 설명 */
  comment: string
}

/** 오류 상태 목록 */
export const ERROR_STATUS_LIST: ErrorStatus[] = [
  {
    code: '_000',
    title: '정상처리',
    comment: '정상처리가 되었습니다.'
  },
  {
    code: '_999',
    title: '미정의에러',
    comment: '미정의에러발생.'
  },
  {
    code: 'W001',
    title: '명령어 진행중',
    comment: '명령어가 진행중 입니다.'
  },
  {
    code: '_001',
    title: '개수정보 획득-Thread',
    comment: 'Work-Thread에서 명령어 개수 정보 획득.'
  },
  {
    code: '_009',
    title: '명령어 완료-Thread',
    comment: 'Work-Thread에서 명령어가 완료됨.'
  },
  {
    code: '_099',
    title: '명령어 강제 완료-Thread',
    comment: 'Work-Thread에서 명령어가 강제 완료됨(너무 많은 데이터를 처리할 경우, 제한 5,000,000 이상의 경우).'
  },
  {
    code: 'A001',
    title: '분석오류',
    comment: '분석 진행 시 오류가 발생했습니다.'
  },
  {
    code: 'A002',
    title: '분석모듈 메모리 오류',
    criterion: 'java.lang.OutOfMemoryError',
    comment: '분석모듈의 메모리 오류가 발생했습니다.'
  },
  {
    code: 'A003',
    title: '대상파일손상',
    criterion: 'The file appears to be corrupted',
    comment: '분석대상 파일이 손상되었습니다.'
  },
  {
    code: 'A004',
    title: 'KAPE분석실패',
    criterion: 'KAPE분석 기능 수행 실패',
    comment: 'KAPE분석 기능 수행이 실패하였습니다.'
  },
  {
    code: 'D001',
    title: '데이터베이스 연결 오류',
    criterion: 'java.sql.SQLNonTransientConnectionException',
    comment: '데이터베이스 연결 시 오류가 발생했습니다.'
  },
  {
    code: 'D002',
    title: '데이터베이스 패킷 사이즈 오류',
    criterion: 'java.sql.SQLTransientConnectionException',
    comment: '데이터베이스 전송 시 패킷 사이즈 오류가 발생했습니다.'
  },
  {
    code: 'D003',
    title: '데이터베이스 쿼리 오류',
    criterion: 'java.sql.SQLSyntaxErrorException',
    comment: '데이터베이스 쿼리 실행 시 오류가 발생했습니다.'
  },
  {
    code: 'D004',
    title: '테이블 정보 부재 오류',
    criterion: 'java.sql.SQLSyntaxErrorException',
    comment: '테이블 정보 부재로 인해 오류가 발생했습니다.'
  },
  {
    code: 'D005',
    title: '데이터베이스 통합검색테이블 생성 오류',
    criterion: 'java.sql.SQLSyntaxErrorException',
    comment: '데이터베이스 통합검색 테이블 생성 실행 시 오류가 발생했습니다.'
  },
  {
    code: 'D006',
    title: '테이블 파일 저장 에러',
    criterion: 'Fail',
    comment: '데이터 파일생성 실행 시 오류가 발생했습니다.'
  },
  {
    code: 'D007',
    title: '입력데이터 개수/형태 오류',
    criterion: 'Fail',
    comment: '입력데이터 개수/형태 오류가 발생하였습니다.'
  },
  {
    code: 'S001',
    title: '검색엔진 인덱싱 오류',
    criterion: 'FATAL: ',
    comment: '검색엔진 인덱싱 작업 시 오류가 발행했습니다.'
  },
  {
    code: 'T001',
    title: '선별이미지 생성 에러',
    criterion: 'Need TableInfo.json',
    comment: '선별이미지 생성에 필요한 파일 정보 없습니다'
  },
  {
    code: 'T002',
    title: '선별이미지 생성 에러',
    criterion: 'SQL Error',
    comment: '선별이미지 생성중 DB에러 발생하였습니다'
  },
  {
    code: 'T003',
    title: '선별이미지 생성 에러',
    criterion: 'File Error',
    comment: '선별이미지 엑셀 문서 처리 오류발생'
  },
  {
    code: 'P001',
    title: '테이블 CSV 생성 에러',
    criterion: 'SQL Error',
    comment: '특정 테이블 CSV 파일 생성 에러 발생하였습니다'
  }
]

/**
 * 분석로그
 *
 */
export interface AnalysisLog {
  /** 케이스 이름 */
  caseName: string
  /** 케이스 생성일시 */
  caseDate: string
  /** 분석관 이름 */
  analystName?: string
  /** 분석관 직급 */
  analystRank?: string
  /** 비고 */
  remarks?: string
  /** 대상 이름 */
  sourceName: string
  /** 대상 사이즈 (bytes) */
  sourceSize?: number
  /** 이메일 건수 */
  emailCount?: number
}

/**
 * Kapedb에 접속된 상태 정보 add 20231031 idle는 connect&no_command, busy : connect&command_run
 */
export type DB_STATUS = 'noDBInfo' | 'disconnect' | 'idle' | 'busy'
/**
 * kape DB 에서 테이블 정보 조회시 파라메터로 전달할 구조
 * 북마크 정보가 없을 경우에는 undefined로 설정하여 Query해야 함
 * ToDo queryBookMarkId 값이 9999 인 경우에는 모든 북마크 정보를 같이 주는 것(아직 미구현)
 */
export interface DB_QUERY_PARAM {
  /** 조회 테이블 이름 */
  queryTable: string
  /** 조회 테이블 offset 또는 테이블의 1개의 row를 조회할 경우, _id값, 이 경우에는 아래의 필드는 dummy로 설정 */
  queryOffset: number
  /** 특정 컬럼 sort 여부 */
  querySortFlag: boolean
  /** 특정 컬럼 sort에 대한 컬럼 정보  ASC (오름차순)와 DESC (내림차순) 키워드*/
  querySortColName: string
  /** sort DESC flag */
  querySortDescFlag: boolean
  /** 관련 book mark ID */
  queryBookMarkId: number | undefined
  /** 조회시 front에서 pagesize설정 1000 ~ 100000 */
  queryPageSize: number | undefined
}

/**
 * KapeDB에서 통합테이블 생성관련 진행사항 Report Parameter
 */
export interface DB_PROGRESS_PARAM {
  /** 진행중인 테이블 명 */
  state: string
  /** 진행상태 */
  percent: number
}

/**
 * kapeDB에서 통합 검색시 사용되는 파라메타 정의 중, type정보
 */
export type _SEARCH_TYPE = '_S_WORD' | '_S_TIME'

/**
 * kapeDB에서 통합 검색시 사용되는 파라메타 정의
 * >> Search_Type은 단어기반(_S_WORD) | 시간기반(_S_TIME)
 */
export interface _SEARCH_OPTION {
  /** _S_WORD : word기반 검색단어가 존재하는 경우는 무조건 해당 타입으로 설정,
   *  _S_TIME : time기반, 검색단어가 없어야 한다. 있어도 무시 */
  type: _SEARCH_TYPE
  /**  full search를 하는 경우(true) - 아래 tableSearch 참조 안함, 즉 아래 테이블 정보 참조하지 않음
   *   false인 경우에만 테이블 정보를 참조한다.
   */
  fullSearch: boolean
  /** 테이블 검색일 경우 테이블 이름 정보 */
  tableSearch: string
  /** 검색 word */
  keyString: string
  /**  word 기반에 OR 연산여부 */
  orFlag: boolean
  /** 검색 시작 날짜시간, 시작시간이나 종료시간이 정의 되지 않으면 시간 검색을 수행하지 않음  */
  s_time: string
  /** 검색 종료 날짜시간 */
  e_time: string
  /** 북마크 정보 , [주의] undefined로 할 경우, 모든 북마크를 검색&참조하여, 북마크 정보가 배열로 나간다. */
  _b_id: number | undefined
  /** 많은양의 검색을 할 경우 사용, 안할때는 undefined (undefined하면 내부적으로 0처리함)*/
  _offset: number | undefined
  /** 많은양의 검색을 할 경우 사용, 안할때는 dedefined (undefined하면 내부적으로 50000개를 처리함) */
  _pagesize: number | undefined
}

/**
 * KapeDB에서 통합테이블 조회 결과
 */
export interface DB_OPERATION_RESULT {
  /** 수행결과코드 */
  state: ERROR_CODE
  /** 수행결과 */
  data: any | undefined
}

/**
 * KapeDB에서 통합테이블 조회 원본 결과 add 20240115
 */
export interface DB_OPERATION_TOTAL_SEARCH_RESULT {
  /** 수행결과코드 */
  state: ERROR_CODE
  /** 수행결과 */
  data: any | undefined
  /** 검색에 대한 경우의 정보를 추가로 넘김다, 로그를 위해 */
  etc: string | undefined
}

/**
 * renderer에서 main process에 통신할 때 사용한 구조체
 * 20240223 : 북마크의 WILL_DELETE 필드 처리 명령어 추가
 */
export type _DB_CMD_TYPE =
  | '_CREATE_TOTAL_TBL'
  | '_QUERY_TOTAL_TBL'
  | '_QUERY_TOTAL_CNT_TBL'
  | '_QUERY_CATEGORY_TOTAL_CNT_TBL'
  | '_ADD_BOOKMARK_MAPPER'
  | '_DEL_BOOKMARK_MAPPER'
  | '_REF_BOOKMARK_MAPPER'
  | '_WILL_DEL_CHANGE_BOOKMARK_MAPPER'
  | '_WILL_DEL_DONE_BOOKMARK_MAPPER'
  | '_QUERY_TIMELINE_SHORT_TBL'
  | '_CREATE_QUERY_TIMELINE_TBL'
  | '_QUERY_TIMELINE_TBL'
  | '_QUERY_ONETIME_TIMELINE_TBL'
  | '_QUERY_CNT_TIMELINE_TBL'
  | '_MAKE_SELECTED_IMAGE'
  | '_MAKE_PRINT_TABLE'
  | '_MAKE_SELECTED_REPORT'

/**
 * KapeDB에서 통합테이블 조회시 입력 파라메타 구조
 */
export interface DB_COPY_CMD {
  /** org DB 파일 full 경로및 이름 */
  dBPathFullFileName: string
  /** 선별이미지 DB 경로 */
  copyDBPathFullFileName: string
  /** 선별이미지를 위한 북마크아이디 배열 */
  selectIds: number[]
  /** 선별이미지를 위한 case제목(엑셀파일명) */
  selectCaseFullXlsxFileName: string
  /** 선별리포트항목정보 */
  reportItems: AnalysisSelectReportSummary
  /** app실행 위치 정보 for thread, front에서는 '' 로 등록하면 됨, electron main에서 설정한다. */
  appPath: string
}

/**
 * KapeDB에서 특정 테이블을 CSV 파일 저장 명령어 입력 파라메타 구조
 */
export interface TABLE_PRT_CMD {
  /** DB full Path 경로 */
  dBPath: string
  /** 출력할 테이블명 */
  tableName: string
  /** 저장할 파일 full path name */
  saveTableFileName: string
}

/**
 * KapeDB에서 테이블 조회 CMD for work Thread로 동작하기 위함
 */
export interface DB_THREAD_QUERY_CMD {
  /** CMD코드 */
  type: _DB_CMD_TYPE
  /** 20231203: DB 전체 경로 와 파일명으로 변경 */

  dbPath: string
  /** 수행Option */
  data: _SEARCH_OPTION | DB_BOOKMARK_MAPPER_INFO[] | DB_TIMELINE_QUERY_INFO | DB_COPY_CMD | TABLE_PRT_CMD | null
  /** bin실행위치 undefined가 아닐때 해당 정보를 확용한다. */
  appPath: string
}

/**
 * KapeDB에서 통합테이블 조회시 입력 파라메타 구조
 */
export interface DB_SEARCH_CMD {
  /** 20231203: DB 전체 경로 와 파일명으로 변경 */
  dbPath: string
  /** 조회 옵션 */
  dbQueryOption: _SEARCH_OPTION | DB_TIMELINE_QUERY_INFO
}

/**
 * KapeDB에서 통합테이블 조회시 입력 파라메타 구조
 * 북마크의 내용을 추가/수정/삭제/참조 할 때는 해당 객체를 이용한다.
 */
export interface DB_BOOKMARK_INFO {
  /** 북크 이름 */
  _name: string
  /** 해당 북마크 색 정보 */
  _colorInfo: string
  /** 조회시 id값 */
  _id?: number
}

/** 북마트 테이블 데이터 관련 */
export interface DB_BOOKMARK_INFO_ITEM {
  /** 북크 이름 */
  B_name: string
  /** 해당 북마크 색 정보 */
  B_color: string
  /** 조회시 id값 */
  B_Id?: number
}

export interface DB_BOOKMARK_CATEGORY_LIST {
  _category_1: string
  _category_2: string
  _category_3: string
  CNT: number
}

/**
 * renderer에서 main process에 통신할 때 사용한 구조체 for BookMark
 */
export type _DB_BOOKMARK_CMD_TYPE = '' | 'ADD' | 'DEL' | 'MOD' | 'REF'

/**
 * KapeDB에서 통합테이블 조회시 입력 파라메타 구조
 * 북마크의 내용을 추가/수정/삭제/참조 할 때는 해당 객체를 이용한다.
 */
export interface DB_BOOKMARK_OPR {
  /** 북마크 op관련 명령어 정보 */
  op: _DB_BOOKMARK_CMD_TYPE
  /** 북마크 정보, 조회는 N개가 발생, ADD, DEL, MOD는 1개, REF : N개 */
  data: DB_BOOKMARK_INFO[]
}

/** CaseInfo 테이블 데이터 레코드 정보 */
export interface DB_CASEINFO_ITEM {
  /** case 항목 */
  _key: string
  /** case 항목에 대한 value값 */
  _value: string
}

/**
 * renderer에서 main process에 통신할 때 사용한 구조체 for Case Info
 */
export type _DB_CASEINFO_CMD_TYPE = 'ADD' | 'DEL' | 'MOD' | 'REF'

/**
 * KapeDB에서 CASE INFO 테이블 관련 객체
 * CASE INFO 내용을 추가/수정/삭제/참조 할 때는 해당 객체를 이용한다.
 */
export interface DB_CASEINFO_OPR {
  /** Case_Info op관련 명령어 정보 */
  op: _DB_CASEINFO_CMD_TYPE
  /** Case_Info 정보, 조회는 N개가 발생, DEL, MOD는 1개, ADD, REF : N개 */
  data: DB_CASEINFO_ITEM[]
}

/**
 * kapeDB에서 개별아트팩트의 북마크 정보
 * 북마크 관리 테이블에서 사용하는 will_delete 필드 추가함
 */
export interface DB_BOOKMARK_MAPPER_INFO {
  /** bookmark_info의 B_id */
  _id: number
  /**  테이블 이름*/
  _tableName: string
  /** 테이블 의 idx */
  _tableIdx: number
  /** 아트팩트의 범주1 */
  _category_1: string
  /** 아트팩트의 범주2 */
  _category_2: string
  /** 아트팩트의 범주3  */
  _category_3: string
  /** 20240223 : will_delete : 북마크 관리 팝에서 사용하는 값 
   * 0(default값으로 삭제하지 않는다) 또는 1(나중에 북마크 삭제할 정보) 값 */
  _will_delete: number
  /** 조회시 offset정보 반드시 있어야 함*/
  _offset: number | undefined
}

/**
 * renderer에서 main process에 통신할 때 사용한 구조체 for BookMark
 * 20240223 : will_delete 관련 정보 추가
 */
export type _DB_BOOKMARK_MAPPER_CMD_TYPE = '' | 'ADD' | 'DEL' | 'REF' | 'WILL_DEL_CHANGE' | 'WILL_DEL_DONE'

/**
 * KapeDB에서 북마크 정보 입력 명령어 파라메타 구조
 */
export interface DB_BOOKMARK_CMD {
  /** DB 경로 : 쓰레드로 돌리기 때문에 */
  /** 20231204 : dbPath의 값은 절대경로폴더명 + db_file명으로 수정 */
  dbPath: string
  /** OPR TYPE */
  oprType: _DB_BOOKMARK_MAPPER_CMD_TYPE
  /** bookmark mapper 배열 정보*/
  dbBookMarkMapperInfo: DB_BOOKMARK_MAPPER_INFO[]
}

/**
 * KapeDB에서 북마크 정보 입력 명령어 파라메타 구조
 */
export interface DB_JSON_WRT_CMD {
  /** DB 경로 : 쓰레드로 돌리기 때문에 */
  filePath: string
  /** OPR TYPE 파일생성 또는 프린트 */
  oprType: 'FILE' | 'PRT'
  /** 데이터 배열 정보*/
  wrtData: any[]
}

/**
 * KapeDB에서 북마크 입력 결과
 */
export interface DB_BOOKMARK_MAPPER_RESULT {
  /** 수행결과코드 */
  state: ERROR_CODE
  /** 수행결과 */
  data: number | any[]
}

/**
 * kapeDB에서 Timeline 북마크 조회시 파라메타 정보
 */
export interface DB_TIMELINE_QUERY_INFO {
  /** 전체 범주에서 검색 여부 정보, true 이면 전체 범주, false이면 검색해야 할 범주1값을 _categoryName에 넣어야 함 */
  _full_search_flag: boolean
  /**  1'th 범주*/
  _categoryName: string
  /** 전체 시간 조회 여부 정보 false이면 아래 시간 값이 반드시 있어야 함, true이면 전체 시간 */
  _full_time_range_flag: boolean
  /** 시작 시간 */
  _s_time: string
  /** 끝 시간 */
  _e_time: string
  /** 북마크 Id */
  _b_id: number | undefined
  /** t_id기반으로 조회를 할 경우, 위 조건은 다 사용하지 않는다 범주에 무관하게 t_id 기반으로 요청한 개수의 정보를 준다 */
  _t_id: number | undefined
  /** 조회시  받드시 있어야 함 */
  _offset: number
  /** 한번에 전체 조회시(채널 readTimelineContentsOneTime 이용시) 반드시 있어야 함(없을시 1000 으로 설정) */
  _pageSize: number | undefined
}

/**
 * kapeDB에서 Timeline chart에서 timeline t_id 조회시 파라메타 정보
 */
export interface DB_TIMELINE_CHART_QUERY_INFO {
  /**  1'th 범주, 해당 값을 '-'으로 하면, 시간으로 조회*/
  _category1Name: string
  /**  2'th 범주, 해당 값을 '-'으로 하면, 시간과 범주1로만 조회*/
  _category2Name: string
  /** 시작 시간 , 반드시 있어야 하는 값*/
  _s_time: string
  /** 끝 시간 , 반드시 있어야 하는 값*/
  _e_time: string
  /** 북마크 Id : option 향후에 사용할 것을 대비 */
  _b_id: number | undefined
  /** t_id기반으로 조회를 할 경우, option  향후에 사용할 것을 대비 */
  _t_id: number | undefined
  /** 조회 시작 offset, option   향후에 사용할 것을 대비 */
  _offset: number | undefined
  /** 한번에 전체 조회시(채널 readTimelineContentsOneTime 이용시) 반드시 있어야 함(없을시 1000 으로 설정), option  향후에 사용할 것을 대비 */
  _pageSize: number | undefined
}

/**
 * KAPE 분석 동작을 위한 파라메타 객체
 */
export interface KAPE_ANALYSIS_PARAM {
  /** kape가 분석하기 위한 소스 폴더 */
  k_source: string

  /** kape가 분석 결과를 생성하기 위한 Destination  폴더 */
  k_dest: string
}

/**
 * 선별이미지관련 엑셀 분석정보 항목
 */
export interface AnalysisSelectReportSummary {
  /** 사건 정보 - 사건번호 */
  caseNumber: string
  /** 사건 정보 - 증거번호 */
  imageNumber: string
  /** 분석자 정보 - 소속청 */
  divisionOfficeName: string
  /** 분석자 정보 - 소속부서 */
  departmentName: string
  /** 분석자 정보 - 분석관명 */
  analysisName: string
  /** 분석자 정보 - 분석관 직급 */
  analysisPosition: string
  /** 분석 정보 - 분석장소 */
  analysisLocation: string
  /** 분석 정보 - 분석날짜 */
  analysisDate: string
  /** 분석 정보 - 타임존 */
  analysisTimezone: string
  /** 획득이미지 정보 - 획득파일명 */
  acquisitionFileName: string
  /** 획득이미지 정보 - 획득파일크기 */
  acquisitionFileSize: string
  /** 획득이미지 정보 - 획득해시값 */
  acquisitionHashValue: string
  /** 획득이미지 정보 - 획득해시타입 */
  acquisitionHashType: string
  /** 획득이미지 정보 - 획득도구명 */
  acquisitionToolName: string
  /** 선별이미지 정보 - 획득파일명 */
  selectedFileName: string
  /** 선별이미지 정보 - 획득파일크기 */
  selectedFileSize: string
  /** 선별이미지 정보 - 획득해시값 */
  selectedHashValue: string
  /** 선별이미지 정보 - 획득해시타입 */
  selectedHashType: string
  /** 선별이미지 정보 - 획득도구명 */
  selectedToolName: string
}

/**
 * 디렉토리 정보
 */
export interface DirInfo {
  filename: string
  type: string
  lastModifyDateTime: string
  subdir?: DirInfo[]
}
/**
 * 획득 이미지 대한 정보
 */
export interface AcquisitionType {
  /** 폴더 유무 */
  isFolder: boolean
  /** 획득 이미지 타입 */
  isImage: 'deph' | 'aff4' | 'none'
}
/**
 * 획득 이미지 내보내기 정보
 */
export interface AcquisitionImageExport {
  /** 획득 이미지 타입 */
  imageType: 'deph' | 'aff4'
  /** 획득 이미지 경로 */
  imageFilePath: string
  /** 출력 경로 */
  exportPath: string
}
/**
 * 증거 이미지 생성 정보
 */
export interface CreateEvidenceImage {
  endTime(reportInfo: Report1Send, csvFileHash: HashVal, endTime: any): unknown
  /** 획득 이미지 타입 */
  imageType: 'deph' | 'aff4'
  /** 증거 이미지 경로 */
  imageFilePath: string
  /** 증거 데상 폴더 경로 */
  imageSourcePath: string
}
export interface EvidenceImageState {
  /** 네보내기 상태 */
  state: 'start' | 'totalcount' | 'error' | 'extract' | 'end' | 'cancel'
  /** 진행율 */
  percent: number
  /** 내보내기 파일명 */
  filepath: string
}
/**
 * 보고서1 전송 (현장조사확인서)
 */
export interface Report1Send {
  /** 문서파일경로 */
  caseFilePath: string
  /** 사건번호 */
  caseName: string
  /** 증거번호 */
  imgNum: string
  /** 압수장소 */
  confiscatedPlace: string
  /** 피압수자 성명 (사용자) */
  confiscatedType: string
  /** 소유유형 */
  confiscatedName: string
  /** 분석관 성명 (조사자) */
  analystName: string
  /** PC설정시간 (케이스 생성 - 실제시간값) */
  realDatetime: string
  /** KST 시간 (자동 입력) */
  kSTTime: string
  /** 증거이미지 파일명 (사건번호_증거번호) */
  caseImgName: string
  /** 증거이미지 파일 생성일시 */
  imageFileCreationDate: string
  /** 증거이미지 파일 해시값 (MD5) */
  imageFileHashMd5: string
  /** 증거이미지 파일 해시값 (Sha1) */
  imageFileHashSha1: string
  /** 전자정보상세목록 파일 해시값 (MD5) */
  listFileHashMd5?: string
}

/**
 * 분석 개요__시스템 정보
 */
export interface OverviewSystemInfo {
  /** OS 설치 일자 */
  InstallTime: string
  /** Os 이름 */
  ProductName: string
  /** 현재 사용자 */
  RegisteredOwner: string
  /** OS 버젼 */
  DisplayVersion: string
  /** 현재 메이저 버전 넘버 */
  CurrentMajorVersionNumber: string
  /** 현재 마이너 버전 넘버 */
  CurrentMinorVersionNumber: string
  /** 현재 빌드 넘버 */
  CurrentBuildNumber: string
  /** 타임존 */
  TimeZoneKeyName: string
}

/**
 * 분서 개요__아티팩트 분석 정보
 */
export interface OverviewArtifactsInfo {
  Amcache?: number
  EventLogs?: number
  ProgramExecution?: number
  RegisteredOwner?: number
  FileDeletion?: number
  FileSystem?: number
  BrowsingHistory?: number
  Registry?: number
  FileFolderAccess?: number
  SRUMDatabase?: number
}

/** 기본 정보 설정 */
export interface SettingInfo {
  /** 사용자 ID */
  saveID: string
  /** 시용자 ID 저장여부 */
  isSaveID: boolean
  /** case 기본 경로 */
  defaultPath: string
  /** 획득 툴 경로 정보 */
  theme: 'black' | 'white'
}

/**
 * 보고서2 전송 (전자정보의 관련성에 대한 의견진술서)
 *
 */
export interface Report2Send {
  /** 문서파일경로 */
  caseFilePath: string
  /** 의견진술인 성명__피압수자 성명 */
  confiscatedName: string
  /** 의견진술인 연락처__ 피압수자 연락처 */
  confiscatedNumber: string
  /** (윈아트 생성) 이미지 파일명 */
  caseImgName: string
}

export interface AddCSVFileInfo {
  csvFilePath: string //case 기본 경로
  fileInfo: string
}
