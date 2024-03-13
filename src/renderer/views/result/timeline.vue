<!--
/**
* result > timeline 타임라인 목록 화면
*/
-->
<route>{ meta: { layout: "result", disallowAuthed: true} }</route>
<script setup lang="ts">
/**********************************************
 * @description Import
 */

import * as d3 from 'd3/build/d3'
import krLocale from 'd3/node_modules/d3-time-format/locale/ko-KR.json'
import eventDrops from 'event-drops'
import moment, { utc } from 'moment'

import { ref, Ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useCaseStore } from '@renderer/stores/caseStore'
import { useConfigStore } from '@renderer/stores/configStore'
import { KAPE_OP_CHANNELS } from '@share/constants'
import type { QTable } from 'quasar'
import type {
  DB_BOOKMARK_INFO_ITEM,
  DB_BOOKMARK_MAPPER_INFO,
  DB_QUERY_PARAM,
  DB_TIMELINE_QUERY_INFO,
  DB_OPERATION_RESULT,
  DB_TIMELINE_CHART_QUERY_INFO
} from '@share/models'
import { useQuasar } from 'quasar'
import { Icon } from '@iconify/vue'
import DialogBookmark from '@renderer/components/result/dialog/DialogBookmark.vue'
import DialogSearch from '@renderer/components/result/dialog/DialogSearch.vue'
import DatetimeCalendar from '@renderer/components/common/DatetimeCalendar.vue'
import BookmarkItem from '@renderer/components/BookmarkItem.vue'
import { openError } from '../../composables/useDialog'

const caseStore = useCaseStore()
const configStore = useConfigStore()
const $q = useQuasar()

/**********************************************
 * @description Define Variable
 */
const DEFAULT_OFFSET: number = 500
const DEFAULT_CHART_OFFSET: number = 100000

// Bookmark (s)
const bookmarkGroup = computed(() => {
  let bookmarkGroupArray = caseStore.bookmark
  // bookmarkGroupArray.unshift({
  //   b_name: '북마크 선택',
  //   b_color: '#FFFFFF',
  //   b_id: 0
  // })
  return bookmarkGroupArray
})
const selectedBookmarkGroup: Ref<DB_BOOKMARK_INFO_ITEM> = ref({})
const selectedBookmarkColor: Ref<string> = ref('#ffffff')
const bookmarkSelect: Ref<boolean> = ref(true)
// Bookmark (e)

// Grid(s)
const modal: Ref<boolean> = ref(false)
const detail: Ref<boolean> = ref(false)
const loading: Ref<boolean> = ref(false)
const gridRowData: Ref<object[]> = ref([])
let offsetRowData = []
let offsetChartData = []
const timelineGrid: Ref<QTable> = ref()
const detailViewTable = ref(null)

const minTalbeId: Ref<number> = ref(0)
const maxTalbeId: Ref<number> = ref(0)

const selectedRowData: Ref<object[]> = ref([])
const startRowNumber: Ref<number> = ref(0)
const rowSelected: Ref<[]> = ref([])
// const rowsPerPageArr: number[] = [100, 200, 300, 400, 500]
const selectedRowsPerPage: Ref<number> = ref(500)
const rowCount: Ref<number> = ref(0)
const currentQueryOffset: Ref<number> = ref(0)
const currentOffset: Ref<number> = ref(-1)
const pagination: Ref<any> = ref({
  page: 1,
  rowsPerPage: selectedRowsPerPage.value,
  rowsNumber: rowCount.value || 0
})
watch(selectedRowsPerPage, (value) => {
  const currentPage = Math.ceil(startRowNumber.value / value) > 0 ? Math.ceil(startRowNumber.value / value) : 1
  console.log('updated selectRowPerPage : ', currentPage)
  updateGrid(currentPage)
})
/**
 * {
 *   _full_search_flag: true,
 *   _categoryName: '',
 *   _full_time_range_flag: false,
 *   _s_time: '1985-10-26 08:15:00',
 *   _e_time: '2018-01-01 23:59:59',
 *   _b_id: undefined,
 *   _offset: 0,
 *   _pageSize: DEFAULT_OFFSET
 * }
 */
const todayDate = moment().hours(23).minutes(59).seconds(59).format('YYYY-MM-DD HH:mm:ss')
const defaultStartDate = moment().subtract(6, 'months').hours(0).minutes(0).seconds(0).format('YYYY-MM-DD HH:mm:ss')
const selectStartDate: Ref<string | null> = ref(defaultStartDate)
const selectEndDate: Ref<string | null> = ref(todayDate)
const selectChartStartDate: Ref<string | null> = ref(defaultStartDate)
const selectChartEndDate: Ref<string | null> = ref(todayDate)
const isSearchedByText: Ref<boolean> = ref(false)
const isRendering: Ref<boolean> = ref(false)

const chartClickMore: Ref<boolean> = ref(false)

const params: Ref<DB_TIMELINE_QUERY_INFO> = computed(() => {
  return {
    _full_search_flag: true,
    _categoryName: '',
    _full_time_range_flag: false,
    _s_time: defaultStartDate,
    _e_time: todayDate,
    _t_id: undefined,
    _b_id: selectedBookmarkGroup?.value?.b_id !== undefined ? selectedBookmarkGroup?.value?.b_id : 0,
    // _b_id: undefined,
    _offset: 0,
    _pageSize: DEFAULT_OFFSET
  }
})

const chartParams: Ref<DB_TIMELINE_QUERY_INFO> = computed(() => {
  return {
    _full_search_flag: true,
    _categoryName: '',
    _full_time_range_flag: false,
    _s_time: defaultStartDate,
    _e_time: todayDate,
    _t_id: undefined,
    _b_id: selectedBookmarkGroup?.value?.b_id !== undefined ? selectedBookmarkGroup?.value?.b_id : 0,
    // _b_id: undefined,
    _offset: 0,
    _pageSize: DEFAULT_CHART_OFFSET
  }
})

// const chartClickParams: Ref<DB_TIMELINE_CHART_QUERY_INFO> = computed(() => {
//   return {
//       /** 범주 1 */
//       _category1Name: '-',
//       //_category1Name: '-',
//       /** 범주 2 */
//       _category2Name: '-',
//       //_category2Name: '-',
//       /** 시작 시간 */
//       //_s_time: '2023-08-01 14:00:00',
//       _s_time: undefined,
//       /** 끝 시간 */
//       _e_time: undefined,
//       /** 북마크 Id : option */
//       _b_id: undefined,
//       /** t_id기반으로 조회를 할 경우, option */
//       _t_id: undefined,
//       /** 조회 시작 offset, option  */
//       _offset: undefined,
//       /** 한번에 전체 조회시(채널 readTimelineContentsOneTime 이용시) 반드시 있어야 함(없을시 1000 으로 설정), option */
//       _pageSize: undefined
//   }
// })

const chartClickParams: DB_TIMELINE_CHART_QUERY_INFO = {
  /** 범주 1 */
  _category1Name: '-',
  //_category1Name: '-',
  /** 범주 2 */
  _category2Name: '-',
  //_category2Name: '-',
  /** 시작 시간 */
  //_s_time: '2023-08-01 14:00:00',
  _s_time: undefined,
  /** 끝 시간 */
  _e_time: undefined,
  /** 북마크 Id : option */
  _b_id: undefined,
  /** t_id기반으로 조회를 할 경우, option */
  _t_id: undefined,
  /** 조회 시작 offset, option  */
  _offset: undefined,
  /** 한번에 전체 조회시(채널 readTimelineContentsOneTime 이용시) 반드시 있어야 함(없을시 1000 으로 설정), option */
  _pageSize: undefined
}

const originalParams: Ref<DB_TIMELINE_QUERY_INFO> = ref({})

const selectChartClickParmas: DB_TIMELINE_CHART_QUERY_INFO = {}

const MAX_CHART_ROW_SIZE = 3000000
// const chartParams: Ref<DB_TIMELINE_QUERY_INFO> = computed(() => {
//   return {
//     _full_search_flag: true,
//     _categoryName: '',
//     _full_time_range_flag: false,
//     _s_time: selectStartDate.value,
//     _e_time: selectEndDate.value,
//     _b_id: undefined,
//     _offset: 0,
//     _pageSize: MAX_CHART_ROW_SIZE
//   }
// })

/**
 * category_1:"FileFolderAccess"
 * category_2 : "점프리스트"
 * category_3 : "CustomDestinations"
 * ItemName : "LocalPath"
 * ItemValue : ""
 * _Attribute : "TrackerCreatedOn"
 * _Category : "Operating System"
 * _DateTime : "1582-10-15 00:00:00"
 * t_tableName : "CustomDestinations"
 * t_tableId : 155
 * _TimelineCategory : "FileFolder Opening"
 * _Type : "Jump List"
 * _book : 0
 * t_id : 586289
 * _main : 0
 *
 * 12/4 업데이트 내용, 컬럼 순서
 * [1]_DateTime, [2]_Attribute,[3] _TimelineCategory,[4] _type,[5] ItemName, [6]ItemValue, [7]t_tableName, [8]_TableId  그 외의 다른 기존 컬럼은 hidden으로 처리
 *
 *
 */
const columnDef = [
  {
    label: 't_dateTime',
    name: '_DateTime',
    field: 't_dateTime',
    required: false,
    align: 'center',
    sortable: false,
    headerStyle: 'width: 200px'
  },
  {
    label: 't_attribute',
    name: '_Attribute',
    field: 't_attribute',
    required: false,
    align: 'center',
    sortable: false,
    headerStyle: 'width: 200px'
  },
  {
    label: 't_timelineCategory',
    name: '_TimelineCategory',
    field: 't_timelineCategory',
    required: false,
    align: 'center',
    sortable: false,
    headerStyle: 'width: 200px'
  },
  {
    label: 't_type',
    name: '_Type',
    field: 't_type',
    required: false,
    align: 'center',
    sortable: false,
    headerStyle: 'width: 200px'
  },
  {
    label: 't_itemName',
    name: 'ItemName',
    field: 't_itemName',
    required: false,
    align: 'center',
    sortable: false,
    headerStyle: 'width: 200px'
  },
  {
    label: 't_itemValue',
    name: 'ItemValue',
    field: 't_itemValue',
    required: false,
    align: 'center',
    sortable: false,
    headerStyle: 'width: 200px'
  },
  {
    label: 't_tableName',
    name: 't_tableName',
    field: 't_tableName',
    required: false,
    align: 'center',
    sortable: false,
    headerStyle: 'width: 200px'
  },
  {
    label: 't_tableId',
    name: 't_tableId',
    field: 't_tableId',
    required: false,
    align: 'center',
    sortable: false,
    headerStyle: 'width: 200px'
  }
]

const detailInfoColumnDef: Ref<object[]> = ref([
  { label: 't_id', field: 't_id', visible: true },
  { label: 'category_1', field: 'category_1', visible: true },
  { label: 'category_2', field: 'category_2', visible: true },
  { label: 'category_3', field: 'category_3', visible: true },
  { label: 'ItemName', field: 'ItemName', visible: true },
  { label: 'ItemValue', field: 'ItemValue', visible: true },
  { label: '_Attribute', field: '_Attribute', visible: true },
  { label: '_Category', field: '_Category', visible: true },
  { label: '_DateTime', field: '_DateTime', visible: true },
  { label: 't_tableName', field: 't_tableName', visible: true },
  { label: 't_tableId', field: 't_tableId', visible: true },
  { label: '_TimelineCategory', field: '_TimelineCategory', visible: true },
  { label: '_Type', field: '_Type', visible: true },
  { label: 't_tableName', field: 't_tableName', visible: true }
])

const isShowChartDialog: Ref<boolean> = ref(false)
const dateSelector: Ref<string> = ref('sixMonths')
const chartDateSelector: Ref<string> = ref('sixMonths')
watch(dateSelector, (value) => {
  let startDate: string
  const endDate = moment().hours(23).minutes(59).seconds(59).format('YYYY-MM-DD HH:mm:ss')
  switch (value) {
    case 'sixMonths':
      startDate = moment().subtract(6, 'months').hours(0).minutes(0).seconds(0).format('YYYY-MM-DD HH:mm:ss')
      selectStartDate.value = startDate
      selectEndDate.value = endDate
      break
    case 'threeMonths':
      startDate = moment().subtract(3, 'months').hours(0).minutes(0).seconds(0).format('YYYY-MM-DD HH:mm:ss')
      selectStartDate.value = startDate
      selectEndDate.value = endDate
      break
    case 'twelveMonths':
      startDate = moment()
        .subtract(12, 'months')
        .add(1, 'day')
        .hours(0)
        .minutes(0)
        .seconds(0)
        .format('YYYY-MM-DD HH:mm:ss')
      selectStartDate.value = startDate
      selectEndDate.value = endDate
      break
  }

  // Grid 기간 설정(3개월, 6개월, 12개월) 라디오 버튼 클릭시 자동 검색
  if (dateSelector.value !== 'selectDate') {
    if (!isSearchedByText.value) {
      isDetailSearch.value = false

      if (detailSearchModal.value) {
        detailSearchModal.value = false
      }

      Object.assign(originalParams.value, params.value)

      params.value._s_time = selectStartDate.value
      params.value._e_time = selectEndDate.value
      params.value._offset = 0
      params.value._t_id = undefined
      currentOffset.value = -1

      // // 상세검색 날짜 초기화
      // selectStartDate.value = null
      // selectEndDate.value = null

      $q.loading.show()
      onDefaultTimelineGrid()
    }
  }
})

// 상세검색(s)
const gridCategoryOptions: Ref<object[]> = ref([
  { label: 'Registry', value: 'Registry' },
  { label: 'FileSystem', value: 'FileSystem' },
  { label: 'EventLogs', value: 'EventLogs' },
  { label: 'FileFolderAccess', value: 'FileFolderAccess' },
  { label: 'Amcache', value: 'Amcache' },
  { label: 'ProgramExecution', value: 'ProgramExecution' },
  { label: 'FileDeletion', value: 'FileDeletion' },
  { label: 'SRUMDatabase', value: 'SRUMDatabase' },
  { label: 'BriwsingHistory', value: 'BriwsingHistory' }
])

const isSelectGridCategoryGroup: Ref<string[]> = ref([
  'Registry',
  'FileSystem',
  'EventLogs',
  'FileFolderAccess',
  'Amcache',
  'ProgramExecution',
  'FileDeletion',
  'SRUMDatabase',
  'BriwsingHistory'
])
const isSelectGridCategoryGroupAll: Ref<boolean> = ref(true)
const detailSearchModal = ref(false)
const isDetailSearch = ref(false)
const detailChartCount: Ref<number> = ref(0)
let selectDetailCategoryArr = []

// 타임라인 차트 더보기 클릭시 트리거
const isClickChartMoreButton: Ref<boolean> = ref(false)
const clickChartMoreButtonId: Ref<number> = ref(0)

const toggleDetailSearch = (): void => {
  detailSearchModal.value = !detailSearchModal.value
}

const selectGridCategoryGroupAll = (value): void => {
  if (value) {
    isSelectGridCategoryGroup.value = gridCategoryOptions.value.map((item) => item.value)
  } else {
    isSelectGridCategoryGroup.value = selectDetailCategoryArr
  }
}

const selectGridCategoryGroup = (value): void => {
  console.log(isSelectGridCategoryGroup.value)
  if (Array.isArray(value)) {
    if (value.length === gridCategoryOptions.value.length) {
      isSelectGridCategoryGroupAll.value = true
    } else {
      isSelectGridCategoryGroupAll.value = false
    }
  }
}

const onClickSearchGrid = async (): Promise<void> => {
  isDetailSearch.value = true
  dateSelector.value = 'selectDate'

  // 카테고리 선택 여부
  if (isSelectGridCategoryGroupAll.value) {
    params.value._full_search_flag = true
    params.value._categoryName = ''
  } else {
    params.value._full_search_flag = false
    params.value._categoryName = isSelectGridCategoryGroup.value.map((item) => `\'${item}\'`).join(', ')
  }

  // 기간 선택 여부
  if (selectStartDate.value == null) {
    params.value._full_time_range_flag = true
    params.value._s_time = undefined
    params.value._e_time = undefined
    selectEndDate.value = null
  } else {
    params.value._full_time_range_flag = false

    if (selectEndDate.value == null) {
      selectEndDate.value = todayDate
    }

    // 1년 기간 체크
    const diffTime = moment(selectEndDate.value, 'YYYY-MM-DD').diff(
      moment(selectStartDate.value, 'YYYY-MM-DD'),
      'years',
      true
    )

    if (diffTime < 1) {
      if (!moment(selectStartDate.value).isAfter(selectChartEndDate.value)) {
        params.value._s_time = selectStartDate.value
        params.value._e_time = selectEndDate.value
      } else {
        openError('시작일이 종료일보다 큽니다')
        return
      }
    } else {
      openError('기간설정은 1년 이하의 기간만 설정이 가능합니다')
      return
    }
  }

  $q.loading.show()

  params.value._offset = 0
  params.value._t_id = undefined

  pagination.value.page = 1
  currentOffset.value = -1

  await caseStore.getTimelineDataCount(params.value)
  timelineGrid.value.scrollTo(0, 'start')
  detailSearchModal.value = !detailSearchModal.value
}
// 상세검색(e)

// Grid(e)

// Chart(s)
watch(chartDateSelector, (value) => {
  let startDate: string
  const endDate = moment().hours(23).minutes(59).seconds(59).format('YYYY-MM-DD HH:mm:ss')
  switch (value) {
    case 'sixMonths':
      startDate = moment().subtract(6, 'months').hours(0).minutes(0).seconds(0).format('YYYY-MM-DD HH:mm:ss')
      selectChartStartDate.value = startDate
      selectChartEndDate.value = endDate
      break
    case 'threeMonths':
      startDate = moment().subtract(3, 'months').hours(0).minutes(0).seconds(0).format('YYYY-MM-DD HH:mm:ss')
      selectChartStartDate.value = startDate
      selectChartEndDate.value = endDate
      break
    case 'twelveMonths':
      startDate = moment()
        .subtract(12, 'months')
        .add(1, 'day')
        .hours(0)
        .minutes(0)
        .seconds(0)
        .format('YYYY-MM-DD HH:mm:ss')
      selectChartStartDate.value = startDate
      selectChartEndDate.value = endDate
      break
  }
})

const chartDirection: Ref<string> = ref('')

const selectedCategoryGroup: Ref<[]> = ref([])
watch(selectedCategoryGroup, (value) => {
  if (Array.isArray(value)) {
    if (value.length === categoryOptions.value.length) {
      isSelectedCategoryGroupAll.value = true
    } else {
      isSelectedCategoryGroupAll.value = false
    }
  }
})

const categoryOptions: Ref<object[]> = ref([{ label: '로딩 중...', value: '' }])
const isSelectedCategoryGroupAll: Ref<boolean> = ref(true)

const dateFormat = d3.timeFormat('%Y-%m-%d %H:%M')
const tooltip = d3
  .select('body')
  .append('div')
  .classed('timeline-tooltip', true)
  .style('opacity', 0)
  .style('pointer-events', 'none')

const tooltipDim = d3
  .select('body')
  .append('div')
  .classed('timeline-tooltip-dim', true)
  .style('opacity', 0)
  .style('pointer-events', 'none')
  .on('click', function () {
    tooltip.transition().duration(500).style('opacity', 0).style('pointer-events', 'none')
    tooltipDim.style('opacity', 0).style('pointer-events', 'none')
  })
const myColor = [
  '#65C2A5',
  '#FC8D62',
  '#8DA0CB',
  '#E78AC3',
  '#8AC32B',
  '#DDB908',
  '#B981E1',
  '#6BA8F0',
  '#65C2A5',
  '#FC8D62',
  '#8DA0CB',
  '#E78AC3',
  '#8AC32B',
  '#DDB908',
  '#B981E1',
  '#6BA8F0'
]

const chartStartDate: Ref<object> = ref(null)
const chartEndDate: Ref<object> = ref(null)
let chartRow = []
let filteredChartRow = []
const CHART_PER_ROW = 3000
// Chart(e)

/**********************************************
 * @description Define Computed
 */
const pageMax = computed({
  get() {
    return Math.ceil(rowCount.value / pagination.value.rowsPerPage)
  },
  set() {
    return
  }
})

/**********************************************
 * @description Define Methods
 */
const onChangeBookmarkGroup = async (value: DB_BOOKMARK_INFO_ITEM<object>) => {
  selectedBookmarkGroup.value = value
  selectedBookmarkColor.value = selectedBookmarkGroup?.value?.b_color
  // params.value._b_id = selectedBookmarkGroup?.value?.b_id

  // rowdata update를 위해 오프셋 초기화
  currentOffset.value = -1
  await updateGrid(pagination.value.page)
  console.log('**************** onChangeBookmarkGroup!!!!!!!!! ***************')
}

const onBookmarkItemAdded = async (value): Promise<void> => {
  if (value.state === '_000') {
    $q.loading.hide()

    console.debug('************* 북마크 처리 완료 *****************')
    console.debug(value)

    // @2024-01-04 북마크 후 페이징 새로고침 없이 화면 렌더로만 표시
    // rowdata update를 위해 오프셋 초기화
    // currentOffset.value = -1
    // await updateGrid(pagination.value.page)
  }
}

const onChangeBookmark = async (value) => {
  /**
   * category_1 : "FileFolderAccess"
   * category_2 : "점프리스트"
   * category_3 : "CustomDestinations"
   * ItemName : "LocalPath"
   * ItemValue : ""
   * active : false
   * bookmark : true
   * _Attribute : "TrackerCreatedOn"
   * _Category : "Operating System"
   * _DateTime : "1582-10-15 00:00:00"
   * t_tableName : "CustomDestinations"
   * t_tableId : 189
   * _TimelineCategory : "FileFolder Opening"
   * _Type : "Jump List"
   * _book : 0
   * t_id : 586527
   * _main : 0
   */

  const bookmarkItem: DB_BOOKMARK_MAPPER_INFO[] = [
    {
      _id: selectedBookmarkGroup.value.b_id,
      _tableName: value.t_tableName,
      _tableIdx: value.t_tableId,
      _category_1: value.category_1,
      _category_2: value.category_2,
      _category_3: value.category_3
    }
  ]
  console.log('onChangeBookmark ', bookmarkItem)

  $q.loading.show()
  if (value._book === 0) {
    await caseStore.addBookmarkOne(bookmarkItem)

    gridRowData.value.forEach((item) => {
      if (item.t_tableName == value.t_tableName && item.t_tableId == value.t_tableId) {
        item.bookmark = true
        item._book = selectedBookmarkGroup.value.b_id
      }
    })
  } else {
    await caseStore.deleteBookmarkOne(bookmarkItem)

    gridRowData.value.forEach((item) => {
      if (item.t_tableName == value.t_tableName && item.t_tableId == value.t_tableId) {
        item.bookmark = false
        item._book = 0
      }
    })
  }
  $q.loading.hide()
}

const onChangeBookmarkAll = async (value) => {
  let bookmarkItems: DB_BOOKMARK_MAPPER_INFO[] = []

  console.debug('############ bookmark changed all start : ', bookmarkItems)
  $q.loading.show()

  if (value) {
    // 전체 선택
    for (const item of gridRowData.value) {
      let valid = false

      if (item._book === 0) valid = true

      // 동일한 table id, name 제외 처리
      for (const comparedItem of gridRowData.value) {
        if (item.t_tableName === comparedItem.t_tableName && item.t_tableId === comparedItem.t_tableId) {
          if (
            bookmarkItems.some(
              (bookmark) =>
                bookmark.b_tableName === comparedItem.t_tableName && bookmark.b_tableId === comparedItem.t_tableId
            )
          ) {
            valid = false
          }
        }
      }

      if (valid) {
        bookmarkItems.push({
          _id: selectedBookmarkGroup.value.b_id,
          _tableName: item.t_tableName !== undefined ? item.t_tableName : '',
          _tableIdx: item.t_tableId !== undefined ? item.t_tableId : 0,
          _category_1: item.category_1 !== undefined ? item.category_1 : '',
          _category_2: item.category_2 !== undefined ? item.category_2 : '',
          _category_3: item.category_3 !== undefined ? item.category_3 : ''
        })
      }
    }

    await caseStore.addBookmark(bookmarkItems)
    gridRowData.value.forEach((item) => {
      if (!item.bookmark) {
        item.bookmark = true
        item._book = selectedBookmarkGroup.value.b_id
      }
    })
    bookmarkSelect.value = true
  } else {
    // 전체 취소
    for (const item of gridRowData.value) {
      if (item._book === selectedBookmarkGroup.value.b_id) {
        bookmarkItems.push({
          _id: selectedBookmarkGroup.value.b_id,
          _tableName: item.t_tableName !== undefined ? item.t_tableName : '',
          _tableIdx: item.t_tableId !== undefined ? item.t_tableId : 0,
          _category_1: item.category_1 !== undefined ? item.category_1 : '',
          _category_2: item.category_2 !== undefined ? item.category_2 : '',
          _category_3: item.category_3 !== undefined ? item.category_3 : ''
        })
      }
    }

    await caseStore.deleteBookmark(bookmarkItems)
    gridRowData.value.forEach((item) => {
      if (item.bookmark) {
        item.bookmark = false
        item._book = 0
      }
    })
    bookmarkSelect.value = false
  }
}

const updateBookmark = (): void => {
  const B_Id = selectedBookmarkGroup?.value?.b_id

  let count = 0
  if (B_Id !== undefined) {
    gridRowData.value.forEach((item) => {
      if (B_Id === item._book) {
        item.bookmark = true
        count++
      } else {
        item.bookmark = false
      }

      // item.active = false
    })

    if (count === gridRowData.value.length) {
      bookmarkSelect.value = true
    } else {
      bookmarkSelect.value = false
    }
  }
}

const toggleActiveRow = (row): number => {
  let index = 0
  let selectedIndex = 0
  if (row !== undefined) {
    for (const item of gridRowData.value) {
      index++
      if (row.t_id === item.t_id) {
        selectedIndex = index
        item.active = true
      } else {
        item.active = false
      }
    }

    return selectedIndex
  }
}

const onSelectRow = async (row: DB_QUERY_PARAM<object>): Promise<[]> => {
  if (row.t_tableName === '' || isNaN(row.t_tableId)) return false

  modal.value = true
  detail.value = true
  if (detailViewTable.value !== undefined) {
    detailViewTable.value.scrollTop = 0
  }

  const param: DB_QUERY_PARAM = {
    queryTable: row.t_tableName,
    queryOffset: row.t_tableId,
    querySortFlag: false, // dummy
    querySortColName: '', // dummy
    querySortDescFlag: false, // dummy
    queryBookMarkId: 0 // dummy
  }

  const category = Array.isArray(configStore.category) && configStore.category.length > 0 ? configStore.category : []
  const category_1 = category.filter((item) => item.name === row.category_1)
  const category_2 =
    category_1[0].subList !== undefined ? category_1[0].subList.filter((item) => item.name === row.category_2) : []
  const category_3 =
    category_2[0].subList !== undefined ? category_2[0].subList.filter((item) => item.name === row.category_3) : []
  const selectedColumnDef = category_3[0].columnDef !== undefined ? category_3[0].columnDef : []

  detailInfoColumnDef.value = selectedColumnDef
  selectedRowData.value = await caseStore.getTimelineSelectedRowData(param)

  console.log('******* select row on timeline grid : columndef ', detailInfoColumnDef.value)
  console.log('******* select row on timeline grid : selectedRowData ', selectedRowData.value)
}

const updateGrid = async (page: number): Promise<void> => {
  if (!Number.isNaN(page)) {
    pagination.value.page = page
    await updateRowData(page)
  } else {
    await updateRowData(pagination.value.page)
  }
  // timelineGrid.value.scrollTo(0, 'start')
}

const updateRowData = async (page: number): Promise<void> => {
  const pageNumber = isNaN(page) && page < 0 ? 0 : page

  selectedBookmarkColor.value = selectedBookmarkGroup?.value?.b_color

  const startRow = ref(0)

  // 상세검색 여부에 따른 시작 row 설정
  if (isDetailSearch.value) {
    startRow.value = (pageNumber - 1) * selectedRowsPerPage.value
  } else {
    startRow.value = (pageNumber - 1) * selectedRowsPerPage.value + minTalbeId.value
  }

  startRowNumber.value = startRow.value

  currentQueryOffset.value = Math.floor(startRow.value / DEFAULT_OFFSET)
  console.log(
    `startRow: ${startRow.value + 1} currentOffset : ${currentOffset.value} currentQueryOffset : ${
      currentQueryOffset.value
    }`
  )

  // 상세검색시 offset 변경으로 조회하고 상세검색이 아닐시 t_id을 통해 페이지 변경 목록 조회
  if (currentOffset.value !== currentQueryOffset.value * DEFAULT_OFFSET) {
    currentOffset.value = currentQueryOffset.value * DEFAULT_OFFSET

    $q.loading.show()

    params.value._b_id = selectedBookmarkGroup.value.b_id

    if (isDetailSearch.value) {
      params.value._t_id = undefined
      params.value._offset = currentOffset.value
    } else {
      params.value._t_id = startRow.value
    }

    await caseStore.getTimelineData(params.value)
    isRendering.value = false
  } else {
    await timelineGrid.value.requestServerInteraction()
    isLoading = false
  }
}

// 유효한 타임라인 그리드의 최소 테이블 id와 최대 테이블 id 가져오기
const onDefaultTimelineGrid = async () => {
  const re = await window.ipcRenderer.invoke(KAPE_OP_CHANNELS.readRangeTimelineByTId)
  if (re !== 'D001' && re !== 'D003') {
    minTalbeId.value = re[0].min_id
    maxTalbeId.value = re[1].max_id

    rowCount.value = maxTalbeId.value - minTalbeId.value + 1

    // 상세검색 후 재검색을 위한 초기화
    params.value._full_search_flag = true
    params.value._categoryName = ''
    params.value._full_time_range_flag = false

    await caseStore.getTimelineData(params.value)

    ipcRenderer.on(KAPE_OP_CHANNELS.readTimelineContentsResult, async (value: DB_OPERATION_RESULT) => {
      console.log('Received data from main process:', value)

      if (value.state === '_000') {
        console.log(`****** defaultData_000 >>> state : ${value.state}`)
        offsetRowData = value.data
      }

      if (value.state === '_009') {
        console.log(`****** defaultData_009 >>> state : ${value.state}`)
        ipcRenderer.removeAllListeners(KAPE_OP_CHANNELS.readTimelineContentsResult)

        var defaultObj = getTableIdPageAndRow(offsetRowData[0]['t_id'])

        pagination.value.page = defaultObj.page
        params.value._t_id = defaultObj.id
        params.value._b_id = selectedBookmarkGroup.value.b_id

        ipcRenderer.on(KAPE_OP_CHANNELS.readTimelineContentsResult, onGetTimelineRowDatas)

        await caseStore.getTimelineData(params.value)

        timelineGrid.value.scrollTo(0, 'start')
      }
    })
  }
}

const onGetTimelineRowDatas = async (value: DB_OPERATION_RESULT): Promise<void> => {
  console.log(`****** onGetTimelineRowDatas >>> state : ${value.state}`)

  if (value.state === '_000') {
    console.log(`****** onGetTimelineRowDatas_000 >>> state : ${value.state}`)
    console.log('****** onGetTimelineRowDatas >>> data :', value.data)
    offsetRowData = value.data
  }

  if (value.state === '_009') {
    console.log(`****** onGetTimelineRowDatas_009 >>> state : ${value.state}`)
    $q.loading.hide()
    await timelineGrid.value.requestServerInteraction()
  }
}

const getTableIdPageAndRow = (t_id: number) => {
  var defaultRowObj: { page: number; id: number; row: number }
  const page = Math.ceil((t_id - (minTalbeId.value - 1)) / selectedRowsPerPage.value)
  const row = (t_id - minTalbeId.value) % selectedRowsPerPage.value
  const defaultPageOffset = t_id - row
  defaultRowObj = { page: page, id: defaultPageOffset, row: row }
  console.log('****** onGetTimelineRowDatas >>> defaultRowObj :', defaultRowObj)
  return defaultRowObj
}

const onGetTimelineDetailSearchCount = async (value: DB_OPERATION_RESULT): Promise<void> => {
  console.log(`****** onGetTimelineDetailSearchCount >>> state : ${value.state}`)

  if (value.state === '_000') {
    console.log(`****** onGetTimelineDetailSearchCount >>> state : ${value.state}`)
    console.log('****** onGetTimelineDetailSearchCount >>> data :', value.data)
    rowCount.value = value.data
  }

  if (value.state === '_009') {
    console.log(`****** onGetTimelineDetailSearchCount >>> state : ${value.state}`)
    await caseStore.getTimelineData(params.value)
    // $q.loading.hide()
    await timelineGrid.value.requestServerInteraction()
  }
}

const onRequest = async (props): Promise<void> => {
  const { sortBy, descending } = props.pagination

  loading.value = true

  const pageNumber = Number.isNaN(pagination.value.page) ? 1 : pagination.value.page

  // 총 row 개수 계산
  pagination.value.rowsNumber = rowCount.value

  if (isClickChartMoreButton.value) {
    let selectRow = undefined
    for (let index = 0; index < offsetRowData.length; index++) {
      const row = offsetRowData[index]
      if (clickChartMoreButtonId.value === row.t_id) {
        selectRow = row
        console.log('selected row >> ', row)
      }
    }

    gridRowData.value = offsetRowData

    setTimeout(() => {
      const selectedIndex = toggleActiveRow(selectRow)
      console.log('selectedIndex >>> ', selectedIndex)
      timelineGrid.value.scrollTo(selectedIndex, 'center')
      onSelectRow(selectRow)
      isShowChartDialog.value = false
      isClickChartMoreButton.value = false
    }, 1000);

  } else {
    gridRowData.value = offsetRowData
  }

  // if (offsetRowData.length > 0) {
  //   const insetOffset = startRowNumber.value - currentQueryOffset.value * DEFAULT_OFFSET

  //   gridRowData.value = offsetRowData.slice(insetOffset, insetOffset + selectedRowsPerPage.value)
  //   console.log('gridRowData.value(onRequest) : ', gridRowData.value)
  // }

  updateBookmark()

  pagination.value.page = pageNumber
  pagination.value.rowsPerPage = selectedRowsPerPage.value
  pagination.value.sortBy = sortBy
  pagination.value.descending = descending

  loading.value = false
}

// chart (s)
//    _pageSize: DEFAULT_OFFSET
const onChangeIsSelectedCategoryGroupAll = (value) => {
  if (value) {
    selectedCategoryGroup.value = categoryOptions.value.map((item) => item.value)
    updateChart(chartRow)
  } else {
    selectedCategoryGroup.value = []
    updateChart([])
  }
}
const onChangeIsSelectedCategoryGroup = (value) => {
  if (value.length > 0) {
    filteredChartRow = []
    value.forEach((categoryName) => {
      filteredChartRow.push(...chartRow.filter((item) => item.name === categoryName))
    })
    updateChart(filteredChartRow)
  }
}

// 차트 데이터 업데이트
const detectTimeGap = 1
let currentDate = null
let isLoading = false
let direction = ''

const onClickMoreButton = async (value, category2Name): Promise<void> => {
  $q.loading.show()

  isClickChartMoreButton.value = true

  if (isDetailSearch.value) {
    const chartParamsObj = Object.assign({}, chartParams.value)

    chartParamsObj._full_search_flag = false
    chartParamsObj._categoryName = value.category_1
    chartParamsObj._full_time_range_flag = false
    chartParamsObj._s_time = value.t_dateTime
    chartParamsObj._e_time = moment(value.t_dateTime).add(1, 'hours').format('YYYY-MM-DD HH:mm:ss')

    const re = await window.ipcRenderer.invoke(KAPE_OP_CHANNELS.readTempMinTimelineByRange_Category, chartParamsObj)

    if (re !== 'D001' && re !== 'D003') {
      console.log('### Test-DB-Read-MK_Ok:', re)

      params.value._s_time = selectChartStartDate.value
      params.value._e_time = selectChartEndDate.value
      selectStartDate.value = selectChartStartDate.value
      selectEndDate.value = selectChartEndDate.value

      pagination.value.page = Math.ceil((re.data.temp_t_id + 1) / selectedRowsPerPage.value)
      rowCount.value = detailChartCount.value
      clickChartMoreButtonId.value = re.data.t_id

      await updateGrid(pagination.value.page)
    }
  } else {
    Object.assign(selectChartClickParmas, chartClickParams)

    selectChartClickParmas._category1Name = value.category_1
    selectChartClickParmas._category2Name = category2Name
    selectChartClickParmas._s_time = value.t_dateTime
    selectChartClickParmas._e_time = moment(value.t_dateTime).add(1, 'hours').format('YYYY-MM-DD HH:mm:ss')

    const re = await window.ipcRenderer.invoke(
      KAPE_OP_CHANNELS.readMinTimelineByTimeRange_Cagegory,
      selectChartClickParmas
    )

    if (re !== 'D001' && re !== 'D003') {
      console.log('### Test-DB-Read-MK_Ok:', re)

      var defaultObj = getTableIdPageAndRow(re.t_id)

      pagination.value.page = defaultObj.page
      params.value._t_id = defaultObj.id
      clickChartMoreButtonId.value = re.t_id

      await updateGrid(pagination.value.page)
    }
  }

  $q.loading.hide()

  // const re = await window.ipcRenderer.invoke(KAPE_OP_CHANNELS.readMinTimelineByTime, value.t_dateTime)
  // if (re !== 'D001' && re !== 'D003') {
  //   console.log('### Test-DB-Read-MK_Ok:', re)

  //   var defaultObj = getTableIdPageAndRow(re.t_id)

  //   pagination.value.page = defaultObj.page
  //   params.value._t_id = defaultObj.id
  //   let selectRow = defaultObj.row

  //   await updateGrid(pagination.value.page)
  //   const selectedIndex = toggleActiveRow(selectRow)
  //   console.log('selectedIndex >>> ', selectedIndex)
  //   timelineGrid.value.scrollTo(selectedIndex, 'center')
  //   onSelectRow(selectRow)
  //   isShowChartDialog.value = false
  // }

  // await onDefaultTimelineGrid()
  // let selectedOffsetRowIndex = 0
  // let selectedRow = null
  // for (let index = 0; index < offsetRowData.length; index++) {
  //   const row = offsetRowData[index]
  //   if (value.t_id === row.t_id) {
  //     selectedOffsetRowIndex = index
  //     selectedRow = row
  //     console.log('selected row >> ', row)
  //   }
  // }

  // const page = Math.floor((currentOffset.value + selectedOffsetRowIndex) / selectedRowsPerPage.value) + 1
  // console.log('selected Page >>> ', page)
  // await updateGrid(page)
  // const selectedIndex = toggleActiveRow(selectedRow)
  // console.log('selectedIndex >>> ', selectedIndex)
  // timelineGrid.value.scrollTo(selectedIndex, 'center')
  // onSelectRow(selectedRow)
  // isShowChartDialog.value = false
}

const onChangeStartDateSelector = (value): void => {
  console.log('onChangeStartDateSelector')
  dateSelector.value = 'selectDate'
  if (value !== null) {
    selectStartDate.value = moment(value || '00:00', 'HH:mm').format('YYYY-MM-DD HH:mm:ss')
  } else {
    selectStartDate.value = null
  }
}

const onChangeEndDateSelector = (value): void => {
  console.log('onChangeEndDateSelector')
  dateSelector.value = 'selectDate'
  if (value !== null) {
    selectEndDate.value = moment(value).seconds(59).format('YYYY-MM-DD HH:mm:ss')
  } else {
    selectEndDate.value = null
  }
}

const onChangeChartStartDateSelector = (value): void => {
  chartDateSelector.value = 'selectDate'
  if (value !== null) {
    selectChartStartDate.value = moment(value || '00:00', 'HH:mm').format('YYYY-MM-DD HH:mm:ss')
  } else {
    selectChartStartDate.value = null
  }
}

const onChangeChartEndDateSelector = (value): void => {
  chartDateSelector.value = 'selectDate'
  if (value !== null) {
    selectChartEndDate.value = moment(value).seconds(59).format('YYYY-MM-DD HH:mm:ss')
  } else {
    selectChartEndDate.value = null
  }
}

// watch(selectStartDate, (value) => {
//   selectStartDate.value = moment(value).format('YYYY-MM-DD HH:mm:ss')
// })

// watch(selectEndDate, (value) => {
//   selectEndDate.value = moment(value).format('YYYY-MM-DD HH:mm:ss')
// })

// watch(selectChartStartDate, (value) => {
//   selectChartStartDate.value = moment(value).format('YYYY-MM-DD HH:mm:ss')
// })

// watch(selectChartEndDate, (value) => {
//   selectChartEndDate.value = moment(value).seconds(59).format('YYYY-MM-DD HH:mm:ss')
// })

const onClickSearchChart = async (): Promise<void> => {
  // Object.assign(originalParams.value, chartParams.value)

  const diffTime = moment(selectChartEndDate.value, 'YYYY-MM-DD').diff(
    moment(selectChartStartDate.value, 'YYYY-MM-DD'),
    'years',
    true
  )

  if (diffTime < 1) {
    chartParams.value._s_time = selectChartStartDate.value
    chartParams.value._e_time = selectChartEndDate.value
    chartParams.value._offset = 0
    chartParams.value._t_id = undefined
    currentOffset.value = -1

    $q.loading.show()
    if (isDetailSearch.value) {
      await caseStore.getTimelineDetailChartData(chartParams.value)
    } else {
      await caseStore.getTimelineChartData(chartParams.value)
    }
  } else {
    openError('기간설정은 1년 이하의 기간만 설정이 가능합니다')
  }
}

const updateCommits = (chart) => {
  console.log('updateCommits')

  const filteredData = chart.filteredData().reduce((total, repo) => total.concat(repo.data), [])

  if (filteredData.length > 0) {
    chartDirection.value = ''

    const offsetRowFirstDate = moment(offsetRowData[0]._DateTime)
    const offsetRowLastDate = moment(offsetRowData[offsetRowData.length - 1]._DateTime)

    // zoomStart : 차트 내 max date (right side)값
    // zoomEnd : 차트 내 min date (left side)값
    const zoomStart = moment(chart.scale().domain()[0])
    const zoomEnd = moment(chart.scale().domain()[1])
    // currentDate는 zoomStart 비교

    // const zoomStart = moment(chart.scale().domain()[0]).subtract(detectTimeGap, 'seconds')
    // const zoomEnd = moment(chart.scale().domain()[1]).add(detectTimeGap, 'seconds')

    if (offsetRowLastDate !== null) {
      if (zoomStart.isSame(offsetRowLastDate)) {
        direction = ''
      } else {
        direction = zoomStart.isBefore(offsetRowLastDate) ? 'increase' : 'decrease'
      }
    }

    // console.log('currentDate > ', currentDate.format('YYYY-MM-DD HH:mm:ss'))
    console.log('zoomStart > ', zoomStart.format('YYYY-MM-DD HH:mm:ss'))
    console.log('zoomEnd > ', zoomEnd.format('YYYY-MM-DD HH:mm:ss'))
    console.log('direction > ', direction)
    console.log('offsetRowFirstDate > ', offsetRowFirstDate)

    // // offset 증가 방향
    // if (direction === 'increase') {
    //   // true일 때 offset 호출
    //   const isPrev = zoomStart.isBefore(offsetRowFirstDate)
    //   if (isPrev) {
    //     isLoading = true
    //     const offsetSize = currentOffset.value + DEFAULT_OFFSET
    //     let page = offsetSize / selectedRowsPerPage.value + 1

    //     if (page > Math.abs(rowCount.value / selectedRowsPerPage.value)) {
    //       page = Math.abs(rowCount.value / selectedRowsPerPage.value)
    //     }
    //     pagination.value.page = page

    //     console.log('call page >>> ', pagination.value.page)
    //     // updateGrid(pagination.value.page)
    //     currentDate = null
    //   }
    // }
    // if (direction === 'decrease') {
    //   const isNext = zoomEnd.isAfter(offsetRowLastDate)
    //   if (isNext && currentOffset.value >= DEFAULT_OFFSET) {
    //     isLoading = true
    //     const offsetSize = currentOffset.value - DEFAULT_OFFSET
    //     const page = offsetSize / selectedRowsPerPage.value + 1

    //     if (page < 0) {
    //       page = 0
    //     }
    //     pagination.value.page = page

    //     console.log('call page >>> ', pagination.value.page)
    //     // updateGrid(pagination.value.page)
    //     currentDate = null
    //   }
    // }

    //
    // // offset 감소 방향
    // if (direction === 'decrease') {
    //   // true일 때 offset 호출
    //   const isNext = zoomEnd.isAfter(offsetRowLastDate)
    //   if (isNext && currentOffset.value > 0) {
    //     isLoading = true
    //     currentOffset.value--
    //     pagination.value.page = (currentOffset.value * DEFAULT_OFFSET) / selectedRowsPerPage.value + 1
    //
    //     console.log('call page >>> ', pagination.value.page)
    //     updateRowData(pagination.value.page)
    //   }
    // }

    // console.log('currentOffset.value : ', currentOffset.value)
    // console.log('filteredData ', filteredData.length)
    // console.log('chartDirection.value ', chartDirection.value)
    // console.log('zoomStart ', zoomStart.format('YYYY-MM-DD HH:ss:mm'))
    // console.log('offsetRowFirstDate ', offsetRowFirstDate.format('YYYY-MM-DD HH:ss:mm'))
    // console.log('zoomEnd ', zoomEnd.format('YYYY-MM-DD HH:ss:mm'))
  }
}

const appendChartData = (cachedRowArray: object[]): void => {
  /**
   *     _book: 0,
   *     t_id: 18792591,
   *     _DateTime: '1601-01-01 00:00:00',
   *     _Attribute: 'Created0x10',
   *     _TimelineCategory: 'MFT',
   *     _Category: 'Operating System',
   *     _Type: 'FileSystem',
   *     ItemName: 'FileName',
   *     ItemValue: 'F349583F0C795DB30FA4F0CBCB99488E236378587356EDD07FB0F3FAF595F544.png',
   *     t_tableName: 'MFTECmd_MFT_Output',
   *     t_tableId: 2844987,
   *     category_1: 'FileSystem',
   *     category_2: 'MFT',
   *     category_3: 'MFTECmd_MFT',
   *     _main: 0,
   *     bookmark: true,
   *     active: false
   */
  if (Array.isArray(cachedRowArray) && cachedRowArray.length > 0) {
    categoryOptions.value = []
    selectedCategoryGroup.value = []
    chartRow = []
    chartStartDate.value = null
    chartEndDate.value = null
    detailChartCount.value = 0

    for (let index = 0; index < cachedRowArray.length; index++) {
      let item = cachedRowArray[index]

      if (isDetailSearch.value) {
        detailChartCount.value += item.c_count
      }

      const isValidIndex = chartRow.findIndex((data) => data.name === item.category_1)

      item.detail = JSON.parse(item.detail)

      let obj = { info: item, date: item.t_dateTime }

      if (isValidIndex === -1) {
        let option = { label: item.category_1, value: item.category_1 }
        categoryOptions.value.push(option)
        selectedCategoryGroup.value.push(item.category_1)

        let row = { name: '', data: [] }
        row.name = item.category_1
        row.data.push(obj)
        chartRow.push(row)
      } else {
        if (chartRow[isValidIndex].fullData === undefined) {
          chartRow[isValidIndex].data.push(obj)
        } else {
          chartRow[isValidIndex].fullData.push(obj)
        }
      }

      // 최초 1회만 기준 일자를 시작일로 잡는다.
      if (chartStartDate.value === null) {
        chartStartDate.value = moment(item.t_dateTime)
      } else {
        chartStartDate.value = chartStartDate.value.isBefore(item.t_dateTime)
          ? chartStartDate.value
          : moment(item.t_dateTime)
      }

      // 최초 1회만 기준 일자를 시작일로 잡는다.
      if (chartEndDate.value === null) {
        chartEndDate.value = chartStartDate.value
      } else {
        chartEndDate.value = chartEndDate.value.isAfter(item.t_dateTime) ? chartEndDate.value : moment(item.t_dateTime)
      }
    }
  }

  console.log('chartStartDate : ', chartStartDate.value.format('YYYY-MM-DD HH:mm:ss'))
  console.log('chartEndDate : ', chartEndDate.value.format('YYYY-MM-DD HH:mm:ss'))
}

let dragging = null
const updateChart = (rowData): void => {
  $q.loading.show()
  if (chartRow.length <= MAX_CHART_ROW_SIZE) {
    console.log('appended finished >> ', rowData)

    const chart = eventDrops({
      d3,
      locale: krLocale,
      bound: {
        format: d3.timeFormat('%Y-%m-%d')
      },
      metaballs: {
        blurDeviation: 10,
        colorMatrix: '1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 50 -10'
      },
      axis: {
        formats: {
          milliseconds: '%L',
          seconds: ':%S',
          minutes: '%I:%M',
          hours: '%I %p',
          days: '%a %d',
          weeks: '%b %d',
          months: '%B',
          year: '%Y'
        },
        verticalGrid: false,
        tickPadding: 6
      },
      drops: (row) => row.data,
      drop: {
        // 데이터 색깔 null이면 라벨과 동일
        color: null,

        date: (d) => new Date(d.date),
        radius: 5,

        // 툴팁 마우스오버
        onMouseOver: (commit) => {
          tooltip
            .style('left', `${d3.event.pageX - 46}px`)
            .style('top', `${d3.event.pageY + 14}px`)
            .style('z-index', '9999')
            .transition()
            .duration(100)
            .style('opacity', 1)
            .style('pointer-events', 'auto')

          tooltip
            .html(
              `<div class="commit">
                    <div class="content">
                        <h3 class="date">${dateFormat(new Date(commit.date))}</h3>
                        <div id="buttonContainer">
                          <p>
                            category_2
                            ${commit.info.detail
                              .map(
                                (detail) => `<strong><span>&nbsp&nbsp- ${detail.category_2} : ${detail.c_count} </span>
                              </strong><button id="more" class="more-view" value="${detail.category_2}")">더보기</button>`
                              )
                              .join('')}
                          </p>
                        </div>
                    </div>
                </div>`
            )
            .select('#buttonContainer')
            .selectAll('button')
            .on('click', function () {
              let categoryName = d3.event.target.value
              onClickMoreButton(commit.info, categoryName)
              tooltip.transition().duration(500).style('opacity', 0).style('pointer-events', 'none')
            })
          // .select('#more') // 버튼 선택
          // .on('click', function () {
          //   let categoryName = d3.event.target.value
          //   onClickMoreButton(commit.info, categoryName)
          //   tooltip.transition().duration(500).style('opacity', 0).style('pointer-events', 'none')
          // })
        },
        onMouseOut: () => {
          tooltipDim.style('opacity', 1).style('pointer-events', 'auto')
        }
      },
      label: {
        padding: 20,
        text: (d) => `${d.name} (${d.data.length})`,
        width: 200
      },
      indicator: {
        previousText: '◀',
        nextText: '▶'
      },
      line: {
        // color: (_, index) => d3.schemeCategory10[index],
        color: (_, index) => myColor[index],
        height: 42
      },
      margin: {
        top: 30,
        right: 10,
        bottom: 10,
        left: 10
      },
      range: {
        // start: new Date(new Date().getTime() - 3600000 * 24 * 365 * 5), // 5 years ago
        // end: new Date()
        start: chartStartDate.value,
        end: chartEndDate.value
      },
      zoom: {
        onZoomStart: () => {},
        onZoom: () => {},
        onZoomEnd: () => {
          if (!isLoading) {
            isLoading = true
            updateCommits(chart)
          }
          clearTimeout(dragging)
          dragging = setTimeout(() => {
            isLoading = false
          }, 500)
        },
        minimumScale: 1
        // maximumScale: 20
      },
      numberDisplayedTicks: {
        small: 3,
        medium: 5,
        large: 7,
        extra: 12
      },
      breakpoints: {
        small: 576,
        medium: 768,
        large: 992,
        extra: 1200
      }
    })
    d3.select('#chart-drops').data([rowData]).call(chart)
  } else {
    openError(`처리가능한 데이터의 개수를 초과하여 처리가 불가합니다. 현재 처리가능한 개수 : ${MAX_CHART_ROW_SIZE}`)
  }
  $q.loading.hide()
}

const showChartDialog = async (event): Promise<void> => {
  selectChartStartDate.value = selectStartDate.value
  selectChartEndDate.value = selectEndDate.value

  if (detailSearchModal.value) {
    detailSearchModal.value = false
  }

  $q.loading.show()

  if (isDetailSearch.value) {
    chartDateSelector.value = 'selectDate'

    Object.assign(chartParams.value, params.value)

    await caseStore.getTimelineDetailChartData(chartParams.value)
  } else {
    chartDateSelector.value = dateSelector.value

    Object.assign(chartParams.value, params.value)

    chartParams.value._s_time = selectChartStartDate.value
    chartParams.value._e_time = selectChartEndDate.value
    chartParams.value._offset = 0
    chartParams.value._t_id = undefined
    currentOffset.value = -1

    await caseStore.getTimelineChartData(chartParams.value)
  }
}

const onGetTimelineChartData = async (value: DB_OPERATION_RESULT): Promise<void> => {
  console.log(`****** onGetTimelineChartData >>> state : ${value.state}`)

  if (value.state === '_000') {
    console.log(`****** onGetTimelineChartData >>> state : ${value.state}`)
    console.log('****** onGetTimelineChartData >>> data :', value.data)
    offsetChartData = value.data
  }

  if (value.state === '_009') {
    console.log(`****** onGetTimelineChartData_009 >>> state : ${value.state}`)
    appendChartData(offsetChartData)
    updateChart(chartRow)
  }
}

const onGetTimelineDetailChartData = async (value: DB_OPERATION_RESULT): Promise<void> => {
  console.log(`****** onGetTimelineDetailChartData >>> state : ${value.state}`)

  if (value.state === '_000') {
    console.log(`****** onGetTimelineDetailChartData >>> state : ${value.state}`)
    console.log('****** onGetTimelineDetailChartData >>> data :', value.data)
    offsetChartData = value.data
  }

  if (value.state === '_009') {
    console.log(`****** onGetTimelineDetailChartData >>> state : ${value.state}`)
    appendChartData(offsetChartData)
    updateChart(chartRow)
    $q.loading.hide()
  }
}

// const onFinishGetTimelineChartData = (value): void => {
//   console.log('onFinishGetTimelineChartData > ', value.state)
//
//   if (chartRow.length <= MAX_CHART_ROW_SIZE) {
//     console.log('append row data >> ', value.data)
//     appendChartData(value.data)
//     console.log('appended finished >> ', chartRow)
//   }
//
//   $q.loading.hide()
// }

// chart (e)

onMounted(async (): Promise<void> => {
  await caseStore.getBookmarkGroupList()

  selectedBookmarkGroup.value = caseStore.currentBookmarkItem
  selectedBookmarkColor.value = selectedBookmarkGroup?.value?.b_color

  isDetailSearch.value = false

  if (ipcRenderer !== undefined) {
    ipcRenderer.on(KAPE_OP_CHANNELS.bookMarkMapperTableResult, onBookmarkItemAdded)
  }

  if (ipcRenderer !== undefined) {
    ipcRenderer.on(KAPE_OP_CHANNELS.readTimelineChartContentsResult, onGetTimelineChartData)
  }

  if (ipcRenderer !== undefined) {
    ipcRenderer.on(KAPE_OP_CHANNELS.readTimelineContentsCountResult, onGetTimelineDetailSearchCount)
  }

  if (ipcRenderer !== undefined) {
    ipcRenderer.on(KAPE_OP_CHANNELS.createReadTimelineChartContentsResult, onGetTimelineDetailChartData)
  }

  // if (ipcRenderer !== undefined) {
  //   ipcRenderer.on(KAPE_OP_CHANNELS.readTimelineContentsResult, onFinishedGetTimelineRowDatas)
  // }

  // if (ipcRenderer !== undefined) {
  //   ipcRenderer.on(KAPE_OP_CHANNELS.readOneTimeTimelineContentsResult, onFinishGetTimelineChartData)
  // }

  onDefaultTimelineGrid()
  $q.loading.show()

  // 임시로 쿼리 막음 다시 되돌릴 예정
  // $q.loading.show()
  // console.log('param : ', params.value)
  // await caseStore.getTimelineDataCount(params.value)

  // test objects
  // rowCount.value = 1000
  // gridRowData.value = sampleObject
})

onUnmounted(async (): Promise<void> => {
  console.log(`****** onUnmounted`)
  if (ipcRenderer !== undefined) {
    ipcRenderer.removeAllListeners(KAPE_OP_CHANNELS.readTimelineContentsResult)
  }

  if (ipcRenderer !== undefined) {
    ipcRenderer.removeAllListeners(KAPE_OP_CHANNELS.readTimelineChartContentsResult)
  }

  if (ipcRenderer !== undefined) {
    ipcRenderer.removeAllListeners(KAPE_OP_CHANNELS.readTimelineContentsCountResult)
  }

  if (ipcRenderer !== undefined) {
    ipcRenderer.removeAllListeners(KAPE_OP_CHANNELS.createReadTimelineChartContentsResult)
  }
})
// 북마크 Dialog isShow
const isShowBookmarkDialog: Ref<boolean> = ref(false)
// 검색 Dialog isShow
const isShowSearchDialog: Ref<boolean> = ref(false)

function onTabClick(id: number, option?: any) {
  if (id === 0) {
    // alert('myfunc :' + id)
    isShowBookmarkDialog.value = true
  } else if (id === 1) {
    isShowSearchDialog.value = true
  }
}

defineExpose({
  onTabClick
})
/***************************************
 * @description 검색 다이얼로그
 */

// 검색 다이얼로그 닫기 이벤트
async function onDialogSearchClose(isClose: any) {
  isShowSearchDialog.value = isClose
  if (isClose === false) {
    await timelineGrid.value.requestServerInteraction()
  }
}

/***************************************
 * @description 북마크 다이얼로그
 */

// 북마크 다이얼로그 닫기 이벤트
async function onDialogBookmarkClose(isClose: any) {
  isShowBookmarkDialog.value = isClose
  if (isClose === false) {
    await timelineGrid.value.requestServerInteraction()
  }
}
</script>

<template>
  <div class="grid-content-wrap">
    <q-toolbar>
      <q-btn outline color="primary" label="그래프" class="graph-btn" @click="isShowChartDialog = true">
        <Icon icon="carbon:popup" class="cue" color="primary" />
      </q-btn>
      <q-space></q-space>
      <!-- 기간 설정 -->
      <div class="date-search-wrap">
        <strong class="">기간 설정</strong>
        <q-radio v-model="dateSelector" dense val="threeMonths" label="3개월"></q-radio>
        <q-radio v-model="dateSelector" dense val="sixMonths" label="6개월"></q-radio>
        <q-radio v-model="dateSelector" dense val="twelveMonths" label="12개월"></q-radio>
        <q-btn
          outline
          icon-right="keyboard_arrow_down"
          class="detail-search-btn"
          :class="{ active: detailSearchModal }"
          @click="toggleDetailSearch"
        >
          <span>상세검색</span>
        </q-btn>
      </div>
      <div v-show="detailSearchModal" class="detail-search">
        <strong>기간 설정</strong>
        <div class="date-group">
          <DatetimeCalendar
            :model-value="selectStartDate"
            required
            class="date"
            :timetype="'start-time'"
            @update="onChangeStartDateSelector"
          />
          <span class="range">부터</span>
          <DatetimeCalendar
            :model-value="selectEndDate"
            required
            class="date"
            :timetype="'end-time'"
            @update="onChangeEndDateSelector"
          />
          <span>※ 1년 단위로 검색이 가능합니다</span>
        </div>
        <q-separator></q-separator>
        <div class="category-wrap">
          <strong class="tit">카테고리 선택</strong>
          <div class="row items-center cate-chk-wrap">
            <!-- 카테고리 선택 전체 체크 -->
            <q-checkbox
              v-model="isSelectGridCategoryGroupAll"
              dense
              label="전체"
              class="all"
              @update:model-value="selectGridCategoryGroupAll"
            ></q-checkbox>
            <!-- 카테고리 선택 목록 -->
            <q-option-group
              v-model="isSelectGridCategoryGroup"
              :options="gridCategoryOptions"
              dense
              color="primary"
              type="checkbox"
              @update:model-value="selectGridCategoryGroup"
            >
              <template #label="opt">
                <div class="row items-center">
                  <span>{{ opt.label }}</span>
                </div>
              </template>
            </q-option-group>
          </div>
        </div>
        <q-separator></q-separator>
        <q-btn outline class="search-btn" @click="onClickSearchGrid">
          <Icon icon="ic:baseline-search" />
          <span>검색</span>
        </q-btn>
      </div>
      <q-space></q-space>
      <!-- <span class="text-md-2 page-txt">페이지당 표시</span>
      <q-select
        v-model="selectedRowsPerPage"
        outlined
        dense
        :options="rowsPerPageArr"
        class="select-page q-mr-sm"
      ></q-select> -->
      <!-- 북마크 -->
      <BookmarkItem :bookmark-data-array="bookmarkGroup" @update="onChangeBookmarkGroup" />
    </q-toolbar>
    <div class="timeline-grid">
      <div class="artifacts-table-wrap" :style="'--selected-bookmark-color : ' + selectedBookmarkColor">
        <q-table
          ref="timelineGrid"
          v-model:selected="rowSelected"
          v-model:pagination="pagination"
          v-table-columns-resizeable="columnDef"
          :columns="columnDef"
          :hide-bottom="true"
          :loading="loading"
          :rows="gridRowData"
          :class="{ open: detail, show: modal }"
          row-key="index"
          selection="multiple"
          table-class="table-list"
          separator="cell"
          no-data-label="조회된 결과가 없습니다."
          tabindex="0"
          hide-pagination
          virtual-scroll
          :virtual-scroll-slice-size="selectedRowsPerPage"
          virtual-scroll-item-size="40"
          virtual-scroll-sticky-size-start="40"
          @request="onRequest"
        >
          <template #header="props">
            <q-tr :props="props">
              <q-th>
                <q-checkbox
                  v-if="selectedBookmarkGroup?.b_id !== 0"
                  v-model="bookmarkSelect"
                  checked-icon="mdi-bookmark"
                  unchecked-icon="mdi-bookmark-outline"
                  indeterminate-icon="mdi-bookmark-minus"
                  @update:model-value="onChangeBookmarkAll"
                />
                <q-icon v-else name="mdi-bookmark-outline" />
              </q-th>
              <q-th v-for="col in props.cols" :key="col.name" :props="props">
                {{ col.label }}
              </q-th>
            </q-tr>
          </template>
          <template #body="props">
            <q-tr
              :props="props"
              :class="{ active: props.row.active }"
              @click="
                () => {
                  onSelectRow(props.row)
                  toggleActiveRow(props.row)
                }
              "
            >
              <q-td class="text-center">
                <q-checkbox
                  v-model="props.row.bookmark"
                  checked-icon="mdi-bookmark"
                  unchecked-icon="mdi-bookmark-outline"
                  @update:model-value="onChangeBookmark(props.row)"
                />
              </q-td>
              <q-td v-for="col in props.cols" :key="col.name" :props="props">
                {{ col.value }}
              </q-td>
            </q-tr>
          </template>
        </q-table>

        <!-- 상세보기화면 -->
        <!-- detail-btn을 누르면 상세보기화면이 아코디언 형식으로 접혀야합니다.... -->
        <div class="detail-view-wrap" :class="{ open: detail, show: modal }">
          <div class="detail-btn-wrap">
            <q-btn flat icon="keyboard_arrow_left" class="detail-btn" @click="detail = !detail"></q-btn>
          </div>
          <div class="detail-view-header text-md-1 bold">세부정보</div>
          <div ref="detailViewTable" class="detail-view-table">
            <table class="text-md-3">
              <colgroup>
                <col width="35%" />
                <col width="65%" />
              </colgroup>
              <tbody>
                <template v-for="columnInfo in detailInfoColumnDef">
                  <tr v-if="columnInfo !== undefined">
                    <td>{{ columnInfo.label }}</td>
                    <td>{{ selectedRowData[columnInfo.field] }}</td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div class="pagination-wrap">
        <q-pagination
          v-model="pagination.page"
          :max-pages="10"
          :max="pageMax"
          color="grey"
          direction-links
          boundary-links
          :ellipses="false"
          :boundary-numbers="false"
          icon-first="keyboard_double_arrow_left"
          icon-last="keyboard_double_arrow_right"
          icon-prev="keyboard_arrow_left"
          icon-next="keyboard_arrow_right"
          @update:model-value="updateGrid"
        ></q-pagination>
      </div>
    </div>
    <q-dialog v-model="isShowChartDialog" @show="showChartDialog">
      <q-card class="q-dialog-plugin pop-default timeline-dialog-wrap">
        <!-- 헤더 -->
        <q-card-section class="d-header">
          <h1>Timeline</h1>
          <q-space></q-space>
          <q-btn v-close-popup icon="close" flat dense @click="isShowChartDialog = false"></q-btn>
        </q-card-section>
        <!-- 본문 -->
        <q-card-section class="d-container column">
          <!-- 카테고리 선택 -->
          <div class="category-wrap row tit-wrap">
            <strong class="tit">카테고리 선택</strong>
            <div class="row items-center cate-chk-wrap">
              <!-- 카테고리 선택 전체 체크 -->
              <q-checkbox
                v-model="isSelectedCategoryGroupAll"
                dense
                label="전체"
                @update:model-value="onChangeIsSelectedCategoryGroupAll"
              ></q-checkbox>
              <!-- 카테고리 선택 목록 -->
              <q-option-group
                v-model="selectedCategoryGroup"
                :options="categoryOptions"
                dense
                color="primary"
                type="checkbox"
                @update:model-value="onChangeIsSelectedCategoryGroup"
              >
                <template #label="opt">
                  <div class="row items-center">
                    <span>{{ opt.label }}</span>
                  </div>
                </template>
              </q-option-group>
            </div>
          </div>
          <!-- 기간 설정 및 키워드 -->
          <div class="date-search-wrap row tit-wrap">
            <strong class="tit second">기간 설정</strong>
            <div class="column">
              <div class="date-radio-wrap">
                <q-radio v-model="chartDateSelector" dense val="threeMonths" label="3개월"></q-radio>
                <q-radio v-model="chartDateSelector" dense val="sixMonths" label="6개월"></q-radio>
                <q-radio v-model="chartDateSelector" dense val="twelveMonths" label="12개월"></q-radio>
                <q-radio v-model="chartDateSelector" dense val="selectDate" label="직접선택" class="self">
                  <div class="date-group">
                    <!-- <DatetimeCalendar
                      v-model="selectChartStartDate"
                      required
                      class="date"
                      @update="onChangeChartStartDateSelector"
                    /> -->
                    <DatetimeCalendar
                      :model-value="selectChartStartDate"
                      required
                      class="date"
                      :timetype="'start-time'"
                      @update="onChangeChartStartDateSelector"
                    />
                    <span class="range">~</span>
                    <!-- <DatetimeCalendar
                      v-model="selectChartEndDate"
                      required
                      class="date"
                      @update="onChangeChartEndDateSelector"
                    /> -->
                    <DatetimeCalendar
                      :model-value="selectChartEndDate"
                      required
                      class="date"
                      :timetype="'end-time'"
                      @update="onChangeChartEndDateSelector"
                    />
                  </div>
                </q-radio>
                <q-btn outline class="search-btn" @click="onClickSearchChart">
                  <Icon icon="ic:baseline-search" />
                  <span>검색</span>
                </q-btn>
              </div>
              <div class="row search-field-wrap items-end"></div>
            </div>
          </div>
          <!-- 타임라인차트 -->
          <div class="chart-bg">
            <div class="timeline-chart-wrap">
              <div id="chart-drops" class="chart-drops" style="max-width: 1520px"></div>
            </div>
          </div>
        </q-card-section>
        <q-card-actions class="d-footer">
          <q-btn outline icon="mdi-close" label="닫기" @click="isShowChartDialog = false" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
  <DialogBookmark
    :is-show="isShowBookmarkDialog"
    :current-bookmark="selectedBookmarkGroup"
    @update:isShow="onDialogBookmarkClose"
  />
  <DialogSearch :is-show="isShowSearchDialog" @update:isShow="onDialogSearchClose" />
</template>

<style scoped lang="scss">
.grid-content-wrap {
  width: 100%;
  height: calc(100% - 5.625rem);
  padding: 0 1.2rem;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  position: relative;

  // 상단 툴바 (그래프 버튼, 북마크)
  .q-toolbar {
    height: 3.75rem;
    padding: 0rem;
    border-bottom: 1px solid #0a141e;
    .page-txt {
      padding-right: 0.5rem;
    }
    .graph-btn {
      padding: 0rem 2.375rem 0rem 1rem;
      .cue {
        width: 0.75rem;
        height: 0.75rem;
        position: absolute;
        right: 10px;
        top: 6px;
      }
    }

    .date-search-wrap {
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: 14px;
      .date-group :deep {
        gap: 7px;
        .dp__main {
          width: 12.8125rem;
          .q-radio__label {
            display: flex;
          }
        }
      }
      .detail-search-btn :deep {
        .q-icon {
          margin-left: 0.25rem;
        }
        &.active {
          .q-icon {
            transform: rotate(180deg) !important;
          }
        }
      }
    }

    // 테이블 상단 기간설정 모달
    .detail-search :deep {
      position: absolute;
      top: calc(100%);
      left: calc(50% - 700px);
      max-width: 1400px;
      background-color: #42464a;
      border-radius: 0.25rem;
      border: 1px solid #54585c;
      padding: 1.5rem 1.25rem;
      display: block;
      z-index: 999;
      box-shadow: 0 6px 20px rgba(0, 0, 0, 60%);
      // 기간선택 인풋
      .date-group {
        padding: 0.625rem 0 1rem;
        justify-content: flex-start;
        .dp__main {
          max-width: 12.8125rem;
        }
        > span {
          padding: 0 0.5rem;
        }
      }
      // category-wrap
      .category-wrap {
        margin: 1rem 0;
        position: relative;
        .cate-chk-wrap {
          padding: 0.5rem 0 0.25rem 0;
          // 전체
          > .q-checkbox {
            &.all {
              position: absolute;
              top: -10px;
              left: 115px;
              padding: 0.5rem;
            }
          }
          // 그룹
          .q-option-group {
            width: fit-content;
            margin: 0.5rem 0 0 0;
            padding: 0.5rem;
            background: rgba(#0a141e, 20%);
            border-radius: 0.25rem;
            .q-checkbox {
              margin-right: 1rem !important;
            }
          }
        }
      }
      // 검색 버튼
      .search-btn {
        margin-top: 1rem;
        padding: 0.25rem 1.625rem !important;
        .q-btn__content {
          .iconify {
            margin-right: 0.25rem;
          }
        }
      }
    }
  }

  // 목록 테이블
  .timeline-grid :deep {
    height: calc(100% - 3.75rem);
    padding: 1.25rem 0px 2rem;
    .artifacts-table-wrap {
      display: flex;
      flex-direction: row;
      width: 100%;
      height: calc(100% - 2.5rem);
      .q-table__container {
        flex: auto 1;
        width: 100%;
        height: 100%;
        border-radius: 4px 4px 0 0;
        box-shadow: none;
        transition: width 0.25s ease-in;
        &.show {
          width: calc(100% - 22px);
          transition: width 0.25s ease-in;
        }
        &.open {
          width: calc(100% - 40.857rem);
          transition: width 0.25s ease-in;
        }
      }
      .table-list {
        position: relative;
        width: 100%;
        background-color: #101214;
        .q-table {
          border-radius: 4px 4px 0 0;
          table-layout: fixed;
          thead tr th {
            position: sticky;
            z-index: 1;
          }
          thead tr:first-child th {
            top: 0;
            .q-icon {
              font-size: 24px;
              height: 40px;
            }
          }
          thead tr,
          tbody td {
            height: auto;
            .q-icon {
              font-size: 24px;
              height: 40px;
            }
          }
          th,
          td {
            padding: 0px;
          }
          thead {
            th {
              background-color: #585b5d;
              padding: 0px 0.625rem;
              text-align: center;
              // border-right: 1px solid #333;
              border-color: rgba(245, 250, 255, 0.2);
              font-size: 0.9375rem;
              font-weight: 400;
              .iconify {
                width: 1.5rem;
                height: 1.5rem;
                vertical-align: middle;
              }
            }
          }
          tbody {
            tr:hover {
              background: $table-dark-hover-background;
              cursor: pointer;
            }
            tr.active {
              background: $table-dark-selected-background;
            }
            td {
              max-width: 20em;
              overflow: hidden;
              text-overflow: ellipsis;
              // border-right: 1px solid #333;
              // border-bottom: 1px solid #333;
              border-color: rgba(245, 250, 255, 0.2);
              border-bottom: 1px solid rgba(245, 250, 255, 0.2);
              padding: 0 0.625rem;
              height: 2.5rem;
              font-size: 0.9375rem;
              &:first-child {
                text-align: center;
                .iconify {
                  width: 1.5rem;
                  height: 1.5rem;
                  vertical-align: middle;
                }
              }
            }
          }
          .q-checkbox__icon {
            font-size: 24px;
            //color: rgb(244, 47, 43);
            color: v-bind(selectedBookmarkColor);
          }
        }
      }
      .q-table__bottom {
        border: none;
        justify-content: center;
      }
    }
    .pagination-wrap {
      display: flex;
      justify-content: center;
      align-items: center;

      max-height: 2.5rem;
      flex: 0 2.5rem;
      height: 100%;

      background-color: #101214;
      font-size: 0.875rem;
    }
  }

  // 상세보기
  .detail-view-wrap :deep {
    position: relative;
    display: flex;
    background-color: #101214;
    width: 0rem;
    overflow: hidden;
    will-change: width;
    transition: width 0.25s ease-in;
    &.show {
      width: 2rem;
      transition: width 0.25s ease-in;
    }
    &.open {
      width: 40.857rem;
      transition: width 0.25s ease-in;
      .detail-btn-wrap .q-btn.detail-btn .q-icon {
        transform: rotate(180deg);
      }
      .detail-view-table {
        overflow-y: auto;
        overflow-x: hidden;
      }
    }
    .detail-view-header {
      position: absolute;
      top: 0px;
      width: 100%;
      height: 44px;
      padding: 0.625rem 0px 0.625rem 2.375rem;
      text-align: left;
      overflow: hidden;
      background-color: #1e2022;
    }
    .detail-view-table {
      max-width: 39.286rem;
      margin-top: 3rem;
      table {
        height: fit-content;
        border-radius: 2px;
        tbody {
          height: 100%;
          overflow-y: auto;
          tr:first-child {
            ::before {
              display: inline-block;
              content: '';
              width: 100%;
              height: 1rem;
            }
          }
          tr:last-child {
            ::after {
              display: inline-block;
              content: '';
              width: 100%;
              height: 1rem;
            }
          }
          td {
            background-color: #101214;
            padding: 0.75rem 0.75rem 0.75rem 1.125rem;
            vertical-align: top;
            font-weight: 700;
            &:first-child {
              color: rgba(255, 255, 255, 0.6);
              text-align: left;
            }
            &:last-child {
              padding-left: 1.25rem;
              padding-right: 3rem;
            }
          }
        }
      }
    }
    // 상세보기 버튼
    .detail-btn-wrap {
      display: flex;
      justify-content: center;
      align-items: center;
      min-width: 22px;
      .q-btn.detail-btn {
        padding: 0;
        width: 1rem;
        height: 4rem;
        background-color: #303234;
        border-radius: 0px 3px 3px 0;
        .q-icon {
          font-size: 1rem;
          width: 1rem;
          height: 1rem;
          will-change: transform;
          transform: rotate(0deg);
          transition: transform 0.25s ease-in;
        }
      }
    }
  }
}

// 차트 다이얼로그
.timeline-dialog-wrap :deep {
  // 체크박스 사이즈
  .q-checkbox {
    margin: 0px;
    margin-right: 1.5rem;
    font-size: 0.9375rem;
    .q-checkbox__inner {
      width: 1.125rem;
      height: 1.125rem;
      min-width: 1.125rem;
    }
  }
  &.pop-default {
    .d-container {
      padding: 1.5rem !important;
      flex-wrap: nowrap !important;
      // 제목 공통 레이아웃
      .tit-wrap {
        width: 100%;
        .tit {
          font-size: 1rem;
          width: 10rem;
          padding-left: 1.875rem;
          &.second {
            padding-top: 0.375rem;
          }
        }
        > div {
          flex-grow: 1;
        }
      }

      // 카테고리 선택
      .category-wrap {
        display: block;
        position: relative;
        padding-bottom: 1.375rem;
        .tit {
          display: block;
        }
        .cate-chk-wrap {
          padding-top: 1rem;
          padding-left: 1.875rem;
          > .q-checkbox {
            position: absolute;
            top: 0px;
            left: 10rem;
          }
          .q-option-group {
            margin: 0px;
            padding-left: 0px;
            padding: 0.5rem 1rem;
            background: rgba(10, 20, 30, 0.2);
            border-radius: 0.25rem;
            > div:first-child {
              margin-left: 0px;
            }
          }
        }
      }

      // 기간설정 및 키워드
      .date-search-wrap {
        padding-bottom: 1.25rem;
        // 기간설정
        .date-radio-wrap {
          font-size: 0.9375rem;
          .q-radio {
            margin-right: 1.5rem;
            &__label {
              padding-left: 0.625rem !important;
            }
            // 직접설정
            &.self {
              // width: 60rem;
              .q-radio__label {
                display: flex;
                align-items: center;
                .date-group {
                  display: flex;
                  padding-left: 0.75rem;
                  .dp__input_wrap {
                    width: 12.8125rem;
                  }
                  .range {
                    padding: 0 0.75rem;
                    color: #999;
                  }
                }
              }
            }
          }
        }
        // 검색
        .search-field-wrap {
          position: relative;
          .or-chkbox {
            margin-right: 1rem;
          }
          .search-field {
            width: 50.375rem;
          }
          .search-btn {
            padding: 0.625rem 1.875rem;
            margin-left: 2rem;
            &.q-btn--outline {
              background-color: rgba(#0a141e, 20%) !important;
              &:before {
                border-color: #0a141e;
              }
            }
            .iconify {
              width: 1.5rem;
              height: 1.5rem;
              margin-right: 0.5rem;
            }
          }
        }
      }
      // 타임라인 차트
      .chart-bg {
        flex-grow: 1;
        width: 100%;
        background-color: #35383b;
        border: 1px solid #101214;
        overflow-y: hidden;
        height: calc(100% - 10rem);
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }
  }
}

// 차트레이아웃 및 색상
.timeline-chart-wrap :deep {
  width: 100%;
  height: 100%;
  overflow: auto;
  display: flex;
  justify-content: center;
  padding-top: 3rem;
  .chart-drops {
    width: 100%;
    height: 100%;
    overflow: auto;
    .line-label {
      font-size: 0.9375rem !important;
    }
    .axis {
      stroke: #fff;
    }
    .domain {
      stroke: #fff;
    }
    .tick > line {
      stroke: #fff;
    }
    .bound.start,
    .bound.end {
      fill: #fff;
    }
    .line-label {
      font-weight: bold;
      font-size: 14px;
    }

    .drop {
      cursor: pointer;
    }
  }
  .axis {
    stroke: #fff;
  }
  .domain {
    stroke: #fff;
  }
  .tick > line {
    stroke: #fff;
  }
  .bound.start,
  .bound.end {
    fill: #fff;
  }
  .line-label {
    font-weight: bold;
    font-size: 14px;
  }
}

// 반응형
@media (max-width: 1400px) {
  .timeline-dialog-wrap :deep {
    // 기간설정 및 키워드
    .date-search-wrap {
      // 기간설정
      .date-radio-wrap {
        padding-top: 0.5rem;
        padding-left: 1.875rem;
      }
    }
  }
}
// 화이트모드
// 타임라인 화이트모드
.body--light {
  .grid-content-wrap {
    // 툴바
    .q-toolbar {
      border-bottom: 1px solid $light-border;
      .date-search-wrap {
        .search-btn {
          &.q-btn--outline {
            background-color: #ffffff !important;
            &::before {
              border: 1px solid $light-border-second;
            }
          }
        }
      }
      // 테이블 상단 기간설정 모달
      .detail-search :deep {
        background-color: $light-bg;
        border: 1px solid $light-border;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 60%);
        // category-wrap
        .category-wrap {
          .cate-chk-wrap {
            .q-option-group {
              background: rgba(#fff, 100%);
            }
          }
        }
        // 검색 버튼
        .search-btn {
          background: #ffffff !important;
          .q-btn__content {
            .iconify {
              margin-right: 0.25rem;
            }
          }
        }
      }
    }
    // 목록 테이블
    .timeline-grid :deep {
      .artifacts-table-wrap {
        .table-list {
          background-color: #ffffff;
          .q-table {
            thead {
              th {
                background-color: $light-bg;
                // border: 1px solid #333;
                border-color: rgba($light-border, 100%);
                border-top: 1px solid rgba($light-border-second, 100%);
              }
            }
            tbody {
              tr:hover,
              tr:nth-child(2n):hover {
                background: #406688;
                cursor: pointer;
                color: #ffffff;
              }
              tr.active,
              tr:nth-child(2n).active {
                background: #174167;
                cursor: pointer;
                color: #ffffff;
              }
              tr {
                td {
                  // border-right: 1px solid #333;
                  // border-bottom: 1px solid #333;
                  border-color: rgba($light-border, 100%);
                  border-bottom: 1px solid $light-border;
                }
              }
              tr:nth-child(2n) {
                background-color: $light-table;
              }
            }
            // 스크롤바 스타일링 (231218 ~ )
          }
        }
      }
      // 페이지
      .pagination-wrap {
        background-color: #ffffff;
      }
      // 세부보기
      .detail-view-wrap {
        background-color: #ffffff;
        border-radius: 0px 4px 0px 0px;
        &.show {
          border: 1px solid $light-border-second;
        }
        &.open {
          .detail-view-header {
            display: block;
            background-color: $light-bg-second;
          }
          .detail-btn-wrap {
            border: none;
          }
        }
        .detail-view-header {
          background-color: #ffffff;
        }
        .detail-view-table {
          table {
            tbody {
              td {
                background-color: #ffffff;
                &:first-child {
                  color: #757575;
                }
              }
            }
          }
        }
        // 상세보기 버튼
        .detail-btn-wrap {
          background-color: #ffffff;
          border-radius: 0px 4px 0px 0px;
          .q-btn.detail-btn {
            background-color: $light-table;
            border: 1px solid #dfe0e2;
          }
        }
      }
    }
  }

  // 타임라인 차트 팝업
  .timeline-dialog-wrap :deep {
    &.pop-default {
      .d-container {
        .category-wrap {
          .cate-chk-wrap {
            .q-option-group {
              background: $light-bg;
            }
          }
        }
        // 검색 버튼
        .date-search-wrap {
          .search-field-wrap {
            // 검색
            .search-btn {
              &.q-btn--outline {
                background-color: #ffffff !important;
                &::before {
                  border: 1px solid $light-border-second;
                }
              }
            }
          }
        }
        // 차트 배경
        .chart-bg {
          background-color: #ffffff;
          border-color: #dfe0e2;
        }
      }
    }
  }
}
</style>

<style lang="scss">
// 툴팁
.timeline-tooltip {
  position: absolute;
  display: block;
  z-index: 9999;
  padding: 1.5rem 1.25rem;
  width: auto;
  min-width: 20rem;
  border-radius: 0.75rem;
  border: 3px solid #42464a;
  background-color: #1e2022;
  box-sizing: border-box;
  box-shadow: 0px 4px 20px rgba(0, 0, 0, 50%);
  &::before {
    content: '';
    display: block;
    position: absolute;
    top: -0.4rem;
    width: 10px;
    height: 10px;
    background: #fff;
    border: 1px solid #e7e7e7;
    border-width: 1px 0 0 1px;
    transform: rotate(45deg);
    z-index: 10000;
    background-color: #1e2022;
    border-color: #42464a;
    border-top-width: 3px;
    border-left-width: 3px;
    top: -0.5rem;
    left: 2.75rem;
    width: 12px;
    height: 12px;
  }
  .commit {
    .content {
      .date {
        font-size: 1rem !important;
        font-weight: 400 !important;
        padding-bottom: 8px;
      }
      p {
        margin: 0px;
        strong {
          display: block;
          font-weight: 400;
          color: #fff;
          font-size: 0.9375rem;
        }
      }
      .more-view {
        display: inline-block;
        background-color: transparent;
        color: #fff;
        text-decoration: none;
        padding: 0px 1rem;
        height: 36px;
        line-height: 36px;
        border: 1px solid #fff;
        border-radius: 0.25rem;
        margin-top: 1.25rem;
        font-size: 0.9375rem;
        cursor: pointer;
      }
    }
  }
}
.timeline-tooltip-dim {
  position: fixed;
  width: 100%;
  height: 100%;
  background-color: transparent;
  top: 0px;
  left: 0px;
  right: 0px;
  bottom: 0px;
  z-index: 9998;
}
// 툴팁 화이트모드
.body--light {
  .timeline-tooltip {
    border-color: $light-border-second;
    background-color: #ffffff;
    box-shadow: 0px 4px 20px rgba(0, 0, 0, 20%);
    &::before {
      background: #fff;
      border: 1px solid #ffffff;
      border-top: 3px solid $light-border-second;
      border-left: 3px solid $light-border-second;
      background-color: #ffffff;
    }
    .commit {
      .content {
        p {
          strong {
            color: $light-color;
          }
        }
        .more-view {
          background-color: transparent;
          border-color: $light-dark;
          color: $light-color;
        }
      }
    }
  }
}
</style>
