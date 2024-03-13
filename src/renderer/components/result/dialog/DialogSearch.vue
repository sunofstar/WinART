<script setup lang="ts">
import { Ref, ref, toRef, computed, onMounted, watch, watchEffect } from 'vue'
import { Icon } from '@iconify/vue'
import { KAPE_OP_CHANNELS } from '@share/constants'
import BookmarkItem from '@renderer/components/BookmarkItem.vue'
import type { _SEARCH_OPTION, DB_BOOKMARK_INFO_ITEM } from '@share/models'
import { useCaseStore } from '@renderer/stores/caseStore'
import { useConfigStore } from '@renderer/stores/configStore'
import { useRouter, useRoute } from 'vue-router'
import { QInfiniteScroll, useQuasar } from 'quasar'
import { openAlert } from '@renderer/composables/useDialog'
import DateRangeCalendar from '@renderer/components/common/DateRangeCalendar.vue'
import { DB_BOOKMARK_MAPPER_INFO } from '@share/models'
import { storeToRefs } from 'pinia'
import type { CategoryObjects } from '@renderer/api/getConfig'
const caseStore = useCaseStore()
const { currentBookmarkItem, currentSearchParam } = storeToRefs(caseStore)
const router = useRouter()
const route = useRoute()
const config = useConfigStore()
const $q = useQuasar()
const path = computed(() => route.path)

const emit = defineEmits(['update:isShow', 'update:changeFromSearch'])
const props = defineProps(['isShow'])

const openSearchParam: Ref<_SEARCH_OPTION> = ref({
  type: '_S_TIME',
  fullSearch: false,
  tableSearch: '',
  keyString: '',
  orFlag: false,
  s_time: '',
  e_time: '',
  _b_id: undefined,
  _offset: undefined,
  _pagesize: undefined
})

const isShow = computed({
  get() {
    // updateOpenSearchParam()
    if (props.isShow === true) {
      updateOpenSearchParam()
    }
    return props.isShow
  },
  set(value) {
    emit('update:isShow', value)

    if (selectedBookmarkGroup.value?.b_id == openSearchBookmark.value) {
      emit('update:changeFromSearch', value)
      // alert('화면 업데이트 완료')
    }
  }
})

// 초기 검색 조건 가져와서 openSearchParam으로 관리
async function updateOpenSearchParam(): Promise<void> {
  // 초기 검색 조건 호출
  const openSearchObj = await getOpenSearchParamSync()
  console.log('*****초기 검색 조건', openSearchObj)
  openSearchParam.value = openSearchObj
  // 초기 검색 조건 설정
  keyword.value = openSearchObj.keyString
  isOr.value = openSearchObj.orFlag
  searchTargetRange.value = openSearchObj.fullSearch ? 'all' : 'current'
  startDateTime.value = openSearchObj.s_time
  endDateTime.value = openSearchObj.e_time
  openSearchBookmark.value = openSearchObj._b_id

  selectedBookmarkGroup.value = currentBookmarkItem.value
  await caseStore.getSearchTotalTable(openSearchParam.value)
}

// 스토어 저장된 검색어 가져오기
function getOpenSearchParamSync(): _SEARCH_OPTION {
  const params: _SEARCH_OPTION = {
    type: currentSearchParam.value.type,
    fullSearch: currentSearchParam.value.fullSearch,
    tableSearch: currentSearchParam.value.tableSearch,
    keyString: currentSearchParam.value.keyString,
    orFlag: currentSearchParam.value.orFlag,
    s_time: currentSearchParam.value.s_time,
    e_time: currentSearchParam.value.e_time,
    _b_id: currentSearchParam.value._b_id
  }
  return params
}

/***********************************************/

let bookTotalCount = 0
/**
 * row max limit 기본 10000개 설정
 * type이 '_S_WORD'인 경우(시간으로 검색할 때), row max limit는 기본 500개로 설정된다
 */
const MAX_ROW_LIMIT = 10000

const ROWS_START_OFFSET = 5
/**
 * 검색 입력 폼
 */

// 검색 범위
const searchTargetRange: Ref<string> = ref('all') // all: 전체 아티팩트, current: 현재 화면
// 검색 키워드
const keyword: Ref<string> = ref('')
watch(keyword, (value) => {
  // 정규식 패턴: . \ ` ! @ # $ % & * -
  // 검색 단어 입력시, 위 특수 입력을 허용하지 않는다
  const specialCharactersPattern = new RegExp(/[.\\`!@#$%&*-]/)

  if (specialCharactersPattern.test(value)) {
    openAlert('검색 시 특수문자 입력을 허용하지 않습니다.')
    keyword.value = value.slice(0, -1)
  }
})
const searchedKeyword: Ref<string> = ref('')
const isOr: Ref<boolean> = ref(false)
const infiniteScroller: Ref<QInfiniteScroll> = ref()
const startDateTime: Ref<string | null> = ref('')
const endDateTime: Ref<string | null> = ref('')
const tableSearchName: Ref<{}> = computed(() => {
  // console.log('tableSearchName computed !!', config.selectedCategory)
  const tableName = openSearchParam.value?.tableSearch
  const searchTableObj = config.findCategoryByTableName(tableName)
  return {
    depth1: searchTableObj?.Category_1,
    depth2: searchTableObj?.Category_2,
    depth3: searchTableObj?.Category_3,
    tableName: tableName
  }
})
// openSearch 다이얼로그 오픈 시점 북마크 정보
const openSearchBookmark: Ref<number | undefined> = ref(undefined)

const categoryDatas: any[] = []
categoryDatas.push({
  depth1: 'all',
  depth2: 'all',
  depth3: '전체 아티팩트',
  tableName: ''
})
config.category.forEach((category: any) => {
  const depth1 = category.label
  category.subList.forEach((subList1: any) => {
    const depth2 = subList1.label
    subList1.subList.forEach((subList2: any) => {
      const depth3 = subList2.label
      const tableName = subList2.dbQueryTableName
      categoryDatas.push({
        depth1: depth1,
        depth2: depth2,
        depth3: depth3,
        tableName: tableName
      })
    })
  })
})
// console.log('카테고리 데이터:', categoryDatas)

/*********************************************************
 * 검색 결과 다이얼로그
 */
const isSearchResultDialog: Ref<boolean> = ref(false)
/**
 * 검색 결과 row data 구조
 *
 * Category_1 : "EventLogs"
 * Category_2 : "이벤트로그"
 * Category_3 : "이벤트로그"
 * SearchData : "45124    45124    6009    Info    EventLog    System    3232    3288    DESKTOP-689T6JC    49                                                False    C:\\Users\\cluedin\\Desktop\\테스트경로\\1201\\1\\triage\\kape\\C\\Windows\\System32\\winevt\\logs\\System.evtx    0x80000000000000    0    {\"EventData\":{\"Data\":\"10.00., 22621, Multiprocessor Free, 0\",\"Binary\":\"\"}}"
 * _DateTime : "2023-11-13 23:51:15"
 * _TableName : "EvtxECmd_Output"
 * _Table_id : 216744
 * _book : 0
 *
 */
interface DB_SEARCH_RESULT {
  Category_1: string
  Category_2: string
  Category_3: string
  isShowMore: boolean
  _book: number
  _bookMakeType: boolean
  _bookmarkCount: number
  offset: number
  showMoreButtonText: string
  showMoreButtonIcon: string
  data: [
    {
      Category_1: string
      Category_2: string
      Category_3: string
      SearchData: string
      _DateTime: string
      _TableName: string
      _Table_id: number
      _book: number
      active?: boolean
    }
  ]
}
const resultRowData: Ref<DB_SEARCH_RESULT[]> = ref([])
const resultRowDataCount: Ref<number> = ref(0)
/**
 * 검색 관련
 *
 *   _SEARCH_OPTION {
 *     // 1 : word기반, 2 : time기반
 *     type: _SEARCH_TYPE (_SEARCH_TYPE = '_S_WORD' | '_S_TIME')
 *     //full search를 하는 경우 - 아래 tableSearch 참조 안함
 *     fullSearch: boolean
 *     //테이블 검색일 경우 테이블 이름 정보
 *     tableSearch: string
 *     // 검색 word
 *     keyString: string
 *     //  word 기반에 OR 연산여부
 *     orFlag: boolean
 *     // 검색 시작 날짜시간
 *     s_time: string
 *     // 검색 종료 날짜시간
 *     e_time: string
 *     // 북마크 정보
 *     _b_id: number | undefined
 *   }
 *
 */
/**
 * 카테고리 정보
 */
// 현재 선택된 아티팩트 카테고리
const selectedSearchCategory: Ref<{} | null> = ref(null)
// 다이얼로그 오픈 시점, 검색 조건 초기값에 대한 화면 처리
watchEffect(() => {
  if (openSearchParam.value.fullSearch) {
    // 전체 선택의 경우
    selectedSearchCategory.value = categoryDatas[0]
  } else {
    // 현재 화면의 경우
    selectedSearchCategory.value = tableSearchName.value
  }
})
// 아티팩트 카테고리 선택을 위한 label(depth1 > depth2)
const categoryLabel = computed(() => {
  if (!selectedSearchCategory.value || selectedSearchCategory.value.depth1 === 'all') return ''
  return selectedSearchCategory.value.depth1 + ' > ' + selectedSearchCategory.value.depth2
})

/**
 * 북마크
 */
const bookmarkGroup = computed(() => {
  let bookmarkGroupArray = caseStore.bookmark
  // bookmarkGroupArray.unshift({
  //   b_name: '전체 선택',
  //   b_color: '#FFFFFF',
  //   b_id: ''
  // })
  return bookmarkGroupArray
})

// 전체 선택 북마크 유무(검색 데이터가 있는 경우)
const hasSearchResults: Ref<boolean> = ref(true)

// 북마크 선택 그룹
const selectedBookmarkGroup: Ref<DB_BOOKMARK_INFO_ITEM | null> = ref()
// const selectedBookmarkId: Ref<DB_BOOKMARK_INFO_ITEM | null> = ref(selectedBookmarkGroup.value?.b_id)

const selectedBookmarkGroupColor: Ref<string> = computed(() => {
  // console.log('**선택된 북마크 그룹', selectedBookmarkGroup?.value)
  console.log('**현재 북마크 그룹', currentBookmarkItem.value)
  return selectedBookmarkGroup?.value !== null
    ? selectedBookmarkGroup.value?.b_color
    : currentBookmarkItem.value.b_color
})

const resetSearchParams = (): void => {
  isSearchResultDialog.value = false
  resultRowData.value = []
  keyword.value = ''
  // selectedBookmarkGroup.value = currentBookmarkItem.value
  isOr.value = false
  startDateTime.value = ''
  endDateTime.value = ''
  selectedSearchCategory.value = null
}

const params: Ref<_SEARCH_OPTION> = computed(() => {
  const type = startDateTime.value !== '' && endDateTime.value !== '' ? '_S_TIME' : '_S_WORD' // _S_WORD가 우선적으로 처리되며 keystring 이 없을시에 _S_TIME으로 조회
  const fullSearch = selectedSearchCategory.value?.depth1 === 'all' ? true : false
  const tableSearch = selectedSearchCategory.value?.depth1 !== 'all' ? selectedSearchCategory.value?.tableName : ''
  const sTime = startDateTime.value ? (startDateTime.value === 'Invalid date' ? '' : startDateTime.value + ':00') : ''
  const etime = endDateTime.value ? (endDateTime.value === 'Invalid date' ? '' : endDateTime.value + ':00') : ''
  return {
    type: type, // _S_WORD가 우선적으로 처리되며 keystring 이 없을시에 _S_TIME으로 조회
    fullSearch: fullSearch, // 전체 검색 여부
    tableSearch: tableSearch, // 대상 테이블 이름
    keyString: keyword.value, // 검색어
    orFlag: false, // 단어별 검색 조건 (dialog에서는 default로 false)
    s_time: sTime,
    e_time: etime,
    // _b_id: selectedId !== undefined ? selectedId : defaultId !== undefined ? defaultId : ''
    _b_id: selectedBookmarkGroup.value?.b_id
  }
})

const onClickSearchTotalTable = async (): Promise<void> => {
  if (keyword.value === null || keyword.value === '') {
    openAlert('검색어를 입력하세요.')
    return
  }
  $q.loading.show()
  console.log('getSearchTotalTable >>> ', params.value)
  // console.log(selectedBookmarkGroup.value)
  caseStore.setCurrentSearchParams(params.value)
  // caseStore.getSearchTotalTable(params.value)

  // 20240228 SearchDialog -> 팝업 오픈 후 검색 버튼 클릭 시에 검색 허용
  // 20240307 통합검색 검색 진행 트리거(두번 검색되는 문제로 인해 트리거 추가)
  caseStore.setSearchDialogPermisson(true)

  // 검색 파라미터 설정
  const openSearchObj = await getOpenSearchParamSync()
  console.log('*****초기 검색 조건', openSearchObj)
  openSearchParam.value = openSearchObj
  // 초기 검색 조건 설정
  keyword.value = openSearchObj.keyString
  isOr.value = openSearchObj.orFlag
  searchTargetRange.value = openSearchObj.fullSearch ? 'all' : 'current'
  startDateTime.value = openSearchObj.s_time
  endDateTime.value = openSearchObj.e_time
  openSearchBookmark.value = openSearchObj._b_id

  selectedBookmarkGroup.value = currentBookmarkItem.value
  await caseStore.getSearchTotalTable(openSearchParam.value)
}

function shouldShowMoreButton(row) {
  return row.data.length > 5
}

const onClickShowMore = (row, index): void => {
  row.isShowMore = !row.isShowMore
  row.showMoreButtonText = row.isShowMore ? '접기' : '더보기'
  row.showMoreButtonIcon = row.isShowMore ? 'mdi:chevron-up' : 'mdi:chevron-down'

  if (row.isShowMore) {
    // 접기
    row.offset = index + ROWS_START_OFFSET
    infiniteScroller.value[index].reset()
    infiniteScroller.value[index].resume()
  } else {
    // 더보기
    row.offset = 5 // 더보기 상태일 때 최대 5개의 데이터만 보여줌
    infiniteScroller.value[index].reset()
    infiniteScroller.value[index].stop()
  }
}
const onLoadShowMore = (index, done, row, scrollIndex): void => {
  if (row.isShowMore) {
    // 접기
    row.offset = index + ROWS_START_OFFSET
    done()
  } else {
    // 더보기
    infiniteScroller.value[scrollIndex].stop()
  }
}
function updataAllBookMarkCheckBox() {
  if (bookTotalCount === 0) {
    isBookmarkAll.value = false
  } else if (resultRowDataCount.value === bookTotalCount) {
    isBookmarkAll.value = true
  } else {
    isBookmarkAll.value = null
  }
}
const onFinishedGetSearchedTotalTable = async (state: object): Promise<void> => {
  console.log('searchTotalTable state :: ', state.state)
  if (state.state === '_000') {
    $q.loading.show()

    if (keyword.value === '') {
      openAlert('검색어를 입력하세요.')
    } else {
      searchedKeyword.value = keyword.value !== '' ? keyword.value : ''

      let rowData = [],
        resultData = []

      if (state.data.length === 0) {
        openAlert('검색 결과가 존재하지 않습니다.')
        resultRowData.value = []
        hasSearchResults.value = false // 검색 결과가 없는 경우 false로 설정
      } else {
        // max row limit 처리부 추가
        if (state.data.length >= MAX_ROW_LIMIT) {
          resultData = state.data.slice(0, MAX_ROW_LIMIT)
          openAlert(
            `검색어 [${keyword.value}]로 시스템에서 처리할 수 없을 만큼의 결과가 조회되었습니다. <br />정확한 결과를 위해 검색어를 추가하여 검색하시기 바랍니다.`
          )
        } else {
          resultData = state.data
        }
        bookTotalCount = 0
        // resultRowDataCount.value = resultData.length
        console.log('searchTotalTable data : ', resultData)
        if (Array.isArray(resultData)) {
          for (let index = 0; index < resultData.length; index++) {
            const item = resultData[index]
            // TO DO: 테스트 케이스 필요
            const regex = new RegExp(`(${keyword.value.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi')
            function highlightMatch(match) {
              return `<mark>${match}</mark>`
            }
            // 검색 결과의 특정 부분만 형광펜 처리
            item.searchData = item.searchData.replace(regex, highlightMatch)
            // console.log('item.searchData > ', item.searchData)
            const isValidIndex = rowData.findIndex((data) => data.Category_3 === item.category_3)

            if (isValidIndex === -1) {
              let obj = {
                Category_1: item.category_1,
                Category_2: item.category_2,
                Category_3: item.category_3,
                offset: ROWS_START_OFFSET,
                isShowMore: false,
                _book: 0,
                data: []
              }
              obj.data.push(item)
              rowData.push(obj)
            } else {
              if (rowData[isValidIndex].fullData === undefined) {
                rowData[isValidIndex].data.push(item)
              } else {
                rowData[isValidIndex].fullData.push(item)
              }
            }
          }

          if (rowData.length === 0) {
            resultRowData.value = []
          } else {
            // 북마크 그룹별, 전체 체크 여부 확인
            const tmpselectedBookmarkGroup = selectedBookmarkGroup.value!.b_id
              ? selectedBookmarkGroup.value
              : currentBookmarkItem.value
            for (let index = 0; index < rowData.length; index++) {
              const rowItem = rowData[index]
              if (Array.isArray(rowItem.data) && rowItem.data.length > 0) {
                let subItem_book_total = 0,
                  bookId = 0

                for (let subIndex = 0; subIndex < rowItem.data.length; subIndex++) {
                  const subItem = rowItem.data[subIndex]
                  console.log('subItem._book >> ', subItem._book)
                  if (subItem._book === tmpselectedBookmarkGroup?.b_id) {
                    bookTotalCount++
                    subItem_book_total++
                    bookId = subItem._book
                  }
                }
                rowItem._book = subItem_book_total === rowItem.data.length ? tmpselectedBookmarkGroup?.b_id : 0
                if (subItem_book_total <= 0) {
                  rowItem._bookMakeType = false
                } else if (subItem_book_total === rowItem.data.length) {
                  rowItem._bookMakeType = true
                } else {
                  rowItem._bookMakeType = null
                }
                rowItem._bookmarkCount = subItem_book_total
                console.log('subItem_book_total : ' + subItem_book_total)
                console.log('subItem__bookMakeTypebook_total : ' + rowItem._bookMakeType)
              }
            }
            resultRowData.value.splice(0, resultRowData.value.length, ...rowData)
            hasSearchResults.value = true // 검색 결과가 있는 경우 true로 설정
          }

          console.log('resultRowData data : ', resultRowData.value)
          isSearchResultDialog.value = true
        }
      }
    }
  }
  updataAllBookMarkCheckBox()
  $q.loading.hide()
}

const onFinishedGetSearchedTotalTableCount = (count: number): void => {
  console.log('onFinishedGetSearchedTotalTableCount >> ', count)
  resultRowDataCount.value = count
}

const onChangeBookmark = async (value: any, subIndex: number) => {
  if (selectedBookmarkGroup.value.b_id > 0) {
    const bookmarkItem: DB_BOOKMARK_MAPPER_INFO[] = [
      {
        _id: selectedBookmarkGroup.value.b_id,
        _tableName: value.s_tableName,
        _tableIdx: value.s_tableId,
        _category_1: value.category_1,
        _category_2: value.category_2,
        _category_3: value.category_3
      }
    ]

    const rowDatas = resultRowData.value[subIndex]

    // $q.loading.show()
    if (value._book === 0) {
      if (await caseStore.addBookmarkOne(bookmarkItem)) {
        bookTotalCount++
        rowDatas._bookmarkCount++
      }
      value._book = selectedBookmarkGroup.value.b_id
    } else {
      if (await caseStore.deleteBookmarkOne(bookmarkItem)) {
        bookTotalCount--
        rowDatas._bookmarkCount--
      }
      value._book = 0
    }

    if (rowDatas._bookmarkCount <= 0) {
      rowDatas._bookMakeType = false
    } else if (rowDatas._bookmarkCount === rowDatas.data.length) {
      rowDatas._bookMakeType = true
    } else {
      rowDatas._bookMakeType = null
    }
  }
  updataAllBookMarkCheckBox()
}

const onChangeBookmarkByCategory = async (value) => {
  if (selectedBookmarkGroup.value.b_id > 0 && Array.isArray(value.data)) {
    $q.loading.show()

    let bookmarkItems: DB_BOOKMARK_MAPPER_INFO[] = []

    if (value._book === 0) {
      for (const row of value.data) {
        if (row._book !== selectedBookmarkGroup.value.b_id) {
          bookmarkItems.push({
            _id: selectedBookmarkGroup.value.b_id,
            _tableName: row.s_tableName,
            _tableIdx: row.s_tableId,
            _category_1: row.category_1,
            _category_2: row.category_2,
            _category_3: row.category_3
          })

          row._book = selectedBookmarkGroup.value.b_id
        }
      }

      await caseStore.addBookmark(bookmarkItems)
      value._book = selectedBookmarkGroup.value.b_id
      value._bookMakeType = true
      value._bookmarkCount = value.data.length
      bookTotalCount = bookTotalCount + value.data.length
    } else {
      for (const row of value.data) {
        if (row._book === selectedBookmarkGroup.value.b_id) {
          bookmarkItems.push({
            _id: selectedBookmarkGroup.value.b_id,
            _tableName: row.s_tableName,
            _tableIdx: row.s_tableId,
            _category_1: row.category_1,
            _category_2: row.category_2,
            _category_3: row.category_3
          })
          row._book = 0
        }
      }
      await caseStore.deleteBookmark(bookmarkItems)
      value._book = 0
      value._bookMakeType = false
      value._bookmarkCount = 0
      bookTotalCount = bookTotalCount - value.data.length
    }
  }
  updataAllBookMarkCheckBox()
}

const isBookmarkAll: Ref<boolean | null> = ref(false)
const onChangeBookmarkAll = async (): Promise<void> => {
  let bookmarkItems: DB_BOOKMARK_MAPPER_INFO[] = []

  console.debug('############ bookmark changed all start : ', bookmarkItems)
  $q.loading.show()

  if (!isBookmarkAll.value) {
    for (const rowItem of resultRowData.value) {
      // ;(rowItem.showMoreButtonText = '더보기'), (rowItem.showMoreButtonIcon = 'mdi:chevron-down')
      for (const row of rowItem.data) {
        if (row._book !== selectedBookmarkGroup.value.b_id) {
          bookmarkItems.push({
            _id: selectedBookmarkGroup.value.b_id,
            _tableName: row.s_tableName,
            _tableIdx: row.s_tableId,
            _category_1: row.category_1,
            _category_2: row.category_2,
            _category_3: row.category_3
          })

          row._book = selectedBookmarkGroup.value.b_id
        }
      }
      rowItem._book = selectedBookmarkGroup.value.b_id
      rowItem._bookMakeType = true
      rowItem._bookmarkCount = rowItem.data.length
    }

    await caseStore.addBookmark(bookmarkItems)
    isBookmarkAll.value = true
    bookTotalCount = resultRowDataCount.value
  } else {
    for (const rowItem of resultRowData.value) {
      for (const row of rowItem.data) {
        if (row._book === selectedBookmarkGroup.value.b_id) {
          bookmarkItems.push({
            _id: selectedBookmarkGroup.value.b_id,
            _tableName: row.s_tableName,
            _tableIdx: row.s_tableId,
            _category_1: row.category_1,
            _category_2: row.category_2,
            _category_3: row.category_3
          })

          row._book = 0
        }
      }

      rowItem._book = 0
      rowItem._bookMakeType = false
      rowItem._bookmarkCount = 0
    }

    await caseStore.deleteBookmark(bookmarkItems)
    isBookmarkAll.value = false
    bookTotalCount = 0
  }
  // $q.loading.hide()
}

const onChangeBookmarkGroup = async (value: DB_BOOKMARK_INFO_ITEM<object>) => {
  selectedBookmarkGroup.value = value
  // console.log('북마크 변경 확인', selectedBookmarkGroup.value)
  caseStore.setCurrentBookmarkItem(selectedBookmarkGroup.value)

  onClickSearchTotalTable()
}

onMounted(async (): Promise<void> => {
  if (ipcRenderer !== undefined) {
    ipcRenderer.removeAllListeners(KAPE_OP_CHANNELS.searchTotalTableResult)
    ipcRenderer.on(KAPE_OP_CHANNELS.searchTotalTableResult, onFinishedGetSearchedTotalTable)

    ipcRenderer.removeAllListeners(KAPE_OP_CHANNELS.searchTotalTableFinalCountResult)
    ipcRenderer.on(KAPE_OP_CHANNELS.searchTotalTableFinalCountResult, onFinishedGetSearchedTotalTableCount)
  }
})
</script>
<template>
  <!-- 검색결과 (s) -->
  <q-dialog v-model="isShow" style="z-index: 1">
    <q-card
      class="q-dialog-plugin pop-default search-dialog-wrap"
      :style="'--selected-bookmark-color: ' + selectedBookmarkGroupColor"
    >
      <!-- 헤더 -->
      <q-card-section class="d-header">
        <h1>검색</h1>
        <q-space></q-space>
        <q-btn
          v-close-popup
          icon="close"
          flat
          dense
          @click="
            () => {
              isSearchResultDialog = false
              resultRowData = []
              keyword = ''
              startDateTime = ''
              endDateTime = ''
              selectedSearchCategory = null
              // 20240228 SearchDialog -> 팝업 종료시 검색 가능여부 
              // 20240307 통합검색 검색 진행 트리거(두번 검색되는 문제로 인해 트리거 추가)
              caseStore.setSearchDialogPermisson(true)
            }
          "
        ></q-btn>
      </q-card-section>
      <!-- 본문 -->
      <q-card-section class="d-container">
        <!-- 검색 -->
        <div class="row justify-center items-center top">
          <!-- selectBox 현재 화면(아티팩트 카테고리) -->
          <q-select
            v-model="selectedSearchCategory"
            outlined
            dense
            :options="categoryDatas"
            class="q-mr-sm"
            :label="selectedSearchCategory?.depth1 === 'all' ? ' ' : categoryLabel"
          >
            <template #selected>
              <q-item class="">
                <q-item-section>
                  <q-item-label>
                    {{ selectedSearchCategory?.depth3 }}
                  </q-item-label>
                </q-item-section>
              </q-item>
            </template>
            <template #option="scope">
              <q-item v-bind="scope.itemProps" class="top-bookmark-opt">
                <q-item-section>
                  <q-item-label>
                    {{ scope.opt.depth3 }}
                  </q-item-label>
                </q-item-section>
              </q-item>
            </template>
          </q-select>
          <!--          <q-checkbox v-model="isOr" dense label="단어별 검색" class="chk-box or"></q-checkbox>-->
          <q-input
            v-model.trim="keyword"
            outlined
            dense
            clearable
            clear-icon="mdi-close"
            autofocus
            placeholder=""
            @keyup.enter="onClickSearchTotalTable"
          />
          <DateRangeCalendar
            class="date-wrap"
            :start-date="startDateTime"
            :end-date="endDateTime"
            @update:start-date="
              (date) => {
                if (date == 'Invalid date') {
                  startDateTime = ''
                } else {
                  startDateTime = date
                }
              }
            "
            @update:end-date="
              (date) => {
                if (date == 'Invalid date') {
                  endDateTime = ''
                } else {
                  endDateTime = date
                }
              }
            "
          />
          <q-btn flat class="search-btn" @click="onClickSearchTotalTable">
            <Icon icon="ic:baseline-search" />
            <span>검색</span>
          </q-btn>
          <!--          <q-checkbox dense label="결과 내 재검색" class="chk-box retry"></q-checkbox>-->
        </div>
        <div class="result-wrap">
          <!-- 검색 결과 -->
          <div class="result-top row justify-center items-center">
            <p class="text-center text-md-2">
              <span class="text-primary bold">“{{ searchedKeyword }}”</span>
              (으)로 총
              <span class="text-primary bold">{{ resultRowDataCount }}건</span>
              이 검색 되었습니다.
            </p>
          </div>
          <div class="result-bot row items-center">
            <q-btn flat class="all-btn" @click="onChangeBookmarkAll" v-show="hasSearchResults">
              <q-icon v-if="isBookmarkAll === null" name="mdi-bookmark-minus" class="cursor-pointer"></q-icon>
              <q-icon v-else-if="isBookmarkAll" name="mdi-bookmark" class="cursor-pointer"></q-icon>
              <q-icon v-else name="mdi-bookmark-outline" class="cursor-pointer"></q-icon>
              <span>전체 선택</span>
            </q-btn>
            <q-space></q-space>
            <!-- 북마크 -->
            <BookmarkItem :bookmark-data-array="bookmarkGroup" @update="onChangeBookmarkGroup" />
          </div>
          <!-- 검색 리스트 -->
          <div class="result-list-wrap">
            <q-list v-for="(row, index) in resultRowData" :key="index" bordered class="search-list-wrap">
              <q-item-label header class="title-wrap">
                <q-item-section side>
                  <q-btn class="disable-shadow" @click="onChangeBookmarkByCategory(row)">
                    <q-icon v-if="row._bookMakeType === null" name="mdi-bookmark-minus" class="cursor-pointer"></q-icon>
                    <q-icon v-else-if="row._bookMakeType" name="mdi-bookmark" class="cursor-pointer"></q-icon>
                    <q-icon v-else name="mdi-bookmark-outline" class="cursor-pointer"></q-icon>
                  </q-btn>
                </q-item-section>
                <q-item-section>
                  <span class="title">
                    {{ row.Category_1 }} > {{ row.Category_2 }} > {{ row.Category_3 }}
                    <em class="count">({{ row.data.length }})</em>
                  </span>
                  <q-space></q-space>
                  <div class="row items-center cursor-pointer">
                    <q-btn v-if="shouldShowMoreButton(row)" class="disable-shadow" @click="onClickShowMore(row, index)">
                      <span>{{ row.showMoreButtonText ? row.showMoreButtonText : '더보기' }}</span>
                      <Icon
                        :icon="row.showMoreButtonIcon ? row.showMoreButtonIcon : 'mdi:chevron-down'"
                        color="white"
                        :rotate="0"
                      />
                    </q-btn>
                  </div>
                </q-item-section>
              </q-item-label>
              <div class="result-list-items-wrap">
                <q-infinite-scroll
                  ref="infiniteScroller"
                  :offset="150"
                  @load="
                    (scrollIndex, done) => {
                      onLoadShowMore(scrollIndex, done, row, index)
                    }
                  "
                >
                  <template v-for="(subRow, subIndex) in row.data" :key="subIndex">
                    <template v-if="subIndex < row.offset">
                      <q-item v-ripple class="result-item-wrap">
                        <q-item-section side>
                          <q-btn class="disable-shadow" @click="onChangeBookmark(subRow, index)">
                            <q-icon
                              v-if="subRow._book === selectedBookmarkGroup?.b_id"
                              name="mdi-bookmark"
                              class="cursor-pointer"
                            ></q-icon>
                            <q-icon v-else name="mdi-bookmark-outline" class="cursor-pointer"></q-icon>
                          </q-btn>
                        </q-item-section>
                        <q-item-section
                          @dblclick="
                          () => {
                            // 20240307 통합검색 검색 진행 트리거(두번 검색되는 문제로 인해 트리거 추가)
                            caseStore.setSearchDialogPermisson(true)
                            router.push({
                              name: 'result',
                              query: {
                                ...route.query,
                                ...{ _TableName: subRow.s_tableName },
                                ...{ _Table_id: subRow.s_tableId }
                              }
                            })
                          }
                          "
                        >
                          <strong class="text-primary">{{ subRow.t_dateTime }}</strong>
                          <div class="content" v-html="subRow.searchData" />
                        </q-item-section>
                      </q-item>
                    </template>
                  </template>
                  <template v-if="row.offset < row.data.length && row.isShowMore" #loading>
                    <div class="row justify-center q-my-md">
                      <q-spinner-dots color="primary" size="40px" />
                    </div>
                  </template>
                </q-infinite-scroll>
              </div>
            </q-list>
          </div>
        </div>
      </q-card-section>
      <q-card-actions class="d-footer">
        <!-- <q-btn outline icon="mdi-refresh" color="info" label="초기화" @click="resetSearchParams" /> -->
        <q-btn
          outline
          icon="mdi-close"
          label="닫기"
          @click="
            () => {
              resetSearchParams()
              // emit('searchDialogClose', 0)
              // 20240228 SearchDialog -> 팝업 종료시 검색 가능여부 초기화
              // 20240307 통합검색 검색 진행 트리거(두번 검색되는 문제로 인해 트리거 추가)
              caseStore.setSearchDialogPermisson(true)
              isShow = false
            }
          "
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
  <!-- 검색결과 (e) -->
</template>

<style scoped lang="scss">
.radio-wrap {
  display: flex;
  flex-direction: column;
  padding-right: 16px;
  :deep(.q-radio__inner) {
    width: 1rem;
    height: 1rem;
  }
  .q-radio {
    &:first-child {
      padding-bottom: 8px;
    }
  }
}

// 검색 입력폼
.search-item-wrap :deep {
  display: flex;
  align-items: center;
  &::after {
    display: inline-block;
    content: '';
    width: 1px;
    height: 5.625rem;
    background-color: #0a141e;
  }

  .keyword {
    display: flex;
    .q-input {
      max-width: 21rem;
      flex-grow: 1;
    }
    .q-field--dense {
      .q-field__control,
      .q-field__native,
      .q-field__marginal {
        min-height: 2rem !important;
      }
    }
  }
  // 체크박스 사이즈
  .q-checkbox {
    margin: 0px;
    font-size: 0.875rem;
    .q-checkbox__inner {
      width: 1rem;
      height: 1rem;
      min-width: 1rem;
    }
  }
  .chk-box {
    padding-left: 0.375rem;
  }
  .search-btn {
    border: 1px solid #0a141e;
    background-color: rgba(#0a141e, 20%);
    padding: 2.25rem 1.875rem 0.75rem;
    height: 70px;
    margin: 0px 1.25rem 0px 1rem;
    svg {
      position: absolute;
      width: 1.5rem;
      height: 1.5rem;
      top: 12px;
    }
  }
  .date-wrap {
    margin-top: 0.375rem;
  }
}

// 검색결과 다이얼로그
.q-card.search-dialog-wrap :deep {
  .q-card__section + .q-card__section.d-container {
    padding: 0px !important;
    .top {
      height: 3.75rem;
      // 셀렉트박스 높이 조절
      .q-select {
        height: 2.25rem;
        .q-field__control {
          height: 100% !important;
          &-container {
            padding: 0px;
            .q-field__native {
              padding: 0px;
              height: 100% !important;
              .q-item {
                display: inline-block;
              }
            }
            .q-field__label {
              overflow: visible;
              top: 48px;
            }
          }
        }
      }
      .q-input {
        width: 20.625rem;
      }
      .q-checkbox.or {
        padding-left: 0.75rem;
        .q-checkbox__label {
          font-size: 0.9375rem;
        }
      }
      .search-btn {
        border: 1px solid #0a141e;
        background-color: rgba(#0a141e, 20%);
        padding: 0.375rem 1rem;
        border-radius: 4px;
        .iconify {
          width: 1.5rem;
          height: 1.5rem;
          margin-right: 0.5rem;
        }
      }
      .retry {
        padding-left: 1.25rem;
        .q-checkbox__inner {
          width: 1rem;
          min-width: 1rem;
          height: 1rem;
        }
      }
      .date-wrap {
        margin: 0px 14px;
        gap: 7px;
      }
    }
    .result-wrap {
      display: flex;
      flex-direction: column;
      max-height: 44.25rem;
      padding: 0px 2.75rem;
      .result-top {
        padding: 0.75rem 0px 0.5rem;
        p {
          margin: 0px;
        }
      }
      .result-bot {
        padding: 0 0 0.75rem 0.625rem;
        .all-btn {
          .q-icon {
            width: 1.25rem;
            height: 1.25rem;
            margin-right: 0.375rem;
          }
        }
      }
      .result-list-wrap {
        height: 100%;
        overflow-y: auto;
        .search-list-wrap {
          background-color: #35383b;
          margin-bottom: 12px;
          .q-item {
            min-height: 2.5rem;
            border-bottom: 1px solid rgba(#f5faff, 20%);
            align-items: flex-start;
            &:last-child {
              border-bottom: none;
            }
            &__section {
              display: flex;
              flex-direction: column;
              align-items: flex-start;
              align-content: flex-start;
              font-size: 0.9375rem;
              overflow: visible;
              gap: 0.375rem;
              &--side {
                padding-right: 0.5rem;
                .q-icon {
                  font-size: 1.25rem;
                }
              }
              span {
                font-weight: 400;
              }
              .content {
                font-weight: 400;
                width: 100%;
                overflow: hidden;
                display: -webkit-box;
                white-space: normal;
                -webkit-line-clamp: 3;
                -webkit-box-orient: vertical;
              }
            }
          }
          .title-wrap {
            display: flex;
            padding: 8px 16px;
            border-bottom: 1px solid rgba(245, 250, 255, 0.2);
            background-color: #54585c;
            min-height: 2.625rem;
            align-items: center;
            .title {
              font-weight: 700;
              .count {
                font-style: normal;
              }
            }
            .iconify {
              width: 1.25rem;
              height: 1.25rem;
            }
            .q-item__section {
              align-items: center;
              flex-direction: row;
              .q-btn {
                padding: 0;
              }
            }
          }
        }
      }
      .result-list-items-wrap {
        width: auto;
        height: 100%;
        max-height: 41em;
        overflow-y: auto;
        margin: 0em 1em;
      }
    }
  }

  .mdi-bookmark-outline,
  .mdi-bookmark,
  .mdi-bookmark-minus {
    color: var(--selected-bookmark-color);
  }

  .disable-shadow:before {
    display: none;
  }
}

// 화이트
.body--light {
  // 메인 상단의 검색바
  .search-item-wrap :deep {
    &::after {
      background-color: $light-border;
    }
    .search-btn {
      background-color: #fff;
      border-color: $light-border-second;
    }
    .date-wrap {
      .date {
        .dp__input_icon_pad {
          background-color: #ffffff;
          border: 1px solid $light-border-second;
        }
      }
    }
  }
  // 검색결과 리스트 (팝업)
  .q-card.search-dialog-wrap :deep {
    .q-card__section + .q-card__section.d-container {
      .top {
        .search-btn {
          border: 1px solid $light-border-second;
          background-color: #fff;
        }
      }
      .result-wrap {
        .result-list-wrap {
          .search-list-wrap {
            background: #fff;
            .q-item {
              border-bottom: 1px solid $light-border;
              &:last-child {
                border: none;
              }
              .content {
                mark {
                  color: $light-primary;
                }
              }
            }
            .title-wrap {
              background-color: $light-bg-second;
            }
          }
        }
      }
    }
  }
}
</style>
