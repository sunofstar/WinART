<route>{ meta: { disallowAuthed: true} }</route>

<template>
    <q-dialog v-model="isOpen" ref="dialogRef" @hide="onDialogHide" class="">
      <q-card class="q-dialog-plugin pop-default timeline-dialog-wrap">
        <!-- 헤더 -->
        <q-card-section class="d-header">
          <h1>Timeline</h1>
          <q-space></q-space>
          <q-btn icon="close" flat dense v-close-popup></q-btn>
        </q-card-section>
        <!-- 본문 -->
        <q-card-section class="d-container column">
          <!-- 카테고리 선택 -->
          <div class="category-wrap row tit-wrap">
            <strong class="tit">카테고리 선택</strong>
            <div class="row items-center cate-chk-wrap">
              <!-- 카테고리 선택 전체 체크 -->
              <q-checkbox
                v-model="checkAll"
                dense
                label="전체"
              ></q-checkbox>
              <!-- 카테고리 선택 목록 -->
              <q-option-group
                v-model="categroup"
                :options="cateoptions"
                dense
                color="primary"
                type="checkbox"
              >
                <template v-slot:label="opt">
                  <div class="row items-center">
                    <span>{{ opt.label }}</span>
                  </div>
                </template>
              </q-option-group>
            </div>
          </div>
          <!-- 기간 설정 및 키워드 -->
          <div class="date-search-wrap row tit-wrap">
            <strong class="tit second">기간 설정 및 키워드</strong>
            <div class="column">
              <div class="date-radio-wrap">
                <q-radio dense v-model="date" val="전체" label="전체"></q-radio>
                <q-radio dense v-model="date" val="3개월" label="3개월"></q-radio>
                <q-radio dense v-model="date" val="6개월" label="6개월"></q-radio>
                <q-radio dense v-model="date" val="1년" label="1년"></q-radio>
                <q-radio dense v-model="date" val="직접선택" label="직접선택" class="self">
                  <div class="date-group">
                    <DatetimeCalendar
                        :model-value="realDatetime"
                        required
                        @update:model-value="handleDate"
                        class="date"
                      />
                      <span class="range">~</span>
                      <DatetimeCalendar
                        :model-value="realDatetime"
                        required
                        @update:model-value="handleDate"
                        class="date"
                      />
                  </div>
                </q-radio>
              </div>
              <div class="row search-field-wrap items-end">
                <div class="row items-center">
                  <q-checkbox label="또는" v-model="or" dense class="or-chkbox"></q-checkbox>
                  <q-input v-model="search" dense outlined class="search-field" placeholder="Keyword"></q-input>
                </div>
                <q-btn outline class="search-btn">
                  <Icon icon="ic:baseline-search" />
                  <span>검색</span>
                </q-btn>
              </div>
            </div>
          </div>
          <!-- 타임라인차트 -->
          <div class="chart-bg">
            <TimelinechartExample/>
          </div>
        </q-card-section>
        <q-card-actions class="d-footer">
          <q-btn outline icon="mdi-close" label="닫기" @click="okClick" />
        </q-card-actions>
      </q-card>
    </q-dialog>
</template>
  
<script setup lang="ts">
import { ref, Ref, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import DatetimeCalendar from '@renderer/components/common/DatetimeCalendar.vue'
import TimelinechartExample from '@renderer/publishing/timelinechart-example.vue'


// 팝업창 오픈여부
const isOpen: Ref<boolean> = ref(true)


// 카테고리 전체 선택
const checkAll = ref(true)

// 카테고리 모음
const categroup = ref(['op1', 'op2', 'op3', 'op4', 'op5', 'op6', 'op7', 'op8'])

const cateoptions = [
  {
    label: 'Registry',
    value: 'op1',
  },
  {
    label: 'FileSystem',
    value: 'op2',
  },
  {
    label: 'EventLogs',
    value: 'op3',
  },
  {
    label: 'FileFolderAccess',
    value: 'op4',
  },
  {
    label: 'ProgramExecution',
    value: 'op5',
  },
  {
    label: 'FileDeletion',
    value: 'op6',
  },
  {
    label: 'SRUMDatabase',
    value: 'op7',
  },
  {
    label: 'BrowsingHistory',
    value: 'op8',
  },
]

// 날짜 선택
const date = ref('전체')

// 실제 시간
const realDatetime: Ref<string | null> = ref()
const handleDate = (date: Date) => {
  realDatetime.value = setDate(date)
}

// 또는
const or = ref(false)

// 검색창 input
const search = ref('가나, 도레미, 일이삼사오')

</script>

<style scoped lang="scss">
.timeline-dialog-wrap :deep {
  // 체크박스 사이즈
  .q-checkbox {
      margin: 0px;
      margin-right: 1.5rem;
      font-size: 0.9375rem;
      .q-checkbox__inner {
        width: 1.125rem;
        height: 1.125rem ;
        min-width: 1.125rem;
      }
    }
  &.pop-default {
    .d-container {
      padding: 1.5rem!important;
      flex-wrap: nowrap!important;
      // 제목 공통 레이아웃 
      .tit-wrap {
        width: 100%;
        .tit {
          font-size: 1rem;
          width: 15.33%;
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
        padding-bottom: 1.375rem;
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
              padding-left: 0.625rem!important;
            }
            // 직접설정
            &.self {
              width: 60rem;
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
              background-color: rgba(#0a141e, 20%)!important;
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




</style>