<route>{ meta: { disallowAuthed: true} }</route>

<template>
  <div class="user-wrap">
    <user-item />
    <div>
      <q-btn flat class="" @click="chageTheme">
        <Icon icon="ic:outline-brightness-4" class="on-left" />
        테마변경
      </q-btn>
      <q-btn flat icon="mdi-logout" @click="logoutClick">로그아웃</q-btn>
    </div>
  </div>
  <div class="case-wrap case-import">
    <div class="top">
      <ul class="process">
        <li class="row items-center process-item">
          <span class="circle">1</span>
        </li>
        <li class="row process-item items-center">
          <span :class="{ active: isActive }" class="circle">2</span>
          <span>분석 대상 이미지 불러오기</span>
        </li>
      </ul>
    </div>
    <div class="container">
      <div class="main">
        <div class="row">
          <q-btn class="">
            <img src="@renderer/assets/images/ico_import_evidence.svg" />
            <span class="title">선택한 증거이미지 불러오기</span>
          </q-btn>
          <div class="tree-wrap">
            <table class="hash-table">
              <caption>원본 해시값</caption>
              <colgroup>
                <col width="8.51%" />
                <col width="*" />
              </colgroup>
              <tr>
                <th>MDS</th>
                <td>098F6BCD4621D373CADE4E832627B4F6</td>
              </tr>
              <tr>
                <th>SHA1</th>
                <td>A94A8FE5CCB19BA61C4C0873D391E987982FBBD3</td>
              </tr>
            </table>
            <!-- 1121 해시값 검증(HashCalDialog)을 위한 버튼 추가 -->
            <div class="d-tbl-wrap">
              <div class="mid_btns_area">
                <div class="d-flex-row btns_center">
                  <q-btn outline color="info" label="해시값 검증" @click="" />
                </div>
              </div>
            </div>
            <table class="hash-table">
              <caption>검증 해시값</caption>
              <colgroup>
                <col width="8.51%" />
                <col width="*" />
              </colgroup>
              <tr>
                <th>MDS</th>
                <td>098F6BCD4621D373CADE4E832627B4F6</td>
              </tr>
              <tr>
                <th>SHA1</th>
                <td>A94A8FE5CCB19BA61C4C0873D391E987982FBBD3</td>
              </tr>
            </table>
            <div class="desc box">
              <p class="text-info">해시값이 일치합니다.</p>
            </div>
            <!-- <q-tree :nodes="customize" node-key="label" no-connectors>
              <template #header-count="prop">
                <div class="row count items-center justify-between col-12">
                  <div class="row items-center">
                    <Icon :icon="prop.node.icon" color="white" class="q-pr-sm" />
                    <span class="label">{{ prop.node.label }}</span>
                    <span class="count">({{ prop.node.count }})</span>
                  </div>
                  <span class="date">{{ prop.node.date }}</span>
                </div>
              </template>
              <template #header-no-count="prop">
                <div class="row no-count items-center justify-between col-12">
                  <div class="row items-center">
                    <Icon :icon="prop.node.icon" color="white" class="q-pr-sm" />
                    <span class="label">{{ prop.node.label }}</span>
                  </div>
                  <span class="date">{{ prop.node.date }}</span>
                </div>
              </template>
            </q-tree> -->
          </div>
        </div>
        <div class="d-tbl-wrap">
          <table class="img-table">
            <caption>선택 증거이미지</caption>
            <q-input v-model="selectImgPath" outlined type="text" dense disable></q-input>
          </table>
        </div>
      </div>
      <footer class="footer-default">
        <q-card-actions class="no-padding">
          <q-btn outline icon="mdi-chevron-left" label="이전" @click=""></q-btn>
          <q-space></q-space>
          <!-- 비활성화 버튼 -->
          <!-- <q-btn outline icon-right="mdi-chevron-right" disable label="다음" color="primary"></q-btn> -->
          <!-- 비활성화 버튼 -->
          <q-btn outline icon-right="mdi-chevron-right" label="다음" color="primary" @click=""></q-btn>
        </q-card-actions>
      </footer>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { Icon } from '@iconify/vue'
import UserItem from '@renderer/publishing/components/common/header/MenuBarUserItem.vue'

const isActive = ref(true)
const selectImgPath = ref('서울북부지방검찰청')

const customize = ref([
  {
    label: 'Lorem ipsum',
    header: 'no-count',
    icon: 'material-symbols:folder-open',
    date: '2023-09-01 12:00:00',
    children: [
      {
        label: 'Lorem ipsum2',
        icon: 'ic:baseline-folder-open',
        header: 'count',
        count: '3',
        date: '2023-09-01 12:00:00',
        children: [
          {
            header: 'no-count',
            label: 'Lorem ipsum.zip',
            icon: 'mdi-folder-zip-outline',
            date: '2023-09-01 12:00:00'
          }
        ]
      },
      {
        label: 'Lorem ipsum2',
        icon: 'material-symbols:folder-open',
        header: 'count',
        count: '50',
        date: '2023-09-01 12:00:00',
        children: [
          {
            header: 'no-count',
            label: 'Lorem ipsum.zip',
            icon: 'mdi-folder-zip-outline',
            date: '2023-09-01 12:00:00'
          },
          {
            header: 'no-count',
            label: 'Lorem ipsum.pdf',
            icon: 'heroicons:document-20-solid',
            date: '2023-09-01 12:00:00'
          }
        ]
      }
    ]
  }
])
</script>

<style lang="scss" scoped>
.user-wrap {
  display: flex;
  justify-content: end;
  align-items: center;
  padding-top: 0px;
  height: 3.1875rem;
  .q-btn :deep {
    font-size: 0.875rem;
    &:last-child::after {
      display: none;
    }
    &::after {
      content: '';
      display: inline-block;
      width: 1px;
      height: 0.75rem;
      background-color: rgba(255, 255, 255, 30%);
      position: absolute;
      right: 0;
      top: calc(50% - 6px);
    }
  }
  .q-btn :deep(.q-icon) {
    margin-right: 0.375rem;
  }
}

.case-wrap ::v-deep {
  height: calc(100% - 3.1875rem);
  width: 100%;
  > .top {
    width: 100%;
    margin: 0 auto;
    border: 1px solid #0a141e;
    height: 3.75rem;
    .process {
      display: flex;
      justify-content: center;
      align-items: center;
      list-style: none;
      padding: 0;
      &-item {
        span:last-child {
          font-weight: 700;
        }
        &:first-child::after {
          display: inline-block;
          content: '';
          width: 8px;
          height: 1px;
          background-color: #54585c;
          margin: 0 12px;
        }
        .circle {
          display: flex;
          justify-content: center;
          align-items: center;
          border-radius: 50%;
          width: 1.75rem;
          height: 1.75rem;
          background-color: #999999;
          font-size: 0.9375rem;
          font-weight: 700;
        }
        .circle.active {
          background-color: #45c9ff;
          margin-right: 0.5rem;
        }
      }
    }
  }
  .container {
    height: calc(100% - 3.75rem);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    background-color: rgba(#f5faff, 10%);
    .main {
      overflow-y: none;
      padding: 0px 1.25rem 0px 1.25rem;
      > div {
        display: flex;
        justify-content: space-between;
        gap: 1.875rem;
        padding-top: 1.25rem;
        .q-btn {
          width: 26.6%;
          height: 20.5rem;
          box-shadow: 0px 2px 12px rgba(0, 0, 0, 50%);
          background-color: rgba(#fff, 7%);
          &__content {
            display: flex;
            flex-direction: column;
          }
          img {
            max-width: 6.25rem;
          }
          .title {
            font-size: 1.25rem;
            font-weight: 700;
            padding-top: 2.625rem;
          }
        }
        .tree-wrap {
          height: 18.5rem;
          flex-grow: 1;
          position: relative;
          // &::after {
          //   display: inline-block;
          //   content: '';
          //   position: absolute;
          //   top: 0;
          //   right: 190px;
          //   width: 1px;
          //   height: 100%;
          //   background-color: rgba(#f5faff, 20%);
          // }
          .caption {
            background-color: rgba(#f5faff, 20%);
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: space-between;
            height: 2.5rem;
            border-radius: 4px 4px 0 0;
            font-size: 0.9375rem;
            > span {
              display: block;
              text-align: center;
              &.name-tit {
                flex-grow: 1;
              }
              &.date-tit {
                width: 11.875rem;
              }
            }
          }
          .hash-table {
            table-layout: auto;
            padding-top: 2.5rem;
            border: 1px solid rgba(245, 250, 255, 0.2);
            caption {
              color: #14d7c8;
              font-size: 1.25rem;
              font-weight: 400;
              padding-bottom: 0.75rem;
            }
            tr th {
              padding-left: 0.75rem;
              background-color: #54585c;
              text-align: left;
            }
            tr {
              height: 2.5rem;
              border-bottom: 1px solid rgba(245, 250, 255, 0.2);
            }
            tr td {
              padding-left: 0.625rem;
              background-color: #35383b;
            }
          }

          .img-table {
            width: 26.6%;
            border: none;
            tr {
              height: 2.5rem;
              border-bottom: 1px solid rgba(245, 250, 255, 0.2);
            }
          }
          // .q-tree {
          //   background-color: #101214;
          //   height: calc(100% - 2.5rem);
          //   overflow-y: auto;
          //   font-size: 1rem;
          //   .iconify {
          //     width: 1.5rem;
          //     height: 1.5rem;
          //   }
          //   .date {
          //     font-size: 0.9375rem;
          //     padding-right: 1.875rem;
          //   }
          //   .count {
          //     padding-left: 4px;
          //   }
          // }
        }
      }
      .d-tbl-wrap {
        padding-top: 2.5rem;
        caption {
          padding-bottom: 0.75rem;
        }
        .d-flex-row.btns_center {
          display: block;
          text-align: center;
        }
        .d-flex-row.btns_center button {
          width: auto;
          height: 2.25rem;
          padding: 0 1.375rem;
          box-shadow: none;
        }
      }
    }
  }
}
</style>
