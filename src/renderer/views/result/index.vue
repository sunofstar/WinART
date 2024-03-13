<!--
/**
* result > home - 아티팩트   조회화면
*/
-->
<route>{ meta: { layout: "result", disallowAuthed: true} }</route>

<script setup lang="ts">
/**********************************************
 * @description Import
 */
import { Ref, ref, computed, watch, onMounted } from 'vue'
import { QTable, useQuasar } from 'quasar'
import type { DB_QUERY_PARAM, DB_BOOKMARK_INFO_ITEM, DB_BOOKMARK_MAPPER_INFO, TABLE_PRT_CMD } from '@share/models'
import { KAPE_OP_CHANNELS } from '@share/constants'
import type { CategoryObjects } from '@renderer/api/getConfig'
import dbConn from '@renderer/api/dbConn'
import BookmarkItem from '@renderer/components/BookmarkItem.vue'
import DialogBookmark from '@renderer/components/result/dialog/DialogBookmark.vue'
import DialogSearch from '@renderer/components/result/dialog/DialogSearch.vue'
import { getParentFolder, numberWithCommas } from '@renderer/utils/utils'
import { useConfigStore } from '@renderer/stores/configStore'
import { useCaseStore } from '@renderer/stores/caseStore'
import { useRoute } from 'vue-router'
import { openAlert } from '@renderer/composables/useDialog'
import kapeApi from '@renderer/api/kapeApi'
import { storeToRefs } from 'pinia'
import electronApi from '@renderer/api/electronApi'
const $q = useQuasar()
const config = useConfigStore()
const caseStore = useCaseStore()
const { caseDetail, dbSetPath, currentBookmarkItem, defaultBookmarkItem, firstRenderForAnalysisDialog } =
  storeToRefs(caseStore)

let selectedBookmarkCount = 0
/**
 * @description Params
 */
const route = useRoute()
const selectedTableId: Ref<string> = ref('')
const showOverViewDialog: Ref<boolean> = ref(false)

watch(
  () => route.query,
  async (value): Promise<void> => {
    if (value._TableName !== undefined && value._TableName !== '') {
      const category = config.findCategoryByTableName(value._TableName)
      let page = 1
      let id = 0

      if (value._Table_id !== undefined && value._Table_id !== '') {
        console.log('route.query ::: _Table_id >> ', value._Table_id)
        selectedTableId.value = value._Table_id
        id = Number(value._Table_id)
        page = Math.floor((id + 1) / selectedRowsPerPage.value) + 1
        console.log('selected Page >>> ', page)
      }

      await onClickSetColumnDef(category, page)

      // if (id !== 0) {
      //   await goToPageById(id)
      // }
    }
  }
)
/**********************************************
 * @description Define Variable
 */

const modal: Ref<boolean> = ref(false)
const detail: Ref<boolean> = ref(false)
const loading: Ref<boolean> = ref(false)
const gridRowData: Ref<object[]> = ref([])
const grid: Ref<QTable> = ref()
const detailViewTable = ref(null)

// utf-8 셀렉트
interface EncodingItem {
  label: string
  value: string
}
const encodingArr = [
  {
    label: 'UTF-8',
    value: 'utf8'
  },
  {
    label: 'CP949',
    value: 'cp949'
  },
  {
    label: 'EUC-KR',
    value: 'euckr'
  },
  {
    label: 'UTF-16LE',
    value: 'utf-16le'
  },
  {
    label: 'UTF-16BE',
    value: 'utf-16be'
  },
  {
    label: 'ASCII',
    value: 'ascii'
  }
]

const categoryListData: Ref<CategoryObjects[]> = ref(config.categoryDataArray)
const selectedCategory: Ref<CategoryObjects[]> = ref([])
watch(
  () => selectedCategory.value,
  async (value) => {
    console.debug('selectedCategory dbQueryTableName : ', value[0].dbQueryTableName)
    config.setSelectedCategory(value[0]) // 오브젝트 타입으로 저장
  },
  {
    deep: true
  }
)

// sankey depth2 클릭시 아티팩트 조회 페이지 이동 이벤트
watch(
  () => config.sankeyClickEvent,
  async (value) => {
    await onClickSetColumnDef(value, 1)
  }
)

// 선택 인코딩
const selectedEncoding: Ref<EncodingItem> = ref({
  label: 'UTF-8',
  value: 'utf8'
})

const selectedRowData: Ref<object> = ref({})
const rowSelected: Ref<[]> = ref([])
const bookmarkSelect: Ref<boolean | null> = ref(false)
const bookmarkGroup = computed(() => {
  return caseStore.bookmark
})
const selectedBookmarkGroup: Ref<DB_BOOKMARK_INFO_ITEM> = ref({})
const selectedBookmarkGroupColor: Ref<string> = ref('')

const DEFAULT_OFFSET: number = 1000
let getSelectedTableParam: Ref<DB_QUERY_PARAM> = ref({
  queryTable: '',
  queryOffset: -1,
  querySortFlag: false,
  querySortColName: '',
  querySortDescFlag: false,
  queryBookMarkId: selectedBookmarkGroup.value.b_id,
  queryPageSize: 0
})

/**********************************************
 * @description Define Computed
 */
const selectedRowCount = computed({
  get() {
    console.log('################## selectedRowCount ', selectedCategory?.value.length)
    if (selectedCategory?.value.length > 0) {
      const selectedRowDataCount =
        selectedCategory?.value[0]?.count !== undefined ? selectedCategory?.value[0]?.count : 0
      return selectedRowDataCount
    } else {
      return 0
    }
  },
  set() {
    return
  }
})

// 페이지당 조회 건수
const rowsPerPageArr: number[] = [100, 200, 300, 400, 500]
const selectedRowsPerPage: Ref<number> = ref(100)
const startRowNumber: Ref<number> = ref(0)
const pagination: Ref<any> = ref({
  page: 1,
  rowsPerPage: selectedRowsPerPage.value,
  rowsNumber: selectedRowCount.value || 0
})
watch(selectedRowsPerPage, (newVal, oldVal) => {
  const currentPage = Math.ceil(startRowNumber.value / newVal) > 0 ? Math.ceil(startRowNumber.value / newVal) : 1
  console.log('updated selectRowPerPage : ', currentPage)
  updateGrid(currentPage)
})

const pageMax = computed({
  get() {
    return Math.ceil(selectedRowCount.value / pagination.value.rowsPerPage)
  },
  set() {
    return
  }
})

const selectedColumnDef = computed({
  get() {
    let category = []
    if (selectedCategory?.value.length > 0) {
      const columnDef = selectedCategory?.value[0]?.columnDef ? selectedCategory?.value[0]?.columnDef : []
      category = [...columnDef]
    }
    return category
  },
  set(value) {
    return
  }
})

const selectedDetailInfoColumnDef = computed({
  get() {
    let category = []
    if (selectedCategory?.value.length > 0) {
      const detailInfo = selectedCategory?.value[0]?.detailInfoColumnDef
        ? selectedCategory?.value[0]?.detailInfoColumnDef
        : []
      category = [...detailInfo]
    }
    return category
  },
  set(value) {
    return
  }
})

// const detailInfoRowData = computed({
//   get() {
//     for (const [key, value] of Object.entries(object1)) {
//       console.log(`${key}: ${value}`);
//     }
//   },
//   set(value) {
//     return
//   }
// })

/**********************************************
 * @description Define Methods
 */
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

const getRowData = async (tableName): Promise<object[]> => {
  if (tableName !== '') {
    $q.loading.show()
    getSelectedTableParam.value.queryTable = tableName
    const tempRowData = await dbConn.readTableContents(getSelectedTableParam.value)

    $q.loading.hide()
    if (Array.isArray(tempRowData) && tempRowData.length > 0) {
      return tempRowData
    } else {
      return []
    }
  }
}
/** ********************************************* 20240226 추가 */

let selectedRow: any = null

const toggleActiveRow = (newRow): number => {
  modal.value = true
  detail.value = true
  selectedRowData.value = newRow
  selectedRow = newRow
  if (detailViewTable.value !== undefined) {
    detailViewTable.value.scrollTop = 0
  }

  let selectedIndex = -1
  if (newRow !== undefined) {
    gridRowData.value.forEach((item, index) => {
      if (newRow.a_id === item.a_id) {
        selectedIndex = index
        item.active = !item.active // 행을 토글합니다.
      } else {
        item.active = false
      }
    })
  }
  return selectedIndex
}

/** ********************************************* 20240226 수정 */

const goToPageById = async (id: number): Promise<void> => {
  console.log('goToPageById >> ', id)
  const numberId = Number(id)

  let selectedRow: any = null

  if (gridRowData.value.length > 0) {
    for (let index = 0; index < gridRowData.value.length; index++) {
      const row = gridRowData.value[index]
      if (numberId === row.a_id) {
        selectedRow = row
        // selectedRowData.value = row
        console.log('selected row >> ', row)
        break // 선택된 행을 찾았으므로 루프 종료
      }
    }
    if (selectedRow !== null) {
      const selectedIndex = toggleActiveRow(selectedRow)
      // selectedId.value = selectedIndex
      // console.log('selectedIndex >>> ', selectedIndex)
      await grid.value.resetVirtualScroll()
      await grid.value.scrollTo(selectedIndex, 'center')
    } else {
      openAlert('페이지 내에서 해당 데이터를 찾을 수 없습니다.')
    }
  }
}

const isRowActive = (row) => {
  return row && (row.active || (selectedRow && row.a_id === selectedRow.a_id && selectedRow.active))
}
/** ********************************************* 20240226 수정 */

const onClickSetColumnDef = async (categoryObject: object, page: number): Promise<void> => {
  if (page === undefined || isNaN(page)) page = 1
  if (selectedRow !== null ) {
    await toggleActiveRow(selectedRow) // 선택된 행 비활성화
  }
  if (Object.keys(categoryObject).length > 0) {
    selectedCategory.value = new Array(categoryObject)
    pagination.value.page = 1
    getSelectedTableParam.value.queryOffset = -1
    // open: detail, show: modal 닫기
    modal.value = false // 선택된 행 닫기
    detail.value = false // 선택된 행 닫기

    pagination.value.descending = null
    pagination.value.sortBy = null
    await updateGrid(page) // 카테고리 선택 변경 시 페이징 초기화
  }

  categoryListData.value.forEach((category_1) => {
    if (category_1.name === categoryObject.Category_1) {
      category_1.isOpen = true

      if (Array.isArray(category_1.subList) && category_1.subList.length > 0) {
        for (const category_2 of category_1.subList) {
          if (category_2.name === categoryObject.Category_2) {
            category_2.isOpen = true

            if (Array.isArray(category_2.subList) && category_2.subList.length > 0) {
              for (const category_3 of category_2.subList) {
                if (category_3.name === categoryObject.Category_3) {
                  category_3.isOpen = true
                } else {
                  category_3.isOpen = false
                }
              }
            }
          } else {
            category_2.isOpen = false
          }
        }
      }
    } else {
      category_1.isOpen = false
    }
  })
}

function updateAllBookmarkCheckbox() {
  if (selectedBookmarkCount === gridRowData.value.length) {
    bookmarkSelect.value = true
  } else if (selectedBookmarkCount === 0) {
    bookmarkSelect.value = false
  } else {
    bookmarkSelect.value = null
  }
}

const updateBookmark = (): void => {
  caseStore.setCurrentBookmarkItem(selectedBookmarkGroup.value)
  selectedBookmarkGroupColor.value = selectedBookmarkGroup?.value?.b_color

  const B_Id = selectedBookmarkGroup?.value?.b_id

  selectedBookmarkCount = 0
  if (B_Id !== undefined) {
    gridRowData.value.forEach((item) => {
      if (B_Id === item._book) {
        item.bookmark = true
        selectedBookmarkCount++
      } else {
        item.bookmark = false
      }
    })

    updateAllBookmarkCheckbox()
  }
}

const onChangeBookmarkGroup = async (value: DB_BOOKMARK_INFO_ITEM<object>) => {
  selectedBookmarkGroup.value = value
  caseStore.setCurrentBookmarkItem(selectedBookmarkGroup.value)
  getSelectedTableParam.value.queryBookMarkId = selectedBookmarkGroup.value.b_id
  selectedBookmarkGroupColor.value = selectedBookmarkGroup?.value?.b_color

  // rowdata update를 위해 오프셋 초기화
  getSelectedTableParam.value.queryOffset = -1
  await updateGrid(pagination.value.page)
}

const updateGrid = async (page: number): Promise<void> => {
  $q.loading.show()
  if (!Number.isNaN(page)) {
    pagination.value.page = page
    await grid.value.requestServerInteraction()
  } else {
    await grid.value.requestServerInteraction()
  }

  $q.loading.hide()
}

//let fetchedRow = []
const onRequest = async (props): Promise<void> => {
  const { sortBy, descending } = props.pagination
  // sort값이나 descending값이 변한 것이 있는지 확인
  // const sortChanged = sortBy !== pagination.value.sortBy || descending !== pagination.value.descending

  if (selectedCategory?.value[0]?.dbQueryTableName !== '') {
    // 클릭할 때마다 sort 초기화
    // selectedColumnDef.value.forEach((column) => {
    //   column.sort = null
    // })
    loading.value = true
    $q.loading.show()

    grid.value.scrollTo(0, 0)

    const pageNumber = Number.isNaN(pagination.value.page) ? 1 : pagination.value.page
    const startRow = (pageNumber - 1) * selectedRowsPerPage.value
    startRowNumber.value = startRow

    const currentQueryOffset = startRow
    console.log(`startRow: ${startRow + 1} currentQueryOffset : ${currentQueryOffset}`)

    // 총 row 개수 계산
    pagination.value.rowsNumber = selectedRowCount.value

    // row 데이터 호출
    // gridRowData.value = []

    if (getSelectedTableParam.value.queryBookMarkId === undefined) {
      await caseStore.getBookmarkGroupList()
      // 수정
      // 원래 caseStore.bookmark[0]
      if (caseStore.defaultBookmarkItem !== undefined) {
        selectedBookmarkGroup.value = caseStore.defaultBookmarkItem
        selectedBookmarkGroupColor.value = selectedBookmarkGroup?.value?.b_color
        getSelectedTableParam.value.queryBookMarkId = selectedBookmarkGroup.value.b_id
      }
    }

    // param setting up
    if (sortBy !== null) {
      getSelectedTableParam.value.querySortFlag = true
      getSelectedTableParam.value.querySortColName = sortBy
      getSelectedTableParam.value.querySortDescFlag = descending
    } else {
      getSelectedTableParam.value.querySortFlag = false
      getSelectedTableParam.value.querySortColName = ''
      getSelectedTableParam.value.querySortDescFlag = false
    }

    let fetchedRow = []
    getSelectedTableParam.value.queryPageSize = selectedRowsPerPage.value
    //if (getSelectedTableParam.value.queryOffset !== currentQueryOffset) {
    getSelectedTableParam.value.queryOffset = currentQueryOffset
    fetchedRow = await getRowData(selectedCategory?.value[0]?.dbQueryTableName)
    console.log('############ offset changed : ', fetchedRow)
    //}

    gridRowData.value = fetchedRow //.slice(insetOffset, insetOffset + selectedRowsPerPage.value)

    updateBookmark()

    pagination.value.page = pageNumber
    pagination.value.rowsPerPage = selectedRowsPerPage.value
    pagination.value.sortBy = sortBy
    pagination.value.descending = descending

    $q.loading.hide()
    loading.value = false

    if (selectedTableId.value !== '') {
      goToPageById(selectedTableId.value)
      selectedTableId.value = ''
    }
  }
}
const onChangeBookmark = async (value) => {
  const bookmarkItem: DB_BOOKMARK_MAPPER_INFO[] = [
    {
      _id: selectedBookmarkGroup.value.b_id,
      _tableName: selectedCategory?.value[0]?.dbQueryTableName,
      _tableIdx: value.a_id,
      _category_1: value.category_1,
      _category_2: value.category_2,
      _category_3: value.category_3
    }
  ]

  //$q.loading.show()
  if (value._book === 0) {
    if (await caseStore.addBookmarkOne(bookmarkItem)) {
      value._book = selectedBookmarkGroup.value.b_id
      selectedBookmarkCount++
    }
  } else {
    if (await caseStore.deleteBookmarkOne(bookmarkItem)) {
      value._book = 0
      selectedBookmarkCount--
    }
  }
  updateAllBookmarkCheckbox()
}

const onChangeBookmarkAll = async (value) => {
  let bookmarkItems: DB_BOOKMARK_MAPPER_INFO[] = []

  console.debug('############ bookmark changed all start : ', bookmarkItems)
  $q.loading.show()
  selectedBookmarkCount = 0
  if (value) {
    // 전체 선택
    for (const item of gridRowData.value) {
      if (item._book === 0) {
        bookmarkItems.push({
          _id: selectedBookmarkGroup.value.b_id,
          _tableName: selectedCategory?.value[0]?.dbQueryTableName,
          _tableIdx: item.a_id !== undefined ? item.a_id : '',
          _category_1: item.category_1 !== undefined ? item.category_1 : '',
          _category_2: item.category_2 !== undefined ? item.category_2 : '',
          _category_3: item.category_3 !== undefined ? item.category_3 : ''
        })
      }
      selectedBookmarkCount++
    }

    await caseStore.addBookmark(bookmarkItems)
    gridRowData.value.forEach((item) => {
      if (!item.bookmark) {
        item.bookmark = true
        item._book = selectedBookmarkGroup.value.b_id
      }
    })
    // bookmarkSelect.value = true
  } else {
    // 전체 취소
    for (const item of gridRowData.value) {
      if (item._book === selectedBookmarkGroup.value.b_id) {
        bookmarkItems.push({
          _id: selectedBookmarkGroup.value.b_id,
          _tableName: selectedCategory?.value[0]?.dbQueryTableName,
          _tableIdx: item.a_id !== undefined ? item.a_id : '',
          _category_1: item.category_1 !== undefined ? item.category_1 : '',
          _category_2: item.category_2 !== undefined ? item.category_2 : '',
          _category_3: item.category_3 !== undefined ? item.category_3 : ''
        })
      }
    }
    console.log('전체 취소', bookmarkItems)
    await caseStore.deleteBookmark(bookmarkItems)
    gridRowData.value.forEach((item) => {
      if (item.bookmark) {
        item.bookmark = false
        item._book = 0
      }
    })
    // bookmarkSelect.value = false
    updateAllBookmarkCheckbox()
  }
}

const onBookmarkItemAdded = async (value): Promise<void> => {
  if (value.state === '_000') {
    console.debug('************* 북마크 처리 완료 *****************')
    console.debug(value)

    // rowdata update를 위해 오프셋 초기화
    // getSelectedTableParam.value.queryOffset = -1
    // await grid.value.requestServerInteraction()
  }
  $q.loading.hide()
}

/**
 * 목록 저장 진행. 버튼 클릭시 해당 페이지의 테이블 전체 목록을 csv 파일로 내보내기
 */
async function startSaveTable(currentTableName: string): Promise<void> {
  try {
    $q.loading.show()
    const orgDbPath = dbSetPath.value
    const tableName = currentTableName

    // 저장 경로 선택 다이얼로그 오픈
    const returnValue = await electronApi().openFolderDialog()
    if (returnValue.canceled) {
      $q.loading.hide()
      return
    }
    const csvFileFolderPath = returnValue.filePaths.length ? returnValue.filePaths[0] : ''

    // 전체목록 지정 전체 경로
    const saveFileName = csvFileFolderPath + '\\' + tableName + '.csv'

    await makeTableToCsv({ dBPath: orgDbPath, tableName: tableName, saveTableFileName: saveFileName })
    await openAlert('csv 저장이 완료됐습니다.')
  } catch (error) {
    console.error('목록 저장 진행시 오류 발생:', error)
  }
  $q.loading.hide()
}
/**
 * 선택한 테이블 csv로 목록 저장
 */
async function makeTableToCsv(param: TABLE_PRT_CMD) {
  return new Promise<void>((resolve) => {
    kapeApi.makeCsvSelectImage(param, (state) => {
      console.log('목록 저장: ', state)
      if (state.state === '_000' && state.percent === 100) {
        $q.loading.hide()
        resolve()
      }
    })
  })
}

/**********************************************
 * @description Define Hooks
 */
onMounted(async (): Promise<void> => {
  showOverViewDialog.value = true
  // 최초 rendering시 분석 개요 다이어그램 open
  selectedCategory.value = config.categoryDefaultDataArray
  // 기본적인 카테고리 정보를 불러온다(resources/winart_config.json에서 이미 정의 내림)

  if (defaultBookmarkItem.value !== currentBookmarkItem.value) {
    selectedBookmarkGroup.value = currentBookmarkItem.value
    selectedBookmarkGroupColor.value = selectedBookmarkGroup?.value?.b_color
    getSelectedTableParam.value.queryBookMarkId = selectedBookmarkGroup.value.b_id
    // rowdata update를 위해 오프셋 초기화
    getSelectedTableParam.value.queryOffset = -1
    // await updateGrid(pagination.value.page)
  }
  await updateGrid(1)

  if (ipcRenderer !== undefined) {
    ipcRenderer.on(KAPE_OP_CHANNELS.bookMarkMapperTableResult, onBookmarkItemAdded)
  }
})

/***************************************
 * @description 탭 제어 정보
 */

// 북마크 Dialog isShow
const isShowBookmarkDialog: Ref<boolean> = ref(false)
// 검색 Dialog isShow
const isShowSearchDialog: Ref<boolean> = ref(false)

// 북마크 아이템에서 발생하는 'open:bookmarkDialog' 이벤트 처리
function handleOpenBookmarkDialog() {
  isShowBookmarkDialog.value = true
}

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

// ******************************
// 20240312 최적화 함수 
// function showDialog(id: number) {
//   if (id === 0) {
//     isShowBookmarkDialog.value = true
//   } else if (id === 1) {
//     isShowSearchDialog.value = true
//   }
// }

// function handleOpenBookmarkDialog() {
//   showDialog(0)
// }

// function onTabClick(id: number, option?: any) {
//   showDialog(id)
// }

// defineExpose({
//   onTabClick
// })
// ******************************

/***************************************
 * @description 검색 다이얼로그
 */

// 검색 다이얼로그 닫기 이벤트
async function onDialogSearchClose(isClose: any) {
  isShowSearchDialog.value = isClose
  // if (isClose === false) {
  //   await grid.value.requestServerInteraction()
  // }
}
// 검색 다이얼로그 현재 북마크 id가 일치하는 경우에만 화면 업데이트
async function onSearchChange() {
  await grid.value.requestServerInteraction()
}

/***************************************
 * @description 북마크 다이얼로그
 */

// 현재 선택된 셀렉트박스 북마크 정보
const currentSelectedBookmark: Ref<Object> = ref({})

// 북마크 다이얼로그 닫기 이벤트
async function onDialogBookmarkClose(isClose: any) {
  isShowBookmarkDialog.value = isClose
  if (isClose === false) {
    await grid.value.requestServerInteraction()
  }
}

// 개별 북마트 추가 /삭제
function onBookmarkChange(state: string, value: any) {
  console.log(value)
}

//
const showTable: Ref<boolean> = ref(false)
</script>

<!-- 아티팩트 조회화면 -->
<template>
  <div class="chart-inquiry-wrap">
    <div class="chart-inquiry-top">
      <h2 v-if="caseDetail" class="">케이스명 : {{ caseDetail.caseName || caseDetail.evidenceImgfileName }}</h2>
      <q-space></q-space>
      <!-- 북마크 -->
      <BookmarkItem
        :bookmark-data-array="bookmarkGroup"
        @update="onChangeBookmarkGroup"
        @open:bookmarkDialog="handleOpenBookmarkDialog"
      />
    </div>

    <div class="chart-inquiry-bot">
      <!-- 왼쪽 사이드바 (s)-->
      <div class="side-wrap">
        <q-list class="side">
          <q-expansion-item
            v-for="(listItem, index) in categoryListData"
            :key="index"
            v-model="listItem.isOpen"
            :label="listItem.label + (listItem.count !== undefined ? '(' + numberWithCommas(listItem.count) + ')' : '')"
            :default-opened="listItem.isOpen"
            :expand-icon="listItem?.subList?.length > 0 && listItem?.subList !== undefined ? '' : 'none'"
            :disable="listItem.count === 0"
            expand-separator
            class="one-depth"
          >
            <template v-if="listItem?.subList?.length > 0 && listItem?.subList !== undefined">
              <q-expansion-item
                v-for="(listItem1Depth, index) in listItem?.subList"
                :key="index"
                v-model="listItem1Depth.isOpen"
                :label="
                  listItem1Depth.label +
                  (listItem1Depth.count !== undefined ? '(' + numberWithCommas(listItem1Depth.count) + ')' : '')
                "
                :default-opened="listItem1Depth.isOpen"
                :expand-icon="
                  listItem1Depth?.subList?.length > 0 && listItem1Depth?.subList !== undefined ? '' : 'none'
                "
                :disable="listItem1Depth.count === 0"
                dense
                dense-toggle
                class="two-depth"
              >
                <template v-if="listItem1Depth?.subList?.length > 0 && listItem1Depth?.subList !== undefined">
                  <q-card v-for="(listItem2Depth, index) in listItem1Depth?.subList" :key="index" class="three-depth">
                    <q-card-actions :class="{ active: listItem2Depth.isOpen }">
                      <q-btn
                        flat
                        :disable="listItem2Depth?.count === 0"
                        @click="
                          () => {
                            // 240208 같은 컬럼 클릭시에는 호출X
                            if (listItem2Depth.name !== selectedCategory[0].name) {
                              onClickSetColumnDef(
                                Object.assign(listItem2Depth, {
                                  Category_1: listItem.name,
                                  Category_2: listItem1Depth.name,
                                  Category_3: listItem2Depth.name
                                }),
                                1
                              )
                            }
                          }
                        "
                      >
                        {{
                          listItem2Depth.label +
                          (listItem2Depth.count !== undefined ? '(' + numberWithCommas(listItem2Depth.count) + ')' : '')
                        }}
                      </q-btn>
                    </q-card-actions>
                  </q-card>
                </template>
              </q-expansion-item>
            </template>
          </q-expansion-item>
        </q-list>
      </div>
      <!-- 왼쪽 사이드바 (e)-->

      <!-- 메인영역(테이블) (s) -->
      <div class="main-content">
        <!-- 헤더 -->
        <div class="tit-area h3">
          <h3>
            {{ selectedCategory[0]?.label !== undefined ? selectedCategory[0].label : '' }}
            <span>({{ numberWithCommas(selectedRowCount) }})</span>
          </h3>
          <div class="cont-group-right">
            <span class="text-md-2 page-txt">페이지당 표시</span>
            <!-- 목록 내보내기 -->
            <q-select
              v-model="selectedRowsPerPage"
              outlined
              dense
              :options="rowsPerPageArr"
              class="select-page q-mr-sm"
            ></q-select>
            <!-- 페이지당 건수 -->
            <q-select v-model="selectedEncoding" outlined dense :options="encodingArr" class="q-mr-sm"></q-select>
            <q-btn
              outline
              label="목록저장"
              icon="mdi-download"
              @click="startSaveTable(selectedCategory[0]?.dbQueryTableName)"
            ></q-btn>
            <!-- 20231206__ 프린트 삭제 -->
            <!--  <q-btn outline label="프린트" icon="mdi-printer" class="print-btn"></q-btn> -->
          </div>
        </div>
        <!-- 목록 테이블 -->
        <div class="content-area">
          <div class="artifacts-table-wrap">
            <!-- ****************** 2024-03-12 테이블 view 임의 수정 ****************** -->
            <div v-show="showTable">
            <q-table
              ref="grid"
              v-model:selected="rowSelected"
              v-model:pagination="pagination"
              v-table-columns-resizeable="{ tablename: selectedCategory[0]?.dbQueryTableName }"
              :columns="selectedColumnDef"
              :rows-per-page-options="rowsPerPageArr"
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
                      v-model="bookmarkSelect"
                      checked-icon="mdi-bookmark"
                      unchecked-icon="mdi-bookmark-outline"
                      indeterminate-icon="mdi-bookmark-minus"
                      @update:model-value="onChangeBookmarkAll"
                    />
                  </q-th>
                  <q-th v-for="col in props.cols" :key="col.name" :props="props">
                    {{ col.label }}
                  </q-th>
                </q-tr>
              </template>
              <template #body="props">
                <q-tr :props="props" :class="{ active: isRowActive(props.row) }" @click="toggleActiveRow(props.row)">
                  <q-td class="text-center">
                    <q-checkbox
                      v-if="props.row.bookmark !== undefined"
                      v-model="props.row.bookmark"
                      checked-icon="mdi-bookmark"
                      unchecked-icon="mdi-bookmark-outline"
                      @update:model-value="onChangeBookmark(props.row)"
                    />
                    <q-icon v-else name="mdi-bookmark-outline" />
                  </q-td>
                  <q-td v-for="col in props.cols" :key="col.name" :props="props">
                    {{ col.value }}
                  </q-td>
                </q-tr>
              </template>
            </q-table>
          </div>
          <!-- ****************** 2024-03-12 테이블 view 임의 수정 ****************** -->
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
                    <template v-for="columnInfo in selectedDetailInfoColumnDef">
                      <tr v-if="columnInfo.visible">
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
      </div>
      <!-- 메인영역(테이블) (e) -->
    </div>
  </div>
  <DialogBookmark
    :is-show="isShowBookmarkDialog"
    :current-bookmark="selectedBookmarkGroup"
    @updateBookMark:change="onBookmarkChange"
    @update:isShow="onDialogBookmarkClose"
  />
  <DialogSearch
    :is-show="isShowSearchDialog"
    @update:isShow="onDialogSearchClose"
    @update:changeFromSearch="onSearchChange"
  />
</template>

<style scoped lang="scss">
.chart-inquiry-wrap {
  width: 100%;
  height: 100%;
  .chart-inquiry-top {
    display: flex;
    align-items: center;
    padding: 0 20px;
    height: 3.75rem;
  }
  .chart-inquiry-bot {
    display: flex;
    flex-direction: row;
    width: 100%;
    height: 100%;
  }
}

// side list (s)
::v-deep(.side-wrap) {
  width: 100%;
  max-width: 25rem;
  line-height: 1;
  > .q-list {
    height: calc(100vh - 190px);
  }
  .q-expansion-item {
    background-color: #3e4043;
    &--expanded {
      background: linear-gradient(to right, rgba(20, 215, 200, 0.5) 0%, rgba(100, 100, 100, 0.15) 100%) !important;
    }
    .q-expansion-item__content {
      background-color: #101214;
    }
    .q-item {
      min-height: 48px;
      padding-left: 1.25rem;
    }
  }
  .two-depth {
    width: 100%;
    font-weight: 700;
    background-color: #26292b;
    .q-item {
      min-height: 40px;
      padding-left: 1.875rem;
      &:hover {
        background: linear-gradient(to right, rgba(20, 215, 200, 0.5) 0%, rgba(100, 100, 100, 0.15) 100%);
      }
    }
  }
  .three-depth {
    &:first-child {
      padding-top: 8px;
    }
    &:last-child {
      padding-bottom: 8px;
    }
    .q-card__actions {
      min-height: 34px;
      padding: 0rem 1.25rem 0rem 2.875rem;
      font-size: 0.9375rem;
      font-weight: 500;
      &.active {
        background-color: #333;
      }
    }
  }
}
// side list (e)

// grid (s)
.main-content {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: calc(100% - 25rem);
  height: 100%;
  //width: calc(100% - 25rem);
  /* Content title */
  .tit-area {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    flex: 0 3.25rem;
    height: 3.25rem;
    padding: 0.75rem 1.25rem;
    margin: 0;
    border-top: 1px solid #1e2022;
    border-bottom: 1px solid #1e2022;
  }
  .cont-group-right {
    display: flex;
    flex-direction: row;
    justify-content: right;
    .page-txt {
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .select-page {
      margin-left: 8px;
    }
    // .print-btn {
    //   margin-left: 0.5rem;
    // }
    button {
      height: 2.25rem;
    }
  }

  // 목록 테이블
  .content-area :deep {
    display: flex;
    flex-direction: column;
    height: calc(100% - 12.5rem);
    padding: 1.25rem 1.375rem 2rem 1.375rem;
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
          }
          thead tr,
          tbody td {
            height: auto;
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
            color: v-bind(selectedBookmarkGroupColor);
          }
          .q-icon {
            font-size: 24px;
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
      }
    }
    .detail-view-header {
      position: absolute;
      top: 0px;
      width: 100%;
      padding: 0.625rem 0px 0.625rem 2.375rem;
      text-align: left;
      background-color: #1e2022;
    }
    .detail-view-table {
      max-width: 39.286rem;
      margin-top: 3rem;
      overflow-y: hidden;
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
// grid (e)

// 화이트모드
.body--light {
  // 사이드
  .side-wrap :deep {
    border: 1px solid $light-border;
    .q-expansion-item {
      background-color: $light-bg;
      &--expanded {
        background: linear-gradient(45deg, rgba(#318ddf, 60%), rgba(#318ddf, 0%)) !important;
      }
      .q-expansion-item__content {
        background-color: $light-border;
      }
    }
    .two-depth {
      background-color: $light-table;
      .q-item {
        &:hover {
          background: linear-gradient(45deg, rgba(#318ddf, 60%), rgba(#318ddf, 0%)) !important;
        }
      }
    }
    .three-depth {
      &:last-child {
        border-bottom: 1px solid $light-border;
      }
      .q-card__actions {
        &.active {
          background-color: #ffffff;
          color: $light-primary;
        }
      }
    }
  }
  // 메인
  .main-content {
    .tit-area {
      border-color: $light-border;
    }
    .cont-group-right {
      label + button {
        &.q-btn--outline::before {
          border-color: $light-dark;
        }
      }
    }
    // 테이블 목록
    .content-area :deep {
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
                  border-color: rgba($light-border, 100%);
                  border-bottom: 1px solid $light-border;
                }
              }
              tr:nth-child(2n) {
                background-color: $light-table;
              }
            }
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
}
</style>
