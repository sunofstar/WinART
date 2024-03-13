<script setup lang="ts">
/**********************************************
 *
 * 북마크 Dialog
 *
 **********************************************/

/**********************************************
 * @description Import
 */
import { maxLengthRule, requiredRule, specialCharRule } from '@renderer/utils/validationRules'
import { defineProps, defineEmits, computed, watch, ref, toRefs, reactive, onBeforeMount, onBeforeUnmount } from 'vue'
import type { Ref } from 'vue'
import { useCaseStore } from '@renderer/stores/caseStore'
import type { DB_BOOKMARK_INFO_ITEM } from '@share/models'
import { openConfirm, openError } from '@renderer/composables/useDialog'
import { numberWithCommas } from '@renderer/utils/utils'
import { CategoryObjects } from '@renderer/api/getConfig'
import { useConfigStore } from '@renderer/stores/configStore'
import type { DB_BOOKMARK_CATEGORY_LIST, DB_BOOKMARK_MAPPER_INFO } from '@share/models'
import { KAPE_OP_CHANNELS } from '@share/constants'
import { QTable, useQuasar } from 'quasar'
import { useRouter, useRoute } from 'vue-router'
const $q = useQuasar()
const config = useConfigStore()
const caseStore = useCaseStore()
const router = useRouter()
const route = useRoute()

let selectedBookmarkCount = 0

// 북마크 이전 카테고리 선택 정보
let prevSelectBookmarkCount = 0
let prevbookmarkItems: DB_BOOKMARK_MAPPER_INFO[] = []
const prevSelectedCategory: Ref<CategoryObjects[]> = ref([])
const clickSelectedCategory: Ref<CategoryObjects> = ref()
const clickBookmarkSearchAll: Ref<boolean> = ref(false)
const clickBookmarkGroupPrev: Ref<boolean> = ref(false)
const prevSelectBookmarkGroup: Ref<object> = ref({})
const prevClosePopup: Ref<boolean> = ref(false)

/**********************************************
 * @description Define Props
 */
const emit = defineEmits(['update:isShow', 'updateBookMark:change'])
const props = defineProps(['isShow', 'currentBookmark'])

const isShow = computed({
  get() {
    caseStore.getBookmarkGroupList()
    // TO DO: 추후 store가 아니라 DB에서 직접 호출합니다
    // 현재 선택된 북마크 아이디
    selectedBookmarkGroup.value = props.currentBookmark
    return props.isShow
  },
  set(value) {
    // alert(props.currentBookmark)
    emit('update:isShow', value)
    // 조회한 카테고리 초기화
    categoryListData.value = []
    // 조회한 아티팩트 리스트 초기화
    selectedCategory.value = []
    // 조회한 검색용 selectBox 초기화
    selectSearchSelector.value = []
    // 조회한 페이지 초기화
    pagination.value.rowsPerPage = 0
    // 조회 북마크 view 초기화
    viewCheckBox.value = false
    // 조회 선택된 데이터 초기화
    gridRowData.value = []
    // 불러온 데이터 매핑 초기화
    fetchedRowDataByBookmarkGroup.value = []

    // 북마크 삭제 관련 초기화
    prevSelectBookmarkCount = 0
    prevbookmarkItems = []
    prevSelectedCategory.value = []
    clickSelectedCategory.value = {}
    clickBookmarkSearchAll.value = false
    clickBookmarkGroupPrev.value = false
    prevSelectBookmarkGroup.value = {}
    prevClosePopup.value = false
    
  }
})

/**********************************************
 *
 * @description Define Computed
 */
const bookmarkListArray: DB_BOOKMARK_INFO_ITEM[] = computed({
  get() {
    let bookmarkListData: DB_BOOKMARK_INFO_ITEM[] = caseStore.bookmark
    if (Array.isArray(bookmarkListData)) {
      return bookmarkListData
    }

    return []
  },
  set(value) {}
})

const selectedRowCount = computed({
  get() {
    console.log('################## selectedRowCount ', selectedCategory)
    if (selectedCategory?.value.length > 0) {
      const selectedRowDataCount =
        selectedCategory?.value[0].bookmarkCount !== undefined ? selectedCategory?.value[0].bookmarkCount : 0
      return selectedRowDataCount
    } else {
      return 0
    }
  },
  set() {
    return
  }
})

const pageMax = computed({
  get() {
    return Math.ceil(pagination.value.rowsNumber / pagination.value.rowsPerPage)
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
      for (const col of columnDef) {
        col.sortable = false
      }
      category = [...columnDef]
    }
    return category
  },
  set(value) {
    return
  }
})

/**********************************************
 * @description Define variables
 */
const DEFAULT_OFFSET: number = 1000

const isShowBookmarkModificator: Ref<boolean> = ref(false)
// 북마크 CRUD를 위한 Item
const selectedBookmarkItem: Ref<DB_BOOKMARK_INFO_ITEM> = ref({})
const current = ref(1)
const categoryListData: Ref<CategoryObjects[]> = ref([])
const selectedCategory: Ref<CategoryObjects[]> = ref([])

// bookmarkGrid
const loading: Ref<boolean> = ref(false)
const gridRowData: Ref<object[]> = ref([])
const fetchedRowDataByBookmarkGroup = reactive([])
const bookmarkGrid: Ref<QTable> = ref()

const selectedBookmarkGroup: Ref<DB_BOOKMARK_INFO_ITEM> = ref({})
const selectedBookmarkColor: Ref<string> = ref('#ffffff')

const rowSelected: Ref<[]> = ref([])
const bookmarkSelect: Ref<boolean | null> = ref(true)
const viewCheckBox: Ref<boolean> = ref(false)

const rowsPerPageArr: number[] = [100, 200, 300, 400, 500]
const selectedRowsPerPage: Ref<number> = ref(100)
const startRowNumber: Ref<number> = ref(0)
const currentQueryOffset: Ref<number> = ref(0)
const currentOffset: Ref<number> = ref(-1)
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

// 검색
const search = ref('')
const isSearch: Ref<boolean> = ref(false)
let searchedRowData = []
// 내용 셀렉트 {label: '내용', value: '값'}

const searchFieldSelector: Ref<[]> = ref([])
// 내용 셀렉트
const selectSearchSelector: Ref<object> = ref()

/**********************************************
 * @description Define Methods
 */

/**
 * @description 북마크 목록 수정 클릭 시 다이얼로그 출력
 * @param listItem {DB_BOOKMARK_INFO_ITEM}
 */

const updateDatas = async (): Promise<void> => {
  await caseStore.getBookmarkGroupList()
  await bookmarkGrid.value.requestServerInteraction()
}
const resetComponents = (): void => {
  fetchedRowDataByBookmarkGroup.value = []
  searchedRowData = []
  categoryListData.value = []
  selectedCategory.value = []
  selectedBookmarkColor.value = '#ffffff'
  currentOffset.value = -1
  updateDatas()
}

const showBookmarkModificator = (listItem: DB_BOOKMARK_INFO_ITEM): void => {
  selectedBookmarkItem.value = Object.assign({}, listItem)
  isShowBookmarkModificator.value = true
}

const onClickSaveBookmark = async (): Promise<void> => {
  try {
    const isNewBookmark = selectedBookmarkItem.value.b_id === ''
    const isDuplicatedNameAndColor = bookmarkListArray.value.some(
      (item) => item.b_name === selectedBookmarkItem.value.b_name && item.b_color === selectedBookmarkItem.value.b_color
    )
    if (isNewBookmark) {
      // 새로운 북마크인 경우
      if (isDuplicatedNameAndColor) {
        // 이미 동일한 이름, 동일한 색상의 북마크 그룹이 존재하는 경우
        throw new Error('이미 동일한 북마크 그룹이 존재합니다.')
      } else {
        // 중복되는 이름 또는 색상이 없는 경우
        await caseStore.addBookmarkGroup(selectedBookmarkItem.value)
      }
    } else {
      // 기존의 북마크를 수정하는 경우
      await caseStore.modifyBookmarkGroup(selectedBookmarkItem.value)
    }
    updateDatas()
    isShowBookmarkModificator.value = false
  } catch (error) {
    await openError(error.message || '북마크를 처리하는 과정에서 오류가 발생했습니다.')
    selectedBookmarkItem.value.b_id === ''
    selectedBookmarkItem.value.b_name === ''
    selectedBookmarkItem.value.b_color === ''
  }
}

const onClickAddNewBookmark = (): void => {
  selectedBookmarkItem.value = {
    b_id: '',
    b_name: '',
    b_color: ''
  }
  isShowBookmarkModificator.value = true
}

const onClickDeleteBookmark = async (listItem: DB_BOOKMARK_INFO_ITEM): Promise<void> => {
  if (!(await openConfirm(`선택한 북마크 ${listItem.b_name}(을)를 삭제 하시겠습니까?`))) {
    return false
  }

  Object.assign(selectedBookmarkItem.value, listItem)
  const result = await caseStore.deleteBookmarkGroup(selectedBookmarkItem.value)

  if (result) {
    resetComponents()
  } else {
    await openError('북마크를 처리하는 과정에서 오류가 발생했습니다.')
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
      _category_3: value.category_3,
      _will_delete: value.bookmark ? 0 : 1
    }
  ]

  if (value.bookmark) {
    if (await caseStore.willAddBookmarkOne(bookmarkItem)) selectedBookmarkCount++; prevSelectBookmarkCount++
  } else {
    if (await caseStore.willDeleteBookmarkOne(bookmarkItem)) selectedBookmarkCount--; prevSelectBookmarkCount--
  }
  emit('updateBookMark:change', value.bookmark ? 'add' : 'delete', bookmarkItem)
  updateAllBookmarkCheckbox()
  // 변환 내용 넘어감, 1개일 때
}

const onClickSelectBookmarkGroup = async (selectedBookmarkGroupItem): Promise<void> => {
  if (selectedBookmarkGroupItem === undefined) return false

  if(prevSelectBookmarkCount !== 0) {
    let bookmarkItems: DB_BOOKMARK_MAPPER_INFO[] = []

    prevSelectedCategory.value = selectedCategory.value
    if(prevSelectBookmarkCount !== 0 && prevSelectedCategory.value.length !== 0) {
      bookmarkItems.push({
        _id: selectedBookmarkGroup.value.b_id,
        _tableName: prevSelectedCategory.value[0].dbQueryTableName,
        _tableIdx: 0,
        _category_1: '',
        _category_2: '',
        _category_3: '',
        _will_delete: 0
      })
      
      prevbookmarkItems = bookmarkItems
      clickBookmarkSearchAll.value = false
      clickBookmarkGroupPrev.value = true
      prevSelectBookmarkGroup.value = selectedBookmarkGroupItem
      await caseStore.willDelDoneBookmark(prevbookmarkItems)
    }
  } else {
    categoryListData.value = []
    // 조회한 카테고리 초기화
    selectedCategory.value = []
    // 조회한 검색용 selectBox 초기화
    selectSearchSelector.value = []
    // 조회한 페이지 초기화
    pagination.value.rowsPerPage = 0
    // 조회 북마크 view 초기화
    viewCheckBox.value = false
    // 조회 선택된 데이터 초기화
    gridRowData.value = []
    // 불러온 데이터 매핑 초기화
    fetchedRowDataByBookmarkGroup.value = []

    await caseStore.getBookmarkGroupList()

    for (const bookmark of bookmarkListArray.value) {
      if (bookmark === selectedBookmarkGroupItem) {
        bookmark.isActive = true
      } else {
        bookmark.isActive = false
      }
    }

    // 북마크 그룹 내 북마크 데이터가 없을 시
    // if (selectedBookmarkGroupItem.CNT === 0) {
    //   resetComponents()
    //   return false
    // }

    selectedBookmarkGroup.value = selectedBookmarkGroupItem

    let categoryData = JSON.parse(JSON.stringify(config.categoryDataArray))

    // 카운트 초기화
    for (let item of categoryData) {
      item.bookmarkCount = 0
      for (let sub_item of item.subList) {
        sub_item.bookmarkCount = 0
        for (let sub_sub_item of sub_item.subList) {
          sub_sub_item.bookmarkCount = 0
        }
      }
    }
    //검색어 초기화
    search.value = ''

    if (selectedBookmarkGroupItem.b_id !== undefined) {
      const categoryList: DB_BOOKMARK_CATEGORY_LIST[] = await caseStore.getBookmarkCategoryList(
        selectedBookmarkGroupItem.b_id
      )

      for (let listItem of categoryList) {
        // console.log(listItem)
        categoryData = [...findExistCategory(categoryData, listItem, 1)]
      }

      categoryListData.value = [...categoryData]
      // console.log(categoryData)
    }
  }
}

// 북마크 그룹별 존재하는 아티팩트 리스트(number) 정보
function findExistCategory(
  targetArray: CategoryObjects[],
  listItem: DB_BOOKMARK_CATEGORY_LIST,
  categoryDepth: number
): [] {
  let tmpArray: CategoryObjects[] = targetArray

  for (let item of tmpArray) {
    if (categoryDepth === 1) {
      if (item.name === listItem.category_1) {
        item.isShow = true
        tmpArray.subList = findExistCategory(item.subList, listItem, 2)
        item.bookmarkCount += listItem.CNT
      }
    } else if (categoryDepth === 2) {
      if (item.name === listItem.category_2) {
        item.isShow = true
        tmpArray.subList = findExistCategory(item.subList, listItem, 3)
        item.bookmarkCount += listItem.CNT
      }
    } else if (categoryDepth === 3) {
      if (item.name === listItem.category_3) {
        item.isShow = true
        item.bookmarkCount += listItem.CNT
      }
    }

    /*if (item.name === listItem.category_1) {
        item.bookmarkCount += listItem.CNT
        // console.log(`item.name : ${item.bookmarkCount}, listItem._category_1: ${listItem._category_1}`)
      } else if (item.name === listItem.category_2) {
        item.bookmarkCount += listItem.CNT
        // console.log(`item.name : ${item.bookmarkCount}, listItem._category_2: ${listItem._category_2}`)
      } else if (item.name === listItem.category_3) {
        item.bookmarkCount = listItem.CNT
        // console.log(`item.name : ${item.bookmarkCount}, listItem._category_3: ${listItem._category_3}`)
      }

      if (Array.isArray(item.subList) && item.subList.length > 0) {
        tmpArray.subList = findExistCategory(item.subList, listItem)
      }*/
  }

  return tmpArray
}

const updateRowData = async (page: number): Promise<void> => {
  const pageNumber = isNaN(page) && page < 0 ? 0 : page

  bookmarkGrid.value.scrollTo(0, 0)
  selectedBookmarkColor.value = selectedBookmarkGroup?.value?.b_color

  let colDef = []
  // 검색필드 항목값 생성
  if (Array.isArray(selectedCategory.value[0]?.columnDef)) {
    for (const col of selectedCategory.value[0].columnDef) {
      if (col.field !== 'a_id') {
        colDef.push({ label: col.label, value: col.field })
      }
    }
  }

  searchFieldSelector.value.splice(0, searchFieldSelector.value.length, ...colDef)
  selectSearchSelector.value = searchFieldSelector.value[0]
  colDef = null

  const startRow = (pageNumber - 1) * selectedRowsPerPage.value
  startRowNumber.value = startRow

  currentQueryOffset.value = Math.floor(startRow / DEFAULT_OFFSET)
  console.log(
    `startRow: ${startRow + 1} currentOffset : ${currentOffset.value} currentQueryOffset : ${currentQueryOffset.value}`
  )

  if (currentOffset.value !== currentQueryOffset.value * DEFAULT_OFFSET) {
    currentOffset.value = currentQueryOffset.value * DEFAULT_OFFSET
    const bookmarkItem: DB_BOOKMARK_MAPPER_INFO[] = [
      {
        _id: selectedBookmarkGroup.value.b_id,
        _tableName: selectedCategory.value[0]?.dbQueryTableName,
        _tableIdx: 0,
        _category_1: '',
        _category_2: '',
        _category_3: '',
        _offset: currentOffset.value
      }
    ]
    $q.loading.show()
    await caseStore.getRowDataByBookmarkGroup(bookmarkItem)
  } else {
    await bookmarkGrid.value.requestServerInteraction()
  }
}

const onLoadRowDataByBookmarkGroup = async (value): Promise<void> => {
  if (value.state === '_000') {
    console.debug('************* 북마크 별 데이터 조회 완료 *****************')
    console.debug(value.data)

    fetchedRowDataByBookmarkGroup.value = []
    if (Array.isArray(value.data)) {
      const validArray = value.data.filter((item) => {
        if (item.b_id !== null) {
          if(item.will_delete == 0) {
            item.bookmark = true
          } else {
            item.bookmark = false
          }
          return true
        }
      })

      if (validArray.length > 0) {
        $q.loading.show()
        fetchedRowDataByBookmarkGroup.value = JSON.parse(JSON.stringify(validArray))
        currentOffset.value = -1 // 오프셋 초기화
        await bookmarkGrid.value.requestServerInteraction()
        // $q.loading.hide()
      }
    }
  }

  // $q.loading.hide()
}

const onClickParentCategory = async (categoryObject: object) => {
  const containKey = (obj, key) => Object.keys(obj).includes(key)

  const categoryChild = categoryObject.subList.find((item) => {
    return item.bookmarkCount !== 0
  })

  if (containKey(categoryChild, 'subList')) {
    const category2Child = categoryChild.subList.find((item) => {
      return item.bookmarkCount !== 0
    })
    onClickSideCategory(category2Child)
  } else {
    onClickSideCategory(categoryChild)
  }
}

const onClickSideCategory = async (CategoryObjects: object) => {
  // 북마크 다이얼로그 내 북마크 변경 카운트 체크 및 선택 메뉴 카테고리 체크 
  if(prevSelectBookmarkCount !== 0 && selectedCategory.value.length !== 0) {

    let bookmarkItems: DB_BOOKMARK_MAPPER_INFO[] = []
    
    prevSelectedCategory.value = selectedCategory.value
    // 이전 선택 카테고리와 현재 선택 카테고리 테이블명을 비교(동일한 카테고리를 선택했을시에 업데이트 방지)
    const compareObj = CategoryObjects.dbQueryTableName === prevSelectedCategory.value[0].dbQueryTableName

    if(compareObj) {
      onClickSetColumnDef(CategoryObjects)
    } else {
      bookmarkItems.push({
        _id: selectedBookmarkGroup.value.b_id,
        _tableName: prevSelectedCategory.value[0].dbQueryTableName,
        _tableIdx: 0,
        _category_1: '',
        _category_2: '',
        _category_3: '',
        _will_delete: 0
      })
      
      prevbookmarkItems = bookmarkItems

      clickBookmarkSearchAll.value = false

      await caseStore.willDelDoneBookmark(prevbookmarkItems)
    
      clickSelectedCategory.value = CategoryObjects
    }
  } else {
    onClickSetColumnDef(CategoryObjects)
  }
}

const onClickSetColumnDef = async (categoryObject: object) => {
  await caseStore.getBookmarkGroupList()

  let categoryData = JSON.parse(JSON.stringify(config.categoryDataArray))

  // 카운트 초기화
  for (let item of categoryData) {
    item.bookmarkCount = 0
    for (let sub_item of item.subList) {
      sub_item.bookmarkCount = 0
      for (let sub_sub_item of sub_item.subList) {
        sub_sub_item.bookmarkCount = 0
      }
    }
  }

  const categoryList: DB_BOOKMARK_CATEGORY_LIST[] = await caseStore.getBookmarkCategoryList(
    selectedBookmarkGroup.value.b_id
  )

  for (let listItem of categoryList) {
    // console.log(listItem)
    categoryData = [...findExistCategory(categoryData, listItem, 1)]
  }

  categoryListData.value = [...categoryData]

  if (Object.keys(categoryObject).length > 0) {
    if (
      selectedCategory.value.length === 0 ||
      categoryObject.dbQueryTableName !== selectedCategory.value[0].dbQueryTableName
    ) {
      // $q.loading.show()
      selectedCategory.value = new Array(categoryObject)
      pagination.value.page = 1
      currentOffset.value = -1 // 오프셋 초기화
      await updateRowData(1)
    }
    //$q.loading.hide()
  }
  search.value = ''
}

const updateGrid = async (page: number): Promise<void> => {
  if (!Number.isNaN(page)) {
    // $q.loading.show()
    pagination.value.page = page
    await updateRowData(page)
    //$q.loading.hide()
  }
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
const onRequest = async (props): Promise<void> => {
  const { sortBy, descending } = props.pagination

  loading.value = true

  const pageNumber = Number.isNaN(pagination.value.page) ? 1 : pagination.value.page

  gridRowData.value = []

  if (fetchedRowDataByBookmarkGroup.value.length > 0) {
    const insetOffset = startRowNumber.value - currentQueryOffset.value * DEFAULT_OFFSET

    // 검색 조건 있을 시
    if (isSearch.value) {
      searchedRowData = []
      for (const row of fetchedRowDataByBookmarkGroup.value) {
        const regex = new RegExp(`(${search.value})`, 'gi')
        const targetField = row[selectSearchSelector.value.value]
        const result = targetField.match(regex)

        if (result !== null) {
          const selectedRow = {}
          Object.assign(selectedRow, row)
          let selectString = `${selectedRow[selectSearchSelector.value.value]}`
          selectString = selectString.replaceAll(regex, (_, match) => `<mark>${match}</mark>`)
          selectedRow[selectSearchSelector.value.value] = selectString
          searchedRowData.push(selectedRow)
        }
      }
      // 총 row 개수 계산
      pagination.value.rowsNumber = searchedRowData.length
      gridRowData.value = searchedRowData.slice(insetOffset, insetOffset + selectedRowsPerPage.value)
    } else {
      gridRowData.value = fetchedRowDataByBookmarkGroup.value.slice(
        insetOffset,
        insetOffset + selectedRowsPerPage.value
      )
      // 총 row 개수 계산
      pagination.value.rowsNumber = selectedRowCount.value
    }
    setTimeout(() => {
      $q.loading.hide()
    }, 500);
  }
  // selectedBookmarkCount = gridRowData.value.length
  selectedBookmarkCount = gridRowData.value.filter(items => items.will_delete === 0).length
  //
  // if (Array.isArray(fetchedRowDataByBookmarkGroup.value))
  //   gridRowData.value = JSON.parse(JSON.stringify(fetchedRowDataByBookmarkGroup.value))

  pagination.value.page = pageNumber
  pagination.value.rowsPerPage = selectedRowsPerPage.value
  pagination.value.sortBy = sortBy
  pagination.value.descending = descending

  loading.value = false
  viewCheckBox.value = gridRowData.value.length === 0 ? false : true

  updateAllBookmarkCheckbox()
}

const onClickSearch = async (): Promise<void> => {
  if (search.value === '' || search.value === null) {
    isSearch.value = false
  } else {
    isSearch.value = true
  }
  await bookmarkGrid.value.requestServerInteraction()
}

// 북마크 전체 선택, 전체 해제

const isBookmarkAll: Ref<boolean> = ref(true)
const onChangeBookmarkAll = async (): Promise<void> => {
  let bookmarkItems: DB_BOOKMARK_MAPPER_INFO[] = []

  console.log('############ bookmarkSelect')
  console.log(bookmarkSelect.value)

  console.debug('############ bookmark changed all start : ', bookmarkItems)
  // $q.loading.show()

  for (const rowItem of gridRowData.value) {
    // console.log(rowItem)
    const shouldUpdateBookmark =
      (!isBookmarkAll.value && rowItem.b_id == selectedBookmarkGroup.value.b_id) ||
      (isBookmarkAll.value && rowItem.b_id === selectedBookmarkGroup.value.b_id)

    if (shouldUpdateBookmark) {
      bookmarkItems.push({
        _id: selectedBookmarkGroup.value.b_id,
        _tableName: selectedCategory.value[0].dbQueryTableName,
        _tableIdx: rowItem.a_id,
        _category_1: rowItem.category_1,
        _category_2: rowItem.category_2,
        _category_3: rowItem.category_3,
        _will_delete: bookmarkSelect.value ? 0 : 1
      })

      rowItem.bookmark = bookmarkSelect.value
    }

    //rowItem._book = isBookmarkAll.value ? 0 : selectedBookmarkGroup.value.b_id
  }

  // 검색 조건이 있는 경우 검색과 일치하는 북마크만 처리
  const filteredBookmarkItems = isSearch.value
    ? bookmarkItems.filter((item) => searchedRowData.includes(item))
    : bookmarkItems

  //
  if (bookmarkSelect.value) {
    await caseStore.willDelChangeBookmark(filteredBookmarkItems)
    prevSelectBookmarkCount = gridRowData.value.length
    selectedBookmarkCount = gridRowData.value.length
  } else {
    await caseStore.willDelChangeBookmark(filteredBookmarkItems)
    prevSelectBookmarkCount = -gridRowData.value.length
    selectedBookmarkCount = 0
  }
  
  // if (!isBookmarkAll.value) {
  //   await caseStore.addBookmark(filteredBookmarkItems)
  // } else {
  //   await caseStore.deleteBookmark(filteredBookmarkItems)
  // }

  isBookmarkAll.value = !isBookmarkAll.value
  clickBookmarkSearchAll.value = true
  
  // $q.loading.hide()
}

const onChangeWillDelBookmark = async (value): Promise<void> => {
  if (value.state === '_000') {
    if (prevSelectBookmarkCount !== 0){
      if(prevClosePopup.value) {
        prevSelectBookmarkCount = 0
        prevClosePopup.value = false

        isShow.value = false
        
      } else if(clickBookmarkGroupPrev.value == true) {
        console.log('onChangeWillDelBookmark')
        prevSelectBookmarkCount = 0
        clickBookmarkGroupPrev.value = false

        onClickSelectBookmarkGroup(prevSelectBookmarkGroup.value)
      } else if(clickBookmarkSearchAll.value == false && clickBookmarkGroupPrev.value == false){
        console.log('onChangeWillDelBookmark')
        prevSelectBookmarkCount = 0

        onClickSetColumnDef(clickSelectedCategory.value)
      } else {
        console.log('onChangeWillDelBookmark')
      }
    }
  }
}

const closeBookmarkDialogPopup = async (value): Promise<void> => {
  console.log(value)
  // 북마크 삭제 적용
  if(prevSelectBookmarkCount !== 0) {
    let bookmarkItems: DB_BOOKMARK_MAPPER_INFO[] = []

    prevSelectedCategory.value = selectedCategory.value
    if(prevSelectBookmarkCount !== 0 && prevSelectedCategory.value.length !== 0) {
      bookmarkItems.push({
        _id: selectedBookmarkGroup.value.b_id,
        _tableName: prevSelectedCategory.value[0].dbQueryTableName,
        _tableIdx: 0,
        _category_1: '',
        _category_2: '',
        _category_3: '',
        _will_delete: 0
      })
      
      prevbookmarkItems = bookmarkItems

      prevClosePopup.value = true
      clickBookmarkSearchAll.value = true
      clickSelectedCategory.value = false
      
      caseStore.willDelDoneBookmark(prevbookmarkItems)
    }
  } else {
    isShow.value = false
  }
}

/**********************************************
 * @description Define Hooks
 */
onBeforeMount((): void => {
  if (ipcRenderer !== undefined) {
    // TODO: 분리 필요 이벤트 : 북마크추가, 북마크 데이터 조회(REF)를 한 API로 처리하면서 다이얼로그 바닥에 있는 아티팩트 목록에서도 동일한 이벤트로 북마크 처리결과를 수집하고 있음
    ipcRenderer.on(KAPE_OP_CHANNELS.bookMarkMapperTableRefResult, onLoadRowDataByBookmarkGroup)
  }

  if (ipcRenderer !== undefined) {
    ipcRenderer.on(KAPE_OP_CHANNELS.bookMarkMapperTableResult, onChangeWillDelBookmark)
  }

  fetchedRowDataByBookmarkGroup.value = []
})

onBeforeUnmount((): void => {
  if (ipcRenderer !== undefined) {
    ipcRenderer.removeAllListeners()
  }
})
</script>

<template>
  <q-dialog v-model="isShow">
    <q-card class="q-dialog-plugin pop-default bookmark-dialog-wrap">
      <!-- 헤더 -->
      <q-card-section class="d-header">
        <h1>북마크</h1>
        <q-space></q-space>
        <q-btn v-close-popup icon="close" flat dense @click="closeBookmarkDialogPopup"></q-btn>
      </q-card-section>
      <!-- 본문 -->
      <q-card-section class="d-container row justify-between">
        <!-- 북마크관리 -->
        <div class="bookmark-group row justify-between">
          <div class="first">
            <q-toolbar class="column">
              <q-toolbar-title class="text-primary text-bold">북마크 그룹</q-toolbar-title>
              <q-btn label="북마크 추가" icon="mdi-plus" outline @click="onClickAddNewBookmark"></q-btn>
            </q-toolbar>
            <q-list>
              <q-item
                v-for="listItem in bookmarkListArray"
                :key="listItem.b_id"
                class="bookmark-item"
                :class="{ active: listItem.isActive }"
              >
                <q-item-section>
                  <q-icon name="mdi-bookmark" :style="{ color: listItem.b_color }"></q-icon>
                </q-item-section>
                <q-item-section>
                  <q-btn @click="onClickSelectBookmarkGroup(listItem)">
                    <span class="cursor-pointer">
                      {{ listItem.b_name }}
                      <em v-if="listItem.CNT !== undefined">({{ listItem.CNT }})</em>
                    </span>
                  </q-btn>
                </q-item-section>
                <q-item-section side>
                  <div class="">
                    <q-btn
                      label="수정"
                      class="text-primary"
                      size="12px"
                      outline
                      @click="showBookmarkModificator(listItem)"
                    ></q-btn>
                    <q-btn
                      label="삭제"
                      class="delete-btn"
                      size="12px"
                      outline
                      color="white"
                      @click="onClickDeleteBookmark(listItem)"
                    ></q-btn>
                  </div>
                </q-item-section>
              </q-item>
            </q-list>
          </div>
          <div class="second">
            <q-toolbar class="text-primary column">
              <q-toolbar-title class="text-bold">아티팩트</q-toolbar-title>
            </q-toolbar>
            <q-list class="category-list-wrap">
              <template v-for="(listItem, index) in categoryListData" :key="index">
                <q-expansion-item
                  v-if="listItem.isShow"
                  :label="
                    listItem.label +
                    (listItem.bookmarkCount !== undefined ? '(' + numberWithCommas(listItem.bookmarkCount) + ')' : '')
                  "
                  :expand-icon="listItem?.subList?.length > 0 && listItem?.subList !== undefined ? '' : 'none'"
                  expand-separator
                  class="one-depth"
                  @click="onClickParentCategory(listItem)"
                >
                  <template
                    v-for="(listItem1Depth, index) in listItem?.subList"
                    v-if="listItem?.subList?.length > 0 && listItem?.subList !== undefined"
                    :key="index"
                  >
                    <q-expansion-item
                      v-if="listItem1Depth.isShow"
                      :label="
                        listItem1Depth.label +
                        (listItem1Depth.bookmarkCount !== undefined
                          ? '(' + numberWithCommas(listItem1Depth.bookmarkCount) + ')'
                          : '')
                      "
                      :expand-icon="
                        listItem1Depth?.subList?.length > 0 && listItem1Depth?.subList !== undefined ? '' : 'none'
                      "
                      dense
                      dense-toggle
                      class="two-depth"
                      @click="onClickParentCategory(listItem1Depth)"
                    >
                      <template
                        v-for="(listItem2Depth, index) in listItem1Depth?.subList"
                        v-if="listItem1Depth?.subList?.length > 0 && listItem1Depth?.subList !== undefined"
                        :key="index"
                      >
                        <q-card v-if="listItem2Depth.isShow" class="three-depth">
                          <q-card-actions>
                            <q-btn
                              flat
                              :disable="listItem2Depth?.columnDef === undefined"
                              @click="onClickSideCategory(listItem2Depth)"
                            >
                              {{
                                listItem2Depth.label +
                                (listItem2Depth.bookmarkCount !== undefined
                                  ? '(' + numberWithCommas(listItem2Depth.bookmarkCount) + ')'
                                  : '')
                              }}
                            </q-btn>
                          </q-card-actions>
                        </q-card>
                      </template>
                    </q-expansion-item>
                  </template>
                </q-expansion-item>
              </template>
            </q-list>
          </div>
        </div>
        <!-- 북마크 테이블 -->
        <div class="bookmark-table">
          <div class="row justify-between items-center top">
            <q-toolbar-title class="text-bold text-primary">
              {{ selectedCategory[0]?.label }}
            </q-toolbar-title>
            <div class="row">
              <q-select
                v-model="selectSearchSelector"
                outlined
                dense
                :options="searchFieldSelector"
                class="q-mr-sm"
              ></q-select>
              <q-input v-model="search" dense outlined clearable clear-icon="mdi-close" @keydown.enter="onClickSearch" @clear="onClickSearch">
                <template #append>
                  <!-- TO DO : 마우스 hover -->
                  <q-icon name="search" @click="onClickSearch"></q-icon>
                </template>
              </q-input>
            </div>
            <div class="row items-center">
              <span class="text-md-2 page-txt">페이지당 표시</span>
              <!-- 페이지당 건수 -->
              <q-select
                v-model="selectedRowsPerPage"
                outlined
                dense
                :options="rowsPerPageArr"
                class="select-page"
              ></q-select>
            </div>
          </div>
          <!-- 목록 테이블 -->
          <div class="main">
            <div class="arti-table-wrap" :style="'--selected-bookmark-color : ' + selectedBookmarkColor">
              <q-table
                ref="bookmarkGrid"
                v-model:selected="rowSelected"
                v-model:pagination="pagination"
                v-table-columns-resizeable="{ tablename: selectedCategory[0]?.dbQueryTableName }"
                :columns="selectedColumnDef"
                :rows-per-page-options="rowsPerPageArr"
                :hide-bottom="true"
                :loading="loading"
                :rows="gridRowData"
                row-key="index"
                selection="multiple"
                table-class="table-list"
                separator="cell"
                no-data-label="조회된 결과가 없습니다."
                tabindex="0"
                hide-pagination
                @request="onRequest"
              >
                <template #header="props">
                  <q-tr :props="props">
                    <q-th>
                      <q-checkbox
                        v-show="viewCheckBox"
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
                  <q-tr :props="props">
                    <q-td class="text-center">
                      <q-checkbox
                        v-if="props.row.bookmark !== undefined"
                        v-model="props.row.bookmark"
                        checked-icon="mdi-bookmark"
                        unchecked-icon="mdi-bookmark-outline"
                        @update:model-value="onChangeBookmark(props.row)"
                      />
                    </q-td>
                    <q-td v-for="col in props.cols" :key="col.name" :props="props">
                      <span v-html="col.value" />
                    </q-td>
                  </q-tr>
                </template>
              </q-table>
            </div>
            <div class="pagination-wrap row justify-center">
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
      </q-card-section>
      <q-card-actions class="d-footer">
        <q-btn outline icon="mdi-close" label="닫기" @click="closeBookmarkDialogPopup" />
      </q-card-actions>

      <!-- 북마크 수정 상세 dialog(s) -->
      <q-dialog v-model="isShowBookmarkModificator">
        <q-card class="q-dialog-plugin">
          <q-card-section class="d-header">
            <h1>북마크 관리</h1>
          </q-card-section>
          <q-card-section class="d-container">
            <div class="box">
              <!-- 컬러 선택 -->
              <q-color
                v-model="selectedBookmarkItem.b_color"
                flat
                no-header-tabs
                no-footer
                default-view="palette"
                dark
              ></q-color>
            </div>
            <!-- 이름 입력-->
            <q-form ref="formRef" class="bm-manage">
              <q-input
                ref="bookmarkNameRef"
                v-model="selectedBookmarkItem.b_name"
                :rules="[requiredRule, maxLengthRule, specialCharRule]"
                type="text"
                maxlength="50"
                clear-icon="mdi-close"
                dense
                outlined
                clearable
                @keydown.enter="onClickSaveBookmark"
              ></q-input>
              <q-btn
                label="저장"
                :disable="!selectedBookmarkItem.b_name || !selectedBookmarkItem.b_color"
                outline
                color="primary"
                @click="onClickSaveBookmark"
              ></q-btn>
            </q-form>
            <q-separator class="q-my-md"></q-separator>
          </q-card-section>
          <q-card-actions class="d-footer">
            <q-btn
              outline
              icon="mdi-refresh"
              color="info"
              label="초기화"
              @click="
                () => {
                  selectedBookmarkItem.b_color = ''
                  selectedBookmarkItem.b_name = ''
                }
              "
            />
            <q-btn outline icon="mdi-close" label="닫기" @click="isShowBookmarkModificator = false" />
          </q-card-actions>
        </q-card>
      </q-dialog>
      <!-- 북마크 수정 상세 dialog(e) -->
    </q-card>
  </q-dialog>
</template>

<style scoped lang="scss">
.q-card.bookmark-dialog-wrap :deep {
  .d-container {
    width: 100%;
    // column-gap: 1.25rem;
    padding: 0 !important;
    background-color: #1e2022;

    // 북마크 그룹, 아티팩트 (왼쪽)
    .bookmark-group {
      display: flex;
      width: 41%;
      height: 100%;
      > div {
        background-color: #42464a;
        height: 100%;
      }
      .q-toolbar {
        padding: 1rem 1.25rem;
        align-items: stretch;
        .q-btn {
          margin-top: 1rem;
          .on-left {
            margin-right: 0.5rem;
          }
        }
      }
      .q-list {
        .q-btn {
          min-height: 100%;
          font-size: inherit;
          &:before {
            box-shadow: none;
          }
        }
      }
      .bookmark-item {
        background-color: rgba(#f5faff, 20%);
        padding: 0px 1.25rem;
        min-height: 3.375rem;
        &.active {
          background: linear-gradient(to right, rgba(20, 215, 200, 0.5) 0%, rgba(100, 100, 100, 0.15) 100%) !important;
        }
        .q-btn {
          text-transform: none;
        }
        // 북마크 아이콘
        .q-item__section:first-child {
          max-width: 1.5rem;
          // padding-right: 4px;

          .q-icon {
            font-size: 1.25rem;
          }
        }
        .q-item__section:nth-of-type(2) {
          padding-right: 6px;
          white-space: normal;
          span {
            text-align: left;
          }
        }
        .q-item__section:last-child {
          padding: 0px;
          .q-btn.delete-btn {
            margin-left: 0.5rem;
          }
        }
        em {
          font-style: normal;
        }
      }
      .first {
        width: 55%;
        max-width: 24rem;
        display: flex;
        flex-direction: column;
        .q-list {
          height: calc(100% - 113.5px);
        }
      }
      .second {
        width: 44.5%;
        max-width: 19.375rem;
        display: flex;
        flex-direction: column;
        // overflow-y: auto;
        .bookmark-item {
          height: 3rem;
        }
      }
    }
    .bookmark-table {
      width: 57.8%;
      height: 100%;
      .top {
        background-color: #42464a;
        height: 3.75rem;
        padding: 0px 1.25rem;
        .q-input {
          max-width: 15.1875rem;
          padding-right: 1.375rem;
          .q-icon {
            width: 1.375rem;
            height: 1.375rem;
          }
        }
        .page-txt {
          padding-right: 0.5rem;
        }
        .q-btn {
          padding: 0.25rem 1rem;
          .on-left {
            margin-right: 0.5rem;
          }
        }
      }
      .main {
        height: calc(100% - 3.75rem);
        .arti-table-wrap {
          display: flex;
          flex-direction: row;
          width: 100%;
          height: calc(100% - 3rem);
          border-radius: 0px;
          .q-table__container {
            flex: auto 1;
            width: 100%;
            height: 100%;
            .table-list {
              position: relative;
              background-color: #101214;
              .q-table {
                border-radius: 0px;
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
                  color: var(--selected-bookmark-color);
                }
              }
            }
          }
        }
        .pagination-wrap {
          height: 3rem;
        }
      }
    }
  }
}

// side list (s)
::v-deep(.category-list-wrap) {
  width: 100%;
  max-width: 25rem;
  line-height: 1;
  height: calc(100% - 63.5px);
  // > .q-list {
  //   height: calc(100vh - 190px);
  // }
  .q-expansion-item {
    background-color: rgba(#f5faff, 20%);
    &--expanded {
      background: linear-gradient(to right, rgba(20, 215, 200, 0.5) 0%, rgba(100, 100, 100, 0.15) 100%) !important;
    }
    .q-expansion-item__content {
      background-color: #101214;
    }
    .q-separator {
      display: none;
    }
    .q-item {
      min-height: 48px;
      padding-left: 1.25rem;
      border-bottom: 1px solid #42464a;
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
    border: 0;
    &:first-child {
      padding-top: 12px;
    }
    &:last-child {
      padding-bottom: 10px;
    }
    .q-card__actions {
      min-height: 34px;
      padding: 0rem 1.25rem 0rem 2.875rem;
      font-size: 0.875rem;
      font-weight: 500;
      .q-btn {
        > span {
          text-align: left;
        }
      }
    }
  }
}
// side list (e)

// 화이트모드
.body--light {
  .q-card.bookmark-dialog-wrap :deep {
    .d-container {
      background-color: $light-bg;
      // 북마크 그룹, 아티팩트 (왼쪽)
      .bookmark-group {
        > div {
          background-color: #ffffff;
        }
        .first {
          // 북마크추가
          .q-toolbar {
            .q-btn {
              &--outline:before {
                border-color: $light-dark;
              }
            }
          }
          .bookmark-item {
            border-bottom: 1px solid $light-border;
            .q-btn.delete-btn {
              color: $light-color !important;
              &.q-btn--outline:before {
                border-color: $light-dark;
              }
            }
          }
        }
        .bookmark-item {
          background-color: #ffffff;
          &.active {
            background: linear-gradient(45deg, rgba(#318ddf, 60%), rgba(#318ddf, 0%)) !important;
          }
        }
      }
      .bookmark-table {
        .top {
          background-color: #ffffff;
          .q-input {
            width: 15.1875rem;
            .q-icon {
              width: 1.375rem;
              height: 1.375rem;
            }
          }
          .page-txt {
            padding-right: 0.5rem;
          }
          // 목록저장
          .q-btn {
            padding: 0.25rem 1rem;
            &--outline::before {
              border-color: $light-dark;
            }
            .on-left {
              margin-right: 0.5rem;
            }
          }
        }
        .main {
          .arti-table-wrap {
            .q-table__container {
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
                }
              }
            }
          }
          // 페이지
          .pagination-wrap {
            background-color: #ffffff;
          }
        }
      }
    }
  }
  // 북마크 - 아티팩트 (2depth)
  .category-list-wrap :deep {
    .q-expansion-item {
      background-color: #ffffff;
      &--expanded {
        background: linear-gradient(45deg, rgba(#318ddf, 60%), rgba(#318ddf, 0%)) !important;
      }
      .q-expansion-item__content {
        background-color: $light-border;
      }
      .q-item {
        border-color: $light-border;
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
      .q-card__actions {
        &.active {
          background-color: #ffffff;
          color: $light-primary;
        }
      }
    }
  }
}
</style>
