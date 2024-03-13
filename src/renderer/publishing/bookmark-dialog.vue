<route>{ meta: { disallowAuthed: true} }</route>

<template>
    <q-dialog v-model="isOpen" ref="dialogRef" @hide="onDialogHide" class="">
      <q-card class="q-dialog-plugin pop-default bookmark-dialog-wrap">
        <!-- 헤더 -->
        <q-card-section class="d-header">
          <h1>북마크</h1>
          <q-space></q-space>
          <q-btn icon="close" flat dense v-close-popup></q-btn>
        </q-card-section>
        <!-- 본문 -->
        <q-card-section class="d-container row justify-between">
          <!-- 북마크관리 -->
          <div class="bookmark-group row justify-between">
            <div class="first">
              <q-toolbar class=" column">
                <q-toolbar-title class="text-primary text-bold">
                  북마크 그룹
                </q-toolbar-title>
                <q-btn label="북마크 추가" icon="mdi-plus" outline></q-btn>
              </q-toolbar>
              <q-list bordered>
                <q-item 
                  v-for="list in lists" :key="list.id" 
                  class="bookmark-item cursor-pointer"
                  :class="{active: list.isActive}"
                >
                  <q-item-section avatar>
                    <q-icon name="mdi-bookmark" :style="{ color: list.color }"></q-icon>
                  </q-item-section>
                  <q-item-section >
                      <span class="cursor-pointer">{{ list.name }} <em>(20)</em></span>
                  </q-item-section>
                  <q-item-section  side>
                    <div class="q-gutter-sm">
                      <q-btn label="수정" class="gt-xs text-primary" size="12px" outline ></q-btn>
                      <q-btn label="삭제" class="gt-xs text-white" size="12px" outline ></q-btn>
                    </div>
                  </q-item-section>
                </q-item>
              </q-list>
            </div>
            <div class="second">
              <q-toolbar class="text-primary column ">
                <q-toolbar-title class="text-bold">아티팩트</q-toolbar-title>
              </q-toolbar>
              <q-list bordered>
                <q-item class="bookmark-item active cursor-pointer">
                  <q-item-section >
                      <span class="cursor-pointer">EventLogs <em>(15)</em></span>
                  </q-item-section>
                </q-item>
                <q-item class="bookmark-item cursor-pointer">
                  <q-item-section >
                      <span class="cursor-pointer">FileDeletion <em>(10)</em></span>
                  </q-item-section>
                </q-item>
                <q-item class="bookmark-item cursor-pointer">
                  <q-item-section >
                      <span class="cursor-pointer">USERAssist <em>(1)</em></span>
                  </q-item-section>
                </q-item>
                <q-item class="bookmark-item cursor-pointer">
                  <q-item-section >
                      <span class="cursor-pointer">AutomaticDestinations <em>(5)</em></span>
                  </q-item-section>
                </q-item>
                <q-item class="bookmark-item cursor-pointer">
                  <q-item-section >
                      <span class="cursor-pointer">CustomDestinations <em>(7)</em></span>
                  </q-item-section>
                </q-item>
              </q-list>
            </div>
          </div>
          <!-- 북마크 테이블 -->
          <div class="bookmark-table">
            <div class="row justify-between items-center top">
              <div class="row">
                <q-select v-model="selectcontent" outlined dense :options="contentArr" class="q-mr-sm"></q-select>
                <q-input v-model="search" dense outlined>
                  <template v-slot:append>
                    <q-icon name="search"></q-icon>
                  </template>
                </q-input>
              </div>
              <div class="row items-center">
                <span class="text-md-2 page-txt">페이지당 표시</span>
                <!-- 목록 내보내기 -->
                <q-select
                  v-model="rowsPerPage"
                  outlined
                  dense
                  :options="rowsPerPageArr"
                  class="select-page q-mr-sm"
                  @update:model-value="changeRowsPerPage"
                ></q-select>
                <!-- 페이지당 건수 -->
                <q-btn outline label="목록저장" icon="mdi-download" class></q-btn>
              </div>
            </div>
            <!-- 목록 테이블 -->
            <div class="main">
              <div class="arti-table-wrap">
                <table class="table-list">
                  <colgroup>
                      <col width="*" />
                      <col width="28.3%" />
                      <col width="28.3%" />
                      <col width="37.6%" />
                  </colgroup>
                  <thead>
                    <tr>
                      <th>
                        <Icon icon="material-symbols:bookmark" color="#4A9AFF" />
                      </th>
                      <th>OS버전</th>
                      <th>빌드번호</th>
                      <th>최초설치</th>
                    </tr>
                  </thead>
                  <tbody class="tbl-content">
                    <tr class="active">
                      <td><Icon icon="material-symbols:bookmark" color="#4A9AFF" /></td>
                      <td>Window 10</td>
                      <td>19.1.1</td>
                      <td>2023-09-01 12:00:00</td>
                    </tr>
                    <tr>
                      <td><Icon icon="material-symbols:bookmark" color="#4A9AFF" /></td>
                      <td>Window 10</td>
                      <td>19.1.1</td>
                      <td>2023-09-01 12:00:00</td>
                    </tr>
                    <tr>
                      <td><Icon icon="material-symbols:bookmark" color="#4A9AFF" /></td>
                      <td>Window 10</td>
                      <td>19.1.1</td>
                      <td>2023-09-01 12:00:00</td>
                    </tr>
                    <tr>
                      <td><Icon icon="material-symbols:bookmark" color="#4A9AFF" /></td>
                      <td>Window 10</td>
                      <td>19.1.1</td>
                      <td>2023-09-01 12:00:00</td>
                    </tr>
                    <tr>
                      <td><Icon icon="material-symbols:bookmark" color="#4A9AFF" /></td>
                      <td>Window 10</td>
                      <td>19.1.1</td>
                      <td>2023-09-01 12:00:00</td>
                    </tr>
                    <tr>
                      <td><Icon icon="material-symbols:bookmark" color="#4A9AFF" /></td>
                      <td>Window 10</td>
                      <td>19.1.1</td>
                      <td>2023-09-01 12:00:00</td>
                    </tr>
                    <tr>
                      <td><Icon icon="material-symbols:bookmark" color="#4A9AFF" /></td>
                      <td>Window 10</td>
                      <td>19.1.1</td>
                      <td>2023-09-01 12:00:00</td>
                    </tr>
                    <tr>
                      <td><Icon icon="material-symbols:bookmark" color="#4A9AFF" /></td>
                      <td>Window 10</td>
                      <td>19.1.1</td>
                      <td>2023-09-01 12:00:00</td>
                    </tr>
                    <tr>
                      <td><Icon icon="material-symbols:bookmark" color="#4A9AFF" /></td>
                      <td>Window 10</td>
                      <td>19.1.1</td>
                      <td>2023-09-01 12:00:00</td>
                    </tr>
                    <tr>
                      <td><Icon icon="material-symbols:bookmark" color="#4A9AFF" /></td>
                      <td>Window 10</td>
                      <td>19.1.1</td>
                      <td>2023-09-01 12:00:00</td>
                    </tr>
                    <tr>
                      <td><Icon icon="material-symbols:bookmark" color="#4A9AFF" /></td>
                      <td>Window 10</td>
                      <td>19.1.1</td>
                      <td>2023-09-01 12:00:00</td>
                    </tr>
                    <tr>
                      <td><Icon icon="material-symbols:bookmark" color="#4A9AFF" /></td>
                      <td>Window 10</td>
                      <td>19.1.1</td>
                      <td>2023-09-01 12:00:00</td>
                    </tr>
                    <tr>
                      <td><Icon icon="material-symbols:bookmark" color="#4A9AFF" /></td>
                      <td>Window 10</td>
                      <td>19.1.1</td>
                      <td>2023-09-01 12:00:00</td>
                    </tr>
                    <tr>
                      <td><Icon icon="material-symbols:bookmark" color="#4A9AFF" /></td>
                      <td>Window 10</td>
                      <td>19.1.1</td>
                      <td>2023-09-01 12:00:00</td>
                    </tr>
                    <tr>
                      <td><Icon icon="material-symbols:bookmark" color="#4A9AFF" /></td>
                      <td>Window 10</td>
                      <td>19.1.1</td>
                      <td>2023-09-01 12:00:00</td>
                    </tr>
                    <tr>
                      <td><Icon icon="material-symbols:bookmark" color="#4A9AFF" /></td>
                      <td>Window 10</td>
                      <td>19.1.1</td>
                      <td>2023-09-01 12:00:00</td>
                    </tr>
                    <tr>
                      <td><Icon icon="material-symbols:bookmark" color="#4A9AFF" /></td>
                      <td>Window 10</td>
                      <td>19.1.1</td>
                      <td>2023-09-01 12:00:00</td>
                    </tr>
                    <tr>
                      <td><Icon icon="material-symbols:bookmark" color="#4A9AFF" /></td>
                      <td>Window 10</td>
                      <td>19.1.1</td>
                      <td>2023-09-01 12:00:00</td>
                    </tr>
                    <tr>
                      <td><Icon icon="material-symbols:bookmark" color="#4A9AFF" /></td>
                      <td>Window 10</td>
                      <td>19.1.1</td>
                      <td>2023-09-01 12:00:00</td>
                    </tr>
                    <tr>
                      <td><Icon icon="material-symbols:bookmark" color="#4A9AFF" /></td>
                      <td>Window 10</td>
                      <td>19.1.1</td>
                      <td>2023-09-01 12:00:00</td>
                    </tr>
                    <tr>
                      <td><Icon icon="material-symbols:bookmark" color="#4A9AFF" /></td>
                      <td>Window 10</td>
                      <td>19.1.1</td>
                      <td>2023-09-01 12:00:00</td>
                    </tr>
                    <tr>
                      <td><Icon icon="material-symbols:bookmark" color="#4A9AFF" /></td>
                      <td>Window 10</td>
                      <td>19.1.1</td>
                      <td>2023-09-01 12:00:00</td>
                    </tr>
                    <tr>
                      <td><Icon icon="material-symbols:bookmark" color="#4A9AFF" /></td>
                      <td>Window 10</td>
                      <td>19.1.1</td>
                      <td>2023-09-01 12:00:00</td>
                    </tr>
                    <tr>
                      <td><Icon icon="material-symbols:bookmark" color="#4A9AFF" /></td>
                      <td>Window 10</td>
                      <td>19.1.1</td>
                      <td>2023-09-01 12:00:00</td>
                    </tr>
                    <tr>
                      <td><Icon icon="material-symbols:bookmark" color="#4A9AFF" /></td>
                      <td>Window 10</td>
                      <td>19.1.1</td>
                      <td>2023-09-01 12:00:00</td>
                    </tr>
                    <tr>
                      <td><Icon icon="material-symbols:bookmark" color="#4A9AFF" /></td>
                      <td>Window 10</td>
                      <td>19.1.1</td>
                      <td>2023-09-01 12:00:00</td>
                    </tr>
                    <tr>
                      <td><Icon icon="material-symbols:bookmark" color="#4A9AFF" /></td>
                      <td>Window 10</td>
                      <td>19.1.1</td>
                      <td>2023-09-01 12:00:00</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div class="pagination-wrap">
                <q-pagination
                    v-model="current"
                    :max="10"
                    :max-pages="10"
                    color="grey"
                    direction-links
                    boundary-links
                    icon-first="keyboard_double_arrow_left"
                    icon-last="keyboard_double_arrow_right"
                    icon-prev="keyboard_arrow_left"
                    icon-next="keyboard_arrow_right"
                  ></q-pagination>
              </div>
            </div>
          </div>
        </q-card-section>
        <q-card-actions class="d-footer">
          <q-btn outline icon="mdi-close" label="닫기" @click="okClick" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </template>
  
  <script setup lang="ts">
import { Icon } from '@iconify/vue'
import { ref, Ref, reactive } from 'vue'

const isOpen: Ref<boolean> = ref(true)
const current = ref(1)


// 북마크 그룹
const lists = reactive([
  { id: 1,
    name: ' 기본 북마크1',
      color: '#FF3333',
      isActive: true,
  },
  { id: 2,
    name: ' 기본 북마크2',
      color: '#FF9933',
      isActive: false
  },
  { id: 3,
    name: ' 기본 북마크3',
      color: '#FFFF33',
      isActive: false
  },
  { id: 4,
    name: ' 기본 북마크4',
      color: '#33FF33',
      isActive: false
  },
  { id: 5,
    name: ' 기본 북마크5',
      color: '#3399FF',
      isActive: false
  },
  { id: 6,
    name: ' 기본 북마크6',
      color: '#3333FF',
      isActive: false
  },
  { id: 7,
    name: ' 기본 북마크7',
      color: '#9933FF',
      isActive: false 
  }
])

// 검색
const search = ref('')


// 내용 셀렉트
const contentArr = [
  {
    label: '내용1',
    value: '내용1'
  },
  {
    label: '내용2',
    value: '내용2'
  },
]

// 내용 셀렉트
const selectcontent = ref({
  label: '내용',
  value: '내용'
})


// 페이지당 조회 건수
const rowsPerPageArr: number[] = [100, 200, 300, 400, 500]
const rowsPerPage: Ref<number> = ref(100)

</script>

<style scoped lang="scss">
.q-card.bookmark-dialog-wrap :deep {
    .d-container {
      width: 100%;
      column-gap: 1.25rem;
      padding: 0 !important;
      background-color: #1e2022;
      min-height: 31.25rem;

      // 북마크 그룹, 아티팩트 (왼쪽)
      .bookmark-group {
        display: flex;
        width: 40.35%;
        height: 100%;
        column-gap: 0.25rem;
        > div {
            background-color: #42464a;
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
        .q-list--dark, .q-item--dark {
          border: none;
        }
        .bookmark-item {
          background-color: rgba(#f5faff, 20%);
          padding: 0px 1.25rem;
          &.active {
            background: linear-gradient(to right, rgba(20, 215, 200, 0.5) 0%, rgba(100, 100, 100, 0.15) 100%) !important
          }
          .q-item__section--avatar {
            min-width: 1.5rem;
            padding-right: 4px;

            .q-icon {
              font-size: 1.25rem;
            }
          }
          em {
            font-style: normal;
          }
        }
        .first {
          width: 55%;
          .bookmark-item {
            height: 3.375rem;
          }
        }
        .second {
          width: 44%;
          .bookmark-item {
            height: 3rem;
          }
        }
      }
      .bookmark-table {
        width: 57.8%;
        display: flex;
        flex-direction: column;
        height: 100%;
        .top {
          background-color: #42464a;
          height: 3.75rem;
          padding: 0px 1.25rem;
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
          .q-btn {
            padding: 0.25rem 1rem;
            .on-left {
              margin-right: 0.5rem;
            }
          }
        }
        .main {
          height: calc(100% - 3rem);
          // height: 44.25rem;
          .arti-table-wrap {
            border-radius: 0px;
            height: calc(100% - 3rem);
          }
          .pagination-wrap {
            height: 3rem;
          }
        }
      }
    }
}
</style>