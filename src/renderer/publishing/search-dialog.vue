<route>{ meta: { disallowAuthed: true} }</route>

<template>
    <q-dialog v-model="isOpen" ref="dialogRef" @hide="onDialogHide" class="">
      <q-card class="q-dialog-plugin pop-default search-dialog-wrap">
        <!-- 헤더 -->
        <q-card-section class="d-header">
          <h1>검색</h1>
          <q-space></q-space>
          <q-btn icon="close" flat dense v-close-popup></q-btn>
        </q-card-section>
        <!-- 본문 -->
        <q-card-section class="d-container">
          <!-- 검색 -->
          <div class="row justify-center items-center top">
            <q-input v-model.trim="keyword" outlined dense placeholder=""/>
            <q-checkbox v-model="right" dense label="또는" class="chk-box or"></q-checkbox>
            <div class="row items-center q-px-md date-wrap">
              <DatetimeCalendar
              v-model="realDatetime"
              :selected-datetime-ref="'realDatetimeRef'"
              class="date"
              />
              <span class="range">~</span>
              <DatetimeCalendar
                v-model="realDatetime"
                :selected-datetime-ref="'realDatetimeRef'"
                class="date"
              />
            </div>
            <q-btn flat border class="search-btn">
              <Icon icon="ic:baseline-search" />
              <span>검색</span>
            </q-btn>
            <q-checkbox v-model="retry" dense label="결과 내 재검색" class="chk-box retry"></q-checkbox>
          </div>
          <div class="overflow">
            <!-- 검색 결과 -->
            <div class="result-top row justify-center items-center">
              <p class="text-center text-md-2"><span class="text-primary bold">“가나”</span>(으)로 총 <span class="text-primary bold">20건</span>이 검색 되었습니다.</p>
            </div>
            <div class="result-bot row items-center">
              <q-btn flat class="all-btn">
                  <q-icon :name="bookmark" color="red"></q-icon>
                  <span>전체 선택</span>
              </q-btn>
              <q-space></q-space>
              <!-- 북마크 -->
              <BookmarkItem />
            </div>
            <!-- 검색 리스트 -->
            <q-list
              bordered 
              class="search-list-wrap" 
              v-for="item in items" 
              :key="item.id">
              <q-item 
                v-ripple
                class="title-wrap"
              >
                <q-item-section side>
                  <q-icon :name="bookmark" color="red" class="cursor-pointer"></q-icon>
                </q-item-section>
                <q-item-section>
                  <span class="title">EventLogs > 이벤트로그 > EvtxECmd_Output.csv <em class="count">(3)</em></span>
                  <q-space></q-space>
                  <div class="row items-center cursor-pointer">
                    <span>더보기</span>
                    <Icon icon="mdi:chevron-up" color="white" :rotate="1" />
                  </div>
                </q-item-section>
              </q-item>
              <q-item v-ripple>
                <q-item-section side>
                  <q-icon :name="bookmark" color="red" class="cursor-pointer"></q-icon>
                </q-item-section>
                <q-item-section>
                  <span><strong class="text-primary">가나</strong>Lorem ipsum</span>
                </q-item-section>
              </q-item>
              <q-item v-ripple>
                <q-item-section side>
                  <q-icon :name="bookmark" color="red" class="cursor-pointer"></q-icon>
                </q-item-section>
                <q-item-section>
                  <span><strong class="text-primary">가나</strong>Lorem ipsum</span>
                </q-item-section>
              </q-item>
            </q-list>
          </div>
        </q-card-section>
        <q-card-actions class="d-footer">
          <q-btn outline icon="mdi-refresh" color="info" label="초기화" @click="initClock" />
          <q-btn outline icon="mdi-close" label="닫기" @click="okClick" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </template>
  
  <script setup lang="ts">

import { computed, ComputedRef, Ref, ref } from 'vue'
import { Icon } from '@iconify/vue'
import dayjs from 'dayjs'
import { openAlert, openConfirm, openDialog, openError } from '@renderer/composables/useDialog'
import { setDate } from '@renderer/utils/utils'
import DatetimeCalendar from '@renderer/components/common/DatetimeCalendar.vue'
import BookmarkItem from '@renderer/publishing/components/BookmarkItem.vue'


// 사용자 다이얼로그 오픈 여부
const isOpen: Ref<boolean> = ref(true)


  // 북마크
const bookmark = ref('mdi-bookmark-outline')

// 키워드
const keyword: Ref<string> = ref('가나')


// 날짜
const realDatetime: Ref<string | null> = ref(setDate(new Date()))


// 체크박스
const right = ref(false)
const retry = ref(true)


// 리스트
  const items = [ {
      id: 1,
    }, 
    {
      id: 2,
    }, 
    {
      id: 3,
    },
    {
      id: 4,
    },
    {
      id: 5,
    },

  ]


    const check1 = ref(false)
  </script>

<style scoped lang="scss">

.q-card.search-dialog-wrap :deep {
  .q-card__section + .q-card__section.d-container {
    padding: 0px !important;
    .top {
      height: 3.75rem;
      .q-input {
        width: 20.625rem;
      }
      .q-checkbox.or {
        padding-left: 0.75rem;
        .q-checkbox__label {
          font-size: 0.9375rem;
        }
      }
      .date-wrap {
        .date {
          width: 12.8125rem;
        }
        .range {
          display: inline-block;
          padding: 0 0.75rem;
        }
      }
      .search-btn {
        border: 1px solid #0a141e;
        background-color: rgba(#0a141e, 20%) ;
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
    }
    .overflow {
      height: 44.25rem;
      overflow-y: auto;
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
      .search-list-wrap  {
        background-color: #35383B;
        margin-bottom: 12px;
        .q-item {
          min-height: 2.5rem;
          border-bottom: 1px solid rgba(#f5faff, 20%);
          &:last-child {
            border-bottom: none;
          }
          &.title-wrap {
            background-color: #54585C;
            min-height: 2.625rem;
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
          }
          &__section {
            font-size: 0.9375rem;
            &--side {
              padding-right: 0.5rem;
              .q-icon {
                font-size: 1.25rem;
              }
            }
            span {
              font-weight: 400;
            }
          }
        }
      } 
    }
  }
}
</style>