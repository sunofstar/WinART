<route>{ meta: { disallowAuthed: true} }</route>

<template>
  <q-dialog ref="dialogRef" v-model="isOpen" class="" @hide="onDialogHide">
    <q-card class="q-dialog-plugin pop-default report-dialog-wrap">
      <!-- 헤더 -->
      <!-- 20231201 백지연 FE UI 변경 반영-->
      <q-card-section class="d-header">
        <h1>이미지 파일 생성 및 현장조사확인서 생성</h1>
        <q-space></q-space>
        <q-btn v-close-popup icon="close" flat dense></q-btn>
      </q-card-section>
      <!-- 본문 -->
      <q-card-section class="d-container row justify-between">
        <q-form>
          <div class="tbl-wrap">
            <!-- 북마크 -->
            <h3>북마크</h3>
            <div class="row items-center bookmark-chk-wrap">
              <!-- 북마크 전체 체크 -->
              <q-checkbox v-model="checkAll" class="check-all" dense label="전체"></q-checkbox>
              <!-- 북마크 목록 -->
              <q-option-group
                v-model="bookmarkgroup"
                :options="bookmarkoptions"
                dense
                color="primary"
                type="checkbox"
                class="bookmark-chk-group"
              >
                <template #label="opt">
                  <div class="row items-center">
                    <q-icon name="mdi-bookmark" :style="{ color: opt.color }"></q-icon>
                    <span>{{ opt.label }}</span>
                  </div>
                </template>
              </q-option-group>
            </div>
          </div>
          <div class="img-file">
            <h3 class="q-pt-xs q-pb-sm">이미지 파일</h3>
            <table class="tbl-data">
              <colgroup>
                <col width="17.92%" />
                <col />
                <col width="17.92%" />
                <col />
              </colgroup>
              <tbody>
                <tr>
                  <th>파일명</th>
                  <td>
                    <q-input v-model="fileName" dense outlined class="file-name"></q-input>
                  </td>
                  <th>압축형태</th>
                  <td>
                    <q-select v-model="imageFormat" outlined dense :options="imageFormats" class="zip"></q-select>
                  </td>
                </tr>
                <tr>
                  <th>선택폴더</th>
                  <td colspan="3">
                    <div class="d-flex-row">
                      <q-input
                        v-model="folder"
                        class="folder"
                        type="text"
                        maxlength="50"
                        outlined
                        dense
                        readonly
                        clearable
                        clear-icon="mdi-close"
                      ></q-input>
                      <q-btn
                        outline
                        icon="mdi-folder-open-outline"
                        label="폴더 선택"
                        class="btn-folder"
                        color="primary"
                        @click=""
                      ></q-btn>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="report-create">
            <h3>보고서 생성</h3>
            <div class="report-chk-wrap row items-center">
              <strong class="tit">보고서 종류 선택</strong>
              <q-checkbox
                v-model="reportOp1"
                dark
                dense
                label="현장조사 확인서"
                color="primary"
                class="first"
              ></q-checkbox>
              <q-checkbox
                v-model="reportOp2"
                dark
                dense
                label="전자정보의 관련성에 관한 의견진술서"
                color="primary"
              ></q-checkbox>
            </div>
            <table class="tbl-data">
              <colgroup>
                <col width="17.92%" />
                <col />
                <col width="17.92%" />
                <col />
              </colgroup>
              <tbody>
                <tr>
                  <th>사건번호</th>
                  <td>2023형제 1234호</td>
                  <th>영장번호</th>
                  <td>2023영장 001호</td>
                </tr>
                <tr>
                  <th>획득 일시</th>
                  <td>2023.09.01</td>
                  <th>획득 장소</th>
                  <td>가나다연구실</td>
                </tr>
                <tr>
                  <th>압수자 소속청</th>
                  <td>서울북부지방검찰청</td>
                  <th>압수자 소속</th>
                  <td>형사5부</td>
                </tr>
                <tr>
                  <th>압수자</th>
                  <td>홍길동</td>
                  <th>직급</th>
                  <td>수사관</td>
                </tr>
                <tr>
                  <th>피압수자</th>
                  <td>김철수</td>
                  <th>피압수자 소속</th>
                  <td>가나다연구실</td>
                </tr>
                <tr>
                  <th>피압수자 직급</th>
                  <td>실장</td>
                  <th>연락처</th>
                  <td>02-0000-0000</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="row justify-center btn-group">
            <q-btn outline color="info" label="이미지 및 보고서 생성 시작" @click="" />
          </div>
        </q-form>
      </q-card-section>
      <q-card-actions class="d-footer">
        <q-btn outline icon="mdi-close" label="닫기" color="" @click="" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, Ref, computed, ComputedRef } from 'vue'

// 팝업 오픈
const isOpen: Ref<boolean> = ref(true)

//  보고서 생성 - 보고서 종류 선택
const reportOp1 = ref(false)
const reportOp2 = ref(false)

// 북마크 전체 선택
const checkAll = ref(false)

// 북마크 모음
const bookmarkgroup = ref([''])

const bookmarkoptions = [
  {
    label: '기본1 (3)',
    value: 'op1',
    color: '#FF3333'
  },
  {
    label: '기본2 (3)',
    value: 'op2',
    color: '#FF9933'
  },
  {
    label: '기본3 (3)',
    value: 'op3',
    color: '#FFFF33'
  },
  {
    label: '기본4 (3)',
    value: 'op4',
    color: '#33FF33'
  },
  {
    label: '기본5 (3)',
    value: 'op5',
    color: '#3399FF'
  },
  {
    label: '기본6 (3)',
    value: 'op6',
    color: '#3333FF'
  },
  {
    label: '기본7 (3)',
    value: 'op7',
    color: '#9933FF'
  }
]

/**
 * 파일포맷 목록 아이템
 *
 */
interface FileFormatItem {
  label: string
  value: string
}

// 이미지파일정보
const imageFormat: Ref<FileFormatItem> = ref({
  label: 'DEPH',
  value: 'deph'
})

const imageFormats: FileFormatItem[] = [
  {
    label: 'DEPH',
    value: 'deph'
  },
  {
    label: 'AFF4',
    value: 'aff4'
  }
]

// 폴더명
const fileName = ref('Lorem ipsum.file')

// 폴더
const folder = ref(`D:\\CASE_NAME\\`)
</script>

<style scoped lang="scss">
.report-dialog-wrap :deep {
  .d-container {
    padding: 1.25rem !important;

    // 체크박스 사이즈
    .q-checkbox {
      margin: 0px;
      font-size: 1rem;
      .q-checkbox__inner {
        width: 1.125rem;
        height: 1.125rem;
        min-width: 1.125rem;
      }
    }

    // 북마크
    .bookmark-chk-wrap {
      padding: 1.25rem 0.75rem 2.5rem;
      .bookmark-chk-group {
        padding-left: 0px;
        margin-left: 0px;
        > div {
          margin-left: 1.5rem;
        }

        .q-icon {
          width: 1.25rem;
          height: 1.25rem;
          font-size: 1.125rem;
          padding-right: 0.25rem;
        }
      }
    }

    // 보고서 생성
    .report-create {
      .report-chk-wrap {
        padding: 1.25rem 0 1.875rem;
        .tit {
          padding-right: 4.5rem;
          font-size: 1rem;
        }
        .first {
          padding-right: 40px;
        }
      }
    }

    // 테이블 공통
    table.tbl-data {
      font-size: 1rem;
      td {
        background-color: #35383b;
      }
    }

    // 보고서 생성 버튼그룹
    .btn-group {
      padding-top: 1.25rem;
      gap: 0.625rem;
      .q-btn {
        padding: 0.375rem 1.375rem;
      }
    }

    // 이미지 파일
    .img-file {
      .file-name {
        max-width: 25rem;
      }
      .zip {
        max-width: 15.1875rem;
      }
    }
  }
}
</style>
