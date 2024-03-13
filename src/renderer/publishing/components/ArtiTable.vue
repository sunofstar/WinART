<template>
  <div class="main-content">
    <!-- 헤더 -->
    <div class="tit-area h3">
      <h3>
        System information
        <span>({{ titleCount }})</span>
      </h3>
      <div class="cont-group-right">
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
        <q-select v-model="selectedEncoding" outlined dense :options="encodingArr" class="q-mr-sm"></q-select>
        <q-btn outline label="목록저장" icon="mdi-download" class></q-btn>
        <q-btn outline label="프린트" icon="mdi-printer" class="print-btn"></q-btn>
      </div>
    </div>
    <!-- 목록 테이블 -->
    <div class="content-area">
      <div class="arti-table-wrap">
        <table class="table-list">
          <colgroup>
              <col width="3%" />
              <col width="12%" />
              <col width="8%" />
              <col width="20%" />
              <col width="20%" />
              <col width="20%" />
          </colgroup>
          <thead>
            <tr>
              <th>
                <Icon icon="material-symbols:bookmark-outline" color="#f42f2b" />
              </th>
              <th>OS버전</th>
              <th>빌드번호</th>
              <th>최초설치</th>
              <th>등록된 사용자</th>
              <th>시리얼 넘버</th>
            </tr>
          </thead>
          <tbody class="tbl-content">
            <tr class="active">
              <td><Icon icon="material-symbols:bookmark-outline" color="#f42f2b" /></td>
              <td>Window 10</td>
              <td>19.1.1</td>
              <td>2023-09-01 12:00:00</td>
              <td>LEE</td>
              <td>1234-455-678</td>
            </tr>
            <tr>
              <td><Icon icon="material-symbols:bookmark-outline" color="#f42f2b" /></td>
              <td>Window 10</td>
              <td>19.1.1</td>
              <td>2023-09-01 12:00:00</td>
              <td>LEE</td>
              <td>1234-455-678</td>
            </tr>
            <tr>
              <td><Icon icon="material-symbols:bookmark-outline" color="#f42f2b" /></td>
              <td>Window 10</td>
              <td>19.1.1</td>
              <td>2023-09-01 12:00:00</td>
              <td>LEE</td>
              <td>1234-455-678</td>
            </tr>
            <tr>
              <td><Icon icon="material-symbols:bookmark-outline" color="#f42f2b" /></td>
              <td>Window 10</td>
              <td>19.1.1</td>
              <td>2023-09-01 12:00:00</td>
              <td>LEE</td>
              <td>1234-455-678</td>
            </tr>
            <tr>
              <td><Icon icon="material-symbols:bookmark-outline" color="#f42f2b" /></td>
              <td>Window 10</td>
              <td>19.1.1</td>
              <td>2023-09-01 12:00:00</td>
              <td>LEE</td>
              <td>1234-455-678</td>
            </tr>
            <tr>
              <td><Icon icon="material-symbols:bookmark-outline" color="#f42f2b" /></td>
              <td>Window 10</td>
              <td>19.1.1</td>
              <td>2023-09-01 12:00:00</td>
              <td>LEE</td>
              <td>1234-455-678</td>
            </tr>
            <tr>
              <td><Icon icon="material-symbols:bookmark-outline" color="#f42f2b" /></td>
              <td>Window 10</td>
              <td>19.1.1</td>
              <td>2023-09-01 12:00:00</td>
              <td>LEE</td>
              <td>1234-455-678</td>
            </tr>
            <tr>
              <td><Icon icon="material-symbols:bookmark-outline" color="#f42f2b" /></td>
              <td>Window 10</td>
              <td>19.1.1</td>
              <td>2023-09-01 12:00:00</td>
              <td>LEE</td>
              <td>1234-455-678</td>
            </tr>
            <tr>
              <td><Icon icon="material-symbols:bookmark-outline" color="#f42f2b" /></td>
              <td>Window 10</td>
              <td>19.1.1</td>
              <td>2023-09-01 12:00:00</td>
              <td>LEE</td>
              <td>1234-455-678</td>
            </tr>
            <tr>
              <td><Icon icon="material-symbols:bookmark-outline" color="#f42f2b" /></td>
              <td>Window 10</td>
              <td>19.1.1</td>
              <td>2023-09-01 12:00:00</td>
              <td>LEE</td>
              <td>1234-455-678</td>
            </tr>
            <tr>
              <td><Icon icon="material-symbols:bookmark-outline" color="#f42f2b" /></td>
              <td>Window 10</td>
              <td>19.1.1</td>
              <td>2023-09-01 12:00:00</td>
              <td>LEE</td>
              <td>1234-455-678</td>
            </tr>
            <tr>
              <td><Icon icon="material-symbols:bookmark-outline" color="#f42f2b" /></td>
              <td>Window 10</td>
              <td>19.1.1</td>
              <td>2023-09-01 12:00:00</td>
              <td>LEE</td>
              <td>1234-455-678</td>
            </tr>
            <tr>
              <td><Icon icon="material-symbols:bookmark-outline" color="#f42f2b" /></td>
              <td>Window 10</td>
              <td>19.1.1</td>
              <td>2023-09-01 12:00:00</td>
              <td>LEE</td>
              <td>1234-455-678</td>
            </tr>
            <tr>
              <td><Icon icon="material-symbols:bookmark-outline" color="#f42f2b" /></td>
              <td>Window 10</td>
              <td>19.1.1</td>
              <td>2023-09-01 12:00:00</td>
              <td>LEE</td>
              <td>1234-455-678</td>
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
      <!-- 상세보기화면 -->
      <!-- detail-btn을 누르면 상세보기화면이 아코디언 형식으로 접혀야합니다.... -->
      <div v-show="modal" class="detail-view-wrap">
        <div class="detail-btn-wrap">
          <q-btn
          flat
          :icon="detail ? 'keyboard_arrow_right' : 'keyboard_arrow_left'"
          class="detail-btn"
          @click="detail = !detail"
          ></q-btn>
        </div>
        <table class="text-md-3" v-show="detail">
          <colgroup>
            <col width="32%" />
            <col width="68%" />
          </colgroup>
          <caption class="text-md-1 bold">세부정보</caption>
          <tbody>
            <tr class="first">
              <td>OS version</td>
              <td>Window 10</td>
            </tr>
            <tr>
              <td>Build</td>
              <td>19.1.1</td>
            </tr>
            <tr>
              <td>OS version</td>
              <td>2023-07-01 15:00:01</td>
            </tr>
            <tr>
              <td>OS version</td>
              <td>23455</td>
            </tr>
            <tr>
              <td>serial</td>
              <td>1234-455-455-678</td>
            </tr>
            <tr>
              <td>lorem</td>
              <td>Window 10</td>
            </tr>
            <tr>
              <td>lorem</td>
              <td>
                Lorem ipsum, dolor sit amet consectetur adipisicing elit.  quae obcaecati eius!
                Lorem ipsum, dolor sit amet consectetur adipisicing elit.  quae obcaecati eius!
              </td>
            </tr>
            <tr>
              <td>OS version</td>
              <td>Window 10</td>
            </tr>
            <tr>
              <td>Build</td>
              <td>19.1.1</td>
            </tr>
            <tr>
              <td>OS version</td>
              <td>2023-07-01 15:00:01</td>
            </tr>
            <tr>
              <td>OS version</td>
              <td>23455</td>
            </tr>
            <tr>
              <td>serial</td>
              <td>1234-455-455-678</td>
            </tr>
            <tr>
              <td>OS version</td>
              <td>Lorem ipsum Lorem ipsum Lorem ipsum Lorem ipsum Lorem ipsum</td>
            </tr>
            <tr>
              <td>lorem</td>
              <td>
                Lorem ipsum, dolor sit amet consectetur adipisicing elit.  quae obcaecati eius!
                Lorem ipsum, dolor sit amet consectetur adipisicing elit.  quae obcaecati eius!
              </td>
            </tr>
            <tr>
              <td>lorem</td>
              <td>
                Lorem ipsum, dolor sit amet consectetur adipisicing elit.  quae obcaecati eius!
                Lorem ipsum, dolor sit amet consectetur adipisicing elit.  quae obcaecati eius!
              </td>
            </tr>
            <tr>
              <td>lorem</td>
              <td>
                Lorem ipsum, dolor sit amet consectetur adipisicing elit.  quae obcaecati eius!
                Lorem ipsum, dolor sit amet consectetur adipisicing elit.  quae obcaecati eius!
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { ref, Ref } from 'vue'

const modal = ref(true)
const detail = ref(true)


const current = ref(3)
const titleCount = ref(123)


// utf-8 셀렉트
const encodingArr = [
  {
    label: 'UTF-8',
    value: 'utf8'
  },
  {
    label: 'EUC-KR',
    value: 'euckr'
  },
  {
    label: 'CP949',
    value: 'cp949'
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

// 선택 인코딩
const selectedEncoding: Ref<EncodingItem> = ref({
  label: 'UTF-8',
  value: 'utf8'
})

// 페이지당 조회 건수
const rowsPerPageArr: number[] = [100, 200, 300, 400, 500]
const rowsPerPage: Ref<number> = ref(100)


</script>

<style scoped lang="scss">
.main-content {
  width: calc(100% - 25rem);

    /* Content title */
  .tit-area {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    height: 3.25rem;
    padding: 0.75rem 1.25rem;
    margin: 0;
    border-bottom-width: 1px;
    border-bottom-style: solid;
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
      .print-btn {
        margin-left: 0.5rem;
      }
      button {
        height: 2.25rem;
      }
    }


    // 목록 테이블
  .content-area {
    height: calc(100% - 3.125rem);
    padding: 1.25rem 1.875rem 0rem 1.375rem;
    position: relative;
  }
 

  // 상세보기
  .detail-view-wrap :deep {
    position: absolute;
    right: 0;
    top: 1.25rem;
    background-color: #101214;
    z-index: 100;
    height: calc(100% - 3.75rem);
    overflow-y: auto;
    display: flex;
    border: 1px solid #42464a;
    border-radius: 0px 4px 0px 0px;
    table {
      width: 33.625rem;
      overflow-y: scroll;
      height: fit-content;
      border-radius: 2px;
      caption {
        padding: 0.625rem 0px 0.625rem 2.375rem;
        text-align: left;
        background-color: #1e2022;
      }
      tbody {
        tr.first {
          ::before {
            display: inline-block;
            content: "";
            width: 100%;
            height: 1rem;
          }
        }
        td {
          background-color: #101214;
          padding: 12px 10px 12px 20px;
          &:first-child {
            color: rgba(255, 255, 255, 0.6);
            font-weight: 700;
            text-align: right;
          }
          &:last-child {
            padding-right: 3.75rem;
          }
        }
      }
    }
    // 상세보기 버튼
    .detail-btn-wrap {
      width: 22px;
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
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
        }
      }
    }
  }
}
</style>
