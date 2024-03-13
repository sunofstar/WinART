<script setup lang="ts">
import { Ref, ref, toRef, computed, onMounted, watch, watchEffect } from 'vue'
import { Icon } from '@iconify/vue'
import { KAPE_OP_CHANNELS } from '@share/constants'
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
const { currentBookmarkItem, currentSearchParams } = storeToRefs(caseStore)
const route = useRoute()
const config = useConfigStore()
const $q = useQuasar()
const path = computed(() => route.path)

const emit = defineEmits(['onSearch'])

/***********************************************/

/**
 * 검색 입력 폼
 */
const searchTargetRange: Ref<string> = ref('all') // all: 전체 아티팩트, current: 현재 화면
// 검색 키워드
const keyword: Ref<string> = ref('')
const isOr: Ref<boolean> = ref(false)
const startDateTime: Ref<string | null> = ref('')
const endDateTime: Ref<string | null> = ref('')
const tableSearchName: Ref<{}> = computed(() => {
  // console.log('tableSearchName computed !!', config.selectedCategory)
  const tableName =
    config.selectedCategory?.dbQueryTableName !== undefined ? config.selectedCategory?.dbQueryTableName : ''
  const searchTableObj = config.findCategoryByTableName(tableName)
  return {
    depth1: searchTableObj?.Category_1,
    depth2: searchTableObj?.Category_2,
    depth3: searchTableObj?.Category_3,
    tableName: tableName
  }
})
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

watchEffect(() => {
  // currentSearchParams가 변경될 때마다 keyword 값을 업데이트
  keyword.value = currentSearchParams.value.keyString || ''
  startDateTime.value = currentSearchParams.value.s_time || ''
  endDateTime.value = currentSearchParams.value.e_time || ''
  searchTargetRange.value =
    currentSearchParams.value.fullSearch === true || currentSearchParams.value.fullSearch === undefined
      ? 'all'
      : 'current'
})

/*********************************************************
 * 검색 결과 다이얼로그
 */
const isSearchResultDialog: Ref<boolean> = ref(false)

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
  selectedSearchCategory.value = searchTargetRange.value === 'all' ? categoryDatas[0] || null : tableSearchName.value
})
watchEffect(() => {
  if (searchTargetRange.value === 'all') {
    selectedSearchCategory.value = categoryDatas.length > 0 ? categoryDatas[0] : null
  } else if (searchTargetRange.value === 'current') {
    selectedSearchCategory.value = tableSearchName.value
  }
})
watchEffect(() => {
  if (searchTargetRange.value === 'all') {
    selectedSearchCategory.value = categoryDatas.length > 0 ? categoryDatas[0] : null
  } else if (searchTargetRange.value === 'current') {
    selectedSearchCategory.value = tableSearchName.value
  }
})
watchEffect(() => {
  if (selectedSearchCategory.value) {
    if (selectedSearchCategory.value.depth1 !== 'all') {
      searchTargetRange.value = 'current'
    } else {
      searchTargetRange.value = 'all'
    }
  }
})

const params: Ref<_SEARCH_OPTION> = computed(() => {
  const type = startDateTime.value !== '' && endDateTime.value !== '' ? '_S_TIME' : '_S_WORD' // _S_WORD가 우선적으로 처리되며 keystring 이 없을시에 _S_TIME으로 조회
  const fullSearch = searchTargetRange.value === 'all' ? true : false // 전체 검색
  // 테이블 검색 조건 설정
  const tableSearch = searchTargetRange.value === 'current' ? tableSearchName.value.tableName : ''
  const orFlag = isSearchResultDialog.value ? false : isOr.value
  const sTime = startDateTime.value ? (startDateTime.value === 'Invalid date' ? '' : startDateTime.value + ':00') : ''
  const etime = endDateTime.value ? (endDateTime.value === 'Invalid date' ? '' : endDateTime.value + ':00') : ''
  return {
    type: type, // _S_WORD가 우선적으로 처리되며 keystring 이 없을시에 _S_TIME으로 조회
    fullSearch: fullSearch, // 전체 검색 여부
    tableSearch: tableSearch, // 대상 테이블 이름
    keyString: keyword.value, // 검색어
    orFlag: orFlag, // 단어별 검색 조건 (dialog에서는 default로 false)
    s_time: sTime,
    e_time: etime,
    // _b_id: selectedId !== undefined ? selectedId : defaultId !== undefined ? defaultId : ''
    _b_id: currentBookmarkItem.value.b_id
  }
})

// 검색 클릭시 다이얼로그 오픈
const onClickSearchTotalTable = async (): Promise<void> => {
  const sTime = startDateTime.value ? (startDateTime.value === 'Invalid date' ? '' : startDateTime.value + ':00') : ''
  const etime = endDateTime.value ? (endDateTime.value === 'Invalid date' ? '' : endDateTime.value + ':00') : ''

  // 검색어 조건에 따른 validation
  if (!validateKeyword(keyword.value)) return
  // 날짜 간격에 따른 validation
  if (sTime !== '' && etime !== '') {
    if (!validateDateRange(sTime, etime)) return
  }
  $q.loading.show()
  // console.log('getSearchTotalTable >>> ', params.value)
  // console.log(selectedBookmarkGroup.value)
  // await caseStore.getSearchTotalTable(params.value)
  caseStore.setCurrentSearchParams(params.value)
  console.log('CaseStore search param >>> ', currentSearchParams.value)
  emit('onSearch')
}

// 검색어 조건 validtaion
const validateKeyword = (keyword: string): boolean => {
  if (keyword === null || keyword === '') {
    openAlert('검색어를 입력하세요.')
    return false
  }
  const specialCharactersPattern = new RegExp(/[.\\`!@#$%&*-]/)
  if (specialCharactersPattern.test(keyword)) {
    openAlert('검색 시 특수문자 입력을 허용하지 않습니다.')
    return false
  }
  return true
}
// 날짜 조건 validation
const validateDateRange = (startDate: string, endDate: string): boolean => {
  const oneYearInMs = 31556952000 // 365 * 24 * 60 * 60 * 1000
  const startDateMs = new Date(startDate).getTime()
  const endDateMs = new Date(endDate).getTime()
  const diffMs = endDateMs - startDateMs

  if (diffMs > oneYearInMs) {
    openAlert('검색 기간은 최대 1년까지만 가능합니다.')
    return false
  }
  return true
}
</script>

<template>
  <div class="radio-wrap">
    <q-radio v-model="searchTargetRange" dense val="all" label="전체 아티팩트" color="primary"></q-radio>
    <q-radio
      v-model="searchTargetRange"
      :disable="path !== '/result'"
      dense
      val="current"
      label="현재화면"
      color="primary"
    ></q-radio>
  </div>
  <div class="search-wrap main_top">
    <div class="search-item-wrap">
      <div class="">
        <div class="keyword">
          <q-input
            v-model.trim="keyword"
            outlined
            dense
            placeholder="Keyword(특수문자 입력 불가)"
            clearable
            clear-icon="mdi-close"
            autofocus
            @keyup.enter="onClickSearchTotalTable"
          />
          <q-checkbox v-model="isOr" dense label="단어별 검색" class="chk-box"></q-checkbox>
        </div>
        <DateRangeCalendar
          :start-date="startDateTime"
          :end-date="endDateTime"
          @update:start-date="
            (date) => {
              startDateTime = date
            }
          "
          @update:end-date="
            (date) => {
              endDateTime = date
            }
          "
        />
      </div>
      <q-btn label="검색" flat class="search-btn" @click="onClickSearchTotalTable">
        <Icon icon="ic:baseline-search" />
      </q-btn>
    </div>
  </div>
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
