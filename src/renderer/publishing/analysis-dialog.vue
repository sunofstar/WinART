<route>{ meta: { disallowAuthed: true} }</route>

<template>
  <q-dialog ref="dialogRef" v-model="isOpen" @hide="onDialogHide">
    <q-card class="q-dialog-plugin pop-default analysis-dialog-wrap">
      <q-card-section class="d-header">
        <h1>분석개요</h1>
        <q-space></q-space>
        <q-btn v-close-popup icon="close" flat dense></q-btn>
      </q-card-section>
      <q-card-section class="d-container">
        <h2>획득정보</h2>
        <table class="tbl-data q-pb-md">
          <caption>- 시스템 정보</caption>
          <colgroup>
            <col width="12.6%" />
            <col width="*" />
            <col width="12.6%" />
            <col width="*" />
          </colgroup>
          <tbody>
            <tr class="">
              <th>OS 버전</th>
              <td>1.0</td>
              <th>OS 설치 날짜</th>
              <td>2023.09.01 12:00:00</td>
            </tr>
            <tr>
              <th>Time Zone</th>
              <td>Asia/Seoul</td>
              <th>현재 사용자</th>
              <td>홍길동</td>
            </tr>
          </tbody>
        </table>
        <table class="tbl-data">
          <caption>- 저장장치 정보</caption>
          <colgroup>
            <col width="*" />
            <col width="*" />
            <col width="*" />
            <col width="*" />
          </colgroup>
          <tbody class="text-center">
            <tr>
              <th>드라이브 명</th>
              <th>총 용량</th>
              <th>남은 용량</th>
              <th>비고</th>
            </tr>
            <tr>
              <td>C:</td>
              <td>256 GB</td>
              <td>138.32 GB</td>
              <td>Lorem ipsum</td>
            </tr>
            <tr>
              <td>D:</td>
              <td>4.99 GB</td>
              <td>4.99 GB</td>
              <td></td>
            </tr>
            <tr>
              <td>외부 장치</td>
              <td>없음</td>
              <td></td>
              <td></td>
            </tr>
          </tbody>
        </table>
        <table class="tbl-data">
          <caption>- Artifacts 분석 정보</caption>
          <colgroup>
            <col width="*" />
            <col width="*" />
            <col width="*" />
            <col width="*" />
            <col width="*" />
            <col width="*" />
            <col width="*" />
            <col width="*" />
          </colgroup>
          <tbody class="text-center">
            <tr>
              <th>EventLog</th>
              <td>20</td>
              <th>FileDeletion</th>
              <td>20</td>
              <th>BrowsingHistory</th>
              <td>89</td>
              <th>FileFolderAccess</th>
              <td>97</td>
            </tr>
            <tr>
              <th>ProgramExecution</th>
              <td>50</td>
              <th>FileSystem</th>
              <td>67</td>
              <th>registry</th>
              <td>22</td>
              <th>SRUMDatabase</th>
              <td>0</td>
            </tr>
          </tbody>
        </table>
      </q-card-section>
      <q-card-actions class="d-footer">
        <q-btn outline icon="mdi-close" label="닫기" @click="okClick" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, ComputedRef, Ref, ref } from 'vue'

// 사용자 다이얼로그 오픈 여부
const isOpen: Ref<boolean> = ref(true)
</script>

<style scoped lang="scss">
table.tbl-data tbody tr th {
  text-align: center;
}
</style>
